import express from "express";
import { customLogin, customRegister, getME, logoutUser, protect, resendOTP, resetPassword, sendPassowrdResetRequest, signORsignupViaGoogle, verifyEmail } from "../Controller/AuthController.js";

const router = express.Router();

router.post("/custom-register", customRegister);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);
router.post("/send-request-for-password-reset", sendPassowrdResetRequest);
router.post("/reset-password", resetPassword);
router.post('/custom-login', customLogin);
router.post('/auth-via-gauth', signORsignupViaGoogle);
router.post("/logout", protect, logoutUser);
router.get('/get-me',getME);

export default router;