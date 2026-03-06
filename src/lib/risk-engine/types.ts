/**
 * Risk Engine Database Types
 * ==========================
 *
 * Bridge types mapping the risk engine database tables
 * (Sprint 1A migration 00006) to TypeScript interfaces.
 *
 * These types are used by:
 *   - detection-engine.ts (RiskDetectionEngine)
 *   - early-warning.ts (EarlyWarningSystem)
 *   - Future: risk API routes, dashboard components
 *
 * Tables mapped:
 *   - risk_model_configs  -> RiskModelConfigRow
 *   - student_metrics     -> StudentMetricsRow
 *   - student_metric_history -> StudentMetricHistoryRow
 *   - risk_evaluations    -> RiskEvaluationRow
 *   - risk_alerts         -> RiskAlertRow
 *   - current_risk_scores -> CurrentRiskScoreRow (view)
 */

// ============================================================
// ENUMS (matching Postgres enums and CHECK constraints)
// ============================================================

/** Risk levels - matches public.risk_level enum */
export type RiskLevel = 'on_track' | 'watch' | 'at_risk' | 'critical';

/** Evaluation trigger types */
export type TriggerType = 'sync_event' | 'batch_nightly' | 'manual' | 'config_change';

/** Trajectory direction */
export type Trajectory = 'improving' | 'stable' | 'declining';

/** Alert types - matches risk_alerts.alert_type CHECK */
export type AlertType =
  | 'threshold_breach'
  | 'rapid_decline'
  | 'chronic_absence'
  | 'intervention_overdue'
  | 'new_risk_detected'
  | 'trend_warning'
  | 'attendance_drop'
  | 'grade_decline'
  | 'consecutive_absences';

/** Alert severity - matches risk_alerts.severity CHECK */
export type AlertSeverity = 'info' | 'warning' | 'urgent' | 'critical';

/** Alert workflow status - matches risk_alerts.status CHECK */
export type AlertStatus = 'new' | 'acknowledged' | 'in_review' | 'resolved' | 'dismissed';


// ============================================================
// RISK MODEL CONFIGURATION (risk_model_configs table)
// ============================================================

/** Row from risk_model_configs table */
export interface RiskModelConfigRow {
  id: string;
  school_id: string;
  name: string;
  is_active: boolean;

  // Indicator weights (sum to 1.0)
  weight_attendance: number;
  weight_academic: number;
  weight_assignments: number;
  weight_behavior: number;
  weight_trend: number;

  // Tier thresholds
  threshold_on_track: number;
  threshold_watch: number;
  threshold_at_risk: number;

  // Indicator-specific parameters
  attendance_floor: number;
  attendance_critical: number;
  assignment_missing_warn: number;
  behavior_incident_cap: number;
  assessment_floor_pct: number;
  trend_lookback_weeks: number;
  trend_decline_threshold: number;

  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/** Parsed config for use in the engine */
export interface RiskModelConfig {
  id: string;
  schoolId: string;
  name: string;

  weights: {
    attendance: number;
    academic: number;
    assignments: number;
    behavior: number;
    trend: number;
  };

  thresholds: {
    onTrack: number;
    watch: number;
    atRisk: number;
  };

  indicators: {
    attendanceFloor: number;
    attendanceCritical: number;
    assignmentMissingWarn: number;
    behaviorIncidentCap: number;
    assessmentFloorPct: number;
    trendLookbackWeeks: number;
    trendDeclineThreshold: number;
  };
}

/** Convert DB row to parsed config */
export function parseConfigRow(row: RiskModelConfigRow): RiskModelConfig {
  return {
    id: row.id,
    schoolId: row.school_id,
    name: row.name,
    weights: {
      attendance: Number(row.weight_attendance),
      academic: Number(row.weight_academic),
      assignments: Number(row.weight_assignments),
      behavior: Number(row.weight_behavior),
      trend: Number(row.weight_trend),
    },
    thresholds: {
      onTrack: Number(row.threshold_on_track),
      watch: Number(row.threshold_watch),
      atRisk: Number(row.threshold_at_risk),
    },
    indicators: {
      attendanceFloor: Number(row.attendance_floor),
      attendanceCritical: Number(row.attendance_critical),
      assignmentMissingWarn: Number(row.assignment_missing_warn),
      behaviorIncidentCap: Number(row.behavior_incident_cap),
      assessmentFloorPct: Number(row.assessment_floor_pct),
      trendLookbackWeeks: Number(row.trend_lookback_weeks),
      trendDeclineThreshold: Number(row.trend_decline_threshold),
    },
  };
}


// ============================================================
// STUDENT METRICS (student_metrics table)
// ============================================================

/** Row from student_metrics table */
export interface StudentMetricsRow {
  id: string;
  student_id: string;
  school_id: string;

  attendance_rate: number | null;
  attendance_trend: number | null;
  days_absent_last_30: number;
  chronic_absence_flag: boolean;

  gpa_current: number | null;
  gpa_trend: number | null;
  math_assessment_pct: number | null;
  reading_assessment_pct: number | null;
  assessment_trend: number | null;
  proficiency_level: number | null;
  growth_percentile: number | null;

  missing_assignment_rate: number | null;
  missing_assignments_count: number;
  total_assignments_count: number;
  assignment_trend: number | null;

  behavior_incident_count: number;
  behavior_incident_trend: number | null;
  suspensions_count: number;

  engagement_score: number | null;

  data_completeness: number | null;
  last_sis_sync: string | null;
  last_lms_sync: string | null;
  last_assessment_sync: string | null;

  computed_at: string;
  created_at: string;
  updated_at: string;
}


// ============================================================
// STUDENT METRIC HISTORY (student_metric_history table)
// ============================================================

/** Row from student_metric_history table */
export interface StudentMetricHistoryRow {
  id: string;
  student_id: string;
  school_id: string;
  snapshot_date: string;
  snapshot_week: number;
  snapshot_year: number;

  attendance_rate: number | null;
  gpa_current: number | null;
  math_assessment_pct: number | null;
  reading_assessment_pct: number | null;
  missing_assignment_rate: number | null;
  behavior_incident_count: number | null;
  proficiency_level: number | null;
  growth_percentile: number | null;
  engagement_score: number | null;

  created_at: string;
}


// ============================================================
// RISK EVALUATIONS (risk_evaluations table)
// ============================================================

/** Row to insert into risk_evaluations */
export interface RiskEvaluationInsert {
  student_id: string;
  school_id: string;
  config_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  previous_level: RiskLevel | null;
  level_changed: boolean;
  risk_factors: RiskFactorRecord[];
  trajectory: Trajectory;
  confidence_level: number;
  recommended_actions: string[];
  metrics_snapshot: Record<string, unknown>;
  trigger_type: TriggerType;
}

/** Row from risk_evaluations table */
export interface RiskEvaluationRow extends RiskEvaluationInsert {
  id: string;
  computed_at: string;
  created_at: string;
}

/** Risk factor stored in risk_factors JSONB */
export interface RiskFactorRecord {
  name: string;
  category: 'attendance' | 'academic' | 'behavior' | 'engagement' | 'assignments' | 'trend' | 'other';
  rawValue: number;
  normalizedScore: number;
  weight: number;
  weightedScore: number;
  description: string;
  trend: Trajectory;
}


// ============================================================
// RISK ALERTS (risk_alerts table)
// ============================================================

/** Row to insert into risk_alerts */
export interface RiskAlertInsert {
  evaluation_id?: string;
  student_id: string;
  school_id: string;
  rule_id?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  risk_score?: number;
  risk_level?: RiskLevel;
  data: Record<string, unknown>;
  cooldown_key?: string;
}

/** Row from risk_alerts table */
export interface RiskAlertRow extends RiskAlertInsert {
  id: string;
  status: AlertStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  intervention_id: string | null;
  created_at: string;
  updated_at: string;
}


// ============================================================
// CURRENT RISK SCORES VIEW (current_risk_scores)
// ============================================================

/** Row from current_risk_scores view */
export interface CurrentRiskScoreRow {
  evaluation_id: string;
  student_id: string;
  school_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  previous_level: RiskLevel | null;
  level_changed: boolean;
  risk_factors: RiskFactorRecord[];
  trajectory: Trajectory;
  confidence_level: number;
  recommended_actions: string[];
  computed_at: string;
  student_name: string;
  grade_level: number;
  first_name: string;
  last_name: string;
  is_chronically_absent: boolean | null;
  has_iep: boolean;
  has_504_plan: boolean;
}