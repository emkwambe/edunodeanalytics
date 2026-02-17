/**
 * iReady Adapter
 * ==============
 *
 * Integration with Curriculum Associates iReady platform.
 * Pulls diagnostic assessments and personalized learning path data.
 *
 * Data provided:
 * - Diagnostic assessment scores (scale scores, placement levels)
 * - Domain-level performance (phonics, comprehension, etc.)
 * - Growth tracking and grade-level placement
 *
 * API: Curriculum Associates Data Integration
 */

import {
  createAdapter,
  DataSourceRegistry,
  type DataSourceAdapter,
  type SyncResult,
  type DataSourceStatus,
  type SyncError,
} from '../registry';

const MOCK_SYNC_DELAY = 2500;

const READING_DOMAINS = [
  'Phonological Awareness',
  'Phonics',
  'High-Frequency Words',
  'Vocabulary',
  'Comprehension: Literature',
  'Comprehension: Informational Text',
];

const MATH_DOMAINS = [
  'Number and Operations',
  'Algebra and Algebraic Thinking',
  'Measurement and Data',
  'Geometry',
];

/**
 * Generate mock iReady diagnostic data
 */
function generateMockDiagnostics(studentCount: number, schoolId: string) {
  return Array.from({ length: studentCount }, (_, i) => {
    const readingPlacement = Math.floor(Math.random() * 4) - 1; // -1 to +2 grade levels
    const mathPlacement = Math.floor(Math.random() * 4) - 1;

    return {
      studentId: `stu_${schoolId}_${i.toString().padStart(4, '0')}`,
      reading: {
        scaleScore: 450 + Math.floor(Math.random() * 150),
        placementLevel: readingPlacement,
        nationalPercentile: Math.floor(Math.random() * 100),
        testDate: new Date(2024, 8, 15 + Math.floor(Math.random() * 30)),
        domains: READING_DOMAINS.map((domain) => ({
          name: domain,
          score: 40 + Math.floor(Math.random() * 60),
          status: ['below', 'approaching', 'on', 'above'][Math.floor(Math.random() * 4)],
        })),
      },
      math: {
        scaleScore: 420 + Math.floor(Math.random() * 180),
        placementLevel: mathPlacement,
        nationalPercentile: Math.floor(Math.random() * 100),
        testDate: new Date(2024, 8, 15 + Math.floor(Math.random() * 30)),
        domains: MATH_DOMAINS.map((domain) => ({
          name: domain,
          score: 40 + Math.floor(Math.random() * 60),
          status: ['below', 'approaching', 'on', 'above'][Math.floor(Math.random() * 4)],
        })),
      },
    };
  });
}

export const ireadyAdapter: DataSourceAdapter = createAdapter({
  id: 'iready',
  name: 'iReady',
  description: 'Import iReady diagnostic scores, domain performance, and placement levels',
  category: 'assessment',
  icon: 'Target',
  brandColor: '#6B4C9A',
  logoUrl: '/integrations/iready-logo.svg',

  tables: ['assessments'],
  supportedFrequencies: ['daily', 'weekly', 'manual'],
  defaultFrequency: 'weekly',
  requiredTier: 'starter',

  usesOAuth: false,

  credentialFields: [
    {
      key: 'site_id',
      label: 'Site ID',
      type: 'text',
      placeholder: 'Your iReady Site ID',
      required: true,
    },
    {
      key: 'api_key',
      label: 'API Key',
      type: 'password',
      placeholder: 'Your API key from iReady admin',
      required: true,
    },
    {
      key: 'data_export_type',
      label: 'Export Type',
      type: 'select',
      required: true,
      options: [
        { value: 'diagnostic', label: 'Diagnostic Only' },
        { value: 'diagnostic_growth', label: 'Diagnostic + Growth' },
        { value: 'full', label: 'Full Export (includes lessons)' },
      ],
    },
  ],

  async testConnection(credentials) {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (!credentials.site_id || !credentials.api_key) {
      return {
        success: false,
        message: 'Missing required credentials',
      };
    }

    return {
      success: true,
      message: 'Successfully connected to iReady',
      metadata: {
        schoolName: 'Demo Charter School',
        diagnosticWindows: ['BOY 2024', 'MOY 2024', 'EOY 2025'],
        activeStudents: 485,
      },
    };
  },

  async sync(schoolId, credentials, options = {}) {
    const startedAt = new Date();
    const errors: SyncError[] = [];

    await new Promise((resolve) => setTimeout(resolve, MOCK_SYNC_DELAY));

    const studentCount = 450 + Math.floor(Math.random() * 100);
    const diagnostics = generateMockDiagnostics(studentCount, schoolId);
    const totalRecords = studentCount * 2; // Reading + Math per student

    const completedAt = new Date();

    return {
      success: true,
      recordsProcessed: totalRecords,
      recordsCreated: options.fullSync ? totalRecords : Math.floor(totalRecords * 0.03),
      recordsUpdated: options.fullSync ? 0 : Math.floor(totalRecords * 0.02),
      recordsSkipped: 0,
      errors,
      startedAt,
      completedAt,
      nextSyncAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Weekly
    };
  },

  async getStatus(schoolId) {
    return {
      status: 'connected',
      lastSyncAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      lastSyncResult: null,
      nextSyncAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      recordCount: 970,
    };
  },
});

DataSourceRegistry.register(ireadyAdapter);
