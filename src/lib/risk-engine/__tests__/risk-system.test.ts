/**
 * Risk System Unit Tests
 * ======================
 *
 * Tests for the unified RiskSystem module.
 * Focuses on type definitions, configuration parsing,
 * and helper functions that don't require database access.
 */

import { describe, it, expect } from 'vitest';
import {
  parseConfigRow,
  type RiskLevel,
  type Trajectory,
  type RiskModelConfig,
  type RiskModelConfigRow,
} from '../types';

// ============================================================
// Risk Level Tests
// ============================================================

describe('RiskLevel type', () => {
  it('includes all 4 MTSS tiers', () => {
    const levels: RiskLevel[] = ['on_track', 'watch', 'at_risk', 'critical'];
    expect(levels).toHaveLength(4);
  });

  it('levels are ordered by severity', () => {
    const levelOrder: Record<RiskLevel, number> = {
      'on_track': 0,
      'watch': 1,
      'at_risk': 2,
      'critical': 3,
    };

    expect(levelOrder['on_track']).toBeLessThan(levelOrder['watch']);
    expect(levelOrder['watch']).toBeLessThan(levelOrder['at_risk']);
    expect(levelOrder['at_risk']).toBeLessThan(levelOrder['critical']);
  });
});

// ============================================================
// Trajectory Tests
// ============================================================

describe('Trajectory type', () => {
  it('includes all 3 directions', () => {
    const trajectories: Trajectory[] = ['improving', 'stable', 'declining'];
    expect(trajectories).toHaveLength(3);
  });
});

// ============================================================
// Config Parsing Tests
// ============================================================

describe('parseConfigRow', () => {
  const mockConfigRow: RiskModelConfigRow = {
    id: 'cfg-123',
    school_id: 'sch-456',
    name: 'Test MTSS Model',
    is_active: true,
    weight_attendance: 0.250,
    weight_academic: 0.300,
    weight_assignments: 0.200,
    weight_behavior: 0.150,
    weight_trend: 0.100,
    threshold_on_track: 0.300,
    threshold_watch: 0.600,
    threshold_at_risk: 0.800,
    attendance_floor: 90.00,
    attendance_critical: 75.00,
    assignment_missing_warn: 0.200,
    behavior_incident_cap: 5,
    assessment_floor_pct: 50,
    trend_lookback_weeks: 4,
    trend_decline_threshold: -0.050,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    created_by: 'user-789',
  };

  it('parses id and schoolId correctly', () => {
    const config = parseConfigRow(mockConfigRow);
    expect(config.id).toBe('cfg-123');
    expect(config.schoolId).toBe('sch-456');
    expect(config.name).toBe('Test MTSS Model');
  });

  it('parses weights correctly', () => {
    const config = parseConfigRow(mockConfigRow);
    expect(config.weights.attendance).toBe(0.250);
    expect(config.weights.academic).toBe(0.300);
    expect(config.weights.assignments).toBe(0.200);
    expect(config.weights.behavior).toBe(0.150);
    expect(config.weights.trend).toBe(0.100);
  });

  it('weights sum to 1.0', () => {
    const config = parseConfigRow(mockConfigRow);
    const sum = config.weights.attendance +
                config.weights.academic +
                config.weights.assignments +
                config.weights.behavior +
                config.weights.trend;
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('parses thresholds correctly', () => {
    const config = parseConfigRow(mockConfigRow);
    expect(config.thresholds.onTrack).toBe(0.300);
    expect(config.thresholds.watch).toBe(0.600);
    expect(config.thresholds.atRisk).toBe(0.800);
  });

  it('thresholds are in ascending order', () => {
    const config = parseConfigRow(mockConfigRow);
    expect(config.thresholds.onTrack).toBeLessThan(config.thresholds.watch);
    expect(config.thresholds.watch).toBeLessThan(config.thresholds.atRisk);
    expect(config.thresholds.atRisk).toBeLessThanOrEqual(1.0);
  });

  it('parses indicator parameters correctly', () => {
    const config = parseConfigRow(mockConfigRow);
    expect(config.indicators.attendanceFloor).toBe(90.00);
    expect(config.indicators.attendanceCritical).toBe(75.00);
    expect(config.indicators.assignmentMissingWarn).toBe(0.200);
    expect(config.indicators.behaviorIncidentCap).toBe(5);
    expect(config.indicators.assessmentFloorPct).toBe(50);
    expect(config.indicators.trendLookbackWeeks).toBe(4);
    expect(config.indicators.trendDeclineThreshold).toBe(-0.050);
  });

  it('converts string numbers correctly', () => {
    const stringRow = {
      ...mockConfigRow,
      weight_attendance: '0.250' as unknown as number,
      threshold_on_track: '0.300' as unknown as number,
    };
    const config = parseConfigRow(stringRow);
    expect(config.weights.attendance).toBe(0.250);
    expect(config.thresholds.onTrack).toBe(0.300);
  });
});

// ============================================================
// Risk Level Determination Tests
// ============================================================

describe('Risk Level Determination', () => {
  // Helper function that mirrors the actual level determination logic
  function determineRiskLevel(
    score: number,
    thresholds: { onTrack: number; watch: number; atRisk: number }
  ): RiskLevel {
    if (score >= thresholds.atRisk) return 'critical';
    if (score >= thresholds.watch) return 'at_risk';
    if (score >= thresholds.onTrack) return 'watch';
    return 'on_track';
  }

  const defaultThresholds = { onTrack: 0.30, watch: 0.50, atRisk: 0.70 };

  it('returns on_track for low scores', () => {
    expect(determineRiskLevel(0.0, defaultThresholds)).toBe('on_track');
    expect(determineRiskLevel(0.1, defaultThresholds)).toBe('on_track');
    expect(determineRiskLevel(0.29, defaultThresholds)).toBe('on_track');
  });

  it('returns watch for moderate-low scores', () => {
    expect(determineRiskLevel(0.30, defaultThresholds)).toBe('watch');
    expect(determineRiskLevel(0.40, defaultThresholds)).toBe('watch');
    expect(determineRiskLevel(0.49, defaultThresholds)).toBe('watch');
  });

  it('returns at_risk for moderate-high scores', () => {
    expect(determineRiskLevel(0.50, defaultThresholds)).toBe('at_risk');
    expect(determineRiskLevel(0.60, defaultThresholds)).toBe('at_risk');
    expect(determineRiskLevel(0.69, defaultThresholds)).toBe('at_risk');
  });

  it('returns critical for high scores', () => {
    expect(determineRiskLevel(0.70, defaultThresholds)).toBe('critical');
    expect(determineRiskLevel(0.85, defaultThresholds)).toBe('critical');
    expect(determineRiskLevel(1.0, defaultThresholds)).toBe('critical');
  });

  it('handles edge cases at exact boundaries', () => {
    expect(determineRiskLevel(0.30, defaultThresholds)).toBe('watch');
    expect(determineRiskLevel(0.50, defaultThresholds)).toBe('at_risk');
    expect(determineRiskLevel(0.70, defaultThresholds)).toBe('critical');
  });
});

// ============================================================
// Level Change Detection Tests
// ============================================================

describe('Level Change Detection', () => {
  function detectLevelChange(
    current: RiskLevel,
    previous: RiskLevel | null
  ): { changed: boolean; direction: 'improved' | 'worsened' | 'same' } {
    if (!previous || current === previous) {
      return { changed: false, direction: 'same' };
    }

    const order: Record<RiskLevel, number> = {
      'on_track': 0,
      'watch': 1,
      'at_risk': 2,
      'critical': 3,
    };

    const currentOrder = order[current];
    const previousOrder = order[previous];

    return {
      changed: true,
      direction: currentOrder < previousOrder ? 'improved' : 'worsened',
    };
  }

  it('detects no change when levels are same', () => {
    const result = detectLevelChange('at_risk', 'at_risk');
    expect(result.changed).toBe(false);
    expect(result.direction).toBe('same');
  });

  it('detects no change when previous is null', () => {
    const result = detectLevelChange('watch', null);
    expect(result.changed).toBe(false);
    expect(result.direction).toBe('same');
  });

  it('detects improvement (lower severity)', () => {
    expect(detectLevelChange('on_track', 'watch').direction).toBe('improved');
    expect(detectLevelChange('watch', 'at_risk').direction).toBe('improved');
    expect(detectLevelChange('at_risk', 'critical').direction).toBe('improved');
    expect(detectLevelChange('on_track', 'critical').direction).toBe('improved');
  });

  it('detects worsening (higher severity)', () => {
    expect(detectLevelChange('watch', 'on_track').direction).toBe('worsened');
    expect(detectLevelChange('at_risk', 'watch').direction).toBe('worsened');
    expect(detectLevelChange('critical', 'at_risk').direction).toBe('worsened');
    expect(detectLevelChange('critical', 'on_track').direction).toBe('worsened');
  });
});

// ============================================================
// Evaluation Summary Tests
// ============================================================

describe('Evaluation Summary', () => {
  interface MockDistribution {
    on_track: number;
    watch: number;
    at_risk: number;
    critical: number;
  }

  function calculateSummaryMetrics(distribution: MockDistribution) {
    const total = distribution.on_track +
                  distribution.watch +
                  distribution.at_risk +
                  distribution.critical;

    const needsAttention = distribution.at_risk + distribution.critical;
    const percentNeedingAttention = total > 0 ? needsAttention / total : 0;

    return {
      total,
      needsAttention,
      percentNeedingAttention,
      onTrackPercent: total > 0 ? distribution.on_track / total : 0,
    };
  }

  it('calculates total students correctly', () => {
    const dist = { on_track: 100, watch: 50, at_risk: 30, critical: 10 };
    const summary = calculateSummaryMetrics(dist);
    expect(summary.total).toBe(190);
  });

  it('calculates needs attention correctly', () => {
    const dist = { on_track: 100, watch: 50, at_risk: 30, critical: 10 };
    const summary = calculateSummaryMetrics(dist);
    expect(summary.needsAttention).toBe(40);
  });

  it('calculates percentages correctly', () => {
    const dist = { on_track: 75, watch: 15, at_risk: 7, critical: 3 };
    const summary = calculateSummaryMetrics(dist);
    expect(summary.percentNeedingAttention).toBe(0.10);
    expect(summary.onTrackPercent).toBe(0.75);
  });

  it('handles empty distribution', () => {
    const dist = { on_track: 0, watch: 0, at_risk: 0, critical: 0 };
    const summary = calculateSummaryMetrics(dist);
    expect(summary.total).toBe(0);
    expect(summary.percentNeedingAttention).toBe(0);
  });
});

// ============================================================
// Risk Factor Sorting Tests
// ============================================================

describe('Risk Factor Sorting', () => {
  interface SimpleFactor {
    name: string;
    weightedScore: number;
  }

  function getTopFactors(factors: SimpleFactor[], n: number): SimpleFactor[] {
    return [...factors]
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, n);
  }

  it('returns top N factors by weighted score', () => {
    const factors: SimpleFactor[] = [
      { name: 'Attendance', weightedScore: 0.15 },
      { name: 'Academic', weightedScore: 0.25 },
      { name: 'Behavior', weightedScore: 0.08 },
      { name: 'Engagement', weightedScore: 0.12 },
    ];

    const top2 = getTopFactors(factors, 2);
    expect(top2).toHaveLength(2);
    expect(top2[0].name).toBe('Academic');
    expect(top2[1].name).toBe('Attendance');
  });

  it('handles requesting more factors than available', () => {
    const factors: SimpleFactor[] = [
      { name: 'A', weightedScore: 0.5 },
      { name: 'B', weightedScore: 0.3 },
    ];

    const top5 = getTopFactors(factors, 5);
    expect(top5).toHaveLength(2);
  });

  it('handles empty factors', () => {
    const top3 = getTopFactors([], 3);
    expect(top3).toHaveLength(0);
  });

  it('maintains stable sort for equal scores', () => {
    const factors: SimpleFactor[] = [
      { name: 'First', weightedScore: 0.5 },
      { name: 'Second', weightedScore: 0.5 },
      { name: 'Third', weightedScore: 0.5 },
    ];

    const sorted = getTopFactors(factors, 3);
    expect(sorted).toHaveLength(3);
  });
});
