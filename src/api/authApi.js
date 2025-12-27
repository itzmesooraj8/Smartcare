const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1") + '/auth';

export const registerUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Registration failed");
  return data;
};

export const loginUser = async (loginData) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: loginData.email, password: loginData.password }),
  });

  const data = await response.json();
  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error(data.detail || 'Unauthorized');
  }
  if (!response.ok) throw new Error(data.detail || "Login failed");
  return data;
};
