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

  // 1. LOAD FROM STORAGE ON STARTUP (The Fix)
  useEffect(() => {
    const token = localStorage.getItem('smartcare_token');
    if (token) {
      try {
        const decoded = parseJwt(token);
        if (decoded && decoded.sub) {
          setUser({ 
            id: decoded.sub, 
            email: 'user@smartcare.app', 
            role: 'patient' 
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
        // PERMANENT STORAGE
        localStorage.setItem('smartcare_token', res.access_token);
        
        const decoded = parseJwt(res.access_token);
        setUser({ 
          id: decoded?.sub || '1', 
          email: email, 
          role: 'patient' 
        });
        return;
      }
      throw new Error('No token received');
    } catch (error: any) {
      console.error("Login failed:", error);
      toast?.({ title: 'Login failed', description: error?.message || String(error), variant: 'destructive' });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
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
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
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
  register: (payload: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smartcare_token');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.sub) {
        setUser({ id: decoded.sub, email: decoded.email || '', role: (decoded.role as any) || 'patient' });
      } else {
        localStorage.removeItem('smartcare_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const payload = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      const token = (payload as any).access_token || (payload as any).accessToken || null;
      if (!token) throw new Error('No token');
      localStorage.setItem('smartcare_token', token);
      const decoded = parseJwt(token);
      setUser({ id: decoded?.sub || '0', email: email, role: (decoded?.role as any) || 'patient' });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    await apiFetch('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  };

  const logout = () => {
    localStorage.removeItem('smartcare_token');
    setUser(null);
    try {
      void fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    window.location.href = '/login';
  };

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Simple JWT decoder to get user ID without external libraries
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

  // 1. Check for existing session on load
  useEffect(() => {
    const token = localStorage.getItem('smartcare_token');
    if (token) {
      try {
        const decoded = parseJwt(token);
        if (decoded && decoded.sub) {
          // Restore user from token
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

  // 2. Login Function
  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      // Call your REAL backend
      const res = await apiFetch<{ access_token: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });

      if (res.access_token) {
        // SAVE TOKEN (Crucial Step)
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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Register Function
  const register = async (data: any) => {
    // Just pass through to API, login handles the session later
    await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
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