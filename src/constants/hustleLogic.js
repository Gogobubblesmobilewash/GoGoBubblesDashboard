// GoGoBubbles Hustle Logic Constants and Functions

// Job Assignment Logic
export const JOB_ASSIGNMENT_RULES = {
  SOLO: { maxDuration: 300, bubblers: 1, type: 'solo' }, // ≤ 5 hours (increased from 4)
  DUAL: { maxDuration: 480, bubblers: 2, type: 'dual' }, // 5-8 hours
  TEAM: { maxDuration: 720, bubblers: 3, type: 'team' }  // 8+ hours
};

// Large Property Thresholds (still require joint assignment at 4+ hours)
export const LARGE_PROPERTY_THRESHOLDS = {
  BEDROOMS: 4,
  BATHROOMS: 3,
  SOLO_MAX_DURATION: 240 // 4 hours for large properties
};

// Opt-out Eligibility Requirements
export const OPT_OUT_REQUIREMENTS = {
  AVERAGE_RATING: 4.8,
  ON_TIME_ARRIVAL: 90, // percentage
  MAX_QUALITY_FAILS: 1,
  PHOTO_COMPLIANCE: 100 // percentage
};

// Hustle Bonus Configuration
export const HUSTLE_BONUS_CONFIG = {
  BASE_BONUS: 8, // $8 bonus for taking over jobs
  MIN_JOBS_FOR_RATING: 15, // minimum jobs for rating calculation
  MIN_JOBS_FOR_QUALITY: 10, // minimum jobs for quality check
  MIN_JOBS_FOR_PHOTO: 5 // minimum jobs for photo compliance
};

// Performance Tracking
export const PERFORMANCE_METRICS = {
  RATING_WEIGHT: 0.4,
  TIMELINESS_WEIGHT: 0.3,
  QUALITY_WEIGHT: 0.2,
  PHOTO_WEIGHT: 0.1
};

/**
 * Determine job assignment type based on estimated duration and property size
 * @param {number} estimatedDuration - Duration in minutes
 * @param {Object} propertyDetails - Property details for size assessment
 * @returns {Object} Job assignment configuration
 */
export const determineJobAssignment = (estimatedDuration, propertyDetails = {}) => {
  const { bedrooms = 1, bathrooms = 1 } = propertyDetails;
  
  // Check if this is a large property (4+ bedrooms or 3+ bathrooms)
  const isLargeProperty = bedrooms >= LARGE_PROPERTY_THRESHOLDS.BEDROOMS || 
                         bathrooms >= LARGE_PROPERTY_THRESHOLDS.BATHROOMS;
  
  // For large properties, use stricter solo limits (4 hours max)
  const soloMaxDuration = isLargeProperty ? LARGE_PROPERTY_THRESHOLDS.SOLO_MAX_DURATION : JOB_ASSIGNMENT_RULES.SOLO.maxDuration;
  
  if (estimatedDuration <= soloMaxDuration) {
    return {
      ...JOB_ASSIGNMENT_RULES.SOLO,
      maxDuration: soloMaxDuration,
      isLargeProperty,
      reason: isLargeProperty ? 'Large property - strict solo limit' : 'Regular property - extended solo limit'
    };
  } else if (estimatedDuration <= JOB_ASSIGNMENT_RULES.DUAL.maxDuration) {
    return {
      ...JOB_ASSIGNMENT_RULES.DUAL,
      isLargeProperty,
      reason: isLargeProperty ? 'Large property - requires dual assignment' : 'Duration exceeds solo limit'
    };
  } else {
    return {
      ...JOB_ASSIGNMENT_RULES.TEAM,
      isLargeProperty,
      reason: 'Duration requires team assignment'
    };
  }
};

/**
 * Calculate hustle bonus for taking over incomplete jobs
 * @param {number} remainingPayout - Remaining payout for the job
 * @returns {number} Total payout including bonus
 */
export const calculateHustleBonus = (remainingPayout) => {
  return remainingPayout + HUSTLE_BONUS_CONFIG.BASE_BONUS;
};

/**
 * Check if a bubbler is eligible for solo-only opt-out
 * @param {Object} bubblerStats - Bubbler performance statistics
 * @returns {boolean} Eligibility status
 */
export const checkOptOutEligibility = (bubblerStats) => {
  const {
    averageRating = 0,
    onTimeArrival = 0,
    qualityCheckFails = 0,
    photoCompliance = 0,
    jobsCompleted = 0
  } = bubblerStats;

  // Check minimum job requirements
  if (jobsCompleted < HUSTLE_BONUS_CONFIG.MIN_JOBS_FOR_RATING) {
    return false;
  }

  return (
    averageRating >= OPT_OUT_REQUIREMENTS.AVERAGE_RATING &&
    onTimeArrival >= OPT_OUT_REQUIREMENTS.ON_TIME_ARRIVAL &&
    qualityCheckFails <= OPT_OUT_REQUIREMENTS.MAX_QUALITY_FAILS &&
    photoCompliance === OPT_OUT_REQUIREMENTS.PHOTO_COMPLIANCE
  );
};

/**
 * Calculate performance score for bubbler ranking
 * @param {Object} bubblerStats - Bubbler performance statistics
 * @returns {number} Performance score (0-100)
 */
export const calculatePerformanceScore = (bubblerStats) => {
  const {
    averageRating = 0,
    onTimeArrival = 0,
    qualityCheckFails = 0,
    photoCompliance = 0
  } = bubblerStats;

  const ratingScore = (averageRating / 5) * 100 * PERFORMANCE_METRICS.RATING_WEIGHT;
  const timelinessScore = onTimeArrival * PERFORMANCE_METRICS.TIMELINESS_WEIGHT;
  const qualityScore = Math.max(0, (10 - qualityCheckFails) / 10) * 100 * PERFORMANCE_METRICS.QUALITY_WEIGHT;
  const photoScore = photoCompliance * PERFORMANCE_METRICS.PHOTO_WEIGHT;

  return Math.round(ratingScore + timelinessScore + qualityScore + photoScore);
};

/**
 * Calculate task payout based on task type and complexity
 * @param {string} taskType - Type of task (bedroom, bathroom, kitchen, etc.)
 * @param {Object} taskDetails - Task-specific details
 * @returns {number} Payout amount
 */
export const calculateTaskPayout = (taskType, taskDetails = {}) => {
  const basePayouts = {
    bedroom: 15,
    bathroom: 15,
    kitchen: 20,
    living_room: 15,
    dining_room: 10,
    office: 10,
    laundry_room: 8,
    garage: 12,
    patio: 10,
    oven: 8,
    fridge: 8,
    windows: 5,
    baseboards: 3,
    ceiling_fans: 5,
    // New add-on payouts
    cleankitchen: 12,
    stovetop: 6,
    ecofriendly: 4
  };

  let basePayout = basePayouts[taskType] || 10;
  
  // Pet presence multiplier - ONLY applies to room cleaning tasks
  // Excludes appliance cleaning and detailed tasks that pets don't significantly impact
  const petExcludedTasks = [
    'oven', 'fridge', 'stovetop', 'windows', 'baseboards', 'ceiling_fans',
    'cabinet_cleaning', 'freezer_cleaning' // Additional excluded tasks
  ];
  
  if (taskDetails.hasPets && !petExcludedTasks.includes(taskType)) {
    basePayout *= 1.1; // +10% for pet presence on room cleaning tasks only
  }
  
  // Note: Large home and dual bubbler multipliers are handled at the job level,
  // not at the individual task level

  return Math.round(basePayout);
};

/**
 * Validate task completion with required photos
 * @param {Object} taskCompletion - Task completion data
 * @returns {Object} Validation result
 */
export const validateTaskCompletion = (taskCompletion) => {
  const { beforePhoto, afterPhoto, taskId, timeSpent } = taskCompletion;
  
  const validation = {
    isValid: false,
    errors: [],
    warnings: []
  };

  // Required validations
  if (!beforePhoto) {
    validation.errors.push('Before photo is required');
  }
  
  if (!afterPhoto) {
    validation.errors.push('After photo is required');
  }
  
  if (!taskId) {
    validation.errors.push('Task ID is required');
  }

  // Quality checks
  if (timeSpent < 300000) { // Less than 5 minutes
    validation.warnings.push('Task completed very quickly - may need review');
  }
  
  if (timeSpent > 7200000) { // More than 2 hours
    validation.warnings.push('Task took unusually long - may need review');
  }

  validation.isValid = validation.errors.length === 0;
  return validation;
};

/**
 * Calculate earnings for a completed job
 * @param {Array} completedTasks - Array of completed tasks
 * @param {number} hustleBonus - Hustle bonus amount
 * @returns {Object} Earnings breakdown
 */
export const calculateJobEarnings = (completedTasks, hustleBonus = 0) => {
  const taskEarnings = completedTasks.reduce((total, task) => {
    return total + (task.payout || 0);
  }, 0);

  const totalEarnings = taskEarnings + hustleBonus;

  return {
    taskEarnings,
    hustleBonus,
    totalEarnings,
    taskCount: completedTasks.length
  };
};

/**
 * Generate job assignment recommendations
 * @param {Object} jobDetails - Job details including duration and complexity
 * @param {Array} availableBubblers - Array of available bubblers
 * @returns {Object} Assignment recommendations
 */
export const generateJobAssignments = (jobDetails, availableBubblers) => {
  const { estimatedDuration, complexity, location } = jobDetails;
  const assignment = determineJobAssignment(estimatedDuration);
  
  // Filter bubblers based on opt-out status and performance
  const eligibleBubblers = availableBubblers.filter(bubbler => {
    if (assignment.type === 'solo' && bubbler.optOutStatus) {
      return true; // Solo-only bubblers can take solo jobs
    }
    if (assignment.type !== 'solo' && bubbler.optOutStatus) {
      return false; // Solo-only bubblers can't take team jobs
    }
    return true;
  });

  // Sort by performance score
  const sortedBubblers = eligibleBubblers
    .map(bubbler => ({
      ...bubbler,
      performanceScore: calculatePerformanceScore(bubbler.stats)
    }))
    .sort((a, b) => b.performanceScore - a.performanceScore);

  return {
    assignment,
    recommendedBubblers: sortedBubblers.slice(0, assignment.bubblers),
    totalEligible: eligibleBubblers.length,
    estimatedPayout: calculateJobPayout(jobDetails, assignment)
  };
};

/**
 * Calculate total job payout based on job details and assignment
 * @param {Object} jobDetails - Job details
 * @param {Object} assignment - Job assignment configuration
 * @returns {number} Total payout
 */
export const calculateJobPayout = (jobDetails, assignment) => {
  const { estimatedDuration, complexity, tasks, serviceType, propertyDetails } = jobDetails;
  
  // Base payout calculation
  let basePayout = 0;
  
  // Calculate from tasks if available
  if (tasks && tasks.length > 0) {
    basePayout = tasks.reduce((total, task) => {
      return total + calculateTaskPayout(task.type, task.details);
    }, 0);
  } else {
    // Fallback to duration-based calculation
    basePayout = Math.round(estimatedDuration / 60 * 25); // $25/hour base rate
  }
  
  // For Home Cleaning services, apply only the three specified multipliers
  if (serviceType === 'Home Cleaning') {
    // 1. Large Home Multiplier (if property has 4+ beds or 3+ baths)
    if (propertyDetails) {
      const { bedrooms = 1, bathrooms = 1 } = propertyDetails;
      const isLargeProperty = bedrooms >= 4 || bathrooms >= 3;
      if (isLargeProperty) {
        basePayout *= 1.28; // 28% increase for large properties
      }
    }
    
    // 2. Dual Bubbler Multiplier (if job requires 2+ bubblers)
    if (assignment.bubblers >= 2) {
      basePayout *= 1.10; // 10% increase for dual/team jobs
    }
    
    // 3. Pet Presence Multiplier (handled at task level, but can be applied here too if needed)
    // Note: Pet presence is primarily handled in calculateTaskPayout
    
  } else {
    // For other services (Car Wash, Laundry), apply general complexity multipliers
    if (complexity === 'high') basePayout *= 1.2;
    if (complexity === 'medium') basePayout *= 1.1;
    
    // Apply assignment multiplier (team jobs may have different rates)
    if (assignment.type === 'team') {
      basePayout *= 1.1; // Slight premium for team coordination
    }
  }
  
  return Math.round(basePayout);
};

export default {
  determineJobAssignment,
  calculateHustleBonus,
  checkOptOutEligibility,
  calculatePerformanceScore,
  calculateTaskPayout,
  validateTaskCompletion,
  calculateJobEarnings,
  generateJobAssignments,
  calculateJobPayout
}; 