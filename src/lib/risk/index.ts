/**
 * Risk Detection Module
 * =====================
 *
 * Layer 2: Student Risk Detection Engine
 *
 * Exports for the risk detection and early warning system.
 */

export {
  RiskDetectionEngine,
  createRiskEngine,
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_THRESHOLDS,
  type RiskWeights,
  type RiskThresholds,
  type RiskAssessment,
  type RiskFactor,
  type TrendData,
} from './detection-engine';

export {
  EarlyWarningSystem,
  createEarlyWarningSystem,
  DEFAULT_ALERT_RULES,
  type AlertRule,
  type AlertCondition,
  type Alert,
} from './early-warning';
