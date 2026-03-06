/**
 * Risk Detection Module
 * =====================
 *
 * Layer 2: Student Risk Detection Engine
 *
 * Exports for the risk detection and early warning system.
 * Sprint 1B: Added risk-engine/types re-exports.
 */

// Detection Engine
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

// Early Warning System
export {
  EarlyWarningSystem,
  createEarlyWarningSystem,
  DEFAULT_ALERT_RULES,
  type AlertRule,
  type AlertCondition,
  type Alert,
} from './early-warning';

// Database Types (Sprint 1B)
export {
  type RiskModelConfig,
  type RiskModelConfigRow,
  type StudentMetricsRow,
  type StudentMetricHistoryRow,
  type RiskEvaluationRow,
  type RiskEvaluationInsert,
  type RiskAlertRow,
  type RiskAlertInsert,
  type CurrentRiskScoreRow,
  type RiskLevel,
  type TriggerType,
  type Trajectory,
  type AlertType,
  type AlertSeverity,
  type AlertStatus,
  type RiskFactorRecord,
  parseConfigRow,
} from '@/lib/risk-engine/types';