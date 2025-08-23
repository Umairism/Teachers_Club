import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '../types';
import { db } from '../lib/database';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  inviteCode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('benchmark_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const foundUser = await db.getUserByEmail(email);
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('benchmark_user', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Validate invite code
      if (userData.inviteCode !== 'BENCHMARK2025') {
        return false;
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(userData.email);
      if (existingUser) {
        return false;
      }

      // Create new user
      const newUser = await db.createUser({
        email: userData.email,
        name: userData.name,
        role: 'user'
      });

      setUser(newUser);
      localStorage.setItem('benchmark_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('benchmark_user');
  };

  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
