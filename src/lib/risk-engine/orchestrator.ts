// src/lib/risk-engine/orchestrator.ts
/**
 * Risk Engine Batch Orchestrator
 * ==============================
 *
 * Top-level orchestration function that coordinates the full risk
 * evaluation pipeline for a school:
 *
 *   1. Load active risk model config
 *   2. Run metrics aggregation (student_metrics from raw data)
 *   3. Create weekly snapshot (if nightly batch)
 *   4. Compute risk scores for all students via RiskDetectionEngine
 *   5. Run early warning checks for alert generation
 *   6. Return batch result summary
 *
 * Called by:
 *   - Nightly cron (/api/cron/risk-evaluation)
 *   - Post-sync hooks (after roster/LMS/assessment sync)
 *   - Manual admin trigger
 */

import { createRiskEngine } from '@/lib/risk/detection-engine';
import { createEarlyWarningSystem } from '@/lib/risk/early-warning';
import { aggregateSchoolMetrics } from '@/lib/risk-engine/metrics-aggregator';
import type { TriggerType, RiskLevel } from '@/lib/risk-engine/types';

// ============================================================
// Types
// ============================================================

export interface BatchEvaluationResult {
  schoolId: string;
  triggerType: TriggerType;
  startedAt: string;
  completedAt: string;
  durationMs: number;

  // Aggregation phase
  aggregation: {
    studentsProcessed: number;
    metricsUpserted: number;
    historySnapshotted: number;
    errors: string[];
  };

  // Evaluation phase
  evaluation: {
    studentsEvaluated: number;
    distribution: Record<RiskLevel, number>;
    levelChanges: number;
    errors: string[];
  };

  // Alert phase
  alerts: {
    studentsChecked: number;
    alertsGenerated: number;
    errors: string[];
  };

  // Overall
  success: boolean;
  errors: string[];
}

// ============================================================
// Main Orchestration Function
// ============================================================

/**
 * Evaluate risk for all active students in a school.
 * This is the primary entry point for batch risk processing.
 */
export async function evaluateSchoolRisk(
  schoolId: string,
  triggerType: TriggerType = 'batch_nightly'
): Promise<BatchEvaluationResult> {
  const startedAt = new Date();
  const allErrors: string[] = [];

  // Initialize result with defaults
  const result: BatchEvaluationResult = {
    schoolId,
    triggerType,
    startedAt: startedAt.toISOString(),
    completedAt: '',
    durationMs: 0,
    aggregation: {
      studentsProcessed: 0,
      metricsUpserted: 0,
      historySnapshotted: 0,
      errors: [],
    },
    evaluation: {
      studentsEvaluated: 0,
      distribution: { on_track: 0, watch: 0, at_risk: 0, critical: 0 },
      levelChanges: 0,
      errors: [],
    },
    alerts: {
      studentsChecked: 0,
      alertsGenerated: 0,
      errors: [],
    },
    success: false,
    errors: [],
  };

  try {
    // -------------------------------------------------------
    // PHASE 1: Metrics Aggregation
    // -------------------------------------------------------
    console.log(`[Orchestrator] Phase 1: Aggregating metrics for school ${schoolId}`);

    const shouldSnapshot = triggerType === 'batch_nightly';
    const aggregationResult = await aggregateSchoolMetrics(schoolId, {
      createSnapshot: shouldSnapshot,
      syncSource: triggerType === 'sync_event' ? 'sis' : 'manual',
    });

    result.aggregation = {
      studentsProcessed: aggregationResult.studentsProcessed,
      metricsUpserted: aggregationResult.metricsUpserted,
      historySnapshotted: aggregationResult.historySnapshotted,
      errors: aggregationResult.errors,
    };

    if (aggregationResult.errors.length > 0) {
      allErrors.push(...aggregationResult.errors.map((e) => `[Aggregation] ${e}`));
    }

    console.log(
      `[Orchestrator] Aggregation complete: ${aggregationResult.studentsProcessed} students, ` +
      `${aggregationResult.metricsUpserted} metrics upserted`
    );

    // If no students, short-circuit
    if (aggregationResult.studentsProcessed === 0) {
      console.log(`[Orchestrator] No active students for school ${schoolId}, skipping evaluation`);
      result.completedAt = new Date().toISOString();
      result.durationMs = Date.now() - startedAt.getTime();
      result.success = true;
      result.errors = allErrors;
      return result;
    }

    // -------------------------------------------------------
    // PHASE 2: Risk Evaluation
    // -------------------------------------------------------
    console.log(`[Orchestrator] Phase 2: Computing risk scores`);

    const engine = createRiskEngine(schoolId, {}, {}, triggerType);
    const assessments = await engine.assessAllStudents();

    // Compute distribution and level changes
    const distribution: Record<RiskLevel, number> = {
      on_track: 0,
      watch: 0,
      at_risk: 0,
      critical: 0,
    };
    let levelChanges = 0;

    for (const assessment of assessments) {
      distribution[assessment.riskLevel]++;
      if (assessment.levelChanged) {
        levelChanges++;
      }
    }

    result.evaluation = {
      studentsEvaluated: assessments.length,
      distribution,
      levelChanges,
      errors: [],
    };

    console.log(
      `[Orchestrator] Evaluation complete: ${assessments.length} students scored, ` +
      `${levelChanges} level changes`
    );

    // -------------------------------------------------------
    // PHASE 3: Early Warning Alerts
    // -------------------------------------------------------
    console.log(`[Orchestrator] Phase 3: Running early warning checks`);

    try {
      const warningSystem = createEarlyWarningSystem(schoolId);
      const alertResult = await warningSystem.runBatchCheck();

      result.alerts = {
        studentsChecked: alertResult.studentsChecked,
        alertsGenerated: alertResult.alertCount,
        errors: [],
      };

      console.log(
        `[Orchestrator] Alerts complete: ${alertResult.alertCount} alerts from ` +
        `${alertResult.studentsChecked} students`
      );
    } catch (alertErr) {
      const msg = alertErr instanceof Error ? alertErr.message : String(alertErr);
      result.alerts.errors.push(msg);
      allErrors.push(`[Alerts] ${msg}`);
      console.error(`[Orchestrator] Alert phase error:`, msg);
    }

    // -------------------------------------------------------
    // COMPLETE
    // -------------------------------------------------------
    result.success = true;

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    allErrors.push(`[Fatal] ${msg}`);
    console.error(`[Orchestrator] Fatal error for school ${schoolId}:`, msg);
  }

  result.completedAt = new Date().toISOString();
  result.durationMs = Date.now() - startedAt.getTime();
  result.errors = allErrors;

  console.log(
    `[Orchestrator] School ${schoolId} complete in ${result.durationMs}ms ` +
    `(success: ${result.success}, errors: ${allErrors.length})`
  );

  return result;
}