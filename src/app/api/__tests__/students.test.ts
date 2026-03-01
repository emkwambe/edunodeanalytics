/**
 * Students API Tests
 * ==================
 *
 * Tests for the /api/schools/[schoolId]/students endpoints.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../schools/[schoolId]/students/route';
import {
  createMockRequest,
  createMockParams,
  parseResponse,
} from '@/test/utils';
import { createMockStudent } from '@/test/factories';

// Mock the database queries module
vi.mock('@/lib/db/queries/students', () => ({
  getStudentsBySchool: vi.fn(),
  searchStudents: vi.fn(),
  createStudent: vi.fn(),
}));

// Import after mocking
import {
  getStudentsBySchool,
  searchStudents,
  createStudent,
} from '@/lib/db/queries/students';

const mockGetStudentsBySchool = vi.mocked(getStudentsBySchool);
const mockSearchStudents = vi.mocked(searchStudents);
const mockCreateStudent = vi.mocked(createStudent);

describe('GET /api/schools/[schoolId]/students', () => {
  const schoolId = 'test-school-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns students list with pagination info', async () => {
    const mockStudents = [
      createMockStudent({ school_id: schoolId }),
      createMockStudent({ school_id: schoolId }),
    ];

    // Use type assertion for mock data (simplified mock vs full DB type)
    mockGetStudentsBySchool.mockResolvedValue({
      data: mockStudents as any,
      total: 2,
      limit: 50,
      offset: 0,
      hasMore: false,
    });

    const request = createMockRequest('/api/schools/test-school-123/students');
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<{
      data: unknown[];
      total: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(mockGetStudentsBySchool).toHaveBeenCalledWith(schoolId, expect.any(Object));
  });

  it('handles pagination parameters', async () => {
    mockGetStudentsBySchool.mockResolvedValue({
      data: [],
      total: 100,
      limit: 10,
      offset: 20,
      hasMore: true,
    });

    const request = createMockRequest('/api/schools/test-school-123/students', {
      searchParams: { limit: '10', offset: '20' },
    });
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<{
      data: unknown[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }>(response);

    expect(status).toBe(200);
    expect(mockGetStudentsBySchool).toHaveBeenCalledWith(schoolId, {
      limit: 10,
      offset: 20,
    });
  });

  it('handles sorting parameters', async () => {
    mockGetStudentsBySchool.mockResolvedValue({
      data: [],
      total: 0,
      limit: 50,
      offset: 0,
      hasMore: false,
    });

    const request = createMockRequest('/api/schools/test-school-123/students', {
      searchParams: { sortBy: 'last_name', sortOrder: 'desc' },
    });
    const params = createMockParams({ schoolId });

    await GET(request, params);

    expect(mockGetStudentsBySchool).toHaveBeenCalledWith(schoolId, {
      sortBy: 'last_name',
      sortOrder: 'desc',
    });
  });

  it('handles filter parameters', async () => {
    mockGetStudentsBySchool.mockResolvedValue({
      data: [],
      total: 0,
      limit: 50,
      offset: 0,
      hasMore: false,
    });

    const request = createMockRequest('/api/schools/test-school-123/students', {
      searchParams: {
        gradeLevel: '9',
        riskLevel: 'at_risk',
        teacherName: 'Mrs. Smith',
      },
    });
    const params = createMockParams({ schoolId });

    await GET(request, params);

    expect(mockGetStudentsBySchool).toHaveBeenCalledWith(schoolId, {
      gradeLevel: 9,
      riskLevel: 'at_risk',
      teacherName: 'Mrs. Smith',
    });
  });

  it('uses searchStudents when search query is provided', async () => {
    const mockStudents = [createMockStudent({ school_id: schoolId })];
    mockSearchStudents.mockResolvedValue(mockStudents);

    const request = createMockRequest('/api/schools/test-school-123/students', {
      searchParams: { search: 'john' },
    });
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<{
      data: unknown[];
      total: number;
    }>(response);

    expect(status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(mockSearchStudents).toHaveBeenCalledWith(schoolId, 'john', 20);
    expect(mockGetStudentsBySchool).not.toHaveBeenCalled();
  });

  it('respects limit in search query', async () => {
    mockSearchStudents.mockResolvedValue([]);

    const request = createMockRequest('/api/schools/test-school-123/students', {
      searchParams: { search: 'john', limit: '5' },
    });
    const params = createMockParams({ schoolId });

    await GET(request, params);

    expect(mockSearchStudents).toHaveBeenCalledWith(schoolId, 'john', 5);
  });

  it('returns 500 on database error', async () => {
    mockGetStudentsBySchool.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('/api/schools/test-school-123/students');
    const params = createMockParams({ schoolId });

    const response = await GET(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(500);
    expect(data.error).toBe('Failed to fetch students');
  });
});

describe('POST /api/schools/[schoolId]/students', () => {
  const schoolId = 'test-school-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a student successfully', async () => {
    const studentData = {
      first_name: 'John',
      last_name: 'Doe',
      grade_level: 9,
    };

    const createdStudent = createMockStudent({
      ...studentData,
      school_id: schoolId,
    });

    mockCreateStudent.mockResolvedValue(createdStudent);

    const request = createMockRequest('/api/schools/test-school-123/students', {
      method: 'POST',
      body: studentData,
    });
    const params = createMockParams({ schoolId });

    const response = await POST(request, params);
    const { data, status } = await parseResponse<{ id: string }>(response);

    expect(status).toBe(201);
    expect(data.id).toBeDefined();
    expect(mockCreateStudent).toHaveBeenCalledWith({
      ...studentData,
      school_id: schoolId,
    });
  });

  it('sets school_id from route params', async () => {
    const studentData = {
      first_name: 'Jane',
      last_name: 'Smith',
      grade_level: 10,
    };

    mockCreateStudent.mockResolvedValue(createMockStudent({ school_id: schoolId }));

    const request = createMockRequest('/api/schools/test-school-123/students', {
      method: 'POST',
      body: studentData,
    });
    const params = createMockParams({ schoolId });

    await POST(request, params);

    expect(mockCreateStudent).toHaveBeenCalledWith(
      expect.objectContaining({ school_id: schoolId })
    );
  });

  it('returns 500 when creation fails', async () => {
    mockCreateStudent.mockResolvedValue(null);

    const request = createMockRequest('/api/schools/test-school-123/students', {
      method: 'POST',
      body: { first_name: 'Test', last_name: 'User' },
    });
    const params = createMockParams({ schoolId });

    const response = await POST(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(500);
    expect(data.error).toBe('Failed to create student');
  });

  it('returns 500 on database error', async () => {
    mockCreateStudent.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest('/api/schools/test-school-123/students', {
      method: 'POST',
      body: { first_name: 'Test', last_name: 'User' },
    });
    const params = createMockParams({ schoolId });

    const response = await POST(request, params);
    const { data, status } = await parseResponse<{ error: string }>(response);

    expect(status).toBe(500);
    expect(data.error).toBe('Failed to create student');
  });
});
