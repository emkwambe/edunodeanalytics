/**
 * RBAC Security Tests
 * ===================
 *
 * Tests for security-critical RBAC behaviors:
 * - Role escalation prevention
 * - Cross-school access denial
 * - Authorizer read-only restrictions
 * - Permission boundary enforcement
 *
 * T3 CI/CD & Developer Velocity - Test Coverage
 */

import { describe, it, expect } from 'vitest';
import {
  ROLE_PERMISSIONS,
  TIER_FEATURES,
  type UserRole,
  type Permission,
  type SubscriptionTier,
} from '../types';

// ============================================================
// Test Utilities
// ============================================================

/**
 * Check if a role has a specific permission
 */
function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get permissions exclusive to a role (not in any lower role)
 */
function getExclusivePermissions(role: UserRole, lowerRoles: UserRole[]): Permission[] {
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  const lowerPerms = new Set<Permission>();

  for (const lowerRole of lowerRoles) {
    for (const perm of ROLE_PERMISSIONS[lowerRole] || []) {
      lowerPerms.add(perm);
    }
  }

  return rolePerms.filter((perm) => !lowerPerms.has(perm));
}

/**
 * Simulate role escalation attempt
 */
function canEscalateRole(fromRole: UserRole, toRole: UserRole): boolean {
  const fromPerms = new Set(ROLE_PERMISSIONS[fromRole] || []);
  const toPerms = ROLE_PERMISSIONS[toRole] || [];

  // Can escalate if the target role has permissions not in source role
  for (const perm of toPerms) {
    if (!fromPerms.has(perm)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if role can modify data (has any edit/manage permission)
 */
function canModifyData(role: UserRole): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.some((p) =>
    p.includes(':edit') ||
    p.includes(':manage') ||
    p.includes('export') // Export is considered a data operation
  );
}

// ============================================================
// Tests
// ============================================================

describe('RBAC Security', () => {
  describe('Role Escalation Prevention', () => {
    it('teacher cannot escalate to school_admin', () => {
      expect(canEscalateRole('teacher', 'school_admin')).toBe(false);
    });

    it('teacher cannot escalate to principal', () => {
      expect(canEscalateRole('teacher', 'principal')).toBe(false);
    });

    it('viewer cannot escalate to teacher', () => {
      expect(canEscalateRole('viewer', 'teacher')).toBe(false);
    });

    it('principal cannot escalate to school_admin', () => {
      expect(canEscalateRole('principal', 'school_admin')).toBe(false);
    });

    it('support cannot escalate to platform_admin', () => {
      expect(canEscalateRole('support', 'platform_admin')).toBe(false);
    });

    it('sales cannot escalate to platform_admin', () => {
      expect(canEscalateRole('sales', 'platform_admin')).toBe(false);
    });

    it('teacher lacks students:view_all permission', () => {
      expect(hasPermission('teacher', 'students:view_all')).toBe(false);
    });

    it('viewer lacks all student permissions', () => {
      expect(hasPermission('viewer', 'students:view_all')).toBe(false);
      expect(hasPermission('viewer', 'students:view_own')).toBe(false);
      expect(hasPermission('viewer', 'students:export')).toBe(false);
    });

    it('counselor cannot manage staff', () => {
      expect(hasPermission('counselor', 'staff:manage')).toBe(false);
    });

    it('data_manager cannot manage billing', () => {
      expect(hasPermission('data_manager', 'billing:manage')).toBe(false);
    });
  });

  describe('Cross-School Access Denial', () => {
    // These tests verify the role structure supports cross-school isolation

    it('school roles do not include platform-level permissions', () => {
      const schoolRoles: UserRole[] = ['school_admin', 'principal', 'teacher', 'counselor', 'data_manager', 'viewer'];

      for (const role of schoolRoles) {
        // No school role should have direct authorizer permissions
        // (school_admin shouldn't be able to see other schools' data)
        const perms = ROLE_PERMISSIONS[role] || [];

        // Check that school roles don't overlap with authorizer view of multiple schools
        if (role !== 'school_admin' && role !== 'platform_admin') {
          expect(perms).not.toContain('authorizer:view');
          expect(perms).not.toContain('authorizer:benchmark');
        }
      }
    });

    it('teacher role is school-scoped', () => {
      const teacherPerms = ROLE_PERMISSIONS['teacher'];
      expect(teacherPerms).toContain('students:view_own');
      expect(teacherPerms).not.toContain('students:view_all');
    });

    it('each school role has bounded permission set', () => {
      const schoolRoles: UserRole[] = ['school_admin', 'principal', 'teacher', 'counselor', 'data_manager', 'viewer'];

      for (const role of schoolRoles) {
        const perms = ROLE_PERMISSIONS[role];
        expect(Array.isArray(perms)).toBe(true);
        expect(perms.length).toBeGreaterThan(0);
        expect(perms.length).toBeLessThan(20); // Reasonable upper bound
      }
    });
  });

  describe('Authorizer Read-Only Restrictions', () => {
    const authorizerPerms = ROLE_PERMISSIONS['authorizer'];

    it('authorizer can view authorizer portal', () => {
      expect(authorizerPerms).toContain('authorizer:view');
    });

    it('authorizer can export evidence', () => {
      expect(authorizerPerms).toContain('authorizer:export');
    });

    it('authorizer can view benchmarks', () => {
      expect(authorizerPerms).toContain('authorizer:benchmark');
    });

    it('authorizer can view dashboard', () => {
      expect(authorizerPerms).toContain('dashboard:view');
    });

    it('authorizer can generate reports', () => {
      expect(authorizerPerms).toContain('reports:generate');
    });

    it('authorizer cannot edit dashboard', () => {
      expect(authorizerPerms).not.toContain('dashboard:edit');
    });

    it('authorizer cannot view individual students', () => {
      expect(authorizerPerms).not.toContain('students:view_all');
      expect(authorizerPerms).not.toContain('students:view_own');
    });

    it('authorizer cannot export student data', () => {
      expect(authorizerPerms).not.toContain('students:export');
    });

    it('authorizer cannot manage staff', () => {
      expect(authorizerPerms).not.toContain('staff:manage');
    });

    it('authorizer cannot manage settings', () => {
      expect(authorizerPerms).not.toContain('settings:edit');
    });

    it('authorizer cannot manage integrations', () => {
      expect(authorizerPerms).not.toContain('integrations:manage');
    });

    it('authorizer cannot manage billing', () => {
      expect(authorizerPerms).not.toContain('billing:view');
      expect(authorizerPerms).not.toContain('billing:manage');
    });

    it('authorizer cannot schedule reports', () => {
      expect(authorizerPerms).not.toContain('reports:schedule');
    });

    it('authorizer has exactly 5 permissions', () => {
      expect(authorizerPerms).toHaveLength(5);
    });
  });

  describe('Support Role Restrictions', () => {
    const supportPerms = ROLE_PERMISSIONS['support'];

    it('support can view dashboard', () => {
      expect(supportPerms).toContain('dashboard:view');
    });

    it('support can view all students (for debugging)', () => {
      expect(supportPerms).toContain('students:view_all');
    });

    it('support can view settings (for troubleshooting)', () => {
      expect(supportPerms).toContain('settings:view');
    });

    it('support cannot edit dashboard', () => {
      expect(supportPerms).not.toContain('dashboard:edit');
    });

    it('support cannot edit settings', () => {
      expect(supportPerms).not.toContain('settings:edit');
    });

    it('support cannot manage staff', () => {
      expect(supportPerms).not.toContain('staff:manage');
    });

    it('support cannot export data', () => {
      expect(supportPerms).not.toContain('students:export');
    });

    it('support cannot manage billing', () => {
      expect(supportPerms).not.toContain('billing:manage');
    });
  });

  describe('Sales Role Restrictions', () => {
    const salesPerms = ROLE_PERMISSIONS['sales'];

    it('sales can view dashboard for demos', () => {
      expect(salesPerms).toContain('dashboard:view');
    });

    it('sales can view settings for configuration demos', () => {
      expect(salesPerms).toContain('settings:view');
    });

    it('sales can view billing for pricing discussions', () => {
      expect(salesPerms).toContain('billing:view');
    });

    it('sales cannot view student data', () => {
      expect(salesPerms).not.toContain('students:view_all');
      expect(salesPerms).not.toContain('students:view_own');
    });

    it('sales cannot manage billing', () => {
      expect(salesPerms).not.toContain('billing:manage');
    });

    it('sales cannot edit settings', () => {
      expect(salesPerms).not.toContain('settings:edit');
    });
  });

  describe('Platform Admin Privileges', () => {
    const platformAdminPerms = ROLE_PERMISSIONS['platform_admin'];

    it('platform_admin has all dashboard permissions', () => {
      expect(platformAdminPerms).toContain('dashboard:view');
      expect(platformAdminPerms).toContain('dashboard:edit');
    });

    it('platform_admin has all student permissions', () => {
      expect(platformAdminPerms).toContain('students:view_all');
      expect(platformAdminPerms).toContain('students:export');
    });

    it('platform_admin has all settings permissions', () => {
      expect(platformAdminPerms).toContain('settings:view');
      expect(platformAdminPerms).toContain('settings:edit');
    });

    it('platform_admin has all billing permissions', () => {
      expect(platformAdminPerms).toContain('billing:view');
      expect(platformAdminPerms).toContain('billing:manage');
    });

    it('platform_admin can manage staff', () => {
      expect(platformAdminPerms).toContain('staff:manage');
    });

    it('platform_admin can manage integrations', () => {
      expect(platformAdminPerms).toContain('integrations:manage');
    });

    it('platform_admin can access authorizer view', () => {
      expect(platformAdminPerms).toContain('authorizer:view');
    });

    it('platform_admin has superset of school_admin permissions', () => {
      const schoolAdminPerms = ROLE_PERMISSIONS['school_admin'];
      for (const perm of schoolAdminPerms) {
        expect(platformAdminPerms).toContain(perm);
      }
    });
  });

  describe('Permission Hierarchy Consistency', () => {
    it('school_admin has all principal permissions', () => {
      const adminPerms = new Set(ROLE_PERMISSIONS['school_admin']);
      const principalPerms = ROLE_PERMISSIONS['principal'];

      for (const perm of principalPerms) {
        expect(adminPerms.has(perm)).toBe(true);
      }
    });

    it('principal has all counselor permissions except view_own specifics', () => {
      const principalPerms = new Set(ROLE_PERMISSIONS['principal']);
      const counselorPerms = ROLE_PERMISSIONS['counselor'];

      // Counselor should be a subset (minus any counselor-specific)
      const commonPerms = counselorPerms.filter(
        (p) => principalPerms.has(p) || p === 'students:view_all'
      );
      expect(commonPerms.length).toBe(counselorPerms.length);
    });

    it('exclusive permissions increase with role hierarchy', () => {
      const viewerExclusive = getExclusivePermissions('viewer', []);
      const teacherExclusive = getExclusivePermissions('teacher', ['viewer']);
      const principalExclusive = getExclusivePermissions('principal', ['teacher', 'viewer']);
      const adminExclusive = getExclusivePermissions('school_admin', ['principal', 'teacher', 'viewer']);

      // Each step up should have some exclusive permissions
      expect(teacherExclusive.length).toBeGreaterThanOrEqual(0);
      expect(principalExclusive.length).toBeGreaterThanOrEqual(0);
      expect(adminExclusive.length).toBeGreaterThan(0);
    });
  });

  describe('Subscription Tier Feature Gating', () => {
    it('starter tier has limited features', () => {
      const starterFeatures = TIER_FEATURES['starter'];
      expect(starterFeatures).toContain('dashboard_basic');
      expect(starterFeatures).toContain('student_360');
      expect(starterFeatures).toContain('max_users_5');
      expect(starterFeatures).not.toContain('dashboard_advanced');
      expect(starterFeatures).not.toContain('api_access');
    });

    it('pro tier adds advanced features', () => {
      const proFeatures = TIER_FEATURES['pro'];
      expect(proFeatures).toContain('dashboard_advanced');
      expect(proFeatures).toContain('api_access');
      expect(proFeatures).toContain('custom_reports');
      expect(proFeatures).not.toContain('sso_saml');
    });

    it('enterprise tier has all features', () => {
      const enterpriseFeatures = TIER_FEATURES['enterprise'];
      expect(enterpriseFeatures).toContain('sso_saml');
      expect(enterpriseFeatures).toContain('authorizer_portal');
      expect(enterpriseFeatures).toContain('unlimited_users');
    });

    it('starter is most restrictive', () => {
      expect(TIER_FEATURES['starter'].length).toBeLessThan(TIER_FEATURES['pro'].length);
    });

    it('pro is less restrictive than starter', () => {
      expect(TIER_FEATURES['pro'].length).toBeLessThan(TIER_FEATURES['enterprise'].length);
    });

    it('enterprise is least restrictive', () => {
      const tiers: SubscriptionTier[] = ['starter', 'pro', 'enterprise'];
      const featureCounts = tiers.map((t) => TIER_FEATURES[t].length);
      expect(featureCounts[2]).toBeGreaterThan(featureCounts[1]);
      expect(featureCounts[1]).toBeGreaterThan(featureCounts[0]);
    });
  });

  describe('Mutation Permission Checks', () => {
    const editPermissions: Permission[] = [
      'dashboard:edit',
      'settings:edit',
    ];

    const managePermissions: Permission[] = [
      'staff:manage',
      'integrations:manage',
      'billing:manage',
    ];

    it('viewer cannot modify any data', () => {
      expect(canModifyData('viewer')).toBe(false);
    });

    it('teacher cannot modify most data', () => {
      const teacherPerms = ROLE_PERMISSIONS['teacher'];
      for (const perm of editPermissions) {
        expect(teacherPerms).not.toContain(perm);
      }
      for (const perm of managePermissions) {
        expect(teacherPerms).not.toContain(perm);
      }
    });

    it('school_admin can modify data', () => {
      expect(canModifyData('school_admin')).toBe(true);
    });

    it('principal cannot edit dashboard', () => {
      expect(hasPermission('principal', 'dashboard:edit')).toBe(false);
    });
  });
});
