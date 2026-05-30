/**
 * Feature Gating System
 * =====================
 *
 * Value-based tier implementation for EduNode Analytics
 *
 * Tier 1: Starter ($4,500/year) - Compliance Focus
 *   - Authorizer Portal
 *   - Basic Mastery Trends
 *
 * Tier 2: Professional ($7,500/year + $5/student) - Operational Excellence
 *   - Everything in Starter
 *   - Student 360
 *   - Intervention Hub
 *   - AI Pulse
 *   - Basic white-labeling (colors only)
 *
 * Tier 3: Enterprise (Custom $25k+) - Network Strategy
 *   - Everything in Professional
 *   - Custom logos (SVG)
 *   - Network Benchmarking
 *   - Network View
 *   - Dedicated Data Success Partner
 */

// ---------------------------------------------------------------------------
// DEMO MODE OVERRIDE
// Set NEXT_PUBLIC_DEMO_MODE=true in .env.local to unlock all features
// ---------------------------------------------------------------------------
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';

export type FeatureKey =
  // Starter Features (included in all tiers)
  | 'authorizer_portal'
  | 'basic_mastery_trends'
  | 'dashboard_overview'
  | 'student_roster'
  | 'attendance_tracking'
  | 'basic_reports'
  // Professional Features
  | 'student_360'
  | 'intervention_hub'
  | 'ai_pulse'
  | 'ai_advisor'
  | 'impact_analyzer'
  | 'momentum_dashboard'
  | 'dosage_tracking'
  | 'mtss_management'
  | 'advanced_analytics'
  | 'white_label_colors'
  | 'risk_escalation_alerts'
  | 'weekly_digest'
  | 'sync_failure_alerts'
  // Enterprise Features
  | 'white_label_logo'
  | 'network_benchmarking'
  | 'network_view'
  | 'custom_integrations'
  | 'api_access'
  | 'sso_configuration'
  | 'dedicated_support'
  | 'parent_notifications';

export interface FeatureDefinition {
  key: FeatureKey;
  name: string;
  description: string;
  tier: SubscriptionTier;
  upgradeMessage: string;
  category: 'analytics' | 'intervention' | 'ai' | 'compliance' | 'customization' | 'network';
}

/**
 * Feature catalog with tier requirements
 */
export const FEATURES: Record<FeatureKey, FeatureDefinition> = {
  // === STARTER FEATURES ===
  authorizer_portal: {
    key: 'authorizer_portal',
    name: 'Authorizer Portal',
    description: 'Board-ready reports and charter compliance dashboards',
    tier: 'starter',
    upgradeMessage: '',
    category: 'compliance',
  },
  basic_mastery_trends: {
    key: 'basic_mastery_trends',
    name: 'Basic Mastery Trends',
    description: 'School-wide proficiency and growth summaries',
    tier: 'starter',
    upgradeMessage: '',
    category: 'analytics',
  },
  dashboard_overview: {
    key: 'dashboard_overview',
    name: 'Dashboard Overview',
    description: 'At-a-glance school health metrics',
    tier: 'starter',
    upgradeMessage: '',
    category: 'analytics',
  },
  student_roster: {
    key: 'student_roster',
    name: 'Student Roster',
    description: 'Basic student listing and search',
    tier: 'starter',
    upgradeMessage: '',
    category: 'analytics',
  },
  attendance_tracking: {
    key: 'attendance_tracking',
    name: 'Attendance Tracking',
    description: 'Daily attendance and chronic absenteeism monitoring',
    tier: 'starter',
    upgradeMessage: '',
    category: 'analytics',
  },
  basic_reports: {
    key: 'basic_reports',
    name: 'Basic Reports',
    description: 'Standard compliance and summary reports',
    tier: 'starter',
    upgradeMessage: '',
    category: 'compliance',
  },

  // === PROFESSIONAL FEATURES ===
  student_360: {
    key: 'student_360',
    name: 'Student 360 Deep Dive',
    description: 'Comprehensive individual student analytics with CGI trajectory',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional to unlock deep student insights with AI-powered analysis',
    category: 'analytics',
  },
  intervention_hub: {
    key: 'intervention_hub',
    name: 'Intervention Hub',
    description: 'MTSS tier management and intervention planning',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional for complete MTSS workflow and intervention tracking',
    category: 'intervention',
  },
  ai_pulse: {
    key: 'ai_pulse',
    name: 'AI Qualitative Pulse',
    description: 'Gemini-powered sentiment analysis of MTSS logs',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional to unlock AI-driven insights from qualitative data',
    category: 'ai',
  },
  ai_advisor: {
    key: 'ai_advisor',
    name: 'EduNode Advisor',
    description: 'AI clinical interpretation and expert recommendations',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional for AI-powered instructional recommendations',
    category: 'ai',
  },
  impact_analyzer: {
    key: 'impact_analyzer',
    name: 'Impact Analyzer',
    description: 'Measure intervention effectiveness with causal analytics',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional to measure what\'s actually working',
    category: 'analytics',
  },
  momentum_dashboard: {
    key: 'momentum_dashboard',
    name: 'Instructional Momentum',
    description: '21-day diagnostic cycle with volatility tracking',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional for real-time instructional momentum insights',
    category: 'analytics',
  },
  dosage_tracking: {
    key: 'dosage_tracking',
    name: 'Dosage Counter',
    description: 'Track intervention minutes against targets',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional to ensure intervention fidelity',
    category: 'intervention',
  },
  mtss_management: {
    key: 'mtss_management',
    name: 'MTSS Management',
    description: 'Full tier assignment and progress monitoring',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional for complete MTSS workflow',
    category: 'intervention',
  },
  advanced_analytics: {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Cohort analysis, subgroup comparisons, and trend forecasting',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional for advanced data analysis capabilities',
    category: 'analytics',
  },
  white_label_colors: {
    key: 'white_label_colors',
    name: 'Brand Colors',
    description: 'Customize primary, secondary, and accent colors',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional to customize your school branding',
    category: 'customization',
  },
  risk_escalation_alerts: {
    key: 'risk_escalation_alerts',
    name: 'Risk Escalation Alerts',
    description: 'Automated email alerts when students escalate to higher risk levels',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional to receive automated risk escalation alerts',
    category: 'intervention',
  },
  weekly_digest: {
    key: 'weekly_digest',
    name: 'Weekly Digest',
    description: 'Automated weekly summary emails for school leaders',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional to receive weekly performance digests',
    category: 'analytics',
  },
  sync_failure_alerts: {
    key: 'sync_failure_alerts',
    name: 'Sync Failure Alerts',
    description: 'Immediate notifications when data integrations fail',
    tier: 'pro',
    upgradeMessage: 'Upgrade to Professional to receive sync failure notifications',
    category: 'compliance',
  },

  // === ENTERPRISE FEATURES ===
  white_label_logo: {
    key: 'white_label_logo',
    name: 'Custom Logo',
    description: 'Upload custom SVG logo for full white-labeling',
    tier: 'enterprise',
    upgradeMessage: 'Upgrade to Enterprise for complete white-label customization',
    category: 'customization',
  },
  network_benchmarking: {
    key: 'network_benchmarking',
    name: 'Network Benchmarking',
    description: 'Compare performance across schools in your network',
    tier: 'enterprise',
    upgradeMessage: 'Upgrade to Enterprise for cross-school benchmarking',
    category: 'network',
  },
  network_view: {
    key: 'network_view',
    name: 'Network View',
    description: 'Unified dashboard for CMO oversight',
    tier: 'enterprise',
    upgradeMessage: 'Upgrade to Enterprise for network-wide visibility',
    category: 'network',
  },
  custom_integrations: {
    key: 'custom_integrations',
    name: 'Custom Integrations',
    description: 'Connect additional data sources beyond standard SIS/LMS',
    tier: 'enterprise',
    upgradeMessage: 'Upgrade to Enterprise for custom data integrations',
    category: 'customization',
  },
  api_access: {
    key: 'api_access',
    name: 'API Access',
    description: 'Programmatic access to your analytics data',
    tier: 'enterprise',
    upgradeMessage: 'Upgrade to Enterprise for API access',
    category: 'customization',
  },
  sso_configuration: {
    key: 'sso_configuration',
    name: 'SSO Configuration',
    description: 'Configure custom SAML/OIDC providers',
    tier: 'enterprise',
    upgradeMessage: 'Upgrade to Enterprise for custom SSO setup',
    category: 'customization',
  },
  dedicated_support: {
    key: 'dedicated_support',
    name: 'Dedicated Support',
    description: 'Named Data Success Partner with SLA',
    tier: 'enterprise',
    upgradeMessage: 'Upgrade to Enterprise for dedicated support',
    category: 'network',
  },
  parent_notifications: {
    key: 'parent_notifications',
    name: 'Parent Notifications',
    description: 'Automated parent/guardian communications for risk changes and interventions',
    tier: 'enterprise',
    upgradeMessage: 'Upgrade to Enterprise for automated parent communication features',
    category: 'intervention',
  },
};

/**
 * Tier hierarchy for permission checks
 */
const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  starter: 1,
  pro: 2,
  enterprise: 3,
};

/**
 * Check if a tier has access to a feature
 */
export function hasFeatureAccess(
  currentTier: SubscriptionTier,
  featureKey: FeatureKey
): boolean {
  const feature = FEATURES[featureKey];
  if (!feature) return false;

  const requiredLevel = TIER_HIERARCHY[feature.tier];
  const currentLevel = TIER_HIERARCHY[currentTier];

  return currentLevel >= requiredLevel;
}

/**
 * Get all features available for a tier
 */
export function getAvailableFeatures(tier: SubscriptionTier): FeatureKey[] {
  const currentLevel = TIER_HIERARCHY[tier];
  return Object.keys(FEATURES).filter((key) => {
    const feature = FEATURES[key as FeatureKey];
    return TIER_HIERARCHY[feature.tier] <= currentLevel;
  }) as FeatureKey[];
}

/**
 * Get all locked features for a tier (for showing upgrade prompts)
 */
export function getLockedFeatures(tier: SubscriptionTier): FeatureDefinition[] {
  const currentLevel = TIER_HIERARCHY[tier];
  return Object.values(FEATURES).filter(
    (feature) => TIER_HIERARCHY[feature.tier] > currentLevel
  );
}

/**
 * Get the next tier for upgrade
 */
export function getNextTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  switch (currentTier) {
    case 'starter':
      return 'pro';
    case 'pro':
      return 'enterprise';
    case 'enterprise':
      return null;
  }
}

/**
 * Get tier display information
 */
export const TIER_INFO: Record<SubscriptionTier, {
  name: string;
  tagline: string;
  price: string;
  features: string[];
}> = {
  starter: {
    name: 'Starter',
    tagline: 'Compliance Focus',
    price: '$4,500/year',
    features: [
      'Authorizer Portal',
      'Basic Mastery Trends',
      'Attendance Tracking',
      'Standard Reports',
    ],
  },
  pro: {
    name: 'Professional',
    tagline: 'Operational Excellence',
    price: '$7,500/year + $5/student',
    features: [
      'Everything in Starter',
      'Student 360 Deep Dive',
      'Intervention Hub',
      'AI Qualitative Pulse',
      'Impact Analyzer',
      'Momentum Dashboard',
      'Brand Colors',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    tagline: 'Network Strategy',
    price: 'Custom pricing',
    features: [
      'Everything in Professional',
      'Custom Logo & Branding',
      'Network Benchmarking',
      'Network View',
      'API Access',
      'Custom Integrations',
      'Dedicated Support',
    ],
  },
};

/**
 * Map navigation routes to required features
 */
export const ROUTE_FEATURE_MAP: Record<string, FeatureKey> = {
  '/dashboard': 'dashboard_overview',
  '/dashboard/students': 'student_roster',
  '/dashboard/students/[student_id]': 'student_360',
  '/student-360': 'student_360',
  '/dashboard/pulse': 'ai_pulse',
  '/dashboard/momentum': 'momentum_dashboard',
  '/analytics/impact': 'impact_analyzer',
  '/interventions': 'intervention_hub',
  '/mtss': 'mtss_management',
  '/authorizer': 'authorizer_portal',
  '/settings/branding': 'white_label_colors',
  '/settings/logo': 'white_label_logo',
  '/network': 'network_view',
  '/api': 'api_access',
};

/**
 * Get required feature for a route
 */
export function getRouteFeature(pathname: string): FeatureKey | null {
  // Normalize the pathname by removing school_slug
  const normalizedPath = pathname.replace(/^\/[^/]+/, '');

  // Direct match
  if (ROUTE_FEATURE_MAP[normalizedPath]) {
    return ROUTE_FEATURE_MAP[normalizedPath];
  }

  // Check for dynamic route patterns
  for (const [pattern, feature] of Object.entries(ROUTE_FEATURE_MAP)) {
    const regex = new RegExp(
      '^' + pattern.replace(/\[.*?\]/g, '[^/]+') + '$'
    );
    if (regex.test(normalizedPath)) {
      return feature;
    }
  }

  return null;
}
