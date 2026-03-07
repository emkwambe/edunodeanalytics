/**
 * EduNode Analytics - Risk Engine Seed Data
 * ==========================================
 *
 * Generates demo risk evaluations, alerts, and metrics
 * for the Early Warning Dashboard. Uses existing student seeds
 * and produces realistic MTSS data distributions.
 */

import { SCHOOL_SEEDS, type StudentSeedData } from './seed-data';
import type {
  RiskLevel,
  Trajectory,
  AlertType,
  AlertSeverity,
  AlertStatus,
  RiskFactorRecord,
  RiskEvaluationRow,
  RiskAlertRow,
  StudentMetricsRow,
} from '@/lib/risk-engine/types';

// =============================================================================
// SEEDED RANDOM (Deterministic for consistency)
// =============================================================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// =============================================================================
// RISK FACTOR GENERATION
// =============================================================================

const FACTOR_NAMES: Record<string, string[]> = {
  attendance: [
    'Attendance Rate',
    'Days Absent (30 day)',
    'Chronic Absence Flag',
    'Consecutive Absences',
  ],
  academic: [
    'Reading Proficiency',
    'Math Proficiency',
    'GPA Current',
    'Assessment Trend',
    'Growth Percentile',
  ],
  behavior: [
    'Behavior Incidents',
    'Suspensions',
    'Office Referrals',
  ],
  engagement: [
    'LMS Activity',
    'Assignment Completion',
    'Course Participation',
  ],
  assignments: [
    'Missing Assignments',
    'Late Submissions',
    'Assignment Trend',
  ],
  trend: [
    'Grade Trend (4 week)',
    'Attendance Trend',
    'Engagement Trend',
  ],
};

function generateRiskFactors(
  rng: SeededRandom,
  student: StudentSeedData,
  riskLevel: RiskLevel
): RiskFactorRecord[] {
  const factors: RiskFactorRecord[] = [];

  // Attendance factor
  const attendanceScore = 1 - student.attendanceRate;
  factors.push({
    name: 'Attendance Rate',
    category: 'attendance',
    rawValue: student.attendanceRate,
    normalizedScore: Math.min(1, attendanceScore * 2),
    weight: 0.25,
    weightedScore: Math.min(1, attendanceScore * 2) * 0.25,
    description: `${(student.attendanceRate * 100).toFixed(1)}% attendance rate`,
    trend: student.attendanceRate < 0.90 ? 'declining' : 'stable',
  });

  // Academic factor (proficiency)
  const proficiencyScore = Math.max(0, (60 - student.proficiencyLevel) / 60);
  factors.push({
    name: 'Academic Proficiency',
    category: 'academic',
    rawValue: student.proficiencyLevel,
    normalizedScore: proficiencyScore,
    weight: 0.30,
    weightedScore: proficiencyScore * 0.30,
    description: `${student.proficiencyLevel}th percentile proficiency`,
    trend: student.growthPercentile >= 50 ? 'improving' : 'stable',
  });

  // Growth factor (can offset proficiency concerns)
  const growthScore = Math.max(0, (50 - student.growthPercentile) / 50);
  factors.push({
    name: 'Growth Percentile',
    category: 'academic',
    rawValue: student.growthPercentile,
    normalizedScore: growthScore,
    weight: 0.20,
    weightedScore: growthScore * 0.20,
    description: `${student.growthPercentile}th percentile growth`,
    trend: student.growthPercentile >= 60 ? 'improving' : student.growthPercentile >= 40 ? 'stable' : 'declining',
  });

  // Assignment factor (from LMS if available)
  if (student.lms) {
    const assignmentScore = 1 - student.lms.assignmentCompletionRate;
    factors.push({
      name: 'Assignment Completion',
      category: 'assignments',
      rawValue: student.lms.assignmentCompletionRate,
      normalizedScore: assignmentScore,
      weight: 0.15,
      weightedScore: assignmentScore * 0.15,
      description: `${student.lms.missingAssignments} missing assignments`,
      trend: student.lms.missingAssignments > 3 ? 'declining' : 'stable',
    });
  }

  // Behavior factor (simulated based on risk level)
  const behaviorIncidents = riskLevel === 'critical' ? rng.nextInt(3, 8)
    : riskLevel === 'at_risk' ? rng.nextInt(1, 4)
    : riskLevel === 'watch' ? rng.nextInt(0, 2)
    : rng.nextInt(0, 1);

  if (behaviorIncidents > 0) {
    factors.push({
      name: 'Behavior Incidents',
      category: 'behavior',
      rawValue: behaviorIncidents,
      normalizedScore: Math.min(1, behaviorIncidents / 5),
      weight: 0.10,
      weightedScore: Math.min(1, behaviorIncidents / 5) * 0.10,
      description: `${behaviorIncidents} behavior incidents this term`,
      trend: behaviorIncidents > 2 ? 'declining' : 'stable',
    });
  }

  // Sort by weighted score descending
  return factors.sort((a, b) => b.weightedScore - a.weightedScore);
}

function determineTrajectory(student: StudentSeedData, rng: SeededRandom): Trajectory {
  // High growth = improving
  if (student.growthPercentile >= 70) return 'improving';
  if (student.growthPercentile >= 50 && student.attendanceRate >= 0.93) return 'improving';

  // Low growth + low attendance = declining
  if (student.growthPercentile < 40 && student.attendanceRate < 0.90) return 'declining';
  if (student.isChronicallyAbsent) return rng.next() < 0.7 ? 'declining' : 'stable';

  // Otherwise stable with some randomness
  const roll = rng.next();
  if (roll < 0.3) return 'improving';
  if (roll < 0.8) return 'stable';
  return 'declining';
}

function calculateConfidence(student: StudentSeedData): number {
  // Confidence based on data completeness
  let score = 0.5;

  // SIS data (always available in seeds)
  score += 0.2;

  // Assessment data
  if (student.reading && student.math) score += 0.15;

  // LMS data
  if (student.lms) score += 0.1;

  // Purpose-driven data
  if (student.purposeDriven) score += 0.05;

  return Math.min(1, score);
}

// =============================================================================
// ALERT GENERATION
// =============================================================================

interface AlertTemplate {
  type: AlertType;
  severity: AlertSeverity;
  titleTemplate: string;
  messageTemplate: string;
}

const ALERT_TEMPLATES: AlertTemplate[] = [
  {
    type: 'threshold_breach',
    severity: 'critical',
    titleTemplate: 'Risk level escalated to Critical',
    messageTemplate: '{name} has moved to critical risk status requiring immediate intervention.',
  },
  {
    type: 'rapid_decline',
    severity: 'urgent',
    titleTemplate: 'Rapid decline detected',
    messageTemplate: '{name}\'s risk score increased by {change}% in the past week.',
  },
  {
    type: 'chronic_absence',
    severity: 'warning',
    titleTemplate: 'Chronic absence threshold reached',
    messageTemplate: '{name} has missed {days} days this term, exceeding chronic absence threshold.',
  },
  {
    type: 'attendance_drop',
    severity: 'warning',
    titleTemplate: 'Attendance decline detected',
    messageTemplate: '{name}\'s attendance dropped below 90% in the past 2 weeks.',
  },
  {
    type: 'grade_decline',
    severity: 'warning',
    titleTemplate: 'Academic performance decline',
    messageTemplate: '{name}\'s academic performance has declined significantly.',
  },
  {
    type: 'consecutive_absences',
    severity: 'urgent',
    titleTemplate: 'Multiple consecutive absences',
    messageTemplate: '{name} has been absent for {days} consecutive days.',
  },
  {
    type: 'trend_warning',
    severity: 'info',
    titleTemplate: 'Negative trend detected',
    messageTemplate: '{name} shows a declining trend in {area} over the past 4 weeks.',
  },
];

function generateAlerts(
  rng: SeededRandom,
  student: StudentSeedData,
  evaluation: Partial<RiskEvaluationRow>,
  schoolId: string
): Partial<RiskAlertRow>[] {
  const alerts: Partial<RiskAlertRow>[] = [];

  // Only generate alerts for watch, at_risk, or critical students
  if (student.riskLevel === 'on_track') return alerts;

  // Critical students get more alerts
  const alertCount = student.riskLevel === 'critical' ? rng.nextInt(1, 3)
    : student.riskLevel === 'at_risk' ? rng.nextInt(0, 2)
    : rng.nextInt(0, 1);

  const usedTypes = new Set<AlertType>();

  for (let i = 0; i < alertCount; i++) {
    const template = rng.pick(ALERT_TEMPLATES.filter(t => !usedTypes.has(t.type)));
    if (!template) break;

    usedTypes.add(template.type);

    // Generate realistic data for template
    const days = student.daysAbsent || rng.nextInt(5, 15);
    const change = rng.nextInt(15, 35);
    const areas = ['attendance', 'academic performance', 'assignment completion'];

    const title = template.titleTemplate;
    const message = template.messageTemplate
      .replace('{name}', `${student.firstName} ${student.lastName}`)
      .replace('{days}', String(days))
      .replace('{change}', String(change))
      .replace('{area}', rng.pick(areas));

    // Some alerts are acknowledged or resolved
    const statusRoll = rng.next();
    let status: AlertStatus = 'new';
    if (statusRoll < 0.3) status = 'acknowledged';
    else if (statusRoll < 0.4) status = 'resolved';

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - rng.nextInt(0, 14));

    alerts.push({
      student_id: student.id,
      school_id: schoolId,
      evaluation_id: evaluation.id,
      alert_type: template.type,
      severity: template.severity,
      title,
      message,
      risk_score: Number(evaluation.risk_score),
      risk_level: evaluation.risk_level,
      status,
      data: {
        factors: evaluation.risk_factors?.slice(0, 2).map(f => f.name),
        trajectory: evaluation.trajectory,
      },
      cooldown_key: `${student.id}_${template.type}`,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
    });
  }

  return alerts;
}

// =============================================================================
// MAIN SEED GENERATION
// =============================================================================

export interface RiskSeedData {
  evaluations: Partial<RiskEvaluationRow>[];
  alerts: Partial<RiskAlertRow>[];
  metrics: Partial<StudentMetricsRow>[];
}

export function generateRiskSeedData(schoolSlug: string, seed: number = 54321): RiskSeedData {
  const schoolSeed = SCHOOL_SEEDS[schoolSlug];
  if (!schoolSeed) {
    return { evaluations: [], alerts: [], metrics: [] };
  }

  const rng = new SeededRandom(seed);
  const evaluations: Partial<RiskEvaluationRow>[] = [];
  const alerts: Partial<RiskAlertRow>[] = [];
  const metrics: Partial<StudentMetricsRow>[] = [];

  const configId = `config_${schoolSeed.id.slice(0, 8)}`;
  const computedAt = new Date().toISOString();

  for (const student of schoolSeed.students) {
    // Generate risk factors
    const riskFactors = generateRiskFactors(rng, student, student.riskLevel);
    const trajectory = determineTrajectory(student, rng);
    const confidence = calculateConfidence(student);

    // Previous level (simulate some level changes)
    const levelChanged = rng.next() < 0.15;
    const levels: RiskLevel[] = ['on_track', 'watch', 'at_risk', 'critical'];
    const currentIdx = levels.indexOf(student.riskLevel);
    const previousLevel = levelChanged && currentIdx > 0 ? levels[currentIdx - 1] : student.riskLevel;

    // Build evaluation
    const evaluation: Partial<RiskEvaluationRow> = {
      id: `eval_${student.id}_${Date.now().toString(36)}`,
      student_id: student.id,
      school_id: schoolSeed.id,
      config_id: configId,
      risk_score: student.riskScore / 100, // Normalize to 0-1
      risk_level: student.riskLevel,
      previous_level: previousLevel,
      level_changed: levelChanged,
      risk_factors: riskFactors,
      trajectory,
      confidence_level: confidence,
      recommended_actions: generateRecommendations(student.riskLevel, riskFactors),
      metrics_snapshot: {
        attendance_rate: student.attendanceRate,
        proficiency_level: student.proficiencyLevel,
        growth_percentile: student.growthPercentile,
      },
      trigger_type: 'batch_nightly',
      computed_at: computedAt,
      created_at: computedAt,
    };

    evaluations.push(evaluation);

    // Generate alerts for at-risk students
    const studentAlerts = generateAlerts(rng, student, evaluation, schoolSeed.id);
    alerts.push(...studentAlerts);

    // Generate student metrics row
    const metric: Partial<StudentMetricsRow> = {
      id: `metric_${student.id}`,
      student_id: student.id,
      school_id: schoolSeed.id,
      attendance_rate: student.attendanceRate * 100,
      attendance_trend: rng.next() * 0.1 - 0.05,
      days_absent_last_30: student.daysAbsent,
      chronic_absence_flag: student.isChronicallyAbsent,
      gpa_current: student.lms?.courseGPA || null,
      math_assessment_pct: student.math?.nationalPercentile || null,
      reading_assessment_pct: student.reading?.nationalPercentile || null,
      proficiency_level: student.proficiencyLevel,
      growth_percentile: student.growthPercentile,
      missing_assignment_rate: student.lms ? 1 - student.lms.assignmentCompletionRate : null,
      missing_assignments_count: student.lms?.missingAssignments || 0,
      behavior_incident_count: riskFactors.find(f => f.name === 'Behavior Incidents')?.rawValue as number || 0,
      engagement_score: student.lms?.assignmentCompletionRate || null,
      data_completeness: confidence,
      computed_at: computedAt,
      created_at: computedAt,
      updated_at: computedAt,
    };

    metrics.push(metric);
  }

  return { evaluations, alerts, metrics };
}

function generateRecommendations(riskLevel: RiskLevel, factors: RiskFactorRecord[]): string[] {
  const recommendations: string[] = [];

  // Add recommendations based on top factors
  const topFactor = factors[0];
  if (topFactor) {
    switch (topFactor.category) {
      case 'attendance':
        recommendations.push('Schedule attendance conference with family');
        if (riskLevel === 'critical') {
          recommendations.push('Initiate truancy intervention protocol');
        }
        break;
      case 'academic':
        recommendations.push('Review academic support needs');
        recommendations.push('Consider Tier 2 academic intervention');
        break;
      case 'behavior':
        recommendations.push('Review behavior support plan');
        recommendations.push('Schedule check-in with counselor');
        break;
      case 'assignments':
        recommendations.push('Coordinate with teachers on missing work');
        recommendations.push('Establish homework support routine');
        break;
    }
  }

  // General recommendations based on risk level
  if (riskLevel === 'critical') {
    recommendations.push('Convene MTSS team meeting within 48 hours');
    recommendations.push('Document all interventions and contacts');
  } else if (riskLevel === 'at_risk') {
    recommendations.push('Monitor progress bi-weekly');
    recommendations.push('Ensure Tier 2 interventions are active');
  } else if (riskLevel === 'watch') {
    recommendations.push('Continue monitoring with standard check-ins');
  }

  return recommendations.slice(0, 4);
}

// =============================================================================
// SUMMARY STATISTICS
// =============================================================================

export interface RiskDistributionSummary {
  on_track: number;
  watch: number;
  at_risk: number;
  critical: number;
  total: number;
}

export function getRiskDistribution(schoolSlug: string): RiskDistributionSummary {
  const schoolSeed = SCHOOL_SEEDS[schoolSlug];
  if (!schoolSeed) {
    return { on_track: 0, watch: 0, at_risk: 0, critical: 0, total: 0 };
  }

  return {
    on_track: schoolSeed.metrics.riskDistribution.onTrack,
    watch: schoolSeed.metrics.riskDistribution.watch,
    at_risk: schoolSeed.metrics.riskDistribution.atRisk,
    critical: schoolSeed.metrics.riskDistribution.critical,
    total: schoolSeed.studentCount,
  };
}

export function getTopRiskDrivers(schoolSlug: string, seed: number = 54321): Array<{ name: string; count: number; percentage: number }> {
  const data = generateRiskSeedData(schoolSlug, seed);

  // Count factor occurrences across all at-risk students
  const factorCounts: Record<string, number> = {};
  let atRiskCount = 0;

  for (const eval_ of data.evaluations) {
    if (eval_.risk_level === 'at_risk' || eval_.risk_level === 'critical') {
      atRiskCount++;
      for (const factor of (eval_.risk_factors || [])) {
        factorCounts[factor.name] = (factorCounts[factor.name] || 0) + 1;
      }
    }
  }

  // Convert to sorted array
  return Object.entries(factorCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: atRiskCount > 0 ? Math.round((count / atRiskCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// =============================================================================
// EXPORTS
// =============================================================================

export { SCHOOL_SEEDS };
