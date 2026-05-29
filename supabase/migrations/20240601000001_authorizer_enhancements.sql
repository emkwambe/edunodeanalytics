-- ==============================================
-- Authorizer Enhancements Migration
-- ==============================================
-- Adds infrastructure for:
-- 1. Historical metrics storage (YoY trends)
-- 2. Financial health tracking
-- 3. Compliance tracking
-- 4. Authorizer user management
-- 5. Board/governance tracking
-- ==============================================

-- ==============================================
-- 1. HISTORICAL METRICS STORAGE
-- ==============================================
-- Stores annual snapshots of school metrics for multi-year trend analysis
-- Required by authorizers for renewal (3-5 year trends)

CREATE TABLE IF NOT EXISTS school_metrics_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Time period
    metric_date DATE NOT NULL,
    school_year TEXT NOT NULL, -- e.g., '2023-24'
    snapshot_type TEXT NOT NULL DEFAULT 'annual', -- 'annual', 'quarterly', 'monthly'

    -- Academic Performance
    ela_proficiency DECIMAL(5,2),
    math_proficiency DECIMAL(5,2),
    science_proficiency DECIMAL(5,2),
    ela_growth_percentile DECIMAL(5,2),
    math_growth_percentile DECIMAL(5,2),

    -- High School Metrics
    graduation_rate_4yr DECIMAL(5,2),
    graduation_rate_5yr DECIMAL(5,2),
    college_enrollment_rate DECIMAL(5,2),
    college_persistence_rate DECIMAL(5,2),

    -- Attendance
    average_daily_attendance DECIMAL(5,2),
    chronic_absence_rate DECIMAL(5,2),

    -- Enrollment
    total_enrollment INT,
    projected_enrollment INT,
    enrollment_variance DECIMAL(5,2), -- (actual - projected) / projected

    -- Risk Distribution (snapshot)
    students_low_risk INT DEFAULT 0,
    students_medium_risk INT DEFAULT 0,
    students_high_risk INT DEFAULT 0,
    students_critical_risk INT DEFAULT 0,

    -- Subgroup Metrics (JSONB for flexibility)
    -- Structure: { "FRL": { "ela": 45.2, "math": 42.1 }, "ELL": {...}, "SPED": {...} }
    subgroup_proficiency JSONB DEFAULT '{}',
    subgroup_growth JSONB DEFAULT '{}',

    -- State Comparison
    state_ela_average DECIMAL(5,2),
    state_math_average DECIMAL(5,2),
    state_graduation_average DECIMAL(5,2),

    -- Metadata
    data_source TEXT, -- 'manual', 'import', 'calculated'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one record per school per period
    UNIQUE(school_id, school_year, snapshot_type)
);

CREATE INDEX idx_metrics_history_school ON school_metrics_history(school_id);
CREATE INDEX idx_metrics_history_year ON school_metrics_history(school_year);
CREATE INDEX idx_metrics_history_date ON school_metrics_history(metric_date);

-- ==============================================
-- 2. FINANCIAL HEALTH TRACKING
-- ==============================================
-- Tracks financial ratios required by authorizers
-- Based on NACSA Financial Performance Framework

CREATE TABLE IF NOT EXISTS school_financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Time period
    fiscal_year TEXT NOT NULL, -- e.g., '2023-24'
    report_type TEXT NOT NULL DEFAULT 'annual', -- 'annual', 'quarterly', 'interim'
    report_date DATE NOT NULL,
    period_end_date DATE, -- End of reporting period

    -- Near-Term Financial Health
    current_ratio DECIMAL(6,3), -- Current Assets / Current Liabilities (target: >= 1.0)
    days_cash_on_hand INT, -- Cash / (Annual Expenses / 365) (target: >= 60)

    -- Long-Term Financial Stability
    debt_to_asset_ratio DECIMAL(6,3), -- Total Liabilities / Total Assets (target: < 0.9)
    debt_service_coverage DECIMAL(6,3), -- Net Operating Income / Debt Service (target: >= 1.1)
    total_margin DECIMAL(6,3), -- (Revenue - Expenses) / Revenue

    -- Revenue & Expenses
    total_revenue DECIMAL(15,2),
    total_expenses DECIMAL(15,2),
    net_income DECIMAL(15,2),
    per_pupil_revenue DECIMAL(10,2),
    per_pupil_expenditure DECIMAL(10,2),

    -- Enrollment-Based
    actual_adm INT, -- Average Daily Membership
    projected_adm INT,
    adm_variance_percent DECIMAL(5,2),

    -- Fund Balance
    unrestricted_fund_balance DECIMAL(15,2),
    fund_balance_ratio DECIMAL(6,3), -- Fund Balance / Expenses

    -- Audit Information
    audit_status TEXT DEFAULT 'pending', -- 'pending', 'clean', 'qualified', 'adverse'
    audit_findings_count INT DEFAULT 0,
    audit_document_url TEXT,

    -- Metadata
    data_source TEXT DEFAULT 'manual', -- 'manual', 'quickbooks', 'sage', 'import'
    preparer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    UNIQUE(school_id, fiscal_year, report_type, report_date)
);

CREATE INDEX idx_financials_school ON school_financials(school_id);
CREATE INDEX idx_financials_year ON school_financials(fiscal_year);
CREATE INDEX idx_financials_date ON school_financials(report_date);

-- ==============================================
-- 3. COMPLIANCE TRACKING
-- ==============================================
-- Tracks compliance items required by authorizers

CREATE TYPE compliance_status AS ENUM ('compliant', 'non_compliant', 'pending', 'expired', 'not_applicable');
CREATE TYPE compliance_category AS ENUM (
    'financial_audit',
    'board_governance',
    'health_safety',
    'special_education',
    'ell_services',
    'teacher_certification',
    'background_checks',
    'facility',
    'ferpa_privacy',
    'civil_rights',
    'reporting',
    'other'
);

CREATE TABLE IF NOT EXISTS compliance_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Item Details
    category compliance_category NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT,

    -- Status
    status compliance_status NOT NULL DEFAULT 'pending',

    -- Dates
    due_date DATE,
    completed_date DATE,
    expiration_date DATE,
    next_review_date DATE,

    -- Documentation
    document_url TEXT,
    document_name TEXT,

    -- Responsibility
    assigned_to TEXT,
    reviewer TEXT,

    -- Notes & History
    notes TEXT,
    last_status_change TIMESTAMPTZ,

    -- Metadata
    is_recurring BOOLEAN DEFAULT false,
    recurrence_interval TEXT, -- 'annual', 'quarterly', 'monthly'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_compliance_school ON compliance_items(school_id);
CREATE INDEX idx_compliance_status ON compliance_items(status);
CREATE INDEX idx_compliance_category ON compliance_items(category);
CREATE INDEX idx_compliance_due_date ON compliance_items(due_date);

-- ==============================================
-- 4. AUTHORIZER USER MANAGEMENT
-- ==============================================
-- Links users to authorizers for portfolio access

CREATE TABLE IF NOT EXISTS authorizer_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    authorizer_id UUID NOT NULL REFERENCES authorizers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Role within authorizer org
    role TEXT NOT NULL DEFAULT 'viewer', -- 'admin', 'analyst', 'viewer'

    -- Access Control
    is_active BOOLEAN DEFAULT true,
    can_export BOOLEAN DEFAULT true,
    can_view_financials BOOLEAN DEFAULT true,

    -- Invitation tracking
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(authorizer_id, user_id)
);

CREATE INDEX idx_auth_membership_authorizer ON authorizer_memberships(authorizer_id);
CREATE INDEX idx_auth_membership_user ON authorizer_memberships(user_id);

-- ==============================================
-- 5. BOARD/GOVERNANCE TRACKING
-- ==============================================
-- Tracks board composition for governance compliance

CREATE TABLE IF NOT EXISTS board_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Member Info
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,

    -- Role & Term
    role TEXT NOT NULL DEFAULT 'member', -- 'chair', 'vice_chair', 'treasurer', 'secretary', 'member'
    committee_assignments TEXT[], -- Array of committee names

    -- Term Dates
    term_start DATE,
    term_end DATE,
    is_active BOOLEAN DEFAULT true,

    -- Compliance
    background_check_date DATE,
    background_check_clear BOOLEAN,
    financial_disclosure_date DATE,
    financial_disclosure_on_file BOOLEAN DEFAULT false,
    conflict_of_interest_date DATE,
    conflict_of_interest_on_file BOOLEAN DEFAULT false,
    training_completed_date DATE,

    -- Demographics (optional, for board diversity tracking)
    profession TEXT,
    expertise_areas TEXT[],

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_board_school ON board_members(school_id);
CREATE INDEX idx_board_active ON board_members(is_active);

-- ==============================================
-- 6. BOARD MEETINGS TRACKING
-- ==============================================

CREATE TABLE IF NOT EXISTS board_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Meeting Details
    meeting_date DATE NOT NULL,
    meeting_type TEXT DEFAULT 'regular', -- 'regular', 'special', 'annual', 'emergency'
    location TEXT,

    -- Attendance
    quorum_met BOOLEAN DEFAULT true,
    members_present INT,
    members_absent INT,

    -- Documentation
    agenda_url TEXT,
    minutes_url TEXT,
    minutes_approved BOOLEAN DEFAULT false,
    minutes_approved_date DATE,

    -- Key Actions (summary)
    key_actions TEXT[],
    resolutions_passed INT DEFAULT 0,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_school ON board_meetings(school_id);
CREATE INDEX idx_meetings_date ON board_meetings(meeting_date);

-- ==============================================
-- 7. AUTHORIZER ACCESS LOGS
-- ==============================================
-- Track authorizer access for audit purposes

CREATE TABLE IF NOT EXISTS authorizer_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    authorizer_id UUID NOT NULL REFERENCES authorizers(id),
    user_id UUID NOT NULL REFERENCES users(id),
    school_id UUID REFERENCES schools(id),

    -- Action
    action TEXT NOT NULL, -- 'view_dashboard', 'view_school', 'export_report', 'download_document'
    resource_type TEXT, -- 'school', 'report', 'document', 'financial'
    resource_id TEXT,

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Timestamp
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_access_authorizer ON authorizer_access_logs(authorizer_id);
CREATE INDEX idx_auth_access_user ON authorizer_access_logs(user_id);
CREATE INDEX idx_auth_access_date ON authorizer_access_logs(accessed_at);

-- Partition by month for performance (if table grows large)
-- Note: Implement partitioning when needed

-- ==============================================
-- 8. UPDATE AUTHORIZERS TABLE
-- ==============================================
-- Add additional fields to authorizers table

ALTER TABLE authorizers ADD COLUMN IF NOT EXISTS authorizer_type TEXT DEFAULT 'lea';
-- Types: 'lea' (Local Ed Agency), 'sea' (State Ed Agency), 'university', 'nonprofit', 'independent'

ALTER TABLE authorizers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE authorizers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE authorizers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE authorizers ADD COLUMN IF NOT EXISTS address TEXT;

-- Performance framework used
ALTER TABLE authorizers ADD COLUMN IF NOT EXISTS performance_framework TEXT DEFAULT 'nacsa';
-- Options: 'nacsa', 'dc_aspire', 'suny', 'icsb', 'california_ab1505', 'custom'

ALTER TABLE authorizers ADD COLUMN IF NOT EXISTS renewal_cycle_years INT DEFAULT 5;
ALTER TABLE authorizers ADD COLUMN IF NOT EXISTS schools_count INT DEFAULT 0;

-- ==============================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE school_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorizer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorizer_access_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is authorizer for a school
CREATE OR REPLACE FUNCTION is_authorizer_for_school(p_school_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM authorizer_memberships am
        JOIN schools s ON s.authorizer_id = am.authorizer_id
        WHERE s.id = p_school_id
        AND am.user_id = p_user_id
        AND am.is_active = TRUE
    );
END;
$$;

-- Helper function: Get user's authorizer ID
CREATE OR REPLACE FUNCTION get_user_authorizer_id(p_user_id UUID)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_authorizer_id UUID;
BEGIN
    SELECT am.authorizer_id INTO v_authorizer_id
    FROM authorizer_memberships am
    WHERE am.user_id = p_user_id
    AND am.is_active = TRUE
    LIMIT 1;

    RETURN v_authorizer_id;
END;
$$;

-- Metrics History: School staff + authorizers can view
CREATE POLICY "metrics_history_select" ON school_metrics_history
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR is_authorizer_for_school(school_id, auth.uid())
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "metrics_history_insert" ON school_metrics_history
    FOR INSERT WITH CHECK (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "metrics_history_update" ON school_metrics_history
    FOR UPDATE USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- Financials: School staff + authorizers (with permission) can view
CREATE POLICY "financials_select" ON school_financials
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR (
            is_authorizer_for_school(school_id, auth.uid())
            AND EXISTS (
                SELECT 1 FROM authorizer_memberships am
                WHERE am.user_id = auth.uid()
                AND am.can_view_financials = TRUE
            )
        )
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "financials_insert" ON school_financials
    FOR INSERT WITH CHECK (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "financials_update" ON school_financials
    FOR UPDATE USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- Compliance: School staff + authorizers can view
CREATE POLICY "compliance_select" ON compliance_items
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR is_authorizer_for_school(school_id, auth.uid())
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "compliance_insert" ON compliance_items
    FOR INSERT WITH CHECK (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "compliance_update" ON compliance_items
    FOR UPDATE USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- Authorizer Memberships: Users can see their own, admins can manage
CREATE POLICY "auth_membership_select" ON authorizer_memberships
    FOR SELECT USING (
        user_id = auth.uid()
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "auth_membership_manage" ON authorizer_memberships
    FOR ALL USING (
        check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- Board Members: School staff + authorizers can view
CREATE POLICY "board_members_select" ON board_members
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR is_authorizer_for_school(school_id, auth.uid())
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "board_members_manage" ON board_members
    FOR ALL USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- Board Meetings: School staff + authorizers can view
CREATE POLICY "board_meetings_select" ON board_meetings
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR is_authorizer_for_school(school_id, auth.uid())
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "board_meetings_manage" ON board_meetings
    FOR ALL USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- Access Logs: Authorizer admins + platform admins
CREATE POLICY "access_logs_select" ON authorizer_access_logs
    FOR SELECT USING (
        user_id = auth.uid()
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "access_logs_insert" ON authorizer_access_logs
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
        OR user_id = auth.uid()
    );

-- ==============================================
-- 10. GRANT PERMISSIONS
-- ==============================================

GRANT EXECUTE ON FUNCTION is_authorizer_for_school(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_authorizer_id(UUID) TO authenticated, anon;

-- ==============================================
-- 11. SEED DEFAULT COMPLIANCE ITEMS
-- ==============================================
-- Create a function to seed standard compliance items for a school

CREATE OR REPLACE FUNCTION seed_compliance_items(p_school_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Financial Audit
    INSERT INTO compliance_items (school_id, category, item_name, description, is_recurring, recurrence_interval)
    VALUES (p_school_id, 'financial_audit', 'Annual Financial Audit', 'Independent audit of financial statements', true, 'annual')
    ON CONFLICT DO NOTHING;

    -- Board Governance
    INSERT INTO compliance_items (school_id, category, item_name, description, is_recurring, recurrence_interval)
    VALUES
        (p_school_id, 'board_governance', 'Board Meeting Minutes', 'Monthly board meeting documentation', true, 'monthly'),
        (p_school_id, 'board_governance', 'Board Member Financial Disclosures', 'Annual trustee financial disclosure forms', true, 'annual'),
        (p_school_id, 'board_governance', 'Conflict of Interest Policy', 'Annual review and acknowledgment', true, 'annual')
    ON CONFLICT DO NOTHING;

    -- Health & Safety
    INSERT INTO compliance_items (school_id, category, item_name, description, is_recurring, recurrence_interval)
    VALUES
        (p_school_id, 'health_safety', 'Fire Safety Inspection', 'Annual fire marshal inspection', true, 'annual'),
        (p_school_id, 'health_safety', 'Health Inspection', 'Food service and facility health inspection', true, 'annual'),
        (p_school_id, 'health_safety', 'Emergency Drills Documentation', 'Fire, lockdown, and evacuation drills', true, 'monthly')
    ON CONFLICT DO NOTHING;

    -- Special Education
    INSERT INTO compliance_items (school_id, category, item_name, description, is_recurring, recurrence_interval)
    VALUES
        (p_school_id, 'special_education', 'IDEA Compliance', 'Special education program compliance', true, 'annual'),
        (p_school_id, 'special_education', 'Section 504 Compliance', '504 plan implementation', true, 'annual')
    ON CONFLICT DO NOTHING;

    -- Teacher Certification
    INSERT INTO compliance_items (school_id, category, item_name, description, is_recurring, recurrence_interval)
    VALUES (p_school_id, 'teacher_certification', 'Teacher Certification Verification', 'Verify all teacher credentials', true, 'annual')
    ON CONFLICT DO NOTHING;

    -- Background Checks
    INSERT INTO compliance_items (school_id, category, item_name, description, is_recurring, recurrence_interval)
    VALUES (p_school_id, 'background_checks', 'Employee Background Checks', 'Fingerprint-based background checks for all staff', true, 'annual')
    ON CONFLICT DO NOTHING;

    -- FERPA
    INSERT INTO compliance_items (school_id, category, item_name, description, is_recurring, recurrence_interval)
    VALUES (p_school_id, 'ferpa_privacy', 'FERPA Training', 'Annual staff training on student data privacy', true, 'annual')
    ON CONFLICT DO NOTHING;

    -- Reporting
    INSERT INTO compliance_items (school_id, category, item_name, description, is_recurring, recurrence_interval)
    VALUES
        (p_school_id, 'reporting', 'Annual Report to Authorizer', 'Submit annual performance report', true, 'annual'),
        (p_school_id, 'reporting', 'State Assessment Participation', 'Ensure all students participate in state assessments', true, 'annual')
    ON CONFLICT DO NOTHING;
END;
$$;

-- ==============================================
-- 12. TRIGGERS FOR UPDATED_AT
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_school_metrics_history_updated_at
    BEFORE UPDATE ON school_metrics_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_financials_updated_at
    BEFORE UPDATE ON school_financials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_items_updated_at
    BEFORE UPDATE ON compliance_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_members_updated_at
    BEFORE UPDATE ON board_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_meetings_updated_at
    BEFORE UPDATE ON board_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
