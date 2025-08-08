-- =====================================================
-- RESCHEDULE SYSTEM - RUN IN ORDER
-- =====================================================

-- STEP 1: Add missing columns to existing tables
-- =====================================================

-- Add missing fields to ratings table for customer feedback
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Add rescheduling tracking fields to job_assignments
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS original_bubbler_id UUID REFERENCES bubblers(id);
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS is_rescheduled BOOLEAN DEFAULT false;
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS rescheduled_from_job_id UUID REFERENCES job_assignments(id);
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS standby_payout_received BOOLEAN DEFAULT false;

-- =====================================================
-- STEP 2: Create reschedule functions (run separately)
-- =====================================================

-- Function to handle rescheduling with original bubbler priority
CREATE OR REPLACE FUNCTION handle_job_reschedule(
  original_job_id UUID,
  new_schedule_date TIMESTAMP WITH TIME ZONE,
  reschedule_reason TEXT DEFAULT 'Customer request'
)
RETURNS TABLE(
  success BOOLEAN,
  new_job_id UUID,
  original_bubbler_id UUID,
  message TEXT
) AS $$
DECLARE
  original_job_record RECORD;
  new_job_id UUID;
  original_bubbler_id UUID;
BEGIN
  -- Get the original job assignment
  SELECT * INTO original_job_record 
  FROM job_assignments 
  WHERE id = original_job_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, 'Original job not found'::TEXT;
    RETURN;
  END IF;
  
  -- Store the original bubbler ID
  original_bubbler_id := original_job_record.bubbler_id;
  
  -- Create new job assignment for the rescheduled time
  INSERT INTO job_assignments (
    order_service_id,
    bubbler_id,
    assigned_at,
    status,
    notes,
    original_bubbler_id,
    is_rescheduled,
    rescheduled_from_job_id,
    standby_payout_received,
    expected_duration_minutes
  ) VALUES (
    original_job_record.order_service_id,
    original_bubbler_id, -- Always assign to original bubbler
    NOW(),
    'assigned',
    'Rescheduled from job ' || original_job_id || ' - ' || reschedule_reason,
    original_bubbler_id,
    true,
    original_job_id,
    true, -- Mark that standby payout was already received
    original_job_record.expected_duration_minutes
  ) RETURNING id INTO new_job_id;
  
  -- Update the original job status to cancelled
  UPDATE job_assignments 
  SET status = 'cancelled', 
      notes = COALESCE(notes, '') || ' - Cancelled due to reschedule'
  WHERE id = original_job_id;
  
  -- Update the order schedule
  UPDATE orders 
  SET schedule_date = new_schedule_date,
      updated_at = NOW()
  WHERE id = (
    SELECT order_id 
    FROM order_service 
    WHERE id = original_job_record.order_service_id
  );
  
  RETURN QUERY SELECT 
    true, 
    new_job_id, 
    original_bubbler_id, 
    'Job rescheduled successfully. Original bubbler reassigned.'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- Function to check if bubbler received standby payout for a job
CREATE OR REPLACE FUNCTION check_standby_payout_status(job_assignment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  standby_status BOOLEAN;
BEGIN
  SELECT standby_payout_received INTO standby_status
  FROM job_assignments
  WHERE id = job_assignment_id;
  
  RETURN COALESCE(standby_status, false);
END;
$$ LANGUAGE plpgsql;

-- Function to get original bubbler for rescheduled jobs
CREATE OR REPLACE FUNCTION get_original_bubbler_for_reschedule(job_assignment_id UUID)
RETURNS UUID AS $$
DECLARE
  original_bubbler_id UUID;
BEGIN
  SELECT original_bubbler_id INTO original_bubbler_id
  FROM job_assignments
  WHERE id = job_assignment_id;
  
  RETURN original_bubbler_id;
END;
$$ LANGUAGE plpgsql; 