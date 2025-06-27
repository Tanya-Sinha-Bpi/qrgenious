// src/api/qr.js
import axios from 'axios';
import Cookies from 'js-cookie';
export const API_URL = import.meta.env.VITE_QR_APP_API_URL;

// Create Axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});
//Creating QR 
export const createQR = (data) => {
  return api.post('/create-qr', data);
};

// Get all QR History
export const getQRHistory = (params) => {
  return api.get('/get-qr-history', {params});
};

// Delete QR by Id
export const deleteQR = (id) => {
  return api.delete(`/delete-qr/${id}`);
};

// Get QR Details ID or Slug name
export const getQRDetails = (idOrSlug) => {
  return api.get(`/get-single-qr-details/${idOrSlug}`);
};

// Download a QR
export const downloadQR = (id) => {
  return api.get(`/download-qr/${id}`,{responseType: 'blob'});
};

// Update QR by id
export const updateQR = (idOrSlug,data) => {
  return api.put(`/update-qrDetails/${idOrSlug}`, data);
};


// Add a request interceptor to include the auth token
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// }, error => {
//   return Promise.reject(error);
// });

// Create a new QR code
// export const createQR = async (data) => {
//   try {
//     const response = await api.post('/create-qr', data);
//     return response.data;
//   } catch (error) {
//     throw error.response?.data?.error || 'Failed to create QR code';
//   }
// };





// Get user's QR history
// export const getQRHistory = async () => {
//   try {
//     const response = await api.get('/get-qr-history');
//     return response.data;
//   } catch (error) {
//     throw error.response?.data?.error || 'Failed to fetch QR history';
//   }
// };

// Delete a QR code
// export const deleteQR = async (id) => {
//   try {
//     const response = await api.delete(`/delete-qr${id}`);
//     return response.data;
//   } catch (error) {
//     throw error.response?.data?.error || 'Failed to delete QR code';
//   }
// };

// Get QR details (public)
// export const getQRDetails = async (idOrSlug) => {
//   try {
//     const response = await api.get(`/get-single-qr-details/${idOrSlug}`);
//     return response.data;
//   } catch (error) {
//     throw error.response?.data?.error || 'QR code not found';
//   }
// };

// Download QR image
// export const downloadQR = async (id) => {
//   try {
//     const response = await api.get(`/download-qr/${id}`, {
//       responseType: 'blob' // Important for file downloads
//     });
//     return response.data;
//   } catch (error) {
//     throw error.response?.data?.error || 'Failed to download QR code';
//   }
// };

// Update a QR code
// export const updateQR = async (idOrSlug, data) => {
//   try {
//     const response = await api.put(`/update-qrDetails${idOrSlug}`, data);
//     return response.data;
//   } catch (error) {
//     throw error.response?.data?.error || 'Failed to update QR code';
//   }
// };