import React, { useState, useEffect } from 'react';
import {
  FiMapPin,
  FiUsers,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiMessageCircle,
  FiPhone,
  FiCamera,
  FiEdit,
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiFlag,
  FiShield,
  FiFileText,
  FiAward,
  FiAlertTriangle,
  FiToggleLeft,
  FiToggleRight,
  FiTarget,
  FiStar,
  FiDollarSign,
  FiCalendar,
  FiList,
  FiCheckSquare,
  FiSquare,
  FiPlay,
  FiPause,
  FiX,
  FiInfo
} from 'react-icons/fi';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/api';
import toast from 'react-hot-toast';

const LeadBubblerDashboard = () => {
  const { user, isLeadBubbler } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState('default'); // 'default' or 'oversight'
  const [activeShift, setActiveShift] = useState(null);
  const [ownJobs, setOwnJobs] = useState([]);
  const [zoneJobs, setZoneJobs] = useState([]);
  const [teamBubblers, setTeamBubblers] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [interventionNotes, setInterventionNotes] = useState('');
  const [interventionPhotos, setInterventionPhotos] = useState([]);
  const [coachingNotes, setCoachingNotes] = useState('');
  const [checkInLocation, setCheckInLocation] = useState('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [oversightTasks, setOversightTasks] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    urgency: 'all',
    bubbler: 'all',
    serviceType: 'all'
  });
  const [leadBubblerProfile, setLeadBubblerProfile] = useState(null);
  const [oversightHours, setOversightHours] = useState(0);
  const [oversightEarnings, setOversightEarnings] = useState(0);
  const [jobEarnings, setJobEarnings] = useState(0);
  const [checkInTimer, setCheckInTimer] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [equipmentRequests, setEquipmentRequests] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedEquipmentRequest, setSelectedEquipmentRequest] = useState(null);
  const [selectedTrainingSession, setSelectedTrainingSession] = useState(null);
  const [feedbackRatings, setFeedbackRatings] = useState(null);
  const [interventionDuration, setInterventionDuration] = useState(15);
  const [interventionType, setInterventionType] = useState('assist');
  const [takeoverType, setTakeoverType] = useState('none');
  const [laborPercentageCovered, setLaborPercentageCovered] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [jobFinishedByLead, setJobFinishedByLead] = useState(false);
  
  // Wrap-up timing state
  const [wrapUpTimer, setWrapUpTimer] = useState(null);
  const [wrapUpStartTime, setWrapUpStartTime] = useState(null);
  const [wrapUpRemaining, setWrapUpRemaining] = useState(180); // 3 minutes in seconds
  const [isWrapUpActive, setIsWrapUpActive] = useState(false);
  const [wrapUpNotes, setWrapUpNotes] = useState('');
  const [wrapUpPhotos, setWrapUpPhotos] = useState([]);
  const [photoPrompts, setPhotoPrompts] = useState([]);
  
  // Autosave and UI enhancement state
  const [autoSaveInterval, setAutoSaveInterval] = useState(null);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [quickSelectTags, setQuickSelectTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [checklistFlags, setChecklistFlags] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [submissionLocked, setSubmissionLocked] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState('');

  // Load dashboard data and determine mode
  useEffect(() => {
    if (isLeadBubbler) {
      loadDashboardData();
    }
  }, [isLeadBubbler]);

  // Timer effect for check-in tracking
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && checkInTimer) {
      interval = setInterval(() => {
        setCheckInTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, checkInTimer]);

  // Wrap-up timer effect
  useEffect(() => {
    let interval = null;
    if (isWrapUpActive && wrapUpRemaining > 0) {
      interval = setInterval(() => {
        setWrapUpRemaining(prev => {
          if (prev <= 1) {
            setIsWrapUpActive(false);
            handleWrapUpExpired();
            return 0;
          }
          
          // Show alert at 30 seconds remaining
          if (prev === 31) {
            setShowAlert(true);
            // Optional: Play sound or flash screen
            if ('vibrate' in navigator) {
              navigator.vibrate(200);
            }
          }
          
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWrapUpActive, wrapUpRemaining]);

  // Autosave effect - runs every 5 seconds during wrap-up
  useEffect(() => {
    let interval = null;
    if (isWrapUpActive && wrapUpNotes) {
      interval = setInterval(() => {
        const autoSaveResult = autoSaveNotes({
          notes: wrapUpNotes,
          leadId: user?.id,
          bubblerId: selectedJob?.bubbler_id,
          jobId: selectedJob?.id
        });
        
        if (autoSaveResult.success) {
          setLastAutoSave(new Date().toISOString());
          // Silent auto-save - no toast notification to avoid interruption
        }
      }, 5000); // Every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isWrapUpActive, wrapUpNotes, user?.id, selectedJob]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get lead bubbler's profile and check for active shift
      const { data: leadProfile } = await supabase
        .from('bubblers')
        .select('assigned_zone, team_members, role, certified_services, current_status, lead_pay_rate, leadership_status')
        .eq('id', user.id)
        .single();

      if (!leadProfile) {
        toast.error('Profile not found');
        return;
      }

      setLeadBubblerProfile(leadProfile);

      // Check if lead bubbler is active (not suspended or revoked)
      const isLeadActive = leadProfile.leadership_status === 'active';

      // Check for active lead bubbler shift
      const now = new Date();
      const { data: activeShiftData } = await supabase
        .from('lead_bubbler_shifts')
        .select('*')
        .eq('lead_bubbler_id', user.id)
        .eq('status', 'active')
        .lte('start_time', now.toISOString())
        .gte('end_time', now.toISOString())
        .single();

      if (activeShiftData && isLeadActive) {
        setActiveShift(activeShiftData);
        setCurrentMode('oversight');
        // Start check-in timer if shift is active
        if (!checkInTimer) {
          setCheckInTimer(0);
          setIsTimerRunning(true);
        }
      } else {
        setCurrentMode('default');
        setIsTimerRunning(false);
        
        // Show warning if lead is suspended or revoked
        if (!isLeadActive) {
          toast.warning('Your Lead Bubbler status is currently inactive. Equipment and assistance requests are disabled.');
        }
      }

      // Load own jobs (always available)
      const { data: ownJobsData } = await supabase
        .from('job_assignments')
        .select(`
          *,
          order_service (
            service_type,
            tier,
            addons
          ),
          orders (
            customer_name,
            address,
            scheduled_date
          )
        `)
        .eq('bubbler_id', user.id)
        .neq('status', 'completed')
        .order('scheduled_date', { ascending: true });

      setOwnJobs(ownJobsData || []);

      // Load zone jobs and team data only in oversight mode AND if lead is active
      if (activeShiftData && isLeadActive) {
        await loadOversightData(leadProfile, activeShiftData);
      }

      // Load earnings data
      await loadEarningsData();

      // Load oversight tasks only if lead is active
      if (isLeadActive) {
        await loadOversightTasks();
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadOversightData = async (leadProfile, shift) => {
    try {
      // Load jobs in assigned zone for current shift
      const { data: zoneJobsData } = await supabase
        .from('orders')
        .select(`
          *,
          order_service (
            *,
            job_assignments (
              *,
              bubblers (
                id,
                first_name,
                last_name,
                phone,
                email,
                current_status,
                role
              )
            )
          )
        `)
        .eq('zone', leadProfile.assigned_zone)
        .gte('scheduled_date', shift.start_time)
        .lte('scheduled_date', shift.end_time)
        .order('scheduled_date', { ascending: true });

      // Process jobs with urgency indicators and service type filtering
      const processedJobs = zoneJobsData?.map(order => {
        const services = order.order_service || [];
        const jobAssignments = services.flatMap(service => 
          service.job_assignments?.map(assignment => ({
            ...assignment,
            order,
            service,
            customerName: order.customer_name,
            customerAddress: order.address,
            scheduledTime: order.scheduled_date,
            urgency: calculateUrgency(assignment, order.scheduled_date),
            canOversee: canOverseeService(leadProfile, service.service_type),
            hasPerkDelivery: service.addons?.some(addon => addon.includes('perk')),
            perkScanned: assignment.perk_delivery_verified || false
          })) || []
        );
        return jobAssignments;
      }).flat() || [];

      setZoneJobs(processedJobs);

      // Load equipment requests for the zone
      const { data: equipmentRequestsData } = await supabase
        .from('equipment_requests')
        .select(`
          *,
          bubblers (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          order_service (
            service_type,
            tier
          ),
          equipment (
            name,
            type,
            description
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      setEquipmentRequests(equipmentRequestsData || []);

      // Load training sessions for this lead bubbler
      const { data: trainingSessionsData } = await supabase
        .from('training_sessions')
        .select(`
          *,
          training_attendees (
            id,
            bubbler_id,
            attended,
            cert_issued,
            feedback,
            bubblers (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('lead_bubbler_id', user.id)
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true });

      setTrainingSessions(trainingSessionsData || []);

      // Load feedback ratings for this lead bubbler
      const { data: feedbackData } = await supabase.rpc('calculate_lead_bubbler_rating', {
        lead_bubbler_id: user.id,
        days_back: 30
      });

      if (feedbackData && feedbackData.length > 0) {
        setFeedbackRatings(feedbackData[0]);
      }

      // Load team bubblers
      const { data: teamData } = await supabase
        .from('bubblers')
        .select('id, first_name, last_name, phone, email, current_status, assigned_zone, role')
        .eq('assigned_zone', leadProfile.assigned_zone)
        .eq('is_active', true);

      setTeamBubblers(teamData || []);

      // Calculate oversight hours for compensation
      const { data: oversightData } = await supabase
        .from('interventions')
        .select('created_at, notes')
        .eq('lead_bubbler_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      const totalOversightMinutes = oversightData?.length * 15 || 0; // 15 minutes per intervention
      setOversightHours(Math.round(totalOversightMinutes / 60 * 10) / 10); // Round to 1 decimal

    } catch (error) {
      console.error('Error loading oversight data:', error);
      toast.error('Failed to load oversight data');
    }
  };

  const loadEarningsData = async () => {
    try {
      // Calculate oversight earnings
      const oversightRate = leadBubblerProfile?.lead_pay_rate || 25; // Default $25/hour
      const oversightEarningsCalc = (oversightHours * oversightRate);
      setOversightEarnings(oversightEarningsCalc);

      // Calculate job earnings (from regular job assignments)
      const { data: jobEarningsData } = await supabase
        .from('job_assignments')
        .select('earnings')
        .eq('bubbler_id', user.id)
        .eq('status', 'completed')
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      const totalJobEarnings = jobEarningsData?.reduce((sum, job) => sum + (job.earnings || 0), 0) || 0;
      setJobEarnings(totalJobEarnings);

    } catch (error) {
      console.error('Error loading earnings data:', error);
    }
  };

  const loadOversightTasks = async () => {
    // Define oversight tasks checklist
    const tasks = [
      { id: 1, title: 'Check in for shift', completed: false, required: true },
      { id: 2, title: 'Review zone job assignments', completed: false, required: true },
      { id: 3, title: 'Monitor team performance', completed: false, required: true },
      { id: 4, title: 'Verify perk deliveries', completed: false, required: true },
      { id: 5, title: 'Log interventions if needed', completed: false, required: false },
      { id: 6, title: 'Update coaching notes', completed: false, required: false },
      { id: 7, title: 'Check out from shift', completed: false, required: true }
    ];
    setOversightTasks(tasks);
  };

  // Check if lead bubbler can oversee a specific service type
  const canOverseeService = (leadProfile, serviceType) => {
    if (!leadProfile?.certified_services) return false;
    
    const certifiedServices = Array.isArray(leadProfile.certified_services) 
      ? leadProfile.certified_services 
      : JSON.parse(leadProfile.certified_services || '[]');
    
    return certifiedServices.includes(serviceType);
  };

  // Calculate urgency level for a job
  const calculateUrgency = (assignment, scheduledDate) => {
    if (!scheduledDate) return 'unknown';
    
    const scheduled = new Date(scheduledDate);
    const now = new Date();
    const timeDiff = scheduled.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 0) return 'overdue'; // Past due
    if (hoursDiff <= 2) return 'critical'; // Due within 2 hours
    if (hoursDiff <= 4) return 'warning'; // Due within 4 hours
    return 'on_track'; // More than 4 hours
  };

  // Get urgency display info
  const getUrgencyDisplay = (urgency) => {
    const config = {
      overdue: {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '🔴',
        label: 'Past Due'
      },
      critical: {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '🔴',
        label: 'Critical'
      },
      warning: {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '🟡',
        label: 'Nearing Due'
      },
      on_track: {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '🟢',
        label: 'On Track'
      },
      unknown: {
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: '⚪',
        label: 'Unknown'
      }
    };
    return config[urgency] || config.unknown;
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check in for oversight shift
  const handleCheckIn = async () => {
    if (!checkInLocation.trim()) {
      toast.error('Please provide check-in location');
      return;
    }

    try {
      const { error } = await supabase
        .from('check_in_reports')
        .insert({
          lead_bubbler_id: user.id,
          check_in_type: 'shift_start',
          location: checkInLocation,
          notes: checkInNotes,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Mark check-in task as completed
      setOversightTasks(prev => prev.map(task => 
        task.id === 1 ? { ...task, completed: true } : task
      ));

      toast.success('Successfully checked in for oversight shift');
      setShowCheckInModal(false);
      setCheckInLocation('');
      setCheckInNotes('');

    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in');
    }
  };

  // Check out from oversight shift
  const handleCheckOut = async () => {
    try {
      const { error } = await supabase
        .from('check_in_reports')
        .insert({
          lead_bubbler_id: user.id,
          check_in_type: 'shift_end',
          location: 'Shift End',
          notes: `Shift ended. Total oversight time: ${formatTimer(checkInTimer)}`,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Mark check-out task as completed
      setOversightTasks(prev => prev.map(task => 
        task.id === 7 ? { ...task, completed: true } : task
      ));

      setIsTimerRunning(false);
      toast.success('Successfully checked out from oversight shift');

    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Failed to check out');
    }
  };

  // Toggle oversight task completion
  const toggleTask = (taskId) => {
    setOversightTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Quick actions
  const handleCallBubbler = (bubbler) => {
    if (bubbler.phone) {
      window.open(`tel:${bubbler.phone}`, '_blank');
    } else {
      toast.error('No phone number available');
    }
  };

  const handleMessageBubbler = (bubbler) => {
    toast.success(`Opening message thread with ${bubbler.first_name} ${bubbler.last_name}`);
  };

  const handleIntervention = (job) => {
    setSelectedJob(job);
    setShowInterventionModal(true);
  };

  const handleInterventionComplete = async () => {
    if (!selectedJob || !interventionNotes.trim()) {
      toast.error('Please provide intervention notes');
      return;
    }

    try {
      // Calculate check-in end time based on duration
      const checkinStart = new Date();
      const checkinEnd = new Date(checkinStart.getTime() + interventionDuration * 60 * 1000);

      // Create lead checkin for intervention
      const { data: checkinData, error: checkinError } = await supabase
        .from('lead_checkins')
        .insert({
          lead_bubbler_id: user.id,
          checkin_type: interventionType,
          assisting_bubbler_id: selectedJob.bubbler_id,
          checkin_start: checkinStart.toISOString(),
          checkin_end: checkinEnd.toISOString(),
          service_type: selectedJob.service.service_type.toLowerCase().includes('laundry') ? 'fresh' :
                       selectedJob.service.service_type.toLowerCase().includes('car') ? 'shine' : 'sparkle',
          oversight_type: interventionType === 'takeover' ? 'Takeover' : 
                         interventionType === 'assist' ? 'Assist' : 'Coaching',
          takeover_type: takeoverType,
          takeover_job_id: selectedJob.order_id,
          takeover_minutes: interventionDuration,
          labor_percentage_covered: laborPercentageCovered,
          tasks_completed: tasksCompleted,
          job_finished_by_lead: jobFinishedByLead,
          notes: interventionNotes,
          job_assignment_id: selectedJob.id
        })
        .select()
        .single();

      if (checkinError) throw checkinError;

      // Process compensation calculation
      const { error: compensationError } = await supabase.rpc('process_lead_checkin_compensation', {
        checkin_id: checkinData.id
      });

      if (compensationError) throw compensationError;

      // Mark intervention task as completed
      setOversightTasks(prev => prev.map(task => 
        task.id === 5 ? { ...task, completed: true } : task
      ));

      // Show compensation summary based on new SOP
      let compensationMessage = '';
      if (takeoverType === 'full') {
        compensationMessage = 'Full takeover logged - Pending admin verification for full job payout';
      } else if (takeoverType === 'partial') {
        const bonusAmount = selectedJob.service.service_type.toLowerCase().includes('laundry') ? '$10' : 
                           selectedJob.service.service_type.toLowerCase().includes('car') ? '$20' : '$15';
        compensationMessage = `Partial takeover logged - Pending admin verification for hourly rate + ${bonusAmount} bonus`;
      } else {
        compensationMessage = 'Light assistance logged - Hourly rate only (no verification required)';
      }

      toast.success(compensationMessage);
      setShowInterventionModal(false);
      setInterventionNotes('');
      setInterventionPhotos([]);
      setSelectedJob(null);
      setInterventionDuration(15);
      setInterventionType('assist');
      setTakeoverType('none');
      setLaborPercentageCovered(0);
      setTasksCompleted('');
      setJobFinishedByLead(false);
      loadDashboardData();

    } catch (error) {
      console.error('Error logging intervention:', error);
      toast.error('Failed to log intervention');
    }
  };

  // Add coaching notes
  const handleCoachingNotes = async () => {
    if (!coachingNotes.trim()) {
      toast.error('Please provide coaching notes');
      return;
    }

    try {
      const { error } = await supabase
        .from('coaching_notes')
        .insert({
          lead_bubbler_id: user.id,
          notes: coachingNotes,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Mark coaching task as completed
      setOversightTasks(prev => prev.map(task => 
        task.id === 6 ? { ...task, completed: true } : task
      ));

      toast.success('Coaching notes saved');
      setShowCoachingModal(false);
      setCoachingNotes('');

    } catch (error) {
      console.error('Error saving coaching notes:', error);
      toast.error('Failed to save coaching notes');
    }
  };

  // Filter jobs
  const filteredJobs = zoneJobs.filter(job => {
    if (filters.status !== 'all' && job.status !== filters.status) return false;
    if (filters.urgency !== 'all' && job.urgency !== filters.urgency) return false;
    if (filters.bubbler !== 'all' && job.bubbler_id !== filters.bubbler) return false;
    if (filters.serviceType !== 'all' && job.service.service_type !== filters.serviceType) return false;
    return true;
  });

  // Handle equipment assistance request
  const handleEquipmentRequest = async (requestId, action) => {
    // Check if lead bubbler is active before processing equipment requests
    if (leadBubblerProfile?.leadership_status !== 'active') {
      toast.error('Your Lead Bubbler status is inactive. Cannot process equipment requests.');
      return;
    }
    
    try {
      if (action === 'accept') {
        const { error } = await supabase
          .from('equipment_requests')
          .update({
            status: 'in_transit',
            lead_bubbler_id: user.id
          })
          .eq('id', requestId);

        if (error) throw error;

        // Create lead check-in for equipment delivery
        const { data: checkinData, error: checkinError } = await supabase
          .from('lead_checkins')
          .insert({
            lead_bubbler_id: user.id,
            checkin_type: 'equipment_delivery',
            linked_request_id: requestId,
            assisting_bubbler_id: selectedEquipmentRequest.bubbler_id,
            checkin_start: new Date().toISOString(),
            service_type: selectedEquipmentRequest.order_service.service_type.toLowerCase().includes('laundry') ? 'fresh' :
                         selectedEquipmentRequest.order_service.service_type.toLowerCase().includes('car') ? 'shine' : 'sparkle',
            notes: `Equipment delivery: ${selectedEquipmentRequest.equipment.name}`
          })
          .select()
          .single();

        if (checkinError) throw checkinError;

        // Process compensation calculation for equipment delivery
        const { error: compensationError } = await supabase.rpc('process_lead_checkin_compensation', {
          checkin_id: checkinData.id
        });

        if (compensationError) throw compensationError;

        toast.success('Equipment delivery accepted - clock started');
        setShowEquipmentModal(false);
        loadDashboardData();

      } else if (action === 'delivered') {
        const { error } = await supabase
          .from('equipment_requests')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (error) throw error;

        // Update lead check-in to end equipment delivery
        const { data: checkinData, error: checkinError } = await supabase
          .from('lead_checkins')
          .update({
            checkin_end: new Date().toISOString(),
            equipment_confirmed_by_bubbler: true
          })
          .eq('linked_request_id', requestId)
          .eq('checkin_type', 'equipment_delivery')
          .select()
          .single();

        if (checkinError) throw checkinError;

        toast.success('Equipment delivered and confirmed');
        setShowEquipmentModal(false);
        loadDashboardData();
      }

    } catch (error) {
      console.error('Error handling equipment request:', error);
      toast.error('Failed to process equipment request');
    }
  };

  // Handle training session management
  const handleTrainingSession = async (sessionId, action) => {
    try {
      if (action === 'start') {
        const { error } = await supabase
          .from('training_sessions')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (error) throw error;
        toast.success('Training session started');
        loadDashboardData();

      } else if (action === 'complete') {
        const { error } = await supabase
          .from('training_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (error) throw error;
        toast.success('Training session completed');
        loadDashboardData();
      }

    } catch (error) {
      console.error('Error handling training session:', error);
      toast.error('Failed to update training session');
    }
  };

  // Wrap-up timing functions
  const startWrapUp = (checkInType, serviceType) => {
    const startTime = new Date().toISOString();
    setWrapUpStartTime(startTime);
    setWrapUpRemaining(180); // 3 minutes
    setIsWrapUpActive(true);
    setShowAlert(false);
    
    // Generate photo prompts based on checklist flags
    const prompts = generatePhotoPrompts({
      checkInType,
      serviceType,
      hasPhotos: wrapUpPhotos.length > 0,
      checklistFlags
    });
    setPhotoPrompts(prompts.prompts);
    
    // Generate quick-select tags
    const tags = generateQuickSelectTags({
      checkInType,
      serviceType,
      checklistFlags
    });
    setQuickSelectTags(tags.tags);
    
    // Validate submission requirements
    const submissionValidation = validateFinalSubmission({
      notes: wrapUpNotes,
      photos: wrapUpPhotos,
      checklistFlags,
      hasRequiredPhotos: prompts.hasRequiredPhotos,
      notesLength: wrapUpNotes.length
    });
    
    setSubmissionLocked(submissionValidation.isLocked);
    setLockoutMessage(submissionValidation.lockoutMessage);
    
    toast.success('Wrap-up timer started. You have 3 minutes to complete documentation.');
  };

  const handleWrapUpExpired = () => {
    setIsWrapUpActive(false);
    setWrapUpRemaining(0);
    toast.error('Wrap-up time expired. Check-in will be submitted with available data.');
    handleWrapUpSubmit();
  };

  const handleWrapUpSubmit = async () => {
    try {
      if (!selectedJob) return;

      const validation = validateCheckIn({
        leadId: user.id,
        bubblerId: selectedJob.bubbler_id,
        checkInType: interventionType,
        notes: wrapUpNotes,
        photos: wrapUpPhotos,
        rating: feedbackRatings,
        duration: interventionDuration,
        wrapUpStartTime,
        currentTime: new Date().toISOString()
      });

      if (!validation.isValid) {
        toast.error('Validation failed: ' + validation.errors.join(', '));
        return;
      }

      const { error } = await supabase
        .from('lead_checkins')
        .insert({
          lead_id: user.id,
          bubbler_id: selectedJob.bubbler_id,
          job_id: selectedJob.id,
          checkin_type: interventionType,
          notes: wrapUpNotes,
          photos: wrapUpPhotos,
          rating: feedbackRatings,
          duration: interventionDuration,
          wrap_up_start_time: wrapUpStartTime,
          wrap_up_duration: validation.checkInData.wrapUpDuration
        });

      if (error) throw error;

      setIsWrapUpActive(false);
      setWrapUpRemaining(180);
      setWrapUpNotes('');
      setWrapUpPhotos([]);
      setPhotoPrompts([]);
      setWrapUpStartTime(null);

      toast.success('Check-in completed successfully');
      setShowInterventionModal(false);
      loadDashboardData();

    } catch (error) {
      console.error('Error submitting wrap-up:', error);
      toast.error('Failed to submit check-in data');
    }
  };

  const formatWrapUpTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle quick-select tag insertion
  const handleTagSelect = (tag) => {
    const currentNotes = wrapUpNotes || '';
    const newNotes = currentNotes + (currentNotes ? ' ' : '') + tag;
    
    // Check character limit
    if (newNotes.length <= 180) {
      setWrapUpNotes(newNotes);
      setSelectedTags([...selectedTags, tag]);
      
      // Auto-save immediately after tag insertion
      const autoSaveResult = autoSaveNotes({
        notes: newNotes,
        leadId: user?.id,
        bubblerId: selectedJob?.bubbler_id,
        jobId: selectedJob?.id
      });
      
      if (autoSaveResult.success) {
        setLastAutoSave(new Date().toISOString());
      }
    } else {
      toast.error('Adding this tag would exceed the 180 character limit');
    }
  };

  // Handle note updates with real-time validation
  const handleNoteUpdate = (newNotes) => {
    setWrapUpNotes(newNotes);
    
    // Real-time validation
    const submissionValidation = validateFinalSubmission({
      notes: newNotes,
      photos: wrapUpPhotos,
      checklistFlags,
      hasRequiredPhotos: photoPrompts.some(p => p.type === 'required'),
      notesLength: newNotes.length
    });
    
    setSubmissionLocked(submissionValidation.isLocked);
    setLockoutMessage(submissionValidation.lockoutMessage);
  };

  // Handle photo upload with validation
  const handlePhotoUpload = (newPhotos) => {
    setWrapUpPhotos(newPhotos);
    
    // Update photo prompts
    const prompts = generatePhotoPrompts({
      checkInType: interventionType,
      serviceType: selectedJob?.service_type,
      hasPhotos: newPhotos.length > 0,
      checklistFlags
    });
    setPhotoPrompts(prompts.prompts);
    
    // Re-validate submission
    const submissionValidation = validateFinalSubmission({
      notes: wrapUpNotes,
      photos: newPhotos,
      checklistFlags,
      hasRequiredPhotos: prompts.hasRequiredPhotos,
      notesLength: wrapUpNotes.length
    });
    
    setSubmissionLocked(submissionValidation.isLocked);
    setLockoutMessage(submissionValidation.lockoutMessage);
  };

  if (!isLeadBubbler) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Lead Bubbler privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Mode Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Lead Bubbler Dashboard</h1>
            <p className="text-gray-600">
              {currentMode === 'oversight' ? 'Oversight Mode - Zone Monitoring Active' : 'Default Mode - EliteBubbler View'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {currentMode === 'oversight' && (
              <div className="flex items-center space-x-2">
                <FiToggleRight className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Oversight Active</span>
              </div>
            )}
            {currentMode === 'default' && (
              <div className="flex items-center space-x-2">
                <FiToggleLeft className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Default Mode</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Oversight Mode - Active Shift Information */}
      {currentMode === 'oversight' && activeShift && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <FiShield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800">Active Oversight Shift</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Zone:</span>
                  <div className="text-sm text-blue-600 font-semibold">{leadBubblerProfile?.assigned_zone}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Shift Time:</span>
                  <div className="text-sm text-blue-600 font-semibold">
                    {new Date(activeShift.start_time).toLocaleTimeString()} - {new Date(activeShift.end_time).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Oversight Timer:</span>
                  <div className="text-sm text-blue-600 font-semibold font-mono">
                    {formatTimer(checkInTimer || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiDollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Oversight Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">${oversightEarnings.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{oversightHours}h this week</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiStar className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Job Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">${jobEarnings.toFixed(2)}</p>
              <p className="text-xs text-gray-500">This week</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FiUsers className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Own Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">{ownJobs.length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Own Jobs Priority Section */}
      {ownJobs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <FiAlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800">Complete Your Own Jobs First</h4>
              <p className="text-sm text-yellow-700 mb-3">
                You have {ownJobs.length} pending job(s). Please complete these before beginning oversight duties.
              </p>
              <div className="space-y-2">
                {ownJobs.slice(0, 3).map((job, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded p-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {job.order_service.service_type} - {job.orders.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(job.orders.scheduled_date).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'en_route' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                {ownJobs.length > 3 && (
                  <p className="text-xs text-yellow-600">... and {ownJobs.length - 3} more</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Oversight Mode Content */}
      {currentMode === 'oversight' && leadBubblerProfile?.leadership_status === 'active' ? (
        <>
          {/* Equipment Assistance Requests */}
          {equipmentRequests.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <FiAlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-800">Equipment Assistance Requests</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    {equipmentRequests.length} pending equipment request(s) in your zone
                  </p>
                  <div className="space-y-2">
                    {equipmentRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between bg-white rounded p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.equipment.name} - {request.bubblers.first_name} {request.bubblers.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.order_service.service_type} • {request.urgency_level} urgency
                          </p>
                          <p className="text-xs text-gray-500">{request.notes}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedEquipmentRequest(request);
                            setShowEquipmentModal(true);
                          }}
                          className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                        >
                          Accept
                        </button>
                      </div>
                    ))}
                    {equipmentRequests.length > 3 && (
                      <p className="text-xs text-orange-600">... and {equipmentRequests.length - 3} more</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Ratings */}
          {feedbackRatings && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <FiStar className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-800">Team Feedback Ratings</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Based on {feedbackRatings.total_feedback_count} anonymous feedback responses
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Overall Rating:</span>
                      <span className="ml-2 font-medium text-green-800">
                        {feedbackRatings.avg_overall_rating}/5.0
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Helpfulness:</span>
                      <span className="ml-2 font-medium text-green-800">
                        {feedbackRatings.avg_helpfulness}/5.0
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Respectfulness:</span>
                      <span className="ml-2 font-medium text-green-800">
                        {feedbackRatings.avg_respectfulness}/5.0
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Supportiveness:</span>
                      <span className="ml-2 font-medium text-green-800">
                        {feedbackRatings.avg_supportiveness}/5.0
                      </span>
                    </div>
                  </div>
                  {feedbackRatings.avg_overall_rating < 4.7 && (
                    <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Your rating is below the retention threshold (4.7). Focus on improving team support and communication.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Training Sessions */}
          {trainingSessions.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <FiAward className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-purple-800">Training Sessions</h4>
                  <p className="text-sm text-purple-700 mb-3">
                    {trainingSessions.length} upcoming training session(s)
                  </p>
                  <div className="space-y-2">
                    {trainingSessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center justify-between bg-white rounded p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {session.training_type.replace('_', ' ')} Training
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.session_date).toLocaleDateString()} • {session.duration_minutes}min • ${session.payout_amount}
                          </p>
                          <p className="text-xs text-gray-500">{session.location}</p>
                        </div>
                        <div className="flex space-x-2">
                          {session.status === 'scheduled' && (
                            <button
                              onClick={() => handleTrainingSession(session.id, 'start')}
                              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                            >
                              Start
                            </button>
                          )}
                          {session.status === 'in_progress' && (
                            <button
                              onClick={() => handleTrainingSession(session.id, 'complete')}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedTrainingSession(session);
                              setShowTrainingModal(true);
                            }}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                    {trainingSessions.length > 3 && (
                      <p className="text-xs text-purple-600">... and {trainingSessions.length - 3} more</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Oversight Tasks Checklist */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Oversight Tasks</h3>
            <div className="space-y-2">
              {oversightTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-500"
                  >
                    {task.completed ? (
                      <FiCheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FiSquare className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {task.title}
                  </span>
                  {task.required && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCheckInModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FiPlay className="h-4 w-4" />
                <span>Check In</span>
              </button>
              <button
                onClick={handleCheckOut}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <FiX className="h-4 w-4" />
                <span>Check Out</span>
              </button>
              <button
                onClick={() => setShowCoachingModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FiEdit className="h-4 w-4" />
                <span>Add Coaching Notes</span>
              </button>
            </div>
          </div>

          {/* Zone Jobs Monitoring */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Zone Jobs - Active Shift</h2>
              <p className="text-sm text-gray-600 mt-1">
                Monitoring {zoneJobs.length} jobs in {leadBubblerProfile?.assigned_zone} zone
              </p>
            </div>
            
            {zoneJobs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No jobs found for current shift
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bubbler</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perk Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map((job) => {
                      const urgencyDisplay = getUrgencyDisplay(job.urgency);
                      const bubbler = job.bubblers;
                      
                      return (
                        <tr key={job.id} className={`hover:bg-gray-50 ${!job.canOversee ? 'opacity-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{job.customerName}</div>
                              <div className="text-sm text-gray-500">{job.customerAddress}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {job.service.service_type}
                              </span>
                              {!job.canOversee && (
                                <span className="text-xs text-red-600" title="Not certified for this service">
                                  ⚠️
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {bubbler ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {bubbler.first_name} {bubbler.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{bubbler.current_status}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              job.status === 'completed' ? 'bg-green-100 text-green-800' :
                              job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              job.status === 'en_route' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${urgencyDisplay.bgColor} ${urgencyDisplay.color}`}>
                              {urgencyDisplay.icon} {urgencyDisplay.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {job.hasPerkDelivery ? (
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                job.perkScanned ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {job.perkScanned ? '✅ Verified' : '❌ Pending'}
                              </span>
                            ) : (
                              <span className="text-gray-400">No perk</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {bubbler && job.canOversee && (
                                <>
                                  <button
                                    onClick={() => handleCallBubbler(bubbler)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Call Bubbler"
                                  >
                                    <FiPhone className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleMessageBubbler(bubbler)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Message Bubbler"
                                  >
                                    <FiMessageCircle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {job.canOversee ? (
                                <button
                                  onClick={() => handleIntervention(job)}
                                  className="text-orange-600 hover:text-orange-900"
                                  title="Log Intervention"
                                >
                                  <FiEdit className="h-4 w-4" />
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400" title="Not certified for this service">
                                  No oversight
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Default Mode - Elite Bubbler View */
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">EliteBubbler Dashboard</h2>
          <p className="text-gray-600">
            You are currently in default mode. When you have an active oversight shift scheduled, 
            the dashboard will automatically switch to oversight mode with zone monitoring capabilities.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-medium text-blue-800 mb-2">Your Current Status:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Focus on completing your own job assignments</li>
              <li>• No oversight responsibilities at this time</li>
              <li>• Standard EliteBubbler dashboard access</li>
              <li>• Oversight mode activates automatically during scheduled shifts</li>
            </ul>
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Check In for Oversight Shift</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={checkInLocation}
                onChange={(e) => setCheckInLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your current location..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Any additional notes..."
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCheckInModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckIn}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Check In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coaching Notes Modal */}
      {showCoachingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Coaching Notes</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coaching Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={coachingNotes}
                onChange={(e) => setCoachingNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Enter coaching notes for your team..."
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCoachingModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCoachingNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intervention Modal */}
      {showInterventionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Log Intervention - {selectedJob?.customerName}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervention Type <span className="text-red-500">*</span>
              </label>
              <select
                value={interventionType}
                onChange={(e) => setInterventionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="assist">Assist (Light or Partial)</option>
                <option value="takeover">Full Takeover</option>
                <option value="coaching">Coaching Only</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Takeover Level <span className="text-red-500">*</span>
              </label>
              <select
                value={takeoverType}
                onChange={(e) => setTakeoverType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">Light Assistance (No Bonus)</option>
                <option value="partial">Partial Takeover (30+ min, Bonus)</option>
                <option value="full">Full Takeover (Full Job Payout)</option>
              </select>
            </div>

            {(takeoverType === 'partial' || takeoverType === 'full') && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labor Percentage Covered <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={laborPercentageCovered}
                    onChange={(e) => setLaborPercentageCovered(parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Estimate what percentage of the job labor you covered
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasks Completed <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={tasksCompleted}
                    onChange={(e) => setTasksCompleted(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Describe the specific tasks you completed..."
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={jobFinishedByLead}
                      onChange={(e) => setJobFinishedByLead(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      I finished the job myself
                    </span>
                  </label>
                </div>
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={interventionDuration}
                onChange={(e) => setInterventionDuration(parseInt(e.target.value) || 15)}
                min="1"
                max="480"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="15"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervention Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={interventionNotes}
                onChange={(e) => setInterventionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Describe the intervention taken... (Required for compensation)"
              />
            </div>

            {/* Compensation Preview */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800 font-medium mb-2">
                <FiFileText className="inline h-4 w-4 mr-1" />
                Compensation Preview:
              </p>
              <div className="text-sm text-blue-700">
                {takeoverType === 'full' ? (
                  <div>
                    <p>🟥 Full Takeover: Full job payout (no hourly rate)</p>
                    <p className="text-xs text-blue-600">Original bubbler gets $10 credit if they started</p>
                  </div>
                ) : takeoverType === 'partial' ? (
                  <div>
                    <p>🟨 Partial Takeover: Hourly rate + {selectedJob?.service?.service_type?.toLowerCase().includes('laundry') ? '$10' : 
                       selectedJob?.service?.service_type?.toLowerCase().includes('car') ? '$20' : '$15'} bonus</p>
                    <p className="text-xs text-blue-600">Requires 30+ minutes of active assistance</p>
                  </div>
                ) : (
                  <div>
                    <p>✅ Light Assistance: Hourly rate only (no bonus)</p>
                    <p className="text-xs text-blue-600">Quick help, coaching, or minor tasks</p>
                  </div>
                )}
                <p className="mt-1">Duration: {interventionDuration} minutes</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowInterventionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleInterventionComplete}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Log Intervention
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Request Modal */}
      {showEquipmentModal && selectedEquipmentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Assistance Request</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requesting Bubbler</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  {selectedEquipmentRequest.bubblers.first_name} {selectedEquipmentRequest.bubblers.last_name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Needed</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  {selectedEquipmentRequest.equipment.name} ({selectedEquipmentRequest.equipment.type})
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  {selectedEquipmentRequest.order_service.service_type}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedEquipmentRequest.urgency_level === 'high' ? 'bg-red-100 text-red-800' :
                    selectedEquipmentRequest.urgency_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedEquipmentRequest.urgency_level.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md">
                  {selectedEquipmentRequest.notes || 'No additional notes'}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <FiInfo className="inline h-4 w-4 mr-1" />
                  Equipment delivery time is billable at your current oversight rate. 
                  Travel time and setup assistance are included in compensation.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEquipmentModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              {selectedEquipmentRequest.status === 'pending' && (
                <button
                  onClick={() => handleEquipmentRequest(selectedEquipmentRequest.id, 'accept')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Accept & Dispatch
                </button>
              )}
              {selectedEquipmentRequest.status === 'in_transit' && (
                <button
                  onClick={() => handleEquipmentRequest(selectedEquipmentRequest.id, 'delivered')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Training Session Modal */}
      {showTrainingModal && selectedTrainingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Training Session - {selectedTrainingSession.training_type.replace('_', ' ')}
            </h3>
            
            <div className="space-y-6">
              {/* Session Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Session Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedTrainingSession.session_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">{selectedTrainingSession.duration_minutes} minutes</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium">{selectedTrainingSession.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payout:</span>
                    <span className="ml-2 font-medium">${selectedTrainingSession.payout_amount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedTrainingSession.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedTrainingSession.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedTrainingSession.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Attendees</h4>
                {selectedTrainingSession.training_attendees && selectedTrainingSession.training_attendees.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTrainingSession.training_attendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center justify-between border-l-4 border-blue-500 pl-4 py-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attendee.bubblers.first_name} {attendee.bubblers.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{attendee.bubblers.email}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            attendee.attended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {attendee.attended ? 'Attended' : 'Absent'}
                          </span>
                          {attendee.cert_issued && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Certified
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No attendees assigned</p>
                )}
              </div>

              {/* Training Checklist */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Training Modules</h4>
                <div className="space-y-2">
                  {(() => {
                    const modules = {
                      'laundry': ['Laundry Bag Handling', 'Eco-Friendly Detergents', 'Folding Techniques', 'Customer Interaction'],
                      'carwash': ['Equipment Setup', 'Water Conservation', 'Detailing Techniques', 'Safety Protocols'],
                      'home_cleaning': ['Eco-Cleaning Methods', 'Equipment Usage', 'Time Management', 'Customer Service'],
                      'multi-role': ['Cross-Training Overview', 'Equipment Familiarization', 'Service Standards', 'Team Communication']
                    };
                    
                    const sessionModules = modules[selectedTrainingSession.training_type] || modules['multi-role'];
                    
                    return sessionModules.map((module, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300">
                          <FiCheckSquare className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-700">{module}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTrainingModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intervention Modal */}
      {showInterventionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Log Intervention - {selectedJob?.customerName}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervention Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={interventionNotes}
                onChange={(e) => setInterventionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Describe the intervention taken... (Required for compensation)"
              />
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <FiFileText className="inline h-4 w-4 mr-1" />
                This intervention will be logged for compensation tracking (15 minutes standard duration)
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowInterventionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleInterventionComplete}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Log Intervention
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadBubblerDashboard; 