# Feedback Notifications System

## 🎯 Overview

The Feedback Notifications System automatically alerts admins and support bubblers when services are completed and ready for feedback links. This ensures no completed services are missed and feedback requests are sent promptly.

## 🔔 How It Works

### **Automatic Notifications**
1. **Job Completion Trigger**: When a bubbler marks a job as "completed"
2. **Database Trigger**: Automatically creates a feedback notification
3. **Real-time Alert**: Notification appears in admin dashboard header
4. **Quick Actions**: Copy feedback link or generate custom link

### **Notification Bell**
- **Location**: Top-right corner of admin dashboard header
- **Badge**: Shows unread count (red circle with number)
- **Real-time**: Updates instantly when jobs are completed
- **Access**: Only visible to `admin_bubbler` and `support_bubbler` roles

## 📊 Notification Details

### **What's Included:**
- ✅ Customer name
- ✅ Service type
- ✅ Assigned bubbler
- ✅ Completion time
- ✅ Quick action buttons

### **Example Notification:**
```
🔔 Service Completed
Jane Doe - Home Cleaning
Bubbler: John Smith
Completed: 2 hours ago

[Copy Link] [Generate Link]
```

## 🚀 Quick Actions

### **Copy Link**
- Instantly copies pre-generated feedback link
- Includes all necessary parameters (order_id, bubbler_id, serviceType)
- Ready to paste into email/SMS

### **Generate Link**
- Opens Manual Link Generator with pre-filled order
- Allows customization (add tip prompt, etc.)
- Perfect for personalized feedback requests

### **Mark as Read**
- Removes notification from unread count
- Updates database to track sent notifications
- Prevents duplicate feedback requests

## 🔄 Real-time Updates

### **Instant Notifications**
- **WebSocket Connection**: Real-time updates via Supabase
- **No Refresh Needed**: Notifications appear automatically
- **Sound/Visual**: Browser notifications (if enabled)

### **Database Triggers**
```sql
-- Trigger fires when job status changes to 'completed'
CREATE TRIGGER job_completion_feedback_notification_trigger
  AFTER UPDATE ON job_assignments
  FOR EACH ROW
  EXECUTE FUNCTION create_feedback_notification();
```

## 📈 Dashboard Integration

### **Header Component**
```jsx
{(isAdmin || isSupport) && <FeedbackNotifications />}
```

### **Features:**
- **Conditional Display**: Only shows for admin/support roles
- **Unread Badge**: Red circle with notification count
- **Dropdown Menu**: Click to view all notifications
- **Quick Actions**: Copy links or generate custom ones

## 🗄️ Database Structure

### **feedback_notifications Table:**
```sql
CREATE TABLE feedback_notifications (
  id uuid PRIMARY KEY,
  job_assignment_id uuid REFERENCES job_assignments(id),
  order_id uuid REFERENCES orders(id),
  customer_name text NOT NULL,
  service_type text NOT NULL,
  bubbler_id uuid REFERENCES bubblers(id),
  bubbler_name text NOT NULL,
  completed_at timestamp with time zone NOT NULL,
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

### **Key Fields:**
- `notification_sent`: Tracks if feedback link was sent
- `notification_sent_at`: Timestamp when link was sent
- `hours_since_completion`: Calculated field for urgency

## 🎯 Use Cases

### **1. Immediate Follow-up**
```
Job completed at 2:30 PM
→ Notification appears at 2:30 PM
→ Admin clicks "Copy Link" at 2:31 PM
→ Customer receives feedback request at 2:32 PM
```

### **2. Batch Processing**
```
Multiple jobs completed
→ Notifications accumulate in dropdown
→ Admin exports all links via Manual Link Generator
→ Sends batch feedback campaign
```

### **3. Quality Assurance**
```
Lead bubbler completes job
→ Notification appears immediately
→ Admin can quickly verify service quality
→ Send personalized feedback request
```

### **4. Customer Service**
```
Customer calls about feedback
→ Admin searches notifications
→ Finds specific completed service
→ Generates fresh feedback link
```

## 🔧 Configuration

### **Environment Variables:**
```bash
# Supabase configuration (already set up)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### **Database Setup:**
```sql
-- Run the SQL from SUPABASE_FEEDBACK_NOTIFICATIONS_TRIGGER.sql
-- This creates the table, triggers, and RLS policies
```

### **Component Integration:**
```jsx
// Already added to Layout.jsx
import FeedbackNotifications from '../admin/FeedbackNotifications';

// Conditionally rendered in header
{(isAdmin || isSupport) && <FeedbackNotifications />}
```

## 📊 Analytics & Tracking

### **Metrics Available:**
- **Completion to Notification Time**: How quickly notifications appear
- **Notification to Link Sent Time**: Response time for feedback requests
- **Feedback Completion Rate**: How many customers actually leave feedback
- **Service Type Breakdown**: Which services get most feedback requests

### **Database Views:**
```sql
-- Pending notifications
SELECT * FROM pending_feedback_notifications;

-- Recent notifications (last 24 hours)
SELECT * FROM get_recent_feedback_notifications(24);
```

## 🚨 Troubleshooting

### **Common Issues:**

**1. Notifications Not Appearing**
- Check if user has admin/support role
- Verify job status is "completed"
- Check browser console for errors
- Ensure Supabase real-time is enabled

**2. Real-time Not Working**
- Check Supabase connection
- Verify database triggers are active
- Test with manual job completion

**3. Links Not Generating**
- Verify feedback.html exists
- Check URL parameters are correct
- Test link in incognito mode

**4. Database Errors**
- Check RLS policies
- Verify table permissions
- Review trigger function syntax

## 🔮 Future Enhancements

### **Planned Features:**
- **Email Integration**: Auto-send feedback emails
- **SMS Notifications**: Text message alerts
- **Slack Integration**: Channel notifications
- **Custom Timing**: Configurable notification delays
- **Priority Levels**: High/medium/low priority notifications
- **Bulk Actions**: Mark multiple as read/sent

### **Advanced Analytics:**
- **Response Time Tracking**: How quickly feedback is requested
- **Customer Satisfaction**: Correlation with feedback timing
- **Bubbler Performance**: Feedback rates by bubbler
- **Service Quality**: Feedback scores by service type

---

**Last Updated:** [Current Date]
**Version:** 1.0
**Maintained By:** GoGoBubbles Development Team 