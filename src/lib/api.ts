// FIX: Force the app to use the Render Backend, not localhost or Vercel
export const API_URL = "https://smartcare-zflo.onrender.com";

// Debug: confirm frontend build uses the intended backend URL
console.log("🚀 API Targeted:", API_URL);

type FetchOpts = RequestInit & { auth?: boolean };

export async function apiFetch<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  const headers = new Headers(opts.headers || {});
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && opts.body && typeof opts.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  // Auth Token Logic
  if (opts.auth) {
    const token = localStorage.getItem("smartcare_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // Extended timeout for Render "Cold Starts"
  const controller = new AbortController();
  const timeoutMs = (opts as any).timeout ?? 25000; 
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, { ...opts, headers, credentials: "include", signal: controller.signal });
    if (!res.ok) {
      const errorText = await res.text();
      try {
         const jsonErr = JSON.parse(errorText);
         throw new Error(jsonErr.detail || `API ${res.status}`);
      } catch {
         throw new Error(`API ${res.status}: ${errorText}`);
      }
    }
    return (await res.json()) as T;
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Network timeout - Server might be waking up!');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helpers
export const getProfileMe = () => apiFetch("/api/v1/profile/me", { auth: true });
export const getPatientDashboardData = () => apiFetch(`/api/v1/patient/dashboard`, { auth: true });
// ... keep other exports if needed
