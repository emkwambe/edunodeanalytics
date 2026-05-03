-- ==============================================
-- Fix Duplicate get_user_school_ids Function
-- ==============================================
-- ERROR 42725: function name "get_user_school_ids" is not unique
--
-- There are two overloaded versions:
-- 1. get_user_school_ids(UUID) - from migration 00006
-- 2. get_user_school_ids(TEXT) - from migration 00009
--
-- Since we're using Clerk (not Supabase Auth), auth.uid() returns NULL,
-- so the UUID version is not useful. We'll drop it and keep only the TEXT version.
-- ==============================================

-- ==============================================
-- STEP 1: Drop ALL policies that depend on the UUID function
-- Must be done BEFORE dropping the function
-- ==============================================

-- risk_model_configs policies
DROP POLICY IF EXISTS "risk_config_select" ON public.risk_model_configs;
DROP POLICY IF EXISTS "risk_config_insert" ON public.risk_model_configs;
DROP POLICY IF EXISTS "risk_config_update" ON public.risk_model_configs;

-- student_metrics policies
DROP POLICY IF EXISTS "student_metrics_select" ON public.student_metrics;

-- student_metric_history policies
DROP POLICY IF EXISTS "metric_history_select" ON public.student_metric_history;

-- risk_evaluations policies
DROP POLICY IF EXISTS "risk_eval_select" ON public.risk_evaluations;

-- risk_alerts policies
DROP POLICY IF EXISTS "risk_alerts_select" ON public.risk_alerts;
DROP POLICY IF EXISTS "risk_alerts_update" ON public.risk_alerts;

-- intervention_sessions policies
DROP POLICY IF EXISTS "sessions_select" ON public.intervention_sessions;
DROP POLICY IF EXISTS "sessions_insert" ON public.intervention_sessions;
DROP POLICY IF EXISTS "sessions_update" ON public.intervention_sessions;
DROP POLICY IF EXISTS "sessions_delete" ON public.intervention_sessions;

-- intervention_dosage_metrics policies
DROP POLICY IF EXISTS "dosage_metrics_select" ON public.intervention_dosage_metrics;
DROP POLICY IF EXISTS "dosage_metrics_insert" ON public.intervention_dosage_metrics;
DROP POLICY IF EXISTS "dosage_metrics_update" ON public.intervention_dosage_metrics;

-- ==============================================
-- STEP 2: Drop the UUID version of the function
-- ==============================================
DROP FUNCTION IF EXISTS public.get_user_school_ids(UUID);

-- ==============================================
-- STEP 3: Re-grant execute on the TEXT version (with explicit signature)
-- ==============================================
GRANT EXECUTE ON FUNCTION public.get_user_school_ids(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_school_access(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_platform_admin(TEXT) TO authenticated, anon;

-- ==============================================
-- STEP 4: Recreate policies using check_school_access (which works with Clerk)
-- ==============================================

-- risk_model_configs policies
CREATE POLICY "risk_config_select" ON public.risk_model_configs
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "risk_config_insert" ON public.risk_model_configs
    FOR INSERT WITH CHECK (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "risk_config_update" ON public.risk_model_configs
    FOR UPDATE USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- student_metrics policies
CREATE POLICY "student_metrics_select" ON public.student_metrics
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- student_metric_history policies
CREATE POLICY "metric_history_select" ON public.student_metric_history
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- risk_evaluations policies
CREATE POLICY "risk_eval_select" ON public.risk_evaluations
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- risk_alerts policies
CREATE POLICY "risk_alerts_select" ON public.risk_alerts
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "risk_alerts_update" ON public.risk_alerts
    FOR UPDATE USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- intervention_sessions policies
CREATE POLICY "sessions_select" ON public.intervention_sessions
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "sessions_insert" ON public.intervention_sessions
    FOR INSERT WITH CHECK (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "sessions_update" ON public.intervention_sessions
    FOR UPDATE USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "sessions_delete" ON public.intervention_sessions
    FOR DELETE USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

-- intervention_dosage_metrics policies
CREATE POLICY "dosage_metrics_select" ON public.intervention_dosage_metrics
    FOR SELECT USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "dosage_metrics_insert" ON public.intervention_dosage_metrics
    FOR INSERT WITH CHECK (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );

CREATE POLICY "dosage_metrics_update" ON public.intervention_dosage_metrics
    FOR UPDATE USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR auth.role() = 'service_role'
    );
