import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  specialization?: string; // For doctors
  department?: string; // For doctors
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock users for demo
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@smartcare.com',
      name: 'Admin User',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '2',
      email: 'dr.smith@smartcare.com',
      name: 'Dr. Sarah Smith',
      role: 'doctor',
      specialization: 'Cardiology',
      department: 'Heart & Vascular',
      phone: '+1 (555) 123-4567',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '3',
      email: 'patient@example.com',
      name: 'John Doe',
      role: 'patient',
      phone: '+1 (555) 987-6543',
      dateOfBirth: '1985-06-15',
      address: '123 Main St, City, ST 12345',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    }
  ];

  useEffect(() => {
    // Check for stored auth on mount
    try {
      const storedUser = localStorage.getItem('smartcare_user');
      if (storedUser) {
        const parsed: User = JSON.parse(storedUser);
        if (parsed && parsed.id && parsed.role) {
          setUser(parsed);
        } else {
          // Cleanup corrupted data
          localStorage.removeItem('smartcare_user');
        }
      }
    } catch (e) {
      // If parsing fails, clear the bad value to avoid crashes
      localStorage.removeItem('smartcare_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role?: UserRole): Promise<boolean> => {
  setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email && (!role || u.role === role));
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('smartcare_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const register = async (email: string, password: string, name: string, role: UserRole): Promise<boolean> => {
  setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    };
    
    setUser(newUser);
    localStorage.setItem('smartcare_user', JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartcare_user');
  };

  const value = {
    user,
    login,
    logout,
    register,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};