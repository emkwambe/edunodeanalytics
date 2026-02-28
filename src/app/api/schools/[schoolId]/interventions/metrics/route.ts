/**
 * Intervention Metrics API
 * ========================
 *
 * GET /api/schools/[schoolId]/interventions/metrics - Get intervention metrics for a school
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInterventionStats } from '@/lib/db/queries/interventions';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/schools/[schoolId]/interventions/metrics
 * Get aggregate metrics for interventions at a school
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId } = await params;

    const stats = await getInterventionStats(schoolId);

    return NextResponse.json({
      total: stats.total,
      byType: stats.byType,
      byStatus: stats.byStatus,
      successRate: stats.successRate,
      completedCount: stats.completedCount,
      successfulCount: stats.successfulCount,
      activeCount: stats.activeCount,
      averageDurationDays: stats.averageDurationDays,
    });
  } catch (error) {
    console.error('Error fetching intervention metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch intervention metrics' },
      { status: 500 }
    );
  }
}
