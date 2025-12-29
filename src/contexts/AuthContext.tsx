import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
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
        const res = (await apiFetch('/auth/me')) as { user?: User } | null;
        if (res?.user) {
          setUser(res.user);
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
      const res = (await apiFetch('/auth/login', {
        method: 'POST',
        data: { email, password: passwordHash },
        auth: false,
      })) as { user?: User; data?: { user?: User } } | null;

      const userData = res?.user || res?.data?.user;
      if (!userData) throw new Error('Invalid response from server');
      
      setUser(userData);
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
      await apiFetch('/auth/register', {
        method: 'POST',
        data: payload,
        auth: false,
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
      await apiFetch('/auth/logout', { method: 'POST' });
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