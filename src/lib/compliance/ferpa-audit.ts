/**
 * FERPA Audit Logger
 * ==================
 *
 * Simple audit logging for FERPA compliance on student data access.
 * Uses the existing audit_logs table (which is known to exist).
 *
 * T1 Security & Data Safety requirement.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export type FerpaAccessType =
  | 'view_student'           // Viewing a single student record
  | 'view_students'          // Viewing list of students
  | 'view_at_risk'           // Viewing at-risk student list
  | 'view_metrics'           // Viewing aggregate student metrics
  | 'view_interventions'     // Viewing student interventions
  | 'analyze_student'        // AI analysis of student data
  | 'create_student'         // Creating a new student record
  | 'update_student'         // Updating student record
  | 'delete_student'         // Deleting student record
  | 'export_students'        // Exporting student data
  | 'import_students';       // Importing student data

export interface FerpaAuditParams {
  schoolId: string;
  userId: string;
  accessType: FerpaAccessType;
  studentIds: string[];
  resourceId?: string | null;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a FERPA-compliant audit event for student data access.
 * This ensures all access to student PII is tracked for compliance.
 */
export async function logFerpaAccess(params: FerpaAuditParams): Promise<void> {
  const {
    schoolId,
    userId,
    accessType,
    studentIds,
    resourceId = null,
    description,
    metadata = {},
  } = params;

  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || null;
    const userAgent = headersList.get('user-agent') || null;

    const adminSupabase = createAdminSupabaseClient();

    // Type assertion needed due to database.types.ts schema mismatch
    // The audit_logs table exists but types may not be perfectly aligned
    const auditRecord = {
      school_id: schoolId,
      user_id: userId,
      action: `ferpa_${accessType}`,
      resource_type: 'student_data',
      resource_id: resourceId,
      old_values: null,
      new_values: JSON.parse(JSON.stringify({
        student_count: studentIds.length,
        student_ids: studentIds.slice(0, 10), // Limit for audit storage
        access_type: accessType,
      })),
      metadata: JSON.parse(JSON.stringify({
        ...metadata,
        ferpa_audit: true,
        ip_address: ipAddress,
        user_agent: userAgent,
        description: description || `FERPA: ${accessType} access to ${studentIds.length} student record(s)`,
        timestamp: new Date().toISOString(),
      })),
    };
    await adminSupabase.from('audit_logs').insert(auditRecord);
  } catch (error) {
    // Log error but don't fail the request - audit logging should not break the app
    console.error('[FERPA Audit] Failed to log access:', error);
  }
}

/**
 * Log student list access (multiple students)
 */
export async function logStudentListAccess(
  schoolId: string,
  userId: string,
  studentIds: string[],
  accessType: 'view_students' | 'view_at_risk' | 'export_students' = 'view_students'
): Promise<void> {
  await logFerpaAccess({
    schoolId,
    userId,
    accessType,
    studentIds,
    description: `Accessed ${studentIds.length} student records`,
  });
}

/**
 * Log single student access
 */
export async function logSingleStudentAccess(
  schoolId: string,
  userId: string,
  studentId: string,
  accessType: 'view_student' | 'update_student' | 'delete_student' | 'analyze_student' = 'view_student'
): Promise<void> {
  await logFerpaAccess({
    schoolId,
    userId,
    accessType,
    studentIds: [studentId],
    resourceId: studentId,
    description: `${accessType} for student ${studentId}`,
  });
}

/**
 * Log student creation
 */
export async function logStudentCreation(
  schoolId: string,
  userId: string,
  studentId: string
): Promise<void> {
  await logFerpaAccess({
    schoolId,
    userId,
    accessType: 'create_student',
    studentIds: [studentId],
    resourceId: studentId,
    description: `Created student record ${studentId}`,
  });
}

/**
 * Log student metrics access (aggregate data)
 */
export async function logMetricsAccess(
  schoolId: string,
  userId: string
): Promise<void> {
  await logFerpaAccess({
    schoolId,
    userId,
    accessType: 'view_metrics',
    studentIds: [], // Aggregate access, no specific students
    description: 'Accessed aggregate student metrics',
  });
}

/**
 * Log interventions access for a student
 */
export async function logInterventionsAccess(
  schoolId: string,
  userId: string,
  studentId: string
): Promise<void> {
  await logFerpaAccess({
    schoolId,
    userId,
    accessType: 'view_interventions',
    studentIds: [studentId],
    resourceId: studentId,
    description: `Viewed interventions for student ${studentId}`,
  });
}
