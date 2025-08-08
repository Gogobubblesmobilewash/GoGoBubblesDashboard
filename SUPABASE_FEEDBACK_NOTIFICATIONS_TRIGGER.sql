-- =====================================================
-- FEEDBACK NOTIFICATIONS TRIGGER SYSTEM
-- =====================================================

-- Create feedback notifications table
CREATE TABLE IF NOT EXISTS feedback_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_feedback_notifications_job_assignment_id ON feedback_notifications(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_feedback_notifications_notification_sent ON feedback_notifications(notification_sent);
CREATE INDEX IF NOT EXISTS idx_feedback_notifications_completed_at ON feedback_notifications(completed_at);

-- Function to create feedback notification when job is completed
CREATE OR REPLACE FUNCTION create_feedback_notification()
RETURNS TRIGGER AS $$
DECLARE
  order_record RECORD;
  service_record RECORD;
  bubbler_record RECORD;
BEGIN
  -- Only trigger when job status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Get order information
    SELECT o.id, o.customer_name
    INTO order_record
    FROM orders o
    JOIN order_service os ON o.id = os.order_id
    WHERE os.id = NEW.order_service_id;
    
    -- Get service information
    SELECT service_type
    INTO service_record
    FROM order_service
    WHERE id = NEW.order_service_id;
    
    -- Get bubbler information
    SELECT id, first_name, last_name
    INTO bubbler_record
    FROM bubblers
    WHERE id = NEW.bubbler_id;
    
    -- Insert feedback notification
    INSERT INTO feedback_notifications (
      job_assignment_id,
      order_id,
      customer_name,
      service_type,
      bubbler_id,
      bubbler_name,
      completed_at
    ) VALUES (
      NEW.id,
      order_record.id,
      order_record.customer_name,
      service_record.service_type,
      bubbler_record.id,
      bubbler_record.first_name || ' ' || bubbler_record.last_name,
      NEW.completed_at
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on job_assignments table
CREATE TRIGGER job_completion_feedback_notification_trigger
  AFTER UPDATE ON job_assignments
  FOR EACH ROW
  EXECUTE FUNCTION create_feedback_notification();

-- View for pending feedback notifications (for admin dashboard)
CREATE OR REPLACE VIEW pending_feedback_notifications AS
SELECT 
  fn.id,
  fn.job_assignment_id,
  fn.order_id,
  fn.customer_name,
  fn.service_type,
  fn.bubbler_id,
  fn.bubbler_name,
  fn.completed_at,
  fn.notification_sent,
  fn.notification_sent_at,
  fn.created_at,
  EXTRACT(EPOCH FROM (NOW() - fn.completed_at)) / 3600 as hours_since_completion
FROM feedback_notifications fn
WHERE fn.notification_sent = false
ORDER BY fn.completed_at DESC;

-- Function to mark notification as sent
CREATE OR REPLACE FUNCTION mark_feedback_notification_sent(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE feedback_notifications 
  SET notification_sent = true, 
      notification_sent_at = NOW()
  WHERE id = notification_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent feedback notifications (for real-time updates)
CREATE OR REPLACE FUNCTION get_recent_feedback_notifications(hours_back INTEGER DEFAULT 24)
RETURNS TABLE(
  id uuid,
  customer_name text,
  service_type text,
  bubbler_name text,
  completed_at timestamp with time zone,
  hours_ago numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fn.id,
    fn.customer_name,
    fn.service_type,
    fn.bubbler_name,
    fn.completed_at,
    EXTRACT(EPOCH FROM (NOW() - fn.completed_at)) / 3600 as hours_ago
  FROM feedback_notifications fn
  WHERE fn.completed_at >= NOW() - INTERVAL '1 hour' * hours_back
  ORDER BY fn.completed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for feedback notifications
ALTER TABLE feedback_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for admin and support bubblers to read feedback notifications
CREATE POLICY "admin_support_can_read_feedback_notifications" ON feedback_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bubblers 
      WHERE bubblers.id = auth.uid() 
      AND bubblers.role IN ('admin_bubbler', 'support_bubbler')
    )
  );

-- Policy for admin and support bubblers to update feedback notifications
CREATE POLICY "admin_support_can_update_feedback_notifications" ON feedback_notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bubblers 
      WHERE bubblers.id = auth.uid() 
      AND bubblers.role IN ('admin_bubbler', 'support_bubbler')
    )
  );

-- Policy for system to insert feedback notifications
CREATE POLICY "system_can_insert_feedback_notifications" ON feedback_notifications
  FOR INSERT
  WITH CHECK (true); 