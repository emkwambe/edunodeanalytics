/**
 * Student Interventions API
 * =========================
 *
 * GET /api/schools/[schoolId]/students/[studentId]/interventions - Get interventions for a student
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInterventionsForStudent } from '@/lib/db/queries/interventions';

interface RouteParams {
  params: Promise<{ schoolId: string; studentId: string }>;
}

/**
 * GET /api/schools/[schoolId]/students/[studentId]/interventions
 * Get all interventions for a specific student
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { studentId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Filter by status if provided
    const status = searchParams.get('status') as
      | 'planned'
      | 'in_progress'
      | 'completed'
      | 'cancelled'
      | null;

    const interventions = await getInterventionsForStudent(studentId);

    // Filter by status if provided
    let filteredInterventions = interventions;
    if (status) {
      filteredInterventions = interventions.filter(
        (intervention) => intervention.status === status
      );
    }

    return NextResponse.json({
      data: filteredInterventions,
      total: filteredInterventions.length,
    });
  } catch (error) {
    console.error('Error fetching student interventions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student interventions' },
      { status: 500 }
    );
  }
}
