import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const QRDisplay = ({ qrData }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const downloadQR = async () => {
    if (!qrData) return;
    
    setIsDownloading(true);
    try {
      // If we have a download link from the backend
      if (qrData.downloadLink) {
        const response = await fetch(qrData.downloadLink);
        const blob = await response.blob();
        saveAs(blob, `qr-${qrData.qrId}.png`);
      } 
      // If we have a base64 image data
      else if (qrData.qrImage.startsWith('data:image')) {
        const blob = await fetch(qrData.qrImage).then(res => res.blob());
        saveAs(blob, `qr-${qrData.qrId}.png`);
      }
      toast.success("QR Data started download successfully")
    } catch (err) {
      toast.error("Something Error when downloading:" + err.message)
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = () => {
    if (!qrData) return;
    
    // Create a URL that would be encoded in the QR
    const url = `${window.location.origin}/qr/${qrData.qrId}`;
    
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Copy failed:', err));
  };

  return (
    <div className="flex flex-col items-center">
      {qrData ? (
        <motion.div 
          className="w-full max-w-xs"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white p-4 rounded-xl shadow-lg mb-6 flex justify-center">
            {qrData.qrImage ? (
              <img 
                src={qrData.qrImage} 
                alt="Generated QR Code" 
                className="w-48 h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-100 border-2 border-dashed rounded-xl text-gray-400">
                QR Code Image
              </div>
            )}
          </div>
          
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{qrData.title || 'Untitled QR'}</h3>
            <p className="text-gray-600 text-sm">Scan this QR to view the content</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={downloadQR}
              disabled={isDownloading}
              className={`flex-1 py-2.5 px-4 rounded-lg text-white font-medium flex items-center justify-center
                ${isDownloading 
                  ? 'bg-indigo-400' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                }`}
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </>
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={copyToClipboard}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium flex items-center justify-center border
                ${copied 
                  ? 'bg-green-100 text-green-700 border-green-300' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </>
              )}
            </motion.button>
          </div>
          
          <div className="mt-6 bg-indigo-50 rounded-lg p-4 text-center">
            <p className="text-indigo-700 text-sm">
              This QR code will link to a page showing: 
              <span className="font-medium block truncate mt-1">
                {qrData.content}
              </span>
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <div className="mb-6 mx-auto w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No QR Generated Yet</h3>
          <p className="text-gray-500 max-w-xs mx-auto">
            Create a new QR code using the form to see it displayed here
          </p>
        </div>
      )}
    </div>
  );
};

export default QRDisplay;