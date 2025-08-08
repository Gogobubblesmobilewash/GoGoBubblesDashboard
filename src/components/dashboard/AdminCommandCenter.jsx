import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import {
  FiUsers, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiCheckCircle,
  FiClock, FiMapPin, FiStar, FiMessageCircle, FiSettings, FiEye,
  FiEyeOff, FiRefreshCw, FiDownload, FiFilter, FiPlay, FiPause,
  FiShield, FiActivity, FiBarChart2, FiGrid, FiList, FiCalendar,
  FiTarget, FiAward, FiZap, FiDatabase, FiMonitor, FiCommand,
  FiUser, FiUserCheck, FiMap, FiCamera, FiAlertCircle, FiToggleRight,
  FiLogOut, FiLogIn, FiNavigation, FiCompass, FiFlag, FiEdit3
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const AdminCommandCenter = () => {
  const [activeRole, setActiveRole] = useState('admin');
  const [assumedRole, setAssumedRole] = useState(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({});
  const [roleData, setRoleData] = useState({});
  const [automations, setAutomations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [adminOverrides, setAdminOverrides] = useState([]);
  const [filters, setFilters] = useState({
    timeRange: '24h',
    severity: 'all',
    role: 'all',
    status: 'all'
  });
  const [loading, setLoading] = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);
  const [ghostFollowMode, setGhostFollowMode] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [emergencyNotifications, setEmergencyNotifications] = useState([]);
  const [crossSystemMetrics, setCrossSystemMetrics] = useState({});
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messageNotifications, setMessageNotifications] = useState([]);

  // Persistent override controls - always available regardless of role
  const [persistentOverrides, setPersistentOverrides] = useState({
    gpsRestrictions: false,
    paymentLimits: false,
    assignmentLocks: false,
    systemAlerts: false,
    emergencyActions: false
  });

  // Override functions that work regardless of assumed role
  const togglePersistentOverride = (overrideType) => {
    setPersistentOverrides(prev => ({
      ...prev,
      [overrideType]: !prev[overrideType]
    }));
    toast.success(`${overrideType.replace(/([A-Z])/g, ' $1').toLowerCase()} override ${!persistentOverrides[overrideType] ? 'enabled' : 'disabled'}`);
  };

  const executeAdminOverride = async (action, target, details = {}) => {
    try {
      const overrideLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level: 'override',
        role: 'admin',
        message: `Admin override: ${action} on ${target}`,
        details: {
          admin_id: 'ADMIN-001',
          action,
          target,
          assumed_role: assumedRole || 'admin',
          override_type: 'persistent_admin',
          ...details
        }
      };
      
      setLogs(prev => [overrideLog, ...prev]);
      
      // Execute the override action
      switch (action) {
        case 'force_assignment':
          await forceJobAssignment(target, details);
          break;
        case 'override_payment':
          await overridePaymentCalculation(target, details);
          break;
        case 'bypass_gps':
          await bypassGPSRestrictions(target, details);
          break;
        case 'force_takeover':
          await forceTakeover(target, details);
          break;
        case 'override_alert':
          await overrideSystemAlert(target, details);
          break;
        case 'emergency_intervention':
          await emergencyIntervention(target, details);
          break;
        default:
          console.log(`Executing admin override: ${action} on ${target}`);
      }
      
      toast.success(`Admin override executed: ${action}`);
    } catch (error) {
      console.error('Error executing admin override:', error);
      toast.error('Failed to execute admin override');
    }
  };

  // Override action implementations
  const forceJobAssignment = async (jobId, details) => {
    console.log(`Forcing job assignment: ${jobId}`, details);
    // In real implementation, this would override any assignment restrictions
  };

  const overridePaymentCalculation = async (paymentId, details) => {
    console.log(`Overriding payment calculation: ${paymentId}`, details);
    // In real implementation, this would override payment calculations
  };

  const bypassGPSRestrictions = async (zoneId, details) => {
    console.log(`Bypassing GPS restrictions for zone: ${zoneId}`, details);
    // In real implementation, this would allow admin to work outside GPS zones
  };

  const forceTakeover = async (jobId, details) => {
    console.log(`Forcing takeover for job: ${jobId}`, details);
    // In real implementation, this would force a takeover regardless of conditions
  };

  const overrideSystemAlert = async (alertId, details) => {
    console.log(`Overriding system alert: ${alertId}`, details);
    // In real implementation, this would override or dismiss system alerts
  };

  const emergencyIntervention = async (target, details) => {
    console.log(`Emergency intervention on: ${target}`, details);
    // In real implementation, this would trigger emergency protocols
  };

  // Role simulation configurations with enhanced capabilities
  const roleConfigs = {
    admin: {
      name: 'System Administrator',
      icon: FiShield,
      color: 'purple',
      permissions: ['full_access', 'user_management', 'system_config', 'data_export', 'role_assumption', 'universal_override'],
      metrics: ['total_users', 'system_health', 'security_alerts', 'performance'],
      automations: ['user_approval', 'system_backup', 'security_scan', 'performance_optimization'],
      canAssume: true,
      description: 'Full system access with role assumption capabilities'
    },
    support: {
      name: 'Support Specialist',
      icon: FiMessageCircle,
      color: 'blue',
      permissions: ['ticket_management', 'user_support', 'issue_resolution', 'knowledge_base'],
      metrics: ['open_tickets', 'response_time', 'resolution_rate', 'customer_satisfaction'],
      automations: ['ticket_assignment', 'escalation_rules', 'response_templates', 'satisfaction_surveys'],
      canAssume: true,
      description: 'Customer support and issue resolution'
    },
    finance: {
      name: 'Finance Manager',
      icon: FiDollarSign,
      color: 'green',
      permissions: ['financial_reports', 'payment_processing', 'budget_management', 'revenue_analysis'],
      metrics: ['revenue', 'expenses', 'profit_margin', 'payment_processing'],
      automations: ['payment_reminders', 'revenue_reports', 'expense_approval', 'budget_alerts'],
      canAssume: true,
      description: 'Financial oversight and payment management'
    },
    recruiter: {
      name: 'Recruitment Specialist',
      icon: FiUsers,
      color: 'orange',
      permissions: ['candidate_management', 'interview_scheduling', 'onboarding', 'performance_tracking'],
      metrics: ['active_candidates', 'hiring_rate', 'time_to_hire', 'candidate_satisfaction'],
      automations: ['candidate_screening', 'interview_reminders', 'onboarding_checklist', 'performance_reviews'],
      canAssume: true,
      description: 'Recruitment and onboarding management'
    },
    market_manager: {
      name: 'Market Manager',
      icon: FiMapPin,
      color: 'red',
      permissions: ['market_oversight', 'performance_monitoring', 'territory_management', 'growth_analysis'],
      metrics: ['market_performance', 'territory_coverage', 'growth_rate', 'team_productivity'],
      automations: ['performance_alerts', 'territory_optimization', 'growth_reports', 'team_assignment'],
      canAssume: true,
      description: 'Market performance and territory management'
    },
    lead_bubbler: {
      name: 'Lead Bubbler',
      icon: FiTarget,
      color: 'teal',
      permissions: ['team_oversight', 'quality_assurance', 'training_management', 'performance_coaching'],
      metrics: ['team_performance', 'quality_scores', 'training_completion', 'coaching_effectiveness'],
      automations: ['quality_alerts', 'training_reminders', 'performance_reviews', 'coaching_schedules'],
      canAssume: true,
      description: 'Field oversight and quality assurance'
    },
    bubbler: {
      name: 'Bubbler',
      icon: FiUser,
      color: 'gray',
      permissions: ['job_management', 'time_tracking', 'photo_uploads', 'status_updates'],
      metrics: ['jobs_completed', 'hours_worked', 'quality_rating', 'customer_feedback'],
      automations: ['job_reminders', 'time_tracking', 'photo_reminders', 'status_updates'],
      canAssume: true,
      description: 'Field work and job execution'
    }
  };

  useEffect(() => {
    loadSystemWideData();
    loadAutomations();
    loadSystemLogs();
    loadAdminOverrides();
    loadConversations();
    loadMessageNotifications();
  }, [activeRole, simulationMode, assumedRole]);

  // Load comprehensive system data
  const loadSystemWideData = async () => {
    setLoading(true);
    try {
      // Load system alerts from all subsystems
      const alerts = await loadSystemAlerts();
      setSystemAlerts(alerts);

      // Load emergency notifications
      const emergencies = await loadEmergencyNotifications();
      setEmergencyNotifications(emergencies);

      // Load cross-system metrics
      const metrics = await loadCrossSystemMetrics();
      setCrossSystemMetrics(metrics);

      // Load active incidents
      const incidents = await loadActiveIncidents();
      setActiveIncidents(incidents);

      // Load system health status
      const health = await loadSystemHealth();
      setSystemHealth(health);

      // Load role-specific data if assuming a role
      if (assumedRole && assumedRole !== 'admin') {
        const roleData = await loadRoleData(assumedRole);
        setRoleData(roleData);
      }
    } catch (error) {
      console.error('Error loading system-wide data:', error);
      toast.error('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  // Load system alerts from all subsystems
  const loadSystemAlerts = async () => {
    // Simulated alerts from different systems
    return [
      {
        id: 1,
        system: 'lead_bubbler',
        type: 'critical',
        title: 'Bubbler Abandonment Detected',
        message: 'Bubbler #1234 has not marked "En Route" within 15 minutes',
        timestamp: new Date().toISOString(),
        action: 'takeover_required',
        priority: 'high'
      },
      {
        id: 2,
        system: 'fresh_bubbler',
        type: 'warning',
        title: 'Laundry Hoarding Alert',
        message: '3+ jobs picked up but none started within 90 minutes',
        timestamp: new Date().toISOString(),
        action: 'investigation_required',
        priority: 'medium'
      },
      {
        id: 3,
        system: 'environmental_qa',
        type: 'critical',
        title: 'Home Environment Failed QA',
                  message: 'FreshBubbler #5678 failed environmental check - pest presence detected',
        timestamp: new Date().toISOString(),
        action: 'immediate_reassignment',
        priority: 'high'
      },
      {
        id: 4,
        system: 'payment_system',
        type: 'info',
        title: 'Payment Processing Alert',
        message: 'High volume of partial takeover payments detected',
        timestamp: new Date().toISOString(),
        action: 'review_required',
        priority: 'low'
      }
    ];
  };

  // Load emergency notifications
  const loadEmergencyNotifications = async () => {
    return [
      {
        id: 1,
        type: 'customer_complaint',
        severity: 'high',
        title: 'Customer Complaint Escalation',
        message: 'Customer #9876 reported incomplete service - requires immediate attention',
        timestamp: new Date().toISOString(),
        assignedTo: null,
        status: 'pending'
      },
      {
        id: 2,
        type: 'equipment_failure',
        severity: 'medium',
        title: 'Equipment Delivery Failed',
        message: 'Lead Bubbler #1111 failed to deliver equipment within 30 minutes',
        timestamp: new Date().toISOString(),
        assignedTo: null,
        status: 'pending'
      }
    ];
  };

  // Load cross-system metrics
  const loadCrossSystemMetrics = async () => {
    return {
      totalActiveJobs: 47,
      jobsInTrouble: 3,
      leadsOnDuty: 8,
      bubblersActive: 23,
      systemUptime: 99.8,
      averageResponseTime: '2.3s',
      customerSatisfaction: 4.7,
      qualityScore: 92.5
    };
  };

  // Load active incidents
  const loadActiveIncidents = async () => {
    return [
      {
        id: 1,
        type: 'takeover_required',
        system: 'lead_bubbler',
        description: 'Bubbler abandonment - no leads available in zone',
        severity: 'high',
        createdAt: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 2,
        type: 'environmental_failure',
        system: 'fresh_bubbler',
        description: 'Multiple home environment failures in Zone 3',
        severity: 'medium',
        createdAt: new Date().toISOString(),
        status: 'investigating'
      }
    ];
  };

  // Load system health status
  const loadSystemHealth = async () => {
    return {
      lead_bubbler_system: { status: 'healthy', uptime: 99.9, alerts: 2 },
      fresh_bubbler_system: { status: 'warning', uptime: 98.5, alerts: 5 },
      payment_system: { status: 'healthy', uptime: 99.8, alerts: 1 },
      environmental_qa: { status: 'critical', uptime: 95.2, alerts: 8 },
      location_tracking: { status: 'healthy', uptime: 99.7, alerts: 0 }
    };
  };

  const loadRoleData = async () => {
    try {
      // Enhanced role-specific data with assumption tracking
      const roleData = {
        support: {
          open_tickets: simulationMode ? Math.floor(Math.random() * 20) + 10 : 15,
          response_time: simulationMode ? Math.floor(Math.random() * 10) + 5 : 8,
          resolution_rate: simulationMode ? Math.floor(Math.random() * 10) + 85 : 92,
          customer_satisfaction: simulationMode ? Math.floor(Math.random() * 10) + 85 : 94,
          admin_assumed: assumedRole === 'support'
        },
        finance: {
          revenue: simulationMode ? Math.floor(Math.random() * 10000) + 50000 : 67500,
          expenses: simulationMode ? Math.floor(Math.random() * 5000) + 20000 : 28400,
          profit_margin: simulationMode ? Math.floor(Math.random() * 10) + 55 : 58,
          payment_processing: simulationMode ? Math.floor(Math.random() * 50) + 200 : 234,
          admin_assumed: assumedRole === 'finance'
        },
        recruiter: {
          active_candidates: simulationMode ? Math.floor(Math.random() * 30) + 20 : 28,
          hiring_rate: simulationMode ? Math.floor(Math.random() * 10) + 75 : 82,
          time_to_hire: simulationMode ? Math.floor(Math.random() * 5) + 8 : 12,
          candidate_satisfaction: simulationMode ? Math.floor(Math.random() * 10) + 85 : 91,
          admin_assumed: assumedRole === 'recruiter'
        },
        market_manager: {
          market_performance: simulationMode ? Math.floor(Math.random() * 15) + 80 : 87,
          territory_coverage: simulationMode ? Math.floor(Math.random() * 10) + 85 : 92,
          growth_rate: simulationMode ? Math.floor(Math.random() * 10) + 15 : 23,
          team_productivity: simulationMode ? Math.floor(Math.random() * 10) + 85 : 89,
          admin_assumed: assumedRole === 'market_manager'
        },
        lead_bubbler: {
          team_performance: simulationMode ? Math.floor(Math.random() * 10) + 85 : 91,
          quality_scores: simulationMode ? Math.floor(Math.random() * 10) + 85 : 94,
          training_completion: simulationMode ? Math.floor(Math.random() * 10) + 85 : 88,
          coaching_effectiveness: simulationMode ? Math.floor(Math.random() * 10) + 80 : 87,
          admin_assumed: assumedRole === 'lead_bubbler'
        },
        bubbler: {
          jobs_completed: simulationMode ? Math.floor(Math.random() * 10) + 15 : 23,
          hours_worked: simulationMode ? Math.floor(Math.random() * 20) + 30 : 42,
          quality_rating: simulationMode ? Math.floor(Math.random() * 10) + 85 : 94,
          customer_feedback: simulationMode ? Math.floor(Math.random() * 10) + 85 : 91,
          admin_assumed: assumedRole === 'bubbler'
        }
      };
      setRoleData(roleData);
    } catch (error) {
      console.error('Error loading role data:', error);
      toast.error('Failed to load role data');
    }
  };

  const loadAutomations = async () => {
    try {
      // Enhanced automation data with role assumption automations
      const automationData = [
        {
          id: 1,
          name: 'User Approval Workflow',
          status: 'active',
          type: 'user_management',
          last_run: new Date().toISOString(),
          success_rate: 98,
          time_saved: '2.5 hours/day'
        },
        {
          id: 2,
          name: 'System Backup',
          status: 'active',
          type: 'system_maintenance',
          last_run: new Date(Date.now() - 3600000).toISOString(),
          success_rate: 100,
          time_saved: '1 hour/day'
        },
        {
          id: 3,
          name: 'Security Scan',
          status: 'active',
          type: 'security',
          last_run: new Date(Date.now() - 7200000).toISOString(),
          success_rate: 95,
          time_saved: '3 hours/day'
        },
        {
          id: 4,
          name: 'Performance Optimization',
          status: 'active',
          type: 'performance',
          last_run: new Date(Date.now() - 1800000).toISOString(),
          success_rate: 92,
          time_saved: '1.5 hours/day'
        },
        {
          id: 5,
          name: 'Role Assumption Tracking',
          status: 'active',
          type: 'admin_oversight',
          last_run: new Date().toISOString(),
          success_rate: 100,
          time_saved: '1 hour/day'
        },
        {
          id: 6,
          name: 'Emergency Oversight Assignment',
          status: 'active',
          type: 'emergency_response',
          last_run: new Date().toISOString(),
          success_rate: 99,
          time_saved: '2 hours/day'
        },
        {
          id: 7,
          name: 'GPS Override Management',
          status: 'active',
          type: 'field_operations',
          last_run: new Date().toISOString(),
          success_rate: 97,
          time_saved: '1.5 hours/day'
        },
        {
          id: 8,
          name: 'Quality Assurance Override',
          status: 'active',
          type: 'quality_control',
          last_run: new Date().toISOString(),
          success_rate: 96,
          time_saved: '2 hours/day'
        }
      ];
      setAutomations(automationData);
    } catch (error) {
      console.error('Error loading automations:', error);
      toast.error('Failed to load automations');
    }
  };

  const loadSystemLogs = async () => {
    try {
      // Enhanced system logs with role assumption tracking
      const logData = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          level: 'info',
          role: 'system',
          message: 'System backup completed successfully',
          details: { backup_size: '2.3GB', duration: '15 minutes' }
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'warning',
          role: 'support',
          message: 'High ticket volume detected',
          details: { ticket_count: 25, threshold: 20 }
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 600000).toISOString(),
          level: 'success',
          role: 'finance',
          message: 'Payment processing completed',
          details: { processed: 156, amount: '$12,450' }
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 900000).toISOString(),
          level: 'info',
          role: 'recruiter',
          message: 'New candidate application received',
          details: { candidate_id: 'C-2024-001', position: 'Lead Bubbler' }
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          level: 'error',
          role: 'system',
          message: 'Database connection timeout',
          details: { retry_count: 3, resolved: true }
        },
        {
          id: 6,
          timestamp: new Date(Date.now() - 1500000).toISOString(),
          level: 'info',
          role: 'admin',
          message: 'Admin assumed Lead Bubbler role',
          details: { admin_id: 'ADMIN-001', role: 'lead_bubbler', duration: '60 minutes' }
        },
        {
          id: 7,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          level: 'success',
          role: 'admin',
          message: 'Emergency oversight assignment completed',
          details: { job_id: 'J-2024-156', admin_id: 'ADMIN-001', action: 'emergency_takeover' }
        }
      ];
      setLogs(logData);
    } catch (error) {
      console.error('Error loading system logs:', error);
      toast.error('Failed to load system logs');
    }
  };

  const loadAdminOverrides = async () => {
    try {
      // Simulate admin override logs
      const overrideData = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          admin_id: 'ADMIN-001',
          action: 'role_assumption',
          target_role: 'lead_bubbler',
          duration: '60 minutes',
          status: 'active',
          reason: 'Field oversight and QA demonstration'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          admin_id: 'ADMIN-001',
          action: 'job_reassignment',
          target_job: 'J-2024-156',
          status: 'completed',
          reason: 'Emergency takeover due to bubbler unavailability'
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          admin_id: 'ADMIN-001',
          action: 'gps_override',
          target_bubbler: 'BUB-2024-045',
          status: 'active',
          reason: 'Training and onboarding session'
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          admin_id: 'ADMIN-001',
          action: 'payment_override',
          target_payment: 'PAY-2024-023',
          status: 'completed',
          reason: 'Bonus approval for exceptional performance'
        }
      ];
      setAdminOverrides(overrideData);
    } catch (error) {
      console.error('Error loading admin overrides:', error);
      toast.error('Failed to load admin overrides');
    }
  };

  const assumeRole = async (role) => {
    try {
      if (assumedRole === role) {
        // Exit role assumption
        setAssumedRole(null);
        setOverrideMode(false);
        setGhostFollowMode(false);
        toast.success(`Exited ${roleConfigs[role].name} role`);
        
        // Log role exit
        const exitLog = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          level: 'info',
          role: 'admin',
          message: `Admin exited ${roleConfigs[role].name} role`,
          details: { admin_id: 'ADMIN-001', role, action: 'exit' }
        };
        setLogs(prev => [exitLog, ...prev]);
      } else {
        // Assume new role
        setAssumedRole(role);
        setActiveRole(role);
        toast.success(`Now acting as ${roleConfigs[role].name} - All payouts will be routed to admin account as internal labor`);
        
        // Log role assumption
        const assumeLog = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          level: 'info',
          role: 'admin',
          message: `Admin assumed ${roleConfigs[role].name} role`,
          details: { 
            admin_id: 'ADMIN-001', 
            role, 
            action: 'assume', 
            duration: '60 minutes',
            payout_routing: 'admin_account',
            labor_type: 'internal_labor'
          }
        };
        setLogs(prev => [assumeLog, ...prev]);
      }
    } catch (error) {
      console.error('Error assuming role:', error);
      toast.error('Failed to assume role');
    }
  };

  const toggleOverrideMode = () => {
    setOverrideMode(!overrideMode);
    toast.success(`Override mode ${!overrideMode ? 'enabled' : 'disabled'}`);
  };

  const toggleGhostFollowMode = () => {
    setGhostFollowMode(!ghostFollowMode);
    toast.success(`Ghost follow mode ${!ghostFollowMode ? 'enabled' : 'disabled'}`);
  };

  // Emergency action functions
  const handleEmergencyAction = async (alertId, action) => {
    try {
      switch (action) {
        case 'takeover_required':
          await executeEmergencyOversight(alertId);
          break;
        case 'immediate_reassignment':
          await reassignJob(alertId);
          break;
        case 'investigation_required':
          await investigateIncident(alertId);
          break;
        case 'review_required':
          await reviewPayment(alertId);
          break;
        default:
          console.log(`Handling emergency action: ${action} for alert: ${alertId}`);
      }
      toast.success(`Emergency action executed: ${action}`);
    } catch (error) {
      console.error('Error executing emergency action:', error);
      toast.error('Failed to execute emergency action');
    }
  };

  const executeEmergencyOversight = async (alertId) => {
    // Simulate emergency oversight execution
    console.log(`Executing emergency oversight for alert: ${alertId}`);
    // In real implementation, this would trigger immediate role assumption and job takeover
  };

  const reassignJob = async (alertId) => {
    // Simulate job reassignment
    console.log(`Reassigning job for alert: ${alertId}`);
    // In real implementation, this would reassign the job to a different bubbler
  };

  const investigateIncident = async (alertId) => {
    // Simulate incident investigation
    console.log(`Investigating incident for alert: ${alertId}`);
    // In real implementation, this would create an investigation task
  };

  const reviewPayment = async (alertId) => {
    // Simulate payment review
    console.log(`Reviewing payment for alert: ${alertId}`);
    // In real implementation, this would flag payments for admin review
  };

  // Handle system alert acknowledgment
  const acknowledgeAlert = async (alertId) => {
    try {
      // Update alert status in database
      console.log(`Acknowledging alert: ${alertId}`);
      setSystemAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success('Alert acknowledged');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  // Handle emergency notification assignment
  const assignEmergency = async (notificationId, assignedTo) => {
    try {
      console.log(`Assigning emergency ${notificationId} to ${assignedTo}`);
      setEmergencyNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, assignedTo, status: 'assigned' }
            : notification
        )
      );
      toast.success('Emergency assigned');
    } catch (error) {
      console.error('Error assigning emergency:', error);
      toast.error('Failed to assign emergency');
    }
  };

  const executeAutomation = async (automationId) => {
    try {
      toast.success('Automation executed successfully');
      loadAutomations();
    } catch (error) {
      console.error('Error executing automation:', error);
      toast.error('Failed to execute automation');
    }
  };

  const getRoleMetrics = () => {
    if (activeRole === 'admin') {
      return systemMetrics;
    }
    return roleData[activeRole] || {};
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      if (filters.role !== 'all' && log.role !== filters.role) return false;
      if (filters.severity !== 'all' && log.level !== filters.severity) return false;
      return true;
    });
  };

  // Messaging functions
  const loadConversations = async () => {
    // Simulated conversations from different bubblers
    const conversationsData = [
      {
        id: 1,
        bubblerId: 'BUB-1234',
        bubblerName: 'Sarah Johnson',
        role: 'fresh_bubbler',
        lastMessage: 'Hi admin, I have a question about my payment',
        timestamp: new Date().toISOString(),
        unreadCount: 2,
        status: 'active'
      },
      {
        id: 2,
        bubblerId: 'BUB-5678',
        bubblerName: 'Mike Chen',
        role: 'lead_bubbler',
        lastMessage: 'Need approval for equipment delivery',
        timestamp: new Date().toISOString(),
        unreadCount: 1,
        status: 'active'
      },
      {
        id: 3,
        bubblerId: 'BUB-9012',
        bubblerName: 'Lisa Rodriguez',
        role: 'fresh_bubbler',
        lastMessage: 'Reporting an issue with my job assignment',
        timestamp: new Date().toISOString(),
        unreadCount: 0,
        status: 'resolved'
      }
    ];
    setConversations(conversationsData);
  };

  const loadMessages = async (conversationId) => {
    // Simulated messages for a conversation
    const messagesData = [
      {
        id: 1,
        conversationId: conversationId,
        senderId: 'BUB-1234',
        senderName: 'Sarah Johnson',
        senderRole: 'fresh_bubbler',
        message: 'Hi admin, I have a question about my payment from yesterday',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'received'
      },
      {
        id: 2,
        conversationId: conversationId,
        senderId: 'ADMIN-001',
        senderName: 'Admin',
        senderRole: 'admin',
        message: 'Hi Sarah, I can help you with that. What specific payment are you asking about?',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'sent'
      },
      {
        id: 3,
        conversationId: conversationId,
        senderId: 'BUB-1234',
        senderName: 'Sarah Johnson',
        senderRole: 'fresh_bubbler',
        message: 'The $45 job I completed yesterday, it shows as pending in my account',
        timestamp: new Date().toISOString(),
        type: 'received'
      }
    ];
    setMessages(messagesData);
  };

  const sendMessage = async (conversationId, message) => {
    try {
      const newMessageObj = {
        id: Date.now(),
        conversationId: conversationId,
        senderId: 'ADMIN-001',
        senderName: 'Admin',
        senderRole: 'admin',
        message: message,
        timestamp: new Date().toISOString(),
        type: 'sent'
      };

      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage('');

      // Log the message action
      const messageLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level: 'info',
        role: 'admin',
        message: `Message sent to conversation ${conversationId}`,
        details: {
          admin_id: 'ADMIN-001',
          conversation_id: conversationId,
          message_length: message.length,
          assumed_role: assumedRole || 'admin'
        }
      };
      setLogs(prev => [messageLog, ...prev]);

      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
    
    // Mark messages as read
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const loadMessageNotifications = async () => {
    // Simulated message notifications
    const notifications = [
      {
        id: 1,
        type: 'new_message',
        bubblerId: 'BUB-1234',
        bubblerName: 'Sarah Johnson',
        message: 'Hi admin, urgent question about payment',
        timestamp: new Date().toISOString(),
        priority: 'high'
      },
      {
        id: 2,
        type: 'support_request',
        bubblerId: 'BUB-5678',
        bubblerName: 'Mike Chen',
        message: 'Need help with equipment delivery',
        timestamp: new Date().toISOString(),
        priority: 'medium'
      }
    ];
    setMessageNotifications(notifications);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <FiCommand className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Command Center</h1>
                <p className="text-sm text-gray-500">
                  {assumedRole 
                    ? `Acting as ${roleConfigs[assumedRole].name} - Universal Override Active`
                    : 'Central monitoring and control system'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {assumedRole && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md">
                  <FiUserCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Role: {roleConfigs[assumedRole].name}</span>
                </div>
              )}
              
              <button
                onClick={toggleOverrideMode}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  overrideMode 
                    ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <FiToggleRight className="inline mr-2" />
                {overrideMode ? 'Override Active' : 'Enable Override'}
              </button>
              
              <button
                onClick={toggleSimulationMode}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  simulationMode 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <FiPlay className="inline mr-2" />
                {simulationMode ? 'Simulation Active' : 'Enable Simulation'}
              </button>
              
              <button
                onClick={() => loadSystemMetrics()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <FiRefreshCw className="inline mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Assumption Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Assume Role Controls</h2>
            <div className="flex items-center space-x-2">
              <FiUser className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Universal role assumption for fieldwork and oversight</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(roleConfigs).filter(([role]) => role !== 'admin').map(([role, config]) => {
              const Icon = config.icon;
              const isAssumed = assumedRole === role;
              return (
                <button
                  key={role}
                  onClick={() => assumeRole(role)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isAssumed
                      ? `border-${config.color}-500 bg-${config.color}-50`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-6 w-6 ${
                      isAssumed ? `text-${config.color}-600` : 'text-gray-400'
                    }`} />
                    {isAssumed && <FiUserCheck className="h-4 w-4 text-green-600" />}
                  </div>
                  <p className={`text-sm font-medium mt-2 ${
                    isAssumed ? `text-${config.color}-800` : 'text-gray-600'
                  }`}>
                    {config.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                </button>
              );
            })}
          </div>
          
          {assumedRole && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Active Role: {roleConfigs[assumedRole].name}</h4>
                  <p className="text-sm text-blue-700">You can now perform all actions as this role with full admin override capabilities.</p>
                </div>
                <button
                  onClick={() => assumeRole(assumedRole)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  <FiLogOut className="inline mr-2" />
                  Exit Role
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Persistent Override Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Persistent Override Controls</h3>
            <div className="flex items-center space-x-2">
              <FiShield className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-500">Override system restrictions and alerts</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => togglePersistentOverride('gpsRestrictions')}
              className={`p-4 border rounded-lg transition-colors ${
                persistentOverrides.gpsRestrictions 
                  ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <FiEye className="h-6 w-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Bypass GPS Restrictions</p>
              <p className="text-sm text-gray-600">Work outside location restrictions</p>
            </button>
            
            <button
              onClick={() => togglePersistentOverride('paymentLimits')}
              className={`p-4 border rounded-lg transition-colors ${
                persistentOverrides.paymentLimits 
                  ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <FiDollarSign className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Override Payment Limits</p>
              <p className="text-sm text-gray-600">Process payments without financial constraints</p>
            </button>
            
            <button
              onClick={() => togglePersistentOverride('assignmentLocks')}
              className={`p-4 border rounded-lg transition-colors ${
                persistentOverrides.assignmentLocks 
                  ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <FiUsers className="h-6 w-6 text-red-600 mb-2" />
              <p className="font-medium text-gray-900">Override Assignment Locks</p>
              <p className="text-sm text-gray-600">Assign jobs to any bubbler</p>
            </button>
            
            <button
              onClick={() => togglePersistentOverride('systemAlerts')}
              className={`p-4 border rounded-lg transition-colors ${
                persistentOverrides.systemAlerts 
                  ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <FiAlertTriangle className="h-6 w-6 text-yellow-600 mb-2" />
              <p className="font-medium text-gray-900">Override System Alerts</p>
              <p className="text-sm text-gray-600">Dismiss or override all system alerts</p>
            </button>
            
            <button
              onClick={() => togglePersistentOverride('emergencyActions')}
              className={`p-4 border rounded-lg transition-colors ${
                persistentOverrides.emergencyActions 
                  ? 'border-purple-200 bg-purple-50 hover:bg-purple-100' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <FiAlertCircle className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Override Emergency Actions</p>
              <p className="text-sm text-gray-600">Execute emergency actions without restrictions</p>
            </button>
          </div>
        </div>

        {/* Emergency Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Emergency Controls</h3>
            <div className="flex items-center space-x-2">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-gray-500">Quick access to emergency oversight and field operations</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => executeEmergencyOversight('J-2024-156')}
              className="p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <FiFlag className="h-6 w-6 text-red-600 mb-2" />
              <p className="font-medium text-red-900">Emergency Oversight</p>
              <p className="text-sm text-red-700">Take over critical jobs</p>
            </button>
            
            <button
              onClick={toggleGhostFollowMode}
              className={`p-4 border rounded-lg transition-colors ${
                ghostFollowMode 
                  ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <FiEye className="h-6 w-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Ghost Follow</p>
              <p className="text-sm text-gray-600">Monitor without interference</p>
            </button>
            
            <button
              className="p-4 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiCamera className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Photo Access</p>
              <p className="text-sm text-gray-600">Browse job photos</p>
            </button>
            
            <button
              className="p-4 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiNavigation className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">GPS Override</p>
              <p className="text-sm text-gray-600">Bypass location restrictions</p>
            </button>
          </div>
        </div>

        {/* Override Actions Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Override Actions</h3>
            <div className="flex items-center space-x-2">
              <FiShield className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-500">Admin override capabilities</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiUsers className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Force Job Assignment</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Override any assignment restrictions and assign jobs to any bubbler</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Job ID"
                  className="flex-1 text-xs border rounded px-2 py-1"
                />
                <button
                  onClick={() => executeAdminOverride('force_assignment', 'JOB-123', { reason: 'admin_override' })}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Force
                </button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiDollarSign className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Override Payment</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Override payment calculations and process payments without limits</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Payment ID"
                  className="flex-1 text-xs border rounded px-2 py-1"
                />
                <button
                  onClick={() => executeAdminOverride('override_payment', 'PAY-456', { amount: 100, reason: 'admin_override' })}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Override
                </button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiMapPin className="h-5 w-5 text-red-600" />
                <h4 className="font-medium text-gray-900">Bypass GPS</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Allow work outside GPS restrictions and location requirements</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Zone ID"
                  className="flex-1 text-xs border rounded px-2 py-1"
                />
                <button
                  onClick={() => executeAdminOverride('bypass_gps', 'ZONE-789', { duration: '2h', reason: 'admin_override' })}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Bypass
                </button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertTriangle className="h-5 w-5 text-yellow-600" />
                <h4 className="font-medium text-gray-900">Override Alerts</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Dismiss or override system alerts and notifications</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Alert ID"
                  className="flex-1 text-xs border rounded px-2 py-1"
                />
                <button
                  onClick={() => executeAdminOverride('override_alert', 'ALERT-101', { reason: 'admin_override' })}
                  className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                >
                  Override
                </button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertCircle className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">Emergency Intervention</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Execute emergency actions without standard restrictions</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Target ID"
                  className="flex-1 text-xs border rounded px-2 py-1"
                />
                <button
                  onClick={() => executeAdminOverride('emergency_intervention', 'EMERG-202', { reason: 'admin_override' })}
                  className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                >
                  Intervene
                </button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiShield className="h-5 w-5 text-indigo-600" />
                <h4 className="font-medium text-gray-900">Force Takeover</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">Force a job takeover regardless of standard conditions</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Job ID"
                  className="flex-1 text-xs border rounded px-2 py-1"
                />
                <button
                  onClick={() => executeAdminOverride('force_takeover', 'JOB-303', { reason: 'admin_override' })}
                  className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                >
                  Force
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System-Wide Monitoring Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* System Alerts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {systemAlerts.length} Active
              </span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.system.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm text-gray-900">{alert.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEmergencyAction(alert.id, alert.action)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        {alert.action.replace('_', ' ')}
                      </button>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                      >
                        Ack
                      </button>
                      <button
                        onClick={() => executeAdminOverride('override_alert', alert.id, { system: alert.system, type: alert.type })}
                        className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                        title="Admin Override"
                      >
                        Override
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Emergency Notifications</h3>
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {emergencyNotifications.length} Pending
              </span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {emergencyNotifications.map((notification) => (
                <div key={notification.id} className={`p-3 rounded-lg border ${
                  notification.severity === 'high' ? 'bg-red-50 border-red-200' :
                  'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          notification.severity === 'high' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {notification.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => assignEmergency(notification.id, 'admin')}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => executeAdminOverride('emergency_intervention', notification.id, { type: notification.type, severity: notification.severity })}
                        className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                        title="Admin Override"
                      >
                        Override
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cross-System Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cross-System Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{crossSystemMetrics.totalActiveJobs}</div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{crossSystemMetrics.jobsInTrouble}</div>
              <div className="text-sm text-gray-600">Jobs in Trouble</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{crossSystemMetrics.leadsOnDuty}</div>
              <div className="text-sm text-gray-600">Leads on Duty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{crossSystemMetrics.bubblersActive}</div>
              <div className="text-sm text-gray-600">Active Bubblers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{crossSystemMetrics.systemUptime}%</div>
              <div className="text-sm text-gray-600">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">{crossSystemMetrics.averageResponseTime}</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{crossSystemMetrics.customerSatisfaction}/5</div>
              <div className="text-sm text-gray-600">Customer Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{crossSystemMetrics.qualityScore}%</div>
              <div className="text-sm text-gray-600">Quality Score</div>
            </div>
          </div>
        </div>

        {/* System Health Monitoring */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(systemHealth).map(([system, health]) => (
              <div key={system} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900">
                    {system.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    health.status === 'healthy' ? 'bg-green-100 text-green-800' :
                    health.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {health.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Uptime: {health.uptime}%</div>
                  <div>Alerts: {health.alerts}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Incidents */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Incidents</h3>
          <div className="space-y-3">
            {activeIncidents.map((incident) => (
              <div key={incident.id} className={`p-4 rounded-lg border ${
                incident.severity === 'high' ? 'bg-red-50 border-red-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        incident.severity === 'high' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {incident.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {incident.system.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm text-gray-900">{incident.description}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Created: {new Date(incident.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                      Investigate
                    </button>
                    <button className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700">
                      Resolve
                    </button>
                    <button
                      onClick={() => executeAdminOverride('force_takeover', incident.id, { type: incident.type, system: incident.system })}
                      className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                      title="Admin Override"
                    >
                      Override
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={systemMetrics.total_users}
            icon={FiUsers}
            color="blue"
            format="number"
          />
          <MetricCard
            title="System Health"
            value={systemMetrics.system_health}
            icon={FiActivity}
            color="green"
            format="percentage"
          />
          <MetricCard
            title="Revenue (24h)"
            value={systemMetrics.revenue_24h}
            icon={FiDollarSign}
            color="green"
            format="currency"
          />
          <MetricCard
            title="Active Overrides"
            value={systemMetrics.active_overrides}
            icon={FiToggleRight}
            color="red"
            format="number"
          />
        </div>

        {/* Role-Specific Metrics */}
        {activeRole !== 'admin' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {roleConfigs[activeRole].name} Metrics
              {assumedRole === activeRole && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Admin Acting
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(getRoleMetrics()).map(([key, value]) => (
                <div key={key} className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automations */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Time-Saving Automations</h3>
            <div className="flex items-center space-x-2">
              <FiZap className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-gray-500">Active automations saving time</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {automations.map((automation) => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                onExecute={() => executeAutomation(automation.id)}
              />
            ))}
          </div>
        </div>

        {/* Admin Override Logs */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Admin Override Logs</h3>
            <div className="flex items-center space-x-2">
              <FiShield className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-500">Track all admin actions and overrides</span>
            </div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {adminOverrides.map((override) => (
              <OverrideLogEntry key={override.id} override={override} />
            ))}
          </div>
        </div>

        {/* System Logs */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Activity Logs</h3>
            <div className="flex items-center space-x-4">
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="text-sm border border-gray-300 rounded-md px-3 py-1"
              >
                <option value="all">All Severities</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
              </select>
              
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="text-sm border border-gray-300 rounded-md px-3 py-1"
              >
                <option value="all">All Roles</option>
                <option value="system">System</option>
                <option value="admin">Admin</option>
                <option value="support">Support</option>
                <option value="finance">Finance</option>
                <option value="recruiter">Recruiter</option>
                <option value="market_manager">Market Manager</option>
                <option value="lead_bubbler">Lead Bubbler</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getFilteredLogs().map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        </div>

        {/* Messaging System */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
              <div className="flex items-center space-x-2">
                <FiMessageCircle className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-500">
                  {conversations.filter(c => c.unreadCount > 0).length} unread
                </span>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {conversation.bubblerName}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          conversation.role === 'lead_bubbler' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {conversation.role.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{conversation.lastMessage}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conversation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedConversation ? `Chat with ${selectedConversation.bubblerName}` : 'Select a conversation'}
              </h3>
              {selectedConversation && (
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedConversation.role === 'lead_bubbler' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedConversation.role.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    ID: {selectedConversation.bubblerId}
                  </span>
                </div>
              )}
            </div>

            {selectedConversation ? (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                        message.type === 'sent'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.senderName}
                          </span>
                          <span className={`text-xs px-1 py-0.5 rounded ${
                            message.senderRole === 'admin' ? 'bg-blue-500 text-white' :
                            message.senderRole === 'lead_bubbler' ? 'bg-purple-500 text-white' :
                            'bg-green-500 text-white'
                          }`}>
                            {message.senderRole.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newMessage.trim()) {
                        sendMessage(selectedConversation.id, newMessage.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newMessage.trim()) {
                        sendMessage(selectedConversation.id, newMessage.trim());
                      }
                    }}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FiMessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Notifications */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Message Notifications</h3>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {messageNotifications.length} New
            </span>
          </div>
          
          <div className="space-y-3">
            {messageNotifications.map((notification) => (
              <div key={notification.id} className={`p-3 rounded-lg border ${
                notification.priority === 'high' ? 'bg-red-50 border-red-200' :
                'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {notification.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm text-gray-900">{notification.bubblerName}</h4>
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const conversation = conversations.find(c => c.bubblerId === notification.bubblerId);
                        if (conversation) {
                          handleConversationSelect(conversation);
                        }
                      }}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        setMessageNotifications(prev => prev.filter(n => n.id !== notification.id));
                      }}
                      className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, format }) => {
  const formatValue = (val) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      red: 'text-red-600 bg-red-50',
      yellow: 'text-yellow-600 bg-yellow-50',
      purple: 'text-purple-600 bg-purple-50'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{formatValue(value)}</p>
        </div>
      </div>
    </div>
  );
};

const AutomationCard = ({ automation, onExecute }) => {
  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900">{automation.name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(automation.status)}`}>
          {automation.status}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <p>Success Rate: {automation.success_rate}%</p>
        <p>Time Saved: {automation.time_saved}</p>
        <p>Last Run: {new Date(automation.last_run).toLocaleTimeString()}</p>
      </div>
      
      <button
        onClick={onExecute}
        className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
      >
        Execute Now
      </button>
    </div>
  );
};

const OverrideLogEntry = ({ override }) => {
  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(override.status)}`}>
        {override.status.toUpperCase()}
      </span>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">{override.action}</span>
          <span className="text-xs text-gray-500">
            {new Date(override.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-gray-700">
          {override.action === 'role_assumption' && `Assumed ${override.target_role} role`}
          {override.action === 'job_reassignment' && `Reassigned job ${override.target_job}`}
          {override.action === 'gps_override' && `GPS override for bubbler ${override.target_bubbler}`}
          {override.action === 'payment_override' && `Payment override for ${override.target_payment}`}
        </p>
        <p className="text-xs text-gray-500 mt-1">Reason: {override.reason}</p>
      </div>
    </div>
  );
};

const LogEntry = ({ log }) => {
  const getLevelColor = (level) => {
    const colors = {
      info: 'text-blue-600 bg-blue-50',
      warning: 'text-yellow-600 bg-yellow-50',
      error: 'text-red-600 bg-red-50',
      success: 'text-green-600 bg-green-50'
    };
    return colors[level] || colors.info;
  };

  return (
    <div className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
        {log.level.toUpperCase()}
      </span>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">{log.role}</span>
          <span className="text-xs text-gray-500">
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-gray-700">{log.message}</p>
        {log.details && (
          <p className="text-xs text-gray-500 mt-1">
            {Object.entries(log.details).map(([key, value]) => `${key}: ${value}`).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminCommandCenter; 