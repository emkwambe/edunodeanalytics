/**
 * At-Risk Students API
 * ====================
 *
 * GET /api/schools/[schoolId]/students/at-risk - Get at-risk students
 *
 * T1 Security: FERPA audit logging on all student data access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudentsAtRisk, type StudentQueryOptions } from '@/lib/db/queries/students';
import { authenticateSchoolRequest, type RiskRouteParams } from '../../risk/_shared/auth';
import { logStudentListAccess } from '@/lib/compliance/ferpa-audit';

/**
 * GET /api/schools/[schoolId]/students/at-risk
 * Get students who are at risk (risk_level = 'at_risk' or 'critical')
 */
export async function GET(request: NextRequest, { params }: RiskRouteParams) {
  try {
    const { schoolId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Authenticate request
    const authResult = await authenticateSchoolRequest({ schoolId });
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    // Build query options from search params
    const options: Omit<StudentQueryOptions, 'riskLevel'> = {};

    // Pagination
    const limit = searchParams.get('limit');
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get('offset');
    if (offset) {
      options.offset = parseInt(offset, 10);
    }

    // Sorting
    const sortBy = searchParams.get('sortBy');
    if (sortBy) {
      options.sortBy = sortBy as StudentQueryOptions['sortBy'];
    }

    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder === 'asc' || sortOrder === 'desc') {
      options.sortOrder = sortOrder;
    }

    // Additional filtering
    const gradeLevel = searchParams.get('gradeLevel');
    if (gradeLevel) {
      options.gradeLevel = parseInt(gradeLevel, 10);
    }

    const teacherName = searchParams.get('teacherName');
    if (teacherName) {
      options.teacherName = teacherName;
    }

    const result = await getStudentsAtRisk(schoolId, options);

    // FERPA Audit: Log at-risk students access
    const studentIds = result.data.map((s) => s.id);
    await logStudentListAccess(schoolId, userId, studentIds, 'view_at_risk');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching at-risk students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch at-risk students' },
      { status: 500 }
    );
  }
}
