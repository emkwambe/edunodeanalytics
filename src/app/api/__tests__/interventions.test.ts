/**
 * Interventions API Tests
 * =======================
 *
 * Tests for the /api/schools/[schoolId]/interventions endpoints.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../schools/[schoolId]/interventions/route';
import {
  createMockRequest,
  createMockParams,
  parseResponse,
} from '@/test/utils';
import { createMockIntervention } from '@/test/factories';

// Mock the database queries module
vi.mock('@/lib/db/queries/interventions', () => ({
  getInterventionsBySchool: vi.fn(),
  createIntervention: vi.fn(),
}));

// Import after mocking
import {
  getInterventionsBySchool,
  createIntervention,
} from '@/lib/db/queries/interventions';

const mockGetInterventionsBySchool = vi.mocked(getInterventionsBySchool);
const mockCreateIntervention = vi.mocked(createIntervention);

describe('GET /api/schools/[schoolId]/interventions', () => {
  const schoolId = 'test-school-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns interventions list with pagination', async () => {
    const mockInterventions = [
      createMockIntervention({ school_id: schoolId }),
      createMockIntervention({ school_id: schoolId }),
    ];

    mockGetInterventionsBySchool.mockResolvedValue({
      data: mockInterventions,
      count: 2,
    });

    const request = createMockRequest('/api/schools/test-school-123/interventions');
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<{
      data: unknown[];
      pagination: { total: number };
    }>(response);

    expect(status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
  });

  it('handles pagination parameters', async () => {
    mockGetInterventionsBySchool.mockResolvedValue({
      data: [],
      count: 50,
    });

    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      searchParams: { limit: '10', offset: '20' },
    });
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<{
      pagination: { limit: number; offset: number; hasMore: boolean };
    }>(response);

    expect(status).toBe(200);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.offset).toBe(20);
    expect(data.pagination.hasMore).toBe(true);
  });

  it('filters by status', async () => {
    mockGetInterventionsBySchool.mockResolvedValue({
      data: [],
      count: 0,
    });

    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      searchParams: { status: 'in_progress' },
    });
    const params = createMockParams({ schoolId });

    await GET(request, params);

    expect(mockGetInterventionsBySchool).toHaveBeenCalledWith(
      schoolId,
      expect.objectContaining({ status: 'in_progress' })
    );
  });

  it('filters by type', async () => {
    mockGetInterventionsBySchool.mockResolvedValue({
      data: [],
      count: 0,
    });

    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      searchParams: { type: 'academic' },
    });
    const params = createMockParams({ schoolId });

    await GET(request, params);

    expect(mockGetInterventionsBySchool).toHaveBeenCalledWith(
      schoolId,
      expect.objectContaining({ type: 'academic' })
    );
  });

  it('filters by urgency/priority', async () => {
    const highPriorityIntervention = createMockIntervention({
      school_id: schoolId,
      priority: 'high',
    });
    const lowPriorityIntervention = createMockIntervention({
      school_id: schoolId,
      priority: 'low',
    });

    mockGetInterventionsBySchool.mockResolvedValue({
      data: [highPriorityIntervention, lowPriorityIntervention],
      count: 2,
    });

    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      searchParams: { urgency: 'high' },
    });
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data } = await parseResponse<{ data: Array<{ priority: string }> }>(response);

    // Should filter to only high priority
    expect(data.data.every((i) => i.priority === 'high')).toBe(true);
  });

  it('sorts interventions', async () => {
    const older = createMockIntervention({
      school_id: schoolId,
      title: 'A - First',
      created_at: '2024-01-01T00:00:00Z',
    });
    const newer = createMockIntervention({
      school_id: schoolId,
      title: 'B - Second',
      created_at: '2024-02-01T00:00:00Z',
    });

    mockGetInterventionsBySchool.mockResolvedValue({
      data: [older, newer],
      count: 2,
    });

    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      searchParams: { sortBy: 'title', sortOrder: 'asc' },
    });
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data } = await parseResponse<{ data: Array<{ title: string }> }>(response);

    expect(data.data[0].title).toBe('A - First');
    expect(data.data[1].title).toBe('B - Second');
  });

  it('returns 500 on database error', async () => {
    mockGetInterventionsBySchool.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('/api/schools/test-school-123/interventions');
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(500);
    expect(data.error).toBe('Failed to fetch interventions');
  });
});

describe('POST /api/schools/[schoolId]/interventions', () => {
  const schoolId = 'test-school-123';
  const studentId = 'student-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an intervention successfully', async () => {
    const interventionData = {
      student_id: studentId,
      type: 'academic',
      title: 'Reading Intervention',
      description: 'Help with reading comprehension',
    };

    const createdIntervention = createMockIntervention({
      ...interventionData,
      school_id: schoolId,
    });

    mockCreateIntervention.mockResolvedValue(createdIntervention);

    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      method: 'POST',
      body: interventionData,
    });
    const params = createMockParams({ schoolId });

    const response = await POST(request, params);
    const { data, status } = await parseResponse<{ id: string; title: string }>(response);

    expect(status).toBe(201);
    expect(data.id).toBeDefined();
    expect(data.title).toBe('Reading Intervention');
  });

  it('sets school_id from route params', async () => {
    const interventionData = {
      student_id: studentId,
      type: 'academic',
      title: 'Test Intervention',
    };

    mockCreateIntervention.mockResolvedValue(
      createMockIntervention({ school_id: schoolId })
    );

    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      method: 'POST',
      body: interventionData,
    });
    const params = createMockParams({ schoolId });

    await POST(request, params);

    expect(mockCreateIntervention).toHaveBeenCalledWith(
      expect.objectContaining({ school_id: schoolId })
    );
  });

  it('validates required field: student_id', async () => {
    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      method: 'POST',
      body: { type: 'academic', title: 'Test' },
    });
    const params = createMockParams({ schoolId });

    const response = await POST(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(400);
    expect(data.error).toBe('Missing required field: student_id');
    expect(mockCreateIntervention).not.toHaveBeenCalled();
  });

  it('validates required field: type', async () => {
    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      method: 'POST',
      body: { student_id: studentId, title: 'Test' },
    });
    const params = createMockParams({ schoolId });

    const response = await POST(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(400);
    expect(data.error).toBe('Missing required field: type');
  });

  it('validates required field: title', async () => {
    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      method: 'POST',
      body: { student_id: studentId, type: 'academic' },
    });
    const params = createMockParams({ schoolId });

    const response = await POST(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(400);
    expect(data.error).toBe('Missing required field: title');
  });

  it('sets default values for optional fields', async () => {
    const minimalData = {
      student_id: studentId,
      type: 'academic',
      title: 'Minimal Intervention',
    };

    mockCreateIntervention.mockResolvedValue(
      createMockIntervention({ school_id: schoolId, ...minimalData })
    );

    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      method: 'POST',
      body: minimalData,
    });
    const params = createMockParams({ schoolId });

    await POST(request, params);

    expect(mockCreateIntervention).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'planned',
        priority: 'medium',
        description: null,
        goal: null,
      })
    );
  });

  it('returns 500 when creation fails', async () => {
    mockCreateIntervention.mockResolvedValue(null);

    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      method: 'POST',
      body: {
        student_id: studentId,
        type: 'academic',
        title: 'Test',
      },
    });
    const params = createMockParams({ schoolId });

    const response = await POST(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(500);
    expect(data.error).toBe('Failed to create intervention');
  });

  it('returns 500 on database error', async () => {
    mockCreateIntervention.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('/api/schools/test-school-123/interventions', {
      method: 'POST',
      body: {
        student_id: studentId,
        type: 'academic',
        title: 'Test',
      },
    });
    const params = createMockParams({ schoolId });

    const response = await POST(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(500);
    expect(data.error).toBe('Failed to create intervention');
  });
});
