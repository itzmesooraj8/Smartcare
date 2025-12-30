import React, { createContext, useContext, useState, useEffect } from 'react';
import apiFetch from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name?: string | null;
  name?: string | null;
  avatar?: string | null;
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

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiFetch.get<{ user?: User }>('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
        }
      } catch (e) {
        console.warn("Session expired or invalid:", e);
        localStorage.removeItem('access_token');
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, passwordHash: string, key: CryptoKey | null) => {
    setIsLoading(true);
    try {
      const res = await apiFetch.post('/auth/login', { email, password: passwordHash });
      
      // 1. Force extraction of token from body
      const { access_token, user: userFromResponse } = (res as any)?.data ?? {};
      
      if (!access_token) throw new Error("No access token received from server");

      // 2. Save to Storage IMMEDIATELY
      localStorage.setItem('access_token', access_token);
      
      // 3. Set State
      if (userFromResponse) {
        setUser(userFromResponse as User);
        setMasterKey(key);
      } else {
         // Fallback fetch if user object missing (rare)
         const meRes = await apiFetch.get<{ user?: User }>('/auth/me');
         setUser(meRes.data.user || null);
      }
    } catch (err) {
      console.error('Login error', err);
      localStorage.removeItem('access_token'); // Clean up if failed
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Best effort backend logout
      await apiFetch.post('/auth/logout');
    } catch (e) {
      // ignore network errors on logout
    }
    // Always clean up local state
    localStorage.removeItem('access_token');
    setUser(null);
    setMasterKey(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};