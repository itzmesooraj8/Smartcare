import React, { createContext, useContext, useState, useEffect } from 'react';
import apiFetch from '@/lib/api';

// Strict TypeScript AuthProvider adapted for cookie-based sessions

interface User {
  id: string;
  email: string;
  full_name?: string | null;
  role: 'patient' | 'doctor' | 'admin' | string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, passwordHash: string, masterKey: CryptoKey | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch.get('/auth/me').catch(() => null);
        const body = res?.data ?? null;
        if (body && body.user) setUser(body.user as User);
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, passwordHash: string, key: CryptoKey | null) => {
    setIsLoading(true);
    try {
      const res = await apiFetch.post('/auth/login', { email, password: passwordHash });

      // Save token to localStorage if backend returned one
      try {
        const token = res?.data?.access_token;
        if (token) localStorage.setItem('access_token', token);
      } catch (e) {
        // ignore localStorage errors
      }

      const meRes = await apiFetch.get('/auth/me');
      const body = meRes?.data ?? null;
      if (body && body.user) {
        setUser(body.user as User);
        setMasterKey(key);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error', err);
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
    } finally {
      try {
        localStorage.removeItem('access_token');
      } catch (e) {
        // ignore
      }
      setUser(null);
      setMasterKey(null);
      window.location.href = '/login';
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
