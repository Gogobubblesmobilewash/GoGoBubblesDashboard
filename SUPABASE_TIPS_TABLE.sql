-- =====================================================
-- OPTIONAL: Tips Tracking Table
-- =====================================================

-- Create tips table for tracking customer tips
CREATE TABLE IF NOT EXISTS tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  bubbler_id uuid REFERENCES bubblers(id),
  amount numeric NOT NULL,
  stripe_session_id text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tips_order_id ON tips(order_id);
CREATE INDEX IF NOT EXISTS idx_tips_bubbler_id ON tips(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_tips_payment_status ON tips(payment_status);
CREATE INDEX IF NOT EXISTS idx_tips_created_at ON tips(created_at);

-- Create RLS policies for tips table
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

-- Allow bubblers to view their own tips
CREATE POLICY "Bubblers can view their own tips" ON tips
  FOR SELECT USING (bubbler_id = auth.uid());

-- Allow admins to view all tips
CREATE POLICY "Admins can view all tips" ON tips
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bubblers 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow system to insert tips (for API calls)
CREATE POLICY "System can insert tips" ON tips
  FOR INSERT WITH CHECK (true);

-- Function to update tips when payment is completed
CREATE OR REPLACE FUNCTION update_tip_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tip status when Stripe webhook confirms payment
  IF NEW.metadata->>'payment_type' = 'tip' THEN
    UPDATE tips 
    SET payment_status = 'completed',
        updated_at = now()
    WHERE stripe_session_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tip status (if you have a payments table)
-- CREATE TRIGGER update_tip_status
--   AFTER INSERT ON payments
--   FOR EACH ROW
--   EXECUTE FUNCTION update_tip_payment_status();

-- View for bubbler tip earnings
CREATE OR REPLACE VIEW bubbler_tip_earnings AS
SELECT 
  b.id as bubbler_id,
  b.first_name,
  b.last_name,
  COUNT(t.id) as total_tips,
  SUM(t.amount) as total_tip_amount,
  AVG(t.amount) as average_tip_amount,
  MAX(t.created_at) as last_tip_date
FROM bubblers b
LEFT JOIN tips t ON b.id = t.bubbler_id AND t.payment_status = 'completed'
GROUP BY b.id, b.first_name, b.last_name;

-- Grant permissions
GRANT SELECT ON bubbler_tip_earnings TO authenticated;
GRANT ALL ON tips TO service_role; 