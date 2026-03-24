import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserContext } from '@/lib/auth/rbac';
import type { SchoolRole } from '@/lib/auth/types';

/**
 * GET /api/schools/[schoolId]/user/role
 *
 * Returns the current user's role and permissions for the specified school.
 * Used for role-based UI filtering.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { schoolId } = await params;

    // Get full user context
    const context = await getUserContext();
    if (!context) {
      return NextResponse.json(
        { error: 'User context not found' },
        { status: 404 }
      );
    }

    // Find the membership for this specific school
    const membership = context.schools.find(
      (s) => s.schoolId === schoolId || s.schoolSlug === schoolId
    );

    if (!membership) {
      return NextResponse.json(
        { error: 'User does not have access to this school' },
        { status: 403 }
      );
    }

    // Build response with role context
    const roleContext = {
      userId: context.userId,
      email: context.email,
      role: membership.role as SchoolRole,
      schoolId: membership.schoolId,
      permissions: context.permissions,
      canViewAllStudents: context.permissions.includes('students:view_all'),
      canManageInterventions: ['school_admin', 'principal', 'counselor'].includes(membership.role),
      canExportData: context.permissions.includes('students:export'),
      canEditSettings: context.permissions.includes('settings:edit'),
    };

    return NextResponse.json({ data: roleContext });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user role' },
      { status: 500 }
    );
  }
}
