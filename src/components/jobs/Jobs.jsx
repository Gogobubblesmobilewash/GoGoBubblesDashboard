import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FiSearch, 
  FiFilter, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiCheck, 
  FiX, 
  FiCamera, 
  FiUpload, 
  FiDownload, 
  FiMessageCircle, 
  FiCpu,
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiCheckSquare,
  FiSquare
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import useStore from '../../store/useStore';
import { supabase } from '../../services/api';
import { 
  JOB_STATUSES, 
  LAUNDRY_STATUSES,
  LAUNDRY_SERVICE_TIERS,
  SERVICE_TYPES, 
  TIERS, 
  ADDONS, 
  BAG_TYPES,
  getPhotoRequirements, 
  getPayoutRules,
  calculateJobDuration,
  getDurationStatus,
  formatDuration
} from '../../constants';
import QRScanner from './QRScanner';
import Modal from '../shared/Modal';
import MessageThread from '../messages/MessageThread';
import { parseServicesForSplitting, fetchBubblersWithTravelPrefs, getJobPaymentStatus, getPerks } from '../../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../../store/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const ACCEPTANCE_WINDOWS = {
  urgent: 15,
  standard: 30,
};

// Use the imported LAUNDRY_STATUSES from constants

const Jobs = () => {
  const { user, isAdmin, isSupport, isMarketManager, isLeadBubbler, isShineBubbler, isSparkleBubbler, isFreshBubbler, isEliteBubbler, canDoLaundry, canDoCarWash, canDoHomeCleaning } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bubblers, setBubblers] = useState([]);
  const [assignModal, setAssignModal] = useState({ open: false, service: null, order: null });
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [messageModal, setMessageModal] = useState({ open: false, assignment: null });
  const [messageCounts, setMessageCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [qrNotifications, setQrNotifications] = useState([]);
  const [pickupPhotos, setPickupPhotos] = useState({}); // assignmentId -> file
  const [deliveryPhotos, setDeliveryPhotos] = useState({}); // assignmentId -> file

  // Enhanced filtering and pagination state
  const [advancedFilters, setAdvancedFilters] = useState({
    serviceType: 'all',
    dateRange: 'all',
    priority: 'all',
    assignedBubbler: 'all',
    minAmount: '',
    maxAmount: '',
    hasMessages: 'all',
    paymentStatus: 'all',
    processingTime: 'all'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState({}); // orderId -> payment status
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  // Helper to determine acceptance window (minutes) based on job type
  const getAcceptanceWindow = (service) => {
    // Example: urgent for same-day, standard for others
    if (service.service_type === 'Home Cleaning' && service.status === 'urgent') return ACCEPTANCE_WINDOWS.urgent;
    return ACCEPTANCE_WINDOWS.standard;
  };

  // Helper to check if a job offer is expired
  const isOfferExpired = (assignment) => {
    if (!assignment.offer_sent_at || !assignment.acceptance_window_minutes) return false;
    const sent = dayjs(assignment.offer_sent_at);
    const now = dayjs();
    return now.diff(sent, 'minute') >= assignment.acceptance_window_minutes;
  };

  // Helper to get remaining time (MM:SS)
  const getRemainingTime = (assignment) => {
    if (!assignment.offer_sent_at || !assignment.acceptance_window_minutes) return null;
    const sent = dayjs(assignment.offer_sent_at);
    const now = dayjs();
    const totalSeconds = assignment.acceptance_window_minutes * 60 - now.diff(sent, 'second');
    if (totalSeconds <= 0) return '00:00';
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // Helper to expire job offers that have timed out
  const expireJobIfNeeded = async (assignment) => {
    if (assignment.status === 'assigned' && isOfferExpired(assignment)) {
      await supabase
        .from('job_assignments')
        .update({ status: 'expired', expired_at: new Date().toISOString() })
        .eq('id', assignment.id);
      loadOrders();
    }
  };

  // Helper to check if today is the assignment day
  const isTodayAssignmentDay = (assignment) => {
    if (!assignment?.assigned_at) return false;
    const assignedDate = dayjs(assignment.assigned_at).format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    return assignedDate === today;
  };

  // Helper to check if job is completed
  const isJobCompleted = (assignment) => assignment?.status === 'completed';
  
  // Check if payment is confirmed for a job
  const isPaymentConfirmed = (orderId) => {
    const paymentData = paymentStatuses[orderId];
    if (!paymentData || paymentData.length === 0) return false;
    return paymentData.some(payment => payment.payment_status === 'paid');
  };

  // Get next valid statuses based on current status and service type
  const getNextValidStatuses = (currentStatus, serviceType) => {
    if (serviceType === 'Laundry Service') {
      return getNextLaundryStatuses(currentStatus);
    } else {
      return getNextGeneralStatuses(currentStatus);
    }
  };

  // Get next valid statuses for general services (car wash, home cleaning)
  const getNextGeneralStatuses = (currentStatus) => {
    switch (currentStatus) {
      case 'assigned':
        return ['accepted', 'denied'];
      case 'denied':
        return ['reassign'];
      case 'accepted':
        return ['en_route'];
      case 'en_route':
        return ['arrived'];
      case 'arrived':
        return ['in_progress'];
      case 'in_progress':
        return ['completed'];
      case 'reassign':
        return ['assigned'];
      default:
        return [];
    }
  };

  // Get next valid statuses for laundry services
  const getNextLaundryStatuses = (currentStatus) => {
    switch (currentStatus) {
      case 'assigned':
        return ['accepted', 'denied'];
      case 'denied':
        return ['reassign'];
      case 'accepted':
        return ['en_route_to_pickup'];
      case 'en_route_to_pickup':
        return ['arrived_at_pickup'];
      case 'arrived_at_pickup':
        return ['picked_up'];
      case 'picked_up':
        return ['in_wash'];
      case 'in_wash':
        return ['in_dry'];
      case 'in_dry':
        return ['folding_ironing'];
      case 'folding_ironing':
        return ['en_route_to_deliver'];
      case 'en_route_to_deliver':
        return ['arrived_at_delivery'];
      case 'arrived_at_delivery':
        return ['delivered'];
      case 'delivered':
        return ['completed'];
      case 'reassign':
        return ['assigned'];
      default:
        return [];
    }
  };

  // Check if photos are required for completion
  const arePhotosRequired = (service, assignment) => {
    const { requirements } = getPhotoRequirementsForJob(service, assignment);
    return requirements.length > 0;
  };

  // Check if job can be completed (photos uploaded if required)
  const canCompleteJob = (service, assignment) => {
    if (!arePhotosRequired(service, assignment)) {
      return true;
    }
    
    // Check if required photos have been uploaded
    const { requirements } = getPhotoRequirementsForJob(service, assignment);
    const uploadedPhotos = assignment.photos || [];
    
    return requirements.every(req => 
      uploadedPhotos.some(photo => photo.type === req)
    );
  };

  // Calculate laundry processing time remaining (flexible based on service tier)
  const getLaundryTimeRemaining = (assignment, service) => {
    if (service?.service_type !== 'Laundry Service') return null;
    
    const pickupTime = assignment.picked_up_at;
    if (!pickupTime) return null;
    
    // Get processing hours based on service tier
    const serviceTier = service.tier || 'Standard Service';
    const tierConfig = LAUNDRY_SERVICE_TIERS[serviceTier];
    
    if (!tierConfig) return null;
    
    // Skip non-visible tiers for non-admin users
    if (!tierConfig.visible && !isAdmin) return null;
    
    const processingHours = tierConfig.processingHours;
    
    const pickup = new Date(pickupTime);
    const now = new Date();
    const elapsedHours = (now - pickup) / (1000 * 60 * 60);
    const remainingHours = Math.max(0, processingHours - elapsedHours);
    
    return {
      elapsed: elapsedHours,
      remaining: remainingHours,
      isOverdue: elapsedHours > processingHours,
      processingHours: processingHours,
      serviceTier: serviceTier,
      displayName: tierConfig.displayName || serviceTier
    };
  };

  // Get laundry status description with time info
  const getLaundryStatusDescription = (assignment, service) => {
    const timeInfo = getLaundryTimeRemaining(assignment, service);
    if (!timeInfo) return assignment.status.replace(/_/g, ' ');
    
    const statusText = assignment.status.replace(/_/g, ' ');
    const tierInfo = `(${timeInfo.displayName})`;
    
    if (timeInfo.isOverdue) {
      return `${statusText} ${tierInfo} - OVERDUE: ${Math.floor(timeInfo.elapsed)}h elapsed`;
    } else {
      return `${statusText} ${tierInfo} - ${Math.floor(timeInfo.remaining)}h remaining`;
    }
  };

  // Get laundry processing time display
  const getLaundryProcessingTimeDisplay = (service) => {
    if (service?.service_type !== 'Laundry Service') return null;
    
    const serviceTier = service.tier || 'Standard Service';
    const tierConfig = LAUNDRY_SERVICE_TIERS[serviceTier];
    
    if (!tierConfig) return null;
    
    const processingHours = tierConfig.processingHours;
    const displayName = tierConfig.displayName || serviceTier;
    
    // Only show visible tiers by default (admin can override)
    if (!tierConfig.visible && !isAdmin) {
      return null; // Hide non-visible tiers for non-admin users
    }
    
    if (processingHours <= 4) {
      return `${processingHours}h Rush`;
    } else if (processingHours <= 8) {
      return `${processingHours}h ${displayName}`;
    } else if (processingHours <= 24) {
      return `${processingHours}h Express`;
    } else {
      return `${processingHours}h Standard`;
    }
  };

  // Calculate expected job duration for a service
  const getExpectedJobDuration = (service) => {
    if (!service) return null;
    
    const serviceType = service.service_type;
    const tier = service.tier;
    const addons = service.addons || [];
    
    // Get additional options based on service type
    let options = {};
    
    if (serviceType === 'Mobile Car Wash') {
      // Get vehicles array from order_vehicles
      const vehicles = service.order_vehicles || [];
      options.vehicles = vehicles;
    } else if (serviceType === 'Home Cleaning') {
      // Get room counts from order_cleaning_details
      const cleaningDetails = service.order_cleaning_details?.[0];
      if (cleaningDetails) {
        options.bedrooms = cleaningDetails.bedrooms_count || 1;
        options.bathrooms = cleaningDetails.bathrooms_count || 1;
      }
    }
    
    return calculateJobDuration(serviceType, tier, addons, options);
  };

  // Get duration status with visual indicator
  const getDurationStatusDisplay = (expectedDuration, actualDuration) => {
    const status = getDurationStatus(expectedDuration, actualDuration);
    
    const statusConfig = {
      green: {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: '🟢',
        label: 'On Time'
      },
      yellow: {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: '🟡',
        label: 'Nearing Overage'
      },
      red: {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: '🔴',
        label: 'Overdue'
      },
      unknown: {
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: '⚪',
        label: 'Unknown'
      }
    };
    
    return statusConfig[status] || statusConfig.unknown;
  };

  // Get visible laundry service tiers
  const getVisibleLaundryTiers = () => {
    return Object.entries(LAUNDRY_SERVICE_TIERS)
      .filter(([_, config]) => config.visible || isAdmin)
      .map(([tier, config]) => ({
        name: tier,
        displayName: config.displayName || tier,
        processingHours: config.processingHours,
        visible: config.visible
      }));
  };

  // Check if laundry is approaching deadline
  const getLaundryUrgencyLevel = (assignment, service) => {
    const timeInfo = getLaundryTimeRemaining(assignment, service);
    if (!timeInfo) return null;
    
    const remainingPercentage = (timeInfo.remaining / timeInfo.processingHours) * 100;
    
    if (timeInfo.isOverdue) {
      return { level: 'overdue', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (remainingPercentage <= 25) {
      return { level: 'critical', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (remainingPercentage <= 50) {
      return { level: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else {
      return { level: 'normal', color: 'text-green-600', bgColor: 'bg-green-50' };
    }
  };

  // Render status action buttons based on current status and service type
  const renderStatusActions = (job, service) => {
    const validNextStatuses = getNextValidStatuses(job.status, service.service_type);
    
    if (validNextStatuses.length === 0) {
      return <span className="text-gray-500 text-sm">No actions available</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {validNextStatuses.map(status => {
          // Check if this is a completion action and if photos are required
          const isCompletionAction = status === 'completed';
          const canComplete = isCompletionAction ? canCompleteJob(service, job) : true;
          
          // Get photo requirements if this is a completion action
          let missingPhotos = [];
          if (isCompletionAction && !canComplete) {
            const { requirements } = getPhotoRequirementsForJob(service, job);
            const uploadedPhotos = job.photos || [];
            missingPhotos = requirements.filter(req => 
              !uploadedPhotos.some(photo => photo.type === req)
            );
          }

          return (
            <button
              key={status}
              onClick={() => updateJobStatus(job.id, status)}
              disabled={!canComplete}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                !canComplete ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                status === 'denied' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                status === 'accepted' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                status === 'completed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={
                !canComplete && isCompletionAction 
                  ? `Cannot complete: Missing required photos (${missingPhotos.join(', ')})`
                  : `Mark as ${status.replace(/_/g, ' ')}`
              }
            >
              {status.replace(/_/g, ' ')}
              {!canComplete && isCompletionAction && (
                <span className="ml-1 text-red-500">⚠️</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // Helper to determine photo requirements based on role and service
  const getPhotoRequirementsForJob = (service, assignment) => {
    const requirements = [];
    const notes = [];
    
    // Get photo requirements based on service type, tier, and add-ons
    const serviceRequirements = getPhotoRequirements(service.service_type, service.tier, service.addons || []);
    requirements.push(...serviceRequirements);
    
    // Laundry services always require pickup and delivery photos
    if (canDoLaundry && service.service_type === 'Laundry Service') {
      if (assignment.status === 'en_route_to_pickup' || assignment.status === 'picked_up') {
        requirements.push('Pickup Photo');
      }
      if (assignment.status === 'en_route_to_deliver' || assignment.status === 'delivered') {
        requirements.push('Delivery Photo');
      }
    }
    
    // Shine bubblers (car wash) need photos when perks are delivered
    if (isShineBubbler && service.service_type === 'Mobile Car Wash') {
      if (assignment.status === 'completed') {
        requirements.push('Perk Delivery Photo');
        notes.push('Reminder: Take a clear photo showing the delivered perk. If you want to add any notes (e.g., customer declined perk), use the regular job notes section below.');
      }
    }
    
    // Sparkle bubblers (home cleaning) need photos when perks are delivered
    if (isSparkleBubbler && service.service_type === 'Home Cleaning') {
      if (assignment.status === 'completed') {
        requirements.push('Perk Delivery Photo');
        notes.push('Reminder: Take a clear photo showing the delivered perk. If you want to add any notes (e.g., customer declined perk), use the regular job notes section below.');
      }
    }
    
    // Elite bubblers need photos for both laundry and perk delivery
    if (isEliteBubbler) {
      if (service.service_type === 'Laundry Service') {
        if (assignment.status === 'en_route_to_pickup' || assignment.status === 'picked_up') {
          requirements.push('Pickup Photo');
        }
        if (assignment.status === 'en_route_to_deliver' || assignment.status === 'delivered') {
          requirements.push('Delivery Photo');
        }
      } else if (assignment.status === 'completed') {
        requirements.push('Perk Delivery Photo');
        notes.push('Reminder: Take a clear photo showing the delivered perk. If you want to add any notes (e.g., customer declined perk), use the regular job notes section below.');
      }
    }
    
    return { requirements, notes };
  };

  // Handle job status updates
  const updateJobStatus = async (assignmentId, newStatus) => {
    try {
      // Find the job assignment to get the order ID and service info
      const assignment = orders.flatMap(order => 
        order.order_service?.flatMap(service => 
          service.job_assignments?.filter(ja => ja.id === assignmentId) || []
        ) || []
      ).find(ja => ja);
      
      if (!assignment) {
        toast.error('Job assignment not found');
        return;
      }

      // Find the service to get service type
      const service = orders.flatMap(order => 
        order.order_service?.filter(s => 
          s.job_assignments?.some(ja => ja.id === assignmentId)
        ) || []
      ).find(s => s);

      if (!service) {
        toast.error('Service not found for this assignment');
        return;
      }

      // Validate status transition
      const validNextStatuses = getNextValidStatuses(assignment.status, service.service_type);
      if (!validNextStatuses.includes(newStatus)) {
        toast.error(`Invalid status transition from ${assignment.status} to ${newStatus}`);
        return;
      }

      // Check payment status before allowing job progression (except for denied/reassign)
      if (!['denied', 'reassign', 'cancelled'].includes(newStatus)) {
        const orderId = orders.find(order => 
          order.order_service?.some(s => 
            s.job_assignments?.some(ja => ja.id === assignmentId)
          )
        )?.id;
        
        if (orderId && !isPaymentConfirmed(orderId)) {
          toast.error('Payment not confirmed. Cannot proceed with job until payment is received.');
          return;
        }
      }

      // Check if completion is allowed (photos required)
      if (newStatus === 'completed' && !canCompleteJob(service, assignment)) {
        toast.error('Cannot complete job. Required photos must be uploaded first.');
        return;
      }

      // Handle automatic status transitions
      let finalStatus = newStatus;
      let additionalUpdates = {};

      // Auto-transition logic
      if (newStatus === 'denied') {
        // When denied, automatically move to reassign
        finalStatus = 'reassign';
        additionalUpdates = {
          denied_at: new Date().toISOString(),
          reassigned_at: new Date().toISOString()
        };
      } else if (newStatus === 'arrived') {
        // When arrived, automatically move to in_progress
        finalStatus = 'in_progress';
        additionalUpdates = {
          arrived_at: new Date().toISOString(),
          started_at: new Date().toISOString()
        };
      } else {
        // Standard status updates
        additionalUpdates = {
          ...(newStatus === 'accepted' && { accepted_at: new Date().toISOString() }),
          ...(newStatus === 'en_route' && { en_route_at: new Date().toISOString() }),
          ...(newStatus === 'en_route_to_pickup' && { en_route_to_pickup_at: new Date().toISOString() }),
          ...(newStatus === 'en_route_to_deliver' && { en_route_to_deliver_at: new Date().toISOString() }),
          ...(newStatus === 'arrived_at_pickup' && { arrived_at_pickup_at: new Date().toISOString() }),
          ...(newStatus === 'arrived_at_delivery' && { arrived_at_delivery_at: new Date().toISOString() }),
          ...(newStatus === 'picked_up' && { picked_up_at: new Date().toISOString() }),
          ...(newStatus === 'in_wash' && { in_wash_at: new Date().toISOString() }),
          ...(newStatus === 'in_dry' && { in_dry_at: new Date().toISOString() }),
          ...(newStatus === 'folding_ironing' && { folding_ironing_at: new Date().toISOString() }),
          ...(newStatus === 'delivered' && { delivered_at: new Date().toISOString() }),
          ...(newStatus === 'completed' && { completed_at: new Date().toISOString() }),
          ...(newStatus === 'reassign' && { reassigned_at: new Date().toISOString() })
        };
      }

      const { error } = await supabase
        .from('job_assignments')
        .update({ 
          status: finalStatus,
          ...additionalUpdates
        })
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      // Show appropriate success message
      if (newStatus === 'denied') {
        toast.success('Job denied and moved to reassignment');
      } else if (newStatus === 'arrived') {
        toast.success('Arrived and job started!');
      } else {
        toast.success(`Job status updated to ${finalStatus.replace('_', ' ')}!`);
      }
      
      loadOrders(); // Refresh the orders to show updated status
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  // Load message counts for all job assignments
  const loadMessageCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('job_assignment_id')
        .not('job_assignment_id', 'is', null);
      
      if (error) throw error;
      
      // Ensure data is an array, default to empty array if null/undefined
      const messagesArray = Array.isArray(data) ? data : [];
      
      // Count messages per job assignment
      const counts = {};
      messagesArray.forEach(msg => {
        counts[msg.job_assignment_id] = (counts[msg.job_assignment_id] || 0) + 1;
      });
      
      setMessageCounts(counts);
    } catch (error) {
      console.error('Error loading message counts:', error);
    }
  };

  // Filter orders/services for bubbler view with search and status filtering
  const getVisibleOrders = () => {
    // Role-based filtering
    let filteredOrders = [...orders];

    // Market Manager: Only see jobs in their assigned territory
    if (isMarketManager && !isAdmin) {
      // In real implementation, this would filter by assigned ZIP codes/cities
      // For now, showing all jobs but with a notice
      console.log('Market Manager: Filtering by local territory');
      // filteredOrders = filteredOrders.filter(order => 
      //   order.zip_code && user.assigned_territories?.includes(order.zip_code)
      // );
    }

    // Lead Bubbler: Only see team jobs
    if (isLeadBubbler && !isAdmin) {
      // In real implementation, this would filter by team members
      // For now, showing all jobs but with a notice
      console.log('Lead Bubbler: Filtering by team assignments');
      // filteredOrders = filteredOrders.filter(order => 
      //   order.assigned_bubbler_id && user.team_members?.includes(order.assigned_bubbler_id)
      // );
    }

    // Support: Can see all jobs but with different permissions
    if (isSupport && !isAdmin) {
      console.log('Support: Can view all jobs for customer service');
    }

    // Regular Bubblers: Only see their own jobs
    if (!isAdmin && !isSupport && !isMarketManager && !isLeadBubbler) {
      filteredOrders = filteredOrders.filter(order => {
        return order.job_assignments?.some(assignment => 
          assignment.bubbler_id === user.id
        );
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      filteredOrders = filteredOrders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        return (
          order.customer_name?.toLowerCase().includes(searchLower) ||
          order.address?.toLowerCase().includes(searchLower) ||
          order.order_service?.some(service => 
            service.service_type?.toLowerCase().includes(searchLower)
          )
        );
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredOrders = filteredOrders.map(order => {
        const filteredServices = (order.order_service || []).filter(service => {
          const assignment = isAdmin || isSupport || isMarketManager || isLeadBubbler
            ? (service.job_assignments || [])[0]
            : (service.job_assignments || []).find(a => a.bubbler_id === user?.id);
          return assignment?.status === statusFilter;
        });
        if (filteredServices.length === 0) return null;
        return { ...order, order_service: filteredServices };
      }).filter(Boolean);
    }
    
    return filteredOrders;
  };

  // Load orders and job assignments
  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Get user role for payment view selection
      const userRole = user?.role || (isAdmin ? 'admin' : isSupport ? 'support' : 'bubbler');
      
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_service (
            *,
            job_assignments (
              *,
              bubblers (
                id,
                name,
                email,
                role
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(ordersData);
      
      // Fetch payment status for all orders using role-appropriate view
      const paymentStatusesData = {};
      for (const order of ordersData) {
        try {
          const paymentData = await getJobPaymentStatus(order.id, userRole);
          paymentStatusesData[order.id] = paymentData;
        } catch (error) {
          console.error(`Error fetching payment status for order ${order.id}:`, error);
          paymentStatusesData[order.id] = [];
        }
      }
      setPaymentStatuses(paymentStatusesData);
      } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
      } finally {
        setLoading(false);
    }
  };

  // Fetch all bubblers with travel preferences
  const loadBubblers = async () => {
    try {
      const data = await fetchBubblersWithTravelPrefs();
      setBubblers(Array.isArray(data) ? data : []);
      } catch (error) {
      console.error('Error loading bubblers:', error);
      toast.error('Failed to load bubblers');
    }
  };

  // Check for QR code mismatches and create notifications
  const checkQrMismatches = () => {
    const notifications = [];
    orders.forEach(order => {
      if (order.order_service) {
        order.order_service.forEach(service => {
          if (service.service_type === 'Laundry' && service.job_assignments) {
            service.job_assignments.forEach(assignment => {
              if (assignment.pickup_scan?.matched === false && !assignment.manual_override) {
                notifications.push({
                  id: `pickup-${assignment.id}`,
                  type: 'pickup',
                  assignment,
                  order,
                  service,
                  message: `Pickup scan mismatch for ${order.customer_name} - Laundry job`
                });
              }
              if (assignment.delivery_scan?.matched === false && !assignment.manual_override) {
                notifications.push({
                  id: `delivery-${assignment.id}`,
                  type: 'delivery',
                  assignment,
                  order,
                  service,
                  message: `Delivery scan mismatch for ${order.customer_name} - Laundry job`
                });
              }
            });
          }
        });
      }
    });
    setQrNotifications(notifications);
  };

  // Helper to upload photo and return public URL
  const uploadPhoto = async (file, assignmentId, type) => {
    const filePath = `laundry_photos/${assignmentId}_${type}_${Date.now()}`;
    const { data, error } = await supabase.storage.from('job-photos').upload(filePath, file);
    if (error) throw error;
    const { publicURL } = supabase.storage.from('job-photos').getPublicUrl(filePath).data;
    return publicURL;
  };

  // Enhanced filtering logic
  const getFilteredJobs = () => {
    let jobs = [];
    
    // Flatten orders into individual job assignments
    orders.forEach(order => {
      if (order.order_service) {
        order.order_service.forEach(service => {
          if (service.job_assignments) {
            service.job_assignments.forEach(assignment => {
              jobs.push({
                ...assignment,
                order,
                service,
                customerName: order.customer_name,
                customerAddress: order.address,
                serviceType: service.service_type,
                earningsEstimate: service.earnings_estimate,
                depositAmount: service.deposit_amount,
                created_at: order.created_at,
                assignedBubbler: bubblers.find(b => b.id === assignment.bubbler_id)?.name || 'Unassigned',
                messageCount: messageCounts[assignment.id] || 0
              });
            });
          }
        });
      }
    });

    // Apply filters
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      jobs = jobs.filter(job => 
        job.customerName?.toLowerCase().includes(searchLower) ||
        job.customerAddress?.toLowerCase().includes(searchLower) ||
        job.serviceType?.toLowerCase().includes(searchLower) ||
        job.assignedBubbler?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      jobs = jobs.filter(job => job.status === statusFilter);
    }

    if (advancedFilters.serviceType !== 'all') {
      jobs = jobs.filter(job => job.serviceType === advancedFilters.serviceType);
    }

    if (advancedFilters.assignedBubbler !== 'all') {
      jobs = jobs.filter(job => job.assignedBubbler === advancedFilters.assignedBubbler);
    }

    if (advancedFilters.minAmount) {
      jobs = jobs.filter(job => parseFloat(job.earningsEstimate || 0) >= parseFloat(advancedFilters.minAmount));
    }

    if (advancedFilters.maxAmount) {
      jobs = jobs.filter(job => parseFloat(job.earningsEstimate || 0) <= parseFloat(advancedFilters.maxAmount));
    }

    if (advancedFilters.hasMessages === 'yes') {
      jobs = jobs.filter(job => job.messageCount > 0);
    } else if (advancedFilters.hasMessages === 'no') {
      jobs = jobs.filter(job => job.messageCount === 0);
    }

    // Payment status filtering
    if (advancedFilters.paymentStatus !== 'all') {
      jobs = jobs.filter(job => {
        const orderId = orders.find(order => 
          order.order_service?.some(service => 
            service.job_assignments?.some(ja => ja.id === job.id)
          )
        )?.id;
        const isPaid = orderId ? isPaymentConfirmed(orderId) : false;
        return advancedFilters.paymentStatus === 'paid' ? isPaid : !isPaid;
      });
    }

    // Processing time filtering (for laundry services)
    if (advancedFilters.processingTime !== 'all') {
      jobs = jobs.filter(job => {
        const service = orders.flatMap(order => 
          order.order_service?.filter(s => 
            s.job_assignments?.some(ja => ja.id === job.id)
          ) || []
        ).find(s => s);
        
        if (service?.service_type !== 'Laundry Service') return true;
        
        const serviceTier = service.tier || 'Standard Service';
        const tierConfig = LAUNDRY_SERVICE_TIERS[serviceTier];
        
        if (!tierConfig) return true;
        
        // Skip non-visible tiers for non-admin users
        if (!tierConfig.visible && !isAdmin) return false;
        
        const processingHours = tierConfig.processingHours;
        
        switch (advancedFilters.processingTime) {
          case 'rush':
            return processingHours <= 4 && (tierConfig.visible || isAdmin);
          case 'same_day':
            return processingHours <= 8 && processingHours > 4 && (tierConfig.visible || isAdmin);
          case 'express':
            return processingHours <= 24 && processingHours > 8;
          case 'standard':
            return processingHours > 24;
          default:
            return true;
        }
      });
    }

    // Date range filtering
    if (advancedFilters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      jobs = jobs.filter(job => {
        const jobDate = new Date(job.created_at);
        switch (advancedFilters.dateRange) {
          case 'today':
            return jobDate >= today;
          case 'week':
            return jobDate >= weekAgo;
          case 'month':
            return jobDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // For non-admin users, filter to only their jobs
    if (!isAdmin) {
      jobs = jobs.filter(job => job.bubbler_id === user?.id);
    }

    return jobs;
  };

  // Sorting
  const getSortedJobs = (jobs) => {
    return jobs.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle nested properties
      if (sortBy === 'customerName') {
        aValue = a.customerName;
        bValue = b.customerName;
      } else if (sortBy === 'serviceType') {
        aValue = a.serviceType;
        bValue = b.serviceType;
      } else if (sortBy === 'assignedBubbler') {
        aValue = a.assignedBubbler;
        bValue = b.assignedBubbler;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Pagination
  const getPaginatedJobs = (jobs) => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    return jobs.slice(startIndex, startIndex + jobsPerPage);
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedJobs.length === 0) {
      toast.error('Please select jobs first');
      return;
    }

    try {
      switch (action) {
        case 'assign':
          // Open assignment modal for first selected job
          const firstJob = orders.find(order => 
            order.order_service?.some(service => 
              service.job_assignments?.some(assignment => 
                selectedJobs.includes(assignment.id)
              )
            )
          );
          if (firstJob) {
            const service = firstJob.order_service.find(service => 
              service.job_assignments?.some(assignment => 
                selectedJobs.includes(assignment.id)
              )
            );
            setAssignModal({ open: true, service, order: firstJob });
          }
          break;
        case 'message':
          // Open message modal for first selected job
          const firstSelectedJob = getFilteredJobs().find(job => selectedJobs.includes(job.id));
          if (firstSelectedJob) {
            setMessageModal({ open: true, assignment: firstSelectedJob });
          }
          break;
        case 'export':
          exportSelectedJobs();
          break;
        default:
          toast.error('Action not implemented');
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const exportSelectedJobs = () => {
    const selectedJobData = getFilteredJobs().filter(job => selectedJobs.includes(job.id));
    const csvContent = generateJobCSV(selectedJobData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_jobs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Jobs exported successfully');
  };

  const generateJobCSV = (jobs) => {
    const headers = [
      'Job ID',
      'Customer Name',
      'Service Type',
      'Status',
      'Assigned Bubbler',
      'Earnings Estimate',
      'Deposit Amount',
      'Created Date',
      'Assigned Date',
      'Message Count'
    ];
    
    const rows = jobs.map(job => [
      job.id,
      job.customerName,
      job.serviceType,
      job.status,
      job.assignedBubbler,
      job.earningsEstimate,
      job.depositAmount,
      new Date(job.created_at).toLocaleDateString(),
      job.assigned_at ? new Date(job.assigned_at).toLocaleDateString() : '',
      job.messageCount
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  useEffect(() => {
    loadOrders();
    loadBubblers();
    loadMessageCounts(); // Load message counts on mount
  }, []);

  // Sync statusFilter with URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status && status !== statusFilter) {
      setStatusFilter(status);
    }
  }, [location.search]);

  // When statusFilter changes, update the URL
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    const params = new URLSearchParams(location.search);
    if (newStatus === 'all') {
      params.delete('status');
      } else {
      params.set('status', newStatus);
    }
    navigate({ search: params.toString() }, { replace: true });
  };

  // Check for QR mismatches when orders change
  useEffect(() => {
    if (isAdmin) {
      checkQrMismatches();
    }
  }, [orders, isAdmin]);

  // Set up real-time subscription for job status changes
  useEffect(() => {
    const subscription = supabase
      .channel('job-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_assignments'
        },
        () => {
          // Reload orders when job assignments change
          loadOrders();
          loadMessageCounts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check for expired jobs periodically
  useEffect(() => {
    const checkExpiredJobs = () => {
      orders.forEach(order => {
        if (order.order_service) {
          order.order_service.forEach(service => {
            const assignment = isAdmin
              ? (service.job_assignments || [])[0]
              : (service.job_assignments || []).find(a => a.bubbler_id === user?.id);
            
            if (assignment && assignment.status === 'assigned') {
              expireJobIfNeeded(assignment);
            }
          });
        }
      });
    };

    // Check immediately
    checkExpiredJobs();
    
    // Set up interval to check every 30 seconds
    const interval = setInterval(checkExpiredJobs, 30000);
    
    return () => clearInterval(interval);
  }, [orders, isAdmin, user?.id]);

  // Handle manual override for QR code mismatches
  const handleManualOverride = async (assignmentId) => {
      try {
        const { error } = await supabase
          .from('job_assignments')
          .update({ 
            manual_override: true,
          updated_at: new Date().toISOString()
          })
          .eq('id', assignmentId);
        
      if (error) {
        console.error('Manual override error:', error);
        toast.error('Failed to apply manual override');
        return;
      }
        
        toast.success('Manual override applied successfully');
      loadOrders(); // Refresh the orders data
      } catch (error) {
      console.error('Manual override error:', error);
        toast.error('Failed to apply manual override');
    }
  };

  // Render each order and its services (updated to show timer/status)
  const renderOrderServices = (order) => {
    if (!order.order_service || order.order_service.length === 0) return null;
    return order.order_service.map((service, idx) => {
      // Find job assignment for this service (if any)
      const assignment = isAdmin
        ? (service.job_assignments || [])[0]
        : (service.job_assignments || []).find(a => a.bubbler_id === user?.id);
      // Address visibility logic
      let showAddress = true;
      if (!isAdmin) {
        showAddress = isTodayAssignmentDay(assignment) && !isJobCompleted(assignment);
      }
    return (
        <div key={service.id} className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
          <div>
              <h3 className="text-lg font-semibold text-gray-900">{order.customer_name}</h3>
              {showAddress ? (
                <p className="text-sm text-gray-600">{order.address}</p>
              ) : (
                !isAdmin && <p className="text-sm text-gray-400 italic">Address will be visible on the day of assignment</p>
              )}
              <p className="text-xs text-gray-500">Order ID: {order.id}</p>
              <p className="text-xs text-gray-500">Service: {service.service_type}</p>
          </div>
            <div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {assignment ? assignment.status.toUpperCase() : (service.status ? service.status.toUpperCase() : 'UNASSIGNED')}
          </span>
              {/* Timer preview for admin */}
              {assignment && assignment.status === 'assigned' && (
                <span className="ml-2 px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-mono">
                  ⏳ {getRemainingTime(assignment)}
                    </span>
              )}
              {assignment && assignment.status === 'expired' && (
                <span className="ml-2 px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-mono">
                  Expired
                    </span>
              )}
            </div>
                  </div>
          {/* Service-specific details */}
          {service.service_type === 'Home Cleaning' && service.order_cleaning_details && (
            <div className="text-sm text-gray-700 mb-2">
              Bedrooms: {service.order_cleaning_details[0]?.bedrooms_count}, Bathrooms: {service.order_cleaning_details[0]?.bathrooms_count}
            </div>
            )}
          {service.service_type === 'Laundry' && service.order_laundry_bags && (
            <div className="text-sm text-gray-700 mb-2">
              Bags: {service.order_laundry_bags.map(bag => `${bag.bag_type} x${bag.quantity}`).join(', ')}
              </div>
            )}
          
          {/* Expected Job Duration - for Mobile Car Wash and Home Cleaning */}
          {(service.service_type === 'Mobile Car Wash' || service.service_type === 'Home Cleaning') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                ⏱️ Expected Duration
              </h4>
              {(() => {
                const durationInfo = getExpectedJobDuration(service);
                if (!durationInfo || durationInfo.totalDuration === 0) {
                  return (
                    <div className="text-xs text-gray-600">
                      Duration calculation not available
                    </div>
                  );
                }
                
                const formattedDuration = formatDuration(durationInfo.totalDuration);
                let breakdown = [];
                
                if (service.service_type === 'Mobile Car Wash') {
                  breakdown.push(`Base (${service.tier}): ${formatDuration(durationInfo.baseDuration)}`);
                  if (durationInfo.addonTime > 0) {
                    breakdown.push(`Add-ons: ${formatDuration(durationInfo.addonTime)}`);
                  }
                  if (durationInfo.vehicleCount > 1) {
                    breakdown.push(`${durationInfo.vehicleCount} vehicles: ${formatDuration(durationInfo.timePerVehicle)} each`);
                  }
                  
                  // Show vehicle breakdown if available
                  if (durationInfo.vehicleBreakdown && durationInfo.vehicleBreakdown.length > 0) {
                    const vehicleDetails = durationInfo.vehicleBreakdown.map(v => 
                      `${v.vehicleType} (${v.multiplier}×): ${formatDuration(v.duration)}`
                    );
                    breakdown.push(`Vehicles: ${vehicleDetails.join(', ')}`);
                  }
                } else if (service.service_type === 'Home Cleaning') {
                  breakdown.push(`Base (${service.tier}): ${formatDuration(durationInfo.baseDuration)}`);
                  if (durationInfo.roomTime > 0) {
                    breakdown.push(`Additional rooms: ${formatDuration(durationInfo.roomTime)}`);
                  }
                  if (durationInfo.addonTime > 0) {
                    breakdown.push(`Add-ons: ${formatDuration(durationInfo.addonTime)}`);
                  }
                }
                
                return (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-blue-900">
                      Total: {formattedDuration}
                    </div>
                    {breakdown.length > 0 && (
                      <div className="text-xs text-blue-700">
                        {breakdown.join(' • ')}
                      </div>
                    )}
                  </div>
                );
              })()}
              </div>
            )}
            
          {/* QR Code Monitoring Section - Admin Only for Laundry Jobs */}
          {isAdmin && service.service_type === 'Laundry' && assignment && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <FiCpu className="h-4 w-4 mr-2" />
                QR Code Monitoring
                {assignment.manual_override && (
                  <span className="ml-2 px-2 py-1 rounded bg-orange-100 text-orange-800 text-xs font-medium">
                    Manual Override Applied
                </span>
                )}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Scan */}
                <div className="bg-white rounded-lg p-3 border">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Pickup Scan
                  </h5>
                  {assignment.pickup_scan ? (
                    <div className="space-y-1">
                      <div className="text-xs">
                        <span className="font-medium">QR Code:</span> 
                        <span className="font-mono ml-1">{assignment.pickup_scan.qr_value}</span>
                  </div>
                      <div className="text-xs">
                        <span className="font-medium">Time:</span> 
                        <span className="ml-1">{new Date(assignment.pickup_scan.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Result:</span> 
                        <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
                          assignment.pickup_scan.matched 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assignment.pickup_scan.matched ? '✅ Matched' : '❌ Not Matched'}
                    </span>
                  </div>
                      {assignment.pickup_scan.expected_value && (
                        <div className="text-xs">
                          <span className="font-medium">Expected:</span> 
                          <span className="font-mono ml-1">{assignment.pickup_scan.expected_value}</span>
                </div>
                      )}
              </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic">No pickup scan recorded</div>
                  )}
                </div>
                
                {/* Delivery Scan */}
                <div className="bg-white rounded-lg p-3 border">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Delivery Scan
                  </h5>
                  {assignment.delivery_scan ? (
                    <div className="space-y-1">
                      <div className="text-xs">
                        <span className="font-medium">QR Code:</span> 
                        <span className="font-mono ml-1">{assignment.delivery_scan.qr_value}</span>
          </div>
                      <div className="text-xs">
                        <span className="font-medium">Time:</span> 
                        <span className="ml-1">{new Date(assignment.delivery_scan.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Result:</span> 
                        <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
                          assignment.delivery_scan.matched 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assignment.delivery_scan.matched ? '✅ Matched' : '❌ Not Matched'}
                    </span>
                  </div>
                      {assignment.delivery_scan.expected_value && (
                        <div className="text-xs">
                          <span className="font-medium">Expected:</span> 
                          <span className="font-mono ml-1">{assignment.delivery_scan.expected_value}</span>
                </div>
                      )}
              </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic">No delivery scan recorded</div>
                  )}
                </div>
              </div>
              
              {/* Manual Override Section */}
              {(assignment.pickup_scan?.matched === false || assignment.delivery_scan?.matched === false) && !assignment.manual_override && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      {assignment.pickup_scan?.matched === false && (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs mr-2">
                          ⚠️ Pickup scan mismatch
                </span>
                      )}
                      {assignment.delivery_scan?.matched === false && (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">
                          ⚠️ Delivery scan mismatch
                    </span>
            )}
          </div>
                    <button 
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => handleManualOverride(assignment.id)}
                    >
                      Manual Override
                    </button>
        </div>
          </div>
          )}
          
              {/* Manual Override Info */}
              {assignment.manual_override && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-orange-100 text-orange-800 text-xs mr-2">
                      🔧 Manual Override Applied
                    </span>
                    <span className="text-gray-500">
                      By: {assignment.override_by} | 
                      Time: {new Date(assignment.override_timestamp).toLocaleString()}
                    </span>
            </div>
            </div>
          )}
          </div>
          )}
          {service.service_type === 'Vehicles' && service.order_vehicles && (
            <div className="text-sm text-gray-700 mb-2">
              Vehicles: {service.order_vehicles.map(v => `${v.vehicle_type} (${v.tier})`).join(', ')}
        </div>
            )}
          
          {/* Photo Requirements Section */}
          {assignment && arePhotosRequired(service, assignment) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                📸 Photo Requirements
              </h4>
              {(() => {
                const { requirements, notes } = getPhotoRequirementsForJob(service, assignment);
                const uploadedPhotos = assignment.photos || [];
                const missingPhotos = requirements.filter(req => 
                  !uploadedPhotos.some(photo => photo.type === req)
                );
                const completedPhotos = requirements.filter(req => 
                  uploadedPhotos.some(photo => photo.type === req)
                );
                
                return (
                  <div className="space-y-2">
                    {/* Required Photos */}
                    <div className="text-xs">
                      <span className="font-medium text-blue-700">Required:</span>
                      <div className="mt-1 space-y-1">
                        {requirements.map(req => {
                          const isCompleted = completedPhotos.includes(req);
                          return (
                            <div key={req} className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span className={isCompleted ? 'text-green-700 line-through' : 'text-red-700'}>
                                {req}
                              </span>
                              {isCompleted && <span className="text-green-600 text-xs">✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Perk Delivery Photo Note */}
                    {notes.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                        <p className="text-xs text-yellow-800">
                          {notes[0]}
                        </p>
                      </div>
                    )}
                    
                    {/* Completion Status */}
                    {missingPhotos.length > 0 ? (
                      <div className="text-xs text-red-600 font-medium">
                        ⚠️ Cannot complete job: {missingPhotos.length} photo(s) still required
                      </div>
                    ) : (
                      <div className="text-xs text-green-600 font-medium">
                        ✅ All required photos uploaded - job can be completed
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {/* Messages button - only show if job is assigned */}
            {assignment && assignment.status !== 'expired' && assignment.status !== 'declined' && (
                <button 
                className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-1 relative"
                onClick={() => setMessageModal({ open: true, assignment })}
              >
                <FiMessageCircle className="w-4 h-4" />
                Messages
                {messageCounts[assignment.id] > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {messageCounts[assignment.id] > 99 ? '99+' : messageCounts[assignment.id]}
                  </span>
                )}
              </button>
            )}
            
            {/* Job Status Management - for bubblers only */}
            {!isAdmin && assignment && (
              <div className="flex gap-1">
                {/* Accept/Decline buttons for assigned jobs */}
                {assignment.status === 'assigned' && (
              <>
                <button 
                      className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                      onClick={() => updateJobStatus(assignment.id, 'accepted')}
                >
                      Accept
                </button>
                <button 
                      className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors text-sm"
                      onClick={() => updateJobStatus(assignment.id, 'declined')}
                >
                      Decline
                </button>
              </>
            )}

                {/* Start job button for accepted jobs */}
                {assignment.status === 'accepted' && (
                <button 
                    className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                    onClick={() => updateJobStatus(assignment.id, 'in-progress')}
                  >
                    Start Job
                </button>
                )}
                
                {/* Complete job button for in-progress jobs */}
                {assignment.status === 'in-progress' && (
                <button 
                    className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition-colors text-sm"
                    onClick={() => updateJobStatus(assignment.id, 'completed')}
                >
                    Complete Job
                </button>
            )}
              </div>
            )}
          
            {/* Assignment button (only if not assigned or expired) - only for admin */}
            {isAdmin && (!assignment || assignment.status === 'expired' || assignment.status === 'declined') && (
            <button 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                onClick={() => setAssignModal({ open: true, service, order })}
                disabled={service.status && service.status !== 'unassigned'}
            >
                Assign Job
            </button>
          )}
        </div>
      </div>
    );
    });
  };

  // Assignment Modal (updated)
  const AssignModal = ({ open, service, order, onClose }) => {
    if (!open || !service || !order) return null;
    
    // Role-based bubbler filtering
    let eligibleBubblers = bubblers.filter(bubbler => {
      if (!bubbler.is_active) return false;
      const travelTime = calculateTravelTime(bubbler, order.address);
      return travelTime <= (bubbler.preferred_travel_minutes || 30);
    });

    // Market Manager: Only assign to bubblers in their territory
    if (isMarketManager && !isAdmin) {
      // In real implementation, filter by assigned territory
      console.log('Market Manager: Filtering bubblers by local territory');
      // eligibleBubblers = eligibleBubblers.filter(bubbler => 
      //   user.assigned_territories?.includes(bubbler.territory)
      // );
    }

    // Lead Bubbler: Only assign to team members
    if (isLeadBubbler && !isAdmin) {
      // In real implementation, filter by team members
      console.log('Lead Bubbler: Filtering bubblers by team members');
      // eligibleBubblers = eligibleBubblers.filter(bubbler => 
      //   user.team_members?.includes(bubbler.id)
      // );
    }

    // Support: Can assign to any active bubbler
    if (isSupport && !isAdmin) {
      console.log('Support: Can assign to any active bubbler');
    }

    return (
      <Modal title="Assign Job to Bubbler" onClose={onClose} size="lg">
        <div className="mb-4">
          <div className="font-semibold mb-2">Job: {service.service_type} for {order.customer_name}</div>
          <div className="text-sm text-gray-600 mb-2">{order.address}</div>
          
          {/* Role-based assignment notice */}
          {isMarketManager && !isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Market Manager Assignment:</strong> You can assign jobs to bubblers in your local territory.
              </p>
            </div>
          )}
          
          {isLeadBubbler && !isAdmin && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-800">
                <strong>Team Assignment:</strong> You can assign jobs to your team members only.
              </p>
            </div>
          )}
          
          {isSupport && !isAdmin && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800">
                <strong>Support Assignment:</strong> You can assign jobs to any active bubbler for customer service.
              </p>
            </div>
          )}
      </div>
        <div className="mb-4">
          <div className="font-semibold mb-2">Eligible Bubblers:</div>
          {eligibleBubblers.length === 0 && <div className="text-red-500">No eligible bubblers within travel range.</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eligibleBubblers.map(bubbler => {
              const travelTime = calculateTravelTime(bubbler, order.address);
  return (
                <div key={bubbler.id} className="border rounded-lg p-3 flex flex-col gap-2 bg-gray-50">
                  <div className="font-semibold">{bubbler.name}</div>
                  <div className="text-xs text-gray-600">{bubbler.email}</div>
                  <div className="text-xs text-gray-600">{bubbler.phone}</div>
                  <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                    Travel Radius: {bubbler.preferred_travel_minutes || 30} min
                  </span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${travelTime > bubbler.preferred_travel_minutes ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    Est. Travel: {travelTime} min
                  </span>
                  {travelTime > bubbler.preferred_travel_minutes && (
                    <span className="text-xs text-yellow-700 bg-yellow-100 rounded px-2 py-1 mt-1">⚠️ Out of preferred range</span>
                  )}
                  <button
                    className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                    disabled={assigning}
                    onClick={async () => {
                      setAssignError('');
                      setAssigning(true);
                      try {
                        // Insert into job_assignments with timer fields
                        const acceptance_window_minutes = getAcceptanceWindow(service);
                        const { error } = await supabase
                          .from('job_assignments')
                          .insert({
                            order_service_id: service.id,
                            bubbler_id: bubbler.id,
                            status: 'assigned',
                            assigned_at: new Date().toISOString(),
                            offer_sent_at: new Date().toISOString(),
                            acceptance_window_minutes,
                            assigned_by: user.id, // Track who assigned the job
                            assigned_by_role: isAdmin ? 'ADMIN' : isSupport ? 'SUPPORT' : isMarketManager ? 'MARKET_MANAGER' : isLeadBubbler ? 'LEAD_BUBBLER' : 'SYSTEM'
                          });
                        if (error) throw error;
                        toast.success('Job assigned!');
                        setAssignModal({ open: false, service: null, order: null });
                        loadOrders();
                      } catch (err) {
                        setAssignError(err.message);
                      } finally {
                        setAssigning(false);
                      }
                    }}
                  >
                    Assign to {bubbler.name}
            </button>
              </div>
            );
            })}
                </div>
          {assignError && <div className="text-red-500 mt-2">{assignError}</div>}
                      </div>
      </Modal>
    );
  };

  const filteredJobs = getFilteredJobs();
  const sortedJobs = getSortedJobs(filteredJobs);
  const paginatedJobs = getPaginatedJobs(sortedJobs);
  const totalPages = Math.ceil(sortedJobs.length / jobsPerPage);

  if (loading) {
    return <div className="p-6">Loading orders...</div>;
  }

  // Only render jobs content when on the jobs route
  if (location.pathname !== '/jobs') {
    return null;
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'All Jobs' : 
             isSupport ? 'Job Assignment' :
             isMarketManager ? 'Local Jobs' :
             isLeadBubbler ? 'Team Jobs' :
             'My Jobs'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isAdmin ? `Showing ${sortedJobs.length} of ${filteredJobs.length} jobs` :
             isSupport ? `Customer service job assignment - ${sortedJobs.length} jobs available` :
             isMarketManager ? `Local territory jobs - ${sortedJobs.length} jobs in your market` :
             isLeadBubbler ? `Team management - ${sortedJobs.length} jobs for your team` :
             `Showing ${sortedJobs.length} of your assigned jobs`}
          </p>
          
          {/* Role-based assignment capabilities notice */}
          {isSupport && !isAdmin && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
              <p className="text-sm text-green-800">
                <strong>Support Assignment Capabilities:</strong> You can assign jobs to any active bubbler for customer service needs.
              </p>
            </div>
          )}
          
          {isMarketManager && !isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
              <p className="text-sm text-blue-800">
                <strong>Market Manager Assignment Capabilities:</strong> You can assign jobs to bubblers in your local territory.
              </p>
            </div>
          )}
          
          {isLeadBubbler && !isAdmin && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
              <p className="text-sm text-orange-800">
                <strong>Team Assignment Capabilities:</strong> You can assign jobs to your team members only.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Cards
            </button>
          </div>
          
          {/* Export Button */}
          <button
            onClick={() => exportSelectedJobs()}
            disabled={selectedJobs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="h-4 w-4" />
            Export Selected
          </button>
        </div>
      </div>

      {/* Enhanced Search and Filter Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
            <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, address, service type, or bubbler..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
        </div>
        
        {/* Status Filter */}
          <div className="lg:w-48">
            <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="denied">Denied</option>
            <option value="reassign">Reassign</option>
            <option value="accepted">Accepted</option>
            <option value="en_route">En Route</option>
            <option value="arrived">Arrived</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="en_route_to_pickup">En Route to Pickup</option>
            <option value="arrived_at_pickup">Arrived at Pickup</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_wash">In Wash</option>
            <option value="in_dry">In Dry</option>
            <option value="folding_ironing">Folding/Ironing</option>
            <option value="en_route_to_deliver">En Route to Deliver</option>
            <option value="arrived_at_delivery">Arrived at Delivery</option>
            <option value="delivered">Delivered</option>
            </select>
        </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiFilter className="h-4 w-4" />
            Advanced Filters
          </button>
      </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Service Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select
                  value={advancedFilters.serviceType}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, serviceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Services</option>
                  <option value="Laundry Service">Laundry</option>
                  <option value="Mobile Car Wash">Car Wash</option>
                  <option value="Home Cleaning">Home Cleaning</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={advancedFilters.dateRange}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                <input
                  type="number"
                  placeholder="Min $"
                  value={advancedFilters.minAmount}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                <input
                  type="number"
                  placeholder="Max $"
                  value={advancedFilters.maxAmount}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>

              {/* Has Messages Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Has Messages</label>
                <select
                  value={advancedFilters.hasMessages}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasMessages: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Jobs</option>
                  <option value="yes">With Messages</option>
                  <option value="no">Without Messages</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={advancedFilters.paymentStatus}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending Payment</option>
                </select>
              </div>

              {/* Processing Time Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Processing Time</label>
                <select
                  value={advancedFilters.processingTime}
                  onChange={(e) => setAdvancedFilters(prev => ({ ...prev, processingTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Processing Times</option>
                  {isAdmin && (
                    <>
                      <option value="rush">Rush (≤4h) - Admin Only</option>
                      <option value="same_day">Same Day (≤8h) - Admin Only</option>
                    </>
                  )}
                  <option value="express">Express (≤24h)</option>
                  <option value="standard">Standard (&gt;24h)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedJobs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCheckSquare className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('assign')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Assign
              </button>
              <button
                onClick={() => handleBulkAction('message')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Message
              </button>
              <button
                onClick={() => setSelectedJobs([])}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Notifications - Admin Only */}
      {isAdmin && qrNotifications.length > 0 && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
              <FiCpu className="h-4 w-4 mr-2" />
              QR Code Scan Issues ({qrNotifications.length})
            </h3>
            <div className="space-y-2">
              {qrNotifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      notification.type === 'pickup' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></span>
                    <span className="text-yellow-700">{notification.message}</span>
      </div>
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => handleManualOverride(notification.assignment.id)}
                  >
                    Override
                  </button>
                </div>
                ))}
              {qrNotifications.length > 3 && (
                <div className="text-xs text-yellow-600 italic">
                  +{qrNotifications.length - 3} more scan issues...
              </div>
              )}
            </div>
            </div>
          </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-8">Loading jobs...</div>
      ) : paginatedJobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || statusFilter !== 'all' || Object.values(advancedFilters).some(v => v !== 'all' && v !== '') ? 'No jobs match your filters.' : 'No jobs found.'}
            </div>
      ) : viewMode === 'table' ? (
        <>
          {/* Table View */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedJobs.length === paginatedJobs.length && paginatedJobs.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedJobs(paginatedJobs.map(job => job.id));
                          } else {
                            setSelectedJobs([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortBy('customerName')}>
                      <div className="flex items-center gap-1">
                        <FiUser className="h-4 w-4" />
                        Customer
                        {sortBy === 'customerName' && (
                          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortBy('serviceType')}>
                      <div className="flex items-center gap-1">
                        <FiBriefcase className="h-4 w-4" />
                        Service
                        {sortBy === 'serviceType' && (
                          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortBy('status')}>
                      <div className="flex items-center gap-1">
                        <FiClock className="h-4 w-4" />
                        Status
                        {sortBy === 'status' && (
                          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortBy('assignedBubbler')}>
                      <div className="flex items-center gap-1">
                        <FiUser className="h-4 w-4" />
                        Assigned To
                        {sortBy === 'assignedBubbler' && (
                          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortBy('earningsEstimate')}>
                      <div className="flex items-center gap-1">
                        <FiDollarSign className="h-4 w-4" />
                        Earnings
                        {sortBy === 'earningsEstimate' && (
                          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <FiCheckCircle className="h-4 w-4" />
                        Payment
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <FiClock className="h-4 w-4" />
                        Processing Time
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <FiClock className="h-4 w-4" />
                        Expected Duration
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => setSortBy('created_at')}>
                      <div className="flex items-center gap-1">
                        <FiCalendar className="h-4 w-4" />
                        Created
                        {sortBy === 'created_at' && (
                          <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedJobs([...selectedJobs, job.id]);
                            } else {
                              setSelectedJobs(selectedJobs.filter(id => id !== job.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.customerName}</div>
                          <div className="text-sm text-gray-500">{job.customerAddress}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {job.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                          job.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          job.status === 'en_route' || job.status === 'en_route_to_pickup' || job.status === 'en_route_to_deliver' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'arrived' || job.status === 'arrived_at_pickup' || job.status === 'arrived_at_delivery' ? 'bg-purple-100 text-purple-800' :
                          job.status === 'denied' ? 'bg-red-100 text-red-800' :
                          job.status === 'reassign' ? 'bg-orange-100 text-orange-800' :
                          job.status === 'picked_up' || job.status === 'delivered' ? 'bg-indigo-100 text-indigo-800' :
                          job.status === 'in_wash' || job.status === 'in_dry' || job.status === 'folding_ironing' ? 'bg-cyan-100 text-cyan-800' :
                          job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.serviceType === 'Laundry Service' ? 
                            (() => {
                              const service = orders.flatMap(order => 
                                order.order_service?.filter(s => 
                                  s.job_assignments?.some(ja => ja.id === job.id)
                                ) || []
                              ).find(s => s);
                              const urgency = getLaundryUrgencyLevel(job, service);
                              const statusText = getLaundryStatusDescription(job, service);
                              
                              if (urgency && (urgency.level === 'critical' || urgency.level === 'overdue')) {
                                return (
                                  <span className={`${urgency.bgColor} ${urgency.color} px-2 py-1 rounded-full font-bold`}>
                                    ⚠️ {statusText}
                                  </span>
                                );
                              } else if (urgency && urgency.level === 'warning') {
                                return (
                                  <span className={`${urgency.bgColor} ${urgency.color} px-2 py-1 rounded-full`}>
                                    ⏰ {statusText}
                                  </span>
                                );
                              } else {
                                return statusText;
                              }
                            })() : 
                            job.status.replace(/_/g, ' ')
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.assignedBubbler}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(job.earningsEstimate || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const orderId = orders.find(order => 
                            order.order_service?.some(service => 
                              service.job_assignments?.some(ja => ja.id === job.id)
                            )
                          )?.id;
                          const isPaid = orderId ? isPaymentConfirmed(orderId) : false;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                              isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isPaid ? (
                                <>
                                  <FiCheckCircle className="h-3 w-3" />
                                  Paid
                                </>
                              ) : (
                                <>
                                  <FiAlertCircle className="h-3 w-3" />
                                  Pending
                                </>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {(() => {
                          const service = orders.flatMap(order => 
                            order.order_service?.filter(s => 
                              s.job_assignments?.some(ja => ja.id === job.id)
                            ) || []
                          ).find(s => s);
                          const processingTime = getLaundryProcessingTimeDisplay(service);
                          return processingTime || '-';
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {(() => {
                          const service = orders.flatMap(order => 
                            order.order_service?.filter(s => 
                              s.job_assignments?.some(ja => ja.id === job.id)
                            ) || []
                          ).find(s => s);
                          
                          // Only show expected duration for Mobile Car Wash and Home Cleaning
                          if (service && (service.service_type === 'Mobile Car Wash' || service.service_type === 'Home Cleaning')) {
                            const durationInfo = getExpectedJobDuration(service);
                            if (durationInfo && durationInfo.totalDuration > 0) {
                              return (
                                <span className="font-medium text-blue-700">
                                  {formatDuration(durationInfo.totalDuration)}
                                </span>
                              );
                            }
                          }
                          return '-';
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(() => {
                          const service = orders.flatMap(order => 
                            order.order_service?.filter(s => 
                              s.job_assignments?.some(ja => ja.id === job.id)
                            ) || []
                          ).find(s => s);
                          return service ? renderStatusActions(job, service) : <span className="text-gray-500 text-sm">No service found</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {/* Message Button - Always show for assigned jobs */}
                          {job.assignedBubbler && (
                            <button
                              onClick={() => setMessageModal({ open: true, assignment: job })}
                              className={`${
                                job.messageCount > 0 
                                  ? 'text-blue-600 hover:text-blue-900' 
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                              title={job.messageCount > 0 ? `${job.messageCount} messages` : 'Send message'}
                            >
                              <FiMessageCircle className="h-4 w-4" />
                              {job.messageCount > 0 && (
                                <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded-full">
                                  {job.messageCount}
                                </span>
                              )}
                            </button>
                          )}
                          {isAdmin && job.status === 'unassigned' && (
                            <button
                              onClick={() => {
                                const order = orders.find(o => 
                                  o.order_service?.some(s => 
                                    s.job_assignments?.some(a => a.id === job.id)
                                  )
                                );
                                if (order) {
                                  const service = order.order_service.find(s => 
                                    s.job_assignments?.some(a => a.id === job.id)
                                  );
                                  setAssignModal({ open: true, service, order });
                                }
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <FiPlus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * jobsPerPage) + 1} to {Math.min(currentPage * jobsPerPage, sortedJobs.length)} of {sortedJobs.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        // Card View (existing renderOrderServices)
        getVisibleOrders().map(order => (
          <div key={order.id} className="mb-8">
            {renderOrderServices(order)}
            </div>
        ))
      )}
      <AssignModal {...assignModal} onClose={() => setAssignModal({ open: false, service: null, order: null })} />
      
              {/* Message Thread Modal */}
        {messageModal.open && (
          <MessageThread
            jobAssignment={messageModal.assignment}
            onClose={() => {
              setMessageModal({ open: false, assignment: null });
              loadMessageCounts(); // Refresh message counts when modal closes
            }}
          />
      )}
    </div>
  );
};

export default Jobs;