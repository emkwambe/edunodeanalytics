import useSWR from 'swr';
import { fetcher } from './fetcher';
import type { SchoolRole, Permission } from '@/lib/auth/types';

/**
 * User Role Context Hook
 *
 * Fetches the current user's role and permissions for a specific school.
 * Used for role-based UI filtering (e.g., teacher vs coordinator views).
 */

export interface UserRoleContext {
  userId: string;
  email: string;
  role: SchoolRole;
  schoolId: string;
  permissions: Permission[];
  canViewAllStudents: boolean;
  canManageInterventions: boolean;
  canExportData: boolean;
  canEditSettings: boolean;
}

interface UserRoleResponse {
  data: UserRoleContext | null;
  error?: string;
}

export function useUserRole(schoolId: string | null) {
  const { data, error, isLoading } = useSWR<UserRoleResponse>(
    schoolId ? `/api/schools/${schoolId}/user/role` : null,
    fetcher
  );

  const roleContext = data?.data ?? null;

  // Derive permissions from role
  const canViewAllStudents = roleContext?.permissions?.includes('students:view_all') ?? false;
  const canViewOwnStudents = roleContext?.permissions?.includes('students:view_own') ?? false;
  const canManageInterventions = ['school_admin', 'principal', 'counselor'].includes(roleContext?.role ?? '');
  const canExportData = roleContext?.permissions?.includes('students:export') ?? false;
  const canEditSettings = roleContext?.permissions?.includes('settings:edit') ?? false;

  // Role-specific view modes
  const viewMode: 'full' | 'filtered' | 'minimal' = (() => {
    if (!roleContext) return 'minimal';
    if (canViewAllStudents) return 'full';
    if (canViewOwnStudents) return 'filtered';
    return 'minimal';
  })();

  return {
    role: roleContext?.role ?? null,
    userId: roleContext?.userId ?? null,
    permissions: roleContext?.permissions ?? [],
    canViewAllStudents,
    canViewOwnStudents,
    canManageInterventions,
    canExportData,
    canEditSettings,
    viewMode,
    error,
    isLoading,
  };
}

/**
 * Check if user is an MTSS coordinator or similar role
 * that should see the full early warning dashboard
 */
export function isMTSSCoordinator(role: SchoolRole | null): boolean {
  if (!role) return false;
  return ['school_admin', 'principal', 'counselor', 'data_manager'].includes(role);
}

/**
 * Check if user is a teacher with limited view
 */
export function isTeacherRole(role: SchoolRole | null): boolean {
  return role === 'teacher';
}

/**
 * Get role display name for UI
 */
export function getRoleDisplayName(role: SchoolRole | null): string {
  if (!role) return 'Unknown';
  const names: Record<SchoolRole, string> = {
    school_admin: 'School Admin',
    principal: 'Principal',
    teacher: 'Teacher',
    counselor: 'Counselor',
    data_manager: 'Data Manager',
    viewer: 'Viewer',
  };
  return names[role] ?? role;
}
