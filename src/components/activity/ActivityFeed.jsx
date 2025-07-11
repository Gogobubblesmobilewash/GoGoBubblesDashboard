import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FiSearch, 
  FiFilter, 
  FiRefreshCw, 
  FiCalendar,
  FiUser,
  FiBriefcase,
  FiDollarSign,
  FiMessageCircle,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiMapPin,
  FiStar,
  FiFileText,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const ActivityFeed = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    eventType: 'all',
    userType: 'all',
    dateRange: 'all',
    priority: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('feed'); // 'feed' or 'timeline'
  const [expandedActivities, setExpandedActivities] = useState(new Set());

  // Activity event types and their configurations
  const EVENT_TYPES = {
    job_assigned: {
      label: 'Job Assigned',
      icon: FiBriefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      priority: 'high'
    },
    job_completed: {
      label: 'Job Completed',
      icon: FiCheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      priority: 'high'
    },
    job_cancelled: {
      label: 'Job Cancelled',
      icon: FiAlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      priority: 'high'
    },
    message_sent: {
      label: 'Message Sent',
      icon: FiMessageCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      priority: 'medium'
    },
    payment_processed: {
      label: 'Payment Processed',
      icon: FiDollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      priority: 'high'
    },
    user_registered: {
      label: 'User Registered',
      icon: FiUser,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      priority: 'medium'
    },
    rating_received: {
      label: 'Rating Received',
      icon: FiStar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      priority: 'medium'
    },
    equipment_updated: {
      label: 'Equipment Updated',
      icon: FiBriefcase,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      priority: 'low'
    },
    order_created: {
      label: 'Order Created',
      icon: FiFileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      priority: 'high'
    }
  };

  // Load activities from database
  const loadActivities = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_log')
        .select(`
          *,
          user:user_id(id, name, email, role),
          job_assignment:job_assignment_id(
            id,
            status,
            order:orders(
              id,
              customer_name,
              address
            ),
            bubbler:bubblers(
              id,
              name,
              email
            )
          ),
          related_user:related_user_id(id, name, email, role)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply user-based filtering
      if (!isAdmin) {
        // Bubblers only see their own activities and related job activities
        query = query.or(`user_id.eq.${user?.id},job_assignment.bubbler_id.eq.${user?.id}`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  // Refresh activities
  const refreshActivities = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
    toast.success('Activities refreshed');
  };

  // Filter activities based on search and filters
  const getFilteredActivities = () => {
    let filtered = activities;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => {
        const eventType = EVENT_TYPES[activity.event_type]?.label || '';
        const description = activity.description || '';
        const userName = activity.user?.name || '';
        const customerName = activity.job_assignment?.order?.customer_name || '';
        const bubblerName = activity.job_assignment?.bubbler?.name || '';
        
        return (
          eventType.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
          userName.toLowerCase().includes(searchLower) ||
          customerName.toLowerCase().includes(searchLower) ||
          bubblerName.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply event type filter
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(activity => activity.event_type === filters.eventType);
    }

    // Apply user type filter
    if (filters.userType !== 'all') {
      filtered = filtered.filter(activity => {
        if (filters.userType === 'admin') {
          return activity.user?.role === 'admin';
        } else if (filters.userType === 'bubbler') {
          return activity.user?.role === 'bubbler';
        } else if (filters.userType === 'customer') {
          return activity.user?.role === 'customer';
        }
        return true;
      });
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = dayjs();
      filtered = filtered.filter(activity => {
        const activityDate = dayjs(activity.created_at);
        switch (filters.dateRange) {
          case 'today':
            return activityDate.isSame(now, 'day');
          case 'week':
            return activityDate.isAfter(now.subtract(7, 'day'));
          case 'month':
            return activityDate.isAfter(now.subtract(30, 'day'));
          default:
            return true;
        }
      });
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(activity => {
        const priority = EVENT_TYPES[activity.event_type]?.priority || 'low';
        return priority === filters.priority;
      });
    }

    return filtered;
  };

  // Toggle activity expansion
  const toggleActivityExpansion = (activityId) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  // Navigate to related content
  const navigateToRelated = (activity) => {
    if (activity.job_assignment_id) {
      navigate(`/jobs?job=${activity.job_assignment_id}`);
    } else if (activity.user_id) {
      if (isAdmin) {
        navigate(`/bubblers?user=${activity.user_id}`);
      }
    }
  };

  // Format activity description
  const formatActivityDescription = (activity) => {
    const eventConfig = EVENT_TYPES[activity.event_type];
    if (!eventConfig) return activity.description || 'Unknown activity';

    switch (activity.event_type) {
      case 'job_assigned':
        return `${activity.job_assignment?.bubbler?.name || 'Unknown Bubbler'} was assigned to ${activity.job_assignment?.order?.customer_name || 'Unknown Customer'}'s ${activity.job_assignment?.service_type || 'job'}`;
      
      case 'job_completed':
        return `${activity.job_assignment?.bubbler?.name || 'Unknown Bubbler'} completed job for ${activity.job_assignment?.order?.customer_name || 'Unknown Customer'}`;
      
      case 'message_sent':
        return `${activity.user?.name || 'Unknown User'} sent a message about job #${activity.job_assignment_id}`;
      
      case 'payment_processed':
        return `Payment of $${activity.metadata?.amount || '0'} processed for ${activity.job_assignment?.order?.customer_name || 'Unknown Customer'}`;
      
      case 'rating_received':
        return `${activity.job_assignment?.order?.customer_name || 'Unknown Customer'} gave ${activity.metadata?.rating || '5'} stars to ${activity.job_assignment?.bubbler?.name || 'Unknown Bubbler'}`;
      
      default:
        return activity.description || 'Activity occurred';
    }
  };

  // Load activities on mount and set up real-time subscription
  useEffect(() => {
    loadActivities();
    
    // Set up real-time subscription for new activities
    const subscription = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log'
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, isAdmin]);

  const filteredActivities = getFilteredActivities();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time updates across the platform
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('feed')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'feed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'timeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Timeline
            </button>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={refreshActivities}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiRefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiFilter className="h-4 w-4" />
            Filters
            {Object.values(filters).some(f => f !== 'all') && (
              <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {Object.values(filters).filter(f => f !== 'all').length}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Event Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={filters.eventType}
                  onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Events</option>
                  {Object.entries(EVENT_TYPES).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* User Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type
                </label>
                <select
                  value={filters.userType}
                  onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="admin">Admins</option>
                  <option value="bubbler">Bubblers</option>
                  <option value="customer">Customers</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiClock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No activities found</p>
            <p className="text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredActivities.map((activity) => {
              const eventConfig = EVENT_TYPES[activity.event_type];
              const Icon = eventConfig?.icon || FiClock;
              const isExpanded = expandedActivities.has(activity.id);
              
              return (
                <div
                  key={activity.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    isExpanded ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Event Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${eventConfig?.bgColor || 'bg-gray-100'} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${eventConfig?.color || 'text-gray-600'}`} />
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {eventConfig?.label || 'Unknown Activity'}
                            </h3>
                            {eventConfig?.priority === 'high' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                High Priority
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {formatActivityDescription(activity)}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <FiUser className="h-3 w-3" />
                              {activity.user?.name || 'Unknown User'}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiClock className="h-3 w-3" />
                              {dayjs(activity.created_at).fromNow()}
                            </span>
                            {activity.job_assignment?.order?.address && (
                              <span className="flex items-center gap-1">
                                <FiMapPin className="h-3 w-3" />
                                {activity.job_assignment.order.address}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleActivityExpansion(activity.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {isExpanded ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                          </button>
                          
                          {(activity.job_assignment_id || activity.user_id) && (
                            <button
                              onClick={() => navigateToRelated(activity)}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <FiArrowRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                              <div className="space-y-1 text-gray-600">
                                <div><strong>Event ID:</strong> {activity.id}</div>
                                <div><strong>Event Type:</strong> {activity.event_type}</div>
                                <div><strong>Created:</strong> {dayjs(activity.created_at).format('MMM D, YYYY h:mm A')}</div>
                                {activity.metadata && (
                                  <div><strong>Metadata:</strong> {JSON.stringify(activity.metadata, null, 2)}</div>
                                )}
                              </div>
                            </div>
                            
                            {(activity.job_assignment || activity.user) && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Related Information</h4>
                                <div className="space-y-1 text-gray-600">
                                  {activity.job_assignment && (
                                    <>
                                      <div><strong>Job ID:</strong> {activity.job_assignment.id}</div>
                                      <div><strong>Status:</strong> {activity.job_assignment.status}</div>
                                      <div><strong>Customer:</strong> {activity.job_assignment.order?.customer_name}</div>
                                      <div><strong>Bubbler:</strong> {activity.job_assignment.bubbler?.name}</div>
                                    </>
                                  )}
                                  {activity.user && (
                                    <>
                                      <div><strong>User:</strong> {activity.user.name}</div>
                                      <div><strong>Email:</strong> {activity.user.email}</div>
                                      <div><strong>Role:</strong> {activity.user.role}</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed; 