import axios from 'axios';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:7000/api/auth';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Custom Registration
export const customRegister = (email, password) => {
  return api.post(`${API_URL}/register`, { email, password });
};

// Verify OTP
export const verifyOTP = (email, otp) => {
  return api.post(`${API_URL}/verify-otp`, { email, otp });
};

// Custom Login
export const customLogin = (email, password) => {
  return api.post(`${API_URL}/login`, { email, password });
};

// Google Login
export const googleAuth = (credential) => {
  return api.post(`${API_URL}/google-auth`, { credential });
};


// Forgot Password
export const forgotPassword = (email) => {
  return api.post(`${API_URL}/forgot-password`, { email });
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
  const res = await api.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
    withCredentials: true // ⬅️ Must be true for cookies to work
  });
  return res.data;
};

// export const registerUser = (email) => axios.post(`${API_URL}/send-otp`, { email });

export const loginWithPassword = (email, password) => {
  return api.post(`${API_URL}/login`, { email, password });
};

export function manualLogout() {
  return api.post(`${API_URL}/logout`, {});
}

// export const sendPasswordResetOTP = (email) => {
//   return axios.post(`${API_URL}/forgot-password`, { email });
// };


// export const sendOTP = (email, password) => {
//   return axios.post(`${API_URL}/register`, { email, password });
// };

// Verify token on the server
// export const verifyToken = async (token) => {
//   const response = await axios.get(`${API_URL}/verify-token`, {
//     headers: {
//       Authorization: `Bearer ${token}`
//     }
//   });
//   return response.data.user;
// };