import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 *
 * Returns application health status for:
 * - Load balancers
 * - Kubernetes probes
 * - Monitoring systems
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
    auth: 'ok' | 'error';
    cache: 'ok' | 'error' | 'not_configured';
  };
}

export async function GET() {
  const startTime = process.hrtime();

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: process.uptime(),
    checks: {
      database: 'ok',
      auth: 'ok',
      cache: 'not_configured',
    },
  };

  // Check Supabase connection
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });
      health.checks.database = response.ok ? 'ok' : 'error';
    }
  } catch {
    health.checks.database = 'error';
    health.status = 'degraded';
  }

  // Check Clerk auth
  try {
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    health.checks.auth = clerkKey ? 'ok' : 'error';
  } catch {
    health.checks.auth = 'error';
    health.status = 'degraded';
  }

  // Calculate response time
  const [seconds, nanoseconds] = process.hrtime(startTime);
  const responseTimeMs = seconds * 1000 + nanoseconds / 1000000;

  // Determine overall status
  if (health.checks.database === 'error' || health.checks.auth === 'error') {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(
    {
      ...health,
      responseTimeMs: Math.round(responseTimeMs * 100) / 100,
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
