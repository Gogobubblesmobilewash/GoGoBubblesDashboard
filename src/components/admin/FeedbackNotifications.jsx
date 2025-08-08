import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api';
import { FiBell, FiCheckCircle, FiClock, FiAlertCircle, FiMail } from 'react-icons/fi';

export default function FeedbackNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Set up real-time subscription for new feedback notifications
    const subscription = supabase
      .channel('feedback_notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'feedback_notifications'
        }, 
        (payload) => {
          console.log('New feedback notification:', payload);
          handleNewNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Get recent feedback notifications
      const { data, error } = await supabase
        .from('feedback_notifications')
        .select('*')
        .eq('notification_sent', false)
        .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Transform into notifications
      const notificationData = data.map(notification => ({
        id: notification.id,
        type: 'job_completed',
        title: `Service Completed`,
        message: `${notification.customer_name} - ${notification.service_type}`,
        bubbler: notification.bubbler_name,
        customer: notification.customer_name,
        service: notification.service_type,
        orderId: notification.order_id,
        jobId: notification.job_assignment_id,
        bubblerId: notification.bubbler_id,
        completedAt: notification.completed_at,
        read: notification.notification_sent,
        priority: 'medium'
      }));

      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (notificationData) => {
    // Add new notification for completed job
    const newNotification = {
      id: notificationData.id,
      type: 'job_completed',
      title: 'Service Completed',
      message: `${notificationData.customer_name} - ${notificationData.service_type}`,
      bubbler: notificationData.bubbler_name,
      customer: notificationData.customer_name,
      service: notificationData.service_type,
      orderId: notificationData.order_id,
      jobId: notificationData.job_assignment_id,
      bubblerId: notificationData.bubbler_id,
      completedAt: notificationData.completed_at,
      read: false,
      priority: 'high'
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = async (notificationId) => {
    try {
      // Mark notification as sent in database
      const { error } = await supabase
        .rpc('mark_feedback_notification_sent', { notification_id: notificationId });
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const generateFeedbackLink = (notification) => {
    const baseUrl = 'https://gogobubbles.com/feedback.html';
    const params = new URLSearchParams({
      order_id: notification.orderId,
      job_id: notification.jobId,
      bubbler_id: notification.bubblerId,
      serviceType: notification.service
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const copyFeedbackLink = async (notification) => {
    const link = generateFeedbackLink(notification);
    try {
      await navigator.clipboard.writeText(link);
      alert('Feedback link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <FiAlertCircle className="text-red-500" />;
      case 'medium':
        return <FiClock className="text-yellow-500" />;
      default:
        return <FiCheckCircle className="text-green-500" />;
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <FiBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Feedback Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No completed services in the last 24 hours
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getPriorityIcon(notification.priority)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {notification.bubbler && (
                          <p className="text-xs text-gray-500 mt-1">
                            Bubbler: {notification.bubbler}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {getTimeAgo(notification.completedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyFeedbackLink(notification)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Copy feedback link"
                      >
                        <FiMail className="h-4 w-4" />
                      </button>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Mark as read"
                        >
                          <FiCheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        copyFeedbackLink(notification);
                        markAsRead(notification.id);
                      }}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => window.open(`/manual-link-generator?order=${notification.orderId}`, '_blank')}
                      className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                    >
                      Generate Link
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => window.open('/manual-link-generator', '_blank')}
              className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All in Manual Link Generator →
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 