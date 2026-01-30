/**
 * EduNode RBAC Types
 *
 * Role-Based Access Control definitions for multi-tenant authorization
 */

// User roles within a school tenant
export type SchoolRole =
  | 'school_admin'    // Full access to school data and settings
  | 'principal'       // Read all + limited settings
  | 'teacher'         // Read own students only (RLS enforced)
  | 'counselor'       // Read student SEL/behavior data
  | 'data_manager'    // Read all + data export
  | 'viewer';         // Read-only dashboard access

// Platform-level roles (EduNode staff)
export type PlatformRole =
  | 'platform_admin'  // Full system access
  | 'support'         // Read-only for support tickets
  | 'sales';          // Demo/trial management

// Combined role type
export type UserRole = SchoolRole | PlatformRole;

// Permission actions
export type Permission =
  | 'dashboard:view'
  | 'dashboard:edit'
  | 'students:view_all'
  | 'students:view_own'
  | 'students:export'
  | 'staff:manage'
  | 'settings:view'
  | 'settings:edit'
  | 'integrations:manage'
  | 'billing:view'
  | 'billing:manage'
  | 'reports:generate'
  | 'reports:schedule'
  | 'authorizer:view'; // Read-only access for charter authorizers

// Role-permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // School roles
  school_admin: [
    'dashboard:view',
    'dashboard:edit',
    'students:view_all',
    'students:export',
    'staff:manage',
    'settings:view',
    'settings:edit',
    'integrations:manage',
    'billing:view',
    'billing:manage',
    'reports:generate',
    'reports:schedule',
  ],
  principal: [
    'dashboard:view',
    'students:view_all',
    'students:export',
    'settings:view',
    'reports:generate',
    'reports:schedule',
  ],
  teacher: [
    'dashboard:view',
    'students:view_own',
    'reports:generate',
  ],
  counselor: [
    'dashboard:view',
    'students:view_all', // SEL/behavior focus
    'reports:generate',
  ],
  data_manager: [
    'dashboard:view',
    'students:view_all',
    'students:export',
    'reports:generate',
    'reports:schedule',
    'integrations:manage',
  ],
  viewer: [
    'dashboard:view',
  ],

  // Platform roles
  platform_admin: [
    'dashboard:view',
    'dashboard:edit',
    'students:view_all',
    'students:export',
    'staff:manage',
    'settings:view',
    'settings:edit',
    'integrations:manage',
    'billing:view',
    'billing:manage',
    'reports:generate',
    'reports:schedule',
    'authorizer:view',
  ],
  support: [
    'dashboard:view',
    'students:view_all',
    'settings:view',
  ],
  sales: [
    'dashboard:view',
    'settings:view',
    'billing:view',
  ],
};

// Subscription tiers with feature gating
export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';

export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  starter: [
    'dashboard_basic',
    'student_360',
    'attendance_tracking',
    'max_users_5',
  ],
  pro: [
    'dashboard_basic',
    'dashboard_advanced',
    'student_360',
    'attendance_tracking',
    'assessment_analytics',
    'benchmark_comparison',
    'custom_reports',
    'api_access',
    'max_users_25',
  ],
  enterprise: [
    'dashboard_basic',
    'dashboard_advanced',
    'student_360',
    'attendance_tracking',
    'assessment_analytics',
    'benchmark_comparison',
    'custom_reports',
    'api_access',
    'sso_saml',
    'authorizer_portal',
    'white_labeling',
    'dedicated_support',
    'unlimited_users',
  ],
};

// Session claims type (Clerk JWT)
export interface EduNodeSessionClaims {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  schools: string[]; // Array of school_slugs user can access
  primarySchool?: string;
  platformRole?: PlatformRole;
}

// User context for server components
export interface UserContext {
  userId: string;
  email: string;
  role: UserRole;
  schools: SchoolMembership[];
  currentSchool: SchoolMembership | null;
  permissions: Permission[];
}

export interface SchoolMembership {
  schoolId: string;
  schoolSlug: string;
  schoolName: string;
  role: SchoolRole;
  isPrimary: boolean;
}
