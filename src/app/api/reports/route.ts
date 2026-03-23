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
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// Fallback in-memory storage for when database is unavailable (dev mode)
const reportStorageFallback = new Map<string, {
  id: string;
  schoolId: string;
  type: ReportType;
  format: ReportFormat;
  title: string;
  generatedAt: Date;
  generatedBy: string;
  data: unknown;
}>();

const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.EDUNODE_DEMO_MODE === 'true';

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

    // Store report - try database first, fallback to in-memory
    try {
      if (!isDemoMode) {
        const supabase = createAdminSupabaseClient();
        await (supabase as unknown as Record<string, Function>).from('generated_reports').insert({
          id: report.id,
          school_id: report.schoolId,
          report_type: report.type,
          format: report.format,
          title: report.title,
          generated_at: report.generatedAt.toISOString(),
          generated_by: report.generatedBy,
          data: report.data,
          status: 'completed',
        });
      }
    } catch {
      // Fallback to in-memory if DB insert fails
    }
    reportStorageFallback.set(report.id, {
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

    // Try database first, fallback to in-memory
    let reports: Array<{
      id: string;
      type: string;
      format: string;
      title: string;
      generatedAt: Date | string;
      generatedBy: string;
    }> = [];

    try {
      if (!isDemoMode) {
        const supabase = createAdminSupabaseClient();
        const { data: dbReports } = await (supabase as unknown as Record<string, Function>)
          .from('generated_reports')
          .select('id, report_type, format, title, generated_at, generated_by')
          .eq('school_id', schoolId)
          .order('generated_at', { ascending: false })
          .limit(limit);

        if (dbReports && dbReports.length > 0) {
          reports = dbReports.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            type: r.report_type as string,
            format: r.format as string,
            title: r.title as string,
            generatedAt: r.generated_at as string,
            generatedBy: r.generated_by as string,
          }));
        }
      }
    } catch {
      // Fallback to in-memory
    }

    // Merge in-memory reports if no DB results
    if (reports.length === 0) {
      reports = Array.from(reportStorageFallback.values())
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
    }

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
