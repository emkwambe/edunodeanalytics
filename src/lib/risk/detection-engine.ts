/**
 * Student Risk Detection Engine
 * =============================
 *
 * Layer 2: ML-based risk scoring system for early identification
 * of students who may need intervention.
 *
 * Features:
 * - Multi-factor risk assessment
 * - Weighted scoring algorithm
 * - Trend analysis for risk trajectory
 * - Configurable thresholds per school
 * - Explainable risk factors
 */

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Student } from '@/lib/database.types';

// Risk factor weights (can be customized per school)
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

// Risk level thresholds
export interface RiskThresholds {
  criticalMin: number;
  atRiskMin: number;
  onTrackMin: number;
}

export const DEFAULT_THRESHOLDS: RiskThresholds = {
  criticalMin: 0.7,     // 70-100: Critical
  atRiskMin: 0.4,       // 40-69: At Risk
  onTrackMin: 0,        // 0-39: On Track
};

// Risk assessment result
export interface RiskAssessment {
  studentId: string;
  riskScore: number;           // 0-1 normalized score
  riskLevel: 'on_track' | 'at_risk' | 'critical';
  factors: RiskFactor[];
  trajectory: 'improving' | 'stable' | 'declining';
  confidenceLevel: number;     // 0-1 confidence in assessment
  assessedAt: Date;
  recommendedActions: string[];
}

export interface RiskFactor {
  name: string;
  category: 'attendance' | 'academic' | 'behavior' | 'engagement' | 'other';
  rawValue: number;
  normalizedScore: number;     // 0-1 contribution to risk
  weight: number;
  weightedScore: number;
  description: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface TrendData {
  date: Date;
  riskScore: number;
  factors: Record<string, number>;
}

/**
 * Student Risk Detection Engine
 *
 * Calculates risk scores based on multiple factors and provides
 * actionable insights for intervention planning.
 */
export class RiskDetectionEngine {
  private schoolId: string;
  private weights: RiskWeights;
  private thresholds: RiskThresholds;

  constructor(
    schoolId: string,
    weights: Partial<RiskWeights> = {},
    thresholds: Partial<RiskThresholds> = {}
  ) {
    this.schoolId = schoolId;
    this.weights = { ...DEFAULT_RISK_WEIGHTS, ...weights };
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.normalizeWeights();
  }

  /**
   * Ensure weights sum to 1.0
   */
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
    const factors: RiskFactor[] = [];

    // 1. Attendance Factor
    const attendanceFactor = this.calculateAttendanceFactor(student);
    factors.push(attendanceFactor);

    // 2. Academic Performance Factor
    const academicFactor = this.calculateAcademicPerformanceFactor(student);
    factors.push(academicFactor);

    // 3. Academic Growth Factor
    const growthFactor = this.calculateAcademicGrowthFactor(student);
    factors.push(growthFactor);

    // 4. Chronic Absence Factor
    const chronicFactor = this.calculateChronicAbsenceFactor(student);
    factors.push(chronicFactor);

    // 5. Engagement Factor (if available)
    const engagementFactor = this.calculateEngagementFactor(student);
    factors.push(engagementFactor);

    // Calculate total risk score
    const riskScore = factors.reduce((sum, f) => sum + f.weightedScore, 0);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(riskScore);

    // Get trajectory from historical data
    const trajectory = await this.calculateTrajectory(student.id);

    // Calculate confidence based on data completeness
    const confidenceLevel = this.calculateConfidence(student, factors);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendations(factors, riskLevel);

    return {
      studentId: student.id,
      riskScore,
      riskLevel,
      factors,
      trajectory,
      confidenceLevel,
      assessedAt: new Date(),
      recommendedActions,
    };
  }

  /**
   * Calculate attendance risk factor
   */
  private calculateAttendanceFactor(student: Student): RiskFactor {
    const attendanceRate = student.attendance_rate || 1;

    // Risk increases as attendance drops
    // 95%+ = low risk, 90% = medium, <85% = high risk
    let normalizedScore = 0;
    if (attendanceRate < 0.85) {
      normalizedScore = 1.0;
    } else if (attendanceRate < 0.90) {
      normalizedScore = 0.7;
    } else if (attendanceRate < 0.95) {
      normalizedScore = 0.4;
    } else {
      normalizedScore = 0.1;
    }

    return {
      name: 'Attendance Rate',
      category: 'attendance',
      rawValue: attendanceRate,
      normalizedScore,
      weight: this.weights.attendance,
      weightedScore: normalizedScore * this.weights.attendance,
      description: `${Math.round(attendanceRate * 100)}% attendance rate`,
      trend: 'stable', // Would be calculated from historical data
    };
  }

  /**
   * Calculate academic performance risk factor
   */
  private calculateAcademicPerformanceFactor(student: Student): RiskFactor {
    const proficiency = student.proficiency_level || 3; // 1-5 scale assumed

    // Risk increases as proficiency drops
    let normalizedScore = 0;
    if (proficiency <= 1) {
      normalizedScore = 1.0;
    } else if (proficiency === 2) {
      normalizedScore = 0.7;
    } else if (proficiency === 3) {
      normalizedScore = 0.3;
    } else {
      normalizedScore = 0.1;
    }

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

  /**
   * Calculate academic growth risk factor
   */
  private calculateAcademicGrowthFactor(student: Student): RiskFactor {
    const growthPercentile = student.growth_percentile || 50;

    // Risk increases for low growth
    let normalizedScore = 0;
    if (growthPercentile < 25) {
      normalizedScore = 1.0;
    } else if (growthPercentile < 40) {
      normalizedScore = 0.6;
    } else if (growthPercentile < 50) {
      normalizedScore = 0.3;
    } else {
      normalizedScore = 0.1;
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

  /**
   * Calculate chronic absence risk factor
   */
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

  /**
   * Calculate engagement risk factor
   */
  private calculateEngagementFactor(student: Student): RiskFactor {
    // Use purpose-driven metrics if available
    const metrics = student.purpose_driven_metrics as Record<string, number> | null;
    const engagementScore = metrics?.engagement || 0.5;

    // Risk increases as engagement drops
    let normalizedScore = 0;
    if (engagementScore < 0.3) {
      normalizedScore = 1.0;
    } else if (engagementScore < 0.5) {
      normalizedScore = 0.6;
    } else if (engagementScore < 0.7) {
      normalizedScore = 0.3;
    } else {
      normalizedScore = 0.1;
    }

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
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'on_track' | 'at_risk' | 'critical' {
    if (score >= this.thresholds.criticalMin) {
      return 'critical';
    } else if (score >= this.thresholds.atRiskMin) {
      return 'at_risk';
    }
    return 'on_track';
  }

  /**
   * Calculate trajectory from historical risk scores
   */
  private async calculateTrajectory(studentId: string): Promise<'improving' | 'stable' | 'declining'> {
    const supabase = await createServerSupabaseClient();

    const { data: history } = await supabase
      .from('risk_assessments')
      .select('risk_score, assessed_at')
      .eq('student_id', studentId)
      .order('assessed_at', { ascending: false })
      .limit(5);

    if (!history || history.length < 2) {
      return 'stable';
    }

    // Compare recent scores to older scores
    const recentAvg = history.slice(0, 2).reduce((s, h) => s + h.risk_score, 0) / 2;
    const olderAvg = history.slice(2).reduce((s, h) => s + h.risk_score, 0) / Math.max(history.length - 2, 1);

    const change = recentAvg - olderAvg;

    if (change < -0.1) {
      return 'improving';
    } else if (change > 0.1) {
      return 'declining';
    }
    return 'stable';
  }

  /**
   * Calculate confidence in the assessment
   */
  private calculateConfidence(student: Student, factors: RiskFactor[]): number {
    let confidence = 1.0;

    // Reduce confidence for missing data
    if (student.attendance_rate === null) confidence -= 0.2;
    if (student.proficiency_level === null) confidence -= 0.15;
    if (student.growth_percentile === null) confidence -= 0.15;

    // Reduce confidence if student is new (less than 30 days of data)
    const enrolledAt = student.enrolled_at ? new Date(student.enrolled_at) : new Date();
    const daysSinceEnrollment = (Date.now() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceEnrollment < 30) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate recommended actions based on risk factors
   */
  private generateRecommendations(factors: RiskFactor[], riskLevel: string): string[] {
    const recommendations: string[] = [];

    // Sort factors by weighted score (highest risk first)
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

    // Add level-specific recommendations
    if (riskLevel === 'critical') {
      recommendations.unshift('URGENT: Convene Student Support Team meeting');
      recommendations.push('Consider referral for comprehensive evaluation');
    }

    return [...new Set(recommendations)].slice(0, 5);
  }

  /**
   * Batch assess all students in a school
   */
  async assessAllStudents(): Promise<RiskAssessment[]> {
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

    // Store assessments
    await this.storeAssessments(assessments);

    return assessments;
  }

  /**
   * Store risk assessments in database
   */
  private async storeAssessments(assessments: RiskAssessment[]): Promise<void> {
    const supabase = createAdminSupabaseClient();

    const records = assessments.map((a) => ({
      student_id: a.studentId,
      school_id: this.schoolId,
      risk_score: a.riskScore,
      risk_level: a.riskLevel,
      factors: a.factors,
      trajectory: a.trajectory,
      confidence_level: a.confidenceLevel,
      assessed_at: a.assessedAt.toISOString(),
      recommended_actions: a.recommendedActions,
    }));

    await supabase.from('risk_assessments').insert(records);

    // Update student risk_score and risk_level
    for (const assessment of assessments) {
      await supabase
        .from('students')
        .update({
          risk_score: assessment.riskScore,
          risk_level: assessment.riskLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.studentId);
    }
  }

  /**
   * Get risk distribution for the school
   */
  async getRiskDistribution(): Promise<{
    onTrack: number;
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
      return { onTrack: 0, atRisk: 0, critical: 0, total: 0 };
    }

    return {
      onTrack: students.filter((s) => s.risk_level === 'on_track').length,
      atRisk: students.filter((s) => s.risk_level === 'at_risk').length,
      critical: students.filter((s) => s.risk_level === 'critical').length,
      total: students.length,
    };
  }

  /**
   * Get students by risk level with pagination
   */
  async getStudentsByRiskLevel(
    level: 'on_track' | 'at_risk' | 'critical',
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

/**
 * Create a risk detection engine for a school
 */
export function createRiskEngine(
  schoolId: string,
  weights?: Partial<RiskWeights>,
  thresholds?: Partial<RiskThresholds>
): RiskDetectionEngine {
  return new RiskDetectionEngine(schoolId, weights, thresholds);
}
