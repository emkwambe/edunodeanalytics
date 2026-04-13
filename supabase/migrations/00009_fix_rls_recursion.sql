-- ==============================================
-- Fix RLS Infinite Recursion Issue
-- ==============================================
-- The previous policies caused infinite recursion because:
-- 1. school_memberships policy referenced school_memberships
-- 2. schools policy referenced school_memberships which triggered its policy
--
-- Since we're using Clerk for authentication (not Supabase Auth),
-- auth.uid() returns NULL and these policies don't work as intended.
--
-- Solution: Use a security-definer function that bypasses RLS to check
-- membership, and simplify policies to avoid recursion.
-- ==============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their schools" ON schools;
DROP POLICY IF EXISTS "Users can view memberships for their schools" ON school_memberships;
DROP POLICY IF EXISTS "Users can view school dashboards" ON dashboard_configs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can edit their dashboards" ON dashboard_configs;

-- ==============================================
-- SECURITY DEFINER function to check membership
-- This function bypasses RLS to check if a Clerk user has access to a school
-- ==============================================

CREATE OR REPLACE FUNCTION check_school_access(p_school_id UUID, p_clerk_user_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user has an active membership to this school
    RETURN EXISTS (
        SELECT 1
        FROM school_memberships sm
        JOIN users u ON sm.user_id = u.id
        WHERE sm.school_id = p_school_id
        AND u.clerk_user_id = p_clerk_user_id
        AND sm.is_active = TRUE
    );
END;
$$;

CREATE OR REPLACE FUNCTION check_platform_admin(p_clerk_user_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user is a platform admin
    RETURN EXISTS (
        SELECT 1
        FROM users u
        WHERE u.clerk_user_id = p_clerk_user_id
        AND u.platform_role IS NOT NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION get_user_school_ids(p_clerk_user_id TEXT)
RETURNS SETOF UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT sm.school_id
    FROM school_memberships sm
    JOIN users u ON sm.user_id = u.id
    WHERE u.clerk_user_id = p_clerk_user_id
    AND sm.is_active = TRUE;
END;
$$;

-- ==============================================
-- Recreate policies using the helper functions
-- These avoid recursion by using SECURITY DEFINER functions
-- ==============================================

-- Schools: Users can only see schools they're members of
-- Note: auth.uid()::TEXT is used but may be NULL with Clerk
-- For server-side queries, we use service role which bypasses RLS
CREATE POLICY "Users can view their schools"
    ON schools FOR SELECT
    USING (
        -- Allow if user has membership (using security definer function)
        check_school_access(id, COALESCE(auth.uid()::TEXT, ''))
        OR
        -- Allow if user is platform admin
        check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
        OR
        -- Allow public read for active schools (needed for slug lookup during auth)
        is_active = TRUE
    );

-- School memberships: Users can see their own memberships
-- Avoid self-reference by checking user_id directly
CREATE POLICY "Users can view their own memberships"
    ON school_memberships FOR SELECT
    USING (
        -- User can see their own memberships
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = school_memberships.user_id
            AND u.clerk_user_id = COALESCE(auth.uid()::TEXT, '')
        )
        OR
        -- Platform admins can see all
        check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
    );

-- Dashboard configs: Users can see their school's dashboards
CREATE POLICY "Users can view school dashboards"
    ON dashboard_configs FOR SELECT
    USING (
        check_school_access(school_id, COALESCE(auth.uid()::TEXT, ''))
        OR
        check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
    );

-- Dashboard configs: Users can only edit their own personal dashboards
CREATE POLICY "Users can edit their dashboards"
    ON dashboard_configs FOR UPDATE
    USING (
        user_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = dashboard_configs.user_id
            AND u.clerk_user_id = COALESCE(auth.uid()::TEXT, '')
        )
    );

-- Audit logs: Only school admins and platform admins can view
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        -- School admin can view their school's logs
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = audit_logs.school_id
            AND u.clerk_user_id = COALESCE(auth.uid()::TEXT, '')
            AND sm.role IN ('school_admin', 'principal')
            AND sm.is_active = TRUE
        )
        OR
        -- Platform admin can view all
        check_platform_admin(COALESCE(auth.uid()::TEXT, ''))
    );

-- ==============================================
-- Grant execute permissions on helper functions
-- ==============================================
GRANT EXECUTE ON FUNCTION check_school_access TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_platform_admin TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_school_ids TO authenticated, anon;
