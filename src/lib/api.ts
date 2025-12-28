/// <reference types="vite/client" />

import axios from 'axios';

// 1. Get the raw configured API URL and canonicalize it
const RAW_API = import.meta.env.VITE_API_URL || '';
const CANONICAL = RAW_API.replace(/\/+$/, '');

// 2. Define the single versioned API root. If the provided URL already ends
// with '/api/v1' we keep it as-is to avoid double-prefixing.
export const API_URL = CANONICAL.endsWith('/api/v1') ? CANONICAL : `${CANONICAL}/api/v1`;

// 3. Set global defaults
axios.defaults.withCredentials = true;

export const api = axios.create({
  baseURL: API_URL, // This handles the prefix for all 'api.request' calls
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add secure token to requests if it exists

// Add secure token to requests if it exists
api.interceptors.request.use((config) => {
  // Do not attach tokens from localStorage. Backend should set HttpOnly cookies.
  // If an Authorization header is required, callers may set it explicitly.
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
