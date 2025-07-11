import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  FiSend, 
  FiPaperclip, 
  FiX, 
  FiDownload,
  FiImage,
  FiFile,
  FiUser,
  FiClock,
  FiCheck,
  FiCheckCheck
} from 'react-icons/fi';
import { supabase } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import toast from 'react-hot-toast';

const MessageThread = ({ jobAssignment, onClose }) => {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom when new messages arrive
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
        .select(`
          *,
          from_user:from_user_id(id, name, email),
          to_user:to_user_id(id, name, email)
        `)
        .eq('job_assignment_id', jobAssignment.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      setMessages(Array.isArray(data) ? data : []);
      
      // Mark messages as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(msg => 
          !msg.read && msg.to_user_id === user?.id
        );
        
        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true, read_at: new Date().toISOString() })
            .in('id', unreadMessages.map(msg => msg.id));
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!jobAssignment?.id) return;
    
    setSending(true);
    try {
      // Upload attachments first
      const uploadedAttachments = [];
      if (attachments.length > 0) {
        setUploading(true);
        for (const file of attachments) {
          const filePath = `message_attachments/${jobAssignment.id}/${Date.now()}_${file.name}`;
          const { data, error } = await supabase.storage
            .from('message-files')
            .upload(filePath, file);
          
          if (error) throw error;
          
          const { publicURL } = supabase.storage
            .from('message-files')
            .getPublicUrl(filePath).data;
          
          uploadedAttachments.push({
            name: file.name,
            url: publicURL,
            type: file.type,
            size: file.size
          });
        }
        setUploading(false);
      }

      // Create message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          job_assignment_id: jobAssignment.id,
          from_user_id: user?.id,
          to_user_id: isAdmin ? jobAssignment.bubbler_id : jobAssignment.order?.user_id,
          message: newMessage.trim(),
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setNewMessage('');
      setAttachments([]);
      await loadMessages(); // Reload to get the new message
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle file attachment
  const handleFileAttach = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Max size is 10MB.`);
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    event.target.value = ''; // Reset input
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <FiImage className="h-4 w-4" />;
    return <FiFile className="h-4 w-4" />;
  };

  // Load messages on mount and set up real-time subscription
  useEffect(() => {
    loadMessages();
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel(`messages-${jobAssignment?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_assignment_id=eq.${jobAssignment?.id}`
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [jobAssignment?.id]);

  if (!jobAssignment) return null;

  const isOwnMessage = (message) => message.from_user_id === user?.id;
  const otherUserName = isAdmin 
    ? jobAssignment.assignedBubbler || 'Bubbler'
    : 'Admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Messages - {jobAssignment.customerName}
            </h3>
            <p className="text-sm text-gray-600">
              {jobAssignment.serviceType} • {otherUserName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiMessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage(message)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs opacity-75">
                      {message.from_user?.name || (isOwnMessage(message) ? 'You' : otherUserName)}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs opacity-75">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                      {isOwnMessage(message) && (
                        <span className="text-xs">
                          {message.read ? (
                            <FiCheckCheck className="h-3 w-3" />
                          ) : (
                            <FiCheck className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  {message.message && (
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  )}

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 p-2 rounded ${
                            isOwnMessage(message) ? 'bg-blue-700' : 'bg-gray-200'
                          }`}
                        >
                          {getFileIcon(attachment.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">{attachment.name}</p>
                            <p className="text-xs opacity-75">
                              {formatFileSize(attachment.size)}
                            </p>
                          </div>
                          <a
                            href={attachment.url}
                            download={attachment.name}
                            className="text-xs hover:underline"
                          >
                            <FiDownload className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-white rounded border"
                  >
                    {getFileIcon(file.type)}
                    <span className="text-xs truncate max-w-32">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* File Attachment Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Attach file"
              >
                <FiPaperclip className="h-5 w-5" />
              </button>
              
              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={sending || uploading || (!newMessage.trim() && attachments.length === 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending || uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FiSend className="h-4 w-4" />
                )}
                Send
              </button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileAttach}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      </div>
    </div>
  );
};

MessageThread.propTypes = {
  jobAssignment: PropTypes.object,
  onClose: PropTypes.func.isRequired
};

export default MessageThread; 