import QRData from '../Models/QRData.js';
import { createCanvas } from 'canvas';
import {toCanvas}  from 'qrcode'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import mongoose from 'mongoose';
import { deleteFileFromImageKit, imagekit } from '../Utils/imagekit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Memory management
const MAX_MEMORY_MB = 150;
let qrCodeModule = null;

async function getQRGenerator() {
  if (!qrCodeModule) {
    // Lazy load the QR code module
    qrCodeModule = await import('qrcode');
  }
  return qrCodeModule;
}

async function generateQRCode(url, color = '#000000') {
  // Check memory before generation
  const usedMB = process.memoryUsage().heapUsed / 1024 / 1024;
  if (usedMB > MAX_MEMORY_MB * 0.8 && global.gc) {
    global.gc();
    console.log('⚠️ Forced garbage collection before QR generation');
  }

  const canvas = createCanvas(150, 150);
  const qr = await getQRGenerator();
  
  // Generate QR code directly to canvas
  await qr.toCanvas(canvas, url, {
    color: {
      dark: color,
      light: '#ffffff00' // Transparent background
    },
    width: 150,
    margin: 2,
    errorCorrectionLevel: 'M' // Medium error correction
  });

  // Convert to buffer without holding multiple copies in memory
  return new Promise((resolve) => {
    canvas.toBuffer((err, buffer) => {
      if (err) throw err;
      resolve(buffer);
    });
  });
}

export const createQR = async (req, res) => {
  try {
    const { title, content, color = '#000000' } = req.body;

    // Input validation
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Generate slug
    const baseSlug = slugify(title, { lower: true, strict: true });
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    const qrUrl = `${process.env.FRONTEND_URL}/qr/${slug}`;

    // Generate QR code with memory protection
    let qrBuffer;
    try {
      qrBuffer = await generateQRCode(qrUrl, color);
    } catch (err) {
      console.error('QR generation failed:', err);
      return res.status(500).json({ error: 'QR generation failed' });
    }

    // Upload to ImageKit
    let uploadResponse;
    try {
      uploadResponse = await imagekit.upload({
        file: qrBuffer,
        fileName: `${slug}.png`,
        folder: '/QR_images/',
        useUniqueFileName: false
      });
      console.log('QR uploaded to ImageKit');
    } catch (uploadErr) {
      console.error('Upload failed:', uploadErr);
      return res.status(502).json({ error: 'Image upload service unavailable' });
    }

    // Create and save document
    const qrData = new QRData({
      userId: req.userId,
      title,
      content,
      slug,
      qrImage: uploadResponse.url,
      downloadLink: uploadResponse.url
    });

    await qrData.save();

    return res.status(201).json({
      message: "QR created successfully",
      qrImage: uploadResponse.url,
      slug:qrData.slug,
      content:qrData.content,
      downloadLink:qrData.downloadLink,
      qrId:qrData._id,
      color:qrData.color,
      createdAt:qrData.createdAt,
      scanCount:qrData.scanCount,
      lastScannedAt:qrData.lastScannedAt
    });

  } catch (error) {
    console.error('Create QR error:', error);
    return res.status(500).json({ 
      error: 'Failed to create QR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// export const createQR = async (req, res) => {
//   try {
//     const { title, content, color = '#000000' } = req.body;

//     // Generate slug first
//     const baseSlug = slugify(title, { lower: true, strict: true });
//     const randomSuffix = Math.random().toString(36).substring(2, 7);
//     const slug = `${baseSlug}-${randomSuffix}`;

//     const publicUrl = `${process.env.FRONTEND_URL}/qr/${slug}`;

//     // Generate QR image
//     const qrImage = await QRCode.toBuffer(publicUrl, {
//       color: {
//         dark: color,
//         light: '#ffffff00'
//       },
//       width: 150,
//       margin: 2
//     });

//     // Upload the QR code image to ImageKit
//     let uploadResponse;
//     try {
//       uploadResponse = await imagekit.upload({
//         file: qrImage, // Image buffer
//         fileName: `${slug}.png`, // File name for ImageKit
//         folder: '/QR_images/', // Optional: store in folder
//         useUniqueFileName: false,  // Important for consistent file IDs
//         overwriteFile: false
//       });
//       console.log("QR Images upload successfully on Imagekit")
//     } catch (error) {
//       console.error("Error uploading to ImageKit:", error);
//       const statusCode = error?.httpCode || 500;
//       const message = error?.message || 'Failed to upload QR image to ImageKit';
//       return res.status(statusCode).json({
//         error: message
//       });
//     }

//     // Create initial QRData document WITHOUT downloadLink
//     const qrData = new QRData({
//       userId: req.userId,
//       title,
//       content,
//       slug,
//       generatedBy: 'Admin',
//       qrImage: uploadResponse.url, // Store ImageKit public URL
//       downloadLink: uploadResponse.url
//     });

//     const savedData = await qrData.save();

//     await savedData.save();

//     return res.status(201).json({
//       message: "QR Image Data created successfully!",
//       id: savedData._id,
//       slug,
//       qrImage: uploadResponse.url,
//       generatedBy: 'Admin',
//       downloadLink: uploadResponse.url,
//       title,
//       content
//     });
//   } catch (error) {
//     console.error("creating qr ", error);
//     return res.status(500).json({ error: 'Failed to generate QR' });
//   }
// };

export const getQRHistory = async (req, res) => {
  try {
    const qrData = await QRData.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('_id title createdAt updatedAt slug scanCount lastScannedAt content');

    return res.status(200).json(qrData);
  } catch (error) {
    console.log("error in getQRHistory", error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
};


export const deleteQR = async (req, res) => {
  try {
    // Find the QR code with ownership verification
    const qrItem = await QRData.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    }).select('qrImage');

    if (!qrItem) {
      return res.status(404).json({ 
        error: 'QR not found or not owned by user',
        code: 'QR_NOT_FOUND'
      });
    }

    // Delete the associated image from ImageKit
    if (qrItem.qrImage) {
      try {
        await deleteFileFromImageKit(qrItem.qrImage);
        console.log('✅ QR image deleted from ImageKit');
      } catch (error) {
        console.error('❌ ImageKit deletion failed:', {
          error: error.message,
          qrImage: qrItem.qrImage,
          timestamp: new Date().toISOString()
        });
        // Continue with deletion even if image deletion fails
      }
    }

    // Delete from database
    await QRData.findByIdAndDelete(req.params.id);

    return res.status(200).json({ 
      message: 'QR deleted successfully',
      deletedId: req.params.id
    });

  } catch (error) {
    console.error('DELETE QR ERROR:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: 'Failed to delete QR',
      details: error.message,
      code: 'DELETE_FAILED'
    });
  }
};

export const getQRDetails = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Determine if it's a valid MongoDB ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);

    const query = isObjectId
      ? { _id: idOrSlug }
      : { slug: idOrSlug };


    const qrData = await QRData.findOne(query)
      .select('title content createdAt lastScannedAt scanCount slug downloadLink');

    if (!qrData) {
      return res.status(404).json({ error: 'QR not found' });
    }

    return res.json(qrData);
  } catch (error) {
    console.log("error in getQRdetails", error);
    return res.status(500).json({ error: 'Failed to retrieve QR details Server error' + error.message });
  }
};

export const downloadQR = async (req, res) => {
  try {
    const qrData = await QRData.findById(req.params.id);
    if (!qrData) return res.status(404).json({ error: 'QR not found' });

    const downloadLink = qrData.downloadLink; // Get the download link from the database

    if (!downloadLink) {
      return res.status(404).json({ error: 'Download link not available' });
    }

    // Redirect the client to the image URL from ImageKit for download
    res.redirect(downloadLink); // This will trigger the file download from ImageKit
  } catch (error) {
    console.log("Error in downloading QR", error);
    return res.status(500).json({ error: 'Failed to retrieve QR image for download' });
  }
};
export const updateQR = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const updates = req.body;

    // Find existing QR
    const qr = await QRData.findOne(
      mongoose.Types.ObjectId.isValid(idOrSlug) 
        ? { _id: idOrSlug } 
        : { slug: idOrSlug }
    ).select('qrImage slug _id').lean();

    if (!qr) return res.status(404).json({ error: 'QR not found' });

    // Track old image for cleanup
    let oldImageUrl = qr.qrImage;
    let deletionSuccess = true;

    // Attempt deletion (but proceed if API fails)
    if (oldImageUrl) {
      try {
        await deleteFileFromImageKit(oldImageUrl);
      } catch (error) {
        deletionSuccess = false;
        console.warn('Deletion failed (proceeding with update):', error.message);
      }
    }

    // Generate new QR
    const qrImage = await QRCode.toBuffer(
      `${process.env.FRONTEND_URL}/qr/${qr.slug}`,
      {
        color: { 
          dark: updates.color || '#000000',
          light: '#ffffff00'
        },
        width: 150,
        margin: 2
      }
    );

    // Upload with unique name if deletion failed
    const uploadResponse = await imagekit.upload({
      file: qrImage,
      fileName: deletionSuccess ? `${qr.slug}.png` : `${qr.slug}-${Date.now()}.png`,
      folder: '/QR_images/',
      useUniqueFileName: !deletionSuccess,
      overwriteFile: deletionSuccess
    });

    // Update database
    const updatedQR = await QRData.findOneAndUpdate(
      { _id: qr._id },
      {
        qrImage: uploadResponse.url,
        downloadLink: uploadResponse.url,
        updatedAt: new Date(),
        ...(updates.title && { title: updates.title }),
        ...(updates.content && { content: updates.content }),
        ...(updates.color && { color: updates.color }),
        ...(updates.bumpScan && { 
          $inc: { scanCount: 1 },
          lastScannedAt: new Date() 
        })
      },
      { new: true }
    );

    return res.json({
      ...updatedQR.toObject(),
      warnings: !deletionSuccess ? ['Old image could not be deleted'] : undefined
    });

  } catch (error) {
    console.error('UPDATE ERROR:', error);
    return res.status(500).json({
      error: 'Update failed',
      details: error.message
    });
  }
};
// export const updateQR = async (req, res) => {
//   try {
//     const { idOrSlug } = req.params;
//     const updates = req.body;

//     // Input validation
//     if (!idOrSlug) {
//       return res.status(400).json({
//         error: 'Invalid request',
//         details: 'Missing QR code identifier',
//         code: 'MISSING_ID'
//       });
//     }

//     // Find existing QR
//     const qr = await QRData.findOne(
//       mongoose.Types.ObjectId.isValid(idOrSlug)
//         ? { _id: idOrSlug }
//         : { slug: idOrSlug }
//     ).select('qrImage slug _id').lean();

//     if (!qr) {
//       return res.status(404).json({
//         error: 'Not found',
//         details: 'QR code not found',
//         code: 'QR_NOT_FOUND'
//       });
//     }

//     // Mandatory deletion of old image
//     if (qr.qrImage) {
//       try {
//         await deleteFileFromImageKit(qr.qrImage);
//       } catch (error) {
//         return res.status(502).json({
//           error: 'ImageKit service unavailable',
//           details: 'Could not delete old image. Please try again later.',
//           debug: {
//             fileUrl: qr.qrImage,
//             extractedId: getFileIdFromUrl(qr.qrImage),
//             error: error.message,
//             timestamp: new Date().toISOString()
//           }
//         });
//       }
//     }
//     //   if (qr.qrImage) {
//     //   try {
//     //     await deleteFileFromImageKit(qr.qrImage);
//     //   } catch (error) {
//     //     return res.status(500).json({
//     //       error: 'Cannot update QR',
//     //       details: 'Failed to delete existing image: ' + error.message,
//     //       code: 'DELETE_FAILED',
//     //       severity: 'critical',
//     //       debug: {
//     //         fileUrl: qr.qrImage,
//     //         extractedId: extractFileId(qr.qrImage),
//     //         timestamp: new Date().toISOString()
//     //       }
//     //     });
//     //   }
//     // }

//     // Generate new QR
//     const qrImage = await QRCode.toBuffer(
//       `${process.env.FRONTEND_URL}/qr/${qr.slug}`,
//       {
//         color: {
//           dark: updates.color || '#000000',
//           light: '#ffffff00'
//         },
//         width: 150,
//         margin: 2
//       }
//     );

//     // Upload new image
//     let uploadResponse;
//     try {
//       uploadResponse = await imagekit.upload({
//         file: qrImage,
//         fileName: `${qr.slug}.png`,
//         folder: '/QR_images/',
//         useUniqueFileName: false,
//         overwriteFile: true,
//         tags: ['qr_code', 'updated']
//       });
//     } catch (uploadError) {
//       return res.status(500).json({
//         error: 'Upload failed',
//         details: uploadError.message,
//         code: 'UPLOAD_FAILED'
//       });
//     }

//     // Prepare update
//     const updateData = {
//       qrImage: uploadResponse.url,
//       downloadLink: uploadResponse.url,
//       updatedAt: new Date()
//     };

//     // Optional updates
//     if (updates.title) updateData.title = updates.title;
//     if (updates.content) updateData.content = updates.content;
//     if (updates.color) updateData.color = updates.color;
//     if (updates.bumpScan) {
//       updateData.$inc = { scanCount: 1 };
//       updateData.lastScannedAt = new Date();
//     }

//     // Update database
//     const updatedQR = await QRData.findOneAndUpdate(
//       { _id: qr._id },
//       updateData,
//       { new: true, lean: true }
//     );

//     return res.json(updatedQR);

//   } catch (error) {
//     console.error('CRITICAL UPDATE ERROR:', {
//       error: error.message,
//       stack: error.stack,
//       timestamp: new Date().toISOString()
//     });

//     return res.status(500).json({
//       error: 'System error',
//       details: 'Please contact support',
//       code: 'SYSTEM_FAILURE'
//     });
//   }
// };

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
    console.log("error in getQRbySlug", error);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

