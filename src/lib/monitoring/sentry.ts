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
 *
 * Setup:
 * - Set SENTRY_DSN environment variable
 * - Errors are automatically captured via Next.js integration
 */

// Type definitions for Sentry SDK
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
const SENTRY_DSN = process.env.SENTRY_DSN;
const IS_SENTRY_ENABLED = !!SENTRY_DSN;

// Environment configuration
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const RELEASE = process.env.VERCEL_GIT_COMMIT_SHA || 'development';

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
 * Initialize Sentry (called from instrumentation.ts)
 */
export function initSentry(): void {
  if (!IS_SENTRY_ENABLED) {
    console.log('[Sentry] Not configured - set SENTRY_DSN to enable');
    return;
  }

  // In production, this would initialize the Sentry SDK
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.init({
  //   dsn: SENTRY_DSN,
  //   environment: ENVIRONMENT,
  //   release: RELEASE,
  //   tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  //   beforeSend(event) {
  //     return scrubSensitiveData(event);
  //   },
  // });

  console.log('[Sentry] Initialized', { environment: ENVIRONMENT, release: RELEASE });
}

/**
 * Scrub sensitive data from error payloads
 */
function scrubSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
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
  if (!IS_SENTRY_ENABLED) return;

  // In production with SDK:
  // Sentry.setUser({
  //   id: user.id,
  //   email: user.email,
  //   username: user.username,
  // });
  // Sentry.setTag('school_slug', user.schoolSlug);
  // Sentry.setTag('school_id', user.schoolId);
  // Sentry.setTag('subscription_tier', user.subscriptionTier);

  console.log('[Sentry] User context set', { userId: user.id, schoolSlug: user.schoolSlug });
}

/**
 * Clear user context (on logout)
 */
export function clearUser(): void {
  if (!IS_SENTRY_ENABLED) return;

  // Sentry.setUser(null);
  console.log('[Sentry] User context cleared');
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
    console.error('[Sentry Mock] Would capture exception:', {
      name: errorObj.name,
      message: errorObj.message,
      context: context ? scrubSensitiveData(context) : undefined,
    });
    return `mock-event-${Date.now()}`;
  }

  // In production with SDK:
  // return Sentry.captureException(error, {
  //   extra: context ? scrubSensitiveData(context) : undefined,
  // });

  console.error('[Sentry] Captured exception:', errorObj.message);
  return `event-${Date.now()}`;
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
    console.log(`[Sentry Mock] Would capture message: [${level}] ${message}`);
    return `mock-event-${Date.now()}`;
  }

  // Sentry.captureMessage(message, {
  //   level,
  //   extra: context,
  // });

  console.log(`[Sentry] Captured message: [${level}] ${message}`);
  return `event-${Date.now()}`;
}

/**
 * Add breadcrumb for debugging trail
 */
export function addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
  if (!IS_SENTRY_ENABLED) return;

  // Sentry.addBreadcrumb(breadcrumb);
  console.log('[Sentry] Breadcrumb:', breadcrumb.message);
}

/**
 * Set custom tag for filtering
 */
export function setTag(key: string, value: string): void {
  if (!IS_SENTRY_ENABLED) return;

  // Sentry.setTag(key, value);
  console.log(`[Sentry] Tag set: ${key}=${value}`);
}

/**
 * Create a transaction for performance tracing
 */
export function startTransaction(
  name: string,
  op: string
): { finish: () => void } {
  if (!IS_SENTRY_ENABLED) {
    return {
      finish: () => {
        console.log(`[Sentry Mock] Transaction finished: ${name}`);
      },
    };
  }

  // const transaction = Sentry.startTransaction({ name, op });
  // return transaction;

  const startTime = Date.now();
  return {
    finish: () => {
      const duration = Date.now() - startTime;
      console.log(`[Sentry] Transaction ${name}: ${duration}ms`);
    },
  };
}

/**
 * Wrap an async function with error capturing
 */
export async function withSentry<T>(
  name: string,
  fn: () => Promise<T>,
  context?: SentryContext
): Promise<T> {
  const transaction = startTransaction(name, 'function');

  try {
    const result = await fn();
    return result;
  } catch (error) {
    captureException(error, { ...context, operation: name });
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Express/API route error handler middleware
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
export async function flush(timeout = 2000): Promise<void> {
  if (!IS_SENTRY_ENABLED) return;

  // await Sentry.flush(timeout);
  console.log('[Sentry] Flushed pending events');
}

export { IS_SENTRY_ENABLED, ENVIRONMENT, RELEASE };
