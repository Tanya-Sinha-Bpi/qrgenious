import jwt from 'jsonwebtoken';
import User from "../Models/UserModel.js";
import sendMail from "../Services/Mailer.js";
import { apiResponse, errors, generateSecureOtp, getClientIP, tokenGenerator } from "../Utils/apiHelpers.js";
import { createDeviceFingerprint } from "../Utils/madeDeviceID.js";

// Custom User Register
export const customRegister = async function (req, res, next) {
    try {
        const { email, password } = req.body;
        const deviceFingerprint = createDeviceFingerprint(req);
        //INPUT VALIDATION
        if (!email || !password) {
            return errors.badRequest(res, 'Email and Password Both Field is Required');
        }

        // validate password Strength
        if (password.length < 6) {
            return errors.badRequest(res, 'Password length Must be atleast 6 Character');
        }

        // Find User
        const user = await User.findOne({ email });
        if (user) {
            if (user.isVerified) {
                return errors.conflict(res, 'Email already Registered! Please Login!!!')
            }
            const newOTP = generateSecureOtp();
            // Send Otp for verify email for existing user
            try {
                await Promise.race([
                    sendMail({
                        to: user.email,
                        subject: "OTP Sent for Verification",
                        html: `Your Email Verification OTP is ${newOTP} (valid for 10 minutes)`
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Email timeout')), 5000)
                    )
                ]);
                console.log('DEBUG : Email sent Successfully');
            } catch (error) {
                console.error('[EMAIL_ERROR]', error.message);
                return errors.serverError(res, "Failed to send email ");
            }
            user.password = password;
            user.otp = newOTP;
            user.otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);
            user.updatedAt = new Date();
            await user.save({ isModified: true });

            const isKnownDevice = user.knownDevices.some(d => d.deviceId === deviceFingerprint);

            if (!isKnownDevice) {
                await user.addKnownDevice({
                    deviceId: deviceFingerprint,
                    userAgent: req.headers['user-agent'],
                    ipAddress: getClientIP(req)
                });
            }

            return apiResponse(res, 201, 'Registration successful', {
                email,
                userId: user._id
            });
        }
        // New user case
        const newOTP = generateSecureOtp();
        const newUser = new User({
            email,
            password,
            otp: newOTP,
            otpExpiryTime: new Date(Date.now() + 10 * 60 * 1000),
            registeredViaGoogle: false,
            createdAt: new Date()
        });
        // Secure email sending with timeout
        try {
            await Promise.race([
                sendMail({
                    to: newUser.email,
                    subject: "OTP Verification",
                    html: `Your verification code is ${newOTP} (valid for 10 minutes)`
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Email timeout')), 8000)
                )
            ]);
        } catch (error) {
            console.error('[EMAIL_ERROR]', error.message);
            return errors.serverError(res, "Failed to send verification email");
        }

        const isKnownDevice = newUser.knownDevices.some(d => d.deviceId === deviceFingerprint);

        if (!isKnownDevice) {
            await newUser.addKnownDevice({
                deviceId: deviceFingerprint,
                userAgent: req.headers['user-agent'],
                ipAddress: getClientIP(req)
            });
        }


        await newUser.save({ new: true });
        return apiResponse(res, 201, 'Registration successful', {
            email,
            userId: newUser._id
        });
    } catch (error) {
        if (error.name === 'MongoError' && error.code === 11000) {
            return errors.conflict(res, 'Email already exists');
        }

        if (error.name === 'ValidationError') {
            return errors.unprocessable(res, 'Validation failed' + error.message, error.message);
        }

        console.error('[REGISTER_ERROR]', error);
        return errors.serverError(res, process.env.NODE_ENV === 'development' ? error : error.message);
    }
}

// Verify Email
export const verifyEmail = async function (req, res, next) {
    try {
        const { email, otp } = req.body;
        console.log("Controller Body of Verify Email", req.body);

        //INPUT VALIDATION
        if (!email || !otp) {
            return errors.badRequest(res, 'Email and OTP Both Field is Required');
        }

        // validate password Strength
        if (otp.length < 6) {
            return errors.badRequest(res, 'OTP length Must be atleast 6 Character');
        }

        // Find User
        const user = await User.findOne({ email });

        if (!user) {
            return errors.notFound(res, "Invalid Credentials") // No need to expose user details
        }

        if (!user.otp) {
            return errors.badRequest(res, 'OTP has already been used or expired');
        }

        if (user.isOtpExpired()) { // Note: this is synchronous, no need for await
            return errors.badRequest(res, 'OTP is expired! Please resend then verify');
        }

        // Check OTP correctness
        const otpValid = await user.correctOtp(otp.toString());
        if (!otpValid) {
            return errors.badRequest(res, 'Invalid OTP');
        }

        user.verifiedAt = new Date();
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiryTime = undefined;

        const deviceFingerprint = createDeviceFingerprint(req);
        const isKnownDevice = user.knownDevices.some(d => d.deviceId === deviceFingerprint);

        if (!isKnownDevice) {
            await user.addKnownDevice({
                deviceId: deviceFingerprint,
                userAgent: req.headers['user-agent'],
                ipAddress: getClientIP(req)
            });
        }

        const newToken = tokenGenerator(user._id)

        // Set secure cookie
        res.cookie('auth_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // More secure than 'lax'
            maxAge: 24 * 60 * 60 * 1000,
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined
        });

        await user.save();

        return apiResponse(res, 201, 'Email Verified successfully', {
            token: newToken,
            user: {
                name: user.googleName || 'N/A',
                email: user.email,
                userId: user._id
            }
        });

        //
    } catch (error) {

        if (error.name === 'ValidationError') {
            return errors.unprocessable(res, 'Validation failed', error.errors);
        }

        console.error('[VERIFY_EMAIL_ERROR]', error.message);
        return errors.serverError(res, process.env.NODE_ENV === 'development' ? error.message : error.message);
    }
}

// Resend Email when need
export const resendOTP = async function (req, res, next) {
    try {
        const { email } = req.body;

        //INPUT VALIDATION
        if (!email) {
            return errors.badRequest(res, 'Email is Required');
        }

        // Finding
        const user = await User.findOne({ email });

        if (!user) {
            return errors.notFound(res, "Invalid Credentials");
        }

        const newOTP = generateSecureOtp();

        try {
            await Promise.race([
                sendMail({
                    to: user.email,
                    subject: "OTP Sent for Verification",
                    html: `Your new verification code is <b>${newOTP}</b>. It is valid for 10 minutes.`,
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Email timeout')), 8000)
                )
            ]);
            console.log('DEBUG : Email sent Successfully');
        } catch (error) {
            console.error('[EMAIL_ERROR]', error.message);
            return errors.serverError(res, "Failed to send email ");
        }

        user.otp = newOTP;
        user.otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);
        user.updatedAt = new Date();
        await user.save({ isModified: true });

        return apiResponse(res, 201, 'OTP Resent successfully on Your Registered Email', {
            email,
            userId: user._id
        });
    } catch (error) {

        if (error.name === 'ValidationError') {
            return error.unprocessable(res, 'Validation failed', error.errors);
        }

        console.error('[REGISTER_ERROR]', error);
        return errors.serverError(res, process.env.NODE_ENV === 'development' ? error : error.message);
    }
}

//Send OTP for Password reset
export const sendPassowrdResetRequest = async function (req, res, next) {
    try {
        const { email } = req.body;

        //INPUT VALIDATION
        if (!email) {
            return errors.badRequest(res, 'Email is Required');
        }

        // Finding
        const user = await User.findOne({ email });

        if (!user) {
            return errors.notFound(res, "Invalid Credentials");
        }

        const newOTP = generateSecureOtp();

        try {
            await Promise.race([
                sendMail({
                    to: user.email,
                    subject: "OTP Sent for Verification",
                    html: `OTP for Password Reset code is <b>${newOTP}</b>. It is valid for 10 minutes.`,
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Email timeout')), 8000)
                )
            ]);
            console.log('DEBUG : Email sent Successfully');
        } catch (error) {
            console.error('[EMAIL_ERROR]', error.message);
            return errors.serverError(res, "Failed to send email ");
        }

        user.otp = newOTP;
        user.otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);
        user.updatedAt = new Date();
        await user.save({ isModified: true });

        return apiResponse(res, 201, 'OTP Resent successfully on Your Registered Email', {
            email,
            userId: user._id
        });
    } catch (error) {

        if (error.name === 'ValidationError') {
            return error.unprocessable(res, 'Validation failed', error.errors);
        }

        console.error('[FORGOT_PASSWORD_ERROR]', error);
        return errors.serverError(res, process.env.NODE_ENV === 'development' ? error.message : error.message);
    }
}

// Reset Passowrd new Passord
export const resetPassword = async function (req, res, next) {
    try {
        const { email, otp, newPassword } = req.body;

        //INPUT VALIDATION
        if (!email || !otp || !newPassword) {
            return errors.badRequest(res, "All Field is required");
        }

        if (newPassword.length < 6) {
            return errors.badRequest(res, "New password must be at least 6 characters.");
        }

        // Find User
        const user = await User.findOne({ email });

        if (!user) {
            return errors.notFound(res, "Invalid Credentials");
        }
        // OTP expired?
        if (user.isOtpExpired()) {
            return errors.badRequest(res, 'OTP has expired. Please request a new one.');
        }

        // Validate OTP
        const otpValid = await user.correctOtp(otp.toString());
        if (!otpValid) {
            return errors.badRequest(res, 'Invalid OTP.');
        }

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpiryTime = undefined;
        user.updatedAt = new Date();

        const deviceFingerprint = createDeviceFingerprint(req);
        const isKnownDevice = user.knownDevices.some(d => d.deviceId === deviceFingerprint);

        if (!isKnownDevice) {
            await user.addKnownDevice({
                deviceId: deviceFingerprint,
                userAgent: req.headers['user-agent'],
                ipAddress: getClientIP(req)
            });
        }
        // Save user
        await user.save();

        const lastDevice = user.knownDevices[user.knownDevices.length - 1];
        try {
            await Promise.race([
                sendMail({
                    to: user.email,
                    subject: `Your password was reset from IP: ${lastDevice?.ipAddress || 'Unknown'}`,
                    html: `If this action was not done by you, please contact our support team immediately.`,
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Email timeout')), 8000)
                )
            ]);
            console.log('DEBUG : Email sent Successfully');
        } catch (error) {
            console.error('[EMAIL_ERROR]', error.message);
            return errors.serverError(res, "Failed to send email ");
        }

        await user.save();

        return apiResponse(res, 200, 'Password reset successfully', {
            email,
            userId: user._id
        });

    } catch (error) {

        if (error.name === 'ValidationError') {
            return errors.unprocessable(res, 'Validation failed', error.errors);
        }

        console.error('[RESET_PASSWORD_ERROR]', error);
        return errors.serverError(res, process.env.NODE_ENV === 'development' ? error.message : error.message);
    }
}

// Login User
export const customLogin = async function (req, res, next) {
    try {
        const { email, password } = req.body;
        console.log("Body data in controlloer", req.body)        //INPUT VALIDATION
        if (!email || !password) {
            return errors.badRequest(res, 'Email and Password Both Field is Required');
        }

        // validate password Strength
        if (password.length < 6) {
            return errors.badRequest(res, 'Password length Must be atleast 6 Character');
        }

        // Find User
        const user = await User.findOne({ email });

        if (!user) {
            return errors.notFound(res, "Invalid Credentials") // No need to expose user details
        }

        const isCorrectPassword = await user.correctPassword(password);

        if (!isCorrectPassword) {
            return errors.badRequest(res, 'Passowrd is incorrect!!!')
        }
        const deviceFingerprint = createDeviceFingerprint(req);
        const isKnownDevice = user.knownDevices.some(d => d.deviceId === deviceFingerprint);
        if (!isKnownDevice) {
            await user.addKnownDevice({
                deviceId: deviceFingerprint,
                userAgent: req.headers['user-agent'],
                ipAddress: getClientIP(req)
            });
        }
        // Check verification status
        if (!user.isVerified) {
            return errors.forbidden(res, 'Please verify your email before logging in');
        }
        // Toekn
        const newToken = tokenGenerator(user._id)
        // Set secure cookie
        res.cookie('auth_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // More secure than 'lax'
            maxAge: 24 * 60 * 60 * 1000,
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined
        });
        await user.save();
        return apiResponse(res, 200, 'Login successful', {
            token: newToken,
            user: {
                userId: user._id,
                email: user.email,
                isGAuthRegistered: user.registeredViaGoogle,
                createdAt: user.createdAt,
                verifiedAt: user.verifiedAt,
                isVerified: user.isVerified,
            }

        });
    } catch (error) {
        // Specific error handling
        if (error.name === 'MongoError') {
            console.error('[LOGIN_DB_ERROR]', error);
            return errors.serverError(res, 'Database error during login');
        }

        if (error.name === 'ValidationError') {
            return errors.unprocessable(res, 'Validation failed', error.errors);
        }

        console.error('[LOGIN_ERROR]', error);
        return errors.serverError(res, process.env.NODE_ENV === 'development' ? error : error.message);
    }
}

//User Logout
export const logoutUser = async (req, res) => {
    try {
        const token = req.cookies?.auth_token ||
            req.headers.authorization?.replace('Bearer ', '');

        res.clearCookie('auth_token');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Protect User
export const protect = async (req, res, next) => {
    try {
        let token;

        // Get token from cookie or header
        if (req.cookies.auth_token) {
            token = req.cookies.auth_token;
        } else if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log('[DECODED_TOKEN]', decoded);
        // Check token version if using versioning
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Token invalid' });
        }

        req.user = user;
        req.userId = decoded.userId;
        req.token = token;
        // console.log(`In Protect Middleware Log Details User:${user}, UserId:${decoded.userId}`)
        next();
    } catch (error) {
        console.error('[AUTH_MIDDLEWARE_ERROR]', error.message);
        return res.status(401).json({ message: 'Not authorized' });
    }
};

// Login or Signup with GoogleAuth
export const signORsignupViaGoogle = async (req, res, next) => {
    try {
        const { credential } = req.body;
        // Verify token with timeout
        const ticket = await Promise.race([
            client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
                clockTolerance: 10
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Google auth timeout')), 5000)
            )
        ]);

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        let user = await User.findOne({ email });

        if (user) {
            // If user exists but not with Google
            if (!user.registeredViaGoogle) {
                return errors.badRequest(res, 'Email already registered with password');
            }

            // If user exists with Google, update their info
            user.googleId = googleId;
            user.googleName = name;
            user.lastLogin = new Date();


        } else {
            // New User Creation
            user = new User({
                email,
                googleId,
                googleName: name,
                isVerified: true,
                registeredViaGoogle: true,
                createdAt: new Date(),
                lastLogin: new Date()

            });

        }
        await user.save();
        const deviceFingerprint = createDeviceFingerprint(req);

        const isKnownDevice = user.knownDevices.some(d => d.deviceId === deviceFingerprint);

        if (!isKnownDevice) {
            await user.addKnownDevice({
                deviceId: deviceFingerprint,
                userAgent: req.headers['user-agent'],
                ipAddress: getClientIP(req)
            });
        }

        // Token Generation
        const token = tokenGenerator(user._id);
        // Set secure cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // More secure than 'lax'
            maxAge: 24 * 60 * 60 * 1000,
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined
        });

        return apiResponse(res, 200, "Authentication successful", {
            id: user._id,
            email: user.email,
            googleName: user.googleName,
            isVerified: user.isVerified,
            registeredViaGoogle: user.registeredViaGoogle,
            createdAt: user.createdAt,
        })
    } catch (error) {


        // Specific error handling
        if (error.name === 'MongoError') {
            console.error('[GOOGLE_AUTH_DB_ERROR]', error);
            return errors.serverError(res, 'Database error during password upadate');
        }

        if (error.name === 'ValidationError') {
            return errors.unprocessable(res, 'Validation failed', error.errors);
        }

        console.error('[GOOGLE_AUTH_ERROR]', error);
        return errors.serverError(res,
            process.env.NODE_ENV === 'development' ? error.message : null
        );
    }
}

// get me
export const getME = async function (req, res, next) {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return errors.unauthorized(res, 'No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const user = await User.findById(userId).select('email googleName createdAt verifiedAt registeredViaGoogle isVerified');

        if (!user) {
            return errors.notFound(res, 'User not found');
        }

        return apiResponse(res, 200, 'User fetched successfully', {
            userId: user._id,
            name: user.googleName || 'N/A',
            email: user.email,
            createdAt: user.createdAt,
            verifiedAt: user.verifiedAt,
            isVerified: user.isVerified,
            registeredViaGoogle: user.registeredViaGoogle || false
        });
    } catch (error) {
        console.error('[GET_ME_ERROR]', error);
        return errors.serverError(res, process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong');
    }
};

// Protected Routed