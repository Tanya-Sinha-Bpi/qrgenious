import React from 'react';
import { motion } from 'framer-motion';

const OTPForm = ({ otp, handleOtpChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Verification Code
      </label>
      <div className="flex justify-center space-x-2 md:space-x-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <motion.input
            key={index}
            id={`otp-${index}`}
            type="text"
            maxLength={1}
            value={otp[index]}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-lg focus:outline-none transition-colors
              ${otp[index] 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400 focus:border-indigo-500'
              }`}
            autoFocus={index === 0}
            inputMode="numeric"
            pattern="[0-9]*"
            whileFocus={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          />
        ))}
      </div>
      <p className="text-center text-sm text-gray-500 mt-3">
        Enter the 6-digit code from your email
      </p>
    </div>
  );
};

export default OTPForm;