// 1. Dynamic API URL (Prioritizes Env Var, falls back to Render)
export const API_URL = import.meta.env.VITE_API_URL || "https://smartcare-zflo.onrender.com";

// 2. Token Helper
const getToken = () => localStorage.getItem('smartcare_token');

// 3. Types
interface FetchOptions extends RequestInit {
  auth?: boolean;
}

// 4. The Core Fetch Function
export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;

  const config: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    },
  };

  // Add Auth Token if requested
  if (auth) {
    const token = getToken();
    if (token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  // Make the Request
  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Handle Errors
  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`;
    try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
        // Response wasn't JSON, use generic text
    }
    throw new Error(errorMessage);
  }

  // Handle Empty Responses (204 No Content)
  if (response.status === 204) return {} as T;

  return response.json();
}

// 5. Standard Helper Functions (Preserved from your project)
export const getProfileMe = () => apiFetch('/api/v1/profile/me');

export const getPatientDashboardData = () => apiFetch('/api/v1/patient/dashboard');

export const bookAppointment = (data: any) => apiFetch('/api/v1/appointments', { 
    method: 'POST', 
    body: JSON.stringify(data) 
});

export const getMedicalRecords = () => apiFetch('/api/v1/medical-records');

export const getDoctors = () => apiFetch('/api/v1/doctors');
