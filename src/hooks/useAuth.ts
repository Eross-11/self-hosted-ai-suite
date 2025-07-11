import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

// Define User interface
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

// Define LoginCredentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) throw error;

      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }
      
      setUser({
        id: data.user.id,
        email: data.user.email!,
        name: profileData?.name || null,
        avatar_url: profileData?.avatar_url || null
      });

      setSession(data.session);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut().then(() => {
      setUser(null);
      setSession(null);
      setError(null);
    });
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        setUser(null);
        setSession(null);
        setIsLoading(false);
        return;
      }
      
      setSession(data.session);
      
      // Get user profile data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', userData.user.id)
        .maybeSingle();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      // Check if name column exists in the profile
      const profileName = profileData?.name !== undefined ? profileData?.name : null;
      
      setUser({
        id: userData.user.id,
        email: userData.user.email!,
        name: profileName,
        avatar_url: profileData?.avatar_url || null
      });
    } catch (err) {
      console.error('Auth status check error:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (event === 'SIGNED_IN' && session) {
          // Get user profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }

          // Check if name column exists in the profile
          const profileName = profileData?.name !== undefined ? profileData?.name : null;
          
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profileName,
            avatar_url: profileData?.avatar_url || null
          });
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    
    if (!email || !password) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) throw error;
      
      // Create profile record
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                user_id: data.user.id,
                name
              }
            ]);
            
          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        } catch (profileErr) {
          console.error('Error creating profile:', profileErr);
          // Don't fail the registration if profile creation fails
        }
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Omit<User, 'id' | 'email'>>) => {
    if (!user) {
      setError('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  }, [user]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const canWrite = useCallback(() => {
    return !!user;
  }, [user]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!session && !!user,
    login,
    logout,
    register,
    updateProfile,
    resetPassword,
    canWrite,
    clearError: () => setError(null),
    session
  };
}
