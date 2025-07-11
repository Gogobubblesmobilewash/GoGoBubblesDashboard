-- Database Migration for Automated Reporting & Business Intelligence System
-- GoGoBubbles Platform
-- Version: 1.0
-- Date: 2024-01-16

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- AUTOMATED REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS automated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('revenue', 'performance', 'operations', 'custom')),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    schedule_config JSONB NOT NULL DEFAULT '{}',
    template_id UUID,
    recipients JSONB NOT NULL DEFAULT '[]',
    format VARCHAR(20) NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'email', 'csv')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed', 'draft')),
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    last_status VARCHAR(20) CHECK (last_status IN ('success', 'failed', 'partial')),
    last_error_message TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- REPORT TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('financial', 'operational', 'marketing', 'custom')),
    template_config JSONB NOT NULL DEFAULT '{}',
    sections JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- REPORT EXECUTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES automated_reports(id) ON DELETE CASCADE,
    execution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    file_path VARCHAR(500),
    file_size BIGINT,
    recipients_sent JSONB DEFAULT '[]',
    error_message TEXT,
    execution_time_ms INTEGER,
    data_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BUSINESS INTELLIGENCE INSIGHTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bi_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('opportunity', 'alert', 'trend', 'optimization', 'prediction')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    impact_level VARCHAR(20) NOT NULL CHECK (impact_level IN ('high', 'medium', 'low')),
    confidence_percentage INTEGER NOT NULL CHECK (confidence_percentage >= 0 AND confidence_percentage <= 100),
    action_recommendation TEXT,
    related_metric VARCHAR(50),
    data_sources JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PREDICTIVE ANALYTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS predictive_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(50) NOT NULL,
    prediction_period VARCHAR(50) NOT NULL,
    predicted_value DECIMAL(15,2),
    confidence_percentage INTEGER NOT NULL CHECK (confidence_percentage >= 0 AND confidence_percentage <= 100),
    factors JSONB DEFAULT '[]',
    model_version VARCHAR(50),
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actual_value DECIMAL(15,2),
    accuracy_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS DASHBOARD CONFIGURATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS dashboard_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    dashboard_name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS DATA CACHE
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Automated Reports Indexes
CREATE INDEX IF NOT EXISTS idx_automated_reports_status ON automated_reports(status);
CREATE INDEX IF NOT EXISTS idx_automated_reports_next_run ON automated_reports(next_run_at);
CREATE INDEX IF NOT EXISTS idx_automated_reports_created_by ON automated_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_automated_reports_type ON automated_reports(report_type);

-- Report Templates Indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_report_templates_default ON report_templates(is_default);

-- Report Executions Indexes
CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_date ON report_executions(execution_date);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);

-- BI Insights Indexes
CREATE INDEX IF NOT EXISTS idx_bi_insights_type ON bi_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_bi_insights_impact ON bi_insights(impact_level);
CREATE INDEX IF NOT EXISTS idx_bi_insights_active ON bi_insights(is_active);
CREATE INDEX IF NOT EXISTS idx_bi_insights_expires ON bi_insights(expires_at);

-- Predictive Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_metric ON predictive_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_date ON predictive_analytics(prediction_date);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_period ON predictive_analytics(prediction_period);

-- Dashboard Configurations Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_config_user ON dashboard_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_config_default ON dashboard_configurations(is_default);

-- Analytics Cache Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_automated_reports_updated_at 
    BEFORE UPDATE ON automated_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at 
    BEFORE UPDATE ON report_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bi_insights_updated_at 
    BEFORE UPDATE ON bi_insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_configurations_updated_at 
    BEFORE UPDATE ON dashboard_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert default report templates
INSERT INTO report_templates (id, name, description, category, sections, is_default, created_by) VALUES
(
    uuid_generate_v4(),
    'Revenue Summary',
    'Comprehensive revenue analysis with trends and projections',
    'financial',
    '["revenue_overview", "trends", "projections", "comparisons"]',
    TRUE,
    (SELECT id FROM users WHERE email = 'admin@gogobubbles.com' LIMIT 1)
),
(
    uuid_generate_v4(),
    'Performance Dashboard',
    'Key performance indicators and operational metrics',
    'operational',
    '["kpis", "efficiency", "quality", "growth"]',
    TRUE,
    (SELECT id FROM users WHERE email = 'admin@gogobubbles.com' LIMIT 1)
),
(
    uuid_generate_v4(),
    'Operations Alert',
    'Daily operational status and critical alerts',
    'operational',
    '["status", "alerts", "issues", "recommendations"]',
    FALSE,
    (SELECT id FROM users WHERE email = 'admin@gogobubbles.com' LIMIT 1)
);

-- Insert sample automated reports
INSERT INTO automated_reports (name, description, report_type, frequency, recipients, format, status, created_by) VALUES
(
    'Weekly Revenue Summary',
    'Weekly comprehensive revenue analysis',
    'revenue',
    'weekly',
    '["admin@gogobubbles.com", "finance@gogobubbles.com"]',
    'pdf',
    'active',
    (SELECT id FROM users WHERE email = 'admin@gogobubbles.com' LIMIT 1)
),
(
    'Monthly Performance Dashboard',
    'Monthly performance metrics and KPIs',
    'performance',
    'monthly',
    '["admin@gogobubbles.com"]',
    'excel',
    'active',
    (SELECT id FROM users WHERE email = 'admin@gogobubbles.com' LIMIT 1)
),
(
    'Daily Operations Alert',
    'Daily operational status and alerts',
    'operations',
    'daily',
    '["ops@gogobubbles.com"]',
    'email',
    'paused',
    (SELECT id FROM users WHERE email = 'admin@gogobubbles.com' LIMIT 1)
);

-- Insert sample BI insights
INSERT INTO bi_insights (insight_type, title, description, impact_level, confidence_percentage, action_recommendation, related_metric) VALUES
(
    'opportunity',
    'Revenue Growth Opportunity',
    'Weekend bookings show 25% higher revenue per order',
    'high',
    92,
    'Increase weekend marketing spend',
    'revenue'
),
(
    'alert',
    'Customer Churn Risk',
    '12 customers haven\'t booked in 45+ days',
    'high',
    88,
    'Send re-engagement campaign',
    'customers'
),
(
    'trend',
    'Service Area Expansion',
    'North region shows 40% growth potential',
    'medium',
    85,
    'Consider expanding to North region',
    'orders'
),
(
    'optimization',
    'Peak Hour Optimization',
    '2-4 PM shows highest demand but lowest availability',
    'medium',
    78,
    'Increase capacity during peak hours',
    'orders'
);

-- Insert sample predictive analytics
INSERT INTO predictive_analytics (metric_name, prediction_period, predicted_value, confidence_percentage, factors) VALUES
(
    'revenue',
    'next_30_days',
    142000.00,
    92,
    '["seasonal trends", "marketing campaigns", "customer growth"]'
),
(
    'orders',
    'next_30_days',
    1380,
    89,
    '["demand patterns", "capacity planning", "market conditions"]'
),
(
    'customers',
    'next_30_days',
    945,
    85,
    '["acquisition rate", "retention rate", "referral growth"]'
);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active reports with next run information
CREATE OR REPLACE VIEW active_reports_view AS
SELECT 
    ar.id,
    ar.name,
    ar.report_type,
    ar.frequency,
    ar.status,
    ar.last_run_at,
    ar.next_run_at,
    ar.last_status,
    rt.name as template_name,
    COUNT(re.id) as execution_count
FROM automated_reports ar
LEFT JOIN report_templates rt ON ar.template_id = rt.id
LEFT JOIN report_executions re ON ar.id = re.report_id
WHERE ar.is_deleted = FALSE AND ar.status = 'active'
GROUP BY ar.id, rt.name;

-- View for recent insights
CREATE OR REPLACE VIEW recent_insights_view AS
SELECT 
    id,
    insight_type,
    title,
    impact_level,
    confidence_percentage,
    created_at
FROM bi_insights
WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY created_at DESC;

-- View for report execution statistics
CREATE OR REPLACE VIEW report_execution_stats AS
SELECT 
    ar.name as report_name,
    ar.report_type,
    COUNT(re.id) as total_executions,
    COUNT(CASE WHEN re.status = 'completed' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN re.status = 'failed' THEN 1 END) as failed_executions,
    AVG(re.execution_time_ms) as avg_execution_time_ms
FROM automated_reports ar
LEFT JOIN report_executions re ON ar.id = re.report_id
WHERE ar.is_deleted = FALSE
GROUP BY ar.id, ar.name, ar.report_type;

-- =====================================================
-- CLEANUP PROCEDURES
-- =====================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired insights
CREATE OR REPLACE FUNCTION cleanup_expired_insights()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE bi_insights SET is_active = FALSE WHERE expires_at < NOW() AND is_active = TRUE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
INSERT INTO system_migrations (migration_name, version, applied_at) VALUES 
('automated_reporting_bi_system', '1.0', NOW())
ON CONFLICT (migration_name) DO UPDATE SET 
    version = EXCLUDED.version,
    applied_at = NOW();

COMMIT; 