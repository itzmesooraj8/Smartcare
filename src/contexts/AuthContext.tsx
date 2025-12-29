import React, { createContext, useContext, useState, useEffect } from 'react';
import apiFetch from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'patient' | 'doctor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  masterKey: CryptoKey | null;
  login: (email: string, passwordHash: string, masterKey: CryptoKey | null) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await apiFetch.get('/auth/me').catch(() => null);
        const body = (res as any)?.data ?? null;
        if (body?.user) {
          setUser(body.user as User);
        }
      } catch (err) {
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

  return (
    <AuthContext.Provider value={{ user, isLoading, masterKey, login, register, logout }}>
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