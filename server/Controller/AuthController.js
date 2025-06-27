import User from '../models/User.js';
import { sendOTPEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Custom Registration (with password)
export const customRegister = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        message: existingUser.registeredViaGoogle
          ? 'Email already registered with Google. Please sign in with Google.'
          : 'Email already registered. Please log in.'
      });
    }

    // Case 2: User exists but is NOT verified — resend OTP and update password
    if (existingUser && !existingUser.isVerified) {
      const otp = crypto.randomInt(100000, 999999).toString();
      console.log("Otp resent to unverified user:", otp);
      const otpExpiryTime = new Date(Date.now() + 10 * 60000); // 10 minutes
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      existingUser.otp = otp;
      existingUser.otpExpiryTime = otpExpiryTime;
      existingUser.password = hashedPassword;
      await existingUser.save();

      await sendOTPEmail(email, otp);

      return res.status(200).json({
        message: 'OTP resent to unverified user.',
        email
      });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    console.log("Otp in custom registration Controller:", otp)
    const otpExpiryTime = new Date(Date.now() + 10 * 60000); // 10 mins

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      otp,
      otpExpiryTime,
      isVerified: false,
      registeredViaGoogle: false
    });

    await user.save();
    await sendOTPEmail(email, otp);

    return res.status(200).json({
      message: 'OTP sent successfully',
      email,
    });
  } catch (error) {
    console.log("Full Custom Register Error", error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Google OAuth Registration/Login
export const googleAuth = async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but not with Google
      if (!user.registeredViaGoogle) {
        return res.status(400).json({
          message: 'Email already registered with password. Please log in with your password.'
        });
      }

      // If user exists with Google, update their info
      user.googleId = googleId;
      user.googleAuthName = name;
      await user.save();
    } else {
      // Create new user
      user = new User({
        email,
        googleId,
        googleAuthName: name,
        isVerified: true,
        registeredViaGoogle: true
      });

      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    // Set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
      sameSite: 'lax',    // or 'strict'
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });



    return res.json({
      message: "Successfully Registered!",
      token,
      user: {
        id: user._id,
        email: user.email,
        googleAuthName: name,
        isVerified: user.isVerified,
        registeredViaGoogle: user.registeredViaGoogle
      }
    });
  } catch (error) {
    console.log('Full GoogleAuth failed', error);
    return res.status(500).json({ message: 'Google authentication failed' + error.message });
  }
};

// Generate and send OTP
export const sendOTP = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60000); // 10 mins

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      email,
      password: hashedPassword,
      otp,
      otpExpiry
    });

    await user.save();
    await sendOTPEmail(email, otp);

    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Verify OTP for registration
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account already verified' });
    }

    if (user.otp !== String(otp) || user.otpExpiryTime < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiryTime = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    // Set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
      sameSite: 'lax',    // or 'strict'
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.json({
      message: "Email Verified Successfully!",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.googleAuthName || ""
        // isVerified: user.isVerified,
        // registeredViaGoogle: user.registeredViaGoogle
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' + error.message });
  }
};

// Custom Login (with password)
export const customLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not Found with this Email' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        message: 'Account not verified. Please verify your email first.'
      });
    }

    // Check if user registered via Google
    if (user.registeredViaGoogle) {
      return res.status(401).json({
        message: 'This account is registered with Google. Please sign in with Google.'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    // Set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
      sameSite: 'lax',    // or 'strict'
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.json({
      message: "Login Successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.googleAuthName || "",
        isVerified: user.isVerified,
        registeredViaGoogle: user.registeredViaGoogle
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' + error.message });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiryTime = new Date(Date.now() + 10 * 60000); // 10 mins

    user.otp = otp;
    user.otpExpiryTime = otpExpiryTime;
    await user.save();

    await sendOTPEmail(email, otp);

    return res.json({ message: 'Password reset OTP sent' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' + error.message });
  }
};
// Reset Password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.otp !== String(otp) || user.otpExpiryTime < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpiryTime = undefined;
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' + error.message });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiryTime = new Date(Date.now() + 10 * 60000); // 10 mins

    user.otp = otp;
    user.otpExpiryTime = otpExpiryTime;
    await user.save();

    await sendOTPEmail(email, otp);

    return res.json({ message: 'New OTP sent successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' + error.message });
  }
};

// Protected Controller
export const authenticatedUser = async (req, res, next) => {

  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. User not found.' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized. Invalid token.' + error.message });
  }
}

//Find Me
export const getMe = async (req, res) => {
  try {
    const token = req.cookies.token; // ⬅️ From cookie, not headers
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized. No token found.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized. User not found.' });
    }

    return res.status(200).json({
      id: user._id,
      email: user.email,
      name: user.googleAuthName || '',
      registeredViaGoogle: user.registeredViaGoogle,
      isVerified: user.isVerified
    });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Logout
export const logoutAdmin = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',  // important, should match cookie path
    });
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.log("logout error", error);
    return res.status(500).json({ message: "Something happend" + error.message });
  }
}