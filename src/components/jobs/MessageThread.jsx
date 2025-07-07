import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiMessageCircle } from 'react-icons/fi';
import { supabase } from '../../services/api';
import useStore from '../../store/useStore';
import dayjs from 'dayjs';

const MessageThread = ({ jobAssignment, onClose }) => {
  const { user, isAdmin } = useStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages for this job assignment
  const loadMessages = async () => {
    if (!jobAssignment?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('job_assignment_id', jobAssignment.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!jobAssignment?.id) return;

    const subscription = supabase
      .channel(`messages-${jobAssignment.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_assignment_id=eq.${jobAssignment.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [jobAssignment?.id]);

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !jobAssignment?.id) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          job_assignment_id: jobAssignment.id,
          sender_id: user.id,
          sender_type: isAdmin ? 'admin' : 'bubbler',
          message: newMessage.trim(),
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setNewMessage('');
      // No need to reload messages since subscription will handle it
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    loadMessages();
  }, [jobAssignment?.id]);

  if (!jobAssignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Messages - Job #{jobAssignment.id}
            </h3>
            <p className="text-sm text-gray-600">
              {jobAssignment.status} • {dayjs(jobAssignment.assigned_at).format('MMM D, YYYY')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiMessageCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === user.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm">{message.message}</div>
                    <div
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {dayjs(message.created_at).format('MMM D, h:mm A')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="2"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageThread; 