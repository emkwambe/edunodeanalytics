-- ==============================================
-- EduNode Analytics - Initial Database Schema
-- Multi-tenant SaaS for Charter School Analytics
-- ==============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- ENUMS
-- ==============================================

CREATE TYPE subscription_tier AS ENUM ('starter', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled');
CREATE TYPE school_role AS ENUM ('school_admin', 'principal', 'teacher', 'counselor', 'data_manager', 'viewer');
CREATE TYPE platform_role AS ENUM ('platform_admin', 'support', 'sales');

-- ==============================================
-- TABLES
-- ==============================================

-- Charter Authorizers (oversight bodies)
CREATE TABLE authorizers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    contact_email TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_authorizers_slug ON authorizers(slug);

-- Schools (Tenants)
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Identity
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    legal_name TEXT,
    domain TEXT UNIQUE,

    -- White-labeling / Branding
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#6366f1',
    secondary_color TEXT NOT NULL DEFAULT '#06b6d4',
    accent_color TEXT NOT NULL DEFAULT '#10b981',

    -- Subscription
    subscription_tier subscription_tier NOT NULL DEFAULT 'starter',
    subscription_status subscription_status NOT NULL DEFAULT 'trialing',
    trial_ends_at TIMESTAMPTZ,

    -- Integration IDs (for data pipeline)
    bigquery_dataset_id TEXT UNIQUE,
    clever_district_id TEXT UNIQUE,
    classlink_tenant_id TEXT UNIQUE,

    -- School Settings
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    academic_year_start_month INTEGER NOT NULL DEFAULT 8, -- August

    -- Contact
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    address JSONB,

    -- Authorizer relationship
    authorizer_id UUID REFERENCES authorizers(id),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Extensible metadata
    metadata JSONB
);

CREATE INDEX idx_schools_slug ON schools(slug);
CREATE INDEX idx_schools_subscription ON schools(subscription_tier, subscription_status);
CREATE INDEX idx_schools_authorizer ON schools(authorizer_id);

-- Users (Platform-level identity, synced from Clerk)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Clerk sync
    clerk_user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,

    -- Platform role (NULL for regular school users)
    platform_role platform_role,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,

    -- User preferences (dashboard defaults, notifications, etc.)
    preferences JSONB,

    -- Extensible metadata
    metadata JSONB
);

CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_platform_role ON users(platform_role) WHERE platform_role IS NOT NULL;

-- School Memberships (User <-> School relationship with role)
CREATE TABLE school_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Role within this school
    role school_role NOT NULL DEFAULT 'viewer',

    -- Primary school flag (for multi-school users)
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    -- SIS linking (for teacher roster matching)
    sis_staff_id TEXT,
    department TEXT,
    grade_levels INTEGER[],

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,

    UNIQUE(user_id, school_id)
);

CREATE INDEX idx_memberships_user ON school_memberships(user_id);
CREATE INDEX idx_memberships_school ON school_memberships(school_id);
CREATE INDEX idx_memberships_sis_staff ON school_memberships(school_id, sis_staff_id);

-- Dashboard Configurations
CREATE TABLE dashboard_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = school-wide

    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,

    -- Visibility
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,

    -- Layout configuration (grid system)
    layout_config JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- Widget configurations
    widget_configs JSONB NOT NULL DEFAULT '{}'::JSONB,

    -- Saved filters
    filters JSONB,

    -- Auto-refresh interval
    refresh_interval_seconds INTEGER,

    -- Extensible metadata
    metadata JSONB,

    UNIQUE(school_id, slug)
);

CREATE INDEX idx_dashboards_school ON dashboard_configs(school_id);
CREATE INDEX idx_dashboards_user ON dashboard_configs(user_id);

-- Audit Logs (SOC2 compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    school_id UUID REFERENCES schools(id),
    user_id UUID REFERENCES users(id),

    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'export', 'login'
    resource_type TEXT NOT NULL, -- 'student', 'report', 'dashboard', etc.
    resource_id TEXT,

    -- Change tracking
    old_values JSONB,
    new_values JSONB,

    -- Request context
    ip_address INET,
    user_agent TEXT,

    -- Additional context
    metadata JSONB
);

-- Partitioned by month for performance
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_school ON audit_logs(school_id, created_at);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_action ON audit_logs(action, resource_type);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorizers ENABLE ROW LEVEL SECURITY;

-- Schools: Users can only see schools they're members of
CREATE POLICY "Users can view their schools"
    ON schools FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = schools.id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.is_active = TRUE
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.clerk_user_id = auth.uid()::TEXT
            AND u.platform_role IS NOT NULL
        )
    );

-- School memberships: Users can see memberships for their schools
CREATE POLICY "Users can view memberships for their schools"
    ON school_memberships FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships my_membership
            JOIN users u ON my_membership.user_id = u.id
            WHERE my_membership.school_id = school_memberships.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND my_membership.is_active = TRUE
        )
    );

-- Dashboard configs: Users can see their school's dashboards
CREATE POLICY "Users can view school dashboards"
    ON dashboard_configs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = dashboard_configs.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.is_active = TRUE
        )
    );

-- Dashboard configs: Users can only edit their own personal dashboards
CREATE POLICY "Users can edit their dashboards"
    ON dashboard_configs FOR UPDATE
    USING (
        user_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = dashboard_configs.user_id
            AND u.clerk_user_id = auth.uid()::TEXT
        )
    );

-- Audit logs: Only school admins and platform admins can view
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = audit_logs.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.role IN ('school_admin', 'principal')
            AND sm.is_active = TRUE
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.clerk_user_id = auth.uid()::TEXT
            AND u.platform_role = 'platform_admin'
        )
    );

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
    BEFORE UPDATE ON school_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
    BEFORE UPDATE ON dashboard_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authorizers_updated_at
    BEFORE UPDATE ON authorizers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SEED DATA (Development)
-- ==============================================

-- Insert demo authorizer
INSERT INTO authorizers (name, slug, contact_email)
VALUES ('State Department of Education', 'state-doe', 'charter-office@state.edu');

-- Insert demo schools
INSERT INTO schools (slug, name, contact_email, subscription_tier, subscription_status, authorizer_id)
VALUES
    ('academy-charter', 'Academy Charter School', 'admin@academycharter.edu', 'pro', 'active',
     (SELECT id FROM authorizers WHERE slug = 'state-doe')),
    ('innovation-prep', 'Innovation Prep Academy', 'admin@innovationprep.edu', 'starter', 'trialing',
     (SELECT id FROM authorizers WHERE slug = 'state-doe')),
    ('stem-scholars', 'STEM Scholars Charter', 'admin@stemscholars.edu', 'enterprise', 'active',
     (SELECT id FROM authorizers WHERE slug = 'state-doe'));

-- Note: Users will be created via Clerk webhook when they first sign in
