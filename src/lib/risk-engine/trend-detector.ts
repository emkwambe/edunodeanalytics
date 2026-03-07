/**
 * Trend Detector Module
 * =====================
 *
 * Linear regression-based trend detection for student metrics.
 * Identifies declining trends before students cross risk thresholds.
 *
 * Sprint 3: Trend Detection Implementation
 *
 * Features:
 * - Simple linear regression for slope calculation
 * - Configurable lookback window
 * - Multi-metric trend analysis
 * - Early warning for declining trajectories
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Trajectory, RiskModelConfig, StudentMetricHistoryRow } from './types';

// ============================================================
// Types
// ============================================================

export interface TrendResult {
  metric: string;
  slope: number;
  intercept: number;
  rSquared: number;
  dataPoints: number;
  trajectory: Trajectory;
  predictedValue: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface StudentTrendAnalysis {
  studentId: string;
  schoolId: string;
  analyzedAt: Date;
  lookbackWeeks: number;
  trends: TrendResult[];
  overallTrajectory: Trajectory;
  earlyWarningFlags: string[];
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

// ============================================================
// Linear Regression Implementation
// ============================================================

/**
 * Calculate simple linear regression for a set of data points.
 * Uses ordinary least squares (OLS) method.
 *
 * @param points Array of [x, y] data points
 * @returns Regression coefficients and R-squared
 */
export function linearRegression(points: Array<[number, number]>): LinearRegressionResult {
  const n = points.length;

  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }

  // Calculate means
  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate slope and intercept using least squares
  let numerator = 0;
  let denominator = 0;
  let ssTotal = 0;

  for (const [x, y] of points) {
    numerator += (x - meanX) * (y - meanY);
    denominator += (x - meanX) * (x - meanX);
    ssTotal += (y - meanY) * (y - meanY);
  }

  // Handle edge case where all x values are the same
  if (denominator === 0) {
    return { slope: 0, intercept: meanY, rSquared: 0 };
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Calculate R-squared (coefficient of determination)
  let ssResidual = 0;
  for (const [x, y] of points) {
    const predicted = slope * x + intercept;
    ssResidual += (y - predicted) * (y - predicted);
  }

  const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return {
    slope: Math.round(slope * 10000) / 10000,
    intercept: Math.round(intercept * 10000) / 10000,
    rSquared: Math.round(rSquared * 10000) / 10000,
  };
}

/**
 * Determine trajectory based on slope and threshold
 */
export function determineTrajectory(
  slope: number,
  declineThreshold: number,
  improveThreshold?: number
): Trajectory {
  const improveLimit = improveThreshold ?? Math.abs(declineThreshold);

  if (slope < declineThreshold) {
    return 'declining';
  }
  if (slope > improveLimit) {
    return 'improving';
  }
  return 'stable';
}

/**
 * Determine confidence based on R-squared and data points
 */
export function determineConfidence(
  rSquared: number,
  dataPoints: number
): 'high' | 'medium' | 'low' {
  if (dataPoints < 3) return 'low';
  if (dataPoints < 5 || rSquared < 0.5) return 'medium';
  if (rSquared >= 0.7) return 'high';
  return 'medium';
}

// ============================================================
// Trend Detector Class
// ============================================================

export class TrendDetector {
  private schoolId: string;
  private lookbackWeeks: number;
  private declineThreshold: number;

  constructor(
    schoolId: string,
    config?: Partial<{
      lookbackWeeks: number;
      declineThreshold: number;
    }>
  ) {
    this.schoolId = schoolId;
    this.lookbackWeeks = config?.lookbackWeeks ?? 4;
    this.declineThreshold = config?.declineThreshold ?? -0.1;
  }

  /**
   * Load config from risk_model_configs table
   */
  async loadConfigFromDb(): Promise<void> {
    try {
      const supabase = createAdminSupabaseClient();

      const { data } = await supabase
        .from('risk_model_configs')
        .select('trend_lookback_weeks, trend_decline_threshold')
        .eq('school_id', this.schoolId)
        .eq('is_active', true)
        .single();

      if (data) {
        this.lookbackWeeks = data.trend_lookback_weeks;
        this.declineThreshold = data.trend_decline_threshold;
      }
    } catch {
      // Use defaults
    }
  }

  /**
   * Analyze trends for a single student
   */
  async analyzeStudentTrends(studentId: string): Promise<StudentTrendAnalysis> {
    const supabase = createAdminSupabaseClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.lookbackWeeks * 7);

    // Fetch metric history
    const { data: history } = await supabase
      .from('student_metric_history')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', this.schoolId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .lte('snapshot_date', endDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    const trends: TrendResult[] = [];
    const earlyWarningFlags: string[] = [];

    if (!history || history.length < 2) {
      return {
        studentId,
        schoolId: this.schoolId,
        analyzedAt: new Date(),
        lookbackWeeks: this.lookbackWeeks,
        trends: [],
        overallTrajectory: 'stable',
        earlyWarningFlags: [],
      };
    }

    // Analyze each metric
    const metricsToAnalyze: Array<{
      name: string;
      field: keyof StudentMetricHistoryRow;
      isInverted?: boolean; // true if lower is better (e.g., behavior incidents)
    }> = [
      { name: 'attendance_rate', field: 'attendance_rate' },
      { name: 'gpa', field: 'gpa_current' },
      { name: 'math_assessment', field: 'math_assessment_pct' },
      { name: 'reading_assessment', field: 'reading_assessment_pct' },
      { name: 'engagement', field: 'engagement_score' },
      { name: 'missing_assignments', field: 'missing_assignment_rate', isInverted: true },
      { name: 'behavior_incidents', field: 'behavior_incident_count', isInverted: true },
    ];

    for (const metric of metricsToAnalyze) {
      const points: Array<[number, number]> = [];

      for (let i = 0; i < history.length; i++) {
        const value = history[i][metric.field];
        if (value !== null && typeof value === 'number') {
          points.push([i, value]);
        }
      }

      if (points.length >= 2) {
        const regression = linearRegression(points);

        // For inverted metrics (where higher is worse), flip the slope interpretation
        const effectiveSlope = metric.isInverted ? -regression.slope : regression.slope;

        const trajectory = determineTrajectory(effectiveSlope, this.declineThreshold);
        const confidence = determineConfidence(regression.rSquared, points.length);

        // Predict next value
        const nextX = points.length;
        const predictedValue = regression.slope * nextX + regression.intercept;

        trends.push({
          metric: metric.name,
          slope: regression.slope,
          intercept: regression.intercept,
          rSquared: regression.rSquared,
          dataPoints: points.length,
          trajectory,
          predictedValue: Math.round(predictedValue * 100) / 100,
          confidence,
        });

        // Check for early warning conditions
        if (trajectory === 'declining' && confidence !== 'low') {
          earlyWarningFlags.push(`${metric.name}_declining`);
        }
      }
    }

    // Determine overall trajectory
    const decliningCount = trends.filter((t) => t.trajectory === 'declining').length;
    const improvingCount = trends.filter((t) => t.trajectory === 'improving').length;

    let overallTrajectory: Trajectory = 'stable';
    if (decliningCount > improvingCount && decliningCount >= 2) {
      overallTrajectory = 'declining';
    } else if (improvingCount > decliningCount && improvingCount >= 2) {
      overallTrajectory = 'improving';
    }

    return {
      studentId,
      schoolId: this.schoolId,
      analyzedAt: new Date(),
      lookbackWeeks: this.lookbackWeeks,
      trends,
      overallTrajectory,
      earlyWarningFlags,
    };
  }

  /**
   * Analyze trends for all active students in a school
   */
  async analyzeSchoolTrends(): Promise<{
    studentsAnalyzed: number;
    decliningStudents: string[];
    improvingStudents: string[];
    stableStudents: string[];
    earlyWarnings: Array<{ studentId: string; flags: string[] }>;
  }> {
    const supabase = createAdminSupabaseClient();

    // Get all active students
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', this.schoolId)
      .eq('is_active', true);

    if (!students) {
      return {
        studentsAnalyzed: 0,
        decliningStudents: [],
        improvingStudents: [],
        stableStudents: [],
        earlyWarnings: [],
      };
    }

    const decliningStudents: string[] = [];
    const improvingStudents: string[] = [];
    const stableStudents: string[] = [];
    const earlyWarnings: Array<{ studentId: string; flags: string[] }> = [];

    for (const student of students) {
      const analysis = await this.analyzeStudentTrends(student.id);

      switch (analysis.overallTrajectory) {
        case 'declining':
          decliningStudents.push(student.id);
          break;
        case 'improving':
          improvingStudents.push(student.id);
          break;
        default:
          stableStudents.push(student.id);
      }

      if (analysis.earlyWarningFlags.length > 0) {
        earlyWarnings.push({
          studentId: student.id,
          flags: analysis.earlyWarningFlags,
        });
      }
    }

    return {
      studentsAnalyzed: students.length,
      decliningStudents,
      improvingStudents,
      stableStudents,
      earlyWarnings,
    };
  }

  /**
   * Check if a student's trend predicts crossing a threshold
   */
  predictThresholdCrossing(
    currentValue: number,
    slope: number,
    threshold: number,
    weeksAhead: number = 4
  ): { willCross: boolean; weeksUntilCross: number | null } {
    if (slope >= 0) {
      // Not declining, won't cross downward threshold
      return { willCross: false, weeksUntilCross: null };
    }

    const valueAfterWeeks = currentValue + slope * weeksAhead;

    if (valueAfterWeeks < threshold) {
      // Will cross - calculate when
      const weeksUntilCross = (threshold - currentValue) / slope;
      return {
        willCross: true,
        weeksUntilCross: Math.max(0, Math.round(weeksUntilCross * 10) / 10),
      };
    }

    return { willCross: false, weeksUntilCross: null };
  }
}

// ============================================================
// Factory Function
// ============================================================

export function createTrendDetector(
  schoolId: string,
  config?: Partial<RiskModelConfig['indicators']>
): TrendDetector {
  return new TrendDetector(schoolId, {
    lookbackWeeks: config?.trendLookbackWeeks,
    declineThreshold: config?.trendDeclineThreshold,
  });
}
