import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Safe JWT decoder: decodes base64url payload and handles UTF-8 correctly
function decodeJwtSafe(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Pad base64 string as needed
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary.split('').map((c) => c.charCodeAt(0)));
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text);
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
    const enableDemo = (import.meta as any).env?.VITE_ENABLE_DEMO === 'true';
    const token = sessionStorage.getItem('smartcare_token');
    // Support demo token stored by demo fallback (no real JWT) only when enabled
    if (enableDemo && token && token.includes('demo')) {
      const demoUser: User = { id: 'demo-user', email: 'demo@smartcare.app', name: 'Demo User', role: 'patient' };
      setUser(demoUser);
      setIsLoading(false);
      return;
    }
    if (token) {
      try {
        const decoded = decodeJwtSafe(token);
        if (decoded && decoded.sub) {
          // apply MVP role overrides for specific test emails
          let resolvedRole = (decoded.role as any) || 'patient';
          const decodedEmail = decoded.email || 'user@smartcare.app';
          if (decodedEmail === 'itzmesooraj8@gmail.com') resolvedRole = 'doctor';
          if (decodedEmail === 'soorajs24@dsce.ac.in') resolvedRole = 'admin';
          setUser({
            id: decoded.sub,
            email: decodedEmail,
            role: resolvedRole,
          });
        }
      } catch (e) {
        sessionStorage.removeItem('smartcare_token');
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
        sessionStorage.setItem('smartcare_token', res.access_token);

        const decoded = decodeJwtSafe(res.access_token);
        // apply MVP role overrides for specific test emails (frontend safety net)
        let resolvedRole = (decoded?.role as any) || 'patient';
        if (email === 'itzmesooraj8@gmail.com') resolvedRole = 'doctor';
        if (email === 'soorajs24@dsce.ac.in') resolvedRole = 'admin';
        setUser({
          id: decoded?.sub || '1',
          email: email,
          role: resolvedRole,
        });
        return;
      }
      throw new Error('No token received');
    } catch (error: any) {
      console.error("Login failed:", error);
      // DEMO fallback for MVP only when explicitly enabled
      if ((import.meta as any).env?.VITE_ENABLE_DEMO === 'true' && ((email && email.includes('demo')) || pass === 'demo123' || pass === 'password')) {
        toast({ title: 'Demo Mode', description: 'Logged in locally as Demo User.' });
        const demoUser: User = { id: 'demo-user', email: email || 'demo@smartcare.app', name: 'Demo User', role: 'patient' };
        setUser(demoUser);
        sessionStorage.setItem('smartcare_token', 'demo-token-123');
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
      // Simulate success in demo mode only when enabled
      if ((import.meta as any).env?.VITE_ENABLE_DEMO === 'true') {
        console.warn('Register failed, simulating demo registration (demo enabled):', e);
        const demoUser: User = { id: 'demo-user', email: data.email || 'demo@smartcare.app', name: data.name || 'Demo User', role: 'patient' };
        setUser(demoUser);
        sessionStorage.setItem('smartcare_token', 'demo-token-123');
        return;
      }
      throw e;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('smartcare_token');
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