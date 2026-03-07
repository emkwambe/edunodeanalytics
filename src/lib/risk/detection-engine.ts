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
import type { Student, Json } from '@/lib/database.types';
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

    // 6. Missing Assignments Factor (Sprint 3 - requires LMS sync)
    factors.push(this.calculateMissingAssignmentsFactor(student));

    // 7. Behavior Incidents Factor (Sprint 3 - requires PBIS/SIS sync)
    factors.push(this.calculateBehaviorFactor(student));

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

  /**
   * Calculate missing assignments factor.
   * Sprint 3: Stub implementation - requires LMS sync to populate data.
   * Data source: student_metrics.missing_assignment_rate (from LMS sync)
   */
  private calculateMissingAssignmentsFactor(student: Student): RiskFactor {
    // Get missing assignment rate from student_metrics via purpose_driven_metrics
    // This will be populated by LMS sync (Canvas, Google Classroom, etc.)
    const metrics = student.purpose_driven_metrics as Record<string, number> | null;
    const missingRate = metrics?.missing_assignment_rate ?? null;
    const config = this.config;

    // If no data available, return zero-weighted factor
    if (missingRate === null) {
      return {
        name: 'Missing Assignments',
        category: 'assignments',
        rawValue: 0,
        normalizedScore: 0,
        weight: this.weights.missingAssignments,
        weightedScore: 0,
        description: 'No assignment data available (awaiting LMS sync)',
        trend: 'stable',
      };
    }

    let normalizedScore = 0;
    if (config) {
      // Use DB config threshold
      const warnThreshold = config.indicators.assignmentMissingWarn / 100;
      if (missingRate >= warnThreshold * 2) normalizedScore = 1.0;
      else if (missingRate >= warnThreshold) normalizedScore = 0.6;
      else if (missingRate >= warnThreshold / 2) normalizedScore = 0.3;
      else normalizedScore = 0.1;
    } else {
      // Legacy thresholds
      if (missingRate >= 0.4) normalizedScore = 1.0;
      else if (missingRate >= 0.2) normalizedScore = 0.6;
      else if (missingRate >= 0.1) normalizedScore = 0.3;
      else normalizedScore = 0.1;
    }

    return {
      name: 'Missing Assignments',
      category: 'assignments',
      rawValue: missingRate,
      normalizedScore,
      weight: this.weights.missingAssignments,
      weightedScore: normalizedScore * this.weights.missingAssignments,
      description: `${Math.round(missingRate * 100)}% assignments missing`,
      trend: 'stable',
    };
  }

  /**
   * Calculate behavior incidents factor.
   * Sprint 3: Stub implementation - requires PBIS/SIS sync to populate data.
   * Data source: student_metrics.behavior_incident_count (from PBIS/SIS sync)
   */
  private calculateBehaviorFactor(student: Student): RiskFactor {
    // Get behavior incident count from student_metrics via purpose_driven_metrics
    // This will be populated by PBIS/SIS discipline data sync
    const metrics = student.purpose_driven_metrics as Record<string, number> | null;
    const incidentCount = metrics?.behavior_incident_count ?? null;
    const config = this.config;

    // If no data available, return zero-weighted factor
    if (incidentCount === null) {
      return {
        name: 'Behavior Incidents',
        category: 'behavior',
        rawValue: 0,
        normalizedScore: 0,
        weight: this.weights.behaviorIncidents,
        weightedScore: 0,
        description: 'No behavior data available (awaiting PBIS/SIS sync)',
        trend: 'stable',
      };
    }

    let normalizedScore = 0;
    if (config) {
      // Use DB config cap
      const cap = config.indicators.behaviorIncidentCap;
      if (incidentCount >= cap) normalizedScore = 1.0;
      else if (incidentCount >= cap * 0.6) normalizedScore = 0.7;
      else if (incidentCount >= cap * 0.3) normalizedScore = 0.4;
      else if (incidentCount > 0) normalizedScore = 0.2;
      else normalizedScore = 0;
    } else {
      // Legacy thresholds (cap at 5)
      if (incidentCount >= 5) normalizedScore = 1.0;
      else if (incidentCount >= 3) normalizedScore = 0.7;
      else if (incidentCount >= 1) normalizedScore = 0.4;
      else normalizedScore = 0;
    }

    return {
      name: 'Behavior Incidents',
      category: 'behavior',
      rawValue: incidentCount,
      normalizedScore,
      weight: this.weights.behaviorIncidents,
      weightedScore: normalizedScore * this.weights.behaviorIncidents,
      description: incidentCount === 0
        ? 'No behavior incidents'
        : `${incidentCount} behavior incident${incidentCount === 1 ? '' : 's'}`,
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('risk_evaluations').insert(records as any);
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
          risk_factors: assessment.factors as unknown as Json,
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