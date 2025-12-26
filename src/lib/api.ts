// 1. Dynamic API URL (Prioritizes Env Var, falls back to Render)
export const API_URL = import.meta.env.VITE_API_URL || "https://smartcare-zflo.onrender.com";

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

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: reqHeaders,
    body,
  } as RequestInit);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `API request failed (${response.status})`);
  }

  if (response.status === 204) return {} as T;

  return response.json();
};

// 5. Standard Helper Functions (Preserved from your project)
export const getProfileMe = () => apiFetch('/api/v1/profile/me');

export const getPatientDashboardData = () => apiFetch('/api/v1/patient/dashboard');

export const bookAppointment = (data: any) => apiFetch('/api/v1/appointments', { 
    method: 'POST', 
    body: JSON.stringify(data) 
});

export const getMedicalRecords = () => apiFetch('/api/v1/medical-records');

export const getDoctors = () => apiFetch('/api/v1/doctors');
