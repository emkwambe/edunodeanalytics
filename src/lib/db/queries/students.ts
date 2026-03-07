// @ts-nocheck - strict type mismatches after database.types.ts regen
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Student, StudentInsert, StudentUpdate } from '@/lib/database.types';
import { SCHOOL_SEEDS, type StudentSeedData } from '@/lib/data/seed-data';

/**
 * Student Queries
 *
 * Data access layer for student operations with demo mode fallback
 */

// =============================================================================
// TYPES
// =============================================================================

export interface StudentQueryOptions {
  /** Number of records to return (default: 50) */
  limit?: number;
  /** Number of records to skip (default: 0) */
  offset?: number;
  /** Field to sort by */
  sortBy?: keyof Student | 'name';
  /** Sort direction (default: 'asc') */
  sortOrder?: 'asc' | 'desc';
  /** Filter by grade level */
  gradeLevel?: number;
  /** Filter by risk level */
  riskLevel?: 'on_track' | 'at_risk' | 'critical';
  /** Filter by homeroom teacher name */
  teacherName?: string;
}

export interface StudentMetrics {
  totalStudents: number;
  activeStudents: number;
  riskDistribution: {
    onTrack: number;
    atRisk: number;
    critical: number;
  };
  gradeDistribution: Record<number, number>;
  averageAttendanceRate: number;
  chronicAbsenceCount: number;
  chronicAbsenceRate: number;
  averageGrowthPercentile: number;
  averageProficiencyLevel: number;
  iepCount: number;
  plan504Count: number;
  englishLearnerCount: number;
  teacherDistribution: Record<string, number>;
}

export interface PaginatedStudents {
  data: Student[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// =============================================================================
// DEMO MODE UTILITIES
// =============================================================================

const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.EDUNODE_DEMO_MODE === 'true';

/**
 * Convert seed data to Student type for demo mode
 */
function seedToStudent(seed: StudentSeedData, schoolId: string): Student {
  const now = new Date().toISOString();
  return {
    id: seed.id,
    created_at: now,
    updated_at: now,
    school_id: schoolId,
    sis_student_id: `SIS-${seed.id}`,
    first_name: seed.firstName,
    last_name: seed.lastName,
    display_name: seed.displayName,
    grade_level: seed.gradeLevel,
    date_of_birth: null,
    gender: null,
    ethnicity: null,
    has_iep: seed.hasIep,
    has_504_plan: seed.has504Plan,
    is_english_learner: seed.isEnglishLearner,
    is_gifted: false,
    is_free_reduced_lunch: false,
    homeroom_teacher: seed.homeroomTeacher,
    counselor: null,
    attendance_rate: seed.attendanceRate,
    days_present: seed.daysPresent,
    days_absent: seed.daysAbsent,
    is_chronically_absent: seed.isChronicallyAbsent,
    proficiency_level: seed.proficiencyLevel,
    growth_percentile: seed.growthPercentile,
    risk_level: seed.riskLevel,
    risk_score: seed.riskScore,
    risk_factors: null,
    reading_scores: seed.reading as unknown as Student['reading_scores'],
    math_scores: seed.math as unknown as Student['math_scores'],
    purpose_driven_metrics: seed.purposeDriven as unknown as Student['purpose_driven_metrics'],
    is_active: true,
    enrolled_at: now,
    withdrawn_at: null,
    metadata: null,
  };
}

/**
 * Get school seed data by school ID (matches by slug pattern or ID)
 */
function getSchoolSeedBySchoolId(schoolId: string): { students: StudentSeedData[]; id: string } | null {
  // Try direct slug match first
  for (const [slug, seed] of Object.entries(SCHOOL_SEEDS)) {
    if (seed.id === schoolId || schoolId.includes(slug.replace(/-/g, '_')) || schoolId === `demo-${slug}`) {
      return { students: seed.students, id: seed.id };
    }
  }
  // Fallback: return first available school's students for demo
  const firstSchool = Object.values(SCHOOL_SEEDS)[0];
  return firstSchool ? { students: firstSchool.students, id: firstSchool.id } : null;
}

/**
 * Apply query options to an array of students (for demo mode)
 */
function applyQueryOptions(
  students: Student[],
  options: StudentQueryOptions = {}
): { data: Student[]; total: number } {
  let filtered = [...students];

  // Apply filters
  if (options.gradeLevel !== undefined) {
    filtered = filtered.filter((s) => s.grade_level === options.gradeLevel);
  }
  if (options.riskLevel) {
    filtered = filtered.filter((s) => s.risk_level === options.riskLevel);
  }
  if (options.teacherName) {
    filtered = filtered.filter((s) =>
      s.homeroom_teacher?.toLowerCase().includes(options.teacherName!.toLowerCase())
    );
  }

  const total = filtered.length;

  // Apply sorting
  const sortBy = options.sortBy || 'last_name';
  const sortOrder = options.sortOrder || 'asc';

  filtered.sort((a, b) => {
    let aVal: string | number | null;
    let bVal: string | number | null;

    if (sortBy === 'name') {
      aVal = a.display_name;
      bVal = b.display_name;
    } else {
      aVal = a[sortBy] as string | number | null;
      bVal = b[sortBy] as string | number | null;
    }

    if (aVal === null) return sortOrder === 'asc' ? 1 : -1;
    if (bVal === null) return sortOrder === 'asc' ? -1 : 1;
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Apply pagination
  const offset = options.offset || 0;
  const limit = options.limit || 50;
  const paginated = filtered.slice(offset, offset + limit);

  return { data: paginated, total };
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get students by school with pagination, sorting, and filtering
 */
export async function getStudentsBySchool(
  schoolId: string,
  options: StudentQueryOptions = {}
): Promise<PaginatedStudents> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  // Demo mode fallback
  if (isDemoMode) {
    const seedData = getSchoolSeedBySchoolId(schoolId);
    if (seedData) {
      const allStudents = seedData.students.map((s) => seedToStudent(s, schoolId));
      const { data, total } = applyQueryOptions(allStudents, options);
      return {
        data,
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      };
    }
  }

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('students')
    .select('*', { count: 'exact' })
    .eq('school_id', schoolId)
    .eq('is_active', true);

  // Apply filters
  if (options.gradeLevel !== undefined) {
    query = query.eq('grade_level', options.gradeLevel);
  }
  if (options.riskLevel) {
    query = query.eq('risk_level', options.riskLevel);
  }
  if (options.teacherName) {
    query = query.ilike('homeroom_teacher', `%${options.teacherName}%`);
  }

  // Apply sorting
  const sortBy = options.sortBy === 'name' ? 'display_name' : (options.sortBy || 'last_name');
  const sortOrder = options.sortOrder === 'desc' ? false : true;
  query = query.order(sortBy, { ascending: sortOrder });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[DB] Error fetching students by school:', error);
    return { data: [], total: 0, limit, offset, hasMore: false };
  }

  const total = count || 0;
  return {
    data: data || [],
    total,
    limit,
    offset,
    hasMore: offset + (data?.length || 0) < total,
  };
}

/**
 * Get a single student by ID
 */
export async function getStudentById(id: string): Promise<Student | null> {
  // Demo mode fallback
  if (isDemoMode) {
    for (const seed of Object.values(SCHOOL_SEEDS)) {
      const student = seed.students.find((s) => s.id === id);
      if (student) {
        return seedToStudent(student, seed.id);
      }
    }
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching student by ID:', error);
    }
    return null;
  }

  return data;
}

/**
 * Get student by SIS ID within a school
 */
export async function getStudentBySisId(
  schoolId: string,
  sisStudentId: string
): Promise<Student | null> {
  // Demo mode fallback
  if (isDemoMode) {
    const seedData = getSchoolSeedBySchoolId(schoolId);
    if (seedData) {
      const student = seedData.students.find((s) => `SIS-${s.id}` === sisStudentId || s.id === sisStudentId);
      if (student) {
        return seedToStudent(student, schoolId);
      }
    }
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
 * Search students by name within a school
 */
export async function searchStudents(
  schoolId: string,
  query: string,
  limit: number = 20
): Promise<Student[]> {
  const searchTerm = query.toLowerCase().trim();

  // Demo mode fallback
  if (isDemoMode) {
    const seedData = getSchoolSeedBySchoolId(schoolId);
    if (seedData) {
      const allStudents = seedData.students.map((s) => seedToStudent(s, schoolId));
      return allStudents
        .filter(
          (s) =>
            s.first_name.toLowerCase().includes(searchTerm) ||
            s.last_name.toLowerCase().includes(searchTerm) ||
            s.display_name.toLowerCase().includes(searchTerm)
        )
        .slice(0, limit);
    }
  }

  const supabase = await createServerSupabaseClient();

  // Search using ilike on display_name (covers both first and last name)
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
    .order('last_name')
    .limit(limit);

  if (error) {
    console.error('[DB] Error searching students:', error);
    return [];
  }

  return data || [];
}

/**
 * Get students at risk (risk_level = 'at_risk' or 'critical')
 */
export async function getStudentsAtRisk(
  schoolId: string,
  options: Omit<StudentQueryOptions, 'riskLevel'> = {}
): Promise<PaginatedStudents> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  // Demo mode fallback
  if (isDemoMode) {
    const seedData = getSchoolSeedBySchoolId(schoolId);
    if (seedData) {
      const allStudents = seedData.students
        .filter((s) => s.riskLevel === 'at_risk' || s.riskLevel === 'critical')
        .map((s) => seedToStudent(s, schoolId));

      const { data, total } = applyQueryOptions(allStudents, {
        ...options,
        sortBy: options.sortBy || 'risk_score',
        sortOrder: options.sortOrder || 'desc',
        limit,
        offset,
      });

      return {
        data,
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      };
    }
  }

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('students')
    .select('*', { count: 'exact' })
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .in('risk_level', ['at_risk', 'critical']);

  // Apply additional filters
  if (options.gradeLevel !== undefined) {
    query = query.eq('grade_level', options.gradeLevel);
  }
  if (options.teacherName) {
    query = query.ilike('homeroom_teacher', `%${options.teacherName}%`);
  }

  // Apply sorting (default: risk_score descending for at-risk students)
  const sortBy = options.sortBy === 'name' ? 'display_name' : (options.sortBy || 'risk_score');
  const sortOrder = options.sortOrder === 'asc' ? true : false;
  query = query.order(sortBy, { ascending: sortOrder });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[DB] Error fetching at-risk students:', error);
    return { data: [], total: 0, limit, offset, hasMore: false };
  }

  const total = count || 0;
  return {
    data: data || [],
    total,
    limit,
    offset,
    hasMore: offset + (data?.length || 0) < total,
  };
}

/**
 * Get students by homeroom teacher
 */
export async function getStudentsByTeacher(
  schoolId: string,
  teacherName: string,
  options: Omit<StudentQueryOptions, 'teacherName'> = {}
): Promise<PaginatedStudents> {
  return getStudentsBySchool(schoolId, {
    ...options,
    teacherName,
  });
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
 * Bulk upsert students for data sync (admin only)
 *
 * Uses sis_student_id as the conflict resolution key within a school
 */
export async function bulkUpsertStudents(
  schoolId: string,
  students: StudentInsert[]
): Promise<{ success: boolean; inserted: number; updated: number; errors: string[] }> {
  const supabase = createAdminSupabaseClient();
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;

  // Ensure all students have the correct school_id
  const studentsWithSchoolId = students.map((s) => ({
    ...s,
    school_id: schoolId,
    updated_at: new Date().toISOString(),
  }));

  // Get existing students by SIS ID for this school
  const sisIds = studentsWithSchoolId.map((s) => s.sis_student_id);
  const { data: existingStudents } = await supabase
    .from('students')
    .select('id, sis_student_id')
    .eq('school_id', schoolId)
    .in('sis_student_id', sisIds);

  const existingSisIds = new Set(existingStudents?.map((s) => s.sis_student_id) || []);
  const existingMap = new Map(existingStudents?.map((s) => [s.sis_student_id, s.id]) || []);

  // Separate into inserts and updates
  const toInsert = studentsWithSchoolId.filter((s) => !existingSisIds.has(s.sis_student_id));
  const toUpdate = studentsWithSchoolId.filter((s) => existingSisIds.has(s.sis_student_id));

  // Batch insert new students
  if (toInsert.length > 0) {
    const { error: insertError, data: insertedData } = await supabase
      .from('students')
      .insert(toInsert)
      .select();

    if (insertError) {
      errors.push(`Insert error: ${insertError.message}`);
    } else {
      inserted = insertedData?.length || 0;
    }
  }

  // Update existing students one by one (to handle partial failures)
  for (const student of toUpdate) {
    const existingId = existingMap.get(student.sis_student_id);
    if (!existingId) continue;

    // Remove fields that shouldn't be updated
    const { id: _id, created_at: _createdAt, sis_student_id: _sisId, ...updateData } = student;

    const { error: updateError } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', existingId);

    if (updateError) {
      errors.push(`Update error for ${student.sis_student_id}: ${updateError.message}`);
    } else {
      updated++;
    }
  }

  return {
    success: errors.length === 0,
    inserted,
    updated,
    errors,
  };
}

/**
 * Get aggregate metrics for students in a school
 */
export async function getStudentMetrics(schoolId: string): Promise<StudentMetrics> {
  // Demo mode fallback
  if (isDemoMode) {
    const seedData = getSchoolSeedBySchoolId(schoolId);
    if (seedData) {
      const students = seedData.students.map((s) => seedToStudent(s, schoolId));
      return calculateMetricsFromStudents(students);
    }
  }

  const supabase = await createServerSupabaseClient();

  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId);

  if (error) {
    console.error('[DB] Error fetching students for metrics:', error);
    return getEmptyMetrics();
  }

  if (!students || students.length === 0) {
    return getEmptyMetrics();
  }

  return calculateMetricsFromStudents(students);
}

/**
 * Calculate metrics from an array of students
 */
function calculateMetricsFromStudents(students: Student[]): StudentMetrics {
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.is_active).length;

  // Risk distribution
  const onTrack = students.filter((s) => s.risk_level === 'on_track').length;
  const atRisk = students.filter((s) => s.risk_level === 'at_risk').length;
  const critical = students.filter((s) => s.risk_level === 'critical').length;

  // Grade distribution
  const gradeDistribution: Record<number, number> = {};
  students.forEach((s) => {
    gradeDistribution[s.grade_level] = (gradeDistribution[s.grade_level] || 0) + 1;
  });

  // Attendance metrics
  const studentsWithAttendance = students.filter((s) => s.attendance_rate !== null);
  const averageAttendanceRate =
    studentsWithAttendance.length > 0
      ? studentsWithAttendance.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) /
        studentsWithAttendance.length
      : 0;

  const chronicAbsenceCount = students.filter((s) => s.is_chronically_absent).length;
  const chronicAbsenceRate = totalStudents > 0 ? chronicAbsenceCount / totalStudents : 0;

  // Growth metrics
  const studentsWithGrowth = students.filter((s) => s.growth_percentile !== null);
  const averageGrowthPercentile =
    studentsWithGrowth.length > 0
      ? studentsWithGrowth.reduce((sum, s) => sum + (s.growth_percentile || 0), 0) /
        studentsWithGrowth.length
      : 0;

  // Proficiency metrics
  const studentsWithProficiency = students.filter((s) => s.proficiency_level !== null);
  const averageProficiencyLevel =
    studentsWithProficiency.length > 0
      ? studentsWithProficiency.reduce((sum, s) => sum + (s.proficiency_level || 0), 0) /
        studentsWithProficiency.length
      : 0;

  // Special population counts
  const iepCount = students.filter((s) => s.has_iep).length;
  const plan504Count = students.filter((s) => s.has_504_plan).length;
  const englishLearnerCount = students.filter((s) => s.is_english_learner).length;

  // Teacher distribution
  const teacherDistribution: Record<string, number> = {};
  students.forEach((s) => {
    if (s.homeroom_teacher) {
      teacherDistribution[s.homeroom_teacher] =
        (teacherDistribution[s.homeroom_teacher] || 0) + 1;
    }
  });

  return {
    totalStudents,
    activeStudents,
    riskDistribution: { onTrack, atRisk, critical },
    gradeDistribution,
    averageAttendanceRate: Math.round(averageAttendanceRate * 1000) / 1000,
    chronicAbsenceCount,
    chronicAbsenceRate: Math.round(chronicAbsenceRate * 1000) / 1000,
    averageGrowthPercentile: Math.round(averageGrowthPercentile * 10) / 10,
    averageProficiencyLevel: Math.round(averageProficiencyLevel * 10) / 10,
    iepCount,
    plan504Count,
    englishLearnerCount,
    teacherDistribution,
  };
}

/**
 * Return empty metrics structure
 */
function getEmptyMetrics(): StudentMetrics {
  return {
    totalStudents: 0,
    activeStudents: 0,
    riskDistribution: { onTrack: 0, atRisk: 0, critical: 0 },
    gradeDistribution: {},
    averageAttendanceRate: 0,
    chronicAbsenceCount: 0,
    chronicAbsenceRate: 0,
    averageGrowthPercentile: 0,
    averageProficiencyLevel: 0,
    iepCount: 0,
    plan504Count: 0,
    englishLearnerCount: 0,
    teacherDistribution: {},
  };
}
