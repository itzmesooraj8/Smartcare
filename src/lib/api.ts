// 1. Dynamic API URL (Prioritizes Env Var, falls back to Render)
// Use configured API base (Vite env should point to backend host).
// Support either a base host (http://localhost:8000) or a full api url including /api/v1.
const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const API_URL = RAW_API.replace(/\/$/, '');
// Compute prefix that callers should use for API endpoints
const API_PREFIX = API_URL.includes('/api/v1') ? API_URL : `${API_URL}/api/v1`;

// 2. Token Helper (check both localStorage and sessionStorage)
const getToken = () => localStorage.getItem('smartcare_token') || sessionStorage.getItem('smartcare_token');

// 3. Types
interface ApiFetchOptions {
  method?: string;
  body?: any;
  auth?: boolean;
  headers?: Record<string, string>;
}

// 4. The Core Fetch Function (exported as const to match new callers)
export const apiFetch = async <T = any>(endpoint: string, { method = 'GET', body, auth = true, headers = {} }: ApiFetchOptions = {}): Promise<T> => {
  const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json', ...headers };

  if (auth) {
    const token = getToken();
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;
  }
  // Ensure endpoint begins with a slash
  if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
  // If caller provided a full /api/v1 path, keep it; otherwise prepend API_PREFIX
  const url = endpoint.startsWith('/api/v1') ? `${API_URL}${endpoint}` : `${API_PREFIX}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body,
  } as RequestInit);

  // Global 401 handler: redirect to login on unauthorized
  if (response.status === 401) {
    try { window.location.href = '/login'; } catch (e) { /* ignore */ }
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Unauthorized');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `API request failed (${response.status})`);
  }

  if (response.status === 204) return {} as T;

  return response.json();
};

// 5. Standard Helper Functions (Preserved from your project)
export const getProfileMe = () => apiFetch('/profile/me');

export const getPatientDashboardData = () => apiFetch('/patient/dashboard');

export const bookAppointment = (data: any) => apiFetch('/appointments', { 
    method: 'POST', 
    body: JSON.stringify(data) 
});

export const getMedicalRecords = () => apiFetch('/medical-records');

export const getDoctors = () => apiFetch('/doctors');
