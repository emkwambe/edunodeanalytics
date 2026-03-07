/**
 * Risk Engine Interpreter Tests
 * ==============================
 *
 * Tests for plain language conversion functions.
 */

import { describe, it, expect } from 'vitest';
import {
  interpretRiskLevel,
  getRiskSummary,
  getRiskBadgeText,
  getRiskBadgeColor,
  interpretFactor,
  interpretTrajectory,
  interpretConfidence,
  generateActionPrompts,
  generateStudentSummary,
  getPrimaryConcern,
  getFactorCategoryLabel,
  getTrajectoryIcon,
  getTrajectoryColor,
  getConfidenceBadge,
  type RiskFactor,
} from '../interpreter';
import type { RiskLevel, Trajectory } from '../types';

describe('Risk Level Interpretation', () => {
  describe('interpretRiskLevel', () => {
    it('interprets on_track correctly', () => {
      expect(interpretRiskLevel('on_track')).toBe('is on track');
    });

    it('interprets watch correctly', () => {
      expect(interpretRiskLevel('watch')).toBe('needs monitoring');
    });

    it('interprets at_risk correctly', () => {
      expect(interpretRiskLevel('at_risk')).toBe('needs support');
    });

    it('interprets critical correctly', () => {
      expect(interpretRiskLevel('critical')).toBe('needs immediate attention');
    });
  });

  describe('getRiskBadgeText', () => {
    it('returns proper labels for all levels', () => {
      expect(getRiskBadgeText('on_track')).toBe('On Track');
      expect(getRiskBadgeText('watch')).toBe('Watch');
      expect(getRiskBadgeText('at_risk')).toBe('At Risk');
      expect(getRiskBadgeText('critical')).toBe('Critical');
    });
  });

  describe('getRiskBadgeColor', () => {
    it('returns emerald color for on_track', () => {
      expect(getRiskBadgeColor('on_track')).toContain('emerald');
    });

    it('returns yellow color for watch', () => {
      expect(getRiskBadgeColor('watch')).toContain('yellow');
    });

    it('returns orange color for at_risk', () => {
      expect(getRiskBadgeColor('at_risk')).toContain('orange');
    });

    it('returns red color for critical', () => {
      expect(getRiskBadgeColor('critical')).toContain('red');
    });
  });

  describe('getRiskSummary', () => {
    it('includes student name and status', () => {
      const summary = getRiskSummary('Maria', 'at_risk', 'stable');
      expect(summary).toContain('Maria');
      expect(summary).toContain('needs support');
    });

    it('adds improving context when trajectory is improving', () => {
      const summary = getRiskSummary('John', 'watch', 'improving');
      expect(summary).toContain('improving');
    });

    it('adds worsening context when trajectory is declining', () => {
      const summary = getRiskSummary('Sarah', 'at_risk', 'declining');
      expect(summary).toContain('getting worse');
    });
  });
});

describe('Factor Interpretation', () => {
  describe('interpretFactor - attendance', () => {
    const createFactor = (rawValue: number): RiskFactor => ({
      name: 'Attendance Rate',
      category: 'attendance',
      rawValue,
      normalizedScore: 0.5,
      weight: 0.25,
      weightedScore: 0.125,
      description: '',
      trend: 'stable',
    });

    it('interprets critically low attendance', () => {
      const result = interpretFactor(createFactor(0.70));
      expect(result).toContain('critically low');
      expect(result).toContain('70%');
    });

    it('interprets concerning attendance', () => {
      const result = interpretFactor(createFactor(0.82));
      expect(result).toContain('concerning');
      expect(result).toContain('82%');
    });

    it('interprets below target attendance', () => {
      const result = interpretFactor(createFactor(0.88));
      expect(result).toContain('below target');
    });

    it('interprets acceptable attendance', () => {
      const result = interpretFactor(createFactor(0.92));
      expect(result).toContain('acceptable');
    });

    it('interprets strong attendance', () => {
      const result = interpretFactor(createFactor(0.97));
      expect(result).toContain('strong');
    });
  });

  describe('interpretFactor - academic', () => {
    const createAcademicFactor = (rawValue: number, name: string): RiskFactor => ({
      name,
      category: 'academic',
      rawValue,
      normalizedScore: 0.5,
      weight: 0.3,
      weightedScore: 0.15,
      description: '',
      trend: 'stable',
    });

    it('interprets academic performance levels', () => {
      expect(interpretFactor(createAcademicFactor(1, 'Academic Performance')))
        .toContain('well below grade level');
      expect(interpretFactor(createAcademicFactor(3, 'Academic Performance')))
        .toContain('Meeting grade level');
      expect(interpretFactor(createAcademicFactor(5, 'Academic Performance')))
        .toContain('Exceeding');
    });

    it('interprets academic growth percentiles', () => {
      expect(interpretFactor(createAcademicFactor(15, 'Academic Growth')))
        .toContain('bottom quartile');
      expect(interpretFactor(createAcademicFactor(50, 'Academic Growth')))
        .toContain('on target');
      expect(interpretFactor(createAcademicFactor(75, 'Academic Growth')))
        .toContain('above average');
    });
  });

  describe('interpretFactor - engagement', () => {
    const createEngagementFactor = (rawValue: number): RiskFactor => ({
      name: 'Engagement Score',
      category: 'engagement',
      rawValue,
      normalizedScore: 0.5,
      weight: 0.15,
      weightedScore: 0.075,
      description: '',
      trend: 'stable',
    });

    it('interprets engagement levels', () => {
      expect(interpretFactor(createEngagementFactor(0.20))).toContain('very low');
      expect(interpretFactor(createEngagementFactor(0.40))).toContain('below expectations');
      expect(interpretFactor(createEngagementFactor(0.60))).toContain('moderate');
      expect(interpretFactor(createEngagementFactor(0.85))).toContain('strong');
    });
  });

  describe('interpretFactor - behavior', () => {
    const createBehaviorFactor = (incidents: number): RiskFactor => ({
      name: 'Behavior Incidents',
      category: 'behavior',
      rawValue: incidents,
      normalizedScore: 0.5,
      weight: 0.15,
      weightedScore: 0.075,
      description: '',
      trend: 'stable',
    });

    it('interprets zero incidents', () => {
      expect(interpretFactor(createBehaviorFactor(0))).toContain('No behavior incidents');
    });

    it('interprets one incident', () => {
      expect(interpretFactor(createBehaviorFactor(1))).toContain('1 behavior incident');
    });

    it('interprets multiple incidents', () => {
      expect(interpretFactor(createBehaviorFactor(5))).toContain('pattern of concern');
    });
  });

  describe('getFactorCategoryLabel', () => {
    it('returns proper labels for all categories', () => {
      expect(getFactorCategoryLabel('attendance')).toBe('Attendance');
      expect(getFactorCategoryLabel('academic')).toBe('Academic');
      expect(getFactorCategoryLabel('behavior')).toBe('Behavior');
      expect(getFactorCategoryLabel('engagement')).toBe('Engagement');
      expect(getFactorCategoryLabel('assignments')).toBe('Assignments');
    });
  });
});

describe('Trajectory Interpretation', () => {
  describe('interpretTrajectory', () => {
    it('interprets improving trajectory', () => {
      const result = interpretTrajectory('improving');
      expect(result).toContain('improving');
    });

    it('interprets improving with previous level', () => {
      const result = interpretTrajectory('improving', 'at_risk');
      expect(result).toContain('Improving');
      expect(result).toContain('at risk');
    });

    it('interprets declining trajectory', () => {
      const result = interpretTrajectory('declining');
      expect(result).toContain('declining');
    });

    it('interprets stable trajectory', () => {
      const result = interpretTrajectory('stable');
      expect(result).toContain('steady');
    });
  });

  describe('getTrajectoryIcon', () => {
    it('returns up for improving', () => {
      expect(getTrajectoryIcon('improving')).toBe('up');
    });

    it('returns down for declining', () => {
      expect(getTrajectoryIcon('declining')).toBe('down');
    });

    it('returns right for stable', () => {
      expect(getTrajectoryIcon('stable')).toBe('right');
    });
  });

  describe('getTrajectoryColor', () => {
    it('returns emerald for improving', () => {
      expect(getTrajectoryColor('improving')).toContain('emerald');
    });

    it('returns red for declining', () => {
      expect(getTrajectoryColor('declining')).toContain('red');
    });

    it('returns slate for stable', () => {
      expect(getTrajectoryColor('stable')).toContain('slate');
    });
  });
});

describe('Confidence Interpretation', () => {
  describe('interpretConfidence', () => {
    it('returns null for high confidence', () => {
      expect(interpretConfidence(0.85)).toBeNull();
      expect(interpretConfidence(0.95)).toBeNull();
    });

    it('returns warning for medium confidence', () => {
      const result = interpretConfidence(0.65);
      expect(result).toContain('Some data missing');
    });

    it('returns concern for low confidence', () => {
      const result = interpretConfidence(0.45);
      expect(result).toContain('Limited data');
    });

    it('returns strong warning for very low confidence', () => {
      const result = interpretConfidence(0.3);
      expect(result).toContain('Very limited');
      expect(result).toContain('unreliable');
    });
  });

  describe('getConfidenceBadge', () => {
    it('returns null for high confidence', () => {
      expect(getConfidenceBadge(0.85)).toBeNull();
    });

    it('returns warning badge for medium confidence', () => {
      const badge = getConfidenceBadge(0.65);
      expect(badge?.variant).toBe('warning');
      expect(badge?.label).toBe('Partial Data');
    });

    it('returns danger badge for low confidence', () => {
      const badge = getConfidenceBadge(0.4);
      expect(badge?.variant).toBe('danger');
      expect(badge?.label).toBe('Limited Data');
    });
  });
});

describe('Action Prompts', () => {
  const createFactors = (): RiskFactor[] => [
    {
      name: 'Attendance Rate',
      category: 'attendance',
      rawValue: 0.75,
      normalizedScore: 0.7,
      weight: 0.25,
      weightedScore: 0.175,
      description: '',
      trend: 'stable',
    },
    {
      name: 'Academic Performance',
      category: 'academic',
      rawValue: 2,
      normalizedScore: 0.5,
      weight: 0.3,
      weightedScore: 0.15,
      description: '',
      trend: 'stable',
    },
  ];

  describe('generateActionPrompts', () => {
    it('includes urgent action for critical level', () => {
      const actions = generateActionPrompts(createFactors(), 'critical', false);
      expect(actions.some(a => a.toLowerCase().includes('urgently'))).toBe(true);
    });

    it('includes attendance-related actions for attendance concerns', () => {
      const actions = generateActionPrompts(createFactors(), 'at_risk', false);
      expect(actions.some(a => a.toLowerCase().includes('attendance') || a.toLowerCase().includes('family'))).toBe(true);
    });

    it('includes intervention prompt when no intervention exists', () => {
      const actions = generateActionPrompts(createFactors(), 'at_risk', false);
      expect(actions.some(a => a.toLowerCase().includes('intervention'))).toBe(true);
    });

    it('does not include intervention prompt when intervention exists', () => {
      const actions = generateActionPrompts(createFactors(), 'at_risk', true);
      expect(actions.some(a => a.includes('Assign intervention'))).toBe(false);
    });

    it('limits actions to 4 items', () => {
      const actions = generateActionPrompts(createFactors(), 'critical', false);
      expect(actions.length).toBeLessThanOrEqual(4);
    });
  });
});

describe('Summary Generation', () => {
  const factors: RiskFactor[] = [
    {
      name: 'Attendance Rate',
      category: 'attendance',
      rawValue: 0.75,
      normalizedScore: 0.7,
      weight: 0.25,
      weightedScore: 0.175,
      description: '',
      trend: 'stable',
    },
  ];

  describe('generateStudentSummary', () => {
    it('includes student name', () => {
      const summary = generateStudentSummary('Alex', 'at_risk', factors, 'stable');
      expect(summary).toContain('Alex');
    });

    it('includes risk status', () => {
      const summary = generateStudentSummary('Alex', 'at_risk', factors, 'stable');
      expect(summary).toContain('needs support');
    });

    it('includes factor interpretation', () => {
      const summary = generateStudentSummary('Alex', 'at_risk', factors, 'stable');
      expect(summary.toLowerCase()).toContain('attendance');
    });
  });

  describe('getPrimaryConcern', () => {
    it('returns null for empty factors', () => {
      expect(getPrimaryConcern([])).toBeNull();
    });

    it('returns null for low weighted scores', () => {
      const lowFactors: RiskFactor[] = [{
        name: 'Test',
        category: 'other',
        rawValue: 1,
        normalizedScore: 0.1,
        weight: 0.1,
        weightedScore: 0.05,
        description: '',
        trend: 'stable',
      }];
      expect(getPrimaryConcern(lowFactors)).toBeNull();
    });

    it('returns category label for significant factor', () => {
      expect(getPrimaryConcern(factors)).toBe('Attendance');
    });
  });
});
