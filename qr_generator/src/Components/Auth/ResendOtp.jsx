import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resendOTP } from '../../api/auth';

const ResendOTP = ({ email }) => {
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!email) {
        throw new Error('Email address is required');
      }
      
      await resendOTP(email);
      setSuccess('New OTP has been sent to your email!');
      setCountdown(30);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 text-center">
      <p className="text-gray-600 mb-3">
        Didn't receive the code?
      </p>
      
      <button
        onClick={handleResend}
        disabled={countdown > 0 || loading}
        className={`text-sm font-medium ${
          countdown > 0 || loading 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-indigo-600 hover:text-indigo-800'
        } transition-colors`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </span>
        ) : countdown > 0 ? (
          `Resend in ${countdown}s`
        ) : (
          'Resend OTP'
        )}
      </button>
      
      {error && (
        <div className="mt-3 p-2 bg-red-50 text-red-700 rounded-lg text-xs">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-3 p-2 bg-green-50 text-green-700 rounded-lg text-xs">
          {success}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => navigate('/auth/register')}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Use a different email address
        </button>
      </div>
    </div>
  );
};

export default ResendOTP;