import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase config check:');
console.log('VITE_SUPABASE_URL exists:', !!supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
console.log('VITE_SUPABASE_URL length:', supabaseUrl?.length);
console.log('VITE_SUPABASE_ANON_KEY length:', supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase client created successfully');

// Mock data for development (can be removed once Supabase is fully integrated)
export const mockData = {
  bubblers: [
    {
      id: 1,
      name: 'John Smith',
      email: 'john@gogobubbles.com',
      phone: '+1 (555) 123-4567',
      status: 'active',
      rating: 4.8,
      totalJobs: 45,
      earnings: 1250.00
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@gogobubbles.com',
      phone: '+1 (555) 234-5678',
      status: 'active',
      rating: 4.9,
      totalJobs: 52,
      earnings: 1400.00
    }
  ]
};

// Service configuration and rules (moved from constants.js for now)
export const SERVICE_CONFIG = {
  'Mobile Car Wash': {
    tiers: ['Express Shine', 'Signature Shine', 'Supreme Shine'],
    vehicleTypes: ['Car', 'SUV', 'Truck', 'Minivan'],
    addons: [
      'Clay Bar Treatment',
      'Bug & Tar Removal', 
      'Plastic Trim Restoration',
      'Upholstery Shampoo',
      'Interior Shampoo'
    ],
    maxVehiclesPerOrder: 3,
    perks: {
      'Express Shine': { firstTime: 'Free Car Freshener' },
      'Signature Shine': { always: 'Free Car Freshener' },
      'Supreme Shine': { always: 'Free Car Freshener' }
    },
    photoRequired: ['Interior Shampoo', 'Upholstery Shampoo']
  },
  'Home Cleaning': {
    tiers: ['Refresh Clean', 'Signature Deep Clean'],
    addons: [
      'Deep Dusting',
      'Deep Clean Bedroom',
      'Refrigerator Cleaning',
      'Oven Cleaning',
      'Freezer Cleaning',
      'Carpet Cleaning',
      'Steam Mopping'
    ],
    perks: {
      'Signature Deep Clean': { always: 'Free Candle' },
      'Refresh Clean': { everyThird: 'Free Candle' }
    },
    photoRequired: ['Signature Deep Clean']
  },
  'Laundry Service': {
    bagTypes: ['Essentials Bag', 'Family Bag', 'Delicates Bag', 'Ironing Bag'],
    addons: [
      'Eco-friendly detergent',
      'Same-day service'
    ],
    alwaysGrouped: true, // Laundry is always one job regardless of bag count
    photoRequired: ['pickup', 'delivery'], // Always requires 2 photos
    perks: {} // No perks for laundry
  }
};

// Helper function to determine if a service requires photos
export const getPhotoRequirements = (serviceType, tier, addons = []) => {
  const config = SERVICE_CONFIG[serviceType];
  if (!config) return [];
  
  const requirements = [];
  
  // Check service-specific photo requirements
  if (config.photoRequired) {
    if (Array.isArray(config.photoRequired)) {
      requirements.push(...config.photoRequired);
    } else if (typeof config.photoRequired === 'string') {
      requirements.push(config.photoRequired);
    }
  }
  
  // Check addon-specific photo requirements
  if (addons && addons.length > 0) {
    addons.forEach(addon => {
      if (config.photoRequired && config.photoRequired.includes(addon)) {
        requirements.push(addon);
      }
    });
  }
  
  return requirements;
};

// Helper function to determine perks for a service
export const getPerks = (serviceType, tier, isFirstTime = false, signatureWashCount = 0, refreshCleanCount = 0, customerEmail = null) => {
  const perks = [];
  
  // Mobile Car Wash Perks
  if (serviceType === 'Mobile Car Wash') {
    // First-time car wash customers get free air freshener regardless of tier
    if (isFirstTime) {
      perks.push('Free air freshener (First-time customer)');
    }
    
    // Signature and Supreme tiers get free air freshener
    if (tier === 'Signature Shine' || tier === 'Supreme Shine') {
      perks.push('Free air freshener');
    }
    
    // Every 3rd Signature wash within a year gets free tire shine
    if (tier === 'Signature Shine' && signatureWashCount > 0 && signatureWashCount % 3 === 0) {
      perks.push('Free tire shine (Every 3rd Signature wash)');
    }
  }
  
  // Home Cleaning Perks
  if (serviceType === 'Home Cleaning') {
    // Every Signature Deep Clean gets a free candle
    if (tier === 'Signature Deep Clean') {
      perks.push('Free candle');
    }
    
    // Every 3rd Refresh Clean within a year gets a free candle
    if (tier === 'Refresh Clean' && refreshCleanCount > 0 && refreshCleanCount % 3 === 0) {
      perks.push('Free candle (Every 3rd Refresh Clean)');
    }
  }
  
  // Laundry Service Perks (no specific perks mentioned, but keeping structure)
  if (serviceType === 'Laundry Service') {
    // Could add laundry-specific perks in the future
  }
  
  return perks;
};

// Helper function to calculate payout rules
export const getPayoutRules = (serviceType, tier, addons = []) => {
  const basePayouts = {
    'Mobile Car Wash': {
      'Express Wash': 12,
      'Signature Shine': 18,
      'Supreme Shine': 25,
      default: 12
    },
    'Home Cleaning': {
      'Refresh Clean': 20,
      'Signature Deep Clean': 30,
      'Supreme Deep Clean': 45,
      default: 20
    },
    'Laundry Service': {
      'Fresh & Fold': 15,
      'Signature Care': 25,
      'Supreme Care': 35,
      default: 15
    }
  };

  const addonPayouts = {
    'Tire Shine': 4,
    'Interior Detail': 8,
    'Premium Detailing': 12,
    'Deep Cleaning': 10,
    'Premium Care': 8,
    'Express Service': 5
  };

  const base = basePayouts[serviceType]?.[tier] || basePayouts[serviceType]?.default || 0;
  const addonTotal = addons.reduce((sum, addon) => sum + (addonPayouts[addon] || 0), 0);

  return {
    total: base + addonTotal,
    base: base,
    addons: addons.map(addon => ({ addon, payout: addonPayouts[addon] || 0 })),
    breakdown: {
      base: base,
      addons: addonTotal
    }
  };
};

// Weekly payout balance functions
export const getWeeklyPayoutBalance = async (bubblerId) => {
  try {
    // Get the current week's start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Get completed jobs for this week
    const { data: jobs, error } = await supabase
      .from('job_assignments')
      .select(`
        *,
        orders!inner(
          service_type,
          tier,
          addons,
          status
        )
      `)
      .eq('bubbler_id', bubblerId)
      .eq('orders.status', 'completed')
      .gte('created_at', weekStart.toISOString());

    if (error) throw error;

    // Calculate total payout for the week
    let weeklyPayout = 0;
    const jobBreakdown = [];

    jobs.forEach(job => {
      const order = job.orders;
      const payoutRules = getPayoutRules(
        order.service_type,
        order.tier,
        order.addons || []
      );
      
      weeklyPayout += payoutRules.total;
      jobBreakdown.push({
        jobId: job.id,
        orderId: order.id,
        serviceType: order.service_type,
        tier: order.tier,
        addons: order.addons || [],
        payout: payoutRules.total,
        completedAt: job.updated_at
      });
    });

    return {
      weeklyPayout,
      jobCount: jobs.length,
      weekStart: weekStart.toISOString(),
      jobBreakdown
    };
  } catch (error) {
    console.error('Error calculating weekly payout:', error);
    throw error;
  }
};

export const getAllBubblersWeeklyPayouts = async () => {
  try {
    const { data: bubblers, error: bubblersError } = await supabase
      .from('bubblers')
      .select('id, name, email, role');

    if (bubblersError) throw bubblersError;

    const payouts = await Promise.all(
      bubblers.map(async (bubbler) => {
        try {
          const weeklyPayout = await getWeeklyPayoutBalance(bubbler.id);
          return {
            ...bubbler,
            weeklyPayout: weeklyPayout.weeklyPayout,
            jobCount: weeklyPayout.jobCount
          };
        } catch (error) {
          console.error(`Error getting payout for bubbler ${bubbler.id}:`, error);
          return {
            ...bubbler,
            weeklyPayout: 0,
            jobCount: 0
          };
        }
      })
    );

    return payouts;
  } catch (error) {
    console.error('Error getting all bubblers weekly payouts:', error);
    throw error;
  }
};

export const getPayoutHistory = async (bubblerId, limit = 10) => {
  try {
    const { data: payouts, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('bubbler_id', bubblerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return payouts || [];
  } catch (error) {
    console.error('Error getting payout history:', error);
    throw error;
  }
};

export const createPayoutRecord = async (bubblerId, amount, periodStart, periodEnd, jobIds) => {
  try {
    const { data, error } = await supabase
      .from('payouts')
      .insert([{
        bubbler_id: bubblerId,
        amount: amount,
        period_start: periodStart,
        period_end: periodEnd,
        job_ids: jobIds,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating payout record:', error);
    throw error;
  }
};

export const updatePayoutStatus = async (payoutId, status, processedAt = null) => {
  try {
    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (processedAt) {
      updateData.processed_at = processedAt;
    }

    const { data, error } = await supabase
      .from('payouts')
      .update(updateData)
      .eq('id', payoutId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating payout status:', error);
    throw error;
  }
};

// Helper function to parse services and determine splitting rules
export const parseServicesForSplitting = (servicesJson) => {
  if (!servicesJson) return [];
  
  try {
    const services = JSON.parse(servicesJson);
    if (!Array.isArray(services)) return [];
    
    const parsedServices = [];
    let laundryServices = [];
    
    services.forEach((service, index) => {
      const serviceName = service.service || 'Unknown Service';
      const tier = service.tier || '';
      const addons = service.addons || [];
      const vehicleType = service.vehicleType || '';
      const bagType = service.bagType || '';
      const quantity = service.quantity || 1;
      
      // Group laundry services together
      if (serviceName === 'Laundry Service') {
        laundryServices.push({
          service: serviceName,
          tier,
          addons,
          bagType,
          quantity,
          originalIndex: index
        });
      } else {
        // Other services get their own job
        parsedServices.push({
          service: serviceName,
          tier,
          addons,
          vehicleType,
          quantity,
          originalIndex: index
        });
      }
    });
    
    // Add grouped laundry as one service if any exist
    if (laundryServices.length > 0) {
      parsedServices.push({
        service: 'Laundry Service',
        tier: laundryServices[0].tier,
        addons: [...new Set(laundryServices.flatMap(s => s.addons))], // Unique addons
        bagTypes: laundryServices.map(s => ({ type: s.bagType, quantity: s.quantity })),
        totalBags: laundryServices.reduce((sum, s) => sum + s.quantity, 0),
        originalIndexes: laundryServices.map(s => s.originalIndex)
      });
    }
    
    return parsedServices;
  } catch (error) {
    console.error('Error parsing services JSON:', error);
    return [];
  }
};

// Helper function to generate unique IDs
export const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORDER-${timestamp}${random}`;
};

export const generateJobId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `JOB-${timestamp}${random}`;
};

// Fetch all bubblers with travel preferences
export const fetchBubblersWithTravelPrefs = async () => {
  const { data, error } = await supabase
    .from('bubblers')
    .select('id, name, email, phone, home_location, preferred_travel_minutes, preferred_travel_type, is_active, travel_badge');
  if (error) throw error;
  return data || [];
}; 