import axios from 'axios';
import Staitc_uri from './Static_Uri';
const API_URL = Staitc_uri.VITE_REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Custom Registration
export const customRegister = (email, password) => {
  return api.post(`${API_URL}/custom-register`, { email, password });
};

// Verify OTP
export const verifyOTP = (email, otp) => {
  return api.post(`${API_URL}/verify-email`, { email, otp });
};

// Custom Login
export const customLogin = (email, password) => {
  return api.post(`${API_URL}/custom-login`, { email, password });
};

// Google Login
export const googleAuth = (credential) => {
  return api.post(`${API_URL}/auth-via-gauth`, { credential });
};


// Forgot Password
export const forgotPassword = (email) => {
  return api.post(`${API_URL}/send-request-for-password-reset`, { email });
};

// Reset Password
export const resetPassword = (email, otp, newPassword) => {
  return api.post(`${API_URL}/reset-password`, { email, otp, newPassword });
};

// Resend OTP
export const resendOTP = (email) => {
  return api.post(`${API_URL}/resend-otp`, { email });
};

export const verifyToken = async () => {
  const res = await api.get(`${API_URL}/get-me`, {
    withCredentials: true // ⬅️ Must be true for cookies to work
  });
  // console.log("verifytoken page frontend data",res.data);
  return res.data;
};

// export const registerUser = (email) => axios.post(`${API_URL}/send-otp`, { email });

export const loginWithPassword = (email, password) => {
  return api.post(`${API_URL}/login`, { email, password });
};

export function manualLogout() {
  return api.post(`${API_URL}/logout`, {});
}
