-- ==============================================
-- EduNode Analytics - Migration 00002
-- Students, Interventions, Data Sources, Notifications, Resource Progress
-- ==============================================

-- ==============================================
-- ENUMS
-- ==============================================

CREATE TYPE risk_level AS ENUM ('on_track', 'at_risk', 'critical');
CREATE TYPE intervention_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE intervention_type AS ENUM ('academic', 'attendance', 'behavior', 'sel', 'family_engagement');
CREATE TYPE data_source_type AS ENUM ('sis', 'lms', 'assessment', 'attendance', 'behavior');
CREATE TYPE data_source_provider AS ENUM ('clever', 'classlink', 'powerschool', 'canvas', 'google_classroom', 'nwea_map', 'iready', 'renaissance_star', 'custom');
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'completed', 'failed');
CREATE TYPE notification_type AS ENUM ('alert', 'insight', 'system', 'action');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE resource_category AS ENUM ('data_literacy', 'culture_change', 'implementation');

-- ==============================================
-- STUDENTS TABLE
-- ==============================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- School relationship (tenant isolation)
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Identity
    sis_student_id TEXT NOT NULL, -- External ID from SIS
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT NOT NULL,

    -- Demographics
    grade_level INTEGER NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    ethnicity TEXT,

    -- Program flags
    has_iep BOOLEAN NOT NULL DEFAULT FALSE,
    has_504_plan BOOLEAN NOT NULL DEFAULT FALSE,
    is_english_learner BOOLEAN NOT NULL DEFAULT FALSE,
    is_gifted BOOLEAN NOT NULL DEFAULT FALSE,
    is_free_reduced_lunch BOOLEAN NOT NULL DEFAULT FALSE,

    -- Assignment
    homeroom_teacher TEXT,
    counselor TEXT,

    -- Attendance metrics (cached from data pipeline)
    attendance_rate NUMERIC(5,2),
    days_present INTEGER DEFAULT 0,
    days_absent INTEGER DEFAULT 0,
    is_chronically_absent BOOLEAN DEFAULT FALSE,

    -- Academic metrics (cached)
    proficiency_level NUMERIC(5,2),
    growth_percentile INTEGER,

    -- Risk scoring (computed by analytics engine)
    risk_level risk_level DEFAULT 'on_track',
    risk_score NUMERIC(5,2) DEFAULT 0,
    risk_factors JSONB, -- Array of risk factor strings

    -- Assessment data (cached snapshots)
    reading_scores JSONB,  -- {fallRit, winterRit, springRit, growthPoints, growthPercentile}
    math_scores JSONB,

    -- Purpose-driven metrics
    purpose_driven_metrics JSONB,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    enrolled_at DATE,
    withdrawn_at DATE,

    -- Extensible metadata
    metadata JSONB,

    -- Unique constraint on school + SIS ID
    UNIQUE(school_id, sis_student_id)
);

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_grade ON students(school_id, grade_level);
CREATE INDEX idx_students_risk ON students(school_id, risk_level);
CREATE INDEX idx_students_teacher ON students(school_id, homeroom_teacher);
CREATE INDEX idx_students_name ON students(school_id, last_name, first_name);
CREATE INDEX idx_students_sis_id ON students(school_id, sis_student_id);

-- ==============================================
-- INTERVENTIONS TABLE
-- ==============================================

CREATE TABLE interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Relationships
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(id),
    assigned_to_user_id UUID REFERENCES users(id),

    -- Intervention details
    type intervention_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,

    -- Status tracking
    status intervention_status NOT NULL DEFAULT 'planned',
    priority notification_priority NOT NULL DEFAULT 'medium',

    -- Timeline
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,

    -- Goals and outcomes
    goal TEXT,
    success_criteria TEXT,
    baseline_value NUMERIC,
    target_value NUMERIC,
    current_value NUMERIC,

    -- Progress tracking
    progress_notes JSONB, -- Array of {date, note, updatedBy}

    -- Outcome
    outcome_summary TEXT,
    was_successful BOOLEAN,

    -- Extensible metadata
    metadata JSONB
);

CREATE INDEX idx_interventions_school ON interventions(school_id);
CREATE INDEX idx_interventions_student ON interventions(student_id);
CREATE INDEX idx_interventions_status ON interventions(school_id, status);
CREATE INDEX idx_interventions_assigned ON interventions(assigned_to_user_id);
CREATE INDEX idx_interventions_type ON interventions(school_id, type);

-- ==============================================
-- DATA SOURCES TABLE
-- ==============================================

CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- School relationship
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Source identification
    name TEXT NOT NULL,
    type data_source_type NOT NULL,
    provider data_source_provider NOT NULL,

    -- Connection details (encrypted in production)
    connection_config JSONB, -- OAuth tokens, API keys, SFTP credentials

    -- Sync configuration
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sync_frequency_hours INTEGER DEFAULT 24,
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    sync_status sync_status DEFAULT 'pending',
    sync_error TEXT,

    -- Data mapping
    field_mappings JSONB, -- How external fields map to our schema

    -- Statistics
    records_synced INTEGER DEFAULT 0,
    last_record_count INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    connected_at TIMESTAMPTZ,
    disconnected_at TIMESTAMPTZ,

    -- Extensible metadata
    metadata JSONB,

    UNIQUE(school_id, provider)
);

CREATE INDEX idx_data_sources_school ON data_sources(school_id);
CREATE INDEX idx_data_sources_provider ON data_sources(school_id, provider);
CREATE INDEX idx_data_sources_sync ON data_sources(sync_status, next_sync_at);

-- ==============================================
-- NOTIFICATIONS TABLE
-- ==============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Recipients
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification content
    type notification_type NOT NULL,
    priority notification_priority NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Action link
    action_url TEXT,
    action_label TEXT,

    -- Related entities
    related_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    related_intervention_id UUID REFERENCES interventions(id) ON DELETE SET NULL,

    -- Status
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,

    -- Expiration
    expires_at TIMESTAMPTZ,

    -- Extensible metadata
    metadata JSONB
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_school ON notifications(school_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ==============================================
-- RESOURCE PROGRESS TABLE
-- ==============================================

CREATE TABLE resource_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- User relationship
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Module tracking
    module_slug TEXT NOT NULL,
    module_category resource_category NOT NULL,

    -- Progress
    is_started BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,

    -- Section progress
    sections_completed INTEGER DEFAULT 0,
    total_sections INTEGER NOT NULL,
    current_section INTEGER DEFAULT 0,

    -- Time tracking
    time_spent_minutes INTEGER DEFAULT 0,

    -- Bookmarking
    is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
    bookmarked_at TIMESTAMPTZ,

    -- Notes
    user_notes TEXT,

    -- Extensible metadata
    metadata JSONB,

    UNIQUE(user_id, module_slug)
);

CREATE INDEX idx_resource_progress_user ON resource_progress(user_id);
CREATE INDEX idx_resource_progress_module ON resource_progress(module_slug);
CREATE INDEX idx_resource_progress_bookmarked ON resource_progress(user_id, is_bookmarked) WHERE is_bookmarked = TRUE;
CREATE INDEX idx_resource_progress_completed ON resource_progress(user_id, is_completed);

-- ==============================================
-- USER PREFERENCES TABLE (expansion)
-- ==============================================

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- Notification preferences
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    digest_frequency TEXT DEFAULT 'daily', -- 'realtime', 'daily', 'weekly', 'none'

    -- Alert preferences by type
    alert_critical_students BOOLEAN NOT NULL DEFAULT TRUE,
    alert_attendance_drops BOOLEAN NOT NULL DEFAULT TRUE,
    alert_assessment_results BOOLEAN NOT NULL DEFAULT TRUE,
    alert_intervention_updates BOOLEAN NOT NULL DEFAULT TRUE,
    alert_system_updates BOOLEAN NOT NULL DEFAULT TRUE,

    -- Display preferences
    theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
    compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
    show_student_photos BOOLEAN NOT NULL DEFAULT TRUE,
    default_dashboard TEXT,

    -- Data display
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    number_format TEXT DEFAULT 'en-US',

    -- Accessibility
    reduce_motion BOOLEAN NOT NULL DEFAULT FALSE,
    high_contrast BOOLEAN NOT NULL DEFAULT FALSE,

    -- Privacy
    share_usage_data BOOLEAN NOT NULL DEFAULT TRUE,

    -- Extensible
    custom_preferences JSONB
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Students: Users can view students in their schools
CREATE POLICY "Users can view students in their schools"
    ON students FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = students.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.is_active = TRUE
        )
    );

-- Students: Only admins/data_managers can insert/update
CREATE POLICY "Admins can manage students"
    ON students FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = students.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.role IN ('school_admin', 'principal', 'data_manager')
            AND sm.is_active = TRUE
        )
    );

-- Interventions: Users can view interventions in their schools
CREATE POLICY "Users can view interventions in their schools"
    ON interventions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = interventions.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.is_active = TRUE
        )
    );

-- Interventions: Users can create/update interventions they created or are assigned to
CREATE POLICY "Users can manage their interventions"
    ON interventions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.clerk_user_id = auth.uid()::TEXT
            AND (u.id = interventions.created_by_user_id OR u.id = interventions.assigned_to_user_id)
        )
        OR
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = interventions.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.role IN ('school_admin', 'principal', 'counselor')
            AND sm.is_active = TRUE
        )
    );

-- Data sources: Only admins can view/manage
CREATE POLICY "Admins can view data sources"
    ON data_sources FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = data_sources.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.role IN ('school_admin', 'data_manager')
            AND sm.is_active = TRUE
        )
    );

CREATE POLICY "Admins can manage data sources"
    ON data_sources FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = data_sources.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.role IN ('school_admin', 'data_manager')
            AND sm.is_active = TRUE
        )
    );

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view their notifications"
    ON notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = notifications.user_id
            AND u.clerk_user_id = auth.uid()::TEXT
        )
    );

CREATE POLICY "Users can update their notifications"
    ON notifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = notifications.user_id
            AND u.clerk_user_id = auth.uid()::TEXT
        )
    );

-- Resource progress: Users can only see/manage their own progress
CREATE POLICY "Users can view their resource progress"
    ON resource_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = resource_progress.user_id
            AND u.clerk_user_id = auth.uid()::TEXT
        )
    );

CREATE POLICY "Users can manage their resource progress"
    ON resource_progress FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = resource_progress.user_id
            AND u.clerk_user_id = auth.uid()::TEXT
        )
    );

-- User preferences: Users can only see/manage their own preferences
CREATE POLICY "Users can view their preferences"
    ON user_preferences FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = user_preferences.user_id
            AND u.clerk_user_id = auth.uid()::TEXT
        )
    );

CREATE POLICY "Users can manage their preferences"
    ON user_preferences FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = user_preferences.user_id
            AND u.clerk_user_id = auth.uid()::TEXT
        )
    );

-- ==============================================
-- TRIGGERS
-- ==============================================

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interventions_updated_at
    BEFORE UPDATE ON interventions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at
    BEFORE UPDATE ON data_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_progress_updated_at
    BEFORE UPDATE ON resource_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Calculate student risk score based on multiple factors
CREATE OR REPLACE FUNCTION calculate_student_risk_score(
    p_attendance_rate NUMERIC,
    p_is_chronically_absent BOOLEAN,
    p_proficiency_level NUMERIC,
    p_growth_percentile INTEGER,
    p_has_iep BOOLEAN,
    p_is_english_learner BOOLEAN
) RETURNS TABLE(risk_score NUMERIC, risk_level risk_level, risk_factors TEXT[]) AS $$
DECLARE
    v_score NUMERIC := 0;
    v_factors TEXT[] := '{}';
BEGIN
    -- Attendance factors (0-30 points)
    IF p_attendance_rate < 90 THEN
        v_score := v_score + (90 - p_attendance_rate) * 0.5;
        v_factors := array_append(v_factors, 'Low attendance rate');
    END IF;
    IF p_is_chronically_absent THEN
        v_score := v_score + 15;
        v_factors := array_append(v_factors, 'Chronically absent');
    END IF;

    -- Academic factors (0-40 points)
    IF p_proficiency_level < 50 THEN
        v_score := v_score + (50 - p_proficiency_level) * 0.5;
        v_factors := array_append(v_factors, 'Below proficiency');
    END IF;
    IF p_growth_percentile < 25 THEN
        v_score := v_score + 15;
        v_factors := array_append(v_factors, 'Low growth trajectory');
    END IF;

    -- Support needs (0-10 points, informational)
    IF p_has_iep THEN
        v_factors := array_append(v_factors, 'Has IEP');
    END IF;
    IF p_is_english_learner THEN
        v_factors := array_append(v_factors, 'English learner');
    END IF;

    -- Determine risk level
    IF v_score >= 50 THEN
        RETURN QUERY SELECT v_score, 'critical'::risk_level, v_factors;
    ELSIF v_score >= 25 THEN
        RETURN QUERY SELECT v_score, 'at_risk'::risk_level, v_factors;
    ELSE
        RETURN QUERY SELECT v_score, 'on_track'::risk_level, v_factors;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE user_id = p_user_id
        AND is_read = FALSE
        AND is_dismissed = FALSE
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;
