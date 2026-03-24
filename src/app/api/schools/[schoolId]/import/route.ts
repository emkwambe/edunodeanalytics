// src/app/api/schools/[schoolId]/import/route.ts
/**
 * CSV Import API
 * POST: Accept parsed CSV data and import into database.
 *
 * Import types:
 *   - students: Upsert into students table matching on sis_student_id
 *   - attendance: Update attendance fields on students table
 *   - assessments: Update assessment scores on students table
 *
 * Only school admins can import data.
 *
 * T1 Security: FERPA audit logging on all student data imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, isAdmin, type RiskRouteParams } from '../risk/_shared/auth';
import { evaluateSchoolRisk } from '@/lib/risk-engine/orchestrator';
import { logFerpaAccess } from '@/lib/compliance/ferpa-audit';

// ============================================================
// TYPES
// ============================================================

interface StudentImportRow {
  sis_student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  homeroom_teacher?: string;
  is_english_learner?: boolean;
  is_free_reduced_lunch?: boolean;
  has_iep?: boolean;
  has_504_plan?: boolean;
}

interface AttendanceImportRow {
  sis_student_id: string;
  days_present: number;
  days_absent: number;
  attendance_rate: number;
}

interface AssessmentImportRow {
  sis_student_id: string;
  math_score?: number;
  reading_score?: number;
  growth_percentile?: number;
  proficiency_level?: number;
}

interface ImportRequest {
  importType: 'students' | 'attendance' | 'assessments';
  data: StudentImportRow[] | AttendanceImportRow[] | AssessmentImportRow[];
}

interface ImportResult {
  success: boolean;
  importType: string;
  rowsProcessed: number;
  rowsCreated: number;
  rowsUpdated: number;
  errors: Array<{ row: number; message: string }>;
  importedStudentIds?: string[];
  riskAnalysis?: {
    studentsEvaluated: number;
    atRiskCount: number;
    criticalCount: number;
    alertsGenerated: number;
    evaluationTimeMs: number;
  };
}

// ============================================================
// IMPORT HANDLERS
// ============================================================

async function importStudents(
  adminSupabase: ReturnType<typeof import('@/lib/supabase/server').createAdminSupabaseClient>,
  schoolId: string,
  rows: StudentImportRow[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    importType: 'students',
    rowsProcessed: 0,
    rowsCreated: 0,
    rowsUpdated: 0,
    errors: [],
    importedStudentIds: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    result.rowsProcessed++;

    // Validate required fields
    if (!row.sis_student_id || !row.first_name || !row.last_name) {
      result.errors.push({
        row: i + 1,
        message: 'Missing required field: sis_student_id, first_name, or last_name',
      });
      continue;
    }

    if (row.grade_level === undefined || row.grade_level < 0 || row.grade_level > 12) {
      result.errors.push({
        row: i + 1,
        message: `Invalid grade_level: ${row.grade_level}`,
      });
      continue;
    }

    try {
      // Check if student exists
      const { data: existing } = await adminSupabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('sis_student_id', row.sis_student_id)
        .single();

      const studentData = {
        school_id: schoolId,
        sis_student_id: row.sis_student_id,
        first_name: row.first_name,
        last_name: row.last_name,
        display_name: `${row.last_name}, ${row.first_name}`,
        grade_level: row.grade_level,
        homeroom_teacher: row.homeroom_teacher || null,
        is_english_learner: row.is_english_learner ?? false,
        is_free_reduced_lunch: row.is_free_reduced_lunch ?? false,
        has_iep: row.has_iep ?? false,
        has_504_plan: row.has_504_plan ?? false,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        // Update existing student
        const { error } = await adminSupabase
          .from('students')
          .update(studentData)
          .eq('id', existing.id);

        if (error) {
          result.errors.push({ row: i + 1, message: error.message });
        } else {
          result.rowsUpdated++;
          result.importedStudentIds!.push(existing.id);
        }
      } else {
        // Create new student
        const { data: newStudent, error } = await adminSupabase
          .from('students')
          .insert({ ...studentData, created_at: new Date().toISOString() })
          .select('id')
          .single();

        if (error) {
          result.errors.push({ row: i + 1, message: error.message });
        } else {
          result.rowsCreated++;
          result.importedStudentIds!.push(newStudent.id);
        }
      }
    } catch (err) {
      result.errors.push({
        row: i + 1,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

async function importAttendance(
  adminSupabase: ReturnType<typeof import('@/lib/supabase/server').createAdminSupabaseClient>,
  schoolId: string,
  rows: AttendanceImportRow[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    importType: 'attendance',
    rowsProcessed: 0,
    rowsCreated: 0,
    rowsUpdated: 0,
    errors: [],
    importedStudentIds: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    result.rowsProcessed++;

    // Validate required fields
    if (!row.sis_student_id) {
      result.errors.push({ row: i + 1, message: 'Missing sis_student_id' });
      continue;
    }

    if (row.attendance_rate === undefined || row.attendance_rate < 0 || row.attendance_rate > 1) {
      result.errors.push({
        row: i + 1,
        message: `Invalid attendance_rate: ${row.attendance_rate}. Must be between 0 and 1.`,
      });
      continue;
    }

    try {
      // Find student
      const { data: student } = await adminSupabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('sis_student_id', row.sis_student_id)
        .single();

      if (!student) {
        result.errors.push({
          row: i + 1,
          message: `Student not found: ${row.sis_student_id}`,
        });
        continue;
      }

      // Update attendance
      const { error } = await adminSupabase
        .from('students')
        .update({
          days_present: row.days_present ?? 0,
          days_absent: row.days_absent ?? 0,
          attendance_rate: row.attendance_rate,
          is_chronically_absent: row.attendance_rate < 0.9,
          updated_at: new Date().toISOString(),
        })
        .eq('id', student.id);

      if (error) {
        result.errors.push({ row: i + 1, message: error.message });
      } else {
        result.rowsUpdated++;
        result.importedStudentIds!.push(student.id);
      }
    } catch (err) {
      result.errors.push({
        row: i + 1,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

async function importAssessments(
  adminSupabase: ReturnType<typeof import('@/lib/supabase/server').createAdminSupabaseClient>,
  schoolId: string,
  rows: AssessmentImportRow[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    importType: 'assessments',
    rowsProcessed: 0,
    rowsCreated: 0,
    rowsUpdated: 0,
    errors: [],
    importedStudentIds: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    result.rowsProcessed++;

    if (!row.sis_student_id) {
      result.errors.push({ row: i + 1, message: 'Missing sis_student_id' });
      continue;
    }

    try {
      // Find student
      const { data: student } = await adminSupabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('sis_student_id', row.sis_student_id)
        .single();

      if (!student) {
        result.errors.push({
          row: i + 1,
          message: `Student not found: ${row.sis_student_id}`,
        });
        continue;
      }

      // Update assessment data
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (row.math_score !== undefined) {
        updates.math_score = row.math_score;
      }
      if (row.reading_score !== undefined) {
        updates.reading_score = row.reading_score;
      }
      if (row.growth_percentile !== undefined) {
        updates.growth_percentile = row.growth_percentile;
      }
      if (row.proficiency_level !== undefined) {
        updates.proficiency_level = row.proficiency_level;
      }

      const { error } = await adminSupabase
        .from('students')
        .update(updates)
        .eq('id', student.id);

      if (error) {
        result.errors.push({ row: i + 1, message: error.message });
      } else {
        result.rowsUpdated++;
        result.importedStudentIds!.push(student.id);
      }
    } catch (err) {
      result.errors.push({
        row: i + 1,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

// ============================================================
// ROUTE HANDLER
// ============================================================

export async function POST(request: NextRequest, { params }: RiskRouteParams) {
  const { schoolId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { role, adminSupabase, userId } = authResult;

  // Admin-only import
  if (!isAdmin(role)) {
    return NextResponse.json(
      { error: 'Only admins can import data' },
      { status: 403 }
    );
  }

  try {
    const body: ImportRequest = await request.json();

    if (!body.importType || !body.data || !Array.isArray(body.data)) {
      return NextResponse.json(
        { error: 'Invalid request: importType and data array required' },
        { status: 400 }
      );
    }

    if (body.data.length === 0) {
      return NextResponse.json(
        { error: 'No data to import' },
        { status: 400 }
      );
    }

    if (body.data.length > 5000) {
      return NextResponse.json(
        { error: 'Maximum 5000 rows per import' },
        { status: 400 }
      );
    }

    let result: ImportResult;

    switch (body.importType) {
      case 'students':
        result = await importStudents(adminSupabase, schoolId, body.data as StudentImportRow[]);
        break;
      case 'attendance':
        result = await importAttendance(adminSupabase, schoolId, body.data as AttendanceImportRow[]);
        break;
      case 'assessments':
        result = await importAssessments(adminSupabase, schoolId, body.data as AssessmentImportRow[]);
        break;
      default:
        return NextResponse.json(
          { error: `Invalid import type: ${body.importType}` },
          { status: 400 }
        );
    }

    // Log to audit_logs
    await adminSupabase.from('audit_logs').insert({
      school_id: schoolId,
      user_id: userId,
      action: 'csv_import',
      resource_type: body.importType,
      resource_id: null,
      old_values: null,
      new_values: JSON.parse(JSON.stringify({
        importType: body.importType,
        rowsProcessed: result.rowsProcessed,
        rowsCreated: result.rowsCreated,
        rowsUpdated: result.rowsUpdated,
        errorCount: result.errors.length,
      })),
      metadata: JSON.parse(JSON.stringify({ trigger: 'csv_import' })),
    } as any);

    // FERPA Audit: Log student import
    if (result.importedStudentIds && result.importedStudentIds.length > 0) {
      await logFerpaAccess({
        schoolId,
        userId,
        accessType: 'import_students',
        studentIds: result.importedStudentIds,
        description: `Imported ${result.rowsProcessed} ${body.importType} records (${result.rowsCreated} created, ${result.rowsUpdated} updated)`,
        metadata: {
          importType: body.importType,
          rowsProcessed: result.rowsProcessed,
          rowsCreated: result.rowsCreated,
          rowsUpdated: result.rowsUpdated,
        },
      });
    }

    // Run risk evaluation if we imported data successfully
    if (result.importedStudentIds && result.importedStudentIds.length > 0) {
      try {
        console.log(`[CSV Import] Running risk evaluation for ${result.importedStudentIds.length} students`);
        const evalStart = Date.now();
        const evalResult = await evaluateSchoolRisk(schoolId, 'sync_event');

        result.riskAnalysis = {
          studentsEvaluated: evalResult.evaluation.studentsEvaluated,
          atRiskCount: (evalResult.evaluation.distribution.at_risk || 0),
          criticalCount: (evalResult.evaluation.distribution.critical || 0),
          alertsGenerated: evalResult.alerts.alertsGenerated,
          evaluationTimeMs: Date.now() - evalStart,
        };

        console.log(`[CSV Import] Risk evaluation complete: ${evalResult.evaluation.studentsEvaluated} students, ${evalResult.alerts.alertsGenerated} alerts`);
      } catch (evalErr) {
        // Log but don't fail the import
        console.error('[CSV Import] Risk evaluation failed:', evalErr);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[CSV Import API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
