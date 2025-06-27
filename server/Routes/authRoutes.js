import express from 'express';
import {
  verifyOTP,
  forgotPassword,
  resetPassword,
  resendOTP,
  customRegister,
  customLogin,
  googleAuth,
  sendOTP,
  getMe,
  logoutAdmin
} from '../Controller/AuthController.js';


const router = express.Router();

// Custom registration flow
router.post('/register', customRegister);
router.post('/verify-otp', verifyOTP);
router.post('/send-otp',sendOTP);
router.post('/resend-otp', resendOTP);

// Login methods
router.post('/login', customLogin);
router.post('/google-auth', googleAuth);

// Password reset flow
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Find me
router.get('/me', getMe);

//Logout
router.post('/logout',logoutAdmin);

export default router;