// @ts-nocheck - directory_opt_outs table migration pending
/**
 * FERPA Compliance Module
 * =======================
 *
 * Implements FERPA (Family Educational Rights and Privacy Act)
 * compliance checks and utilities.
 *
 * Features:
 * - Access control validation
 * - PII field identification
 * - Consent verification
 * - Directory information management
 * - Amendment request handling
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EvidenceLogger } from './evidence-logger';

// Fields containing Personally Identifiable Information (PII)
export const PII_FIELDS = [
  'first_name',
  'last_name',
  'date_of_birth',
  'social_security_number',
  'address',
  'phone_number',
  'email',
  'parent_guardian_info',
  'emergency_contacts',
  'medical_information',
  'disciplinary_records',
  'grades',
  'attendance_records',
  'test_scores',
  'psychological_reports',
  'iep_documents',
  '504_plans',
] as const;

// Directory information (can be disclosed without consent)
export const DIRECTORY_INFORMATION = [
  'name',
  'address',
  'phone_number',
  'email',
  'date_of_birth',
  'grade_level',
  'enrollment_status',
  'participation_activities',
  'awards_honors',
  'school_attended',
] as const;

// FERPA exceptions for disclosure without consent
export const FERPA_EXCEPTIONS = [
  'school_officials',           // School officials with legitimate educational interest
  'other_schools',              // Other schools where student seeks to enroll
  'directory_information',      // Directory information (if not opted out)
  'health_safety_emergency',    // Health or safety emergency
  'judicial_order',             // Compliance with judicial order or subpoena
  'state_education_authorities',// State and local education authorities
  'financial_aid',              // In connection with financial aid
  'accreditation',              // Accrediting organizations
  'studies',                    // Studies for or on behalf of school
  'audit_evaluation',           // Audit or evaluation of programs
] as const;

export type FerpaException = typeof FERPA_EXCEPTIONS[number];

export interface AccessRequest {
  userId: string;
  userRole: string;
  studentId: string;
  fieldsRequested: string[];
  purpose: string;
}

export interface AccessDecision {
  granted: boolean;
  allowedFields: string[];
  deniedFields: string[];
  reason: string;
  exception: FerpaException | null;
  requiresLogging: boolean;
}

export interface AmendmentRequest {
  id: string;
  studentId: string;
  requestedBy: string;       // Parent/guardian or eligible student
  requestedAt: Date;
  fieldToAmend: string;
  currentValue: string;
  requestedValue: string;
  justification: string;
  status: 'pending' | 'approved' | 'denied' | 'hearing_requested';
  decidedAt: Date | null;
  decidedBy: string | null;
  decisionReason: string | null;
}

/**
 * FERPA Compliance Manager
 *
 * Validates access requests and manages FERPA-compliant operations
 */
export class FerpaComplianceManager {
  private schoolId: string;
  private evidenceLogger: EvidenceLogger;
  private directoryOptOuts: Set<string> = new Set();

  constructor(schoolId: string) {
    this.schoolId = schoolId;
    this.evidenceLogger = new EvidenceLogger(schoolId);
  }

  /**
   * Initialize by loading directory information opt-outs
   */
  async initialize(): Promise<void> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('directory_opt_outs')
      .select('student_id')
      .eq('school_id', this.schoolId)
      .eq('opted_out', true);

    if (data) {
      for (const record of data) {
        this.directoryOptOuts.add(record.student_id);
      }
    }
  }

  /**
   * Evaluate an access request against FERPA rules
   */
  async evaluateAccess(request: AccessRequest): Promise<AccessDecision> {
    // Check if user has legitimate educational interest
    const hasLegitimateInterest = await this.checkLegitimateEducationalInterest(
      request.userId,
      request.userRole,
      request.studentId
    );

    if (!hasLegitimateInterest) {
      await this.evidenceLogger.logAccessDenied(
        request.userId,
        'student',
        request.studentId,
        'No legitimate educational interest'
      );

      return {
        granted: false,
        allowedFields: [],
        deniedFields: request.fieldsRequested,
        reason: 'Access denied: No legitimate educational interest in this student',
        exception: null,
        requiresLogging: true,
      };
    }

    // Separate fields into categories
    const allowedFields: string[] = [];
    const deniedFields: string[] = [];

    for (const field of request.fieldsRequested) {
      const accessAllowed = await this.canAccessField(
        request.userId,
        request.userRole,
        request.studentId,
        field
      );

      if (accessAllowed) {
        allowedFields.push(field);
      } else {
        deniedFields.push(field);
      }
    }

    // Determine if full access was granted
    const granted = deniedFields.length === 0;

    return {
      granted,
      allowedFields,
      deniedFields,
      reason: granted
        ? 'Access granted under FERPA school official exception'
        : `Partial access: ${deniedFields.length} field(s) restricted`,
      exception: 'school_officials',
      requiresLogging: true,
    };
  }

  /**
   * Check if user has legitimate educational interest
   */
  private async checkLegitimateEducationalInterest(
    userId: string,
    userRole: string,
    studentId: string
  ): Promise<boolean> {
    // Roles that always have legitimate interest
    const alwaysAllowedRoles = ['admin', 'principal', 'assistant_principal', 'counselor'];
    if (alwaysAllowedRoles.includes(userRole)) {
      return true;
    }

    // Teachers need direct relationship with student
    if (userRole === 'teacher') {
      return this.hasTeacherStudentRelationship(userId, studentId);
    }

    // Support staff may have limited access
    if (userRole === 'support_staff') {
      return this.hasSupportStaffRelationship(userId, studentId);
    }

    return false;
  }

  /**
   * Check if teacher teaches the student
   */
  private async hasTeacherStudentRelationship(userId: string, studentId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    // Check if teacher is assigned to student's homeroom or classes
    const { data: student } = await supabase
      .from('students')
      .select('homeroom_teacher')
      .eq('id', studentId)
      .single();

    if (!student) return false;

    // Check homeroom assignment
    const { data: user } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (user) {
      const teacherName = `${user.first_name} ${user.last_name}`;
      if (student.homeroom_teacher === teacherName) {
        return true;
      }
    }

    // Check section enrollments
    const { data: enrollments } = await supabase
      .from('section_enrollments')
      .select('section_id')
      .eq('student_id', studentId);

    if (!enrollments) return false;

    const sectionIds = enrollments.map((e) => e.section_id);

    const { data: sections } = await supabase
      .from('sections')
      .select('teacher_id')
      .in('id', sectionIds)
      .eq('teacher_id', userId);

    return (sections?.length || 0) > 0;
  }

  /**
   * Check if support staff has relationship with student
   */
  private async hasSupportStaffRelationship(userId: string, studentId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    // Check if user is assigned to student's interventions
    const { data } = await supabase
      .from('interventions')
      .select('id')
      .eq('student_id', studentId)
      .or(`assigned_to_user_id.eq.${userId},created_by_user_id.eq.${userId}`);

    return (data?.length || 0) > 0;
  }

  /**
   * Check if user can access a specific field
   */
  private async canAccessField(
    userId: string,
    userRole: string,
    studentId: string,
    field: string
  ): Promise<boolean> {
    // Admins and principals can access all fields
    if (['admin', 'principal'].includes(userRole)) {
      return true;
    }

    // Check if it's directory information
    if (DIRECTORY_INFORMATION.includes(field as typeof DIRECTORY_INFORMATION[number])) {
      // Check if student has opted out
      return !this.directoryOptOuts.has(studentId);
    }

    // Restricted fields for counselors
    const counselorRestrictedFields = ['grades', 'test_scores', 'attendance_records'];
    if (userRole === 'counselor') {
      // Counselors can access most fields except grades (unless in IEP context)
      return !counselorRestrictedFields.includes(field) ||
             (await this.hasIepAccess(userId, studentId));
    }

    // Teachers can access educational records for their students
    const teacherAllowedFields = [
      'first_name', 'last_name', 'grade_level', 'attendance_records',
      'grades', 'test_scores', 'has_iep', 'has_504_plan', 'is_english_learner',
    ];
    if (userRole === 'teacher') {
      return teacherAllowedFields.includes(field);
    }

    // Restricted by default
    return false;
  }

  /**
   * Check if user has IEP access for student
   */
  private async hasIepAccess(userId: string, studentId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('iep_team_members')
      .select('id')
      .eq('student_id', studentId)
      .eq('user_id', userId);

    return (data?.length || 0) > 0;
  }

  /**
   * Check if disclosure requires consent
   */
  checkConsentRequired(
    recipientType: string,
    fieldsIncluded: string[]
  ): { required: boolean; reason: string } {
    // Check for FERPA exceptions
    if (FERPA_EXCEPTIONS.includes(recipientType as FerpaException)) {
      return {
        required: false,
        reason: `FERPA exception applies: ${recipientType}`,
      };
    }

    // Check if only directory information
    const hasNonDirectory = fieldsIncluded.some(
      (f) => !DIRECTORY_INFORMATION.includes(f as typeof DIRECTORY_INFORMATION[number])
    );

    if (!hasNonDirectory) {
      return {
        required: false,
        reason: 'Only directory information included',
      };
    }

    return {
      required: true,
      reason: 'Disclosure includes protected educational records',
    };
  }

  /**
   * Submit amendment request
   */
  async submitAmendmentRequest(
    request: Omit<AmendmentRequest, 'id' | 'status' | 'decidedAt' | 'decidedBy' | 'decisionReason'>
  ): Promise<string> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('amendment_requests')
      .insert({
        school_id: this.schoolId,
        student_id: request.studentId,
        requested_by: request.requestedBy,
        requested_at: request.requestedAt.toISOString(),
        field_to_amend: request.fieldToAmend,
        current_value: request.currentValue,
        requested_value: request.requestedValue,
        justification: request.justification,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      throw new Error('Failed to submit amendment request');
    }

    // Log the request
    await this.evidenceLogger.logEvent({
      schoolId: this.schoolId,
      userId: request.requestedBy,
      eventType: 'data_modification',
      action: 'amendment_requested',
      resourceType: 'student',
      resourceId: request.studentId,
      studentIds: [request.studentId],
      dataClassification: 'confidential',
      description: `Amendment request for field: ${request.fieldToAmend}`,
      justification: request.justification,
      ipAddress: null,
      userAgent: null,
      metadata: {
        requestId: data.id,
        field: request.fieldToAmend,
      },
    });

    return data.id;
  }

  /**
   * Process amendment request decision
   */
  async processAmendmentDecision(
    requestId: string,
    decision: 'approved' | 'denied',
    decidedBy: string,
    reason: string
  ): Promise<void> {
    const supabase = await createServerSupabaseClient();

    // Get the request details
    const { data: request } = await supabase
      .from('amendment_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) {
      throw new Error('Amendment request not found');
    }

    // Update request status
    await supabase
      .from('amendment_requests')
      .update({
        status: decision,
        decided_at: new Date().toISOString(),
        decided_by: decidedBy,
        decision_reason: reason,
      })
      .eq('id', requestId);

    // If approved, update the student record
    if (decision === 'approved') {
      await supabase
        .from('students')
        .update({
          [request.field_to_amend]: request.requested_value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.student_id);

      // Log the modification
      await this.evidenceLogger.logEvent({
        schoolId: this.schoolId,
        userId: decidedBy,
        eventType: 'data_modification',
        action: 'amendment_applied',
        resourceType: 'student',
        resourceId: request.student_id,
        studentIds: [request.student_id],
        dataClassification: 'confidential',
        description: `Amendment approved and applied: ${request.field_to_amend}`,
        justification: reason,
        ipAddress: null,
        userAgent: null,
        metadata: {
          requestId,
          field: request.field_to_amend,
          oldValue: request.current_value,
          newValue: request.requested_value,
        },
      });
    }
  }

  /**
   * Record directory information opt-out
   */
  async recordOptOut(studentId: string, optOut: boolean, recordedBy: string): Promise<void> {
    const supabase = await createServerSupabaseClient();

    await supabase
      .from('directory_opt_outs')
      .upsert({
        school_id: this.schoolId,
        student_id: studentId,
        opted_out: optOut,
        recorded_at: new Date().toISOString(),
        recorded_by: recordedBy,
      });

    if (optOut) {
      this.directoryOptOuts.add(studentId);
    } else {
      this.directoryOptOuts.delete(studentId);
    }

    // Log the opt-out recording
    await this.evidenceLogger.logEvent({
      schoolId: this.schoolId,
      userId: recordedBy,
      eventType: 'consent_recorded',
      action: optOut ? 'directory_opt_out' : 'directory_opt_in',
      resourceType: 'student',
      resourceId: studentId,
      studentIds: [studentId],
      dataClassification: 'internal',
      description: `Directory information ${optOut ? 'opt-out' : 'opt-in'} recorded`,
      justification: null,
      ipAddress: null,
      userAgent: null,
      metadata: {
        optedOut: optOut,
      },
    });
  }

  /**
   * Get pending amendment requests
   */
  async getPendingAmendmentRequests(): Promise<AmendmentRequest[]> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('amendment_requests')
      .select('*')
      .eq('school_id', this.schoolId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });

    if (!data) return [];

    return data.map((r) => ({
      id: r.id,
      studentId: r.student_id,
      requestedBy: r.requested_by,
      requestedAt: new Date(r.requested_at),
      fieldToAmend: r.field_to_amend,
      currentValue: r.current_value,
      requestedValue: r.requested_value,
      justification: r.justification,
      status: r.status,
      decidedAt: r.decided_at ? new Date(r.decided_at) : null,
      decidedBy: r.decided_by,
      decisionReason: r.decision_reason,
    }));
  }

  /**
   * Identify PII fields in a dataset
   */
  identifyPiiFields(fields: string[]): { piiFields: string[]; nonPiiFields: string[] } {
    const piiFields: string[] = [];
    const nonPiiFields: string[] = [];

    for (const field of fields) {
      if (PII_FIELDS.includes(field as typeof PII_FIELDS[number])) {
        piiFields.push(field);
      } else {
        nonPiiFields.push(field);
      }
    }

    return { piiFields, nonPiiFields };
  }

  /**
   * Redact PII from a record for unauthorized access
   */
  redactPii<T extends Record<string, unknown>>(
    record: T,
    allowedFields: string[]
  ): T {
    const redacted = { ...record };

    for (const field of Object.keys(redacted)) {
      if (!allowedFields.includes(field) && PII_FIELDS.includes(field as typeof PII_FIELDS[number])) {
        (redacted as Record<string, unknown>)[field] = '[REDACTED]';
      }
    }

    return redacted;
  }
}

/**
 * Create a FERPA compliance manager for a school
 */
export function createFerpaManager(schoolId: string): FerpaComplianceManager {
  return new FerpaComplianceManager(schoolId);
}
