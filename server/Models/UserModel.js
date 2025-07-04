import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {isRestrictedUsername} from '../Utils/Email_Validators.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const otpRegex = /^[0-9]{6}$/;

const userSchema = new mongoose.Schema({
    googleName: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "Email is Required"],
        unique: [true, "Email must be unique"],
        lowercase: true,
        validate: [
            {
                validator: function (email) {
                    const isValid = emailRegex.test(email);
                    return isValid;
                },
                message: (props) => `Provided email (${props.value}) is invalid`
            },
            {
                validator: function (email) {
                    const isRestricted = isRestrictedUsername(email);
                    return !isRestricted;
                },
                message: (props) => `Restricted word use detected in your email ${props.email}`
            }
        ]
    },
    password: {
        type: String,
        required: [true, "Password is Required"],
        minlength: [6, "Password Minimum length is 6 Character length"],
        validate: {
            validator: function (value) {
                const hasNumber = /\d/.test(value);
                const hasLowercase = /[a-z]/.test(value);
                const hasUppercase = /[A-Z]/.test(value);
                const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

                return hasNumber && hasLowercase && hasUppercase && hasSpecialChar;
            },
            message: (props) =>
                `Password must contain or combination of at least one number,lowercase,uppercase and special character This is:- ${props.value} invalid Password`,
        },

    },
    otp: {
        type: String,
        minlength: [6, "Otp minimum character length is 6 digit"],
        validate: [
            {
                validator: function (value) {
                    const hasNumber = /\d/.test(value);
                    return hasNumber;
                },
                message: (props) => `OTP is only number digit valid ${props.value}`
            },
            {
                validator: function (value) {
                    const isValid = otpRegex.test(value);
                    return isValid;
                },
                message: (props) => `Provided OTP (${props.value}) is invalid`
            }
        ]
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    otpExpiryTime: {
        type: Date,
    },
    verifiedAt: {
        type: Date
    },
    googleId: {
        type: String,
        default: null,
    },
    registeredViaGoogle: {
        type: Boolean,
        default: false,
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    },
    knownDevices: [{
        deviceId: String,
        userAgent: String,
        ipAddress: String,
        lastUsed: Date
    }]
});

//HOOKS

// Passowrd Encrypt
userSchema.pre("save", async function (next) {
    if (this.isModified("password") && this.password) {
        this.password = await bcrypt.hash(this.password.toString(), 12);
    }
});

// OTP Encrypt
userSchema.pre("save", async function (next) {
    if (this.isModified("otp") && this.otp) {
        this.otp = await bcrypt.hash(this.otp.toString(), 12);
        //Add expiry Time
        this.otpExpiryTime = new Date(Date.now() + 10 * 60 * 1000);
    }
    next();
})


// -----------------Methonds-----------------

// Adding KNown Device
userSchema.methods.addKnownDevice = async function (deviceInfo) {
    const existingDevice = this.knownDevices.find(d =>
        d.deviceId === deviceInfo.deviceId
    );

    if (existingDevice) {
        existingDevice.lastUsed = new Date();
    } else {
        this.knownDevices.push({
            ...deviceInfo,
            lastUsed: new Date()
        });
    }

    await this.save();
};

// Method to check if the OTP is expired
userSchema.methods.isOtpExpired = function () {
    if (!this.otpExpiryTime) {
        return false;
    }
    return new Date() > this.otpExpiryTime;

}

//Comparing Passowrd 
userSchema.methods.correctPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

//Comparing OTP
userSchema.methods.correctOtp = async function (candidateOtp) {
    console.log("DEBUG: From User Model Method Both OTP Check",candidateOtp,this.otp)
    return await bcrypt.compare(candidateOtp, this.otp);
}

const User = mongoose.model("User", userSchema);
export default User;