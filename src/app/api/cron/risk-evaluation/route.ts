// src/app/api/cron/risk-evaluation/route.ts
/**
 * Nightly Risk Evaluation Cron
 * ============================
 *
 * GET endpoint designed to be triggered by Vercel Cron or external scheduler.
 * Iterates all active schools and runs the full risk evaluation pipeline.
 *
 * Schedule: Daily at 2:00 AM UTC (configured in vercel.json)
 *
 * Security: Validates CRON_SECRET header to prevent unauthorized execution.
 *
 * Monitoring: Sentry cron check-in for alerting if job stops running.
 *
 * Pattern: Matches existing cron routes:
 *   - /api/cron/sync-rosters
 *   - /api/cron/stale-interventions
 *   - /api/cron/scheduled-reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { evaluateSchoolRisk } from '@/lib/risk-engine/orchestrator';
import type { BatchEvaluationResult } from '@/lib/risk-engine/orchestrator';
import {
  captureException,
  cronCheckInStart,
  cronCheckInComplete,
  addBreadcrumb,
} from '@/lib/monitoring/sentry';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for batch processing

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Start Sentry cron check-in
  const checkInId = cronCheckInStart('risk-evaluation');

  // -------------------------------------------------------
  // 1. Verify cron authorization
  // -------------------------------------------------------
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow if CRON_SECRET is set and matches, OR if called from Vercel Cron
  const vercelCronHeader = request.headers.get('x-vercel-cron');

  if (!vercelCronHeader) {
    // Not a Vercel Cron call — check bearer token
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      cronCheckInComplete(checkInId, 'risk-evaluation', 'error', Date.now() - startTime);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  console.log('[Cron:RiskEvaluation] Starting nightly risk evaluation batch');
  addBreadcrumb({
    category: 'cron',
    message: 'Starting nightly risk evaluation',
    level: 'info',
  });

  try {
    // -------------------------------------------------------
    // 2. Fetch all active schools
    // -------------------------------------------------------
    const supabase = createAdminSupabaseClient();

    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, slug')
      .eq('is_active', true);

    if (schoolsError) {
      console.error('[Cron:RiskEvaluation] Failed to fetch schools:', schoolsError.message);
      captureException(new Error(`Failed to fetch active schools: ${schoolsError.message}`), {
        cronJob: 'risk-evaluation',
        phase: 'fetch_schools',
      });
      cronCheckInComplete(checkInId, 'risk-evaluation', 'error', Date.now() - startTime);
      return NextResponse.json(
        { error: 'Failed to fetch active schools', detail: schoolsError.message },
        { status: 500 }
      );
    }

    if (!schools || schools.length === 0) {
      console.log('[Cron:RiskEvaluation] No active schools found');
      cronCheckInComplete(checkInId, 'risk-evaluation', 'ok', Date.now() - startTime);
      return NextResponse.json({
        message: 'No active schools to evaluate',
        schools: 0,
        durationMs: Date.now() - startTime,
      });
    }

    console.log(`[Cron:RiskEvaluation] Processing ${schools.length} schools`);
    addBreadcrumb({
      category: 'cron',
      message: `Processing ${schools.length} schools`,
      level: 'info',
      data: { schoolCount: schools.length },
    });

    // -------------------------------------------------------
    // 3. Run evaluation for each school
    // -------------------------------------------------------
    const results: Array<{
      schoolId: string;
      schoolName: string;
      result: BatchEvaluationResult;
    }> = [];

    for (const school of schools) {
      try {
        console.log(`[Cron:RiskEvaluation] Evaluating: ${school.name} (${school.id})`);
        addBreadcrumb({
          category: 'cron',
          message: `Evaluating school: ${school.name}`,
          level: 'info',
          data: { schoolId: school.id, schoolSlug: school.slug },
        });

        const result = await evaluateSchoolRisk(school.id, 'batch_nightly');

        results.push({
          schoolId: school.id,
          schoolName: school.name,
          result,
        });

        // Log to audit trail
        await supabase.from('audit_logs').insert({
          school_id: school.id,
          action: 'risk_evaluation_batch',
          resource_type: 'cron',
          resource_id: 'risk-evaluation',
          metadata: {
            trigger: 'nightly_cron',
            studentsEvaluated: result.evaluation.studentsEvaluated,
            alertsGenerated: result.alerts.alertsGenerated,
            levelChanges: result.evaluation.levelChanges,
            durationMs: result.durationMs,
            success: result.success,
            errorCount: result.errors.length,
          },
        });

        // Capture any per-school errors to Sentry
        if (!result.success && result.errors.length > 0) {
          captureException(new Error(`Risk evaluation failed for ${school.name}`), {
            schoolId: school.id,
            schoolName: school.name,
            errors: result.errors,
            cronJob: 'risk-evaluation',
          });
        }
      } catch (schoolErr) {
        const msg = schoolErr instanceof Error ? schoolErr.message : String(schoolErr);
        console.error(`[Cron:RiskEvaluation] Error for ${school.name}:`, msg);

        // Capture per-school exception to Sentry
        captureException(schoolErr, {
          schoolId: school.id,
          schoolName: school.name,
          cronJob: 'risk-evaluation',
        });

        results.push({
          schoolId: school.id,
          schoolName: school.name,
          result: {
            schoolId: school.id,
            triggerType: 'batch_nightly',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: 0,
            aggregation: { studentsProcessed: 0, metricsUpserted: 0, historySnapshotted: 0, errors: [msg] },
            evaluation: { studentsEvaluated: 0, distribution: { on_track: 0, watch: 0, at_risk: 0, critical: 0 }, levelChanges: 0, errors: [msg] },
            alerts: { studentsChecked: 0, alertsGenerated: 0, errors: [] },
            trends: { studentsAnalyzed: 0, decliningCount: 0, improvingCount: 0, earlyWarnings: 0, errors: [] },
            success: false,
            errors: [msg],
          },
        });
      }
    }

    // -------------------------------------------------------
    // 4. Build summary
    // -------------------------------------------------------
    const totalDurationMs = Date.now() - startTime;
    const successCount = results.filter((r) => r.result.success).length;
    const totalStudents = results.reduce((sum, r) => sum + r.result.evaluation.studentsEvaluated, 0);
    const totalAlerts = results.reduce((sum, r) => sum + r.result.alerts.alertsGenerated, 0);
    const totalLevelChanges = results.reduce((sum, r) => sum + r.result.evaluation.levelChanges, 0);

    const summary = {
      message: 'Nightly risk evaluation complete',
      timestamp: new Date().toISOString(),
      durationMs: totalDurationMs,
      schools: {
        total: schools.length,
        successful: successCount,
        failed: schools.length - successCount,
      },
      totals: {
        studentsEvaluated: totalStudents,
        alertsGenerated: totalAlerts,
        levelChanges: totalLevelChanges,
      },
      results: results.map((r) => ({
        schoolId: r.schoolId,
        schoolName: r.schoolName,
        success: r.result.success,
        studentsEvaluated: r.result.evaluation.studentsEvaluated,
        alertsGenerated: r.result.alerts.alertsGenerated,
        levelChanges: r.result.evaluation.levelChanges,
        durationMs: r.result.durationMs,
        errors: r.result.errors,
      })),
    };

    console.log(
      `[Cron:RiskEvaluation] Complete: ${successCount}/${schools.length} schools, ` +
      `${totalStudents} students, ${totalAlerts} alerts in ${totalDurationMs}ms`
    );

    // Complete Sentry cron check-in
    const cronStatus = successCount === schools.length ? 'ok' : 'error';
    cronCheckInComplete(checkInId, 'risk-evaluation', cronStatus, totalDurationMs);

    return NextResponse.json(summary);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Cron:RiskEvaluation] Fatal error:', msg);

    // Capture fatal error to Sentry
    captureException(err, {
      cronJob: 'risk-evaluation',
      phase: 'fatal',
    });

    // Complete Sentry cron check-in with error
    cronCheckInComplete(checkInId, 'risk-evaluation', 'error', Date.now() - startTime);

    return NextResponse.json(
      { error: 'Cron execution failed', detail: msg },
      { status: 500 }
    );
  }
}
