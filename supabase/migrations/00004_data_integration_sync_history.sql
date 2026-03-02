-- ==============================================
-- Sprint 19: Data Integration - Sync History & Enhancements
-- Adds sync_history table for detailed sync tracking
-- ==============================================

-- ==============================================
-- SYNC HISTORY TABLE - Track individual sync runs
-- ==============================================

CREATE TABLE IF NOT EXISTS sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Relationships
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,

    -- Sync details
    sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,

    -- Status
    status sync_status NOT NULL DEFAULT 'syncing',
    error_message TEXT,

    -- Statistics
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,

    -- Sync details by entity type
    details JSONB, -- {students: {created: 5, updated: 10}, staff: {...}}

    -- Errors encountered (array of error objects)
    errors JSONB DEFAULT '[]'::JSONB,

    -- Triggered by
    triggered_by TEXT CHECK (triggered_by IN ('cron', 'manual', 'webhook', 'oauth_callback')),
    triggered_by_user_id UUID REFERENCES users(id),

    -- Duration tracking
    duration_ms INTEGER
);

CREATE INDEX idx_sync_history_school ON sync_history(school_id);
CREATE INDEX idx_sync_history_data_source ON sync_history(data_source_id);
CREATE INDEX idx_sync_history_created ON sync_history(created_at DESC);
CREATE INDEX idx_sync_history_status ON sync_history(status) WHERE status IN ('syncing', 'failed');

-- Enable RLS
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: School admins can view their sync history
CREATE POLICY "School admins can view sync history"
    ON sync_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = sync_history.school_id
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

-- ==============================================
-- ADD NWEA MAP TO PROVIDER ENUM
-- ==============================================

-- Note: nwea_map already exists in the enum from migration 00002

-- ==============================================
-- UPDATE DATA SOURCES TABLE - Add OAuth token fields
-- ==============================================

ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- ==============================================
-- FUNCTION: Calculate next sync time
-- ==============================================

CREATE OR REPLACE FUNCTION calculate_next_sync_at(
    frequency_hours INTEGER,
    last_sync TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN COALESCE(last_sync, NOW()) + (frequency_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================
-- FUNCTION: Get schools due for sync
-- ==============================================

CREATE OR REPLACE FUNCTION get_schools_due_for_sync()
RETURNS TABLE (
    school_id UUID,
    data_source_id UUID,
    provider data_source_provider,
    last_sync_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ds.school_id,
        ds.id AS data_source_id,
        ds.provider,
        ds.last_sync_at
    FROM data_sources ds
    JOIN schools s ON ds.school_id = s.id
    WHERE ds.sync_enabled = TRUE
      AND ds.is_active = TRUE
      AND s.is_active = TRUE
      AND s.subscription_status IN ('active', 'trialing')
      AND (
          ds.next_sync_at IS NULL
          OR ds.next_sync_at <= NOW()
      )
    ORDER BY ds.next_sync_at ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql STABLE;
