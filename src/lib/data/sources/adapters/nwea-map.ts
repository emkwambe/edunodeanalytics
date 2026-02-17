/**
 * NWEA MAP Growth Adapter
 * =======================
 *
 * Integration with NWEA MAP Growth assessment platform.
 * Pulls RIT scores, growth metrics, and goal performance.
 *
 * Data provided:
 * - Assessment scores (RIT, percentiles)
 * - Growth data (conditional growth index, projected scores)
 * - Goal performance (Lexile, Quantile)
 *
 * API Docs: https://teach.mapnwea.org/impl/api-docs
 */

import {
  createAdapter,
  DataSourceRegistry,
  type DataSourceAdapter,
  type SyncResult,
  type DataSourceStatus,
  type SyncError,
} from '../registry';

const MOCK_SYNC_DELAY = 3000;

/**
 * Generate mock assessment data
 */
function generateMockAssessments(studentCount: number, schoolId: string) {
  const subjects = ['Reading', 'Math', 'Language Usage', 'Science'];
  const terms = ['Fall', 'Winter', 'Spring'];

  return Array.from({ length: studentCount }, (_, i) => {
    const baseRit = 200 + Math.floor(Math.random() * 40);
    return {
      studentId: `stu_${schoolId}_${i.toString().padStart(4, '0')}`,
      assessments: subjects.flatMap((subject) =>
        terms.map((term) => ({
          subject,
          term,
          testDate: new Date(2024, terms.indexOf(term) * 3 + 1, 15),
          ritScore: baseRit + Math.floor(Math.random() * 20) - 10,
          standardError: 2 + Math.random() * 2,
          percentile: Math.floor(Math.random() * 100),
          growthIndex: -1 + Math.random() * 4,
          projectedRit: baseRit + 8 + Math.floor(Math.random() * 10),
          lexile: subject === 'Reading' ? 800 + Math.floor(Math.random() * 400) : null,
          quantile: subject === 'Math' ? 700 + Math.floor(Math.random() * 300) : null,
        }))
      ),
    };
  });
}

export const nweaMapAdapter: DataSourceAdapter = createAdapter({
  id: 'nwea-map',
  name: 'NWEA MAP Growth',
  description: 'Import MAP Growth assessment scores, RIT data, and growth metrics',
  category: 'assessment',
  icon: 'LineChart',
  brandColor: '#00A4E4',
  logoUrl: '/integrations/nwea-logo.svg',

  tables: ['assessments'],
  supportedFrequencies: ['daily', 'weekly', 'manual'],
  defaultFrequency: 'daily',
  requiredTier: 'starter',

  usesOAuth: false,

  credentialFields: [
    {
      key: 'api_url',
      label: 'API Endpoint',
      type: 'url',
      placeholder: 'https://api.mapnwea.org/services',
      required: true,
      helpText: 'Your NWEA API endpoint URL',
    },
    {
      key: 'username',
      label: 'API Username',
      type: 'text',
      placeholder: 'api_user@school.edu',
      required: true,
    },
    {
      key: 'password',
      label: 'API Password',
      type: 'password',
      required: true,
    },
    {
      key: 'district_code',
      label: 'District Code',
      type: 'text',
      placeholder: 'Your NWEA district code',
      required: true,
    },
  ],

  async testConnection(credentials) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (!credentials.api_url || !credentials.username || !credentials.password) {
      return {
        success: false,
        message: 'Missing required credentials',
      };
    }

    return {
      success: true,
      message: 'Successfully connected to NWEA MAP',
      metadata: {
        districtName: 'Demo School District',
        availableTerms: ['Fall 2024', 'Winter 2024', 'Spring 2025'],
        totalStudents: 1250,
      },
    };
  },

  async sync(schoolId, credentials, options = {}) {
    const startedAt = new Date();
    const errors: SyncError[] = [];

    await new Promise((resolve) => setTimeout(resolve, MOCK_SYNC_DELAY));

    const studentCount = 450 + Math.floor(Math.random() * 100);
    const assessments = generateMockAssessments(studentCount, schoolId);
    const totalRecords = assessments.reduce((sum, s) => sum + s.assessments.length, 0);

    const completedAt = new Date();

    return {
      success: true,
      recordsProcessed: totalRecords,
      recordsCreated: options.fullSync ? totalRecords : Math.floor(totalRecords * 0.02),
      recordsUpdated: options.fullSync ? 0 : Math.floor(totalRecords * 0.05),
      recordsSkipped: 0,
      errors,
      startedAt,
      completedAt,
      nextSyncAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  },

  async getStatus(schoolId) {
    return {
      status: 'connected',
      lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastSyncResult: null,
      nextSyncAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
      recordCount: 2847,
    };
  },
});

DataSourceRegistry.register(nweaMapAdapter);
