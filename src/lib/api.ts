/// <reference types="vite/client" />

import axios from 'axios';

// Helper to ensure we always have /api/v1
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'https://smartcare-zflo.onrender.com';
  
  // Remove trailing slash if present
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  // Append /api/v1 if it's not already there
  if (!url.endsWith('/api/v1')) {
    url += '/api/v1';
  }
  
  return url;
};

// Create the Axios instance
const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Important for cookies/sessions
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Attaches the token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Don't loop if we are already on login
      if (!window.location.pathname.includes('/login')) {
         localStorage.removeItem('access_token');
         // Optional: Redirect to login, but be careful of loops
         // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;