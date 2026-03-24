/**
 * Sentry Client Configuration
 * ===========================
 *
 * This file configures the Sentry SDK for browser/client-side error tracking.
 * It runs on every page load in the browser.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment detection
  environment: process.env.NODE_ENV || 'development',

  // Release tracking (Vercel provides this automatically)
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',

  // Performance monitoring
  // Lower sample rate in production to reduce costs
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay for debugging user issues
  // Disable in development, low sample in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Only enable in production with a valid DSN
  enabled: !!SENTRY_DSN && process.env.NODE_ENV === 'production',

  // Sensitive data filtering
  beforeSend(event) {
    // Scrub sensitive fields from breadcrumbs and extra data
    if (event.extra) {
      event.extra = scrubSensitiveData(event.extra as Record<string, unknown>);
    }
    return event;
  },

  // Ignore certain errors that are not actionable
  ignoreErrors: [
    // Browser extensions
    /^Script error\.?$/,
    /^Javascript error: Script error\.? on line 0$/,
    // Network errors that are normal
    /^ResizeObserver loop limit exceeded$/,
    /^ResizeObserver loop completed with undelivered notifications\.$/,
    // User navigation
    /^AbortError: The operation was aborted\.$/,
  ],

  // Additional integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text for privacy (FERPA compliance)
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
});

/**
 * Scrub sensitive data from error payloads
 */
function scrubSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
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
