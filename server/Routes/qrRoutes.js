// backend/routes/qrRoutes.js
import express from 'express';
import {
  createQR,
  getQRHistory,
  deleteQR,
  getQRDetails,
  downloadQR,
  updateQR,
  getQRBySlug
} from '../Controller/QrController.js';
import {authenticatedUser} from '../Controller/AuthController.js';

const router = express.Router();

// Protected routes
router.post('/create-qr', authenticatedUser, createQR);
router.get('/get-qr-history', authenticatedUser, getQRHistory);
router.delete('/delete-qr/:id', authenticatedUser, deleteQR);
router.get('/get-single-qr-details/:idOrSlug',authenticatedUser,getQRDetails);
router.get('/download-qr/:id', authenticatedUser, downloadQR);
router.put('/update-qrDetails/:idOrSlug', authenticatedUser, updateQR);

// Public route
router.get('/details/:slug', getQRBySlug);

export default router;