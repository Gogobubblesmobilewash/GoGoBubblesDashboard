import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  FiBell, 
  FiX, 
  FiCheck, 
  FiAlertCircle, 
  FiInfo, 
  FiStar,
  FiDollarSign,
  FiBriefcase,
  FiMessageCircle,
  FiUser,
  FiClock,
  FiArrowRight,
  FiSettings
} from 'react-icons/fi';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const NotificationCenter = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const notificationRef = useRef(null);

  // Notification types and their configurations
  const NOTIFICATION_TYPES = {
    job_assigned: {
      label: 'Job Assignment',
      icon: FiBriefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      priority: 'high'
    },
    job_completed: {
      label: 'Job Completed',
      icon: FiCheck,
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
    message_received: {
      label: 'New Message',
      icon: FiMessageCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      priority: 'medium'
    },
    payment_received: {
      label: 'Payment Received',
      icon: FiDollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      priority: 'high'
    },
    rating_received: {
      label: 'New Rating',
      icon: FiStar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      priority: 'medium'
    },
    system_alert: {
      label: 'System Alert',
      icon: FiAlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      priority: 'critical'
    },
    info: {
      label: 'Information',
      icon: FiInfo,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      priority: 'low'
    }
  };

  // Load notifications from database
  const loadNotifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          activity:activity_id(
            id,
            event_type,
            description,
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
            user:user_id(id, name, email, role)
          )
        `)
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error } = await query;
      
      if (error) throw error;
      
      const notificationsList = Array.isArray(data) ? data : [];
      setNotifications(notificationsList);
      
      // Count unread notifications
      const unread = notificationsList.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    setMarkingRead(true);
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) {
        setMarkingRead(false);
        return;
      }

      await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', unreadNotifications.map(n => n.id));
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    } finally {
      setMarkingRead(false);
    }
  };

  // Navigate to related content
  const navigateToRelated = (notification) => {
    const activity = notification.activity;
    if (!activity) return;

    if (activity.job_assignment_id) {
      navigate(`/jobs?job=${activity.job_assignment_id}`);
    } else if (activity.event_type === 'message_sent') {
      navigate('/messages');
    } else if (activity.event_type === 'payment_processed') {
      navigate('/earnings');
    }
    
    setShowNotifications(false);
  };

  // Format notification message
  const formatNotificationMessage = (notification) => {
    const activity = notification.activity;
    if (!activity) return notification.message || 'Notification';

    switch (activity.event_type) {
      case 'job_assigned':
        return `You have been assigned a new job for ${activity.job_assignment?.order?.customer_name || 'a customer'}`;
      
      case 'job_completed':
        return `Job completed for ${activity.job_assignment?.order?.customer_name || 'a customer'}`;
      
      case 'job_cancelled':
        return `Job cancelled for ${activity.job_assignment?.order?.customer_name || 'a customer'}`;
      
      case 'message_sent':
        return `New message from ${activity.user?.name || 'someone'}`;
      
      case 'payment_processed':
        return `Payment processed for ${activity.job_assignment?.order?.customer_name || 'a customer'}`;
      
      case 'rating_received':
        return `New rating received from ${activity.job_assignment?.order?.customer_name || 'a customer'}`;
      
      default:
        return activity.description || 'New notification';
    }
  };

  // Get notification icon and styling
  const getNotificationConfig = (notification) => {
    const activity = notification.activity;
    if (!activity) return NOTIFICATION_TYPES.info;

    switch (activity.event_type) {
      case 'job_assigned':
      case 'job_started':
      case 'job_completed':
        return NOTIFICATION_TYPES.job_assigned;
      
      case 'job_cancelled':
      case 'job_declined':
        return NOTIFICATION_TYPES.job_cancelled;
      
      case 'message_sent':
        return NOTIFICATION_TYPES.message_received;
      
      case 'payment_processed':
      case 'payout_sent':
        return NOTIFICATION_TYPES.payment_received;
      
      case 'rating_received':
        return NOTIFICATION_TYPES.rating_received;
      
      case 'security_alert':
      case 'system_maintenance':
        return NOTIFICATION_TYPES.system_alert;
      
      default:
        return NOTIFICATION_TYPES.info;
    }
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load notifications on mount and set up real-time subscription
  useEffect(() => {
    loadNotifications();
    
    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user?.id}`
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const config = getNotificationConfig(notifications[0]);

  return (
    <div className="relative" ref={notificationRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <FiBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markingRead}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {markingRead ? 'Marking...' : 'Mark all read'}
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiBell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => {
                  const notificationConfig = getNotificationConfig(notification);
                  const Icon = notificationConfig.icon;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id);
                        navigateToRelated(notification);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${notificationConfig.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${notificationConfig.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notificationConfig.label}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatNotificationMessage(notification)}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500">
                                  {dayjs(notification.created_at).fromNow()}
                                </span>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowNotifications(false);
                navigate('/activity');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiSettings className="h-4 w-4" />
              View All Activity
              <FiArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter; 