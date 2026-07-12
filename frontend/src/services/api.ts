// src/services/api.ts
import axios from 'axios';

const defaultBaseURL = '/api';
const productionBaseURL = 'https://bachelorhub-production.up.railway.app/api';
const baseURL = import.meta.env.VITE_API_URL || (window.location.hostname.includes('railway') ? productionBaseURL : defaultBaseURL);

if (!import.meta.env.VITE_API_URL) {
  console.warn('Using API base URL:', baseURL)
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
    const isPublicAuthRequest =
      error.config?.url?.includes('/auth/forgot-password') ||
      error.config?.url?.includes('/auth/reset-password');

    if (error.response?.status === 401 && !isPublicAuthRequest) {
      localStorage.removeItem('accessToken');
      if (window.location.hash !== '#/login' && window.location.pathname !== '/login') {
        window.location.href = '/#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;