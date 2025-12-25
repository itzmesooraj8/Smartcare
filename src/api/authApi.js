const BASE_URL = "https://smartcare-zflo.onrender.com/api/v1/auth";

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
  const formData = new URLSearchParams();
  formData.append('username', loginData.email);
  formData.append('password', loginData.password);

  const response = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Login failed");
  return data;
};
