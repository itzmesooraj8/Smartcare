import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Helper: Decode JWT manually to recover user data
function parseJwt (token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'patient' | 'doctor' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // 1. LOAD FROM STORAGE ON STARTUP
  useEffect(() => {
    const token = localStorage.getItem('smartcare_token');
    // Support demo token stored by demo fallback (no real JWT)
    if (token && token.includes('demo')) {
      const demoUser: User = { id: 'demo-user', email: 'demo@smartcare.app', name: 'Demo User', role: 'patient' };
      setUser(demoUser);
      setIsLoading(false);
      return;
    }
    if (token) {
      try {
        const decoded = parseJwt(token);
        if (decoded && decoded.sub) {
          setUser({ 
            id: decoded.sub, 
            email: decoded.email || 'user@smartcare.app', 
            role: (decoded.role as any) || 'patient' 
          });
        }
      } catch (e) {
        localStorage.removeItem('smartcare_token');
      }
    }
    setIsLoading(false);
  }, []);

  // 2. LOGIN & SAVE TO STORAGE
  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ access_token: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });

      if (res.access_token) {
        localStorage.setItem('smartcare_token', res.access_token);
        
        const decoded = parseJwt(res.access_token);
        setUser({ 
          id: decoded?.sub || '1', 
          email: email, 
          role: (decoded?.role as any) || 'patient' 
        });
        return;
      }
      throw new Error('No token received');
    } catch (error: any) {
      console.error("Login failed:", error);
      // DEMO fallback for MVP
      if ((email && email.includes('demo')) || pass === 'demo123' || pass === 'password') {
        toast({ title: 'Demo Mode', description: 'Logged in locally as Demo User.' });
        const demoUser: User = { id: 'demo-user', email: email || 'demo@smartcare.app', name: 'Demo User', role: 'patient' };
        setUser(demoUser);
        localStorage.setItem('smartcare_token', 'demo-token-123');
        return;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e) {
      // Simulate success in demo mode
      console.warn('Register failed, simulating demo registration:', e);
      const demoUser: User = { id: 'demo-user', email: data.email || 'demo@smartcare.app', name: data.name || 'Demo User', role: 'patient' };
      setUser(demoUser);
      localStorage.setItem('smartcare_token', 'demo-token-123');
    }
  };

  const logout = () => {
    localStorage.removeItem('smartcare_token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);