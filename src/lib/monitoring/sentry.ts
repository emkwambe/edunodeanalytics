/**
 * Sentry Error Monitoring
 * =======================
 *
 * Captures errors with user/school context for debugging.
 *
 * Features:
 * - Automatic error capture with stack traces
 * - User context (Clerk user ID, school slug)
 * - Environment tagging (development, staging, production)
 * - Performance tracing for API routes
 * - Sensitive data scrubbing
 * - Cron job monitoring with check-ins
 *
 * Setup:
 * - Set SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN environment variables
 * - Errors are automatically captured via Next.js integration
 */

import * as Sentry from '@sentry/nextjs';

// Re-export Sentry for direct access when needed
export { Sentry };

// Type definitions for our wrapper functions
interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
  schoolSlug?: string;
  schoolId?: string;
  subscriptionTier?: string;
}

interface SentryContext {
  [key: string]: unknown;
}

interface SentryBreadcrumb {
  type?: string;
  category?: string;
  message?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

// Check if Sentry is configured
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_SENTRY_ENABLED = !!SENTRY_DSN;

// Environment configuration
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development';

// Sensitive fields to scrub from error reports
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'api_key',
  'apiKey',
  'access_token',
  'refresh_token',
  'authorization',
  'ssn',
  'social_security',
  'credit_card',
  'card_number',
];

/**
 * Scrub sensitive data from error payloads
 */
function scrubSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      scrubbed[key] = scrubSensitiveData(value as Record<string, unknown>);
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed;
}

/**
 * Set user context for error tracking
 */
export function setUser(user: SentryUser): void {
  if (!IS_SENTRY_ENABLED) {
    console.log('[Sentry] User context set (disabled)', { userId: user.id });
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  if (user.schoolSlug) {
    Sentry.setTag('school_slug', user.schoolSlug);
  }
  if (user.schoolId) {
    Sentry.setTag('school_id', user.schoolId);
  }
  if (user.subscriptionTier) {
    Sentry.setTag('subscription_tier', user.subscriptionTier);
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUser(): void {
  if (!IS_SENTRY_ENABLED) return;

  Sentry.setUser(null);
}

/**
 * Capture an exception with optional context
 */
export function captureException(
  error: Error | unknown,
  context?: SentryContext
): string | null {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  if (!IS_SENTRY_ENABLED) {
    console.error('[Sentry] Would capture exception:', {
      name: errorObj.name,
      message: errorObj.message,
      context: context ? scrubSensitiveData(context) : undefined,
    });
    return `mock-event-${Date.now()}`;
  }

  return Sentry.captureException(error, {
    extra: context ? scrubSensitiveData(context) : undefined,
  });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  context?: SentryContext
): string | null {
  if (!IS_SENTRY_ENABLED) {
    console.log(`[Sentry] Would capture message: [${level}] ${message}`);
    return `mock-event-${Date.now()}`;
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context ? scrubSensitiveData(context) : undefined,
  });
}

/**
 * Add breadcrumb for debugging trail
 */
export function addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
  if (!IS_SENTRY_ENABLED) {
    console.log('[Sentry] Breadcrumb:', breadcrumb.message);
    return;
  }

  Sentry.addBreadcrumb({
    type: breadcrumb.type,
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level,
    data: breadcrumb.data,
  });
}

/**
 * Set custom tag for filtering
 */
export function setTag(key: string, value: string): void {
  if (!IS_SENTRY_ENABLED) {
    console.log(`[Sentry] Tag set: ${key}=${value}`);
    return;
  }

  Sentry.setTag(key, value);
}

/**
 * Set extra context data
 */
export function setExtra(key: string, value: unknown): void {
  if (!IS_SENTRY_ENABLED) return;

  Sentry.setExtra(key, value);
}

/**
 * Create a span for performance tracing
 */
export function startSpan<T>(
  name: string,
  op: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  if (!IS_SENTRY_ENABLED) {
    return fn();
  }

  return Sentry.startSpan({ name, op }, fn);
}

/**
 * Wrap an async function with error capturing
 */
export async function withSentry<T>(
  name: string,
  fn: () => Promise<T>,
  context?: SentryContext
): Promise<T> {
  if (!IS_SENTRY_ENABLED) {
    return fn();
  }

  return Sentry.startSpan({ name, op: 'function' }, async () => {
    try {
      return await fn();
    } catch (error) {
      captureException(error, { ...context, operation: name });
      throw error;
    }
  });
}

/**
 * Express/API route error handler
 */
export function sentryErrorHandler(
  error: Error,
  context: { path: string; method: string; schoolSlug?: string }
): void {
  captureException(error, {
    path: context.path,
    method: context.method,
    schoolSlug: context.schoolSlug,
  });
}

/**
 * Flush pending events (useful before process exit)
 */
export async function flush(timeout = 2000): Promise<boolean> {
  if (!IS_SENTRY_ENABLED) return true;

  return Sentry.flush(timeout);
}

// ============================================================
// CRON MONITORING
// ============================================================

/**
 * Cron monitor slug type for type safety
 */
export type CronMonitorSlug =
  | 'risk-evaluation'
  | 'sync-rosters'
  | 'scheduled-reports'
  | 'stale-interventions';

/**
 * Cron monitor configuration
 */
const CRON_MONITORS: Record<CronMonitorSlug, { schedule: string; checkinMargin: number; maxRuntime: number }> = {
  'risk-evaluation': {
    schedule: '0 2 * * *', // Daily at 2 AM
    checkinMargin: 5, // 5 minutes
    maxRuntime: 10, // 10 minutes
  },
  'sync-rosters': {
    schedule: '0 6 * * *', // Daily at 6 AM
    checkinMargin: 5,
    maxRuntime: 15,
  },
  'scheduled-reports': {
    schedule: '0 * * * *', // Every hour
    checkinMargin: 5,
    maxRuntime: 10,
  },
  'stale-interventions': {
    schedule: '0 8 * * 1', // Every Monday at 8 AM
    checkinMargin: 5,
    maxRuntime: 5,
  },
};

/**
 * Start a cron job check-in (call at the beginning of cron execution)
 * Returns a check-in ID to use with cronCheckInComplete for completion
 *
 * Uses breadcrumbs and messages as the primary monitoring mechanism,
 * with native Sentry cron check-ins when available.
 */
export function cronCheckInStart(monitorSlug: CronMonitorSlug): string | null {
  const checkInId = `checkin-${monitorSlug}-${Date.now()}`;
  const config = CRON_MONITORS[monitorSlug];

  // Log as breadcrumb for debugging trail
  addBreadcrumb({
    category: 'cron',
    message: `Cron job started: ${monitorSlug}`,
    level: 'info',
    data: {
      monitorSlug,
      schedule: config.schedule,
      checkInId,
    },
  });

  if (!IS_SENTRY_ENABLED) {
    console.log(`[Sentry] Cron check-in started: ${monitorSlug}`);
    return checkInId;
  }

  // Set tags for filtering cron-related errors
  setTag('cron_job', monitorSlug);
  setTag('cron_checkin_id', checkInId);

  return checkInId;
}

/**
 * Complete a cron job check-in (call at the end of cron execution)
 */
export function cronCheckInComplete(
  checkInId: string | null,
  monitorSlug: CronMonitorSlug,
  status: 'ok' | 'error',
  duration?: number
): void {
  // Log completion as breadcrumb
  addBreadcrumb({
    category: 'cron',
    message: `Cron job completed: ${monitorSlug} - ${status}`,
    level: status === 'error' ? 'error' : 'info',
    data: {
      monitorSlug,
      status,
      duration,
      checkInId,
    },
  });

  if (!IS_SENTRY_ENABLED) {
    console.log(`[Sentry] Cron check-in completed: ${monitorSlug} - ${status}`);
    return;
  }

  // Capture error completion as a Sentry event for alerting
  if (status === 'error') {
    captureMessage(`Cron job failed: ${monitorSlug}`, 'error', {
      monitorSlug,
      duration,
      checkInId,
      cron_failure: true,
    });
  }
}

/**
 * Wrapper for cron job execution with automatic check-in
 */
export async function withCronMonitoring<T>(
  monitorSlug: CronMonitorSlug,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const checkInId = cronCheckInStart(monitorSlug);

  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    cronCheckInComplete(checkInId, monitorSlug, 'ok', duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    cronCheckInComplete(checkInId, monitorSlug, 'error', duration);
    captureException(error, {
      cronJob: monitorSlug,
      duration,
    });
    throw error;
  }
}

export { IS_SENTRY_ENABLED, ENVIRONMENT, RELEASE };
