import { NextResponse } from 'next/server';

/**
 * Lightweight Ping Endpoint for Uptime Monitoring
 *
 * Designed for external uptime monitors (Better Uptime, UptimeRobot, etc.)
 *
 * Characteristics:
 * - No authentication required
 * - No database calls
 * - Minimal processing
 * - Fast response time
 *
 * Returns:
 * - 200 OK with { status: "ok", timestamp: ISO string }
 *
 * Usage:
 * Configure your external uptime monitor to hit this endpoint every 1-5 minutes.
 * Alert if the endpoint returns non-200 or times out.
 */

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        // Prevent caching to ensure fresh checks
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    }
  );
}

// Also support HEAD requests for even lighter checks
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}
