/// <reference types="vite/client" />
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://smartcare-zflo.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: any) => {
    if (error?.response?.status === 401) {
      try { localStorage.removeItem('access_token'); } catch { }
      // We do NOT hard reload here as it causes OOM loops if the backend is flaky.
    }
    return Promise.reject(error);
  }
);

export const apiFetch = api;
export default api;

export const API_URL = import.meta.env.VITE_API_URL || 'https://smartcare-zflo.onrender.com/api/v1';

export async function getPatientDashboardData() {
  const res = await api.get('/patient/dashboard');
  return res.data;
}

export async function getDoctors() {
  const res = await api.get('/doctors');
  return res.data;
}

export async function bookAppointment(payload: any) {
  const res = await api.post('/appointments', payload);
  return res.data;
}