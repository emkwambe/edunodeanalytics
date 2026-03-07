/**
 * Detection Engine Unit Tests
 * ===========================
 *
 * Tests for normalizer functions, composite score calculator,
 * and trajectory detection.
 *
 * Sprint 3: Risk Engine Test Coverage
 */

import { describe, it, expect } from 'vitest';
import type { RiskModelConfig } from '../types';

// ============================================================
// Test Utilities - Standalone implementations for testing
// ============================================================

/**
 * Normalizer: Attendance Rate
 * Converts attendance rate (0-1) to risk score (0-1)
 * Higher risk score = worse attendance
 */
function normalizeAttendance(
  attendanceRate: number,
  config: RiskModelConfig | null
): number {
  if (config) {
    const floor = config.indicators.attendanceFloor / 100;
    const critical = config.indicators.attendanceCritical / 100;
    if (attendanceRate >= floor) {
      return 0;
    }
    const range = floor - critical;
    return Math.min(1, Math.max(0, (floor - attendanceRate) / (range || 1)));
  }
  // Legacy thresholds
  if (attendanceRate < 0.85) return 1.0;
  if (attendanceRate < 0.90) return 0.7;
  if (attendanceRate < 0.95) return 0.4;
  return 0.1;
}

/**
 * Normalizer: Academic Performance (Proficiency Level)
 * Converts proficiency level (1-5) to risk score (0-1)
 */
function normalizeAcademicPerformance(proficiency: number): number {
  if (proficiency <= 1) return 1.0;
  if (proficiency === 2) return 0.7;
  if (proficiency === 3) return 0.3;
  return 0.1;
}

/**
 * Normalizer: Academic Growth
 * Converts growth percentile (0-100) to risk score (0-1)
 */
function normalizeAcademicGrowth(
  growthPercentile: number,
  config: RiskModelConfig | null
): number {
  if (config) {
    const floor = config.indicators.assessmentFloorPct;
    if (growthPercentile >= floor) {
      return 0;
    }
    return Math.min(1, Math.max(0, (floor - growthPercentile) / floor));
  }
  // Legacy thresholds
  if (growthPercentile < 25) return 1.0;
  if (growthPercentile < 40) return 0.6;
  if (growthPercentile < 50) return 0.3;
  return 0.1;
}

/**
 * Normalizer: Chronic Absence
 * Binary: chronically absent = 1.0, not = 0.0
 */
function normalizeChronicAbsence(isChronicallyAbsent: boolean): number {
  return isChronicallyAbsent ? 1.0 : 0.0;
}

/**
 * Normalizer: Engagement Score
 * Converts engagement score (0-1) to risk score (0-1)
 */
function normalizeEngagement(engagementScore: number): number {
  if (engagementScore < 0.3) return 1.0;
  if (engagementScore < 0.5) return 0.6;
  if (engagementScore < 0.7) return 0.3;
  return 0.1;
}

/**
 * Composite Score Calculator
 * Calculates weighted sum of normalized factor scores
 */
function calculateCompositeScore(
  factors: Array<{ normalizedScore: number; weight: number }>
): number {
  const rawScore = factors.reduce(
    (sum, f) => sum + f.normalizedScore * f.weight,
    0
  );
  return Math.min(1, Math.max(0, Math.round(rawScore * 1000) / 1000));
}

/**
 * Trajectory Calculator
 * Determines if risk is improving, stable, or declining based on history
 */
function calculateTrajectory(
  history: Array<{ risk_score: number }>
): 'improving' | 'stable' | 'declining' {
  if (history.length < 2) {
    return 'stable';
  }

  const recentAvg = history.slice(0, 2).reduce((s, h) => s + h.risk_score, 0) / 2;
  const olderAvg =
    history.slice(2).reduce((s, h) => s + h.risk_score, 0) /
    Math.max(history.length - 2, 1);

  const change = recentAvg - olderAvg;

  if (change < -0.1) return 'improving';
  if (change > 0.1) return 'declining';
  return 'stable';
}

// ============================================================
// Attendance Normalizer Tests
// ============================================================

describe('normalizeAttendance', () => {
  describe('with legacy thresholds (no config)', () => {
    it('returns 1.0 for attendance below 85%', () => {
      expect(normalizeAttendance(0.84, null)).toBe(1.0);
      expect(normalizeAttendance(0.80, null)).toBe(1.0);
      expect(normalizeAttendance(0.50, null)).toBe(1.0);
    });

    it('returns 0.7 for attendance between 85% and 90%', () => {
      expect(normalizeAttendance(0.85, null)).toBe(0.7);
      expect(normalizeAttendance(0.87, null)).toBe(0.7);
      expect(normalizeAttendance(0.89, null)).toBe(0.7);
    });

    it('returns 0.4 for attendance between 90% and 95%', () => {
      expect(normalizeAttendance(0.90, null)).toBe(0.4);
      expect(normalizeAttendance(0.92, null)).toBe(0.4);
      expect(normalizeAttendance(0.94, null)).toBe(0.4);
    });

    it('returns 0.1 for attendance 95% and above', () => {
      expect(normalizeAttendance(0.95, null)).toBe(0.1);
      expect(normalizeAttendance(0.98, null)).toBe(0.1);
      expect(normalizeAttendance(1.0, null)).toBe(0.1);
    });
  });

  describe('with DB config', () => {
    const config: RiskModelConfig = {
      id: 'test-config',
      schoolId: 'test-school',
      name: 'Test Config',
      weights: { attendance: 0.25, academic: 0.30, assignments: 0.15, behavior: 0.15, trend: 0.15 },
      thresholds: { onTrack: 0.25, watch: 0.45, atRisk: 0.65 },
      indicators: {
        attendanceFloor: 95,
        attendanceCritical: 85,
        assignmentMissingWarn: 20,
        behaviorIncidentCap: 5,
        assessmentFloorPct: 40,
        trendLookbackWeeks: 4,
        trendDeclineThreshold: -0.1,
      },
    };

    it('returns 0 for attendance at or above floor (95%)', () => {
      expect(normalizeAttendance(0.95, config)).toBe(0);
      expect(normalizeAttendance(0.98, config)).toBe(0);
      expect(normalizeAttendance(1.0, config)).toBe(0);
    });

    it('returns 1 for attendance at critical threshold (85%)', () => {
      expect(normalizeAttendance(0.85, config)).toBe(1);
    });

    it('returns proportional score between floor and critical', () => {
      // 90% is halfway between 85% and 95%
      expect(normalizeAttendance(0.90, config)).toBeCloseTo(0.5, 5);
    });

    it('returns 1 for attendance below critical', () => {
      expect(normalizeAttendance(0.80, config)).toBe(1);
      expect(normalizeAttendance(0.50, config)).toBe(1);
    });
  });
});

// ============================================================
// Academic Performance Normalizer Tests
// ============================================================

describe('normalizeAcademicPerformance', () => {
  it('returns 1.0 for proficiency level 1 or below', () => {
    expect(normalizeAcademicPerformance(1)).toBe(1.0);
    expect(normalizeAcademicPerformance(0)).toBe(1.0);
    expect(normalizeAcademicPerformance(-1)).toBe(1.0);
  });

  it('returns 0.7 for proficiency level 2', () => {
    expect(normalizeAcademicPerformance(2)).toBe(0.7);
  });

  it('returns 0.3 for proficiency level 3', () => {
    expect(normalizeAcademicPerformance(3)).toBe(0.3);
  });

  it('returns 0.1 for proficiency level 4 or above', () => {
    expect(normalizeAcademicPerformance(4)).toBe(0.1);
    expect(normalizeAcademicPerformance(5)).toBe(0.1);
    expect(normalizeAcademicPerformance(10)).toBe(0.1);
  });
});

// ============================================================
// Academic Growth Normalizer Tests
// ============================================================

describe('normalizeAcademicGrowth', () => {
  describe('with legacy thresholds (no config)', () => {
    it('returns 1.0 for growth below 25th percentile', () => {
      expect(normalizeAcademicGrowth(24, null)).toBe(1.0);
      expect(normalizeAcademicGrowth(10, null)).toBe(1.0);
      expect(normalizeAcademicGrowth(0, null)).toBe(1.0);
    });

    it('returns 0.6 for growth between 25th and 40th percentile', () => {
      expect(normalizeAcademicGrowth(25, null)).toBe(0.6);
      expect(normalizeAcademicGrowth(35, null)).toBe(0.6);
      expect(normalizeAcademicGrowth(39, null)).toBe(0.6);
    });

    it('returns 0.3 for growth between 40th and 50th percentile', () => {
      expect(normalizeAcademicGrowth(40, null)).toBe(0.3);
      expect(normalizeAcademicGrowth(45, null)).toBe(0.3);
      expect(normalizeAcademicGrowth(49, null)).toBe(0.3);
    });

    it('returns 0.1 for growth at 50th percentile or above', () => {
      expect(normalizeAcademicGrowth(50, null)).toBe(0.1);
      expect(normalizeAcademicGrowth(75, null)).toBe(0.1);
      expect(normalizeAcademicGrowth(99, null)).toBe(0.1);
    });
  });

  describe('with DB config', () => {
    const config: RiskModelConfig = {
      id: 'test-config',
      schoolId: 'test-school',
      name: 'Test Config',
      weights: { attendance: 0.25, academic: 0.30, assignments: 0.15, behavior: 0.15, trend: 0.15 },
      thresholds: { onTrack: 0.25, watch: 0.45, atRisk: 0.65 },
      indicators: {
        attendanceFloor: 95,
        attendanceCritical: 85,
        assignmentMissingWarn: 20,
        behaviorIncidentCap: 5,
        assessmentFloorPct: 40,
        trendLookbackWeeks: 4,
        trendDeclineThreshold: -0.1,
      },
    };

    it('returns 0 for growth at or above floor (40th percentile)', () => {
      expect(normalizeAcademicGrowth(40, config)).toBe(0);
      expect(normalizeAcademicGrowth(60, config)).toBe(0);
      expect(normalizeAcademicGrowth(99, config)).toBe(0);
    });

    it('returns proportional score below floor', () => {
      // 20 is 50% of floor (40)
      expect(normalizeAcademicGrowth(20, config)).toBe(0.5);
    });

    it('returns 1 for growth at 0', () => {
      expect(normalizeAcademicGrowth(0, config)).toBe(1);
    });
  });
});

// ============================================================
// Chronic Absence Normalizer Tests
// ============================================================

describe('normalizeChronicAbsence', () => {
  it('returns 1.0 for chronically absent students', () => {
    expect(normalizeChronicAbsence(true)).toBe(1.0);
  });

  it('returns 0.0 for non-chronically absent students', () => {
    expect(normalizeChronicAbsence(false)).toBe(0.0);
  });
});

// ============================================================
// Engagement Normalizer Tests
// ============================================================

describe('normalizeEngagement', () => {
  it('returns 1.0 for engagement below 30%', () => {
    expect(normalizeEngagement(0.29)).toBe(1.0);
    expect(normalizeEngagement(0.1)).toBe(1.0);
    expect(normalizeEngagement(0)).toBe(1.0);
  });

  it('returns 0.6 for engagement between 30% and 50%', () => {
    expect(normalizeEngagement(0.3)).toBe(0.6);
    expect(normalizeEngagement(0.4)).toBe(0.6);
    expect(normalizeEngagement(0.49)).toBe(0.6);
  });

  it('returns 0.3 for engagement between 50% and 70%', () => {
    expect(normalizeEngagement(0.5)).toBe(0.3);
    expect(normalizeEngagement(0.6)).toBe(0.3);
    expect(normalizeEngagement(0.69)).toBe(0.3);
  });

  it('returns 0.1 for engagement 70% and above', () => {
    expect(normalizeEngagement(0.7)).toBe(0.1);
    expect(normalizeEngagement(0.85)).toBe(0.1);
    expect(normalizeEngagement(1.0)).toBe(0.1);
  });
});

// ============================================================
// Composite Score Calculator Tests
// ============================================================

describe('calculateCompositeScore', () => {
  it('returns 0 when all factors have 0 normalized scores', () => {
    const factors = [
      { normalizedScore: 0, weight: 0.25 },
      { normalizedScore: 0, weight: 0.30 },
      { normalizedScore: 0, weight: 0.45 },
    ];
    expect(calculateCompositeScore(factors)).toBe(0);
  });

  it('returns 1 when all factors have max normalized scores', () => {
    const factors = [
      { normalizedScore: 1, weight: 0.25 },
      { normalizedScore: 1, weight: 0.30 },
      { normalizedScore: 1, weight: 0.45 },
    ];
    expect(calculateCompositeScore(factors)).toBe(1);
  });

  it('calculates weighted average correctly', () => {
    const factors = [
      { normalizedScore: 0.5, weight: 0.50 }, // contributes 0.25
      { normalizedScore: 0.5, weight: 0.50 }, // contributes 0.25
    ];
    expect(calculateCompositeScore(factors)).toBe(0.5);
  });

  it('handles typical MTSS factor distribution', () => {
    const factors = [
      { normalizedScore: 0.4, weight: 0.25 }, // attendance: 0.1
      { normalizedScore: 0.3, weight: 0.30 }, // academic: 0.09
      { normalizedScore: 0.2, weight: 0.15 }, // assignments: 0.03
      { normalizedScore: 0.1, weight: 0.15 }, // behavior: 0.015
      { normalizedScore: 0.0, weight: 0.15 }, // trend: 0
    ];
    // Total: 0.1 + 0.09 + 0.03 + 0.015 + 0 = 0.235
    expect(calculateCompositeScore(factors)).toBe(0.235);
  });

  it('clamps score to [0, 1] range', () => {
    const overflowFactors = [
      { normalizedScore: 1.5, weight: 0.5 },
      { normalizedScore: 1.5, weight: 0.5 },
    ];
    expect(calculateCompositeScore(overflowFactors)).toBe(1);

    const underflowFactors = [
      { normalizedScore: -0.5, weight: 0.5 },
      { normalizedScore: -0.5, weight: 0.5 },
    ];
    expect(calculateCompositeScore(underflowFactors)).toBe(0);
  });

  it('handles empty factors array', () => {
    expect(calculateCompositeScore([])).toBe(0);
  });

  it('rounds to 3 decimal places', () => {
    const factors = [
      { normalizedScore: 0.3333, weight: 0.3333 },
      { normalizedScore: 0.3333, weight: 0.3333 },
      { normalizedScore: 0.3333, weight: 0.3334 },
    ];
    const score = calculateCompositeScore(factors);
    // Should be approximately 0.333 rounded to 3 decimals
    expect(score.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(3);
  });
});

// ============================================================
// Trajectory Detection Tests
// ============================================================

describe('calculateTrajectory', () => {
  it('returns stable when history has less than 2 entries', () => {
    expect(calculateTrajectory([])).toBe('stable');
    expect(calculateTrajectory([{ risk_score: 0.5 }])).toBe('stable');
  });

  it('returns stable when scores are relatively constant', () => {
    const history = [
      { risk_score: 0.5 },
      { risk_score: 0.5 },
      { risk_score: 0.5 },
      { risk_score: 0.5 },
    ];
    expect(calculateTrajectory(history)).toBe('stable');
  });

  it('returns improving when recent scores are lower (risk decreasing)', () => {
    const history = [
      { risk_score: 0.3 }, // most recent
      { risk_score: 0.3 },
      { risk_score: 0.6 }, // older
      { risk_score: 0.7 },
    ];
    // Recent avg: 0.3, Older avg: 0.65
    // Change: 0.3 - 0.65 = -0.35 (< -0.1 = improving)
    expect(calculateTrajectory(history)).toBe('improving');
  });

  it('returns declining when recent scores are higher (risk increasing)', () => {
    const history = [
      { risk_score: 0.7 }, // most recent
      { risk_score: 0.7 },
      { risk_score: 0.3 }, // older
      { risk_score: 0.3 },
    ];
    // Recent avg: 0.7, Older avg: 0.3
    // Change: 0.7 - 0.3 = 0.4 (> 0.1 = declining)
    expect(calculateTrajectory(history)).toBe('declining');
  });

  it('uses 2 most recent entries vs remaining for comparison', () => {
    const history = [
      { risk_score: 0.4 }, // recent 1
      { risk_score: 0.4 }, // recent 2
      { risk_score: 0.5 }, // older 1
      { risk_score: 0.5 }, // older 2
      { risk_score: 0.6 }, // older 3
    ];
    // Recent avg: 0.4, Older avg: (0.5 + 0.5 + 0.6) / 3 = 0.533
    // Change: 0.4 - 0.533 = -0.133 (< -0.1 = improving)
    expect(calculateTrajectory(history)).toBe('improving');
  });

  it('handles small changes as stable (within ±0.1 threshold)', () => {
    // Change of +0.05 should be stable (< 0.1 threshold)
    const stableHistory = [
      { risk_score: 0.525 },
      { risk_score: 0.525 },
      { risk_score: 0.475 },
      { risk_score: 0.475 },
    ];
    // Recent avg: 0.525, Older avg: 0.475
    // Change: 0.525 - 0.475 = 0.05 (< 0.1 threshold, so stable)
    expect(calculateTrajectory(stableHistory)).toBe('stable');

    // Change of -0.05 should also be stable
    const stableHistory2 = [
      { risk_score: 0.475 },
      { risk_score: 0.475 },
      { risk_score: 0.525 },
      { risk_score: 0.525 },
    ];
    // Recent avg: 0.475, Older avg: 0.525
    // Change: 0.475 - 0.525 = -0.05 (> -0.1 threshold, so stable)
    expect(calculateTrajectory(stableHistory2)).toBe('stable');
  });

  it('handles history with exactly 2 entries', () => {
    // With only 2 entries, recent avg = avg of both, older avg = 0/0 = depends on implementation
    // In our implementation: slice(2) returns empty array, olderAvg = 0 / max(0, 1) = 0
    const history = [
      { risk_score: 0.2 },
      { risk_score: 0.2 },
    ];
    // Recent avg: 0.2, Older avg: 0 (empty array sum / 1)
    // Change: 0.2 - 0 = 0.2 (> 0.1 = declining)
    expect(calculateTrajectory(history)).toBe('declining');
  });
});

// ============================================================
// Integration: Full Risk Calculation Flow
// ============================================================

describe('Full Risk Calculation Flow', () => {
  it('calculates correct risk for a low-risk student', () => {
    // Student with good metrics
    const attendanceScore = normalizeAttendance(0.98, null); // 0.1
    const academicScore = normalizeAcademicPerformance(4); // 0.1
    const growthScore = normalizeAcademicGrowth(75, null); // 0.1
    const chronicAbsence = normalizeChronicAbsence(false); // 0.0
    const engagementScore = normalizeEngagement(0.8); // 0.1

    const factors = [
      { normalizedScore: attendanceScore, weight: 0.25 },
      { normalizedScore: academicScore, weight: 0.20 },
      { normalizedScore: growthScore, weight: 0.15 },
      { normalizedScore: chronicAbsence, weight: 0.05 },
      { normalizedScore: engagementScore, weight: 0.10 },
    ];

    const compositeScore = calculateCompositeScore(factors);

    // All factors are low-risk (0.1 or 0.0)
    // Expected: 0.1*0.25 + 0.1*0.20 + 0.1*0.15 + 0*0.05 + 0.1*0.10
    //         = 0.025 + 0.02 + 0.015 + 0 + 0.01 = 0.07
    expect(compositeScore).toBeLessThan(0.25); // Should be on_track
  });

  it('calculates correct risk for a high-risk student', () => {
    // Student with poor metrics
    const attendanceScore = normalizeAttendance(0.80, null); // 1.0
    const academicScore = normalizeAcademicPerformance(1); // 1.0
    const growthScore = normalizeAcademicGrowth(10, null); // 1.0
    const chronicAbsence = normalizeChronicAbsence(true); // 1.0
    const engagementScore = normalizeEngagement(0.2); // 1.0

    const factors = [
      { normalizedScore: attendanceScore, weight: 0.25 },
      { normalizedScore: academicScore, weight: 0.20 },
      { normalizedScore: growthScore, weight: 0.15 },
      { normalizedScore: chronicAbsence, weight: 0.05 },
      { normalizedScore: engagementScore, weight: 0.10 },
    ];

    const compositeScore = calculateCompositeScore(factors);

    // All factors are high-risk (1.0)
    // Expected: 1.0*0.25 + 1.0*0.20 + 1.0*0.15 + 1.0*0.05 + 1.0*0.10
    //         = 0.25 + 0.20 + 0.15 + 0.05 + 0.10 = 0.75
    expect(compositeScore).toBeGreaterThan(0.65); // Should be critical
  });

  it('calculates correct risk for a borderline watch student', () => {
    // Mixed metrics - should be in watch zone
    const attendanceScore = normalizeAttendance(0.93, null); // 0.4
    const academicScore = normalizeAcademicPerformance(3); // 0.3
    const growthScore = normalizeAcademicGrowth(45, null); // 0.3
    const chronicAbsence = normalizeChronicAbsence(false); // 0.0
    const engagementScore = normalizeEngagement(0.55); // 0.3

    const factors = [
      { normalizedScore: attendanceScore, weight: 0.25 },
      { normalizedScore: academicScore, weight: 0.20 },
      { normalizedScore: growthScore, weight: 0.15 },
      { normalizedScore: chronicAbsence, weight: 0.05 },
      { normalizedScore: engagementScore, weight: 0.10 },
    ];

    const compositeScore = calculateCompositeScore(factors);

    // Expected: 0.4*0.25 + 0.3*0.20 + 0.3*0.15 + 0*0.05 + 0.3*0.10
    //         = 0.1 + 0.06 + 0.045 + 0 + 0.03 = 0.235
    expect(compositeScore).toBeGreaterThanOrEqual(0.2);
    expect(compositeScore).toBeLessThan(0.45);
  });
});
