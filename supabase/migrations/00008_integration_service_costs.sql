-- ==============================================
-- Sprint 20: Unified Integration Service Layer - Cost Tracking
-- Adds integration cost tracking for billing schools
-- ==============================================

-- ==============================================
-- INTEGRATION PRICING TABLE - Define costs per integration
-- ==============================================

CREATE TABLE IF NOT EXISTS integration_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Integration identifier (maps to adapter id)
    integration_id TEXT NOT NULL UNIQUE,

    -- Display info
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('sis', 'assessment', 'lms', 'behavior', 'finance')),

    -- Pricing structure
    base_monthly_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Fixed monthly fee
    per_student_cost DECIMAL(10, 4) NOT NULL DEFAULT 0.00,  -- Cost per student synced
    per_sync_cost DECIMAL(10, 4) NOT NULL DEFAULT 0.00,     -- Cost per sync operation
    per_record_cost DECIMAL(10, 6) NOT NULL DEFAULT 0.00,   -- Cost per record synced

    -- Free tier limits
    free_students_limit INTEGER DEFAULT 0,
    free_syncs_limit INTEGER DEFAULT 0,
    free_records_limit INTEGER DEFAULT 0,

    -- Tier multipliers (some integrations cost more for different tiers)
    starter_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    pro_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.00,
    enterprise_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 0.80, -- Discount for enterprise

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB
);

-- ==============================================
-- INTEGRATION USAGE TABLE - Track usage per school
-- ==============================================

CREATE TABLE IF NOT EXISTS integration_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Relationships
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    integration_id TEXT NOT NULL,

    -- Billing period (monthly)
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,

    -- Usage metrics
    students_synced INTEGER NOT NULL DEFAULT 0,
    sync_operations INTEGER NOT NULL DEFAULT 0,
    records_processed INTEGER NOT NULL DEFAULT 0,

    -- Calculated costs (denormalized for quick access)
    base_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    student_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    sync_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    record_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    -- Adjustments
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_reason TEXT,

    -- Billing status
    invoiced BOOLEAN NOT NULL DEFAULT FALSE,
    invoice_id TEXT,
    invoiced_at TIMESTAMPTZ,

    UNIQUE(school_id, data_source_id, billing_period_start)
);

CREATE INDEX idx_integration_usage_school ON integration_usage(school_id);
CREATE INDEX idx_integration_usage_period ON integration_usage(billing_period_start, billing_period_end);
CREATE INDEX idx_integration_usage_uninvoiced ON integration_usage(invoiced) WHERE invoiced = FALSE;

-- ==============================================
-- INTEGRATION EVENTS TABLE - Granular event tracking
-- ==============================================

CREATE TABLE IF NOT EXISTS integration_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Relationships
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    data_source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    sync_history_id UUID REFERENCES sync_history(id) ON DELETE SET NULL,

    -- Event details
    integration_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'sync_started', 'sync_completed', 'sync_failed',
        'connection_established', 'connection_lost',
        'records_synced', 'records_deleted',
        'oauth_authorized', 'oauth_revoked',
        'quota_warning', 'quota_exceeded'
    )),

    -- Metrics (for usage events)
    records_count INTEGER DEFAULT 0,
    students_count INTEGER DEFAULT 0,
    duration_ms INTEGER,

    -- Cost calculation (for billable events)
    is_billable BOOLEAN NOT NULL DEFAULT FALSE,
    cost_amount DECIMAL(10, 4) DEFAULT 0.00,

    -- Context
    metadata JSONB DEFAULT '{}'::JSONB,
    error_message TEXT,

    -- User who triggered (if manual)
    triggered_by_user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_integration_events_school ON integration_events(school_id);
CREATE INDEX idx_integration_events_type ON integration_events(event_type);
CREATE INDEX idx_integration_events_created ON integration_events(created_at DESC);
CREATE INDEX idx_integration_events_billable ON integration_events(is_billable, created_at) WHERE is_billable = TRUE;

-- ==============================================
-- SCHOOL INTEGRATION SETTINGS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS school_integration_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Relationship
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE UNIQUE,

    -- Billing preferences
    pass_costs_to_school BOOLEAN NOT NULL DEFAULT TRUE, -- Whether to bill school for integration costs
    billing_contact_email TEXT,

    -- Usage limits (school-specific overrides)
    max_monthly_cost DECIMAL(10, 2), -- Cap on monthly integration spend
    max_syncs_per_day INTEGER,
    max_concurrent_syncs INTEGER DEFAULT 3,

    -- Notifications
    cost_alert_threshold DECIMAL(10, 2), -- Alert when approaching this amount
    notify_on_sync_failure BOOLEAN DEFAULT TRUE,
    notify_on_quota_warning BOOLEAN DEFAULT TRUE,

    -- Features
    allow_manual_sync BOOLEAN DEFAULT TRUE,
    allow_realtime_sync BOOLEAN DEFAULT FALSE,
    allow_bulk_operations BOOLEAN DEFAULT TRUE,

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB
);

-- ==============================================
-- ENABLE RLS
-- ==============================================

ALTER TABLE integration_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_integration_settings ENABLE ROW LEVEL SECURITY;

-- Integration pricing is public read for all authenticated users
CREATE POLICY "Anyone can view integration pricing"
    ON integration_pricing FOR SELECT
    USING (TRUE);

-- Only platform admins can modify pricing
CREATE POLICY "Platform admins can manage pricing"
    ON integration_pricing FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.clerk_user_id = auth.uid()::TEXT
            AND u.platform_role IN ('superadmin', 'admin')
        )
    );

-- School admins can view their usage
CREATE POLICY "School admins can view integration usage"
    ON integration_usage FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = integration_usage.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.role IN ('school_admin', 'principal', 'data_manager')
            AND sm.is_active = TRUE
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.clerk_user_id = auth.uid()::TEXT
            AND u.platform_role IS NOT NULL
        )
    );

-- School admins can view their events
CREATE POLICY "School admins can view integration events"
    ON integration_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = integration_events.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.role IN ('school_admin', 'principal', 'data_manager')
            AND sm.is_active = TRUE
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.clerk_user_id = auth.uid()::TEXT
            AND u.platform_role IS NOT NULL
        )
    );

-- School admins can manage their settings
CREATE POLICY "School admins can manage integration settings"
    ON school_integration_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = school_integration_settings.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.role IN ('school_admin', 'principal')
            AND sm.is_active = TRUE
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.clerk_user_id = auth.uid()::TEXT
            AND u.platform_role IS NOT NULL
        )
    );

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Calculate integration cost for a sync operation
CREATE OR REPLACE FUNCTION calculate_integration_cost(
    p_integration_id TEXT,
    p_school_tier TEXT,
    p_records_count INTEGER,
    p_students_count INTEGER DEFAULT 0
)
RETURNS DECIMAL(10, 4) AS $$
DECLARE
    v_pricing integration_pricing%ROWTYPE;
    v_multiplier DECIMAL(4, 2);
    v_total_cost DECIMAL(10, 4);
BEGIN
    -- Get pricing for this integration
    SELECT * INTO v_pricing
    FROM integration_pricing
    WHERE integration_id = p_integration_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN 0.00;
    END IF;

    -- Get tier multiplier
    v_multiplier := CASE p_school_tier
        WHEN 'starter' THEN v_pricing.starter_multiplier
        WHEN 'pro' THEN v_pricing.pro_multiplier
        WHEN 'enterprise' THEN v_pricing.enterprise_multiplier
        ELSE 1.00
    END;

    -- Calculate cost
    v_total_cost := (
        v_pricing.per_sync_cost +
        (v_pricing.per_record_cost * GREATEST(0, p_records_count - v_pricing.free_records_limit)) +
        (v_pricing.per_student_cost * GREATEST(0, p_students_count - v_pricing.free_students_limit))
    ) * v_multiplier;

    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get current billing period
CREATE OR REPLACE FUNCTION get_current_billing_period()
RETURNS TABLE (period_start DATE, period_end DATE) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC('month', CURRENT_DATE)::DATE AS period_start,
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE AS period_end;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get or create usage record for current period
CREATE OR REPLACE FUNCTION get_or_create_usage_record(
    p_school_id UUID,
    p_data_source_id UUID,
    p_integration_id TEXT
)
RETURNS UUID AS $$
DECLARE
    v_usage_id UUID;
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Get current billing period
    SELECT period_start, period_end INTO v_period_start, v_period_end
    FROM get_current_billing_period();

    -- Try to get existing record
    SELECT id INTO v_usage_id
    FROM integration_usage
    WHERE school_id = p_school_id
      AND data_source_id = p_data_source_id
      AND billing_period_start = v_period_start;

    -- Create if not exists
    IF v_usage_id IS NULL THEN
        INSERT INTO integration_usage (
            school_id, data_source_id, integration_id,
            billing_period_start, billing_period_end
        )
        VALUES (
            p_school_id, p_data_source_id, p_integration_id,
            v_period_start, v_period_end
        )
        RETURNING id INTO v_usage_id;
    END IF;

    RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql;

-- Increment usage metrics
CREATE OR REPLACE FUNCTION increment_integration_usage(
    p_school_id UUID,
    p_data_source_id UUID,
    p_integration_id TEXT,
    p_records_processed INTEGER DEFAULT 0,
    p_students_synced INTEGER DEFAULT 0,
    p_is_sync_operation BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
    v_usage_id UUID;
BEGIN
    -- Get or create usage record
    v_usage_id := get_or_create_usage_record(p_school_id, p_data_source_id, p_integration_id);

    -- Update metrics
    UPDATE integration_usage
    SET
        records_processed = records_processed + p_records_processed,
        students_synced = GREATEST(students_synced, p_students_synced),
        sync_operations = sync_operations + CASE WHEN p_is_sync_operation THEN 1 ELSE 0 END,
        updated_at = NOW()
    WHERE id = v_usage_id;
END;
$$ LANGUAGE plpgsql;

-- Recalculate costs for a usage record
CREATE OR REPLACE FUNCTION recalculate_usage_costs(p_usage_id UUID)
RETURNS VOID AS $$
DECLARE
    v_usage integration_usage%ROWTYPE;
    v_pricing integration_pricing%ROWTYPE;
    v_school_tier TEXT;
    v_multiplier DECIMAL(4, 2);
BEGIN
    -- Get usage record
    SELECT * INTO v_usage FROM integration_usage WHERE id = p_usage_id;
    IF NOT FOUND THEN RETURN; END IF;

    -- Get pricing
    SELECT * INTO v_pricing
    FROM integration_pricing
    WHERE integration_id = v_usage.integration_id AND is_active = TRUE;
    IF NOT FOUND THEN RETURN; END IF;

    -- Get school tier
    SELECT subscription_tier INTO v_school_tier
    FROM schools WHERE id = v_usage.school_id;

    v_multiplier := CASE v_school_tier
        WHEN 'starter' THEN v_pricing.starter_multiplier
        WHEN 'pro' THEN v_pricing.pro_multiplier
        WHEN 'enterprise' THEN v_pricing.enterprise_multiplier
        ELSE 1.00
    END;

    -- Calculate costs
    UPDATE integration_usage
    SET
        base_cost = v_pricing.base_monthly_cost * v_multiplier,
        student_cost = v_pricing.per_student_cost *
            GREATEST(0, v_usage.students_synced - v_pricing.free_students_limit) * v_multiplier,
        sync_cost = v_pricing.per_sync_cost *
            GREATEST(0, v_usage.sync_operations - v_pricing.free_syncs_limit) * v_multiplier,
        record_cost = v_pricing.per_record_cost *
            GREATEST(0, v_usage.records_processed - v_pricing.free_records_limit) * v_multiplier,
        total_cost = (
            v_pricing.base_monthly_cost +
            v_pricing.per_student_cost * GREATEST(0, v_usage.students_synced - v_pricing.free_students_limit) +
            v_pricing.per_sync_cost * GREATEST(0, v_usage.sync_operations - v_pricing.free_syncs_limit) +
            v_pricing.per_record_cost * GREATEST(0, v_usage.records_processed - v_pricing.free_records_limit)
        ) * v_multiplier - COALESCE(v_usage.discount_amount, 0)
    WHERE id = p_usage_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- SEED DEFAULT INTEGRATION PRICING
-- ==============================================

INSERT INTO integration_pricing (integration_id, name, category, base_monthly_cost, per_student_cost, per_sync_cost, per_record_cost, free_students_limit, free_syncs_limit, free_records_limit)
VALUES
    -- SIS Integrations
    ('clever', 'Clever', 'sis', 25.00, 0.05, 0.00, 0.0001, 100, 30, 10000),
    ('classlink', 'ClassLink', 'sis', 25.00, 0.05, 0.00, 0.0001, 100, 30, 10000),
    ('powerschool', 'PowerSchool', 'sis', 35.00, 0.08, 0.00, 0.0002, 100, 30, 10000),

    -- Assessment Integrations
    ('nwea_map', 'NWEA MAP', 'assessment', 20.00, 0.03, 0.10, 0.0001, 100, 10, 5000),
    ('iready', 'iReady', 'assessment', 20.00, 0.03, 0.10, 0.0001, 100, 10, 5000),
    ('renaissance_star', 'Renaissance STAR', 'assessment', 20.00, 0.03, 0.10, 0.0001, 100, 10, 5000),

    -- LMS Integrations
    ('canvas', 'Canvas LMS', 'lms', 30.00, 0.04, 0.05, 0.0001, 50, 30, 10000),
    ('google_classroom', 'Google Classroom', 'lms', 15.00, 0.02, 0.00, 0.00005, 100, 60, 20000)
ON CONFLICT (integration_id) DO UPDATE
SET
    name = EXCLUDED.name,
    base_monthly_cost = EXCLUDED.base_monthly_cost,
    per_student_cost = EXCLUDED.per_student_cost,
    per_sync_cost = EXCLUDED.per_sync_cost,
    per_record_cost = EXCLUDED.per_record_cost,
    updated_at = NOW();

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Auto-recalculate costs when usage is updated
CREATE OR REPLACE FUNCTION trigger_recalculate_usage_costs()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM recalculate_usage_costs(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_usage_costs
    AFTER INSERT OR UPDATE OF records_processed, students_synced, sync_operations
    ON integration_usage
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_usage_costs();

-- Update timestamp trigger
CREATE TRIGGER update_integration_pricing_updated_at
    BEFORE UPDATE ON integration_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_integration_settings_updated_at
    BEFORE UPDATE ON school_integration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
