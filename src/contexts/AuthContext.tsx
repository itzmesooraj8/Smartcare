import React, { createContext, useContext, useState, useEffect } from 'react';
import apiFetch from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string;
  avatar?: string;
  role: 'patient' | 'doctor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  masterKey: CryptoKey | null;
  login: (email: string, passwordHash: string, masterKey: CryptoKey | null) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  updateMasterKey: (key: CryptoKey) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Check for token first to avoid unnecessary requests
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await apiFetch.get('/auth/me', {
          signal: controller.signal
        } as any).catch(() => null);

        clearTimeout(timeoutId);

        const body = (res as any)?.data ?? null;
        if (body?.user) {
          setUser(body.user as User);
        } else {
          // Token invalid or expired
          localStorage.removeItem('access_token');
        }
      } catch (err) {
        // console.warn("Session validation failed:", err);
        localStorage.removeItem('access_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, passwordHash: string, key: CryptoKey | null) => {
    setIsLoading(true);
    try {
      const res = await apiFetch.post('/auth/login', { email, password: passwordHash });

      // Save token to localStorage if backend returned one (fallback for third-party cookie issues)
      try {
        const token = (res as any)?.data?.access_token;
        if (token) localStorage.setItem('access_token', token);
      } catch (e) {
        // ignore localStorage errors (e.g., SSR)
      }

      // Fetch the authenticated user's profile
      const meRes = await apiFetch.get('/auth/me');
      const body = (meRes as any)?.data ?? null;
      const userData = body?.user ?? null;
      if (!userData) throw new Error('Invalid response from server');
      setUser(userData as User);
      setMasterKey(key);

    } catch (err) {
      console.error('Login error', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      await apiFetch({
        url: '/auth/register',
        method: 'POST',
        data: payload,
      });
    } catch (err) {
      console.error('Registration error', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    try {
      localStorage.removeItem('access_token');
    } catch (e) {
      // ignore
    }
    setUser(null);
    setMasterKey(null);
    window.location.href = '/login';
  };

  const updateMasterKey = (key: CryptoKey) => {
    setMasterKey(key);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, masterKey, login, register, logout, updateMasterKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}