-- Database Migration: Lead Bubbler Oversight System
-- This migration creates tables for lead bubbler oversight, interventions, and promotions

-- Create interventions table for tracking lead bubbler interventions
CREATE TABLE IF NOT EXISTS interventions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_assignment_id UUID REFERENCES job_assignments(id) ON DELETE CASCADE,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    intervention_type VARCHAR(50) NOT NULL DEFAULT 'oversight',
    notes TEXT NOT NULL,
    photos JSONB DEFAULT '[]',
    oversight_duration_minutes INTEGER DEFAULT 15,
    compensation_tracked BOOLEAN DEFAULT TRUE,
    service_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_interventions_job_assignment_id ON interventions(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_interventions_lead_bubbler_id ON interventions(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_interventions_created_at ON interventions(created_at);

-- Create promotions table for tracking internal promotions
CREATE TABLE IF NOT EXISTS promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    recommended_by UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('promote', 'demote', 'maintain')),
    reason TEXT NOT NULL,
    current_role VARCHAR(50) NOT NULL,
    proposed_role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_promotions_bubbler_id ON promotions(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_promotions_recommended_by ON promotions(recommended_by);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON promotions(created_at);

-- Create onboarding_tracking table for tracking onboarding progress
CREATE TABLE IF NOT EXISTS onboarding_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    assigned_mentor UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    training_modules JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_bubbler_reviews table for performance reviews
CREATE TABLE IF NOT EXISTS lead_bubbler_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    reviewed_by UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    timeliness INTEGER NOT NULL CHECK (timeliness >= 1 AND timeliness <= 5),
    oversight_quality INTEGER NOT NULL CHECK (oversight_quality >= 1 AND oversight_quality <= 5),
    notes TEXT NOT NULL,
    issues JSONB DEFAULT '[]',
    approved_to_lead BOOLEAN NOT NULL DEFAULT TRUE,
    next_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_complaints table for tracking complaints against lead bubblers
CREATE TABLE IF NOT EXISTS support_complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    complaint_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create check_in_reports table for tracking lead bubbler check-ins
CREATE TABLE IF NOT EXISTS check_in_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    check_in_type VARCHAR(50) NOT NULL DEFAULT 'shift_start' CHECK (check_in_type IN ('shift_start', 'shift_end', 'break_start', 'break_end')),
    location VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced lead_checkins table for detailed oversight tracking
CREATE TABLE IF NOT EXISTS lead_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    checkin_type VARCHAR(50) NOT NULL CHECK (checkin_type IN ('qa', 'assist', 'coaching', 'takeover', 'equipment_delivery')),
    linked_request_id UUID REFERENCES equipment_requests(id) ON DELETE SET NULL,
    assisting_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    checkin_start TIMESTAMP WITH TIME ZONE NOT NULL,
    checkin_end TIMESTAMP WITH TIME ZONE,
    service_type VARCHAR(50) CHECK (service_type IN ('sparkle', 'shine', 'fresh')),
    oversight_type VARCHAR(50) CHECK (oversight_type IN ('QA', 'Assist', 'Coaching', 'Takeover')),
    notes TEXT,
    location VARCHAR(200),
    equipment_confirmed_by_bubbler BOOLEAN DEFAULT false,
    -- Bonus tracking fields for conditional flat-rate bonuses
    bonus_type VARCHAR(50) CHECK (bonus_type IN ('partial_assist', 'full_takeover', 'equipment_delivery', 'training_session')),
    bonus_amount DECIMAL(5,2) DEFAULT 0.00,
    bonus_reason TEXT,
    -- Job assignment reference for takeover tracking
    job_assignment_id UUID REFERENCES job_assignments(id) ON DELETE SET NULL,
    -- Takeover-specific fields for new compensation logic
    takeover_type VARCHAR(20) DEFAULT 'none' CHECK (takeover_type IN ('none', 'partial', 'full')),
    takeover_job_id UUID, -- references order_id
    takeover_minutes INTEGER,
    job_payout NUMERIC(6,2),
    credited_to UUID, -- bubbler_id that should receive final payout
    original_bubbler_credit NUMERIC(5,2) DEFAULT 0.00,
    lead_bubbler_bonus NUMERIC(5,2) DEFAULT 0.00,
    -- Verification and approval fields
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'flagged')),
    reviewed_by UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    labor_percentage_covered INTEGER CHECK (labor_percentage_covered >= 0 AND labor_percentage_covered <= 100),
    tasks_completed TEXT,
    job_finished_by_lead BOOLEAN DEFAULT FALSE,
    -- Duration tracking for hourly pay calculation
    duration_minutes INTEGER DEFAULT 0,
    -- Compensation calculation fields
    hourly_rate DECIMAL(5,2) DEFAULT 0.00,
    hourly_pay DECIMAL(8,2) DEFAULT 0.00,
    total_compensation DECIMAL(8,2) DEFAULT 0.00,
    -- QA Escalation fields
    escalation_type VARCHAR(50), -- 'qa_only', 'partial_takeover', 'full_takeover'
    escalation_notes TEXT,
    tasks_redone TEXT[], -- Array of task labels that were redone
    photo_evidence_urls TEXT[], -- Array of photo URLs
    original_completion_percentage DECIMAL(5,2),
    final_completion_percentage DECIMAL(5,2),
    compensation_type VARCHAR(50),
    original_bubbler_payout DECIMAL(6,2),
    lead_bubbler_payout DECIMAL(6,2),
    bonus_amount DECIMAL(5,2) DEFAULT 0.00,
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_bubbler_shifts table for scheduling oversight shifts
CREATE TABLE IF NOT EXISTS lead_bubbler_shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    assigned_zone VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    lead_pay_rate DECIMAL(5,2) DEFAULT 25.00,
    bonus_amount DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coaching_notes table for lead bubbler coaching documentation
CREATE TABLE IF NOT EXISTS coaching_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    notes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipment_requests table for equipment assistance requests
CREATE TABLE IF NOT EXISTS equipment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    order_service_id UUID REFERENCES order_service(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (urgency_level IN ('high', 'medium', 'low')),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'completed')),
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_sessions table for lead bubbler training sessions
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_date DATE NOT NULL,
    location TEXT NOT NULL,
    training_type VARCHAR(50) NOT NULL CHECK (training_type IN ('laundry', 'carwash', 'home_cleaning', 'multi-role')),
    duration_minutes INTEGER NOT NULL,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    payout_amount DECIMAL(8,2) NOT NULL,
    payout_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid')),
    admin_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    attendee_count INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_attendees table for tracking session attendees
CREATE TABLE IF NOT EXISTS training_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT false,
    cert_issued BOOLEAN DEFAULT false,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create takeover_verification_tasks table for admin review of takeover claims
CREATE TABLE IF NOT EXISTS takeover_verification_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_checkin_id UUID REFERENCES lead_checkins(id) ON DELETE CASCADE,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    original_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    job_assignment_id UUID REFERENCES job_assignments(id) ON DELETE CASCADE,
    takeover_type VARCHAR(20) NOT NULL CHECK (takeover_type IN ('partial', 'full')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'flagged')),
    assigned_to UUID REFERENCES bubblers(id) ON DELETE SET NULL, -- admin or support bubbler
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    verification_decision VARCHAR(20) CHECK (verification_decision IN ('approved', 'rejected', 'needs_adjustment')),
    adjusted_compensation DECIMAL(8,2),
    original_bubbler_impact VARCHAR(50) CHECK (original_bubbler_impact IN ('no_impact', 'prorated', 'full_credit', 'standby_bonus')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bubbler_feedback table for anonymous feedback from regular bubblers on lead bubblers
CREATE TABLE IF NOT EXISTS bubbler_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_checkin_id UUID REFERENCES lead_checkins(id) ON DELETE CASCADE,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    -- Anonymous feedback ratings (1-5 scale)
    helpfulness_rating INTEGER NOT NULL CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
    respectfulness_rating INTEGER NOT NULL CHECK (respectfulness_rating >= 1 AND respectfulness_rating <= 5),
    supportiveness_rating INTEGER NOT NULL CHECK (supportiveness_rating >= 1 AND supportiveness_rating <= 5),
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    -- Optional anonymous comments
    anonymous_comment TEXT,
    -- Feedback metadata
    feedback_type VARCHAR(50) NOT NULL DEFAULT 'checkin' CHECK (feedback_type IN ('checkin', 'intervention', 'coaching', 'equipment_delivery')),
    checkin_type VARCHAR(50) NOT NULL,
    -- Anonymous flag for privacy
    is_anonymous BOOLEAN DEFAULT true,
    -- Feedback status
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'flagged')),
    -- Admin review fields
    admin_notes TEXT,
    reviewed_by UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_onboarding_tracking_bubbler_id ON onboarding_tracking(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tracking_status ON onboarding_tracking(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_tracking_start_date ON onboarding_tracking(start_date);

-- Create index for lead_bubbler_reviews table
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_reviews_lead_bubbler_id ON lead_bubbler_reviews(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_reviews_reviewed_by ON lead_bubbler_reviews(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_reviews_created_at ON lead_bubbler_reviews(created_at);

-- Create index for support_complaints table
CREATE INDEX IF NOT EXISTS idx_support_complaints_lead_bubbler_id ON support_complaints(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_support_complaints_reported_by ON support_complaints(reported_by);
CREATE INDEX IF NOT EXISTS idx_support_complaints_created_at ON support_complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_support_complaints_status ON support_complaints(status);

-- Create index for check_in_reports table
CREATE INDEX IF NOT EXISTS idx_check_in_reports_lead_bubbler_id ON check_in_reports(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_check_in_reports_created_at ON check_in_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_check_in_reports_check_in_type ON check_in_reports(check_in_type);

-- Create index for lead_checkins table
CREATE INDEX IF NOT EXISTS idx_lead_checkins_lead_bubbler_id ON lead_checkins(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_lead_checkins_checkin_type ON lead_checkins(checkin_type);
CREATE INDEX IF NOT EXISTS idx_lead_checkins_checkin_start ON lead_checkins(checkin_start);
CREATE INDEX IF NOT EXISTS idx_lead_checkins_service_type ON lead_checkins(service_type);
CREATE INDEX IF NOT EXISTS idx_lead_checkins_linked_request_id ON lead_checkins(linked_request_id);

-- Create index for lead_bubbler_shifts table
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_shifts_lead_bubbler_id ON lead_bubbler_shifts(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_shifts_status ON lead_bubbler_shifts(status);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_shifts_start_time ON lead_bubbler_shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_lead_bubbler_shifts_end_time ON lead_bubbler_shifts(end_time);

-- Create index for coaching_notes table
CREATE INDEX IF NOT EXISTS idx_coaching_notes_lead_bubbler_id ON coaching_notes(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_coaching_notes_created_at ON coaching_notes(created_at);

-- Create index for equipment_requests table
CREATE INDEX IF NOT EXISTS idx_equipment_requests_bubbler_id ON equipment_requests(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_status ON equipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_lead_bubbler_id ON equipment_requests(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_equipment_requests_created_at ON equipment_requests(created_at);

-- Create index for training_sessions table
CREATE INDEX IF NOT EXISTS idx_training_sessions_lead_bubbler_id ON training_sessions(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_session_date ON training_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_admin_id ON training_sessions(admin_id);

-- Create index for training_attendees table
CREATE INDEX IF NOT EXISTS idx_training_attendees_session_id ON training_attendees(session_id);
CREATE INDEX IF NOT EXISTS idx_training_attendees_bubbler_id ON training_attendees(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_training_attendees_attended ON training_attendees(attended);

-- Create index for takeover_verification_tasks table
CREATE INDEX IF NOT EXISTS idx_takeover_verification_tasks_lead_checkin_id ON takeover_verification_tasks(lead_checkin_id);
CREATE INDEX IF NOT EXISTS idx_takeover_verification_tasks_status ON takeover_verification_tasks(status);
CREATE INDEX IF NOT EXISTS idx_takeover_verification_tasks_assigned_to ON takeover_verification_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_takeover_verification_tasks_created_at ON takeover_verification_tasks(created_at);

-- Create index for bubbler_feedback table
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_lead_checkin_id ON bubbler_feedback(lead_checkin_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_bubbler_id ON bubbler_feedback(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_lead_bubbler_id ON bubbler_feedback(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_feedback_type ON bubbler_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_status ON bubbler_feedback(status);
CREATE INDEX IF NOT EXISTS idx_bubbler_feedback_created_at ON bubbler_feedback(created_at);

-- Add new columns to bubblers table for lead bubbler functionality
ALTER TABLE bubblers 
ADD COLUMN IF NOT EXISTS assigned_zone VARCHAR(100),
ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS performance_score DECIMAL(3,2) DEFAULT 0.00 CHECK (performance_score >= 0 AND performance_score <= 20),
ADD COLUMN IF NOT EXISTS leadership_score DECIMAL(3,2) DEFAULT 0.00 CHECK (leadership_score >= 0 AND leadership_score <= 20),
ADD COLUMN IF NOT EXISTS training_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS zone_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_promotion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS certified_services JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS leadership_status VARCHAR(50) DEFAULT 'active' CHECK (leadership_status IN ('active', 'suspended', 'revoked')),
ADD COLUMN IF NOT EXISTS leadership_review_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS emergency_availability BOOLEAN DEFAULT TRUE;

-- Create index for zone-based queries
CREATE INDEX IF NOT EXISTS idx_bubblers_assigned_zone ON bubblers(assigned_zone);
CREATE INDEX IF NOT EXISTS idx_bubblers_performance_score ON bubblers(performance_score);
CREATE INDEX IF NOT EXISTS idx_bubblers_leadership_score ON bubblers(leadership_score);

-- Add new columns to orders table for zone tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS zone VARCHAR(100);

-- Create index for zone-based order queries
CREATE INDEX IF NOT EXISTS idx_orders_zone ON orders(zone);

-- Create function to update intervention timestamps
CREATE OR REPLACE FUNCTION update_intervention_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for interventions table
CREATE TRIGGER update_interventions_timestamp
    BEFORE UPDATE ON interventions
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create function to update promotion timestamps
CREATE OR REPLACE FUNCTION update_promotion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for promotions table
CREATE TRIGGER update_promotions_timestamp
    BEFORE UPDATE ON promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_timestamp();

-- Create function to update onboarding tracking timestamps
CREATE OR REPLACE FUNCTION update_onboarding_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for onboarding_tracking table
CREATE TRIGGER update_onboarding_tracking_timestamp
    BEFORE UPDATE ON onboarding_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_tracking_timestamp();

-- Create trigger for lead_bubbler_reviews table
CREATE TRIGGER update_lead_bubbler_reviews_timestamp
    BEFORE UPDATE ON lead_bubbler_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create trigger for support_complaints table
CREATE TRIGGER update_support_complaints_timestamp
    BEFORE UPDATE ON support_complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create trigger for check_in_reports table
CREATE TRIGGER update_check_in_reports_timestamp
    BEFORE UPDATE ON check_in_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create trigger for lead_checkins table
CREATE TRIGGER update_lead_checkins_timestamp
    BEFORE UPDATE ON lead_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create trigger for lead_bubbler_shifts table
CREATE TRIGGER update_lead_bubbler_shifts_timestamp
    BEFORE UPDATE ON lead_bubbler_shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create trigger for coaching_notes table
CREATE TRIGGER update_coaching_notes_timestamp
    BEFORE UPDATE ON coaching_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create trigger for equipment_requests table
CREATE TRIGGER update_equipment_requests_timestamp
    BEFORE UPDATE ON equipment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create trigger for training_sessions table
CREATE TRIGGER update_training_sessions_timestamp
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create trigger for training_attendees table
CREATE TRIGGER update_training_attendees_timestamp
    BEFORE UPDATE ON training_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create trigger for bubbler_feedback table
CREATE TRIGGER update_bubbler_feedback_timestamp
    BEFORE UPDATE ON bubbler_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create trigger for takeover_verification_tasks table
CREATE TRIGGER update_takeover_verification_tasks_timestamp
    BEFORE UPDATE ON takeover_verification_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create function to calculate lead bubbler effectiveness
CREATE OR REPLACE FUNCTION calculate_lead_effectiveness(lead_bubbler_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    recent_interventions INTEGER;
    total_jobs INTEGER;
    intervention_rate DECIMAL(5,4);
BEGIN
    -- Count interventions in the last 7 days
    SELECT COUNT(*) INTO recent_interventions
    FROM interventions
    WHERE lead_bubbler_id = $1
    AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Count total jobs assigned to this lead's zone in the last 7 days
    SELECT COUNT(*) INTO total_jobs
    FROM job_assignments ja
    JOIN order_service os ON ja.order_service_id = os.id
    JOIN orders o ON os.order_id = o.id
    JOIN bubblers b ON ja.bubbler_id = b.id
    WHERE b.assigned_zone = (SELECT assigned_zone FROM bubblers WHERE id = $1)
    AND ja.created_at >= NOW() - INTERVAL '7 days';
    
    -- Calculate intervention rate
    IF total_jobs = 0 THEN
        intervention_rate = 0;
    ELSE
        intervention_rate = recent_interventions::DECIMAL / total_jobs;
    END IF;
    
    -- Return effectiveness based on intervention rate
    IF intervention_rate = 0 THEN
        RETURN 'excellent';
    ELSIF intervention_rate <= 0.1 THEN
        RETURN 'good';
    ELSIF intervention_rate <= 0.2 THEN
        RETURN 'fair';
    ELSE
        RETURN 'needs_improvement';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get promotion eligibility
CREATE OR REPLACE FUNCTION check_promotion_eligibility(bubbler_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    min_jobs INTEGER := 50;
    min_rating DECIMAL(3,2) := 4.5;
    min_earnings DECIMAL(10,2) := 5000.00;
    min_experience_days INTEGER := 90;
    min_days_since_promotion INTEGER := 30;
    
    candidate_record RECORD;
    days_since_start INTEGER;
    days_since_last_promotion INTEGER;
BEGIN
    -- Get candidate data
    SELECT 
        total_jobs_completed,
        rating,
        total_earnings,
        created_at,
        last_promotion_date
    INTO candidate_record
    FROM bubblers
    WHERE id = $1;
    
    -- Calculate days since start
    days_since_start = EXTRACT(DAY FROM (NOW() - candidate_record.created_at));
    
    -- Calculate days since last promotion
    IF candidate_record.last_promotion_date IS NULL THEN
        days_since_last_promotion = days_since_start;
    ELSE
        days_since_last_promotion = EXTRACT(DAY FROM (NOW() - candidate_record.last_promotion_date));
    END IF;
    
    -- Check eligibility criteria
    RETURN (
        candidate_record.total_jobs_completed >= min_jobs AND
        candidate_record.rating >= min_rating AND
        candidate_record.total_earnings >= min_earnings AND
        days_since_start >= min_experience_days AND
        days_since_last_promotion >= min_days_since_promotion
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate promotion score
CREATE OR REPLACE FUNCTION calculate_promotion_score(bubbler_id UUID)
RETURNS INTEGER AS $$
DECLARE
    candidate_record RECORD;
    job_score DECIMAL(5,2);
    rating_score DECIMAL(5,2);
    performance_score DECIMAL(5,2);
    leadership_score DECIMAL(5,2);
    training_score INTEGER;
    total_score INTEGER;
BEGIN
    -- Get candidate data
    SELECT 
        total_jobs_completed,
        rating,
        performance_score,
        leadership_score,
        training_completed
    INTO candidate_record
    FROM bubblers
    WHERE id = $1;
    
    -- Calculate individual scores
    job_score = LEAST(candidate_record.total_jobs_completed::DECIMAL / 100, 1) * 25;
    rating_score = candidate_record.rating * 5;
    performance_score = candidate_record.performance_score * 20;
    leadership_score = candidate_record.leadership_score * 20;
    training_score = CASE WHEN candidate_record.training_completed THEN 10 ELSE 0 END;
    
    -- Calculate total score
    total_score = ROUND(job_score + rating_score + performance_score + leadership_score + training_score);
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if lead bubbler can oversee service
CREATE OR REPLACE FUNCTION can_oversee_service(lead_bubbler_id UUID, service_type VARCHAR(100))
RETURNS BOOLEAN AS $$
DECLARE
    certified_services JSONB;
BEGIN
    -- Get certified services for the lead bubbler
    SELECT certified_services INTO certified_services
    FROM bubblers
    WHERE id = $1;
    
    -- Check if service type is in certified services
    RETURN certified_services ? $2;
END;
$$ LANGUAGE plpgsql;

-- Create function to check leadership status
CREATE OR REPLACE FUNCTION check_leadership_status(lead_bubbler_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    leadership_status VARCHAR(50);
    review_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get leadership status and review date
    SELECT 
        leadership_status,
        leadership_review_date
    INTO 
        leadership_status,
        review_date
    FROM bubblers
    WHERE id = $1;
    
    -- Check if review is overdue (every 90 days)
    IF review_date IS NOT NULL AND review_date < NOW() - INTERVAL '90 days' THEN
        RETURN 'review_needed';
    END IF;
    
    RETURN COALESCE(leadership_status, 'inactive');
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate oversight compensation
CREATE OR REPLACE FUNCTION calculate_oversight_compensation(lead_bubbler_id UUID, start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    total_hours DECIMAL(8,2),
    total_pay DECIMAL(8,2),
    bonus_pay DECIMAL(8,2),
    total_compensation DECIMAL(8,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (lc.checkin_end - lc.checkin_start)) / 3600), 0) as total_hours,
        COALESCE(SUM(lc.hourly_pay), 0) as total_pay,
        COALESCE(SUM(lc.bonus_amount), 0) as bonus_pay,
        COALESCE(SUM(lc.total_compensation), 0) as total_compensation
    FROM lead_checkins lc
    WHERE lc.lead_bubbler_id = calculate_oversight_compensation.lead_bubbler_id
    AND lc.checkin_start >= start_date
    AND lc.checkin_end <= end_date
    AND lc.checkin_end IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate completion-based compensation tiers
CREATE OR REPLACE FUNCTION calculate_completion_based_compensation(
    order_id UUID,
    completion_percentage DECIMAL(5,2),
    service_type VARCHAR(50),
    takeover_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
    original_bubbler_payout DECIMAL(6,2),
    lead_bubbler_payout DECIMAL(6,2),
    compensation_type VARCHAR(50),
    bonus_amount DECIMAL(5,2),
    hourly_pay_eligible BOOLEAN,
    job_payout_eligible BOOLEAN,
    compensation_reason TEXT
) AS $$
DECLARE
    job_payout_amount DECIMAL(6,2);
    calculated_original_payout DECIMAL(6,2);
    calculated_lead_payout DECIMAL(6,2);
    calculated_bonus DECIMAL(5,2);
    calculated_type VARCHAR(50);
    calculated_hourly_eligible BOOLEAN;
    calculated_job_eligible BOOLEAN;
    calculated_reason TEXT;
BEGIN
    -- Get job payout amount
    SELECT COALESCE(o.total_amount, 0) INTO job_payout_amount
    FROM orders o WHERE o.id = order_id;
    
    -- Calculate compensation based on completion percentage
    CASE 
        WHEN completion_percentage = 0 THEN
            -- 0% completed - No-show or immediate cancel
            calculated_original_payout := 0.00;
            calculated_lead_payout := job_payout_amount;
            calculated_bonus := 0.00;
            calculated_type := 'full_takeover';
            calculated_hourly_eligible := FALSE;
            calculated_job_eligible := TRUE;
            calculated_reason := 'Full takeover - No work completed by original bubbler';
            
        WHEN completion_percentage BETWEEN 1 AND 29 THEN
            -- 1-29% completed - $10 flat to original, 100% to lead
            calculated_original_payout := 10.00;
            calculated_lead_payout := job_payout_amount;
            calculated_bonus := 0.00;
            calculated_type := 'full_takeover';
            calculated_hourly_eligible := FALSE;
            calculated_job_eligible := TRUE;
            calculated_reason := 'Full takeover - Minimal work completed (1-29%)';
            
        WHEN completion_percentage BETWEEN 30 AND 49 THEN
            -- 30-49% completed - $20 flat to original, 100% to lead
            calculated_original_payout := 20.00;
            calculated_lead_payout := job_payout_amount;
            calculated_bonus := 0.00;
            calculated_type := 'full_takeover';
            calculated_hourly_eligible := FALSE;
            calculated_job_eligible := TRUE;
            calculated_reason := 'Full takeover - Partial work completed (30-49%)';
            
        WHEN completion_percentage = 50 THEN
            -- Exactly 50% - Split 50/50
            calculated_original_payout := job_payout_amount * 0.5;
            calculated_lead_payout := job_payout_amount * 0.5;
            calculated_bonus := 0.00;
            calculated_type := 'split_takeover';
            calculated_hourly_eligible := FALSE;
            calculated_job_eligible := TRUE;
            calculated_reason := 'Even split - Exactly 50% completed';
            
        WHEN completion_percentage BETWEEN 51 AND 99 THEN
            -- 51-99% completed - 100% to original, flat bonus to lead
            calculated_original_payout := job_payout_amount;
            calculated_lead_payout := 0.00;
            calculated_bonus := CASE service_type
                WHEN 'fresh' THEN 10.00
                WHEN 'sparkle' THEN 15.00
                WHEN 'shine' THEN 15.00
                ELSE 12.00
            END;
            calculated_type := 'wrap_up_bonus';
            calculated_hourly_eligible := TRUE;
            calculated_job_eligible := FALSE;
            calculated_reason := 'Wrap-up bonus - Lead finishes minor remainder (51-99%)';
            
        WHEN completion_percentage = 100 THEN
            -- 100% completed - QA hourly only
            calculated_original_payout := job_payout_amount;
            calculated_lead_payout := 0.00;
            calculated_bonus := 0.00;
            calculated_type := 'qa_only';
            calculated_hourly_eligible := TRUE;
            calculated_job_eligible := FALSE;
            calculated_reason := 'QA check only - Job completed by original bubbler';
            
        ELSE
            -- Invalid percentage
            calculated_original_payout := 0.00;
            calculated_lead_payout := 0.00;
            calculated_bonus := 0.00;
            calculated_type := 'error';
            calculated_hourly_eligible := FALSE;
            calculated_job_eligible := FALSE;
            calculated_reason := 'Invalid completion percentage';
    END CASE;
    
    RETURN QUERY SELECT 
        calculated_original_payout,
        calculated_lead_payout,
        calculated_type,
        calculated_bonus,
        calculated_hourly_eligible,
        calculated_job_eligible,
        calculated_reason;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate conditional flat-rate bonuses based on new SOP
CREATE OR REPLACE FUNCTION calculate_lead_bonus(
    checkin_type VARCHAR(50),
    service_type VARCHAR(50),
    oversight_type VARCHAR(50),
    duration_minutes INTEGER DEFAULT 0,
    takeover_type VARCHAR(20) DEFAULT 'none'
)
RETURNS TABLE (
    bonus_type VARCHAR(50),
    bonus_amount DECIMAL(5,2),
    bonus_reason TEXT,
    takeover_type VARCHAR(20),
    job_payout_eligible BOOLEAN,
    original_bubbler_deduction DECIMAL(5,2)
) AS $$
DECLARE
    calculated_bonus_type VARCHAR(50);
    calculated_bonus_amount DECIMAL(5,2) := 0.00;
    calculated_bonus_reason TEXT;
    calculated_takeover_type VARCHAR(20) := 'none';
    calculated_job_payout_eligible BOOLEAN := FALSE;
    calculated_original_bubbler_deduction DECIMAL(5,2) := 0.00;
BEGIN
    -- SCENARIO 1: Full Takeover - Lead gets full job payout (no hourly rate)
    IF checkin_type = 'takeover' OR takeover_type = 'full' THEN
        calculated_bonus_type := 'full_takeover';
        -- Company pays bonus to lead based on original bubbler completion percentage
        CASE 
            WHEN percent_completed = 0 THEN calculated_bonus_amount := 10.00; -- No show: $10 bonus
            WHEN percent_completed BETWEEN 1 AND 29 THEN calculated_bonus_amount := 8.00; -- 1-29%: $8 bonus
            WHEN percent_completed BETWEEN 30 AND 49 THEN calculated_bonus_amount := 5.00; -- 30-49%: $5 bonus
            WHEN percent_completed = 50 THEN calculated_bonus_amount := 3.00; -- 50%: $3 bonus
            ELSE calculated_bonus_amount := 0.00; -- 51%+ not a full takeover
        END CASE;
        calculated_bonus_reason := 'Full takeover - Lead receives tier payment + company bonus, original bubbler gets reduced payment';
        calculated_takeover_type := 'full';
        calculated_job_payout_eligible := TRUE;
        calculated_original_bubbler_deduction := 0.00; -- No penalty, just tier payment reduction
    
    -- SCENARIO 2: Partial Takeover - Lead gets hourly rate + fixed bonus (deducted from original bubbler)
    ELSIF (checkin_type = 'assist' AND duration_minutes >= 30) OR takeover_type = 'partial' THEN
        calculated_bonus_type := 'partial_assist';
        -- Service-specific partial assistance bonuses (deducted from original bubbler)
        CASE service_type
            WHEN 'fresh' THEN calculated_bonus_amount := 10.00; -- Laundry: $10
            WHEN 'sparkle' THEN calculated_bonus_amount := 15.00; -- Home Cleaning: $15
            WHEN 'shine' THEN calculated_bonus_amount := 20.00; -- Car Wash: $20
            ELSE calculated_bonus_amount := 15.00; -- Default: $15
        END CASE;
        calculated_bonus_reason := 'Partial takeover (30+ minutes) - bonus deducted from original bubbler payout';
        calculated_takeover_type := 'partial';
        calculated_job_payout_eligible := FALSE;
        calculated_original_bubbler_deduction := calculated_bonus_amount; -- Same amount deducted from original bubbler
    
    -- SCENARIO 3: Light Assistance - Hourly rate only (no deduction)
    ELSIF checkin_type = 'assist' AND duration_minutes < 30 THEN
        calculated_bonus_type := NULL;
        calculated_bonus_amount := 0.00; -- Light assistance covered by hourly rate only
        calculated_bonus_reason := 'Light assistance (< 30 min) - hourly rate only, no bonus or deduction';
        calculated_takeover_type := 'none';
        calculated_job_payout_eligible := FALSE;
        calculated_original_bubbler_deduction := 0.00; -- No deduction for light assistance
    
    -- Equipment Delivery: Hourly rate only (no deduction)
    ELSIF checkin_type = 'equipment_delivery' THEN
        calculated_bonus_type := 'equipment_delivery';
        calculated_bonus_amount := 0.00; -- Equipment delivery uses hourly rate only
        calculated_bonus_reason := 'Equipment delivery - hourly rate only, no deduction';
        calculated_takeover_type := 'none';
        calculated_job_payout_eligible := FALSE;
        calculated_original_bubbler_deduction := 0.00; -- No deduction for equipment delivery
    
    -- Coaching: Hourly rate only (no deduction)
    ELSIF checkin_type = 'coaching' THEN
        calculated_bonus_type := NULL;
        calculated_bonus_amount := 0.00; -- Coaching uses hourly rate only
        calculated_bonus_reason := 'Coaching - hourly rate only, no deduction';
        calculated_takeover_type := 'none';
        calculated_job_payout_eligible := FALSE;
        calculated_original_bubbler_deduction := 0.00; -- No deduction for coaching
    
    -- QA Check: Hourly rate only (no deduction)
    ELSIF checkin_type = 'qa' THEN
        calculated_bonus_type := NULL;
        calculated_bonus_amount := 0.00; -- QA uses hourly rate only
        calculated_bonus_reason := 'QA check - hourly rate only, no deduction';
        calculated_takeover_type := 'none';
        calculated_job_payout_eligible := FALSE;
        calculated_original_bubbler_deduction := 0.00; -- No deduction for QA checks
    
    ELSE
        calculated_bonus_type := NULL;
        calculated_bonus_amount := 0.00;
        calculated_bonus_reason := 'No bonus applicable';
        calculated_takeover_type := 'none';
        calculated_job_payout_eligible := FALSE;
        calculated_original_bubbler_deduction := 0.00; -- No deduction
    END IF;

    RETURN QUERY SELECT calculated_bonus_type, calculated_bonus_amount, calculated_bonus_reason, calculated_takeover_type, calculated_job_payout_eligible, calculated_original_bubbler_deduction;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate hourly rate based on service type being overseen
CREATE OR REPLACE FUNCTION calculate_lead_hourly_rate(service_type VARCHAR(50))
RETURNS DECIMAL(5,2) AS $$
BEGIN
    CASE service_type
        WHEN 'fresh' THEN RETURN 17.00; -- Laundry: $17/hour
        WHEN 'sparkle' THEN RETURN 20.00; -- Home Cleaning: $20/hour
        WHEN 'shine' THEN RETURN 22.00; -- Car Wash: $22/hour
        ELSE RETURN 20.00; -- Default: $20/hour
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to process lead checkin and calculate compensation based on new SOP
CREATE OR REPLACE FUNCTION process_lead_checkin_compensation(checkin_id UUID)
RETURNS VOID AS $$
DECLARE
    checkin_record RECORD;
    bonus_info RECORD;
    hourly_rate DECIMAL(5,2);
    duration_hours DECIMAL(8,2);
    hourly_pay DECIMAL(8,2);
    total_compensation DECIMAL(8,2);
    job_payout_amount DECIMAL(8,2) := 0.00;
    original_bubbler_credit DECIMAL(5,2) := 0.00;
BEGIN
    -- Get the checkin record
    SELECT * INTO checkin_record FROM lead_checkins WHERE id = checkin_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Checkin record not found';
    END IF;

    -- Calculate duration in hours
    IF checkin_record.checkin_end IS NOT NULL THEN
        duration_hours := EXTRACT(EPOCH FROM (checkin_record.checkin_end - checkin_record.checkin_start)) / 3600;
    ELSE
        duration_hours := 0;
    END IF;

    -- Calculate bonus and determine compensation type
    SELECT * INTO bonus_info FROM calculate_lead_bonus(
        checkin_record.checkin_type,
        checkin_record.service_type,
        checkin_record.oversight_type,
        EXTRACT(EPOCH FROM (checkin_record.checkin_end - checkin_record.checkin_start)) / 60,
        checkin_record.takeover_type
    );

    -- SCENARIO 1: Full Takeover - Lead gets full job payout (no hourly rate)
    IF bonus_info.job_payout_eligible THEN
        -- Get job payout amount from job_assignments or orders table
        SELECT COALESCE(ja.earnings, o.total_amount) INTO job_payout_amount
        FROM job_assignments ja
        LEFT JOIN orders o ON ja.order_id = o.id
        WHERE ja.id = checkin_record.job_assignment_id;
        
        -- Original bubbler gets $10 credit if they started the job
        original_bubbler_credit := 10.00;
        
        -- Lead gets full job payout minus original bubbler credit
        total_compensation := COALESCE(job_payout_amount, 0) - original_bubbler_credit;
        hourly_pay := 0.00; -- No hourly rate for full takeover
        
    -- SCENARIO 2 & 3: Partial Takeover or Light Assistance - Hourly rate + bonus
    ELSE
        -- Calculate hourly rate based on service type
        hourly_rate := calculate_lead_hourly_rate(checkin_record.service_type);
        
        -- Calculate hourly pay
        hourly_pay := hourly_rate * duration_hours;
        
        -- Calculate total compensation (hourly + bonus)
        total_compensation := hourly_pay + COALESCE(bonus_info.bonus_amount, 0);
        
        -- No job payout for partial/light assistance
        job_payout_amount := 0.00;
        original_bubbler_credit := 0.00;
    END IF;

    -- Update the checkin record with calculated compensation
    UPDATE lead_checkins 
    SET 
        takeover_type = bonus_info.takeover_type,
        bonus_type = bonus_info.bonus_type,
        bonus_amount = COALESCE(bonus_info.bonus_amount, 0),
        bonus_reason = bonus_info.bonus_reason,
        job_payout = job_payout_amount,
        credited_to = CASE 
            WHEN bonus_info.job_payout_eligible THEN checkin_record.lead_bubbler_id 
            ELSE NULL 
        END,
        original_bubbler_credit = original_bubbler_credit,
        lead_bubbler_bonus = COALESCE(bonus_info.bonus_amount, 0),
        duration_minutes = EXTRACT(EPOCH FROM (checkin_end - checkin_start)) / 60,
        hourly_rate = CASE 
            WHEN bonus_info.job_payout_eligible THEN 0.00 
            ELSE calculate_lead_hourly_rate(checkin_record.service_type) 
        END,
        hourly_pay = hourly_pay,
        total_compensation = total_compensation
    WHERE id = checkin_id;

END;
$$ LANGUAGE plpgsql;

-- Function to calculate lead bubbler rating from anonymous feedback
CREATE OR REPLACE FUNCTION calculate_lead_bubbler_rating(lead_bubbler_id UUID, days_back INTEGER DEFAULT 90)
RETURNS TABLE (
    total_feedback_count INTEGER,
    avg_helpfulness DECIMAL(3,2),
    avg_respectfulness DECIMAL(3,2),
    avg_supportiveness DECIMAL(3,2),
    avg_overall_rating DECIMAL(3,2),
    recent_feedback_count INTEGER,
    recent_avg_rating DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_feedback_count,
        ROUND(AVG(helpfulness_rating)::DECIMAL, 2) as avg_helpfulness,
        ROUND(AVG(respectfulness_rating)::DECIMAL, 2) as avg_respectfulness,
        ROUND(AVG(supportiveness_rating)::DECIMAL, 2) as avg_supportiveness,
        ROUND(AVG(overall_rating)::DECIMAL, 2) as avg_overall_rating,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' * days_back THEN 1 END)::INTEGER as recent_feedback_count,
        ROUND(AVG(CASE WHEN created_at >= NOW() - INTERVAL '1 day' * days_back THEN overall_rating END)::DECIMAL, 2) as recent_avg_rating
    FROM bubbler_feedback
    WHERE lead_bubbler_id = calculate_lead_bubbler_rating.lead_bubbler_id
    AND status = 'submitted';
END;
$$ LANGUAGE plpgsql;

-- Function to check if lead bubbler meets retention criteria based on feedback
CREATE OR REPLACE FUNCTION check_lead_bubbler_retention_criteria(lead_bubbler_id UUID)
RETURNS TABLE (
    meets_criteria BOOLEAN,
    avg_customer_rating DECIMAL(3,2),
    feedback_count INTEGER,
    retention_status VARCHAR(50),
    issues JSONB
) AS $$
DECLARE
    rating_info RECORD;
    retention_rules JSONB := '{
        "avg_customer_rating": 4.7,
        "min_feedback_count": 5,
        "min_recent_feedback": 2
    }'::JSONB;
    issues_array JSONB := '[]'::JSONB;
BEGIN
    -- Get rating information
    SELECT * INTO rating_info FROM calculate_lead_bubbler_rating(lead_bubbler_id, 30);
    
    -- Check retention criteria
    IF rating_info.avg_overall_rating IS NULL OR rating_info.avg_overall_rating < (retention_rules->>'avg_customer_rating')::DECIMAL THEN
        issues_array := issues_array || jsonb_build_object('issue', 'Low average rating', 'value', rating_info.avg_overall_rating, 'required', retention_rules->>'avg_customer_rating');
    END IF;
    
    IF rating_info.total_feedback_count < (retention_rules->>'min_feedback_count')::INTEGER THEN
        issues_array := issues_array || jsonb_build_object('issue', 'Insufficient feedback', 'value', rating_info.total_feedback_count, 'required', retention_rules->>'min_feedback_count');
    END IF;
    
    IF rating_info.recent_feedback_count < (retention_rules->>'min_recent_feedback')::INTEGER THEN
        issues_array := issues_array || jsonb_build_object('issue', 'Insufficient recent feedback', 'value', rating_info.recent_feedback_count, 'required', retention_rules->>'min_recent_feedback');
    END IF;
    
    -- Determine retention status
    DECLARE
        meets_criteria_val BOOLEAN;
        retention_status_val VARCHAR(50);
    BEGIN
        meets_criteria_val := (
            rating_info.avg_overall_rating >= (retention_rules->>'avg_customer_rating')::DECIMAL AND
            rating_info.total_feedback_count >= (retention_rules->>'min_feedback_count')::INTEGER AND
            rating_info.recent_feedback_count >= (retention_rules->>'min_recent_feedback')::INTEGER
        );
        
        IF meets_criteria_val THEN
            retention_status_val := 'compliant';
        ELSIF rating_info.avg_overall_rating < 4.0 THEN
            retention_status_val := 'at_risk';
        ELSE
            retention_status_val := 'needs_improvement';
        END IF;
        
        RETURN QUERY SELECT 
            meets_criteria_val,
            rating_info.avg_overall_rating,
            rating_info.total_feedback_count,
            retention_status_val,
            issues_array;
    END;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (optional)
-- INSERT INTO interventions (job_assignment_id, lead_bubbler_id, notes, intervention_type)
-- VALUES 
--     (gen_random_uuid(), gen_random_uuid(), 'Bubbler was running late, provided guidance on time management', 'oversight'),
--     (gen_random_uuid(), gen_random_uuid(), 'Customer complaint resolved, additional training recommended', 'oversight');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON interventions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON onboarding_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE ON lead_bubbler_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON support_complaints TO authenticated;
GRANT SELECT, INSERT, UPDATE ON check_in_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON lead_checkins TO authenticated;
GRANT SELECT, INSERT, UPDATE ON lead_bubbler_shifts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON coaching_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON equipment_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON training_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON training_attendees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON bubbler_feedback TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_lead_effectiveness(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_promotion_eligibility(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_promotion_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_oversight_compensation(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_lead_bonus(VARCHAR, VARCHAR, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_lead_hourly_rate(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION process_lead_checkin_compensation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_lead_bubbler_rating(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_lead_bubbler_retention_criteria(UUID) TO authenticated;

-- Create RLS policies for interventions table
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interventions for their own jobs" ON interventions
    FOR SELECT USING (
        job_assignment_id IN (
            SELECT id FROM job_assignments WHERE bubbler_id = auth.uid()
        )
    );

CREATE POLICY "Lead bubblers can view interventions in their zone" ON interventions
    FOR SELECT USING (
        lead_bubbler_id = auth.uid() OR
        lead_bubbler_id IN (
            SELECT id FROM bubblers 
            WHERE assigned_zone = (
                SELECT assigned_zone FROM bubblers WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Lead bubblers can create interventions" ON interventions
    FOR INSERT WITH CHECK (
        lead_bubbler_id = auth.uid()
    );

-- Create RLS policies for promotions table
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own promotions" ON promotions
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Recruiters and admins can view all promotions" ON promotions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'recruiter')
        )
    );

CREATE POLICY "Recruiters and admins can create promotions" ON promotions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'recruiter')
        )
    );

-- Create RLS policies for onboarding_tracking table
ALTER TABLE onboarding_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding progress" ON onboarding_tracking
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Recruiters and admins can view all onboarding progress" ON onboarding_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'recruiter')
        )
    );

CREATE POLICY "Recruiters and admins can update onboarding progress" ON onboarding_tracking
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'recruiter')
        )
    );

-- Create RLS policies for lead_bubbler_reviews table
ALTER TABLE lead_bubbler_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view their own reviews" ON lead_bubbler_reviews
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all lead bubbler reviews" ON lead_bubbler_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can create lead bubbler reviews" ON lead_bubbler_reviews
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update lead bubbler reviews" ON lead_bubbler_reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for support_complaints table
ALTER TABLE support_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view complaints against them" ON support_complaints
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all support complaints" ON support_complaints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can create support complaints" ON support_complaints
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update support complaints" ON support_complaints
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for check_in_reports table
ALTER TABLE check_in_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view their own check-ins" ON check_in_reports
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all check-in reports" ON check_in_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Lead bubblers can create their own check-ins" ON check_in_reports
    FOR INSERT WITH CHECK (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can create check-in reports" ON check_in_reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for lead_bubbler_shifts table
ALTER TABLE lead_bubbler_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view their own shifts" ON lead_bubbler_shifts
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all lead bubbler shifts" ON lead_bubbler_shifts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can create lead bubbler shifts" ON lead_bubbler_shifts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update lead bubbler shifts" ON lead_bubbler_shifts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for coaching_notes table
ALTER TABLE coaching_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view their own coaching notes" ON coaching_notes
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all coaching notes" ON coaching_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Lead bubblers can create their own coaching notes" ON coaching_notes
    FOR INSERT WITH CHECK (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can create coaching notes" ON coaching_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for equipment_requests table
ALTER TABLE equipment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bubblers can view their own equipment requests" ON equipment_requests
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Lead bubblers can view equipment requests in their zone" ON equipment_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'lead_bubbler'
        )
    );

CREATE POLICY "Admins can view all equipment requests" ON equipment_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Bubblers can create equipment requests" ON equipment_requests
    FOR INSERT WITH CHECK (bubbler_id = auth.uid());

CREATE POLICY "Lead bubblers can update equipment requests" ON equipment_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'lead_bubbler'
        )
    );

-- Create RLS policies for training_sessions table
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view their own training sessions" ON training_sessions
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all training sessions" ON training_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can create training sessions" ON training_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Lead bubblers can update their own training sessions" ON training_sessions
    FOR UPDATE USING (lead_bubbler_id = auth.uid());

-- Create RLS policies for training_attendees table
ALTER TABLE training_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bubblers can view their own training attendance" ON training_attendees
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Lead bubblers can view attendees for their sessions" ON training_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_sessions 
            WHERE id = session_id 
            AND lead_bubbler_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all training attendees" ON training_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can create training attendees" ON training_attendees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for bubbler_feedback table
ALTER TABLE bubbler_feedback ENABLE ROW LEVEL SECURITY;

-- Regular bubblers can submit feedback about lead bubblers who checked in on them
CREATE POLICY "Bubblers can submit feedback for checkins on their jobs" ON bubbler_feedback
    FOR INSERT WITH CHECK (
        bubbler_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM lead_checkins 
            WHERE id = lead_checkin_id 
            AND assisting_bubbler_id = auth.uid()
        )
    );

-- Lead bubblers can view their own feedback (aggregated/anonymous)
CREATE POLICY "Lead bubblers can view their own feedback" ON bubbler_feedback
    FOR SELECT USING (lead_bubbler_id = auth.uid());

-- Admins can view all feedback
CREATE POLICY "Admins can view all bubbler feedback" ON bubbler_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Admins can update feedback status
CREATE POLICY "Admins can update bubbler feedback" ON bubbler_feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for takeover_verification_tasks table
ALTER TABLE takeover_verification_tasks ENABLE ROW LEVEL SECURITY;

-- Lead bubblers can view their own verification tasks
CREATE POLICY "Lead bubblers can view their own verification tasks" ON takeover_verification_tasks
    FOR SELECT USING (lead_bubbler_id = auth.uid());

-- Admin and support can view and update all verification tasks
CREATE POLICY "Admin and support can manage verification tasks" ON takeover_verification_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler', 'support', 'support_bubbler')
        )
    );

-- Add comments for documentation
COMMENT ON TABLE interventions IS 'Tracks interventions made by lead bubblers for job oversight';
COMMENT ON TABLE promotions IS 'Tracks internal promotion recommendations and approvals';
COMMENT ON TABLE onboarding_tracking IS 'Tracks onboarding progress for new bubblers';
COMMENT ON TABLE lead_bubbler_reviews IS 'Tracks performance reviews for lead bubblers with ratings and notes';
COMMENT ON TABLE support_complaints IS 'Tracks complaints against lead bubblers for retention monitoring';
COMMENT ON TABLE check_in_reports IS 'Tracks check-in reports for lead bubblers to monitor attendance';
COMMENT ON TABLE lead_bubbler_shifts IS 'Schedules oversight shifts for lead bubblers with pay rates and bonuses';
COMMENT ON TABLE coaching_notes IS 'Stores coaching notes and feedback from lead bubblers';
COMMENT ON TABLE equipment_requests IS 'Tracks equipment assistance requests from bubblers to lead bubblers';
COMMENT ON TABLE training_sessions IS 'Manages training sessions conducted by lead bubblers with flat pay rates';
COMMENT ON TABLE training_attendees IS 'Tracks attendance and certification for training session participants';
COMMENT ON TABLE bubbler_feedback IS 'Anonymous feedback from regular bubblers on lead bubbler performance after check-ins';
COMMENT ON TABLE takeover_verification_tasks IS 'Admin review tasks for takeover claims to prevent fraud and ensure proper compensation';

-- Create coaching_incidents table for tracking coaching opportunities
CREATE TABLE IF NOT EXISTS coaching_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    incident_type VARCHAR(100) NOT NULL, -- 'mirror_streaks', 'dusting_incomplete', 'counter_sanitizing', etc.
    error_severity VARCHAR(20) NOT NULL CHECK (error_severity IN ('minor', 'moderate', 'significant')),
    area_affected VARCHAR(100) NOT NULL, -- 'bathroom', 'kitchen', 'bedroom', etc.
    before_photo_url TEXT,
    after_photo_url TEXT,
    lead_coaching_notes TEXT, -- Quick tip provided onsite
    admin_coaching_notes TEXT, -- Formal coaching notes for email
    kb_article_tag VARCHAR(100), -- Tag for linking to knowledge base
    coaching_email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge_base_articles table for coaching resources
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_tag VARCHAR(100) UNIQUE NOT NULL, -- 'streak_free_mirrors', 'kitchen_sanitizing', etc.
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    estimated_read_time_minutes INTEGER DEFAULT 2,
    category VARCHAR(100) NOT NULL, -- 'cleaning_techniques', 'quality_standards', 'efficiency_tips'
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coaching_email_templates table for automated email generation
CREATE TABLE IF NOT EXISTS coaching_email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    subject_line TEXT NOT NULL,
    email_body TEXT NOT NULL,
    kb_article_placeholder VARCHAR(50) DEFAULT '{{KB_ARTICLE_LINK}}',
    bubbler_name_placeholder VARCHAR(50) DEFAULT '{{BUBBLER_NAME}}',
    job_id_placeholder VARCHAR(50) DEFAULT '{{JOB_ID}}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partial_takeover_approvals table for admin review workflow
CREATE TABLE IF NOT EXISTS partial_takeover_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    original_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    service_type VARCHAR(50) NOT NULL,
    errors_found_count INTEGER NOT NULL,
    areas_affected_count INTEGER NOT NULL,
    error_types TEXT[] NOT NULL, -- Array of error types
    error_severity_levels TEXT[] NOT NULL, -- Array of severity levels
    photo_evidence_urls TEXT[] NOT NULL, -- Array of before/after photo URLs
    lead_justification TEXT NOT NULL,
    threshold_met BOOLEAN NOT NULL,
    admin_reviewer_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approval_notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    payout_amount DECIMAL(6,2),
    original_bubbler_deduction DECIMAL(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bubbler_confirmation table for split documentation responsibility
CREATE TABLE IF NOT EXISTS bubbler_confirmation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partial_takeover_approval_id UUID REFERENCES partial_takeover_approvals(id) ON DELETE CASCADE,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    confirmation_type VARCHAR(20) NOT NULL CHECK (confirmation_type IN ('lead_bubbler', 'original_bubbler')),
    
    -- Split documentation fields
    did_assist_partial_takeover BOOLEAN, -- Lead: Yes, Bubbler: Yes/No
    was_physical_work_completed BOOLEAN, -- Lead: Yes, Bubbler: Yes/Dispute
    help_needed_reason VARCHAR(100), -- Lead: Select reason, Bubbler: Confirm/Deny
    time_spent_assisting INTEGER, -- Lead: Input minutes, Bubbler: Confirm/Deny
    photos_uploaded BOOLEAN, -- Lead: Yes, Bubbler: N/A
    
    -- Additional fields for evidence
    tasks_completed TEXT[], -- Array of completed tasks
    areas_assisted TEXT[], -- Array of areas assisted
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    total_minutes INTEGER,
    
    -- Dispute and confirmation fields
    disputes_claim BOOLEAN DEFAULT FALSE,
    dispute_reason TEXT,
    confirms_claim BOOLEAN DEFAULT FALSE,
    confirmation_notes TEXT,
    
    -- Admin review fields
    admin_reviewer_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'confirmed', 'disputed', 'resolved')),
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create oversight_alerts table for automated pattern detection
CREATE TABLE IF NOT EXISTS oversight_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- 'time_pattern', 'task_pattern', 'dispute_pattern', 'pair_pattern'
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    original_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    partial_takeover_approval_id UUID REFERENCES partial_takeover_approvals(id) ON DELETE SET NULL,
    
    -- Pattern details
    pattern_description TEXT NOT NULL,
    pattern_evidence JSONB, -- Store pattern data as JSON
    severity_level VARCHAR(20) DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Alert status
    alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'reviewed', 'resolved', 'dismissed')),
    assigned_admin_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shift_bonus_caps table for daily payout limits
CREATE TABLE IF NOT EXISTS shift_bonus_caps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_start_time TIMESTAMP WITH TIME ZONE,
    shift_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Bonus tracking
    partial_takeover_count INTEGER DEFAULT 0,
    total_bonus_amount DECIMAL(6,2) DEFAULT 0.00,
    max_bonus_cap DECIMAL(6,2) DEFAULT 30.00, -- Default $30 cap per shift
    admin_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    override_admin_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create disciplinary_actions table for accountability enforcement
CREATE TABLE IF NOT EXISTS disciplinary_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'coaching', 'warning', 'pay_clawback', 'demotion', 'removal'
    offense_type VARCHAR(50) NOT NULL, -- 'inflated_claim', 'false_dispute', 'pattern_abuse', 'repeated_violations'
    
    -- Action details
    action_description TEXT NOT NULL,
    evidence_references JSONB, -- Store references to related records
    admin_reviewer_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    
    -- Disciplinary tracking
    offense_count INTEGER DEFAULT 1, -- Which offense this is (1st, 2nd, 3rd)
    previous_actions TEXT[], -- Array of previous action types
    
    -- Action status
    action_status VARCHAR(20) DEFAULT 'active' CHECK (action_status IN ('active', 'completed', 'appealed', 'reversed')),
    effective_date DATE NOT NULL,
    end_date DATE, -- For temporary actions
    completion_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trust_but_verify_alerts table for high partial volume monitoring
CREATE TABLE IF NOT EXISTS trust_but_verify_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    zone_id VARCHAR(100), -- Zone identifier
    shift_date DATE NOT NULL,
    shift_start_time TIMESTAMP WITH TIME ZONE,
    shift_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Trigger metrics
    total_jobs_checked INTEGER NOT NULL,
    partial_takeovers_initiated INTEGER NOT NULL,
    partial_takeover_percentage DECIMAL(5,2) NOT NULL,
    trigger_threshold DECIMAL(5,2) NOT NULL, -- e.g., 60.00 for 60%
    
    -- Zone configuration
    zone_type VARCHAR(20) NOT NULL, -- 'small', 'medium', 'large'
    zone_bubbler_count INTEGER NOT NULL,
    lead_bubbler_count INTEGER NOT NULL,
    
    -- Affected bubblers and jobs
    affected_bubbler_ids UUID[], -- Array of bubbler IDs impacted
    affected_job_ids UUID[], -- Array of job IDs with partial takeovers
    partial_takeover_approval_ids UUID[], -- Array of approval IDs
    
    -- Alert status
    alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'reviewed', 'resolved', 'dismissed')),
    assigned_admin_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    review_notes TEXT,
    admin_action VARCHAR(50), -- 'approve_all', 'coaching_needed', 'pattern_review', 'escalate'
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create zone_configurations table for customizable thresholds
CREATE TABLE IF NOT EXISTS zone_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    zone_id VARCHAR(100) UNIQUE NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(20) NOT NULL, -- 'small', 'medium', 'large'
    
    -- Threshold configuration
    partial_takeover_threshold DECIMAL(5,2) NOT NULL, -- Percentage threshold (e.g., 60.00)
    min_jobs_for_trigger INTEGER NOT NULL, -- Minimum jobs before triggering (e.g., 3)
    max_partials_before_trigger INTEGER, -- Alternative: max partials before triggering
    
    -- Zone characteristics
    estimated_bubbler_count INTEGER NOT NULL,
    estimated_lead_bubbler_count INTEGER NOT NULL,
    typical_shift_hours INTEGER DEFAULT 8,
    
    -- Response tiers
    tier_1_response VARCHAR(100), -- e.g., 'approve_all'
    tier_2_response VARCHAR(100), -- e.g., 'coaching_needed'
    tier_3_response VARCHAR(100), -- e.g., 'pattern_review'
    tier_4_response VARCHAR(100), -- e.g., 'escalate'
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rework_tasks table for tap-based checklist system
CREATE TABLE IF NOT EXISTS rework_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    original_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    service_type VARCHAR(50) NOT NULL,
    rework_type VARCHAR(50) NOT NULL, -- 're_cleaning' or 'retouch'
    selected_tasks TEXT[] NOT NULL, -- Array of selected task types
    before_photo_urls TEXT[] NOT NULL, -- Array of before photo URLs
    after_photo_urls TEXT[] NOT NULL, -- Array of after photo URLs
    quick_notes TEXT, -- Optional notes (max 100 chars)
    threshold_met BOOLEAN NOT NULL,
    auto_triggered BOOLEAN DEFAULT FALSE, -- Whether system auto-prompted
    partial_takeover_approval_id UUID REFERENCES partial_takeover_approvals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rework_task_templates table for service-specific task options
CREATE TABLE IF NOT EXISTS rework_task_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type VARCHAR(50) NOT NULL,
    rework_type VARCHAR(50) NOT NULL, -- 're_cleaning' or 'retouch'
    task_label VARCHAR(100) NOT NULL, -- Display name
    task_key VARCHAR(100) NOT NULL, -- Internal key
    auto_trigger BOOLEAN DEFAULT FALSE, -- Whether this task auto-triggers partial takeover
    task_category VARCHAR(50), -- For grouping in UI
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_coaching_incidents_bubbler_id ON coaching_incidents(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_coaching_incidents_lead_bubbler_id ON coaching_incidents(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_coaching_incidents_incident_type ON coaching_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_coaching_incidents_created_at ON coaching_incidents(created_at);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_articles_article_tag ON knowledge_base_articles(article_tag);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_articles_category ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_articles_is_active ON knowledge_base_articles(is_active);

CREATE INDEX IF NOT EXISTS idx_coaching_email_templates_template_name ON coaching_email_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_coaching_email_templates_is_active ON coaching_email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_partial_takeover_approvals_order_id ON partial_takeover_approvals(order_id);
CREATE INDEX IF NOT EXISTS idx_partial_takeover_approvals_lead_bubbler_id ON partial_takeover_approvals(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_partial_takeover_approvals_original_bubbler_id ON partial_takeover_approvals(original_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_partial_takeover_approvals_approval_status ON partial_takeover_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_partial_takeover_approvals_created_at ON partial_takeover_approvals(created_at);

CREATE INDEX IF NOT EXISTS idx_rework_tasks_order_id ON rework_tasks(order_id);
CREATE INDEX IF NOT EXISTS idx_rework_tasks_lead_bubbler_id ON rework_tasks(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_rework_tasks_service_type ON rework_tasks(service_type);
CREATE INDEX IF NOT EXISTS idx_rework_tasks_rework_type ON rework_tasks(rework_type);
CREATE INDEX IF NOT EXISTS idx_rework_tasks_threshold_met ON rework_tasks(threshold_met);

CREATE INDEX IF NOT EXISTS idx_rework_task_templates_service_type ON rework_task_templates(service_type);
CREATE INDEX IF NOT EXISTS idx_rework_task_templates_rework_type ON rework_task_templates(rework_type);
CREATE INDEX IF NOT EXISTS idx_rework_task_templates_is_active ON rework_task_templates(is_active);

-- Indexes for oversight system tables
CREATE INDEX IF NOT EXISTS idx_bubbler_confirmation_approval_id ON bubbler_confirmation(partial_takeover_approval_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_confirmation_bubbler_id ON bubbler_confirmation(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_confirmation_confirmation_type ON bubbler_confirmation(confirmation_type);
CREATE INDEX IF NOT EXISTS idx_bubbler_confirmation_review_status ON bubbler_confirmation(review_status);

CREATE INDEX IF NOT EXISTS idx_oversight_alerts_alert_type ON oversight_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_oversight_alerts_lead_bubbler_id ON oversight_alerts(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_oversight_alerts_alert_status ON oversight_alerts(alert_status);
CREATE INDEX IF NOT EXISTS idx_oversight_alerts_severity_level ON oversight_alerts(severity_level);
CREATE INDEX IF NOT EXISTS idx_oversight_alerts_created_at ON oversight_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_shift_bonus_caps_lead_bubbler_id ON shift_bonus_caps(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_shift_bonus_caps_shift_date ON shift_bonus_caps(shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_bonus_caps_admin_override ON shift_bonus_caps(admin_override);

CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_bubbler_id ON disciplinary_actions(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_action_type ON disciplinary_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_offense_type ON disciplinary_actions(offense_type);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_action_status ON disciplinary_actions(action_status);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_effective_date ON disciplinary_actions(effective_date);

-- Indexes for trust but verify system
CREATE INDEX IF NOT EXISTS idx_trust_but_verify_alerts_lead_bubbler_id ON trust_but_verify_alerts(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_trust_but_verify_alerts_zone_id ON trust_but_verify_alerts(zone_id);
CREATE INDEX IF NOT EXISTS idx_trust_but_verify_alerts_shift_date ON trust_but_verify_alerts(shift_date);
CREATE INDEX IF NOT EXISTS idx_trust_but_verify_alerts_alert_status ON trust_but_verify_alerts(alert_status);
CREATE INDEX IF NOT EXISTS idx_trust_but_verify_alerts_partial_takeover_percentage ON trust_but_verify_alerts(partial_takeover_percentage);

CREATE INDEX IF NOT EXISTS idx_zone_configurations_zone_id ON zone_configurations(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_configurations_zone_type ON zone_configurations(zone_type);
CREATE INDEX IF NOT EXISTS idx_zone_configurations_is_active ON zone_configurations(is_active);

-- Indexes for final partial takeover logic tables
CREATE INDEX IF NOT EXISTS idx_job_time_expectations_service_type ON job_time_expectations(service_type);
CREATE INDEX IF NOT EXISTS idx_job_time_expectations_is_active ON job_time_expectations(is_active);

CREATE INDEX IF NOT EXISTS idx_task_effort_classification_effort_level ON task_effort_classification(effort_level);
CREATE INDEX IF NOT EXISTS idx_task_effort_classification_service_type ON task_effort_classification(service_type);
CREATE INDEX IF NOT EXISTS idx_task_effort_classification_is_active ON task_effort_classification(is_active);

CREATE INDEX IF NOT EXISTS idx_partial_takeover_triggers_approval_id ON partial_takeover_triggers(partial_takeover_approval_id);
CREATE INDEX IF NOT EXISTS idx_partial_takeover_triggers_trigger_path ON partial_takeover_triggers(trigger_path);
CREATE INDEX IF NOT EXISTS idx_partial_takeover_triggers_threshold_met ON partial_takeover_triggers(threshold_met);

-- Create triggers for new tables
CREATE TRIGGER update_coaching_incidents_timestamp
    BEFORE UPDATE ON coaching_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_knowledge_base_articles_timestamp
    BEFORE UPDATE ON knowledge_base_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_coaching_email_templates_timestamp
    BEFORE UPDATE ON coaching_email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_partial_takeover_approvals_timestamp
    BEFORE UPDATE ON partial_takeover_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_rework_tasks_timestamp
    BEFORE UPDATE ON rework_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_rework_task_templates_timestamp
    BEFORE UPDATE ON rework_task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Triggers for oversight system tables
CREATE TRIGGER update_bubbler_confirmation_timestamp
    BEFORE UPDATE ON bubbler_confirmation
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_oversight_alerts_timestamp
    BEFORE UPDATE ON oversight_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_shift_bonus_caps_timestamp
    BEFORE UPDATE ON shift_bonus_caps
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_disciplinary_actions_timestamp
    BEFORE UPDATE ON disciplinary_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Triggers for trust but verify system
CREATE TRIGGER update_trust_but_verify_alerts_timestamp
    BEFORE UPDATE ON trust_but_verify_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_zone_configurations_timestamp
    BEFORE UPDATE ON zone_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Triggers for final partial takeover logic tables
CREATE TRIGGER update_job_time_expectations_timestamp
    BEFORE UPDATE ON job_time_expectations
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_task_effort_classification_timestamp
    BEFORE UPDATE ON task_effort_classification
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_partial_takeover_triggers_timestamp
    BEFORE UPDATE ON partial_takeover_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create job_completion_checklist table for task-by-task progress tracking
CREATE TABLE IF NOT EXISTS job_completion_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    task_label TEXT NOT NULL, -- e.g., "Bedroom 1", "Bathroom 2", "Kitchen"
    task_category VARCHAR(100) NOT NULL, -- 'bedroom', 'bathroom', 'kitchen', 'common_area', 'exterior', 'interior'
    completed_by_bubbler BOOLEAN DEFAULT FALSE,
    completed_by_lead_bubbler BOOLEAN DEFAULT FALSE,
    timestamp_checked TIMESTAMP WITH TIME ZONE,
    completion_weight INTEGER DEFAULT 1, -- Optional: for weighted % (e.g., kitchen = 30%)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bubbler_takeover_history table for abuse detection
CREATE TABLE IF NOT EXISTS bubbler_takeover_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    takeover_type VARCHAR(50) NOT NULL, -- 'full', 'partial', 'wrap_up'
    completion_percentage DECIMAL(5,2) NOT NULL,
    original_bubbler_payout DECIMAL(6,2) NOT NULL,
    lead_bubbler_payout DECIMAL(6,2) NOT NULL,
    bonus_amount DECIMAL(5,2) DEFAULT 0.00,
    reason_given TEXT,
    admin_override BOOLEAN DEFAULT FALSE,
    override_reason TEXT,
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_job_completion_checklist_order_id ON job_completion_checklist(order_id);
CREATE INDEX IF NOT EXISTS idx_job_completion_checklist_completed_by_bubbler ON job_completion_checklist(completed_by_bubbler);
CREATE INDEX IF NOT EXISTS idx_job_completion_checklist_timestamp_checked ON job_completion_checklist(timestamp_checked);

CREATE INDEX IF NOT EXISTS idx_bubbler_takeover_history_bubbler_id ON bubbler_takeover_history(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_takeover_history_order_id ON bubbler_takeover_history(order_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_takeover_history_takeover_type ON bubbler_takeover_history(takeover_type);
CREATE INDEX IF NOT EXISTS idx_bubbler_takeover_history_flagged ON bubbler_takeover_history(flagged);
CREATE INDEX IF NOT EXISTS idx_bubbler_takeover_history_created_at ON bubbler_takeover_history(created_at);

-- Create triggers for new tables
CREATE TRIGGER update_job_completion_checklist_timestamp
    BEFORE UPDATE ON job_completion_checklist
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_bubbler_takeover_history_timestamp
    BEFORE UPDATE ON bubbler_takeover_history
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Create bubbler_flags table for performance tracking and QA frequency
CREATE TABLE IF NOT EXISTS bubbler_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    flag_type VARCHAR(50) NOT NULL, -- 'new_bubbler', 'bad_rating', 'low_performance', 'high_performer'
    flag_reason TEXT,
    check_in_frequency VARCHAR(20) NOT NULL, -- 'every_job', 'weekly', 'biweekly', 'random'
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_checkin_schedule table for automated QA scheduling
CREATE TABLE IF NOT EXISTS lead_checkin_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE CASCADE,
    lead_bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    job_assignment_id UUID REFERENCES job_assignments(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL, -- 'mandatory', 'random', 'performance_based'
    check_in_reason TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- 'high', 'normal', 'low'
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_bubbler_flags_bubbler_id ON bubbler_flags(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_bubbler_flags_flag_type ON bubbler_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_bubbler_flags_is_active ON bubbler_flags(is_active);

CREATE INDEX IF NOT EXISTS idx_lead_checkin_schedule_bubbler_id ON lead_checkin_schedule(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_lead_checkin_schedule_lead_bubbler_id ON lead_checkin_schedule(lead_bubbler_id);
CREATE INDEX IF NOT EXISTS idx_lead_checkin_schedule_scheduled_date ON lead_checkin_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_lead_checkin_schedule_is_completed ON lead_checkin_schedule(is_completed);

-- Create triggers for new tables
CREATE TRIGGER update_bubbler_flags_timestamp
    BEFORE UPDATE ON bubbler_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_lead_checkin_schedule_timestamp
    BEFORE UPDATE ON lead_checkin_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();
COMMENT ON FUNCTION calculate_lead_effectiveness(UUID) IS 'Calculates effectiveness rating for lead bubblers based on intervention rate';
COMMENT ON FUNCTION check_promotion_eligibility(UUID) IS 'Checks if a bubbler is eligible for promotion based on performance criteria';
COMMENT ON FUNCTION calculate_promotion_score(UUID) IS 'Calculates a promotion score (0-100) for a bubbler based on various metrics';

-- Function to create verification task when partial or full takeover is logged
CREATE OR REPLACE FUNCTION create_takeover_verification_task()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create verification task for partial or full takeovers
    IF NEW.takeover_type IN ('partial', 'full') THEN
        INSERT INTO takeover_verification_tasks (
            lead_checkin_id,
            lead_bubbler_id,
            original_bubbler_id,
            job_assignment_id,
            takeover_type,
            status,
            created_at
        ) VALUES (
            NEW.id,
            NEW.lead_bubbler_id,
            NEW.assisting_bubbler_id,
            NEW.job_assignment_id,
            NEW.takeover_type,
            'pending',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create verification task
CREATE TRIGGER trigger_create_takeover_verification_task
    AFTER INSERT ON lead_checkins
    FOR EACH ROW
    EXECUTE FUNCTION create_takeover_verification_task();

-- Function to calculate job completion percentage based on checklist
CREATE OR REPLACE FUNCTION calculate_job_completion_percentage(order_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_weight INTEGER;
    completed_weight INTEGER;
    completion_percentage DECIMAL(5,2);
BEGIN
    -- Calculate total weight of all tasks
    SELECT COALESCE(SUM(completion_weight), 0) INTO total_weight
    FROM job_completion_checklist 
    WHERE order_id = order_uuid;
    
    -- Calculate completed weight by original bubbler
    SELECT COALESCE(SUM(completion_weight), 0) INTO completed_weight
    FROM job_completion_checklist 
    WHERE order_id = order_uuid AND completed_by_bubbler = TRUE;
    
    -- Calculate percentage
    IF total_weight = 0 THEN
        completion_percentage := 0.00;
    ELSE
        completion_percentage := (completed_weight::DECIMAL / total_weight::DECIMAL) * 100;
    END IF;
    
    RETURN completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to detect abuse patterns in takeover history
CREATE OR REPLACE FUNCTION detect_takeover_abuse(bubbler_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE(
    is_flagged BOOLEAN,
    flag_reason TEXT,
    takeover_count INTEGER,
    total_payout_lost DECIMAL(6,2),
    average_completion_percentage DECIMAL(5,2)
) AS $$
DECLARE
    recent_takeovers INTEGER;
    total_lost DECIMAL(6,2);
    avg_completion DECIMAL(5,2);
    should_flag BOOLEAN := FALSE;
    flag_message TEXT;
BEGIN
    -- Count takeovers in the specified period
    SELECT COUNT(*), 
           COALESCE(SUM(original_bubbler_payout), 0),
           COALESCE(AVG(completion_percentage), 0)
    INTO recent_takeovers, total_lost, avg_completion
    FROM bubbler_takeover_history
    WHERE bubbler_id = bubbler_uuid 
    AND created_at >= NOW() - INTERVAL '1 day' * days_back;
    
    -- Determine if should be flagged
    IF recent_takeovers >= 3 THEN
        should_flag := TRUE;
        flag_message := 'Multiple takeovers detected - ' || recent_takeovers || ' takeovers in ' || days_back || ' days';
    ELSIF recent_takeovers >= 2 AND avg_completion < 30 THEN
        should_flag := TRUE;
        flag_message := 'Low completion rate with multiple takeovers - average ' || avg_completion || '% completion';
    ELSIF total_lost > 100 THEN
        should_flag := TRUE;
        flag_message := 'High payout loss - $' || total_lost || ' lost in ' || days_back || ' days';
    END IF;
    
    RETURN QUERY SELECT 
        should_flag,
        flag_message,
        recent_takeovers,
        total_lost,
        avg_completion;
END;
$$ LANGUAGE plpgsql;

-- Function to handle QA escalation and reclassification
CREATE OR REPLACE FUNCTION process_qa_escalation(
    order_uuid UUID,
    lead_bubbler_uuid UUID,
    escalation_type VARCHAR(50), -- 'qa_only', 'partial_takeover', 'full_takeover'
    tasks_redone TEXT[], -- Array of task labels that were redone
    photo_evidence_urls TEXT[], -- Array of photo URLs
    escalation_notes TEXT,
    original_completion_percentage DECIMAL(5,2) DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    escalation_type VARCHAR(50),
    compensation_type VARCHAR(50),
    original_bubbler_payout DECIMAL(6,2),
    lead_bubbler_payout DECIMAL(6,2),
    bonus_amount DECIMAL(5,2),
    message TEXT
) AS $$
DECLARE
    order_record RECORD;
    job_assignment_record RECORD;
    comp_record RECORD;
    abuse_record RECORD;
    final_completion_pct DECIMAL(5,2);
    service_type VARCHAR(50);
BEGIN
    -- Get order and job assignment details
    SELECT * INTO order_record FROM orders WHERE id = order_uuid;
    SELECT * INTO job_assignment_record FROM job_assignments WHERE order_id = order_uuid LIMIT 1;
    
    -- Determine service type
    service_type := order_record.service_type;
    
    -- Calculate final completion percentage based on escalation type
    CASE escalation_type
        WHEN 'qa_only' THEN
            -- No change to completion percentage
            final_completion_pct := COALESCE(original_completion_percentage, 100.00);
            
        WHEN 'partial_takeover' THEN
            -- Reduce completion percentage by tasks redone
            final_completion_pct := COALESCE(original_completion_percentage, 100.00) - 
                                  (array_length(tasks_redone, 1) * 10.00); -- 10% per task
            final_completion_pct := GREATEST(final_completion_pct, 51.00); -- Ensure it stays in partial range
            
        WHEN 'full_takeover' THEN
            -- Set to low percentage indicating significant issues
            final_completion_pct := CASE 
                WHEN array_length(tasks_redone, 1) >= 5 THEN 0.00 -- Complete fraud
                WHEN array_length(tasks_redone, 1) >= 3 THEN 20.00 -- Major issues
                ELSE 30.00 -- Significant problems
            END;
            
        ELSE
            final_completion_pct := COALESCE(original_completion_percentage, 100.00);
    END CASE;
    
    -- Calculate compensation based on final completion percentage
    SELECT * INTO comp_record FROM calculate_completion_based_compensation(
        order_uuid, 
        final_completion_pct, 
        service_type, 
        escalation_notes
    );
    
    -- Check for abuse patterns
    SELECT * INTO abuse_record FROM detect_takeover_abuse(job_assignment_record.bubbler_id, 30);
    
    -- Insert escalation record
    INSERT INTO lead_checkins (
        lead_bubbler_id,
        order_id,
        checkin_type,
        escalation_type,
        escalation_notes,
        tasks_redone,
        photo_evidence_urls,
        original_completion_percentage,
        final_completion_percentage,
        compensation_type,
        original_bubbler_payout,
        lead_bubbler_payout,
        bonus_amount,
        flagged,
        flag_reason
    ) VALUES (
        lead_bubbler_uuid,
        order_uuid,
        'qa_escalation',
        escalation_type,
        escalation_notes,
        tasks_redone,
        photo_evidence_urls,
        original_completion_percentage,
        final_completion_pct,
        comp_record.compensation_type,
        comp_record.original_bubbler_payout,
        comp_record.lead_bubbler_payout,
        comp_record.bonus_amount,
        abuse_record.is_flagged,
        abuse_record.flag_reason
    );
    
    -- Insert takeover history record
    INSERT INTO bubbler_takeover_history (
        bubbler_id,
        order_id,
        lead_bubbler_id,
        takeover_type,
        completion_percentage,
        original_bubbler_payout,
        lead_bubbler_payout,
        bonus_amount,
        reason_given,
        flagged,
        flag_reason
    ) VALUES (
        job_assignment_record.bubbler_id,
        order_uuid,
        lead_bubbler_uuid,
        escalation_type,
        final_completion_pct,
        comp_record.original_bubbler_payout,
        comp_record.lead_bubbler_payout,
        comp_record.bonus_amount,
        escalation_notes,
        abuse_record.is_flagged,
        abuse_record.flag_reason
    );
    
    RETURN QUERY SELECT 
        TRUE,
        escalation_type,
        comp_record.compensation_type,
        comp_record.original_bubbler_payout,
        comp_record.lead_bubbler_payout,
        comp_record.bonus_amount,
        comp_record.compensation_reason;
END;
$$ LANGUAGE plpgsql;

-- Function to process takeover compensation automatically
CREATE OR REPLACE FUNCTION process_takeover_compensation(
    order_uuid UUID,
    lead_bubbler_uuid UUID,
    takeover_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    completion_percentage DECIMAL(5,2),
    original_bubbler_payout DECIMAL(6,2),
    lead_bubbler_payout DECIMAL(6,2),
    compensation_type VARCHAR(50),
    bonus_amount DECIMAL(5,2),
    message TEXT
) AS $$
DECLARE
    completion_pct DECIMAL(5,2);
    comp_record RECORD;
    order_record RECORD;
    job_assignment_record RECORD;
    abuse_record RECORD;
BEGIN
    -- Get order details
    SELECT * INTO order_record FROM orders WHERE id = order_uuid;
    
    -- Get job assignment
    SELECT * INTO job_assignment_record FROM job_assignments WHERE order_id = order_uuid LIMIT 1;
    
    -- Calculate completion percentage
    completion_pct := calculate_job_completion_percentage(order_uuid);
    
    -- Calculate compensation
    SELECT * INTO comp_record FROM calculate_completion_based_compensation(
        order_uuid, 
        completion_pct, 
        order_record.service_type, 
        takeover_reason
    );
    
    -- Check for abuse patterns
    SELECT * INTO abuse_record FROM detect_takeover_abuse(job_assignment_record.bubbler_id, 30);
    
    -- Insert takeover history record
    INSERT INTO bubbler_takeover_history (
        bubbler_id,
        order_id,
        lead_bubbler_id,
        takeover_type,
        completion_percentage,
        original_bubbler_payout,
        lead_bubbler_payout,
        bonus_amount,
        reason_given,
        flagged,
        flag_reason
    ) VALUES (
        job_assignment_record.bubbler_id,
        order_uuid,
        lead_bubbler_uuid,
        comp_record.compensation_type,
        completion_pct,
        comp_record.original_bubbler_payout,
        comp_record.lead_bubbler_payout,
        comp_record.bonus_amount,
        takeover_reason,
        abuse_record.is_flagged,
        abuse_record.flag_reason
    );
    
    RETURN QUERY SELECT 
        TRUE,
        completion_pct,
        comp_record.original_bubbler_payout,
        comp_record.lead_bubbler_payout,
        comp_record.compensation_type,
        comp_record.bonus_amount,
        comp_record.compensation_reason;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for new tables
GRANT SELECT, INSERT, UPDATE ON bubbler_flags TO authenticated;
GRANT ALL ON bubbler_flags TO service_role;

GRANT SELECT, INSERT, UPDATE ON lead_checkin_schedule TO authenticated;
GRANT ALL ON lead_checkin_schedule TO service_role;

-- Grant permissions for completion tracking tables
GRANT SELECT, INSERT, UPDATE ON job_completion_checklist TO authenticated;
GRANT ALL ON job_completion_checklist TO service_role;

GRANT SELECT, INSERT, UPDATE ON bubbler_takeover_history TO authenticated;
GRANT ALL ON bubbler_takeover_history TO service_role;

-- Grant permissions for coaching and knowledge base tables
GRANT SELECT, INSERT, UPDATE ON coaching_incidents TO authenticated;
GRANT ALL ON coaching_incidents TO service_role;

GRANT SELECT, INSERT, UPDATE ON knowledge_base_articles TO authenticated;
GRANT ALL ON knowledge_base_articles TO service_role;

GRANT SELECT, INSERT, UPDATE ON coaching_email_templates TO authenticated;
GRANT ALL ON coaching_email_templates TO service_role;

GRANT SELECT, INSERT, UPDATE ON partial_takeover_approvals TO authenticated;
GRANT ALL ON partial_takeover_approvals TO service_role;

GRANT SELECT, INSERT, UPDATE ON rework_tasks TO authenticated;
GRANT ALL ON rework_tasks TO service_role;

GRANT SELECT, INSERT, UPDATE ON rework_task_templates TO authenticated;
GRANT ALL ON rework_task_templates TO service_role;

GRANT SELECT, INSERT, UPDATE ON bubbler_confirmation TO authenticated;
GRANT ALL ON bubbler_confirmation TO service_role;

GRANT SELECT, INSERT, UPDATE ON oversight_alerts TO authenticated;
GRANT ALL ON oversight_alerts TO service_role;

GRANT SELECT, INSERT, UPDATE ON shift_bonus_caps TO authenticated;
GRANT ALL ON shift_bonus_caps TO service_role;

GRANT SELECT, INSERT, UPDATE ON disciplinary_actions TO authenticated;
GRANT ALL ON disciplinary_actions TO service_role;

GRANT SELECT, INSERT, UPDATE ON trust_but_verify_alerts TO authenticated;
GRANT ALL ON trust_but_verify_alerts TO service_role;

GRANT SELECT, INSERT, UPDATE ON zone_configurations TO authenticated;
GRANT ALL ON zone_configurations TO service_role;

-- Grant execute permissions for trust but verify functions
GRANT EXECUTE ON FUNCTION check_trust_but_verify_threshold(UUID, VARCHAR, DATE, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION process_trust_but_verify_review(UUID, UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_zone_configuration_recommendations(INTEGER, VARCHAR) TO authenticated;

-- Grant execute permissions for partial takeover functions
GRANT EXECUTE ON FUNCTION initiate_partial_takeover_approval(UUID, UUID, TEXT[], TEXT[], TEXT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_partial_takeover_approval(UUID, UUID, VARCHAR, TEXT) TO authenticated;

-- Grant execute permissions for rework task functions
GRANT EXECUTE ON FUNCTION get_rework_task_options(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION process_rework_task(UUID, UUID, VARCHAR, TEXT[], TEXT[], TEXT[], TEXT) TO authenticated;

-- Grant execute permissions for oversight system functions
GRANT EXECUTE ON FUNCTION create_bubbler_confirmation(UUID, UUID, VARCHAR, BOOLEAN, BOOLEAN, VARCHAR, INTEGER, BOOLEAN, TEXT[], TEXT[], TIMESTAMP, TIMESTAMP, BOOLEAN, TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_patterns(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_shift_bonus_cap(UUID, DATE, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION enforce_disciplinary_action(UUID, VARCHAR, VARCHAR, TEXT, JSONB) TO authenticated;

-- Function to check trust but verify threshold for Lead Bubbler
CREATE OR REPLACE FUNCTION check_trust_but_verify_threshold(
    lead_bubbler_id UUID,
    zone_id VARCHAR(100),
    shift_date DATE,
    shift_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    shift_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
    threshold_triggered BOOLEAN,
    total_jobs_checked INTEGER,
    partial_takeovers_initiated INTEGER,
    partial_takeover_percentage DECIMAL(5,2),
    trigger_threshold DECIMAL(5,2),
    zone_type VARCHAR(20),
    alert_id UUID,
    message TEXT
) AS $$
DECLARE
    zone_config RECORD;
    job_count INTEGER := 0;
    partial_count INTEGER := 0;
    percentage DECIMAL(5,2) := 0.00;
    threshold_met BOOLEAN := FALSE;
    new_alert_id UUID;
    result_message TEXT;
    affected_bubbler_ids UUID[];
    affected_job_ids UUID[];
    approval_ids UUID[];
BEGIN
    -- Get zone configuration
    SELECT * INTO zone_config FROM zone_configurations 
    WHERE zone_id = check_trust_but_verify_threshold.zone_id 
    AND is_active = TRUE;
    
    IF zone_config IS NULL THEN
        -- Use default configuration based on zone size
        zone_config.zone_type := 'medium';
        zone_config.partial_takeover_threshold := 60.00;
        zone_config.min_jobs_for_trigger := 3;
        zone_config.estimated_bubbler_count := 5;
        zone_config.estimated_lead_bubbler_count := 1;
    END IF;
    
    -- Count total jobs checked by this Lead Bubbler in the shift
    SELECT COUNT(DISTINCT o.id) INTO job_count
    FROM orders o
    JOIN job_assignments ja ON o.id = ja.order_id
    JOIN lead_checkins lc ON ja.id = lc.job_assignment_id
    WHERE lc.lead_bubbler_id = check_trust_but_verify_threshold.lead_bubbler_id
    AND o.zone = check_trust_but_verify_threshold.zone_id
    AND DATE(o.scheduled_date) = check_trust_but_verify_threshold.shift_date
    AND (shift_start_time IS NULL OR o.scheduled_date >= shift_start_time)
    AND (shift_end_time IS NULL OR o.scheduled_date <= shift_end_time);
    
    -- Count partial takeovers initiated
    SELECT COUNT(*), 
           array_agg(DISTINCT pta.original_bubbler_id),
           array_agg(DISTINCT pta.order_id),
           array_agg(pta.id)
    INTO partial_count, affected_bubbler_ids, affected_job_ids, approval_ids
    FROM partial_takeover_approvals pta
    JOIN orders o ON pta.order_id = o.id
    WHERE pta.lead_bubbler_id = check_trust_but_verify_threshold.lead_bubbler_id
    AND o.zone = check_trust_but_verify_threshold.zone_id
    AND DATE(pta.created_at) = check_trust_but_verify_threshold.shift_date
    AND (shift_start_time IS NULL OR pta.created_at >= shift_start_time)
    AND (shift_end_time IS NULL OR pta.created_at <= shift_end_time);
    
    -- Calculate percentage
    IF job_count > 0 THEN
        percentage := (partial_count::DECIMAL / job_count::DECIMAL) * 100;
    END IF;
    
    -- Check if threshold is met
    threshold_met := job_count >= zone_config.min_jobs_for_trigger 
                    AND percentage >= zone_config.partial_takeover_threshold;
    
    -- Create alert if threshold is triggered
    IF threshold_met THEN
        INSERT INTO trust_but_verify_alerts (
            lead_bubbler_id,
            zone_id,
            shift_date,
            shift_start_time,
            shift_end_time,
            total_jobs_checked,
            partial_takeovers_initiated,
            partial_takeover_percentage,
            trigger_threshold,
            zone_type,
            zone_bubbler_count,
            lead_bubbler_count,
            affected_bubbler_ids,
            affected_job_ids,
            partial_takeover_approval_ids
        ) VALUES (
            lead_bubbler_id,
            zone_id,
            shift_date,
            shift_start_time,
            shift_end_time,
            job_count,
            partial_count,
            percentage,
            zone_config.partial_takeover_threshold,
            zone_config.zone_type,
            zone_config.estimated_bubbler_count,
            zone_config.estimated_lead_bubbler_count,
            affected_bubbler_ids,
            affected_job_ids,
            approval_ids
        ) RETURNING id INTO new_alert_id;
        
        result_message := 'Trust But Verify alert triggered: ' || partial_count || ' partial takeovers out of ' || job_count || ' jobs (' || percentage || '%)';
    ELSE
        new_alert_id := NULL;
        result_message := 'No threshold triggered: ' || partial_count || ' partial takeovers out of ' || job_count || ' jobs (' || percentage || '%)';
    END IF;
    
    RETURN QUERY SELECT 
        threshold_met,
        job_count,
        partial_count,
        percentage,
        zone_config.partial_takeover_threshold,
        zone_config.zone_type,
        new_alert_id,
        result_message;
END;
$$ LANGUAGE plpgsql;

-- Function to process admin review of trust but verify alert
CREATE OR REPLACE FUNCTION process_trust_but_verify_review(
    alert_id UUID,
    admin_reviewer_id UUID,
    admin_action VARCHAR(50),
    review_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    action_taken VARCHAR(50),
    affected_approvals INTEGER,
    message TEXT
) AS $$
DECLARE
    alert_record RECORD;
    approval_count INTEGER := 0;
    action_result VARCHAR(50);
    result_message TEXT;
BEGIN
    -- Get alert record
    SELECT * INTO alert_record FROM trust_but_verify_alerts WHERE id = alert_id;
    
    IF alert_record IS NULL THEN
        RETURN QUERY SELECT FALSE, 'error'::VARCHAR(50), 0, 'Alert not found'::TEXT;
        RETURN;
    END IF;
    
    -- Update alert status
    UPDATE trust_but_verify_alerts 
    SET alert_status = 'resolved',
        assigned_admin_id = admin_reviewer_id,
        admin_action = admin_action,
        review_notes = review_notes,
        resolved_at = NOW()
    WHERE id = alert_id;
    
    -- Process based on admin action
    CASE admin_action
        WHEN 'approve_all' THEN
            -- Approve all partial takeovers in this alert
            UPDATE partial_takeover_approvals 
            SET approval_status = 'approved',
                admin_reviewer_id = process_trust_but_verify_review.admin_reviewer_id,
                approved_at = NOW()
            WHERE id = ANY(alert_record.partial_takeover_approval_ids);
            
            GET DIAGNOSTICS approval_count = ROW_COUNT;
            action_result := 'approve_all';
            result_message := 'All ' || approval_count || ' partial takeovers approved';
            
        WHEN 'coaching_needed' THEN
            -- Flag for coaching but approve payouts
            UPDATE partial_takeover_approvals 
            SET approval_status = 'approved',
                admin_reviewer_id = process_trust_but_verify_review.admin_reviewer_id,
                approved_at = NOW(),
                approval_notes = 'Approved with coaching note: ' || review_notes
            WHERE id = ANY(alert_record.partial_takeover_approval_ids);
            
            GET DIAGNOSTICS approval_count = ROW_COUNT;
            action_result := 'coaching_needed';
            result_message := 'All ' || approval_count || ' partial takeovers approved with coaching flag';
            
        WHEN 'pattern_review' THEN
            -- Mark for pattern review - don't approve yet
            UPDATE partial_takeover_approvals 
            SET approval_status = 'pending',
                admin_reviewer_id = process_trust_but_verify_review.admin_reviewer_id,
                approval_notes = 'Pattern review required: ' || review_notes
            WHERE id = ANY(alert_record.partial_takeover_approval_ids);
            
            GET DIAGNOSTICS approval_count = ROW_COUNT;
            action_result := 'pattern_review';
            result_message := approval_count || ' partial takeovers marked for pattern review';
            
        WHEN 'escalate' THEN
            -- Escalate to management - don't approve
            UPDATE partial_takeover_approvals 
            SET approval_status = 'pending',
                admin_reviewer_id = process_trust_but_verify_review.admin_reviewer_id,
                approval_notes = 'Escalated to management: ' || review_notes
            WHERE id = ANY(alert_record.partial_takeover_approval_ids);
            
            GET DIAGNOSTICS approval_count = ROW_COUNT;
            action_result := 'escalate';
            result_message := approval_count || ' partial takeovers escalated to management';
            
        ELSE
            action_result := 'unknown_action';
            result_message := 'Unknown admin action: ' || admin_action;
    END CASE;
    
    RETURN QUERY SELECT 
        TRUE,
        action_result,
        approval_count,
        result_message;
END;
$$ LANGUAGE plpgsql;

-- Function to get zone configuration recommendations
CREATE OR REPLACE FUNCTION get_zone_configuration_recommendations(
    zone_bubbler_count INTEGER,
    zone_type VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE(
    recommended_zone_type VARCHAR(20),
    recommended_threshold DECIMAL(5,2),
    recommended_min_jobs INTEGER,
    reasoning TEXT
) AS $$
DECLARE
    calculated_zone_type VARCHAR(20);
    calculated_threshold DECIMAL(5,2);
    calculated_min_jobs INTEGER;
    reasoning_text TEXT;
BEGIN
    -- Determine zone type based on bubbler count
    calculated_zone_type := CASE 
        WHEN zone_bubbler_count <= 3 THEN 'small'
        WHEN zone_bubbler_count <= 6 THEN 'medium'
        ELSE 'large'
    END;
    
    -- Override if explicitly provided
    IF zone_type IS NOT NULL THEN
        calculated_zone_type := zone_type;
    END IF;
    
    -- Set recommendations based on zone type
    CASE calculated_zone_type
        WHEN 'small' THEN
            calculated_threshold := 50.00; -- 50% threshold for small zones
            calculated_min_jobs := 2; -- Trigger after 2 jobs
            reasoning_text := 'Small zone: Lower threshold due to fewer jobs, higher impact per partial takeover';
            
        WHEN 'medium' THEN
            calculated_threshold := 60.00; -- 60% threshold for medium zones
            calculated_min_jobs := 3; -- Trigger after 3 jobs
            reasoning_text := 'Medium zone: Standard threshold balancing trust and oversight';
            
        WHEN 'large' THEN
            calculated_threshold := 70.00; -- 70% threshold for large zones
            calculated_min_jobs := 5; -- Trigger after 5 jobs
            reasoning_text := 'Large zone: Higher threshold due to more jobs, lower impact per partial takeover';
            
        ELSE
            calculated_threshold := 60.00;
            calculated_min_jobs := 3;
            reasoning_text := 'Default configuration applied';
    END CASE;
    
    RETURN QUERY SELECT 
        calculated_zone_type,
        calculated_threshold,
        calculated_min_jobs,
        reasoning_text;
END;
$$ LANGUAGE plpgsql;

-- Function to create bubbler confirmation for split documentation
CREATE OR REPLACE FUNCTION create_bubbler_confirmation(
    partial_takeover_approval_id UUID,
    bubbler_id UUID,
    confirmation_type VARCHAR(20),
    did_assist_partial_takeover BOOLEAN,
    was_physical_work_completed BOOLEAN,
    help_needed_reason VARCHAR(100),
    time_spent_assisting INTEGER,
    photos_uploaded BOOLEAN DEFAULT NULL,
    tasks_completed TEXT[] DEFAULT NULL,
    areas_assisted TEXT[] DEFAULT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    disputes_claim BOOLEAN DEFAULT FALSE,
    dispute_reason TEXT DEFAULT NULL,
    confirms_claim BOOLEAN DEFAULT FALSE,
    confirmation_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    confirmation_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    new_confirmation_id UUID;
    result_message TEXT;
BEGIN
    -- Validate confirmation type
    IF confirmation_type NOT IN ('lead_bubbler', 'original_bubbler') THEN
        RETURN QUERY SELECT 
            NULL::UUID,
            FALSE,
            'Invalid confirmation type. Must be lead_bubbler or original_bubbler.'::TEXT;
        RETURN;
    END IF;
    
    -- Insert confirmation record
    INSERT INTO bubbler_confirmation (
        partial_takeover_approval_id,
        bubbler_id,
        confirmation_type,
        did_assist_partial_takeover,
        was_physical_work_completed,
        help_needed_reason,
        time_spent_assisting,
        photos_uploaded,
        tasks_completed,
        areas_assisted,
        start_time,
        end_time,
        disputes_claim,
        dispute_reason,
        confirms_claim,
        confirmation_notes
    ) VALUES (
        create_bubbler_confirmation.partial_takeover_approval_id,
        create_bubbler_confirmation.bubbler_id,
        create_bubbler_confirmation.confirmation_type,
        create_bubbler_confirmation.did_assist_partial_takeover,
        create_bubbler_confirmation.was_physical_work_completed,
        create_bubbler_confirmation.help_needed_reason,
        create_bubbler_confirmation.time_spent_assisting,
        create_bubbler_confirmation.photos_uploaded,
        create_bubbler_confirmation.tasks_completed,
        create_bubbler_confirmation.areas_assisted,
        create_bubbler_confirmation.start_time,
        create_bubbler_confirmation.end_time,
        create_bubbler_confirmation.disputes_claim,
        create_bubbler_confirmation.dispute_reason,
        create_bubbler_confirmation.confirms_claim,
        create_bubbler_confirmation.confirmation_notes
    ) RETURNING id INTO new_confirmation_id;
    
    -- Calculate total minutes if start and end time provided
    IF start_time IS NOT NULL AND end_time IS NOT NULL THEN
        UPDATE bubbler_confirmation 
        SET total_minutes = EXTRACT(EPOCH FROM (end_time - start_time)) / 60
        WHERE id = new_confirmation_id;
    END IF;
    
    result_message := CASE 
        WHEN confirmation_type = 'lead_bubbler' THEN 
            'Lead Bubbler confirmation created successfully'
        ELSE 
            'Original Bubbler confirmation created successfully'
    END;
    
    RETURN QUERY SELECT 
        new_confirmation_id,
        TRUE,
        result_message;
END;
$$ LANGUAGE plpgsql;

-- Function to detect suspicious patterns and create alerts
CREATE OR REPLACE FUNCTION detect_suspicious_patterns(
    lead_bubbler_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    alert_type VARCHAR(50),
    pattern_description TEXT,
    severity_level VARCHAR(20),
    evidence JSONB
) AS $$
DECLARE
    time_pattern_count INTEGER;
    task_pattern_count INTEGER;
    dispute_pattern_count INTEGER;
    pair_pattern_count INTEGER;
    pattern_evidence JSONB;
BEGIN
    -- Check for time pattern abuse (same Lead logs 20 min assist on every job)
    SELECT COUNT(*) INTO time_pattern_count
    FROM bubbler_confirmation bc
    JOIN partial_takeover_approvals pta ON bc.partial_takeover_approval_id = pta.id
    WHERE bc.confirmation_type = 'lead_bubbler'
    AND bc.bubbler_id = lead_bubbler_id
    AND bc.time_spent_assisting = 20
    AND bc.created_at >= NOW() - INTERVAL '1 day' * days_back;
    
    IF time_pattern_count >= 5 THEN
        pattern_evidence := jsonb_build_object(
            'pattern_type', 'time_pattern',
            'count', time_pattern_count,
            'time_value', 20,
            'days_back', days_back
        );
        
        RETURN QUERY SELECT 
            'time_pattern'::VARCHAR(50),
            'Lead Bubbler consistently logs 20-minute assists across multiple jobs'::TEXT,
            'high'::VARCHAR(20),
            pattern_evidence;
    END IF;
    
    -- Check for task pattern abuse (Lead always claims same 2 tasks)
    SELECT COUNT(*) INTO task_pattern_count
    FROM bubbler_confirmation bc
    JOIN partial_takeover_approvals pta ON bc.partial_takeover_approval_id = pta.id
    WHERE bc.confirmation_type = 'lead_bubbler'
    AND bc.bubbler_id = lead_bubbler_id
    AND bc.tasks_completed IS NOT NULL
    AND array_length(bc.tasks_completed, 1) = 2
    AND bc.created_at >= NOW() - INTERVAL '1 day' * days_back;
    
    IF task_pattern_count >= 3 THEN
        pattern_evidence := jsonb_build_object(
            'pattern_type', 'task_pattern',
            'count', task_pattern_count,
            'task_count', 2,
            'days_back', days_back
        );
        
        RETURN QUERY SELECT 
            'task_pattern'::VARCHAR(50),
            'Lead Bubbler consistently claims same 2 tasks across multiple jobs'::TEXT,
            'medium'::VARCHAR(20),
            pattern_evidence;
    END IF;
    
    -- Check for dispute pattern (Bubbler never confirms needing help)
    SELECT COUNT(*) INTO dispute_pattern_count
    FROM bubbler_confirmation bc
    JOIN partial_takeover_approvals pta ON bc.partial_takeover_approval_id = pta.id
    WHERE bc.confirmation_type = 'original_bubbler'
    AND bc.bubbler_id IN (
        SELECT original_bubbler_id FROM partial_takeover_approvals 
        WHERE lead_bubbler_id = detect_suspicious_patterns.lead_bubbler_id
    )
    AND bc.disputes_claim = TRUE
    AND bc.created_at >= NOW() - INTERVAL '1 day' * days_back;
    
    IF dispute_pattern_count >= 3 THEN
        pattern_evidence := jsonb_build_object(
            'pattern_type', 'dispute_pattern',
            'count', dispute_pattern_count,
            'days_back', days_back
        );
        
        RETURN QUERY SELECT 
            'dispute_pattern'::VARCHAR(50),
            'Multiple bubblers dispute Lead Bubbler assistance claims'::TEXT,
            'high'::VARCHAR(20),
            pattern_evidence;
    END IF;
    
    -- Check for pair pattern (repeated "coincidental" partials by same Lead/Bubbler pair)
    SELECT COUNT(*) INTO pair_pattern_count
    FROM partial_takeover_approvals pta1
    JOIN partial_takeover_approvals pta2 ON pta1.lead_bubbler_id = pta2.lead_bubbler_id 
    AND pta1.original_bubbler_id = pta2.original_bubbler_id
    WHERE pta1.lead_bubbler_id = lead_bubbler_id
    AND pta1.id != pta2.id
    AND pta1.created_at >= NOW() - INTERVAL '1 day' * days_back
    AND pta2.created_at >= NOW() - INTERVAL '1 day' * days_back;
    
    IF pair_pattern_count >= 2 THEN
        pattern_evidence := jsonb_build_object(
            'pattern_type', 'pair_pattern',
            'count', pair_pattern_count,
            'days_back', days_back
        );
        
        RETURN QUERY SELECT 
            'pair_pattern'::VARCHAR(50),
            'Repeated partial takeovers between same Lead/Bubbler pair'::TEXT,
            'critical'::VARCHAR(20),
            pattern_evidence;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check shift bonus caps
CREATE OR REPLACE FUNCTION check_shift_bonus_cap(
    lead_bubbler_id UUID,
    shift_date DATE,
    bonus_amount DECIMAL(6,2)
)
RETURNS TABLE(
    within_cap BOOLEAN,
    current_total DECIMAL(6,2),
    cap_limit DECIMAL(6,2),
    remaining_amount DECIMAL(6,2),
    message TEXT
) AS $$
DECLARE
    shift_record RECORD;
    current_total_amount DECIMAL(6,2) := 0.00;
    cap_limit_amount DECIMAL(6,2) := 30.00;
    remaining_amount_result DECIMAL(6,2);
    within_cap_result BOOLEAN;
    result_message TEXT;
BEGIN
    -- Get or create shift bonus cap record
    SELECT * INTO shift_record FROM shift_bonus_caps 
    WHERE lead_bubbler_id = check_shift_bonus_cap.lead_bubbler_id 
    AND shift_date = check_shift_bonus_cap.shift_date;
    
    IF shift_record IS NULL THEN
        -- Create new shift record
        INSERT INTO shift_bonus_caps (
            lead_bubbler_id,
            shift_date,
            max_bonus_cap
        ) VALUES (
            lead_bubbler_id,
            shift_date,
            cap_limit_amount
        );
        current_total_amount := 0.00;
    ELSE
        current_total_amount := shift_record.total_bonus_amount;
        cap_limit_amount := shift_record.max_bonus_cap;
    END IF;
    
    -- Check if within cap
    remaining_amount_result := cap_limit_amount - current_total_amount;
    within_cap_result := (current_total_amount + bonus_amount) <= cap_limit_amount;
    
    result_message := CASE 
        WHEN within_cap_result THEN 
            'Bonus within shift cap limit'
        ELSE 
            'Bonus exceeds shift cap limit. Admin override required.'
    END;
    
    RETURN QUERY SELECT 
        within_cap_result,
        current_total_amount,
        cap_limit_amount,
        remaining_amount_result,
        result_message;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce disciplinary actions
CREATE OR REPLACE FUNCTION enforce_disciplinary_action(
    bubbler_id UUID,
    action_type VARCHAR(50),
    offense_type VARCHAR(50),
    action_description TEXT,
    evidence_references JSONB DEFAULT NULL
)
RETURNS TABLE(
    action_id UUID,
    offense_count INTEGER,
    action_taken TEXT,
    message TEXT
) AS $$
DECLARE
    new_action_id UUID;
    current_offense_count INTEGER := 1;
    previous_actions TEXT[];
    action_taken_result TEXT;
    result_message TEXT;
BEGIN
    -- Get previous actions for this bubbler
    SELECT COUNT(*), array_agg(action_type) INTO current_offense_count, previous_actions
    FROM disciplinary_actions 
    WHERE bubbler_id = enforce_disciplinary_action.bubbler_id
    AND action_status = 'active';
    
    current_offense_count := current_offense_count + 1;
    
    -- Determine action based on offense count
    action_taken_result := CASE 
        WHEN current_offense_count = 1 THEN 'coaching'
        WHEN current_offense_count = 2 THEN 'warning'
        WHEN current_offense_count = 3 THEN 'demotion'
        ELSE 'removal'
    END;
    
    -- Insert disciplinary action
    INSERT INTO disciplinary_actions (
        bubbler_id,
        action_type,
        offense_type,
        action_description,
        evidence_references,
        offense_count,
        previous_actions,
        effective_date
    ) VALUES (
        bubbler_id,
        action_taken_result,
        offense_type,
        action_description,
        evidence_references,
        current_offense_count,
        previous_actions,
        CURRENT_DATE
    ) RETURNING id INTO new_action_id;
    
    result_message := 'Disciplinary action ' || action_taken_result || ' applied. Offense #' || current_offense_count;
    
    RETURN QUERY SELECT 
        new_action_id,
        current_offense_count,
        action_taken_result,
        result_message;
END;
$$ LANGUAGE plpgsql;

-- Function to get available rework tasks for a service type
CREATE OR REPLACE FUNCTION get_rework_task_options(
    service_type VARCHAR(50),
    rework_type VARCHAR(50)
)
RETURNS TABLE(
    task_label VARCHAR(100),
    task_key VARCHAR(100),
    auto_trigger BOOLEAN,
    task_category VARCHAR(50),
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rtt.task_label,
        rtt.task_key,
        rtt.auto_trigger,
        rtt.task_category,
        rtt.display_order
    FROM rework_task_templates rtt
    WHERE rtt.service_type = get_rework_task_options.service_type
    AND rtt.rework_type = get_rework_task_options.rework_type
    AND rtt.is_active = TRUE
    ORDER BY rtt.display_order, rtt.task_label;
END;
$$ LANGUAGE plpgsql;

-- Function to process rework task submission
CREATE OR REPLACE FUNCTION process_rework_task(
    order_uuid UUID,
    lead_bubbler_uuid UUID,
    rework_type VARCHAR(50),
    selected_tasks TEXT[],
    before_photo_urls TEXT[],
    after_photo_urls TEXT[],
    quick_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    rework_task_id UUID,
    threshold_met BOOLEAN,
    auto_triggered BOOLEAN,
    partial_takeover_approval_id UUID,
    payout_amount DECIMAL(6,2),
    message TEXT
) AS $$
DECLARE
    order_record RECORD;
    job_assignment_record RECORD;
    new_rework_task_id UUID;
    threshold_result BOOLEAN := FALSE;
    auto_triggered_result BOOLEAN := FALSE;
    approval_id UUID;
    payout_amount_result DECIMAL(6,2) := 0.00;
    result_message TEXT;
    auto_trigger_tasks INTEGER := 0;
    i INTEGER;
BEGIN
    -- Get order and job assignment details
    SELECT * INTO order_record FROM orders WHERE id = order_uuid;
    SELECT * INTO job_assignment_record FROM job_assignments WHERE order_id = order_uuid LIMIT 1;
    
    -- Check for auto-trigger tasks
    FOR i IN 1..array_length(selected_tasks, 1) LOOP
        IF EXISTS (
            SELECT 1 FROM rework_task_templates 
            WHERE service_type = order_record.service_type 
            AND rework_type = process_rework_task.rework_type
            AND task_key = selected_tasks[i]
            AND auto_trigger = TRUE
        ) THEN
            auto_trigger_tasks := auto_trigger_tasks + 1;
        END IF;
    END LOOP;
    
    -- Determine threshold based on service type and rework type
    CASE 
        WHEN order_record.service_type = 'sparkle' AND rework_type = 're_cleaning' THEN
            -- Home Cleaning Re-Cleaning: Any 2+ physical effort items
            threshold_result := array_length(selected_tasks, 1) >= 2;
        WHEN order_record.service_type = 'shine' AND rework_type = 'retouch' THEN
            -- Car Wash Retouch: 3+ distinct zones OR full panel re-dry
            threshold_result := array_length(selected_tasks, 1) >= 3 OR auto_trigger_tasks > 0;
        WHEN order_record.service_type = 'fresh' AND rework_type = 'retouch' THEN
            -- Laundry Retouch: 3+ tasks OR batch rework
            threshold_result := array_length(selected_tasks, 1) >= 3 OR auto_trigger_tasks > 0;
        ELSE
            threshold_result := FALSE;
    END CASE;
    
    -- Set auto-triggered flag
    auto_triggered_result := auto_trigger_tasks > 0;
    
    -- Insert rework task record
    INSERT INTO rework_tasks (
        order_id,
        lead_bubbler_id,
        original_bubbler_id,
        service_type,
        rework_type,
        selected_tasks,
        before_photo_urls,
        after_photo_urls,
        quick_notes,
        threshold_met,
        auto_triggered
    ) VALUES (
        order_uuid,
        lead_bubbler_uuid,
        job_assignment_record.bubbler_id,
        order_record.service_type,
        rework_type,
        selected_tasks,
        before_photo_urls,
        after_photo_urls,
        quick_notes,
        threshold_result,
        auto_triggered_result
    ) RETURNING id INTO new_rework_task_id;
    
    -- If threshold met, create partial takeover approval
    IF threshold_result THEN
        SELECT * INTO approval_id FROM initiate_partial_takeover_approval(
            order_uuid,
            lead_bubbler_uuid,
            selected_tasks,
            ARRAY['moderate']::TEXT[], -- Default severity for rework tasks
            before_photo_urls,
            COALESCE(quick_notes, 'Rework task threshold met')
        );
        
        -- Update rework task with approval ID
        UPDATE rework_tasks 
        SET partial_takeover_approval_id = approval_id
        WHERE id = new_rework_task_id;
        
        -- Calculate estimated payout
        SELECT bonus_amount INTO payout_amount_result FROM calculate_lead_bonus(
            'assist',
            30, -- Assume 30 minutes for rework
            order_record.service_type,
            'partial'
        );
        
        result_message := CASE 
            WHEN auto_triggered_result THEN 
                'Auto-triggered partial takeover - $' || payout_amount_result || ' pending admin review'
            ELSE 
                'Partial takeover threshold met - $' || payout_amount_result || ' pending admin review'
        END;
    ELSE
        result_message := 'Rework task logged - no partial takeover threshold met';
    END IF;
    
    RETURN QUERY SELECT 
        new_rework_task_id,
        threshold_result,
        auto_triggered_result,
        approval_id,
        payout_amount_result,
        result_message;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions for coaching functions
GRANT EXECUTE ON FUNCTION create_coaching_incident(UUID, UUID, UUID, VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_coaching_email(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_repeated_coaching_patterns(UUID, INTEGER) TO authenticated;

-- Function to initiate partial takeover approval process
CREATE OR REPLACE FUNCTION initiate_partial_takeover_approval(
    order_uuid UUID,
    lead_bubbler_uuid UUID,
    error_types TEXT[],
    error_severity_levels TEXT[],
    photo_evidence_urls TEXT[],
    lead_justification TEXT
)
RETURNS TABLE(
    approval_id UUID,
    threshold_met BOOLEAN,
    service_type VARCHAR(50),
    errors_found_count INTEGER,
    areas_affected_count INTEGER,
    message TEXT
) AS $$
DECLARE
    order_record RECORD;
    job_assignment_record RECORD;
    new_approval_id UUID;
    threshold_result BOOLEAN;
    areas_count INTEGER;
    errors_count INTEGER;
    result_message TEXT;
BEGIN
    -- Get order and job assignment details
    SELECT * INTO order_record FROM orders WHERE id = order_uuid;
    SELECT * INTO job_assignment_record FROM job_assignments WHERE order_id = order_uuid LIMIT 1;
    
    -- Calculate areas affected (unique areas from error types)
    SELECT COUNT(DISTINCT 
        CASE 
            WHEN et LIKE '%bathroom%' THEN 'bathroom'
            WHEN et LIKE '%kitchen%' THEN 'kitchen'
            WHEN et LIKE '%bedroom%' THEN 'bedroom'
            WHEN et LIKE '%living%' THEN 'living'
            WHEN et LIKE '%exterior%' THEN 'exterior'
            WHEN et LIKE '%interior%' THEN 'interior'
            ELSE 'other'
        END
    ) INTO areas_count
    FROM unnest(error_types) AS et;
    
    errors_count := array_length(error_types, 1);
    
    -- Check if threshold is met
    SELECT * INTO threshold_result FROM check_partial_takeover_threshold(
        order_record.service_type,
        errors_count,
        areas_count,
        error_types,
        error_severity_levels
    );
    
    -- Insert approval record
    INSERT INTO partial_takeover_approvals (
        order_id,
        lead_bubbler_id,
        original_bubbler_id,
        service_type,
        errors_found_count,
        areas_affected_count,
        error_types,
        error_severity_levels,
        photo_evidence_urls,
        lead_justification,
        threshold_met
    ) VALUES (
        order_uuid,
        lead_bubbler_uuid,
        job_assignment_record.bubbler_id,
        order_record.service_type,
        errors_count,
        areas_count,
        error_types,
        error_severity_levels,
        photo_evidence_urls,
        lead_justification,
        threshold_result
    ) RETURNING id INTO new_approval_id;
    
    -- Create coaching incident for follow-up
    INSERT INTO coaching_incidents (
        order_id,
        bubbler_id,
        lead_bubbler_id,
        incident_type,
        error_severity,
        area_affected,
        before_photo_url,
        after_photo_url,
        lead_coaching_notes,
        admin_coaching_notes,
        kb_article_tag
    ) VALUES (
        order_uuid,
        job_assignment_record.bubbler_id,
        lead_bubbler_uuid,
        'partial_takeover_request',
        CASE 
            WHEN array_length(error_severity_levels, 1) > 0 THEN error_severity_levels[1]
            ELSE 'moderate'
        END,
        'multiple_areas',
        photo_evidence_urls[1], -- First photo as before
        photo_evidence_urls[array_length(photo_evidence_urls, 1)], -- Last photo as after
        lead_justification,
        'Partial takeover approval pending - admin review required',
        'partial_takeover_coaching'
    );
    
    result_message := CASE 
        WHEN threshold_result THEN 
            'Partial takeover threshold met. Approval request submitted for admin review.'
        ELSE 
            'Partial takeover threshold not met, but approval request submitted for admin review.'
    END;
    
    RETURN QUERY SELECT 
        new_approval_id,
        threshold_result,
        order_record.service_type,
        errors_count,
        areas_count,
        result_message;
END;
$$ LANGUAGE plpgsql;

-- Function for admin to approve/reject partial takeover
CREATE OR REPLACE FUNCTION process_partial_takeover_approval(
    approval_id UUID,
    admin_reviewer_id UUID,
    approval_status VARCHAR(20),
    approval_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    payout_amount DECIMAL(6,2),
    original_bubbler_deduction DECIMAL(6,2),
    message TEXT
) AS $$
DECLARE
    approval_record RECORD;
    comp_record RECORD;
    calculated_payout DECIMAL(6,2);
    calculated_deduction DECIMAL(6,2);
    result_message TEXT;
BEGIN
    -- Get approval record
    SELECT * INTO approval_record FROM partial_takeover_approvals WHERE id = approval_id;
    
    IF approval_record IS NULL THEN
        RETURN QUERY SELECT FALSE, 0.00, 0.00, 'Approval record not found'::TEXT;
        RETURN;
    END IF;
    
    -- Update approval status
    UPDATE partial_takeover_approvals 
    SET approval_status = approval_status,
        admin_reviewer_id = admin_reviewer_id,
        approval_notes = approval_notes,
        approved_at = CASE WHEN approval_status = 'approved' THEN NOW() ELSE NULL END
    WHERE id = approval_id;
    
    -- If approved, calculate compensation
    IF approval_status = 'approved' THEN
        -- Calculate compensation based on service type
        SELECT * INTO comp_record FROM calculate_completion_based_compensation(
            approval_record.order_id,
            75.00, -- Assume 75% completion for partial takeover
            approval_record.service_type,
            approval_record.lead_justification
        );
        
        calculated_payout := comp_record.bonus_amount;
        calculated_deduction := calculated_payout; -- Same amount deducted from original bubbler
        
        -- Update approval record with payout amounts
        UPDATE partial_takeover_approvals 
        SET payout_amount = calculated_payout,
            original_bubbler_deduction = calculated_deduction
        WHERE id = approval_id;
        
        result_message := 'Partial takeover approved. Payout: $' || calculated_payout || ', Deduction: $' || calculated_deduction;
    ELSE
        calculated_payout := 0.00;
        calculated_deduction := 0.00;
        result_message := 'Partial takeover rejected: ' || COALESCE(approval_notes, 'No reason provided');
    END IF;
    
    RETURN QUERY SELECT 
        TRUE,
        calculated_payout,
        calculated_deduction,
        result_message;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions for new functions
GRANT EXECUTE ON FUNCTION calculate_completion_based_compensation(UUID, DECIMAL, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_job_completion_percentage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_takeover_abuse(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION process_takeover_compensation(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_qa_escalation(UUID, UUID, VARCHAR, TEXT[], TEXT[], TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_checklist_behavior(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION enforce_task_completion_timing(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION determine_photo_requirement(INTEGER, INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION check_partial_takeover_threshold(INTEGER, INTEGER, TEXT[]) TO authenticated;

-- Function to create coaching incident and determine next steps
CREATE OR REPLACE FUNCTION create_coaching_incident(
    order_uuid UUID,
    bubbler_uuid UUID,
    lead_bubbler_uuid UUID,
    incident_type VARCHAR(100),
    error_severity VARCHAR(20),
    area_affected VARCHAR(100),
    before_photo_url TEXT DEFAULT NULL,
    after_photo_url TEXT DEFAULT NULL,
    lead_coaching_notes TEXT DEFAULT NULL,
    admin_coaching_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    incident_id UUID,
    kb_article_tag VARCHAR(100),
    requires_partial_takeover BOOLEAN,
    coaching_email_required BOOLEAN,
    message TEXT
) AS $$
DECLARE
    new_incident_id UUID;
    kb_tag VARCHAR(100);
    partial_takeover_needed BOOLEAN := FALSE;
    email_required BOOLEAN := TRUE;
    result_message TEXT;
BEGIN
    -- Determine KB article tag based on incident type
    kb_tag := CASE incident_type
        WHEN 'mirror_streaks' THEN 'streak_free_mirrors'
        WHEN 'counter_sanitizing' THEN 'kitchen_sanitizing'
        WHEN 'toilet_cleaning' THEN 'toilet_rim_detailing'
        WHEN 'dusting_incomplete' THEN 'dusting_vents_baseboards'
        WHEN 'speed_vs_quality' THEN 'speed_vs_thoroughness'
        ELSE 'general_cleaning_techniques'
    END;
    
    -- Insert coaching incident
    INSERT INTO coaching_incidents (
        order_id,
        bubbler_id,
        lead_bubbler_id,
        incident_type,
        error_severity,
        area_affected,
        before_photo_url,
        after_photo_url,
        lead_coaching_notes,
        admin_coaching_notes,
        kb_article_tag
    ) VALUES (
        order_uuid,
        bubbler_uuid,
        lead_bubbler_uuid,
        incident_type,
        error_severity,
        area_affected,
        before_photo_url,
        after_photo_url,
        lead_coaching_notes,
        admin_coaching_notes,
        kb_tag
    ) RETURNING id INTO new_incident_id;
    
    -- Check if partial takeover is needed based on error severity and count
    IF error_severity IN ('moderate', 'significant') THEN
        partial_takeover_needed := TRUE;
    END IF;
    
    -- Determine if coaching email is required
    IF error_severity = 'minor' AND lead_coaching_notes IS NOT NULL THEN
        email_required := FALSE; -- Minor issues with onsite coaching may not need email
    END IF;
    
    result_message := 'Coaching incident created. ' || 
                     CASE 
                         WHEN partial_takeover_needed THEN 'Partial takeover recommended. '
                         ELSE 'Standard coaching required. '
                     END ||
                     CASE 
                         WHEN email_required THEN 'Admin follow-up email will be sent.'
                         ELSE 'Onsite coaching sufficient.'
                     END;
    
    RETURN QUERY SELECT 
        new_incident_id,
        kb_tag,
        partial_takeover_needed,
        email_required,
        result_message;
END;
$$ LANGUAGE plpgsql;

-- Function to generate coaching email content
CREATE OR REPLACE FUNCTION generate_coaching_email(
    incident_id UUID,
    template_name VARCHAR(100) DEFAULT 'standard_coaching'
)
RETURNS TABLE(
    subject_line TEXT,
    email_body TEXT,
    kb_article_link TEXT,
    success BOOLEAN
) AS $$
DECLARE
    incident_record RECORD;
    template_record RECORD;
    kb_article_record RECORD;
    generated_subject TEXT;
    generated_body TEXT;
    kb_link TEXT;
BEGIN
    -- Get incident details
    SELECT * INTO incident_record FROM coaching_incidents WHERE id = incident_id;
    
    -- Get email template
    SELECT * INTO template_record FROM coaching_email_templates 
    WHERE template_name = generate_coaching_email.template_name AND is_active = TRUE;
    
    -- Get KB article
    SELECT * INTO kb_article_record FROM knowledge_base_articles 
    WHERE article_tag = incident_record.kb_article_tag AND is_active = TRUE;
    
    IF incident_record IS NULL OR template_record IS NULL OR kb_article_record IS NULL THEN
        RETURN QUERY SELECT 
            'Coaching Email Generation Failed'::TEXT,
            'Unable to generate coaching email due to missing data.'::TEXT,
            ''::TEXT,
            FALSE;
        RETURN;
    END IF;
    
    -- Generate email content with placeholders replaced
    generated_subject := template_record.subject_line;
    generated_body := template_record.email_body;
    
    -- Replace placeholders
    generated_body := REPLACE(generated_body, '{{KB_ARTICLE_LINK}}', kb_article_record.article_tag);
    generated_body := REPLACE(generated_body, '{{BUBBLER_NAME}}', 'Bubbler'); -- Will be replaced with actual name
    generated_body := REPLACE(generated_body, '{{JOB_ID}}', incident_record.order_id::TEXT);
    
    kb_link := 'https://gogobubbles.com/kb/' || kb_article_record.article_tag;
    
    RETURN QUERY SELECT 
        generated_subject,
        generated_body,
        kb_link,
        TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to detect repeated coaching patterns
CREATE OR REPLACE FUNCTION detect_repeated_coaching_patterns(
    bubbler_uuid UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    pattern_detected BOOLEAN,
    pattern_type VARCHAR(100),
    incident_count INTEGER,
    most_common_issue VARCHAR(100),
    recommendation TEXT
) AS $$
DECLARE
    recent_incidents INTEGER;
    most_common_incident VARCHAR(100);
    pattern_found BOOLEAN := FALSE;
    pattern_category VARCHAR(100);
    recommendation_text TEXT;
BEGIN
    -- Count recent incidents
    SELECT COUNT(*), 
           MODE() WITHIN GROUP (ORDER BY incident_type)
    INTO recent_incidents, most_common_incident
    FROM coaching_incidents 
    WHERE bubbler_id = bubbler_uuid 
    AND created_at >= NOW() - INTERVAL '1 day' * days_back;
    
    -- Determine pattern type
    IF recent_incidents >= 5 THEN
        pattern_found := TRUE;
        pattern_category := 'frequent_issues';
        recommendation_text := 'Consider additional training or mentoring for ' || most_common_incident;
    ELSIF recent_incidents >= 3 AND most_common_incident IS NOT NULL THEN
        pattern_found := TRUE;
        pattern_category := 'repeated_issue';
        recommendation_text := 'Focus training on ' || most_common_incident || ' techniques';
    END IF;
    
    RETURN QUERY SELECT 
        pattern_found,
        pattern_category,
        recent_incidents,
        most_common_incident,
        recommendation_text;
END;
$$ LANGUAGE plpgsql;

-- Function to detect suspicious checklist completion patterns
CREATE OR REPLACE FUNCTION detect_suspicious_checklist_behavior(order_uuid UUID)
RETURNS TABLE(
    is_suspicious BOOLEAN,
    suspicion_reason TEXT,
    completion_time_minutes INTEGER,
    tasks_completed_count INTEGER,
    average_time_per_task DECIMAL(5,2)
) AS $$
DECLARE
    first_task_time TIMESTAMP WITH TIME ZONE;
    last_task_time TIMESTAMP WITH TIME ZONE;
    total_tasks INTEGER;
    completed_tasks INTEGER;
    completion_time_minutes INTEGER;
    avg_time_per_task DECIMAL(5,2);
    is_suspicious_flag BOOLEAN := FALSE;
    suspicion_message TEXT;
BEGIN
    -- Get first and last task completion times
    SELECT MIN(timestamp_checked), MAX(timestamp_checked), COUNT(*)
    INTO first_task_time, last_task_time, total_tasks
    FROM job_completion_checklist 
    WHERE order_id = order_uuid AND completed_by_bubbler = TRUE;
    
    -- Get count of completed tasks
    SELECT COUNT(*) INTO completed_tasks
    FROM job_completion_checklist 
    WHERE order_id = order_uuid AND completed_by_bubbler = TRUE;
    
    -- Calculate completion time
    IF first_task_time IS NOT NULL AND last_task_time IS NOT NULL THEN
        completion_time_minutes := EXTRACT(EPOCH FROM (last_task_time - first_task_time)) / 60;
        avg_time_per_task := completion_time_minutes::DECIMAL / completed_tasks;
    ELSE
        completion_time_minutes := 0;
        avg_time_per_task := 0;
    END IF;
    
    -- Determine if suspicious
    IF completion_time_minutes < 5 AND completed_tasks >= 3 THEN
        is_suspicious_flag := TRUE;
        suspicion_message := 'Suspiciously fast completion - ' || completion_time_minutes || ' minutes for ' || completed_tasks || ' tasks';
    ELSIF avg_time_per_task < 2 AND completed_tasks >= 5 THEN
        is_suspicious_flag := TRUE;
        suspicion_message := 'Unrealistic task timing - ' || avg_time_per_task || ' minutes per task average';
    ELSIF completed_tasks = total_tasks AND completion_time_minutes < 10 THEN
        is_suspicious_flag := TRUE;
        suspicion_message := 'All tasks completed too quickly - ' || completion_time_minutes || ' minutes for complete job';
    END IF;
    
    RETURN QUERY SELECT 
        is_suspicious_flag,
        suspicion_message,
        completion_time_minutes,
        completed_tasks,
        avg_time_per_task;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce minimum task completion times
CREATE OR REPLACE FUNCTION enforce_task_completion_timing(
    order_uuid UUID,
    task_label TEXT,
    minimum_minutes INTEGER DEFAULT 3
)
RETURNS BOOLEAN AS $$

-- Function to determine if photos are required based on errors found
CREATE OR REPLACE FUNCTION determine_photo_requirement(
    errors_found_count INTEGER,
    areas_affected_count INTEGER,
    error_severity_level VARCHAR(20) -- 'minor', 'moderate', 'significant'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Photos required if any errors found
    IF errors_found_count > 0 THEN
        RETURN TRUE;
    END IF;
    
    -- Photos required if Lead Bubbler steps in to fix any task
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to determine if partial takeover threshold is met based on service type
CREATE OR REPLACE FUNCTION check_partial_takeover_threshold(
    service_type VARCHAR(50),
    errors_found_count INTEGER,
    areas_affected_count INTEGER,
    error_types TEXT[], -- Array of error types (e.g., 'mirror_streaks', 'missed_baseboards')
    error_severity_levels TEXT[] -- Array of severity levels
)
RETURNS BOOLEAN AS $$
DECLARE
    moderate_or_higher_count INTEGER := 0;
    i INTEGER;
    threshold_met BOOLEAN := FALSE;
BEGIN
    -- Count moderate or significant errors
    FOR i IN 1..array_length(error_severity_levels, 1) LOOP
        IF error_severity_levels[i] IN ('moderate', 'significant') THEN
            moderate_or_higher_count := moderate_or_higher_count + 1;
        END IF;
    END LOOP;
    
    -- Service-specific threshold logic
    CASE service_type
        WHEN 'sparkle' THEN -- Home Cleaning
            -- Rule: If Lead Bubbler must physically redo more than 2 tasks, it's a Partial Takeover
            IF errors_found_count >= 3 THEN
                threshold_met := TRUE;
            ELSIF areas_affected_count >= 2 AND errors_found_count >= 2 THEN
                threshold_met := TRUE;
            ELSIF moderate_or_higher_count >= 2 THEN
                threshold_met := TRUE;
            END IF;
            
        WHEN 'shine' THEN -- Mobile Car Wash
            -- Rule: If 2+ areas/zones need touch-up or rework, or any full panel re-wipe
            IF areas_affected_count >= 2 THEN
                threshold_met := TRUE;
            ELSIF errors_found_count >= 3 THEN
                threshold_met := TRUE;
            ELSIF EXISTS (SELECT 1 FROM unnest(error_types) AS et WHERE et LIKE '%full_panel%' OR et LIKE '%re_shampoo%') THEN
                threshold_met := TRUE;
            END IF;
            
        WHEN 'fresh' THEN -- Laundry
            -- Rule: If any task requires redoing part of a batch, or multiple repacks or folds
            IF EXISTS (SELECT 1 FROM unnest(error_types) AS et WHERE et LIKE '%re_iron%' OR et LIKE '%re_pack%' OR et LIKE '%re_wash%') THEN
                threshold_met := TRUE;
            ELSIF errors_found_count >= 3 THEN
                threshold_met := TRUE;
            ELSIF EXISTS (SELECT 1 FROM unnest(error_types) AS et WHERE et LIKE '%batch_redo%') THEN
                threshold_met := TRUE;
            END IF;
            
        ELSE -- Default logic for unknown service types
            IF areas_affected_count >= 2 AND moderate_or_higher_count >= 2 THEN
                threshold_met := TRUE;
            ELSIF areas_affected_count >= 2 AND errors_found_count >= 4 THEN
                threshold_met := TRUE;
            END IF;
    END CASE;
    
    RETURN threshold_met;
END;
$$ LANGUAGE plpgsql;
DECLARE
    last_task_time TIMESTAMP WITH TIME ZONE;
    time_since_last INTEGER;
    can_complete BOOLEAN := TRUE;
BEGIN
    -- Get the last task completion time
    SELECT MAX(timestamp_checked) INTO last_task_time
    FROM job_completion_checklist 
    WHERE order_id = order_uuid 
    AND completed_by_bubbler = TRUE
    AND task_label != job_completion_checklist.task_label;
    
    -- If there's a previous task, check timing
    IF last_task_time IS NOT NULL THEN
        time_since_last := EXTRACT(EPOCH FROM (NOW() - last_task_time)) / 60;
        
        IF time_since_last < minimum_minutes THEN
            can_complete := FALSE;
        END IF;
    END IF;
    
    RETURN can_complete;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for new tables
ALTER TABLE bubbler_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bubblers can view their own flags" ON bubbler_flags
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Admins and lead bubblers can view all flags" ON bubbler_flags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler', 'lead_bubbler')
        )
    );

CREATE POLICY "Admins can manage flags" ON bubbler_flags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for lead_checkin_schedule
ALTER TABLE lead_checkin_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bubblers can view their own scheduled check-ins" ON lead_checkin_schedule
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Lead bubblers can view their assigned check-ins" ON lead_checkin_schedule
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all scheduled check-ins" ON lead_checkin_schedule
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins and lead bubblers can manage schedules" ON lead_checkin_schedule
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler', 'lead_bubbler')
        )
    );

-- RLS policies for job_completion_checklist
ALTER TABLE job_completion_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bubblers can manage their own job checklists" ON job_completion_checklist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM job_assignments ja
            WHERE ja.order_id = job_completion_checklist.order_id
            AND ja.bubbler_id = auth.uid()
        )
    );

CREATE POLICY "Lead bubblers can view job checklists in their zone" ON job_completion_checklist
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers b
            WHERE b.id = auth.uid()
            AND b.role = 'lead_bubbler'
        )
    );

CREATE POLICY "Admins can view all job checklists" ON job_completion_checklist
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for bubbler_takeover_history
ALTER TABLE bubbler_takeover_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bubblers can view their own takeover history" ON bubbler_takeover_history
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Lead bubblers can view takeover history for their interventions" ON bubbler_takeover_history
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all takeover history" ON bubbler_takeover_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins can manage takeover history" ON bubbler_takeover_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for coaching_incidents
ALTER TABLE coaching_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bubblers can view their own coaching incidents" ON coaching_incidents
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Lead bubblers can create coaching incidents" ON coaching_incidents
    FOR INSERT WITH CHECK (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all coaching incidents" ON coaching_incidents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins can manage coaching incidents" ON coaching_incidents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for knowledge_base_articles
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view knowledge base articles" ON knowledge_base_articles
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage knowledge base articles" ON knowledge_base_articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for coaching_email_templates
ALTER TABLE coaching_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view coaching email templates" ON coaching_email_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins can manage coaching email templates" ON coaching_email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for partial_takeover_approvals
ALTER TABLE partial_takeover_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view their own approval requests" ON partial_takeover_approvals
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Lead bubblers can create approval requests" ON partial_takeover_approvals
    FOR INSERT WITH CHECK (lead_bubbler_id = auth.uid());

CREATE POLICY "Bubblers can view their own approval requests" ON partial_takeover_approvals
    FOR SELECT USING (original_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all approval requests" ON partial_takeover_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins can manage approval requests" ON partial_takeover_approvals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for rework_tasks
ALTER TABLE rework_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view their own rework tasks" ON rework_tasks
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Lead bubblers can create rework tasks" ON rework_tasks
    FOR INSERT WITH CHECK (lead_bubbler_id = auth.uid());

CREATE POLICY "Bubblers can view their own rework tasks" ON rework_tasks
    FOR SELECT USING (original_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all rework tasks" ON rework_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins can manage rework tasks" ON rework_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for rework_task_templates
ALTER TABLE rework_task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view rework task templates" ON rework_task_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage rework task templates" ON rework_task_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for bubbler_confirmation
ALTER TABLE bubbler_confirmation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view their own confirmations" ON bubbler_confirmation
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Lead bubblers can create confirmations" ON bubbler_confirmation
    FOR INSERT WITH CHECK (bubbler_id = auth.uid());

CREATE POLICY "Original bubblers can view their confirmations" ON bubbler_confirmation
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Original bubblers can create confirmations" ON bubbler_confirmation
    FOR INSERT WITH CHECK (bubbler_id = auth.uid());

CREATE POLICY "Admins can view all confirmations" ON bubbler_confirmation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins can manage confirmations" ON bubbler_confirmation
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for oversight_alerts
ALTER TABLE oversight_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all oversight alerts" ON oversight_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins can manage oversight alerts" ON oversight_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for shift_bonus_caps
ALTER TABLE shift_bonus_caps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view their own bonus caps" ON shift_bonus_caps
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all bonus caps" ON shift_bonus_caps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins can manage bonus caps" ON shift_bonus_caps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for disciplinary_actions
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bubblers can view their own disciplinary actions" ON disciplinary_actions
    FOR SELECT USING (bubbler_id = auth.uid());

CREATE POLICY "Admins can view all disciplinary actions" ON disciplinary_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins can manage disciplinary actions" ON disciplinary_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for trust_but_verify_alerts
ALTER TABLE trust_but_verify_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead bubblers can view their own alerts" ON trust_but_verify_alerts
    FOR SELECT USING (lead_bubbler_id = auth.uid());

CREATE POLICY "Admins can view all trust but verify alerts" ON trust_but_verify_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

CREATE POLICY "Admins can manage trust but verify alerts" ON trust_but_verify_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for zone_configurations
ALTER TABLE zone_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view zone configurations" ON zone_configurations
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage zone configurations" ON zone_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

COMMENT ON FUNCTION create_takeover_verification_task() IS 'Automatically creates verification task when partial or full takeover is logged';

-- Insert default rework task templates for Home Cleaning (Re-Cleaning)
INSERT INTO rework_task_templates (service_type, rework_type, task_label, task_key, auto_trigger, task_category, display_order) VALUES
-- Home Cleaning Re-Cleaning Tasks
('sparkle', 're_cleaning', 'Mop floor', 'mop_floor', FALSE, 'flooring', 1),
('sparkle', 're_cleaning', 'Sweep/vacuum', 'sweep_vacuum', FALSE, 'flooring', 2),
('sparkle', 're_cleaning', 'Dusting', 'dusting', FALSE, 'surfaces', 3),
('sparkle', 're_cleaning', 'Deep Dusting', 'deep_dusting', FALSE, 'surfaces', 4),
('sparkle', 're_cleaning', 'Toilet scrub', 'toilet_scrub', FALSE, 'fixtures', 5),
('sparkle', 're_cleaning', 'Shower/tub scrub', 'shower_tub_scrub', FALSE, 'fixtures', 6),
('sparkle', 're_cleaning', 'Mirror/Glass fix', 'mirror_glass_fix', FALSE, 'surfaces', 7),
('sparkle', 're_cleaning', 'Dishes rewashed', 'dishes_rewashed', FALSE, 'kitchen', 8),
('sparkle', 're_cleaning', 'Countertop/backsplash wipe', 'countertop_backsplash_wipe', FALSE, 'kitchen', 9),

-- Mobile Car Wash Retouch Tasks
('shine', 'retouch', 'Dashboard (interior)', 'dashboard_interior', FALSE, 'interior', 1),
('shine', 'retouch', 'Rear windshield', 'rear_windshield', FALSE, 'exterior', 2),
('shine', 'retouch', 'Door panels', 'door_panels', FALSE, 'exterior', 3),
('shine', 'retouch', 'Trunk interior', 'trunk_interior', FALSE, 'interior', 4),
('shine', 'retouch', 'Full exterior panel (re-dry)', 'full_exterior_panel_redry', TRUE, 'exterior', 5),

-- Laundry Retouch Tasks
('fresh', 'retouch', 'Wrong detergent used', 'wrong_detergent', FALSE, 'washing', 1),
('fresh', 'retouch', 'Folding errors', 'folding_errors', FALSE, 'folding', 2),
('fresh', 'retouch', 'Ironing missed', 'ironing_missed', FALSE, 'ironing', 3),
('fresh', 'retouch', 'Scent request ignored', 'scent_request_ignored', FALSE, 'washing', 4),
('fresh', 'retouch', 'Entire ironing bag re-iron', 'entire_ironing_bag_reron', TRUE, 'ironing', 5),
('fresh', 'retouch', 'Full repack required', 'full_repack_required', TRUE, 'packing', 6);

COMMENT ON TABLE rework_tasks IS 'Tap-based rework task system for Lead Bubblers to quickly document and trigger partial takeovers';
COMMENT ON TABLE rework_task_templates IS 'Service-specific task templates for rework and retouch operations';

-- Insert default zone configurations
INSERT INTO zone_configurations (zone_id, zone_name, zone_type, partial_takeover_threshold, min_jobs_for_trigger, estimated_bubbler_count, estimated_lead_bubbler_count, tier_1_response, tier_2_response, tier_3_response, tier_4_response) VALUES
-- Small zones (≤3 bubblers)
('small_zone_1', 'Small Zone - Downtown', 'small', 50.00, 2, 3, 1, 'approve_all', 'coaching_needed', 'pattern_review', 'escalate'),
('small_zone_2', 'Small Zone - Suburbs', 'small', 50.00, 2, 2, 1, 'approve_all', 'coaching_needed', 'pattern_review', 'escalate'),

-- Medium zones (4-6 bubblers)
('medium_zone_1', 'Medium Zone - Central', 'medium', 60.00, 3, 5, 1, 'approve_all', 'coaching_needed', 'pattern_review', 'escalate'),
('medium_zone_2', 'Medium Zone - West', 'medium', 60.00, 3, 6, 1, 'approve_all', 'coaching_needed', 'pattern_review', 'escalate'),

-- Large zones (7-10 bubblers)
('large_zone_1', 'Large Zone - North', 'large', 70.00, 5, 8, 2, 'approve_all', 'coaching_needed', 'pattern_review', 'escalate'),
('large_zone_2', 'Large Zone - South', 'large', 70.00, 5, 10, 2, 'approve_all', 'coaching_needed', 'pattern_review', 'escalate');

COMMENT ON TABLE trust_but_verify_alerts IS 'High partial volume monitoring system - Trust But Verify rule for Lead Bubbler oversight';
COMMENT ON TABLE zone_configurations IS 'Customizable zone-specific thresholds and response tiers for trust but verify system';

-- Create job_time_expectations table for performance oversight triggers
CREATE TABLE IF NOT EXISTS job_time_expectations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type VARCHAR(50) NOT NULL, -- 'sparkle', 'signature_deep', 'car_wash', 'laundry'
    job_description VARCHAR(200) NOT NULL, -- e.g., '2 bed / 2 bath', '1 vehicle', '1 Essentials Bag'
    expected_solo_duration_minutes INTEGER NOT NULL,
    expected_solo_duration_hours DECIMAL(4,2) GENERATED ALWAYS AS (expected_solo_duration_minutes / 60.0) STORED,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_effort_classification table for rework task categorization
CREATE TABLE IF NOT EXISTS task_effort_classification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    effort_level VARCHAR(20) NOT NULL CHECK (effort_level IN ('minor', 'moderate', 'major')),
    description TEXT NOT NULL,
    examples TEXT[], -- Array of example tasks
    estimated_minutes INTEGER NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- 'sparkle', 'car_wash', 'laundry'
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partial_takeover_triggers table for tracking trigger paths
CREATE TABLE IF NOT EXISTS partial_takeover_triggers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partial_takeover_approval_id UUID REFERENCES partial_takeover_approvals(id) ON DELETE CASCADE,
    trigger_path VARCHAR(50) NOT NULL CHECK (trigger_path IN ('performance_delay', 'quality_fail')),
    trigger_reason VARCHAR(100) NOT NULL, -- 'behind_schedule', 'quality_issues', 'both'
    
    -- Performance delay metrics
    expected_completion_time TIMESTAMP WITH TIME ZONE,
    actual_progress_percentage DECIMAL(5,2),
    time_behind_minutes INTEGER,
    
    -- Quality fail metrics
    tasks_redone_count INTEGER,
    effort_levels TEXT[], -- Array of effort levels for redone tasks
    quality_issues_found TEXT[], -- Array of quality issues
    
    -- Combined metrics
    total_effort_minutes INTEGER,
    threshold_met BOOLEAN NOT NULL,
    threshold_details JSONB, -- Store threshold calculation details
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 