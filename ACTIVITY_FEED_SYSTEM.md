# GoGoBubbles Activity Feed & Notification System

## Overview

The Activity Feed & Notification System provides comprehensive real-time tracking of all platform activities with intelligent notifications. It serves as a "business GPS" that gives admins and bubblers complete visibility into operations, performance, and important events.

## Features

### 🚀 Core Features
- **Real-time activity tracking** across all platform operations
- **Intelligent notifications** with priority-based filtering
- **Comprehensive activity feed** with search and filtering
- **User-specific activity views** (admin vs bubbler)
- **Activity analytics** and statistics
- **Automatic notification generation** for high-priority events
- **Activity expansion** for detailed information
- **Real-time updates** without page refresh

### 📱 User Interface
- **Activity Feed page** with comprehensive filtering and search
- **Notification Center** in the top navigation
- **Real-time notification badges** with unread counts
- **Activity expansion** for detailed drill-down
- **Mobile-responsive** design
- **Timeline and feed view modes**

### 🔒 Security Features
- **Row Level Security (RLS)** policies
- **User-based access control**
- **Activity audit trail**
- **IP address and user agent tracking**

## Components

### 1. ActivityFeed Component
**Location**: `src/components/activity/ActivityFeed.jsx`

**Purpose**: Main activity feed page for viewing and managing all platform activities

**Features**:
- Real-time activity display
- Advanced filtering (event type, user type, date range, priority)
- Search functionality
- Activity expansion for details
- Timeline and feed view modes
- Export capabilities
- User-specific filtering

**Key Functions**:
- `loadActivities()` - Load activities from database
- `getFilteredActivities()` - Apply filters and search
- `toggleActivityExpansion()` - Expand/collapse activity details
- `navigateToRelated()` - Navigate to related content

### 2. NotificationCenter Component
**Location**: `src/components/activity/NotificationCenter.jsx`

**Purpose**: Real-time notification system in the top navigation

**Features**:
- Unread notification badge
- Notification dropdown with recent notifications
- Mark as read functionality
- Mark all as read option
- Navigation to related content
- Real-time updates

**Key Functions**:
- `loadNotifications()` - Load user notifications
- `markAsRead()` - Mark individual notification as read
- `markAllAsRead()` - Mark all notifications as read
- `navigateToRelated()` - Navigate to notification source

### 3. ActivityLogger Service
**Location**: `src/services/activityLogger.js`

**Purpose**: Centralized service for logging activities across the platform

**Features**:
- Comprehensive activity logging methods
- Priority-based logging
- Metadata support
- Activity statistics
- Real-time activity retrieval

**Key Methods**:
- `log()` - Generic activity logging
- `logJobAssigned()` - Job assignment logging
- `logJobCompleted()` - Job completion logging
- `logMessageSent()` - Message logging
- `logPaymentProcessed()` - Payment logging
- `getRecentActivities()` - Retrieve recent activities
- `getActivityStats()` - Get activity statistics

## Database Schema

### Activity Log Table
```sql
CREATE TABLE activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_assignment_id UUID REFERENCES job_assignments(id) ON DELETE CASCADE,
    related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    metadata JSONB,
    priority VARCHAR(20) DEFAULT 'medium',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activity_log(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Activity Event Types

### Job-Related Events
- `job_assigned` - Job assigned to bubbler
- `job_accepted` - Job accepted by bubbler
- `job_declined` - Job declined by bubbler
- `job_started` - Job started by bubbler
- `job_completed` - Job completed
- `job_cancelled` - Job cancelled
- `job_expired` - Job offer expired
- `job_reassigned` - Job reassigned

### Message Events
- `message_sent` - Message sent between users
- `message_read` - Message marked as read

### Payment Events
- `payment_processed` - Payment processed
- `payment_failed` - Payment failed
- `payout_sent` - Payout sent to bubbler

### User Events
- `user_registered` - New user registration
- `user_updated` - User profile updated
- `user_activated` - User account activated
- `user_deactivated` - User account deactivated

### Rating Events
- `rating_received` - New rating received
- `rating_updated` - Rating updated

### Equipment Events
- `equipment_added` - Equipment added
- `equipment_updated` - Equipment updated
- `equipment_removed` - Equipment removed

### Order Events
- `order_created` - New order created
- `order_updated` - Order updated
- `order_cancelled` - Order cancelled

### System Events
- `system_maintenance` - System maintenance
- `security_alert` - Security alert
- `performance_alert` - Performance alert

## Priority Levels

- **Low** - Informational activities
- **Medium** - Standard activities
- **High** - Important activities (auto-generates notifications)
- **Critical** - Urgent activities (auto-generates notifications)

## API Integration

### Activity Logging
```javascript
import activityLogger from '../services/activityLogger';

// Initialize with user context
activityLogger.init(userId, isAdmin);

// Log job assignment
await activityLogger.logJobAssigned(
  jobAssignmentId, 
  bubblerId, 
  customerName, 
  serviceType
);

// Log job completion
await activityLogger.logJobCompleted(
  jobAssignmentId, 
  bubblerId, 
  customerName, 
  rating
);

// Log message sent
await activityLogger.logMessageSent(
  jobAssignmentId, 
  fromUserId, 
  toUserId, 
  messageLength
);
```

### Activity Retrieval
```javascript
// Get recent activities
const activities = await activityLogger.getRecentActivities(50, {
  eventType: 'job_completed',
  userId: specificUserId,
  dateFrom: '2024-01-01'
});

// Get activity statistics
const stats = await activityLogger.getActivityStats('24h');
```

### Real-time Subscriptions
```javascript
// Subscribe to new activities
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
      loadActivities(); // Refresh activities
    }
  )
  .subscribe();
```

## User Experience Flow

### For Admins
1. **Dashboard Overview** - See recent activities on dashboard
2. **Activity Feed** - Comprehensive view of all platform activities
3. **Real-time Notifications** - Get notified of important events
4. **Activity Analytics** - View activity statistics and trends
5. **Filter and Search** - Find specific activities quickly

### For Bubblers
1. **Personal Activities** - View their own activities and related jobs
2. **Job Notifications** - Get notified of job assignments and updates
3. **Message Notifications** - Receive notifications for new messages
4. **Payment Notifications** - Get notified of payments and payouts

## Integration Points

### Jobs Component Integration
- Log job assignments, completions, and status changes
- Show activity indicators in job listings
- Link activities to specific job assignments

### Messages Component Integration
- Log message sending and reading
- Show message activity in activity feed
- Link message activities to conversations

### Dashboard Integration
- Display recent activities on dashboard
- Show activity statistics and trends
- Provide quick access to activity feed

## Performance Optimizations

### Database Indexes
- `event_type` for fast event filtering
- `user_id` and `related_user_id` for user-based queries
- `job_assignment_id` for job-related activities
- `created_at` for chronological sorting
- `priority` for priority-based filtering

### Real-time Efficiency
- Targeted subscriptions by user and event type
- Minimal data transfer
- Optimistic UI updates

### Caching Strategy
- Cache recent activities in memory
- Implement pagination for large datasets
- Use background refresh for updates

## Security Considerations

### Row Level Security (RLS)
- Users can only view their own activities and related job activities
- Admins can view all activities
- Users can only create activities as themselves
- Notifications are user-specific

### Data Privacy
- IP addresses and user agents are logged for security
- Sensitive data is not stored in activity logs
- Activity retention policies (90 days for activities, 30 days for read notifications)

### Access Control
- Activity logging requires authentication
- Notification access is user-specific
- Admin-only features are properly protected

## Error Handling

### Common Error Scenarios
1. **Database connection failures** - Graceful degradation with retry logic
2. **Real-time disconnections** - Automatic reconnection with exponential backoff
3. **Permission errors** - Clear error messages and fallback behavior
4. **Data validation errors** - Input validation and error feedback

### User Feedback
- Loading indicators for async operations
- Toast notifications for success/error states
- Graceful degradation for offline scenarios
- Clear error messages for user actions

## Future Enhancements

### Planned Features
- **Activity analytics dashboard** with charts and trends
- **Custom notification preferences** per user
- **Activity export** in multiple formats (CSV, PDF)
- **Activity templates** for common events
- **Advanced search** with full-text search capabilities
- **Activity scheduling** for future events
- **Activity collaboration** with comments and reactions
- **Mobile push notifications** for critical events

### Technical Improvements
- **Activity encryption** for sensitive data
- **Activity archiving** for long-term storage
- **Performance monitoring** and optimization
- **A/B testing** for UI improvements
- **Accessibility enhancements** for screen readers
- **Internationalization** support for multiple languages

## Troubleshooting

### Common Issues

#### Activities not loading
- Check user authentication
- Verify RLS policies
- Check network connectivity
- Review browser console for errors

#### Notifications not appearing
- Verify notification triggers are working
- Check notification table permissions
- Ensure real-time subscriptions are active
- Review activity priority settings

#### Real-time not working
- Check Supabase connection
- Verify subscription setup
- Review channel configuration
- Check for JavaScript errors

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'activity:*');
```

### Performance Monitoring
Monitor activity system performance:
```javascript
// Check activity load times
console.time('activityLoad');
await loadActivities();
console.timeEnd('activityLoad');

// Check notification counts
console.log('Unread notifications:', unreadCount);
```

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Author**: GoGoBubbles Development Team 