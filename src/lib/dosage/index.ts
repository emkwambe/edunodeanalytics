/**
 * Dosage Analysis Module
 * ======================
 *
 * Tracks intervention dosage (session delivery, compliance, fidelity)
 * and provides inference rules to detect delivery issues.
 *
 * Usage:
 * ```typescript
 * import { createDosageAnalyzer } from '@/lib/dosage';
 *
 * const analyzer = createDosageAnalyzer(schoolId);
 *
 * // Analyze single intervention
 * const result = await analyzer.analyzeIntervention(interventionId);
 *
 * // Get school-wide summary
 * const summary = await analyzer.analyzeSchool();
 *
 * // Compute metrics after session updates
 * await analyzer.computeMetrics(interventionId);
 *
 * // Log a session
 * await analyzer.logSession({
 *   sessionId,
 *   status: 'completed',
 *   actualDurationMinutes: 30,
 *   fidelityChecklist: [...],
 *   studentEngaged: true,
 * });
 *
 * // Generate schedule
 * const schedule = analyzer.generateSchedule({
 *   startDate: new Date(),
 *   endDate: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000),
 *   sessionsPerWeek: 3,
 *   minutesPerSession: 30,
 * });
 * ```
 */

export { DosageAnalyzer, createDosageAnalyzer, inferenceRules } from './dosage-analyzer';

export type {
  // Enums
  SessionStatus,
  SessionModality,
  DosageStatus,
  FidelityTrend,
  InferenceSeverity,
  InferenceRuleId,

  // Session types
  FidelityChecklistItem,
  SessionRow,
  SessionInput,
  Session,

  // Dosage metrics types
  DosageMetricsRow,
  DosageMetrics,
  DosagePlan,
  DosageActual,
  DosageCompliance,
  DosageFidelity,
  DosagePace,

  // Inference types
  InferenceFlag,
  InferenceRule,

  // Analysis types
  DosageAnalysisResult,
  SchoolDosageSummary,

  // Scheduling types
  ScheduleOptions,
  GeneratedSchedule,

  // API types
  DosageQueryParams,
  SessionLogInput,
} from './types';
