-- Slug History Table
-- Tracks slug changes for redirect purposes
-- Ensures old URLs continue to work after school/authorizer renames

CREATE TABLE IF NOT EXISTS slug_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('school', 'authorizer')),
    entity_id UUID NOT NULL,
    old_slug TEXT NOT NULL,
    new_slug TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id),

    -- Composite index for redirect lookups
    CONSTRAINT slug_history_unique UNIQUE (entity_type, old_slug)
);

-- Index for fast redirect lookups
CREATE INDEX idx_slug_history_lookup ON slug_history(entity_type, old_slug);

-- Index for entity history queries
CREATE INDEX idx_slug_history_entity ON slug_history(entity_type, entity_id);

-- RLS Policies
ALTER TABLE slug_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view slug history
CREATE POLICY "Admins can view slug history"
    ON slug_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            WHERE sm.user_id = auth.uid()
            AND sm.role IN ('school_admin', 'platform_admin')
        )
    );

-- Only system can insert (via service role)
CREATE POLICY "Service role can insert slug history"
    ON slug_history FOR INSERT
    TO service_role
    WITH CHECK (true);

COMMENT ON TABLE slug_history IS 'Tracks slug changes for URL redirect purposes';
COMMENT ON COLUMN slug_history.entity_type IS 'Type of entity: school or authorizer';
COMMENT ON COLUMN slug_history.old_slug IS 'Previous slug value (for redirect lookups)';
COMMENT ON COLUMN slug_history.new_slug IS 'New slug value at time of change';
