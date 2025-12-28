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
  login: (userData: User, masterKey: CryptoKey | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // On mount, call the server endpoint which returns profile when cookie is present
    (async () => {
      try {
        // Use the shared apiFetch helper so the API version prefix is applied
        const body = await apiFetch({ url: '/auth/me', method: 'GET' }).catch(() => null);
        if (body && body.user) setUser(body.user as User);
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = (userData: User, mk: CryptoKey | null) => {
    // Server must set the HttpOnly cookie; client keeps masterKey in RAM only
    setUser(userData);
    setMasterKey(mk);
  };

  const logout = async () => {
    try {
      await apiFetch({ url: '/auth/logout', method: 'POST' });
    } catch (e) {
      // ignore
    }
    setUser(null);
    setMasterKey(null);
    window.location.href = '/login';
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
