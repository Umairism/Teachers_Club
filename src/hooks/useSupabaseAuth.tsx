import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseDb } from '../lib/supabase-db';
import type { User } from '../types';
import { Session } from '@supabase/supabase-js';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  inviteCode: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session: Session | null) => {
    if (session?.user) {
      try {
        // Get user profile from our users table
        const userProfile = await supabaseDb.getUserById(session.user.id);
        if (userProfile) {
          setUser(userProfile);
        } else {
          // If user doesn't exist in our users table, create them
          const newUser = await supabaseDb.createUser({
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'User',
            role: 'student',
            isActive: true,
            profilePictureUrl: null,
            bio: null
          });
          setUser(newUser);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      return true;
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

      const role = inviteCodes[userData.inviteCode as keyof typeof inviteCodes];

      // First create the Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: role
          }
        }
      });

      if (authError) {
        console.error('Auth registration error:', authError);
        return false;
      }

      if (authData.user) {
        // Create user profile in our users table with the same ID
        try {
          const { data, error } = await supabase
            .from('users')
            .insert([{
              id: authData.user.id,
              email: userData.email,
              name: userData.name,
              role: role,
              is_active: true
            }])
            .select()
            .single();

          if (error) {
            console.error('Database user creation error:', error);
            return false;
          }
        } catch (dbError) {
          console.error('Database user creation error:', dbError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
