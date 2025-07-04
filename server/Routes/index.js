import express from "express";
import authRoute from './AuthRoutes.js'
import qrRoute from './QRRoutes.js';
const router = express.Router();

router.use("/auth",authRoute);
router.use('/qr',qrRoute);

export default router;