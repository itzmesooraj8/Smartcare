import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/api';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: (broadcast?: boolean) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; role?: UserRole }) => Promise<void>;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  mockLogin: (user: User, remember?: boolean) => void;
  updateUser: (u: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: decode JWT exp
function parseJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Broadcast logout/login across tabs
  useEffect(() => {
    if ('BroadcastChannel' in window) {
      bcRef.current = new BroadcastChannel('smartcare_auth');
      bcRef.current.onmessage = (ev) => {
        if (ev.data === 'logout') {
          // clear silently
          accessTokenRef.current = null;
          setUser(null);
        }
        if (ev.data?.type === 'login' && ev.data.user) {
          setUser(ev.data.user);
        }
      };
    } else {
      const handler = (ev: StorageEvent) => {
        if (ev.key === 'smartcare_broadcast' && ev.newValue === 'logout') {
          accessTokenRef.current = null;
          setUser(null);
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }

    return () => {
      bcRef.current?.close();
    };
  }, []);

  // Schedule silent refresh based on access token exp
  const scheduleRefresh = (token: string | null) => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (!token) return;
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return;
    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const msUntil = expiresAt - now - 60_000; // refresh 60s before expiry
    const delay = Math.max(5_000, msUntil);
    // @ts-ignore - setTimeout returns number in browser
    refreshTimeoutRef.current = window.setTimeout(() => {
      void refreshToken();
    }, delay);
  };

  const setAccessToken = (token: string | null) => {
    accessTokenRef.current = token;
    scheduleRefresh(token);
  };

  // Attempt to refresh access token using HttpOnly refresh cookie
  const refreshToken = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('refresh-failed');
      const data = await res.json();
      const { accessToken, user: returnedUser } = data;
      if (accessToken) {
        setAccessToken(accessToken);
      }
      if (returnedUser) setUser(returnedUser);
      return true;
    } catch (e) {
      // clear session
      setAccessToken(null);
      setUser(null);
      return false;
    }
  };

  // On mount, try silent session check
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      const ok = await refreshToken();
      if (!ok && mounted) {
        // not authenticated
        setUser(null);
      }
      if (mounted) setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string, remember = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        credentials: 'include', // expect refresh token cookie
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'login-failed');
      }
      const data = await res.json();
      const { accessToken, user: returnedUser } = data;
      setAccessToken(accessToken || null);
      setUser(returnedUser || null);
      if (remember) {
        try {
          localStorage.setItem('smartcare_remember_email', email);
        } catch {}
      } else {
        try {
          localStorage.removeItem('smartcare_remember_email');
        } catch {}
      }
      // broadcast login
      bcRef.current?.postMessage({ type: 'login', user: returnedUser });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (broadcast = true) => {
    setIsLoading(true);
    try {
      // Tell backend to clear refresh cookie
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
    if (broadcast) {
      if (bcRef.current) bcRef.current.postMessage('logout');
      try {
        localStorage.setItem('smartcare_broadcast', 'logout');
        localStorage.removeItem('smartcare_broadcast');
      } catch {}
    }
    setIsLoading(false);
  };

  const register = async (payload: { name: string; email: string; password: string; role?: UserRole }) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('register-failed');
      // If backend auto-logs in, attempt to refresh
      await refreshToken();
    } finally {
      setIsLoading(false);
    }
  };

  // helper to perform authenticated fetches; will attempt refresh on 401
  const fetchWithAuth = async (input: RequestInfo, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    headers.set('Accept', 'application/json');
    if (accessTokenRef.current) headers.set('Authorization', `Bearer ${accessTokenRef.current}`);
    const res = await fetch(input, { ...init, headers, credentials: 'include' });
    if (res.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed && accessTokenRef.current) {
        headers.set('Authorization', `Bearer ${accessTokenRef.current}`);
        return await fetch(input, { ...init, headers, credentials: 'include' });
      }
    }
    return res;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    register,
    fetchWithAuth,
    updateUser: (u: Partial<User>) => {
      setUser((prev) => {
        const merged = prev ? { ...prev, ...u } : (u as User);
        bcRef.current?.postMessage({ type: 'login', user: merged });
        return merged;
      });
    },
    mockLogin: (mockUser: User, remember = false) => {
      setAccessToken(null);
      setUser(mockUser);
      if (remember) {
        try {
          localStorage.setItem('smartcare_remember_email', mockUser.email);
        } catch {}
      }
      bcRef.current?.postMessage({ type: 'login', user: mockUser });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};