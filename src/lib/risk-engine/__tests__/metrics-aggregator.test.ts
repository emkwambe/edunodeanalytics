/**
 * Metrics Aggregator Unit Tests
 * ==============================
 *
 * Tests for the pure helper functions used in metrics aggregation.
 * Database-dependent functions are tested in integration tests.
 */

import { describe, it, expect } from 'vitest';

// ============================================================
// Test Utilities - Pure function implementations for testing
// These mirror the private functions in metrics-aggregator.ts
// ============================================================

/**
 * Extract assessment percentage from JSON scores object.
 * Supports multiple formats.
 */
function extractAssessmentPct(
  scores: Record<string, unknown> | null
): number | null {
  if (!scores) return null;

  if (typeof scores.latest_pct === 'number') return scores.latest_pct;
  if (typeof scores.percent === 'number') return scores.percent;
  if (typeof scores.percentile === 'number') return scores.percentile;

  if (typeof scores.score === 'number' && typeof scores.max === 'number' && scores.max > 0) {
    return Math.round((scores.score as number / (scores.max as number)) * 100);
  }

  if (typeof scores.scale_score === 'number') {
    return null;
  }

  return null;
}

/**
 * Extract engagement score from purpose_driven_metrics JSON.
 */
function extractEngagement(
  metrics: Record<string, unknown> | null
): number | null {
  if (!metrics) return null;
  if (typeof metrics.engagement === 'number') return metrics.engagement;
  if (typeof metrics.engagement_score === 'number') return metrics.engagement_score;
  return null;
}

/**
 * Estimate days absent in the last 30 school days.
 */
function estimateDaysAbsentLast30(
  attendanceRate: number | null,
  daysAbsent: number | null,
  daysPresent: number | null
): number {
  if (daysAbsent != null) {
    return Math.min(daysAbsent, 30);
  }

  if (attendanceRate != null) {
    const rate = Number(attendanceRate);
    const normalized = rate > 1 ? rate / 100 : rate;
    return Math.round((1 - normalized) * 30);
  }

  if (daysPresent != null) {
    return Math.max(0, 30 - daysPresent);
  }

  return 0;
}

/**
 * Calculate data completeness as a ratio of available indicators.
 */
function calculateDataCompleteness(indicators: boolean[]): number {
  const available = indicators.filter(Boolean).length;
  return Math.round((available / indicators.length) * 1000) / 1000;
}

// ============================================================
// Assessment Extraction Tests
// ============================================================

describe('extractAssessmentPct', () => {
  it('returns null for null input', () => {
    expect(extractAssessmentPct(null)).toBeNull();
  });

  it('returns null for empty object', () => {
    expect(extractAssessmentPct({})).toBeNull();
  });

  it('extracts latest_pct format', () => {
    expect(extractAssessmentPct({ latest_pct: 85 })).toBe(85);
  });

  it('extracts percent format', () => {
    expect(extractAssessmentPct({ percent: 72 })).toBe(72);
  });

  it('extracts percentile format', () => {
    expect(extractAssessmentPct({ percentile: 65 })).toBe(65);
  });

  it('calculates score/max ratio', () => {
    expect(extractAssessmentPct({ score: 18, max: 20 })).toBe(90);
    expect(extractAssessmentPct({ score: 75, max: 100 })).toBe(75);
    expect(extractAssessmentPct({ score: 3, max: 4 })).toBe(75);
  });

  it('handles zero max gracefully', () => {
    expect(extractAssessmentPct({ score: 10, max: 0 })).toBeNull();
  });

  it('returns null for scale_score (cannot convert)', () => {
    expect(extractAssessmentPct({ scale_score: 215 })).toBeNull();
  });

  it('prefers latest_pct over other fields', () => {
    expect(extractAssessmentPct({ latest_pct: 88, percent: 75, score: 10, max: 20 })).toBe(88);
  });
});

// ============================================================
// Engagement Extraction Tests
// ============================================================

describe('extractEngagement', () => {
  it('returns null for null input', () => {
    expect(extractEngagement(null)).toBeNull();
  });

  it('returns null for empty object', () => {
    expect(extractEngagement({})).toBeNull();
  });

  it('extracts engagement field', () => {
    expect(extractEngagement({ engagement: 0.85 })).toBe(0.85);
  });

  it('extracts engagement_score field', () => {
    expect(extractEngagement({ engagement_score: 0.72 })).toBe(0.72);
  });

  it('prefers engagement over engagement_score', () => {
    expect(extractEngagement({ engagement: 0.90, engagement_score: 0.65 })).toBe(0.90);
  });

  it('returns null for string values', () => {
    expect(extractEngagement({ engagement: 'high' })).toBeNull();
  });
});

// ============================================================
// Days Absent Estimation Tests
// ============================================================

describe('estimateDaysAbsentLast30', () => {
  describe('with direct days_absent', () => {
    it('uses direct count when available', () => {
      expect(estimateDaysAbsentLast30(null, 5, null)).toBe(5);
    });

    it('caps at 30 days', () => {
      expect(estimateDaysAbsentLast30(null, 45, null)).toBe(30);
    });

    it('handles zero absences', () => {
      expect(estimateDaysAbsentLast30(null, 0, null)).toBe(0);
    });
  });

  describe('with attendance rate', () => {
    it('derives from rate 0-1', () => {
      // 90% attendance = 10% absent = 3 days out of 30
      expect(estimateDaysAbsentLast30(0.90, null, null)).toBe(3);
      // 100% attendance = 0 days absent
      expect(estimateDaysAbsentLast30(1.0, null, null)).toBe(0);
      // 80% attendance = 6 days absent
      expect(estimateDaysAbsentLast30(0.80, null, null)).toBe(6);
    });

    it('handles rate 0-100 format', () => {
      expect(estimateDaysAbsentLast30(95, null, null)).toBe(2);
      expect(estimateDaysAbsentLast30(85, null, null)).toBe(5);
    });

    it('prefers days_absent over rate', () => {
      expect(estimateDaysAbsentLast30(0.50, 2, null)).toBe(2);
    });
  });

  describe('with days_present', () => {
    it('calculates absent from present', () => {
      expect(estimateDaysAbsentLast30(null, null, 28)).toBe(2);
      expect(estimateDaysAbsentLast30(null, null, 30)).toBe(0);
      expect(estimateDaysAbsentLast30(null, null, 25)).toBe(5);
    });

    it('does not go negative', () => {
      expect(estimateDaysAbsentLast30(null, null, 35)).toBe(0);
    });
  });

  describe('with no data', () => {
    it('returns 0', () => {
      expect(estimateDaysAbsentLast30(null, null, null)).toBe(0);
    });
  });
});

// ============================================================
// Data Completeness Tests
// ============================================================

describe('calculateDataCompleteness', () => {
  it('returns 0 for all false indicators', () => {
    expect(calculateDataCompleteness([false, false, false, false])).toBe(0);
  });

  it('returns 1 for all true indicators', () => {
    expect(calculateDataCompleteness([true, true, true, true])).toBe(1);
  });

  it('calculates ratio correctly', () => {
    // 2 out of 4
    expect(calculateDataCompleteness([true, false, true, false])).toBe(0.5);
    // 3 out of 4
    expect(calculateDataCompleteness([true, true, true, false])).toBe(0.75);
    // 1 out of 4
    expect(calculateDataCompleteness([false, false, false, true])).toBe(0.25);
  });

  it('rounds to 3 decimal places', () => {
    // 1 out of 3 = 0.333...
    const result = calculateDataCompleteness([true, false, false]);
    expect(result).toBe(0.333);
  });

  it('handles typical 8-indicator array', () => {
    const indicators = [true, true, true, true, false, false, true, false];
    // 5 out of 8 = 0.625
    expect(calculateDataCompleteness(indicators)).toBe(0.625);
  });

  it('handles empty array', () => {
    expect(calculateDataCompleteness([])).toBe(NaN);
  });
});

// ============================================================
// Integration: Typical Student Metrics Flow
// ============================================================

describe('Metrics Computation Integration', () => {
  it('handles student with full data', () => {
    const mathPct = extractAssessmentPct({ latest_pct: 75 });
    const readingPct = extractAssessmentPct({ percentile: 68 });
    const engagement = extractEngagement({ engagement: 0.82 });
    const daysAbsent = estimateDaysAbsentLast30(0.93, null, null);

    expect(mathPct).toBe(75);
    expect(readingPct).toBe(68);
    expect(engagement).toBe(0.82);
    expect(daysAbsent).toBe(2);

    const completeness = calculateDataCompleteness([
      true, // attendance
      true, // proficiency
      true, // growth
      true, // math
      true, // reading
      true, // chronic absence
      true, // engagement
      true, // days absent
    ]);
    expect(completeness).toBe(1);
  });

  it('handles student with partial data', () => {
    const mathPct = extractAssessmentPct(null);
    const readingPct = extractAssessmentPct({ scale_score: 200 }); // Not convertible
    const engagement = extractEngagement(null);
    const daysAbsent = estimateDaysAbsentLast30(null, null, 26);

    expect(mathPct).toBeNull();
    expect(readingPct).toBeNull();
    expect(engagement).toBeNull();
    expect(daysAbsent).toBe(4);

    const completeness = calculateDataCompleteness([
      true,  // attendance (from rate derivation)
      false, // proficiency
      false, // growth
      false, // math
      false, // reading
      true,  // chronic absence
      false, // engagement
      true,  // days absent (from days_present)
    ]);
    expect(completeness).toBe(0.375);
  });

  it('handles student with no data', () => {
    const mathPct = extractAssessmentPct(null);
    const readingPct = extractAssessmentPct(null);
    const engagement = extractEngagement(null);
    const daysAbsent = estimateDaysAbsentLast30(null, null, null);

    expect(mathPct).toBeNull();
    expect(readingPct).toBeNull();
    expect(engagement).toBeNull();
    expect(daysAbsent).toBe(0);

    const completeness = calculateDataCompleteness([
      false, false, false, false, false, false, false, false,
    ]);
    expect(completeness).toBe(0);
  });
});
