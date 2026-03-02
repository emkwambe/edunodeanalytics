-- Sprint 21: Reports and AI Usage Tables
-- =======================================
--
-- Tables for report scheduling and AI usage tracking

-- ============================================
-- Scheduled Reports Table
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Report configuration
    report_type TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'pdf',
    title TEXT NOT NULL,

    -- Schedule configuration
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    day_of_week INTEGER, -- 0-6 for weekly
    day_of_month INTEGER, -- 1-31 for monthly
    time_of_day TIME NOT NULL DEFAULT '08:00:00',
    timezone TEXT NOT NULL DEFAULT 'America/New_York',

    -- Filters and options
    filters JSONB DEFAULT '{}',
    options JSONB DEFAULT '{}',

    -- Recipients
    recipients JSONB NOT NULL DEFAULT '[]', -- Array of {email, name}

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    last_error TEXT,

    -- Audit
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for scheduled_reports
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_school ON scheduled_reports(school_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at) WHERE is_active = true;

-- ============================================
-- Generated Reports Table (History)
-- ============================================
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE SET NULL,

    -- Report details
    report_type TEXT NOT NULL,
    format TEXT NOT NULL,
    title TEXT NOT NULL,

    -- Generation info
    generated_by UUID NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    generation_time_ms INTEGER,

    -- Storage
    storage_path TEXT, -- S3/GCS path for PDF/Excel files
    file_size_bytes INTEGER,
    expires_at TIMESTAMPTZ, -- Optional expiration for cleanup

    -- Delivery status (for scheduled reports)
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
    delivered_at TIMESTAMPTZ,
    delivery_error TEXT,

    -- Metadata
    filters JSONB DEFAULT '{}',
    record_count INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for generated_reports
CREATE INDEX IF NOT EXISTS idx_generated_reports_school ON generated_reports(school_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at ON generated_reports(generated_at DESC);

-- ============================================
-- AI Usage Tracking Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Request details
    provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'google', 'mock')),
    model TEXT NOT NULL,
    feature TEXT NOT NULL, -- e.g., 'qualitative_pulse', 'intervention_plan'

    -- Token usage
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

    -- Cost (in USD cents for precision)
    cost_cents INTEGER NOT NULL DEFAULT 0,

    -- Performance
    latency_ms INTEGER,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,

    -- Privacy
    anonymization_level TEXT CHECK (anonymization_level IN ('none', 'pseudonym', 'aggregate')),
    student_count INTEGER DEFAULT 0,
    pii_detected BOOLEAN DEFAULT false,

    -- Audit
    audit_id TEXT, -- Links to SecureAIProxy audit log
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for ai_usage
CREATE INDEX IF NOT EXISTS idx_ai_usage_school ON ai_usage(school_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage(provider);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at DESC);
-- Note: For monthly aggregation queries, use a covering index on school_id + created_at
-- date_trunc cannot be used in index expressions as it's not IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_ai_usage_school_created ON ai_usage(school_id, created_at);

-- ============================================
-- AI Usage Limits Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Monthly limits based on tier
    monthly_token_limit INTEGER, -- NULL = unlimited
    monthly_cost_limit_cents INTEGER, -- NULL = unlimited

    -- Current month usage (reset monthly via cron)
    current_month_tokens INTEGER NOT NULL DEFAULT 0,
    current_month_cost_cents INTEGER NOT NULL DEFAULT 0,
    period_start TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Alerts
    alert_threshold_percent INTEGER DEFAULT 80,
    alert_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(school_id)
);

-- ============================================
-- Add is_stale column to interventions
-- ============================================
ALTER TABLE interventions
ADD COLUMN IF NOT EXISTS is_stale BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_interventions_stale ON interventions(is_stale) WHERE is_stale = true;

-- ============================================
-- Views for Analytics
-- ============================================

-- Monthly AI usage summary by school
CREATE OR REPLACE VIEW v_ai_usage_monthly AS
SELECT
    school_id,
    date_trunc('month', created_at) AS month,
    provider,
    feature,
    COUNT(*) AS request_count,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(total_tokens) AS total_tokens,
    SUM(cost_cents) AS total_cost_cents,
    AVG(latency_ms)::INTEGER AS avg_latency_ms,
    SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*) AS success_rate
FROM ai_usage
GROUP BY school_id, date_trunc('month', created_at), provider, feature;

-- Report generation summary
CREATE OR REPLACE VIEW v_report_summary AS
SELECT
    school_id,
    report_type,
    COUNT(*) AS total_generated,
    AVG(generation_time_ms)::INTEGER AS avg_generation_ms,
    MAX(generated_at) AS last_generated,
    SUM(CASE WHEN delivery_status = 'sent' THEN 1 ELSE 0 END) AS delivered_count
FROM generated_reports
GROUP BY school_id, report_type;

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_limits ENABLE ROW LEVEL SECURITY;

-- Scheduled reports policies
CREATE POLICY "School members can view scheduled reports"
    ON scheduled_reports FOR SELECT
    USING (school_id IN (
        SELECT school_id FROM school_memberships
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "School admins can manage scheduled reports"
    ON scheduled_reports FOR ALL
    USING (school_id IN (
        SELECT school_id FROM school_memberships
        WHERE user_id = auth.uid() AND role IN ('school_admin', 'principal', 'data_manager')
    ));

-- Generated reports policies
CREATE POLICY "School members can view generated reports"
    ON generated_reports FOR SELECT
    USING (school_id IN (
        SELECT school_id FROM school_memberships
        WHERE user_id = auth.uid()
    ));

-- AI usage policies (read-only for members, admins can see all)
CREATE POLICY "School admins can view AI usage"
    ON ai_usage FOR SELECT
    USING (school_id IN (
        SELECT school_id FROM school_memberships
        WHERE user_id = auth.uid() AND role IN ('school_admin', 'principal', 'data_manager')
    ));

-- AI usage limits policies
CREATE POLICY "School admins can view AI limits"
    ON ai_usage_limits FOR SELECT
    USING (school_id IN (
        SELECT school_id FROM school_memberships
        WHERE user_id = auth.uid() AND role IN ('school_admin', 'principal', 'data_manager')
    ));

-- ============================================
-- Triggers
-- ============================================

-- Update timestamps
CREATE TRIGGER update_scheduled_reports_timestamp
    BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_usage_limits_timestamp
    BEFORE UPDATE ON ai_usage_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
