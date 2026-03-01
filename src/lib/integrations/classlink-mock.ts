/**
 * EduNode Integration Engine: ClassLink Mock Service
 * ===================================================
 *
 * Simulates ClassLink OneRoster API responses for Roster Sync.
 * In production, replace with actual ClassLink OAuth + API calls.
 *
 * ClassLink OneRoster v1.1 Endpoints Simulated:
 * - GET /ims/oneroster/v1p1/users
 * - GET /ims/oneroster/v1p1/classes
 * - GET /ims/oneroster/v1p1/enrollments
 * - GET /ims/oneroster/v1p1/orgs
 */

// =============================================================================
// TYPES: ClassLink OneRoster API Response Structures
// =============================================================================

export interface ClassLinkOrg {
  sourcedId: string;
  status: 'active' | 'tobedeleted';
  dateLastModified: string;
  name: string;
  type: 'school' | 'district' | 'national' | 'state' | 'local';
  identifier: string;
  parent?: { sourcedId: string; type: string };
}

export interface ClassLinkUser {
  sourcedId: string;
  status: 'active' | 'tobedeleted';
  dateLastModified: string;
  enabledUser: boolean;
  givenName: string;
  familyName: string;
  middleName?: string;
  role: 'student' | 'teacher' | 'administrator' | 'aide' | 'guardian';
  identifier: string;
  email: string;
  phone?: string;
  grades?: string[];
  orgs: Array<{ sourcedId: string; type: string }>;
  userIds?: Array<{ type: string; identifier: string }>;
  demographics?: {
    sex?: 'male' | 'female' | 'unspecified';
    birthDate?: string;
    hispanicOrLatinoEthnicity?: boolean;
    race?: string;
  };
}

export interface ClassLinkClass {
  sourcedId: string;
  status: 'active' | 'tobedeleted';
  dateLastModified: string;
  title: string;
  classCode: string;
  classType: 'homeroom' | 'scheduled';
  location?: string;
  grades: string[];
  subjects?: string[];
  subjectCodes?: string[];
  periods?: string[];
  course: { sourcedId: string; type: string };
  school: { sourcedId: string; type: string };
  terms: Array<{ sourcedId: string; type: string }>;
}

export interface ClassLinkEnrollment {
  sourcedId: string;
  status: 'active' | 'tobedeleted';
  dateLastModified: string;
  role: 'student' | 'teacher' | 'aide';
  primary: boolean;
  beginDate?: string;
  endDate?: string;
  user: { sourcedId: string; type: string };
  class: { sourcedId: string; type: string };
  school: { sourcedId: string; type: string };
}

export interface ClassLinkSyncResult {
  tenant_id: string;
  synced_students: number;
  synced_teachers: number;
  synced_classes: number;
  synced_enrollments: number;
  new_records: number;
  updated_records: number;
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
  'Daniel', 'Matthew', 'Alexander', 'William', 'Benjamin', 'Sebastian', 'Lucas', 'Henry',
];

const FIRST_NAMES_F = [
  'Maria', 'Jennifer', 'Ashley', 'Michelle', 'Aaliyah', 'Destiny', 'Sophia', 'Emma',
  'Olivia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Luna',
  'Camila', 'Aria', 'Scarlett', 'Penelope', 'Riley', 'Chloe', 'Eleanor', 'Nora',
];

const LAST_NAMES = [
  'Garcia', 'Rodriguez', 'Martinez', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis',
  'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker',
  'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill', 'Scott',
];

const TEACHER_FIRST_NAMES = [
  'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'Robert', 'Maria', 'James',
  'Patricia', 'Christopher', 'Linda', 'Daniel', 'Elizabeth', 'Matthew', 'Susan', 'Andrew',
];

const TEACHER_LAST_NAMES = [
  'Johnson', 'Williams', 'Chen', 'Patel', 'Rodriguez', 'Thompson', 'Davis', 'Martinez',
  'Anderson', 'Taylor', 'Wilson', 'Moore', 'Jackson', 'Lee', 'Harris', 'Clark',
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

  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (this.next() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

/**
 * Generate mock ClassLink organization (school)
 */
export function getMockClassLinkOrg(tenantId: string): ClassLinkOrg {
  return {
    sourcedId: tenantId,
    status: 'active',
    dateLastModified: new Date().toISOString(),
    name: 'Academy Charter School',
    type: 'school',
    identifier: tenantId,
    parent: {
      sourcedId: `district-${tenantId}`,
      type: 'district',
    },
  };
}

/**
 * Generate mock ClassLink students
 */
export function getMockClassLinkStudents(
  tenantId: string,
  count: number = 150,
  seed: number = 42
): ClassLinkUser[] {
  const rng = new SeededRandom(seed);
  const students: ClassLinkUser[] = [];
  const grades = ['6', '7', '8'];
  const races = ['white', 'black', 'asian', 'americanIndian', 'twoOrMoreRaces', 'other'];

  for (let i = 0; i < count; i++) {
    const sex: 'male' | 'female' = rng.next() > 0.5 ? 'male' : 'female';
    const firstName = rng.pick(sex === 'male' ? FIRST_NAMES_M : FIRST_NAMES_F);
    const lastName = rng.pick(LAST_NAMES);
    const grade = rng.pick(grades);
    const studentNumber = (20000 + i).toString();

    // Demographics
    const isHispanic = rng.next() < 0.42;
    const race = isHispanic ? 'hispanicOrLatino' : rng.pick(races);

    // Birthdate
    const birthYear = 2025 - 11 - parseInt(grade);
    const birthMonth = rng.nextInt(1, 12);
    const birthDay = rng.nextInt(1, 28);

    students.push({
      sourcedId: rng.uuid(),
      status: 'active',
      dateLastModified: new Date().toISOString(),
      enabledUser: true,
      givenName: firstName,
      familyName: lastName,
      middleName: rng.next() > 0.7 ? rng.pick([...FIRST_NAMES_M, ...FIRST_NAMES_F]).charAt(0) : undefined,
      role: 'student',
      identifier: studentNumber,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${studentNumber.slice(-2)}@student.edu`,
      grades: [grade],
      orgs: [{ sourcedId: tenantId, type: 'school' }],
      userIds: [
        { type: 'LDAP', identifier: `uid=${studentNumber},ou=students,dc=school,dc=edu` },
        { type: 'Fed', identifier: `urn:classlink:${tenantId}:student:${studentNumber}` },
      ],
      demographics: {
        sex,
        birthDate: `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`,
        hispanicOrLatinoEthnicity: isHispanic,
        race,
      },
    });
  }

  return students;
}

/**
 * Generate mock ClassLink teachers
 */
export function getMockClassLinkTeachers(
  tenantId: string,
  count: number = 14,
  seed: number = 42
): ClassLinkUser[] {
  const rng = new SeededRandom(seed + 1000);
  const teachers: ClassLinkUser[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = rng.pick(TEACHER_FIRST_NAMES);
    const lastName = rng.pick(TEACHER_LAST_NAMES);
    const teacherNumber = (5000 + i).toString();

    teachers.push({
      sourcedId: rng.uuid(),
      status: 'active',
      dateLastModified: new Date().toISOString(),
      enabledUser: true,
      givenName: firstName,
      familyName: lastName,
      role: 'teacher',
      identifier: teacherNumber,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
      orgs: [{ sourcedId: tenantId, type: 'school' }],
      userIds: [
        { type: 'LDAP', identifier: `uid=${teacherNumber},ou=staff,dc=school,dc=edu` },
      ],
    });
  }

  return teachers;
}

/**
 * Generate mock ClassLink classes
 */
export function getMockClassLinkClasses(
  tenantId: string,
  seed: number = 42
): ClassLinkClass[] {
  const rng = new SeededRandom(seed + 2000);
  const classes: ClassLinkClass[] = [];

  const subjects = [
    { name: 'Mathematics', codes: ['MTH'] },
    { name: 'English Language Arts', codes: ['ELA'] },
    { name: 'Science', codes: ['SCI'] },
    { name: 'Social Studies', codes: ['SOC'] },
    { name: 'Physical Education', codes: ['PE'] },
  ];
  const grades = ['6', '7', '8'];
  const periods = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

  for (const subject of subjects) {
    for (const grade of grades) {
      const sectionCount = rng.nextInt(2, 3);

      for (let s = 0; s < sectionCount; s++) {
        const sectionLetter = String.fromCharCode(65 + s);

        classes.push({
          sourcedId: rng.uuid(),
          status: 'active',
          dateLastModified: new Date().toISOString(),
          title: `${subject.name} ${grade}${sectionLetter}`,
          classCode: `${subject.codes[0]}${grade}${sectionLetter}`,
          classType: 'scheduled',
          location: `Room ${rng.nextInt(100, 200)}`,
          grades: [grade],
          subjects: [subject.name],
          subjectCodes: subject.codes,
          periods: [rng.pick(periods)],
          course: {
            sourcedId: `course-${subject.codes[0]}-${grade}`,
            type: 'course',
          },
          school: {
            sourcedId: tenantId,
            type: 'school',
          },
          terms: [
            {
              sourcedId: 'term-2025-26-full',
              type: 'academicSession',
            },
          ],
        });
      }
    }
  }

  return classes;
}

/**
 * Generate mock ClassLink enrollments
 */
export function getMockClassLinkEnrollments(
  tenantId: string,
  students: ClassLinkUser[],
  teachers: ClassLinkUser[],
  classes: ClassLinkClass[],
  seed: number = 42
): ClassLinkEnrollment[] {
  const rng = new SeededRandom(seed + 3000);
  const enrollments: ClassLinkEnrollment[] = [];

  // Assign each student to classes matching their grade
  for (const student of students) {
    const studentGrade = student.grades?.[0] || '6';
    const gradeClasses = classes.filter((c) => c.grades.includes(studentGrade));

    // Each student gets enrolled in each core subject
    for (const cls of gradeClasses) {
      enrollments.push({
        sourcedId: rng.uuid(),
        status: 'active',
        dateLastModified: new Date().toISOString(),
        role: 'student',
        primary: cls.subjects?.includes('Mathematics') || false,
        beginDate: '2025-08-15',
        endDate: '2026-06-10',
        user: { sourcedId: student.sourcedId, type: 'user' },
        class: { sourcedId: cls.sourcedId, type: 'class' },
        school: { sourcedId: tenantId, type: 'org' },
      });
    }
  }

  // Assign teachers to classes (round-robin style)
  let teacherIndex = 0;
  for (const cls of classes) {
    const teacher = teachers[teacherIndex % teachers.length];
    enrollments.push({
      sourcedId: rng.uuid(),
      status: 'active',
      dateLastModified: new Date().toISOString(),
      role: 'teacher',
      primary: true,
      beginDate: '2025-08-15',
      endDate: '2026-06-10',
      user: { sourcedId: teacher.sourcedId, type: 'user' },
      class: { sourcedId: cls.sourcedId, type: 'class' },
      school: { sourcedId: tenantId, type: 'org' },
    });
    teacherIndex++;
  }

  return enrollments;
}

// =============================================================================
// SYNC OPERATIONS
// =============================================================================

/**
 * Simulate ClassLink roster sync
 */
export async function syncClassLinkRoster(
  tenantId: string,
  schoolSlug: string,
  options: {
    studentCount?: number;
    simulateLatency?: boolean;
  } = {}
): Promise<ClassLinkSyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  const studentCount = options.studentCount || 150;
  const simulateLatency = options.simulateLatency ?? true;

  console.log(`[ClassLinkSync] Starting sync for tenant: ${tenantId} (${schoolSlug})`);

  // Simulate network latency
  if (simulateLatency) {
    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));
  }

  // Generate mock data
  const students = getMockClassLinkStudents(tenantId, studentCount, Date.now());
  const teachers = getMockClassLinkTeachers(tenantId, 14, Date.now());
  const classes = getMockClassLinkClasses(tenantId, Date.now());
  const enrollments = getMockClassLinkEnrollments(tenantId, students, teachers, classes, Date.now());

  console.log(`[ClassLinkSync] Generated ${students.length} students, ${teachers.length} teachers, ${classes.length} classes, ${enrollments.length} enrollments`);

  // Simulate processing
  if (simulateLatency) {
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  const endTime = Date.now();

  const result: ClassLinkSyncResult = {
    tenant_id: tenantId,
    synced_students: students.length,
    synced_teachers: teachers.length,
    synced_classes: classes.length,
    synced_enrollments: enrollments.length,
    new_records: Math.floor((students.length + teachers.length) * 0.08),
    updated_records: Math.floor((students.length + teachers.length) * 0.92),
    status: errors.length > 0 ? 'PARTIAL' : 'COMPLETED',
    errors,
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date(endTime).toISOString(),
    duration_ms: endTime - startTime,
  };

  console.log(`[ClassLinkSync] Completed in ${result.duration_ms}ms - Status: ${result.status}`);

  return result;
}

/**
 * Get ClassLink sync status
 */
export async function getClassLinkSyncStatus(tenantId: string): Promise<{
  lastSync: string | null;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  studentCount: number;
  classCount: number;
}> {
  return {
    lastSync: new Date().toISOString(),
    status: 'connected',
    studentCount: 512,
    classCount: 32,
  };
}
