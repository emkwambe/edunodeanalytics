import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { createReportGenerator, type ReportType, type ReportFormat } from '@/lib/reports/generator';
import { sendEmail, wrapEmailTemplate } from '@/lib/email/service';
import { captureException } from '@/lib/monitoring/sentry';

/**
 * Cron Job: Scheduled Reports
 *
 * Runs hourly to check for and generate scheduled reports.
 * Sends generated reports via email to configured recipients.
 *
 * Schedule: 0 * * * * (Every hour at minute 0)
 */

interface ScheduledReport {
  id: string;
  school_id: string;
  report_type: string;
  format: string;
  title: string;
  frequency: string;
  filters: Record<string, unknown>;
  options: Record<string, unknown>;
  recipients: Array<{ email: string; name?: string }>;
  schools: { slug: string; name: string } | null;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const stats = {
    reportsChecked: 0,
    reportsGenerated: 0,
    emailsSent: 0,
    errors: [] as string[],
  };

  try {
    const supabase = createAdminSupabaseClient();
    const now = new Date();

    // Find reports due for generation
    // Note: scheduled_reports table may not exist in all environments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dueReports, error: fetchError } = await (supabase as any)
      .from('scheduled_reports')
      .select(`
        id,
        school_id,
        report_type,
        format,
        title,
        frequency,
        filters,
        options,
        recipients,
        schools!inner (slug, name)
      `)
      .eq('is_active', true)
      .lte('next_run_at', now.toISOString())
      .order('next_run_at', { ascending: true })
      .limit(10); // Process 10 at a time

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled reports: ${fetchError.message}`);
    }

    if (!dueReports || dueReports.length === 0) {
      console.log('[CRON] No scheduled reports due');
      return NextResponse.json({
        job: 'scheduled-reports',
        status: 'completed',
        timestamp: now.toISOString(),
        duration: Date.now() - startTime,
        stats,
      });
    }

    stats.reportsChecked = dueReports.length;

    // Process each due report
    for (const report of dueReports as ScheduledReport[]) {
      try {
        const school = report.schools;
        if (!school) {
          stats.errors.push(`Report ${report.id}: No school found`);
          continue;
        }

        // Generate the report
        const generator = createReportGenerator(report.school_id, school.slug);
        const generated = await generator.generate(
          {
            type: report.report_type as ReportType,
            schoolId: report.school_id,
            schoolSlug: school.slug,
            format: report.format as ReportFormat,
            filters: report.filters as {
              gradeLevel?: number[];
              riskLevel?: string[];
              cohort?: string;
            },
            options: report.options as {
              includeCharts?: boolean;
              includeStudentDetails?: boolean;
              anonymizeNames?: boolean;
            },
          },
          'system'
        );

        stats.reportsGenerated++;

        // Store generated report
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('generated_reports').insert({
          school_id: report.school_id,
          scheduled_report_id: report.id,
          report_type: report.report_type,
          format: report.format,
          title: report.title,
          generated_by: 'system',
          delivery_status: 'pending',
        });

        // Send email to recipients
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.edunode.io';
        const reportUrl = `${baseUrl}/${school.slug}/dashboard/reports?id=${generated.id}`;

        for (const recipient of report.recipients) {
          try {
            const emailHtml = wrapEmailTemplate(
              `
              <h1>${report.title}</h1>
              <p>Your scheduled report has been generated and is ready for review.</p>
              <p><strong>Report Type:</strong> ${report.report_type}</p>
              <p><strong>Generated:</strong> ${generated.generatedAt.toLocaleString()}</p>
              <p><a href="${reportUrl}" class="button">View Report</a></p>
              <p style="color: #6b7280; font-size: 14px;">
                This report was automatically generated based on your schedule settings.
                To modify or cancel this schedule, visit your report settings.
              </p>
            `,
              school.name
            );

            const result = await sendEmail({
              to: { email: recipient.email, name: recipient.name },
              subject: `${report.title} - ${school.name}`,
              html: emailHtml,
              tags: { type: 'scheduled_report', reportType: report.report_type },
            });

            if (result.success) {
              stats.emailsSent++;
            } else {
              stats.errors.push(`Email to ${recipient.email} failed: ${result.error}`);
            }
          } catch (emailError) {
            const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
            stats.errors.push(`Email to ${recipient.email} exception: ${errorMsg}`);
            captureException(emailError, { reportId: report.id, recipient: recipient.email });
          }
        }

        // Update delivery status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('generated_reports')
          .update({
            delivery_status: stats.emailsSent > 0 ? 'sent' : 'failed',
            delivered_at: new Date().toISOString(),
          })
          .eq('id', generated.id);

        // Calculate next run time
        const nextRunAt = calculateNextRun(report.frequency, now);

        // Update scheduled report
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('scheduled_reports')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRunAt.toISOString(),
            last_error: null,
          })
          .eq('id', report.id);

      } catch (reportError) {
        const errorMsg = reportError instanceof Error ? reportError.message : 'Unknown error';
        stats.errors.push(`Report ${report.id}: ${errorMsg}`);
        captureException(reportError, { reportId: report.id });

        // Update with error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('scheduled_reports')
          .update({
            last_run_at: now.toISOString(),
            last_error: errorMsg,
          })
          .eq('id', report.id);
      }
    }

    const result = {
      job: 'scheduled-reports',
      status: stats.errors.length === 0 ? 'completed' : 'completed_with_errors',
      timestamp: now.toISOString(),
      duration: Date.now() - startTime,
      stats,
    };

    console.log('[CRON] Scheduled reports completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CRON] Scheduled reports failed:', error);
    captureException(error, { job: 'scheduled-reports' });

    return NextResponse.json(
      {
        job: 'scheduled-reports',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        stats,
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRun(frequency: string, from: Date): Date {
  const next = new Date(from);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}
