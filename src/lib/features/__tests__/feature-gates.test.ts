/**
 * Feature Gates Tests
 * ===================
 *
 * Tests for the subscription tier feature gating system.
 */

import { describe, it, expect } from 'vitest';
import {
  hasFeatureAccess,
  getAvailableFeatures,
  getLockedFeatures,
  getNextTier,
  getRouteFeature,
  FEATURES,
  TIER_INFO,
  type SubscriptionTier,
  type FeatureKey,
} from '../feature-gates';

describe('hasFeatureAccess', () => {
  describe('starter tier', () => {
    const tier: SubscriptionTier = 'starter';

    it('grants access to starter features', () => {
      expect(hasFeatureAccess(tier, 'authorizer_portal')).toBe(true);
      expect(hasFeatureAccess(tier, 'basic_mastery_trends')).toBe(true);
      expect(hasFeatureAccess(tier, 'dashboard_overview')).toBe(true);
      expect(hasFeatureAccess(tier, 'student_roster')).toBe(true);
      expect(hasFeatureAccess(tier, 'attendance_tracking')).toBe(true);
      expect(hasFeatureAccess(tier, 'basic_reports')).toBe(true);
    });

    it('denies access to professional features', () => {
      expect(hasFeatureAccess(tier, 'student_360')).toBe(false);
      expect(hasFeatureAccess(tier, 'intervention_hub')).toBe(false);
      expect(hasFeatureAccess(tier, 'ai_pulse')).toBe(false);
      expect(hasFeatureAccess(tier, 'momentum_dashboard')).toBe(false);
    });

    it('denies access to enterprise features', () => {
      expect(hasFeatureAccess(tier, 'network_view')).toBe(false);
      expect(hasFeatureAccess(tier, 'network_benchmarking')).toBe(false);
      expect(hasFeatureAccess(tier, 'api_access')).toBe(false);
    });
  });

  describe('professional tier', () => {
    const tier: SubscriptionTier = 'pro';

    it('grants access to starter features', () => {
      expect(hasFeatureAccess(tier, 'authorizer_portal')).toBe(true);
      expect(hasFeatureAccess(tier, 'basic_mastery_trends')).toBe(true);
      expect(hasFeatureAccess(tier, 'dashboard_overview')).toBe(true);
    });

    it('grants access to professional features', () => {
      expect(hasFeatureAccess(tier, 'student_360')).toBe(true);
      expect(hasFeatureAccess(tier, 'intervention_hub')).toBe(true);
      expect(hasFeatureAccess(tier, 'ai_pulse')).toBe(true);
      expect(hasFeatureAccess(tier, 'ai_advisor')).toBe(true);
      expect(hasFeatureAccess(tier, 'impact_analyzer')).toBe(true);
      expect(hasFeatureAccess(tier, 'momentum_dashboard')).toBe(true);
      expect(hasFeatureAccess(tier, 'dosage_tracking')).toBe(true);
      expect(hasFeatureAccess(tier, 'mtss_management')).toBe(true);
      expect(hasFeatureAccess(tier, 'advanced_analytics')).toBe(true);
      expect(hasFeatureAccess(tier, 'white_label_colors')).toBe(true);
    });

    it('denies access to enterprise features', () => {
      expect(hasFeatureAccess(tier, 'network_view')).toBe(false);
      expect(hasFeatureAccess(tier, 'network_benchmarking')).toBe(false);
      expect(hasFeatureAccess(tier, 'white_label_logo')).toBe(false);
      expect(hasFeatureAccess(tier, 'api_access')).toBe(false);
      expect(hasFeatureAccess(tier, 'sso_configuration')).toBe(false);
    });
  });

  describe('enterprise tier', () => {
    const tier: SubscriptionTier = 'enterprise';

    it('grants access to all features', () => {
      // Test all feature keys
      const allFeatures = Object.keys(FEATURES) as FeatureKey[];
      for (const feature of allFeatures) {
        expect(hasFeatureAccess(tier, feature)).toBe(true);
      }
    });
  });

  it('returns false for invalid feature keys', () => {
    expect(hasFeatureAccess('starter', 'invalid_feature' as FeatureKey)).toBe(false);
    expect(hasFeatureAccess('pro', '' as FeatureKey)).toBe(false);
  });
});

describe('getAvailableFeatures', () => {
  it('returns starter features for starter tier', () => {
    const features = getAvailableFeatures('starter');
    expect(features).toContain('authorizer_portal');
    expect(features).toContain('dashboard_overview');
    expect(features).not.toContain('student_360');
    expect(features).not.toContain('network_view');
  });

  it('returns starter + pro features for professional tier', () => {
    const features = getAvailableFeatures('pro');
    expect(features).toContain('authorizer_portal');
    expect(features).toContain('student_360');
    expect(features).toContain('intervention_hub');
    expect(features).not.toContain('network_view');
  });

  it('returns all features for enterprise tier', () => {
    const features = getAvailableFeatures('enterprise');
    const allFeatures = Object.keys(FEATURES);
    expect(features.length).toBe(allFeatures.length);
    expect(features).toContain('network_view');
    expect(features).toContain('api_access');
  });

  it('returns features in an array', () => {
    const features = getAvailableFeatures('starter');
    expect(Array.isArray(features)).toBe(true);
  });
});

describe('getLockedFeatures', () => {
  it('returns locked features for starter tier', () => {
    const locked = getLockedFeatures('starter');
    const lockedKeys = locked.map((f) => f.key);

    // Should include pro features
    expect(lockedKeys).toContain('student_360');
    expect(lockedKeys).toContain('intervention_hub');

    // Should include enterprise features
    expect(lockedKeys).toContain('network_view');
    expect(lockedKeys).toContain('api_access');

    // Should NOT include starter features
    expect(lockedKeys).not.toContain('authorizer_portal');
    expect(lockedKeys).not.toContain('dashboard_overview');
  });

  it('returns only enterprise features for professional tier', () => {
    const locked = getLockedFeatures('pro');
    const lockedKeys = locked.map((f) => f.key);

    // Should include enterprise features
    expect(lockedKeys).toContain('network_view');
    expect(lockedKeys).toContain('network_benchmarking');
    expect(lockedKeys).toContain('api_access');

    // Should NOT include starter or pro features
    expect(lockedKeys).not.toContain('authorizer_portal');
    expect(lockedKeys).not.toContain('student_360');
    expect(lockedKeys).not.toContain('intervention_hub');
  });

  it('returns empty array for enterprise tier', () => {
    const locked = getLockedFeatures('enterprise');
    expect(locked).toHaveLength(0);
  });

  it('returns FeatureDefinition objects with upgrade messages', () => {
    const locked = getLockedFeatures('starter');
    for (const feature of locked) {
      expect(feature).toHaveProperty('key');
      expect(feature).toHaveProperty('name');
      expect(feature).toHaveProperty('tier');
      expect(feature).toHaveProperty('upgradeMessage');
    }
  });
});

describe('getNextTier', () => {
  it('returns pro for starter', () => {
    expect(getNextTier('starter')).toBe('pro');
  });

  it('returns enterprise for pro', () => {
    expect(getNextTier('pro')).toBe('enterprise');
  });

  it('returns null for enterprise (no upgrade available)', () => {
    expect(getNextTier('enterprise')).toBeNull();
  });
});

describe('getRouteFeature', () => {
  it('maps dashboard route to dashboard_overview feature', () => {
    expect(getRouteFeature('/school-slug/dashboard')).toBe('dashboard_overview');
  });

  it('maps student-360 route to student_360 feature', () => {
    expect(getRouteFeature('/school-slug/student-360')).toBe('student_360');
  });

  it('maps interventions route to intervention_hub feature', () => {
    expect(getRouteFeature('/school-slug/interventions')).toBe('intervention_hub');
  });

  it('maps network route to network_view feature', () => {
    expect(getRouteFeature('/school-slug/network')).toBe('network_view');
  });

  it('maps pulse dashboard route to ai_pulse feature', () => {
    expect(getRouteFeature('/school-slug/dashboard/pulse')).toBe('ai_pulse');
  });

  it('maps momentum dashboard route to momentum_dashboard feature', () => {
    expect(getRouteFeature('/school-slug/dashboard/momentum')).toBe('momentum_dashboard');
  });

  it('handles dynamic student routes', () => {
    expect(getRouteFeature('/school-slug/dashboard/students/abc-123')).toBe('student_360');
  });

  it('returns null for unmapped routes', () => {
    expect(getRouteFeature('/school-slug/unknown-page')).toBeNull();
    expect(getRouteFeature('/school-slug/some/deep/path')).toBeNull();
  });
});

describe('FEATURES catalog', () => {
  it('has all required properties for each feature', () => {
    for (const [key, feature] of Object.entries(FEATURES)) {
      expect(feature.key).toBe(key);
      expect(feature.name).toBeTruthy();
      expect(feature.description).toBeTruthy();
      expect(['starter', 'pro', 'enterprise']).toContain(feature.tier);
      expect(feature.category).toBeTruthy();
    }
  });

  it('has upgrade messages for non-starter features', () => {
    for (const feature of Object.values(FEATURES)) {
      if (feature.tier !== 'starter') {
        expect(feature.upgradeMessage).toBeTruthy();
      }
    }
  });

  it('categorizes features correctly', () => {
    const categories = ['analytics', 'intervention', 'ai', 'compliance', 'customization', 'network'];
    for (const feature of Object.values(FEATURES)) {
      expect(categories).toContain(feature.category);
    }
  });
});

describe('TIER_INFO', () => {
  it('has info for all tiers', () => {
    expect(TIER_INFO.starter).toBeDefined();
    expect(TIER_INFO.pro).toBeDefined();
    expect(TIER_INFO.enterprise).toBeDefined();
  });

  it('has required properties for each tier', () => {
    for (const tier of Object.values(TIER_INFO)) {
      expect(tier.name).toBeTruthy();
      expect(tier.tagline).toBeTruthy();
      expect(tier.price).toBeTruthy();
      expect(tier.features).toBeInstanceOf(Array);
      expect(tier.features.length).toBeGreaterThan(0);
    }
  });

  it('has correct tier names', () => {
    expect(TIER_INFO.starter.name).toBe('Starter');
    expect(TIER_INFO.pro.name).toBe('Professional');
    expect(TIER_INFO.enterprise.name).toBe('Enterprise');
  });
});
