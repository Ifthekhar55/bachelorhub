// src/services/api.ts
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api'

if (!import.meta.env.VITE_API_URL) {
  console.warn('VITE_API_URL is not set. Using /api relative path for API requests. Make sure your backend is accessible from the same origin or set VITE_API_URL in production.')
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;