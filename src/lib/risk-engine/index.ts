// src/lib/risk-engine/index.ts
/**
 * Risk Engine Barrel Exports
 * ==========================
 *
 * Main entry point for the EduNode MTSS Risk Scoring Engine.
 *
 * Quick Start:
 *   import { createRiskSystem } from '@/lib/risk-engine';
 *   const risk = await createRiskSystem(schoolId);
 *   const result = await risk.evaluateAll();
 *
 * For more control, import individual components:
 *   import { createRiskEngine } from '@/lib/risk';
 *   import { aggregateSchoolMetrics } from '@/lib/risk-engine';
 */

// ============================================================
// Main System (unified entry point)
// ============================================================

export {
  RiskSystem,
  createRiskSystem,
  type RiskSystemConfig,
  type EvaluationSummary,
  type StudentRiskProfile,
  type DashboardData,
} from './risk-system';

// ============================================================
// Database Types
// ============================================================

export * from './types';

// ============================================================
// Metrics Aggregation
// ============================================================

export { aggregateSchoolMetrics, aggregateStudentMetrics } from './metrics-aggregator';
export type { AggregationResult } from './metrics-aggregator';

// ============================================================
// Batch Orchestration
// ============================================================

export { evaluateSchoolRisk } from './orchestrator';
export type { BatchEvaluationResult } from './orchestrator';

// ============================================================
// Trend Detection
// ============================================================

export {
  TrendDetector,
  createTrendDetector,
  linearRegression,
  determineTrajectory,
  determineConfidence,
} from './trend-detector';
export type {
  TrendResult,
  StudentTrendAnalysis,
  LinearRegressionResult,
} from './trend-detector';

// ============================================================
// Interpreter (plain language)
// ============================================================

export {
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
} from './interpreter';

// ============================================================
// Re-exports from lib/risk for convenience
// ============================================================

export {
  createRiskEngine,
  RiskDetectionEngine,
  createEarlyWarningSystem,
  EarlyWarningSystem,
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_THRESHOLDS,
  DEFAULT_ALERT_RULES,
  type RiskWeights,
  type RiskThresholds,
  type RiskAssessment,
  type RiskFactor,
  type TrendData,
  type AlertRule,
  type AlertCondition,
  type Alert,
} from '@/lib/risk';