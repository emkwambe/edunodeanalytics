import { NextRequest, NextResponse } from 'next/server';
import { getStudentsBySchool } from '@/lib/db/queries/students';
import { exportStudentsToCSV } from '@/lib/export';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId } = await params;
    const searchParams = request.nextUrl.searchParams;

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
