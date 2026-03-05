/**
 * Data Integration Module
 * =======================
 *
 * Layer 1: Data Integration
 *
 * Exports for the unified data pipeline system.
 */

export {
  DataIntegrationPipeline,
  DataTransformationService,
  ConflictResolutionService,
  createPipeline,
  type PipelineConfig,
  type PipelineResult,
  type PipelineError,
  type DataTransformation,
  type ValidationRule,
} from './pipeline';

export {
  DataConnectorOrchestrator,
  type ConnectorStatus,
  type OrchestratorConfig,
} from './orchestrator';
