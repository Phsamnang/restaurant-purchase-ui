'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  username: string;
  role: 'manager' | 'staff' | 'service' | 'chef' | 'receiver' | 'admin';
  restaurantId: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password?: string, customRole?: User['role'], customName?: string) => Promise<void>;
  register: (name: string, username: string, password: string, customRole?: User['role']) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password = '', customRole?: User['role'], customName?: string) => {
    let assignedRole: User['role'] = customRole || 'staff';
    let assignedName = customName || username || 'Kitchen Staff';

    if (!customRole) {
      const lower = username.toLowerCase();
      if (lower.includes('manager') || lower.includes('admin') || lower.includes('alex')) {
        assignedRole = 'manager';
        assignedName = 'Manager Alex';
      } else if (lower.includes('service') || lower.includes('foh') || lower.includes('bar') || lower.includes('sophea')) {
        assignedRole = 'service';
        assignedName = 'Sophea Bar (Service Lead)';
      } else {
        assignedRole = 'staff';
        assignedName = 'Chef John (Kitchen Lead)';
      }
    }

    const mockUser: User = {
      id: `user-${Date.now()}`,
      name: assignedName,
      username,
      role: assignedRole,
      restaurantId: 'rest-1',
    };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const register = async (name: string, username: string, password: string, customRole: User['role'] = 'staff') => {
    const mockUser: User = {
      id: `user-${Date.now()}`,
      name,
      username,
      role: customRole,
      restaurantId: 'rest-1',
    };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
