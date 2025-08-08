-- Perk Tracker Table for GoGoBubbles
-- This table tracks perk eligibility, usage, and history for customers

CREATE TABLE IF NOT EXISTS perk_tracker (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    perk_type VARCHAR(100) NOT NULL, -- 'first_time_discount', 'loyalty_discount', 'promo_code', etc.
    perk_name VARCHAR(255) NOT NULL, -- 'First-Time Discount', 'Loyalty Discount', etc.
    perk_value DECIMAL(10,2) NOT NULL, -- $10.00, $5.00, etc.
    perk_percentage DECIMAL(5,2), -- NULL for fixed amounts, percentage for % discounts
    order_id UUID REFERENCES orders(id),
    order_total DECIMAL(10,2) NOT NULL, -- Order total before discount
    discount_amount DECIMAL(10,2) NOT NULL, -- Actual discount applied
    minimum_order_requirement DECIMAL(10,2), -- $50.00 for first-time discount
    promo_code VARCHAR(50), -- 'BUBBLE10', etc.
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT unique_customer_perk UNIQUE(customer_email, customer_phone, perk_type),
    CONSTRAINT valid_perk_value CHECK (perk_value >= 0),
    CONSTRAINT valid_discount_amount CHECK (discount_amount >= 0)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_perk_tracker_email ON perk_tracker(customer_email);
CREATE INDEX IF NOT EXISTS idx_perk_tracker_phone ON perk_tracker(customer_phone);
CREATE INDEX IF NOT EXISTS idx_perk_tracker_type ON perk_tracker(perk_type);
CREATE INDEX IF NOT EXISTS idx_perk_tracker_used ON perk_tracker(is_used);
CREATE INDEX IF NOT EXISTS idx_perk_tracker_order ON perk_tracker(order_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_perk_tracker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER perk_tracker_updated_at
    BEFORE UPDATE ON perk_tracker
    FOR EACH ROW
    EXECUTE FUNCTION update_perk_tracker_updated_at();

-- Function to check if customer is eligible for first-time discount
CREATE OR REPLACE FUNCTION check_first_time_eligibility(
    p_email VARCHAR(255),
    p_phone VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_orders_count INTEGER;
BEGIN
    -- Check if customer has any previous orders
    SELECT COUNT(*) INTO existing_orders_count
    FROM orders
    WHERE (email = p_email OR phone = p_phone)
    AND status NOT IN ('cancelled', 'refunded');
    
    -- Return true if no previous orders (first-time customer)
    RETURN existing_orders_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to create first-time discount perk
CREATE OR REPLACE FUNCTION create_first_time_perk(
    p_email VARCHAR(255),
    p_phone VARCHAR(20),
    p_order_total DECIMAL(10,2),
    p_promo_code VARCHAR(50) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    perk_id UUID;
    is_eligible BOOLEAN;
    discount_amount DECIMAL(10,2) := 10.00;
    minimum_order DECIMAL(10,2) := 50.00;
BEGIN
    -- Check eligibility
    is_eligible := check_first_time_eligibility(p_email, p_phone);
    
    -- Only create perk if eligible and meets minimum order requirement
    IF is_eligible AND p_order_total >= minimum_order THEN
        INSERT INTO perk_tracker (
            customer_email,
            customer_phone,
            perk_type,
            perk_name,
            perk_value,
            order_total,
            discount_amount,
            minimum_order_requirement,
            promo_code,
            expires_at
        ) VALUES (
            p_email,
            p_phone,
            'first_time_discount',
            'First-Time Discount',
            discount_amount,
            p_order_total,
            discount_amount,
            minimum_order,
            p_promo_code,
            NOW() + INTERVAL '30 days' -- Expires in 30 days
        ) RETURNING id INTO perk_id;
        
        RETURN perk_id;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to use a perk
CREATE OR REPLACE FUNCTION use_perk(
    p_perk_id UUID,
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    perk_exists BOOLEAN;
BEGIN
    -- Check if perk exists and is unused
    SELECT EXISTS(
        SELECT 1 FROM perk_tracker 
        WHERE id = p_perk_id 
        AND is_used = FALSE 
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO perk_exists;
    
    IF perk_exists THEN
        -- Mark perk as used
        UPDATE perk_tracker 
        SET is_used = TRUE, 
            used_at = NOW(),
            order_id = p_order_id
        WHERE id = p_perk_id;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert default promo code
INSERT INTO perk_tracker (
    customer_email,
    customer_phone,
    perk_type,
    perk_name,
    perk_value,
    perk_percentage,
    promo_code,
    is_used,
    expires_at
) VALUES (
    NULL,
    NULL,
    'promo_code',
    'BUBBLE10 Promo Code',
    10.00,
    NULL,
    'BUBBLE10',
    FALSE,
    NULL -- Never expires
) ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE perk_tracker IS 'Tracks perk eligibility, usage, and history for customers';
COMMENT ON COLUMN perk_tracker.perk_type IS 'Type of perk: first_time_discount, loyalty_discount, promo_code, etc.';
COMMENT ON COLUMN perk_tracker.perk_value IS 'Fixed dollar amount of the perk';
COMMENT ON COLUMN perk_tracker.perk_percentage IS 'Percentage discount (NULL for fixed amounts)';
COMMENT ON COLUMN perk_tracker.minimum_order_requirement IS 'Minimum order total required to use this perk';
COMMENT ON COLUMN perk_tracker.promo_code IS 'Promo code associated with this perk (if any)';
COMMENT ON COLUMN perk_tracker.is_used IS 'Whether this perk has been used';
COMMENT ON COLUMN perk_tracker.used_at IS 'When the perk was used';
COMMENT ON COLUMN perk_tracker.expires_at IS 'When the perk expires (NULL for never)'; 