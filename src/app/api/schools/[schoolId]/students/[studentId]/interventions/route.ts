/**
 * Student Interventions API
 * =========================
 *
 * GET /api/schools/[schoolId]/students/[studentId]/interventions - Get interventions for a student
 *
 * T1 Security: FERPA audit logging on all student data access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInterventionsForStudent } from '@/lib/db/queries/interventions';
import { authenticateSchoolRequest } from '../../../risk/_shared/auth';
import { logInterventionsAccess } from '@/lib/compliance/ferpa-audit';

interface RouteParams {
  params: Promise<{ schoolId: string; studentId: string }>;
}

/**
 * GET /api/schools/[schoolId]/students/[studentId]/interventions
 * Get all interventions for a specific student
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId, studentId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Authenticate request
    const authResult = await authenticateSchoolRequest({ schoolId });
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

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

    // FERPA Audit: Log interventions access
    await logInterventionsAccess(schoolId, userId, studentId);

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
