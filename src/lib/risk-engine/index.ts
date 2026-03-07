// src/lib/risk-engine/index.ts
/**
 * Risk Engine Barrel Exports
 * Centralizes all risk engine module exports.
 */

export * from './types';
export { aggregateSchoolMetrics, aggregateStudentMetrics } from './metrics-aggregator';
export { evaluateSchoolRisk } from './orchestrator';
export type { BatchEvaluationResult } from './orchestrator';
export type { AggregationResult } from './metrics-aggregator';