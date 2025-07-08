import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiFilter, FiPlus, FiEdit, FiTrash2, FiCheck, FiX, FiCamera, FiUpload, FiDownload, FiMessageCircle, FiCpu } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import useStore from '../../store/useStore';
import { supabase } from '../../services/api';
import { 
  JOB_STATUSES, 
  SERVICE_TYPES, 
  TIERS, 
  ADDONS, 
  BAG_TYPES,
  getPhotoRequirements, 
  getPerks, 
  getPayoutRules
} from '../../constants';
import QRScanner from './QRScanner';
import Modal from '../shared/Modal';
import MessageThread from './MessageThread';
import { parseServicesForSplitting, fetchBubblersWithTravelPrefs } from '../../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../../store/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const ACCEPTANCE_WINDOWS = {
  urgent: 15,
  standard: 30,
};

const Jobs = () => {
  const { user, isAdmin } = useAuth();
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

  // Handle job status updates
  const updateJobStatus = async (assignmentId, newStatus) => {
    try {
      const { error } = await supabase
        .from('job_assignments')
        .update({ 
          status: newStatus,
          ...(newStatus === 'accepted' && { accepted_at: new Date().toISOString() }),
          ...(newStatus === 'in-progress' && { started_at: new Date().toISOString() }),
          ...(newStatus === 'completed' && { completed_at: new Date().toISOString() })
        })
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      toast.success(`Job ${newStatus.replace('-', ' ')}!`);
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
    let filteredOrders = orders;
    
    // For bubblers: only show orders/services assigned to them
    if (!isAdmin) {
      filteredOrders = orders
        .map(order => {
          // Filter order_service to only those assigned to this bubbler
          const filteredServices = (order.order_service || []).filter(service => {
            if (!service.job_assignments || service.job_assignments.length === 0) return false;
            // Find assignment for this bubbler
            return service.job_assignments.some(a => a.bubbler_id === user?.id);
          });
          if (filteredServices.length === 0) return null;
          return { ...order, order_service: filteredServices };
        })
        .filter(Boolean);
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
          const assignment = isAdmin
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

  // Fetch all orders with their related services
  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_service(*, order_cleaning_details(*), order_laundry_bags(*), order_vehicles(*), job_assignments(*))`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(Array.isArray(data) ? data : []);
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
    if (window.confirm('Are you sure you want to manually override the QR code validation? This should only be used in rare cases (e.g., label worn off).')) {
      try {
        const { error } = await supabase
          .from('job_assignments')
          .update({ 
            manual_override: true,
            override_timestamp: new Date().toISOString(),
            override_by: user?.email || 'Admin'
          })
          .eq('id', assignmentId);
        
        if (error) throw error;
        
        toast.success('Manual override applied successfully');
        loadOrders(); // Refresh to show updated status
      } catch (error) {
        console.error('Error applying manual override:', error);
        toast.error('Failed to apply manual override');
      }
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
    // Filter eligible bubblers
    const eligibleBubblers = bubblers.filter(bubbler => {
      if (!bubbler.is_active) return false;
      const travelTime = calculateTravelTime(bubbler, order.address);
      return travelTime <= (bubbler.preferred_travel_minutes || 30);
    });
    return (
      <Modal title="Assign Job to Bubbler" onClose={onClose} size="lg">
        <div className="mb-4">
          <div className="font-semibold mb-2">Job: {service.service_type} for {order.customer_name}</div>
          <div className="text-sm text-gray-600 mb-2">{order.address}</div>
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

  if (loading) {
    return <div className="p-6">Loading orders...</div>;
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Order Management</h1>
      
      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
            <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
              placeholder="Search by customer name, address, or service type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
        </div>
        
        {/* Status Filter */}
        <div className="sm:w-48">
            <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="en_route">En Route</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
            <option value="declined">Declined</option>
            </select>
        </div>
      </div>

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
      ) : getVisibleOrders().length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || statusFilter !== 'all' ? 'No jobs match your filters.' : 'No jobs found.'}
      </div>
      ) : (
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