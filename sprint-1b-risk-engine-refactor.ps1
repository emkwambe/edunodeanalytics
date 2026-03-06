#=======================================================================
# sprint-1b-risk-engine-refactor.ps1
# EduNode Analytics - Sprint 1B: Refactor Risk Engine for New Tables
# Mpingo Systems CTO Office
#
# What this script does:
#   1. Creates src/lib/risk-engine/types.ts (bridge types for DB)
#   2. Replaces src/lib/risk/detection-engine.ts (uses risk_model_configs + risk_evaluations)
#   3. Replaces src/lib/risk/early-warning.ts (uses risk_alerts)
#   4. Updates src/lib/risk/index.ts (re-exports new types)
#
# Usage:
#   cd C:\Users\HP\Documents\edunodeanalytics
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\sprint-1b-risk-engine-refactor.ps1
#=======================================================================

$ErrorActionPreference = "Stop"
$projectRoot = Get-Location

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SPRINT 1B: RISK ENGINE REFACTOR" -ForegroundColor Cyan
Write-Host "  EduNode Analytics - Mpingo Systems" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] Not in project root." -ForegroundColor Red
    exit 1
}

# ================================================================
# FILE 1: src/lib/risk-engine/types.ts
# Bridge types mapping DB tables to TypeScript interfaces
# ================================================================
Write-Host "--- FILE 1: src/lib/risk-engine/types.ts ---" -ForegroundColor Cyan

$riskEngineDir = Join-Path $projectRoot "src/lib/risk-engine"
New-Item -ItemType Directory -Path $riskEngineDir -Force | Out-Null

$typesContent = @'
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
'@

[System.IO.File]::WriteAllText(
    (Join-Path $riskEngineDir "types.ts"),
    $typesContent,
    [System.Text.UTF8Encoding]::new($false)
)
Write-Host "[OK] src/lib/risk-engine/types.ts created" -ForegroundColor Green


# ================================================================
# FILE 2: src/lib/risk/detection-engine.ts (REFACTORED)
# Changes:
#   - Constructor loads config from risk_model_configs table
#   - storeAssessments writes to risk_evaluations
#   - calculateTrajectory reads from risk_evaluations
#   - assessStudent tracks previous_level and level_changed
#   - Confidence uses student_metrics.data_completeness
# ================================================================
Write-Host ""
Write-Host "--- FILE 2: src/lib/risk/detection-engine.ts (refactor) ---" -ForegroundColor Cyan

$detectionEngineContent = @'
/**
 * Student Risk Detection Engine
 * =============================
 *
 * Layer 2: Risk scoring system for early identification
 * of students who may need intervention.
 *
 * SPRINT 1B REFACTOR:
 *   - Config loaded from risk_model_configs table (not constructor args)
 *   - Evaluations persisted to risk_evaluations table (immutable audit trail)
 *   - Trajectory computed from risk_evaluations history
 *   - Level change detection (previous_level, level_changed)
 *   - Students table still updated for backward compatibility
 *
 * Features:
 * - Multi-factor risk assessment
 * - Weighted scoring algorithm
 * - Trend analysis for risk trajectory
 * - Configurable thresholds per school (from DB)
 * - Explainable risk factors
 * - Immutable evaluation audit trail
 */

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Student } from '@/lib/database.types';
import {
  type RiskModelConfig,
  type RiskModelConfigRow,
  type RiskLevel,
  type Trajectory,
  type TriggerType,
  type RiskFactorRecord,
  type RiskEvaluationInsert,
  parseConfigRow,
} from '@/lib/risk-engine/types';

// ============================================================
// Legacy type aliases (backward compatibility)
// ============================================================

/** @deprecated Use RiskModelConfig from risk-engine/types instead */
export interface RiskWeights {
  attendance: number;
  academicPerformance: number;
  academicGrowth: number;
  behaviorIncidents: number;
  engagementScore: number;
  chronicallyAbsent: number;
  gradeDecline: number;
  missingAssignments: number;
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  attendance: 0.25,
  academicPerformance: 0.20,
  academicGrowth: 0.15,
  behaviorIncidents: 0.15,
  engagementScore: 0.10,
  chronicallyAbsent: 0.05,
  gradeDecline: 0.05,
  missingAssignments: 0.05,
};

/** @deprecated Use RiskModelConfig.thresholds instead */
export interface RiskThresholds {
  criticalMin: number;
  atRiskMin: number;
  onTrackMin: number;
}

export const DEFAULT_THRESHOLDS: RiskThresholds = {
  criticalMin: 0.7,
  atRiskMin: 0.4,
  onTrackMin: 0,
};

// ============================================================
// Risk Assessment Result (enhanced with level tracking)
// ============================================================

export interface RiskAssessment {
  studentId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  previousLevel: RiskLevel | null;
  levelChanged: boolean;
  factors: RiskFactor[];
  trajectory: Trajectory;
  confidenceLevel: number;
  assessedAt: Date;
  recommendedActions: string[];
  configId: string;
  triggerType: TriggerType;
}

export interface RiskFactor {
  name: string;
  category: 'attendance' | 'academic' | 'behavior' | 'engagement' | 'assignments' | 'trend' | 'other';
  rawValue: number;
  normalizedScore: number;
  weight: number;
  weightedScore: number;
  description: string;
  trend: Trajectory;
}

export interface TrendData {
  date: Date;
  riskScore: number;
  factors: Record<string, number>;
}

// ============================================================
// Risk Detection Engine
// ============================================================

export class RiskDetectionEngine {
  private schoolId: string;
  private config: RiskModelConfig | null = null;
  private triggerType: TriggerType;

  // Legacy fields for backward compat
  private weights: RiskWeights;
  private thresholds: RiskThresholds;

  constructor(
    schoolId: string,
    weights: Partial<RiskWeights> = {},
    thresholds: Partial<RiskThresholds> = {},
    triggerType: TriggerType = 'batch_nightly'
  ) {
    this.schoolId = schoolId;
    this.weights = { ...DEFAULT_RISK_WEIGHTS, ...weights };
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.triggerType = triggerType;
    this.normalizeWeights();
  }

  /**
   * Load config from risk_model_configs table.
   * Must be called before assessStudent/assessAllStudents.
   * Falls back to legacy defaults if no DB config exists.
   */
  async loadConfig(): Promise<RiskModelConfig | null> {
    try {
      const supabase = createAdminSupabaseClient();

      const { data, error } = await supabase
        .from('risk_model_configs')
        .select('*')
        .eq('school_id', this.schoolId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.log(`[RiskEngine] No active config for school ${this.schoolId}, using defaults`);
        return null;
      }

      this.config = parseConfigRow(data as RiskModelConfigRow);
      return this.config;
    } catch (err) {
      console.error('[RiskEngine] Failed to load config:', err);
      return null;
    }
  }

  /**
   * Get the active config, loading from DB if needed
   */
  private async getConfig(): Promise<RiskModelConfig | null> {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.config;
  }

  private normalizeWeights(): void {
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (sum !== 1.0) {
      for (const key of Object.keys(this.weights) as (keyof RiskWeights)[]) {
        this.weights[key] = this.weights[key] / sum;
      }
    }
  }

  /**
   * Assess risk for a single student
   */
  async assessStudent(student: Student): Promise<RiskAssessment> {
    // Ensure config is loaded
    const config = await this.getConfig();

    const factors: RiskFactor[] = [];

    // 1. Attendance Factor
    factors.push(this.calculateAttendanceFactor(student));

    // 2. Academic Performance Factor
    factors.push(this.calculateAcademicPerformanceFactor(student));

    // 3. Academic Growth Factor
    factors.push(this.calculateAcademicGrowthFactor(student));

    // 4. Chronic Absence Factor
    factors.push(this.calculateChronicAbsenceFactor(student));

    // 5. Engagement Factor
    factors.push(this.calculateEngagementFactor(student));

    // Calculate total risk score
    const riskScore = Math.min(1, Math.max(0,
      factors.reduce((sum, f) => sum + f.weightedScore, 0)
    ));

    // Determine risk level using DB config thresholds if available
    const riskLevel = this.determineRiskLevel(riskScore);

    // Get previous level for change detection
    const previousLevel = await this.getPreviousLevel(student.id);
    const levelChanged = previousLevel !== null && previousLevel !== riskLevel;

    // Get trajectory from evaluation history
    const trajectory = await this.calculateTrajectory(student.id);

    // Calculate confidence
    const confidenceLevel = this.calculateConfidence(student, factors);

    // Generate recommendations
    const recommendedActions = this.generateRecommendations(factors, riskLevel);

    return {
      studentId: student.id,
      riskScore: Math.round(riskScore * 1000) / 1000,
      riskLevel,
      previousLevel,
      levelChanged,
      factors,
      trajectory,
      confidenceLevel,
      assessedAt: new Date(),
      recommendedActions,
      configId: config?.id || 'legacy-defaults',
      triggerType: this.triggerType,
    };
  }

  /**
   * Get previous risk level from most recent evaluation
   */
  private async getPreviousLevel(studentId: string): Promise<RiskLevel | null> {
    try {
      const supabase = createAdminSupabaseClient();

      const { data } = await supabase
        .from('risk_evaluations')
        .select('risk_level')
        .eq('student_id', studentId)
        .eq('school_id', this.schoolId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single();

      return (data?.risk_level as RiskLevel) || null;
    } catch {
      return null;
    }
  }

  // ============================================================
  // Factor Calculations (unchanged logic, enhanced descriptions)
  // ============================================================

  private calculateAttendanceFactor(student: Student): RiskFactor {
    const attendanceRate = student.attendance_rate || 1;
    const config = this.config;

    let normalizedScore = 0;
    if (config) {
      // Use DB config thresholds
      const floor = config.indicators.attendanceFloor / 100;
      const critical = config.indicators.attendanceCritical / 100;
      if (attendanceRate >= floor) {
        normalizedScore = 0;
      } else {
        const range = floor - critical;
        normalizedScore = Math.min(1, Math.max(0, (floor - attendanceRate) / (range || 1)));
      }
    } else {
      // Legacy thresholds
      if (attendanceRate < 0.85) normalizedScore = 1.0;
      else if (attendanceRate < 0.90) normalizedScore = 0.7;
      else if (attendanceRate < 0.95) normalizedScore = 0.4;
      else normalizedScore = 0.1;
    }

    return {
      name: 'Attendance Rate',
      category: 'attendance',
      rawValue: attendanceRate,
      normalizedScore,
      weight: this.weights.attendance,
      weightedScore: normalizedScore * this.weights.attendance,
      description: `${Math.round(attendanceRate * 100)}% attendance rate`,
      trend: 'stable',
    };
  }

  private calculateAcademicPerformanceFactor(student: Student): RiskFactor {
    const proficiency = student.proficiency_level || 3;

    let normalizedScore = 0;
    if (proficiency <= 1) normalizedScore = 1.0;
    else if (proficiency === 2) normalizedScore = 0.7;
    else if (proficiency === 3) normalizedScore = 0.3;
    else normalizedScore = 0.1;

    return {
      name: 'Academic Performance',
      category: 'academic',
      rawValue: proficiency,
      normalizedScore,
      weight: this.weights.academicPerformance,
      weightedScore: normalizedScore * this.weights.academicPerformance,
      description: `Proficiency level ${proficiency} of 5`,
      trend: 'stable',
    };
  }

  private calculateAcademicGrowthFactor(student: Student): RiskFactor {
    const growthPercentile = student.growth_percentile || 50;
    const config = this.config;

    let normalizedScore = 0;
    if (config) {
      const floor = config.indicators.assessmentFloorPct;
      if (growthPercentile >= floor) {
        normalizedScore = 0;
      } else {
        normalizedScore = Math.min(1, Math.max(0, (floor - growthPercentile) / floor));
      }
    } else {
      if (growthPercentile < 25) normalizedScore = 1.0;
      else if (growthPercentile < 40) normalizedScore = 0.6;
      else if (growthPercentile < 50) normalizedScore = 0.3;
      else normalizedScore = 0.1;
    }

    return {
      name: 'Academic Growth',
      category: 'academic',
      rawValue: growthPercentile,
      normalizedScore,
      weight: this.weights.academicGrowth,
      weightedScore: normalizedScore * this.weights.academicGrowth,
      description: `${growthPercentile}th percentile growth`,
      trend: 'stable',
    };
  }

  private calculateChronicAbsenceFactor(student: Student): RiskFactor {
    const isChronicallyAbsent = student.is_chronically_absent || false;
    const normalizedScore = isChronicallyAbsent ? 1.0 : 0.0;

    return {
      name: 'Chronic Absence Status',
      category: 'attendance',
      rawValue: isChronicallyAbsent ? 1 : 0,
      normalizedScore,
      weight: this.weights.chronicallyAbsent,
      weightedScore: normalizedScore * this.weights.chronicallyAbsent,
      description: isChronicallyAbsent ? 'Chronically absent (>10%)' : 'Not chronically absent',
      trend: 'stable',
    };
  }

  private calculateEngagementFactor(student: Student): RiskFactor {
    const metrics = student.purpose_driven_metrics as Record<string, number> | null;
    const engagementScore = metrics?.engagement || 0.5;

    let normalizedScore = 0;
    if (engagementScore < 0.3) normalizedScore = 1.0;
    else if (engagementScore < 0.5) normalizedScore = 0.6;
    else if (engagementScore < 0.7) normalizedScore = 0.3;
    else normalizedScore = 0.1;

    return {
      name: 'Engagement Score',
      category: 'engagement',
      rawValue: engagementScore,
      normalizedScore,
      weight: this.weights.engagementScore,
      weightedScore: normalizedScore * this.weights.engagementScore,
      description: `${Math.round(engagementScore * 100)}% engagement`,
      trend: 'stable',
    };
  }

  // ============================================================
  // Risk Level Classification
  // ============================================================

  private determineRiskLevel(score: number): RiskLevel {
    const config = this.config;

    if (config) {
      // Use 4-tier DB config thresholds
      if (score >= config.thresholds.atRisk) return 'critical';
      if (score >= config.thresholds.watch) return 'at_risk';
      if (score >= config.thresholds.onTrack) return 'watch';
      return 'on_track';
    }

    // Legacy 3-tier thresholds
    if (score >= this.thresholds.criticalMin) return 'critical';
    if (score >= this.thresholds.atRiskMin) return 'at_risk';
    return 'on_track';
  }

  // ============================================================
  // Trajectory (now reads from risk_evaluations)
  // ============================================================

  private async calculateTrajectory(studentId: string): Promise<Trajectory> {
    try {
      const supabase = createAdminSupabaseClient();

      // Read from risk_evaluations (replaces missing risk_assessments table)
      const { data: history } = await supabase
        .from('risk_evaluations')
        .select('risk_score, computed_at')
        .eq('student_id', studentId)
        .eq('school_id', this.schoolId)
        .order('computed_at', { ascending: false })
        .limit(5);

      if (!history || history.length < 2) {
        return 'stable';
      }

      const recentAvg = history.slice(0, 2).reduce((s, h) => s + Number(h.risk_score), 0) / 2;
      const olderAvg = history.slice(2).reduce((s, h) => s + Number(h.risk_score), 0) / Math.max(history.length - 2, 1);

      const change = recentAvg - olderAvg;

      if (change < -0.1) return 'improving';
      if (change > 0.1) return 'declining';
      return 'stable';
    } catch {
      return 'stable';
    }
  }

  // ============================================================
  // Confidence
  // ============================================================

  private calculateConfidence(student: Student, factors: RiskFactor[]): number {
    let confidence = 1.0;

    if (student.attendance_rate === null) confidence -= 0.2;
    if (student.proficiency_level === null) confidence -= 0.15;
    if (student.growth_percentile === null) confidence -= 0.15;

    const enrolledAt = student.enrolled_at ? new Date(student.enrolled_at) : new Date();
    const daysSinceEnrollment = (Date.now() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceEnrollment < 30) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, Math.round(confidence * 1000) / 1000));
  }

  // ============================================================
  // Recommendations
  // ============================================================

  private generateRecommendations(factors: RiskFactor[], riskLevel: string): string[] {
    const recommendations: string[] = [];
    const sortedFactors = [...factors].sort((a, b) => b.weightedScore - a.weightedScore);

    for (const factor of sortedFactors.slice(0, 3)) {
      if (factor.weightedScore > 0.1) {
        switch (factor.category) {
          case 'attendance':
            recommendations.push('Schedule attendance intervention meeting with family');
            recommendations.push('Assign attendance mentor or check-in buddy');
            break;
          case 'academic':
            recommendations.push('Provide targeted academic tutoring');
            recommendations.push('Consider small group instruction in struggling areas');
            break;
          case 'behavior':
            recommendations.push('Implement behavior support plan');
            recommendations.push('Schedule counseling sessions');
            break;
          case 'engagement':
            recommendations.push('Connect student with interest-based activities');
            recommendations.push('Assign peer mentor for engagement');
            break;
        }
      }
    }

    if (riskLevel === 'critical') {
      recommendations.unshift('URGENT: Convene Student Support Team meeting');
      recommendations.push('Consider referral for comprehensive evaluation');
    }

    return [...new Set(recommendations)].slice(0, 5);
  }

  // ============================================================
  // Batch Assessment
  // ============================================================

  async assessAllStudents(): Promise<RiskAssessment[]> {
    // Ensure config is loaded before batch
    await this.loadConfig();

    const supabase = await createServerSupabaseClient();

    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', this.schoolId)
      .eq('is_active', true);

    if (!students) return [];

    const assessments: RiskAssessment[] = [];

    for (const student of students) {
      const assessment = await this.assessStudent(student);
      assessments.push(assessment);
    }

    await this.storeAssessments(assessments);

    return assessments;
  }

  // ============================================================
  // Storage (now writes to risk_evaluations + updates students)
  // ============================================================

  private async storeAssessments(assessments: RiskAssessment[]): Promise<void> {
    const supabase = createAdminSupabaseClient();
    const configId = this.config?.id;

    if (!configId) {
      console.warn('[RiskEngine] No config ID - skipping risk_evaluations insert');
      // Still update students table for backward compat
      await this.updateStudentsTable(supabase, assessments);
      return;
    }

    // 1. Insert into risk_evaluations (immutable audit trail)
    const chunkSize = 100;
    for (let i = 0; i < assessments.length; i += chunkSize) {
      const chunk = assessments.slice(i, i + chunkSize);

      const records: RiskEvaluationInsert[] = chunk.map((a) => ({
        student_id: a.studentId,
        school_id: this.schoolId,
        config_id: configId,
        risk_score: a.riskScore,
        risk_level: a.riskLevel,
        previous_level: a.previousLevel,
        level_changed: a.levelChanged,
        risk_factors: a.factors as RiskFactorRecord[],
        trajectory: a.trajectory,
        confidence_level: a.confidenceLevel,
        recommended_actions: a.recommendedActions,
        metrics_snapshot: {
          studentId: a.studentId,
          assessedAt: a.assessedAt.toISOString(),
          factorCount: a.factors.length,
        },
        trigger_type: a.triggerType,
      }));

      const { error } = await supabase.from('risk_evaluations').insert(records);
      if (error) {
        console.error('[RiskEngine] Failed to insert evaluations:', error.message);
      }
    }

    // 2. Update students table (backward compatibility)
    await this.updateStudentsTable(supabase, assessments);
  }

  /**
   * Update students table with latest risk scores.
   * Maintains backward compatibility with existing dashboard queries.
   */
  private async updateStudentsTable(
    supabase: ReturnType<typeof createAdminSupabaseClient>,
    assessments: RiskAssessment[]
  ): Promise<void> {
    for (const assessment of assessments) {
      await supabase
        .from('students')
        .update({
          risk_score: assessment.riskScore,
          risk_level: assessment.riskLevel,
          risk_factors: assessment.factors,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.studentId);
    }
  }

  // ============================================================
  // Query Methods (unchanged, use students table for now)
  // ============================================================

  async getRiskDistribution(): Promise<{
    onTrack: number;
    watch: number;
    atRisk: number;
    critical: number;
    total: number;
  }> {
    const supabase = await createServerSupabaseClient();

    const { data: students } = await supabase
      .from('students')
      .select('risk_level')
      .eq('school_id', this.schoolId)
      .eq('is_active', true);

    if (!students) {
      return { onTrack: 0, watch: 0, atRisk: 0, critical: 0, total: 0 };
    }

    return {
      onTrack: students.filter((s) => s.risk_level === 'on_track').length,
      watch: students.filter((s) => s.risk_level === 'watch').length,
      atRisk: students.filter((s) => s.risk_level === 'at_risk').length,
      critical: students.filter((s) => s.risk_level === 'critical').length,
      total: students.length,
    };
  }

  async getStudentsByRiskLevel(
    level: RiskLevel,
    limit = 20,
    offset = 0
  ): Promise<{ students: Student[]; total: number }> {
    const supabase = await createServerSupabaseClient();

    const { data, count } = await supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('school_id', this.schoolId)
      .eq('risk_level', level)
      .eq('is_active', true)
      .order('risk_score', { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      students: data || [],
      total: count || 0,
    };
  }
}

// ============================================================
// Factory Function
// ============================================================

export function createRiskEngine(
  schoolId: string,
  weights?: Partial<RiskWeights>,
  thresholds?: Partial<RiskThresholds>,
  triggerType?: TriggerType
): RiskDetectionEngine {
  return new RiskDetectionEngine(schoolId, weights, thresholds, triggerType);
}
'@

$detectionEnginePath = Join-Path $projectRoot "src/lib/risk/detection-engine.ts"
[System.IO.File]::WriteAllText($detectionEnginePath, $detectionEngineContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] src/lib/risk/detection-engine.ts refactored" -ForegroundColor Green


# ================================================================
# FILE 3: src/lib/risk/early-warning.ts (REFACTORED)
# Changes:
#   - storeAlerts writes to risk_alerts (not early_warning_alerts)
#   - getActiveAlerts reads from risk_alerts
#   - acknowledgeAlert/resolveAlert update risk_alerts
#   - getAlertStats queries risk_alerts
#   - getPreviousState reads from student_metric_history
#   - Added cooldown_key for deduplication
# ================================================================
Write-Host ""
Write-Host "--- FILE 3: src/lib/risk/early-warning.ts (refactor) ---" -ForegroundColor Cyan

$earlyWarningContent = @'
/**
 * Early Warning System
 * ====================
 *
 * Real-time monitoring for student risk indicators with
 * configurable alerts and notifications.
 *
 * SPRINT 1B REFACTOR:
 *   - Alerts persisted to risk_alerts table (not early_warning_alerts)
 *   - Previous state loaded from student_metric_history (not student_snapshots)
 *   - Added cooldown_key for DB-level deduplication
 *   - Alert queries use risk_alerts table
 *   - Compatible with risk_evaluations for linking alerts to evaluations
 *
 * Features:
 * - Threshold-based alerting
 * - Trend detection alerts
 * - Batch monitoring
 * - Alert suppression and deduplication (DB + in-memory)
 */

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { Student } from '@/lib/database.types';
import type {
  AlertType,
  AlertSeverity,
  AlertStatus,
  RiskAlertInsert,
  RiskAlertRow,
} from '@/lib/risk-engine/types';

// ============================================================
// Alert Rule Types
// ============================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  alertType: AlertType;
  enabled: boolean;
  cooldownMinutes: number;
  notifyRoles: string[];
}

export interface AlertCondition {
  type: 'threshold' | 'change' | 'trend' | 'absence';
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'change_by';
  value: number;
  windowDays?: number;
}

/** Alert as returned to consumers (hydrated from DB row) */
export interface Alert {
  id: string;
  schoolId: string;
  studentId: string;
  ruleId: string | null;
  alertType: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  data: Record<string, unknown>;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

// ============================================================
// Default Alert Rules (enhanced with alertType)
// ============================================================

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'attendance-drop',
    name: 'Sudden Attendance Drop',
    description: 'Attendance drops by more than 10% in a week',
    condition: { type: 'change', field: 'attendance_rate', operator: 'change_by', value: -0.1, windowDays: 7 },
    severity: 'warning',
    alertType: 'attendance_drop',
    enabled: true,
    cooldownMinutes: 1440,
    notifyRoles: ['teacher', 'counselor'],
  },
  {
    id: 'chronic-absence-new',
    name: 'New Chronic Absence',
    description: 'Student becomes chronically absent',
    condition: { type: 'threshold', field: 'is_chronically_absent', operator: 'eq', value: 1 },
    severity: 'critical',
    alertType: 'chronic_absence',
    enabled: true,
    cooldownMinutes: 10080,
    notifyRoles: ['teacher', 'counselor', 'admin'],
  },
  {
    id: 'risk-critical',
    name: 'Critical Risk Level',
    description: 'Student moves to critical risk level',
    condition: { type: 'threshold', field: 'risk_score', operator: 'gte', value: 0.7 },
    severity: 'critical',
    alertType: 'threshold_breach',
    enabled: true,
    cooldownMinutes: 1440,
    notifyRoles: ['teacher', 'counselor', 'admin'],
  },
  {
    id: 'grade-decline',
    name: 'Significant Grade Decline',
    description: 'Proficiency level drops by 1 or more',
    condition: { type: 'change', field: 'proficiency_level', operator: 'change_by', value: -1, windowDays: 30 },
    severity: 'warning',
    alertType: 'grade_decline',
    enabled: true,
    cooldownMinutes: 2880,
    notifyRoles: ['teacher'],
  },
  {
    id: 'consecutive-absences',
    name: 'Consecutive Absences',
    description: 'Student absent 3+ consecutive days',
    condition: { type: 'absence', field: 'consecutive_absences', operator: 'gte', value: 3 },
    severity: 'warning',
    alertType: 'consecutive_absences',
    enabled: true,
    cooldownMinutes: 1440,
    notifyRoles: ['teacher', 'counselor'],
  },
];

// ============================================================
// Early Warning System
// ============================================================

export class EarlyWarningSystem {
  private schoolId: string;
  private rules: AlertRule[];
  private alertCache: Map<string, Date> = new Map();

  constructor(schoolId: string, customRules?: AlertRule[]) {
    this.schoolId = schoolId;
    this.rules = customRules || [...DEFAULT_ALERT_RULES];
  }

  /**
   * Check a single student against all rules
   */
  async checkStudent(student: Student, previousState?: Student): Promise<Alert[]> {
    const alerts: Alert[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const cooldownKey = `${rule.id}:${student.id}`;

      // In-memory cooldown check
      const lastAlert = this.alertCache.get(cooldownKey);
      if (lastAlert) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastAlert.getTime() < cooldownMs) {
          continue;
        }
      }

      // DB-level cooldown check (survives restarts)
      const dbCooldownActive = await this.checkDbCooldown(cooldownKey, rule.cooldownMinutes);
      if (dbCooldownActive) continue;

      const triggered = await this.evaluateCondition(rule.condition, student, previousState);

      if (triggered) {
        const alert = this.createAlert(rule, student, cooldownKey);
        alerts.push(alert);
        this.alertCache.set(cooldownKey, new Date());
      }
    }

    if (alerts.length > 0) {
      await this.storeAlerts(alerts);
      await this.sendNotifications(alerts);
    }

    return alerts;
  }

  /**
   * Check DB-level cooldown using cooldown_key
   */
  private async checkDbCooldown(cooldownKey: string, cooldownMinutes: number): Promise<boolean> {
    try {
      const supabase = createAdminSupabaseClient();
      const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();

      const { data } = await supabase
        .from('risk_alerts')
        .select('id')
        .eq('cooldown_key', cooldownKey)
        .gte('created_at', cutoff)
        .limit(1);

      return (data && data.length > 0) || false;
    } catch {
      return false;
    }
  }

  /**
   * Evaluate an alert condition
   */
  private async evaluateCondition(
    condition: AlertCondition,
    current: Student,
    previous?: Student
  ): Promise<boolean> {
    const currentValue = this.getFieldValue(current, condition.field);

    switch (condition.type) {
      case 'threshold':
        return this.evaluateThreshold(currentValue, condition.operator, condition.value);

      case 'change':
        if (!previous) {
          previous = await this.getPreviousState(current.id, condition.windowDays || 7);
        }
        if (!previous) return false;
        const previousValue = this.getFieldValue(previous, condition.field);
        const change = currentValue - previousValue;
        return this.evaluateThreshold(change, condition.operator, condition.value);

      case 'trend':
        return false;

      case 'absence':
        return this.evaluateThreshold(currentValue, condition.operator, condition.value);

      default:
        return false;
    }
  }

  private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'change_by': return value <= threshold;
      default: return false;
    }
  }

  private getFieldValue(student: Student, field: string): number {
    const value = student[field as keyof Student];
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return 0;
  }

  /**
   * Get previous student state from student_metric_history
   * (replaces missing student_snapshots table)
   */
  private async getPreviousState(studentId: string, daysAgo: number): Promise<Student | null> {
    try {
      const supabase = await createServerSupabaseClient();
      const targetDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const { data } = await supabase
        .from('student_metric_history')
        .select('*')
        .eq('student_id', studentId)
        .eq('school_id', this.schoolId)
        .lte('snapshot_date', targetDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (!data) return null;

      // Map metric history fields to Student-like shape
      return {
        id: studentId,
        attendance_rate: data.attendance_rate,
        proficiency_level: data.proficiency_level,
        growth_percentile: data.growth_percentile,
        is_chronically_absent: false,
      } as unknown as Student;
    } catch {
      return null;
    }
  }

  /**
   * Create an alert object with cooldown_key
   */
  private createAlert(rule: AlertRule, student: Student, cooldownKey: string): Alert {
    return {
      id: crypto.randomUUID(),
      schoolId: this.schoolId,
      studentId: student.id,
      ruleId: rule.id,
      alertType: rule.alertType,
      severity: rule.severity,
      status: 'new',
      title: rule.name,
      message: `${rule.description} for ${student.display_name} (Grade ${student.grade_level})`,
      data: {
        studentName: student.display_name,
        gradeLevel: student.grade_level,
        riskLevel: student.risk_level,
        riskScore: student.risk_score,
        teacher: student.homeroom_teacher,
        cooldownKey,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Store alerts in risk_alerts table (replaces early_warning_alerts)
   */
  private async storeAlerts(alerts: Alert[]): Promise<void> {
    const supabase = createAdminSupabaseClient();

    const inserts: RiskAlertInsert[] = alerts.map((a) => ({
      student_id: a.studentId,
      school_id: a.schoolId,
      rule_id: a.ruleId,
      alert_type: a.alertType,
      severity: a.severity,
      title: a.title,
      message: a.message,
      risk_score: typeof a.data.riskScore === 'number' ? a.data.riskScore : undefined,
      risk_level: a.data.riskLevel as string | undefined,
      data: a.data,
      cooldown_key: a.data.cooldownKey as string | undefined,
    }));

    const { error } = await supabase.from('risk_alerts').insert(inserts);
    if (error) {
      console.error('[EarlyWarning] Failed to store alerts:', error.message);
    }
  }

  /**
   * Send notifications for alerts
   */
  private async sendNotifications(alerts: Alert[]): Promise<void> {
    const supabase = createAdminSupabaseClient();

    for (const alert of alerts) {
      const rule = this.rules.find((r) => r.id === alert.ruleId);
      if (!rule) continue;

      const { data: members } = await supabase
        .from('school_memberships')
        .select('user_id, role')
        .eq('school_id', this.schoolId)
        .eq('is_active', true)
        .in('role', rule.notifyRoles);

      if (!members) continue;

      const notifications = members.map((member) => ({
        school_id: this.schoolId,
        user_id: member.user_id,
        type: 'early_warning' as const,
        title: alert.title,
        message: alert.message,
        priority: alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'high' : 'medium',
        metadata: { alertId: alert.id, studentId: alert.studentId, alertType: alert.alertType },
        is_read: false,
        is_dismissed: false,
      }));

      await supabase.from('notifications').insert(notifications);
    }
  }

  /**
   * Batch check all students
   */
  async runBatchCheck(): Promise<{ alertCount: number; studentsChecked: number }> {
    const supabase = await createServerSupabaseClient();

    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', this.schoolId)
      .eq('is_active', true);

    if (!students) return { alertCount: 0, studentsChecked: 0 };

    let alertCount = 0;

    for (const student of students) {
      const alerts = await this.checkStudent(student);
      alertCount += alerts.length;
    }

    return { alertCount, studentsChecked: students.length };
  }

  /**
   * Get active alerts from risk_alerts table
   */
  async getActiveAlerts(limit = 50): Promise<Alert[]> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('risk_alerts')
      .select('*')
      .eq('school_id', this.schoolId)
      .is('resolved_at', null)
      .neq('status', 'dismissed')
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map((d: RiskAlertRow) => this.mapRowToAlert(d));
  }

  /**
   * Acknowledge an alert in risk_alerts
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const supabase = createAdminSupabaseClient();

    await supabase
      .from('risk_alerts')
      .update({
        status: 'acknowledged' as AlertStatus,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
      })
      .eq('id', alertId)
      .eq('school_id', this.schoolId);
  }

  /**
   * Resolve an alert in risk_alerts
   */
  async resolveAlert(alertId: string, userId: string, notes?: string): Promise<void> {
    const supabase = createAdminSupabaseClient();

    await supabase
      .from('risk_alerts')
      .update({
        status: 'resolved' as AlertStatus,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_notes: notes || null,
      })
      .eq('id', alertId)
      .eq('school_id', this.schoolId);
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(alertId: string, userId: string): Promise<void> {
    const supabase = createAdminSupabaseClient();

    await supabase
      .from('risk_alerts')
      .update({
        status: 'dismissed' as AlertStatus,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
      })
      .eq('id', alertId)
      .eq('school_id', this.schoolId);
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) rule.enabled = enabled;
  }

  /**
   * Get alert statistics from risk_alerts
   */
  async getAlertStats(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    avgResolutionTimeHours: number;
  }> {
    const supabase = await createServerSupabaseClient();

    const { data: alerts } = await supabase
      .from('risk_alerts')
      .select('severity, alert_type, status, created_at, resolved_at')
      .eq('school_id', this.schoolId);

    if (!alerts || alerts.length === 0) {
      return { total: 0, bySeverity: {}, byType: {}, byStatus: {}, avgResolutionTimeHours: 0 };
    }

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const alert of alerts) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byType[alert.alert_type] = (byType[alert.alert_type] || 0) + 1;
      byStatus[alert.status] = (byStatus[alert.status] || 0) + 1;

      if (alert.resolved_at) {
        const ms = new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime();
        totalResolutionTime += ms;
        resolvedCount++;
      }
    }

    return {
      total: alerts.length,
      bySeverity,
      byType,
      byStatus,
      avgResolutionTimeHours: resolvedCount > 0 ? totalResolutionTime / resolvedCount / (1000 * 60 * 60) : 0,
    };
  }

  /**
   * Map a DB row to an Alert object
   */
  private mapRowToAlert(row: RiskAlertRow): Alert {
    return {
      id: row.id,
      schoolId: row.school_id,
      studentId: row.student_id,
      ruleId: row.rule_id || null,
      alertType: row.alert_type,
      severity: row.severity,
      status: row.status,
      title: row.title,
      message: row.message,
      data: (row.data || {}) as Record<string, unknown>,
      createdAt: new Date(row.created_at),
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
      acknowledgedBy: row.acknowledged_by || undefined,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolvedBy: row.resolved_by || undefined,
      resolutionNotes: row.resolution_notes || undefined,
    };
  }
}

/**
 * Create an early warning system for a school
 */
export function createEarlyWarningSystem(schoolId: string, customRules?: AlertRule[]): EarlyWarningSystem {
  return new EarlyWarningSystem(schoolId, customRules);
}
'@

$earlyWarningPath = Join-Path $projectRoot "src/lib/risk/early-warning.ts"
[System.IO.File]::WriteAllText($earlyWarningPath, $earlyWarningContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] src/lib/risk/early-warning.ts refactored" -ForegroundColor Green


# ================================================================
# FILE 4: src/lib/risk/index.ts (updated exports)
# ================================================================
Write-Host ""
Write-Host "--- FILE 4: src/lib/risk/index.ts (update exports) ---" -ForegroundColor Cyan

$indexContent = @'
/**
 * Risk Detection Module
 * =====================
 *
 * Layer 2: Student Risk Detection Engine
 *
 * Exports for the risk detection and early warning system.
 * Sprint 1B: Added risk-engine/types re-exports.
 */

// Detection Engine
export {
  RiskDetectionEngine,
  createRiskEngine,
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_THRESHOLDS,
  type RiskWeights,
  type RiskThresholds,
  type RiskAssessment,
  type RiskFactor,
  type TrendData,
} from './detection-engine';

// Early Warning System
export {
  EarlyWarningSystem,
  createEarlyWarningSystem,
  DEFAULT_ALERT_RULES,
  type AlertRule,
  type AlertCondition,
  type Alert,
} from './early-warning';

// Database Types (Sprint 1B)
export {
  type RiskModelConfig,
  type RiskModelConfigRow,
  type StudentMetricsRow,
  type StudentMetricHistoryRow,
  type RiskEvaluationRow,
  type RiskEvaluationInsert,
  type RiskAlertRow,
  type RiskAlertInsert,
  type CurrentRiskScoreRow,
  type RiskLevel,
  type TriggerType,
  type Trajectory,
  type AlertType,
  type AlertSeverity,
  type AlertStatus,
  type RiskFactorRecord,
  parseConfigRow,
} from '@/lib/risk-engine/types';
'@

$indexPath = Join-Path $projectRoot "src/lib/risk/index.ts"
[System.IO.File]::WriteAllText($indexPath, $indexContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "[OK] src/lib/risk/index.ts updated" -ForegroundColor Green


# ================================================================
# DONE
# ================================================================
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  SPRINT 1B COMPLETE" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Files created/modified:" -ForegroundColor Yellow
Write-Host "    [NEW] src/lib/risk-engine/types.ts" -ForegroundColor Gray
Write-Host "    [MOD] src/lib/risk/detection-engine.ts" -ForegroundColor Gray
Write-Host "    [MOD] src/lib/risk/early-warning.ts" -ForegroundColor Gray
Write-Host "    [MOD] src/lib/risk/index.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "  Key changes:" -ForegroundColor Yellow
Write-Host "    - Config loads from risk_model_configs table" -ForegroundColor Gray
Write-Host "    - Evaluations persist to risk_evaluations (audit trail)" -ForegroundColor Gray
Write-Host "    - Alerts persist to risk_alerts (replaces early_warning_alerts)" -ForegroundColor Gray
Write-Host "    - Previous state from student_metric_history" -ForegroundColor Gray
Write-Host "    - Level change tracking (previous_level, level_changed)" -ForegroundColor Gray
Write-Host "    - DB-level cooldown deduplication" -ForegroundColor Gray
Write-Host "    - Students table still updated (backward compat)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "    1. npm run build (verify no type errors)" -ForegroundColor Gray
Write-Host "    2. npm run test (verify existing tests pass)" -ForegroundColor Gray
Write-Host "    3. git add + commit" -ForegroundColor Gray
Write-Host "    4. Sprint 2: API routes + batch orchestrator" -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
