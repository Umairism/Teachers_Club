import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
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

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
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
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<boolean> => {
    try {
      // Define invite codes and their corresponding roles
      const inviteCodes = {
        'ADMIN2025': 'admin' as const,
        'TEACHER2025': 'teacher' as const,
        'STUDENT2025': 'student' as const,
        'MODERATOR2025': 'moderator' as const
      };

      // Validate invite code
      if (!(userData.inviteCode in inviteCodes)) {
        return false;
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(userData.email);
      if (existingUser) {
        return false;
      }

      // Determine role based on invite code
      const role = inviteCodes[userData.inviteCode as keyof typeof inviteCodes];

      // Create new user
      const newUser = await db.createUser({
        email: userData.email,
        name: userData.name,
        role: role,
        bio: '',
        school: 'Teachers Club Academy'
      });

      setUser(newUser);
      localStorage.setItem('benchmark_user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('benchmark_user');
  }, []);

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

