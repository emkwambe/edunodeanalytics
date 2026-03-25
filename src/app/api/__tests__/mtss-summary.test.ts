/**
 * MTSS Summary API Tests
 * ======================
 *
 * Tests for the /api/schools/[schoolId]/mtss-summary endpoint.
 * Sprint 5A - MTSS Evidence Metrics API tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../schools/[schoolId]/mtss-summary/route';
import {
  createMockRequest,
  createMockParams,
  parseResponse,
} from '@/test/utils';
import type { MtssSummaryResponse } from '../schools/[schoolId]/mtss-summary/route';

// Mock the auth module
vi.mock('../schools/[schoolId]/risk/_shared/auth', () => ({
  authenticateSchoolRequest: vi.fn(),
}));

// Mock the FERPA audit module
vi.mock('@/lib/compliance/ferpa-audit', () => ({
  logMetricsAccess: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocking
import { authenticateSchoolRequest } from '../schools/[schoolId]/risk/_shared/auth';
import { logMetricsAccess } from '@/lib/compliance/ferpa-audit';

const mockAuthenticateSchoolRequest = vi.mocked(authenticateSchoolRequest);
const mockLogMetricsAccess = vi.mocked(logMetricsAccess);

// Mock Supabase admin client
function createMockAdminSupabase(overrides: {
  flaggedStudents?: Array<{ student_id: string; risk_level: string; computed_at: string }>;
  interventions?: Array<{ id: string; student_id: string; created_at: string; status: string }>;
  riskEvaluations?: Array<{ student_id: string; risk_level: string; computed_at: string }>;
  dosageMetrics?: Array<{ dosage_compliance_rate: number | null }>;
} = {}) {
  const {
    flaggedStudents = [],
    interventions = [],
    riskEvaluations = [],
    dosageMetrics = [],
  } = overrides;

  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  };

  // Create a from function that returns different data based on table
  const fromFn = vi.fn((table: string) => {
    const query = { ...mockQuery };

    // Override then to return appropriate data
    if (table === 'current_risk_scores') {
      Object.assign(query, {
        then: vi.fn((resolve) => resolve({ data: flaggedStudents, error: null })),
      });
    } else if (table === 'interventions') {
      Object.assign(query, {
        then: vi.fn((resolve) => resolve({ data: interventions, error: null })),
      });
    } else if (table === 'risk_evaluations') {
      Object.assign(query, {
        then: vi.fn((resolve) => resolve({ data: riskEvaluations, error: null })),
      });
    } else if (table === 'intervention_dosage_metrics') {
      Object.assign(query, {
        then: vi.fn((resolve) => resolve({ data: dosageMetrics, error: null })),
      });
    } else {
      Object.assign(query, {
        then: vi.fn((resolve) => resolve({ data: [], error: null })),
      });
    }

    return query;
  });

  return { from: fromFn };
}

describe('GET /api/schools/[schoolId]/mtss-summary', () => {
  const schoolId = '12345678-1234-1234-1234-123456789012';
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct response shape with all required fields', async () => {
    const mockSupabase = createMockAdminSupabase({
      flaggedStudents: [
        { student_id: 'student-1', risk_level: 'at_risk', computed_at: '2025-09-01T00:00:00Z' },
      ],
      interventions: [
        { id: 'int-1', student_id: 'student-1', created_at: '2025-09-05T00:00:00Z', status: 'in_progress' },
      ],
      riskEvaluations: [
        { student_id: 'student-1', risk_level: 'at_risk', computed_at: '2025-09-01T00:00:00Z' },
        { student_id: 'student-1', risk_level: 'watch', computed_at: '2025-10-01T00:00:00Z' },
      ],
      dosageMetrics: [{ dosage_compliance_rate: 0.85 }],
    });

    mockAuthenticateSchoolRequest.mockResolvedValue({
      userId,
      clerkUserId: 'clerk_123',
      schoolId,
      role: 'admin',
      supabase: {} as ReturnType<typeof createMockAdminSupabase>,
      adminSupabase: mockSupabase as ReturnType<typeof createMockAdminSupabase>,
    } as never);

    const request = createMockRequest(`/api/schools/${schoolId}/mtss-summary`);
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<MtssSummaryResponse>(response);

    expect(status).toBe(200);

    // Verify all required fields are present
    expect(data).toHaveProperty('students_identified');
    expect(data).toHaveProperty('students_flagged_no_intervention');
    expect(data).toHaveProperty('response_rate');
    expect(data).toHaveProperty('avg_time_to_action_days');
    expect(data).toHaveProperty('avg_dosage_compliance');
    expect(data).toHaveProperty('improvement_rate');
    expect(data).toHaveProperty('students_improved');
    expect(data).toHaveProperty('students_maintained');
    expect(data).toHaveProperty('students_worsened');
    expect(data).toHaveProperty('total_active_interventions');
    expect(data).toHaveProperty('period');
    expect(data).toHaveProperty('last_updated');

    // Verify types
    expect(typeof data.students_identified).toBe('number');
    expect(typeof data.response_rate).toBe('number');
    expect(typeof data.period).toBe('string');
    expect(typeof data.last_updated).toBe('string');
  });

  it('returns all zeros for empty school with no data', async () => {
    const mockSupabase = createMockAdminSupabase({
      flaggedStudents: [],
    });

    mockAuthenticateSchoolRequest.mockResolvedValue({
      userId,
      clerkUserId: 'clerk_123',
      schoolId,
      role: 'admin',
      supabase: {} as ReturnType<typeof createMockAdminSupabase>,
      adminSupabase: mockSupabase as ReturnType<typeof createMockAdminSupabase>,
    } as never);

    const request = createMockRequest(`/api/schools/${schoolId}/mtss-summary`);
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<MtssSummaryResponse>(response);

    expect(status).toBe(200);
    expect(data.students_identified).toBe(0);
    expect(data.students_flagged_no_intervention).toBe(0);
    expect(data.response_rate).toBe(0);
    expect(data.avg_time_to_action_days).toBe(0);
    expect(data.avg_dosage_compliance).toBe(0);
    expect(data.improvement_rate).toBe(0);
    expect(data.students_improved).toBe(0);
    expect(data.students_maintained).toBe(0);
    expect(data.students_worsened).toBe(0);
    expect(data.total_active_interventions).toBe(0);
  });

  it('validates schoolId format', async () => {
    const { NextResponse } = await import('next/server');
    mockAuthenticateSchoolRequest.mockResolvedValue(
      NextResponse.json({ error: 'Invalid school ID format' }, { status: 400 })
    );

    const request = createMockRequest('/api/schools/invalid-id/mtss-summary');
    const params = createMockParams({ schoolId: 'invalid-id' });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(400);
    expect(data.error).toBe('Invalid school ID format');
  });

  it('returns 401 for unauthenticated requests', async () => {
    const { NextResponse } = await import('next/server');
    mockAuthenticateSchoolRequest.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const request = createMockRequest(`/api/schools/${schoolId}/mtss-summary`);
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 for non-members', async () => {
    const { NextResponse } = await import('next/server');
    mockAuthenticateSchoolRequest.mockResolvedValue(
      NextResponse.json({ error: 'Not a member of this school' }, { status: 403 })
    );

    const request = createMockRequest(`/api/schools/${schoolId}/mtss-summary`);
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(403);
    expect(data.error).toBe('Not a member of this school');
  });

  it('logs FERPA access for metrics', async () => {
    const mockSupabase = createMockAdminSupabase({ flaggedStudents: [] });

    mockAuthenticateSchoolRequest.mockResolvedValue({
      userId,
      clerkUserId: 'clerk_123',
      schoolId,
      role: 'admin',
      supabase: {} as ReturnType<typeof createMockAdminSupabase>,
      adminSupabase: mockSupabase as ReturnType<typeof createMockAdminSupabase>,
    } as never);

    const request = createMockRequest(`/api/schools/${schoolId}/mtss-summary`);
    const params = createMockParams({ schoolId });

    await GET(request, params);

    expect(mockLogMetricsAccess).toHaveBeenCalledWith(schoolId, userId);
  });

  it('calculates response rate correctly', async () => {
    // 4 flagged students, 2 with interventions = 50% response rate
    const mockSupabase = createMockAdminSupabase({
      flaggedStudents: [
        { student_id: 'student-1', risk_level: 'at_risk', computed_at: '2025-09-01T00:00:00Z' },
        { student_id: 'student-2', risk_level: 'watch', computed_at: '2025-09-01T00:00:00Z' },
        { student_id: 'student-3', risk_level: 'critical', computed_at: '2025-09-01T00:00:00Z' },
        { student_id: 'student-4', risk_level: 'at_risk', computed_at: '2025-09-01T00:00:00Z' },
      ],
      interventions: [
        { id: 'int-1', student_id: 'student-1', created_at: '2025-09-05T00:00:00Z', status: 'in_progress' },
        { id: 'int-2', student_id: 'student-2', created_at: '2025-09-06T00:00:00Z', status: 'planned' },
      ],
      riskEvaluations: [],
      dosageMetrics: [],
    });

    mockAuthenticateSchoolRequest.mockResolvedValue({
      userId,
      clerkUserId: 'clerk_123',
      schoolId,
      role: 'admin',
      supabase: {} as ReturnType<typeof createMockAdminSupabase>,
      adminSupabase: mockSupabase as ReturnType<typeof createMockAdminSupabase>,
    } as never);

    const request = createMockRequest(`/api/schools/${schoolId}/mtss-summary`);
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data } = await parseResponse<MtssSummaryResponse>(response);

    expect(data.students_identified).toBe(4);
    expect(data.students_flagged_no_intervention).toBe(2);
    expect(data.response_rate).toBe(0.5); // 2/4 = 0.5
    expect(data.total_active_interventions).toBe(2);
  });

  it('includes period in academic year format', async () => {
    const mockSupabase = createMockAdminSupabase({ flaggedStudents: [] });

    mockAuthenticateSchoolRequest.mockResolvedValue({
      userId,
      clerkUserId: 'clerk_123',
      schoolId,
      role: 'admin',
      supabase: {} as ReturnType<typeof createMockAdminSupabase>,
      adminSupabase: mockSupabase as ReturnType<typeof createMockAdminSupabase>,
    } as never);

    const request = createMockRequest(`/api/schools/${schoolId}/mtss-summary`);
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data } = await parseResponse<MtssSummaryResponse>(response);

    // Period should be in format "YYYY-YYYY"
    expect(data.period).toMatch(/^\d{4}-\d{4}$/);
  });

  it('includes ISO timestamp in last_updated', async () => {
    const mockSupabase = createMockAdminSupabase({ flaggedStudents: [] });

    mockAuthenticateSchoolRequest.mockResolvedValue({
      userId,
      clerkUserId: 'clerk_123',
      schoolId,
      role: 'admin',
      supabase: {} as ReturnType<typeof createMockAdminSupabase>,
      adminSupabase: mockSupabase as ReturnType<typeof createMockAdminSupabase>,
    } as never);

    const request = createMockRequest(`/api/schools/${schoolId}/mtss-summary`);
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data } = await parseResponse<MtssSummaryResponse>(response);

    // last_updated should be a valid ISO date string
    expect(() => new Date(data.last_updated)).not.toThrow();
    expect(new Date(data.last_updated).toISOString()).toBe(data.last_updated);
  });
});
