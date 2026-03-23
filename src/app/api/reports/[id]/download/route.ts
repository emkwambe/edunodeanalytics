/**
 * Report Download API
 * GET /api/reports/[id]/download - Download a generated report
 */

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get('format') || 'csv';

  try {
    // For now, generate CSV data inline based on report type
    // In production, this would fetch from storage (S3/Supabase Storage)

    if (format === 'csv') {
      const csvContent = generateReportCSV(id);
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${id}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (format === 'json') {
      const jsonContent = generateReportJSON(id);
      return new NextResponse(JSON.stringify(jsonContent, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="report-${id}-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    return NextResponse.json(
      { error: `Format '${format}' is not yet supported. Available: csv, json` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Report download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report download' },
      { status: 500 }
    );
  }
}

function generateReportCSV(reportId: string): string {
  // Generate sample report data based on report type
  const headers = ['Metric', 'Value', 'Target', 'Status', 'Period'];
  const rows = [
    ['Overall Enrollment', '245', '250', 'On Track', '2025-2026'],
    ['Average Attendance Rate', '93.2%', '95%', 'Warning', '2025-2026'],
    ['Chronic Absence Rate', '12.4%', '<10%', 'At Risk', '2025-2026'],
    ['Math Proficiency', '62%', '70%', 'Behind', '2025-2026'],
    ['Reading Proficiency', '68%', '70%', 'On Track', '2025-2026'],
    ['Growth Percentile (Math)', '72nd', '50th+', 'Exceeds', '2025-2026'],
    ['Growth Percentile (Reading)', '68th', '50th+', 'Exceeds', '2025-2026'],
    ['Active Interventions', '12', '-', 'Active', '2025-2026'],
    ['Intervention Success Rate', '78%', '75%', 'On Track', '2025-2026'],
    ['Teacher Retention', '88%', '85%', 'On Track', '2025-2026'],
  ];

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csv;
}

function generateReportJSON(reportId: string): object {
  return {
    reportId,
    generatedAt: new Date().toISOString(),
    metrics: {
      enrollment: { value: 245, target: 250, status: 'on_track' },
      attendanceRate: { value: 93.2, target: 95, status: 'warning' },
      chronicAbsenceRate: { value: 12.4, target: 10, status: 'at_risk' },
      mathProficiency: { value: 62, target: 70, status: 'behind' },
      readingProficiency: { value: 68, target: 70, status: 'on_track' },
      mathGrowth: { value: 72, target: 50, status: 'exceeds' },
      readingGrowth: { value: 68, target: 50, status: 'exceeds' },
      activeInterventions: { value: 12 },
      interventionSuccessRate: { value: 78, target: 75, status: 'on_track' },
      teacherRetention: { value: 88, target: 85, status: 'on_track' },
    },
  };
}
