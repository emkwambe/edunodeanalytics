/**
 * Student Metrics API
 * ===================
 *
 * GET /api/schools/[schoolId]/students/metrics - Get student metrics for a school
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudentMetrics } from '@/lib/db/queries/students';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/schools/[schoolId]/students/metrics
 * Get aggregate metrics for students in a school
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId } = await params;

    const metrics = await getStudentMetrics(schoolId);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching student metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student metrics' },
      { status: 500 }
    );
  }
}
