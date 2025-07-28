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
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log whenever loading changes
    console.log('AuthContext: loading state changed:', loading);
  }, [loading]);

  // Function to fetch user role from database
  const fetchUserRole = async (userEmail) => {
    if (!userEmail) {
      setUserRole(null);
      return;
    }

    try {
      console.log('AuthContext: Fetching role for email:', userEmail);
      
      // Check if user is admin first
      if (userEmail.includes('admin')) {
        console.log('AuthContext: User is admin based on email');
        setUserRole({ type: 'ADMIN', permissions: ['all'] });
        return;
      }

      // Check bubblers table for role
      const { data, error } = await supabase
        .from('bubblers')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user role:', error);
        setUserRole(null);
        return;
      }

      if (data) {
        console.log('AuthContext: Found bubbler role:', data.role);
        setUserRole({
          type: data.role,
          permissions: data.permissions || [],
          services: data.services || [],
          isActive: data.is_active
        });
      } else {
        console.log('AuthContext: No role found for user');
        setUserRole(null);
      }
    } catch (error) {
      console.error('Exception fetching user role:', error);
      setUserRole(null);
    }
  };

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
        
        // Fetch user role if user exists
        if (session?.user) {
          await fetchUserRole(session.user.email);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('AuthContext: Exception getting session:', error);
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change:', event, 'session:', session);
        setUser(session?.user ?? null);
        
        // Fetch user role if user exists
        if (session?.user) {
          await fetchUserRole(session.user.email);
        } else {
          setUserRole(null);
        }
        
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
    userRole,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: userRole?.type === 'ADMIN',
    isBubbler: userRole?.type && userRole.type !== 'ADMIN' && ['SHINE', 'SPARKLE', 'FRESH', 'ELITE'].includes(userRole.type),
    // Role-specific permissions
    isShineBubbler: userRole?.type === 'SHINE',
    isSparkleBubbler: userRole?.type === 'SPARKLE',
    isFreshBubbler: userRole?.type === 'FRESH',
    isEliteBubbler: userRole?.type === 'ELITE',
    // Permission checks based on role
    canDoLaundry: userRole?.type === 'FRESH' || userRole?.type === 'ELITE',
    canDoCarWash: userRole?.type === 'SHINE' || userRole?.type === 'ELITE',
    canDoHomeCleaning: userRole?.type === 'SPARKLE' || userRole?.type === 'ELITE',
    // Additional role info
    userPermissions: userRole?.permissions || [],
    userServices: userRole?.services || [],
    isUserActive: userRole?.isActive !== false,
  };

  console.log('AuthContext: Current state:', { 
    user: user?.email, 
    userRole: userRole?.type, 
    loading, 
    isAuthenticated: !!user, 
    isAdmin: userRole?.type === 'ADMIN',
    isBubbler: userRole?.type && userRole.type !== 'ADMIN' && ['SHINE', 'SPARKLE', 'FRESH', 'ELITE'].includes(userRole.type)
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 