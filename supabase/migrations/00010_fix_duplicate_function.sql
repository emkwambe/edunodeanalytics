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

-- Drop the UUID version of the function
DROP FUNCTION IF EXISTS public.get_user_school_ids(UUID);

-- Re-grant execute on the TEXT version (with explicit signature)
GRANT EXECUTE ON FUNCTION public.get_user_school_ids(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_school_access(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_platform_admin(TEXT) TO authenticated, anon;

-- ==============================================
-- Update RLS policies that used the UUID version
-- These policies from 00006 used: get_user_school_ids(auth.uid())
-- Since auth.uid() is NULL with Clerk, they don't work anyway.
-- We'll drop and recreate them to use check_school_access instead.
-- ==============================================

-- Drop old policies that referenced the UUID function
DROP POLICY IF EXISTS "risk_config_select" ON public.risk_model_configs;
DROP POLICY IF EXISTS "risk_config_insert" ON public.risk_model_configs;
DROP POLICY IF EXISTS "risk_config_update" ON public.risk_model_configs;
DROP POLICY IF EXISTS "student_metrics_select" ON public.student_metrics;
DROP POLICY IF EXISTS "metric_history_select" ON public.student_metric_history;
DROP POLICY IF EXISTS "risk_eval_select" ON public.risk_evaluations;
DROP POLICY IF EXISTS "risk_alerts_select" ON public.risk_alerts;
DROP POLICY IF EXISTS "risk_alerts_update" ON public.risk_alerts;

-- Recreate policies using check_school_access (which works with Clerk)
-- Note: Service role policies remain unchanged as they bypass RLS

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
