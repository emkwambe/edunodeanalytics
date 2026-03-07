/**
 * Risk Engine Plain Language Interpreter
 * =======================================
 *
 * Converts machine-generated risk data into human-readable text.
 * Used by dashboard components to display insights, not numbers.
 *
 * Design principle: "A teacher with no analytics training should
 * understand this in under 30 seconds."
 */

import type { RiskLevel, Trajectory } from './types';

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

// ============================================================
// Risk Score Interpretation
// ============================================================

/**
 * Convert a risk level to a human-readable status
 */
export function interpretRiskLevel(level: RiskLevel): string {
  const levelText: Record<RiskLevel, string> = {
    on_track: 'is on track',
    watch: 'needs monitoring',
    at_risk: 'needs support',
    critical: 'needs immediate attention',
  };
  return levelText[level];
}

/**
 * Get a summary sentence for a student's risk status
 */
export function getRiskSummary(
  studentName: string,
  level: RiskLevel,
  trajectory: Trajectory
): string {
  const status = interpretRiskLevel(level);

  if (trajectory === 'improving') {
    return `${studentName} ${status}, but improving`;
  }
  if (trajectory === 'declining') {
    return `${studentName} ${status} and getting worse`;
  }
  return `${studentName} ${status}`;
}

/**
 * Get severity label for UI badges
 */
export function getRiskBadgeText(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    on_track: 'On Track',
    watch: 'Watch',
    at_risk: 'At Risk',
    critical: 'Critical',
  };
  return labels[level];
}

/**
 * Get color classes for risk level badges
 */
export function getRiskBadgeColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    on_track: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    watch: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    at_risk: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return colors[level];
}

// ============================================================
// Factor Interpretation
// ============================================================

/**
 * Convert a risk factor to plain language
 */
export function interpretFactor(factor: RiskFactor): string {
  switch (factor.category) {
    case 'attendance':
      return interpretAttendanceFactor(factor);
    case 'academic':
      return interpretAcademicFactor(factor);
    case 'engagement':
      return interpretEngagementFactor(factor);
    case 'behavior':
      return interpretBehaviorFactor(factor);
    case 'assignments':
      return interpretAssignmentFactor(factor);
    default:
      return factor.description;
  }
}

function interpretAttendanceFactor(factor: RiskFactor): string {
  if (factor.name === 'Chronic Absence Status') {
    return factor.rawValue > 0
      ? 'Chronically absent (missed >10% of school)'
      : 'Attendance within acceptable range';
  }

  // Attendance rate interpretation
  const rate = factor.rawValue;
  const pct = typeof rate === 'number' && rate <= 1 ? Math.round(rate * 100) : Math.round(rate);

  if (pct < 75) return `Attendance is critically low at ${pct}%`;
  if (pct < 85) return `Attendance is concerning at ${pct}%`;
  if (pct < 90) return `Attendance is below target at ${pct}%`;
  if (pct < 95) return `Attendance is acceptable at ${pct}%`;
  return `Attendance is strong at ${pct}%`;
}

function interpretAcademicFactor(factor: RiskFactor): string {
  if (factor.name === 'Academic Performance') {
    const level = factor.rawValue;
    if (level <= 1) return 'Performing well below grade level';
    if (level === 2) return 'Approaching grade level standards';
    if (level === 3) return 'Meeting grade level standards';
    if (level === 4) return 'Above grade level expectations';
    return 'Exceeding grade level standards';
  }

  if (factor.name === 'Academic Growth') {
    const pctl = Math.round(factor.rawValue);
    if (pctl < 25) return `Growth is in bottom quartile (${pctl}th percentile)`;
    if (pctl < 40) return `Growth is below average (${pctl}th percentile)`;
    if (pctl < 60) return `Growth is on target (${pctl}th percentile)`;
    return `Growth is above average (${pctl}th percentile)`;
  }

  return factor.description;
}

function interpretEngagementFactor(factor: RiskFactor): string {
  const score = factor.rawValue;
  const pct = typeof score === 'number' && score <= 1 ? Math.round(score * 100) : Math.round(score);

  if (pct < 30) return 'Engagement is very low';
  if (pct < 50) return 'Engagement is below expectations';
  if (pct < 70) return 'Engagement is moderate';
  return 'Engagement is strong';
}

function interpretBehaviorFactor(factor: RiskFactor): string {
  const incidents = Math.round(factor.rawValue);
  if (incidents === 0) return 'No behavior incidents recorded';
  if (incidents === 1) return '1 behavior incident this term';
  if (incidents <= 3) return `${incidents} behavior incidents this term`;
  return `${incidents} behavior incidents - pattern of concern`;
}

function interpretAssignmentFactor(factor: RiskFactor): string {
  const rate = factor.rawValue;
  const pct = typeof rate === 'number' && rate <= 1 ? Math.round(rate * 100) : Math.round(rate);

  if (pct === 0) return 'All assignments completed';
  if (pct < 10) return 'Few missing assignments';
  if (pct < 20) return `${pct}% of assignments missing`;
  if (pct < 40) return `${pct}% missing assignments - needs attention`;
  return `${pct}% missing assignments - significant gap`;
}

/**
 * Get a short label for a factor category
 */
export function getFactorCategoryLabel(category: RiskFactor['category']): string {
  const labels: Record<RiskFactor['category'], string> = {
    attendance: 'Attendance',
    academic: 'Academic',
    behavior: 'Behavior',
    engagement: 'Engagement',
    assignments: 'Assignments',
    trend: 'Trend',
    other: 'Other',
  };
  return labels[category];
}

// ============================================================
// Trajectory Interpretation
// ============================================================

/**
 * Convert trajectory to plain language
 */
export function interpretTrajectory(
  trajectory: Trajectory,
  previousLevel?: RiskLevel | null
): string {
  switch (trajectory) {
    case 'improving':
      return previousLevel
        ? `Improving - was ${getRiskBadgeText(previousLevel).toLowerCase()} recently`
        : 'Trend is improving';
    case 'declining':
      return previousLevel
        ? `Getting worse - was ${getRiskBadgeText(previousLevel).toLowerCase()} recently`
        : 'Trend is declining';
    case 'stable':
      return 'Holding steady';
    default:
      return '';
  }
}

/**
 * Get trajectory icon name
 */
export function getTrajectoryIcon(trajectory: Trajectory): 'up' | 'down' | 'right' {
  switch (trajectory) {
    case 'improving':
      return 'up';
    case 'declining':
      return 'down';
    default:
      return 'right';
  }
}

/**
 * Get trajectory color class
 */
export function getTrajectoryColor(trajectory: Trajectory): string {
  switch (trajectory) {
    case 'improving':
      return 'text-emerald-400';
    case 'declining':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
}

// ============================================================
// Confidence Interpretation
// ============================================================

/**
 * Convert confidence level to plain language
 */
export function interpretConfidence(confidence: number): string | null {
  if (confidence >= 0.8) return null; // Don't show if high confidence
  if (confidence >= 0.6) return 'Some data missing - assessment may be incomplete';
  if (confidence >= 0.4) return 'Limited data available - connect more sources for accuracy';
  return 'Very limited data - risk assessment may be unreliable';
}

/**
 * Get confidence badge variant
 */
export function getConfidenceBadge(confidence: number): { show: boolean; label: string; variant: 'warning' | 'danger' } | null {
  if (confidence >= 0.8) return null;
  if (confidence >= 0.6) return { show: true, label: 'Partial Data', variant: 'warning' };
  return { show: true, label: 'Limited Data', variant: 'danger' };
}

// ============================================================
// Action Recommendations
// ============================================================

/**
 * Generate action prompts based on risk factors
 */
export function generateActionPrompts(
  factors: RiskFactor[],
  level: RiskLevel,
  hasIntervention: boolean
): string[] {
  const actions: string[] = [];

  // Sort factors by weighted score
  const sorted = [...factors].sort((a, b) => b.weightedScore - a.weightedScore);
  const topFactor = sorted[0];

  // Urgent actions for critical level
  if (level === 'critical') {
    actions.push('Schedule Student Support Team meeting urgently');
  }

  // Factor-specific recommendations
  if (topFactor?.category === 'attendance' && topFactor.weightedScore > 0.15) {
    actions.push('Contact family about attendance');
    if (level === 'critical' || level === 'at_risk') {
      actions.push('Consider attendance mentor assignment');
    }
  }

  if (topFactor?.category === 'academic' && topFactor.weightedScore > 0.15) {
    actions.push('Review for academic intervention placement');
    actions.push('Consider tutoring or small group instruction');
  }

  if (topFactor?.category === 'behavior' && topFactor.weightedScore > 0.15) {
    actions.push('Review behavior support plan');
    actions.push('Schedule counseling check-in');
  }

  if (topFactor?.category === 'engagement' && topFactor.weightedScore > 0.1) {
    actions.push('Connect with student about interests');
    actions.push('Consider peer mentoring');
  }

  if (topFactor?.category === 'assignments' && topFactor.weightedScore > 0.1) {
    actions.push('Check in about assignment completion barriers');
    actions.push('Review homework support options');
  }

  // No intervention warning
  if (!hasIntervention && (level === 'at_risk' || level === 'critical')) {
    actions.unshift('Assign intervention - student has none currently');
  }

  return [...new Set(actions)].slice(0, 4);
}

// ============================================================
// Summary Generation
// ============================================================

/**
 * Generate a single-sentence summary for a student
 */
export function generateStudentSummary(
  studentName: string,
  level: RiskLevel,
  factors: RiskFactor[],
  trajectory: Trajectory
): string {
  const sorted = [...factors].sort((a, b) => b.weightedScore - a.weightedScore);
  const topFactor = sorted[0];

  const status = getRiskSummary(studentName, level, trajectory);
  const reason = topFactor ? interpretFactor(topFactor) : '';

  if (reason) {
    return `${status}. ${reason}.`;
  }
  return `${status}.`;
}

/**
 * Get the primary concern as a short phrase
 */
export function getPrimaryConcern(factors: RiskFactor[]): string | null {
  if (!factors || factors.length === 0) return null;

  const sorted = [...factors].sort((a, b) => b.weightedScore - a.weightedScore);
  const top = sorted[0];

  if (top.weightedScore < 0.1) return null;

  const categoryLabels: Record<RiskFactor['category'], string> = {
    attendance: 'Attendance',
    academic: 'Academics',
    behavior: 'Behavior',
    engagement: 'Engagement',
    assignments: 'Missing work',
    trend: 'Declining trend',
    other: 'Other factors',
  };

  return categoryLabels[top.category];
}
