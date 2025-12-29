/// <reference types="vite/client" />

import axios from 'axios';

// Create the Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://smartcare-zflo.onrender.com/api/v1',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Attaches the token
api.interceptors.request.use(
  (config) => {
    // 1. Get the token from localStorage
    const token = localStorage.getItem('access_token');
    
    // 2. If it exists, attach it as a Bearer token
    if (token) {
      // @ts-ignore
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('access_token');
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

export default apiFetch;
