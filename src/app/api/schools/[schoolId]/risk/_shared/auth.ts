// src/app/api/schools/[schoolId]/risk/_shared/auth.ts
/**
 * Shared auth helper for risk API routes.
 * Validates schoolId, checks Clerk auth, verifies school membership.
 *
 * Pattern matches:
 *   - /api/data/warehouse (Clerk auth() inline)
 *   - /api/schools/[schoolId]/students/at-risk (RouteParams type alias)
 *
 * Enhanced with RBAC via school_memberships for FERPA-sensitive MTSS data.
 */

import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSchoolBySlug } from '@/lib/db/queries/schools';

/** Route params type alias — matches at-risk route pattern */
export interface RiskRouteParams {
  params: Promise<{ schoolId: string }>;
}

export interface RiskAlertRouteParams {
  params: Promise<{ schoolId: string; alertId: string }>;
}

export interface RiskHistoryRouteParams {
  params: Promise<{ schoolId: string; studentId: string }>;
}

export interface AuthContext {
  userId: string;
  clerkUserId: string;
  schoolId: string;
  role: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>;
}

/**
 * Authenticate and authorize a request for a school's risk data.
 * Returns AuthContext on success, or a NextResponse error on failure.
 */
export async function authenticateSchoolRequest(
  params: { schoolId: string }
): Promise<AuthContext | NextResponse> {
  const { schoolId } = params;

  // 1. Resolve slug to UUID if needed, then validate format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let resolvedSchoolId = schoolId;
  if (!uuidRegex.test(schoolId)) {
    // Looks like a slug — try database lookup first (preferred), then seed data
    const school = await getSchoolBySlug(schoolId);
    if (school) {
      resolvedSchoolId = school.id;
    } else {
      // Fallback to seed data for demo schools
      const { getSchoolSeed } = await import('@/lib/data/seed-data');
      const seed = getSchoolSeed(schoolId);
      if (seed) {
        resolvedSchoolId = seed.id;
      } else {
        return NextResponse.json(
          { error: 'School not found' },
          { status: 404 }
        );
      }
    }
  }
  const { schoolId: _originalId, ..._ } = { schoolId, _: null };
  // Use resolvedSchoolId from here on
  Object.assign(params, { schoolId: resolvedSchoolId });
  // DEMO MODE: bypass Clerk auth and membership check
  if (process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    return {
      userId: 'demo-user',
      clerkUserId: 'demo-clerk-user',
      schoolId: resolvedSchoolId,
      role: 'admin',
      supabase,
      adminSupabase,
    };
  }

  // 2. Check Clerk auth (matches warehouse route pattern)
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 3. Resolve internal user ID from clerk_user_id
  const supabase = await createServerSupabaseClient();
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 401 }
    );
  }

  // 4. Check school membership (FERPA: only school members see MTSS data)
  const { data: membership } = await supabase
    .from('school_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('school_id', resolvedSchoolId)
    .eq('is_active', true)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: 'Not a member of this school' },
      { status: 403 }
    );
  }

  const adminSupabase = createAdminSupabaseClient();

  return {
    userId: user.id,
    clerkUserId,
    schoolId: resolvedSchoolId,
    role: membership.role,
    supabase,
    adminSupabase,
  };
}

/**
 * Check if user has admin/owner role for write operations.
 */
export function isAdmin(role: string): boolean {
  return ['admin', 'owner', 'super_admin'].includes(role);
}