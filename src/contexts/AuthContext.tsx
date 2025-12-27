import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiFetch from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Safe JWT decoder: decodes base64url payload and handles UTF-8 correctly
function decodeJwtSafe(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary.split('').map((c) => c.charCodeAt(0)));
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'patient' | 'doctor' | 'admin' | string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  masterKey: CryptoKey | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // login is now called with the final token, user payload and the unwrapped master key
  login: (token: string, userData: User, key: CryptoKey) => void;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smartcare_token'));
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Preference: localStorage is authoritative for tokens
  const TOKEN_KEY = 'smartcare_token';

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) {
      const decoded = decodeJwtSafe(t);
      if (decoded && decoded.sub) {
        const decodedEmail = decoded.email || 'user@smartcare.app';
        const resolvedRole = (decoded.role as any) || 'patient';
        setUser({ id: decoded.sub, email: decodedEmail, role: resolvedRole });
        setToken(t);
      }
    }
    setIsLoading(false);
  }, []);

  // Login sets the token, user and the unwrapped master key (kept only in RAM)
  const login = (newToken: string, userData: User, extractedKey: CryptoKey) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(userData);
    setMasterKey(extractedKey);
  };

  const register = async (data: any) => {
    await apiFetch({ url: '/api/v1/auth/register', method: 'POST', data: JSON.stringify(data) });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setMasterKey(null);
    window.location.href = '/login';
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, masterKey, isLoading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);