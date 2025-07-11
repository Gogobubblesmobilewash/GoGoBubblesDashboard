-- Activity and Notification System Migration
-- This script sets up comprehensive activity tracking and real-time notifications

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_assignment_id UUID REFERENCES job_assignments(id) ON DELETE CASCADE,
    related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    metadata JSONB,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_log_event_type ON activity_log(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_job_assignment_id ON activity_log(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_priority ON activity_log(priority);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_activity_id ON notifications(activity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_activity_log_updated_at 
    BEFORE UPDATE ON activity_log 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activity_log
-- Users can view activities they created or are related to
CREATE POLICY "Users can view their own activities" ON activity_log
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = related_user_id OR
        job_assignment_id IN (
            SELECT id FROM job_assignments 
            WHERE bubbler_id = auth.uid()
        )
    );

-- Users can insert their own activities
CREATE POLICY "Users can create activities" ON activity_log
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Admins can view all activities
CREATE POLICY "Admins can view all activities" ON activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for notifications
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (
        auth.uid() = recipient_id
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (
        auth.uid() = recipient_id
    );

-- System can insert notifications
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON activity_log TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT USAGE ON SEQUENCE activity_log_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE notifications_id_seq TO authenticated;

-- Create function to automatically create notifications for high-priority activities
CREATE OR REPLACE FUNCTION create_activity_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for high-priority activities
    IF NEW.priority IN ('high', 'critical') THEN
        INSERT INTO notifications (
            recipient_id,
            activity_id,
            notification_type,
            title,
            message
        ) VALUES (
            NEW.related_user_id,
            NEW.id,
            NEW.event_type,
            CASE 
                WHEN NEW.event_type = 'job_assigned' THEN 'New Job Assignment'
                WHEN NEW.event_type = 'job_completed' THEN 'Job Completed'
                WHEN NEW.event_type = 'job_cancelled' THEN 'Job Cancelled'
                WHEN NEW.event_type = 'message_sent' THEN 'New Message'
                WHEN NEW.event_type = 'payment_processed' THEN 'Payment Processed'
                WHEN NEW.event_type = 'rating_received' THEN 'New Rating'
                ELSE 'Activity Update'
            END,
            NEW.description
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create notifications
CREATE TRIGGER activity_notification_trigger
    AFTER INSERT ON activity_log
    FOR EACH ROW
    EXECUTE FUNCTION create_activity_notification();

-- Create function to clean up old activities (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS void AS $$
BEGIN
    DELETE FROM activity_log 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    AND read = true;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old activities (if using pg_cron)
-- SELECT cron.schedule('cleanup-activities', '0 2 * * *', 'SELECT cleanup_old_activities();');

-- Add comments for documentation
COMMENT ON TABLE activity_log IS 'Stores all platform activities for audit and tracking purposes';
COMMENT ON COLUMN activity_log.event_type IS 'Type of activity (e.g., job_assigned, message_sent)';
COMMENT ON COLUMN activity_log.user_id IS 'User who performed the action';
COMMENT ON COLUMN activity_log.job_assignment_id IS 'Related job assignment if applicable';
COMMENT ON COLUMN activity_log.related_user_id IS 'User affected by the action';
COMMENT ON COLUMN activity_log.metadata IS 'Additional data in JSON format';
COMMENT ON COLUMN activity_log.priority IS 'Activity priority level';

COMMENT ON TABLE notifications IS 'Stores user notifications for real-time alerts';
COMMENT ON COLUMN notifications.recipient_id IS 'User who should receive the notification';
COMMENT ON COLUMN notifications.activity_id IS 'Related activity that triggered the notification';
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is clicked';

-- Insert some sample activity types for reference
INSERT INTO activity_log (event_type, user_id, description, priority) VALUES
('system_maintenance', NULL, 'Activity system initialized', 'low')
ON CONFLICT DO NOTHING; 