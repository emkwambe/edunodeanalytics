/**
 * Reports API
 * ===========
 *
 * Endpoints for generating and managing reports.
 *
 * POST /api/reports - Generate a new report
 * GET /api/reports - List recent reports for a school
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  createReportGenerator,
  REPORT_TEMPLATES,
  type ReportType,
  type ReportFormat,
} from '@/lib/reports/generator';
import { hasFeatureAccess } from '@/lib/features/feature-gates';
import { captureException } from '@/lib/monitoring/sentry';

// In-memory report storage (in production, use database)
const reportStorage = new Map<string, {
  id: string;
  schoolId: string;
  type: ReportType;
  format: ReportFormat;
  title: string;
  generatedAt: Date;
  generatedBy: string;
  data: unknown;
}>();

/**
 * POST /api/reports
 * Generate a new report
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      schoolId,
      schoolSlug,
      type,
      format = 'json',
      dateRange,
      filters,
      options,
      subscriptionTier = 'starter',
    } = body;

    if (!schoolId || !schoolSlug || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: schoolId, schoolSlug, type' },
        { status: 400 }
      );
    }

    // Validate report type
    const template = REPORT_TEMPLATES[type as ReportType];
    if (!template) {
      return NextResponse.json(
        { error: `Invalid report type: ${type}` },
        { status: 400 }
      );
    }

    // Check tier access
    if (!hasFeatureAccess(subscriptionTier, 'api_access') && template.requiredTier !== 'starter') {
      return NextResponse.json(
        {
          error: `Report type '${type}' requires ${template.requiredTier} plan or higher`,
          requiredTier: template.requiredTier,
        },
        { status: 403 }
      );
    }

    // Generate report
    const generator = createReportGenerator(schoolId, schoolSlug);

    const report = await generator.generate(
      {
        type: type as ReportType,
        schoolId,
        schoolSlug,
        format: format as ReportFormat,
        dateRange: dateRange
          ? {
              start: new Date(dateRange.start),
              end: new Date(dateRange.end),
            }
          : undefined,
        filters,
        options,
      },
      userId
    );

    // Store report for later retrieval
    reportStorage.set(report.id, {
      id: report.id,
      schoolId: report.schoolId,
      type: report.type,
      format: report.format,
      title: report.title,
      generatedAt: report.generatedAt,
      generatedBy: report.generatedBy,
      data: report.data,
    });

    return NextResponse.json({
      id: report.id,
      type: report.type,
      format: report.format,
      title: report.title,
      generatedAt: report.generatedAt,
      downloadUrl: report.downloadUrl,
      data: format === 'json' ? report.data : undefined,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    captureException(error, { route: 'POST /api/reports' });

    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports
 * List recent reports for a school
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = request.nextUrl.searchParams.get('schoolId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);

    if (!schoolId) {
      return NextResponse.json(
        { error: 'Missing required parameter: schoolId' },
        { status: 400 }
      );
    }

    // Get reports for school from storage
    const reports = Array.from(reportStorage.values())
      .filter((r) => r.schoolId === schoolId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        type: r.type,
        format: r.format,
        title: r.title,
        generatedAt: r.generatedAt,
        generatedBy: r.generatedBy,
      }));

    // Also return available report templates
    const templates = Object.entries(REPORT_TEMPLATES).map(([key, value]) => ({
      type: key,
      ...value,
    }));

    return NextResponse.json({
      reports,
      templates,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    captureException(error, { route: 'GET /api/reports' });

    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
