/**
 * Unified Integration Service
 * ===========================
 *
 * Single entry point for all integration operations.
 * Consolidates registry, adapters, pipeline, and orchestrator into one service layer.
 *
 * Features:
 * - Unified API for all integration operations
 * - Automatic cost tracking and metering
 * - School-level billing support
 * - Health monitoring and alerting
 * - Centralized error handling
 */

import {
  DataSourceRegistry,
  type DataSourceAdapter,
  type DataSourceCategory,
  type DataTable,
  type SyncFrequency,
  type SyncResult,
  type SyncStatus,
  type DataSourceStatus,
} from '../data/sources/registry';
import {
  DataIntegrationPipeline,
  DataTransformationService,
  ConflictResolutionService,
  type PipelineConfig,
  type PipelineResult,
} from '../data/integration/pipeline';
import {
  DataConnectorOrchestrator,
  type ConnectorStatus,
} from '../data/integration/orchestrator';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/lib/database.types';

type DbDataSourceType = Database['public']['Enums']['data_source_type'];
type DbDataSourceProvider = Database['public']['Enums']['data_source_provider'];


// Re-export commonly used types
export type {
  DataSourceAdapter,
  DataSourceCategory,
  DataTable,
  SyncFrequency,
  SyncResult,
  SyncStatus,
  DataSourceStatus,
  ConnectorStatus,
  PipelineConfig,
  PipelineResult,
};

/**
 * Integration cost breakdown
 */
export interface IntegrationCost {
  integrationId: string;
  baseCost: number;
  studentCost: number;
  syncCost: number;
  recordCost: number;
  totalCost: number;
  discount: number;
  finalCost: number;
}

/**
 * Integration usage summary
 */
export interface IntegrationUsage {
  integrationId: string;
  integrationName: string;
  studentsSync: number;
  syncOperations: number;
  recordsProcessed: number;
  currentPeriodCost: number;
  billingPeriod: {
    start: Date;
    end: Date;
  };
}

/**
 * School integration summary
 */
export interface SchoolIntegrationSummary {
  schoolId: string;
  totalActiveIntegrations: number;
  totalMonthlyCost: number;
  integrations: IntegrationUsage[];
  healthScore: number;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
}

/**
 * Integration event for tracking
 */
export interface IntegrationEvent {
  schoolId: string;
  integrationId: string;
  eventType:
    | 'sync_started'
    | 'sync_completed'
    | 'sync_failed'
    | 'connection_established'
    | 'connection_lost'
    | 'records_synced'
    | 'oauth_authorized'
    | 'oauth_revoked'
    | 'quota_warning'
    | 'quota_exceeded';
  recordsCount?: number;
  studentsCount?: number;
  durationMs?: number;
  isBillable: boolean;
  costAmount?: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Service configuration
 */
export interface IntegrationServiceConfig {
  trackCosts: boolean;
  enableAlerts: boolean;
  maxConcurrentSyncs: number;
  costAlertThreshold?: number;
}

const DEFAULT_CONFIG: IntegrationServiceConfig = {
  trackCosts: true,
  enableAlerts: true,
  maxConcurrentSyncs: 3,
  costAlertThreshold: 100,
};

/**
 * Unified Integration Service
 *
 * Single facade over all integration components with cost tracking.
 */
export class IntegrationService {
  private config: IntegrationServiceConfig;
  private orchestrators: Map<string, DataConnectorOrchestrator> = new Map();

  constructor(config: Partial<IntegrationServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ===========================================================================
  // ADAPTER MANAGEMENT
  // ===========================================================================

  /**
   * Get all available integrations
   */
  getAvailableIntegrations(): DataSourceAdapter[] {
    return DataSourceRegistry.getAll();
  }

  /**
   * Get integrations by category
   */
  getIntegrationsByCategory(category: DataSourceCategory): DataSourceAdapter[] {
    return DataSourceRegistry.getByCategory(category);
  }

  /**
   * Get integrations available for a subscription tier
   */
  getIntegrationsForTier(tier: 'starter' | 'pro' | 'enterprise'): DataSourceAdapter[] {
    return DataSourceRegistry.getForTier(tier);
  }

  /**
   * Get a specific integration adapter
   */
  getIntegration(integrationId: string): DataSourceAdapter | undefined {
    return DataSourceRegistry.get(integrationId);
  }

  // ===========================================================================
  // CONNECTION MANAGEMENT
  // ===========================================================================

  /**
   * Test connection for an integration
   */
  async testConnection(
    integrationId: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string; metadata?: Record<string, unknown> }> {
    const adapter = DataSourceRegistry.get(integrationId);
    if (!adapter) {
      return { success: false, message: `Unknown integration: ${integrationId}` };
    }

    try {
      return await adapter.testConnection(credentials);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection test failed';
      return { success: false, message };
    }
  }

  /**
   * Establish a new integration connection for a school
   */
  async connect(
    schoolId: string,
    integrationId: string,
    credentials: Record<string, string>,
    settings: {
      syncFrequency?: SyncFrequency;
      fieldMappings?: Record<string, string>;
    } = {}
  ): Promise<{ success: boolean; dataSourceId?: string; message: string }> {
    const adapter = DataSourceRegistry.get(integrationId);
    if (!adapter) {
      return { success: false, message: `Unknown integration: ${integrationId}` };
    }

    // Test connection first
    const testResult = await adapter.testConnection(credentials);
    if (!testResult.success) {
      return { success: false, message: `Connection test failed: ${testResult.message}` };
    }

    const supabase = createAdminSupabaseClient();

    // Create data source record
    // Map category to database type (handle 'finance' -> 'behavior' fallback)
    const dbType: DbDataSourceType =
      adapter.category === 'finance' ? 'behavior' : (adapter.category as DbDataSourceType);
    // Map integrationId to valid provider enum
    const validProviders = new Set<DbDataSourceProvider>([
      'clever', 'classlink', 'powerschool', 'canvas', 'google_classroom', 'nwea_map', 'iready', 'renaissance_star', 'custom'
    ]);
    const dbProvider: DbDataSourceProvider = validProviders.has(integrationId as DbDataSourceProvider)
      ? (integrationId as DbDataSourceProvider)
      : 'custom';

    const { data: dataSource, error } = await supabase
      .from('data_sources')
      .insert({
        school_id: schoolId,
        name: adapter.name,
        type: dbType,
        provider: dbProvider,
        sync_enabled: true,
        sync_frequency_hours: this.frequencyToHours(settings.syncFrequency || adapter.defaultFrequency),
        connection_config: credentials as Json,
        field_mappings: (settings.fieldMappings || {}) as Json,
        is_active: true,
        connected_at: new Date().toISOString(),
        metadata: (testResult.metadata || {}) as Json,
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: `Failed to save connection: ${error.message}` };
    }

    // Track connection event
    await this.trackEvent({
      schoolId,
      integrationId,
      eventType: 'connection_established',
      isBillable: false,
      metadata: { dataSourceId: dataSource.id },
    });

    // Initialize school integration settings if not exists
    await this.ensureSchoolSettings(schoolId);

    return { success: true, dataSourceId: dataSource.id, message: 'Connected successfully' };
  }

  /**
   * Disconnect an integration
   */
  async disconnect(
    schoolId: string,
    dataSourceId: string
  ): Promise<{ success: boolean; message: string }> {
    const supabase = createAdminSupabaseClient();

    // Get the data source to track the event
    const { data: dataSource } = await supabase
      .from('data_sources')
      .select('provider')
      .eq('id', dataSourceId)
      .eq('school_id', schoolId)
      .single();

    if (!dataSource) {
      return { success: false, message: 'Data source not found' };
    }

    // Soft delete
    const { error } = await supabase
      .from('data_sources')
      .update({
        is_active: false,
        sync_enabled: false,
        disconnected_at: new Date().toISOString(),
      })
      .eq('id', dataSourceId)
      .eq('school_id', schoolId);

    if (error) {
      return { success: false, message: `Failed to disconnect: ${error.message}` };
    }

    // Track disconnection
    await this.trackEvent({
      schoolId,
      integrationId: dataSource.provider,
      eventType: 'connection_lost',
      isBillable: false,
      metadata: { dataSourceId, reason: 'user_disconnected' },
    });

    return { success: true, message: 'Disconnected successfully' };
  }

  // ===========================================================================
  // OAUTH MANAGEMENT
  // ===========================================================================

  /**
   * Get OAuth authorization URL for an integration
   */
  getOAuthUrl(integrationId: string, schoolId: string, redirectUri: string): string | null {
    const adapter = DataSourceRegistry.get(integrationId);
    if (!adapter || !adapter.usesOAuth || !adapter.getOAuthUrl) {
      return null;
    }

    return adapter.getOAuthUrl(schoolId, redirectUri);
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    integrationId: string,
    schoolId: string,
    code: string,
    redirectUri: string
  ): Promise<{ success: boolean; credentials?: Record<string, string>; message: string }> {
    const adapter = DataSourceRegistry.get(integrationId);
    if (!adapter || !adapter.usesOAuth || !adapter.handleOAuthCallback) {
      return { success: false, message: 'Integration does not support OAuth' };
    }

    try {
      const result = await adapter.handleOAuthCallback(schoolId, code, redirectUri);

      // Track OAuth event
      await this.trackEvent({
        schoolId,
        integrationId,
        eventType: 'oauth_authorized',
        isBillable: false,
      });

      return { success: true, credentials: result.credentials, message: 'OAuth authorized' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth callback failed';
      return { success: false, message };
    }
  }

  // ===========================================================================
  // SYNC OPERATIONS
  // ===========================================================================

  /**
   * Trigger a sync operation
   */
  async sync(
    schoolId: string,
    dataSourceId: string,
    options: {
      fullSync?: boolean;
      tables?: DataTable[];
      triggeredBy?: 'manual' | 'cron' | 'webhook';
      userId?: string;
    } = {}
  ): Promise<SyncResult> {
    const supabase = createAdminSupabaseClient();

    // Get data source configuration
    const { data: dataSource, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('id', dataSourceId)
      .eq('school_id', schoolId)
      .single();

    if (error || !dataSource) {
      return this.createFailedSyncResult('Data source not found');
    }

    const adapter = DataSourceRegistry.get(dataSource.provider);
    if (!adapter) {
      return this.createFailedSyncResult(`Unknown integration: ${dataSource.provider}`);
    }

    const startedAt = new Date();

    // Track sync started
    await this.trackEvent({
      schoolId,
      integrationId: dataSource.provider,
      eventType: 'sync_started',
      isBillable: false,
      metadata: { dataSourceId, fullSync: options.fullSync },
    });

    // Create sync history record
    const { data: syncHistory } = await supabase
      .from('sync_history')
      .insert({
        school_id: schoolId,
        data_source_id: dataSourceId,
        sync_type: options.fullSync ? 'full' : 'incremental',
        started_at: startedAt.toISOString(),
        status: 'syncing',
        triggered_by: options.triggeredBy || 'manual',
        triggered_by_user_id: options.userId,
      })
      .select()
      .single();

    try {
      // Execute sync
      const connectionConfig = (dataSource.connection_config || {}) as Record<string, string>;
      const result = await adapter.sync(schoolId, connectionConfig, {
        fullSync: options.fullSync,
        tables: options.tables,
      });

      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      // Update sync history
      if (syncHistory) {
        await supabase
          .from('sync_history')
          .update({
            status: result.success ? 'completed' : 'failed',
            completed_at: completedAt.toISOString(),
            records_processed: result.recordsProcessed,
            records_created: result.recordsCreated,
            records_updated: result.recordsUpdated,
            records_skipped: result.recordsSkipped,
            duration_ms: durationMs,
            errors: result.errors as unknown as Json,
          })
          .eq('id', syncHistory.id);
      }

      // Update data source status
      await supabase
        .from('data_sources')
        .update({
          last_sync_at: completedAt.toISOString(),
          sync_status: result.success ? 'completed' : 'failed',
          sync_error: result.errors[0]?.message || null,
          last_record_count: result.recordsProcessed,
          records_synced: (dataSource.records_synced || 0) + result.recordsCreated + result.recordsUpdated,
          next_sync_at: this.calculateNextSync(dataSource.sync_frequency_hours || 24),
        })
        .eq('id', dataSourceId);

      // Track usage for billing
      if (this.config.trackCosts) {
        await this.trackUsage(schoolId, dataSourceId, dataSource.provider, result);
      }

      // Track sync completed/failed event
      await this.trackEvent({
        schoolId,
        integrationId: dataSource.provider,
        eventType: result.success ? 'sync_completed' : 'sync_failed',
        recordsCount: result.recordsProcessed,
        durationMs,
        isBillable: true,
        errorMessage: result.errors[0]?.message,
        metadata: {
          dataSourceId,
          syncHistoryId: syncHistory?.id,
          created: result.recordsCreated,
          updated: result.recordsUpdated,
          skipped: result.recordsSkipped,
        },
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      const completedAt = new Date();

      // Update sync history with error
      if (syncHistory) {
        await supabase
          .from('sync_history')
          .update({
            status: 'failed',
            completed_at: completedAt.toISOString(),
            error_message: message,
            duration_ms: completedAt.getTime() - startedAt.getTime(),
          })
          .eq('id', syncHistory.id);
      }

      // Track failure
      await this.trackEvent({
        schoolId,
        integrationId: dataSource.provider,
        eventType: 'sync_failed',
        durationMs: completedAt.getTime() - startedAt.getTime(),
        isBillable: false,
        errorMessage: message,
      });

      return this.createFailedSyncResult(message);
    }
  }

  /**
   * Run a multi-source pipeline sync
   */
  async runPipeline(
    schoolId: string,
    config: Partial<PipelineConfig>
  ): Promise<PipelineResult> {
    const supabase = createAdminSupabaseClient();

    // Get credentials for all sources
    const { data: dataSources } = await supabase
      .from('data_sources')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .eq('sync_enabled', true)
      .in('provider', (config.sources || []) as DbDataSourceProvider[]);

    const credentials = new Map<string, Record<string, string>>();
    for (const ds of dataSources || []) {
      credentials.set(ds.provider, (ds.connection_config || {}) as Record<string, string>);
    }

    const pipeline = new DataIntegrationPipeline({
      schoolId,
      sources: config.sources || [],
      syncMode: config.syncMode || 'incremental',
      conflictResolution: config.conflictResolution || 'latest_wins',
      validateData: config.validateData ?? true,
      transformations: config.transformations || [],
    });

    const result = await pipeline.execute(credentials);

    // Track usage for each source
    if (this.config.trackCosts) {
      for (const [sourceId, syncResult] of result.sourceResults) {
        const ds = dataSources?.find((d) => d.provider === sourceId);
        if (ds) {
          await this.trackUsage(schoolId, ds.id, sourceId, syncResult);
        }
      }
    }

    return result;
  }

  // ===========================================================================
  // STATUS & MONITORING
  // ===========================================================================

  /**
   * Get all connector statuses for a school
   */
  async getSchoolConnectorStatuses(schoolId: string): Promise<ConnectorStatus[]> {
    const orchestrator = this.getOrCreateOrchestrator(schoolId);
    return orchestrator.getConnectorStatuses();
  }

  /**
   * Get comprehensive integration summary for a school
   */
  async getSchoolSummary(schoolId: string): Promise<SchoolIntegrationSummary> {
    const supabase = createAdminSupabaseClient();

    // Get active data sources
    const { data: dataSources } = await supabase
      .from('data_sources')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    // Get current period usage
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // integration_usage table not yet in schema - using empty array
    type IntegrationUsageRecord = {
      data_source_id: string;
      cost_cents: number;
      records_processed: number;
      students_synced: number;
      sync_operations: number;
      total_cost: number;
    };
    const usageRecords: IntegrationUsageRecord[] = [];

    // Calculate summary
    const integrations: IntegrationUsage[] = [];
    let totalMonthlyCost = 0;
    let lastSyncAt: Date | null = null;
    let nextSyncAt: Date | null = null;
    let totalHealthScore = 0;

    for (const ds of dataSources || []) {
      const adapter = DataSourceRegistry.get(ds.provider);
      const usage = usageRecords?.find((u) => u.data_source_id === ds.id);

      integrations.push({
        integrationId: ds.provider,
        integrationName: adapter?.name || ds.name,
        studentsSync: usage?.students_synced || 0,
        syncOperations: usage?.sync_operations || 0,
        recordsProcessed: usage?.records_processed || 0,
        currentPeriodCost: usage?.total_cost || 0,
        billingPeriod: {
          start: periodStart,
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        },
      });

      totalMonthlyCost += usage?.total_cost || 0;

      if (ds.last_sync_at) {
        const syncDate = new Date(ds.last_sync_at);
        if (!lastSyncAt || syncDate > lastSyncAt) {
          lastSyncAt = syncDate;
        }
      }

      if (ds.next_sync_at) {
        const nextDate = new Date(ds.next_sync_at);
        if (!nextSyncAt || nextDate < nextSyncAt) {
          nextSyncAt = nextDate;
        }
      }

      // Simple health calculation
      let health = 100;
      if (ds.sync_status === 'failed') health -= 50;
      if (ds.sync_error) health -= 20;
      totalHealthScore += health;
    }

    const activeCount = dataSources?.length || 0;

    return {
      schoolId,
      totalActiveIntegrations: activeCount,
      totalMonthlyCost,
      integrations,
      healthScore: activeCount > 0 ? Math.round(totalHealthScore / activeCount) : 100,
      lastSyncAt,
      nextSyncAt,
    };
  }

  // ===========================================================================
  // COST & BILLING
  // ===========================================================================

  /**
   * Get current period costs for a school
   */
  async getCurrentPeriodCosts(_schoolId: string): Promise<{
    totalCost: number;
    breakdown: IntegrationCost[];
    billingPeriod: { start: Date; end: Date };
  }> {
    const _supabase = createAdminSupabaseClient();

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // integration_usage table not yet in schema - using empty array for now
    type UsageRecord = { integration_id: string; base_cost: string; student_cost: string; sync_cost: string; record_cost: string; total_cost: string; discount_amount: string };
    const usageRecords: UsageRecord[] = [];

    const breakdown: IntegrationCost[] = [];
    let totalCost = 0;

    for (const usage of usageRecords || []) {
      const cost: IntegrationCost = {
        integrationId: usage.integration_id,
        baseCost: parseFloat(usage.base_cost) || 0,
        studentCost: parseFloat(usage.student_cost) || 0,
        syncCost: parseFloat(usage.sync_cost) || 0,
        recordCost: parseFloat(usage.record_cost) || 0,
        totalCost: parseFloat(usage.total_cost) || 0,
        discount: parseFloat(usage.discount_amount) || 0,
        finalCost: parseFloat(usage.total_cost) - (parseFloat(usage.discount_amount) || 0),
      };

      breakdown.push(cost);
      totalCost += cost.finalCost;
    }

    return {
      totalCost,
      breakdown,
      billingPeriod: { start: periodStart, end: periodEnd },
    };
  }

  /**
   * Get integration pricing
   * NOTE: integration_pricing table not yet in schema - using static data
   */
  async getIntegrationPricing(): Promise<
    Array<{
      integrationId: string;
      name: string;
      category: string;
      baseMonthlyCost: number;
      perStudentCost: number;
      perSyncCost: number;
      perRecordCost: number;
      freeStudentsLimit: number;
      freeSyncsLimit: number;
      freeRecordsLimit: number;
    }>
  > {
    // Return static pricing data - table not yet created
    const adapters = DataSourceRegistry.getAll();
    return adapters.map((adapter) => ({
      integrationId: adapter.id,
      name: adapter.name,
      category: adapter.category,
      baseMonthlyCost: 25.0,
      perStudentCost: 0.05,
      perSyncCost: 0.10,
      perRecordCost: 0.001,
      freeStudentsLimit: 100,
      freeSyncsLimit: 30,
      freeRecordsLimit: 10000,
    }));
  }

  /**
   * Estimate cost for a sync operation
   * NOTE: integration_pricing table not yet in schema - using static estimates
   */
  async estimateSyncCost(
    schoolId: string,
    integrationId: string,
    estimatedRecords: number,
    estimatedStudents: number
  ): Promise<{ estimatedCost: number; breakdown: IntegrationCost }> {
    const supabase = createAdminSupabaseClient();

    // Get school tier
    const { data: school } = await supabase
      .from('schools')
      .select('subscription_tier')
      .eq('id', schoolId)
      .single();

    // Use static pricing defaults (table not yet created)
    const pricing = {
      baseMonthlyCost: 25.0,
      perStudentCost: 0.05,
      perSyncCost: 0.10,
      perRecordCost: 0.001,
      freeStudentsLimit: 100,
      freeSyncsLimit: 30,
      freeRecordsLimit: 10000,
      starterMultiplier: 1.0,
      proMultiplier: 0.8,
      enterpriseMultiplier: 0.6,
    };

    const tier = school?.subscription_tier || 'starter';
    const multiplier =
      tier === 'enterprise'
        ? pricing.enterpriseMultiplier
        : tier === 'pro'
          ? pricing.proMultiplier
          : pricing.starterMultiplier;

    const baseCost = pricing.baseMonthlyCost * multiplier;
    const studentCost =
      pricing.perStudentCost *
      Math.max(0, estimatedStudents - pricing.freeStudentsLimit) *
      multiplier;
    const syncCost =
      pricing.perSyncCost * Math.max(0, 1 - pricing.freeSyncsLimit) * multiplier;
    const recordCost =
      pricing.perRecordCost *
      Math.max(0, estimatedRecords - pricing.freeRecordsLimit) *
      multiplier;

    const totalCost = baseCost + studentCost + syncCost + recordCost;

    return {
      estimatedCost: totalCost,
      breakdown: {
        integrationId,
        baseCost,
        studentCost,
        syncCost,
        recordCost,
        totalCost,
        discount: 0,
        finalCost: totalCost,
      },
    };
  }

  // ===========================================================================
  // UTILITY EXPORTS (for backward compatibility)
  // ===========================================================================

  /**
   * Get the data transformation service
   */
  get transformations(): typeof DataTransformationService {
    return DataTransformationService;
  }

  /**
   * Get the conflict resolution service
   */
  get conflictResolution(): typeof ConflictResolutionService {
    return ConflictResolutionService;
  }

  /**
   * Get the data source registry
   */
  get registry(): typeof DataSourceRegistry {
    return DataSourceRegistry;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private getOrCreateOrchestrator(schoolId: string): DataConnectorOrchestrator {
    let orchestrator = this.orchestrators.get(schoolId);
    if (!orchestrator) {
      orchestrator = new DataConnectorOrchestrator({
        schoolId,
        maxConcurrentSyncs: this.config.maxConcurrentSyncs,
      });
      this.orchestrators.set(schoolId, orchestrator);
    }
    return orchestrator;
  }

  private frequencyToHours(frequency: SyncFrequency): number {
    switch (frequency) {
      case 'realtime':
        return 0.5;
      case 'hourly':
        return 1;
      case 'daily':
        return 24;
      case 'weekly':
        return 168;
      case 'manual':
        return 0;
      default:
        return 24;
    }
  }

  private calculateNextSync(frequencyHours: number): string | null {
    if (frequencyHours <= 0) return null;
    const next = new Date(Date.now() + frequencyHours * 60 * 60 * 1000);
    return next.toISOString();
  }

  private createFailedSyncResult(message: string): SyncResult {
    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [{ code: 'SYNC_FAILED', message }],
      startedAt: new Date(),
      completedAt: new Date(),
    };
  }

  // NOTE: integration_events table not yet in schema - no-op for now
  private async trackEvent(_event: IntegrationEvent): Promise<void> {
    // Table not yet created - logging to console instead
    console.log('[Integration] Event tracked (table pending):', _event.eventType);
  }

  // NOTE: increment_integration_usage RPC not yet in schema - no-op for now
  private async trackUsage(
    _schoolId: string,
    _dataSourceId: string,
    _integrationId: string,
    _result: SyncResult
  ): Promise<void> {
    // RPC not yet created - no-op
    console.log('[Integration] Usage tracked (RPC pending)');
  }

  // NOTE: school_integration_settings table not yet in schema - no-op for now
  private async ensureSchoolSettings(_schoolId: string): Promise<void> {
    // Table not yet created - no-op
  }
}

// Singleton instance for common use
let _defaultService: IntegrationService | null = null;

/**
 * Get the default integration service instance
 */
export function getIntegrationService(config?: Partial<IntegrationServiceConfig>): IntegrationService {
  if (!_defaultService || config) {
    _defaultService = new IntegrationService(config);
  }
  return _defaultService;
}

/**
 * Create a new integration service instance
 */
export function createIntegrationService(config?: Partial<IntegrationServiceConfig>): IntegrationService {
  return new IntegrationService(config);
}
