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
 * Pattern: Matches existing cron routes:
 *   - /api/cron/sync-rosters
 *   - /api/cron/stale-interventions
 *   - /api/cron/scheduled-reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { evaluateSchoolRisk } from '@/lib/risk-engine/orchestrator';
import type { BatchEvaluationResult } from '@/lib/risk-engine/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for batch processing

export async function GET(request: NextRequest) {
  const startTime = Date.now();

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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  console.log('[Cron:RiskEvaluation] Starting nightly risk evaluation batch');

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
      return NextResponse.json(
        { error: 'Failed to fetch active schools', detail: schoolsError.message },
        { status: 500 }
      );
    }

    if (!schools || schools.length === 0) {
      console.log('[Cron:RiskEvaluation] No active schools found');
      return NextResponse.json({
        message: 'No active schools to evaluate',
        schools: 0,
        durationMs: Date.now() - startTime,
      });
    }

    console.log(`[Cron:RiskEvaluation] Processing ${schools.length} schools`);

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
      } catch (schoolErr) {
        const msg = schoolErr instanceof Error ? schoolErr.message : String(schoolErr);
        console.error(`[Cron:RiskEvaluation] Error for ${school.name}:`, msg);

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

    return NextResponse.json(summary);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Cron:RiskEvaluation] Fatal error:', msg);
    return NextResponse.json(
      { error: 'Cron execution failed', detail: msg },
      { status: 500 }
    );
  }
}