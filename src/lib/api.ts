// Prefer an explicit VITE_API_URL at build time. In production, if not provided,
// fall back to the same origin so the client calls the backend on the app host
// (this avoids trying to call localhost from user devices which causes long timeouts).
export const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');

type FetchOpts = RequestInit & { auth?: boolean };

export async function apiFetch<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  const headers = new Headers(opts.headers || {});
  headers.set("Accept", "application/json");
  if (!headers.has("Content-Type") && opts.body && typeof opts.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  // If you later store a token in localStorage, this will send it
  if (opts.auth) {
    const token = localStorage.getItem("smartcare_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // Fail fast with a reasonable timeout to avoid long stalls on mobile/clients
  const controller = new AbortController();
  const timeoutMs = (opts as any).timeout ?? 8000; // 8s default
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, { ...opts, headers, credentials: "include", signal: controller.signal });
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Network timeout');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Backend helpers
export const getProfileMe = () => apiFetch("/api/v1/profile/me", { auth: true });
export const listPatientRecords = (patientId: string) => apiFetch(`/api/v1/ehr/patient/${patientId}`, { auth: true });
