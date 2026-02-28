import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Student, StudentInsert, StudentUpdate } from '@/lib/database.types';
import { SCHOOL_SEEDS, StudentSeedData } from '@/lib/data/seed-data';

/**
 * Student Queries
 *
 * Data access layer for student operations with multi-tenant isolation
 */

const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.EDUNODE_DEMO_MODE === 'true';

export interface GetStudentsOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'grade' | 'risk' | 'attendance' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  gradeLevel?: number;
  riskLevel?: 'on_track' | 'at_risk' | 'critical';
  teacherName?: string;
  hasIep?: boolean;
  isEnglishLearner?: boolean;
}

// Convert seed data to Student type for demo mode
function seedToStudent(seed: StudentSeedData, schoolId: string): Partial<Student> {
  return {
    id: seed.id,
    school_id: schoolId,
    sis_student_id: seed.id,
    first_name: seed.firstName,
    last_name: seed.lastName,
    display_name: seed.displayName,
    grade_level: seed.gradeLevel,
    has_iep: seed.hasIep,
    has_504_plan: seed.has504Plan,
    is_english_learner: seed.isEnglishLearner,
    homeroom_teacher: seed.homeroomTeacher,
    attendance_rate: seed.attendanceRate,
    days_present: seed.daysPresent,
    days_absent: seed.daysAbsent,
    is_chronically_absent: seed.isChronicallyAbsent,
    proficiency_level: seed.proficiencyLevel,
    growth_percentile: seed.growthPercentile,
    risk_level: seed.riskLevel,
    risk_score: seed.riskScore,
    reading_scores: seed.reading as unknown as Student['reading_scores'],
    math_scores: seed.math as unknown as Student['math_scores'],
    is_active: true,
  };
}

/**
 * Get students for a school with filtering and pagination
 */
export async function getStudentsBySchool(
  schoolId: string,
  options: GetStudentsOptions = {}
): Promise<{ students: Student[]; total: number }> {
  const {
    limit = 50,
    offset = 0,
    sortBy = 'name',
    sortOrder = 'asc',
    gradeLevel,
    riskLevel,
    teacherName,
    hasIep,
    isEnglishLearner,
  } = options;

  // Demo mode: return seed data
  if (isDemoMode) {
    const schoolSlug = Object.keys(SCHOOL_SEEDS).find(
      (slug) => SCHOOL_SEEDS[slug] && `demo-${slug}` === schoolId
    ) || Object.keys(SCHOOL_SEEDS)[0];

    const seedData = SCHOOL_SEEDS[schoolSlug];
    if (!seedData?.students) {
      return { students: [], total: 0 };
    }

    let students = seedData.students.map((s) => seedToStudent(s, schoolId) as Student);

    // Apply filters
    if (gradeLevel !== undefined) {
      students = students.filter((s) => s.grade_level === gradeLevel);
    }
    if (riskLevel) {
      students = students.filter((s) => s.risk_level === riskLevel);
    }
    if (teacherName) {
      students = students.filter((s) => s.homeroom_teacher === teacherName);
    }
    if (hasIep !== undefined) {
      students = students.filter((s) => s.has_iep === hasIep);
    }
    if (isEnglishLearner !== undefined) {
      students = students.filter((s) => s.is_english_learner === isEnglishLearner);
    }

    // Sort
    students.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.display_name.localeCompare(b.display_name);
          break;
        case 'grade':
          comparison = a.grade_level - b.grade_level;
          break;
        case 'risk':
          const riskOrder = { critical: 0, at_risk: 1, on_track: 2 };
          comparison = riskOrder[a.risk_level] - riskOrder[b.risk_level];
          break;
        case 'attendance':
          comparison = (a.attendance_rate || 0) - (b.attendance_rate || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = students.length;
    const paginated = students.slice(offset, offset + limit);

    return { students: paginated, total };
  }

  // Production: query Supabase
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('students')
    .select('*', { count: 'exact' })
    .eq('school_id', schoolId)
    .eq('is_active', true);

  // Apply filters
  if (gradeLevel !== undefined) {
    query = query.eq('grade_level', gradeLevel);
  }
  if (riskLevel) {
    query = query.eq('risk_level', riskLevel);
  }
  if (teacherName) {
    query = query.eq('homeroom_teacher', teacherName);
  }
  if (hasIep !== undefined) {
    query = query.eq('has_iep', hasIep);
  }
  if (isEnglishLearner !== undefined) {
    query = query.eq('is_english_learner', isEnglishLearner);
  }

  // Apply sorting
  const sortColumn = sortBy === 'name' ? 'display_name' : sortBy === 'risk' ? 'risk_score' : sortBy;
  query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[DB] Error fetching students:', error);
    return { students: [], total: 0 };
  }

  return { students: data || [], total: count || 0 };
}

/**
 * Get a single student by ID
 */
export async function getStudentById(id: string): Promise<Student | null> {
  // Demo mode
  if (isDemoMode) {
    for (const schoolSlug of Object.keys(SCHOOL_SEEDS)) {
      const seedData = SCHOOL_SEEDS[schoolSlug];
      if (seedData?.students) {
        const student = seedData.students.find((s) => s.id === id);
        if (student) {
          return seedToStudent(student, `demo-${schoolSlug}`) as Student;
        }
      }
    }
    return null;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[DB] Error fetching student by ID:', error);
    return null;
  }

  return data;
}

/**
 * Get a student by SIS ID (external system ID)
 */
export async function getStudentBySisId(
  schoolId: string,
  sisStudentId: string
): Promise<Student | null> {
  if (isDemoMode) {
    return null; // Demo mode doesn't support SIS ID lookup
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId)
    .eq('sis_student_id', sisStudentId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching student by SIS ID:', error);
    }
    return null;
  }

  return data;
}

/**
 * Search students by name
 */
export async function searchStudents(
  schoolId: string,
  query: string,
  limit = 20
): Promise<Student[]> {
  if (isDemoMode) {
    const schoolSlug = Object.keys(SCHOOL_SEEDS).find(
      (slug) => SCHOOL_SEEDS[slug] && `demo-${slug}` === schoolId
    ) || Object.keys(SCHOOL_SEEDS)[0];

    const seedData = SCHOOL_SEEDS[schoolSlug];
    if (!seedData?.students) return [];

    const lowerQuery = query.toLowerCase();
    return seedData.students
      .filter((s) => s.displayName.toLowerCase().includes(lowerQuery))
      .slice(0, limit)
      .map((s) => seedToStudent(s, schoolId) as Student);
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .ilike('display_name', `%${query}%`)
    .limit(limit);

  if (error) {
    console.error('[DB] Error searching students:', error);
    return [];
  }

  return data || [];
}

/**
 * Get students at risk (at_risk or critical)
 */
export async function getStudentsAtRisk(schoolId: string): Promise<Student[]> {
  if (isDemoMode) {
    const result = await getStudentsBySchool(schoolId, { limit: 1000 });
    return result.students.filter(
      (s) => s.risk_level === 'at_risk' || s.risk_level === 'critical'
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .in('risk_level', ['at_risk', 'critical'])
    .order('risk_score', { ascending: false });

  if (error) {
    console.error('[DB] Error fetching at-risk students:', error);
    return [];
  }

  return data || [];
}

/**
 * Get students by homeroom teacher
 */
export async function getStudentsByTeacher(
  schoolId: string,
  teacherName: string
): Promise<Student[]> {
  return (await getStudentsBySchool(schoolId, { teacherName, limit: 200 })).students;
}

/**
 * Create a new student (admin only)
 */
export async function createStudent(student: StudentInsert): Promise<Student | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error creating student:', error);
    return null;
  }

  return data;
}

/**
 * Update a student
 */
export async function updateStudent(
  id: string,
  updates: StudentUpdate
): Promise<Student | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('students')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating student:', error);
    return null;
  }

  return data;
}

/**
 * Bulk upsert students (for data sync)
 */
export async function bulkUpsertStudents(
  schoolId: string,
  students: StudentInsert[]
): Promise<{ inserted: number; updated: number; errors: number }> {
  const supabase = createAdminSupabaseClient();

  // Ensure all students have the correct school_id
  const studentsWithSchool = students.map((s) => ({
    ...s,
    school_id: schoolId,
  }));

  const { data, error } = await supabase
    .from('students')
    .upsert(studentsWithSchool, {
      onConflict: 'school_id,sis_student_id',
      ignoreDuplicates: false,
    })
    .select('id');

  if (error) {
    console.error('[DB] Error bulk upserting students:', error);
    return { inserted: 0, updated: 0, errors: students.length };
  }

  return {
    inserted: data?.length || 0,
    updated: 0, // Supabase upsert doesn't distinguish
    errors: 0,
  };
}

/**
 * Get aggregate metrics for a school's students
 */
export async function getStudentMetrics(schoolId: string): Promise<{
  total: number;
  byRisk: Record<string, number>;
  byGrade: Record<number, number>;
  averageAttendance: number;
  chronicallyAbsentCount: number;
  iepCount: number;
  ellCount: number;
}> {
  if (isDemoMode) {
    const { students, total } = await getStudentsBySchool(schoolId, { limit: 1000 });

    const byRisk: Record<string, number> = { on_track: 0, at_risk: 0, critical: 0 };
    const byGrade: Record<number, number> = {};
    let totalAttendance = 0;
    let chronicallyAbsentCount = 0;
    let iepCount = 0;
    let ellCount = 0;

    for (const student of students) {
      byRisk[student.risk_level] = (byRisk[student.risk_level] || 0) + 1;
      byGrade[student.grade_level] = (byGrade[student.grade_level] || 0) + 1;
      totalAttendance += student.attendance_rate || 0;
      if (student.is_chronically_absent) chronicallyAbsentCount++;
      if (student.has_iep) iepCount++;
      if (student.is_english_learner) ellCount++;
    }

    return {
      total,
      byRisk,
      byGrade,
      averageAttendance: total > 0 ? totalAttendance / total : 0,
      chronicallyAbsentCount,
      iepCount,
      ellCount,
    };
  }

  const supabase = await createServerSupabaseClient();

  // Get all students for aggregation
  const { data: students, error } = await supabase
    .from('students')
    .select('grade_level, risk_level, attendance_rate, is_chronically_absent, has_iep, is_english_learner')
    .eq('school_id', schoolId)
    .eq('is_active', true);

  if (error || !students) {
    console.error('[DB] Error fetching student metrics:', error);
    return {
      total: 0,
      byRisk: {},
      byGrade: {},
      averageAttendance: 0,
      chronicallyAbsentCount: 0,
      iepCount: 0,
      ellCount: 0,
    };
  }

  const byRisk: Record<string, number> = {};
  const byGrade: Record<number, number> = {};
  let totalAttendance = 0;
  let chronicallyAbsentCount = 0;
  let iepCount = 0;
  let ellCount = 0;

  for (const student of students) {
    byRisk[student.risk_level] = (byRisk[student.risk_level] || 0) + 1;
    byGrade[student.grade_level] = (byGrade[student.grade_level] || 0) + 1;
    totalAttendance += student.attendance_rate || 0;
    if (student.is_chronically_absent) chronicallyAbsentCount++;
    if (student.has_iep) iepCount++;
    if (student.is_english_learner) ellCount++;
  }

  return {
    total: students.length,
    byRisk,
    byGrade,
    averageAttendance: students.length > 0 ? totalAttendance / students.length : 0,
    chronicallyAbsentCount,
    iepCount,
    ellCount,
  };
}
