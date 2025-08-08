/**
 * Lead Bubbler Dashboard Logic
 * Dynamic, priority-based, proximity-filtered dashboard system
 * 
 * @author GoGoBubbles Development Team
 * @version 1.0.0
 * @date 2024
 */

// Constants for proximity and timing rules
const PROXIMITY_RULES = {
  CLOSE: { min: 0, max: 20, message: null, canSelect: true },
  MEDIUM: { min: 21, max: 30, message: "⚠️ Are you sure? Closer Bubblers are available.", canSelect: true },
  FAR: { min: 31, max: 45, message: "🚫 This assignment requires admin approval.", canSelect: false, adminOverride: true },
  OUT_OF_RANGE: { min: 46, max: Infinity, message: "🔒 Outside your service radius.", canSelect: false }
};

// Priority tiers with color coding
const PRIORITY_TIERS = {
  RED: {
    name: "Tier 1 - Critical",
    color: "#dc2626",
    criteria: ["complaint_received", "low_rating", "multiple_redos", "time_lag", "job_reassignment"],
    description: "Immediate attention required"
  },
  ORANGE: {
    name: "Tier 2 - High", 
    color: "#ea580c",
    criteria: ["new_bubbler", "check_in_overdue", "mild_warnings"],
    description: "High priority check-in needed"
  },
  GREEN: {
    name: "Tier 3 - Routine",
    color: "#16a34a",
    criteria: ["random_spot_check", "experienced_bubbler", "good_history"],
    description: "Routine oversight"
  },
  BLUE: {
    name: "Requested Assistance",
    color: "#2563eb",
    criteria: ["bubbler_requested_help", "equipment_request"],
    description: "Bubbler requested support"
  },
  GRAY: {
    name: "Out of Range",
    color: "#6b7280",
    criteria: ["outside_radius"],
    description: "Outside service radius"
  }
};

// Service type mappings - All Lead Bubblers must be Elite
const SERVICE_TYPES = {
  elite_lead: ["home_cleaning", "car_wash", "laundry"] // Elite = Fresh + either Shine or Sparkle
};

// Lead eligibility requirements
const LEAD_ELIGIBILITY = {
  requiredCertifications: ["fresh", "shine_or_sparkle"],
  description: "All Lead Bubblers must be Elite (certified in Fresh + either Shine or Sparkle)"
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Object} coord1 - First coordinate {lat, lng}
 * @param {Object} coord2 - Second coordinate {lat, lng}
 * @returns {number} - Distance in miles
 */
function calculateDistance(coord1, coord2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Determine proximity category for a given distance
 * @param {number} distance - Distance in miles
 * @returns {Object} - Proximity rule object
 */
function getProximityRule(distance) {
  if (distance <= PROXIMITY_RULES.CLOSE.max) return PROXIMITY_RULES.CLOSE;
  if (distance <= PROXIMITY_RULES.MEDIUM.max) return PROXIMITY_RULES.MEDIUM;
  if (distance <= PROXIMITY_RULES.FAR.max) return PROXIMITY_RULES.FAR;
  return PROXIMITY_RULES.OUT_OF_RANGE;
}

/**
 * Determine priority tier for a bubbler based on criteria
 * @param {Object} bubblerData - Bubbler data and job information
 * @returns {Object} - Priority tier object
 */
function determinePriorityTier(bubblerData) {
  const { 
    complaints, 
    averageRating, 
    redosCount, 
    timeLag, 
    jobReassignments,
    jobsCompleted,
    checkInOverdue,
    mildWarnings,
    requestedHelp,
    equipmentRequest
  } = bubblerData;

  // Tier 1 - Critical (Red)
  if (complaints > 0 || averageRating < 4.3 || redosCount >= 2 || 
      timeLag > 30 || jobReassignments > 0) {
    return PRIORITY_TIERS.RED;
  }

  // Tier 2 - High (Orange)
  if (jobsCompleted < 5 || checkInOverdue || mildWarnings > 0) {
    return PRIORITY_TIERS.ORANGE;
  }

  // Tier 3 - Routine (Green)
  if (jobsCompleted >= 5 && averageRating >= 4.5) {
    return PRIORITY_TIERS.GREEN;
  }

  // Requested Assistance (Blue)
  if (requestedHelp || equipmentRequest) {
    return PRIORITY_TIERS.BLUE;
  }

  // Default to routine
  return PRIORITY_TIERS.GREEN;
}

/**
 * Filter bubblers based on service type compatibility
 * @param {Array} bubblers - Array of bubbler data
 * @param {string} leadServiceType - Lead's service type
 * @returns {Array} - Filtered bubblers
 */
function filterByServiceType(bubblers, leadServiceType) {
  const allowedServices = SERVICE_TYPES[leadServiceType] || [];
  
  return bubblers.filter(bubbler => {
    return allowedServices.includes(bubbler.serviceType);
  });
}

/**
 * Filter bubblers by proximity, priority, and availability
 * @param {Array} bubblers - Array of bubbler data
 * @param {Object} leadLocation - Lead's current location
 * @param {boolean} showOutOfRange - Whether to show out-of-range bubblers
 * @param {Array} claimedBubblers - Array of bubbler IDs already claimed by other leads
 * @returns {Array} - Filtered and prioritized bubblers
 */
function filterByProximityAndPriority(bubblers, leadLocation, showOutOfRange = false, claimedBubblers = []) {
  return bubblers
    .map(bubbler => {
      const distance = calculateDistance(leadLocation, bubbler.location);
      const proximityRule = getProximityRule(distance);
      const priorityTier = determinePriorityTier(bubbler);
      const isClaimed = claimedBubblers.includes(bubbler.id);
      
      return {
        ...bubbler,
        distance,
        proximityRule,
        priorityTier,
        isClaimed,
        isVisible: (showOutOfRange || proximityRule.canSelect) && !isClaimed,
        requiresAdminApproval: proximityRule.adminOverride
      };
    })
    .filter(bubbler => bubbler.isVisible)
    .sort((a, b) => {
      // Sort by priority first, then by distance
      const priorityOrder = { RED: 1, ORANGE: 2, BLUE: 3, GREEN: 4, GRAY: 5 };
      const priorityDiff = priorityOrder[a.priorityTier.name.split(' ')[0]] - 
                          priorityOrder[b.priorityTier.name.split(' ')[0]];
      
      if (priorityDiff !== 0) return priorityDiff;
      return a.distance - b.distance;
    });
}

/**
 * Generate dashboard data for Lead Bubbler
 * @param {Object} params - Dashboard parameters
 * @returns {Object} - Complete dashboard data
 */
function generateLeadDashboard(params) {
  const {
    leadId,
    leadLocation,
    leadServiceType,
    allBubblers,
    showOutOfRange = false,
    adminOverride = false,
    claimedBubblers = [],
    isOversightMode = false
  } = params;

  // Check if lead is in oversight mode
  if (!isOversightMode) {
    return {
      error: 'Not in oversight mode',
      message: 'Leads must be scheduled for oversight mode to access the bubbler dashboard'
    };
  }

  // Filter by service type
  const serviceFiltered = filterByServiceType(allBubblers, leadServiceType);
  
  // Filter by proximity, priority, and availability
  const proximityFiltered = filterByProximityAndPriority(
    serviceFiltered, 
    leadLocation, 
    showOutOfRange,
    claimedBubblers
  );

  // Group by priority tier
  const groupedByPriority = proximityFiltered.reduce((acc, bubbler) => {
    const tierName = bubbler.priorityTier.name.split(' ')[0];
    if (!acc[tierName]) acc[tierName] = [];
    acc[tierName].push(bubbler);
    return acc;
  }, {});

  // Generate smart prompts
  const smartPrompts = generateSmartPrompts(proximityFiltered, leadId);

  return {
    leadId,
    timestamp: new Date().toISOString(),
    totalBubblers: proximityFiltered.length,
    groupedBubblers: groupedByPriority,
    prioritySummary: {
      critical: groupedByPriority.RED?.length || 0,
      high: groupedByPriority.ORANGE?.length || 0,
      routine: groupedByPriority.GREEN?.length || 0,
      assistance: groupedByPriority.BLUE?.length || 0,
      outOfRange: groupedByPriority.GRAY?.length || 0
    },
    smartPrompts,
    proximityRules: PROXIMITY_RULES,
    priorityTiers: PRIORITY_TIERS,
    serviceType: leadServiceType,
    adminOverride,
    isOversightMode,
    claimedBubblers
  };
}

/**
 * Generate smart prompts for the dashboard
 * @param {Array} bubblers - Filtered bubblers
 * @param {string} leadId - Lead Bubbler ID
 * @returns {Array} - Array of smart prompts
 */
function generateSmartPrompts(bubblers, leadId, context = {}) {
  const prompts = [];
  
  // Check if lead bubbler is active before showing assistance-related prompts
  const isLeadActive = context.leadershipStatus === 'active';
  
  // Count bubblers by priority
  const criticalCount = bubblers.filter(b => b.priorityTier.name.includes('Critical')).length;
  const highCount = bubblers.filter(b => b.priorityTier.name.includes('High')).length;
  const assistanceCount = bubblers.filter(b => b.priorityTier.name.includes('Assistance')).length;

  // 🚦 CRITICAL PROMPTS
  if (criticalCount > 0) {
    prompts.push({
      type: 'critical',
      message: `${criticalCount} Bubblers nearby need Tier 1 check-ins.`,
      priority: 'high',
      trigger: 'critical_priority'
    });
  }

  // Check for job falling behind (2+ rooms in 5 min)
  if (context.jobDelay && context.delayedRooms >= 2) {
    prompts.push({
      type: 'critical',
      message: `Job falling behind - ${context.delayedRooms} rooms delayed. Immediate intervention needed.`,
      priority: 'high',
      trigger: 'job_delay'
    });
  }

  // Check for repeat low ratings
  if (context.repeatLowRatings && context.lowRatingCount >= 2) {
    prompts.push({
      type: 'critical',
      message: `${context.lowRatingCount} recent low ratings detected. Quality intervention required.`,
      priority: 'high',
      trigger: 'repeat_low_ratings'
    });
  }

  // 🟠 MODERATE PROMPTS
  if (highCount > 0) {
    prompts.push({
      type: 'moderate',
      message: `${highCount} Bubblers available for routine oversight.`,
      priority: 'medium',
      trigger: 'moderate_priority'
    });
  }

  // Recently flagged bubbler
  if (context.recentlyFlagged) {
    prompts.push({
      type: 'moderate',
      message: 'Recently flagged bubbler due for random QA check.',
      priority: 'medium',
      trigger: 'recently_flagged'
    });
  }

  // 🔵 ASSISTANCE PROMPTS
  if (assistanceCount > 0 && isLeadActive) {
    prompts.push({
      type: 'assistance',
      message: `${assistanceCount} Bubblers have requested assistance.`,
      priority: 'high',
      trigger: 'assistance_request'
    });
  }

  // Equipment request
  if (context.equipmentRequested && isLeadActive) {
    prompts.push({
      type: 'equipment',
      message: 'Equipment flagged as required for job progression.',
      priority: 'medium',
      trigger: 'equipment_request'
    });
  }

  // 🟡 COACHING REMINDERS
  if (context.yellowStatusApplied) {
    prompts.push({
      type: 'coaching',
      message: 'Yellow status applied - triggers short feedback prompt.',
      priority: 'medium',
      trigger: 'coaching_reminder'
    });
  }

  // Bubbler needs help
  if (context.bubblerNeedsHelp && isLeadActive) {
    prompts.push({
      type: 'help',
      message: 'Manual help request triggers "Assist Needed" for lead.',
      priority: 'high',
      trigger: 'bubbler_needs_help'
    });
  }

  // 🚨 NO MOVEMENT ALERT
  if (context.noMovement && context.movementTime >= 3) {
    prompts.push({
      type: 'movement',
      message: 'No GPS movement in 3 minutes while en route.',
      priority: 'high',
      trigger: 'no_movement_alert'
    });
  }

  // 🚨 JOB ABANDONMENT ALERT
  if (context.jobAbandonment && context.abandonedJobs > 0) {
    prompts.push({
      type: 'abandonment',
      message: `${context.abandonedJobs} job(s) potentially abandoned. Immediate intervention needed.`,
      priority: 'critical',
      trigger: 'job_abandonment_alert'
    });
  }

  // ⏱️ ACTIVE CHECK-IN LOOP ALERT
  if (context.activeCheckInLoop && context.checkInDuration >= 25) {
    prompts.push({
      type: 'check_in_loop',
      message: `Check-in active for ${Math.floor(context.checkInDuration)} minutes. Consider wrap-up or escalation.`,
      priority: 'medium',
      trigger: 'active_check_in_loop'
    });
  }

  // 🏠 ENVIRONMENTAL QA ALERT
  if (context.environmentalQA && context.requiresEnvironmentalQA) {
    prompts.push({
      type: 'environmental_qa',
      message: 'Environmental QA required for home-based Fresh Bubbler. Complete checklist before proceeding.',
      priority: 'high',
      trigger: 'environmental_qa_required'
    });
  }

  // 🚨 ENVIRONMENTAL QA FAILURE ALERT
  if (context.environmentalQAFailure && context.failureCount > 0) {
    prompts.push({
      type: 'environmental_qa_failure',
      message: `Environmental QA failure detected. ${context.failureCount} failure(s) logged. Immediate action required.`,
      priority: 'critical',
      trigger: 'environmental_qa_failure'
    });
  }

  // 🧭 FRESH BUBBLER LOCATION TRACKING ALERTS
  if (context.freshBubblerLocations && context.nearbyBubblers > 0) {
    prompts.push({
      type: 'fresh_bubbler_location',
      message: `${context.nearbyBubblers} Fresh Bubblers active nearby. Tap to view locations and claim QA visits.`,
      priority: 'medium',
      trigger: 'fresh_bubbler_location_available'
    });
  }

  // 🚨 GPS DISABLED ALERT
  if (context.gpsDisabled && context.gpsRetryCount >= 3) {
    prompts.push({
      type: 'gps_disabled',
      message: 'Fresh Bubbler GPS disabled. Job cannot proceed without location services.',
      priority: 'high',
      trigger: 'gps_disabled_blocking'
    });
  }

  // 🚨 MOVEMENT PATTERN ALERT
  if (context.movementPatterns && context.potentialAvoidance) {
    prompts.push({
      type: 'movement_pattern',
      message: 'Potential laundromat avoidance pattern detected. Review recommended.',
      priority: 'medium',
      trigger: 'movement_pattern_detected'
    });
  }

  // 🧺 TIER-SPECIFIC LAUNDRY FLOW ALERTS
  if (context.laundryFlow && context.expressHoardingDetected) {
    prompts.push({
      type: 'express_laundry_hoarding',
      message: 'Express laundry hoarding detected. Fresh Bubbler has 2+ Express jobs picked up without starting any.',
      priority: 'high',
      trigger: 'express_laundry_hoarding_detected'
    });
  }

  if (context.laundryFlow && context.standardHoardingDetected) {
    prompts.push({
      type: 'standard_laundry_hoarding',
      message: 'Standard laundry hoarding detected. Fresh Bubbler has 3+ Standard jobs picked up without starting any.',
      priority: 'medium',
      trigger: 'standard_laundry_hoarding_detected'
    });
  }

  // ⏱️ TIER-SPECIFIC COUNTDOWN ALERTS
  if (context.laundryFlow && context.expressCountdownExpired) {
    prompts.push({
      type: 'express_countdown_expired',
      message: '2-hour Express countdown expired. Fresh Bubbler must start Express job immediately.',
      priority: 'critical',
      trigger: 'express_countdown_expired'
    });
  }

  if (context.laundryFlow && context.standardCountdownExpired) {
    prompts.push({
      type: 'standard_countdown_expired',
      message: '8-hour Standard countdown expired. Fresh Bubbler must start Standard job immediately.',
      priority: 'high',
      trigger: 'standard_countdown_expired'
    });
  }

  // 🚨 TIER-SPECIFIC DEADLINE ALERTS
  if (context.laundryFlow && context.expressDeadlineApproaching) {
    prompts.push({
      type: 'express_deadline_approaching',
      message: 'Express delivery deadline approaching (24h). Fresh Bubbler needs to prioritize Express delivery.',
      priority: 'high',
      trigger: 'express_deadline_approaching'
    });
  }

  if (context.laundryFlow && context.standardDeadlineApproaching) {
    prompts.push({
      type: 'standard_deadline_approaching',
      message: 'Standard delivery deadline approaching (36h). Fresh Bubbler needs to prioritize Standard delivery.',
      priority: 'medium',
      trigger: 'standard_deadline_approaching'
    });
  }

  // 📦 BATCH SIZE LIMIT ALERTS
  if (context.laundryFlow && context.batchSizeLimitExceeded) {
    prompts.push({
      type: 'batch_size_limit_exceeded',
      message: 'Batch size limit exceeded. Fresh Bubbler has too many active jobs.',
      priority: 'medium',
      trigger: 'batch_size_limit_exceeded'
    });
  }

  // 🚦 FIRST-WASH INITIATION ALERTS
  if (context.firstWashInitiation && context.firstWashWarning) {
    prompts.push({
      type: 'first_wash_warning',
      message: 'First wash deadline approaching. Fresh Bubbler must start wash soon or get Lead check-in.',
      priority: 'medium',
      trigger: 'first_wash_warning'
    });
  }

  if (context.firstWashInitiation && context.firstWashViolation) {
    prompts.push({
      type: 'first_wash_violation',
      message: '6-hour first-wash deadline expired. Lead Bubbler check-in required before wash can start.',
      priority: 'critical',
      trigger: 'first_wash_violation'
    });
  }

  if (context.firstWashInitiation && context.environmentalQARequired) {
    prompts.push({
      type: 'environmental_qa_required',
      message: 'Fresh Bubbler washing at home requires environmental QA. Lead check-in needed.',
      priority: 'high',
      trigger: 'environmental_qa_required'
    });
  }

  if (context.firstWashInitiation && context.leadCheckRequired) {
    prompts.push({
      type: 'lead_check_required',
      message: 'Lead Bubbler check-in required before Fresh Bubbler can start wash.',
      priority: 'high',
      trigger: 'lead_check_required'
    });
  }

  // 🕵️ UNCHECKED HOARDING ALERTS
  if (context.firstWashInitiation && context.uncheckedHoardingDetected) {
    prompts.push({
      type: 'unchecked_hoarding_detected',
      message: 'Unchecked hoarding pattern detected. Fresh Bubbler delaying wash without oversight.',
      priority: 'high',
      trigger: 'unchecked_hoarding_detected'
    });
  }

  // ⏰ IDLE REMINDER
  if (context.idleTime && context.idleTime >= 45) {
    prompts.push({
      type: 'reminder',
      message: "You haven't checked in on a bubbler in 45 minutes. Ready to help someone?",
      priority: 'medium',
      trigger: 'idle_reminder'
    });
  }

  // Distance warnings
  const farBubblers = bubblers.filter(b => b.proximityRule === PROXIMITY_RULES.FAR);
  if (farBubblers.length > 0) {
    prompts.push({
      type: 'distance_warning',
      message: `${farBubblers.length} assignments are outside your priority radius.`,
      priority: 'low',
      trigger: 'distance_warning'
    });
  }

  return prompts;
}

/**
 * Handle bubbler selection for check-in with claim locking
 * @param {Object} params - Selection parameters
 * @returns {Object} - Selection result
 */
function handleBubblerSelection(params) {
  const {
    bubblerId,
    leadId,
    leadLocation,
    bubblerLocation,
    adminOverride = false,
    claimedBubblers = []
  } = params;

  // Check if bubbler is already claimed
  if (claimedBubblers.includes(bubblerId)) {
    return {
      success: false,
      error: 'Bubbler already claimed',
      message: '⚠️ This bubbler is already assigned to another lead.',
      bubblerClaimed: true
    };
  }

  const distance = calculateDistance(leadLocation, bubblerLocation);
  const proximityRule = getProximityRule(distance);

  // Check if selection is allowed
  if (!proximityRule.canSelect && !adminOverride) {
    return {
      success: false,
      error: 'Selection not allowed',
      message: proximityRule.message,
      requiresAdminApproval: proximityRule.adminOverride
    };
  }

  // Check if admin approval is required
  if (proximityRule.adminOverride && !adminOverride) {
    return {
      success: false,
      error: 'Admin approval required',
      message: proximityRule.message,
      requiresAdminApproval: true
    };
  }

  return {
    success: true,
    bubblerId,
    leadId,
    distance,
    estimatedTravelTime: Math.ceil(distance * 2), // Rough estimate: 2 minutes per mile
    status: 'en_route',
    timestamp: new Date().toISOString(),
    warning: proximityRule.message,
    claimLocked: true
  };
}

/**
 * Claim a bubbler for check-in (First Come, First Served)
 * @param {Object} params - Claim parameters
 * @returns {Object} - Claim result
 */
function claimBubbler(params) {
  const {
    bubblerId,
    leadId,
    claimedBubblers,
    claimTimestamp = new Date().toISOString(),
    currentLocation // ADD THIS
  } = params;

  // Check if bubbler is already claimed
  if (claimedBubblers.includes(bubblerId)) {
    return {
      success: false,
      error: 'Bubbler already claimed',
      message: '⚠️ This bubbler is already assigned to another lead.',
      bubblerClaimed: true
    };
  }

  // Add bubbler to claimed list
  const updatedClaimedBubblers = [...claimedBubblers, bubblerId];

  // NEW: Auto-start in-route timer when bubbler is claimed
  const inRouteTimer = startInRouteTimer({
    leadId,
    bubblerId,
    startTime: claimTimestamp,
    startLocation: currentLocation
  });

  return {
    success: true,
    bubblerId,
    leadId,
    claimTimestamp,
    updatedClaimedBubblers,
    inRouteTimer, // ADD THIS
    message: 'Bubbler successfully claimed. En route timer started. GPS movement will be monitored.'
  };
}

/**
 * Release a bubbler claim after check-in completion
 * @param {Object} params - Release parameters
 * @returns {Object} - Release result
 */
function releaseBubblerClaim(params) {
  const {
    bubblerId,
    claimedBubblers,
    checkInCompleted = true,
    needsFollowUp = false
  } = params;

  // Remove bubbler from claimed list
  const updatedClaimedBubblers = claimedBubblers.filter(id => id !== bubblerId);

  return {
    success: true,
    bubblerId,
    updatedClaimedBubblers,
    checkInCompleted,
    needsFollowUp,
    message: checkInCompleted 
      ? 'Check-in completed. Bubbler released from claim.' 
      : 'Bubbler claim released.'
  };
}

/**
 * Update lead status based on activity with GPS tracking
 * @param {Object} params - Status update parameters
 * @returns {Object} - Updated status
 */
function updateLeadStatus(params) {
  const {
    leadId,
    currentStatus,
    action,
    timestamp,
    location,
    idleTime = 0,
    gpsData = null
  } = params;

  const now = new Date();
  const timeSinceLastAction = now - new Date(timestamp);

  let newStatus = currentStatus;
  let warnings = [];
  let gpsAlerts = [];

  switch (action) {
    case 'job_completed':
      newStatus = 'available_oversight';
      break;
      
    case 'bubbler_selected':
      newStatus = 'en_route';
      break;
      
    case 'arrived_on_site':
      newStatus = 'check_in_started';
      break;
      
    case 'check_in_completed':
      newStatus = 'wrap_up';
      // Auto-reset to available after 3 minutes (180 seconds)
      setTimeout(() => {
        newStatus = 'available_oversight';
      }, 3 * 60 * 1000);
      break;
      
    case 'idle_detected':
      if (idleTime > 5 * 60 * 1000) { // 5 minutes
        newStatus = 'paused';
        warnings.push('Clock paused due to inactivity');
        gpsAlerts.push('We noticed you haven\'t moved. Are you still on your way?');
      }
      break;
      
    case 'stop_detected':
      newStatus = 'paused';
      warnings.push('Clock paused - stationary activity detected');
      gpsAlerts.push('Looks like you\'re stopped. Please resume route or clock out.');
      break;

    case 'outside_radius':
      warnings.push('You\'ve moved outside your current oversight zone.');
      gpsAlerts.push('Outside 45-mile radius');
      break;

    case 'wrong_location':
      warnings.push('GPS shows you\'re not at the job site. Please confirm arrival.');
      gpsAlerts.push('Wrong address detected');
      break;
  }

  return {
    leadId,
    status: newStatus,
    timestamp: now.toISOString(),
    location,
    warnings,
    gpsAlerts,
    idleTime: newStatus === 'available_oversight' ? 0 : idleTime
  };
}

/**
 * Monitor GPS movement and detect idle/stop conditions
 * @param {Object} params - GPS monitoring parameters
 * @returns {Object} - GPS monitoring result
 */
function monitorGPSMovement(params) {
  const {
    leadId,
    currentLocation,
    previousLocation,
    currentStatus,
    lastMovementTime,
    oversightRadius = 45
  } = params;

  const now = new Date();
  const timeSinceLastMovement = now - new Date(lastMovementTime);
  const alerts = [];

  // Check if lead is moving
  if (previousLocation && currentLocation) {
    const distance = calculateDistance(previousLocation, currentLocation);
    const isMoving = distance > 0.1; // 0.1 mile threshold for movement

    if (!isMoving && currentStatus === 'en_route') {
      // No movement detected while en route
      if (timeSinceLastMovement > 5 * 60 * 1000) { // 5 minutes
        alerts.push({
          type: 'idle_detected',
          message: 'We noticed you haven\'t moved. Are you still on your way?',
          severity: 'warning'
        });
      }
    }

    // Check if lead is outside oversight radius
    const distanceFromCenter = calculateDistance(
      { lat: 29.7604, lng: -95.3698 }, // Default center - should be configurable
      currentLocation
    );

    if (distanceFromCenter > oversightRadius) {
      alerts.push({
        type: 'outside_radius',
        message: 'You\'ve moved outside your current oversight zone.',
        severity: 'error'
      });
    }
  }

  return {
    leadId,
    timestamp: now.toISOString(),
    currentLocation,
    isMoving: alerts.length === 0,
    timeSinceLastMovement,
    alerts,
    shouldPause: alerts.some(alert => alert.severity === 'error')
  };
}

/**
 * Validate arrival at job site using GPS
 * @param {Object} params - Arrival validation parameters
 * @returns {Object} - Arrival validation result
 */
function validateArrival(params) {
  const {
    leadLocation,
    jobLocation,
    arrivalThreshold = 0.1 // 0.1 mile threshold for arrival
  } = params;

  const distance = calculateDistance(leadLocation, jobLocation);
  const isAtJobSite = distance <= arrivalThreshold;

  return {
    isAtJobSite,
    distance,
    timestamp: new Date().toISOString(),
    message: isAtJobSite 
      ? 'Arrival confirmed at job site.' 
      : 'GPS shows you\'re not at the job site. Please confirm arrival.'
  };
}

/**
 * Validate check-in completion with wrap-up timing
 * @param {Object} params - Check-in parameters
 * @returns {Object} - Validation result
 */
function validateCheckIn(params) {
  const {
    leadId,
    bubblerId,
    checkInType,
    notes,
    photos,
    rating,
    duration,
    wrapUpStartTime,
    currentTime = new Date().toISOString()
  } = params;

  const errors = [];
  const warnings = [];

  // Required fields
  if (!checkInType) errors.push('Check-in type is required');
  
  // Notes validation with character limit (140-180 characters)
  const notesLength = notes ? notes.trim().length : 0;
  if (notesLength < 10) {
    errors.push('Notes must be at least 10 characters');
  } else if (notesLength > 180) {
    errors.push('Notes must be 180 characters or less');
  }
  
  // Photo requirements for incomplete/redo issues
  if (checkInType === 'quality_issue' || checkInType === 'incomplete' || checkInType === 'redo_required') {
    if (!photos || photos.length === 0) {
      errors.push('📸 Photos are required for flagged issues. Please attach a photo of the problem.');
    }
  }

  // Duration validation
  if (duration < 1 || duration > 120) {
    warnings.push('Check-in duration seems unusual');
  }

  // Rating validation
  if (rating && (rating < 1 || rating > 5)) {
    errors.push('Rating must be between 1 and 5');
  }

  // Wrap-up timing validation
  if (wrapUpStartTime) {
    const wrapUpDuration = new Date(currentTime) - new Date(wrapUpStartTime);
    const maxWrapUpTime = 3 * 60 * 1000; // 3 minutes in milliseconds
    
    if (wrapUpDuration > maxWrapUpTime) {
      warnings.push('Wrap-up time exceeded 3 minutes');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    checkInData: {
      leadId,
      bubblerId,
      checkInType,
      notes: notes ? notes.trim() : '',
      notesLength,
      photos,
      rating,
      duration,
      wrapUpStartTime,
      wrapUpDuration: wrapUpStartTime ? new Date(currentTime) - new Date(wrapUpStartTime) : 0,
      timestamp: currentTime
    }
  };
}

/**
 * Validate oversight mode eligibility
 * @param {Object} params - Oversight validation parameters
 * @returns {Object} - Oversight validation result
 */
function validateOversightMode(params) {
  const {
    leadId,
    leadCertifications,
    scheduledOversight,
    currentTime,
    isElite = false
  } = params;

  const errors = [];
  const warnings = [];

  // Check if lead is Elite (required for all Lead Bubblers)
  if (!isElite) {
    errors.push('Lead Bubbler must be Elite (certified in Fresh + either Shine or Sparkle)');
  }

  // Check if lead has required certifications
  const hasFresh = leadCertifications.includes('fresh');
  const hasShineOrSparkle = leadCertifications.includes('shine') || leadCertifications.includes('sparkle');

  if (!hasFresh) {
    errors.push('Lead Bubbler must be certified in Fresh (Laundry)');
  }

  if (!hasShineOrSparkle) {
    errors.push('Lead Bubbler must be certified in either Shine (Car Wash) or Sparkle (Home Cleaning)');
  }

  // Check if lead is scheduled for oversight
  if (!scheduledOversight) {
    errors.push('Lead must be scheduled for oversight mode to access bubbler dashboard');
  }

  // Check if current time is within scheduled oversight window
  if (scheduledOversight && currentTime) {
    const now = new Date(currentTime);
    const startTime = new Date(scheduledOversight.startTime);
    const endTime = new Date(scheduledOversight.endTime);

    if (now < startTime || now > endTime) {
      warnings.push('Current time is outside scheduled oversight window');
    }
  }

  return {
    isEligible: errors.length === 0,
    errors,
    warnings,
    oversightType: scheduledOversight?.type || null, // 'standalone' or 'dual_role'
    message: errors.length > 0 
      ? 'Oversight mode access denied: ' + errors.join(', ')
      : 'Oversight mode access granted'
  };
}

/**
 * Start wrap-up timer after check-in completion
 * @param {Object} params - Wrap-up parameters
 * @returns {Object} - Wrap-up timer data
 */
function startWrapUpTimer(params) {
  const {
    leadId,
    bubblerId,
    checkInType,
    wrapUpStartTime = new Date().toISOString()
  } = params;

  const maxWrapUpTime = 3 * 60 * 1000; // 3 minutes in milliseconds
  const endTime = new Date(wrapUpStartTime).getTime() + maxWrapUpTime;

  return {
    leadId,
    bubblerId,
    checkInType,
    wrapUpStartTime,
    wrapUpEndTime: new Date(endTime).toISOString(),
    maxWrapUpTime,
    remainingTime: maxWrapUpTime,
    isActive: true,
    showAlert: false, // Will be set to true at 30 seconds remaining
    message: 'Wrap-up timer started. You have 3 minutes to complete documentation.'
  };
}

/**
 * Calculate remaining wrap-up time with 30-second alert
 * @param {Object} params - Time calculation parameters
 * @returns {Object} - Time calculation result
 */
function calculateWrapUpTime(params) {
  const {
    wrapUpStartTime,
    currentTime = new Date().toISOString()
  } = params;

  const startTime = new Date(wrapUpStartTime).getTime();
  const now = new Date(currentTime).getTime();
  const elapsed = now - startTime;
  const maxWrapUpTime = 3 * 60 * 1000; // 3 minutes
  const remaining = Math.max(0, maxWrapUpTime - elapsed);
  const isExpired = remaining <= 0;
  const showAlert = remaining <= 30 && remaining > 0; // Alert at 30 seconds remaining

  // Format remaining time as MM:SS
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return {
    remaining,
    formattedTime,
    isExpired,
    elapsed,
    maxWrapUpTime,
    percentageComplete: Math.min(100, (elapsed / maxWrapUpTime) * 100),
    showAlert,
    alertMessage: showAlert ? '⚠️ 30 seconds remaining!' : null
  };
}

/**
 * Generate smart photo prompts based on check-in type and checklist flags
 * @param {Object} params - Photo prompt parameters
 * @returns {Object} - Photo prompt data
 */
function generatePhotoPrompts(params) {
  const {
    checkInType,
    serviceType,
    hasPhotos = false,
    checklistFlags = [] // Array of flagged items (❌ or ⚠️)
  } = params;

  const prompts = [];

  // Required photo prompts for checklist flags
  if (checklistFlags.length > 0) {
    prompts.push({
      type: 'required',
      message: '📸 Please attach supporting photo.',
      priority: 'high',
      reason: 'Checklist items flagged as incomplete or needing attention'
    });
  }

  // Required photo prompts for specific check-in types
  if (checkInType === 'quality_issue' || checkInType === 'incomplete' || checkInType === 'redo_required') {
    if (!hasPhotos) {
      prompts.push({
        type: 'required',
        message: '📸 Photos are required for flagged issues. Please attach a photo of the problem.',
        priority: 'high'
      });
    }
  }

  // Service-specific photo suggestions
  if (serviceType === 'home_cleaning') {
    if (checkInType === 'quality_issue') {
      prompts.push({
        type: 'suggestion',
        message: '📸 Consider photos of: dirty areas, missed spots, incomplete tasks',
        priority: 'medium'
      });
    }
  } else if (serviceType === 'car_wash') {
    if (checkInType === 'quality_issue') {
      prompts.push({
        type: 'suggestion',
        message: '📸 Consider photos of: water spots, missed areas, interior issues',
        priority: 'medium'
      });
    }
  }

  return {
    prompts,
    hasRequiredPhotos: prompts.some(p => p.type === 'required' && p.priority === 'high'),
    totalPrompts: prompts.length,
    requiredForChecklist: checklistFlags.length > 0
  };
}

/**
 * Generate quick-select tags for notes
 * @param {Object} params - Tag generation parameters
 * @returns {Object} - Available tags
 */
function generateQuickSelectTags(params) {
  const {
    checkInType,
    serviceType,
    checklistFlags = []
  } = params;

  const commonTags = [
    { tag: '#Redo', description: 'Task needs to be redone' },
    { tag: '#LateStart', description: 'Bubbler started late' },
    { tag: '#MissingItem', description: 'Equipment or supplies missing' },
    { tag: '#QualityIssue', description: 'Quality standards not met' },
    { tag: '#EquipmentNeeded', description: 'Additional equipment required' }
  ];

  const serviceSpecificTags = {
    home_cleaning: [
      { tag: '#DirtyAreas', description: 'Areas still dirty' },
      { tag: '#MissedSpots', description: 'Spots were missed' },
      { tag: '#IncompleteTask', description: 'Task not fully completed' }
    ],
    car_wash: [
      { tag: '#WaterSpots', description: 'Water spots remaining' },
      { tag: '#InteriorDirty', description: 'Interior needs attention' },
      { tag: '#ExteriorIssues', description: 'Exterior problems' }
    ],
    laundry: [
      { tag: '#FoldingIssue', description: 'Folding not done properly' },
      { tag: '#SortingProblem', description: 'Items not sorted correctly' },
      { tag: '#MissingItems', description: 'Items missing from order' }
    ]
  };

  const tags = [...commonTags];
  
  if (serviceSpecificTags[serviceType]) {
    tags.push(...serviceSpecificTags[serviceType]);
  }

  // Add tags based on checklist flags
  if (checklistFlags.length > 0) {
    tags.push({ tag: '#ChecklistFlagged', description: 'Checklist items need attention' });
  }

  return {
    tags,
    totalTags: tags.length,
    suggestedTags: tags.slice(0, 5) // Show first 5 as most relevant
  };
}

/**
 * Auto-save notes functionality
 * @param {Object} params - Autosave parameters
 * @returns {Object} - Autosave result
 */
function autoSaveNotes(params) {
  const {
    notes,
    leadId,
    bubblerId,
    jobId,
    timestamp = new Date().toISOString()
  } = params;

  // Validate notes length
  const notesLength = notes ? notes.trim().length : 0;
  const isValid = notesLength <= 180;

  return {
    success: true,
    notes,
    notesLength,
    isValid,
    timestamp,
    autoSaveId: `autosave_${leadId}_${bubblerId}_${Date.now()}`,
    message: isValid ? 'Notes auto-saved' : 'Notes too long - please shorten'
  };
}

/**
 * Check if final submission is allowed
 * @param {Object} params - Submission validation parameters
 * @returns {Object} - Submission validation result
 */
function validateFinalSubmission(params) {
  const {
    notes,
    photos,
    checklistFlags = [],
    hasRequiredPhotos,
    notesLength,
    roomEvaluations = [], // ADD THIS
    assistanceLog = [], // ADD THIS
    hasRedIssues = false // ADD THIS
  } = params;

  const errors = [];
  const warnings = [];

  // NEW: Check if red issues have been properly documented
  if (hasRedIssues) {
    const redIssues = roomEvaluations.filter(evaluation => evaluation.evaluationType === 'needs_redo');
    const documentedRedIssues = redIssues.filter(issue => 
      issue.photos && issue.photos.length > 0 && issue.notes && issue.notes.trim().length > 0
    );
    
    if (documentedRedIssues.length !== redIssues.length) {
      errors.push('All red issues must be documented with photos and notes before submission');
    }
  }

  // NEW: Check if assistance has been properly logged
  if (assistanceLog.length > 0) {
    const incompleteAssistance = assistanceLog.filter(assist => 
      !assist.endTime || !assist.assistanceType || !assist.notes
    );
    
    if (incompleteAssistance.length > 0) {
      errors.push('All assistance sessions must be completed with type, duration, and notes');
    }
  }

  // Check notes length
  if (notesLength > 180) {
    errors.push('Notes exceed 180 character limit');
  }

  // Check required photos
  if (checklistFlags.length > 0 && (!photos || photos.length === 0)) {
    errors.push('Photos required for flagged checklist items');
  }

  if (hasRequiredPhotos && (!photos || photos.length === 0)) {
    errors.push('Required photos not uploaded');
  }

  // Check minimum notes requirement
  if (!notes || notes.trim().length < 10) {
    warnings.push('Notes should be at least 10 characters');
  }

  return {
    canSubmit: errors.length === 0,
    errors,
    warnings,
    isLocked: errors.length > 0,
    lockoutMessage: errors.length > 0 ? 'Please complete required documentation before submitting' : null
  };
}

/**
 * Room-based evaluation system
 * @param {Object} params - Room evaluation parameters
 * @returns {Object} - Room evaluation result
 */
function evaluateRoom(params) {
  const {
    roomId,
    roomName,
    bubblerId,
    leadId,
    evaluationType, // 'looks_good', 'coaching_only', 'needs_redo'
    notes,
    photos,
    assistanceRequested = false
  } = params;

  const evaluation = {
    roomId,
    roomName,
    bubblerId,
    leadId,
    evaluationType,
    timestamp: new Date().toISOString(),
    notes: notes || '',
    photos: photos || [],
    assistanceRequested
  };

  // Determine status and requirements
  switch (evaluationType) {
    case 'looks_good':
      evaluation.status = 'GREEN';
      evaluation.requiresPhoto = false;
      evaluation.requiresFix = false;
      evaluation.countsTowardTakeover = false;
      break;
      
    case 'coaching_only':
      evaluation.status = 'YELLOW';
      evaluation.requiresPhoto = false;
      evaluation.requiresFix = false;
      evaluation.countsTowardTakeover = false;
      break;
      
    case 'needs_redo':
      evaluation.status = 'RED';
      evaluation.requiresPhoto = true;
      evaluation.requiresFix = true;
      evaluation.countsTowardTakeover = true;
      
      if (!photos || photos.length === 0) {
        evaluation.error = 'Photos required for rooms needing redo';
      }
      break;
  }

  return {
    success: !evaluation.error,
    evaluation,
    error: evaluation.error
  };
}

/**
 * Check if partial takeover should be triggered
 * @param {Object} params - Takeover check parameters
 * @returns {Object} - Takeover trigger result
 */
function checkPartialTakeoverTrigger(params) {
  const {
    roomEvaluations,
    threshold = 2 // Number of red issues to trigger partial takeover
  } = params;

  const redIssues = roomEvaluations.filter(evaluation => evaluation.evaluationType === 'needs_redo');
  const shouldTrigger = redIssues.length >= threshold;

  return {
    shouldTrigger,
    redIssueCount: redIssues.length,
    threshold,
    redIssues: redIssues.map(issue => ({
      roomId: issue.roomId,
      roomName: issue.roomName,
      timestamp: issue.timestamp
    }))
  };
}

/**
 * Start assistance timer with monitoring
 * @param {Object} params - Assistance parameters
 * @returns {Object} - Assistance timer data
 */
// ADD NEW function to validate assistance triggers
function validateAssistanceTrigger(params) {
  const {
    bubblerId,
    roomId,
    assistanceType,
    triggerReason, // 'bubbler_request', 'system_delay', 'manual_override'
    delayThreshold = 15, // minutes
    currentTime = new Date().toISOString()
  } = params;

  const errors = [];
  const warnings = [];

  // NEW: Only allow assistance if properly triggered
  if (triggerReason === 'manual_override') {
    warnings.push('Manual assistance override requires justification');
  }

  if (triggerReason === 'system_delay') {
    // Check if delay threshold is met
    const roomStartTime = getRoomStartTime(roomId);
    const delayDuration = (new Date(currentTime) - new Date(roomStartTime)) / 60000;
    
    if (delayDuration < delayThreshold) {
      errors.push(`Assistance can only be triggered after ${delayThreshold} minutes of delay`);
    }
  }

  return {
    canStartAssistance: errors.length === 0,
    errors,
    warnings,
    requiresJustification: triggerReason === 'manual_override',
    message: errors.length > 0 ? errors.join(', ') : 'Assistance trigger validated'
  };
}

function startAssistanceTimer(params) {
  const {
    leadId,
    bubblerId,
    roomId,
    assistanceType,
    triggerReason, // ADD THIS
    startTime = new Date().toISOString()
  } = params;

  // NEW: Validate assistance trigger first
  const triggerValidation = validateAssistanceTrigger({
    bubblerId,
    roomId,
    assistanceType,
    triggerReason
  });

  if (!triggerValidation.canStartAssistance) {
  return {
      success: false,
      error: triggerValidation.message,
      errors: triggerValidation.errors
    };
  }

  return {
    success: true,
    leadId,
    bubblerId,
    roomId,
    assistanceType,
    triggerReason,
    startTime,
    isActive: true,
    duration: 0,
    alerts: {
      fifteenMinute: false,
      thirtyMinute: false
    },
    message: 'Assistance timer started. Monitor duration for proper classification.'
  };
}

/**
 * Monitor assistance timer with alerts
 * @param {Object} params - Timer monitoring parameters
 * @returns {Object} - Timer monitoring result
 */
function monitorAssistanceTimer(params) {
  const {
    startTime,
    currentTime = new Date().toISOString(),
    assistanceType
  } = params;

  const start = new Date(startTime).getTime();
  const now = new Date(currentTime).getTime();
  const duration = Math.floor((now - start) / 60000); // Duration in minutes

  const alerts = {
    fifteenMinute: duration >= 15 && duration < 30,
    thirtyMinute: duration >= 30
  };

  let status = 'normal';
  let message = '';

  if (duration >= 30) {
    status = 'warning';
    message = 'Assistance requires justification beyond 30 minutes. Please select reason: Setup, Demonstration, Task Completion, or Equipment Delivery.';
  } else if (duration >= 15) {
    status = 'alert';
    message = 'You\'ve been assisting for 15 minutes. Consider if this should be classified as rework.';
  }

  return {
    duration,
    status,
    message,
    alerts,
    assistanceType,
    requiresJustification: duration >= 30
  };
}

/**
 * Start in-route timer with movement monitoring
 * @param {Object} params - In-route parameters
 * @returns {Object} - In-route timer data
 */
function startInRouteTimer(params) {
  const {
    leadId,
    bubblerId,
    startTime = new Date().toISOString(),
    startLocation
  } = params;

  return {
    leadId,
    bubblerId,
    startTime,
    startLocation,
    isActive: true,
    duration: 0,
    isPaused: false,
    pauseReason: null,
    lastMovementTime: startTime,
    alerts: {
      noMovement: false,
      movementResumed: false
    }
  };
}

/**
 * Monitor in-route movement and timer
 * @param {Object} params - Movement monitoring parameters
 * @returns {Object} - Movement monitoring result
 */
function monitorInRouteMovement(params) {
  const {
    startTime,
    lastMovementTime,
    currentLocation,
    previousLocation,
    currentTime = new Date().toISOString()
  } = params;

  const start = new Date(startTime).getTime();
  const lastMovement = new Date(lastMovementTime).getTime();
  const now = new Date(currentTime).getTime();
  
  const totalDuration = Math.floor((now - start) / 60000); // Total minutes
  const timeSinceMovement = Math.floor((now - lastMovement) / 60000); // Minutes since last movement

  // Check for movement
  let hasMoved = false;
  if (previousLocation && currentLocation) {
    const distance = calculateDistance(previousLocation, currentLocation);
    hasMoved = distance > 0.1; // 0.1 mile threshold
  }

  const alerts = {
    noMovement: timeSinceMovement >= 3 && !hasMoved,
    movementResumed: hasMoved && timeSinceMovement >= 3
  };

  let status = 'moving';
  let message = '';

  if (timeSinceMovement >= 5 && !hasMoved) {
    status = 'paused';
    message = 'Timer paused due to no movement. Resume when you start moving again.';
  } else if (timeSinceMovement >= 3 && !hasMoved) {
    status = 'warning';
    message = 'We\'ve noticed no movement. Everything OK?';
  } else if (hasMoved && timeSinceMovement >= 3) {
    status = 'resumed';
    message = 'Movement detected. Timer resumed.';
  }

  return {
    totalDuration,
    timeSinceMovement,
    hasMoved,
    status,
    message,
    alerts,
    shouldPause: timeSinceMovement >= 5 && !hasMoved,
    shouldResume: hasMoved && timeSinceMovement >= 3
  };
}

/**
 * Get completed rooms for evaluation
 * @param {Object} params - Room list parameters
 * @returns {Object} - Completed rooms data
 */
function getCompletedRooms(params) {
  const {
    jobId,
    bubblerId,
    serviceType,
    bubblerProgress // ADD THIS - real-time bubbler progress
  } = params;

  // NEW: Only show rooms that bubbler has marked as completed
  const roomTemplates = {
    home_cleaning: [
      'Kitchen', 'Living Room', 'Bedroom 1', 'Bedroom 2', 'Bathroom 1', 'Bathroom 2'
    ],
    car_wash: [
      'Exterior', 'Interior', 'Windows', 'Tires', 'Trunk'
    ],
    laundry: [
      'Sorting', 'Washing', 'Drying', 'Folding', 'Packaging'
    ]
  };

  const allRooms = roomTemplates[serviceType] || [];
  
  // NEW: Filter to only completed rooms
  const completedRooms = allRooms.filter(room => {
    const roomKey = room.toLowerCase().replace(' ', '_');
    return bubblerProgress && bubblerProgress[roomKey] && bubblerProgress[roomKey].status === 'completed';
  });
  
  return {
    jobId,
    bubblerId,
    serviceType,
    completedRooms: completedRooms.map(room => ({
      roomId: `${jobId}_${room.toLowerCase().replace(' ', '_')}`,
      roomName: room,
      completedAt: bubblerProgress[room.toLowerCase().replace(' ', '_')].completedAt,
      status: 'completed',
      needsEvaluation: true,
      canEvaluate: true // NEW: Only true for completed rooms
    })),
    totalRooms: allRooms.length,
    completedCount: completedRooms.length,
    evaluatedRooms: 0,
    message: completedRooms.length === 0 ? 'No rooms completed yet by bubbler' : `${completedRooms.length} rooms ready for evaluation`
  };
}

/**
 * Unselect or reassign bubbler
 * @param {Object} params - Unselect parameters
 * @returns {Object} - Unselect result
 */
function unselectBubbler(params) {
  const {
    leadId,
    bubblerId,
    reason, // 'error', 'emergency', 'reassignment'
    claimedBubblers
  } = params;

  const updatedClaimedBubblers = claimedBubblers.filter(id => id !== bubblerId);

  return {
    success: true,
    leadId,
    bubblerId,
    reason,
    updatedClaimedBubblers,
    timestamp: new Date().toISOString(),
    message: 'Bubbler unselected successfully. They are now available for other leads.'
  };
}

/**
 * Check for extended time in one house
 * @param {Object} params - Time check parameters
 * @returns {Object} - Time check result
 */
function checkExtendedTimeInHouse(params) {
  const {
    startTime,
    currentTime = new Date().toISOString(),
    threshold = 25 // minutes
  } = params;

  const start = new Date(startTime).getTime();
  const now = new Date(currentTime).getTime();
  const duration = Math.floor((now - start) / 60000); // Duration in minutes

  const isExtended = duration > threshold;

  return {
    duration,
    threshold,
    isExtended,
    warning: isExtended ? `You've been at this location for ${duration} minutes. Consider if assistance is needed.` : null,
    shouldFlag: isExtended
  };
}

/**
 * Remove bubbler from selection pool after QA check
 * @param {Object} params - Removal parameters
 * @returns {Object} - Removal result
 */
function removeBubblerFromPool(params) {
  const {
    bubblerId,
    reason, // 'qa_completed', 'assistance_requested', 'equipment_needed'
    availableBubblers
  } = params;

  const updatedBubblers = availableBubblers.filter(bubbler => {
    if (bubbler.id === bubblerId) {
      // Only remove if it's a low/moderate risk bubbler with completed QA
      if (reason === 'qa_completed' && 
          (bubbler.priorityTier === 'GREEN' || bubbler.priorityTier === 'ORANGE')) {
        return false; // Remove from pool
      }
      // Keep if assistance requested or equipment needed
      if (reason === 'assistance_requested' || reason === 'equipment_needed') {
        return true; // Keep in pool
      }
    }
    return true; // Keep all other bubblers
  });

  return {
    success: true,
    bubblerId,
    reason,
    updatedBubblers,
    removed: availableBubblers.length - updatedBubblers.length,
    message: `Bubbler ${reason === 'qa_completed' ? 'removed from pool' : 'kept in pool for assistance'}`
  };
}

// ADD NEW function for mobile room interface
function generateMobileRoomInterface(params) {
  const {
    completedRooms,
    serviceType,
    leadId,
    bubblerId
  } = params;

  return {
    interface: {
      type: 'mobile_room_checklist',
      rooms: completedRooms.map(room => ({
        roomId: room.roomId,
        roomName: room.roomName,
        status: 'pending_evaluation',
        actions: [
          {
            type: 'looks_good',
            label: '✅ Looks Good',
            color: '#16a34a',
            requiresPhoto: false,
            requiresNotes: false,
            quickAction: true
          },
          {
            type: 'coaching_only',
            label: '⚠️ Coaching Only',
            color: '#eab308',
            requiresPhoto: false,
            requiresNotes: true,
            quickAction: true
          },
          {
            type: 'needs_redo',
            label: '❌ Needs Redo',
            color: '#dc2626',
            requiresPhoto: true,
            requiresNotes: true,
            quickAction: false
          }
        ],
        evaluation: null
      })),
      layout: {
        type: 'card_grid',
        columns: 1,
        spacing: 'compact',
        tapTargets: 'large', // 44px minimum for accessibility
        swipeActions: true
      },
      progress: {
        total: completedRooms.length,
        evaluated: 0,
        remaining: completedRooms.length
      }
    }
  };
}

// ADD NEW function to enforce workflow order
function enforceWorkflowOrder(params) {
  const {
    currentStep,
    roomEvaluations = [],
    assistanceLog = [],
    hasSubmitted = false,
    wrapUpStarted = false
  } = params;

  const workflowSteps = [
    'bubbler_selected',
    'en_route',
    'arrived',
    'room_evaluation_started',
    'room_evaluation_completed',
    'assistance_logged', // if needed
    'wrap_up_started',
    'submitted'
  ];

  const currentStepIndex = workflowSteps.indexOf(currentStep);
  const errors = [];
  const warnings = [];

  // NEW: Check if previous steps are completed
  if (currentStep === 'room_evaluation_completed' && roomEvaluations.length === 0) {
    errors.push('Room evaluation must be completed before proceeding');
  }

  if (currentStep === 'assistance_logged' && assistanceLog.length === 0) {
    errors.push('Assistance must be logged if assistance was provided');
  }

  if (currentStep === 'submitted' && !wrapUpStarted) {
    errors.push('Wrap-up must be started before final submission');
  }

  // NEW: Prevent skipping steps
  if (hasSubmitted && currentStep !== 'submitted') {
    errors.push('Cannot modify after final submission');
  }

  return {
    canProceed: errors.length === 0,
    errors,
    warnings,
    nextStep: workflowSteps[currentStepIndex + 1] || null,
    isComplete: currentStep === 'submitted'
  };
}

// ADD NEW function for admin conflict notifications
function checkLeadConflicts(params) {
  const {
    bubblerId,
    leadId,
    timeWindow = 5 // minutes
  } = params;

  // Check if multiple leads claimed same bubbler within time window
  const recentClaims = getRecentBubblerClaims(bubblerId, timeWindow);
  
  if (recentClaims.length > 1) {
    // Send admin notification
    sendAdminAlert({
      type: 'lead_conflict',
      bubblerId,
      conflictingLeads: recentClaims.map(claim => claim.leadId),
      timestamp: new Date().toISOString(),
      severity: 'medium'
    });
  }

  return {
    hasConflict: recentClaims.length > 1,
    conflictingLeads: recentClaims.map(claim => claim.leadId),
    message: recentClaims.length > 1 ? 'Multiple leads claimed same bubbler' : null
  };
}

/**
 * Submit wrap-up with voice-to-text support
 * @param {Object} params - Wrap-up submission parameters
 * @returns {Object} - Submission result
 */
function submitWrapUpWithVoice(params) {
  const {
    leadId,
    bubblerId,
    notes,
    voiceNotes,
    photos,
    roomEvaluations,
    assistanceLog,
    wrapUpStartTime,
    currentTime = new Date().toISOString()
  } = params;

  // Combine text and voice notes
  const combinedNotes = notes + (voiceNotes ? ` ${voiceNotes}` : '');
  const notesLength = combinedNotes.length;

  // Validate submission
  const validation = validateCheckIn({
    leadId,
    bubblerId,
    checkInType: 'wrap_up',
    notes: combinedNotes,
    photos,
    wrapUpStartTime,
    currentTime
  });

  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      message: 'Wrap-up validation failed'
    };
  }

  return {
    success: true,
    leadId,
    bubblerId,
    notes: combinedNotes,
    notesLength,
    photos,
    roomEvaluations,
    assistanceLog,
    wrapUpDuration: new Date(currentTime) - new Date(wrapUpStartTime),
    timestamp: currentTime,
    message: 'Wrap-up submitted successfully with voice notes'
  };
}

// ADD NEW function for abandonment detection
function detectJobAbandonment(params) {
  const {
    jobId,
    bubblerId,
    scheduledStartTime,
    currentTime = new Date().toISOString(),
    abandonmentThreshold = 15, // minutes
    leadRadius = 30 // miles
  } = params;

  const scheduledStart = new Date(scheduledStartTime);
  const now = new Date(currentTime);
  const timeSinceScheduled = (now - scheduledStart) / 60000; // minutes

  // Check if bubbler has marked "En Route"
  const bubblerStatus = getBubblerStatus(bubblerId);
  const hasMarkedEnRoute = bubblerStatus && bubblerStatus.status === 'en_route';

  if (timeSinceScheduled >= abandonmentThreshold && !hasMarkedEnRoute) {
    // Trigger abandonment alert
    const abandonmentAlert = {
      type: 'job_abandonment',
      jobId,
      bubblerId,
      scheduledStartTime,
      timeSinceScheduled,
      status: 'abandoned',
      timestamp: currentTime,
      severity: 'critical'
    };

    // Auto-prompt all Lead Bubblers within radius
    const availableLeads = getAvailableLeadsInRadius(jobId, leadRadius);
    
    return {
      isAbandoned: true,
      alert: abandonmentAlert,
      availableLeads,
      message: `Bubbler may have abandoned job. ${availableLeads.length} Lead Bubblers available within ${leadRadius} miles.`,
      requiresImmediateAction: true
    };
  }

  return {
    isAbandoned: false,
    timeSinceScheduled,
    hasMarkedEnRoute,
    message: 'Job appears to be on track'
  };
}

// ADD NEW function for active check-in loop prompt
function checkActiveCheckInLoop(params) {
  const {
    leadId,
    bubblerId,
    checkInStartTime,
    currentTime = new Date().toISOString(),
    idleThreshold = 25 // minutes
  } = params;

  const startTime = new Date(checkInStartTime);
  const now = new Date(currentTime);
  const checkInDuration = (now - startTime) / 60000; // minutes

  if (checkInDuration >= idleThreshold) {
    return {
      shouldPrompt: true,
      duration: checkInDuration,
      options: [
        {
          type: 'continue',
          label: 'Continue',
          description: 'Job is still ongoing'
        },
        {
          type: 'wrap_up',
          label: 'Wrap-Up',
          description: 'Ready to complete check-in'
        },
        {
          type: 'escalate',
          label: 'Escalate',
          description: 'Full takeover needed'
        }
      ],
      message: `You've been checked into this job for ${Math.floor(checkInDuration)} minutes. Is this still ongoing?`
    };
  }

  return {
    shouldPrompt: false,
    duration: checkInDuration,
    message: 'Check-in duration is within normal range'
  };
}

// ADD NEW function for equipment chain-of-custody logging
function logEquipmentDelivery(params) {
  const {
    leadId,
    bubblerId,
    jobId,
    equipmentType, // dropdown selection
    deliveryTime = new Date().toISOString(),
    location,
    notes
  } = params;

  const equipmentLog = {
    leadId,
    bubblerId,
    jobId,
    equipmentType,
    deliveryTime,
    location,
    notes: notes || '',
    status: 'delivered',
    timestamp: new Date().toISOString()
  };

  // Log to database
  saveEquipmentDeliveryLog(equipmentLog);

  return {
    success: true,
    equipmentLog,
    message: `${equipmentType} delivered successfully`,
    requiresFollowUp: true // Flag for admin review
  };
}

// ADD NEW function for job rejection timeout
function checkJobRejectionTimeout(params) {
  const {
    leadId,
    bubblerId,
    claimTime,
    currentTime = new Date().toISOString(),
    warningThreshold = 3, // minutes
    timeoutThreshold = 5, // minutes
    currentLocation,
    previousLocation
  } = params;

  const claimStart = new Date(claimTime);
  const now = new Date(currentTime);
  const timeSinceClaim = (now - claimStart) / 60000; // minutes

  // Check for GPS movement
  let hasMoved = false;
  if (previousLocation && currentLocation) {
    const distance = calculateDistance(previousLocation, currentLocation);
    hasMoved = distance > 0.1; // 0.1 mile threshold
  }

  // 3-minute warning
  if (timeSinceClaim >= warningThreshold && !hasMoved) {
    return {
      status: 'warning',
      timeSinceClaim,
      hasMoved,
      message: "We've noticed you haven't moved in 3 minutes. Are you still on the way?",
      options: [
        {
          type: 'continue',
          label: 'Yes, I\'m on my way',
          action: 'continue_assignment'
        },
        {
          type: 'cancel',
          label: 'Cancel assignment',
          action: 'cancel_assignment'
        }
      ],
      requiresResponse: true
    };
  }

  // 5-minute timeout
  if (timeSinceClaim >= timeoutThreshold && !hasMoved) {
    return {
      status: 'timeout',
      timeSinceClaim,
      hasMoved,
      message: 'Assignment timed out due to no movement. Returning to job pool.',
      action: 'reassign_job',
      strikeAdded: true
    };
  }

  return {
    status: 'active',
    timeSinceClaim,
    hasMoved,
    message: 'Assignment is active and moving'
  };
}

// ADD NEW function for billing timer enforcement
function enforceBillingTimer(params) {
  const {
    leadId,
    status,
    startTime,
    currentTime = new Date().toISOString(),
    gpsMovement = true,
    idleDuration = 0
  } = params;

  const billingRules = {
    'en_route': {
      billable: gpsMovement && idleDuration < 5,
      maxDuration: null,
      notes: 'GPS must confirm movement, no pay after 5 min idle'
    },
    'check_in': {
      billable: true,
      maxDuration: null,
      notes: 'Active on-site QA'
    },
    'wrap_up': {
      billable: true,
      maxDuration: 3, // minutes
      notes: 'Autosave + timed prompt, max 3 minutes'
    },
    'none': {
      billable: false,
      maxDuration: null,
      notes: 'No status - no pay until valid status'
    }
  };

  const rule = billingRules[status] || billingRules['none'];
  const duration = (new Date(currentTime) - new Date(startTime)) / 60000; // minutes

  let isBillable = rule.billable;
  let message = rule.notes;

  // Check max duration for wrap-up
  if (status === 'wrap_up' && rule.maxDuration && duration > rule.maxDuration) {
    isBillable = false;
    message = 'Wrap-up time exceeded 3 minutes - no longer billable';
  }

  // Check idle timeout for en_route
  if (status === 'en_route' && idleDuration >= 5) {
    isBillable = false;
    message = 'En route idle for 5+ minutes - no longer billable';
  }

  return {
    isBillable,
    status,
    duration,
    idleDuration,
    gpsMovement,
    message,
    rule: rule
  };
}

// ADD NEW function for supervisor notes
function addSupervisorNote(params) {
  const {
    leadId,
    noteType, // 'time_exceeded', 'multiple_redos', 'assistance_exceeded'
    note,
    maxLength = 60
  } = params;

  if (!note || note.trim().length === 0) {
    return {
      success: false,
      error: 'Supervisor note cannot be empty'
    };
  }

  if (note.trim().length > maxLength) {
    return {
      success: false,
      error: `Supervisor note must be ${maxLength} characters or less`
    };
  }

  const supervisorNote = {
    leadId,
    noteType,
    note: note.trim(),
    timestamp: new Date().toISOString(),
    reviewed: false
  };

  // Save to database
  saveSupervisorNote(supervisorNote);

  return {
    success: true,
    supervisorNote,
    message: 'Supervisor note added successfully'
  };
}

// ADD NEW function for bubbler performance prediction
function predictBubblerRisk(params) {
  const {
    bubblerId,
    daysBack = 90
  } = params;

  // Get bubbler performance data
  const performanceData = getBubblerPerformanceData(bubblerId, daysBack);
  
  const {
    averageRating,
    completionSpeed,
    jobTypes,
    equipmentRequests,
    reschedules,
    cancellations,
    redIssues,
    assistanceRequests
  } = performanceData;

  // Calculate risk score (0-100)
  let riskScore = 50; // Base score

  // Rating impact (higher rating = lower risk)
  if (averageRating >= 4.5) riskScore -= 20;
  else if (averageRating >= 4.0) riskScore -= 10;
  else if (averageRating <= 3.0) riskScore += 20;
  else if (averageRating <= 2.0) riskScore += 30;

  // Completion speed impact
  if (completionSpeed === 'fast') riskScore -= 15;
  else if (completionSpeed === 'slow') riskScore += 15;

  // Equipment requests impact
  if (equipmentRequests > 5) riskScore += 10;
  if (equipmentRequests > 10) riskScore += 15;

  // Cancellation/reschedule impact
  if (cancellations > 3) riskScore += 20;
  if (reschedules > 5) riskScore += 15;

  // Red issues impact
  if (redIssues > 2) riskScore += 25;
  if (redIssues > 5) riskScore += 35;

  // Assistance requests impact
  if (assistanceRequests > 3) riskScore += 10;
  if (assistanceRequests > 7) riskScore += 20;

  // Determine risk level
  let riskLevel = 'moderate';
  if (riskScore <= 20) riskLevel = 'very_low_risk';
  else if (riskScore <= 35) riskLevel = 'low_risk';
  else if (riskScore <= 65) riskLevel = 'moderate';
  else if (riskScore <= 80) riskLevel = 'high_risk';
  else riskLevel = 'critical';

  return {
    bubblerId,
    riskScore,
    riskLevel,
    performanceData,
    recommendations: generateRiskRecommendations(riskLevel, performanceData),
    lastUpdated: new Date().toISOString()
  };
}

// ADD NEW function to generate risk recommendations
function generateRiskRecommendations(riskLevel, performanceData) {
  const recommendations = [];

  switch (riskLevel) {
    case 'very_low_risk':
      recommendations.push('Routine oversight only');
      recommendations.push('Consider for lead training');
      break;
    case 'low_risk':
      recommendations.push('Light oversight');
      recommendations.push('Random spot checks');
      break;
    case 'moderate':
      recommendations.push('Standard oversight');
      recommendations.push('Monitor for trends');
      break;
    case 'high_risk':
      recommendations.push('Increased oversight');
      recommendations.push('Consider additional training');
      recommendations.push('Monitor closely for improvement');
      break;
    case 'critical':
      recommendations.push('Immediate intervention required');
      recommendations.push('Consider suspension or termination');
      recommendations.push('Admin review mandatory');
      break;
  }

  return recommendations;
}

// ADD NEW function for Environmental QA Checklist (Home-Based Fresh Bubbler)
function generateEnvironmentalQAChecklist(params) {
  const {
    bubblerId,
    jobId,
    serviceType,
    isHomeBased = false
  } = params;

  // Only trigger for home-based Fresh Bubbler
  if (serviceType !== 'laundry' || !isHomeBased) {
    return {
      requiresEnvironmentalQA: false,
      message: 'Environmental QA not required for this service type or location'
    };
  }

  const environmentalChecklist = {
    type: 'environmental_qa',
    serviceType: 'laundry',
    isHomeBased: true,
    categories: [
      {
        id: 'odor',
        name: 'Odor',
        requirement: 'No strong pet odors or tobacco smoke',
        passFail: null, // Will be set by Lead
        requiresPhoto: false,
        notes: '',
        autoSuggestTags: ['pet_odor', 'tobacco_smoke', 'clean_air'],
        isCritical: false
      },
      {
        id: 'surface_cleanliness',
        name: 'Surface Cleanliness',
        requirement: 'Area where laundry is being handled (folded/sorted) must be clean and wiped down',
        passFail: null,
        requiresPhoto: false,
        notes: '',
        autoSuggestTags: ['clean_surfaces', 'wiped_down', 'organized_area'],
        isCritical: false
      },
      {
        id: 'pets',
        name: 'Pets',
        requirement: 'No free-roaming pets near laundry',
        passFail: null,
        requiresPhoto: false,
        notes: '',
        autoSuggestTags: ['pets_secured', 'no_pets_present', 'pets_roaming'],
        isCritical: true
      },
      {
        id: 'pest_presence',
        name: 'Pest Presence',
        requirement: 'No visible insects (esp. roaches, ants, fleas)',
        passFail: null,
        requiresPhoto: false,
        notes: '',
        autoSuggestTags: ['no_pests', 'insects_present', 'clean_environment'],
        isCritical: true
      },
      {
        id: 'laundry_setup',
        name: 'Laundry Setup',
        requirement: 'Dirty laundry must be separated from clean; folding area must be organized',
        passFail: null,
        requiresPhoto: false,
        notes: '',
        autoSuggestTags: ['separated_laundry', 'organized_folding', 'proper_setup'],
        isCritical: false
      },
      {
        id: 'home_laundry_machine',
        name: 'Home Laundry Machine (if used)',
        requirement: 'Washer/dryer visibly clean, no lint overflow or standing water',
        passFail: null,
        requiresPhoto: false,
        notes: '',
        autoSuggestTags: ['clean_machines', 'no_lint_overflow', 'no_standing_water'],
        isCritical: false
      }
    ],
    totalCategories: 6,
    passedCategories: 0,
    failedCategories: 0,
    criticalFailures: 0,
    requiresImmediateAction: false
  };

  return {
    requiresEnvironmentalQA: true,
    checklist: environmentalChecklist,
    message: 'Environmental QA required for home-based Fresh Bubbler'
  };
}

// ADD NEW function to evaluate Environmental QA
function evaluateEnvironmentalQA(params) {
  const {
    leadId,
    bubblerId,
    jobId,
    checklist,
    photos = []
  } = params;

  const evaluation = {
    leadId,
    bubblerId,
    jobId,
    timestamp: new Date().toISOString(),
    categories: checklist.categories,
    totalCategories: checklist.totalCategories,
    passedCategories: 0,
    failedCategories: 0,
    criticalFailures: 0,
    requiresImmediateAction: false,
    actionRequired: null
  };

  // Count results
  checklist.categories.forEach(category => {
    if (category.passFail === true) {
      evaluation.passedCategories++;
    } else if (category.passFail === false) {
      evaluation.failedCategories++;
      if (category.isCritical) {
        evaluation.criticalFailures++;
      }
    }
  });

  // Determine if immediate action is required
  const hasCriticalFailure = evaluation.criticalFailures > 0;
  const hasMultipleFailures = evaluation.failedCategories >= 2;

  if (hasCriticalFailure || hasMultipleFailures) {
    evaluation.requiresImmediateAction = true;
    evaluation.actionRequired = 'fail_unsafe_conditions';
  }

  // Add photo requirements for failed categories
  const failedCategories = checklist.categories.filter(cat => cat.passFail === false);
  const requiresPhotos = failedCategories.length > 0;

  if (requiresPhotos && photos.length === 0) {
    evaluation.error = 'Photos required for failed environmental categories';
  }

  return {
    success: !evaluation.error,
    evaluation,
    error: evaluation.error,
    requiresPhotos,
    failedCategories: failedCategories.map(cat => cat.name)
  };
}

// ADD NEW function to handle Environmental QA failure
function handleEnvironmentalQAFailure(params) {
  const {
    leadId,
    bubblerId,
    jobId,
    evaluation,
    photos,
    failureReason
  } = params;

  // Log the failure
  const failureLog = {
    leadId,
    bubblerId,
    jobId,
    timestamp: new Date().toISOString(),
    failureType: 'environmental_qa_failure',
    failureReason,
    evaluation,
    photos,
    action: 'job_removal'
  };

  // Get bubbler's failure history
  const failureHistory = getBubblerFailureHistory(bubblerId, 'environmental_qa_failure');
  const failureCount = failureHistory.length + 1;

  // Determine consequences based on failure count
  let consequences = {
    jobRemoved: true,
    strikeAdded: true,
    coachingRequired: true,
    temporarySuspension: false,
    permanentRevocation: false,
    message: ''
  };

  switch (failureCount) {
    case 1:
      consequences.message = 'First environmental QA failure. Job removed, 1 strike added, coaching required.';
      break;
    case 2:
      consequences.temporarySuspension = true;
      consequences.message = 'Second environmental QA failure. Temporary suspension from working from home.';
      break;
    case 3:
      consequences.permanentRevocation = true;
      consequences.message = 'Third environmental QA failure. Permanent revocation of home-based Fresh Bubbler status.';
      break;
    default:
      consequences.message = 'Multiple environmental QA failures. Severe consequences applied.';
  }

  // Trigger job reassignment to laundromat-based backup
  const reassignment = reassignJobToLaundromatBackup(jobId, bubblerId);

  // Notify admin
  const adminAlert = {
    type: 'environmental_qa_failure',
    bubblerId,
    jobId,
    leadId,
    failureCount,
    consequences,
    timestamp: new Date().toISOString(),
    severity: 'high'
  };

  sendAdminAlert(adminAlert);

  return {
    success: true,
    failureLog,
    consequences,
    reassignment,
    adminAlert,
    message: consequences.message
  };
}

// ADD NEW function to check if Environmental QA mode should be triggered
function checkEnvironmentalQAMode(params) {
  const {
    bubblerId,
    serviceType,
    workLocation // 'home' or 'laundromat'
  } = params;

  // Check if this is a home-based Fresh Bubbler
  const bubblerProfile = getBubblerProfile(bubblerId);
  const isHomeBased = workLocation === 'home' && serviceType === 'laundry';
  const hasHomeApproval = bubblerProfile.homeEnvironmentApproved;

  if (isHomeBased && hasHomeApproval) {
    return {
      requiresEnvironmentalQA: true,
      mode: 'environmental_qa_mode',
      message: 'Environmental QA mode activated for home-based Fresh Bubbler',
      checklist: generateEnvironmentalQAChecklist({
        bubblerId,
        serviceType,
        isHomeBased: true
      }).checklist
    };
  }

  return {
    requiresEnvironmentalQA: false,
    mode: 'standard_qa_mode',
    message: 'Standard QA mode for laundromat-based Fresh Bubbler'
  };
}

// ADD NEW function for home environment approval process
function submitHomeEnvironmentApproval(params) {
  const {
    bubblerId,
    foldingAreaPhoto,
    washerDryerPhoto,
    noPestsDeclaration,
    petInformation,
    additionalNotes
  } = params;

  const approvalRequest = {
    bubblerId,
    timestamp: new Date().toISOString(),
    status: 'pending',
    documents: {
      foldingAreaPhoto,
      washerDryerPhoto,
      noPestsDeclaration
    },
    petInformation: petInformation || {
      hasPets: false,
      petLocation: null,
      securedDuringLaundry: false
    },
    additionalNotes,
    reviewedBy: null,
    reviewedAt: null,
    approved: false
  };

  // Save approval request
  saveHomeEnvironmentApproval(approvalRequest);

  return {
    success: true,
    approvalRequest,
    message: 'Home environment approval request submitted. Awaiting admin review.'
  };
}

// ADD NEW function to process home environment approval
function processHomeEnvironmentApproval(params) {
  const {
    approvalId,
    adminId,
    approved,
    reviewNotes,
    conditions = []
  } = params;

  const approval = getHomeEnvironmentApproval(approvalId);
  
  if (!approval) {
    return {
      success: false,
      error: 'Approval request not found'
    };
  }

  approval.status = approved ? 'approved' : 'rejected';
  approval.reviewedBy = adminId;
  approval.reviewedAt = new Date().toISOString();
  approval.reviewNotes = reviewNotes;
  approval.conditions = conditions;

  // Update bubbler profile
  if (approved) {
    updateBubblerProfile(approval.bubblerId, {
      homeEnvironmentApproved: true,
      homeApprovalDate: new Date().toISOString(),
      homeApprovalConditions: conditions
    });
  }

  // Save updated approval
  saveHomeEnvironmentApproval(approval);

  return {
    success: true,
    approval,
    message: `Home environment ${approved ? 'approved' : 'rejected'} by admin`
  };
}

// ADD NEW function for pre-check reminders
function sendPreCheckReminder(params) {
  const {
    bubblerId,
    leadArrivalTime,
    reminderMinutes = 60 // minutes before arrival
  } = params;

  const reminderTime = new Date(leadArrivalTime);
  reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);

  const reminder = {
    bubblerId,
    type: 'environmental_pre_check',
    message: 'Reminder: Secure pets, clean area, prepare environment for Lead Bubbler arrival',
    scheduledTime: reminderTime,
    sent: false
  };

  // Schedule reminder
  scheduleReminder(reminder);

  return {
    success: true,
    reminder,
    message: `Pre-check reminder scheduled for ${reminderTime.toLocaleString()}`
  };
}

// ADD NEW function to get environmental history
function getEnvironmentalHistory(params) {
  const {
    bubblerId,
    daysBack = 90
  } = params;

  const history = getBubblerEnvironmentalHistory(bubblerId, daysBack);

  return {
    success: true,
    history,
    summary: {
      totalChecks: history.length,
      passedChecks: history.filter(h => h.passed).length,
      failedChecks: history.filter(h => !h.passed).length,
      failureRate: history.length > 0 ? (history.filter(h => !h.passed).length / history.length) * 100 : 0
    }
  };
}

// ADD NEW function for Fresh Bubbler Location Tracking (Laundromat Work Mode)
function startFreshBubblerLocationTracking(params) {
  const {
    bubblerId,
    jobId,
    workLocation, // 'laundromat' or 'home'
    gpsCoordinates,
    laundromatName = null,
    timestamp = new Date().toISOString()
  } = params;

  // Validate GPS coordinates
  if (!gpsCoordinates || !gpsCoordinates.lat || !gpsCoordinates.lng) {
    return {
      success: false,
      error: 'GPS coordinates required for job tracking',
      message: 'Location required for job tracking. Please enable location services.',
      requiresRetry: true
    };
  }

  const locationTracking = {
    bubblerId,
    jobId,
    workLocation,
    gpsCoordinates,
    laundromatName,
    startTime: timestamp,
    status: 'active',
    pinValidUntil: new Date(new Date(timestamp).getTime() + (2 * 60 * 60 * 1000)).toISOString(), // 2 hours
    isVisibleToLeads: true,
    lastUpdated: timestamp,
    movementHistory: [{
      timestamp,
      coordinates: gpsCoordinates,
      laundromatName
    }]
  };

  // Save location tracking data
  saveFreshBubblerLocation(locationTracking);

  return {
    success: true,
    locationTracking,
    message: workLocation === 'home' ? 
      'Home-based work confirmed. Environmental QA mode activated.' : 
      `Laundromat work confirmed at ${laundromatName || 'selected location'}.`,
    requiresEnvironmentalQA: workLocation === 'home'
  };
}

// ADD NEW function to update Fresh Bubbler location during job
function updateFreshBubblerLocation(params) {
  const {
    bubblerId,
    jobId,
    newCoordinates,
    newLaundromatName = null,
    timestamp = new Date().toISOString()
  } = params;

  const currentTracking = getFreshBubblerLocation(bubblerId, jobId);
  
  if (!currentTracking) {
    return {
      success: false,
      error: 'No active location tracking found for this job'
    };
  }

  // Check if pin is still valid (within 2 hours)
  const pinExpiry = new Date(currentTracking.pinValidUntil);
  const now = new Date(timestamp);
  
  if (now > pinExpiry) {
    return {
      success: false,
      error: 'Location pin has expired. Please restart job tracking.',
      requiresRestart: true
    };
  }

  // Calculate movement distance
  const distance = calculateDistance(currentTracking.gpsCoordinates, newCoordinates);
  const hasMoved = distance > 0.1; // 0.1 mile threshold

  // Update tracking data
  currentTracking.gpsCoordinates = newCoordinates;
  currentTracking.laundromatName = newLaundromatName || currentTracking.laundromatName;
  currentTracking.lastUpdated = timestamp;
  currentTracking.hasMoved = hasMoved;

  // Add to movement history
  currentTracking.movementHistory.push({
    timestamp,
    coordinates: newCoordinates,
    laundromatName: newLaundromatName,
    distance: distance
  });

  // Save updated tracking
  saveFreshBubblerLocation(currentTracking);

  return {
    success: true,
    locationTracking: currentTracking,
    hasMoved,
    distance,
    message: hasMoved ? 
      `Location updated. Moved ${distance.toFixed(2)} miles.` : 
      'Location updated. No significant movement detected.'
  };
}

// ADD NEW function to get Fresh Bubbler locations for Lead Dashboard
function getFreshBubblerLocationsForLeads(params) {
  const {
    leadLocation,
    serviceType = 'laundry',
    maxDistance = 30, // miles
    includeHomeBased = false
  } = params;

  const activeFreshBubblers = getActiveFreshBubblers(serviceType);
  const nearbyBubblers = [];

  activeFreshBubblers.forEach(bubbler => {
    const locationTracking = getFreshBubblerLocation(bubbler.id, bubbler.activeJobId);
    
    if (!locationTracking) return;

    // Skip home-based if not requested
    if (locationTracking.workLocation === 'home' && !includeHomeBased) return;

    // Check if pin is still valid
    const pinExpiry = new Date(locationTracking.pinValidUntil);
    const now = new Date();
    
    if (now > pinExpiry) return;

    // Calculate distance to Lead
    const distance = calculateDistance(leadLocation, locationTracking.gpsCoordinates);
    
    if (distance <= maxDistance) {
      nearbyBubblers.push({
        bubblerId: bubbler.id,
        jobId: locationTracking.jobId,
        workLocation: locationTracking.workLocation,
        gpsCoordinates: locationTracking.gpsCoordinates,
        laundromatName: locationTracking.laundromatName,
        distance: distance,
        startTime: locationTracking.startTime,
        timeElapsed: Math.floor((now - new Date(locationTracking.startTime)) / 60000), // minutes
        lastUpdated: locationTracking.lastUpdated,
        hasMoved: locationTracking.hasMoved,
        status: locationTracking.status,
        requiresEnvironmentalQA: locationTracking.workLocation === 'home'
      });
    }
  });

  return {
    success: true,
    nearbyBubblers,
    totalCount: nearbyBubblers.length,
    message: `Found ${nearbyBubblers.length} active Fresh Bubblers within ${maxDistance} miles`
  };
}

// ADD NEW function for Lead to claim QA visit
function claimFreshBubblerQAVisit(params) {
  const {
    leadId,
    bubblerId,
    jobId,
    leadLocation,
    timestamp = new Date().toISOString()
  } = params;

  const locationTracking = getFreshBubblerLocation(bubblerId, jobId);
  
  if (!locationTracking) {
    return {
      success: false,
      error: 'No active location tracking found for this Fresh Bubbler'
    };
  }

  // Calculate route and directions
  const route = calculateRoute(leadLocation, locationTracking.gpsCoordinates);
  const estimatedTravelTime = Math.ceil(route.distance * 2); // Rough estimate: 2 minutes per mile

  const qaVisit = {
    leadId,
    bubblerId,
    jobId,
    claimTime: timestamp,
    leadLocation,
    bubblerLocation: locationTracking.gpsCoordinates,
    route,
    estimatedTravelTime,
    status: 'claimed',
    requiresEnvironmentalQA: locationTracking.workLocation === 'home'
  };

  // Save QA visit claim
  saveQAVisitClaim(qaVisit);

  return {
    success: true,
    qaVisit,
    message: `QA visit claimed. Estimated travel time: ${estimatedTravelTime} minutes.`,
    route: {
      distance: route.distance,
      estimatedTime: estimatedTravelTime,
      directions: route.directions
    }
  };
}

// ADD NEW function to detect Fresh Bubbler movement patterns
function detectFreshBubblerMovementPatterns(params) {
  const {
    bubblerId,
    daysBack = 30
  } = params;

  const movementHistory = getFreshBubblerMovementHistory(bubblerId, daysBack);
  const laundromatUsage = {};
  const movementPatterns = [];

  // Analyze laundromat usage
  movementHistory.forEach(entry => {
    const laundromat = entry.laundromatName || 'Unknown Location';
    if (!laundromatUsage[laundromat]) {
      laundromatUsage[laundromat] = {
        count: 0,
        totalTime: 0,
        lastUsed: null
      };
    }
    
    laundromatUsage[laundromat].count++;
    laundromatUsage[laundromat].totalTime += entry.duration || 0;
    laundromatUsage[laundromat].lastUsed = entry.timestamp;
  });

  // Detect potential avoidance patterns
  const uniqueLaundromats = Object.keys(laundromatUsage);
  const highFrequencySwitching = uniqueLaundromats.length > 5; // More than 5 different laundromats
  const shortDurationVisits = Object.values(laundromatUsage).some(usage => 
    usage.count > 3 && (usage.totalTime / usage.count) < 30 // Less than 30 minutes average
  );

  if (highFrequencySwitching || shortDurationVisits) {
    movementPatterns.push({
      type: 'potential_avoidance',
      severity: 'medium',
      description: 'Frequent laundromat switching detected',
      laundromatCount: uniqueLaundromats.length,
      averageDuration: Object.values(laundromatUsage).reduce((sum, usage) => 
        sum + (usage.totalTime / usage.count), 0) / uniqueLaundromats.length
    });
  }

  return {
    success: true,
    laundromatUsage,
    movementPatterns,
    totalJobs: movementHistory.length,
    uniqueLaundromats: uniqueLaundromats.length,
    requiresReview: movementPatterns.length > 0
  };
}

// ADD NEW function to get recent laundromats for Fresh Bubbler
function getRecentLaundromats(params) {
  const {
    bubblerId,
    limit = 5
  } = params;

  const movementHistory = getFreshBubblerMovementHistory(bubblerId, 90); // Last 90 days
  const laundromatFrequency = {};

  // Count frequency of each laundromat
  movementHistory.forEach(entry => {
    const laundromat = entry.laundromatName || 'Unknown Location';
    if (!laundromatFrequency[laundromat]) {
      laundromatFrequency[laundromat] = 0;
    }
    laundromatFrequency[laundromat]++;
  });

  // Sort by frequency and return top laundromats
  const recentLaundromats = Object.entries(laundromatFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([name, count]) => ({
      name,
      usageCount: count,
      lastUsed: movementHistory.find(entry => 
        (entry.laundromatName || 'Unknown Location') === name
      )?.timestamp
    }));

  return {
    success: true,
    recentLaundromats,
    totalLaundromats: Object.keys(laundromatFrequency).length
  };
}

// ADD NEW function to handle GPS disabled scenario
function handleGPSDisabled(params) {
  const {
    bubblerId,
    jobId,
    timestamp = new Date().toISOString()
  } = params;

  const gpsDisabledLog = {
    bubblerId,
    jobId,
    timestamp,
    type: 'gps_disabled',
    status: 'blocked'
  };

  // Save GPS disabled log
  saveGPSDisabledLog(gpsDisabledLog);

  return {
    success: false,
    error: 'Location services required',
    message: 'Location required for job tracking. Please enable location services.',
    requiresRetry: true,
    retryCount: getGPSRetryCount(bubblerId, jobId),
    maxRetries: 3
  };
}

// ADD NEW function to validate laundromat selection
function validateLaundromatSelection(params) {
  const {
    laundromatName,
    gpsCoordinates,
    knownLaundromats = []
  } = params;

  // Check if laundromat name matches known locations
  const matchingLaundromat = knownLaundromats.find(laundromat => 
    laundromat.name.toLowerCase().includes(laundromatName.toLowerCase()) ||
    calculateDistance(laundromat.coordinates, gpsCoordinates) < 0.5 // Within 0.5 miles
  );

  return {
    success: true,
    isValid: true,
    matchingLaundromat,
    isKnownLocation: !!matchingLaundromat,
    suggestedName: matchingLaundromat?.name || laundromatName,
    coordinates: gpsCoordinates
  };
}

// ADD NEW function to get admin laundromat usage analytics
function getAdminLaundromatAnalytics(params) {
  const {
    daysBack = 30,
    includePatterns = true
  } = params;

  const allFreshBubblerData = getAllFreshBubblerData(daysBack);
  const laundromatAnalytics = {};
  const patternAlerts = [];

  // Aggregate laundromat usage
  allFreshBubblerData.forEach(data => {
    const laundromat = data.laundromatName || 'Unknown Location';
    if (!laundromatAnalytics[laundromat]) {
      laundromatAnalytics[laundromat] = {
        totalJobs: 0,
        uniqueBubblers: new Set(),
        totalRevenue: 0,
        averageJobDuration: 0,
        lastUsed: null
      };
    }
    
    laundromatAnalytics[laundromat].totalJobs++;
    laundromatAnalytics[laundromat].uniqueBubblers.add(data.bubblerId);
    laundromatAnalytics[laundromat].totalRevenue += data.jobRevenue || 0;
    laundromatAnalytics[laundromat].lastUsed = data.timestamp;
  });

  // Calculate averages and identify high-volume locations
  Object.keys(laundromatAnalytics).forEach(laundromat => {
    const analytics = laundromatAnalytics[laundromat];
    analytics.uniqueBubblerCount = analytics.uniqueBubblers.size;
    analytics.averageJobDuration = analytics.totalJobs > 0 ? 
      analytics.totalJobs / analytics.totalJobs : 0;
    
    // Identify high-volume locations for potential partnerships
    if (analytics.totalJobs > 50) {
      patternAlerts.push({
        type: 'high_volume_location',
        laundromat,
        totalJobs: analytics.totalJobs,
        uniqueBubblers: analytics.uniqueBubblerCount,
        recommendation: 'Consider partnership opportunity'
      });
    }
  });

  return {
    success: true,
    laundromatAnalytics,
    patternAlerts,
    totalLaundromats: Object.keys(laundromatAnalytics).length,
    highVolumeLocations: patternAlerts.filter(alert => alert.type === 'high_volume_location')
  };
}

// UPDATE Fresh Bubbler Laundry Flow Management to include tier-specific timers
function manageFreshBubblerLaundryFlow(params) {
  const {
    bubblerId,
    action, // 'pickup', 'job_start', 'dropoff', 'status_check'
    jobId,
    timestamp = new Date().toISOString(),
    pickupTime = null,
    deliveryDeadline = null,
    turnaroundTier = 'standard' // 'express' or 'standard'
  } = params;

  const bubblerStatus = getFreshBubblerStatus(bubblerId);
  const activeJobs = getActiveFreshBubblerJobs(bubblerId);

  let flowStatus = {
    bubblerId,
    timestamp,
    action,
    jobId,
    turnaroundTier,
    warnings: [],
    alerts: [],
    requiresAction: false
  };

  switch (action) {
    case 'pickup':
      flowStatus = handlePickupAction(bubblerId, jobId, timestamp, activeJobs, turnaroundTier);
      break;
    case 'job_start':
      flowStatus = handleJobStartAction(bubblerId, jobId, timestamp, activeJobs);
      break;
    case 'dropoff':
      flowStatus = handleDropoffAction(bubblerId, jobId, timestamp, activeJobs);
      break;
    case 'status_check':
      flowStatus = checkLaundryFlowStatus(bubblerId, activeJobs, timestamp);
      break;
  }

  return flowStatus;
}

// UPDATE pickup action to include tier-specific timers
function handlePickupAction(bubblerId, jobId, timestamp, activeJobs, turnaroundTier) {
  const pickedUpJobs = activeJobs.filter(job => job.status === 'picked_up');
  const inProgressJobs = activeJobs.filter(job => job.status === 'in_progress');

  // Check for hoarding prevention with tier-specific limits
  const maxPickupsWithoutStart = getMaxPickupsWithoutStart(turnaroundTier);
  
  if (pickedUpJobs.length >= maxPickupsWithoutStart && inProgressJobs.length === 0) {
    return {
      success: false,
      error: 'Laundry hoarding detected',
      message: `Cannot pick up more than ${maxPickupsWithoutStart} jobs without starting at least one. Please begin laundering.`,
      requiresAction: true,
      actionType: 'start_job_required',
      turnaroundTier
    };
  }

  // Check batch size limits
  const batchSizeLimit = getBatchSizeLimit(turnaroundTier);
  if (activeJobs.length >= batchSizeLimit) {
    return {
      success: false,
      error: 'Batch size limit exceeded',
      message: `Maximum ${batchSizeLimit} active jobs allowed for ${turnaroundTier} tier. Please complete some jobs first.`,
      requiresAction: true,
      actionType: 'batch_size_limit',
      turnaroundTier
    };
  }

  // Update job status with tier information
  updateJobStatus(jobId, 'picked_up', timestamp, { turnaroundTier });

  // Start tier-specific countdown timer
  const countdownTimer = startTierSpecificCountdown(bubblerId, jobId, timestamp, turnaroundTier);
  
  return {
    success: true,
    message: `Pickup completed for ${turnaroundTier} tier. ${getTimerDuration(turnaroundTier)}-hour countdown started.`,
    countdownTimer,
    requiresAction: false,
    turnaroundTier
  };
}

// ADD NEW function to get tier-specific timer duration
function getTimerDuration(turnaroundTier) {
  const timerConfig = {
    'express': 2, // 2 hours for Express (24h turnaround)
    'standard': 8  // 8 hours for Standard (36h turnaround)
  };
  
  return timerConfig[turnaroundTier] || 8; // Default to standard
}

// ADD NEW function to get max pickups without start by tier
function getMaxPickupsWithoutStart(turnaroundTier) {
  const pickupLimits = {
    'express': 2, // More strict for Express jobs
    'standard': 3  // Standard limit for Standard jobs
  };
  
  return pickupLimits[turnaroundTier] || 3;
}

// ADD NEW function to get batch size limits by tier
function getBatchSizeLimit(turnaroundTier) {
  const batchLimits = {
    'express': 4, // Smaller batches for Express (faster turnaround needed)
    'standard': 6  // Larger batches allowed for Standard
  };
  
  return batchLimits[turnaroundTier] || 6;
}

// ADD NEW function to start tier-specific countdown timer
function startTierSpecificCountdown(bubblerId, jobId, startTime, turnaroundTier) {
  const durationHours = getTimerDuration(turnaroundTier);
  const countdownDuration = durationHours * 60 * 60 * 1000; // Convert to milliseconds
  const endTime = new Date(startTime).getTime() + countdownDuration;
  const warningTime = new Date(startTime).getTime() + (countdownDuration * 0.75); // 75% mark

  const countdownTimer = {
    bubblerId,
    jobId,
    turnaroundTier,
    startTime,
    endTime,
    warningTime,
    duration: countdownDuration,
    durationHours,
    isActive: true,
    warningSent: false,
    violationSent: false,
    createdAt: new Date().toISOString()
  };

  // Save tier-specific countdown timer
  saveTierSpecificCountdown(countdownTimer);

  return countdownTimer;
}

// UPDATE job start action to clear tier-specific timers
function handleJobStartAction(bubblerId, jobId, timestamp, activeJobs) {
  const countdownTimer = getTierSpecificCountdown(bubblerId, jobId);
  
  // Clear countdown timer if active
  if (countdownTimer && countdownTimer.isActive) {
    clearTierSpecificCountdown(bubblerId, jobId);
  }

  // Update job status
  updateJobStatus(jobId, 'in_progress', timestamp);

  return {
    success: true,
    message: 'Job started successfully. Tier-specific countdown timer cleared.',
    requiresAction: false,
    turnaroundTier: countdownTimer?.turnaroundTier || 'standard'
  };
}

// UPDATE laundry flow status to include tier-specific checks
function checkLaundryFlowStatus(bubblerId, activeJobs, timestamp) {
  const pickedUpJobs = activeJobs.filter(job => job.status === 'picked_up');
  const inProgressJobs = activeJobs.filter(job => job.status === 'in_progress');
  const countdownTimers = getActiveTierSpecificCountdowns(bubblerId);
  
  const warnings = [];
  const alerts = [];

  // Check tier-specific hoarding patterns
  const expressJobs = pickedUpJobs.filter(job => job.turnaroundTier === 'express');
  const standardJobs = pickedUpJobs.filter(job => job.turnaroundTier === 'standard');

  // Express tier hoarding check
  if (expressJobs.length >= 2 && inProgressJobs.filter(job => job.turnaroundTier === 'express').length === 0) {
    alerts.push({
      type: 'express_hoarding_detected',
      severity: 'high',
      message: 'Express laundry hoarding detected. Start at least one Express job immediately.',
      requiresImmediateAction: true,
      tier: 'express'
    });
  }

  // Standard tier hoarding check
  if (standardJobs.length >= 3 && inProgressJobs.filter(job => job.turnaroundTier === 'standard').length === 0) {
    alerts.push({
      type: 'standard_hoarding_detected',
      severity: 'medium',
      message: 'Standard laundry hoarding detected. Start at least one Standard job soon.',
      requiresAction: true,
      tier: 'standard'
    });
  }

  // Check tier-specific countdown timers
  countdownTimers.forEach(timer => {
    const timeRemaining = timer.endTime - new Date(timestamp).getTime();
    const minutesRemaining = Math.floor(timeRemaining / 60000);
    const warningThreshold = timer.duration * 0.25 / 60000; // 25% remaining

    // Send warning at 75% mark
    if (minutesRemaining <= warningThreshold && !timer.warningSent) {
      warnings.push({
        type: 'tier_countdown_warning',
        severity: 'medium',
        message: `${timer.turnaroundTier} job ${timer.jobId} must start within ${Math.floor(minutesRemaining)} minutes.`,
        jobId: timer.jobId,
        tier: timer.turnaroundTier,
        requiresAction: true
      });
      
      // Mark warning as sent
      markCountdownWarningSent(timer.bubblerId, timer.jobId);
    }

    // Send violation at 100% mark
    if (minutesRemaining <= 0 && !timer.violationSent) {
      alerts.push({
        type: 'tier_countdown_expired',
        severity: 'critical',
        message: `${timer.turnaroundTier} job ${timer.jobId} start timer expired. Job flagged for delay.`,
        jobId: timer.jobId,
        tier: timer.turnaroundTier,
        requiresImmediateAction: true
      });
      
      // Mark violation as sent and flag job
      markCountdownViolationSent(timer.bubblerId, timer.jobId);
      flagJobForDelay(timer.jobId, timer.turnaroundTier);
    }
  });

  // Check for delayed job starts by tier
  pickedUpJobs.forEach(job => {
    const pickupTime = new Date(job.pickupTime);
    const timeSincePickup = (new Date(timestamp) - pickupTime) / 60000; // minutes
    const warningThreshold = job.turnaroundTier === 'express' ? 120 : 480; // 2h vs 8h

    if (timeSincePickup > warningThreshold) {
      alerts.push({
        type: 'delayed_job_start',
        severity: 'medium',
        message: `${job.turnaroundTier} job ${job.id} picked up ${Math.floor(timeSincePickup)} minutes ago. Consider starting soon.`,
        jobId: job.id,
        tier: job.turnaroundTier,
        requiresAction: true
      });
    }
  });

  // Check for approaching delivery deadlines by tier
  activeJobs.forEach(job => {
    if (job.deliveryDeadline) {
      const deadline = new Date(job.deliveryDeadline);
      const timeUntilDeadline = (deadline - new Date(timestamp)) / 60000; // minutes
      const warningThreshold = job.turnaroundTier === 'express' ? 60 : 120; // 1h vs 2h

      if (timeUntilDeadline <= warningThreshold && timeUntilDeadline > 0) {
        warnings.push({
          type: 'approaching_deadline',
          severity: 'medium',
          message: `${job.turnaroundTier} job ${job.id} delivery deadline in ${Math.floor(timeUntilDeadline)} minutes.`,
          jobId: job.id,
          tier: job.turnaroundTier,
          requiresAction: true
        });
      } else if (timeUntilDeadline <= 0) {
        alerts.push({
          type: 'deadline_passed',
          severity: 'high',
          message: `${job.turnaroundTier} job ${job.id} delivery deadline has passed.`,
          jobId: job.id,
          tier: job.turnaroundTier,
          requiresImmediateAction: true
        });
      }
    }
  });

  return {
    success: true,
    warnings,
    alerts,
    requiresAction: warnings.length > 0 || alerts.length > 0,
    summary: {
      pickedUpJobs: pickedUpJobs.length,
      inProgressJobs: inProgressJobs.length,
      totalActiveJobs: activeJobs.length,
      expressJobs: expressJobs.length,
      standardJobs: standardJobs.length,
      activeCountdowns: countdownTimers.length
    }
  };
}

// ADD NEW function to enforce tier-specific workload balance
function enforceTierSpecificWorkloadBalance(params) {
  const {
    bubblerId,
    currentAction,
    timestamp = new Date().toISOString()
  } = params;

  const activeJobs = getActiveFreshBubblerJobs(bubblerId);
  const pickedUpJobs = activeJobs.filter(job => job.status === 'picked_up');
  const inProgressJobs = activeJobs.filter(job => job.status === 'in_progress');

  const expressJobs = pickedUpJobs.filter(job => job.turnaroundTier === 'express');
  const standardJobs = pickedUpJobs.filter(job => job.turnaroundTier === 'standard');

  const rules = {
    express: {
      maxPickupsWithoutStart: 2,
      countdownDuration: 2, // hours
      maxJobAge: 120, // 2 hours in minutes
      warningThreshold: 90, // 1.5 hours in minutes
      batchSizeLimit: 4
    },
    standard: {
      maxPickupsWithoutStart: 3,
      countdownDuration: 8, // hours
      maxJobAge: 480, // 8 hours in minutes
      warningThreshold: 360, // 6 hours in minutes
      batchSizeLimit: 6
    }
  };

  const violations = [];

  // Check Express tier violations
  if (expressJobs.length > rules.express.maxPickupsWithoutStart && 
      inProgressJobs.filter(job => job.turnaroundTier === 'express').length === 0) {
    violations.push({
      rule: 'express_max_pickups_without_start',
      severity: 'high',
      message: `Cannot hold more than ${rules.express.maxPickupsWithoutStart} Express jobs without starting at least one.`,
      currentCount: expressJobs.length,
      maxAllowed: rules.express.maxPickupsWithoutStart,
      tier: 'express'
    });
  }

  // Check Standard tier violations
  if (standardJobs.length > rules.standard.maxPickupsWithoutStart && 
      inProgressJobs.filter(job => job.turnaroundTier === 'standard').length === 0) {
    violations.push({
      rule: 'standard_max_pickups_without_start',
      severity: 'medium',
      message: `Cannot hold more than ${rules.standard.maxPickupsWithoutStart} Standard jobs without starting at least one.`,
      currentCount: standardJobs.length,
      maxAllowed: rules.standard.maxPickupsWithoutStart,
      tier: 'standard'
    });
  }

  // Check batch size limits
  if (activeJobs.length > rules.express.batchSizeLimit) {
    violations.push({
      rule: 'batch_size_limit_exceeded',
      severity: 'medium',
      message: `Maximum ${rules.express.batchSizeLimit} active jobs allowed. Current: ${activeJobs.length}`,
      currentCount: activeJobs.length,
      maxAllowed: rules.express.batchSizeLimit
    });
  }

  // Check tier-specific countdown violations
  const countdownTimers = getActiveTierSpecificCountdowns(bubblerId);
  countdownTimers.forEach(timer => {
    const timeRemaining = timer.endTime - new Date(timestamp).getTime();
    if (timeRemaining <= 0) {
      violations.push({
        rule: 'tier_countdown_expired',
        severity: 'critical',
        message: `${timer.turnaroundTier} job ${timer.jobId} start timer expired.`,
        jobId: timer.jobId,
        tier: timer.turnaroundTier,
        timeExpired: Math.abs(timeRemaining) / 60000
      });
    }
  });

  return {
    success: violations.length === 0,
    violations,
    requiresAction: violations.length > 0,
    rules,
    currentStatus: {
      pickedUpJobs: pickedUpJobs.length,
      inProgressJobs: inProgressJobs.length,
      expressJobs: expressJobs.length,
      standardJobs: standardJobs.length,
      activeCountdowns: countdownTimers.length
    }
  };
}

// ADD NEW function to generate tier-specific alerts
function generateTierSpecificLaundryAlerts(params) {
  const {
    bubblerId,
    alertType, // 'express_countdown', 'standard_countdown', 'tier_hoarding', 'deadline_approaching'
    timestamp = new Date().toISOString()
  } = params;

  const activeJobs = getActiveFreshBubblerJobs(bubblerId);
  const countdownTimers = getActiveTierSpecificCountdowns(bubblerId);

  let alert = {
    type: alertType,
    bubblerId,
    timestamp,
    severity: 'medium',
    message: '',
    requiresAction: false,
    tier: null
  };

  switch (alertType) {
    case 'express_countdown':
      const expressTimers = countdownTimers.filter(timer => timer.turnaroundTier === 'express');
      if (expressTimers.length > 0) {
        const timer = expressTimers[0];
        const timeRemaining = timer.endTime - new Date(timestamp).getTime();
        const minutesRemaining = Math.floor(timeRemaining / 60000);
        
        alert.message = `Express job ${timer.jobId} must start within ${minutesRemaining} minutes.`;
        alert.severity = minutesRemaining <= 30 ? 'high' : 'medium';
        alert.requiresAction = minutesRemaining <= 30;
        alert.tier = 'express';
        alert.jobId = timer.jobId;
      }
      break;

    case 'standard_countdown':
      const standardTimers = countdownTimers.filter(timer => timer.turnaroundTier === 'standard');
      if (standardTimers.length > 0) {
        const timer = standardTimers[0];
        const timeRemaining = timer.endTime - new Date(timestamp).getTime();
        const minutesRemaining = Math.floor(timeRemaining / 60000);
        
        alert.message = `Standard job ${timer.jobId} must start within ${minutesRemaining} minutes.`;
        alert.severity = minutesRemaining <= 120 ? 'high' : 'medium'; // 2 hours for Standard
        alert.requiresAction = minutesRemaining <= 120;
        alert.tier = 'standard';
        alert.jobId = timer.jobId;
      }
      break;

    case 'tier_hoarding':
      const expressJobs = activeJobs.filter(job => job.status === 'picked_up' && job.turnaroundTier === 'express');
      const standardJobs = activeJobs.filter(job => job.status === 'picked_up' && job.turnaroundTier === 'standard');
      const inProgressJobs = activeJobs.filter(job => job.status === 'in_progress');

      if (expressJobs.length >= 2 && inProgressJobs.filter(job => job.turnaroundTier === 'express').length === 0) {
        alert.message = `Express laundry hoarding detected. ${expressJobs.length} Express jobs picked up, none started.`;
        alert.severity = 'high';
        alert.requiresAction = true;
        alert.tier = 'express';
        alert.jobIds = expressJobs.map(job => job.id);
      } else if (standardJobs.length >= 3 && inProgressJobs.filter(job => job.turnaroundTier === 'standard').length === 0) {
        alert.message = `Standard laundry hoarding detected. ${standardJobs.length} Standard jobs picked up, none started.`;
        alert.severity = 'medium';
        alert.requiresAction = true;
        alert.tier = 'standard';
        alert.jobIds = standardJobs.map(job => job.id);
      }
      break;

    case 'deadline_approaching':
      const approachingDeadlines = activeJobs.filter(job => {
        if (!job.deliveryDeadline) return false;
        const deadline = new Date(job.deliveryDeadline);
        const timeUntilDeadline = (deadline - new Date(timestamp)) / 60000;
        const warningThreshold = job.turnaroundTier === 'express' ? 60 : 120; // 1h vs 2h
        return timeUntilDeadline <= warningThreshold && timeUntilDeadline > 0;
      });

      if (approachingDeadlines.length > 0) {
        const expressDeadlines = approachingDeadlines.filter(job => job.turnaroundTier === 'express');
        const standardDeadlines = approachingDeadlines.filter(job => job.turnaroundTier === 'standard');
        
        alert.message = `${approachingDeadlines.length} job(s) approaching delivery deadline (${expressDeadlines.length} Express, ${standardDeadlines.length} Standard).`;
        alert.severity = 'medium';
        alert.requiresAction = true;
        alert.jobIds = approachingDeadlines.map(job => job.id);
      }
      break;
  }

  return alert;
}

// ADD NEW function for First-Wash Initiation Rule
function enforceFirstWashInitiationRule(params) {
  const {
    bubblerId,
    action, // 'first_pickup', 'start_wash', 'lead_check_in', 'status_check'
    jobId,
    timestamp = new Date().toISOString(),
    washLocation = null, // 'home' or 'laundromat'
    gpsCoordinates = null,
    leadCheckInId = null
  } = params;

  const activeJobs = getActiveFreshBubblerJobs(bubblerId);
  const firstWashRule = getFirstWashRule(bubblerId);

  let ruleStatus = {
    bubblerId,
    timestamp,
    action,
    jobId,
    washLocation,
    gpsCoordinates,
    leadCheckInId,
    warnings: [],
    alerts: [],
    requiresAction: false
  };

  switch (action) {
    case 'first_pickup':
      ruleStatus = handleFirstPickup(bubblerId, jobId, timestamp, activeJobs);
      break;
    case 'start_wash':
      ruleStatus = handleStartWash(bubblerId, jobId, timestamp, washLocation, gpsCoordinates, firstWashRule);
      break;
    case 'lead_check_in':
      ruleStatus = handleLeadCheckIn(bubblerId, leadCheckInId, timestamp, firstWashRule);
      break;
    case 'status_check':
      ruleStatus = checkFirstWashStatus(bubblerId, activeJobs, firstWashRule, timestamp);
      break;
  }

  return ruleStatus;
}

// ADD NEW function to handle first pickup and start 6-hour timer
function handleFirstPickup(bubblerId, jobId, timestamp, activeJobs) {
  const existingJobs = activeJobs.filter(job => job.status === 'picked_up' || job.status === 'in_progress');
  
  // Check if this is the first pickup of the day
  if (existingJobs.length === 0) {
    // Start 6-hour first-wash timer
    const firstWashTimer = startFirstWashTimer(bubblerId, timestamp);
    
    return {
      success: true,
      message: 'First pickup of the day. 6-hour first-wash timer started.',
      firstWashTimer,
      requiresAction: false,
      isFirstPickup: true
    };
  }

  return {
    success: true,
    message: 'Additional pickup. First-wash timer continues.',
    requiresAction: false,
    isFirstPickup: false
  };
}

// ADD NEW function to start first-wash timer
function startFirstWashTimer(bubblerId, startTime) {
  const deadlineHours = 6; // 6-hour deadline
  const countdownDuration = deadlineHours * 60 * 60 * 1000; // Convert to milliseconds
  const endTime = new Date(startTime).getTime() + countdownDuration;
  const warningTime = new Date(startTime).getTime() + (countdownDuration * 0.75); // 75% mark

  const firstWashTimer = {
    bubblerId,
    startTime,
    endTime,
    warningTime,
    duration: countdownDuration,
    deadlineHours,
    isActive: true,
    warningSent: false,
    violationSent: false,
    leadCheckInReceived: false,
    washStarted: false,
    createdAt: new Date().toISOString()
  };

  // Save first-wash timer
  saveFirstWashTimer(firstWashTimer);

  return firstWashTimer;
}

// ADD NEW function to handle wash start with location tracking
function handleStartWash(bubblerId, jobId, timestamp, washLocation, gpsCoordinates, firstWashTimer) {
  // Validate wash location
  if (!washLocation || !['home', 'laundromat'].includes(washLocation)) {
    return {
      success: false,
      error: 'Invalid wash location',
      message: 'Must specify wash location as "home" or "laundromat".',
      requiresAction: true
    };
  }

  // Validate GPS coordinates for location tracking
  if (!gpsCoordinates || !gpsCoordinates.lat || !gpsCoordinates.lng) {
    return {
      success: false,
      error: 'GPS coordinates required',
      message: 'Location tracking required for wash start. Please enable GPS.',
      requiresAction: true
    };
  }

  // Check if first-wash timer is active and not expired
  if (firstWashTimer && firstWashTimer.isActive) {
    const timeRemaining = firstWashTimer.endTime - new Date(timestamp).getTime();
    
    if (timeRemaining <= 0 && !firstWashTimer.leadCheckInReceived) {
      return {
        success: false,
        error: 'First-wash deadline expired',
        message: '6-hour first-wash deadline expired. Lead Bubbler check-in required before starting wash.',
        requiresAction: true,
        actionType: 'lead_check_required'
      };
    }
  }

  // Update job status to "in_wash"
  updateJobStatus(jobId, 'in_wash', timestamp, { 
    washLocation, 
    gpsCoordinates,
    washStartTime: timestamp 
  });

  // Clear first-wash timer if active
  if (firstWashTimer && firstWashTimer.isActive) {
    clearFirstWashTimer(bubblerId);
  }

  // Log wash location for oversight
  const washLocationLog = {
    bubblerId,
    jobId,
    washLocation,
    gpsCoordinates,
    timestamp,
    requiresEnvironmentalQA: washLocation === 'home'
  };

  saveWashLocationLog(washLocationLog);

  return {
    success: true,
    message: `Wash started at ${washLocation}. Location logged for oversight.`,
    washLocationLog,
    requiresAction: false,
    requiresEnvironmentalQA: washLocation === 'home'
  };
}

// ADD NEW function to handle lead check-in
function handleLeadCheckIn(bubblerId, leadCheckInId, timestamp, firstWashTimer) {
  // Validate lead check-in
  const leadCheckIn = getLeadCheckIn(leadCheckInId);
  
  if (!leadCheckIn) {
    return {
      success: false,
      error: 'Invalid lead check-in',
      message: 'Lead check-in not found.',
      requiresAction: true
    };
  }

  // Update first-wash timer to indicate lead check-in received
  if (firstWashTimer && firstWashTimer.isActive) {
    firstWashTimer.leadCheckInReceived = true;
    firstWashTimer.leadCheckInId = leadCheckInId;
    firstWashTimer.leadCheckInTime = timestamp;
    
    saveFirstWashTimer(firstWashTimer);
  }

  return {
    success: true,
    message: 'Lead check-in received. First-wash deadline extended.',
    leadCheckIn,
    requiresAction: false
  };
}

// ADD NEW function to check first-wash status
function checkFirstWashStatus(bubblerId, activeJobs, firstWashTimer, timestamp) {
  const pickedUpJobs = activeJobs.filter(job => job.status === 'picked_up');
  const inWashJobs = activeJobs.filter(job => job.status === 'in_wash');
  
  const warnings = [];
  const alerts = [];

  // Check if first-wash timer is active
  if (firstWashTimer && firstWashTimer.isActive) {
    const timeRemaining = firstWashTimer.endTime - new Date(timestamp).getTime();
    const minutesRemaining = Math.floor(timeRemaining / 60000);
    const warningThreshold = firstWashTimer.duration * 0.25 / 60000; // 25% remaining

    // Send warning at 75% mark (4.5 hours)
    if (minutesRemaining <= warningThreshold && !firstWashTimer.warningSent) {
      warnings.push({
        type: 'first_wash_warning',
        severity: 'medium',
        message: `First wash must start within ${Math.floor(minutesRemaining)} minutes, or Lead Bubbler check-in required.`,
        minutesRemaining,
        requiresAction: true
      });
      
      // Mark warning as sent
      markFirstWashWarningSent(bubblerId);
    }

    // Send violation at 100% mark (6 hours)
    if (minutesRemaining <= 0 && !firstWashTimer.violationSent) {
      alerts.push({
        type: 'first_wash_violation',
        severity: 'critical',
        message: '6-hour first-wash deadline expired. Lead Bubbler check-in required before starting wash.',
        requiresImmediateAction: true,
        actionType: 'lead_check_required'
      });
      
      // Mark violation as sent and flag for admin
      markFirstWashViolationSent(bubblerId);
      flagBubblerForFirstWashViolation(bubblerId);
    }
  }

  // Check for jobs that need environmental QA
  const homeWashJobs = inWashJobs.filter(job => job.washLocation === 'home');
  if (homeWashJobs.length > 0) {
    const jobsNeedingQA = homeWashJobs.filter(job => !job.environmentalQACompleted);
    
    if (jobsNeedingQA.length > 0) {
      alerts.push({
        type: 'environmental_qa_required',
        severity: 'high',
        message: `${jobsNeedingQA.length} job(s) washing at home require environmental QA.`,
        jobIds: jobsNeedingQA.map(job => job.id),
        requiresAction: true
      });
    }
  }

  return {
    success: true,
    warnings,
    alerts,
    requiresAction: warnings.length > 0 || alerts.length > 0,
    summary: {
      pickedUpJobs: pickedUpJobs.length,
      inWashJobs: inWashJobs.length,
      homeWashJobs: homeWashJobs.length,
      firstWashTimerActive: firstWashTimer?.isActive || false,
      leadCheckInReceived: firstWashTimer?.leadCheckInReceived || false
    }
  };
}

// ADD NEW function to enforce first-wash initiation rules
function enforceFirstWashInitiationRules(params) {
  const {
    bubblerId,
    currentAction,
    timestamp = new Date().toISOString()
  } = params;

  const activeJobs = getActiveFreshBubblerJobs(bubblerId);
  const firstWashTimer = getFirstWashTimer(bubblerId);
  const pickedUpJobs = activeJobs.filter(job => job.status === 'picked_up');
  const inWashJobs = activeJobs.filter(job => job.status === 'in_wash');

  const rules = {
    firstWashDeadline: 6, // hours
    warningThreshold: 4.5, // hours (75% of deadline)
    requireLeadCheckIn: true,
    requireLocationTracking: true,
    requireEnvironmentalQA: true // for home washing
  };

  const violations = [];

  // Check if first-wash timer is expired
  if (firstWashTimer && firstWashTimer.isActive) {
    const timeRemaining = firstWashTimer.endTime - new Date(timestamp).getTime();
    
    if (timeRemaining <= 0 && !firstWashTimer.leadCheckInReceived && inWashJobs.length === 0) {
      violations.push({
        rule: 'first_wash_deadline_expired',
        severity: 'critical',
        message: '6-hour first-wash deadline expired without Lead Bubbler check-in.',
        timeExpired: Math.abs(timeRemaining) / 60000,
        requiresLeadCheckIn: true
      });
    }
  }

  // Check for jobs washing at home without environmental QA
  const homeWashJobs = inWashJobs.filter(job => job.washLocation === 'home');
  const jobsNeedingQA = homeWashJobs.filter(job => !job.environmentalQACompleted);
  
  if (jobsNeedingQA.length > 0) {
    violations.push({
      rule: 'environmental_qa_missing',
      severity: 'high',
      message: `${jobsNeedingQA.length} job(s) washing at home require environmental QA.`,
      jobIds: jobsNeedingQA.map(job => job.id),
      requiresEnvironmentalQA: true
    });
  }

  // Check for jobs without location tracking
  const jobsWithoutLocation = inWashJobs.filter(job => !job.gpsCoordinates);
  
  if (jobsWithoutLocation.length > 0) {
    violations.push({
      rule: 'location_tracking_missing',
      severity: 'medium',
      message: `${jobsWithoutLocation.length} job(s) missing location tracking.`,
      jobIds: jobsWithoutLocation.map(job => job.id),
      requiresLocationTracking: true
    });
  }

  return {
    success: violations.length === 0,
    violations,
    requiresAction: violations.length > 0,
    rules,
    currentStatus: {
      pickedUpJobs: pickedUpJobs.length,
      inWashJobs: inWashJobs.length,
      homeWashJobs: homeWashJobs.length,
      firstWashTimerActive: firstWashTimer?.isActive || false,
      leadCheckInReceived: firstWashTimer?.leadCheckInReceived || false
    }
  };
}

// ADD NEW function to generate first-wash alerts
function generateFirstWashAlerts(params) {
  const {
    bubblerId,
    alertType, // 'first_wash_warning', 'first_wash_violation', 'environmental_qa_required', 'lead_check_required'
    timestamp = new Date().toISOString()
  } = params;

  const activeJobs = getActiveFreshBubblerJobs(bubblerId);
  const firstWashTimer = getFirstWashTimer(bubblerId);

  let alert = {
    type: alertType,
    bubblerId,
    timestamp,
    severity: 'medium',
    message: '',
    requiresAction: false
  };

  switch (alertType) {
    case 'first_wash_warning':
      if (firstWashTimer && firstWashTimer.isActive) {
        const timeRemaining = firstWashTimer.endTime - new Date(timestamp).getTime();
        const minutesRemaining = Math.floor(timeRemaining / 60000);
        
        alert.message = `First wash must start within ${minutesRemaining} minutes, or Lead Bubbler check-in required.`;
        alert.severity = 'medium';
        alert.requiresAction = true;
      }
      break;

    case 'first_wash_violation':
      if (firstWashTimer && firstWashTimer.isActive) {
        const timeRemaining = firstWashTimer.endTime - new Date(timestamp).getTime();
        const minutesExpired = Math.abs(timeRemaining) / 60000;
        
        alert.message = `6-hour first-wash deadline expired ${Math.floor(minutesExpired)} minutes ago. Lead Bubbler check-in required.`;
        alert.severity = 'critical';
        alert.requiresAction = true;
      }
      break;

    case 'environmental_qa_required':
      const homeWashJobs = activeJobs.filter(job => job.status === 'in_wash' && job.washLocation === 'home');
      const jobsNeedingQA = homeWashJobs.filter(job => !job.environmentalQACompleted);
      
      if (jobsNeedingQA.length > 0) {
        alert.message = `${jobsNeedingQA.length} job(s) washing at home require environmental QA.`;
        alert.severity = 'high';
        alert.requiresAction = true;
        alert.jobIds = jobsNeedingQA.map(job => job.id);
      }
      break;

    case 'lead_check_required':
      alert.message = 'Lead Bubbler check-in required before starting wash.';
      alert.severity = 'high';
      alert.requiresAction = true;
      break;
  }

  return alert;
}

// ADD NEW function to detect unchecked hoarding patterns
function detectUncheckedHoardingPatterns(params) {
  const {
    bubblerId,
    daysBack = 7
  } = params;

  const jobHistory = getFreshBubblerJobHistory(bubblerId, daysBack);
  const hoardingPatterns = [];

  // Analyze daily patterns for unchecked hoarding
  const dailyPatterns = {};
  jobHistory.forEach(job => {
    const date = new Date(job.pickupTime).toDateString();
    if (!dailyPatterns[date]) {
      dailyPatterns[date] = {
        pickups: [],
        washStarts: [],
        leadCheckIns: []
      };
    }
    
    if (job.status === 'picked_up') {
      dailyPatterns[date].pickups.push(job);
    } else if (job.status === 'in_wash') {
      dailyPatterns[date].washStarts.push(job);
    }
  });

  // Detect unchecked hoarding patterns
  Object.entries(dailyPatterns).forEach(([date, patterns]) => {
    if (patterns.pickups.length >= 3) {
      const firstPickup = new Date(patterns.pickups[0].pickupTime);
      const firstWash = patterns.washStarts.length > 0 ? 
        new Date(patterns.washStarts[0].washStartTime) : null;
      
      if (firstWash) {
        const timeToFirstWash = (firstWash - firstPickup) / 60000; // minutes
        
        if (timeToFirstWash > 360) { // 6 hours
          hoardingPatterns.push({
            date,
            type: 'unchecked_hoarding',
            severity: 'high',
            description: `First wash started ${Math.floor(timeToFirstWash)} minutes after first pickup`,
            timeToFirstWash,
            pickupCount: patterns.pickups.length,
            patterns
          });
        }
      } else {
        // No wash started at all
        hoardingPatterns.push({
          date,
          type: 'no_wash_started',
          severity: 'critical',
          description: `${patterns.pickups.length} jobs picked up but no wash started`,
          pickupCount: patterns.pickups.length,
          patterns
        });
      }
    }
  });

  return {
    success: true,
    hoardingPatterns,
    totalDaysAnalyzed: Object.keys(dailyPatterns).length,
    requiresReview: hoardingPatterns.length > 0
  };
}

// Export functions for use in other modules
export {
  calculateDistance,
  getProximityRule,
  determinePriorityTier,
  filterByServiceType,
  filterByProximityAndPriority,
  generateLeadDashboard,
  generateSmartPrompts,
  handleBubblerSelection,
  claimBubbler,
  releaseBubblerClaim,
  updateLeadStatus,
  monitorGPSMovement,
  validateArrival,
  validateCheckIn,
  validateOversightMode,
  startWrapUpTimer,
  calculateWrapUpTime,
  generatePhotoPrompts,
  generateQuickSelectTags,
  autoSaveNotes,
  validateFinalSubmission,
  evaluateRoom,
  checkPartialTakeoverTrigger,
  validateAssistanceTrigger,
  startAssistanceTimer,
  monitorAssistanceTimer,
  startInRouteTimer,
  monitorInRouteMovement,
  getCompletedRooms,
  unselectBubbler,
  checkExtendedTimeInHouse,
  removeBubblerFromPool,
  generateMobileRoomInterface,
  enforceWorkflowOrder,
  checkLeadConflicts,
  submitWrapUpWithVoice,
  PROXIMITY_RULES,
  PRIORITY_TIERS,
  SERVICE_TYPES,
  LEAD_ELIGIBILITY,
  detectJobAbandonment,
  checkActiveCheckInLoop,
  logEquipmentDelivery,
  checkJobRejectionTimeout,
  enforceBillingTimer,
  addSupervisorNote,
  predictBubblerRisk,
  generateRiskRecommendations,
  generateEnvironmentalQAChecklist,
  evaluateEnvironmentalQA,
  handleEnvironmentalQAFailure,
  checkEnvironmentalQAMode,
  submitHomeEnvironmentApproval,
  processHomeEnvironmentApproval,
  sendPreCheckReminder,
  getEnvironmentalHistory,
  startFreshBubblerLocationTracking,
  updateFreshBubblerLocation,
  getFreshBubblerLocationsForLeads,
  claimFreshBubblerQAVisit,
  detectFreshBubblerMovementPatterns,
  getRecentLaundromats,
  handleGPSDisabled,
  validateLaundromatSelection,
  getAdminLaundromatAnalytics,
  manageFreshBubblerLaundryFlow,
  handlePickupAction,
  handleJobStartAction,
  handleDropoffAction,
  checkLaundryFlowStatus,
  startJobStartCountdown,
  checkIfFinalPickup,
  detectLaundryHoardingPatterns,
  enforceLaundryWorkloadBalance,
  generateLaundryFlowAlerts,
  enforceTierSpecificWorkloadBalance,
  generateTierSpecificLaundryAlerts,
  enforceFirstWashInitiationRule,
  handleFirstPickup,
  handleStartWash,
  handleLeadCheckIn,
  checkFirstWashStatus,
  enforceFirstWashInitiationRules,
  generateFirstWashAlerts,
  detectUncheckedHoardingPatterns
};

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateDistance,
    getProximityRule,
    determinePriorityTier,
    filterByServiceType,
    filterByProximityAndPriority,
    generateLeadDashboard,
    generateSmartPrompts,
    handleBubblerSelection,
    claimBubbler,
    releaseBubblerClaim,
    updateLeadStatus,
    monitorGPSMovement,
    validateArrival,
    validateCheckIn,
    validateOversightMode,
    startWrapUpTimer,
    calculateWrapUpTime,
    generatePhotoPrompts,
    generateQuickSelectTags,
    autoSaveNotes,
    validateFinalSubmission,
    evaluateRoom,
    checkPartialTakeoverTrigger,
    validateAssistanceTrigger,
    startAssistanceTimer,
    monitorAssistanceTimer,
    startInRouteTimer,
    monitorInRouteMovement,
    getCompletedRooms,
    unselectBubbler,
    checkExtendedTimeInHouse,
    removeBubblerFromPool,
    generateMobileRoomInterface,
    enforceWorkflowOrder,
    checkLeadConflicts,
    submitWrapUpWithVoice,
    PROXIMITY_RULES,
    PRIORITY_TIERS,
    SERVICE_TYPES,
    LEAD_ELIGIBILITY,
    detectJobAbandonment,
    checkActiveCheckInLoop,
    logEquipmentDelivery,
    checkJobRejectionTimeout,
    enforceBillingTimer,
    addSupervisorNote,
    predictBubblerRisk,
    generateRiskRecommendations,
    generateEnvironmentalQAChecklist,
    evaluateEnvironmentalQA,
    handleEnvironmentalQAFailure,
    checkEnvironmentalQAMode,
    submitHomeEnvironmentApproval,
    processHomeEnvironmentApproval,
    sendPreCheckReminder,
    getEnvironmentalHistory,
    startFreshBubblerLocationTracking,
    updateFreshBubblerLocation,
    getFreshBubblerLocationsForLeads,
    claimFreshBubblerQAVisit,
    detectFreshBubblerMovementPatterns,
    getRecentLaundromats,
    handleGPSDisabled,
    validateLaundromatSelection,
    getAdminLaundromatAnalytics,
    manageFreshBubblerLaundryFlow,
    handlePickupAction,
    handleJobStartAction,
    handleDropoffAction,
    checkLaundryFlowStatus,
    startJobStartCountdown,
    checkIfFinalPickup,
    detectLaundryHoardingPatterns,
    enforceLaundryWorkloadBalance,
    generateLaundryFlowAlerts,
    enforceTierSpecificWorkloadBalance,
    generateTierSpecificLaundryAlerts,
    enforceFirstWashInitiationRule,
    handleFirstPickup,
    handleStartWash,
    handleLeadCheckIn,
    checkFirstWashStatus,
    enforceFirstWashInitiationRules,
    generateFirstWashAlerts,
    detectUncheckedHoardingPatterns
  };
} 