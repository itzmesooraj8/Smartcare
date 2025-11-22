export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers, credentials: "include" });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

// Backend helpers
export const getProfileMe = () => apiFetch("/api/v1/profile/me", { auth: true });
export const listPatientRecords = (patientId: string) => apiFetch(`/api/v1/ehr/patient/${patientId}`, { auth: true });
