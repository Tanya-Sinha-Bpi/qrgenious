import QRData from '../models/QRData.js';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createQR = async (req, res) => {
  try {
    const { title, content, color = '#000000' } = req.body;

    const baseSlug = slugify(title, { lower: true, strict: true }); // e.g., "my-new-product"
    const randomSuffix = Math.random().toString(36).substring(2, 7); // e.g., "a8v9z"
    const slug = `${baseSlug}-${randomSuffix}`; // "my-new-product-a8v9z"

    const publicUrl = `${process.env.FRONTEND_URL}/qr/${slug}`;

        // Generate QR image (base64)
    const qrImage = await QRCode.toDataURL(publicUrl, {
      color: {
        dark: color,
        light: '#ffffff00' // transparent background
      },
      width: 200,
      margin: 2
    });
    
        // Create initial QRData document WITHOUT downloadLink
    const qrData = new QRData({
      userId: req.userId,
      title,
      content,
      slug,
      generatedBy: 'admin',
      qrImage,
    });
    
    const savedData = await qrData.save();
    // Prepare download link (optional, or you can generate dynamically)
    const downloadLink = `/api/qr/download-qr/${savedData._id}`;

    savedData.downloadLink = downloadLink;
    await savedData.save();
    
    return res.status(201).json({
      message:"QR Image Data created successfully!",
      id: savedData._id,
      slug,
      qrImage,
      generatedBy:'admin',
      downloadLink,
      title,
      content
    });
  } catch (error) {
    console.error("creating qr image",error);
    return res.status(500).json({ error: 'Failed to generate QR' });
  }
};

export const getQRHistory = async (req, res) => {
  try {
    const qrData = await QRData.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('_id title createdAt');
      
    res.json(qrData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

export const deleteQR = async (req, res) => {
  try {
    const qrItem = await QRData.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!qrItem) {
      return res.status(404).json({ message: 'QR not found' });
    }
    
    res.json({ message: 'QR deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete QR' });
  }
};

export const getQRDetails = async (req, res) => {
  try {
    // const qrData = await QRData.findById(req.params.id);
    // if (!qrData) return res.status(404).json({ error: 'QR not found' });
    const { idOrSlug } = req.params;

    // Determine if it's a valid MongoDB ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);

    const query = isObjectId
      ? { _id: idOrSlug }
      : { slug: idOrSlug };

    // const qrData = await QRData.findOneAndUpdate(
    //   query,
    //   {
    //     $inc: { scanCount: 1 },
    //     $set: { lastScannedAt: new Date() }
    //   },
    //   { new: true }
    // );
    const qrData = await QRData.findOne(query)
      .select('title content createdAt lastScannedAt scanCount slug downloadLink');

    if (!qrData) {
      return res.status(404).json({ error: 'QR not found' });
    }
    
    return res.json(qrData);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve QR details Server error' + error.message });
  }
};

export const downloadQR = async (req, res) => {
  try {
    const qrData = await QRData.findById(req.params.id);
    if (!qrData) return res.status(404).json({ error: 'QR not found' });
    
    const publicUrl = `${process.env.FRONTEND_URL}/qr/${qrData._id}`;
    const tempPath = path.join(__dirname, '../temp');
    
    // Create temp directory if not exists
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath);
    }
    
    const filePath = path.join(tempPath, `${qrData._id}.png`);
    
    await QRCode.toFile(filePath, publicUrl, {
      width: 1000,
      margin: 2,
      color: {
        dark: '#000',
        light: '#fff'
      }
    });
    
    res.download(filePath, `qr-${qrData.title}.png`, (err) => {
      // Delete file after download completes
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (err) {
        console.error('Download error:', err);
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR' });
  }
};

export const updateQR = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const { title, content, bumpScan = false } = req.body;

    // Determine if it's a valid MongoDB ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const query = isObjectId
      ? { _id: idOrSlug }
      : { slug: idOrSlug };

          // Build the update payload
    const updatePayload = {};
    if (typeof title === 'string')  updatePayload.title         = title;
    if (typeof content === 'string') updatePayload.content       = content;
    if (bumpScan) {
      updatePayload.$inc = { scanCount: 1 };
      updatePayload.$set = { lastScannedAt: new Date() };
    }

        // Execute update
    const qrData = await QRData.findOneAndUpdate(
      query,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!qrData) {
      return res.status(404).json({ error: 'QR not found' });
    }
    
    return res.status(200).json({
      id:qrData._id,
      title:qrData.title,
      content:qrData.content,
      downloadUrl:qrData.downloadLink,
      scanCount:qrData.scanCount,
      lastScanned:qrData.lastScannedAt,
      qrImage: qrData.qrImage, 
      slug: qrData.slug, 
      generatedBy: 'Admin',
      createdAt,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve QR details Server error' + error.message });
  }
};

export const getQRBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const bumpScan = req.query.bumpScan === 'true';

    const qr = await QRData.findOneAndUpdate(
      { slug },
      bumpScan
        ? {
            $set: { lastScannedAt: new Date() },
            $inc: { scanCount: 1 },
          }
        : {},
      { new: true }
    );

    if (!qr) {
      return res.status(404).json({ error: 'QR not found' });
    }

    return res.status(200).json({
      title: qr.title,
      content: qr.content,
      createdAt: qr.createdAt,
      lastScanned: qr.lastScannedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

