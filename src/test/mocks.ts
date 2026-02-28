import { vi } from 'vitest';
import type { School, Student, Intervention } from '@/lib/database.types';

// Mock School factory
export function createMockSchool(overrides: Partial<School> = {}): School {
  return {
    id: 'school-1',
    slug: 'test-school',
    name: 'Test School',
    legal_name: 'Test School Inc.',
    domain: 'test.edu',
    logo_url: null,
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    accent_color: '#ec4899',
    subscription_tier: 'pro',
    subscription_status: 'active',
    trial_ends_at: null,
    bigquery_dataset_id: null,
    clever_district_id: null,
    classlink_tenant_id: null,
    timezone: 'America/New_York',
    academic_year_start_month: 8,
    contact_email: 'contact@test.edu',
    contact_phone: '555-123-4567',
    address: null,
    authorizer_id: null,
    is_active: true,
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Mock Student factory
export function createMockStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 'student-1',
    school_id: 'school-1',
    sis_student_id: 'SIS001',
    first_name: 'John',
    last_name: 'Doe',
    display_name: 'John Doe',
    grade_level: 8,
    date_of_birth: '2010-01-01',
    gender: 'Male',
    ethnicity: 'Two or More Races',
    has_iep: false,
    has_504_plan: false,
    is_english_learner: false,
    is_gifted: false,
    is_free_reduced_lunch: false,
    homeroom_teacher: 'Ms. Smith',
    counselor: null,
    attendance_rate: 0.95,
    days_present: 85,
    days_absent: 5,
    is_chronically_absent: false,
    proficiency_level: 3,
    growth_percentile: 73,
    risk_level: 'on_track',
    risk_score: 15,
    risk_factors: [],
    reading_scores: null,
    math_scores: null,
    purpose_driven_metrics: null,
    is_active: true,
    enrolled_at: '2023-08-15',
    withdrawn_at: null,
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Mock Intervention factory
export function createMockIntervention(overrides: Partial<Intervention> = {}): Intervention {
  return {
    id: 'intervention-1',
    school_id: 'school-1',
    student_id: 'student-1',
    created_by_user_id: null,
    assigned_to_user_id: 'teacher-1',
    type: 'academic',
    title: 'Math Tutoring',
    description: 'One-on-one math tutoring sessions',
    status: 'in_progress',
    priority: 'high',
    start_date: '2024-01-15',
    target_end_date: '2024-03-15',
    actual_end_date: null,
    goal: 'Improve math grades by one letter grade',
    success_criteria: 'Achieve B or higher on next assessment',
    baseline_value: 2.0,
    target_value: 3.0,
    current_value: 2.5,
    progress_notes: [],
    outcome_summary: null,
    was_successful: null,
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Mock API response helper
export function mockApiResponse<T>(data: T, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  };
}

// Mock SWR response helper
export function mockSWRResponse<T>(data: T | undefined, options: {
  isLoading?: boolean;
  isValidating?: boolean;
  error?: Error;
} = {}) {
  return {
    data,
    error: options.error,
    isLoading: options.isLoading ?? false,
    isValidating: options.isValidating ?? false,
    mutate: vi.fn(),
  };
}
