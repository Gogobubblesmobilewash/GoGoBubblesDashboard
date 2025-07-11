import { supabase } from './api';

// Activity event types
export const ACTIVITY_EVENTS = {
  // Job-related events
  JOB_ASSIGNED: 'job_assigned',
  JOB_ACCEPTED: 'job_accepted',
  JOB_DECLINED: 'job_declined',
  JOB_STARTED: 'job_started',
  JOB_COMPLETED: 'job_completed',
  JOB_CANCELLED: 'job_cancelled',
  JOB_EXPIRED: 'job_expired',
  JOB_REASSIGNED: 'job_reassigned',
  
  // Message events
  MESSAGE_SENT: 'message_sent',
  MESSAGE_READ: 'message_read',
  
  // Payment events
  PAYMENT_PROCESSED: 'payment_processed',
  PAYMENT_FAILED: 'payment_failed',
  PAYOUT_SENT: 'payout_sent',
  
  // User events
  USER_REGISTERED: 'user_registered',
  USER_UPDATED: 'user_updated',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  
  // Rating events
  RATING_RECEIVED: 'rating_received',
  RATING_UPDATED: 'rating_updated',
  
  // Equipment events
  EQUIPMENT_ADDED: 'equipment_added',
  EQUIPMENT_UPDATED: 'equipment_updated',
  EQUIPMENT_REMOVED: 'equipment_removed',
  
  // Order events
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_CANCELLED: 'order_cancelled',
  
  // System events
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SECURITY_ALERT: 'security_alert',
  PERFORMANCE_ALERT: 'performance_alert'
};

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class ActivityLogger {
  constructor() {
    this.userId = null;
    this.isAdmin = false;
  }

  // Initialize the logger with user context
  init(userId, isAdmin = false) {
    this.userId = userId;
    this.isAdmin = isAdmin;
  }

  // Log an activity
  async log(eventType, options = {}) {
    if (!this.userId) {
      console.warn('ActivityLogger not initialized with user ID');
      return null;
    }

    const {
      description,
      jobAssignmentId = null,
      relatedUserId = null,
      metadata = {},
      priority = 'medium',
      ipAddress = null,
      userAgent = null
    } = options;

    try {
      const { data, error } = await supabase
        .from('activity_log')
        .insert({
          event_type: eventType,
          user_id: this.userId,
          job_assignment_id: jobAssignmentId,
          related_user_id: relatedUserId,
          description,
          metadata,
          priority,
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging activity:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  }

  // Job-related activity methods
  async logJobAssigned(jobAssignmentId, bubblerId, customerName, serviceType) {
    return this.log(ACTIVITY_EVENTS.JOB_ASSIGNED, {
      description: `Job assigned to ${bubblerId} for ${customerName}'s ${serviceType}`,
      jobAssignmentId,
      relatedUserId: bubblerId,
      metadata: {
        customerName,
        serviceType,
        action: 'assigned'
      },
      priority: PRIORITY_LEVELS.HIGH
    });
  }

  async logJobAccepted(jobAssignmentId, bubblerId, customerName) {
    return this.log(ACTIVITY_EVENTS.JOB_ACCEPTED, {
      description: `Job accepted by ${bubblerId} for ${customerName}`,
      jobAssignmentId,
      relatedUserId: bubblerId,
      metadata: {
        customerName,
        action: 'accepted'
      },
      priority: PRIORITY_LEVELS.HIGH
    });
  }

  async logJobDeclined(jobAssignmentId, bubblerId, customerName, reason = null) {
    return this.log(ACTIVITY_EVENTS.JOB_DECLINED, {
      description: `Job declined by ${bubblerId} for ${customerName}`,
      jobAssignmentId,
      relatedUserId: bubblerId,
      metadata: {
        customerName,
        reason,
        action: 'declined'
      },
      priority: PRIORITY_LEVELS.HIGH
    });
  }

  async logJobStarted(jobAssignmentId, bubblerId, customerName) {
    return this.log(ACTIVITY_EVENTS.JOB_STARTED, {
      description: `Job started by ${bubblerId} for ${customerName}`,
      jobAssignmentId,
      relatedUserId: bubblerId,
      metadata: {
        customerName,
        action: 'started'
      },
      priority: PRIORITY_LEVELS.HIGH
    });
  }

  async logJobCompleted(jobAssignmentId, bubblerId, customerName, rating = null) {
    return this.log(ACTIVITY_EVENTS.JOB_COMPLETED, {
      description: `Job completed by ${bubblerId} for ${customerName}`,
      jobAssignmentId,
      relatedUserId: bubblerId,
      metadata: {
        customerName,
        rating,
        action: 'completed'
      },
      priority: PRIORITY_LEVELS.HIGH
    });
  }

  async logJobCancelled(jobAssignmentId, customerName, reason = null) {
    return this.log(ACTIVITY_EVENTS.JOB_CANCELLED, {
      description: `Job cancelled for ${customerName}`,
      jobAssignmentId,
      metadata: {
        customerName,
        reason,
        action: 'cancelled'
      },
      priority: PRIORITY_LEVELS.HIGH
    });
  }

  // Message-related activity methods
  async logMessageSent(jobAssignmentId, fromUserId, toUserId, messageLength) {
    return this.log(ACTIVITY_EVENTS.MESSAGE_SENT, {
      description: `Message sent from ${fromUserId} to ${toUserId}`,
      jobAssignmentId,
      relatedUserId: toUserId,
      metadata: {
        fromUserId,
        toUserId,
        messageLength,
        action: 'sent'
      },
      priority: PRIORITY_LEVELS.MEDIUM
    });
  }

  async logMessageRead(jobAssignmentId, messageId, readerId) {
    return this.log(ACTIVITY_EVENTS.MESSAGE_READ, {
      description: `Message read by ${readerId}`,
      jobAssignmentId,
      relatedUserId: readerId,
      metadata: {
        messageId,
        readerId,
        action: 'read'
      },
      priority: PRIORITY_LEVELS.LOW
    });
  }

  // Payment-related activity methods
  async logPaymentProcessed(jobAssignmentId, amount, customerName, paymentMethod) {
    return this.log(ACTIVITY_EVENTS.PAYMENT_PROCESSED, {
      description: `Payment of $${amount} processed for ${customerName}`,
      jobAssignmentId,
      metadata: {
        amount,
        customerName,
        paymentMethod,
        action: 'processed'
      },
      priority: PRIORITY_LEVELS.HIGH
    });
  }

  async logPayoutSent(bubblerId, amount, paymentMethod) {
    return this.log(ACTIVITY_EVENTS.PAYOUT_SENT, {
      description: `Payout of $${amount} sent to ${bubblerId}`,
      relatedUserId: bubblerId,
      metadata: {
        amount,
        paymentMethod,
        action: 'sent'
      },
      priority: PRIORITY_LEVELS.HIGH
    });
  }

  // User-related activity methods
  async logUserRegistered(userId, userType, email) {
    return this.log(ACTIVITY_EVENTS.USER_REGISTERED, {
      description: `New ${userType} registered: ${email}`,
      relatedUserId: userId,
      metadata: {
        userType,
        email,
        action: 'registered'
      },
      priority: PRIORITY_LEVELS.MEDIUM
    });
  }

  async logUserUpdated(userId, userType, changes) {
    return this.log(ACTIVITY_EVENTS.USER_UPDATED, {
      description: `${userType} profile updated`,
      relatedUserId: userId,
      metadata: {
        userType,
        changes,
        action: 'updated'
      },
      priority: PRIORITY_LEVELS.MEDIUM
    });
  }

  // Rating-related activity methods
  async logRatingReceived(jobAssignmentId, customerName, bubblerId, rating, review = null) {
    return this.log(ACTIVITY_EVENTS.RATING_RECEIVED, {
      description: `${customerName} gave ${rating} stars to ${bubblerId}`,
      jobAssignmentId,
      relatedUserId: bubblerId,
      metadata: {
        customerName,
        bubblerId,
        rating,
        review,
        action: 'received'
      },
      priority: PRIORITY_LEVELS.MEDIUM
    });
  }

  // Equipment-related activity methods
  async logEquipmentAdded(equipmentId, equipmentName, bubblerId) {
    return this.log(ACTIVITY_EVENTS.EQUIPMENT_ADDED, {
      description: `Equipment "${equipmentName}" added for ${bubblerId}`,
      relatedUserId: bubblerId,
      metadata: {
        equipmentId,
        equipmentName,
        bubblerId,
        action: 'added'
      },
      priority: PRIORITY_LEVELS.LOW
    });
  }

  async logEquipmentUpdated(equipmentId, equipmentName, bubblerId, changes) {
    return this.log(ACTIVITY_EVENTS.EQUIPMENT_UPDATED, {
      description: `Equipment "${equipmentName}" updated for ${bubblerId}`,
      relatedUserId: bubblerId,
      metadata: {
        equipmentId,
        equipmentName,
        bubblerId,
        changes,
        action: 'updated'
      },
      priority: PRIORITY_LEVELS.LOW
    });
  }

  // Order-related activity methods
  async logOrderCreated(orderId, customerName, serviceType, amount) {
    return this.log(ACTIVITY_EVENTS.ORDER_CREATED, {
      description: `New order created for ${customerName}: ${serviceType}`,
      metadata: {
        orderId,
        customerName,
        serviceType,
        amount,
        action: 'created'
      },
      priority: PRIORITY_LEVELS.HIGH
    });
  }

  async logOrderCancelled(orderId, customerName, reason = null) {
    return this.log(ACTIVITY_EVENTS.ORDER_CANCELLED, {
      description: `Order cancelled for ${customerName}`,
      metadata: {
        orderId,
        customerName,
        reason,
        action: 'cancelled'
      },
      priority: PRIORITY_LEVELS.HIGH
    });
  }

  // System-related activity methods
  async logSystemMaintenance(description, duration = null) {
    return this.log(ACTIVITY_EVENTS.SYSTEM_MAINTENANCE, {
      description,
      metadata: {
        duration,
        action: 'maintenance'
      },
      priority: PRIORITY_LEVELS.MEDIUM
    });
  }

  async logSecurityAlert(description, severity = 'medium', details = {}) {
    return this.log(ACTIVITY_EVENTS.SECURITY_ALERT, {
      description,
      metadata: {
        severity,
        details,
        action: 'security_alert'
      },
      priority: severity === 'high' ? PRIORITY_LEVELS.CRITICAL : PRIORITY_LEVELS.HIGH
    });
  }

  async logPerformanceAlert(description, metrics = {}) {
    return this.log(ACTIVITY_EVENTS.PERFORMANCE_ALERT, {
      description,
      metadata: {
        metrics,
        action: 'performance_alert'
      },
      priority: PRIORITY_LEVELS.MEDIUM
    });
  }

  // Utility methods
  async getRecentActivities(limit = 50, filters = {}) {
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
        .limit(limit);

      // Apply filters
      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.jobAssignmentId) {
        query = query.eq('job_assignment_id', filters.jobAssignmentId);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  async getActivityStats(timeRange = '24h') {
    try {
      const now = new Date();
      let fromDate;
      
      switch (timeRange) {
        case '1h':
          fromDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from('activity_log')
        .select('event_type, priority, created_at')
        .gte('created_at', fromDate.toISOString());

      if (error) throw error;

      const activities = Array.isArray(data) ? data : [];
      
      // Calculate stats
      const stats = {
        total: activities.length,
        byEventType: {},
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        byHour: Array(24).fill(0)
      };

      activities.forEach(activity => {
        // Count by event type
        stats.byEventType[activity.event_type] = (stats.byEventType[activity.event_type] || 0) + 1;
        
        // Count by priority
        if (stats.byPriority[activity.priority] !== undefined) {
          stats.byPriority[activity.priority]++;
        }
        
        // Count by hour
        const hour = new Date(activity.created_at).getHours();
        stats.byHour[hour]++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return {
        total: 0,
        byEventType: {},
        byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
        byHour: Array(24).fill(0)
      };
    }
  }
}

// Create and export a singleton instance
const activityLogger = new ActivityLogger();
export default activityLogger; 