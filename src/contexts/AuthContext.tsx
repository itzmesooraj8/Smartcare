import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
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
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Preference: localStorage is authoritative for tokens
  const TOKEN_KEY = 'smartcare_token';

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const decoded = decodeJwtSafe(token);
      if (decoded && decoded.sub) {
        const decodedEmail = decoded.email || 'user@smartcare.app';
        const resolvedRole = (decoded.role as any) || 'patient';
        setUser({ id: decoded.sub, email: decodedEmail, role: resolvedRole });
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ access_token: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });

      if (res && res.access_token) {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        const decoded = decodeJwtSafe(res.access_token);
        const decodedEmail = decoded?.email || email;
        const resolvedRole = (decoded?.role as any) || 'patient';
        const u: User = { id: decoded?.sub || 'unknown', email: decodedEmail, role: resolvedRole };
        setUser(u);
        return u;
      }

      throw new Error('No token received');
    } catch (error: any) {
      // Demo fallback when explicitly enabled
      if ((import.meta as any).env?.VITE_ENABLE_DEMO === 'true' && (pass === 'demo123' || pass === 'password' || (email && email.includes('demo')))) {
        toast({ title: 'Demo Mode', description: 'Logged in locally as Demo User.' });
        const demoUser: User = { id: 'demo-user', email: email || 'demo@smartcare.app', name: 'Demo User', role: 'patient' };
        localStorage.setItem(TOKEN_KEY, 'demo-token-123');
        setUser(demoUser);
        return demoUser;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    await apiFetch('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    window.location.href = '/login';
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);