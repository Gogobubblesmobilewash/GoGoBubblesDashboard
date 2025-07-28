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

// Support Role Definition
export const SUPPORT_ROLE = {
  name: 'Support Representative',
  permissions: [
    'view_orders',
    'view_jobs', 
    'view_bubblers',
    'view_applications',
    'view_equipment',
    'view_messages',
    'view_ratings',
    'view_activity',
    'view_customer_data',
    'view_analytics',
    'view_reports'
  ],
  restrictions: [
    'no_financial_data',
    'no_payout_info',
    'no_revenue_data',
    'no_deposit_info'
  ]
};

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