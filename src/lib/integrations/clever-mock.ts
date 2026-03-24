/**
 * EduNode Integration Engine: Clever Mock Service
 * ================================================
 *
 * Simulates Clever API responses for Roster Sync.
 * In production, replace with actual Clever OAuth + API calls.
 *
 * Clever API Endpoints Simulated:
 * - GET /v3.0/sections
 * - GET /v3.0/students
 * - GET /v3.0/teachers
 * - GET /v3.0/schools
 */


// =============================================================================
// TYPES: Clever API Response Structures
// =============================================================================

export interface CleverSchool {
  id: string;
  name: string;
  sis_id: string;
  nces_id: string;
  state_id: string;
  district: string;
  low_grade: string;
  high_grade: string;
  principal: {
    name: string;
    email: string;
  };
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  created: string;
  last_modified: string;
}

export interface CleverSection {
  id: string;
  name: string;
  course_name: string;
  course_number: string;
  subject: 'math' | 'ela' | 'science' | 'social_studies' | 'other';
  grade: string;
  period: string;
  teacher: string;
  teacher_id: string;
  school: string;
  term: {
    name: string;
    start_date: string;
    end_date: string;
  };
  students: string[];
  created: string;
  last_modified: string;
}

export interface CleverStudent {
  id: string;
  sis_id: string;
  state_id: string;
  student_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  grade: string;
  gender: 'M' | 'F' | 'X';
  dob: string;
  race: string;
  hispanic_ethnicity: boolean;
  ell_status: boolean;
  frl_status: 'free' | 'reduced' | 'paid';
  iep_status: boolean;
  school: string;
  enrollments: string[];
  created: string;
  last_modified: string;
}

export interface CleverTeacher {
  id: string;
  sis_id: string;
  state_id: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
  school: string;
  sections: string[];
  created: string;
  last_modified: string;
}

export interface CleverSyncResult {
  school_id: string;
  synced_students: number;
  synced_sections: number;
  synced_teachers: number;
  new_students: number;
  updated_students: number;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  errors: string[];
  started_at: string;
  completed_at: string;
  duration_ms: number;
}

// =============================================================================
// NAME POOLS FOR REALISTIC DATA
// =============================================================================

const FIRST_NAMES_M = [
  'James', 'Michael', 'David', 'Carlos', 'Marcus', 'Anthony', 'Kevin', 'Brandon',
  'Joshua', 'Tyler', 'Jayden', 'Ethan', 'Noah', 'Mason', 'Liam', 'Aiden',
];

const FIRST_NAMES_F = [
  'Maria', 'Jennifer', 'Ashley', 'Michelle', 'Aaliyah', 'Destiny', 'Sophia', 'Emma',
  'Olivia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Luna',
];

const LAST_NAMES = [
  'Garcia', 'Rodriguez', 'Martinez', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis',
  'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker',
];

const TEACHER_FIRST_NAMES = [
  'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'Robert', 'Maria', 'James',
];

const TEACHER_LAST_NAMES = [
  'Johnson', 'Williams', 'Chen', 'Patel', 'Rodriguez', 'Thompson', 'Davis', 'Martinez',
];

// =============================================================================
// SEEDED RANDOM GENERATOR
// =============================================================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  pickMultiple<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => this.next() - 0.5);
    return shuffled.slice(0, count);
  }
}

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

function generateCleverStudentId(): string {
  return `clv_stu_${Math.random().toString(36).substring(2, 14)}`;
}

function generateCleverSectionId(): string {
  return `clv_sec_${Math.random().toString(36).substring(2, 10)}`;
}

function generateCleverTeacherId(): string {
  return `clv_tea_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Generate mock Clever sections for a school
 */
export function getMockCleverSections(
  schoolId: string,
  seed: number = 42
): CleverSection[] {
  const rng = new SeededRandom(seed);
  const sections: CleverSection[] = [];

  const subjects: Array<{ name: string; subject: CleverSection['subject']; grades: string[] }> = [
    { name: 'Mathematics', subject: 'math', grades: ['6', '7', '8'] },
    { name: 'English Language Arts', subject: 'ela', grades: ['6', '7', '8'] },
    { name: 'General Science', subject: 'science', grades: ['6', '7', '8'] },
    { name: 'Social Studies', subject: 'social_studies', grades: ['6', '7', '8'] },
  ];

  const periods = ['1', '2', '3', '4', '5', '6', '7'];

  // Generate 2-3 sections per subject per grade
  for (const subjectInfo of subjects) {
    for (const grade of subjectInfo.grades) {
      const sectionCount = rng.nextInt(2, 3);

      for (let s = 0; s < sectionCount; s++) {
        const periodLetter = String.fromCharCode(65 + s); // A, B, C
        const teacherFirst = rng.pick(TEACHER_FIRST_NAMES);
        const teacherLast = rng.pick(TEACHER_LAST_NAMES);

        sections.push({
          id: generateCleverSectionId(),
          name: `${subjectInfo.name} ${grade}${periodLetter}`,
          course_name: subjectInfo.name,
          course_number: `${subjectInfo.subject.toUpperCase()}${grade}0${s + 1}`,
          subject: subjectInfo.subject,
          grade,
          period: rng.pick(periods),
          teacher: `${teacherFirst} ${teacherLast}`,
          teacher_id: generateCleverTeacherId(),
          school: schoolId,
          term: {
            name: '2025-26 Full Year',
            start_date: '2025-08-15',
            end_date: '2026-06-10',
          },
          students: [], // Will be populated during sync
          created: '2025-08-01T00:00:00Z',
          last_modified: new Date().toISOString(),
        });
      }
    }
  }

  return sections;
}

/**
 * Generate mock Clever students for a school
 */
export function getMockCleverStudents(
  schoolId: string,
  count: number = 150,
  seed: number = 42
): CleverStudent[] {
  const rng = new SeededRandom(seed);
  const students: CleverStudent[] = [];

  const grades = ['6', '7', '8'];
  const races = ['White', 'Black', 'Hispanic', 'Asian', 'Two or More', 'Other'];

  for (let i = 0; i < count; i++) {
    const gender: 'M' | 'F' = rng.next() > 0.5 ? 'M' : 'F';
    const firstName = rng.pick(gender === 'M' ? FIRST_NAMES_M : FIRST_NAMES_F);
    const lastName = rng.pick(LAST_NAMES);
    const grade = rng.pick(grades);
    const studentNumber = (10000 + i).toString();

    // Demographic distribution typical of urban charter
    const isHispanic = rng.next() < 0.45;
    const race = isHispanic ? 'Hispanic' : rng.pick(races);
    const isEll = rng.next() < 0.18;
    const frlRoll = rng.next();
    const frlStatus: CleverStudent['frl_status'] =
      frlRoll < 0.55 ? 'free' : frlRoll < 0.72 ? 'reduced' : 'paid';
    const hasIep = rng.next() < 0.14;

    // Generate birthdate (age 11-14 for grades 6-8)
    const birthYear = 2025 - 11 - parseInt(grade);
    const birthMonth = rng.nextInt(1, 12);
    const birthDay = rng.nextInt(1, 28);

    students.push({
      id: generateCleverStudentId(),
      sis_id: `SIS${studentNumber}`,
      state_id: `ST${schoolId.slice(0, 4)}${studentNumber}`,
      student_number: studentNumber,
      first_name: firstName,
      middle_name: rng.next() > 0.7 ? rng.pick([...FIRST_NAMES_M, ...FIRST_NAMES_F]) : '',
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${studentNumber.slice(-2)}@student.edu`,
      grade,
      gender,
      dob: `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`,
      race,
      hispanic_ethnicity: isHispanic,
      ell_status: isEll,
      frl_status: frlStatus,
      iep_status: hasIep,
      school: schoolId,
      enrollments: [],
      created: '2025-08-01T00:00:00Z',
      last_modified: new Date().toISOString(),
    });
  }

  return students;
}

/**
 * Generate mock Clever teachers for a school
 */
export function getMockCleverTeachers(
  schoolId: string,
  count: number = 12,
  seed: number = 42
): CleverTeacher[] {
  const rng = new SeededRandom(seed);
  const teachers: CleverTeacher[] = [];

  const titles = ['Teacher', 'Lead Teacher', 'Department Head', 'Instructional Coach'];

  for (let i = 0; i < count; i++) {
    const firstName = rng.pick(TEACHER_FIRST_NAMES);
    const lastName = rng.pick(TEACHER_LAST_NAMES);

    teachers.push({
      id: generateCleverTeacherId(),
      sis_id: `TEACH${(1000 + i).toString()}`,
      state_id: `TCH${schoolId.slice(0, 4)}${i}`,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
      title: rng.pick(titles),
      school: schoolId,
      sections: [],
      created: '2025-08-01T00:00:00Z',
      last_modified: new Date().toISOString(),
    });
  }

  return teachers;
}

// =============================================================================
// SYNC OPERATIONS
// =============================================================================

/**
 * Simulate Clever roster sync to Supabase
 * In production, this would use actual Clever API + Supabase client
 */
export async function syncCleverRoster(
  schoolId: string,
  schoolSlug: string,
  options: {
    studentCount?: number;
    simulateLatency?: boolean;
  } = {}
): Promise<CleverSyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  const studentCount = options.studentCount || 150;
  const simulateLatency = options.simulateLatency ?? true;

  console.log(`[CleverSync] Starting sync for school: ${schoolSlug} (${schoolId})`);

  // Simulate network latency
  if (simulateLatency) {
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
  }

  // Generate mock data
  const students = getMockCleverStudents(schoolId, studentCount, Date.now());
  const sections = getMockCleverSections(schoolId, Date.now());
  const teachers = getMockCleverTeachers(schoolId, 12, Date.now());

  console.log(`[CleverSync] Generated ${students.length} students, ${sections.length} sections, ${teachers.length} teachers`);

  // In production, this would upsert to Supabase:
  // const supabase = createServerSupabaseClient();
  // await supabase.from('students').upsert(students.map(mapCleverToSupabase));

  // Simulate some processing time
  if (simulateLatency) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const endTime = Date.now();

  const result: CleverSyncResult = {
    school_id: schoolId,
    synced_students: students.length,
    synced_sections: sections.length,
    synced_teachers: teachers.length,
    new_students: Math.floor(students.length * 0.1), // 10% new
    updated_students: Math.floor(students.length * 0.9), // 90% updated
    status: errors.length > 0 ? 'PARTIAL' : 'COMPLETED',
    errors,
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date(endTime).toISOString(),
    duration_ms: endTime - startTime,
  };

  console.log(`[CleverSync] Completed in ${result.duration_ms}ms - Status: ${result.status}`);

  return result;
}

/**
 * Get sync status for a school
 */
export async function getCleverSyncStatus(_schoolId: string): Promise<{
  lastSync: string | null;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  studentCount: number;
  sectionCount: number;
}> {
  // In production, this would query the sync_logs table
  return {
    lastSync: new Date().toISOString(),
    status: 'connected',
    studentCount: 487,
    sectionCount: 24,
  };
}

// =============================================================================
// CLASSLINK MOCK (Placeholder for future expansion)
// =============================================================================

export interface ClassLinkRosterResponse {
  users: Array<{
    sourcedId: string;
    status: string;
    givenName: string;
    familyName: string;
    role: 'student' | 'teacher' | 'administrator';
    email: string;
    grades: string[];
  }>;
}

export function getMockClassLinkRoster(_tenantId: string): ClassLinkRosterResponse {
  // ClassLink OneRoster API structure
  return {
    users: [
      {
        sourcedId: 'cl_001',
        status: 'active',
        givenName: 'Sample',
        familyName: 'Student',
        role: 'student',
        email: 'sample.student@school.edu',
        grades: ['7'],
      },
    ],
  };
}
