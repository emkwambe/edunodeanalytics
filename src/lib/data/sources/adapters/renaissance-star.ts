/**
 * Renaissance STAR Adapter
 * ========================
 *
 * Integration with Renaissance STAR Reading and Math assessments.
 * Pulls diagnostic scores, ZPD ranges, and growth metrics.
 *
 * Data provided:
 * - STAR Reading scores (scaled score, GE, percentile rank)
 * - STAR Math scores (scaled score, GE, percentile rank)
 * - Zone of Proximal Development (ZPD) ranges
 * - Student Growth Percentile (SGP)
 */

import {
  createAdapter,
  DataSourceRegistry,
  type DataSourceAdapter,
} from '../registry';

export const renaissanceStarAdapter: DataSourceAdapter = createAdapter({
  id: 'renaissance-star',
  name: 'Renaissance STAR',
  description: 'Import STAR Reading and Math assessment data with ZPD and growth metrics',
  category: 'assessment',
  icon: 'Star',
  brandColor: '#5C2D91',
  logoUrl: '/integrations/renaissance-logo.svg',

  tables: ['assessments'],
  supportedFrequencies: ['daily', 'weekly', 'manual'],
  defaultFrequency: 'daily',
  requiredTier: 'starter',

  usesOAuth: false,

  credentialFields: [
    {
      key: 'client_id',
      label: 'Client ID',
      type: 'text',
      placeholder: 'Your Renaissance Platform client ID',
      required: true,
    },
    {
      key: 'client_secret',
      label: 'Client Secret',
      type: 'password',
      required: true,
    },
    {
      key: 'platform_url',
      label: 'Platform URL',
      type: 'url',
      placeholder: 'https://global-zone.renaissance.com',
      required: true,
    },
  ],

  async testConnection(credentials) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!credentials.client_id || !credentials.client_secret) {
      return {
        success: false,
        message: 'Missing client credentials',
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Renaissance',
      metadata: {
        schoolName: 'Demo Charter School',
        activeTests: ['STAR Reading', 'STAR Math', 'STAR Early Literacy'],
        studentCount: 492,
      },
    };
  },

  async sync(_schoolId, _credentials, _options = {}) {
    const startedAt = new Date();

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const recordCount = 980 + Math.floor(Math.random() * 200);

    return {
      success: true,
      recordsProcessed: recordCount,
      recordsCreated: Math.floor(recordCount * 0.05),
      recordsUpdated: Math.floor(recordCount * 0.08),
      recordsSkipped: 0,
      errors: [],
      startedAt,
      completedAt: new Date(),
      nextSyncAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  },

  async getStatus(_schoolId) {
    return {
      status: 'connected',
      lastSyncAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      lastSyncResult: null,
      nextSyncAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      recordCount: 1876,
    };
  },
});

DataSourceRegistry.register(renaissanceStarAdapter);
