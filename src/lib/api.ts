/// <reference types="vite/client" />

import axios from 'axios';

// 1. Canonicalize the configured API URL to tolerate trailing slashes
const cleanBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// 2. Use the clean base API URL (do NOT append '/api/v1' here).
//    Keep the axios baseURL equal to the raw API host so callers can
//    specify paths consistently. The fetch helper below will ensure
//    `/api/v1` is prepended when constructing non-absolute endpoints.
export const API_URL = cleanBase;

// 3. Set global defaults
axios.defaults.withCredentials = true; // ensure HttpOnly cookies are sent

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Just the domain: https://smartcare-zflo.onrender.com
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
  const endpointRaw = url ?? path ?? '';
  // If the caller passed an absolute URL, leave it alone. For relative paths
  // ensure we always call the versioned API root `/api/v1/...` so callers can
  // pass either '/api/v1/...' or '/resource' and both will work.
  let endpoint = endpointRaw;
  if (!/^https?:\/\//i.test(endpointRaw)) {
    // Remove any leading slashes
    let e = String(endpointRaw).replace(/^\/+/, '');
    // Remove a leading 'api/v1' if present to avoid double-prefixing
    e = e.replace(/^api\/v1\/?/, '');
    endpoint = `/api/v1/${e}`;
  }
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
