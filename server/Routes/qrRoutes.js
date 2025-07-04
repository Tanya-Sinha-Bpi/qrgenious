import express from "express";
import { protect } from "../Controller/AuthController.js";
import { createQRCode, deleteQRData, downloadQR, getAllQRHistory, getPublicQRDetails, getQRDetails, updateQRData } from "../Controller/QRController.js";

const router = express.Router();

router.post('/create-qr', protect, createQRCode);
router.get('/get-qr-history', protect, getAllQRHistory);
router.delete('/delete-qr/:qrID', protect, deleteQRData);
router.get('/get-single-qr-details/:slugOrId',protect,getQRDetails);
router.get('/download-qr/:id', protect, downloadQR);
router.put('/update-qrDetails/:qrId', protect, updateQRData);

// Public route
router.get('/details/:slugOrId', getPublicQRDetails);

export default router;