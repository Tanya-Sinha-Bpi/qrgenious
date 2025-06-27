import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OTPForm from "../../Components/Auth/OTPForm";
import ResendOTP from "../../Components/Auth/ResendOtp";
import { useAuth } from "../../Context/AuthContext";
import { verifyOTP } from "../../api/auth";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

function VerifyPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const location = useLocation();
  const { email } = location.state || {};
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/auth/register");
    }
  }, [email, navigate]);

  const handleSubmit = async () => {
    const otpCode = otp.join("");

    // Basic validation
    if (otpCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await verifyOTP(email, otpCode);
      toast.success(data.message || "Email Verify successfully");

      localStorage.setItem("userEmail", data.user.email);

      if (data.user.name) {
        localStorage.setItem("userName", data.user.name);
      }

      // Actually log in and redirect after a brief delay
      setTimeout(() => {
        login(data.token, data.user);
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP. Please try again.";
      // Show error toast
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }

    // Clear error when typing
    if (error) setError("");

    // Auto submit when last digit is entered
    if (index === 5 && value) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Verify Your Email
              </h1>
              <p className="text-gray-600">
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold">{email}</span>
              </p>
            </div>

            <OTPForm otp={otp} handleOtpChange={handleOtpChange} />

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-medium mt-6 transition-all flex items-center justify-center
                ${
                  loading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify Account"
              )}
            </button>

            <ResendOTP email={email} />
          </div>

          <div className="bg-gray-50 p-4 text-center text-sm text-gray-500">
            <p>Can't find the email? Check your spam folder</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default VerifyPage;
