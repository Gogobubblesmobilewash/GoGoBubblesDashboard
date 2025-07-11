import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FiMessageCircle, 
  FiBell, 
  FiX, 
  FiUser, 
  FiClock,
  FiArrowRight
} from 'react-icons/fi';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';

const MessageNotifications = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load unread message count and recent messages
  const loadMessageNotifications = async () => {
    setLoading(true);
    try {
      // Get unread count
      const { data: unreadData, error: unreadError } = await supabase
        .from('messages')
        .select('id')
        .eq('to_user_id', user?.id)
        .eq('read', false);

      if (unreadError) throw unreadError;
      setUnreadCount(Array.isArray(unreadData) ? unreadData.length : 0);

      // Get recent messages (last 5)
      const { data: recentData, error: recentError } = await supabase
        .from('messages')
        .select(`
          *,
          job_assignment:job_assignments(
            id,
            order:orders(
              customer_name
            ),
            service_type
          ),
          from_user:from_user_id(
            name,
            email
          )
        `)
        .eq('to_user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentMessages(Array.isArray(recentData) ? recentData : []);
    } catch (error) {
      console.error('Error loading message notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      await supabase
        .from('messages')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', messageId);
      
      // Refresh notifications
      loadMessageNotifications();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Navigate to messages page
  const goToMessages = () => {
    setShowNotifications(false);
    navigate('/messages');
  };

  // Load notifications on mount and set up real-time subscription
  useEffect(() => {
    loadMessageNotifications();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `to_user_id=eq.${user?.id}`
        },
        () => {
          loadMessageNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Format time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Truncate message text
  const truncateMessage = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="relative">
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
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {unreadCount} unread
                </span>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiMessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No messages</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !message.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      markAsRead(message.id);
                      navigate(`/messages?job=${message.job_assignment_id}`);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiUser className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {message.from_user?.name || 'Unknown User'}
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">
                              {getTimeAgo(message.created_at)}
                            </span>
                            {!message.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-1">
                          {message.job_assignment?.order?.customer_name || 'Unknown Customer'} • {message.job_assignment?.service_type || 'Unknown Service'}
                        </p>
                        
                        <p className="text-sm text-gray-700">
                          {truncateMessage(message.message)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={goToMessages}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiMessageCircle className="h-4 w-4" />
              View All Messages
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

export default MessageNotifications; 