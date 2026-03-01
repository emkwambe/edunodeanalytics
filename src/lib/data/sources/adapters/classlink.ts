/**
 * ClassLink Adapter
 * =================
 *
 * Integration with ClassLink OneRoster API for roster sync.
 * Supports OAuth 2.0 for school-level authorization.
 *
 * Data provided:
 * - Students (demographics, grade level, enrollments)
 * - Staff (teachers, administrators)
 * - Classes (sections, subjects, periods)
 * - Enrollments (student-class mappings)
 *
 * API Docs: https://developer.classlink.com/oneroster
 */

import {
  createAdapter,
  DataSourceRegistry,
  type DataSourceAdapter,
  type SyncResult,
  type DataSourceStatus,
  type SyncError,
} from '../registry';
import {
  syncClassLinkRoster,
  getClassLinkSyncStatus,
} from '@/lib/integrations/classlink-mock';

const MOCK_SYNC_DELAY = 2000;

/**
 * ClassLink adapter implementation
 */
export const classlinkAdapter: DataSourceAdapter = createAdapter({
  id: 'classlink',
  name: 'ClassLink',
  description: 'OneRoster sync with student demographics, classes, and enrollment data',
  category: 'sis',
  icon: 'Link',
  brandColor: '#00A4E4',
  logoUrl: '/integrations/classlink-logo.svg',

  tables: ['students', 'staff', 'sections', 'enrollments'],
  supportedFrequencies: ['hourly', 'daily', 'weekly'],
  defaultFrequency: 'daily',
  requiredTier: 'starter',

  usesOAuth: true,
  oauthConfig: {
    authUrl: 'https://launchpad.classlink.com/oauth2/v2/auth',
    tokenUrl: 'https://launchpad.classlink.com/oauth2/v2/token',
    scopes: ['oneroster', 'profile', 'full'],
  },

  credentialFields: [
    {
      key: 'tenant_id',
      label: 'Tenant ID',
      type: 'text',
      placeholder: 'Your ClassLink Tenant ID',
      required: true,
      helpText: 'Found in your ClassLink admin console under Organization Settings',
    },
    {
      key: 'client_id',
      label: 'Client ID',
      type: 'text',
      placeholder: 'OAuth Application Client ID',
      required: true,
    },
    {
      key: 'client_secret',
      label: 'Client Secret',
      type: 'password',
      placeholder: 'OAuth Application Client Secret',
      required: true,
    },
    {
      key: 'api_endpoint',
      label: 'API Endpoint',
      type: 'select',
      required: true,
      helpText: 'Select your ClassLink region',
      options: [
        { value: 'https://nodeapi.classlink.com', label: 'US (Production)' },
        { value: 'https://nodeapi-ca.classlink.com', label: 'Canada' },
        { value: 'https://nodeapi-eu.classlink.com', label: 'Europe' },
        { value: 'https://nodeapi-sandbox.classlink.com', label: 'Sandbox (Testing)' },
      ],
    },
  ],

  async testConnection(credentials) {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (!credentials.tenant_id || !credentials.client_id || !credentials.client_secret) {
      return {
        success: false,
        message: 'Missing required credentials',
      };
    }

    // Validate tenant_id format (should be alphanumeric)
    if (!/^[a-zA-Z0-9-]+$/.test(credentials.tenant_id)) {
      return {
        success: false,
        message: 'Invalid Tenant ID format',
      };
    }

    return {
      success: true,
      message: 'Successfully connected to ClassLink',
      metadata: {
        tenantName: 'Demo School District',
        oneRosterVersion: '1.1',
        schoolCount: 4,
        studentCount: 2150,
        staffCount: 185,
      },
    };
  },

  async sync(schoolId, credentials, options = {}) {
    const startedAt = new Date();
    const errors: SyncError[] = [];

    try {
      // Use the ClassLink mock sync
      const result = await syncClassLinkRoster(
        credentials.tenant_id || schoolId,
        schoolId,
        {
          studentCount: 500,
          simulateLatency: true,
        }
      );

      const completedAt = new Date();

      // Map to SyncResult format
      return {
        success: result.status === 'COMPLETED',
        recordsProcessed: result.synced_students + result.synced_teachers + result.synced_classes,
        recordsCreated: result.new_records,
        recordsUpdated: result.updated_records,
        recordsSkipped: 0,
        errors: result.errors.map((e) => ({
          code: 'SYNC_ERROR',
          message: e,
        })),
        startedAt,
        completedAt,
        nextSyncAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errors: [
          {
            code: 'SYNC_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error during sync',
          },
        ],
        startedAt,
        completedAt: new Date(),
      };
    }
  },

  async getStatus(schoolId) {
    const status = await getClassLinkSyncStatus(schoolId);

    return {
      status: status.status,
      lastSyncAt: status.lastSync ? new Date(status.lastSync) : null,
      lastSyncResult: null,
      nextSyncAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
      recordCount: status.studentCount + status.classCount,
    };
  },

  getOAuthUrl(schoolId, redirectUri) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.CLASSLINK_CLIENT_ID || 'demo_client_id',
      redirect_uri: redirectUri,
      scope: 'oneroster profile full',
      state: schoolId,
    });
    return `https://launchpad.classlink.com/oauth2/v2/auth?${params.toString()}`;
  },

  async handleOAuthCallback(schoolId, code, redirectUri) {
    // In production, exchange code for tokens via ClassLink token endpoint
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      credentials: {
        access_token: `cl_access_${Date.now()}`,
        refresh_token: `cl_refresh_${Date.now()}`,
        tenant_id: 'demo_tenant',
        token_type: 'Bearer',
        expires_in: '3600',
      },
    };
  },
});

// Register the adapter
DataSourceRegistry.register(classlinkAdapter);
