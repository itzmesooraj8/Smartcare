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

// Generic apiFetch helper used across the app. Many files import `apiFetch` from this module.
export async function apiFetch(opts: any = {}, maybeOpts?: any) {
  // Support two call styles:
  // 1) apiFetch({ path: '/api/v1/...' })
  // 2) apiFetch('/auth/login', { method: 'POST', body })
  let options: any = {};
  if (typeof opts === 'string') {
    options = { path: opts, ...(maybeOpts || {}) };
  } else {
    options = { ...(opts || {}) };
  }

  const { url, path, method = 'GET', data, body, params, auth = true, headers = {}, ...rest } = options;
  const endpoint = url ?? path ?? '';
  const payload = data ?? body;

  const cfg: any = {
    url: endpoint,
    method: method as any,
    params,
    data: payload,
    headers: { ...headers },
    ...rest,
  };

  if (auth === false) {
    const unauth = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json', ...headers }, withCredentials: true });
    const res = await unauth.request(cfg);
    // Normalize Axios response shape: return res.data if present for convenience
    return (res && typeof res === 'object' && 'data' in res) ? res.data : res;
  }

  const res = await api.request(cfg);
  return (res && typeof res === 'object' && 'data' in res) ? res.data : res;
}

// Small convenience wrappers used across the app
export async function getDoctors() {
  return apiFetch({ path: '/api/v1/doctors', method: 'GET' });
}

export async function bookAppointment(payload: any) {
  return apiFetch({ path: '/api/v1/appointments', method: 'POST', data: payload });
}

export async function getPatientDashboardData() {
  return apiFetch({ path: '/api/v1/patient/dashboard', method: 'GET' });
}

export default api;
