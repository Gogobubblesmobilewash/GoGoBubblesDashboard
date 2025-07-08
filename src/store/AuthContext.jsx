import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log whenever loading changes
    console.log('AuthContext: loading state changed:', loading);
  }, [loading]);

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      try {
        console.log('AuthContext: Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthContext: Error getting session:', error);
        }
        console.log('AuthContext: Session data:', session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('AuthContext: Exception getting session:', error);
        setUser(null);
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change:', event, 'session:', session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('AuthContext: Login successful:', data);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Attempting logout...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      console.log('AuthContext: Logout successful');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.email?.includes('admin') || false,
  };

  console.log('AuthContext: Current state:', { user, loading, isAuthenticated: !!user, isAdmin: user?.email?.includes('admin') || false });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 