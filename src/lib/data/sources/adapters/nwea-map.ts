/**
 * NWEA MAP Adapter
 * ================
 *
 * Integration with NWEA MAP Growth assessment platform.
 * Fetches RIT scores, growth metrics, and proficiency data.
 *
 * Security:
 * - API keys stored encrypted (AES-256 in production)
 * - Assessment data is FERPA protected
 * - All API calls require valid authorization
 * - Comprehensive audit logging for compliance
 *
 * Data provided:
 * - Assessment results (RIT scores by term)
 * - Growth metrics (percentiles, goal attainment)
 * - Proficiency levels
 *
 * API Docs: https://teach.mapnwea.org/impl/mapapi
 */

import {
  createAdapter,
  DataSourceRegistry,
  type DataSourceAdapter,
  type SyncError,
} from '../registry';
import {
  verifyNWEAConnection,
  fetchNWEAResults,
  transformNWEAResults,
  getCurrentSchoolYear,
  getCurrentTerm,
  NWEAApiError,
} from '@/lib/integrations/nwea-api';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import {
  getDataSourceByProvider,
  updateDataSourceSyncStatus,
  createSyncHistory,
  completeSyncHistory,
} from '@/lib/db/queries/data-sources';

// Check if we're in production mode with real API credentials
const USE_LIVE_API = !!process.env.NWEA_API_KEY;

const MOCK_SYNC_DELAY = 2500;

/**
 * Perform live sync using NWEA MAP API
 */
async function performLiveSync(
  schoolId: string,
  credentials: Record<string, string>,
  options: { fullSync?: boolean } = {}
): Promise<import('../registry').SyncResult> {
  const startedAt = new Date();
  const errors: SyncError[] = [];
  let recordsUpdated = 0;
  let recordsSkipped = 0;

  const dataSource = await getDataSourceByProvider(schoolId, 'nwea_map');
  let syncHistoryId: string | null = null;

  if (dataSource) {
    syncHistoryId = await createSyncHistory({
      schoolId,
      dataSourceId: dataSource.id,
      syncType: options.fullSync ? 'full' : 'incremental',
      triggeredBy: 'manual',
    });

    await updateDataSourceSyncStatus(dataSource.id, 'syncing');
  }

  try {
    const apiKey = credentials.api_key;
    const districtId = credentials.district_id;

    if (!apiKey || !districtId) {
      throw new Error('Missing API key or district ID - please check configuration');
    }

    // Fetch assessment results
    console.log('[NWEA] Fetching assessment results...');
    const schoolYear = getCurrentSchoolYear();
    const results = await fetchNWEAResults(apiKey, districtId, {
      schoolYear,
      schoolId: credentials.nwea_school_id,
    });
    console.log(`[NWEA] Retrieved ${results.length} assessment results`);

    // Transform results grouped by student
    const studentAssessments = transformNWEAResults(results, schoolId);

    // Update student records with assessment data
    const supabase = createAdminSupabaseClient();

    for (const assessment of studentAssessments) {
      // Find student by SIS ID
      const { data: student } = await (supabase as any)
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('sis_student_id', assessment.studentSisId)
        .single();

      if (!student) {
        errors.push({
          code: 'STUDENT_NOT_FOUND',
          message: `Student not found: ${assessment.studentSisId}`,
          recordId: assessment.studentSisId,
        });
        recordsSkipped++;
        continue;
      }

      // Update student with assessment scores
      const { error } = await (supabase as any)
        .from('students')
        .update({
          reading_scores: assessment.readingScores,
          math_scores: assessment.mathScores,
          growth_percentile: assessment.readingScores.growthPercentile ||
            assessment.mathScores.growthPercentile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', student.id);

      if (error) {
        errors.push({
          code: 'UPDATE_ERROR',
          message: error.message,
          recordId: assessment.studentSisId,
        });
        recordsSkipped++;
      } else {
        recordsUpdated++;
      }
    }

    const completedAt = new Date();
    const result: import('../registry').SyncResult = {
      success: errors.length < studentAssessments.length * 0.1,
      recordsProcessed: results.length,
      recordsCreated: 0, // Assessment sync only updates existing students
      recordsUpdated,
      recordsSkipped,
      errors,
      startedAt,
      completedAt,
      nextSyncAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Weekly for assessments
    };

    if (dataSource && syncHistoryId) {
      await completeSyncHistory(syncHistoryId, {
        status: result.success ? 'completed' : 'failed',
        recordsProcessed: result.recordsProcessed,
        recordsCreated: 0,
        recordsUpdated: result.recordsUpdated,
        recordsSkipped: result.recordsSkipped,
        errors: errors as unknown as import('@/lib/database.types').Json,
        details: {
          schoolYear,
          term: getCurrentTerm(),
          resultsCount: results.length,
          studentsUpdated: recordsUpdated,
        },
      });

      await updateDataSourceSyncStatus(
        dataSource.id,
        result.success ? 'completed' : 'failed',
        {
          error: errors.length > 0 ? errors[0].message : undefined,
          recordsSynced: recordsUpdated,
          recordCount: studentAssessments.length,
        }
      );
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NWEA] Sync failed:', errorMessage);

    if (dataSource && syncHistoryId) {
      await completeSyncHistory(syncHistoryId, {
        status: 'failed',
        errorMessage,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
      });

      await updateDataSourceSyncStatus(dataSource.id, 'failed', {
        error: errorMessage,
      });
    }

    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [{ code: 'SYNC_ERROR', message: errorMessage }],
      startedAt,
      completedAt: new Date(),
    };
  }
}

/**
 * Perform mock sync for development
 */
async function performMockSync(
  _schoolId: string,
  _options: { fullSync?: boolean } = {}
): Promise<import('../registry').SyncResult> {
  const startedAt = new Date();

  await new Promise((resolve) => setTimeout(resolve, MOCK_SYNC_DELAY));

  const resultCount = 800 + Math.floor(Math.random() * 200);
  const completedAt = new Date();

  return {
    success: true,
    recordsProcessed: resultCount,
    recordsCreated: 0,
    recordsUpdated: Math.floor(resultCount * 0.8),
    recordsSkipped: Math.floor(resultCount * 0.2),
    errors: [],
    startedAt,
    completedAt,
    nextSyncAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };
}

/**
 * NWEA MAP adapter implementation
 */
export const nweaMapAdapter: DataSourceAdapter = createAdapter({
  id: 'nwea_map',
  name: 'NWEA MAP Growth',
  description: 'Import MAP Growth assessment data including RIT scores and growth metrics',
  category: 'assessment',
  icon: 'BarChart3',
  brandColor: '#0066CC',
  logoUrl: '/integrations/nwea-logo.svg',

  tables: ['assessments'],
  supportedFrequencies: ['daily', 'weekly', 'manual'],
  defaultFrequency: 'weekly',
  requiredTier: 'starter',

  usesOAuth: false,
  credentialFields: [
    {
      key: 'api_key',
      label: 'API Key',
      type: 'password',
      placeholder: 'Your NWEA API Key',
      required: true,
      helpText: 'Generated in your NWEA admin portal under API Access',
    },
    {
      key: 'district_id',
      label: 'District ID',
      type: 'text',
      placeholder: 'NWEA District ID',
      required: true,
      helpText: 'Your NWEA district identifier',
    },
    {
      key: 'nwea_school_id',
      label: 'School ID (Optional)',
      type: 'text',
      placeholder: 'NWEA School ID',
      required: false,
      helpText: 'Filter results to a specific school within the district',
    },
  ],

  async testConnection(credentials) {
    if (!USE_LIVE_API && !credentials.api_key) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!credentials.district_id) {
        return {
          success: false,
          message: 'Missing required District ID',
        };
      }

      return {
        success: true,
        message: 'Successfully connected to NWEA MAP (Mock Mode)',
        metadata: {
          districtName: 'Demo School District',
          schoolCount: 3,
          currentSchoolYear: getCurrentSchoolYear(),
          currentTerm: getCurrentTerm(),
          mode: 'mock',
        },
      };
    }

    // Live API mode
    try {
      const apiKey = credentials.api_key || process.env.NWEA_API_KEY || '';
      const result = await verifyNWEAConnection(apiKey, credentials.district_id);

      if (!result.success) {
        return {
          success: false,
          message: 'Failed to connect to NWEA - check your API key and district ID',
        };
      }

      return {
        success: true,
        message: `Successfully connected to ${result.districtName || 'NWEA MAP'}`,
        metadata: {
          districtName: result.districtName,
          schoolCount: result.schoolCount,
          currentSchoolYear: getCurrentSchoolYear(),
          currentTerm: getCurrentTerm(),
          mode: 'live',
        },
      };
    } catch (error) {
      const message =
        error instanceof NWEAApiError
          ? error.message
          : 'Connection test failed';
      return {
        success: false,
        message,
      };
    }
  },

  async sync(schoolId, credentials, options = {}) {
    if (USE_LIVE_API || credentials.api_key) {
      return performLiveSync(schoolId, credentials, options);
    }
    return performMockSync(schoolId, options);
  },

  async getStatus(schoolId) {
    const dataSource = await getDataSourceByProvider(schoolId, 'nwea_map');

    if (!dataSource) {
      return {
        status: 'disconnected',
        lastSyncAt: null,
        lastSyncResult: null,
        nextSyncAt: null,
        recordCount: 0,
      };
    }

    return {
      status: dataSource.sync_status === 'completed' ? 'connected' : dataSource.sync_status,
      lastSyncAt: dataSource.last_sync_at ? new Date(dataSource.last_sync_at) : null,
      lastSyncResult: null,
      nextSyncAt: dataSource.next_sync_at ? new Date(dataSource.next_sync_at) : null,
      recordCount: dataSource.last_record_count,
      errorMessage: dataSource.sync_error || undefined,
    };
  },
});

// Register the adapter
DataSourceRegistry.register(nweaMapAdapter);
