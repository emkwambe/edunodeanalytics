/**
 * Dosage Analyzer Unit Tests
 * ==========================
 *
 * Tests for dosage analysis inference rules.
 *
 * Sprint 5: Dosage Analysis
 */

import { describe, it, expect } from 'vitest';
import { inferenceRules } from '../dosage-analyzer';
import type {
  Session,
  DosageMetrics,
  DosagePlan,
  DosageActual,
  DosageCompliance,
  DosageFidelity,
  DosagePace,
  DosageStatus,
  SessionStatus,
} from '../types';

// ============================================================
// Test Helpers
// ============================================================

function createMockMetrics(overrides: Partial<{
  plan: Partial<DosagePlan>;
  actual: Partial<DosageActual>;
  compliance: Partial<DosageCompliance>;
  fidelity: Partial<DosageFidelity>;
  pace: Partial<DosagePace>;
  status: DosageStatus;
}>): DosageMetrics {
  return {
    id: 'test-metrics-1',
    interventionId: 'test-intervention-1',
    schoolId: 'test-school-1',
    studentId: 'test-student-1',
    plan: {
      sessionsPerWeek: 3,
      minutesPerSession: 30,
      totalWeeks: 8,
      totalSessions: 24,
      totalMinutes: 720,
      ...overrides.plan,
    },
    actual: {
      sessionsCompleted: 10,
      sessionsPartial: 1,
      sessionsCancelled: 2,
      sessionsNoShow: 1,
      totalMinutes: 300,
      ...overrides.actual,
    },
    compliance: {
      sessionCompletionRate: 0.8,
      dosageComplianceRate: 0.75,
      attendanceRate: 0.85,
      ...overrides.compliance,
    },
    fidelity: {
      averageScore: 0.85,
      trend: 'stable',
      ...overrides.fidelity,
    },
    pace: {
      weeksElapsed: 4,
      sessionsBehind: 1,
      minutesBehind: 60,
      onTrack: true,
      ...overrides.pace,
    },
    status: overrides.status ?? 'on_track',
    inferenceFlags: [],
    firstSessionDate: new Date('2026-02-01'),
    lastSessionDate: new Date('2026-02-28'),
    nextSessionDate: new Date('2026-03-03'),
    computedAt: new Date(),
  };
}

function createMockSession(overrides: Partial<{
  status: SessionStatus;
  scheduledDate: Date;
  fidelityScore: number | null;
  studentEngaged: boolean;
}>): Session {
  return {
    id: `session-${Math.random().toString(36).slice(2)}`,
    interventionId: 'test-intervention-1',
    schoolId: 'test-school-1',
    studentId: 'test-student-1',
    scheduledDate: overrides.scheduledDate ?? new Date(),
    scheduledStartTime: '09:00',
    scheduledDurationMinutes: 30,
    actualDate: overrides.status === 'completed' ? overrides.scheduledDate ?? new Date() : null,
    actualStartTime: overrides.status === 'completed' ? '09:05' : null,
    actualDurationMinutes: overrides.status === 'completed' ? 30 : null,
    status: overrides.status ?? 'completed',
    cancellationReason: null,
    deliveredBy: 'user-1',
    location: 'Room 101',
    modality: 'in_person',
    groupSize: 1,
    fidelityScore: overrides.fidelityScore ?? 0.9,
    studentEngaged: overrides.studentEngaged ?? true,
    sessionNotes: null,
    createdAt: new Date(),
  };
}

function createSessionsWithDates(
  statuses: Array<{ status: SessionStatus; daysAgo: number; fidelityScore?: number; engaged?: boolean }>
): Session[] {
  return statuses.map(({ status, daysAgo, fidelityScore, engaged }) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return createMockSession({
      status,
      scheduledDate: date,
      fidelityScore: fidelityScore ?? (status === 'completed' ? 0.9 : null),
      studentEngaged: engaged ?? true,
    });
  });
}

// ============================================================
// Inference Rule Tests
// ============================================================

describe('Inference Rules', () => {
  describe('Rule 1: chronic_no_show', () => {
    const rule = inferenceRules.find((r) => r.id === 'chronic_no_show')!;

    it('triggers when 3+ no-shows in last 2 weeks', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'no_show', daysAgo: 2 },
        { status: 'no_show', daysAgo: 5 },
        { status: 'no_show', daysAgo: 10 },
        { status: 'completed', daysAgo: 7 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('critical');
      expect(flag?.data?.noShowCount).toBe(3);
    });

    it('does not trigger when no-shows are older than 2 weeks', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'no_show', daysAgo: 20 },
        { status: 'no_show', daysAgo: 25 },
        { status: 'no_show', daysAgo: 30 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });

    it('does not trigger with only 2 no-shows', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'no_show', daysAgo: 2 },
        { status: 'no_show', daysAgo: 5 },
        { status: 'completed', daysAgo: 7 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });
  });

  describe('Rule 2: declining_attendance', () => {
    const rule = inferenceRules.find((r) => r.id === 'declining_attendance')!;

    it('triggers when attendance drops >20% from first half to second half', () => {
      const metrics = createMockMetrics({});
      // First 4 sessions: 3 completed, 1 partial (87.5% attended)
      // Last 4 sessions: 1 completed, 3 cancelled (25% attended)
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 28 },
        { status: 'completed', daysAgo: 26 },
        { status: 'completed', daysAgo: 24 },
        { status: 'partial', daysAgo: 22 },
        { status: 'completed', daysAgo: 14 },
        { status: 'cancelled', daysAgo: 12 },
        { status: 'cancelled', daysAgo: 10 },
        { status: 'cancelled', daysAgo: 8 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('warning');
    });

    it('does not trigger when attendance is stable', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 28 },
        { status: 'completed', daysAgo: 26 },
        { status: 'completed', daysAgo: 24 },
        { status: 'completed', daysAgo: 22 },
        { status: 'completed', daysAgo: 14 },
        { status: 'completed', daysAgo: 12 },
        { status: 'partial', daysAgo: 10 },
        { status: 'completed', daysAgo: 8 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });

    it('requires at least 6 sessions', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 28 },
        { status: 'cancelled', daysAgo: 14 },
        { status: 'cancelled', daysAgo: 8 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });
  });

  describe('Rule 3: low_fidelity', () => {
    const rule = inferenceRules.find((r) => r.id === 'low_fidelity')!;

    it('triggers when average fidelity is below 70%', () => {
      const metrics = createMockMetrics({
        fidelity: { averageScore: 0.55, trend: 'stable' },
      });

      const flag = rule.evaluate(metrics, []);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('warning');
      expect(flag?.message).toContain('55%');
    });

    it('does not trigger when fidelity is above 70%', () => {
      const metrics = createMockMetrics({
        fidelity: { averageScore: 0.85, trend: 'stable' },
      });

      const flag = rule.evaluate(metrics, []);
      expect(flag).toBeNull();
    });

    it('does not trigger when fidelity is null', () => {
      const metrics = createMockMetrics({
        fidelity: { averageScore: null, trend: null },
      });

      const flag = rule.evaluate(metrics, []);
      expect(flag).toBeNull();
    });
  });

  describe('Rule 4: declining_fidelity', () => {
    const rule = inferenceRules.find((r) => r.id === 'declining_fidelity')!;

    it('triggers when fidelity declining over last 3 sessions', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 10, fidelityScore: 0.95 },
        { status: 'completed', daysAgo: 7, fidelityScore: 0.85 },
        { status: 'completed', daysAgo: 4, fidelityScore: 0.75 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('warning');
    });

    it('does not trigger when fidelity is stable', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 10, fidelityScore: 0.85 },
        { status: 'completed', daysAgo: 7, fidelityScore: 0.85 },
        { status: 'completed', daysAgo: 4, fidelityScore: 0.85 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });

    it('does not trigger when fidelity is improving', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 10, fidelityScore: 0.70 },
        { status: 'completed', daysAgo: 7, fidelityScore: 0.80 },
        { status: 'completed', daysAgo: 4, fidelityScore: 0.90 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });
  });

  describe('Rule 5: behind_schedule', () => {
    const rule = inferenceRules.find((r) => r.id === 'behind_schedule')!;

    it('triggers when 2-3 sessions behind', () => {
      const metrics = createMockMetrics({
        pace: { weeksElapsed: 4, sessionsBehind: 3, minutesBehind: 90, onTrack: false },
      });

      const flag = rule.evaluate(metrics, []);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('warning');
      expect(flag?.message).toContain('3 sessions behind');
    });

    it('does not trigger when only 1 session behind', () => {
      const metrics = createMockMetrics({
        pace: { weeksElapsed: 4, sessionsBehind: 1, minutesBehind: 30, onTrack: true },
      });

      const flag = rule.evaluate(metrics, []);
      expect(flag).toBeNull();
    });

    it('does not trigger when 4+ sessions behind (critically_behind handles that)', () => {
      const metrics = createMockMetrics({
        pace: { weeksElapsed: 4, sessionsBehind: 5, minutesBehind: 150, onTrack: false },
      });

      const flag = rule.evaluate(metrics, []);
      expect(flag).toBeNull();
    });
  });

  describe('Rule 6: critically_behind', () => {
    const rule = inferenceRules.find((r) => r.id === 'critically_behind')!;

    it('triggers when 4+ sessions behind', () => {
      const metrics = createMockMetrics({
        pace: { weeksElapsed: 4, sessionsBehind: 5, minutesBehind: 150, onTrack: false },
      });

      const flag = rule.evaluate(metrics, []);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('critical');
    });

    it('triggers when compliance below 50%', () => {
      const metrics = createMockMetrics({
        compliance: { sessionCompletionRate: 0.4, dosageComplianceRate: 0.35, attendanceRate: 0.5 },
        pace: { weeksElapsed: 4, sessionsBehind: 2, minutesBehind: 60, onTrack: false },
      });

      const flag = rule.evaluate(metrics, []);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('critical');
    });

    it('does not trigger when on track', () => {
      const metrics = createMockMetrics({
        pace: { weeksElapsed: 4, sessionsBehind: 1, minutesBehind: 30, onTrack: true },
        compliance: { sessionCompletionRate: 0.9, dosageComplianceRate: 0.85, attendanceRate: 0.95 },
      });

      const flag = rule.evaluate(metrics, []);
      expect(flag).toBeNull();
    });
  });

  describe('Rule 7: low_engagement', () => {
    const rule = inferenceRules.find((r) => r.id === 'low_engagement')!;

    it('triggers when engagement rate below 60%', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 10, engaged: true },
        { status: 'completed', daysAgo: 7, engaged: false },
        { status: 'completed', daysAgo: 4, engaged: false },
        { status: 'partial', daysAgo: 2, engaged: false },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('warning');
    });

    it('does not trigger when engagement is good', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 10, engaged: true },
        { status: 'completed', daysAgo: 7, engaged: true },
        { status: 'completed', daysAgo: 4, engaged: true },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });

    it('requires at least 3 completed/partial sessions', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 10, engaged: false },
        { status: 'completed', daysAgo: 7, engaged: false },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });
  });

  describe('Rule 8: cancelled_streak', () => {
    const rule = inferenceRules.find((r) => r.id === 'cancelled_streak')!;

    it('triggers when 3+ consecutive cancellations', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 14 },
        { status: 'cancelled', daysAgo: 12 },
        { status: 'cancelled', daysAgo: 10 },
        { status: 'cancelled', daysAgo: 8 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('warning');
    });

    it('does not trigger when cancellations are not consecutive', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'cancelled', daysAgo: 14 },
        { status: 'completed', daysAgo: 12 },
        { status: 'cancelled', daysAgo: 10 },
        { status: 'completed', daysAgo: 8 },
        { status: 'cancelled', daysAgo: 6 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });
  });

  describe('Rule 9: missing_sessions', () => {
    const rule = inferenceRules.find((r) => r.id === 'missing_sessions')!;

    it('triggers when no sessions in last 2 weeks for active intervention', () => {
      const metrics = createMockMetrics({ status: 'on_track' });
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 20 },
        { status: 'completed', daysAgo: 25 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('warning');
    });

    it('does not trigger for completed interventions', () => {
      const metrics = createMockMetrics({ status: 'completed' });
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 20 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });

    it('does not trigger when there are recent sessions', () => {
      const metrics = createMockMetrics({ status: 'on_track' });
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 5 },
        { status: 'completed', daysAgo: 10 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });
  });

  describe('Rule 10: dosage_gap', () => {
    const rule = inferenceRules.find((r) => r.id === 'dosage_gap')!;

    it('triggers when gap of 10+ days between sessions', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 30 },
        { status: 'completed', daysAgo: 17 }, // 13 day gap
        { status: 'completed', daysAgo: 5 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).not.toBeNull();
      expect(flag?.severity).toBe('info');
      expect(flag?.data?.maxGapDays).toBe(13);
    });

    it('does not trigger when sessions are regular', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 14 },
        { status: 'completed', daysAgo: 12 },
        { status: 'completed', daysAgo: 10 },
        { status: 'completed', daysAgo: 7 },
        { status: 'completed', daysAgo: 5 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });

    it('requires at least 2 completed sessions', () => {
      const metrics = createMockMetrics({});
      const sessions = createSessionsWithDates([
        { status: 'completed', daysAgo: 30 },
      ]);

      const flag = rule.evaluate(metrics, sessions);
      expect(flag).toBeNull();
    });
  });
});

// ============================================================
// Rule Count Verification
// ============================================================

describe('Inference Rules Collection', () => {
  it('has exactly 10 rules', () => {
    expect(inferenceRules).toHaveLength(10);
  });

  it('all rules have required properties', () => {
    for (const rule of inferenceRules) {
      expect(rule.id).toBeDefined();
      expect(rule.name).toBeDefined();
      expect(rule.description).toBeDefined();
      expect(rule.severity).toMatch(/^(info|warning|critical)$/);
      expect(typeof rule.evaluate).toBe('function');
    }
  });

  it('all rule IDs are unique', () => {
    const ids = inferenceRules.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
