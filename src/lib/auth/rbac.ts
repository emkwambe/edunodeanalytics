import { auth, currentUser } from '@clerk/nextjs';
import { headers } from 'next/headers';
import {
  type Permission,
  type UserRole,
  type UserContext,
  type SchoolMembership,
  type SubscriptionTier,
  ROLE_PERMISSIONS,
  TIER_FEATURES,
} from './types';
import { getSchoolBySlug } from '@/lib/db/queries/schools';

/**
 * EduNode RBAC Utilities
 *
 * Server-side authorization functions for role-based access control
 */

/**
 * Get the current user's context including school membership and permissions
 */
export async function getUserContext(): Promise<UserContext | null> {
  const { userId, sessionClaims } = auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  if (!user) {
    return null;
  }

  // Get tenant slug from headers (set by middleware)
  const headersList = headers();
  const currentTenantSlug = headersList.get('x-tenant-slug');
  const userRole = (sessionClaims?.role as UserRole) || 'viewer';

  // Parse school memberships from Clerk metadata
  const schoolMemberships: SchoolMembership[] = [];
  const userSchools = (sessionClaims?.schools as string[]) || [];

  // In production, this would fetch from Supabase
  // For now, construct from session claims
  for (const slug of userSchools) {
    schoolMemberships.push({
      schoolId: slug, // Would be actual UUID from DB
      schoolSlug: slug,
      schoolName: slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      role: userRole as any,
      isPrimary: slug === sessionClaims?.primarySchool,
    });
  }

  const currentSchool = currentTenantSlug
    ? schoolMemberships.find((s) => s.schoolSlug === currentTenantSlug) || null
    : null;

  return {
    userId,
    email: user.emailAddresses[0]?.emailAddress || '',
    role: userRole,
    schools: schoolMemberships,
    currentSchool,
    permissions: ROLE_PERMISSIONS[userRole] || [],
  };
}

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const context = await getUserContext();
  if (!context) return false;
  return context.permissions.includes(permission);
}

/**
 * Check if the current user has ANY of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const context = await getUserContext();
  if (!context) return false;
  return permissions.some((p) => context.permissions.includes(p));
}

/**
 * Check if the current user has ALL of the specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const context = await getUserContext();
  if (!context) return false;
  return permissions.every((p) => context.permissions.includes(p));
}

/**
 * Require a specific permission - throws if not authorized
 */
export async function requirePermission(permission: Permission): Promise<UserContext> {
  const context = await getUserContext();

  if (!context) {
    throw new AuthorizationError('Not authenticated', 401);
  }

  if (!context.permissions.includes(permission)) {
    throw new AuthorizationError(
      `Permission denied: ${permission} required`,
      403
    );
  }

  return context;
}

/**
 * Check if user can access a specific student's data
 * Implements Row-Level Security logic
 */
export async function canAccessStudent(
  studentId: string,
  teacherId?: string
): Promise<boolean> {
  const context = await getUserContext();
  if (!context) return false;

  // Platform admins, school admins, principals can see all students
  if (
    context.permissions.includes('students:view_all') ||
    context.role === 'platform_admin'
  ) {
    return true;
  }

  // Teachers can only see students in their roster
  if (context.role === 'teacher' && teacherId) {
    // In production, verify teacher-student relationship via BigQuery/Supabase
    return context.userId === teacherId;
  }

  return false;
}

/**
 * Check if a feature is available for the school's subscription tier
 */
export async function hasFeatureAccess(
  feature: string,
  schoolSlug: string
): Promise<boolean> {
  // In production, fetch school's subscription tier from Supabase
  const school = await getSchoolBySlug(schoolSlug);

  if (!school) return false;

  const tier = school.subscription_tier as SubscriptionTier;
  return TIER_FEATURES[tier]?.includes(feature) || false;
}

/**
 * Get the current tenant's school ID (for data queries)
 */
export function getCurrentTenantSlug(): string | null {
  const headersList = headers();
  return headersList.get('x-tenant-slug');
}

/**
 * Validate that the current user belongs to the specified school
 */
export async function validateSchoolAccess(schoolSlug: string): Promise<boolean> {
  const context = await getUserContext();
  if (!context) return false;

  // Platform admins can access any school
  if (context.role === 'platform_admin') return true;

  return context.schools.some((s) => s.schoolSlug === schoolSlug);
}

/**
 * Custom authorization error
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Higher-order function to wrap API routes with permission checks
 */
export function withPermission<T extends (...args: any[]) => Promise<any>>(
  permission: Permission,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    await requirePermission(permission);
    return handler(...args);
  }) as T;
}

/**
 * HOC for protecting server actions
 */
export function protectedAction<T extends (...args: any[]) => Promise<any>>(
  permission: Permission,
  action: T
): T {
  return (async (...args: Parameters<T>) => {
    const context = await requirePermission(permission);
    // Inject context as last argument
    return action(...args, context);
  }) as T;
}
