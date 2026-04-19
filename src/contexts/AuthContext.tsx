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

const MOCK_AUTH_ENABLED = import.meta.env.DEV || import.meta.env.VITE_MOCK_AUTH === 'true';

const inferMockRole = (email: string): User['role'] => {
  const normalized = email.toLowerCase();
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('doctor') || normalized.startsWith('dr.')) return 'doctor';
  return 'patient';
};

const buildMockUser = (email: string, role?: User['role']): User => {
  const resolvedRole = role || inferMockRole(email);
  return {
    id: `mock-${resolvedRole}`,
    email,
    role: resolvedRole,
    full_name: resolvedRole === 'doctor' ? 'Dr. Demo' : resolvedRole === 'admin' ? 'Admin Demo' : 'Demo Patient',
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (MOCK_AUTH_ENABLED) {
        try {
          const mockUserRaw = localStorage.getItem('mock_auth_user');
          if (mockUserRaw) {
            const parsed = JSON.parse(mockUserRaw) as User;
            setUser(parsed);
          }
        } catch (e) {
          localStorage.removeItem('mock_auth_user');
        } finally {
          setIsLoading(false);
        }
        return;
      }

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
      if (MOCK_AUTH_ENABLED) {
        const mockUser = buildMockUser(email);
        localStorage.setItem('access_token', 'mock-access-token');
        localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
        setUser(mockUser);
        setMasterKey(key);
        return;
      }

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
      if (MOCK_AUTH_ENABLED) {
        const mockUsersRaw = localStorage.getItem('mock_registered_users');
        const mockUsers = mockUsersRaw ? (JSON.parse(mockUsersRaw) as Array<{ email: string }>) : [];
        const exists = mockUsers.some((u) => u.email.toLowerCase() === String(payload?.email || '').toLowerCase());
        if (exists) {
          const err: any = new Error('Email already registered');
          err.response = { status: 409, data: { detail: 'Email already registered' } };
          throw err;
        }
        mockUsers.push({ email: payload?.email });
        localStorage.setItem('mock_registered_users', JSON.stringify(mockUsers));
        return;
      }

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
    if (MOCK_AUTH_ENABLED) {
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('mock_auth_user');
      } catch (e) {
        // ignore
      }
      setUser(null);
      setMasterKey(null);
      window.location.href = '/login';
      return;
    }

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