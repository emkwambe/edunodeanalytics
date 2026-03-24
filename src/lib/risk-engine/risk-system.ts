/**
 * EduNode Risk System - Unified Integration
 * ==========================================
 *
 * This module is the main entry point for the MTSS Risk Scoring Engine.
 * It integrates all risk engine components into a single cohesive system:
 *
 *   - MetricsAggregator: Computes normalized student metrics
 *   - RiskDetectionEngine: Calculates risk scores and levels
 *   - TrendDetector: Linear regression trend analysis
 *   - EarlyWarningSystem: Alert generation and management
 *   - Interpreter: Plain language explanations
 *
 * Usage:
 *   const risk = await RiskSystem.forSchool(schoolId);
 *   const result = await risk.evaluateAll();
 *   const summary = risk.summarize(student, assessment);
 */

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { createRiskEngine, type RiskAssessment, type RiskFactor } from '@/lib/risk/detection-engine';
import { createEarlyWarningSystem, type Alert, type AlertRule } from '@/lib/risk/early-warning';
import { aggregateSchoolMetrics, aggregateStudentMetrics } from './metrics-aggregator';
import { TrendDetector, createTrendDetector, type StudentTrendAnalysis } from './trend-detector';
import {
  interpretRiskLevel,
  getRiskSummary as _getRiskSummary,
  getRiskBadgeText,
  getRiskBadgeColor,
  interpretFactor,
  interpretTrajectory,
  interpretConfidence,
  generateActionPrompts,
  generateStudentSummary,
  getPrimaryConcern,
} from './interpreter';
import type {
  RiskLevel,
  Trajectory,
  TriggerType,
  RiskModelConfig,
  RiskModelConfigRow,
  CurrentRiskScoreRow,
} from './types';

// ============================================================
// Types
// ============================================================

export interface RiskSystemConfig {
  schoolId: string;
  triggerType?: TriggerType;
  customAlertRules?: AlertRule[];
}

export interface EvaluationSummary {
  schoolId: string;
  evaluatedAt: Date;
  durationMs: number;

  // Counts
  studentsProcessed: number;
  studentsEvaluated: number;
  alertsGenerated: number;
  levelChanges: number;
  trendWarnings: number;

  // Distribution
  distribution: Record<RiskLevel, number>;

  // Trajectory summary
  trajectories: {
    improving: number;
    stable: number;
    declining: number;
  };

  // Top concerns
  topConcerns: Array<{
    studentId: string;
    studentName: string;
    level: RiskLevel;
    primaryConcern: string | null;
  }>;

  // Errors
  errors: string[];
  success: boolean;
}

export interface StudentRiskProfile {
  studentId: string;
  studentName: string;
  gradeLevel: number;

  // Current risk
  riskScore: number;
  riskLevel: RiskLevel;
  riskBadge: { text: string; color: string };

  // Trajectory
  trajectory: Trajectory;
  trajectoryText: string;
  previousLevel: RiskLevel | null;
  levelChanged: boolean;

  // Factors
  factors: Array<{
    factor: RiskFactor;
    interpretation: string;
  }>;
  primaryConcern: string | null;

  // Trends
  trends: StudentTrendAnalysis | null;

  // Recommendations
  recommendedActions: string[];
  actionPrompts: string[];

  // Confidence
  confidence: number;
  confidenceWarning: string | null;

  // Summary
  summary: string;
}

export interface DashboardData {
  distribution: Record<RiskLevel, number>;
  trajectories: { improving: number; stable: number; declining: number };
  recentAlerts: Alert[];
  criticalStudents: StudentRiskProfile[];
  atRiskStudents: StudentRiskProfile[];
  recentLevelChanges: Array<{
    studentId: string;
    studentName: string;
    previousLevel: RiskLevel | null;
    newLevel: RiskLevel;
    changedAt: Date;
  }>;
  lastEvaluation: Date | null;
}

// ============================================================
// Risk System Class
// ============================================================

export class RiskSystem {
  private schoolId: string;
  private triggerType: TriggerType;
  private customAlertRules?: AlertRule[];

  // Lazy-loaded components
  private _config: RiskModelConfig | null = null;
  private _trendDetector: TrendDetector | null = null;

  private constructor(config: RiskSystemConfig) {
    this.schoolId = config.schoolId;
    this.triggerType = config.triggerType ?? 'manual';
    this.customAlertRules = config.customAlertRules;
  }

  /**
   * Factory method - creates and initializes a RiskSystem for a school
   */
  static async forSchool(
    schoolId: string,
    options: { triggerType?: TriggerType; customAlertRules?: AlertRule[] } = {}
  ): Promise<RiskSystem> {
    const system = new RiskSystem({
      schoolId,
      triggerType: options.triggerType,
      customAlertRules: options.customAlertRules,
    });

    // Pre-load config
    await system.loadConfig();

    return system;
  }

  /**
   * Load risk model config from database
   */
  async loadConfig(): Promise<RiskModelConfig | null> {
    const supabase = createAdminSupabaseClient();

    const { data } = await supabase
      .from('risk_model_configs')
      .select('*')
      .eq('school_id', this.schoolId)
      .eq('is_active', true)
      .single();

    if (data) {
      const { parseConfigRow } = await import('./types');
      this._config = parseConfigRow(data as RiskModelConfigRow);
    }

    return this._config;
  }

  /**
   * Get the trend detector (lazy initialized)
   */
  private getTrendDetector(): TrendDetector {
    if (!this._trendDetector) {
      this._trendDetector = createTrendDetector(this.schoolId, this._config?.indicators);
    }
    return this._trendDetector;
  }

  // ============================================================
  // Core Operations
  // ============================================================

  /**
   * Full evaluation pipeline for all students
   */
  async evaluateAll(): Promise<EvaluationSummary> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Phase 1: Aggregate metrics
    const shouldSnapshot = this.triggerType === 'batch_nightly';
    const aggregation = await aggregateSchoolMetrics(this.schoolId, {
      createSnapshot: shouldSnapshot,
      syncSource: this.triggerType === 'sync_event' ? 'sis' : 'manual',
    });

    if (aggregation.errors.length > 0) {
      errors.push(...aggregation.errors.map((e) => `[Aggregation] ${e}`));
    }

    // Phase 2: Risk evaluation
    const engine = createRiskEngine(this.schoolId, {}, {}, this.triggerType);
    const assessments = await engine.assessAllStudents();

    // Build distribution
    const distribution: Record<RiskLevel, number> = {
      on_track: 0,
      watch: 0,
      at_risk: 0,
      critical: 0,
    };
    let levelChanges = 0;
    const trajectories = { improving: 0, stable: 0, declining: 0 };

    for (const a of assessments) {
      distribution[a.riskLevel]++;
      if (a.levelChanged) levelChanges++;
      trajectories[a.trajectory]++;
    }

    // Phase 3: Early warning alerts
    let alertsGenerated = 0;
    try {
      const warning = createEarlyWarningSystem(this.schoolId, this.customAlertRules);
      const alertResult = await warning.runBatchCheck();
      alertsGenerated = alertResult.alertCount;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[Alerts] ${msg}`);
    }

    // Phase 4: Trend analysis (if nightly batch)
    let trendWarnings = 0;
    if (this.triggerType === 'batch_nightly') {
      try {
        const detector = this.getTrendDetector();
        const trendResult = await detector.analyzeSchoolTrends();
        trendWarnings = trendResult.earlyWarnings.length;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`[Trends] ${msg}`);
      }
    }

    // Build top concerns (critical students)
    const supabase = await createServerSupabaseClient();
    const { data: criticalStudents } = await supabase
      .from('students')
      .select('id, display_name, risk_level, risk_factors')
      .eq('school_id', this.schoolId)
      .in('risk_level', ['critical', 'at_risk'])
      .order('risk_score', { ascending: false })
      .limit(10);

    const topConcerns = (criticalStudents || []).map((s) => ({
      studentId: s.id,
      studentName: s.display_name || 'Unknown',
      level: s.risk_level as RiskLevel,
      primaryConcern: getPrimaryConcern((s.risk_factors as unknown as RiskFactor[]) || []),
    }));

    return {
      schoolId: this.schoolId,
      evaluatedAt: new Date(),
      durationMs: Date.now() - startTime,
      studentsProcessed: aggregation.studentsProcessed,
      studentsEvaluated: assessments.length,
      alertsGenerated,
      levelChanges,
      trendWarnings,
      distribution,
      trajectories,
      topConcerns,
      errors,
      success: errors.length === 0,
    };
  }

  /**
   * Evaluate a single student
   */
  async evaluateStudent(studentId: string): Promise<RiskAssessment | null> {
    // First aggregate their metrics
    await aggregateStudentMetrics(studentId, this.schoolId);

    // Then evaluate
    const supabase = await createServerSupabaseClient();
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .eq('school_id', this.schoolId)
      .single();

    if (!student) return null;

    const engine = createRiskEngine(this.schoolId, {}, {}, this.triggerType);
    return engine.assessStudent(student);
  }

  // ============================================================
  // Profile Generation
  // ============================================================

  /**
   * Get a complete risk profile for a student
   */
  async getStudentProfile(studentId: string): Promise<StudentRiskProfile | null> {
    const supabase = await createServerSupabaseClient();

    // Get current risk score from view
    const { data: riskData } = await supabase
      .from('current_risk_scores')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', this.schoolId)
      .single();

    if (!riskData) return null;

    const row = riskData as unknown as CurrentRiskScoreRow;

    // Get trend analysis
    const detector = this.getTrendDetector();
    let trends: StudentTrendAnalysis | null = null;
    try {
      trends = await detector.analyzeStudentTrends(studentId);
    } catch {
      // Trends may not be available if no history
    }

    // Check if student has active intervention
    const { data: interventionData } = await supabase
      .from('interventions')
      .select('id')
      .eq('student_id', studentId)
      .eq('school_id', this.schoolId)
      .in('status', ['planned', 'in_progress'])
      .limit(1);

    const hasIntervention = (interventionData?.length ?? 0) > 0;

    // Build factor interpretations
    const riskFactors = (row.risk_factors || []) as RiskFactor[];
    const factors = riskFactors.map((f: RiskFactor) => ({
      factor: f,
      interpretation: interpretFactor(f),
    }));

    // Generate action prompts
    const actionPrompts = generateActionPrompts(
      riskFactors,
      row.risk_level,
      hasIntervention
    );

    const confidenceWarning = interpretConfidence(row.confidence_level);

    return {
      studentId: row.student_id,
      studentName: row.student_name,
      gradeLevel: row.grade_level,

      riskScore: row.risk_score,
      riskLevel: row.risk_level,
      riskBadge: {
        text: getRiskBadgeText(row.risk_level),
        color: getRiskBadgeColor(row.risk_level),
      },

      trajectory: row.trajectory,
      trajectoryText: interpretTrajectory(row.trajectory, row.previous_level),
      previousLevel: row.previous_level,
      levelChanged: row.level_changed,

      factors,
      primaryConcern: getPrimaryConcern(riskFactors),

      trends,

      recommendedActions: row.recommended_actions,
      actionPrompts,

      confidence: row.confidence_level,
      confidenceWarning,

      summary: generateStudentSummary(
        row.student_name,
        row.risk_level,
        riskFactors,
        row.trajectory
      ),
    };
  }

  // ============================================================
  // Dashboard Data
  // ============================================================

  /**
   * Get data for the risk dashboard
   */
  async getDashboardData(): Promise<DashboardData> {
    const supabase = await createServerSupabaseClient();

    // Get distribution
    const engine = createRiskEngine(this.schoolId);
    const distribution = await engine.getRiskDistribution();

    // Get trajectory counts from recent evaluations
    const { data: recentEvals } = await supabase
      .from('risk_evaluations')
      .select('trajectory')
      .eq('school_id', this.schoolId)
      .gte('computed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const trajectories = { improving: 0, stable: 0, declining: 0 };
    for (const e of recentEvals || []) {
      const t = e.trajectory as Trajectory;
      if (t in trajectories) trajectories[t]++;
    }

    // Get recent alerts
    const warning = createEarlyWarningSystem(this.schoolId);
    const recentAlerts = await warning.getActiveAlerts(10);

    // Get critical and at-risk student profiles
    const critical = await engine.getStudentsByRiskLevel('critical', 5);
    const atRisk = await engine.getStudentsByRiskLevel('at_risk', 10);

    const criticalProfiles = await Promise.all(
      critical.students.map((s) => this.getStudentProfile(s.id))
    );
    const atRiskProfiles = await Promise.all(
      atRisk.students.map((s) => this.getStudentProfile(s.id))
    );

    // Get recent level changes
    const { data: levelChanges } = await supabase
      .from('risk_evaluations')
      .select('student_id, risk_level, previous_level, computed_at')
      .eq('school_id', this.schoolId)
      .eq('level_changed', true)
      .order('computed_at', { ascending: false })
      .limit(10);

    // Get student names for level changes
    const studentIds = (levelChanges || []).map((l) => l.student_id);
    const { data: studentNames } = await supabase
      .from('students')
      .select('id, display_name')
      .in('id', studentIds);

    const nameMap = new Map((studentNames || []).map((s) => [s.id, s.display_name]));

    const recentLevelChanges = (levelChanges || []).map((l) => ({
      studentId: l.student_id,
      studentName: nameMap.get(l.student_id) || 'Unknown',
      previousLevel: l.previous_level as RiskLevel | null,
      newLevel: l.risk_level as RiskLevel,
      changedAt: new Date(l.computed_at),
    }));

    // Get last evaluation time
    const { data: lastEval } = await supabase
      .from('risk_evaluations')
      .select('computed_at')
      .eq('school_id', this.schoolId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    return {
      distribution: {
        on_track: distribution.onTrack,
        watch: distribution.watch,
        at_risk: distribution.atRisk,
        critical: distribution.critical,
      },
      trajectories,
      recentAlerts,
      criticalStudents: criticalProfiles.filter((p): p is StudentRiskProfile => p !== null),
      atRiskStudents: atRiskProfiles.filter((p): p is StudentRiskProfile => p !== null),
      recentLevelChanges,
      lastEvaluation: lastEval ? new Date(lastEval.computed_at) : null,
    };
  }

  // ============================================================
  // Alert Management
  // ============================================================

  /**
   * Get active alerts for the school
   */
  async getActiveAlerts(limit = 50): Promise<Alert[]> {
    const warning = createEarlyWarningSystem(this.schoolId, this.customAlertRules);
    return warning.getActiveAlerts(limit);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const warning = createEarlyWarningSystem(this.schoolId);
    await warning.acknowledgeAlert(alertId, userId);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, userId: string, notes?: string): Promise<void> {
    const warning = createEarlyWarningSystem(this.schoolId);
    await warning.resolveAlert(alertId, userId, notes);
  }

  /**
   * Get alert statistics
   */
  async getAlertStats() {
    const warning = createEarlyWarningSystem(this.schoolId);
    return warning.getAlertStats();
  }

  // ============================================================
  // Trend Analysis
  // ============================================================

  /**
   * Get trend analysis for a student
   */
  async getStudentTrends(studentId: string): Promise<StudentTrendAnalysis> {
    const detector = this.getTrendDetector();
    return detector.analyzeStudentTrends(studentId);
  }

  /**
   * Get school-wide trend summary
   */
  async getSchoolTrends() {
    const detector = this.getTrendDetector();
    return detector.analyzeSchoolTrends();
  }

  // ============================================================
  // Helpers
  // ============================================================

  /**
   * Get human-readable summary for a risk level
   */
  interpretLevel(level: RiskLevel): string {
    return interpretRiskLevel(level);
  }

  /**
   * Get badge styling for a risk level
   */
  getBadge(level: RiskLevel): { text: string; color: string } {
    return {
      text: getRiskBadgeText(level),
      color: getRiskBadgeColor(level),
    };
  }
}

// ============================================================
// Convenience Exports
// ============================================================

export { RiskSystem as default };

/**
 * Create a RiskSystem instance for a school
 */
export async function createRiskSystem(
  schoolId: string,
  options?: { triggerType?: TriggerType; customAlertRules?: AlertRule[] }
): Promise<RiskSystem> {
  return RiskSystem.forSchool(schoolId, options);
}
