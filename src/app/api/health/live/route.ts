import { NextResponse } from 'next/server';

/**
 * Liveness Probe Endpoint
 *
 * Indicates whether the application is running.
 * Used by Kubernetes liveness probes.
 * Should always return 200 if the process is alive.
 */

export async function GET() {
  return NextResponse.json(
    {
      alive: true,
      timestamp: new Date().toISOString(),
      pid: process.pid,
    },
    { status: 200 }
  );
}
