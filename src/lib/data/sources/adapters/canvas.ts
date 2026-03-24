/**
 * Canvas LMS Adapter
 * ==================
 *
 * Integration with Instructure Canvas Learning Management System.
 * Pulls course data, assignments, grades, and submission tracking.
 *
 * Data provided:
 * - Courses and sections
 * - Assignments and due dates
 * - Grades and submission status
 * - Student activity metrics
 *
 * API Docs: https://canvas.instructure.com/doc/api/
 */

import {
  createAdapter,
  DataSourceRegistry,
  type DataSourceAdapter,
  type SyncError,
} from '../registry';

const MOCK_SYNC_DELAY = 2800;

/**
 * Generate mock Canvas course/grade data
 */
function generateMockCourseData(studentCount: number, schoolId: string) {
  const courses = [
    { id: 'math_7', name: 'Math 7', code: 'MATH7' },
    { id: 'ela_7', name: 'ELA 7', code: 'ELA7' },
    { id: 'science_7', name: 'Science 7', code: 'SCI7' },
    { id: 'history_7', name: 'US History', code: 'HIST7' },
  ];

  return Array.from({ length: studentCount }, (_, i) => ({
    studentId: `stu_${schoolId}_${i.toString().padStart(4, '0')}`,
    enrollments: courses.map((course) => ({
      courseId: course.id,
      courseName: course.name,
      currentGrade: 60 + Math.floor(Math.random() * 40),
      letterGrade: ['A', 'B', 'C', 'D', 'F'][Math.floor(Math.random() * 5)],
      assignmentsCompleted: 15 + Math.floor(Math.random() * 10),
      assignmentsTotal: 25,
      missingAssignments: Math.floor(Math.random() * 5),
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
    })),
  }));
}

export const canvasAdapter: DataSourceAdapter = createAdapter({
  id: 'canvas',
  name: 'Canvas LMS',
  description: 'Import course grades, assignments, and student activity from Canvas',
  category: 'lms',
  icon: 'BookOpen',
  brandColor: '#E72429',
  logoUrl: '/integrations/canvas-logo.svg',

  tables: ['grades', 'sections', 'enrollments'],
  supportedFrequencies: ['hourly', 'daily', 'manual'],
  defaultFrequency: 'daily',
  requiredTier: 'pro',

  usesOAuth: true,
  oauthConfig: {
    authUrl: 'https://canvas.instructure.com/login/oauth2/auth',
    tokenUrl: 'https://canvas.instructure.com/login/oauth2/token',
    scopes: ['url:GET|/api/v1/courses', 'url:GET|/api/v1/users/:user_id/enrollments'],
  },

  credentialFields: [
    {
      key: 'canvas_url',
      label: 'Canvas URL',
      type: 'url',
      placeholder: 'https://yourschool.instructure.com',
      required: true,
      helpText: 'Your Canvas instance URL',
    },
    {
      key: 'access_token',
      label: 'Access Token',
      type: 'password',
      placeholder: 'Generated from Canvas Settings > Access Tokens',
      required: true,
      helpText: 'Generate in Canvas under Account > Settings > New Access Token',
    },
    {
      key: 'account_id',
      label: 'Account ID',
      type: 'text',
      placeholder: 'Root account or sub-account ID',
      required: false,
      helpText: 'Leave blank to use root account',
    },
  ],

  async testConnection(credentials) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!credentials.canvas_url || !credentials.access_token) {
      return {
        success: false,
        message: 'Missing Canvas URL or access token',
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Canvas',
      metadata: {
        instanceName: 'Demo School Canvas',
        activeCourses: 45,
        activeStudents: 487,
        currentTerm: 'Fall 2024',
      },
    };
  },

  async sync(schoolId, credentials, options = {}) {
    const startedAt = new Date();
    const errors: SyncError[] = [];

    await new Promise((resolve) => setTimeout(resolve, MOCK_SYNC_DELAY));

    const studentCount = 450 + Math.floor(Math.random() * 100);
    const courseData = generateMockCourseData(studentCount, schoolId);
    const totalRecords = courseData.reduce((sum, s) => sum + s.enrollments.length, 0);

    // Simulate occasional API rate limit warning
    if (Math.random() < 0.05) {
      errors.push({
        code: 'RATE_LIMIT_WARNING',
        message: 'API rate limit approaching, sync slowed',
      });
    }

    const completedAt = new Date();

    return {
      success: true,
      recordsProcessed: totalRecords,
      recordsCreated: options.fullSync ? totalRecords : Math.floor(totalRecords * 0.01),
      recordsUpdated: options.fullSync ? 0 : Math.floor(totalRecords * 0.15),
      recordsSkipped: 0,
      errors,
      startedAt,
      completedAt,
      nextSyncAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  },

  async getStatus(_schoolId) {
    return {
      status: 'connected',
      lastSyncAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      lastSyncResult: null,
      nextSyncAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
      recordCount: 1948,
    };
  },

  getOAuthUrl(schoolId, redirectUri) {
    const canvasUrl = process.env.CANVAS_URL || 'https://demo.instructure.com';
    const params = new URLSearchParams({
      client_id: process.env.CANVAS_CLIENT_ID || 'demo_client_id',
      response_type: 'code',
      redirect_uri: redirectUri,
      state: schoolId,
      scope: 'url:GET|/api/v1/courses url:GET|/api/v1/users/:user_id/enrollments',
    });
    return `${canvasUrl}/login/oauth2/auth?${params.toString()}`;
  },

  async handleOAuthCallback(_schoolId, _code, _redirectUri) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      credentials: {
        access_token: `canvas_token_${Date.now()}`,
        refresh_token: `canvas_refresh_${Date.now()}`,
        canvas_url: 'https://demo.instructure.com',
      },
    };
  },
});

DataSourceRegistry.register(canvasAdapter);
