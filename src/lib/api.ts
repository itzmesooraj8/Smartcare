/// <reference types="vite/client" />

import axios from 'axios';

// 🔒 FORCE PRODUCTION BACKEND
// We hardcode your Render URL here so it NEVER tries to connect to localhost.
// Note: We added '/api/v1' because your router expects it.
export const API_URL = "https://smartcare-zflo.onrender.com/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Crucial for CORS
});

// Add secure token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
