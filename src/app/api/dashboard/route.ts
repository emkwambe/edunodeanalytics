import { NextRequest, NextResponse } from 'next/server';
import { getSchoolById, getSchoolMetrics } from '@/lib/db/queries/schools';
import { getStudentMetrics } from '@/lib/db/queries/students';
import { getInterventionStats } from '@/lib/db/queries/interventions';

export interface DashboardMetrics {
  school: {
    id: string;
    name: string;
    studentCount: number;
    teacherCount: number;
    attendanceRate: number;
    gpa: number;
    graduationRate: number;
  };
  students: {
    total: number;
    active: number;
    riskDistribution: {
      onTrack: number;
      atRisk: number;
      critical: number;
    };
    attendanceRate: number;
    chronicAbsenceRate: number;
    avgGrowthScore: number;
    avgProficiencyScore: number;
  };
  interventions: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    successRate: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    activeCount: number;
    averageDurationDays: number | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'Missing required parameter: schoolId' },
        { status: 400 }
      );
    }

    // Verify school exists
    const school = await getSchoolById(schoolId);
    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Fetch all metrics in parallel
    const [schoolMetrics, studentMetrics, interventionStats] = await Promise.all([
      getSchoolMetrics(schoolId),
      getStudentMetrics(schoolId),
      getInterventionStats(schoolId),
    ]);

    const dashboard: DashboardMetrics = {
      school: {
        id: school.id,
        name: school.name,
        studentCount: schoolMetrics?.totalStudents ?? 0,
        teacherCount: schoolMetrics?.totalTeachers ?? 0,
        attendanceRate: schoolMetrics?.averageAttendance ?? 0,
        gpa: schoolMetrics?.averageGpa ?? 0,
        graduationRate: schoolMetrics?.graduationRate ?? 0,
      },
      students: {
        total: studentMetrics?.totalStudents ?? 0,
        active: studentMetrics?.activeStudents ?? 0,
        riskDistribution: {
          onTrack: studentMetrics?.riskDistribution.onTrack ?? 0,
          atRisk: studentMetrics?.riskDistribution.atRisk ?? 0,
          critical: studentMetrics?.riskDistribution.critical ?? 0,
        },
        attendanceRate: studentMetrics?.averageAttendanceRate ?? 0,
        chronicAbsenceRate: studentMetrics?.chronicAbsenceRate ?? 0,
        avgGrowthScore: studentMetrics?.averageGrowthPercentile ?? 0,
        avgProficiencyScore: studentMetrics?.averageProficiencyLevel ?? 0,
      },
      interventions: {
        total: interventionStats?.total ?? 0,
        pending: interventionStats?.byStatus['planned'] ?? 0,
        inProgress: interventionStats?.byStatus['in_progress'] ?? 0,
        completed: interventionStats?.completedCount ?? 0,
        successRate: interventionStats?.successRate ?? 0,
        byType: interventionStats?.byType ?? {},
        byStatus: interventionStats?.byStatus ?? {},
        activeCount: interventionStats?.activeCount ?? 0,
        averageDurationDays: interventionStats?.averageDurationDays ?? null,
      },
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}
