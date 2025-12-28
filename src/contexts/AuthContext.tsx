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
  // login is called with the user payload and the unwrapped master key (token is stored in an HttpOnly cookie)
  login: (userData: User, key: CryptoKey) => void;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Using HttpOnly cookies for session tokens; tokens are not stored in localStorage.
  const TOKEN_KEY = 'smartcare_token';

  useEffect(() => {
    // On mount, check server session cookie for logged-in user
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const body = await res.json();
          const u = body.user;
          setUser(u);
        }
      } catch (e) {
        // ignore — unauthenticated
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Login accepts user (server sets HttpOnly cookie) and the unwrapped master key (kept only in RAM)
  const login = (userData: User, extractedKey: CryptoKey) => {
    setUser(userData);
    setMasterKey(extractedKey);
  };

  const register = async (data: any) => {
    await apiFetch({ url: '/api/v1/auth/register', method: 'POST', data: JSON.stringify(data) });
  };

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      // ignore
    }
    setToken(null);
    setUser(null);
    setMasterKey(null);
    window.location.href = '/login';
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, masterKey, isLoading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);