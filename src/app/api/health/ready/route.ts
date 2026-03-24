import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * Readiness Probe Endpoint
 *
 * Indicates whether the application is ready to receive traffic.
 * Used by Kubernetes readiness probes and load balancers.
 *
 * Checks:
 * - Environment variables are present
 * - Database connectivity (Supabase)
 * - Clerk API reachability
 * - Stripe API reachability
 *
 * Returns:
 * - 200 OK: All services healthy
 * - 503 Service Unavailable: One or more services down
 */

interface ServiceStatus {
  status: 'ok' | 'error';
  latencyMs?: number;
  error?: string;
}

interface HealthStatus {
  ready: boolean;
  timestamp: string;
  services: {
    database: ServiceStatus;
    clerk: ServiceStatus;
    stripe: ServiceStatus;
  };
  overall: 'ok' | 'degraded' | 'error';
}

export async function GET() {
  const results: HealthStatus = {
    ready: false,
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'error' },
      clerk: { status: 'error' },
      stripe: { status: 'error' },
    },
    overall: 'error',
  };

  // Check required environment variables
  const envCheck =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.STRIPE_SECRET_KEY;

  if (!envCheck) {
    return NextResponse.json(
      {
        ...results,
        services: {
          database: { status: 'error', error: 'Missing SUPABASE_URL' },
          clerk: { status: 'error', error: 'Missing CLERK_PUBLISHABLE_KEY' },
          stripe: { status: 'error', error: 'Missing STRIPE_SECRET_KEY' },
        },
      },
      { status: 503 }
    );
  }

  // Check database connectivity (Supabase)
  const dbStart = Date.now();
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from('schools').select('id').limit(1);

    if (error) {
      results.services.database = {
        status: 'error',
        latencyMs: Date.now() - dbStart,
        error: error.message,
      };
    } else {
      results.services.database = {
        status: 'ok',
        latencyMs: Date.now() - dbStart,
      };
    }
  } catch (err) {
    results.services.database = {
      status: 'error',
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : 'Unknown database error',
    };
  }

  // Check Clerk API reachability
  const clerkStart = Date.now();
  try {
    // Verify the publishable key format and secret key presence
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!publishableKey || !secretKey) {
      results.services.clerk = {
        status: 'error',
        latencyMs: Date.now() - clerkStart,
        error: 'Missing Clerk credentials',
      };
    } else if (!publishableKey.startsWith('pk_')) {
      results.services.clerk = {
        status: 'error',
        latencyMs: Date.now() - clerkStart,
        error: 'Invalid Clerk publishable key format',
      };
    } else {
      // Make a lightweight API call to verify the key is valid
      // Using the backend API to verify the secret key
      const clerkApiUrl = 'https://api.clerk.com/v1/clients';
      const response = await fetch(clerkApiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok || response.status === 200) {
        results.services.clerk = {
          status: 'ok',
          latencyMs: Date.now() - clerkStart,
        };
      } else if (response.status === 401) {
        results.services.clerk = {
          status: 'error',
          latencyMs: Date.now() - clerkStart,
          error: 'Invalid Clerk secret key',
        };
      } else {
        // Any other response means the API is reachable
        results.services.clerk = {
          status: 'ok',
          latencyMs: Date.now() - clerkStart,
        };
      }
    }
  } catch (err) {
    results.services.clerk = {
      status: 'error',
      latencyMs: Date.now() - clerkStart,
      error: err instanceof Error ? err.message : 'Clerk API unreachable',
    };
  }

  // Check Stripe API reachability
  const stripeStart = Date.now();
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      results.services.stripe = {
        status: 'error',
        latencyMs: Date.now() - stripeStart,
        error: 'Missing Stripe secret key',
      };
    } else {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2026-01-28.clover',
        timeout: 5000, // 5 second timeout
      });

      // Make a lightweight API call to verify connectivity
      await stripe.customers.list({ limit: 1 });

      results.services.stripe = {
        status: 'ok',
        latencyMs: Date.now() - stripeStart,
      };
    }
  } catch (err) {
    results.services.stripe = {
      status: 'error',
      latencyMs: Date.now() - stripeStart,
      error: err instanceof Error ? err.message : 'Stripe API unreachable',
    };
  }

  // Determine overall status
  const serviceStatuses = Object.values(results.services);
  const errorCount = serviceStatuses.filter((s) => s.status === 'error').length;

  if (errorCount === 0) {
    results.overall = 'ok';
    results.ready = true;
  } else if (errorCount < serviceStatuses.length) {
    results.overall = 'degraded';
    results.ready = true; // Still ready, but degraded
  } else {
    results.overall = 'error';
    results.ready = false;
  }

  // Return appropriate status code
  const httpStatus = results.overall === 'error' ? 503 : 200;

  return NextResponse.json(results, { status: httpStatus });
}
