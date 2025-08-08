-- =====================================================
-- RLS POLICIES FOR MANUAL LINK GENERATOR
-- =====================================================

-- Enable RLS on orders table for manual link generator
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy for admin and support bubblers to read orders
CREATE POLICY "admin_support_can_read_orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bubblers 
      WHERE bubblers.id = auth.uid() 
      AND bubblers.role IN ('admin_bubbler', 'support_bubbler')
    )
  );

-- Enable RLS on order_service table
ALTER TABLE order_service ENABLE ROW LEVEL SECURITY;

-- Policy for admin and support bubblers to read order_service
CREATE POLICY "admin_support_can_read_order_service" ON order_service
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bubblers 
      WHERE bubblers.id = auth.uid() 
      AND bubblers.role IN ('admin_bubbler', 'support_bubbler')
    )
  );

-- Enable RLS on job_assignments table
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;

-- Policy for admin and support bubblers to read job_assignments
CREATE POLICY "admin_support_can_read_job_assignments" ON job_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bubblers 
      WHERE bubblers.id = auth.uid() 
      AND bubblers.role IN ('admin_bubbler', 'support_bubbler')
    )
  );

-- Enable RLS on bubblers table
ALTER TABLE bubblers ENABLE ROW LEVEL SECURITY;

-- Policy for admin and support bubblers to read bubblers
CREATE POLICY "admin_support_can_read_bubblers" ON bubblers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bubblers 
      WHERE bubblers.id = auth.uid() 
      AND bubblers.role IN ('admin_bubbler', 'support_bubbler')
    )
  );

-- Create a view for manual link generator that includes all necessary data
CREATE OR REPLACE VIEW manual_link_generator_data AS
SELECT 
  o.id as order_id,
  o.customer_name,
  o.customer_email,
  o.created_at as order_date,
  os.id as service_id,
  os.service_type,
  ja.id as job_assignment_id,
  ja.bubbler_id,
  b.first_name as bubbler_first_name,
  b.last_name as bubbler_last_name,
  b.role as bubbler_role
FROM orders o
JOIN order_service os ON o.id = os.order_id
LEFT JOIN job_assignments ja ON os.id = ja.order_service_id
LEFT JOIN bubblers b ON ja.bubbler_id = b.id
WHERE EXISTS (
  SELECT 1 FROM bubblers 
  WHERE bubblers.id = auth.uid() 
  AND bubblers.role IN ('admin_bubbler', 'support_bubbler')
);

-- Enable RLS on the view
ALTER VIEW manual_link_generator_data SET (security_invoker = true); 