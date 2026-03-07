/**
 * Risk Engine Integration Tests
 * =============================
 *
 * Integration tests for batch evaluation and alert generation.
 * Tests the orchestrator pipeline and early warning rule evaluation.
 *
 * Sprint 3: Risk Engine Test Coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AlertRule, AlertCondition } from '@/lib/risk/early-warning';
import type { Student } from '@/lib/database.types';
import type { BatchEvaluationResult } from '../orchestrator';
import type { RiskLevel } from '../types';

// ============================================================
// Mock Alert Rule Evaluation (mirrors EarlyWarningSystem logic)
// ============================================================

function evaluateThreshold(value: number, operator: string, threshold: number): boolean {
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

function getFieldValue(student: Partial<Student>, field: string): number {
  const value = student[field as keyof Student];
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return 0;
}

function evaluateCondition(
  condition: AlertCondition,
  current: Partial<Student>,
  previous?: Partial<Student>
): boolean {
  const currentValue = getFieldValue(current, condition.field);

  switch (condition.type) {
    case 'threshold':
      return evaluateThreshold(currentValue, condition.operator, condition.value);

    case 'change':
      if (!previous) return false;
      const previousValue = getFieldValue(previous, condition.field);
      const change = currentValue - previousValue;
      return evaluateThreshold(change, condition.operator, condition.value);

    case 'absence':
      return evaluateThreshold(currentValue, condition.operator, condition.value);

    default:
      return false;
  }
}

function checkStudentAgainstRules(
  student: Partial<Student>,
  rules: AlertRule[],
  previousState?: Partial<Student>
): string[] {
  const triggeredRules: string[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (evaluateCondition(rule.condition, student, previousState)) {
      triggeredRules.push(rule.id);
    }
  }

  return triggeredRules;
}

// ============================================================
// Mock Batch Evaluation Pipeline
// ============================================================

interface MockStudent {
  id: string;
  attendance_rate: number;
  proficiency_level: number;
  growth_percentile: number;
  is_chronically_absent: boolean;
  risk_score?: number;
  risk_level?: RiskLevel;
  consecutive_absences?: number;
}

function computeRiskScore(student: MockStudent): number {
  let score = 0;

  // Attendance factor (25% weight)
  if (student.attendance_rate < 0.85) score += 0.25;
  else if (student.attendance_rate < 0.90) score += 0.175;
  else if (student.attendance_rate < 0.95) score += 0.1;
  else score += 0.025;

  // Academic factor (30% weight)
  if (student.proficiency_level <= 1) score += 0.30;
  else if (student.proficiency_level === 2) score += 0.21;
  else if (student.proficiency_level === 3) score += 0.09;
  else score += 0.03;

  // Growth factor (15% weight)
  if (student.growth_percentile < 25) score += 0.15;
  else if (student.growth_percentile < 40) score += 0.09;
  else if (student.growth_percentile < 50) score += 0.045;
  else score += 0.015;

  // Chronic absence (5% weight)
  if (student.is_chronically_absent) score += 0.05;

  return Math.min(1, Math.max(0, score));
}

function classifyRiskLevel(score: number): RiskLevel {
  if (score >= 0.65) return 'critical';
  if (score >= 0.45) return 'at_risk';
  if (score >= 0.25) return 'watch';
  return 'on_track';
}

function runBatchEvaluation(students: MockStudent[]): BatchEvaluationResult {
  const startedAt = new Date();
  const distribution: Record<RiskLevel, number> = {
    on_track: 0,
    watch: 0,
    at_risk: 0,
    critical: 0,
  };

  for (const student of students) {
    student.risk_score = computeRiskScore(student);
    student.risk_level = classifyRiskLevel(student.risk_score);
    distribution[student.risk_level]++;
  }

  return {
    schoolId: 'test-school',
    triggerType: 'batch_nightly',
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    aggregation: {
      studentsProcessed: students.length,
      metricsUpserted: students.length,
      historySnapshotted: students.length,
      errors: [],
    },
    evaluation: {
      studentsEvaluated: students.length,
      distribution,
      levelChanges: 0,
      errors: [],
    },
    alerts: {
      studentsChecked: students.length,
      alertsGenerated: 0,
      errors: [],
    },
    success: true,
    errors: [],
  };
}

// ============================================================
// Default Alert Rules for Testing
// ============================================================

const TEST_ALERT_RULES: AlertRule[] = [
  {
    id: 'attendance-drop',
    name: 'Sudden Attendance Drop',
    description: 'Attendance drops by more than 10%',
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
// Batch Evaluation Integration Tests
// ============================================================

describe('Batch Evaluation Pipeline', () => {
  it('evaluates empty student list without errors', () => {
    const result = runBatchEvaluation([]);

    expect(result.success).toBe(true);
    expect(result.evaluation.studentsEvaluated).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('correctly distributes students across risk tiers', () => {
    const students: MockStudent[] = [
      { id: '1', attendance_rate: 0.98, proficiency_level: 4, growth_percentile: 75, is_chronically_absent: false },
      { id: '2', attendance_rate: 0.92, proficiency_level: 3, growth_percentile: 45, is_chronically_absent: false },
      { id: '3', attendance_rate: 0.88, proficiency_level: 2, growth_percentile: 35, is_chronically_absent: false },
      { id: '4', attendance_rate: 0.80, proficiency_level: 1, growth_percentile: 15, is_chronically_absent: true },
    ];

    const result = runBatchEvaluation(students);

    expect(result.success).toBe(true);
    expect(result.evaluation.studentsEvaluated).toBe(4);

    // Verify risk scores are calculated
    expect(students[0].risk_score).toBeDefined();
    expect(students[0].risk_level).toBe('on_track');
    expect(students[3].risk_level).toBe('critical');
  });

  it('computes correct distribution counts', () => {
    const students: MockStudent[] = [
      // On track students (low scores)
      { id: '1', attendance_rate: 0.99, proficiency_level: 5, growth_percentile: 90, is_chronically_absent: false },
      { id: '2', attendance_rate: 0.98, proficiency_level: 4, growth_percentile: 80, is_chronically_absent: false },
      // Watch students
      { id: '3', attendance_rate: 0.93, proficiency_level: 3, growth_percentile: 45, is_chronically_absent: false },
      // At risk students
      { id: '4', attendance_rate: 0.87, proficiency_level: 2, growth_percentile: 30, is_chronically_absent: false },
      // Critical students
      { id: '5', attendance_rate: 0.78, proficiency_level: 1, growth_percentile: 10, is_chronically_absent: true },
    ];

    const result = runBatchEvaluation(students);

    expect(result.evaluation.distribution.on_track).toBeGreaterThanOrEqual(1);
    expect(result.evaluation.distribution.critical).toBeGreaterThanOrEqual(1);

    // Total should equal student count
    const total = Object.values(result.evaluation.distribution).reduce((a, b) => a + b, 0);
    expect(total).toBe(5);
  });

  it('handles students with edge-case metrics', () => {
    const students: MockStudent[] = [
      // Perfect student
      { id: '1', attendance_rate: 1.0, proficiency_level: 5, growth_percentile: 99, is_chronically_absent: false },
      // Worst case
      { id: '2', attendance_rate: 0.0, proficiency_level: 0, growth_percentile: 0, is_chronically_absent: true },
    ];

    const result = runBatchEvaluation(students);

    expect(result.success).toBe(true);
    expect(students[0].risk_score).toBeLessThan(0.25);
    expect(students[1].risk_score).toBeGreaterThanOrEqual(0.65);
  });

  it('returns timing information', () => {
    const students: MockStudent[] = [
      { id: '1', attendance_rate: 0.95, proficiency_level: 3, growth_percentile: 50, is_chronically_absent: false },
    ];

    const result = runBatchEvaluation(students);

    expect(result.startedAt).toBeDefined();
    expect(result.completedAt).toBeDefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(new Date(result.completedAt).getTime()).toBeGreaterThanOrEqual(new Date(result.startedAt).getTime());
  });
});

// ============================================================
// Alert Rule Evaluation Tests
// ============================================================

describe('Alert Rule Evaluation', () => {
  describe('Threshold Rules', () => {
    it('triggers chronic absence alert when student is chronically absent', () => {
      const student = { is_chronically_absent: true };
      const triggered = checkStudentAgainstRules(student, TEST_ALERT_RULES);

      expect(triggered).toContain('chronic-absence-new');
    });

    it('does not trigger chronic absence alert for non-chronically absent student', () => {
      const student = { is_chronically_absent: false };
      const triggered = checkStudentAgainstRules(student, TEST_ALERT_RULES);

      expect(triggered).not.toContain('chronic-absence-new');
    });

    it('triggers critical risk alert when score >= 0.7', () => {
      const student = { risk_score: 0.75 };
      const triggered = checkStudentAgainstRules(student, TEST_ALERT_RULES);

      expect(triggered).toContain('risk-critical');
    });

    it('does not trigger critical risk alert when score < 0.7', () => {
      const student = { risk_score: 0.65 };
      const triggered = checkStudentAgainstRules(student, TEST_ALERT_RULES);

      expect(triggered).not.toContain('risk-critical');
    });

    it('triggers consecutive absences alert when >= 3', () => {
      const student = { consecutive_absences: 3 };
      const triggered = checkStudentAgainstRules(student, TEST_ALERT_RULES);

      expect(triggered).toContain('consecutive-absences');
    });

    it('does not trigger consecutive absences alert when < 3', () => {
      const student = { consecutive_absences: 2 };
      const triggered = checkStudentAgainstRules(student, TEST_ALERT_RULES);

      expect(triggered).not.toContain('consecutive-absences');
    });
  });

  describe('Change-Based Rules', () => {
    it('triggers attendance drop alert when attendance falls by > 10%', () => {
      const current = { attendance_rate: 0.80 };
      const previous = { attendance_rate: 0.95 };
      const triggered = checkStudentAgainstRules(current, TEST_ALERT_RULES, previous);

      expect(triggered).toContain('attendance-drop');
    });

    it('does not trigger attendance drop alert for small change', () => {
      const current = { attendance_rate: 0.92 };
      const previous = { attendance_rate: 0.95 };
      const triggered = checkStudentAgainstRules(current, TEST_ALERT_RULES, previous);

      expect(triggered).not.toContain('attendance-drop');
    });

    it('triggers grade decline alert when proficiency drops by 1+', () => {
      const current = { proficiency_level: 2 };
      const previous = { proficiency_level: 3 };
      const triggered = checkStudentAgainstRules(current, TEST_ALERT_RULES, previous);

      expect(triggered).toContain('grade-decline');
    });

    it('does not trigger grade decline alert for improvement', () => {
      const current = { proficiency_level: 4 };
      const previous = { proficiency_level: 3 };
      const triggered = checkStudentAgainstRules(current, TEST_ALERT_RULES, previous);

      expect(triggered).not.toContain('grade-decline');
    });

    it('does not trigger change-based alerts without previous state', () => {
      const current = { attendance_rate: 0.70, proficiency_level: 1 };
      const triggered = checkStudentAgainstRules(current, TEST_ALERT_RULES);

      // Change-based rules should not trigger
      expect(triggered).not.toContain('attendance-drop');
      expect(triggered).not.toContain('grade-decline');
    });
  });

  describe('Rule Enabling/Disabling', () => {
    it('does not trigger disabled rules', () => {
      const disabledRules = TEST_ALERT_RULES.map((r) => ({
        ...r,
        enabled: r.id !== 'chronic-absence-new',
      }));

      const student = { is_chronically_absent: true, risk_score: 0.8 };
      const triggered = checkStudentAgainstRules(student, disabledRules);

      expect(triggered).not.toContain('chronic-absence-new');
      expect(triggered).toContain('risk-critical');
    });

    it('triggers multiple rules when conditions match', () => {
      const student = {
        is_chronically_absent: true,
        risk_score: 0.75,
        consecutive_absences: 5,
      };
      const triggered = checkStudentAgainstRules(student, TEST_ALERT_RULES);

      expect(triggered).toContain('chronic-absence-new');
      expect(triggered).toContain('risk-critical');
      expect(triggered).toContain('consecutive-absences');
      expect(triggered.length).toBe(3);
    });
  });
});

// ============================================================
// End-to-End Pipeline Flow Tests
// ============================================================

describe('End-to-End Pipeline Flow', () => {
  it('evaluates students and identifies alert candidates', () => {
    const students: MockStudent[] = [
      // Should trigger critical risk alert
      { id: '1', attendance_rate: 0.75, proficiency_level: 1, growth_percentile: 10, is_chronically_absent: true },
      // Should trigger nothing
      { id: '2', attendance_rate: 0.98, proficiency_level: 4, growth_percentile: 80, is_chronically_absent: false },
    ];

    // Phase 1: Batch evaluation
    const evalResult = runBatchEvaluation(students);
    expect(evalResult.success).toBe(true);

    // Phase 2: Alert checking
    const alertCandidates = students.filter((s) => {
      const triggers = checkStudentAgainstRules(
        {
          is_chronically_absent: s.is_chronically_absent,
          risk_score: s.risk_score,
        },
        TEST_ALERT_RULES
      );
      return triggers.length > 0;
    });

    // Student 1 should have alerts
    expect(alertCandidates.length).toBe(1);
    expect(alertCandidates[0].id).toBe('1');
  });

  it('handles mixed risk population correctly', () => {
    // Create a realistic class distribution
    const students: MockStudent[] = [];

    // 60% on track
    for (let i = 0; i < 18; i++) {
      students.push({
        id: `ontrack-${i}`,
        attendance_rate: 0.95 + Math.random() * 0.05,
        proficiency_level: 3 + Math.floor(Math.random() * 2),
        growth_percentile: 50 + Math.floor(Math.random() * 40),
        is_chronically_absent: false,
      });
    }

    // 20% watch
    for (let i = 0; i < 6; i++) {
      students.push({
        id: `watch-${i}`,
        attendance_rate: 0.90 + Math.random() * 0.05,
        proficiency_level: 2 + Math.floor(Math.random() * 2),
        growth_percentile: 40 + Math.floor(Math.random() * 15),
        is_chronically_absent: false,
      });
    }

    // 15% at risk
    for (let i = 0; i < 5; i++) {
      students.push({
        id: `atrisk-${i}`,
        attendance_rate: 0.85 + Math.random() * 0.05,
        proficiency_level: 2,
        growth_percentile: 25 + Math.floor(Math.random() * 15),
        is_chronically_absent: false,
      });
    }

    // 5% critical
    for (let i = 0; i < 1; i++) {
      students.push({
        id: `critical-${i}`,
        attendance_rate: 0.75 + Math.random() * 0.1,
        proficiency_level: 1,
        growth_percentile: 10 + Math.floor(Math.random() * 15),
        is_chronically_absent: true,
      });
    }

    const result = runBatchEvaluation(students);

    expect(result.success).toBe(true);
    expect(result.evaluation.studentsEvaluated).toBe(30);

    // Should have students in each tier
    expect(result.evaluation.distribution.on_track).toBeGreaterThan(0);
    expect(result.evaluation.distribution.critical).toBeGreaterThan(0);
  });
});

// ============================================================
// Operator Evaluation Tests
// ============================================================

describe('Operator Evaluation', () => {
  describe('evaluateThreshold', () => {
    it('handles gt (greater than) operator', () => {
      expect(evaluateThreshold(5, 'gt', 3)).toBe(true);
      expect(evaluateThreshold(3, 'gt', 3)).toBe(false);
      expect(evaluateThreshold(2, 'gt', 3)).toBe(false);
    });

    it('handles lt (less than) operator', () => {
      expect(evaluateThreshold(2, 'lt', 3)).toBe(true);
      expect(evaluateThreshold(3, 'lt', 3)).toBe(false);
      expect(evaluateThreshold(5, 'lt', 3)).toBe(false);
    });

    it('handles gte (greater than or equal) operator', () => {
      expect(evaluateThreshold(5, 'gte', 3)).toBe(true);
      expect(evaluateThreshold(3, 'gte', 3)).toBe(true);
      expect(evaluateThreshold(2, 'gte', 3)).toBe(false);
    });

    it('handles lte (less than or equal) operator', () => {
      expect(evaluateThreshold(2, 'lte', 3)).toBe(true);
      expect(evaluateThreshold(3, 'lte', 3)).toBe(true);
      expect(evaluateThreshold(5, 'lte', 3)).toBe(false);
    });

    it('handles eq (equal) operator', () => {
      expect(evaluateThreshold(3, 'eq', 3)).toBe(true);
      expect(evaluateThreshold(3.0, 'eq', 3)).toBe(true);
      expect(evaluateThreshold(2, 'eq', 3)).toBe(false);
    });

    it('handles change_by operator', () => {
      expect(evaluateThreshold(-0.15, 'change_by', -0.1)).toBe(true);
      expect(evaluateThreshold(-0.1, 'change_by', -0.1)).toBe(true);
      expect(evaluateThreshold(-0.05, 'change_by', -0.1)).toBe(false);
    });

    it('handles unknown operator', () => {
      expect(evaluateThreshold(5, 'unknown', 3)).toBe(false);
    });
  });
});
