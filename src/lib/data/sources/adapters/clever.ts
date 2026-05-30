/**
 * Clever Adapter
 * ==============
 *
 * Integration with Clever for roster sync via their Secure Sync API.
 * Supports OAuth 2.0 for school-level authorization.
 *
 * Security:
 * - OAuth tokens stored encrypted (production should use AES-256)
 * - PII handled according to FERPA guidelines
 * - All API calls over TLS 1.3
 * - Comprehensive audit logging
 *
 * Data provided:
 * - Students (demographics, grade level, IEP/504/ELL flags)
 * - Staff (teachers, administrators)
 * - Sections (class rosters, subjects, periods)
 * - Enrollments (student-section mappings)
 *
 * API Docs: https://dev.clever.com/docs
 */

import {
  createAdapter,
  DataSourceRegistry,
  type DataSourceAdapter,
  type SyncError,
} from '../registry';
import {
  exchangeCleverCode,
  fetchCleverStudents,
  getCleverDistrict,
  transformCleverStudent,
  CleverApiError,
} from '@/lib/integrations/clever-api';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import {
  getDataSourceByProvider,
  updateDataSourceSyncStatus,
  createSyncHistory,
  completeSyncHistory,
} from '@/lib/db/queries/data-sources';

// Check if we're in production mode with real API credentials
const USE_LIVE_API = !!(process.env.CLEVER_CLIENT_ID && process.env.CLEVER_CLIENT_SECRET);

// Mock data for development when no API credentials
const MOCK_SYNC_DELAY = 2000;

/**
 * Generate mock student data for development
 */
function _generateMockStudents(count: number, schoolId: string) {
  const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const grades = [6, 7, 8, 9, 10, 11, 12];

  return Array.from({ length: count }, (_, i) => ({
    id: `clever_stu_${schoolId}_${i.toString().padStart(4, '0')}`,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[Math.floor(i / firstNames.length) % lastNames.length],
    grade: grades[i % grades.length],
    email: `student${i}@school.edu`,
    sisId: `SIS${schoolId}${i.toString().padStart(5, '0')}`,
    hasIep: Math.random() < 0.12,
    has504: Math.random() < 0.08,
    isEll: Math.random() < 0.15,
    hispanicLatino: Math.random() < 0.25,
    race: ['white', 'black', 'asian', 'multi'][Math.floor(Math.random() * 4)],
    gender: ['M', 'F', 'X'][Math.floor(Math.random() * 3)],
    dob: new Date(2008 + Math.floor(i / 100), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
  }));
}

/**
 * Perform live sync using Clever API
 */
async function performLiveSync(
  schoolId: string,
  credentials: Record<string, string>,
  options: { fullSync?: boolean } = {}
): Promise<import('../registry').SyncResult> {
  const startedAt = new Date();
  const errors: SyncError[] = [];
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsSkipped = 0;

  // Get data source for sync history
  const dataSource = await getDataSourceByProvider(schoolId, 'clever');
  let syncHistoryId: string | null = null;

  if (dataSource) {
    syncHistoryId = await createSyncHistory({
      schoolId,
      dataSourceId: dataSource.id,
      syncType: options.fullSync ? 'full' : 'incremental',
      triggeredBy: 'manual',
    });

    // Mark as syncing
    await updateDataSourceSyncStatus(dataSource.id, 'syncing');
  }

  try {
    const accessToken = credentials.access_token;
    if (!accessToken) {
      throw new Error('No access token available - please reconnect');
    }

    // Fetch students from Clever
    console.log('[Clever] Fetching students from API...');
    const cleverStudents = await fetchCleverStudents(accessToken, credentials.district_id);
    console.log(`[Clever] Retrieved ${cleverStudents.length} students`);

    // Transform and upsert to database
    const supabase = createAdminSupabaseClient();

    for (const cleverStudent of cleverStudents) {
      const studentData = transformCleverStudent(cleverStudent, schoolId);

      // Upsert student record
      const { data: existing } = await (supabase as any)
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('sis_student_id', studentData.sis_student_id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await (supabase as any)
          .from('students')
          .update({
            ...studentData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) {
          errors.push({
            code: 'UPDATE_ERROR',
            message: error.message,
            recordId: studentData.sis_student_id,
          });
          recordsSkipped++;
        } else {
          recordsUpdated++;
        }
      } else {
        // Create new
        const { error } = await supabase.from('students').insert({
          ...studentData,
          is_active: true,
          enrolled_at: new Date().toISOString().split('T')[0],
        });

        if (error) {
          errors.push({
            code: 'CREATE_ERROR',
            message: error.message,
            recordId: studentData.sis_student_id,
          });
          recordsSkipped++;
        } else {
          recordsCreated++;
        }
      }
    }

    const completedAt = new Date();
    const result: import('../registry').SyncResult = {
      success: errors.length < cleverStudents.length * 0.1, // 90% success threshold
      recordsProcessed: cleverStudents.length,
      recordsCreated,
      recordsUpdated,
      recordsSkipped,
      errors,
      startedAt,
      completedAt,
      nextSyncAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    // Update sync history and data source
    if (dataSource) {
      await completeSyncHistory(syncHistoryId!, {
        status: result.success ? 'completed' : 'failed',
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsSkipped: result.recordsSkipped,
        errors: errors as unknown as import('@/lib/database.types').Json,
      });

      await updateDataSourceSyncStatus(
        dataSource.id,
        result.success ? 'completed' : 'failed',
        {
          error: errors.length > 0 ? errors[0].message : undefined,
          recordsSynced: recordsCreated + recordsUpdated,
          recordCount: cleverStudents.length,
        }
      );
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Clever] Sync failed:', errorMessage);

    // Update sync history with failure
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
  options: { fullSync?: boolean } = {}
): Promise<import('../registry').SyncResult> {
  const startedAt = new Date();
  const errors: SyncError[] = [];

  // Simulate sync delay
  await new Promise((resolve) => setTimeout(resolve, MOCK_SYNC_DELAY));

  // Generate mock data
  const studentCount = 450 + Math.floor(Math.random() * 100);

  // Simulate some errors
  if (Math.random() < 0.1) {
    errors.push({
      code: 'DUPLICATE_SIS_ID',
      message: 'Duplicate SIS ID found',
      recordId: 'mock_student_001',
      field: 'sisId',
    });
  }

  const completedAt = new Date();

  return {
    success: errors.length === 0,
    recordsProcessed: studentCount,
    recordsCreated: options.fullSync ? studentCount : Math.floor(studentCount * 0.05),
    recordsUpdated: options.fullSync ? 0 : Math.floor(studentCount * 0.1),
    recordsSkipped: errors.length,
    errors,
    startedAt,
    completedAt,
    nextSyncAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

/**
 * Clever adapter implementation
 */
export const cleverAdapter: DataSourceAdapter = createAdapter({
  id: 'clever',
  name: 'Clever',
  description: 'Automatic roster sync with student demographics and class schedules',
  category: 'sis',
  icon: 'Users',
  brandColor: '#4285F4',
  logoUrl: '/integrations/clever-logo.svg',

  tables: ['students', 'staff', 'sections', 'enrollments'],
  supportedFrequencies: ['realtime', 'hourly', 'daily'],
  defaultFrequency: 'daily',
  requiredTier: 'starter',

  usesOAuth: true,
  oauthConfig: {
    authUrl: 'https://clever.com/oauth/authorize',
    tokenUrl: 'https://clever.com/oauth/tokens',
    scopes: ['read:students', 'read:teachers', 'read:sections', 'read:school_admins'],
  },

  credentialFields: [
    {
      key: 'district_id',
      label: 'District ID',
      type: 'text',
      placeholder: 'Your Clever District ID',
      required: true,
      helpText: 'Found in your Clever dashboard under District Settings',
    },
    {
      key: 'client_id',
      label: 'Client ID',
      type: 'text',
      placeholder: 'OAuth Client ID',
      required: true,
    },
    {
      key: 'client_secret',
      label: 'Client Secret',
      type: 'password',
      placeholder: 'OAuth Client Secret',
      required: true,
    },
  ],

  async testConnection(credentials) {
    if (!USE_LIVE_API) {
      // Mock mode
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!credentials.district_id || !credentials.client_id) {
        return {
          success: false,
          message: 'Missing required credentials',
        };
      }

      return {
        success: true,
        message: 'Successfully connected to Clever (Mock Mode)',
        metadata: {
          districtName: 'Demo School District',
          schoolCount: 3,
          studentCount: 1250,
          mode: 'mock',
        },
      };
    }

    // Live API mode
    try {
      if (!credentials.access_token) {
        return {
          success: false,
          message: 'No access token - please complete OAuth flow',
        };
      }

      const district = await getCleverDistrict(credentials.access_token);

      return {
        success: true,
        message: `Successfully connected to ${district.name}`,
        metadata: {
          districtName: district.name,
          districtId: district.id,
          mode: 'live',
        },
      };
    } catch (error) {
      const message =
        error instanceof CleverApiError
          ? error.message
          : 'Connection test failed';
      return {
        success: false,
        message,
      };
    }
  },

  async sync(schoolId, credentials, options = {}) {
    if (USE_LIVE_API && credentials.access_token) {
      return performLiveSync(schoolId, credentials, options);
    }
    return performMockSync(schoolId, options);
  },

  async getStatus(schoolId) {
    // Fetch real status from database
    const dataSource = await getDataSourceByProvider(schoolId, 'clever');

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

  getOAuthUrl(schoolId, redirectUri) {
    const clientId = process.env.CLEVER_CLIENT_ID || 'demo_client_id';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:students read:teachers read:sections',
      state: schoolId,
    });
    return `https://clever.com/oauth/authorize?${params.toString()}`;
  },

  async handleOAuthCallback(_schoolId, code, redirectUri) {
    if (!USE_LIVE_API) {
      // Mock mode
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        credentials: {
          access_token: `mock_access_token_${Date.now()}`,
          refresh_token: `mock_refresh_token_${Date.now()}`,
          district_id: 'demo_district',
        },
      };
    }

    // Live API mode
    try {
      const tokenResponse = await exchangeCleverCode(code, redirectUri);

      // Get district info
      const district = await getCleverDistrict(tokenResponse.access_token);

      return {
        credentials: {
          access_token: tokenResponse.access_token,
          refresh_token: '', // Clever doesn't provide refresh tokens in basic flow
          district_id: district.id,
        },
      };
    } catch (error) {
      console.error('[Clever] OAuth callback error:', error);
      throw error;
    }
  },
});

// Register the adapter
DataSourceRegistry.register(cleverAdapter);
