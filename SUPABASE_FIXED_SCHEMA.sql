-- =====================================================
-- FIXED SUPABASE SCHEMA - RUN IN CHUNKS
-- =====================================================

-- STEP 1: Add missing columns to existing tables
-- =====================================================

-- Add missing columns to ratings table
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Add rescheduling tracking fields to job_assignments
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS original_bubbler_id UUID REFERENCES bubblers(id);
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS is_rescheduled BOOLEAN DEFAULT false;
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS rescheduled_from_job_id UUID REFERENCES job_assignments(id);
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS standby_payout_received BOOLEAN DEFAULT false;

-- Add eco-friendly jobs field to existing bubblers table
ALTER TABLE public.bubblers ADD COLUMN IF NOT EXISTS accepts_eco_jobs BOOLEAN DEFAULT FALSE;

-- =====================================================
-- STEP 2: Create new tables
-- =====================================================

-- Reschedule requests table
CREATE TABLE IF NOT EXISTS public.reschedule_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  original_schedule_date TIMESTAMP WITH TIME ZONE NOT NULL,
  requested_schedule_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reschedule_reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  processed_by uuid REFERENCES bubblers(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT reschedule_requests_pkey PRIMARY KEY (id)
);

-- Activity log table for dashboard tracking
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT activity_log_pkey PRIMARY KEY (id)
);

-- Job checklist table for task tracking
CREATE TABLE IF NOT EXISTS public.job_checklist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_assignment_id uuid NOT NULL,
  task_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_by uuid,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT job_checklist_pkey PRIMARY KEY (id),
  CONSTRAINT job_checklist_job_assignment_id_fkey FOREIGN KEY (job_assignment_id) REFERENCES public.job_assignments(id),
  CONSTRAINT job_checklist_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.bubblers(id)
);

-- =====================================================
-- STEP 3: Create indexes
-- =====================================================

-- Reschedule requests indexes
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON reschedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_customer_email ON reschedule_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_order_id ON reschedule_requests(order_id);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- Job checklist indexes
CREATE INDEX IF NOT EXISTS idx_job_checklist_job_assignment_id ON job_checklist(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_job_checklist_completed_by ON job_checklist(completed_by);
CREATE INDEX IF NOT EXISTS idx_job_checklist_is_completed ON job_checklist(is_completed);

-- =====================================================
-- STEP 4: Create functions (run separately)
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