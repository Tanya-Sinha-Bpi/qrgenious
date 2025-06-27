import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { deleteQR } from '../../api/qr';
import { useAuth } from '../../Context/AuthContext';
import { toast } from 'react-toastify';


const HistoryItem = ({ item, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { user } = useAuth();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteQR(item.qrId, user.token);
      onDelete(item.qrId);
      toast.success(response.data?.message || "Successfully Deleted" )
    } catch (error) {
      toast.error(error.response?.data?.message || "Something wrong to Deleted, Please try after some time!!" )
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isDeleting ? 0 : 1, 
        y: 0,
        height: isDeleting ? 0 : 'auto'
      }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <Link to={`/qr/${item.qrId}`} state={{ qr: item }} className="group">
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
              {item.title || 'Untitled QR'}
            </h3>
          </Link>
          
          <button 
            onClick={() => setShowActions(!showActions)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {item.content}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
          
          <Link 
            to={`/qr/${item.qrId}`} 
            state={{ qr: item }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
      
      {showActions && (
        <motion.div 
          className="border-t border-gray-100 bg-gray-50 p-3 flex justify-end space-x-2"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <Link
            to={`/edit/${item.qrId}`}
            state={{ qr: item }}
            className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : 'Delete'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HistoryItem;