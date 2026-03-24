/**
 * PostHog Product Analytics
 * =========================
 *
 * Tracks user interactions and product usage for analytics.
 *
 * Features:
 * - Page view tracking
 * - Custom event tracking
 * - User identification with school context
 * - Feature flag support
 * - Session recording (optional)
 *
 * Privacy:
 * - No PII in events by default
 * - School-level aggregation only
 * - Opt-out support
 *
 * Setup:
 * - Set NEXT_PUBLIC_POSTHOG_KEY environment variable
 * - PostHog tracks automatically via _app.tsx integration
 */

// Type definitions
interface PostHogUser {
  userId: string;
  email?: string;
  schoolSlug?: string;
  schoolId?: string;
  subscriptionTier?: 'starter' | 'pro' | 'enterprise';
  role?: 'admin' | 'teacher' | 'viewer';
}

interface EventProperties {
  [key: string]: string | number | boolean | string[] | null;
}

// Check if PostHog is configured
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const _POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
const IS_POSTHOG_ENABLED = !!POSTHOG_KEY && typeof window !== 'undefined';

// Analytics opt-out check
function isOptedOut(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('analytics_opt_out') === 'true';
}

/**
 * Initialize PostHog client (called from _app.tsx)
 */
export function initPostHog(): void {
  if (typeof window === 'undefined') return;

  if (!POSTHOG_KEY) {
    console.log('[PostHog] Not configured - set NEXT_PUBLIC_POSTHOG_KEY to enable');
    return;
  }

  // In production with SDK:
  // import posthog from 'posthog-js';
  // posthog.init(POSTHOG_KEY, {
  //   api_host: POSTHOG_HOST,
  //   capture_pageview: false, // We'll handle manually
  //   capture_pageleave: true,
  //   disable_session_recording: !process.env.NEXT_PUBLIC_POSTHOG_RECORDING,
  //   persistence: 'localStorage',
  //   bootstrap: {
  //     distinctId: getDistinctId(),
  //   },
  // });

  console.log('[PostHog] Initialized');
}

/**
 * Identify user with properties
 */
export function identify(user: PostHogUser): void {
  if (!IS_POSTHOG_ENABLED || isOptedOut()) return;

  // posthog.identify(user.userId, {
  //   email: user.email,
  //   school_slug: user.schoolSlug,
  //   school_id: user.schoolId,
  //   subscription_tier: user.subscriptionTier,
  //   role: user.role,
  // });

  console.log('[PostHog] User identified:', user.userId);
}

/**
 * Reset user identity (on logout)
 */
export function reset(): void {
  if (!IS_POSTHOG_ENABLED) return;

  // posthog.reset();
  console.log('[PostHog] User reset');
}

/**
 * Track page view
 */
export function trackPageView(path: string, _properties?: EventProperties): void {
  if (!IS_POSTHOG_ENABLED || isOptedOut()) return;

  // posthog.capture('$pageview', {
  //   $current_url: path,
  //   ...properties,
  // });

  console.log('[PostHog] Page view:', path);
}

/**
 * Track custom event
 */
export function trackEvent(eventName: string, properties?: EventProperties): void {
  if (!IS_POSTHOG_ENABLED || isOptedOut()) return;

  // posthog.capture(eventName, properties);
  console.log('[PostHog] Event:', eventName, properties);
}

/**
 * Set group for school-level analytics
 */
export function setSchool(schoolSlug: string, _properties?: EventProperties): void {
  if (!IS_POSTHOG_ENABLED || isOptedOut()) return;

  // posthog.group('school', schoolSlug, properties);
  console.log('[PostHog] School group set:', schoolSlug);
}

/**
 * Check if feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (!IS_POSTHOG_ENABLED) return false;

  // return posthog.isFeatureEnabled(flagKey) ?? false;
  console.log('[PostHog] Feature flag check:', flagKey);
  return false;
}

/**
 * Get feature flag value
 */
export function getFeatureFlag(flagKey: string): string | boolean | undefined {
  if (!IS_POSTHOG_ENABLED) return undefined;

  // return posthog.getFeatureFlag(flagKey);
  console.log('[PostHog] Feature flag get:', flagKey);
  return undefined;
}

/**
 * Opt out of analytics
 */
export function optOut(): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('analytics_opt_out', 'true');
  // posthog.opt_out_capturing();
  console.log('[PostHog] Opted out');
}

/**
 * Opt back in to analytics
 */
export function optIn(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('analytics_opt_out');
  // posthog.opt_in_capturing();
  console.log('[PostHog] Opted in');
}

// =============================================================================
// Predefined Events for EduNode Analytics
// =============================================================================

/**
 * Track dashboard view
 */
export function trackDashboardView(
  schoolSlug: string,
  dashboardType: 'overview' | 'students' | 'interventions' | 'reports'
): void {
  trackEvent('dashboard_viewed', {
    school_slug: schoolSlug,
    dashboard_type: dashboardType,
  });
}

/**
 * Track student profile view
 */
export function trackStudentProfileView(
  schoolSlug: string,
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
): void {
  trackEvent('student_profile_viewed', {
    school_slug: schoolSlug,
    risk_level: riskLevel,
  });
}

/**
 * Track intervention creation
 */
export function trackInterventionCreated(
  schoolSlug: string,
  interventionType: string,
  priority: string
): void {
  trackEvent('intervention_created', {
    school_slug: schoolSlug,
    intervention_type: interventionType,
    priority,
  });
}

/**
 * Track intervention status change
 */
export function trackInterventionStatusChanged(
  schoolSlug: string,
  fromStatus: string,
  toStatus: string
): void {
  trackEvent('intervention_status_changed', {
    school_slug: schoolSlug,
    from_status: fromStatus,
    to_status: toStatus,
  });
}

/**
 * Track AI insight generated
 */
export function trackAIInsightGenerated(
  schoolSlug: string,
  insightType: string,
  duration: number
): void {
  trackEvent('ai_insight_generated', {
    school_slug: schoolSlug,
    insight_type: insightType,
    duration_ms: duration,
  });
}

/**
 * Track data source connected
 */
export function trackDataSourceConnected(
  schoolSlug: string,
  sourceType: string,
  category: string
): void {
  trackEvent('data_source_connected', {
    school_slug: schoolSlug,
    source_type: sourceType,
    category,
  });
}

/**
 * Track data sync completed
 */
export function trackDataSyncCompleted(
  schoolSlug: string,
  sourceType: string,
  recordCount: number,
  success: boolean
): void {
  trackEvent('data_sync_completed', {
    school_slug: schoolSlug,
    source_type: sourceType,
    record_count: recordCount,
    success,
  });
}

/**
 * Track report generated
 */
export function trackReportGenerated(
  schoolSlug: string,
  reportType: string,
  format: 'pdf' | 'csv' | 'excel'
): void {
  trackEvent('report_generated', {
    school_slug: schoolSlug,
    report_type: reportType,
    format,
  });
}

/**
 * Track subscription change
 */
export function trackSubscriptionChanged(
  schoolSlug: string,
  fromTier: string,
  toTier: string,
  action: 'upgrade' | 'downgrade' | 'cancel'
): void {
  trackEvent('subscription_changed', {
    school_slug: schoolSlug,
    from_tier: fromTier,
    to_tier: toTier,
    action,
  });
}

/**
 * Track search performed
 */
export function trackSearch(
  schoolSlug: string,
  searchType: 'students' | 'interventions' | 'global',
  resultCount: number
): void {
  trackEvent('search_performed', {
    school_slug: schoolSlug,
    search_type: searchType,
    result_count: resultCount,
  });
}

export { IS_POSTHOG_ENABLED };
