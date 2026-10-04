import React, { createContext, useContext, useState, useEffect } from 'react';
import apiFetch from '@/lib/api';

export interface User {
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
  login: (email: string, passwordHash: string, masterKey: CryptoKey | null) => Promise<any>;
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        // Query backend session via HttpOnly cookie
        const res = await apiFetch.get('/auth/me', {
          signal: controller.signal,
        } as any).catch(() => null);

        clearTimeout(timeoutId);

        const body = (res as any)?.data ?? null;
        if (body?.user) {
          setUser(body.user as User);
        } else {
          setUser(null);
        }
      } catch {
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
      // Backend automatically sets HttpOnly Secure SameSite cookie on response
      const res = await apiFetch.post('/auth/login', { email, password: passwordHash });
      const data = res.data;

      if (data?.mfa_required) {
        // User has MFA enabled; return mfa_required payload so caller can render TOTP challenge
        return data;
      }

      // Session established via HttpOnly cookie; record user profile in state
      if (data?.user) {
        setUser(data.user as User);
        setMasterKey(key);
      }
      return data;
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
      const res = await apiFetch.post('/auth/register', payload);
      if (res.data?.user) {
        setUser(res.data.user as User);
      }
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
    } catch {
      // ignore network errors on logout
    }
    setUser(null);
    setMasterKey(null);
    window.location.href = '/login';
  };

  const updateMasterKey = (key: CryptoKey) => {
    setMasterKey(key);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        masterKey,
        login,
        register,
        logout,
        updateMasterKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}