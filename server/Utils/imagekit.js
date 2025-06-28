import ImageKit from "imagekit";
import fetch from "node-fetch";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});
// const getFileIdFromUrl = (fileUrl) => {
//   if (!fileUrl.includes(process.env.IMAGEKIT_URL_ENDPOINT)) {
//     throw new Error('Invalid ImageKit URL');
//   }
//   return fileUrl.split(process.env.IMAGEKIT_URL_ENDPOINT)[1]
//     .replace(/^\//, '')
//     .split('?')[0];
// };

// const deleteFileFromImageKit = async (fileUrl) => {
//   const maxRetries = 3;
//   const retryDelay = 1000; // 1 second between retries
  
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       console.log(`Deletion attempt ${attempt} for: ${fileUrl}`);
      
//       const fileId = getFileIdFromUrl(fileUrl);
//       console.log('Using fileId:', fileId);

//       // Try direct API first (more reliable than SDK)
//       const authString = Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64');
//       const apiUrl = `https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`;
      
//       console.log('Making request to:', apiUrl);
      
//       const response = await fetch(apiUrl, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Basic ${authString}`,
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         },
//         timeout: 10000
//       });

//       if (response.ok) {
//         console.log('✅ Deletion successful');
//         return true;
//       }

//       const errorData = await response.json().catch(() => ({}));
//       throw new Error(errorData.message || `HTTP ${response.status}`);

//     } catch (error) {
//       if (attempt === maxRetries) {
//         console.error(`❌ All ${maxRetries} deletion attempts failed`);
//         throw error;
//       }
      
//       console.warn(`Attempt ${attempt} failed, retrying...`, error.message);
//       await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
//     }
//   }
// };
const getFileIdFromUrl = (fileUrl) => {
  if (!fileUrl.includes(process.env.IMAGEKIT_URL_ENDPOINT)) {
    throw new Error('Invalid ImageKit URL');
  }
  return fileUrl.split(process.env.IMAGEKIT_URL_ENDPOINT)[1]
    .replace(/^\//, '')
    .split('?')[0];
};

const deleteFileFromImageKit = async (fileUrl) => {
  const maxRetries = 2;
  const retryDelay = 2000; // 2 seconds between retries
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fileId = getFileIdFromUrl(fileUrl);
      const authString = Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString('base64');
      
      const response = await fetch(
        `https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.ok) return true;
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);

    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

export { imagekit, deleteFileFromImageKit };

// const deleteFileFromImageKit = async (fileUrl) => {
//   try {
//     // Validate input
//     if (!fileUrl || typeof fileUrl !== 'string') {
//       throw new Error('Invalid file URL provided');
//     }

//     if (!fileUrl.includes(process.env.IMAGEKIT_URL_ENDPOINT)) {
//       throw new Error('File does not belong to your ImageKit account');
//     }

//     // Extract the correct file path
//     const filePath = fileUrl.split(process.env.IMAGEKIT_URL_ENDPOINT)[1]
//       .replace(/^\//, '')
//       .split('?')[0];

//     if (!filePath) {
//       throw new Error('Could not extract file path from URL');
//     }

//     console.log(`Attempting to delete: ${filePath}`);

//     // Attempt deletion with timeout
//     const deletePromise = imagekit.deleteFile(filePath);
//     const timeoutPromise = new Promise((_, reject) => 
//       setTimeout(() => reject(new Error('Deletion timeout')), 10000)
//     );

//     await Promise.race([deletePromise, timeoutPromise]);
    
//     console.log('✅ Deletion successful');
//     return true;

//   } catch (error) {
//     console.error('❌ Deletion failed:', {
//       message: error.message || 'Unknown error',
//       stack: error.stack,
//       fileUrl: fileUrl
//     });
//     throw new Error(`Failed to delete file: ${error.message}`);
//   }
// };





// const deleteFileFromImageKit = async (fileUrl) => {
//   try {
//     // 1. Verify URL structure
//     if (!fileUrl.startsWith(process.env.IMAGEKIT_URL_ENDPOINT)) {
//       throw new Error("Invalid ImageKit URL");
//     }

//     // 2. Extract the RELATIVE path (most critical part)
//     const baseUrl = process.env.IMAGEKIT_URL_ENDPOINT;
//     const filePath = fileUrl.slice(baseUrl.length).replace(/^\//, '');

//     console.log("Extracted file path:", filePath);

//     // 3. Delete with authentication headers
//     const response = await imagekit.deleteFile(filePath);
//     console.log("✅ Deletion successful");
//     return response;
//   } catch (error) {
//     console.error("❌ Deletion failed:", {
//       message: error.message,
//       httpCode: error.httpCode,
//       help: error.help
//     });
//     throw error;
//   }
// };


