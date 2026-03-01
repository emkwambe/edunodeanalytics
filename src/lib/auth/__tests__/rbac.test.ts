/**
 * RBAC Tests
 * ==========
 *
 * Tests for Role-Based Access Control types and permission mappings.
 */

import { describe, it, expect } from 'vitest';
import {
  ROLE_PERMISSIONS,
  TIER_FEATURES,
  type UserRole,
  type Permission,
  type SubscriptionTier,
} from '../types';
import { AuthorizationError } from '../rbac';

describe('ROLE_PERMISSIONS', () => {
  describe('school_admin role', () => {
    const permissions = ROLE_PERMISSIONS['school_admin'];

    it('has full dashboard access', () => {
      expect(permissions).toContain('dashboard:view');
      expect(permissions).toContain('dashboard:edit');
    });

    it('can view all students', () => {
      expect(permissions).toContain('students:view_all');
      expect(permissions).toContain('students:export');
    });

    it('can manage staff and settings', () => {
      expect(permissions).toContain('staff:manage');
      expect(permissions).toContain('settings:view');
      expect(permissions).toContain('settings:edit');
    });

    it('can manage integrations and billing', () => {
      expect(permissions).toContain('integrations:manage');
      expect(permissions).toContain('billing:view');
      expect(permissions).toContain('billing:manage');
    });

    it('can generate and schedule reports', () => {
      expect(permissions).toContain('reports:generate');
      expect(permissions).toContain('reports:schedule');
    });
  });

  describe('principal role', () => {
    const permissions = ROLE_PERMISSIONS['principal'];

    it('has read-only dashboard access', () => {
      expect(permissions).toContain('dashboard:view');
      expect(permissions).not.toContain('dashboard:edit');
    });

    it('can view all students and export', () => {
      expect(permissions).toContain('students:view_all');
      expect(permissions).toContain('students:export');
    });

    it('cannot manage staff or billing', () => {
      expect(permissions).not.toContain('staff:manage');
      expect(permissions).not.toContain('billing:manage');
    });

    it('can view settings but not edit', () => {
      expect(permissions).toContain('settings:view');
      expect(permissions).not.toContain('settings:edit');
    });
  });

  describe('teacher role', () => {
    const permissions = ROLE_PERMISSIONS['teacher'];

    it('has limited dashboard access', () => {
      expect(permissions).toContain('dashboard:view');
      expect(permissions).not.toContain('dashboard:edit');
    });

    it('can only view own students (not all)', () => {
      expect(permissions).toContain('students:view_own');
      expect(permissions).not.toContain('students:view_all');
      expect(permissions).not.toContain('students:export');
    });

    it('can generate reports but not schedule', () => {
      expect(permissions).toContain('reports:generate');
      expect(permissions).not.toContain('reports:schedule');
    });

    it('cannot access admin features', () => {
      expect(permissions).not.toContain('staff:manage');
      expect(permissions).not.toContain('settings:edit');
      expect(permissions).not.toContain('billing:view');
    });
  });

  describe('counselor role', () => {
    const permissions = ROLE_PERMISSIONS['counselor'];

    it('can view all students for SEL/behavior focus', () => {
      expect(permissions).toContain('students:view_all');
    });

    it('has dashboard view access', () => {
      expect(permissions).toContain('dashboard:view');
    });

    it('can generate reports', () => {
      expect(permissions).toContain('reports:generate');
    });

    it('cannot manage staff or settings', () => {
      expect(permissions).not.toContain('staff:manage');
      expect(permissions).not.toContain('settings:edit');
    });
  });

  describe('data_manager role', () => {
    const permissions = ROLE_PERMISSIONS['data_manager'];

    it('can view all students and export', () => {
      expect(permissions).toContain('students:view_all');
      expect(permissions).toContain('students:export');
    });

    it('can manage integrations', () => {
      expect(permissions).toContain('integrations:manage');
    });

    it('can generate and schedule reports', () => {
      expect(permissions).toContain('reports:generate');
      expect(permissions).toContain('reports:schedule');
    });

    it('cannot manage staff or billing', () => {
      expect(permissions).not.toContain('staff:manage');
      expect(permissions).not.toContain('billing:manage');
    });
  });

  describe('viewer role', () => {
    const permissions = ROLE_PERMISSIONS['viewer'];

    it('has only dashboard view permission', () => {
      expect(permissions).toContain('dashboard:view');
      expect(permissions).toHaveLength(1);
    });

    it('cannot access any other features', () => {
      expect(permissions).not.toContain('students:view_all');
      expect(permissions).not.toContain('students:view_own');
      expect(permissions).not.toContain('reports:generate');
    });
  });

  describe('authorizer role', () => {
    const permissions = ROLE_PERMISSIONS['authorizer'];

    it('has authorizer-specific permissions', () => {
      expect(permissions).toContain('authorizer:view');
      expect(permissions).toContain('authorizer:export');
      expect(permissions).toContain('authorizer:benchmark');
    });

    it('can view dashboard and generate reports', () => {
      expect(permissions).toContain('dashboard:view');
      expect(permissions).toContain('reports:generate');
    });

    it('cannot access admin features', () => {
      expect(permissions).not.toContain('staff:manage');
      expect(permissions).not.toContain('settings:edit');
      expect(permissions).not.toContain('billing:manage');
    });
  });

  describe('platform_admin role', () => {
    const permissions = ROLE_PERMISSIONS['platform_admin'];

    it('has all core permissions', () => {
      expect(permissions).toContain('dashboard:view');
      expect(permissions).toContain('dashboard:edit');
      expect(permissions).toContain('students:view_all');
      expect(permissions).toContain('students:export');
      expect(permissions).toContain('staff:manage');
      expect(permissions).toContain('settings:view');
      expect(permissions).toContain('settings:edit');
      expect(permissions).toContain('integrations:manage');
      expect(permissions).toContain('billing:view');
      expect(permissions).toContain('billing:manage');
    });

    it('can view authorizer portal', () => {
      expect(permissions).toContain('authorizer:view');
    });
  });

  describe('support role', () => {
    const permissions = ROLE_PERMISSIONS['support'];

    it('has read-only access for support purposes', () => {
      expect(permissions).toContain('dashboard:view');
      expect(permissions).toContain('students:view_all');
      expect(permissions).toContain('settings:view');
    });

    it('cannot modify anything', () => {
      expect(permissions).not.toContain('dashboard:edit');
      expect(permissions).not.toContain('settings:edit');
      expect(permissions).not.toContain('staff:manage');
    });
  });

  describe('sales role', () => {
    const permissions = ROLE_PERMISSIONS['sales'];

    it('has demo/trial management access', () => {
      expect(permissions).toContain('dashboard:view');
      expect(permissions).toContain('settings:view');
      expect(permissions).toContain('billing:view');
    });

    it('cannot modify data', () => {
      expect(permissions).not.toContain('students:view_all');
      expect(permissions).not.toContain('settings:edit');
      expect(permissions).not.toContain('billing:manage');
    });
  });
});

describe('TIER_FEATURES', () => {
  describe('starter tier', () => {
    const features = TIER_FEATURES['starter'];

    it('includes basic features', () => {
      expect(features).toContain('dashboard_basic');
      expect(features).toContain('student_360');
      expect(features).toContain('attendance_tracking');
    });

    it('has user limit', () => {
      expect(features).toContain('max_users_5');
    });

    it('does not include advanced features', () => {
      expect(features).not.toContain('dashboard_advanced');
      expect(features).not.toContain('api_access');
    });
  });

  describe('pro tier', () => {
    const features = TIER_FEATURES['pro'];

    it('includes starter features plus advanced', () => {
      expect(features).toContain('dashboard_basic');
      expect(features).toContain('dashboard_advanced');
      expect(features).toContain('student_360');
      expect(features).toContain('assessment_analytics');
      expect(features).toContain('benchmark_comparison');
      expect(features).toContain('custom_reports');
      expect(features).toContain('api_access');
    });

    it('has higher user limit', () => {
      expect(features).toContain('max_users_25');
    });

    it('does not include enterprise features', () => {
      expect(features).not.toContain('sso_saml');
      expect(features).not.toContain('white_labeling');
    });
  });

  describe('enterprise tier', () => {
    const features = TIER_FEATURES['enterprise'];

    it('includes all features', () => {
      expect(features).toContain('dashboard_basic');
      expect(features).toContain('dashboard_advanced');
      expect(features).toContain('sso_saml');
      expect(features).toContain('authorizer_portal');
      expect(features).toContain('white_labeling');
      expect(features).toContain('dedicated_support');
    });

    it('has unlimited users', () => {
      expect(features).toContain('unlimited_users');
    });
  });
});

describe('AuthorizationError', () => {
  it('creates error with default status code', () => {
    const error = new AuthorizationError('Access denied');
    expect(error.message).toBe('Access denied');
    expect(error.statusCode).toBe(403);
    expect(error.name).toBe('AuthorizationError');
  });

  it('creates error with custom status code', () => {
    const error = new AuthorizationError('Not authenticated', 401);
    expect(error.message).toBe('Not authenticated');
    expect(error.statusCode).toBe(401);
  });

  it('is instanceof Error', () => {
    const error = new AuthorizationError('Test error');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('Role type completeness', () => {
  const allRoles: UserRole[] = [
    'school_admin',
    'principal',
    'teacher',
    'counselor',
    'data_manager',
    'viewer',
    'authorizer',
    'platform_admin',
    'support',
    'sales',
  ];

  it('has permissions defined for all roles', () => {
    for (const role of allRoles) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  it('each role has at least dashboard:view permission', () => {
    for (const role of allRoles) {
      expect(ROLE_PERMISSIONS[role]).toContain('dashboard:view');
    }
  });
});

describe('Permission hierarchy', () => {
  it('school_admin has more permissions than principal', () => {
    const adminPerms = ROLE_PERMISSIONS['school_admin'];
    const principalPerms = ROLE_PERMISSIONS['principal'];
    expect(adminPerms.length).toBeGreaterThan(principalPerms.length);
  });

  it('principal has more permissions than teacher', () => {
    const principalPerms = ROLE_PERMISSIONS['principal'];
    const teacherPerms = ROLE_PERMISSIONS['teacher'];
    expect(principalPerms.length).toBeGreaterThan(teacherPerms.length);
  });

  it('teacher has more permissions than viewer', () => {
    const teacherPerms = ROLE_PERMISSIONS['teacher'];
    const viewerPerms = ROLE_PERMISSIONS['viewer'];
    expect(teacherPerms.length).toBeGreaterThan(viewerPerms.length);
  });

  it('platform_admin has most permissions', () => {
    const platformAdminPerms = ROLE_PERMISSIONS['platform_admin'];
    for (const role of Object.keys(ROLE_PERMISSIONS) as UserRole[]) {
      if (role !== 'platform_admin') {
        expect(platformAdminPerms.length).toBeGreaterThanOrEqual(
          ROLE_PERMISSIONS[role].length
        );
      }
    }
  });
});
