/**
 * School Metrics API
 * ==================
 *
 * GET /api/schools/[schoolId]/metrics - Get metrics for a school
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSchoolById, getSchoolMetrics } from '@/lib/db/queries/schools';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/schools/[schoolId]/metrics
 * Get metrics for a school
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId } = await params;

    // Check if school exists first
    const school = await getSchoolById(schoolId);

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const metrics = await getSchoolMetrics(schoolId);

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching school metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school metrics' },
      { status: 500 }
    );
  }
}
