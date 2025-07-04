import ImageKit from "imagekit";
import { Readable } from 'stream';

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

/**
 * Upload file from stream to ImageKit
 * @param {ReadableStream|Buffer} file - File stream or buffer
 * @param {String} fileName - Name for the uploaded file
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} ImageKit response
 */
// export const uploadFileFromStream = async (file, fileName, options = {}) => {
//   let uploadStream;

//   if (file instanceof Buffer) {
//     uploadStream = Readable.from(file);
//   } else {
//     uploadStream = file;
//   }

//   return new Promise((resolve, reject) => {
//     const chunks = [];
//     uploadStream.on('data', (chunk) => chunks.push(chunk));
//     uploadStream.on('error', reject);
//     uploadStream.on('end', async () => {
//       try {
//         const buffer = Buffer.concat(chunks);
//         const uploadOptions = {
//           file: buffer,
//           fileName,
//           folder: "/QR_WEBAPP",
//           ...options
//         };
//         const response = await imagekit.upload(uploadOptions);
//         resolve(response);
//       } catch (error) {
//         reject(error);
//       }
//     });
//   });
// };
// export const uploadFileFromStream = async (file, fileName, options = {}) => {
//   try {
//     // Convert buffer to stream if needed
//     const stream = file instanceof Buffer ? Readable.from(file) : file;

//     // Collect chunks
//     const chunks = [];
//     for await (const chunk of stream) {
//       chunks.push(chunk);
//     }

//     const buffer = Buffer.concat(chunks);
//     return await imagekit.upload({
//       file: buffer,
//       fileName,
//       folder: "/QR_WEBAPP",
//       ...options
//     });

//   } catch (error) {
//     console.error('Upload failed:', error);
//     throw error;
//   }
// };
export const uploadFileFromStream = async (stream, fileName, options = {}) => {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream
      .on('data', (chunk) => chunks.push(chunk))
      .on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const result = await imagekit.upload({
            file: buffer,
            fileName,
            folder: "/QR_WEBAPP",
            ...options
          });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
};

/**
 * Delete file from ImageKit
 * @param {String} fileId - ID of the file to delete
 * @returns {Promise<Object>} ImageKit response
 */
export const deleteFile = async (fileId) => {
  try {
    return await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error("ImageKit delete error:", error);
    throw error;
  }
};

export const extractFileIdFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split('/').pop(); // Get the filename
    const parts = filename.split('_');
    
    // If filename follows pattern: qr_[mongoId]_[timestamp]_[random].png
    if (parts.length >= 4 && parts[0] === 'qr') {
      return parts[parts.length - 2]; // Returns "udoufAZQm" from your example
    }
    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
};

export default imagekit;
