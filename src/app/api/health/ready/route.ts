import { NextResponse } from 'next/server';

/**
 * Readiness Probe Endpoint
 *
 * Indicates whether the application is ready to receive traffic.
 * Used by Kubernetes readiness probes and load balancers.
 */

export async function GET() {
  // Basic readiness check
  const isReady =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (isReady) {
    return NextResponse.json(
      { ready: true, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { ready: false, reason: 'Missing required environment variables' },
    { status: 503 }
  );
}
