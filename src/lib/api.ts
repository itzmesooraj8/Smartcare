/// <reference types="vite/client" />
import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'https://smartcare-zflo.onrender.com/api/v1';
// Ensure strict /api/v1 suffix
if (baseURL && !baseURL.endsWith('/api/v1')) {
  baseURL = baseURL.replace(/\/$/, '') + '/api/v1';
}

const api = axios.create({
  baseURL,
  withCredentials: true, // Enables browser to automatically transmit HttpOnly session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiFetch = api;
export default api;

export const API_URL = baseURL;

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

export async function getAppointments() {
  const res = await api.get('/appointments');
  return res.data;
}