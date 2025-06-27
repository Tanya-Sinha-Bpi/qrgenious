import mongoose from 'mongoose';
import isRestrictedEmails from '../Utils/DBvalidators.js';


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
  googleAuthName:{
    type:String
  },
  email:{
    type:String,
    required: [true, "Email is required"],
    unique:[true, "This email already used by another"],
    lowercase:true,
    validate:[
      {
        validator:function (email){
          const isValid = emailRegex.test(email);
          return isValid;
        },
        message:(props)=> `Provided email (${props.value}) is invalid`,
      },
      {
        validator: function (email){
          const isRestricted = isRestrictedEmails(email);
          return !isRestricted;
        },
        message:(props)=>`Restricted Word use in email ${props.value} are not allowed`,
      },
    ],
  },
  password:{
    type:String,
    required:[true,"Password is required"],
    minlength: [6, "Password must be atleast 8 characters length"],
    validate: {
      validator: function (value) {
        const hasNumber = /\d/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasUppercase = /[A-Z]/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        return hasNumber && hasLowercase && hasUppercase && hasSpecialChar;
      },
      message: (props) =>
        `Password must contain at least one number, one lowercase letter, one uppercase letter, and one special character This is${props.value} invalid Password`,
    },
  },
    isVerified: {
    type: Boolean,
    default: false,
  },
    otp: {
    type: String,
  },
    otpExpiryTime: {
    type: Date,
  },
    googleId: {
    type: String,
    default: null,
  },

  registeredViaGoogle: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema);

// const userSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   otp: String,
//   otpExpiry: Date,
//   isVerified: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now }
// });

