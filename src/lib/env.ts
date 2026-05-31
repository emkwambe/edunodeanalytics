/**
 * Environment Variable Validation
 * ================================
 *
 * Validates all required environment variables at startup using Zod.
 * If any required variable is missing, the app crashes immediately
 * with a clear error message naming the missing variable(s).
 *
 * T1 Security & Data Safety requirement.
 */

import { z } from 'zod';

/**
 * Schema for all required environment variables
 */
const envSchema = z.object({
  // Database - Required
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ required_error: 'NEXT_PUBLIC_SUPABASE_URL is required' })
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ required_error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' })
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string({ required_error: 'SUPABASE_SERVICE_ROLE_KEY is required' })
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY cannot be empty'),

  // Authentication - Required
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string({ required_error: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required' })
    .startsWith('pk_', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_'),
  CLERK_SECRET_KEY: z
    .string({ required_error: 'CLERK_SECRET_KEY is required' })
    .startsWith('sk_', 'CLERK_SECRET_KEY must start with sk_'),

  // Stripe - Optional (required for billing features)
  STRIPE_SECRET_KEY: z
    .string()
    .optional()
    .default(''),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .optional()
    .default(''),

  // Privacy - Optional with auto-generated fallback
  ANONYMIZATION_SECRET: z
    .string()
    .min(32, 'ANONYMIZATION_SECRET must be at least 32 characters')
    .optional()
    .default('default-anonymization-secret-change-in-production-32chars'),

  // CORS - Optional with defaults
  ALLOWED_ORIGINS: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') {
        // Default to localhost in development
        return process.env.NODE_ENV === 'development'
          ? ['http://localhost:3000']
          : [];
      }
      return val.split(',').map((origin) => origin.trim()).filter(Boolean);
    }),

  // Optional settings
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .optional()
    .default('http://localhost:3000'),
});

/**
 * Type for the validated environment
 */
export type Env = z.infer<typeof envSchema>;

// Cache the validated env
let _validatedEnv: Env | null = null;

/**
 * Parse and validate environment variables.
 * Called lazily on first access to avoid build-time failures.
 */
function validateEnv(): Env {
  // Skip validation during build time (Next.js sets this)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    // Return dummy values during build - actual validation happens at runtime
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_placeholder',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || 'sk_placeholder',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      ANONYMIZATION_SECRET: process.env.ANONYMIZATION_SECRET || 'default-anonymization-secret-change-in-production-32chars',
      ALLOWED_ORIGINS: [],
      NODE_ENV: 'development',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    };
  }

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    ANONYMIZATION_SECRET: process.env.ANONYMIZATION_SECRET,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `  - ${path}: ${issue.message}`;
    });

    console.error('\n========================================');
    console.error('ENVIRONMENT VALIDATION FAILED');
    console.error('========================================');
    console.error('\nThe following environment variables are missing or invalid:\n');
    console.error(errors.join('\n'));
    console.error('\nPlease check your .env.local file and ensure all required');
    console.error('environment variables are set correctly.');
    console.error('========================================\n');

    // Throw error to prevent startup with missing env vars
    throw new Error(
      `Environment validation failed:\n${errors.join('\n')}`
    );
  }

  return parsed.data;
}

/**
 * Get validated environment variables.
 * Validates on first access and caches the result.
 */
export function getEnv(): Env {
  if (!_validatedEnv) {
    _validatedEnv = validateEnv();
  }
  return _validatedEnv;
}

/**
 * Validated environment variables (lazy getter).
 * Accessing any property will trigger validation.
 */
export const env = new Proxy({} as Env, {
  get(_target, prop: keyof Env) {
    return getEnv()[prop];
  },
});

/**
 * Helper to check if we're in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/**
 * Helper to check if we're in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

/**
 * Get allowed origins for CORS
 */
export function getAllowedOrigins(): string[] {
  return getEnv().ALLOWED_ORIGINS || [];
}

/**
 * Check if an origin is allowed for CORS
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowed = getAllowedOrigins();

  // In development, also allow localhost variations
  if (isDevelopment()) {
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return true;
    }
  }

  return allowed.includes(origin);
}
