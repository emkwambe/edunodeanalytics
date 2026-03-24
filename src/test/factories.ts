/**
 * Test Data Factories
 * ===================
 *
 * Factory functions for generating test data that matches EduNode domain models.
 */

/**
 * Generate a random UUID using the native crypto API
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a random date within a range
 */
function _randomDate(start: Date, end: Date): string {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  ).toISOString();
}

// =============================================================================
// SCHOOL FACTORY
// =============================================================================

export interface MockSchool {
  id: string;
  name: string;
  slug: string;
  subscription_tier: 'starter' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
  settings: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
  };
}

let schoolCounter = 0;

export function createMockSchool(overrides: Partial<MockSchool> = {}): MockSchool {
  schoolCounter++;
  const id = generateId();
  const name = overrides.name || `Test School ${schoolCounter}`;
  const slug = overrides.slug || name.toLowerCase().replace(/\s+/g, '-');

  return {
    id,
    name,
    slug,
    subscription_tier: 'pro',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    settings: {},
    ...overrides,
  };
}

// =============================================================================
// STUDENT FACTORY
// =============================================================================

export interface MockStudent {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  grade_level: number;
  risk_level: 'on_track' | 'at_risk' | 'critical';
  attendance_rate: number;
  growth_percentile: number | null;
  teacher_name: string | null;
  created_at: string;
  updated_at: string;
}

let studentCounter = 0;

export function createMockStudent(overrides: Partial<MockStudent> = {}): MockStudent {
  studentCounter++;
  const id = generateId();
  const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'James', 'Sophia', 'Oliver'];
  const lastNames = ['Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];

  return {
    id,
    school_id: overrides.school_id || generateId(),
    first_name: firstNames[studentCounter % firstNames.length],
    last_name: lastNames[studentCounter % lastNames.length],
    student_id: `STU${String(studentCounter).padStart(5, '0')}`,
    grade_level: Math.floor(Math.random() * 8) + 5, // 5-12
    risk_level: 'on_track',
    attendance_rate: 85 + Math.random() * 15, // 85-100%
    growth_percentile: Math.floor(Math.random() * 100),
    teacher_name: 'Mrs. Williams',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create multiple mock students
 */
export function createMockStudents(count: number, schoolId: string): MockStudent[] {
  return Array.from({ length: count }, () =>
    createMockStudent({ school_id: schoolId })
  );
}

// =============================================================================
// INTERVENTION FACTORY
// =============================================================================

export interface MockIntervention {
  id: string;
  school_id: string;
  student_id: string;
  created_by_user_id: string | null;
  assigned_to_user_id: string | null;
  type: 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement';
  title: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string | null;
  target_end_date: string | null;
  actual_end_date: string | null;
  goal: string | null;
  success_criteria: string | null;
  baseline_value: number | null;
  target_value: number | null;
  current_value: number | null;
  progress_notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

let interventionCounter = 0;

export function createMockIntervention(overrides: Partial<MockIntervention> = {}): MockIntervention {
  interventionCounter++;
  const id = generateId();
  const types: MockIntervention['type'][] = ['academic', 'attendance', 'behavior', 'sel', 'family_engagement'];
  const statuses: MockIntervention['status'][] = ['planned', 'in_progress', 'completed'];
  const priorities: MockIntervention['priority'][] = ['low', 'medium', 'high'];

  return {
    id,
    school_id: overrides.school_id || generateId(),
    student_id: overrides.student_id || generateId(),
    created_by_user_id: null,
    assigned_to_user_id: null,
    type: types[interventionCounter % types.length],
    title: `Intervention ${interventionCounter}`,
    description: 'Test intervention for student support',
    status: statuses[interventionCounter % statuses.length],
    priority: priorities[interventionCounter % priorities.length],
    start_date: new Date().toISOString(),
    target_end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days
    actual_end_date: null,
    goal: 'Improve student outcomes',
    success_criteria: 'Student shows measurable improvement',
    baseline_value: 50,
    target_value: 75,
    current_value: 55,
    progress_notes: null,
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create multiple mock interventions
 */
export function createMockInterventions(
  count: number,
  schoolId: string,
  studentId?: string
): MockIntervention[] {
  return Array.from({ length: count }, () =>
    createMockIntervention({
      school_id: schoolId,
      student_id: studentId || generateId(),
    })
  );
}

// =============================================================================
// USER / AUTH FACTORY
// =============================================================================

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'school_admin' | 'principal' | 'teacher' | 'counselor' | 'data_manager' | 'viewer' | 'platform_admin';
  schools: string[];
  primarySchool: string;
}

let userCounter = 0;

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  userCounter++;
  const id = `user_${generateId().slice(0, 8)}`;

  return {
    id,
    email: `user${userCounter}@school.edu`,
    firstName: 'Test',
    lastName: `User ${userCounter}`,
    role: 'school_admin',
    schools: ['independent-excellence'],
    primarySchool: 'independent-excellence',
    ...overrides,
  };
}

// =============================================================================
// DATA SOURCE FACTORY
// =============================================================================

export interface MockDataSource {
  id: string;
  school_id: string;
  name: string;
  type: 'clever' | 'classlink' | 'bigquery' | 'custom';
  status: 'connected' | 'disconnected' | 'error';
  last_sync_at: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function createMockDataSource(overrides: Partial<MockDataSource> = {}): MockDataSource {
  const id = generateId();

  return {
    id,
    school_id: overrides.school_id || generateId(),
    name: 'Test SIS Connection',
    type: 'clever',
    status: 'connected',
    last_sync_at: new Date().toISOString(),
    config: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// =============================================================================
// NOTIFICATION FACTORY
// =============================================================================

export interface MockNotification {
  id: string;
  user_id: string;
  school_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export function createMockNotification(overrides: Partial<MockNotification> = {}): MockNotification {
  const id = generateId();

  return {
    id,
    user_id: overrides.user_id || generateId(),
    school_id: overrides.school_id || generateId(),
    type: 'info',
    title: 'Test Notification',
    message: 'This is a test notification message.',
    read: false,
    action_url: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// =============================================================================
// RESET COUNTERS
// =============================================================================

/**
 * Reset all factory counters (useful between test suites)
 */
export function resetFactories(): void {
  schoolCounter = 0;
  studentCounter = 0;
  interventionCounter = 0;
  userCounter = 0;
}
