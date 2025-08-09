-- Lead/Bubbler Feedback Tables Migration
-- This migration creates the feedback system for leads and bubblers

-- 1. Bubbler Feedback Table (Bubbler → Lead feedback, internal)
CREATE TABLE IF NOT EXISTS bubbler_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bubbler_id UUID NOT NULL REFERENCES bubblers(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Lead Bubbler Review Table (Admin → Lead performance reviews)
CREATE TABLE IF NOT EXISTS lead_bubbler_review (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES bubblers(id) ON DELETE CASCADE,
    review_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_bubbler_id ON bubbler_feedback(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_lead_id ON bubbler_feedback(lead_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_created_at ON bubbler_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_lead_bubbler_review_lead_id ON lead_bubbler_review(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_review_reviewer_id ON lead_bubbler_review(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_review_date ON lead_bubbler_review(review_date);

-- 4. RPC Function: Get bubbler feedback for current lead (anonymous)
CREATE OR REPLACE FUNCTION get_bubbler_feedback_for_current_lead()
RETURNS TABLE (
    id UUID,
    feedback TEXT,
    is_anonymous BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Get the current lead ID from the authenticated user
    RETURN QUERY
    SELECT 
        bf.id,
        bf.feedback,
        bf.is_anonymous,
        bf.created_at
    FROM bubbler_feedback bf
    INNER JOIN leads l ON bf.lead_id = l.id
    INNER JOIN auth.users au ON l.user_id = au.id
    WHERE au.id = auth.uid();
END;
$$;

-- 5. RPC Function: Get my earnings breakdown
CREATE OR REPLACE FUNCTION get_my_earnings_breakdown()
RETURNS TABLE (
    base_amount DECIMAL(10,2),
    tips_amount DECIMAL(10,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Get the current bubbler ID
    DECLARE
        current_bubbler_id UUID;
    BEGIN
        SELECT id INTO current_bubbler_id 
        FROM bubblers 
        WHERE user_id = auth.uid();
        
        IF current_bubbler_id IS NULL THEN
            RETURN;
        END IF;
        
        -- Return earnings breakdown
        RETURN QUERY
        SELECT 
            COALESCE(SUM(ja.base_pay), 0) as base_amount,
            COALESCE(SUM(ja.tips), 0) as tips_amount
        FROM job_assignments ja
        WHERE ja.bubbler_id = current_bubbler_id 
        AND ja.status = 'completed';
    END;
END;
$$;

-- 6. Row Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE bubbler_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_bubbler_review ENABLE ROW LEVEL SECURITY;

-- Bubbler Feedback RLS Policies
-- Bubblers can insert their own feedback
CREATE POLICY bubbler_feedback_insert_policy ON bubbler_feedback
    FOR INSERT WITH CHECK (
        bubbler_id IN (
            SELECT id FROM bubblers WHERE user_id = auth.uid()
        )
    );

-- Bubblers can view their own feedback
CREATE POLICY bubbler_feedback_select_bubbler_policy ON bubbler_feedback
    FOR SELECT USING (
        bubbler_id IN (
            SELECT id FROM bubblers WHERE user_id = auth.uid()
        )
    );

-- Leads can view feedback about themselves via RPC (anonymous)
-- This is handled by the RPC function, so no direct SELECT policy needed

-- Staff (admin/support/leader) can view all feedback
CREATE POLICY bubbler_feedback_select_staff_policy ON bubbler_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'support', 'leader')
        )
    );

-- Lead Bubbler Review RLS Policies
-- Staff can insert reviews
CREATE POLICY lead_bubbler_review_insert_staff_policy ON lead_bubbler_review
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'support', 'leader')
        )
    );

-- Staff can view all reviews
CREATE POLICY lead_bubbler_review_select_staff_policy ON lead_bubbler_review
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'support', 'leader')
        )
    );

-- Leads can view reviews about themselves
CREATE POLICY lead_bubbler_review_select_lead_policy ON lead_bubbler_review
    FOR SELECT USING (
        lead_id IN (
            SELECT id FROM leads WHERE user_id = auth.uid()
        )
    );

-- 7. Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bubbler_feedback_updated_at 
    BEFORE UPDATE ON bubbler_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_bubbler_review_updated_at 
    BEFORE UPDATE ON lead_bubbler_review 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON bubbler_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE ON lead_bubbler_review TO authenticated;
GRANT EXECUTE ON FUNCTION get_bubbler_feedback_for_current_lead() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_earnings_breakdown() TO authenticated;

-- 9. Comments for documentation
COMMENT ON TABLE bubbler_feedback IS 'Internal feedback from bubblers about leads. Bubblers can submit anonymously.';
COMMENT ON TABLE lead_bubbler_review IS 'Performance reviews of leads by admin/support/leader staff.';
COMMENT ON FUNCTION get_bubbler_feedback_for_current_lead() IS 'RPC function for leads to view anonymous feedback about themselves.';
COMMENT ON FUNCTION get_my_earnings_breakdown() IS 'RPC function for bubblers to view their earnings breakdown.';
