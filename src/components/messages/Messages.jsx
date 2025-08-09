import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FiSearch, 
  FiFilter, 
  FiMessageCircle, 
  FiUser, 
  FiClock, 
  FiCheck,
  FiCheckCircle,
  FiPaperclip,
  FiMoreHorizontal,
  FiRefreshCw
} from 'react-icons/fi';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import MessageThread from './MessageThread';
import toast from 'react-hot-toast';

const Messages = () => {
  const { user, isAdmin } = useAuth();
  const [messageThreads, setMessageThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, unread, read
  const [sortBy, setSortBy] = useState('latest'); // latest, oldest, unread
  const [refreshing, setRefreshing] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeMessage, setComposeMessage] = useState('');
  const [recipientGroup, setRecipientGroup] = useState('admin');
  const [sending, setSending] = useState(false);

  // Load all message threads
  const loadMessageThreads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          job_assignment:job_assignments(
            id,
            status,
            order:orders(
              id,
              customer_name,
              address
            )
          ),
          sender:bubblers(
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // RLS will automatically filter messages based on user role
      // No need to manually filter - the RLS policy handles this

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Group messages by job assignment
      const threads = groupMessagesByJob(data || []);
      setMessageThreads(threads);
    } catch (error) {
      console.error('Error loading message threads:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Group messages by job assignment
  const groupMessagesByJob = (messages) => {
    const threads = {};
    
    messages.forEach(message => {
      const jobId = message.job_assignment_id;
      if (!threads[jobId]) {
        threads[jobId] = {
          jobAssignment: message.job_assignment,
          messages: [],
          unreadCount: 0,
          latestMessage: null
        };
      }
      
      threads[jobId].messages.push(message);
      
      // Count unread messages
      if (!message.is_read && message.recipient_group && ['admin', 'support'].includes(message.recipient_group)) {
        threads[jobId].unreadCount++;
      }
      
      // Track latest message
      if (!threads[jobId].latestMessage || 
          new Date(message.created_at) > new Date(threads[jobId].latestMessage.created_at)) {
        threads[jobId].latestMessage = message;
      }
    });
    
    return Object.values(threads);
  };

  // Filter and sort threads
  const getFilteredThreads = () => {
    let filtered = messageThreads;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(thread => {
        const customerName = thread.jobAssignment?.order?.customer_name || '';
        const serviceType = thread.jobAssignment?.service_type || '';
        const bubblerName = thread.jobAssignment?.bubbler?.name || '';
        const latestMessageText = thread.latestMessage?.message || '';
        
        return (
          customerName.toLowerCase().includes(searchLower) ||
          serviceType.toLowerCase().includes(searchLower) ||
          bubblerName.toLowerCase().includes(searchLower) ||
          latestMessageText.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter === 'unread') {
      filtered = filtered.filter(thread => thread.unreadCount > 0);
    } else if (statusFilter === 'read') {
      filtered = filtered.filter(thread => thread.unreadCount === 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.latestMessage?.created_at || 0) - new Date(a.latestMessage?.created_at || 0);
        case 'oldest':
          return new Date(a.latestMessage?.created_at || 0) - new Date(b.latestMessage?.created_at || 0);
        case 'unread':
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
          return new Date(b.latestMessage?.created_at || 0) - new Date(a.latestMessage?.created_at || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Send a new message
  const sendMessage = async () => {
    if (!composeMessage.trim()) return;
    
    setSending(true);
    try {
      // Get the current bubbler's ID
      const { data: bubblerData, error: bubblerError } = await supabase
        .from('bubblers')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (bubblerError) throw bubblerError;
      
      // Insert the message
      const { error } = await supabase
        .from('messages')
        .insert({
          bubbler_id: bubblerData.id,
          recipient_group: recipientGroup,
          content: composeMessage.trim(),
          is_read: false
        });
      
      if (error) throw error;
      
      // Reset form and close modal
      setComposeMessage('');
      setRecipientGroup('admin');
      setShowComposeModal(false);
      
      // Reload messages
      await loadMessageThreads();
      
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  // Refresh messages
  const refreshMessages = async () => {
    setRefreshing(true);
    await loadMessageThreads();
    setRefreshing(false);
  };

  // Load messages on mount and set up real-time subscription
  useEffect(() => {
    loadMessageThreads();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadMessageThreads();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, isAdmin]);

  const filteredThreads = getFilteredThreads();

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
        {/* Message Threads List */}
        <div className="lg:w-1/3 bg-white rounded-lg border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowComposeModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Compose
                </button>
                <button
                  onClick={refreshMessages}
                  disabled={refreshing}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Messages</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="unread">Unread First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiMessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No messages found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.jobAssignment?.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedThread?.jobAssignment?.id === thread.jobAssignment?.id
                        ? 'bg-blue-50 border-r-2 border-blue-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {thread.jobAssignment?.order?.customer_name || 'Unknown Customer'}
                          </h3>
                          {thread.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-1">
                          {thread.jobAssignment?.service_type || 'Unknown Service'}
                        </p>
                        
                        {thread.latestMessage && (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-600 truncate flex-1">
                              {thread.latestMessage.message || 'No message content'}
                            </p>
                            {thread.latestMessage.attachments && thread.latestMessage.attachments.length > 0 && (
                              <FiPaperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {thread.latestMessage ? 
                              new Date(thread.latestMessage.created_at).toLocaleDateString() : 
                              'No messages'
                            }
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {thread.latestMessage && (
                              <>
                                {thread.latestMessage.from_user_id === user?.id ? (
                                  thread.latestMessage.read ? (
                                    <FiCheckCircle className="h-3 w-3 text-blue-600" />
                                  ) : (
                                    <FiCheck className="h-3 w-3 text-gray-400" />
                                  )
                                ) : (
                                  <FiUser className="h-3 w-3 text-gray-400" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Thread View */}
        <div className="lg:flex-1 bg-white rounded-lg border border-gray-200">
          {selectedThread ? (
            <MessageThread
              jobAssignment={selectedThread.jobAssignment}
              onClose={() => setSelectedThread(null)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FiMessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a message thread from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Compose Message</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To:
                </label>
                <select
                  value={recipientGroup}
                  onChange={(e) => setRecipientGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="support">Support</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message:
                </label>
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowComposeModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={sending || !composeMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages; 