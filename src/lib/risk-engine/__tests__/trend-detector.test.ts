/**
 * Trend Detector Unit Tests
 * =========================
 *
 * Tests for linear regression and trend detection algorithms.
 *
 * Sprint 3: Trend Detection
 */

import { describe, it, expect } from 'vitest';
import {
  linearRegression,
  determineTrajectory,
  determineConfidence,
  type LinearRegressionResult,
} from '../trend-detector';

// ============================================================
// Linear Regression Tests
// ============================================================

describe('linearRegression', () => {
  it('returns zero slope for empty array', () => {
    const result = linearRegression([]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
    expect(result.rSquared).toBe(0);
  });

  it('returns zero slope for single point', () => {
    const result = linearRegression([[0, 5]]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
    expect(result.rSquared).toBe(0);
  });

  it('calculates correct slope for perfect positive linear relationship', () => {
    // y = 2x + 1: points (0,1), (1,3), (2,5), (3,7)
    const result = linearRegression([
      [0, 1],
      [1, 3],
      [2, 5],
      [3, 7],
    ]);

    expect(result.slope).toBe(2);
    expect(result.intercept).toBe(1);
    expect(result.rSquared).toBe(1); // Perfect fit
  });

  it('calculates correct slope for perfect negative linear relationship', () => {
    // y = -1.5x + 10: points (0,10), (2,7), (4,4), (6,1)
    const result = linearRegression([
      [0, 10],
      [2, 7],
      [4, 4],
      [6, 1],
    ]);

    expect(result.slope).toBe(-1.5);
    expect(result.intercept).toBe(10);
    expect(result.rSquared).toBe(1);
  });

  it('handles horizontal line (zero slope)', () => {
    const result = linearRegression([
      [0, 5],
      [1, 5],
      [2, 5],
      [3, 5],
    ]);

    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(5);
  });

  it('calculates R-squared for imperfect fit', () => {
    // Some noise around y = x
    const result = linearRegression([
      [0, 0.1],
      [1, 0.9],
      [2, 2.1],
      [3, 2.9],
      [4, 4.1],
    ]);

    expect(result.slope).toBeCloseTo(1, 1);
    expect(result.rSquared).toBeGreaterThan(0.95);
    expect(result.rSquared).toBeLessThanOrEqual(1);
  });

  it('handles all same x values (vertical line)', () => {
    const result = linearRegression([
      [2, 1],
      [2, 3],
      [2, 5],
    ]);

    // Should return zero slope with mean y as intercept
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(3); // mean of 1, 3, 5
    expect(result.rSquared).toBe(0);
  });

  it('handles two points exactly', () => {
    const result = linearRegression([
      [0, 0],
      [10, 20],
    ]);

    expect(result.slope).toBe(2);
    expect(result.intercept).toBe(0);
    expect(result.rSquared).toBe(1);
  });

  it('calculates declining trend for attendance data', () => {
    // Simulated weekly attendance rates declining
    const result = linearRegression([
      [0, 0.95], // Week 1
      [1, 0.92], // Week 2
      [2, 0.88], // Week 3
      [3, 0.85], // Week 4
    ]);

    expect(result.slope).toBeLessThan(0); // Declining
    expect(result.slope).toBeCloseTo(-0.0333, 2);
  });

  it('calculates improving trend for assessment scores', () => {
    // Simulated weekly assessment scores improving
    const result = linearRegression([
      [0, 65],
      [1, 68],
      [2, 72],
      [3, 75],
    ]);

    expect(result.slope).toBeGreaterThan(0); // Improving
    expect(result.slope).toBeCloseTo(3.4, 1);
  });
});

// ============================================================
// Trajectory Determination Tests
// ============================================================

describe('determineTrajectory', () => {
  const defaultThreshold = -0.1;

  it('returns declining for strongly negative slope', () => {
    expect(determineTrajectory(-0.15, defaultThreshold)).toBe('declining');
    expect(determineTrajectory(-0.5, defaultThreshold)).toBe('declining');
  });

  it('returns declining at exact threshold', () => {
    expect(determineTrajectory(-0.1, defaultThreshold)).toBe('stable');
    expect(determineTrajectory(-0.1001, defaultThreshold)).toBe('declining');
  });

  it('returns stable for small changes', () => {
    expect(determineTrajectory(-0.05, defaultThreshold)).toBe('stable');
    expect(determineTrajectory(0, defaultThreshold)).toBe('stable');
    expect(determineTrajectory(0.05, defaultThreshold)).toBe('stable');
  });

  it('returns improving for positive slope above threshold', () => {
    expect(determineTrajectory(0.15, defaultThreshold)).toBe('improving');
    expect(determineTrajectory(0.5, defaultThreshold)).toBe('improving');
  });

  it('uses symmetric threshold when improveThreshold not specified', () => {
    // With threshold -0.1, improve threshold defaults to 0.1
    expect(determineTrajectory(0.09, defaultThreshold)).toBe('stable');
    expect(determineTrajectory(0.11, defaultThreshold)).toBe('improving');
  });

  it('respects custom improve threshold', () => {
    expect(determineTrajectory(0.15, -0.1, 0.2)).toBe('stable');
    expect(determineTrajectory(0.25, -0.1, 0.2)).toBe('improving');
  });

  it('handles zero threshold', () => {
    expect(determineTrajectory(-0.01, 0)).toBe('declining');
    expect(determineTrajectory(0.01, 0)).toBe('improving');
    expect(determineTrajectory(0, 0)).toBe('stable');
  });
});

// ============================================================
// Confidence Determination Tests
// ============================================================

describe('determineConfidence', () => {
  it('returns low for fewer than 3 data points', () => {
    expect(determineConfidence(0.9, 1)).toBe('low');
    expect(determineConfidence(0.9, 2)).toBe('low');
  });

  it('returns medium for 3-4 data points', () => {
    expect(determineConfidence(0.9, 3)).toBe('medium');
    expect(determineConfidence(0.9, 4)).toBe('medium');
  });

  it('returns medium for low R-squared', () => {
    expect(determineConfidence(0.3, 10)).toBe('medium');
    expect(determineConfidence(0.49, 10)).toBe('medium');
  });

  it('returns high for good R-squared with enough points', () => {
    expect(determineConfidence(0.7, 5)).toBe('high');
    expect(determineConfidence(0.9, 10)).toBe('high');
  });

  it('handles edge cases at boundaries', () => {
    expect(determineConfidence(0.5, 5)).toBe('medium');
    expect(determineConfidence(0.69, 5)).toBe('medium');
    expect(determineConfidence(0.7, 5)).toBe('high');
  });
});

// ============================================================
// Integration: Trend Analysis Scenarios
// ============================================================

describe('Trend Analysis Scenarios', () => {
  it('detects declining attendance pattern', () => {
    // Student attendance dropping week over week
    const attendanceHistory = [
      [0, 0.95],
      [1, 0.93],
      [2, 0.90],
      [3, 0.86],
      [4, 0.82],
    ] as Array<[number, number]>;

    const result = linearRegression(attendanceHistory);
    const trajectory = determineTrajectory(result.slope, -0.02);
    const confidence = determineConfidence(result.rSquared, attendanceHistory.length);

    expect(trajectory).toBe('declining');
    expect(confidence).toBe('high'); // Strong linear trend
  });

  it('identifies stable performance', () => {
    // Student maintaining consistent scores
    const gradeHistory = [
      [0, 85],
      [1, 84],
      [2, 86],
      [3, 85],
      [4, 85],
    ] as Array<[number, number]>;

    const result = linearRegression(gradeHistory);
    const trajectory = determineTrajectory(result.slope, -2);

    expect(trajectory).toBe('stable');
    expect(Math.abs(result.slope)).toBeLessThan(1);
  });

  it('detects improving assessment scores', () => {
    // Student showing growth
    const assessmentHistory = [
      [0, 55],
      [1, 60],
      [2, 65],
      [3, 72],
      [4, 78],
    ] as Array<[number, number]>;

    const result = linearRegression(assessmentHistory);
    const trajectory = determineTrajectory(result.slope, -2, 3);

    expect(trajectory).toBe('improving');
    expect(result.slope).toBeGreaterThan(5);
  });

  it('handles noisy but declining trend', () => {
    // Declining with noise
    const noisyHistory = [
      [0, 0.90],
      [1, 0.88],
      [2, 0.91], // noise up
      [3, 0.85],
      [4, 0.87], // noise up
      [5, 0.82],
      [6, 0.80],
    ] as Array<[number, number]>;

    const result = linearRegression(noisyHistory);

    // Should still detect overall decline
    expect(result.slope).toBeLessThan(0);
    // R-squared will be lower due to noise
    expect(result.rSquared).toBeGreaterThan(0.5);
    expect(result.rSquared).toBeLessThan(1);
  });

  it('handles recovery pattern (V-shaped)', () => {
    // Student declined then improved
    const recoveryHistory = [
      [0, 85],
      [1, 80],
      [2, 75], // bottom
      [3, 78],
      [4, 82],
      [5, 86],
    ] as Array<[number, number]>;

    const result = linearRegression(recoveryHistory);

    // Overall slight positive trend due to V-shape
    // R-squared will be low because linear model doesn't fit well
    expect(result.rSquared).toBeLessThan(0.3);
  });
});

// ============================================================
// Threshold Crossing Prediction Tests
// ============================================================

describe('Threshold Crossing Prediction', () => {
  // Test the predictThresholdCrossing logic
  function predictCrossing(
    currentValue: number,
    slope: number,
    threshold: number,
    weeksAhead: number = 4
  ): { willCross: boolean; weeksUntilCross: number | null } {
    if (slope >= 0) {
      return { willCross: false, weeksUntilCross: null };
    }

    const valueAfterWeeks = currentValue + slope * weeksAhead;

    if (valueAfterWeeks < threshold) {
      const weeksUntilCross = (threshold - currentValue) / slope;
      return {
        willCross: true,
        weeksUntilCross: Math.max(0, Math.round(weeksUntilCross * 10) / 10),
      };
    }

    return { willCross: false, weeksUntilCross: null };
  }

  it('predicts threshold crossing for declining metric', () => {
    // Current: 90%, declining at 2% per week, threshold at 85%
    const result = predictCrossing(0.90, -0.02, 0.85, 4);

    expect(result.willCross).toBe(true);
    expect(result.weeksUntilCross).toBeCloseTo(2.5, 1);
  });

  it('does not predict crossing for stable/improving metric', () => {
    const stable = predictCrossing(0.90, 0, 0.85, 4);
    expect(stable.willCross).toBe(false);

    const improving = predictCrossing(0.90, 0.01, 0.85, 4);
    expect(improving.willCross).toBe(false);
  });

  it('does not predict crossing if decline is too slow', () => {
    // Current: 90%, declining at 0.5% per week, threshold at 85%
    // Would take 10 weeks, but we're only looking 4 weeks ahead
    const result = predictCrossing(0.90, -0.005, 0.85, 4);

    expect(result.willCross).toBe(false);
  });

  it('handles already crossed threshold', () => {
    // Current: 82% (already below 85% threshold)
    const result = predictCrossing(0.82, -0.02, 0.85, 4);

    expect(result.willCross).toBe(true);
    expect(result.weeksUntilCross).toBe(0); // Already crossed
  });

  it('calculates crossing for GPA decline', () => {
    // Current GPA: 2.8, declining at 0.1 per week, threshold: 2.0
    const result = predictCrossing(2.8, -0.1, 2.0, 12);

    expect(result.willCross).toBe(true);
    expect(result.weeksUntilCross).toBe(8);
  });
});
