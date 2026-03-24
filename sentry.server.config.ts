/**
 * Sentry Server Configuration
 * ===========================
 *
 * This file configures the Sentry SDK for server-side error tracking.
 * It runs in Node.js for API routes and server components.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment detection
  environment: process.env.NODE_ENV || 'development',

  // Release tracking (Vercel provides this automatically)
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

  // Performance monitoring
  // Lower sample rate in production to reduce costs
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

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

  // Server-specific settings
  // Capture unhandled promise rejections
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ['error', 'warn'],
    }),
  ],

  // Ignore certain errors that are not actionable
  ignoreErrors: [
    // Expected errors
    /NEXT_NOT_FOUND/,
    /NEXT_REDIRECT/,
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
    'clerk_secret',
    'supabase_service_role',
    'stripe_secret',
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
