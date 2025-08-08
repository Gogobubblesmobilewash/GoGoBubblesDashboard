/**
 * Lead Bubbler Compensation & Takeover Logic
 * Intended for implementation inside GoGoBubbles Admin Dashboard and Lead Dashboard
 * 
 * @author GoGoBubbles Development Team
 * @version 1.0.0
 * @date 2024
 */

// Constants (adjust for actual payout tiers)
const FULL_PAYOUT = 45;
const PARTIAL_BONUS = 15;
const FULL_TAKEOVER_BONUS_TIERS = [
  { range: [0, 0], leadPay: 45, bonus: 10 },
  { range: [1, 29], leadPay: 35, bonus: 8 },
  { range: [30, 49], leadPay: 25, bonus: 5 },
  { range: [50, 50], leadPay: 22.5, bonus: 3 },
];

// Tiered partial takeover bonus calculation
const TIERED_PARTIAL_BONUS = {
  calculate: (jobAmount) => {
    const bonus = Math.min(jobAmount * 0.18, 12.00);
    return Math.max(bonus, 5.00); // Minimum $5 bonus
  },
  
  getTier: (jobAmount) => {
    if (jobAmount <= 50) return { maxBonus: 8, percentage: 17.8 };
    if (jobAmount <= 75) return { maxBonus: 11, percentage: 18.0 };
    return { maxBonus: 12, percentage: 13.3 };
  }
};

/**
 * Determine takeover type based on completion metrics
 * @param {Object} params - Takeover parameters
 * @param {number} params.percentCompleted - Percentage completed by original bubbler
 * @param {Object} params.tasksRedone - Tasks that needed rework
 * @param {number} params.assistanceTime - Minutes of assistance provided
 * @param {boolean} params.bubblerLeftSite - Whether original bubbler left the site
 * @returns {string} - 'full', 'partial', or 'light'
 */
function determineTakeoverType({ percentCompleted, tasksRedone, assistanceTime, bubblerLeftSite }) {
  // If lead completed 51%+ of job → Full Takeover
  if (percentCompleted <= 49 || (assistanceTime > 30 && bubblerLeftSite)) return 'full';

  // If more than 2 moderate or 3+ minor tasks redone → Partial Takeover
  if (tasksRedone.moderate >= 2 || tasksRedone.minor >= 3 || tasksRedone.major >= 1) return 'partial';

  // If assistance under 30 minutes, minor fixes → Light Assistance (covered under hourly)
  return 'light';
}

/**
 * Calculate lead compensation based on takeover type
 * @param {Object} params - Compensation parameters
 * @param {string} params.takeoverType - Type of takeover ('full', 'partial', 'light')
 * @param {number} params.percentCompleted - Percentage completed by original bubbler
 * @param {number} params.jobAmount - Total job amount
 * @returns {Object} - Compensation details
 */
function calculateLeadCompensation({ takeoverType, percentCompleted, jobAmount = FULL_PAYOUT }) {
  if (takeoverType === 'full') {
    const tier = FULL_TAKEOVER_BONUS_TIERS.find(t => 
      percentCompleted >= t.range[0] && percentCompleted <= t.range[1]
    );
    return {
      type: 'Full Takeover',
      leadPayout: tier.leadPay, // Lead gets tier payment from original bubbler
      bonus: tier.bonus, // Company pays this bonus to lead
      overrideHourly: true,
      originalBubblerPayout: jobAmount - tier.leadPay, // Original bubbler gets reduced payment
      totalCompanyCost: tier.bonus, // Company only pays the bonus
      companyBonusCost: tier.bonus, // Company pays bonus to lead
      penaltyTransfer: 0 // No penalty transfer for full takeovers
    };
  }

  if (takeoverType === 'partial') {
    const tieredBonus = TIERED_PARTIAL_BONUS.calculate(jobAmount);
    const originalPayout = jobAmount * (percentCompleted / 100);
    const leadBasePayout = jobAmount - originalPayout;
    const finalOriginalPayout = Math.max(originalPayout - tieredBonus, 0);
    
    return {
      type: 'Partial Takeover',
      leadPayout: leadBasePayout,
      bonus: tieredBonus,
      overrideHourly: false,
      originalBubblerPayout: finalOriginalPayout,
      totalCompanyCost: 0, // No company cost for partial takeovers
      companyBonusCost: 0, // No company bonus for partial takeovers
      penaltyTransfer: tieredBonus // Penalty transferred from original bubbler to lead
    };
  }

  return {
    type: 'Light Assistance',
    leadPayout: 0,
    bonus: 0,
    overrideHourly: false,
    originalBubblerPayout: jobAmount,
    totalCompanyCost: 0,
    companyBonusCost: 0,
    penaltyTransfer: 0
  };
}

/**
 * Check for pattern abuse in light assistance
 * @param {Array} recentJobs - Array of recent job assistance records
 * @returns {Object} - Pattern analysis results
 */
function checkLightAssistancePattern(recentJobs) {
  const consecutive30MinJobs = recentJobs.filter(job => 
    job.assistanceTime === 30 && job.takeoverType === 'light'
  ).length;
  
  const patternFlag = consecutive30MinJobs >= 3;
  
  return {
    patternDetected: patternFlag,
    consecutiveCount: consecutive30MinJobs,
    recommendation: patternFlag ? 'Admin review recommended' : 'Pattern normal',
    severity: patternFlag ? 'medium' : 'low'
  };
}

/**
 * Calculate tiered lead bonus accelerator (Leadership Incentive)
 * @param {Object} params - Bonus calculation parameters
 * @param {Array} params.recentJobs - Array of recent job records
 * @param {string} params.period - Evaluation period ('week', '2weeks')
 * @returns {Object} - Bonus accelerator results
 */
function calculateTieredLeadBonus({ recentJobs, period = 'week' }) {
  // Filter jobs based on period
  const now = new Date();
  let startDate;
  let minJobs;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      minJobs = 10;
      break;
    case '2weeks':
      startDate = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
      minJobs = 20;
      break;
    default:
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      minJobs = 10;
  }
  
  const periodJobs = recentJobs.filter(job => 
    new Date(job.completedAt) >= startDate
  );
  
  if (periodJobs.length < minJobs) {
    return {
      eligible: false,
      reason: `Need ${minJobs} jobs in ${period} for evaluation`,
      jobsCompleted: periodJobs.length,
      averageRating: 0,
      tier: null
    };
  }
  
  const noTakeovers = periodJobs.every(job => job.takeoverType === 'light');
  const averageRating = periodJobs.reduce((sum, job) => sum + (job.customerRating || 0), 0) / periodJobs.length;
  
  // Determine tier based on criteria
  let tier = null;
  let bonusAmount = 0;
  
  if (noTakeovers) {
    if (period === 'week' && periodJobs.length >= 10) {
      if (averageRating >= 4.8) {
        tier = 'Tier 2';
        bonusAmount = 35;
      } else if (averageRating >= 4.7) {
        tier = 'Tier 1';
        bonusAmount = 25;
      }
    } else if (period === '2weeks' && periodJobs.length >= 20 && averageRating >= 4.85) {
      tier = 'Tier 3';
      bonusAmount = 50;
    }
  }
  
  const eligible = tier !== null;
  
  return {
    eligible,
    tier,
    reason: eligible ? `High performance with no takeovers - ${tier}` : 'Takeovers detected or low ratings',
    jobsCompleted: periodJobs.length,
    averageRating: averageRating.toFixed(2),
    bonusAmount,
    noTakeovers,
    period,
    minJobs
  };
}

/**
 * Check for customer complaint filter
 * @param {Object} jobData - Job data including assistance and complaints
 * @returns {Object} - Complaint analysis results
 */
function checkCustomerComplaintFilter(jobData) {
  const hasLightAssistance = jobData.takeoverType === 'light';
  const hasComplaint = jobData.customerComplaint && jobData.customerComplaint.severity >= 3;
  
  if (hasLightAssistance && hasComplaint) {
    return {
      flagRaised: true,
      reason: 'Customer complaint after light assistance',
      action: 'Double review of Lead and Bubbler required',
      overrideSharedScore: true,
      severity: 'high'
    };
  }
  
  return {
    flagRaised: false,
    reason: 'No pattern detected',
    action: 'Standard review process',
    overrideSharedScore: false,
    severity: 'low'
  };
}

/**
 * Check for flag overlap (same bubbler full takeover)
 * @param {Array} recentJobs - Array of recent job records
 * @param {string} bubblerId - Bubbler ID to check
 * @returns {Object} - Flag overlap analysis
 */
function checkFlagOverlap(recentJobs, bubblerId) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentFullTakeovers = recentJobs.filter(job => 
    job.originalBubblerId === bubblerId &&
    job.takeoverType === 'full' &&
    new Date(job.completedAt) >= oneWeekAgo
  );
  
  const flagRaised = recentFullTakeovers.length > 1;
  
  return {
    flagRaised,
    takeoversInWeek: recentFullTakeovers.length,
    reason: flagRaised ? 'Multiple full takeovers on same bubbler in one week' : 'Normal pattern',
    recommendation: flagRaised ? 'Review training needs or pairing issues' : 'Continue monitoring',
    severity: flagRaised ? 'medium' : 'low'
  };
}

/**
 * Track Lead Bubbler performance based on actual check-ins
 * @param {Object} params - Performance tracking parameters
 * @param {string} params.leadId - Lead Bubbler ID
 * @param {string} params.dateRange - Time frame ('week', 'month', 'quarter')
 * @param {Array} params.checkInLog - Array of check-in records
 * @returns {Object} - Performance analysis results
 */
function trackLeadReviewScore({ leadId, dateRange, checkInLog }) {
  // Filter check-ins for this lead within the date range
  const leadCheckIns = checkInLog.filter(entry => entry.leadId === leadId);
  
  // Get unique bubbler IDs that this lead actually checked in on
  const bubblerIds = [...new Set(leadCheckIns.map(entry => entry.bubblerId))];
  
  // Calculate date range for filtering
  const now = new Date();
  let startDate;
  switch (dateRange) {
    case 'week':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case 'month':
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      break;
    default:
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  }
  
  // Filter jobs for bubblers this lead checked in on, within date range
  const relevantJobs = leadCheckIns.filter(entry => 
    new Date(entry.checkInDate) >= startDate
  );
  
  // Calculate aggregate performance metrics
  const totalJobs = relevantJobs.length;
  const averageRating = relevantJobs.length > 0 
    ? relevantJobs.reduce((sum, job) => sum + (job.customerRating || 0), 0) / totalJobs 
    : 0;
  
  const takeoverRate = relevantJobs.length > 0
    ? (relevantJobs.filter(job => job.takeoverType !== 'light').length / totalJobs) * 100
    : 0;
  
  const qualityIssues = relevantJobs.filter(job => 
    job.customerComplaint && job.customerComplaint.severity >= 3
  ).length;
  
  return {
    leadId,
    dateRange,
    bubblerIds,
    totalJobs,
    averageRating: averageRating.toFixed(2),
    takeoverRate: takeoverRate.toFixed(1),
    qualityIssues,
    performanceScore: calculatePerformanceScore({
      averageRating,
      takeoverRate,
      qualityIssues,
      totalJobs
    }),
    checkInCoverage: {
      totalBubblers: bubblerIds.length,
      totalCheckIns: leadCheckIns.length,
      averageCheckInsPerBubbler: bubblerIds.length > 0 ? (leadCheckIns.length / bubblerIds.length).toFixed(1) : 0
    }
  };
}

/**
 * Calculate performance score based on multiple metrics
 * @param {Object} metrics - Performance metrics
 * @returns {number} - Performance score (0-100)
 */
function calculatePerformanceScore({ averageRating, takeoverRate, qualityIssues, totalJobs }) {
  if (totalJobs === 0) return 0;
  
  // Base score from customer ratings (0-50 points)
  const ratingScore = Math.min(averageRating * 10, 50);
  
  // Bonus for low takeover rate (0-30 points)
  const takeoverScore = Math.max(30 - (takeoverRate * 0.3), 0);
  
  // Penalty for quality issues (0-20 points deducted)
  const qualityPenalty = Math.min(qualityIssues * 5, 20);
  
  const finalScore = Math.max(ratingScore + takeoverScore - qualityPenalty, 0);
  
  return Math.round(finalScore);
}

/**
 * Get dynamic oversight coverage for a lead
 * @param {string} leadId - Lead Bubbler ID
 * @param {Date} date - Date to check coverage for
 * @returns {Object} - Coverage information
 */
function getLeadOversightCoverage(leadId, date) {
  // This would integrate with your actual check-in system
  // For now, returning a template structure
  return {
    leadId,
    date: date.toISOString().split('T')[0],
    bubblersOverseeing: [], // Will be populated from check-in logs
    jobsInspected: 0,
    coverageRadius: '45-mile working radius',
    isAgileCoverage: true,
    note: 'Coverage based on actual check-ins, not fixed geographic zones'
  };
}

/**
 * Comprehensive Lead Bubbler evaluation metrics
 * @param {Object} params - Evaluation parameters
 * @param {string} params.leadId - Lead Bubbler ID
 * @param {Array} params.leadershipJobs - Jobs where lead provided oversight
 * @param {Array} params.personalJobs - Lead's own job assignments
 * @returns {Object} - Complete evaluation results
 */
function evaluateLeadBubbler({ leadId, leadershipJobs, personalJobs }) {
  // Leadership Metrics (Coach & Oversight)
  const leadershipMetrics = calculateLeadershipMetrics(leadershipJobs);
  
  // Personal Job Metrics (Own assignments)
  const personalMetrics = calculatePersonalMetrics(personalJobs);
  
  // Overall evaluation
  const overallScore = calculateOverallScore(leadershipMetrics, personalMetrics);
  
  // Strike evaluation
  const strikes = evaluateStrikes(leadershipMetrics, personalMetrics);
  
  return {
    leadId,
    evaluationDate: new Date().toISOString(),
    leadershipMetrics,
    personalMetrics,
    overallScore,
    strikes,
    status: determineLeadStatus(strikes, overallScore),
    recommendations: generateRecommendations(leadershipMetrics, personalMetrics)
  };
}

/**
 * Calculate leadership metrics (coaching and oversight)
 * @param {Array} leadershipJobs - Jobs where lead provided oversight
 * @returns {Object} - Leadership metrics
 */
function calculateLeadershipMetrics(leadershipJobs) {
  const last14Days = leadershipJobs.filter(job => 
    new Date(job.completedAt) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  );
  
  const last7Days = last14Days.filter(job => 
    new Date(job.completedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  const last30Days = leadershipJobs.filter(job => 
    new Date(job.completedAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  
  const averageRating = last14Days.length > 0 
    ? last14Days.reduce((sum, job) => sum + (job.customerRating || 0), 0) / last14Days.length 
    : 0;
  
  const takeoversAvoided = last14Days.filter(job => 
    job.takeoverType === 'light' && job.qualityUplift === true
  ).length;
  
  const qualityUplift = last14Days.filter(job => 
    job.qualityUplift === true
  ).length / last14Days.length * 100;
  
  const weeklyCheckIns = last7Days.length;
  const targetCheckIns = 10; // Adjustable target
  
  // Calculate Bubbler-to-Lead rating (360° feedback)
  const bubblerRatings = last30Days.filter(job => job.bubblerRating).map(job => job.bubblerRating);
  const bubblerRating = bubblerRatings.length > 0 
    ? bubblerRatings.reduce((sum, rating) => sum + rating, 0) / bubblerRatings.length 
    : 0;
  
  const lowBubblerRatings = last30Days.filter(job => 
    job.bubblerRating && job.bubblerRating < 3
  ).length;
  
  return {
    averageRating: averageRating.toFixed(2),
    takeoversAvoided,
    qualityUplift: qualityUplift.toFixed(1),
    weeklyCheckIns,
    targetCheckIns,
    checkInTargetMet: weeklyCheckIns >= targetCheckIns,
    bubblerRating: bubblerRating.toFixed(2),
    lowBubblerRatings,
    leadershipScore: calculateLeadershipScore({
      averageRating,
      takeoversAvoided,
      qualityUplift,
      weeklyCheckIns,
      targetCheckIns,
      bubblerRating
    })
  };
}

/**
 * Calculate personal job metrics (own assignments)
 * @param {Array} personalJobs - Lead's own job assignments
 * @returns {Object} - Personal metrics
 */
function calculatePersonalMetrics(personalJobs) {
  const last10Jobs = personalJobs.slice(-10);
  const last30Days = personalJobs.filter(job => 
    new Date(job.completedAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  
  const averageRating = last10Jobs.length > 0 
    ? last10Jobs.reduce((sum, job) => sum + (job.customerRating || 0), 0) / last10Jobs.length 
    : 0;
  
  const flaggedComplaints = last30Days.filter(job => 
    job.customerComplaint && job.customerComplaint.severity >= 3
  ).length;
  
  const onTimeStarts = last10Jobs.filter(job => 
    job.timeliness === 'on_time' || job.timeliness === 'early'
  ).length;
  
  const completionRate = last10Jobs.filter(job => 
    job.completionStatus === 'completed' && !job.leftEarly
  ).length / last10Jobs.length * 100;
  
  return {
    averageRating: averageRating.toFixed(2),
    flaggedComplaints,
    onTimeStarts,
    completionRate: completionRate.toFixed(1),
    timelinessRate: (onTimeStarts / last10Jobs.length * 100).toFixed(1),
    personalScore: calculatePersonalScore({
      averageRating,
      flaggedComplaints,
      onTimeStarts,
      completionRate,
      totalJobs: last10Jobs.length
    })
  };
}

/**
 * Calculate leadership score (0-100)
 * @param {Object} metrics - Leadership metrics
 * @returns {number} - Leadership score
 */
function calculateLeadershipScore(metrics) {
  const ratingScore = Math.min(parseFloat(metrics.averageRating) * 10, 30);
  const takeoverScore = Math.min(metrics.takeoversAvoided * 2, 15);
  const qualityScore = Math.min(metrics.qualityUplift * 0.2, 15);
  const checkInScore = metrics.checkInTargetMet ? 15 : (metrics.weeklyCheckIns / metrics.targetCheckIns * 15);
  const bubblerRatingScore = Math.min(parseFloat(metrics.bubblerRating || 0) * 5, 25); // New 360° feedback component
  
  return Math.round(ratingScore + takeoverScore + qualityScore + checkInScore + bubblerRatingScore);
}

/**
 * Calculate personal score (0-100)
 * @param {Object} metrics - Personal metrics
 * @returns {number} - Personal score
 */
function calculatePersonalScore(metrics) {
  const ratingScore = Math.min(parseFloat(metrics.averageRating) * 10, 40);
  const complaintPenalty = Math.min(metrics.flaggedComplaints * 10, 20);
  const timelinessScore = Math.min(parseFloat(metrics.timelinessRate) * 0.3, 30);
  const completionScore = Math.min(parseFloat(metrics.completionRate) * 0.3, 30);
  
  return Math.round(Math.max(ratingScore + timelinessScore + completionScore - complaintPenalty, 0));
}

/**
 * Calculate overall score
 * @param {Object} leadershipMetrics - Leadership metrics
 * @param {Object} personalMetrics - Personal metrics
 * @returns {number} - Overall score
 */
function calculateOverallScore(leadershipMetrics, personalMetrics) {
  // Leadership counts for 60%, personal for 40%
  const leadershipWeight = 0.6;
  const personalWeight = 0.4;
  
  return Math.round(
    leadershipMetrics.leadershipScore * leadershipWeight + 
    personalMetrics.personalScore * personalWeight
  );
}

/**
 * Evaluate strikes based on performance thresholds
 * @param {Object} leadershipMetrics - Leadership metrics
 * @param {Object} personalMetrics - Personal metrics
 * @returns {Object} - Strike evaluation
 */
function evaluateStrikes(leadershipMetrics, personalMetrics) {
  const strikes = [];
  
  // Leadership score < 4.4 (2 weeks)
  if (parseFloat(leadershipMetrics.averageRating) < 4.4) {
    strikes.push({
      type: 'leadership_score',
      reason: 'Average leadership score below 4.4 for 2 weeks',
      severity: 'warning'
    });
  }
  
  // Personal score < 4.3 (10 jobs)
  if (parseFloat(personalMetrics.averageRating) < 4.3) {
    strikes.push({
      type: 'personal_score',
      reason: 'Average personal job score below 4.3 for 10 jobs',
      severity: 'review'
    });
  }
  
  // 2+ flagged reviews in 30 days
  if (personalMetrics.flaggedComplaints >= 2) {
    strikes.push({
      type: 'flagged_reviews',
      reason: '2+ flagged customer complaints in 30 days',
      severity: 'suspension'
    });
  }
  
  // Missed 3+ job check-ins in 2 weeks
  if (leadershipMetrics.weeklyCheckIns < (leadershipMetrics.targetCheckIns - 3)) {
    strikes.push({
      type: 'missed_checkins',
      reason: 'Missed 3+ job check-ins in 2 weeks',
      severity: 'warning'
    });
  }
  
  // 2+ low Bubbler ratings (< 3 stars) in 30 days
  if (leadershipMetrics.lowBubblerRatings >= 2) {
    strikes.push({
      type: 'bubbler_ratings',
      reason: '2+ Bubbler ratings below 3 stars in 30 days',
      severity: 'warning'
    });
  }
  
  return {
    total: strikes.length,
    strikes,
    status: determineStrikeStatus(strikes)
  };
}

/**
 * Determine strike status
 * @param {Array} strikes - Array of strikes
 * @returns {string} - Strike status
 */
function determineStrikeStatus(strikes) {
  const totalStrikes = strikes.length;
  
  if (strikes.some(s => s.severity === 'suspension')) {
    return 'suspended';
  } else if (totalStrikes >= 3) {
    return 'demoted';
  } else if (totalStrikes >= 1) {
    return 'warning';
  } else {
    return 'clear';
  }
}

/**
 * Determine overall lead status
 * @param {Object} strikes - Strike evaluation
 * @param {number} overallScore - Overall performance score
 * @returns {string} - Lead status
 */
function determineLeadStatus(strikes, overallScore) {
  if (strikes.status === 'suspended') return 'suspended';
  if (strikes.status === 'demoted') return 'demoted';
  if (strikes.status === 'warning') return 'warning';
  if (overallScore >= 80) return 'excellent';
  if (overallScore >= 70) return 'good';
  if (overallScore >= 60) return 'satisfactory';
  return 'needs_improvement';
}

/**
 * Generate recommendations based on metrics
 * @param {Object} leadershipMetrics - Leadership metrics
 * @param {Object} personalMetrics - Personal metrics
 * @returns {Array} - Recommendations
 */
function generateRecommendations(leadershipMetrics, personalMetrics) {
  const recommendations = [];
  
  if (parseFloat(leadershipMetrics.averageRating) < 4.5) {
    recommendations.push('Focus on improving team quality through better coaching and oversight');
  }
  
  if (leadershipMetrics.takeoversAvoided < 5) {
    recommendations.push('Work on preventing takeovers through proactive coaching');
  }
  
  if (!leadershipMetrics.checkInTargetMet) {
    recommendations.push('Increase job check-ins to meet weekly targets');
  }
  
  if (parseFloat(personalMetrics.averageRating) < 4.5) {
    recommendations.push('Improve personal job performance to maintain lead standards');
  }
  
  if (personalMetrics.flaggedComplaints > 0) {
    recommendations.push('Address customer service issues to reduce complaints');
  }
  
  if (parseFloat(personalMetrics.timelinessRate) < 90) {
    recommendations.push('Improve punctuality for job starts');
  }
  
  if (parseFloat(leadershipMetrics.bubblerRating) < 4.0) {
    recommendations.push('Improve communication and supportiveness with team members');
  }
  
  if (leadershipMetrics.lowBubblerRatings > 0) {
    recommendations.push('Address interpersonal issues and ensure respectful leadership approach');
  }
  
  return recommendations;
}

/**
 * Generate Bubbler-to-Lead rating prompt
 * @param {Object} jobData - Job data for context
 * @returns {Object} - Rating prompt structure
 */
function generateBubblerRatingPrompt(jobData) {
  return {
    title: "How was your experience with today's Lead?",
    subtitle: "Your feedback helps us maintain a supportive work environment",
    ratingOptions: [
      {
        value: 5,
        label: "Excellent",
        description: "Very supportive, helpful, and professional"
      },
      {
        value: 4,
        label: "Good",
        description: "Generally helpful and respectful"
      },
      {
        value: 3,
        label: "Okay",
        description: "Adequate but could be more supportive"
      },
      {
        value: 2,
        label: "Poor",
        description: "Not very helpful or respectful"
      },
      {
        value: 1,
        label: "Very Poor",
        description: "Unprofessional or unsupportive"
      }
    ],
    criteria: [
      "✅ Friendly and supportive",
      "✅ Gave helpful tips or feedback", 
      "✅ Treated me with respect",
      "✅ Fair in their judgment"
    ],
    note: "This rating is private and helps us ensure all team members feel supported and respected.",
    jobId: jobData.jobId,
    leadId: jobData.leadId,
    bubblerId: jobData.bubblerId
  };
}

/**
 * Process Bubbler-to-Lead rating submission
 * @param {Object} ratingData - Rating submission data
 * @returns {Object} - Processing result
 */
function processBubblerRating(ratingData) {
  const { rating, comment, jobId, leadId, bubblerId } = ratingData;
  
  // Validate rating
  if (rating < 1 || rating > 5) {
    return {
      success: false,
      error: 'Invalid rating value'
    };
  }
  
  // Check if this triggers admin review
  const triggersReview = rating < 3;
  
  return {
    success: true,
    rating,
    comment,
    jobId,
    leadId,
    bubblerId,
    timestamp: new Date().toISOString(),
    triggersReview,
    reviewReason: triggersReview ? 'Low Bubbler-to-Lead rating' : null,
    note: triggersReview ? 'This rating will be reviewed by admin team' : 'Thank you for your feedback'
  };
}

/**
 * Main function to process takeover and calculate compensation
 * @param {Object} jobData - Complete job data
 * @returns {Object} - Complete takeover analysis and compensation
 */
function processTakeoverAndCompensation(jobData) {
  const takeoverType = determineTakeoverType({
    percentCompleted: jobData.percentCompleted,
    tasksRedone: jobData.tasksRedone,
    assistanceTime: jobData.assistanceTime,
    bubblerLeftSite: jobData.bubblerLeftSite
  });
  
  const compensation = calculateLeadCompensation({
    takeoverType,
    percentCompleted: jobData.percentCompleted,
    jobAmount: jobData.jobAmount
  });
  
  const patternAnalysis = checkLightAssistancePattern(jobData.recentJobs || []);
  const bonusAccelerator = calculateTieredLeadBonus(jobData.recentJobs || []);
  const complaintFilter = checkCustomerComplaintFilter(jobData);
  const flagOverlap = checkFlagOverlap(jobData.recentJobs || [], jobData.originalBubblerId);
  
  return {
    takeoverType,
    compensation,
    patternAnalysis,
    bonusAccelerator,
    complaintFilter,
    flagOverlap,
    timestamp: new Date().toISOString(),
    jobId: jobData.jobId
  };
}

// Export functions for use in other modules
export {
  determineTakeoverType,
  calculateLeadCompensation,
  checkLightAssistancePattern,
  calculateTieredLeadBonus,
  checkCustomerComplaintFilter,
  checkFlagOverlap,
  processTakeoverAndCompensation,
  trackLeadReviewScore,
  calculatePerformanceScore,
  getLeadOversightCoverage,
  evaluateLeadBubbler,
  calculateLeadershipMetrics,
  calculatePersonalMetrics,
  calculateLeadershipScore,
  calculatePersonalScore,
  calculateOverallScore,
  evaluateStrikes,
  determineLeadStatus,
  generateRecommendations,
  generateBubblerRatingPrompt,
  processBubblerRating,
  TIERED_PARTIAL_BONUS
};

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    determineTakeoverType,
    calculateLeadCompensation,
    checkLightAssistancePattern,
    calculateTieredLeadBonus,
    checkCustomerComplaintFilter,
    checkFlagOverlap,
    processTakeoverAndCompensation,
    trackLeadReviewScore,
    calculatePerformanceScore,
    getLeadOversightCoverage,
    evaluateLeadBubbler,
    calculateLeadershipMetrics,
    calculatePersonalMetrics,
    calculateLeadershipScore,
    calculatePersonalScore,
    calculateOverallScore,
    evaluateStrikes,
    determineLeadStatus,
    generateRecommendations,
    generateBubblerRatingPrompt,
    processBubblerRating,
    TIERED_PARTIAL_BONUS
  };
} 