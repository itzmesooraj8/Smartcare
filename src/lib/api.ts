/// <reference types="vite/client" />

import axios from 'axios';

// 1. Create the Axios instance
const apiFetch = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://smartcare-zflo.onrender.com/api/v1",
  withCredentials: true, // keep cookies enabled as a fallback
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Add a Request Interceptor (THE FIX)
apiFetch.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      if (!config.headers) config.headers = {};
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore localStorage errors (e.g., SSR)
  }
  return config;
});

// 3. Add a Response Interceptor to handle 401s globally
apiFetch.interceptors.response.use(
  (response) => response,
  (error) => {
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
