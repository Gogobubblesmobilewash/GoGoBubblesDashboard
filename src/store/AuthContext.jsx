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

      // Check if user is support
      if (userEmail.includes('support')) {
        console.log('AuthContext: User is support based on email');
        setUserRole({ 
          type: 'SUPPORT', 
          permissions: [
            'view_all_jobs',
            'message_bubblers',
            'mark_jobs_complete',
            'handle_reschedules',
            'view_ratings',
            'track_standby_queue',
            'view_contact_info'
          ], 
          restrictions: [
            'no_financial_data',
            'no_payout_info',
            'no_revenue_data',
            'no_deposit_info',
            'no_stripe_data',
            'no_payment_history',
            'no_earnings_data',
            'no_operating_margins',
            'no_owner_notes',
            'no_sales_reports',
            'no_admin_data'
          ]
        });
        return;
      }

      // Check if user is finance
      if (userEmail.includes('finance') || userEmail.includes('accounting') || userEmail.includes('cpa')) {
        console.log('AuthContext: User is finance based on email');
        setUserRole({ 
          type: 'FINANCE', 
          permissions: [
            'view_revenue',
            'view_deposits',
            'view_stripe_reports',
            'view_payout_history',
            'view_taxable_sales',
            'export_reports'
          ], 
          restrictions: [
            'no_job_assignment',
            'no_customer_access',
            'no_logistics_access'
          ]
        });
        return;
      }

      // Check if user is recruiter/HR
      if (userEmail.includes('recruiter') || userEmail.includes('hr') || userEmail.includes('hiring')) {
        console.log('AuthContext: User is recruiter based on email');
        setUserRole({ 
          type: 'RECRUITER', 
          permissions: [
            'view_applicants',
            'approve_decline_applications',
            'view_disqualifiers',
            'mark_onboarding_status',
            'add_internal_notes',
            'schedule_interviews'
          ], 
          restrictions: [
            'no_job_access',
            'no_revenue_access',
            'no_scheduling_access'
          ]
        });
        return;
      }

      // Check if user is market manager
      if (userEmail.includes('manager') || userEmail.includes('market')) {
        console.log('AuthContext: User is market manager based on email');
        setUserRole({ 
          type: 'MARKET_MANAGER', 
          permissions: [
            'view_local_bookings',
            'view_local_bubblers',
            'view_local_payouts',
            'assign_local_jobs',
            'resolve_local_issues',
            'onboard_local_team',
            'view_local_revenue'
          ], 
          restrictions: [
            'no_other_market_access',
            'no_global_admin_data'
          ]
        });
        return;
      }

      // Check if user is lead bubbler
      if (userEmail.includes('lead') || userEmail.includes('supervisor')) {
        console.log('AuthContext: User is lead bubbler based on email');
        setUserRole({ 
          type: 'LEAD_BUBBLER', 
          permissions: [
            'view_team_jobs',
            'reassign_jobs_with_permission',
            'view_team_logs',
            'check_equipment',
            'message_team'
          ], 
          restrictions: [
            'no_financial_data',
            'no_payout_info',
            'no_revenue_data',
            'no_other_bubbler_payouts',
            'no_admin_data'
          ]
        });
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
    isSupport: userRole?.type === 'SUPPORT',
    isLeadBubbler: userRole?.type === 'LEAD_BUBBLER',
    isFinance: userRole?.type === 'FINANCE',
    isRecruiter: userRole?.type === 'RECRUITER',
    isMarketManager: userRole?.type === 'MARKET_MANAGER',
    isBubbler: userRole?.type && userRole.type !== 'ADMIN' && userRole.type !== 'SUPPORT' && userRole.type !== 'FINANCE' && userRole.type !== 'RECRUITER' && userRole.type !== 'MARKET_MANAGER' && userRole.type !== 'LEAD_BUBBLER' && ['SHINE', 'SPARKLE', 'FRESH', 'ELITE'].includes(userRole.type),
    // Role-specific permissions
    isShineBubbler: userRole?.type === 'SHINE',
    isSparkleBubbler: userRole?.type === 'SPARKLE',
    isFreshBubbler: userRole?.type === 'FRESH',
    isEliteBubbler: userRole?.type === 'ELITE',
    // Permission checks based on role
    canDoLaundry: userRole?.type === 'FRESH' || userRole?.type === 'ELITE',
    canDoCarWash: userRole?.type === 'SHINE' || userRole?.type === 'ELITE',
    canDoHomeCleaning: userRole?.type === 'SPARKLE' || userRole?.type === 'ELITE',
    // Support permissions
    canViewFinancialData: userRole?.type === 'ADMIN' || userRole?.type === 'FINANCE' || userRole?.type === 'MARKET_MANAGER',
    canViewPayouts: userRole?.type === 'ADMIN' || userRole?.type === 'FINANCE' || userRole?.type === 'MARKET_MANAGER',
    canViewRevenue: userRole?.type === 'ADMIN' || userRole?.type === 'FINANCE' || userRole?.type === 'MARKET_MANAGER',
    canViewDeposits: userRole?.type === 'ADMIN' || userRole?.type === 'FINANCE' || userRole?.type === 'MARKET_MANAGER',
    canViewStripeData: userRole?.type === 'ADMIN' || userRole?.type === 'FINANCE',
    canViewPaymentHistory: userRole?.type === 'ADMIN' || userRole?.type === 'FINANCE',
    canViewEarnings: userRole?.type === 'ADMIN' || userRole?.type === 'FINANCE' || userRole?.type === 'MARKET_MANAGER',
    canViewOperatingMargins: userRole?.type === 'ADMIN',
    canViewOwnerNotes: userRole?.type === 'ADMIN',
    canViewSalesReports: userRole?.type === 'ADMIN' || userRole?.type === 'FINANCE',
    canViewAdminData: userRole?.type === 'ADMIN',
    // Job access permissions
    canViewAllJobs: userRole?.type === 'ADMIN' || userRole?.type === 'SUPPORT' || userRole?.type === 'MARKET_MANAGER',
    canViewTeamJobs: userRole?.type === 'LEAD_BUBBLER',
    canViewOwnJobs: userRole?.type === 'BUBBLER' || userRole?.type === 'SHINE' || userRole?.type === 'SPARKLE' || userRole?.type === 'FRESH' || userRole?.type === 'ELITE',
    // Applicant access permissions
    canViewApplicants: userRole?.type === 'ADMIN' || userRole?.type === 'SUPPORT' || userRole?.type === 'RECRUITER' || userRole?.type === 'MARKET_MANAGER',
    canManageApplicants: userRole?.type === 'ADMIN' || userRole?.type === 'RECRUITER' || userRole?.type === 'MARKET_MANAGER',
    // Territory access
    canAccessAllMarkets: userRole?.type === 'ADMIN' || userRole?.type === 'SUPPORT' || userRole?.type === 'FINANCE' || userRole?.type === 'RECRUITER',
    canAccessLocalMarket: userRole?.type === 'MARKET_MANAGER' || userRole?.type === 'LEAD_BUBBLER',
    // Additional role info
    userPermissions: userRole?.permissions || [],
    userServices: userRole?.services || [],
    userRestrictions: userRole?.restrictions || [],
    isUserActive: userRole?.isActive !== false,
  };

  console.log('AuthContext: Current state:', { 
    user: user?.email, 
    userRole: userRole?.type, 
    loading, 
    isAuthenticated: !!user, 
    isAdmin: userRole?.type === 'ADMIN',
    isSupport: userRole?.type === 'SUPPORT',
    isLeadBubbler: userRole?.type === 'LEAD_BUBBLER',
    isFinance: userRole?.type === 'FINANCE',
    isRecruiter: userRole?.type === 'RECRUITER',
    isMarketManager: userRole?.type === 'MARKET_MANAGER',
    isBubbler: userRole?.type && userRole.type !== 'ADMIN' && userRole.type !== 'SUPPORT' && userRole.type !== 'FINANCE' && userRole.type !== 'RECRUITER' && userRole.type !== 'MARKET_MANAGER' && userRole.type !== 'LEAD_BUBBLER' && ['SHINE', 'SPARKLE', 'FRESH', 'ELITE'].includes(userRole.type)
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 