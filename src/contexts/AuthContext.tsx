import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Decode a JWT payload without external deps
function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

type Role = 'patient' | 'doctor' | 'admin';
interface User { id: string; email: string; name?: string; role: Role }
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('smartcare_token');
    const decoded = parseJwt(token);
    if (decoded && (decoded as any).sub) {
      setUser({ id: (decoded as any).sub, email: (decoded as any).email || '', role: ((decoded as any).role as Role) || 'patient' });
    } else {
      localStorage.removeItem('smartcare_token');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const payload = await apiFetch('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pass }) });
      const token = (payload as any).access_token || (payload as any).accessToken || null;
      if (!token) throw new Error('No token received');
      localStorage.setItem('smartcare_token', token);
      const decoded = parseJwt(token);
      setUser({ id: (decoded as any)?.sub || '0', email, role: ((decoded as any)?.role as Role) || 'patient' });
    } catch (err: any) {
      toast?.({ title: 'Login failed', description: err?.message || String(err), variant: 'destructive' });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    await apiFetch('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  };

  const logout = () => {
    localStorage.removeItem('smartcare_token');
    setUser(null);
    try { void fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }) } catch {}
    window.location.href = '/login';
  };

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
