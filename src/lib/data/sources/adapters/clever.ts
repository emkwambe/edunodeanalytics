/**
 * Clever Adapter
 * ==============
 *
 * Integration with Clever for roster sync via their Secure Sync API.
 * Supports OAuth 2.0 for school-level authorization.
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
  type SyncResult,
  type DataSourceStatus,
  type SyncError,
} from '../registry';

// Mock data for development
const MOCK_SYNC_DELAY = 2000;

/**
 * Generate mock student data
 */
function generateMockStudents(count: number, schoolId: string) {
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
    // In production, this would call Clever API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!credentials.district_id || !credentials.client_id) {
      return {
        success: false,
        message: 'Missing required credentials',
      };
    }

    // Simulate connection test
    return {
      success: true,
      message: 'Successfully connected to Clever',
      metadata: {
        districtName: 'Demo School District',
        schoolCount: 3,
        studentCount: 1250,
      },
    };
  },

  async sync(schoolId, credentials, options = {}) {
    const startedAt = new Date();
    const errors: SyncError[] = [];

    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, MOCK_SYNC_DELAY));

    // Generate mock data
    const studentCount = 450 + Math.floor(Math.random() * 100);
    const students = generateMockStudents(studentCount, schoolId);

    // Simulate some errors
    if (Math.random() < 0.1) {
      errors.push({
        code: 'DUPLICATE_SIS_ID',
        message: 'Duplicate SIS ID found',
        recordId: students[0].id,
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
      nextSyncAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    };
  },

  async getStatus(schoolId) {
    // In production, fetch from database
    return {
      status: 'connected',
      lastSyncAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      lastSyncResult: null,
      nextSyncAt: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours from now
      recordCount: 487,
    };
  },

  getOAuthUrl(schoolId, redirectUri) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.CLEVER_CLIENT_ID || 'demo_client_id',
      redirect_uri: redirectUri,
      scope: 'read:students read:teachers read:sections',
      state: schoolId,
    });
    return `https://clever.com/oauth/authorize?${params.toString()}`;
  },

  async handleOAuthCallback(schoolId, code, redirectUri) {
    // In production, exchange code for tokens
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      credentials: {
        access_token: `mock_access_token_${Date.now()}`,
        refresh_token: `mock_refresh_token_${Date.now()}`,
        district_id: 'demo_district',
      },
    };
  },
});

// Register the adapter
DataSourceRegistry.register(cleverAdapter);
