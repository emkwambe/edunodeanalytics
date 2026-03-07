/**
 * Risk Engine Types Tests
 * =======================
 *
 * Tests for type parsing and threshold classification utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  parseConfigRow,
  type RiskModelConfigRow,
  type RiskModelConfig,
  type RiskLevel,
} from '../types';

// ============================================================
// parseConfigRow Tests
// ============================================================

describe('parseConfigRow', () => {
  const createMockConfigRow = (overrides: Partial<RiskModelConfigRow> = {}): RiskModelConfigRow => ({
    id: 'config-123',
    school_id: 'school-456',
    name: 'Default Config',
    is_active: true,
    weight_attendance: 0.25,
    weight_academic: 0.30,
    weight_assignments: 0.15,
    weight_behavior: 0.15,
    weight_trend: 0.15,
    threshold_on_track: 0.25,
    threshold_watch: 0.45,
    threshold_at_risk: 0.65,
    attendance_floor: 95,
    attendance_critical: 85,
    assignment_missing_warn: 20,
    behavior_incident_cap: 5,
    assessment_floor_pct: 40,
    trend_lookback_weeks: 4,
    trend_decline_threshold: -0.1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_by: 'user-789',
    ...overrides,
  });

  it('parses basic fields correctly', () => {
    const row = createMockConfigRow();
    const config = parseConfigRow(row);

    expect(config.id).toBe('config-123');
    expect(config.schoolId).toBe('school-456');
    expect(config.name).toBe('Default Config');
  });

  it('parses weights correctly', () => {
    const row = createMockConfigRow();
    const config = parseConfigRow(row);

    expect(config.weights.attendance).toBe(0.25);
    expect(config.weights.academic).toBe(0.30);
    expect(config.weights.assignments).toBe(0.15);
    expect(config.weights.behavior).toBe(0.15);
    expect(config.weights.trend).toBe(0.15);
  });

  it('parses thresholds correctly', () => {
    const row = createMockConfigRow();
    const config = parseConfigRow(row);

    expect(config.thresholds.onTrack).toBe(0.25);
    expect(config.thresholds.watch).toBe(0.45);
    expect(config.thresholds.atRisk).toBe(0.65);
  });

  it('parses indicator parameters correctly', () => {
    const row = createMockConfigRow();
    const config = parseConfigRow(row);

    expect(config.indicators.attendanceFloor).toBe(95);
    expect(config.indicators.attendanceCritical).toBe(85);
    expect(config.indicators.assignmentMissingWarn).toBe(20);
    expect(config.indicators.behaviorIncidentCap).toBe(5);
    expect(config.indicators.assessmentFloorPct).toBe(40);
    expect(config.indicators.trendLookbackWeeks).toBe(4);
    expect(config.indicators.trendDeclineThreshold).toBe(-0.1);
  });

  it('handles string numbers correctly', () => {
    const row = createMockConfigRow({
      weight_attendance: '0.25' as unknown as number,
      threshold_on_track: '0.25' as unknown as number,
    });
    const config = parseConfigRow(row);

    expect(config.weights.attendance).toBe(0.25);
    expect(config.thresholds.onTrack).toBe(0.25);
  });
});

// ============================================================
// Threshold Classification Logic Tests
// ============================================================

describe('Threshold Classification (4-Tier)', () => {
  /**
   * Standalone threshold classifier for testing.
   * Mirrors the logic in RiskDetectionEngine.determineRiskLevel
   */
  function classifyRiskLevel(
    score: number,
    thresholds: { onTrack: number; watch: number; atRisk: number }
  ): RiskLevel {
    if (score >= thresholds.atRisk) return 'critical';
    if (score >= thresholds.watch) return 'at_risk';
    if (score >= thresholds.onTrack) return 'watch';
    return 'on_track';
  }

  const defaultThresholds = {
    onTrack: 0.25,
    watch: 0.45,
    atRisk: 0.65,
  };

  describe('with default thresholds', () => {
    it('classifies score 0 as on_track', () => {
      expect(classifyRiskLevel(0, defaultThresholds)).toBe('on_track');
    });

    it('classifies score 0.24 as on_track', () => {
      expect(classifyRiskLevel(0.24, defaultThresholds)).toBe('on_track');
    });

    it('classifies score 0.25 as watch', () => {
      expect(classifyRiskLevel(0.25, defaultThresholds)).toBe('watch');
    });

    it('classifies score 0.44 as watch', () => {
      expect(classifyRiskLevel(0.44, defaultThresholds)).toBe('watch');
    });

    it('classifies score 0.45 as at_risk', () => {
      expect(classifyRiskLevel(0.45, defaultThresholds)).toBe('at_risk');
    });

    it('classifies score 0.64 as at_risk', () => {
      expect(classifyRiskLevel(0.64, defaultThresholds)).toBe('at_risk');
    });

    it('classifies score 0.65 as critical', () => {
      expect(classifyRiskLevel(0.65, defaultThresholds)).toBe('critical');
    });

    it('classifies score 1.0 as critical', () => {
      expect(classifyRiskLevel(1.0, defaultThresholds)).toBe('critical');
    });
  });

  describe('with custom thresholds', () => {
    const strictThresholds = {
      onTrack: 0.15,
      watch: 0.30,
      atRisk: 0.50,
    };

    it('classifies with stricter thresholds correctly', () => {
      expect(classifyRiskLevel(0.14, strictThresholds)).toBe('on_track');
      expect(classifyRiskLevel(0.15, strictThresholds)).toBe('watch');
      expect(classifyRiskLevel(0.29, strictThresholds)).toBe('watch');
      expect(classifyRiskLevel(0.30, strictThresholds)).toBe('at_risk');
      expect(classifyRiskLevel(0.49, strictThresholds)).toBe('at_risk');
      expect(classifyRiskLevel(0.50, strictThresholds)).toBe('critical');
    });

    const lenientThresholds = {
      onTrack: 0.35,
      watch: 0.55,
      atRisk: 0.75,
    };

    it('classifies with lenient thresholds correctly', () => {
      expect(classifyRiskLevel(0.34, lenientThresholds)).toBe('on_track');
      expect(classifyRiskLevel(0.35, lenientThresholds)).toBe('watch');
      expect(classifyRiskLevel(0.54, lenientThresholds)).toBe('watch');
      expect(classifyRiskLevel(0.55, lenientThresholds)).toBe('at_risk');
      expect(classifyRiskLevel(0.74, lenientThresholds)).toBe('at_risk');
      expect(classifyRiskLevel(0.75, lenientThresholds)).toBe('critical');
    });
  });

  describe('boundary conditions', () => {
    it('handles exact threshold boundaries correctly', () => {
      const thresholds = { onTrack: 0.25, watch: 0.50, atRisk: 0.75 };

      // Scores slightly below threshold stay in lower tier
      expect(classifyRiskLevel(0.249999, thresholds)).toBe('on_track');
      expect(classifyRiskLevel(0.499999, thresholds)).toBe('watch');
      expect(classifyRiskLevel(0.749999, thresholds)).toBe('at_risk');

      // Exact threshold values enter next tier
      expect(classifyRiskLevel(0.25, thresholds)).toBe('watch');
      expect(classifyRiskLevel(0.50, thresholds)).toBe('at_risk');
      expect(classifyRiskLevel(0.75, thresholds)).toBe('critical');
    });

    it('handles scores above 1.0 as critical', () => {
      expect(classifyRiskLevel(1.5, defaultThresholds)).toBe('critical');
    });

    it('handles negative scores as on_track', () => {
      expect(classifyRiskLevel(-0.1, defaultThresholds)).toBe('on_track');
    });
  });
});

// ============================================================
// Weights Validation Tests
// ============================================================

describe('Weights Validation', () => {
  /**
   * Validates that weights sum to approximately 1.0
   */
  function validateWeightsSum(weights: RiskModelConfig['weights']): boolean {
    const sum = weights.attendance + weights.academic + weights.assignments + weights.behavior + weights.trend;
    return Math.abs(sum - 1.0) < 0.0001;
  }

  it('validates correct weight sum', () => {
    const weights = {
      attendance: 0.25,
      academic: 0.30,
      assignments: 0.15,
      behavior: 0.15,
      trend: 0.15,
    };
    expect(validateWeightsSum(weights)).toBe(true);
  });

  it('rejects incorrect weight sum', () => {
    const weights = {
      attendance: 0.25,
      academic: 0.30,
      assignments: 0.15,
      behavior: 0.15,
      trend: 0.20, // Sum is 1.05
    };
    expect(validateWeightsSum(weights)).toBe(false);
  });

  it('handles floating point precision', () => {
    const weights = {
      attendance: 0.2,
      academic: 0.2,
      assignments: 0.2,
      behavior: 0.2,
      trend: 0.2,
    };
    expect(validateWeightsSum(weights)).toBe(true);
  });
});

// ============================================================
// Threshold Order Validation Tests
// ============================================================

describe('Threshold Order Validation', () => {
  /**
   * Validates that thresholds are in ascending order
   */
  function validateThresholdOrder(thresholds: RiskModelConfig['thresholds']): boolean {
    return thresholds.onTrack < thresholds.watch && thresholds.watch < thresholds.atRisk;
  }

  it('validates correct threshold order', () => {
    const thresholds = { onTrack: 0.25, watch: 0.45, atRisk: 0.65 };
    expect(validateThresholdOrder(thresholds)).toBe(true);
  });

  it('rejects descending threshold order', () => {
    const thresholds = { onTrack: 0.65, watch: 0.45, atRisk: 0.25 };
    expect(validateThresholdOrder(thresholds)).toBe(false);
  });

  it('rejects equal thresholds', () => {
    const thresholds = { onTrack: 0.5, watch: 0.5, atRisk: 0.5 };
    expect(validateThresholdOrder(thresholds)).toBe(false);
  });

  it('rejects partially invalid order', () => {
    const thresholds = { onTrack: 0.25, watch: 0.75, atRisk: 0.65 };
    expect(validateThresholdOrder(thresholds)).toBe(false);
  });
});
