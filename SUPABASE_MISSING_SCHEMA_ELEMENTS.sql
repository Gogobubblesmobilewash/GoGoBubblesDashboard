-- =====================================================
-- GO GO BUBBLES - MISSING SCHEMA ELEMENTS
-- =====================================================

-- =====================================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing fields to order_service table
ALTER TABLE order_service ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE order_service ADD COLUMN IF NOT EXISTS has_pets BOOLEAN DEFAULT false;
ALTER TABLE order_service ADD COLUMN IF NOT EXISTS deepbed_count INTEGER DEFAULT 0;
ALTER TABLE order_service ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;
ALTER TABLE order_service ADD COLUMN IF NOT EXISTS dual_bubbler_required BOOLEAN DEFAULT false;

-- Add missing fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_discount DECIMAL(10,2);

-- Add missing fields to order_laundry_bags table
ALTER TABLE order_laundry_bags ADD COLUMN IF NOT EXISTS new_kits INTEGER DEFAULT 0;
ALTER TABLE order_laundry_bags ADD COLUMN IF NOT EXISTS replacements INTEGER DEFAULT 0;
ALTER TABLE order_laundry_bags ADD COLUMN IF NOT EXISTS existing_good INTEGER DEFAULT 0;

-- Add missing fields to order_vehicles table
ALTER TABLE order_vehicles ADD COLUMN IF NOT EXISTS vehicle_count INTEGER DEFAULT 1;
ALTER TABLE order_vehicles ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Add missing fields to ratings table for customer feedback
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Add rescheduling tracking fields to job_assignments
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS original_bubbler_id UUID REFERENCES bubblers(id);
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS is_rescheduled BOOLEAN DEFAULT false;
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS rescheduled_from_job_id UUID REFERENCES job_assignments(id);
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS standby_payout_received BOOLEAN DEFAULT false;

-- Create reschedule_requests table for customer reschedule requests
CREATE TABLE IF NOT EXISTS public.reschedule_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  customer_name text NOT NULL,
  original_schedule_date timestamp with time zone NOT NULL,
  requested_schedule_date timestamp with time zone NOT NULL,
  reschedule_reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  admin_notes text,
  processed_by uuid REFERENCES bubblers(id),
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT reschedule_requests_pkey PRIMARY KEY (id)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON reschedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_customer_email ON reschedule_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_order_id ON reschedule_requests(order_id);

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

-- =====================================================
-- 2. CREATE MISSING TABLES
-- =====================================================

-- Add eco-friendly jobs field to existing bubblers table
ALTER TABLE public.bubblers ADD COLUMN IF NOT EXISTS accepts_eco_jobs BOOLEAN DEFAULT FALSE;

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

-- Lead bubbler oversight tasks (separate from regular job checklist)
CREATE TABLE IF NOT EXISTS public.lead_bubbler_oversight_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_bubbler_id uuid REFERENCES bubblers(id),
  job_assignment_id uuid REFERENCES job_assignments(id),
  task_type TEXT NOT NULL CHECK (task_type IN ('quality_check', 'coaching', 'intervention', 'takeover', 'verification')),
  task_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  photos JSONB DEFAULT '[]',
  duration_minutes INTEGER,
  compensation_tracked BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT lead_bubbler_oversight_tasks_pkey PRIMARY KEY (id)
);

-- Lead bubbler interventions
CREATE TABLE IF NOT EXISTS public.interventions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_assignment_id uuid REFERENCES job_assignments(id),
  lead_bubbler_id uuid REFERENCES bubblers(id),
  intervention_type TEXT NOT NULL CHECK (intervention_type IN ('assist', 'takeover', 'coaching', 'quality_fix')),
  notes TEXT,
  photos JSONB DEFAULT '[]',
  duration_minutes INTEGER DEFAULT 15,
  compensation_tracked BOOLEAN DEFAULT true,
  service_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT interventions_pkey PRIMARY KEY (id)
);

-- Lead bubbler performance reviews (by other bubblers)
CREATE TABLE IF NOT EXISTS public.lead_bubbler_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_bubbler_id uuid REFERENCES bubblers(id),
  reviewed_by uuid REFERENCES bubblers(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  timeliness INTEGER NOT NULL CHECK (timeliness >= 1 AND timeliness <= 5),
  oversight_quality INTEGER NOT NULL CHECK (oversight_quality >= 1 AND oversight_quality <= 5),
  notes TEXT,
  issues JSONB DEFAULT '[]',
  approved_to_lead BOOLEAN NOT NULL DEFAULT true,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT lead_bubbler_reviews_pkey PRIMARY KEY (id)
);

-- Lead bubbler feedback from bubblers
CREATE TABLE IF NOT EXISTS public.bubbler_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_checkin_id uuid,
  bubbler_id uuid REFERENCES bubblers(id),
  lead_bubbler_id uuid REFERENCES bubblers(id),
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'neutral', 'coaching')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT bubbler_feedback_pkey PRIMARY KEY (id)
);

-- Lead bubbler check-ins for oversight tracking
CREATE TABLE IF NOT EXISTS public.lead_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_bubbler_id uuid REFERENCES bubblers(id),
  checkin_type TEXT NOT NULL CHECK (checkin_type IN ('shift_start', 'shift_end', 'break_start', 'break_end')),
  service_type TEXT,
  linked_request_id uuid,
  checkin_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checkin_end TIMESTAMP WITH TIME ZONE,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT lead_checkins_pkey PRIMARY KEY (id)
);

-- Lead bubbler shift tracking
CREATE TABLE IF NOT EXISTS public.lead_bubbler_shifts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_bubbler_id uuid REFERENCES bubblers(id),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  zone_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT lead_bubbler_shifts_pkey PRIMARY KEY (id)
);

-- Device binding table for security
CREATE TABLE IF NOT EXISTS public.device_binding (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_hash TEXT NOT NULL,
  device_type TEXT,
  ip_address TEXT,
  bound_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT device_binding_pkey PRIMARY KEY (id),
  CONSTRAINT device_binding_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.bubblers(id)
);

-- Promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT promo_codes_pkey PRIMARY KEY (id)
);

-- Customer table for better customer management
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  address TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  first_order_date TIMESTAMP WITH TIME ZONE,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 3. CREATE INDEXES FOR NEW TABLES
-- =====================================================

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- Job checklist indexes
CREATE INDEX IF NOT EXISTS idx_job_checklist_job_assignment_id ON job_checklist(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_job_checklist_completed_by ON job_checklist(completed_by);
CREATE INDEX IF NOT EXISTS idx_job_checklist_is_completed ON job_checklist(is_completed);

-- Lead bubbler oversight tasks indexes
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_oversight_tasks_lead_bubbler_id ON lead_bubbler_oversight_tasks(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_oversight_tasks_job_assignment_id ON lead_bubbler_oversight_tasks(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_oversight_tasks_task_type ON lead_bubbler_oversight_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_oversight_tasks_is_completed ON lead_bubbler_oversight_tasks(is_completed);

-- Interventions indexes
CREATE INDEX IF NOT EXISTS idx_interventions_job_assignment_id ON interventions(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_interventions_lead_bubbler_id ON interventions(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_interventions_intervention_type ON interventions(intervention_type);
CREATE INDEX IF NOT EXISTS idx_interventions_created_at ON interventions(created_at);

-- Lead bubbler reviews indexes
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_reviews_lead_bubbler_id ON lead_bubbler_reviews(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_reviews_reviewed_by ON lead_bubbler_reviews(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_reviews_created_at ON lead_bubbler_reviews(created_at);

-- Bubbler feedback indexes
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_bubbler_id ON bubbler_feedback(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_lead_bubbler_id ON bubbler_feedback(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_feedback_type ON bubbler_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_status ON bubbler_feedback(status);

-- Lead checkins indexes
CREATE INDEX IF NOT EXISTS idx_lead_checkins_lead_bubbler_id ON lead_checkins(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_lead_checkins_checkin_type ON lead_checkins(checkin_type);
CREATE INDEX IF NOT EXISTS idx_lead_checkins_checkin_start ON lead_checkins(checkin_start);
CREATE INDEX IF NOT EXISTS idx_lead_checkins_service_type ON lead_checkins(service_type);

-- Lead bubbler shifts indexes
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_shifts_lead_bubbler_id ON lead_bubbler_shifts(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_shifts_status ON lead_bubbler_shifts(status);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_shifts_start_time ON lead_bubbler_shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_shifts_end_time ON lead_bubbler_shifts(end_time);

-- Device binding indexes
CREATE INDEX IF NOT EXISTS idx_device_binding_user_id ON device_binding(user_id);
CREATE INDEX IF NOT EXISTS idx_device_binding_device_hash ON device_binding(device_hash);
CREATE INDEX IF NOT EXISTS idx_device_binding_active ON device_binding(is_active);

-- Promo codes indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_until ON promo_codes(valid_until);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_bubbler_oversight_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_bubbler_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubbler_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_bubbler_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_binding ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE SAFE VIEWS FOR NEW TABLES
-- =====================================================

-- Safe activity log view
CREATE OR REPLACE VIEW user_activity_view AS
SELECT 
  id,
  user_id,
  activity_type,
  description,
  metadata,
  created_at
FROM activity_log
WHERE user_id = auth.uid();

-- Safe job checklist view
CREATE OR REPLACE VIEW job_checklist_view AS
SELECT 
  jc.id,
  jc.job_assignment_id,
  jc.task_name,
  jc.is_completed,
  jc.completed_by,
  jc.completed_at,
  jc.notes,
  ja.bubbler_id,
  os.service_type,
  os.tier
FROM job_checklist jc
INNER JOIN job_assignments ja ON jc.job_assignment_id = ja.id
INNER JOIN order_service os ON ja.order_service_id = os.id
WHERE ja.bubbler_id = auth.uid();

-- Safe lead bubbler oversight tasks view
CREATE OR REPLACE VIEW lead_bubbler_oversight_tasks_view AS
SELECT 
  lot.id,
  lot.lead_bubbler_id,
  lot.job_assignment_id,
  lot.task_type,
  lot.task_name,
  lot.is_completed,
  lot.completed_at,
  lot.notes,
  lot.photos,
  lot.duration_minutes,
  lot.compensation_tracked,
  ja.bubbler_id,
  os.service_type,
  os.tier
FROM lead_bubbler_oversight_tasks lot
INNER JOIN job_assignments ja ON lot.job_assignment_id = ja.id
INNER JOIN order_service os ON ja.order_service_id = os.id
WHERE lot.lead_bubbler_id = auth.uid();

-- Safe interventions view
CREATE OR REPLACE VIEW interventions_view AS
SELECT 
  i.id,
  i.job_assignment_id,
  i.lead_bubbler_id,
  i.intervention_type,
  i.notes,
  i.photos,
  i.duration_minutes,
  i.compensation_tracked,
  i.service_type,
  i.created_at,
  ja.bubbler_id,
  os.service_type as job_service_type,
  os.tier
FROM interventions i
INNER JOIN job_assignments ja ON i.job_assignment_id = ja.id
INNER JOIN order_service os ON ja.order_service_id = os.id
WHERE i.lead_bubbler_id = auth.uid();

-- Safe lead bubbler reviews view
CREATE OR REPLACE VIEW lead_bubbler_reviews_view AS
SELECT 
  lbr.id,
  lbr.lead_bubbler_id,
  lbr.reviewed_by,
  lbr.rating,
  lbr.timeliness,
  lbr.oversight_quality,
  lbr.notes,
  lbr.issues,
  lbr.approved_to_lead,
  lbr.next_review_date,
  lbr.created_at,
  b1.first_name as lead_bubbler_name,
  b2.first_name as reviewer_name
FROM lead_bubbler_reviews lbr
INNER JOIN bubblers b1 ON lbr.lead_bubbler_id = b1.id
INNER JOIN bubblers b2 ON lbr.reviewed_by = b2.id
WHERE lbr.lead_bubbler_id = auth.uid() OR lbr.reviewed_by = auth.uid();

-- Safe bubbler feedback view
CREATE OR REPLACE VIEW bubbler_feedback_view AS
SELECT 
  bf.id,
  bf.lead_checkin_id,
  bf.bubbler_id,
  bf.lead_bubbler_id,
  bf.feedback_type,
  bf.rating,
  bf.feedback_text,
  bf.status,
  bf.admin_notes,
  bf.created_at,
  b1.first_name as bubbler_name,
  b2.first_name as lead_bubbler_name
FROM bubbler_feedback bf
INNER JOIN bubblers b1 ON bf.bubbler_id = b1.id
INNER JOIN bubblers b2 ON bf.lead_bubbler_id = b2.id
WHERE bf.bubbler_id = auth.uid() OR bf.lead_bubbler_id = auth.uid();

-- Safe lead checkins view
CREATE OR REPLACE VIEW lead_checkins_view AS
SELECT 
  lc.id,
  lc.lead_bubbler_id,
  lc.checkin_type,
  lc.service_type,
  lc.linked_request_id,
  lc.checkin_start,
  lc.checkin_end,
  lc.location,
  lc.notes,
  lc.created_at
FROM lead_checkins lc
WHERE lc.lead_bubbler_id = auth.uid();

-- Safe lead bubbler shifts view
CREATE OR REPLACE VIEW lead_bubbler_shifts_view AS
SELECT 
  lbs.id,
  lbs.lead_bubbler_id,
  lbs.start_time,
  lbs.end_time,
  lbs.status,
  lbs.zone_id,
  lbs.notes,
  lbs.created_at
FROM lead_bubbler_shifts lbs
WHERE lbs.lead_bubbler_id = auth.uid();

-- Safe device binding view
CREATE OR REPLACE VIEW user_device_binding_view AS
SELECT 
  id,
  user_id,
  device_hash,
  device_type,
  ip_address,
  bound_at,
  last_used,
  is_active
FROM device_binding
WHERE user_id = auth.uid();

-- Safe customer view
CREATE OR REPLACE VIEW customer_profile_view AS
SELECT 
  id,
  email,
  phone,
  first_name,
  last_name,
  address,
  total_orders,
  total_spent,
  first_order_date,
  last_order_date,
  created_at,
  updated_at
FROM customers
WHERE email = auth.uid()::text;

-- =====================================================
-- 6. CREATE BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Eco-friendly job assignment function
CREATE OR REPLACE FUNCTION get_eco_friendly_bubblers()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  accepts_eco_jobs BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.first_name,
    b.last_name,
    b.email,
    b.accepts_eco_jobs
  FROM bubblers b
  WHERE b.is_active = true 
    AND b.accepts_eco_jobs = true
  ORDER BY b.first_name, b.last_name;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a bubbler accepts eco-friendly jobs
CREATE OR REPLACE FUNCTION check_bubbler_eco_friendly(bubbler_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  accepts_eco BOOLEAN;
BEGIN
  SELECT accepts_eco_jobs INTO accepts_eco
  FROM bubblers
  WHERE id = bubbler_id;
  
  RETURN COALESCE(accepts_eco, false);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate eco-friendly bonus for bubblers
CREATE OR REPLACE FUNCTION calculate_eco_friendly_bonus(job_assignment_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  service_record RECORD;
  bubbler_record RECORD;
  has_eco_addon BOOLEAN := false;
  accepts_eco_jobs BOOLEAN := false;
  eco_bonus DECIMAL(10,2) := 0;
BEGIN
  -- Get job assignment details
  SELECT ja.bubbler_id, os.service_type, os.addons
  INTO service_record
  FROM job_assignments ja
  JOIN order_service os ON ja.order_service_id = os.id
  WHERE ja.id = job_assignment_id;
  
  -- Check if bubbler accepts eco-friendly jobs
  SELECT accepts_eco_jobs INTO accepts_eco_jobs
  FROM bubblers
  WHERE id = service_record.bubbler_id;
  
  -- Check if service has eco-friendly add-on
  IF service_record.addons IS NOT NULL THEN
    has_eco_addon := service_record.addons::jsonb ? 'Eco-Friendly Cleaning';
  END IF;
  
  -- Calculate bonus: $5 if both conditions are met
  IF has_eco_addon AND accepts_eco_jobs THEN
    eco_bonus := 5.00;
  END IF;
  
  RETURN eco_bonus;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate laundry bag count for eco-friendly detergent payout
CREATE OR REPLACE FUNCTION get_laundry_bag_count(order_service_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_bags INTEGER := 0;
  bag_record RECORD;
BEGIN
  -- Sum up all bags for this order service
  FOR bag_record IN 
    SELECT quantity FROM order_laundry_bags 
    WHERE order_service_id = $1
  LOOP
    total_bags := total_bags + COALESCE(bag_record.quantity, 0);
  END LOOP;
  
  RETURN total_bags;
END;
$$ LANGUAGE plpgsql;

-- Enhanced payout calculation function with eco-friendly bonus
CREATE OR REPLACE FUNCTION calculate_bubbler_payout_with_eco_bonus(job_assignment_id UUID)
RETURNS TABLE(
  base_payout DECIMAL(10,2),
  addon_payouts DECIMAL(10,2),
  eco_bonus DECIMAL(10,2),
  total_payout DECIMAL(10,2),
  service_type TEXT,
  tier TEXT,
  addons JSONB
) AS $$
DECLARE
  service_record RECORD;
  bubbler_record RECORD;
  base_payout DECIMAL(10,2) := 0;
  addon_payouts DECIMAL(10,2) := 0;
  eco_bonus DECIMAL(10,2) := 0;
  total_payout DECIMAL(10,2) := 0;
  addon_key TEXT;
  addon_payout DECIMAL(10,2);
  bag_count INTEGER;
BEGIN
  -- Get job assignment and service details
  SELECT ja.bubbler_id, os.service_type, os.tier, os.addons, os.id
  INTO service_record
  FROM job_assignments ja
  JOIN order_service os ON ja.order_service_id = os.id
  WHERE ja.id = job_assignment_id;
  
  -- Get bubbler details
  SELECT accepts_eco_jobs INTO bubbler_record
  FROM bubblers
  WHERE id = service_record.bubbler_id;
  
  -- Calculate base payout based on service type and tier
  IF service_record.service_type = 'Mobile Car Wash' THEN
    CASE service_record.tier
      WHEN 'Express Shine' THEN base_payout := 25.00;
      WHEN 'Signature Shine' THEN base_payout := 35.00;
      WHEN 'Supreme Shine' THEN base_payout := 45.00;
      ELSE base_payout := 25.00;
    END CASE;
  ELSIF service_record.service_type = 'Home Cleaning' THEN
    CASE service_record.tier
      WHEN 'Refresh Clean' THEN base_payout := 40.00;
      WHEN 'Signature Deep Clean' THEN base_payout := 60.00;
      ELSE base_payout := 40.00;
    END CASE;
  ELSIF service_record.service_type = 'Laundry Service' THEN
    base_payout := 30.00;
  END IF;
  
  -- Calculate add-on payouts
  IF service_record.addons IS NOT NULL THEN
    FOR addon_key IN SELECT jsonb_object_keys(service_record.addons)
    LOOP
      -- Home Cleaning add-ons
      IF service_record.service_type = 'Home Cleaning' THEN
        CASE addon_key
          WHEN 'Deep Dusting' THEN addon_payout := 10.00;
          WHEN 'Deep Clean Bedroom' THEN addon_payout := 15.00;
          WHEN 'Fridge Cleaning' THEN addon_payout := 12.00;
          WHEN 'Oven Cleaning' THEN addon_payout := 15.00;
          WHEN 'Freezer Cleaning' THEN addon_payout := 8.00;
          WHEN 'Cabinet Cleaning' THEN addon_payout := 10.00;
          WHEN 'Steam Mopping' THEN addon_payout := 8.00;
          WHEN 'Clean Kitchen' THEN addon_payout := 12.00;
          WHEN 'Stove Top Cleaning' THEN addon_payout := 6.00;
          WHEN 'Eco-Friendly Cleaning' THEN addon_payout := 5.00;
          ELSE addon_payout := 0.00;
        END CASE;
      -- Car Wash add-ons
      ELSIF service_record.service_type = 'Mobile Car Wash' THEN
        CASE addon_key
          WHEN 'Clay Bar Treatment' THEN addon_payout := 15.00;
          WHEN 'Bug & Tar Removal' THEN addon_payout := 10.00;
          WHEN 'Plastic Trim Restoration' THEN addon_payout := 8.00;
          WHEN 'Upholstery Shampoo' THEN addon_payout := 12.00;
          WHEN 'Interior Shampoo' THEN addon_payout := 15.00;
          WHEN 'Eco-Friendly Cleaning' THEN addon_payout := 5.00;
          ELSE addon_payout := 0.00;
        END CASE;
      -- Laundry add-ons
      ELSIF service_record.service_type = 'Laundry Service' THEN
        CASE addon_key
          WHEN 'Eco-friendly detergent' THEN 
            -- Calculate $2 per bag for eco-friendly detergent
            bag_count := get_laundry_bag_count(service_record.id);
            addon_payout := 2.00 * bag_count;
          WHEN 'Express Service - 24 hours' THEN addon_payout := 10.00;
          ELSE addon_payout := 0.00;
        END CASE;
      END IF;
      
      addon_payouts := addon_payouts + addon_payout;
    END LOOP;
  END IF;
  
  -- Calculate eco-friendly bonus
  IF service_record.addons IS NOT NULL AND bubbler_record.accepts_eco_jobs THEN
    IF service_record.addons::jsonb ? 'Eco-Friendly Cleaning' THEN
      eco_bonus := 5.00;
    END IF;
  END IF;
  
  -- Calculate total payout
  total_payout := base_payout + addon_payouts + eco_bonus;
  
  RETURN QUERY SELECT 
    base_payout,
    addon_payouts,
    eco_bonus,
    total_payout,
    service_record.service_type,
    service_record.tier,
    service_record.addons;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_totals(order_id UUID)
RETURNS TABLE(
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  balance_due DECIMAL(10,2)
) AS $$
DECLARE
  order_subtotal DECIMAL(10,2) := 0;
  order_tax DECIMAL(10,2) := 0;
  order_total DECIMAL(10,2) := 0;
  order_deposit DECIMAL(10,2) := 0;
  order_balance DECIMAL(10,2) := 0;
  service_record RECORD;
BEGIN
  -- Calculate subtotal from all services
  FOR service_record IN 
    SELECT price_estimated FROM order_service WHERE order_id = $1
  LOOP
    order_subtotal := order_subtotal + COALESCE(service_record.price_estimated, 0);
  END LOOP;
  
  -- Calculate tax (8.25%)
  order_tax := order_subtotal * 0.0825;
  
  -- Calculate total
  order_total := order_subtotal + order_tax;
  
  -- Calculate deposit based on total
  order_deposit := CASE 
    WHEN order_total < 60 THEN 20
    WHEN order_total >= 60 AND order_total < 150 THEN 30
    WHEN order_total >= 150 AND order_total < 250 THEN 50
    WHEN order_total >= 250 AND order_total < 400 THEN 75
    ELSE 100
  END;
  
  -- Calculate balance due
  order_balance := order_total - order_deposit;
  
  RETURN QUERY SELECT 
    order_subtotal,
    order_tax,
    order_total,
    order_deposit,
    order_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to validate promo code
CREATE OR REPLACE FUNCTION validate_promo_code(promo_code TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  discount_type TEXT,
  discount_value DECIMAL(10,2),
  message TEXT
) AS $$
DECLARE
  promo_record RECORD;
BEGIN
  -- Check if promo code exists and is valid
  SELECT * INTO promo_record FROM promo_codes 
  WHERE code = $1 
  AND is_active = true 
  AND (valid_until IS NULL OR valid_until > NOW())
  AND (max_uses IS NULL OR used_count < max_uses);
  
  IF promo_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'Invalid or expired promo code'::TEXT;
  ELSE
    RETURN QUERY SELECT true, promo_record.discount_type, promo_record.discount_value, 'Valid promo code'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to apply promo code
CREATE OR REPLACE FUNCTION apply_promo_code(order_id UUID, promo_code TEXT)
RETURNS TABLE(
  success BOOLEAN,
  discount_amount DECIMAL(10,2),
  message TEXT
) AS $$
DECLARE
  promo_record RECORD;
  order_record RECORD;
  discount_amount DECIMAL(10,2) := 0;
BEGIN
  -- Get promo code details
  SELECT * INTO promo_record FROM promo_codes WHERE code = $2 AND is_active = true;
  
  -- Get order details
  SELECT * INTO order_record FROM orders WHERE id = $1;
  
  IF promo_record IS NULL THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Invalid promo code'::TEXT;
  ELSIF order_record IS NULL THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Invalid order'::TEXT;
  ELSE
    -- Calculate discount
    IF promo_record.discount_type = 'percentage' THEN
      discount_amount := order_record.total * (promo_record.discount_value / 100);
    ELSE
      discount_amount := promo_record.discount_value;
    END IF;
    
    -- Update order with promo discount
    UPDATE orders SET 
      promo_code = $2,
      promo_discount = discount_amount,
      total = total - discount_amount
    WHERE id = $1;
    
    -- Increment promo code usage
    UPDATE promo_codes SET used_count = used_count + 1 WHERE code = $2;
    
    RETURN QUERY SELECT true, discount_amount, 'Promo code applied successfully'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE TRIGGERS
-- =====================================================

-- Trigger to update customer stats when order is created
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or create customer record
  INSERT INTO customers (email, phone, first_name, last_name, address, total_orders, total_spent, first_order_date, last_order_date)
  VALUES (
    NEW.customer_email,
    NEW.customer_phone,
    SPLIT_PART(NEW.customer_name, ' ', 1),
    SPLIT_PART(NEW.customer_name, ' ', 2),
    NEW.address,
    1,
    NEW.total,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    total_orders = customers.total_orders + 1,
    total_spent = customers.total_spent + NEW.total,
    last_order_date = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customer stats
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- =====================================================
-- 8. SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample promo codes
INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, valid_until) VALUES 
  ('WELCOME10', 'percentage', 10.00, 100, NOW() + INTERVAL '1 year'),
  ('FIRST20', 'fixed', 20.00, 50, NOW() + INTERVAL '6 months'),
  ('CLEAN15', 'percentage', 15.00, 200, NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- MISSING SCHEMA ELEMENTS COMPLETE
-- ===================================================== 