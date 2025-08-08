-- =====================================================
-- GO GO BUBBLES - COMPLETE SUPABASE SQL IMPLEMENTATION
-- =====================================================

-- =====================================================
-- 1. ADDITIONAL TABLES NEEDED
-- =====================================================

-- Order vehicles table for car wash bookings
CREATE TABLE order_vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  vehicle_type TEXT NOT NULL,
  tier TEXT NOT NULL,
  addons JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order laundry bags table for laundry service
CREATE TABLE order_laundry_bags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  bag_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  is_first_time BOOLEAN DEFAULT false,
  qr_code TEXT,
  addons JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job status history for audit trail
CREATE TABLE job_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES job_assignments(id),
  status TEXT NOT NULL,
  changed_by UUID REFERENCES bubblers(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. BUSINESS LOGIC FUNCTIONS
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

-- Laundry bag pricing function
CREATE OR REPLACE FUNCTION calculate_laundry_price(
  bag_type TEXT,
  quantity INTEGER,
  is_first_time BOOLEAN,
  addons JSONB
)
RETURNS TABLE(
  bag_price DECIMAL(10,2),
  kit_cost DECIMAL(10,2),
  addon_cost DECIMAL(10,2),
  total_price DECIMAL(10,2)
) AS $$
DECLARE
  bag_price DECIMAL(10,2);
  kit_cost DECIMAL(10,2);
  addon_cost DECIMAL(10,2);
  total_price DECIMAL(10,2);
BEGIN
  -- Bag pricing
  bag_price := CASE bag_type
    WHEN 'essentials' THEN 35.00
    WHEN 'family' THEN 55.00
    WHEN 'delicates' THEN 25.00
    WHEN 'ironing' THEN 35.00
    ELSE 35.00
  END * quantity;
  
  -- Kit cost for first-time customers
  kit_cost := CASE 
    WHEN is_first_time THEN 
      CASE bag_type
        WHEN 'essentials' THEN 8.00
        WHEN 'family' THEN 12.00
        WHEN 'delicates' THEN 6.00
        WHEN 'ironing' THEN 10.00
        ELSE 8.00
      END * quantity
    ELSE 0.00
  END;
  
  -- Add-on costs
  addon_cost := CASE 
    WHEN addons ? 'eco' THEN 5.00 * quantity ELSE 0.00 END +
    CASE WHEN addons ? 'sameday' THEN 15.00 * quantity ELSE 0.00 END;
  
  total_price := bag_price + kit_cost + addon_cost;
  
  RETURN QUERY SELECT 
    bag_price,
    kit_cost,
    addon_cost,
    total_price;
END;
$$ LANGUAGE plpgsql;

-- Laundry QR code generator
CREATE OR REPLACE FUNCTION generate_laundry_qr_code(order_id UUID, bag_type TEXT, bag_number INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN 'LAUNDRY-' || order_id::text || '-' || bag_type || '-' || bag_number::text;
END;
$$ LANGUAGE plpgsql;

-- Car wash pricing function
CREATE OR REPLACE FUNCTION calculate_car_wash_price(
  vehicles JSONB
)
RETURNS TABLE(
  base_price DECIMAL(10,2),
  addon_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total_price DECIMAL(10,2)
) AS $$
DECLARE
  base_price DECIMAL(10,2) := 0;
  addon_price DECIMAL(10,2) := 0;
  discount_amount DECIMAL(10,2) := 0;
  subtotal DECIMAL(10,2);
  tax_amount DECIMAL(10,2);
  total_price DECIMAL(10,2);
  vehicle_count INTEGER;
  signature_count INTEGER;
  supreme_count INTEGER;
  vehicle JSONB;
  vehicle_price DECIMAL(10,2);
  vehicle_addons JSONB;
  addon_name TEXT;
BEGIN
  -- Count vehicles and premium tiers
  vehicle_count := jsonb_array_length(vehicles);
  signature_count := 0;
  supreme_count := 0;
  
  -- Calculate base price for each vehicle
  FOR i IN 0..vehicle_count-1 LOOP
    vehicle := vehicles->i;
    vehicle_price := CASE (vehicle->>'type') || '_' || (vehicle->>'tier')
      WHEN 'car_express' THEN 35.00
      WHEN 'car_signature' THEN 55.00
      WHEN 'car_supreme' THEN 75.00
      WHEN 'suv_express' THEN 45.00
      WHEN 'suv_signature' THEN 65.00
      WHEN 'suv_supreme' THEN 85.00
      WHEN 'truck_express' THEN 50.00
      WHEN 'truck_signature' THEN 70.00
      WHEN 'truck_supreme' THEN 90.00
      WHEN 'minivan_express' THEN 50.00
      WHEN 'minivan_signature' THEN 70.00
      WHEN 'minivan_supreme' THEN 90.00
      ELSE 35.00
    END;
    
    base_price := base_price + vehicle_price;
    
    -- Count premium tiers for discount
    IF vehicle->>'tier' = 'signature' THEN
      signature_count := signature_count + 1;
    ELSIF vehicle->>'tier' = 'supreme' THEN
      supreme_count := supreme_count + 1;
    END IF;
    
    -- Calculate add-ons for this vehicle
    vehicle_addons := vehicle->'addons';
    IF vehicle_addons IS NOT NULL THEN
      FOR addon_name IN SELECT jsonb_array_elements_text(vehicle_addons)
      LOOP
        addon_price := addon_price + CASE addon_name
          WHEN 'clay' THEN 25.00
          WHEN 'bug' THEN 20.00
          WHEN 'plastic' THEN 18.00
          WHEN 'tireshine' THEN 10.00
          WHEN 'upholstery' THEN 40.00
          WHEN 'shampoo' THEN 50.00
          ELSE 0.00
        END;
      END LOOP;
    END IF;
  END LOOP;
  
  -- Calculate discount
  IF signature_count + supreme_count >= 3 THEN
    discount_amount := (base_price + addon_price) * 0.10;  -- 10% off
  ELSIF signature_count + supreme_count >= 2 THEN
    discount_amount := (base_price + addon_price) * 0.05;  -- 5% off
  END IF;
  
  -- Final calculations
  subtotal := base_price + addon_price - discount_amount;
  tax_amount := subtotal * 0.0825;
  total_price := subtotal + tax_amount;
  
  RETURN QUERY SELECT 
    base_price,
    addon_price,
    discount_amount,
    subtotal,
    tax_amount,
    total_price;
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
-- 3. DATABASE TRIGGERS
-- =====================================================

-- Order price calculation trigger
CREATE OR REPLACE FUNCTION calculate_order_price_trigger()
RETURNS TRIGGER AS $$
DECLARE
  price_result RECORD;
  duration_result RECORD;
BEGIN
  -- Calculate price based on service type
  IF NEW.service_type = 'Home Cleaning' THEN
    SELECT * INTO price_result FROM calculate_home_cleaning_price(
      NEW.tier,
      (NEW.services->>'bedrooms')::INTEGER,
      (NEW.services->>'bathrooms')::INTEGER,
      NEW.services->>'propertyType',
      (NEW.services->>'hasPets')::BOOLEAN,
      NEW.services->'addons'
    );
    
    NEW.subtotal := price_result.subtotal;
    NEW.total := price_result.total_price;
    NEW.estimated_duration := price_result.estimated_duration;
    NEW.dual_bubbler_required := price_result.dual_bubbler_required;
    
  ELSIF NEW.service_type = 'Mobile Car Wash' THEN
    SELECT * INTO price_result FROM calculate_car_wash_price(NEW.services->'vehicles');
    
    NEW.subtotal := price_result.subtotal;
    NEW.total := price_result.total_price;
    
  ELSIF NEW.service_type = 'Laundry Service' THEN
    -- Laundry pricing handled in application logic
    -- This would need to be calculated before insert
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order price calculation
CREATE TRIGGER order_price_calculation
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_price_trigger();

-- Job payout calculation trigger
CREATE OR REPLACE FUNCTION calculate_job_payout_trigger()
RETURNS TRIGGER AS $$
DECLARE
  payout_result RECORD;
  order_data RECORD;
BEGIN
  -- Get order details
  SELECT * INTO order_data FROM orders WHERE id = NEW.order_id;
  
  -- Calculate payout
  SELECT * INTO payout_result FROM calculate_bubbler_payout(
    order_data.service_type,
    order_data.tier,
    order_data.addons,
    order_data.services->>'propertyType',
    (order_data.services->>'hasPets')::BOOLEAN,
    NEW.is_dual_bubbler,
    NEW.is_lead_bubbler,
    NEW.is_standby_bonus
  );
  
  NEW.payout_amount := payout_result.total_payout;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job payout calculation
CREATE TRIGGER job_payout_calculation
  BEFORE INSERT OR UPDATE ON job_assignments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_job_payout_trigger();

-- =====================================================
-- 4. ADD COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dual_bubbler_required BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS has_pets BOOLEAN DEFAULT false;

-- Add missing columns to job_assignments table
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS is_dual_bubbler BOOLEAN DEFAULT false;
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS is_lead_bubbler BOOLEAN DEFAULT false;
ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS is_standby_bonus BOOLEAN DEFAULT false;

-- =====================================================
-- 5. SAFE VIEWS FOR DATA ACCESS
-- =====================================================

-- Safe payment view for bubblers
CREATE OR REPLACE VIEW bubbler_safe_payments_view AS
SELECT 
  ja.id as job_id,
  ja.bubbler_id,
  ja.payout_amount,
  ja.completed_at,
  ja.created_at,
  o.service_type,
  o.tier,
  o.estimated_duration
FROM job_assignments ja
INNER JOIN orders o ON ja.order_id = o.id
WHERE ja.status = 'completed';

-- Safe payment view with customer info (admin only)
CREATE OR REPLACE VIEW safe_payment_view AS
SELECT 
  ja.id as job_id,
  ja.bubbler_id,
  ja.payout_amount,
  ja.completed_at,
  ja.created_at,
  o.service_type,
  o.tier,
  o.customer_name,
  o.customer_phone,
  o.estimated_duration
FROM job_assignments ja
INNER JOIN orders o ON ja.order_id = o.id
WHERE ja.status = 'completed';

-- Safe order view for customers
CREATE OR REPLACE VIEW customer_orders_view AS
SELECT 
  id,
  customer_name,
  customer_phone,
  customer_email,
  service_type,
  tier,
  subtotal,
  tax,
  total,
  status,
  created_at,
  scheduled_date,
  estimated_duration,
  dual_bubbler_required
FROM orders
WHERE customer_email = auth.uid()::text;

-- Safe job assignments view for bubblers
CREATE OR REPLACE VIEW bubbler_jobs_view AS
SELECT 
  ja.id,
  ja.order_id,
  ja.bubbler_id,
  ja.status,
  ja.payout_amount,
  ja.completed_at,
  ja.created_at,
  ja.is_dual_bubbler,
  ja.is_lead_bubbler,
  ja.is_standby_bonus,
  o.service_type,
  o.tier,
  o.customer_name,
  o.customer_phone,
  o.estimated_duration,
  o.dual_bubbler_required
FROM job_assignments ja
INNER JOIN orders o ON ja.order_id = o.id
WHERE ja.bubbler_id = auth.uid();

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

-- Safe equipment view for bubblers
CREATE OR REPLACE VIEW bubbler_equipment_view AS
SELECT 
  id,
  bubbler_id,
  equipment_type,
  serial_number,
  status,
  assigned_date,
  last_maintenance,
  notes
FROM equipment
WHERE bubbler_id = auth.uid();

-- Safe messages view
CREATE OR REPLACE VIEW user_messages_view AS
SELECT 
  id,
  sender_id,
  recipient_id,
  message_type,
  subject,
  content,
  is_read,
  created_at
FROM messages
WHERE sender_id = auth.uid() OR recipient_id = auth.uid();

-- Safe applications view for admins
CREATE OR REPLACE VIEW admin_applications_view AS
SELECT 
  id,
  name,
  phone,
  email,
  service_interest,
  experience_level,
  availability,
  status,
  created_at,
  reviewed_by,
  review_notes
FROM applications
WHERE EXISTS (
  SELECT 1 FROM bubblers 
  WHERE id = auth.uid() AND role IN ('admin', 'support')
);

-- Safe bubblers view for admins
CREATE OR REPLACE VIEW admin_bubblers_view AS
SELECT 
  id,
  name,
  phone,
  email,
  role,
  status,
  rating,
  total_jobs,
  total_earnings,
  created_at,
  last_active
FROM bubblers
WHERE EXISTS (
  SELECT 1 FROM bubblers 
  WHERE id = auth.uid() AND role IN ('admin', 'support')
);

-- Safe job checklist view
CREATE OR REPLACE VIEW job_checklist_view AS
SELECT 
  jc.id,
  jc.job_id,
  jc.task_name,
  jc.is_completed,
  jc.completed_by,
  jc.completed_at,
  jc.notes,
  ja.bubbler_id,
  o.service_type,
  o.tier
FROM job_checklist jc
INNER JOIN job_assignments ja ON jc.job_id = ja.id
INNER JOIN orders o ON ja.order_id = o.id
WHERE ja.bubbler_id = auth.uid();

-- Safe payouts view for bubblers
CREATE OR REPLACE VIEW bubbler_payouts_view AS
SELECT 
  id,
  bubbler_id,
  amount,
  payout_type,
  status,
  processed_at,
  created_at,
  notes
FROM payouts
WHERE bubbler_id = auth.uid();

-- Safe device fingerprints view
CREATE OR REPLACE VIEW user_device_view AS
SELECT 
  id,
  user_id,
  device_hash,
  device_type,
  last_used,
  is_active,
  created_at
FROM device_fingerprints
WHERE user_id = auth.uid();

-- Safe perk tracker view
CREATE OR REPLACE VIEW user_perks_view AS
SELECT 
  id,
  user_id,
  perk_type,
  perk_value,
  earned_at,
  expires_at,
  is_used,
  used_at
FROM perk_tracker
WHERE user_id = auth.uid();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE order_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_laundry_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Users can view own order vehicles" ON order_vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_vehicles.order_id 
      AND orders.customer_email = auth.uid()::text
    )
  );

CREATE POLICY "Users can view own laundry bags" ON order_laundry_bags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_laundry_bags.order_id 
      AND orders.customer_email = auth.uid()::text
    )
  );

CREATE POLICY "Bubblers can view own job history" ON job_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_assignments 
      WHERE job_assignments.id = job_status_history.job_id 
      AND job_assignments.bubbler_id = auth.uid()
    )
  );

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for order_vehicles
CREATE INDEX IF NOT EXISTS idx_order_vehicles_order_id ON order_vehicles(order_id);
CREATE INDEX IF NOT EXISTS idx_order_vehicles_vehicle_type ON order_vehicles(vehicle_type);

-- Indexes for order_laundry_bags
CREATE INDEX IF NOT EXISTS idx_order_laundry_bags_order_id ON order_laundry_bags(order_id);
CREATE INDEX IF NOT EXISTS idx_order_laundry_bags_bag_type ON order_laundry_bags(bag_type);
CREATE INDEX IF NOT EXISTS idx_order_laundry_bags_qr_code ON order_laundry_bags(qr_code);

-- Indexes for job_status_history
CREATE INDEX IF NOT EXISTS idx_job_status_history_job_id ON job_status_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_status_history_status ON job_status_history(status);
CREATE INDEX IF NOT EXISTS idx_job_status_history_created_at ON job_status_history(created_at);

-- =====================================================
-- 8. SAMPLE DATA INSERTION (OPTIONAL)
-- =====================================================

-- Insert sample property types for testing
INSERT INTO orders (name, phone, email, service_type, tier, services, subtotal, tax, deposit, balance, total, status)
VALUES 
  ('Test Customer', '555-1234', 'test@example.com', 'Home Cleaning', 'refreshed', 
   '{"bedrooms": 2, "bathrooms": 1, "propertyType": "Apartment/Loft", "hasPets": false, "addons": {}}', 
   90.00, 7.43, 20.00, 77.43, 97.43, 'pending')
ON CONFLICT DO NOTHING;

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

-- Test car wash price calculation
SELECT * FROM calculate_car_wash_price(
  '[{"type": "car", "tier": "signature", "addons": ["clay"]}]'::jsonb
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
-- COMPLETE SQL IMPLEMENTATION READY FOR SUPABASE
-- ===================================================== 