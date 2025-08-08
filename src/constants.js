// Job Statuses - Updated with proper flow
export const JOB_STATUSES = [
  'pending',
  'assigned',
  'denied',
  'reassign',
  'accepted',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
];

// Laundry-specific statuses for flexible processing times
export const LAUNDRY_STATUSES = [
  'pending',
  'assigned',
  'denied',
  'reassign',
  'accepted',
  'en_route_to_pickup',
  'arrived_at_pickup',
  'picked_up',
  'in_wash',
  'in_dry',
  'folding_ironing',
  'en_route_to_deliver',
  'arrived_at_delivery',
  'delivered',
  'completed',
  'cancelled',
  'no_show',
];

// Laundry service tiers with processing times
export const LAUNDRY_SERVICE_TIERS = {
  'Standard Service': {
    processingHours: 36,
    description: 'Standard 36-hour processing time',
    visible: true
  },
  'Express Service': {
    processingHours: 24,
    description: 'Express 24-hour processing time',
    visible: true
  },
  'Same Day Service': {
    processingHours: 8,
    description: 'Same-day processing (8 hours)',
    visible: false, // Hidden for launch, admin-only
    displayName: 'Express Service' // For consistency
  },
  'Rush Service': {
    processingHours: 4,
    description: 'Rush processing (4 hours)',
    visible: false // Hidden for launch, admin-only
  }
};

// Service Types
export const SERVICE_TYPES = [
  'Mobile Car Wash',
  'Home Cleaning',
  'Laundry Service',
];

// Car Wash Tiers
export const CAR_WASH_TIERS = [
  'Express Shine',
  'Signature Shine',
  'Supreme Shine',
];

// Car Wash Add-ons
export const CAR_WASH_ADDONS = [
  'Clay Bar Treatment',
  'Bug & Tar Removal',
  'Plastic Trim Restoration',
  'Upholstery Shampoo',
  'Interior Shampoo',
  'Eco-Friendly Cleaning',
];

// Home cleaning tiers
export const HOME_CLEANING_TIERS = [
  'Refresh Clean',
  'Signature Deep Clean',
];

// Home Cleaning Add-ons
export const HOME_CLEAN_ADDONS = [
  'Deep Dusting',
  'Deep Clean Bedroom',
  'Fridge Cleaning',
  'Oven Cleaning',
  'Freezer Cleaning',
  'Cabinet Cleaning',
  'Steam Mopping',
  'Clean Kitchen',
  'Stove Top Cleaning',
  'Eco-Friendly Cleaning',
];

// Laundry Bag Types
export const LAUNDRY_BAG_TYPES = [
  'Essentials Bag',
  'Family Bag',
  'Delicates Bag',
  'Ironing Bag',
];

// Laundry Add-ons
export const LAUNDRY_ADDONS = [
  'Eco-friendly detergent',
  'Express Service - 24 hours',
];

// Unified arrays for compatibility
export const TIERS = [...CAR_WASH_TIERS, ...HOME_CLEANING_TIERS];
export const ADDONS = [...CAR_WASH_ADDONS, ...HOME_CLEAN_ADDONS, ...LAUNDRY_ADDONS];
export const BAG_TYPES = LAUNDRY_BAG_TYPES;

// Photo Requirements Function
export const getPhotoRequirements = (serviceType, tier, addons) => {
  const requirements = [];
  
  if (serviceType === 'Mobile Car Wash') {
    // Express Shine: Before and after exterior photos only
    if (tier === 'Express Shine') {
      requirements.push('Before photo of vehicle exterior');
      requirements.push('After photo of vehicle exterior');
    }
    
    // Signature Shine and Supreme Shine: Same comprehensive photo requirements
    if (tier === 'Signature Shine' || tier === 'Supreme Shine') {
      requirements.push('Before photo of vehicle');
      requirements.push('After photo of vehicle');
      requirements.push('Interior before photo');
      requirements.push('Interior after photo');
    }
  }
  
  if (serviceType === 'Home Cleaning') {
    requirements.push('Before photo of main areas');
    requirements.push('After photo of main areas');
    
    if (addons && addons.includes('Deep Clean Bedroom')) {
      requirements.push('Bedroom before photo');
      requirements.push('Bedroom after photo');
    }
    
    // Add photo requirements for specific add-ons
    if (addons) {
      if (addons.includes('Refrigerator Cleaning')) {
        requirements.push('Refrigerator before photo');
        requirements.push('Refrigerator after photo');
      }
      if (addons.includes('Oven Cleaning')) {
        requirements.push('Oven before photo');
        requirements.push('Oven after photo');
      }
      if (addons.includes('Freezer Cleaning')) {
        requirements.push('Freezer before photo');
        requirements.push('Freezer after photo');
      }
      if (addons.includes('Cabinet Cleaning')) {
        requirements.push('Cabinet before photo');
        requirements.push('Cabinet after photo');
      }
    }
  }
  
  if (serviceType === 'Laundry Service') {
    requirements.push('Before photo of laundry');
    requirements.push('After photo of laundry');
  }
  
  return requirements;
};

// Payout Rules Function
export const getPayoutRules = (serviceType, tier, addons) => {
  let base = 0;
  const addonPayouts = [];
  
  if (serviceType === 'Mobile Car Wash') {
    switch (tier) {
      case 'Express Shine':
        base = 25;
        break;
      case 'Signature Shine':
        base = 35;
        break;
      case 'Supreme Shine':
        base = 45;
        break;
      default:
        base = 25;
    }
    
    if (addons) {
      addons.forEach(addon => {
        switch (addon) {
          case 'Clay Bar Treatment':
            addonPayouts.push(15);
            break;
          case 'Bug & Tar Removal':
            addonPayouts.push(10);
            break;
          case 'Plastic Trim Restoration':
            addonPayouts.push(8);
            break;
          case 'Upholstery Shampoo':
            addonPayouts.push(12);
            break;
          case 'Interior Shampoo':
            addonPayouts.push(15);
            break;
          case 'Eco-Friendly Cleaning':
            addonPayouts.push(5);
            break;
        }
      });
    }
  }
  
  if (serviceType === 'Home Cleaning') {
    switch (tier) {
      case 'Refresh Clean':
        base = 40;
        break;
      case 'Signature Deep Clean':
        base = 60;
        break;
      default:
        base = 40;
    }
    
    if (addons) {
      addons.forEach(addon => {
        switch (addon) {
          case 'Deep Dusting':
            addonPayouts.push(10);
            break;
          case 'Deep Clean Bedroom':
            addonPayouts.push(15);
            break;
          case 'Fridge Cleaning':
            addonPayouts.push(12);
            break;
          case 'Oven Cleaning':
            addonPayouts.push(15);
            break;
          case 'Freezer Cleaning':
            addonPayouts.push(8);
            break;
          case 'Cabinet Cleaning':
            addonPayouts.push(10);
            break;
          case 'Steam Mopping':
            addonPayouts.push(8);
            break;
          // New add-on payouts
          case 'Clean Kitchen':
            addonPayouts.push(12);
            break;
          case 'Stove Top Cleaning':
            addonPayouts.push(6);
            break;
          case 'Eco-Friendly Cleaning':
            addonPayouts.push(5);
            break;
        }
      });
    }
  }
  
  if (serviceType === 'Laundry Service') {
    base = 30;
    
    if (addons) {
      addons.forEach(addon => {
        switch (addon) {
          case 'Eco-friendly detergent':
            // $2 per bag - this will need to be calculated based on bag count
            // For now, we'll use a placeholder that will be updated by the backend
            addonPayouts.push(2);
            break;
          case 'Express Service - 24 hours':
            addonPayouts.push(10);
            break;
        }
      });
    }
  }
  
  const total = base + addonPayouts.reduce((sum, payout) => sum + payout, 0);
  
  return {
    base,
    addons: addonPayouts,
    total
  };
};

// Eco-friendly bonus calculation
export const calculateEcoFriendlyBonus = (hasEcoFriendlyAddon, acceptsEcoJobs) => {
  // If customer selected eco-friendly add-on AND bubbler accepts eco jobs, add $5 bonus
  if (hasEcoFriendlyAddon && acceptsEcoJobs) {
    return 5;
  }
  return 0;
};

// Enhanced payout calculation with eco-friendly bonus
export const calculateEnhancedPayout = (serviceType, tier, addons, hasEcoFriendlyAddon = false, acceptsEcoJobs = false) => {
  const basePayout = getPayoutRules(serviceType, tier, addons);
  const ecoBonus = calculateEcoFriendlyBonus(hasEcoFriendlyAddon, acceptsEcoJobs);
  
  return {
    ...basePayout,
    ecoBonus,
    totalWithEcoBonus: basePayout.total + ecoBonus
  };
}; 

// Job Duration Configuration
export const JOB_DURATION_CONFIG = {
  'Mobile Car Wash': {
    baseDurations: {
      'Express Shine': 20, // minutes
      'Signature Shine': 35, // minutes
      'Supreme Shine': 50 // minutes
    },
    addonDurations: {
      'Clay Bar Treatment': 15,
      'Bug & Tar Removal': 10,
      'Plastic Trim Restoration': 10,
      'Upholstery Shampoo': 25,
      'Interior Shampoo': 20,
      'Engine Bay Cleaning': 15,
      'Tire Shine': 0, // included in Signature/Supreme
      'Eco-Friendly Cleaning': 0 // no additional time
    },
    vehicleTypeMultipliers: {
      'Sedan': 1.0,
      'Coupe': 1.0,
      'SUV': 1.2,
      'Crossover': 1.2,
      'Pickup Truck': 1.3,
      'Minivan': 1.4,
      'Van': 1.4,
      'XL SUV': 1.5,
      'Large Van': 1.5
    }
  },
  'Home Cleaning': {
    baseDurations: {
      'refreshed': 60, // minutes for 1 bed/1 bath
      'deep': 120 // minutes for 1 bed/1 bath
    },
    roomTimeAdditions: {
      bedroom: 15, // minutes per additional bedroom
      bathroom: 15 // minutes per additional bathroom
    },
    addonDurations: {
      'Deep Dusting': 25,
      'Deep Clean Bedroom': 0, // handled by room count logic
      'Fridge Cleaning': 20,
      'Oven Cleaning': 25,
      'Freezer Cleaning': 15,
      'Cabinet Cleaning': 20,
      'Steam Mopping': 20,
      'Microwave Cleaning': 10, // included in Deep Clean
      'Clean Kitchen': 30,
      'Stove Top Cleaning': 15,
      'Eco-Friendly Cleaning': 0 // no additional time
    }
  }
};

// Calculate expected job duration for Mobile Car Wash
export const calculateCarWashDuration = (tier, addons = [], vehicles = []) => {
  const config = JOB_DURATION_CONFIG['Mobile Car Wash'];
  
  // Get base duration for tier
  const baseDuration = config.baseDurations[tier] || 0;
  
  // Calculate add-on time
  let addonTime = 0;
  addons.forEach(addon => {
    addonTime += config.addonDurations[addon] || 0;
  });
  
  // Calculate time per vehicle (base + add-ons)
  const timePerVehicle = baseDuration + addonTime;
  
  // If no specific vehicles provided, default to 1 vehicle
  if (!vehicles || vehicles.length === 0) {
    return {
      totalDuration: timePerVehicle,
      timePerVehicle,
      baseDuration,
      addonTime,
      vehicleCount: 1,
      vehicleBreakdown: [{
        vehicleType: 'Standard',
        multiplier: 1.0,
        duration: timePerVehicle
      }]
    };
  }
  
  // Calculate duration for each vehicle with its type multiplier
  let totalDuration = 0;
  const vehicleBreakdown = vehicles.map(vehicle => {
    const vehicleType = vehicle.vehicle_type || 'Sedan';
    const multiplier = config.vehicleTypeMultipliers[vehicleType] || 1.0;
    const vehicleDuration = timePerVehicle * multiplier;
    
    totalDuration += vehicleDuration;
    
    return {
      vehicleType,
      multiplier,
      duration: vehicleDuration,
      tier: vehicle.tier || tier
    };
  });
  
  return {
    totalDuration,
    timePerVehicle,
    baseDuration,
    addonTime,
    vehicleCount: vehicles.length,
    vehicleBreakdown
  };
};

// Calculate expected job duration for Home Cleaning
export const calculateHomeCleaningDuration = (tier, addons = [], bedrooms = 1, bathrooms = 1, propertyType = 'Apartment/Loft') => {
  const config = JOB_DURATION_CONFIG['Home Cleaning'];
  
  // Get base duration for tier (1 bed/1 bath)
  const baseDuration = config.baseDurations[tier] || 0;
  
  // Calculate additional room time
  const additionalBedrooms = Math.max(0, bedrooms - 1);
  const additionalBathrooms = Math.max(0, bathrooms - 1);
  const roomTime = (additionalBedrooms * config.roomTimeAdditions.bedroom) + 
                   (additionalBathrooms * config.roomTimeAdditions.bathroom);
  
  // Calculate add-on time (avoid double-counting microwave for Deep Clean)
  let addonTime = 0;
  addons.forEach(addon => {
    // Don't add microwave time if Deep Clean is selected (it's included)
    if (addon === 'Microwave Cleaning' && tier === 'Signature Deep Clean') {
      return;
    }
    addonTime += config.addonDurations[addon] || 0;
  });
  
  const totalDuration = baseDuration + roomTime + addonTime;
  
  // Apply property type adjustment
  const adjustedDuration = calculatePropertyTypeAdjustedDuration(totalDuration, propertyType);
  
  return {
    totalDuration: adjustedDuration,
    baseDuration,
    roomTime,
    addonTime,
    bedrooms,
    bathrooms,
    additionalBedrooms,
    additionalBathrooms,
    propertyType,
    originalDuration: totalDuration,
    adjustmentApplied: totalDuration !== adjustedDuration
  };
};

// Calculate expected job duration for any service
export const calculateJobDuration = (serviceType, tier, addons = [], options = {}) => {
  switch (serviceType) {
    case 'Mobile Car Wash':
      return calculateCarWashDuration(tier, addons, options.vehicles || []);
    case 'Home Cleaning':
      return calculateHomeCleaningDuration(
        tier, 
        addons, 
        options.bedrooms || 1, 
        options.bathrooms || 1, 
        options.propertyType || 'Apartment/Loft'
      );
    default:
      return { totalDuration: 0 };
  }
};

// Get duration status indicator (for visual feedback)
export const getDurationStatus = (expectedDuration, actualDuration) => {
  if (!expectedDuration || !actualDuration) return 'unknown';
  
  const percentage = (actualDuration / expectedDuration) * 100;
  
  if (percentage <= 90) return 'green'; // On time
  if (percentage <= 110) return 'yellow'; // Nearing overage
  return 'red'; // Overdue
};

// Format duration for display
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}; 

// Property Type Duration Adjustments
export const PROPERTY_TYPE_DURATION_ADJUSTMENTS = {
  'Apartment/Loft': 0.20, // 20% reduction (faster to clean)
  'Condo/Townhouse': 0.15, // 15% reduction
  'House': 0.00 // No adjustment (full baseline timing)
};

// Property Type Duration Rules by Tier + Type (Both Refresher and Signature Deep)
export const PROPERTY_TYPE_DURATION_RULES = {
  '1 BED / 1 BATH': {
    'Apartment/Loft': {
      'Refresher': 90, // 1.5 hrs
      'Signature Deep': 135 // 2.25 hrs
    },
    'Condo/Townhouse': {
      'Refresher': 105, // 1.75 hrs
      'Signature Deep': 150 // 2.5 hrs
    },
    'House': {
      'Refresher': 120, // 2 hrs
      'Signature Deep': 165 // 2.75 hrs
    }
  },
  '2 BED / 1-2 BATH': {
    'Apartment/Loft': {
      'Refresher': 135, // 2.25 hrs
      'Signature Deep': 195 // 3.25 hrs
    },
    'Condo/Townhouse': {
      'Refresher': 150, // 2.5 hrs
      'Signature Deep': 210 // 3.5 hrs
    },
    'House': {
      'Refresher': 180, // 3 hrs
      'Signature Deep': 255 // 4.25 hrs
    }
  },
  '3 BED / 2 BATH': {
    'Apartment/Loft': {
      'Refresher': 195, // 3.25 hrs
      'Signature Deep': 315 // 5.25 hrs
    },
    'Condo/Townhouse': {
      'Refresher': 210, // 3.5 hrs
      'Signature Deep': 330 // 5.5 hrs
    },
    'House': {
      'Refresher': 240, // 4 hrs
      'Signature Deep': 375 // 6.25 hrs
    }
  }
};

// Calculate property type adjusted duration
export const calculatePropertyTypeAdjustedDuration = (baseDuration, propertyType) => {
  const adjustment = PROPERTY_TYPE_DURATION_ADJUSTMENTS[propertyType] || 0;
  const adjustedDuration = baseDuration * (1 - adjustment);
  return Math.round(adjustedDuration);
};

// Get property type specific duration for home cleaning
export const getPropertyTypeSpecificDuration = (bedrooms, bathrooms, tier, propertyType) => {
  // Determine the category based on bedrooms and bathrooms
  let category;
  if (bedrooms === 1 && bathrooms <= 1) {
    category = '1 BED / 1 BATH';
  } else if (bedrooms === 2 && bathrooms <= 2) {
    category = '2 BED / 1-2 BATH';
  } else if (bedrooms === 3 && bathrooms >= 2) {
    category = '3 BED / 2 BATH';
  } else {
    // Default to 2 BED / 1-2 BATH for other combinations
    category = '2 BED / 1-2 BATH';
  }

  const categoryRules = PROPERTY_TYPE_DURATION_RULES[category];
  if (!categoryRules) {
    return null; // No specific rules for this category
  }

  const propertyRules = categoryRules[propertyType];
  if (!propertyRules) {
    return null; // No specific rules for this property type
  }

  // Map tier names to match the rules
  const tierMapping = {
    'refreshed': 'Refresher',
    'deep': 'Signature Deep'
  };

  const mappedTier = tierMapping[tier] || tier;
  return propertyRules[mappedTier] || null;
}; 

/**
 * Handle job rescheduling with original bubbler priority
 * @param {Object} params - Reschedule parameters
 * @param {string} params.originalJobId - ID of the original job assignment
 * @param {string} params.newScheduleDate - New schedule date/time
 * @param {string} params.rescheduleReason - Reason for reschedule
 * @returns {Promise<Object>} - Reschedule result
 */
export const handleJobReschedule = async (params) => {
  const { originalJobId, newScheduleDate, rescheduleReason = 'Customer request' } = params;
  
  try {
    // Call the Supabase function to handle rescheduling
    const { data, error } = await supabase.rpc('handle_job_reschedule', {
      original_job_id: originalJobId,
      new_schedule_date: newScheduleDate,
      reschedule_reason: rescheduleReason
    });
    
    if (error) {
      throw new Error(`Reschedule failed: ${error.message}`);
    }
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        newJobId: result.new_job_id,
        originalBubblerId: result.original_bubbler_id,
        message: result.message
      };
    }
    
    throw new Error('No data returned from reschedule function');
    
  } catch (error) {
    console.error('Error rescheduling job:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to reschedule job'
    };
  }
};

/**
 * Check if a bubbler received standby payout for a job
 * @param {string} jobAssignmentId - Job assignment ID
 * @returns {Promise<boolean>} - Whether standby payout was received
 */
export const checkStandbyPayoutStatus = async (jobAssignmentId) => {
  try {
    const { data, error } = await supabase.rpc('check_standby_payout_status', {
      job_assignment_id: jobAssignmentId
    });
    
    if (error) {
      console.error('Error checking standby payout status:', error);
      return false;
    }
    
    return data || false;
    
  } catch (error) {
    console.error('Error checking standby payout status:', error);
    return false;
  }
};

/**
 * Get original bubbler for rescheduled jobs
 * @param {string} jobAssignmentId - Job assignment ID
 * @returns {Promise<string|null>} - Original bubbler ID
 */
export const getOriginalBubblerForReschedule = async (jobAssignmentId) => {
  try {
    const { data, error } = await supabase.rpc('get_original_bubbler_for_reschedule', {
      job_assignment_id: jobAssignmentId
    });
    
    if (error) {
      console.error('Error getting original bubbler:', error);
      return null;
    }
    
    return data;
    
  } catch (error) {
    console.error('Error getting original bubbler:', error);
    return null;
  }
};

/**
 * Reschedule job with original bubbler priority
 * @param {Object} params - Reschedule parameters
 * @returns {Promise<Object>} - Reschedule result
 */
export const rescheduleJobWithOriginalBubbler = async (params) => {
  const { 
    originalJobId, 
    newScheduleDate, 
    rescheduleReason = 'Customer request',
    customerName,
    customerEmail 
  } = params;
  
  try {
    // First, check if the original job exists and has a bubbler
    const { data: originalJob, error: fetchError } = await supabase
      .from('job_assignments')
      .select('bubbler_id, order_service_id, status')
      .eq('id', originalJobId)
      .single();
    
    if (fetchError || !originalJob) {
      throw new Error('Original job not found or invalid');
    }
    
    if (originalJob.status === 'cancelled') {
      throw new Error('Cannot reschedule a cancelled job');
    }
    
    // Check if the original bubbler is still active
    const { data: bubbler, error: bubblerError } = await supabase
      .from('bubblers')
      .select('id, is_active, first_name, last_name')
      .eq('id', originalJob.bubbler_id)
      .single();
    
    if (bubblerError || !bubbler) {
      throw new Error('Original bubbler not found');
    }
    
    if (!bubbler.is_active) {
      throw new Error('Original bubbler is no longer active');
    }
    
    // Call the reschedule function
    const rescheduleResult = await handleJobReschedule({
      originalJobId,
      newScheduleDate,
      rescheduleReason
    });
    
    if (!rescheduleResult.success) {
      throw new Error(rescheduleResult.message || 'Reschedule failed');
    }
    
    // Log the reschedule for tracking
    await supabase
      .from('activity_log')
      .insert({
        activity_type: 'job_rescheduled',
        description: `Job ${originalJobId} rescheduled to ${newScheduleDate}`,
        metadata: {
          original_job_id: originalJobId,
          new_job_id: rescheduleResult.newJobId,
          original_bubbler_id: rescheduleResult.originalBubblerId,
          reschedule_reason: rescheduleReason,
          customer_name: customerName,
          customer_email: customerEmail
        }
      });
    
    return {
      success: true,
      newJobId: rescheduleResult.newJobId,
      originalBubblerId: rescheduleResult.originalBubblerId,
      originalBubblerName: `${bubbler.first_name} ${bubbler.last_name}`,
      message: `Job rescheduled successfully. ${bubbler.first_name} ${bubbler.last_name} will handle your rescheduled appointment.`
    };
    
  } catch (error) {
    console.error('Error in rescheduleJobWithOriginalBubbler:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to reschedule job'
    };
  }
}; 