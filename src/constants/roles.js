// Bubbler Role Definitions
export const BUBBLER_ROLES = {
  SHINE: {
    name: 'Shine Bubbler',
    services: ['Mobile Car Wash'],
    permissions: ['car_wash', 'photo_upload'],
    qrScanner: false
  },
  SPARKLE: {
    name: 'Sparkle Bubbler', 
    services: ['Home Cleaning'],
    permissions: ['home_cleaning', 'photo_upload'],
    qrScanner: false
  },
  FRESH: {
    name: 'Fresh Bubbler',
    services: ['Laundry Service'],
    permissions: ['laundry', 'photo_upload', 'qr_scanner'],
    qrScanner: true
  },
  ELITE: {
    name: 'Elite Bubbler',
    services: ['Mobile Car Wash', 'Home Cleaning', 'Laundry Service'],
    permissions: ['car_wash', 'home_cleaning', 'laundry', 'photo_upload', 'qr_scanner'],
    qrScanner: true
  }
};

// Comprehensive Role Definitions
export const SYSTEM_ROLES = {
  ADMIN: {
    name: 'Admin',
    permissions: ['all'],
    access: {
      jobs: 'all',
      financials: 'full',
      applicants: 'full',
      messaging: 'all',
      territory: 'all_markets',
      users: 'all',
      settings: 'all'
    },
    restrictions: []
  },
  SUPPORT: {
    name: 'Support',
    permissions: [
      'view_all_jobs',
      'message_bubblers',
      'mark_jobs_complete',
      'handle_reschedules',
      'view_ratings',
      'track_standby_queue',
      'view_contact_info'
    ],
    access: {
      jobs: 'all',
      financials: 'none',
      applicants: 'view_only',
      messaging: 'all',
      territory: 'all_markets',
      users: 'view_only',
      settings: 'none'
    },
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
  },
  LEAD_BUBBLER: {
    name: 'Lead Bubbler',
    permissions: [
      'view_team_jobs',
      'reassign_jobs_with_permission',
      'view_team_logs',
      'check_equipment',
      'message_team'
    ],
    access: {
      jobs: 'team_only',
      financials: 'none',
      applicants: 'none',
      messaging: 'team',
      territory: 'assigned_only',
      users: 'team_only',
      settings: 'none'
    },
    restrictions: [
      'no_financial_data',
      'no_payout_info',
      'no_revenue_data',
      'no_other_bubbler_payouts',
      'no_admin_data'
    ]
  },
  BUBBLER: {
    name: 'Bubbler',
    permissions: [
      'view_own_assignments',
      'view_own_ratings',
      'view_own_payouts',
      'view_assigned_equipment',
      'message_center',
      'clock_in_out',
      'task_completion'
    ],
    access: {
      jobs: 'self_only',
      financials: 'self_only',
      applicants: 'none',
      messaging: 'optional',
      territory: 'assigned_only',
      users: 'none',
      settings: 'none'
    },
    restrictions: [
      'no_other_bubbler_data',
      'no_admin_data',
      'no_applicant_data'
    ]
  },
  FINANCE: {
    name: 'Finance',
    permissions: [
      'view_revenue',
      'view_deposits',
      'view_stripe_reports',
      'view_payout_history',
      'view_taxable_sales',
      'export_reports'
    ],
    access: {
      jobs: 'none',
      financials: 'full',
      applicants: 'none',
      messaging: 'none',
      territory: 'all_markets',
      users: 'none',
      settings: 'none'
    },
    restrictions: [
      'no_job_assignment',
      'no_customer_access',
      'no_logistics_access'
    ]
  },
  RECRUITER: {
    name: 'Recruiter/HR',
    permissions: [
      'view_applicants',
      'approve_decline_applications',
      'view_disqualifiers',
      'mark_onboarding_status',
      'add_internal_notes',
      'schedule_interviews'
    ],
    access: {
      jobs: 'none',
      financials: 'none',
      applicants: 'full',
      messaging: 'none',
      territory: 'all_markets',
      users: 'applicants_only',
      settings: 'none'
    },
    restrictions: [
      'no_job_access',
      'no_revenue_access',
      'no_scheduling_access'
    ]
  },
  MARKET_MANAGER: {
    name: 'Market Manager',
    permissions: [
      'view_local_bookings',
      'view_local_bubblers',
      'view_local_payouts',
      'assign_local_jobs',
      'resolve_local_issues',
      'onboard_local_team',
      'view_local_revenue'
    ],
    access: {
      jobs: 'local_only',
      financials: 'local_only',
      applicants: 'local_only',
      messaging: 'local',
      territory: 'assigned_only',
      users: 'local_only',
      settings: 'local_only'
    },
    restrictions: [
      'no_other_market_access',
      'no_global_admin_data'
    ]
  }
};

// Support Role Definition (legacy - now part of SYSTEM_ROLES)
export const SUPPORT_ROLE = SYSTEM_ROLES.SUPPORT;

// Helper function to get role from email
export const getRoleFromEmail = (email) => {
  if (!email) return null;
  
  const emailLower = email.toLowerCase();
  
  if (emailLower.includes('elite')) return BUBBLER_ROLES.ELITE;
  if (emailLower.includes('shine')) return BUBBLER_ROLES.SHINE;
  if (emailLower.includes('sparkle')) return BUBBLER_ROLES.SPARKLE;
  if (emailLower.includes('fresh')) return BUBBLER_ROLES.FRESH;
  
  return null;
};

// Helper function to check if user has permission
export const hasPermission = (user, permission) => {
  const role = getRoleFromEmail(user?.email);
  return role?.permissions?.includes(permission) || false;
};

// Helper function to check if user can do service
export const canDoService = (user, service) => {
  const role = getRoleFromEmail(user?.email);
  return role?.services?.includes(service) || false;
};

// Helper function to get photo requirements for a job
export const getPhotoRequirements = (user, service, status) => {
  const role = getRoleFromEmail(user?.email);
  if (!role || !role.photoRequirements[service]) return [];
  
  const requirements = role.photoRequirements[service];
  
  // Filter based on status
  if (service === 'Laundry Service') {
    if (status === 'en_route_to_pickup' || status === 'picked_up') {
      return requirements.filter(req => req === 'pickup');
    }
    if (status === 'en_route_to_deliver' || status === 'delivered') {
      return requirements.filter(req => req === 'delivery');
    }
  } else if (status === 'completed') {
    return requirements.filter(req => req === 'perk_delivery');
  }
  
  return [];
};

// Helper function to check if user needs QR scanner
export const needsQrScanner = (user) => {
  const role = getRoleFromEmail(user?.email);
  return role?.qrScanner || false;
}; 