import { NextRequest, NextResponse } from 'next/server';
import { DataSourceRegistry } from '@/lib/data/sources/registry';
import {
  getDataSourcesDueForSync,
  updateDataSourceSyncStatus,
  createSyncHistory,
  completeSyncHistory,
} from '@/lib/db/queries/data-sources';

// Import adapters to register them
import '@/lib/data/sources/adapters/clever';
import '@/lib/data/sources/adapters/classlink';
import '@/lib/data/sources/adapters/nwea-map';

/**
 * Cron Job: Sync Rosters
 *
 * Runs daily at 6 AM to sync student rosters from configured data sources.
 * Protected by CRON_SECRET to prevent unauthorized execution.
 *
 * Security:
 * - Only processes active schools with valid subscriptions
 * - Uses encrypted credentials from data_sources table
 * - Comprehensive audit logging for FERPA compliance
 */

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const results: {
    schoolId: string;
    provider: string;
    status: 'success' | 'failed' | 'skipped';
    recordsProcessed?: number;
    error?: string;
  }[] = [];

  try {
    // Get all data sources due for sync
    const dataSourcesDue = await getDataSourcesDueForSync();

    console.log(`[CRON] Found ${dataSourcesDue.length} data sources due for sync`);

    if (dataSourcesDue.length === 0) {
      return NextResponse.json({
        job: 'sync-rosters',
        status: 'completed',
        message: 'No data sources due for sync',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        stats: {
          sourcesProcessed: 0,
          sourcesSucceeded: 0,
          sourcesFailed: 0,
        },
      });
    }

    // Process each data source
    for (const dataSource of dataSourcesDue) {
      const adapter = DataSourceRegistry.get(dataSource.provider);

      if (!adapter) {
        console.warn(`[CRON] No adapter found for provider: ${dataSource.provider}`);
        results.push({
          schoolId: dataSource.school_id,
          provider: dataSource.provider,
          status: 'skipped',
          error: 'Adapter not found',
        });
        continue;
      }

      console.log(`[CRON] Syncing ${dataSource.provider} for school ${dataSource.school_id}`);

      // Create sync history record
      const syncHistoryId = await createSyncHistory({
        schoolId: dataSource.school_id,
        dataSourceId: dataSource.id,
        syncType: 'incremental',
        triggeredBy: 'cron',
      });

      try {
        // Mark as syncing
        await updateDataSourceSyncStatus(dataSource.id, 'syncing');

        // Parse credentials from connection_config
        const credentials = (dataSource.connection_config as Record<string, string>) || {};

        // Add any encrypted tokens if available
        if (dataSource.access_token_encrypted) {
          credentials.access_token = dataSource.access_token_encrypted;
        }

        // Perform the sync
        const syncResult = await adapter.sync(dataSource.school_id, credentials, {
          fullSync: false,
        });

        // Update sync status based on result
        await updateDataSourceSyncStatus(
          dataSource.id,
          syncResult.success ? 'completed' : 'failed',
          {
            error: syncResult.errors?.[0]?.message,
            recordsSynced: syncResult.recordsCreated + syncResult.recordsUpdated,
            recordCount: syncResult.recordsProcessed,
          }
        );

        // Complete sync history
        if (syncHistoryId) {
          await completeSyncHistory(syncHistoryId, {
            status: syncResult.success ? 'completed' : 'failed',
            errorMessage: syncResult.errors?.[0]?.message,
            recordsProcessed: syncResult.recordsProcessed,
            recordsCreated: syncResult.recordsCreated,
            recordsUpdated: syncResult.recordsUpdated,
            recordsSkipped: syncResult.recordsSkipped,
          });
        }

        results.push({
          schoolId: dataSource.school_id,
          provider: dataSource.provider,
          status: syncResult.success ? 'success' : 'failed',
          recordsProcessed: syncResult.recordsProcessed,
          error: syncResult.errors?.[0]?.message,
        });

        console.log(`[CRON] Sync ${syncResult.success ? 'completed' : 'failed'} for ${dataSource.provider}:`, {
          recordsProcessed: syncResult.recordsProcessed,
          created: syncResult.recordsCreated,
          updated: syncResult.recordsUpdated,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[CRON] Sync error for ${dataSource.provider}:`, errorMessage);

        await updateDataSourceSyncStatus(dataSource.id, 'failed', {
          error: errorMessage,
        });

        if (syncHistoryId) {
          await completeSyncHistory(syncHistoryId, {
            status: 'failed',
            errorMessage,
            recordsProcessed: 0,
            recordsCreated: 0,
            recordsUpdated: 0,
          });
        }

        results.push({
          schoolId: dataSource.school_id,
          provider: dataSource.provider,
          status: 'failed',
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;
    const skippedCount = results.filter((r) => r.status === 'skipped').length;
    const totalRecords = results.reduce((sum, r) => sum + (r.recordsProcessed || 0), 0);

    const syncResults = {
      job: 'sync-rosters',
      status: failedCount === 0 ? 'completed' : 'partial',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      stats: {
        sourcesProcessed: dataSourcesDue.length,
        sourcesSucceeded: successCount,
        sourcesFailed: failedCount,
        sourcesSkipped: skippedCount,
        totalRecordsProcessed: totalRecords,
      },
      results,
    };

    console.log('[CRON] Roster sync completed:', {
      duration: syncResults.duration,
      stats: syncResults.stats,
    });

    return NextResponse.json(syncResults, { status: 200 });
  } catch (error) {
    console.error('[CRON] Roster sync failed:', error);

    return NextResponse.json(
      {
        job: 'sync-rosters',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
