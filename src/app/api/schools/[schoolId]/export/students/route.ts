/**
 * Student Export API
 * ==================
 *
 * GET /api/schools/[schoolId]/export/students - Export students to CSV
 *
 * T1 Security: FERPA audit logging on all student data exports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudentsBySchool } from '@/lib/db/queries/students';
import { exportStudentsToCSV } from '@/lib/export';
import { checkApiRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit';
import { authenticateSchoolRequest, type RiskRouteParams } from '../../risk/_shared/auth';
import { logStudentListAccess } from '@/lib/compliance/ferpa-audit';

export async function GET(request: NextRequest, { params }: RiskRouteParams) {
  // Rate limiting for export endpoints (expensive operations)
  const rateLimitResult = await checkApiRateLimit(request, RATE_LIMITS.export);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const { schoolId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Authenticate request
    const authResult = await authenticateSchoolRequest({ schoolId });
    if (authResult instanceof NextResponse) return authResult;
    const { userId } = authResult;

    // Get filter options from query params
    const gradeLevel = searchParams.get('gradeLevel');
    const riskLevel = searchParams.get('riskLevel') as 'on_track' | 'at_risk' | 'critical' | null;
    const teacherName = searchParams.get('teacherName');

    // Fetch all students (no pagination for export)
    const result = await getStudentsBySchool(schoolId, {
      limit: 10000, // High limit for export
      gradeLevel: gradeLevel ? parseInt(gradeLevel, 10) : undefined,
      riskLevel: riskLevel ?? undefined,
      teacherName: teacherName ?? undefined,
    });

    // FERPA Audit: Log student export (critical for compliance)
    const studentIds = result.data.map((s) => s.id);
    await logStudentListAccess(schoolId, userId, studentIds, 'export_students');

    const csv = exportStudentsToCSV(result.data);
    const filename = `students-${schoolId}-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting students:', error);
    return NextResponse.json(
      { error: 'Failed to export students' },
      { status: 500 }
    );
  }
}
