// Tables compliance_events, consent_records, compliance_reports are defined but not yet migrated to DB
import type { Json } from '@/lib/database.types';

/**
 * Evidence and Compliance Logger
 * ===============================
 *
 * Layer 4: FERPA-compliant audit trails and evidence collection
 * for student data access and educational interventions.
 *
 * Features:
 * - Comprehensive audit logging
 * - FERPA compliance tracking
 * - Data access reports
 * - Retention policy management
 * - Export capabilities for audits
 */

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

// Compliance event types
export type ComplianceEventType =
  | 'data_access'           // Any student data access
  | 'data_export'           // Data exported outside system
  | 'data_modification'     // Student record modified
  | 'data_deletion'         // Student data deleted
  | 'consent_recorded'      // Parent/guardian consent logged
  | 'disclosure'            // Data disclosed to third party
  | 'access_denied'         // Unauthorized access attempt
  | 'intervention_action'   // Action taken on intervention
  | 'report_generated'      // Report containing PII generated
  | 'bulk_access'           // Bulk data access
  | 'system_action';        // Automated system action

// Data classification levels
export type DataClassification =
  | 'public'                // Non-PII, publicly available
  | 'internal'              // Internal use only
  | 'confidential'          // Contains PII
  | 'restricted';           // Sensitive PII (health, discipline)

export interface ComplianceEvent {
  id: string;
  schoolId: string;
  userId: string | null;
  eventType: ComplianceEventType;
  action: string;
  resourceType: string;
  resourceId: string | null;
  studentIds: string[];
  dataClassification: DataClassification;
  description: string;
  justification: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  retentionUntil: Date;
}

export interface DataAccessRecord {
  userId: string;
  userName: string;
  userRole: string;
  accessTime: Date;
  accessType: 'view' | 'edit' | 'export' | 'delete';
  recordsAccessed: number;
  studentIds: string[];
  justification: string | null;
}

export interface ConsentRecord {
  id: string;
  studentId: string;
  guardianName: string;
  guardianEmail: string;
  consentType: 'data_collection' | 'data_sharing' | 'photo_video' | 'third_party';
  granted: boolean;
  grantedAt: Date;
  expiresAt: Date | null;
  documentUrl: string | null;
  recordedBy: string;
}

export interface ComplianceReport {
  schoolId: string;
  reportType: 'ferpa_audit' | 'data_access' | 'disclosure' | 'retention';
  period: { start: Date; end: Date };
  generatedAt: Date;
  generatedBy: string;
  summary: {
    totalEvents: number;
    byEventType: Record<string, number>;
    byUser: Record<string, number>;
    uniqueStudentsAccessed: number;
  };
  events: ComplianceEvent[];
}

// FERPA retention requirements (in years)
const RETENTION_PERIODS: Record<string, number> = {
  'data_access': 5,
  'data_export': 7,
  'data_modification': 7,
  'data_deletion': 10,
  'consent_recorded': 7,
  'disclosure': 7,
  'access_denied': 3,
  'intervention_action': 7,
  'report_generated': 5,
  'bulk_access': 7,
  'system_action': 3,
};

/**
 * Evidence and Compliance Logger
 *
 * Central logging system for all compliance-related events
 */
export class EvidenceLogger {
  private schoolId: string;

  constructor(schoolId: string) {
    this.schoolId = schoolId;
  }

  /**
   * Log a compliance event
   */
  async logEvent(event: Omit<ComplianceEvent, 'id' | 'createdAt' | 'retentionUntil'>): Promise<string> {
    const supabase = createAdminSupabaseClient();

    // Calculate retention period
    const retentionYears = RETENTION_PERIODS[event.eventType] || 5;
    const retentionUntil = new Date();
    retentionUntil.setFullYear(retentionUntil.getFullYear() + retentionYears);

    const record = {
      school_id: event.schoolId,
      user_id: event.userId,
      event_type: event.eventType,
      action: event.action,
      resource_type: event.resourceType,
      resource_id: event.resourceId,
      student_ids: event.studentIds,
      data_classification: event.dataClassification,
      description: event.description,
      justification: event.justification,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      metadata: event.metadata as Json,
      retention_until: retentionUntil.toISOString(),
    };

    const { data, error } = await (supabase as any)
      .from('compliance_events')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      console.error('[Compliance] Error logging event:', error);
      throw new Error('Failed to log compliance event');
    }

    return data.id;
  }

  /**
   * Log student data access (convenience method)
   */
  async logDataAccess(
    userId: string,
    studentIds: string[],
    accessType: 'view' | 'edit' | 'export',
    resourceType: string,
    justification?: string
  ): Promise<string> {
    const headersList = await headers();

    return this.logEvent({
      schoolId: this.schoolId,
      userId,
      eventType: 'data_access',
      action: accessType,
      resourceType,
      resourceId: null,
      studentIds,
      dataClassification: 'confidential',
      description: `${accessType} access to ${studentIds.length} student record(s)`,
      justification: justification || null,
      ipAddress: headersList.get('x-forwarded-for')?.split(',')[0] || null,
      userAgent: headersList.get('user-agent') || null,
      metadata: {
        studentCount: studentIds.length,
        accessType,
      },
    });
  }

  /**
   * Log data export event
   */
  async logDataExport(
    userId: string,
    studentIds: string[],
    exportFormat: string,
    destination: string,
    justification: string
  ): Promise<string> {
    const headersList = await headers();

    return this.logEvent({
      schoolId: this.schoolId,
      userId,
      eventType: 'data_export',
      action: 'export',
      resourceType: 'student_data',
      resourceId: null,
      studentIds,
      dataClassification: 'confidential',
      description: `Exported ${studentIds.length} student records to ${exportFormat} for ${destination}`,
      justification,
      ipAddress: headersList.get('x-forwarded-for')?.split(',')[0] || null,
      userAgent: headersList.get('user-agent') || null,
      metadata: {
        exportFormat,
        destination,
        recordCount: studentIds.length,
      },
    });
  }

  /**
   * Log disclosure to third party
   */
  async logDisclosure(
    userId: string,
    studentIds: string[],
    recipientOrg: string,
    recipientPurpose: string,
    legalBasis: string,
    consentObtained: boolean
  ): Promise<string> {
    const headersList = await headers();

    return this.logEvent({
      schoolId: this.schoolId,
      userId,
      eventType: 'disclosure',
      action: 'disclose',
      resourceType: 'student_data',
      resourceId: null,
      studentIds,
      dataClassification: 'restricted',
      description: `Disclosed ${studentIds.length} student records to ${recipientOrg}`,
      justification: `Purpose: ${recipientPurpose}. Legal basis: ${legalBasis}`,
      ipAddress: headersList.get('x-forwarded-for')?.split(',')[0] || null,
      userAgent: headersList.get('user-agent') || null,
      metadata: {
        recipientOrg,
        recipientPurpose,
        legalBasis,
        consentObtained,
        recordCount: studentIds.length,
      },
    });
  }

  /**
   * Log intervention action
   */
  async logInterventionAction(
    userId: string,
    interventionId: string,
    studentId: string,
    action: string,
    details: string
  ): Promise<string> {
    const headersList = await headers();

    return this.logEvent({
      schoolId: this.schoolId,
      userId,
      eventType: 'intervention_action',
      action,
      resourceType: 'intervention',
      resourceId: interventionId,
      studentIds: [studentId],
      dataClassification: 'confidential',
      description: `Intervention action: ${action} - ${details}`,
      justification: 'Educational support activity',
      ipAddress: headersList.get('x-forwarded-for')?.split(',')[0] || null,
      userAgent: headersList.get('user-agent') || null,
      metadata: {
        interventionId,
        actionType: action,
      },
    });
  }

  /**
   * Log access denied event
   */
  async logAccessDenied(
    userId: string,
    resourceType: string,
    resourceId: string,
    reason: string
  ): Promise<string> {
    const headersList = await headers();

    return this.logEvent({
      schoolId: this.schoolId,
      userId,
      eventType: 'access_denied',
      action: 'denied',
      resourceType,
      resourceId,
      studentIds: [],
      dataClassification: 'internal',
      description: `Access denied to ${resourceType}: ${reason}`,
      justification: null,
      ipAddress: headersList.get('x-forwarded-for')?.split(',')[0] || null,
      userAgent: headersList.get('user-agent') || null,
      metadata: {
        reason,
        attemptedResource: resourceId,
      },
    });
  }

  /**
   * Record consent from parent/guardian
   */
  async recordConsent(consent: Omit<ConsentRecord, 'id'>): Promise<string> {
    const supabase = createAdminSupabaseClient();

    const record = {
      school_id: this.schoolId,
      student_id: consent.studentId,
      guardian_name: consent.guardianName,
      guardian_email: consent.guardianEmail,
      consent_type: consent.consentType,
      granted: consent.granted,
      granted_at: consent.grantedAt.toISOString(),
      expires_at: consent.expiresAt?.toISOString() || null,
      document_url: consent.documentUrl,
      recorded_by: consent.recordedBy,
    };

    const { data, error } = await (supabase as any)
      .from('consent_records')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      console.error('[Compliance] Error recording consent:', error);
      throw new Error('Failed to record consent');
    }

    // Log the consent recording event
    await this.logEvent({
      schoolId: this.schoolId,
      userId: consent.recordedBy,
      eventType: 'consent_recorded',
      action: consent.granted ? 'consent_granted' : 'consent_denied',
      resourceType: 'consent',
      resourceId: data.id,
      studentIds: [consent.studentId],
      dataClassification: 'confidential',
      description: `Consent ${consent.granted ? 'granted' : 'denied'} for ${consent.consentType}`,
      justification: null,
      ipAddress: null,
      userAgent: null,
      metadata: {
        consentType: consent.consentType,
        guardianEmail: consent.guardianEmail,
      },
    });

    return data.id;
  }

  /**
   * Get consent status for a student
   */
  async getConsentStatus(studentId: string): Promise<ConsentRecord[]> {
    const supabase = await createServerSupabaseClient();

    const { data } = await (supabase as any)
      .from('consent_records')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', this.schoolId)
      .order('granted_at', { ascending: false });

    if (!data) return [];

    return data.map((c: any) => ({
      id: c.id,
      studentId: c.student_id,
      guardianName: c.guardian_name,
      guardianEmail: c.guardian_email,
      consentType: c.consent_type as ConsentRecord['consentType'],
      granted: c.granted,
      grantedAt: new Date(c.granted_at),
      expiresAt: c.expires_at ? new Date(c.expires_at) : null,
      documentUrl: c.document_url,
      recordedBy: c.recorded_by,
    }));
  }

  /**
   * Generate compliance report
   */
  async generateReport(
    reportType: ComplianceReport['reportType'],
    startDate: Date,
    endDate: Date,
    generatedBy: string
  ): Promise<ComplianceReport> {
    const supabase = await createServerSupabaseClient();

    // Fetch events for the period
    const { data: events } = await (supabase as any)
      .from('compliance_events')
      .select('*')
      .eq('school_id', this.schoolId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    const complianceEvents: ComplianceEvent[] = (events || []).map((e: any) => ({
      id: e.id,
      schoolId: e.school_id,
      userId: e.user_id,
      eventType: e.event_type as ComplianceEventType,
      action: e.action,
      resourceType: e.resource_type,
      resourceId: e.resource_id,
      studentIds: e.student_ids || [],
      dataClassification: e.data_classification as DataClassification,
      description: e.description,
      justification: e.justification,
      ipAddress: e.ip_address,
      userAgent: e.user_agent,
      metadata: (e.metadata || {}) as Record<string, unknown>,
      createdAt: new Date(e.created_at),
      retentionUntil: new Date(e.retention_until),
    }));

    // Calculate summary statistics
    const byEventType: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const uniqueStudents = new Set<string>();

    for (const event of complianceEvents) {
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;
      if (event.userId) {
        byUser[event.userId] = (byUser[event.userId] || 0) + 1;
      }
      for (const studentId of event.studentIds) {
        uniqueStudents.add(studentId);
      }
    }

    const report: ComplianceReport = {
      schoolId: this.schoolId,
      reportType,
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      generatedBy,
      summary: {
        totalEvents: complianceEvents.length,
        byEventType,
        byUser,
        uniqueStudentsAccessed: uniqueStudents.size,
      },
      events: complianceEvents,
    };

    // Log report generation
    await this.logEvent({
      schoolId: this.schoolId,
      userId: generatedBy,
      eventType: 'report_generated',
      action: 'generate',
      resourceType: 'compliance_report',
      resourceId: null,
      studentIds: Array.from(uniqueStudents),
      dataClassification: 'confidential',
      description: `Generated ${reportType} report for ${startDate.toDateString()} to ${endDate.toDateString()}`,
      justification: 'Compliance audit',
      ipAddress: null,
      userAgent: null,
      metadata: {
        reportType,
        eventCount: complianceEvents.length,
        uniqueStudents: uniqueStudents.size,
      },
    });

    // Store report for future reference
    await supabase.from('compliance_reports').insert({
      school_id: this.schoolId,
      report_type: reportType,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
      generated_by: generatedBy,
      summary: report.summary,
    });

    return report;
  }

  /**
   * Get data access history for a student
   */
  async getStudentAccessHistory(
    studentId: string,
    limit = 100
  ): Promise<DataAccessRecord[]> {
    const supabase = await createServerSupabaseClient();

    const { data } = await (supabase as any)
      .from('compliance_events')
      .select(`
        *,
        user:users(first_name, last_name, email)
      `)
      .eq('school_id', this.schoolId)
      .contains('student_ids', [studentId])
      .in('event_type', ['data_access', 'data_export', 'data_modification'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((e: any) => ({
      userId: e.user_id || 'system',
      userName: e.user ? `${(e.user as { first_name: string; last_name: string }).first_name} ${(e.user as { first_name: string; last_name: string }).last_name}` : 'System',
      userRole: 'Unknown',
      accessTime: new Date(e.created_at),
      accessType: e.action as 'view' | 'edit' | 'export' | 'delete',
      recordsAccessed: e.student_ids?.length || 1,
      studentIds: e.student_ids || [],
      justification: e.justification,
    }));
  }

  /**
   * Clean up expired records based on retention policy
   */
  async cleanupExpiredRecords(): Promise<{ deletedCount: number }> {
    const supabase = createAdminSupabaseClient();

    const now = new Date();

    // Delete events past retention period
    const { data } = await (supabase as any)
      .from('compliance_events')
      .delete()
      .eq('school_id', this.schoolId)
      .lt('retention_until', now.toISOString())
      .select('id');

    return { deletedCount: data?.length || 0 };
  }

  /**
   * Get compliance summary statistics
   */
  async getComplianceSummary(days = 30): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    topAccessors: Array<{ userId: string; accessCount: number }>;
    riskyEvents: number;
    avgDailyAccess: number;
  }> {
    const supabase = await createServerSupabaseClient();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data: events } = await (supabase as any)
      .from('compliance_events')
      .select('event_type, user_id, data_classification')
      .eq('school_id', this.schoolId)
      .gte('created_at', startDate.toISOString());

    if (!events || events.length === 0) {
      return {
        totalEvents: 0,
        eventsByType: {},
        topAccessors: [],
        riskyEvents: 0,
        avgDailyAccess: 0,
      };
    }

    // Count by event type
    const eventsByType: Record<string, number> = {};
    const accessByUser: Record<string, number> = {};
    let riskyEvents = 0;

    for (const event of events) {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;

      if (event.user_id) {
        accessByUser[event.user_id] = (accessByUser[event.user_id] || 0) + 1;
      }

      if (event.data_classification === 'restricted' ||
          event.event_type === 'access_denied' ||
          event.event_type === 'bulk_access') {
        riskyEvents++;
      }
    }

    // Get top accessors
    const topAccessors = Object.entries(accessByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, accessCount]) => ({ userId, accessCount }));

    return {
      totalEvents: events.length,
      eventsByType,
      topAccessors,
      riskyEvents,
      avgDailyAccess: Math.round(events.length / days),
    };
  }
}

/**
 * Create an evidence logger for a school
 */
export function createEvidenceLogger(schoolId: string): EvidenceLogger {
  return new EvidenceLogger(schoolId);
}
