-- =====================================================
-- GO GO BUBBLES - FINALIZED SUPABASE SCHEMA
-- =====================================================

-- =====================================================
-- 1. CORE TABLES (FINALIZED SCHEMA)
-- =====================================================

-- Admin table
CREATE TABLE public.admin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text DEFAULT 'admin'::text,
  can_manage_devices boolean DEFAULT true,
  can_approve_apps boolean DEFAULT true,
  status text DEFAULT 'active'::text,
  last_login_at timestamp without time zone,
  last_login_ip text,
  last_login_device text,
  notifications_enabled boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT admin_pkey PRIMARY KEY (id)
);

-- Admin notes table
CREATE TABLE public.admin_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  related_entity text NOT NULL,
  related_id uuid DEFAULT gen_random_uuid(),
  note text,
  created_by text,
  created_at timestamp without time zone,
  follow_up_status text,
  CONSTRAINT admin_notes_pkey PRIMARY KEY (id)
);

-- Applications table
CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  address text,
  role_applied_for text CHECK (role_applied_for = ANY (ARRAY['Shine Bubbler'::text, 'Sparkle Bubbler'::text, 'Fresh Bubbler'::text, 'Elite Bubbler'::text])),
  authorized_to_work boolean NOT NULL,
  age_verified boolean NOT NULL,
  has_transportation boolean NOT NULL,
  willing_to_rent_equipment boolean,
  has_water_supply boolean,
  has_power_source boolean,
  has_mop boolean DEFAULT false,
  has_toilet_brush boolean DEFAULT false,
  has_all_purpose_cleaner boolean DEFAULT false,
  has_glass_cleaner boolean DEFAULT false,
  has_broom_dustpan boolean DEFAULT false,
  has_bathroom_cleaner boolean DEFAULT false,
  has_cleaning_cloths boolean DEFAULT false,
  has_sponges boolean DEFAULT false,
  has_bucket boolean DEFAULT false,
  has_towels boolean DEFAULT false,
  has_soap boolean DEFAULT false,
  has_pressure_washer boolean DEFAULT false,
  speaks_spanish boolean,
  spanish_proficiency text,
  primary_language text,
  english_comfort_level text,
  travel_radius_minutes text,
  disqualified boolean DEFAULT false,
  disqualification_reason text,
  equipment_verified boolean DEFAULT false,
  application_status text DEFAULT 'Pending'::text CHECK (application_status = ANY (ARRAY['Pending'::text, 'Approved'::text, 'Declined'::text, 'Waitlisted'::text])),
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  last_name text,
  speaks_spanish_proficiency text,
  equipment_ready text,
  CONSTRAINT applications_pkey PRIMARY KEY (id)
);

-- Bubblers table
CREATE TABLE public.bubblers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  email text,
  phone text,
  role text DEFAULT 'NULL'::text,
  password_hash text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  last_login_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  notes text,
  travel_radius_minutes text,
  home_location double precision,
  travel_notes text,
  travel_badge text,
  address text,
  last_name text,
  approved_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  equipment_verified boolean,
  language_primary text,
  speaks_english text,
  speaks_spanish text,
  application_id uuid DEFAULT gen_random_uuid(),
  english_comfort_level text,
  application_status text,
  role_id integer,
  auth_id uuid DEFAULT gen_random_uuid(),
  CONSTRAINT bubblers_pkey PRIMARY KEY (id),
  CONSTRAINT bubblers_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);

-- Device fingerprints table
CREATE TABLE public.device_fingerprints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bubbler_id uuid,
  device_fingerprint text NOT NULL,
  bound_at timestamp without time zone DEFAULT now(),
  last_used timestamp without time zone,
  is_active boolean DEFAULT true,
  device_type text,
  ip_address text,
  device_change_count integer,
  CONSTRAINT device_fingerprints_pkey PRIMARY KEY (id),
  CONSTRAINT device_fingerprints_bubbler_id_fkey FOREIGN KEY (bubbler_id) REFERENCES public.bubblers(id)
);

-- Equipment table
CREATE TABLE public.equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  serial_number text,
  condition text,
  status text,
  assigned_to_bubbler uuid DEFAULT gen_random_uuid(),
  rental_start_date timestamp without time zone,
  rental_due_date timestamp without time zone,
  rental_return_date timestamp without time zone,
  notes text,
  created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT equipment_pkey PRIMARY KEY (id),
  CONSTRAINT equipment_assigned_to_bubbler_fkey FOREIGN KEY (assigned_to_bubbler) REFERENCES public.bubblers(id)
);

-- Job assignments table
CREATE TABLE public.job_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_service_id uuid NOT NULL DEFAULT gen_random_uuid(),
  bubbler_id uuid DEFAULT gen_random_uuid(),
  assigned_at timestamp without time zone,
  declined_at timestamp without time zone,
  status text,
  notes text,
  created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  estimated_payout numeric,
  completion_photos jsonb,
  pickup_photo jsonb,
  delivery_photo jsonb,
  qr_code_scan jsonb,
  perks_applied jsonb,
  offer_sent_at timestamp without time zone,
  offer_expiration_at timestamp without time zone,
  auto_reassigned boolean,
  reassignment_reason text,
  response_status text,
  notification_attempts bigint,
  last_notified_at timestamp without time zone,
  started_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  expected_duration_minutes bigint,
  ended_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  job_time_status text,
  late_flag boolean,
  duration_actual_mintues bigint,
  CONSTRAINT job_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT Job_Assignments_order_service_id_fkey FOREIGN KEY (order_service_id) REFERENCES public.order_service(id),
  CONSTRAINT Job_Assignments_bubbler_id_fkey FOREIGN KEY (bubbler_id) REFERENCES public.bubblers(id)
);

-- Job status history table
CREATE TABLE public.job_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_assignment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text,
  changed_by text,
  timestamp timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  notes text,
  job_id uuid DEFAULT gen_random_uuid(),
  CONSTRAINT job_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT job_status_history_job_assignment_id_fkey FOREIGN KEY (job_assignment_id) REFERENCES public.job_assignments(id)
);

-- Messages table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_assignment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid DEFAULT gen_random_uuid(),
  sender_role text,
  message_body text,
  sent_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  read_at timestamp without time zone,
  attachments jsonb,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_job_assignment_id_fkey FOREIGN KEY (job_assignment_id) REFERENCES public.job_assignments(id)
);

-- Order cleaning details table
CREATE TABLE public.order_cleaning_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_service_id uuid NOT NULL DEFAULT gen_random_uuid(),
  bedrooms_count integer,
  bathrooms_count integer,
  additional_bedrooms_count integer,
  additional_bathrooms_count integer,
  deep_clean_bedrooms_count integer,
  adding jsonb,
  estimated_price numeric,
  estimate_payout numeric,
  notes text,
  created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT order_cleaning_details_pkey PRIMARY KEY (id),
  CONSTRAINT order_cleaning_details_order_service_id_fkey FOREIGN KEY (order_service_id) REFERENCES public.order_service(id)
);

-- Order laundry bags table
CREATE TABLE public.order_laundry_bags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_service_id uuid NOT NULL DEFAULT gen_random_uuid(),
  bag_type text,
  quantity integer,
  estimated_price numeric,
  estimated_payout numeric,
  notes text,
  created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  order_id uuid DEFAULT gen_random_uuid(),
  is_first_time boolean,
  CONSTRAINT order_laundry_bags_pkey PRIMARY KEY (id),
  CONSTRAINT order_laundry_bags_order_service_id_fkey FOREIGN KEY (order_service_id) REFERENCES public.order_service(id),
  CONSTRAINT order_laundry_bags_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

-- Order service table
CREATE TABLE public.order_service (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_type text DEFAULT 'NULL'::text,
  tier text,
  vehicle_type text,
  bedrooms numeric,
  bathrooms numeric,
  bags json,
  addons json,
  status text,
  schedule_time timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  price_estimated numeric,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT order_service_pkey PRIMARY KEY (id),
  CONSTRAINT Order_service_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

-- Order vehicles table
CREATE TABLE public.order_vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_service_id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_type text,
  tier text,
  addons jsonb,
  estimated_price numeric,
  estimated_payout numeric,
  created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  order_id uuid DEFAULT gen_random_uuid(),
  CONSTRAINT order_vehicles_pkey PRIMARY KEY (id),
  CONSTRAINT order_vehicles_order_service_id_fkey FOREIGN KEY (order_service_id) REFERENCES public.order_service(id),
  CONSTRAINT order_vehicles_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

-- Orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  address text,
  schedule_date timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  schedule_window text,
  promo_code text,
  deposit_amount numeric,
  balance_due numeric,
  notes text,
  order_status text DEFAULT 'NULL'::text,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- Payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_type text,
  amount numeric,
  payment_status text,
  transaction_id text,
  payment_method text,
  created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT Payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

-- Payouts table
CREATE TABLE public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_assignment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  bubbler_id uuid DEFAULT gen_random_uuid(),
  amount numeric,
  payout_status text,
  transaction_id text,
  schedule_at timestamp without time zone,
  paid_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT payouts_pkey PRIMARY KEY (id),
  CONSTRAINT Payouts_bubbler_id_fkey FOREIGN KEY (bubbler_id) REFERENCES public.bubblers(id),
  CONSTRAINT Payouts_job_assignment_id_fkey FOREIGN KEY (job_assignment_id) REFERENCES public.job_assignments(id)
);

-- Perk tracker table
CREATE TABLE public.perk_tracker (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  customer_phone numeric,
  perk_type text,
  perk_triggered_at timestamp with time zone,
  perk_redeemed_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  eligible boolean,
  order_id uuid DEFAULT gen_random_uuid(),
  bubbler_id uuid DEFAULT gen_random_uuid(),
  job_assignment_id uuid DEFAULT gen_random_uuid(),
  CONSTRAINT perk_tracker_pkey PRIMARY KEY (id),
  CONSTRAINT perk_tracker_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT perk_tracker_job_assignment_id_fkey FOREIGN KEY (job_assignment_id) REFERENCES public.job_assignments(id),
  CONSTRAINT perk_tracker_bubbler_id_fkey FOREIGN KEY (bubbler_id) REFERENCES public.bubblers(id)
);

-- Pricing rules table
CREATE TABLE public.pricing_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_type text NOT NULL,
  tier text,
  vehicle_type text,
  bag_type text,
  addon_key text,
  description text,
  base_price numeric,
  payout numeric,
  extra_unit_price numeric,
  extra_unit_payout numeric,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT pricing_rules_pkey PRIMARY KEY (id)
);

-- Ratings table
CREATE TABLE public.ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bubbler_id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_assignment_id uuid DEFAULT gen_random_uuid(),
  rating integer,
  review text,
  created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT ratings_pkey PRIMARY KEY (id),
  CONSTRAINT bubbler_ratings_job_assignment_id_fkey FOREIGN KEY (job_assignment_id) REFERENCES public.job_assignments(id)
);

-- Roles table
CREATE TABLE public.roles (
  id integer NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  description text,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- Standby rules table
CREATE TABLE public.standby_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hours_before numeric,
  payout_amount numeric,
  description text,
  created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT standby_rules_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 2. SEQUENCES
-- =====================================================

-- Create roles sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Admin indexes
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);
CREATE INDEX IF NOT EXISTS idx_admin_status ON admin(status);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(application_status);
CREATE INDEX IF NOT EXISTS idx_applications_role ON applications(role_applied_for);

-- Bubblers indexes
CREATE INDEX IF NOT EXISTS idx_bubblers_email ON bubblers(email);
CREATE INDEX IF NOT EXISTS idx_bubblers_role ON bubblers(role);
CREATE INDEX IF NOT EXISTS idx_bubblers_status ON bubblers(is_active);

-- Device fingerprints indexes
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_bubbler_id ON device_fingerprints(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_active ON device_fingerprints(is_active);

-- Equipment indexes
CREATE INDEX IF NOT EXISTS idx_equipment_assigned_to ON equipment(assigned_to_bubbler);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);

-- Job assignments indexes
CREATE INDEX IF NOT EXISTS idx_job_assignments_bubbler_id ON job_assignments(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_status ON job_assignments(status);
CREATE INDEX IF NOT EXISTS idx_job_assignments_order_service_id ON job_assignments(order_service_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_job_assignment_id ON messages(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order service indexes
CREATE INDEX IF NOT EXISTS idx_order_service_order_id ON order_service(order_id);
CREATE INDEX IF NOT EXISTS idx_order_service_type ON order_service(service_type);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- Payouts indexes
CREATE INDEX IF NOT EXISTS idx_payouts_bubbler_id ON payouts(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(payout_status);

-- Perk tracker indexes
CREATE INDEX IF NOT EXISTS idx_perk_tracker_customer_email ON perk_tracker(customer_email);
CREATE INDEX IF NOT EXISTS idx_perk_tracker_eligible ON perk_tracker(eligible);

-- Pricing rules indexes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_service_type ON pricing_rules(service_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(active);

-- Ratings indexes
CREATE INDEX IF NOT EXISTS idx_ratings_bubbler_id ON ratings(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_ratings_job_assignment_id ON ratings(job_assignment_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubblers ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_cleaning_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_laundry_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE perk_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE standby_rules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. SAFE VIEWS FOR DATA ACCESS
-- =====================================================

-- Safe order view for customers (booking form)
CREATE OR REPLACE VIEW customer_orders_view AS
SELECT 
  id,
  customer_name,
  customer_phone,
  customer_email,
  order_status,
  schedule_date,
  schedule_window,
  deposit_amount,
  balance_due,
  notes,
  created_at
FROM orders
WHERE customer_email = auth.uid()::text;

-- Safe perk tracker view for customers (booking form)
CREATE OR REPLACE VIEW customer_perks_view AS
SELECT 
  id,
  customer_email,
  perk_type,
  perk_triggered_at,
  eligible,
  order_id
FROM perk_tracker
WHERE customer_email = auth.uid()::text AND eligible = true;

-- Safe job assignments view for bubblers
CREATE OR REPLACE VIEW bubbler_jobs_view AS
SELECT 
  ja.id,
  ja.order_service_id,
  ja.bubbler_id,
  ja.status,
  ja.estimated_payout,
  ja.assigned_at,
  ja.started_at,
  ja.ended_at,
  ja.expected_duration_minutes,
  ja.duration_actual_mintues,
  ja.job_time_status,
  ja.late_flag,
  os.service_type,
  os.tier,
  o.customer_name,
  o.customer_phone,
  o.address
FROM job_assignments ja
INNER JOIN order_service os ON ja.order_service_id = os.id
INNER JOIN orders o ON os.order_id = o.id
WHERE ja.bubbler_id = auth.uid();

-- Safe equipment view for bubblers
CREATE OR REPLACE VIEW bubbler_equipment_view AS
SELECT 
  id,
  name,
  description,
  serial_number,
  condition,
  status,
  assigned_to_bubbler,
  rental_start_date,
  rental_due_date,
  rental_return_date,
  notes,
  created_at,
  updated_at
FROM equipment
WHERE assigned_to_bubbler = auth.uid();

-- Safe payouts view for bubblers
CREATE OR REPLACE VIEW bubbler_payouts_view AS
SELECT 
  id,
  job_assignment_id,
  bubbler_id,
  amount,
  payout_status,
  transaction_id,
  schedule_at,
  paid_at,
  created_at,
  updated_at
FROM payouts
WHERE bubbler_id = auth.uid();

-- Safe messages view for internal dashboard
CREATE OR REPLACE VIEW internal_messages_view AS
SELECT 
  id,
  job_assignment_id,
  sender_id,
  sender_role,
  message_body,
  sent_at,
  read_at,
  attachments
FROM messages
WHERE sender_id = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM job_assignments ja 
        WHERE ja.id = messages.job_assignment_id 
        AND ja.bubbler_id = auth.uid()
      );

-- Safe applications view for admins
CREATE OR REPLACE VIEW admin_applications_view AS
SELECT 
  id,
  first_name,
  last_name,
  phone,
  email,
  address,
  role_applied_for,
  application_status,
  created_at,
  admin_notes
FROM applications
WHERE EXISTS (
  SELECT 1 FROM admin 
  WHERE admin.id = auth.uid()
);

-- Safe bubblers view for admins
CREATE OR REPLACE VIEW admin_bubblers_view AS
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  role,
  is_active,
  created_at,
  last_login_at,
  notes
FROM bubblers
WHERE EXISTS (
  SELECT 1 FROM admin 
  WHERE admin.id = auth.uid()
);

-- Safe payments view for admins
CREATE OR REPLACE VIEW admin_payments_view AS
SELECT 
  p.id,
  p.order_id,
  p.payment_type,
  p.amount,
  p.payment_status,
  p.transaction_id,
  p.payment_method,
  p.created_at,
  o.customer_name,
  o.customer_email
FROM payments p
INNER JOIN orders o ON p.order_id = o.id
WHERE EXISTS (
  SELECT 1 FROM admin 
  WHERE admin.id = auth.uid()
);

-- =====================================================
-- 6. BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Property type multiplier function
CREATE OR REPLACE FUNCTION get_property_type_multiplier(property_type TEXT)
RETURNS DECIMAL(3,2) AS $$
BEGIN
  RETURN CASE property_type
    WHEN 'Apartment/Loft' THEN 1.00
    WHEN 'Condo/Townhouse' THEN 1.10
    WHEN 'House' THEN 1.15
    ELSE 1.00
  END;
END;
$$ LANGUAGE plpgsql;

-- Pet multiplier function
CREATE OR REPLACE FUNCTION get_pet_multiplier(has_pets BOOLEAN)
RETURNS DECIMAL(3,2) AS $$
BEGIN
  RETURN CASE WHEN has_pets THEN 1.10 ELSE 1.00 END;
END;
$$ LANGUAGE plpgsql;

-- Add-on duration calculator
CREATE OR REPLACE FUNCTION calculate_addon_duration(addons JSONB)
RETURNS INTEGER AS $$
DECLARE
  total_duration INTEGER := 0;
  addon_name TEXT;
  addon_duration INTEGER;
BEGIN
  -- Define add-on durations
  FOR addon_name IN SELECT jsonb_object_keys(addons)
  LOOP
    addon_duration := CASE addon_name
      WHEN 'cleankitchen' THEN 30
      WHEN 'stovetop' THEN 15
      WHEN 'ecofriendly' THEN 0
      WHEN 'deepdusting' THEN 45
      WHEN 'deepbedroom' THEN 60
      WHEN 'fridgecleaning' THEN 30
      WHEN 'ovencleaning' THEN 45
      WHEN 'freezercleaning' THEN 20
      WHEN 'cabinetcleaning' THEN 30
      WHEN 'steammopping' THEN 30
      ELSE 0
    END;
    
    total_duration := total_duration + addon_duration;
  END LOOP;
  
  RETURN total_duration;
END;
$$ LANGUAGE plpgsql;

-- Home cleaning duration calculator
CREATE OR REPLACE FUNCTION calculate_home_cleaning_duration(
  tier TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  property_type TEXT,
  addons JSONB
)
RETURNS INTEGER AS $$
DECLARE
  base_duration INTEGER;
  room_duration INTEGER;
  addon_duration INTEGER;
  property_multiplier DECIMAL(3,2);
  total_duration INTEGER;
BEGIN
  -- Base duration by tier
  base_duration := CASE tier
    WHEN 'refreshed' THEN 120  -- 2 hours
    WHEN 'deep' THEN 180       -- 3 hours
    ELSE 120
  END;
  
  -- Room duration (30 min per additional room)
  room_duration := (GREATEST(bedrooms - 1, 0) + GREATEST(bathrooms - 1, 0)) * 30;
  
  -- Add-on duration
  addon_duration := calculate_addon_duration(addons);
  
  -- Property type multiplier
  property_multiplier := get_property_type_multiplier(property_type);
  
  -- Calculate total duration
  total_duration := ROUND((base_duration + room_duration + addon_duration) * property_multiplier);
  
  RETURN total_duration;
END;
$$ LANGUAGE plpgsql;

-- Home cleaning price calculator
CREATE OR REPLACE FUNCTION calculate_home_cleaning_price(
  tier TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  property_type TEXT,
  has_pets BOOLEAN,
  addons JSONB
)
RETURNS TABLE(
  base_price DECIMAL(10,2),
  room_price DECIMAL(10,2),
  addon_price DECIMAL(10,2),
  property_multiplier DECIMAL(3,2),
  pet_multiplier DECIMAL(3,2),
  dual_bubbler_surcharge DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total_price DECIMAL(10,2),
  estimated_duration INTEGER,
  dual_bubbler_required BOOLEAN
) AS $$
DECLARE
  base_price DECIMAL(10,2);
  room_price DECIMAL(10,2);
  addon_price DECIMAL(10,2);
  property_mult DECIMAL(3,2);
  pet_mult DECIMAL(3,2);
  dual_surcharge DECIMAL(10,2);
  subtotal DECIMAL(10,2);
  tax_amount DECIMAL(10,2);
  total_price DECIMAL(10,2);
  duration INTEGER;
  dual_required BOOLEAN;
  room_count INTEGER;
  room_rate DECIMAL(10,2);
BEGIN
  -- Base price by tier
  base_price := CASE tier
    WHEN 'refreshed' THEN 90.00
    WHEN 'deep' THEN 130.00
    ELSE 90.00
  END;
  
  -- Room pricing
  room_count := GREATEST(bedrooms - 1, 0) + GREATEST(bathrooms - 1, 0);
  room_rate := CASE 
    WHEN bedrooms >= 4 OR bathrooms >= 3 THEN 25.00  -- Large property rate
    ELSE 15.00  -- Standard rate
  END;
  room_price := room_count * room_rate;
  
  -- Add-on pricing
  addon_price := CASE 
    WHEN addons ? 'cleankitchen' THEN 30.00 ELSE 0.00 END +
    CASE WHEN addons ? 'stovetop' THEN 15.00 ELSE 0.00 END +
    CASE WHEN addons ? 'ecofriendly' THEN 10.00 ELSE 0.00 END +
    CASE WHEN addons ? 'deepdusting' THEN 25.00 ELSE 0.00 END +
    CASE WHEN addons ? 'deepbedroom' THEN 25.00 ELSE 0.00 END +
    CASE WHEN addons ? 'fridgecleaning' THEN 30.00 ELSE 0.00 END +
    CASE WHEN addons ? 'ovencleaning' THEN 30.00 ELSE 0.00 END +
    CASE WHEN addons ? 'freezercleaning' THEN 15.00 ELSE 0.00 END +
    CASE WHEN addons ? 'cabinetcleaning' THEN 15.00 ELSE 0.00 END +
    CASE WHEN addons ? 'steammopping' THEN 15.00 ELSE 0.00 END;
  
  -- Multipliers
  property_mult := get_property_type_multiplier(property_type);
  pet_mult := get_pet_multiplier(has_pets);
  
  -- Calculate subtotal
  subtotal := (base_price + room_price + addon_price) * property_mult * pet_mult;
  
  -- Calculate duration
  duration := calculate_home_cleaning_duration(tier, bedrooms, bathrooms, property_type, addons);
  
  -- Dual bubbler logic
  dual_required := duration > 300;  -- 5 hours
  dual_surcharge := CASE WHEN dual_required THEN subtotal * 0.10 ELSE 0.00 END;
  
  -- Final calculations
  subtotal := subtotal + dual_surcharge;
  tax_amount := subtotal * 0.0825;  -- 8.25% tax
  total_price := subtotal + tax_amount;
  
  RETURN QUERY SELECT 
    base_price,
    room_price,
    addon_price,
    property_mult,
    pet_mult,
    dual_surcharge,
    subtotal,
    tax_amount,
    total_price,
    duration,
    dual_required;
END;
$$ LANGUAGE plpgsql;

-- Bubbler payout calculator
CREATE OR REPLACE FUNCTION calculate_bubbler_payout(
  service_type TEXT,
  tier TEXT,
  addons JSONB,
  property_type TEXT,
  has_pets BOOLEAN,
  is_dual_bubbler BOOLEAN,
  is_lead_bubbler BOOLEAN,
  is_standby_bonus BOOLEAN
)
RETURNS TABLE(
  base_payout DECIMAL(10,2),
  addon_payout DECIMAL(10,2),
  pet_bonus DECIMAL(10,2),
  dual_bubbler_bonus DECIMAL(10,2),
  lead_bubbler_bonus DECIMAL(10,2),
  standby_bonus DECIMAL(10,2),
  total_payout DECIMAL(10,2)
) AS $$
DECLARE
  base_payout DECIMAL(10,2);
  addon_payout DECIMAL(10,2) := 0;
  pet_bonus DECIMAL(10,2) := 0;
  dual_bubbler_bonus DECIMAL(10,2) := 0;
  lead_bubbler_bonus DECIMAL(10,2) := 0;
  standby_bonus DECIMAL(10,2) := 0;
  total_payout DECIMAL(10,2);
  addon_name TEXT;
BEGIN
  -- Base payout by service and tier
  base_payout := CASE service_type
    WHEN 'Home Cleaning' THEN
      CASE tier
        WHEN 'refreshed' THEN 45.00
        WHEN 'deep' THEN 60.00
        ELSE 45.00
      END
    WHEN 'Mobile Car Wash' THEN
      CASE tier
        WHEN 'express' THEN 25.00
        WHEN 'signature' THEN 35.00
        WHEN 'supreme' THEN 45.00
        ELSE 25.00
      END
    WHEN 'Laundry Service' THEN 30.00
    ELSE 25.00
  END;
  
  -- Add-on payouts
  IF addons IS NOT NULL THEN
    FOR addon_name IN SELECT jsonb_object_keys(addons)
    LOOP
      addon_payout := addon_payout + CASE addon_name
        WHEN 'cleankitchen' THEN 12.00
        WHEN 'stovetop' THEN 6.00
        WHEN 'ecofriendly' THEN 4.00
        WHEN 'deepdusting' THEN 10.00
        WHEN 'deepbedroom' THEN 15.00
        WHEN 'fridgecleaning' THEN 12.00
        WHEN 'ovencleaning' THEN 15.00
        WHEN 'freezercleaning' THEN 8.00
        WHEN 'cabinetcleaning' THEN 10.00
        WHEN 'steammopping' THEN 8.00
        WHEN 'clay' THEN 15.00
        WHEN 'bug' THEN 10.00
        WHEN 'plastic' THEN 8.00
        WHEN 'tireshine' THEN 5.00
        WHEN 'upholstery' THEN 20.00
        WHEN 'shampoo' THEN 25.00
        WHEN 'eco' THEN 2.00
        WHEN 'sameday' THEN 5.00
        ELSE 0.00
      END;
    END LOOP;
  END IF;
  
  -- Pet bonus (10% on room cleaning tasks only)
  IF has_pets AND service_type = 'Home Cleaning' THEN
    pet_bonus := (base_payout + addon_payout) * 0.10;
  END IF;
  
  -- Dual bubbler bonus (10% for coordination)
  IF is_dual_bubbler THEN
    dual_bubbler_bonus := (base_payout + addon_payout) * 0.10;
  END IF;
  
  -- Lead bubbler bonus (varies by job total)
  IF is_lead_bubbler THEN
    lead_bubbler_bonus := CASE 
      WHEN base_payout + addon_payout >= 100 THEN 15.00
      WHEN base_payout + addon_payout >= 75 THEN 10.00
      WHEN base_payout + addon_payout >= 50 THEN 8.00
      ELSE 5.00
    END;
  END IF;
  
  -- Standby bonus
  IF is_standby_bonus THEN
    standby_bonus := 20.00;
  END IF;
  
  -- Total payout
  total_payout := base_payout + addon_payout + pet_bonus + dual_bubbler_bonus + lead_bubbler_bonus + standby_bonus;
  
  RETURN QUERY SELECT 
    base_payout,
    addon_payout,
    pet_bonus,
    dual_bubbler_bonus,
    lead_bubbler_bonus,
    standby_bonus,
    total_payout;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. DATABASE TRIGGERS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_bubblers_updated_at 
  BEFORE UPDATE ON bubblers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at 
  BEFORE UPDATE ON equipment 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_service_updated_at 
  BEFORE UPDATE ON order_service 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_cleaning_details_updated_at 
  BEFORE UPDATE ON order_cleaning_details 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_laundry_bags_updated_at 
  BEFORE UPDATE ON order_laundry_bags 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_vehicles_updated_at 
  BEFORE UPDATE ON order_vehicles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at 
  BEFORE UPDATE ON payouts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at 
  BEFORE UPDATE ON pricing_rules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. SAMPLE DATA INSERTION (OPTIONAL)
-- =====================================================

-- Insert sample roles
INSERT INTO roles (name, description) VALUES 
  ('admin', 'System administrator'),
  ('support', 'Customer support'),
  ('bubbler', 'Service provider'),
  ('lead_bubbler', 'Lead service provider')
ON CONFLICT (name) DO NOTHING;

-- Insert sample admin
INSERT INTO admin (full_name, email, password_hash, role) VALUES 
  ('System Admin', 'admin@gogobubbles.com', 'hashed_password_here', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Test home cleaning price calculation
SELECT * FROM calculate_home_cleaning_price(
  'refreshed', 
  2, 
  1, 
  'Apartment/Loft', 
  false, 
  '{"cleankitchen": true}'::jsonb
);

-- Test bubbler payout calculation
SELECT * FROM calculate_bubbler_payout(
  'Home Cleaning',
  'refreshed',
  '{"cleankitchen": true}'::jsonb,
  'Apartment/Loft',
  false,
  false,
  false,
  false
);

-- =====================================================
-- FINALIZED SCHEMA COMPLETE
-- ===================================================== 