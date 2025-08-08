-- =====================================================
-- AUTOMATED FEEDBACK EMAIL SYSTEM
-- =====================================================

-- Create feedback email tracking table
CREATE TABLE IF NOT EXISTS feedback_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  job_assignment_id uuid REFERENCES job_assignments(id),
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  bubbler_id uuid REFERENCES bubblers(id),
  service_type text NOT NULL,
  feedback_link text NOT NULL,
  email_sent_at timestamp with time zone,
  email_status text DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed', 'opened')),
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_feedback_emails_order_id ON feedback_emails(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_emails_job_assignment_id ON feedback_emails(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_feedback_emails_email_status ON feedback_emails(email_status);

-- Function to generate feedback links
CREATE OR REPLACE FUNCTION generate_feedback_links(order_id UUID)
RETURNS TABLE(
  job_assignment_id UUID,
  bubbler_id UUID,
  service_type TEXT,
  feedback_link TEXT
) AS $$
DECLARE
  job_record RECORD;
  base_url TEXT := 'https://gogobubbles.com/feedback.html';
BEGIN
  -- Get all job assignments for this order
  FOR job_record IN 
    SELECT 
      ja.id as job_assignment_id,
      ja.bubbler_id,
      os.service_type,
      b.first_name,
      b.last_name
    FROM job_assignments ja
    JOIN order_service os ON ja.order_service_id = os.id
    JOIN bubblers b ON ja.bubbler_id = b.id
    WHERE os.order_id = generate_feedback_links.order_id
    AND ja.status = 'completed'
  LOOP
    -- Generate feedback link with parameters
    RETURN QUERY SELECT 
      job_record.job_assignment_id,
      job_record.bubbler_id,
      job_record.service_type,
      base_url || '?order_id=' || generate_feedback_links.order_id || 
      '&job_id=' || job_record.job_assignment_id || 
      '&bubbler_id=' || job_record.bubbler_id ||
      '&serviceType=' || encode(convert_to(job_record.service_type, 'UTF8'), 'base64');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create feedback email records
CREATE OR REPLACE FUNCTION create_feedback_emails(order_id UUID)
RETURNS VOID AS $$
DECLARE
  feedback_record RECORD;
BEGIN
  -- Generate feedback links for all completed jobs
  FOR feedback_record IN 
    SELECT * FROM generate_feedback_links(order_id)
  LOOP
    -- Insert feedback email record
    INSERT INTO feedback_emails (
      order_id,
      job_assignment_id,
      customer_email,
      customer_name,
      bubbler_id,
      service_type,
      feedback_link
    ) VALUES (
      create_feedback_emails.order_id,
      feedback_record.job_assignment_id,
      (SELECT customer_email FROM orders WHERE id = create_feedback_emails.order_id),
      (SELECT customer_name FROM orders WHERE id = create_feedback_emails.order_id),
      feedback_record.bubbler_id,
      feedback_record.service_type,
      feedback_record.feedback_link
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create feedback emails when job is completed
CREATE OR REPLACE FUNCTION trigger_feedback_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- When a job is marked as completed, create feedback email records
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM create_feedback_emails(
      (SELECT order_id FROM order_service WHERE id = NEW.order_service_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER job_completion_feedback_trigger
  AFTER UPDATE ON job_assignments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_feedback_emails();

-- View for pending feedback emails
CREATE OR REPLACE VIEW pending_feedback_emails AS
SELECT 
  fe.id,
  fe.order_id,
  fe.job_assignment_id,
  fe.customer_email,
  fe.customer_name,
  fe.bubbler_id,
  fe.service_type,
  fe.feedback_link,
  fe.email_status,
  fe.created_at,
  b.first_name as bubbler_first_name,
  b.last_name as bubbler_last_name
FROM feedback_emails fe
JOIN bubblers b ON fe.bubbler_id = b.id
WHERE fe.email_status = 'pending'
ORDER BY fe.created_at DESC; 