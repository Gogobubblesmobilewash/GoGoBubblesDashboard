-- Job Checklist System Migration
-- Creates a progress-based task tracker to prevent fraud and ensure accurate compensation

-- Create job_checklist table for granular task tracking
CREATE TABLE IF NOT EXISTS job_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    task_category VARCHAR(100) NOT NULL, -- e.g., 'bedroom', 'bathroom', 'common_area', 'addon'
    task_order INTEGER NOT NULL, -- for display order
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_location_lat DECIMAL(10, 8),
    completed_location_lng DECIMAL(11, 8),
    estimated_minutes INTEGER DEFAULT 15, -- estimated time for this task
    actual_minutes INTEGER, -- actual time taken
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_checklist_templates table for predefined task templates
CREATE TABLE IF NOT EXISTS job_checklist_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type VARCHAR(50) NOT NULL, -- 'fresh', 'sparkle', 'shine'
    task_name VARCHAR(255) NOT NULL,
    task_category VARCHAR(100) NOT NULL,
    task_order INTEGER NOT NULL,
    estimated_minutes INTEGER DEFAULT 15,
    is_required BOOLEAN DEFAULT TRUE,
    addon_trigger VARCHAR(100), -- if this task is only for specific addons
    room_count_multiplier BOOLEAN DEFAULT FALSE, -- if task repeats per room
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_progress_snapshots table for audit trail
CREATE TABLE IF NOT EXISTS job_progress_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    bubbler_id UUID REFERENCES bubblers(id) ON DELETE SET NULL,
    snapshot_type VARCHAR(50) NOT NULL, -- 'checkin', 'checkout', 'assist', 'takeover'
    total_tasks INTEGER NOT NULL,
    completed_tasks INTEGER NOT NULL,
    completion_percentage DECIMAL(5,2) NOT NULL,
    estimated_time_remaining INTEGER, -- in minutes
    actual_time_elapsed INTEGER, -- in minutes
    snapshot_data JSONB, -- detailed state of all tasks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_checklist_order_id ON job_checklist(order_id);
CREATE INDEX IF NOT EXISTS idx_job_checklist_completed_by ON job_checklist(completed_by);
CREATE INDEX IF NOT EXISTS idx_job_checklist_is_completed ON job_checklist(is_completed);
CREATE INDEX IF NOT EXISTS idx_job_checklist_completed_at ON job_checklist(completed_at);

CREATE INDEX IF NOT EXISTS idx_job_checklist_templates_service_type ON job_checklist_templates(service_type);
CREATE INDEX IF NOT EXISTS idx_job_checklist_templates_task_order ON job_checklist_templates(task_order);

CREATE INDEX IF NOT EXISTS idx_job_progress_snapshots_order_id ON job_progress_snapshots(order_id);
CREATE INDEX IF NOT EXISTS idx_job_progress_snapshots_bubbler_id ON job_progress_snapshots(bubbler_id);
CREATE INDEX IF NOT EXISTS idx_job_progress_snapshots_created_at ON job_progress_snapshots(created_at);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_job_checklist_timestamp
    BEFORE UPDATE ON job_checklist
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

CREATE TRIGGER update_job_checklist_templates_timestamp
    BEFORE UPDATE ON job_checklist_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_intervention_timestamp();

-- Function to generate checklist for a new order
CREATE OR REPLACE FUNCTION generate_job_checklist(order_uuid UUID)
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
    template_record RECORD;
    room_count INTEGER;
    task_counter INTEGER := 1;
    addon_record RECORD;
    service_tier VARCHAR(50);
    vehicle_type VARCHAR(50);
    addon_list TEXT[];
BEGIN
    -- Get order details
    SELECT * INTO order_record FROM orders WHERE id = order_uuid;
    
    -- Get service tier and vehicle type
    service_tier := COALESCE(order_record.service_tier, 'standard');
    vehicle_type := COALESCE(order_record.vehicle_type, 'sedan');
    
    -- Get room count from order details
    room_count := COALESCE(order_record.bedrooms, 0) + COALESCE(order_record.bathrooms, 0);
    
    -- Get add-ons as array
    SELECT string_to_array(COALESCE(order_record.addons, ''), ',') INTO addon_list;
    
    -- Generate checklist from templates
    FOR template_record IN 
        SELECT * FROM job_checklist_templates 
        WHERE service_type = order_record.service_type
        AND (addon_trigger IS NULL OR addon_trigger = ANY(addon_list))
        ORDER BY task_order
    LOOP
        -- Handle room-specific tasks
        IF template_record.room_count_multiplier AND room_count > 0 THEN
            -- Create task for each room
            FOR i IN 1..room_count LOOP
                INSERT INTO job_checklist (
                    order_id,
                    task_name,
                    task_category,
                    task_order,
                    estimated_minutes
                ) VALUES (
                    order_uuid,
                    template_record.task_name || ' ' || i,
                    template_record.task_category,
                    task_counter,
                    template_record.estimated_minutes
                );
                task_counter := task_counter + 1;
            END LOOP;
        ELSE
            -- Create single task
            INSERT INTO job_checklist (
                order_id,
                task_name,
                task_category,
                task_order,
                estimated_minutes
            ) VALUES (
                order_uuid,
                template_record.task_name,
                template_record.task_category,
                task_counter,
                template_record.estimated_minutes
            );
            task_counter := task_counter + 1;
        END IF;
    END LOOP;
    
    -- Add tier-specific tasks
    IF service_tier = 'premium' THEN
        -- Add premium tier tasks
        INSERT INTO job_checklist (
            order_id,
            task_name,
            task_category,
            task_order,
            estimated_minutes
        ) VALUES (
            order_uuid,
            'Premium Quality Inspection',
            'quality_check',
            task_counter,
            10
        );
        task_counter := task_counter + 1;
    END IF;
    
    -- Add vehicle-specific tasks for car wash
    IF order_record.service_type = 'shine' THEN
        -- Add vehicle-specific tasks based on vehicle type
        IF vehicle_type IN ('suv', 'truck', 'van') THEN
            INSERT INTO job_checklist (
                order_id,
                task_name,
                task_category,
                task_order,
                estimated_minutes
            ) VALUES (
                order_uuid,
                'Large Vehicle - Extended Exterior',
                'exterior',
                task_counter,
                25
            );
            task_counter := task_counter + 1;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate job progress
CREATE OR REPLACE FUNCTION calculate_job_progress(order_uuid UUID)
RETURNS TABLE(
    total_tasks INTEGER,
    completed_tasks INTEGER,
    completion_percentage DECIMAL(5,2),
    estimated_time_remaining INTEGER,
    actual_time_elapsed INTEGER
) AS $$
DECLARE
    total_tasks_count INTEGER;
    completed_tasks_count INTEGER;
    total_estimated_minutes INTEGER;
    completed_estimated_minutes INTEGER;
    job_start_time TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Get total and completed tasks
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE is_completed = TRUE)
    INTO total_tasks_count, completed_tasks_count
    FROM job_checklist 
    WHERE order_id = order_uuid;
    
    -- Get estimated time calculations
    SELECT 
        COALESCE(SUM(estimated_minutes), 0),
        COALESCE(SUM(estimated_minutes) FILTER (WHERE is_completed = TRUE), 0)
    INTO total_estimated_minutes, completed_estimated_minutes
    FROM job_checklist 
    WHERE order_id = order_uuid;
    
    -- Get job start time (first task completion or job assignment time)
    SELECT MIN(completed_at) INTO job_start_time
    FROM job_checklist 
    WHERE order_id = order_uuid AND is_completed = TRUE;
    
    -- Calculate actual time elapsed
    IF job_start_time IS NOT NULL THEN
        actual_time_elapsed := EXTRACT(EPOCH FROM (current_time - job_start_time)) / 60;
    ELSE
        actual_time_elapsed := 0;
    END IF;
    
    -- Calculate completion percentage
    completion_percentage := CASE 
        WHEN total_tasks_count = 0 THEN 0
        ELSE (completed_tasks_count::DECIMAL / total_tasks_count::DECIMAL) * 100
    END;
    
    -- Calculate estimated time remaining
    estimated_time_remaining := total_estimated_minutes - completed_estimated_minutes;
    
    RETURN QUERY SELECT 
        total_tasks_count,
        completed_tasks_count,
        completion_percentage,
        estimated_time_remaining,
        actual_time_elapsed::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Insert comprehensive checklist templates for all service types, tiers, and add-ons
INSERT INTO job_checklist_templates (service_type, task_name, task_category, task_order, estimated_minutes, room_count_multiplier, addon_trigger) VALUES

-- Fresh (Laundry) Service - Base Tasks
('fresh', 'Sort Laundry by Type & Color', 'preparation', 1, 10, FALSE, NULL),
('fresh', 'Load Washer with Detergent', 'washing', 2, 5, FALSE, NULL),
('fresh', 'Transfer to Dryer', 'drying', 3, 5, FALSE, NULL),
('fresh', 'Fold Laundry Items', 'folding', 4, 20, FALSE, NULL),
('fresh', 'Package for Delivery', 'packaging', 5, 10, FALSE, NULL),

-- Fresh (Laundry) Service - Add-ons
('fresh', 'Iron Shirts & Pants', 'ironing', 6, 15, FALSE, 'ironing'),
('fresh', 'Starch Application', 'ironing', 7, 10, FALSE, 'starch'),
('fresh', 'Dry Cleaning Preparation', 'preparation', 8, 15, FALSE, 'dry_cleaning'),
('fresh', 'Express Service Rush', 'packaging', 9, 5, FALSE, 'express'),
('fresh', 'Eco-Friendly Detergent', 'washing', 10, 3, FALSE, 'eco_friendly'),

-- Sparkle (Home Cleaning) Service - Base Tasks
('sparkle', 'Kitchen - Counters & Sinks', 'kitchen', 1, 20, FALSE, NULL),
('sparkle', 'Kitchen - Appliances', 'kitchen', 2, 15, FALSE, NULL),
('sparkle', 'Kitchen - Floors', 'kitchen', 3, 10, FALSE, NULL),
('sparkle', 'Bedroom - Dusting', 'bedroom', 4, 15, TRUE, NULL),
('sparkle', 'Bedroom - Vacuum', 'bedroom', 5, 10, TRUE, NULL),
('sparkle', 'Bedroom - Make Beds', 'bedroom', 6, 5, TRUE, NULL),
('sparkle', 'Bathroom - Toilet & Sink', 'bathroom', 7, 15, TRUE, NULL),
('sparkle', 'Bathroom - Shower/Tub', 'bathroom', 8, 20, TRUE, NULL),
('sparkle', 'Bathroom - Floors', 'bathroom', 9, 10, TRUE, NULL),
('sparkle', 'Living Areas - Dusting', 'common_area', 10, 20, FALSE, NULL),
('sparkle', 'Living Areas - Vacuum', 'common_area', 11, 15, FALSE, NULL),
('sparkle', 'Entryway & Halls', 'common_area', 12, 10, FALSE, NULL),

-- Sparkle (Home Cleaning) Service - Add-ons
('sparkle', 'Deep Dusting - Ceiling Fans', 'deep_cleaning', 13, 15, FALSE, 'deep_dusting'),
('sparkle', 'Deep Dusting - Baseboards', 'deep_cleaning', 14, 20, FALSE, 'deep_dusting'),
('sparkle', 'Window Cleaning - Interior', 'windows', 15, 15, TRUE, 'window_cleaning'),
('sparkle', 'Window Cleaning - Exterior', 'windows', 16, 20, TRUE, 'window_cleaning'),
('sparkle', 'Oven Cleaning', 'kitchen', 17, 30, FALSE, 'oven_cleaning'),
('sparkle', 'Refrigerator Cleaning', 'kitchen', 18, 25, FALSE, 'fridge_cleaning'),
('sparkle', 'Microwave Cleaning', 'kitchen', 19, 10, FALSE, 'microwave_cleaning'),
('sparkle', 'Cabinet Organization', 'organization', 20, 20, FALSE, 'cabinet_organization'),
('sparkle', 'Closet Organization', 'organization', 21, 25, TRUE, 'closet_organization'),
('sparkle', 'Laundry Room Cleaning', 'laundry_room', 22, 15, FALSE, 'laundry_room'),
('sparkle', 'Garage Cleaning', 'garage', 23, 30, FALSE, 'garage_cleaning'),
('sparkle', 'Patio/Deck Cleaning', 'outdoor', 24, 25, FALSE, 'patio_cleaning'),
('sparkle', 'Move-In/Move-Out Deep Clean', 'deep_cleaning', 25, 45, FALSE, 'move_cleaning'),

-- Shine (Car Wash) Service - Base Tasks
('shine', 'Exterior Rinse', 'exterior', 1, 10, FALSE, NULL),
('shine', 'Wash Exterior', 'exterior', 2, 20, FALSE, NULL),
('shine', 'Dry Exterior', 'exterior', 3, 15, FALSE, NULL),
('shine', 'Interior Vacuum', 'interior', 4, 15, FALSE, NULL),
('shine', 'Interior Wipe Down', 'interior', 5, 20, FALSE, NULL),
('shine', 'Window Cleaning', 'interior', 6, 10, FALSE, NULL),
('shine', 'Tire & Wheel Cleaning', 'exterior', 7, 15, FALSE, NULL),
('shine', 'Final Inspection', 'inspection', 8, 5, FALSE, NULL),

-- Shine (Car Wash) Service - Add-ons
('shine', 'Wax Application', 'exterior', 9, 25, FALSE, 'wax'),
('shine', 'Clay Bar Treatment', 'exterior', 10, 30, FALSE, 'clay_bar'),
('shine', 'Paint Correction', 'exterior', 11, 45, FALSE, 'paint_correction'),
('shine', 'Interior Deep Clean', 'interior', 12, 30, FALSE, 'interior_deep'),
('shine', 'Leather Conditioning', 'interior', 13, 20, FALSE, 'leather_conditioning'),
('shine', 'Engine Bay Cleaning', 'engine', 14, 25, FALSE, 'engine_bay'),
('shine', 'Headlight Restoration', 'exterior', 15, 20, FALSE, 'headlight_restoration'),
('shine', 'Ceramic Coating', 'exterior', 16, 60, FALSE, 'ceramic_coating'),
('shine', 'Paint Protection Film', 'exterior', 17, 90, FALSE, 'paint_protection'),
('shine', 'Interior Sanitization', 'interior', 18, 15, FALSE, 'sanitization'),
('shine', 'Odor Elimination', 'interior', 19, 20, FALSE, 'odor_elimination'),
('shine', 'Pet Hair Removal', 'interior', 20, 25, FALSE, 'pet_hair'),
('shine', 'Stain Removal', 'interior', 21, 30, FALSE, 'stain_removal'),

-- Tier-Specific Tasks (Premium)
('fresh', 'Premium Quality Inspection', 'quality_check', 11, 10, FALSE, 'premium'),
('sparkle', 'Premium Quality Inspection', 'quality_check', 26, 15, FALSE, 'premium'),
('shine', 'Premium Quality Inspection', 'quality_check', 22, 10, FALSE, 'premium'),

-- Express Service Tasks
('fresh', 'Express Service Rush Processing', 'express', 12, 5, FALSE, 'express'),
('sparkle', 'Express Service Rush Processing', 'express', 27, 10, FALSE, 'express'),
('shine', 'Express Service Rush Processing', 'express', 23, 8, FALSE, 'express'),

-- Eco-Friendly Tasks
('fresh', 'Eco-Friendly Detergent Application', 'eco', 13, 3, FALSE, 'eco_friendly'),
('sparkle', 'Eco-Friendly Cleaning Products', 'eco', 28, 5, FALSE, 'eco_friendly'),
('shine', 'Eco-Friendly Car Wash Products', 'eco', 24, 5, FALSE, 'eco_friendly');

-- Grant permissions and create RLS policies
GRANT SELECT, INSERT, UPDATE ON job_checklist TO authenticated;
GRANT ALL ON job_checklist TO service_role;

GRANT SELECT ON job_checklist_templates TO authenticated;
GRANT ALL ON job_checklist_templates TO service_role;

GRANT SELECT, INSERT ON job_progress_snapshots TO authenticated;
GRANT ALL ON job_progress_snapshots TO service_role;

-- RLS policies for job_checklist
ALTER TABLE job_checklist ENABLE ROW LEVEL SECURITY;

-- Bubbler can view and update their own job checklists
CREATE POLICY "Bubblers can manage their job checklists" ON job_checklist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM job_assignments ja
            WHERE ja.order_id = job_checklist.order_id
            AND ja.bubbler_id = auth.uid()
        )
    );

-- Lead bubblers can view checklists in their zone
CREATE POLICY "Lead bubblers can view zone checklists" ON job_checklist
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers b
            WHERE b.id = auth.uid()
            AND b.role = 'lead_bubbler'
        )
    );

-- Admins can view all checklists
CREATE POLICY "Admins can view all checklists" ON job_checklist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler')
        )
    );

-- RLS policies for job_progress_snapshots
ALTER TABLE job_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- Bubbler can view their own snapshots
CREATE POLICY "Bubblers can view their snapshots" ON job_progress_snapshots
    FOR SELECT USING (bubbler_id = auth.uid());

-- Lead bubblers and admins can view all snapshots
CREATE POLICY "Lead bubblers and admins can view all snapshots" ON job_progress_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bubblers 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'admin_bubbler', 'lead_bubbler')
        )
    );

-- Add comments for documentation
COMMENT ON TABLE job_checklist IS 'Granular task tracking for each job to prevent fraud and ensure accurate compensation';
COMMENT ON TABLE job_checklist_templates IS 'Predefined task templates for each service type with add-on support';
COMMENT ON TABLE job_progress_snapshots IS 'Audit trail of job progress for verification and fraud detection';
COMMENT ON FUNCTION generate_job_checklist(UUID) IS 'Automatically generates checklist for a new order based on service type, tier, and add-ons';
COMMENT ON FUNCTION calculate_job_progress(UUID) IS 'Calculates current progress and time estimates for a job';
COMMENT ON FUNCTION create_progress_snapshot(UUID, UUID, VARCHAR) IS 'Creates a snapshot of job progress for audit trail';
COMMENT ON FUNCTION detect_suspicious_behavior(UUID, INTEGER) IS 'Detects potential fraud patterns in bubbler behavior'; 