// Job Statuses
export const JOB_STATUSES = [
  'Pending',
  'Assigned',
  'Accepted',
  'Declined',
  'In Progress',
  'Progressing',
  'Completed',
  'Cancelled',
];

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
  'Same-day service',
];

// Unified arrays for compatibility
export const TIERS = [...CAR_WASH_TIERS, ...HOME_CLEANING_TIERS];
export const ADDONS = [...CAR_WASH_ADDONS, ...HOME_CLEAN_ADDONS, ...LAUNDRY_ADDONS];
export const BAG_TYPES = LAUNDRY_BAG_TYPES;

// Photo Requirements Function
export const getPhotoRequirements = (serviceType, tier, addons) => {
  const requirements = [];
  
  if (serviceType === 'Mobile Car Wash') {
    requirements.push('Before photo of vehicle');
    requirements.push('After photo of vehicle');
    
    if (tier === 'Supreme Shine') {
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
  }
  
  if (serviceType === 'Laundry Service') {
    requirements.push('Before photo of laundry');
    requirements.push('After photo of laundry');
  }
  
  return requirements;
};

// Perks Function
export const getPerks = (serviceType, tier, isFirstTime, refreshCleanCount) => {
  const perks = [];
  
  if (isFirstTime) {
    perks.push('First-time customer discount');
  }
  
  if (serviceType === 'Mobile Car Wash') {
    if (tier === 'Signature Shine' || tier === 'Supreme Shine') {
      perks.push('Free tire shine');
      perks.push('Free air freshener');
    }
  }
  
  if (serviceType === 'Home Cleaning') {
    if (refreshCleanCount >= 3) {
      perks.push('Loyalty discount');
    }
  }
  
  return perks;
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
            addonPayouts.push(5);
            break;
          case 'Same-day service':
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