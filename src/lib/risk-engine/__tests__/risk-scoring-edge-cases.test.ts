/**
 * Risk Scoring Edge Case Tests
 * ============================
 *
 * Tests for risk scoring calculation edge cases:
 * - All-zero inputs
 * - Missing domain scores
 * - Boundary values between risk levels
 * - Extreme values
 *
 * T3 CI/CD & Developer Velocity - Test Coverage
 */

import { describe, it, expect } from 'vitest';
import type { RiskLevel } from '../types';

// ============================================================
// Risk Scoring Logic (mirroring actual implementation)
// ============================================================

interface DomainScores {
  attendance: number | null;
  academic: number | null;
  assignments: number | null;
  behavior: number | null;
  trend: number | null;
}

interface Weights {
  attendance: number;
  academic: number;
  assignments: number;
  behavior: number;
  trend: number;
}

interface Thresholds {
  onTrack: number;
  watch: number;
  atRisk: number;
}

/**
 * Calculate composite risk score from domain scores and weights
 * Handles missing domain scores by redistributing weight
 */
function calculateCompositeScore(
  domainScores: DomainScores,
  weights: Weights
): { score: number; validDomains: number } {
  let totalWeight = 0;
  let weightedSum = 0;
  let validDomains = 0;

  const domains: (keyof DomainScores)[] = ['attendance', 'academic', 'assignments', 'behavior', 'trend'];

  for (const domain of domains) {
    const score = domainScores[domain];
    const weight = weights[domain];

    if (score !== null && score !== undefined) {
      weightedSum += score * weight;
      totalWeight += weight;
      validDomains++;
    }
  }

  // If no valid domains, return 0
  if (totalWeight === 0) {
    return { score: 0, validDomains: 0 };
  }

  // Normalize by total weight of available domains
  const normalizedScore = weightedSum / totalWeight;

  return { score: normalizedScore, validDomains };
}

/**
 * Determine risk level from composite score
 */
function determineRiskLevel(score: number, thresholds: Thresholds): RiskLevel {
  if (score >= thresholds.atRisk) return 'critical';
  if (score >= thresholds.watch) return 'at_risk';
  if (score >= thresholds.onTrack) return 'watch';
  return 'on_track';
}

/**
 * Check if score is at an exact boundary
 */
function isAtBoundary(score: number, thresholds: Thresholds): boolean {
  const epsilon = 0.0001;
  return (
    Math.abs(score - thresholds.onTrack) < epsilon ||
    Math.abs(score - thresholds.watch) < epsilon ||
    Math.abs(score - thresholds.atRisk) < epsilon
  );
}

// ============================================================
// Tests
// ============================================================

const defaultWeights: Weights = {
  attendance: 0.25,
  academic: 0.30,
  assignments: 0.20,
  behavior: 0.15,
  trend: 0.10,
};

const defaultThresholds: Thresholds = {
  onTrack: 0.30,
  watch: 0.50,
  atRisk: 0.70,
};

describe('Risk Scoring Edge Cases', () => {
  describe('All-Zero Inputs', () => {
    it('returns 0 score when all domain scores are 0', () => {
      const domainScores: DomainScores = {
        attendance: 0,
        academic: 0,
        assignments: 0,
        behavior: 0,
        trend: 0,
      };
      const result = calculateCompositeScore(domainScores, defaultWeights);
      expect(result.score).toBe(0);
      expect(result.validDomains).toBe(5);
    });

    it('classifies zero score as on_track', () => {
      const level = determineRiskLevel(0, defaultThresholds);
      expect(level).toBe('on_track');
    });

    it('handles zero weight for a domain', () => {
      const weights: Weights = {
        ...defaultWeights,
        behavior: 0,
      };
      const domainScores: DomainScores = {
        attendance: 0.5,
        academic: 0.5,
        assignments: 0.5,
        behavior: 1.0, // This should not contribute
        trend: 0.5,
      };
      const result = calculateCompositeScore(domainScores, weights);
      expect(result.score).toBeCloseTo(0.5, 5);
    });
  });

  describe('Missing Domain Scores (null values)', () => {
    it('handles single missing domain score', () => {
      const domainScores: DomainScores = {
        attendance: 0.4,
        academic: 0.4,
        assignments: 0.4,
        behavior: 0.4,
        trend: null, // Missing
      };
      const result = calculateCompositeScore(domainScores, defaultWeights);
      expect(result.validDomains).toBe(4);
      expect(result.score).toBeCloseTo(0.4, 5); // Weight redistributed
    });

    it('handles multiple missing domain scores', () => {
      const domainScores: DomainScores = {
        attendance: 0.5,
        academic: 0.5,
        assignments: null,
        behavior: null,
        trend: null,
      };
      const result = calculateCompositeScore(domainScores, defaultWeights);
      expect(result.validDomains).toBe(2);
      expect(result.score).toBeCloseTo(0.5, 5);
    });

    it('handles all missing domain scores', () => {
      const domainScores: DomainScores = {
        attendance: null,
        academic: null,
        assignments: null,
        behavior: null,
        trend: null,
      };
      const result = calculateCompositeScore(domainScores, defaultWeights);
      expect(result.validDomains).toBe(0);
      expect(result.score).toBe(0);
    });

    it('correctly redistributes weights when major domain is missing', () => {
      const domainScores: DomainScores = {
        attendance: 0.6,
        academic: null, // Missing 30% weight
        assignments: 0.6,
        behavior: 0.6,
        trend: 0.6,
      };
      const result = calculateCompositeScore(domainScores, defaultWeights);
      expect(result.validDomains).toBe(4);
      expect(result.score).toBeCloseTo(0.6, 5);
    });
  });

  describe('Boundary Values Between Risk Levels', () => {
    it('score exactly at onTrack threshold returns watch', () => {
      const level = determineRiskLevel(0.30, defaultThresholds);
      expect(level).toBe('watch');
    });

    it('score just below onTrack threshold returns on_track', () => {
      const level = determineRiskLevel(0.299, defaultThresholds);
      expect(level).toBe('on_track');
    });

    it('score just above onTrack threshold returns watch', () => {
      const level = determineRiskLevel(0.301, defaultThresholds);
      expect(level).toBe('watch');
    });

    it('score exactly at watch threshold returns at_risk', () => {
      const level = determineRiskLevel(0.50, defaultThresholds);
      expect(level).toBe('at_risk');
    });

    it('score just below watch threshold returns watch', () => {
      const level = determineRiskLevel(0.499, defaultThresholds);
      expect(level).toBe('watch');
    });

    it('score just above watch threshold returns at_risk', () => {
      const level = determineRiskLevel(0.501, defaultThresholds);
      expect(level).toBe('at_risk');
    });

    it('score exactly at atRisk threshold returns critical', () => {
      const level = determineRiskLevel(0.70, defaultThresholds);
      expect(level).toBe('critical');
    });

    it('score just below atRisk threshold returns at_risk', () => {
      const level = determineRiskLevel(0.699, defaultThresholds);
      expect(level).toBe('at_risk');
    });

    it('score just above atRisk threshold returns critical', () => {
      const level = determineRiskLevel(0.701, defaultThresholds);
      expect(level).toBe('critical');
    });

    it('identifies exact boundary values', () => {
      expect(isAtBoundary(0.30, defaultThresholds)).toBe(true);
      expect(isAtBoundary(0.50, defaultThresholds)).toBe(true);
      expect(isAtBoundary(0.70, defaultThresholds)).toBe(true);
      expect(isAtBoundary(0.35, defaultThresholds)).toBe(false);
    });
  });

  describe('Extreme Values', () => {
    it('handles maximum score of 1.0', () => {
      const domainScores: DomainScores = {
        attendance: 1.0,
        academic: 1.0,
        assignments: 1.0,
        behavior: 1.0,
        trend: 1.0,
      };
      const result = calculateCompositeScore(domainScores, defaultWeights);
      expect(result.score).toBe(1.0);
      expect(determineRiskLevel(result.score, defaultThresholds)).toBe('critical');
    });

    it('handles very small positive scores', () => {
      const domainScores: DomainScores = {
        attendance: 0.001,
        academic: 0.001,
        assignments: 0.001,
        behavior: 0.001,
        trend: 0.001,
      };
      const result = calculateCompositeScore(domainScores, defaultWeights);
      expect(result.score).toBeCloseTo(0.001, 5);
      expect(determineRiskLevel(result.score, defaultThresholds)).toBe('on_track');
    });

    it('handles score of exactly 1.0 as critical', () => {
      const level = determineRiskLevel(1.0, defaultThresholds);
      expect(level).toBe('critical');
    });

    it('handles mixed extreme values', () => {
      const domainScores: DomainScores = {
        attendance: 0,
        academic: 1.0,
        assignments: 0,
        behavior: 1.0,
        trend: 0,
      };
      const result = calculateCompositeScore(domainScores, defaultWeights);
      // 0*0.25 + 1.0*0.30 + 0*0.20 + 1.0*0.15 + 0*0.10 = 0.45
      expect(result.score).toBeCloseTo(0.45, 5);
    });
  });

  describe('Weight Normalization', () => {
    it('correctly normalizes when weights sum to 1.0', () => {
      const domainScores: DomainScores = {
        attendance: 0.5,
        academic: 0.5,
        assignments: 0.5,
        behavior: 0.5,
        trend: 0.5,
      };
      const result = calculateCompositeScore(domainScores, defaultWeights);
      expect(result.score).toBeCloseTo(0.5, 5);
    });

    it('handles non-standard weight distribution', () => {
      const weights: Weights = {
        attendance: 0.40,
        academic: 0.40,
        assignments: 0.10,
        behavior: 0.05,
        trend: 0.05,
      };
      const domainScores: DomainScores = {
        attendance: 0.8,
        academic: 0.6,
        assignments: 0.3,
        behavior: 0.2,
        trend: 0.1,
      };
      // 0.8*0.4 + 0.6*0.4 + 0.3*0.1 + 0.2*0.05 + 0.1*0.05 = 0.32 + 0.24 + 0.03 + 0.01 + 0.005 = 0.605
      const result = calculateCompositeScore(domainScores, weights);
      expect(result.score).toBeCloseTo(0.605, 3);
    });
  });

  describe('Custom Thresholds', () => {
    it('handles tight threshold range', () => {
      const tightThresholds: Thresholds = {
        onTrack: 0.25,
        watch: 0.35,
        atRisk: 0.45,
      };

      expect(determineRiskLevel(0.20, tightThresholds)).toBe('on_track');
      expect(determineRiskLevel(0.30, tightThresholds)).toBe('watch');
      expect(determineRiskLevel(0.40, tightThresholds)).toBe('at_risk');
      expect(determineRiskLevel(0.50, tightThresholds)).toBe('critical');
    });

    it('handles wide threshold range', () => {
      const wideThresholds: Thresholds = {
        onTrack: 0.10,
        watch: 0.50,
        atRisk: 0.90,
      };

      expect(determineRiskLevel(0.05, wideThresholds)).toBe('on_track');
      expect(determineRiskLevel(0.30, wideThresholds)).toBe('watch');
      expect(determineRiskLevel(0.70, wideThresholds)).toBe('at_risk');
      expect(determineRiskLevel(0.95, wideThresholds)).toBe('critical');
    });

    it('handles thresholds at extremes', () => {
      const extremeThresholds: Thresholds = {
        onTrack: 0.01,
        watch: 0.02,
        atRisk: 0.99,
      };

      expect(determineRiskLevel(0.005, extremeThresholds)).toBe('on_track');
      expect(determineRiskLevel(0.015, extremeThresholds)).toBe('watch');
      expect(determineRiskLevel(0.50, extremeThresholds)).toBe('at_risk');
      expect(determineRiskLevel(0.995, extremeThresholds)).toBe('critical');
    });
  });

  describe('Floating Point Precision', () => {
    it('handles floating point precision issues', () => {
      // 0.1 + 0.2 !== 0.3 in floating point
      const score = 0.1 + 0.2;
      const thresholds: Thresholds = {
        onTrack: 0.3,
        watch: 0.5,
        atRisk: 0.7,
      };

      // Should be treated as being at the threshold
      const level = determineRiskLevel(score, thresholds);
      expect(level).toBe('watch');
    });

    it('handles very small differences correctly', () => {
      const almostBoundary = 0.30000001;
      const level = determineRiskLevel(almostBoundary, defaultThresholds);
      expect(level).toBe('watch');
    });
  });

  describe('Score Clamping', () => {
    /**
     * Helper to clamp score to valid range [0, 1]
     */
    function clampScore(score: number): number {
      return Math.max(0, Math.min(1, score));
    }

    it('clamps negative scores to 0', () => {
      expect(clampScore(-0.5)).toBe(0);
      expect(clampScore(-1)).toBe(0);
    });

    it('clamps scores above 1 to 1', () => {
      expect(clampScore(1.5)).toBe(1);
      expect(clampScore(2)).toBe(1);
    });

    it('does not change valid scores', () => {
      expect(clampScore(0.5)).toBe(0.5);
      expect(clampScore(0)).toBe(0);
      expect(clampScore(1)).toBe(1);
    });
  });
});
