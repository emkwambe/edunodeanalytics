/**
 * Unified Integration Module
 * ==========================
 *
 * Single entry point for all integration functionality.
 * Consolidates adapters, pipeline, orchestrator, and cost tracking.
 *
 * Usage:
 * ```typescript
 * import { getIntegrationService, IntegrationService } from '@/lib/integration';
 *
 * // Get default service instance
 * const service = getIntegrationService();
 *
 * // List available integrations
 * const integrations = service.getAvailableIntegrations();
 *
 * // Connect a school to an integration
 * await service.connect(schoolId, 'clever', credentials);
 *
 * // Trigger a sync
 * await service.sync(schoolId, dataSourceId);
 *
 * // Get school integration summary with costs
 * const summary = await service.getSchoolSummary(schoolId);
 * ```
 */

// Main service
export {
  IntegrationService,
  getIntegrationService,
  createIntegrationService,
  type IntegrationServiceConfig,
  type IntegrationCost,
  type IntegrationUsage,
  type SchoolIntegrationSummary,
  type IntegrationEvent,
  // Re-exports from underlying components
  type DataSourceAdapter,
  type DataSourceCategory,
  type DataTable,
  type SyncFrequency,
  type SyncResult,
  type SyncStatus,
  type DataSourceStatus,
  type ConnectorStatus,
  type PipelineConfig,
  type PipelineResult,
} from './service';

// Pricing
export {
  INTEGRATION_PRICING,
  getIntegrationPricing,
  getPricingByCategory,
  calculateMonthlyCost,
  getAllPricingSummary,
  estimateSchoolCost,
  type IntegrationPricingTier,
} from './pricing';

// Re-export registry for direct access if needed
export { DataSourceRegistry, DATA_SOURCE_CATEGORIES } from '../data/sources/registry';

// Re-export pipeline utilities
export {
  DataTransformationService,
  ConflictResolutionService,
  createPipeline,
} from '../data/integration/pipeline';

// Re-export orchestrator
export { DataConnectorOrchestrator, createOrchestrator } from '../data/integration/orchestrator';
