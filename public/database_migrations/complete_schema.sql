-- Complete Database Schema for GoGoBubbles Bubbler Dashboard
-- This migration creates all necessary tables, RPC functions, and RLS policies

-- 1. Core Tables

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    estimated_duration INTEGER, -- in minutes
    base_pay DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job assignments table (links bubblers to jobs)
CREATE TABLE IF NOT EXISTS job_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    bubbler_id UUID NOT NULL REFERENCES bubblers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled')),
    base_pay DECIMAL(10,2) NOT NULL,
    tips DECIMAL(10,2) DEFAULT 0,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'retired')),
    assigned_bubbler_id UUID REFERENCES bubblers(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment requests table
CREATE TABLE IF NOT EXISTS equipment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    bubbler_id UUID NOT NULL REFERENCES bubblers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'fulfilled')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bubbler_id UUID NOT NULL REFERENCES bubblers(id) ON DELETE CASCADE,
    recipient_group TEXT NOT NULL CHECK (recipient_group IN ('admin', 'support', 'leader')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table (customer ratings of bubblers)
CREATE TABLE IF NOT EXISTS ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_assignment_id UUID REFERENCES job_assignments(id) ON DELETE SET NULL,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    feedback TEXT,
    customer_name TEXT,
    service_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bubbler feedback table (bubbler feedback about leads)
CREATE TABLE IF NOT EXISTS bubbler_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bubbler_id UUID NOT NULL REFERENCES bubblers(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead bubbler review table (admin reviews of leads)
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

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_assignments_bubbler_id ON job_assignments(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id ON job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_status ON job_assignments(status);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_assigned_bubbler_id ON equipment(assigned_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_bubbler_id ON equipment_requests(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_status ON equipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_messages_bubbler_id ON messages(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_bubbler_id ON ratings(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_ratings_job_assignment_id ON ratings(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_bubbler_id ON bubbler_feedback(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_lead_id ON bubbler_feedback(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_review_lead_id ON lead_bubbler_review(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_review_reviewer_id ON lead_bubbler_review(reviewer_id);

-- 3. RPC Functions

-- Get current bubbler ID for authenticated user
CREATE OR REPLACE FUNCTION current_bubbler_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT id 
        FROM bubblers 
        WHERE user_id = auth.uid()
    );
END;
$$;

-- Get my earnings breakdown
CREATE OR REPLACE FUNCTION get_my_earnings_breakdown()
RETURNS TABLE (
    base_amount DECIMAL(10,2),
    tips_amount DECIMAL(10,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(ja.base_pay), 0) as base_amount,
        COALESCE(SUM(ja.tips), 0) as tips_amount
    FROM job_assignments ja
    WHERE ja.bubbler_id = current_bubbler_id() 
    AND ja.status = 'completed';
END;
$$;

-- Get bubbler feedback for current lead (anonymous)
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

-- 4. Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bubbler_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_bubbler_review ENABLE ROW LEVEL SECURITY;

-- Jobs RLS Policies
-- Staff can view all jobs
CREATE POLICY jobs_select_staff_policy ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'support', 'leader')
        )
    );

-- Bubblers can view jobs they're assigned to
CREATE POLICY jobs_select_bubbler_policy ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_assignments ja
            WHERE ja.job_id = jobs.id
            AND ja.bubbler_id = current_bubbler_id()
        )
    );

-- Job Assignments RLS Policies
-- Bubblers can view their own assignments
CREATE POLICY job_assignments_select_bubbler_policy ON job_assignments
    FOR SELECT USING (
        bubbler_id = current_bubbler_id()
    );

-- Staff can view all assignments
CREATE POLICY job_assignments_select_staff_policy ON job_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'support', 'leader')
        )
    );

-- Bubblers can update their own assignments (accept/decline)
CREATE POLICY job_assignments_update_bubbler_policy ON job_assignments
    FOR UPDATE USING (
        bubbler_id = current_bubbler_id()
    ) WITH CHECK (
        bubbler_id = current_bubbler_id()
    );

-- Equipment RLS Policies
-- Everyone can view available equipment
CREATE POLICY equipment_select_available_policy ON equipment
    FOR SELECT USING (
        status = 'available'
    );

-- Bubblers can view equipment assigned to them
CREATE POLICY equipment_select_assigned_policy ON equipment
    FOR SELECT USING (
        assigned_bubbler_id = current_bubbler_id()
    );

-- Staff can view all equipment
CREATE POLICY equipment_select_staff_policy ON equipment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'support', 'leader')
        )
    );

-- Equipment Requests RLS Policies
-- Bubblers can view their own requests
CREATE POLICY equipment_requests_select_bubbler_policy ON equipment_requests
    FOR SELECT USING (
        bubbler_id = current_bubbler_id()
    );

-- Staff can view all requests
CREATE POLICY equipment_requests_select_staff_policy ON equipment_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'support', 'leader')
        )
    );

-- Bubblers can insert their own requests
CREATE POLICY equipment_requests_insert_bubbler_policy ON equipment_requests
    FOR INSERT WITH CHECK (
        bubbler_id = current_bubbler_id()
    );

-- Messages RLS Policies
-- Bubblers can view their own messages
CREATE POLICY messages_select_bubbler_policy ON messages
    FOR SELECT USING (
        bubbler_id = current_bubbler_id()
    );

-- Staff can view messages in their group
CREATE POLICY messages_select_staff_policy ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'support', 'leader')
        )
        AND (
            (ur.role = 'admin' AND messages.recipient_group = 'admin') OR
            (ur.role = 'support' AND messages.recipient_group IN ('admin', 'support')) OR
            (ur.role = 'leader' AND messages.recipient_group IN ('admin', 'support', 'leader'))
        )
    );

-- Bubblers can insert their own messages
CREATE POLICY messages_insert_bubbler_policy ON messages
    FOR INSERT WITH CHECK (
        bubbler_id = current_bubbler_id()
    );

-- Staff can update messages (mark as read)
CREATE POLICY messages_update_staff_policy ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'support', 'leader')
        )
    );

-- Ratings RLS Policies
-- Bubblers can view ratings about themselves
CREATE POLICY ratings_select_bubbler_policy ON ratings
    FOR SELECT USING (
        bubbler_id = current_bubbler_id()
    );

-- Staff can view all ratings
CREATE POLICY ratings_select_staff_policy ON ratings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'support', 'leader')
        )
    );

-- Bubbler Feedback RLS Policies
-- Bubblers can insert their own feedback
CREATE POLICY bubbler_feedback_insert_policy ON bubbler_feedback
    FOR INSERT WITH CHECK (
        bubbler_id = current_bubbler_id()
    );

-- Bubblers can view their own feedback
CREATE POLICY bubbler_feedback_select_bubbler_policy ON bubbler_feedback
    FOR SELECT USING (
        bubbler_id = current_bubbler_id()
    );

-- Staff can view all feedback
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

-- 5. Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_assignments_updated_at 
    BEFORE UPDATE ON job_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at 
    BEFORE UPDATE ON equipment 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_requests_updated_at 
    BEFORE UPDATE ON equipment_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at 
    BEFORE UPDATE ON ratings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bubbler_feedback_updated_at 
    BEFORE UPDATE ON bubbler_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_bubbler_review_updated_at 
    BEFORE UPDATE ON lead_bubbler_review 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON job_assignments TO authenticated;
GRANT SELECT ON equipment TO authenticated;
GRANT SELECT, INSERT ON equipment_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT ON ratings TO authenticated;
GRANT SELECT, INSERT ON bubbler_feedback TO authenticated;
GRANT SELECT, INSERT ON lead_bubbler_review TO authenticated;
GRANT EXECUTE ON FUNCTION current_bubbler_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_earnings_breakdown() TO authenticated;
GRANT EXECUTE ON FUNCTION get_bubbler_feedback_for_current_lead() TO authenticated;

-- 7. Comments for documentation
COMMENT ON TABLE jobs IS 'Available jobs that can be assigned to bubblers';
COMMENT ON TABLE job_assignments IS 'Links bubblers to jobs with status tracking';
COMMENT ON TABLE equipment IS 'Equipment inventory that can be assigned to bubblers';
COMMENT ON TABLE equipment_requests IS 'Bubbler requests for equipment';
COMMENT ON TABLE messages IS 'Internal messaging system between bubblers and staff';
COMMENT ON TABLE ratings IS 'Customer ratings and feedback for completed jobs';
COMMENT ON TABLE bubbler_feedback IS 'Internal feedback from bubblers about leads';
COMMENT ON TABLE lead_bubbler_review IS 'Performance reviews of leads by staff';
COMMENT ON FUNCTION current_bubbler_id() IS 'Returns the current bubbler ID for the authenticated user';
COMMENT ON FUNCTION get_my_earnings_breakdown() IS 'Returns earnings breakdown for the current bubbler';
COMMENT ON FUNCTION get_bubbler_feedback_for_current_lead() IS 'Returns anonymous feedback for the current lead';
