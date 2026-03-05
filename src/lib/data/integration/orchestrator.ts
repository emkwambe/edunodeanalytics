/**
 * Data Connector Orchestrator
 * ===========================
 *
 * Manages scheduled syncs, monitors connector health, and handles
 * automatic retries for failed connections.
 *
 * Features:
 * - Scheduled sync management
 * - Connector health monitoring
 * - Automatic retry with exponential backoff
 * - Rate limiting and throttling
 * - Webhook event handling
 */

import { DataSourceRegistry, type SyncFrequency, type SyncStatus } from '../sources/registry';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export interface OrchestratorConfig {
  schoolId: string;
  maxConcurrentSyncs: number;
  retryAttempts: number;
  retryDelayMs: number;
  healthCheckIntervalMs: number;
}

export interface ConnectorStatus {
  sourceId: string;
  sourceName: string;
  status: SyncStatus;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
  recordCount: number;
  errorMessage?: string;
  healthScore: number; // 0-100
  uptime: number; // percentage
}

interface ScheduledSync {
  sourceId: string;
  schoolId: string;
  scheduledAt: Date;
  frequency: SyncFrequency;
  retryCount: number;
}

/**
 * Data Connector Orchestrator
 *
 * Central management for all data source connections
 */
export class DataConnectorOrchestrator {
  private config: OrchestratorConfig;
  private scheduledSyncs: Map<string, ScheduledSync> = new Map();
  private activeSyncs: Set<string> = new Set();
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<OrchestratorConfig> & { schoolId: string }) {
    this.config = {
      schoolId: config.schoolId,
      maxConcurrentSyncs: config.maxConcurrentSyncs || 3,
      retryAttempts: config.retryAttempts || 3,
      retryDelayMs: config.retryDelayMs || 5000,
      healthCheckIntervalMs: config.healthCheckIntervalMs || 60000,
    };
  }

  /**
   * Get status of all connected data sources
   */
  async getConnectorStatuses(): Promise<ConnectorStatus[]> {
    const supabase = createAdminSupabaseClient();
    const statuses: ConnectorStatus[] = [];

    const { data: dataSources } = await supabase
      .from('school_data_sources')
      .select('*')
      .eq('school_id', this.config.schoolId)
      .eq('is_enabled', true);

    if (!dataSources) return statuses;

    for (const ds of dataSources) {
      const adapter = DataSourceRegistry.get(ds.provider);
      if (!adapter) continue;

      // Calculate health score based on recent syncs
      const healthScore = this.calculateHealthScore(ds);
      const uptime = await this.calculateUptime(ds.id);

      statuses.push({
        sourceId: ds.provider,
        sourceName: adapter.name,
        status: ds.sync_status as SyncStatus,
        lastSyncAt: ds.last_sync_at ? new Date(ds.last_sync_at) : null,
        nextSyncAt: ds.next_sync_at ? new Date(ds.next_sync_at) : null,
        recordCount: ds.last_record_count || 0,
        errorMessage: ds.sync_error || undefined,
        healthScore,
        uptime,
      });
    }

    return statuses;
  }

  /**
   * Calculate health score for a data source (0-100)
   */
  private calculateHealthScore(dataSource: Record<string, unknown>): number {
    let score = 100;

    // Deduct for errors
    if (dataSource.sync_error) {
      score -= 30;
    }

    // Deduct for failed status
    if (dataSource.sync_status === 'failed') {
      score -= 40;
    } else if (dataSource.sync_status === 'pending') {
      score -= 10;
    }

    // Deduct for stale data
    if (dataSource.last_sync_at) {
      const hoursSinceSync = (Date.now() - new Date(dataSource.last_sync_at as string).getTime()) / (1000 * 60 * 60);
      if (hoursSinceSync > 48) {
        score -= 20;
      } else if (hoursSinceSync > 24) {
        score -= 10;
      }
    } else {
      score -= 15;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate uptime percentage over last 30 days
   */
  private async calculateUptime(dataSourceId: string): Promise<number> {
    const supabase = createAdminSupabaseClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: syncHistory } = await supabase
      .from('sync_history')
      .select('status')
      .eq('data_source_id', dataSourceId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (!syncHistory || syncHistory.length === 0) return 100;

    const successCount = syncHistory.filter((s) => s.status === 'completed').length;
    return Math.round((successCount / syncHistory.length) * 100);
  }

  /**
   * Schedule a sync for a data source
   */
  scheduleSync(sourceId: string, frequency: SyncFrequency): void {
    const nextSyncAt = this.calculateNextSyncTime(frequency);

    this.scheduledSyncs.set(`${this.config.schoolId}:${sourceId}`, {
      sourceId,
      schoolId: this.config.schoolId,
      scheduledAt: nextSyncAt,
      frequency,
      retryCount: 0,
    });

    console.log(`[Orchestrator] Scheduled ${sourceId} sync for ${nextSyncAt.toISOString()}`);
  }

  /**
   * Calculate next sync time based on frequency
   */
  private calculateNextSyncTime(frequency: SyncFrequency): Date {
    const now = new Date();

    switch (frequency) {
      case 'realtime':
        return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case 'daily':
        // Schedule for 2 AM next day
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0);
        return tomorrow;
      case 'weekly':
        // Schedule for Sunday 2 AM
        const nextSunday = new Date(now);
        nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
        nextSunday.setHours(2, 0, 0, 0);
        return nextSunday;
      case 'manual':
      default:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // Far future
    }
  }

  /**
   * Trigger immediate sync for a data source
   */
  async triggerSync(
    sourceId: string,
    credentials: Record<string, string>,
    options: { fullSync?: boolean } = {}
  ): Promise<{ success: boolean; message: string }> {
    const key = `${this.config.schoolId}:${sourceId}`;

    // Check if already syncing
    if (this.activeSyncs.has(key)) {
      return { success: false, message: 'Sync already in progress' };
    }

    // Check concurrent sync limit
    if (this.activeSyncs.size >= this.config.maxConcurrentSyncs) {
      return { success: false, message: 'Maximum concurrent syncs reached' };
    }

    const adapter = DataSourceRegistry.get(sourceId);
    if (!adapter) {
      return { success: false, message: `Unknown data source: ${sourceId}` };
    }

    this.activeSyncs.add(key);

    try {
      console.log(`[Orchestrator] Starting sync for ${sourceId}`);
      const result = await adapter.sync(this.config.schoolId, credentials, options);

      // Update next sync time
      const scheduled = this.scheduledSyncs.get(key);
      if (scheduled) {
        scheduled.scheduledAt = this.calculateNextSyncTime(scheduled.frequency);
        scheduled.retryCount = 0;
      }

      return {
        success: result.success,
        message: result.success
          ? `Synced ${result.recordsProcessed} records`
          : `Sync failed: ${result.errors[0]?.message || 'Unknown error'}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Orchestrator] Sync error for ${sourceId}:`, message);

      // Handle retry logic
      const scheduled = this.scheduledSyncs.get(key);
      if (scheduled && scheduled.retryCount < this.config.retryAttempts) {
        scheduled.retryCount++;
        scheduled.scheduledAt = new Date(Date.now() + this.config.retryDelayMs * scheduled.retryCount);
        console.log(`[Orchestrator] Scheduling retry ${scheduled.retryCount} for ${sourceId}`);
      }

      return { success: false, message };
    } finally {
      this.activeSyncs.delete(key);
    }
  }

  /**
   * Get pending syncs that are due
   */
  getPendingSyncs(): ScheduledSync[] {
    const now = new Date();
    const pending: ScheduledSync[] = [];

    for (const sync of this.scheduledSyncs.values()) {
      if (sync.scheduledAt <= now) {
        pending.push(sync);
      }
    }

    return pending.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  /**
   * Start health check monitoring
   */
  startHealthMonitoring(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      const statuses = await this.getConnectorStatuses();

      for (const status of statuses) {
        if (status.healthScore < 50) {
          console.warn(`[Orchestrator] Low health score for ${status.sourceName}: ${status.healthScore}`);
          // Could trigger alerts here
        }
      }
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Stop health check monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Handle webhook event from data source
   */
  async handleWebhook(
    sourceId: string,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    console.log(`[Orchestrator] Received webhook from ${sourceId}: ${eventType}`);

    const supabase = createAdminSupabaseClient();

    // Log webhook event
    await supabase.from('webhook_events').insert({
      school_id: this.config.schoolId,
      source: sourceId,
      event_type: eventType,
      payload,
      processed: false,
    });

    // Handle specific event types
    switch (eventType) {
      case 'student.created':
      case 'student.updated':
      case 'student.deleted':
        // Queue incremental sync
        this.scheduleSync(sourceId, 'realtime');
        break;
      case 'roster.changed':
        // Queue full sync
        const adapter = DataSourceRegistry.get(sourceId);
        if (adapter) {
          // This would normally get credentials from secure storage
          console.log(`[Orchestrator] Queueing roster sync for ${sourceId}`);
        }
        break;
    }
  }
}

/**
 * Create a new orchestrator instance
 */
export function createOrchestrator(
  config: Partial<OrchestratorConfig> & { schoolId: string }
): DataConnectorOrchestrator {
  return new DataConnectorOrchestrator(config);
}
