/**
 * Student Metrics API
 * ===================
 *
 * GET /api/schools/[schoolId]/students/metrics - Get student metrics for a school
 *
 * T1 Security: FERPA audit logging on all student data access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudentMetrics } from '@/lib/db/queries/students';
import { authenticateSchoolRequest, type RiskRouteParams } from '../../risk/_shared/auth';
import { logMetricsAccess } from '@/lib/compliance/ferpa-audit';

/**
 * GET /api/schools/[schoolId]/students/metrics
 * Get aggregate metrics for students in a school
 */
export async function GET(request: NextRequest, { params }: RiskRouteParams) {
  try {
    const { schoolId } = await params;

    // Authenticate request
    const authResult = await authenticateSchoolRequest({ schoolId });
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    const metrics = await getStudentMetrics(schoolId);

    // FERPA Audit: Log metrics access (aggregate data, no specific students)
    await logMetricsAccess(schoolId, userId);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching student metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student metrics' },
      { status: 500 }
    );
  }
}
