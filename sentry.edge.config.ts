/**
 * Sentry Edge Configuration
 * =========================
 *
 * This file configures the Sentry SDK for edge runtime (middleware).
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Environment detection
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

  // Performance monitoring - lower rate for edge
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Only enable in production with a valid DSN
  enabled: !!SENTRY_DSN && process.env.NODE_ENV === 'production',
});
