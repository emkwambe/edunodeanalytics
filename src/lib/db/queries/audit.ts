import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import type { AuditLogInsert } from '@/lib/database.types';

/**
 * Audit Logging
 *
 * SOC2-compliant audit trail for all data access events
 */

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'login'
  | 'logout'
  | 'permission_change'
  | 'settings_change';

export type ResourceType =
  | 'student'
  | 'staff'
  | 'report'
  | 'dashboard'
  | 'school'
  | 'user'
  | 'integration'
  | 'export';

interface AuditLogOptions {
  schoolId?: string;
  userId?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event
 *
 * Should be called for:
 * - Any student data access (FERPA compliance)
 * - Data exports
 * - Permission changes
 * - Settings changes
 * - Login/logout events
 */
export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const headersList = headers();

  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || null;
  const userAgent = headersList.get('user-agent') || null;

  const auditLog: AuditLogInsert = {
    school_id: options.schoolId || null,
    user_id: options.userId || null,
    action: options.action,
    resource_type: options.resourceType,
    resource_id: options.resourceId || null,
    old_values: options.oldValues || null,
    new_values: options.newValues || null,
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: options.metadata || null,
  };

  const { error } = await supabase.from('audit_logs').insert(auditLog);

  if (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('[AUDIT] Failed to log event:', error);
  }
}

/**
 * Log student data access (FERPA compliance)
 */
export async function logStudentDataAccess(
  userId: string,
  schoolId: string,
  studentIds: string[],
  accessType: 'view' | 'export'
): Promise<void> {
  await logAuditEvent({
    userId,
    schoolId,
    action: accessType === 'export' ? 'export' : 'read',
    resourceType: 'student',
    metadata: {
      student_count: studentIds.length,
      student_ids: studentIds.slice(0, 100), // Limit to first 100 for storage
      access_type: accessType,
    },
  });
}

/**
 * Log data export event
 */
export async function logDataExport(
  userId: string,
  schoolId: string,
  exportType: string,
  recordCount: number
): Promise<void> {
  await logAuditEvent({
    userId,
    schoolId,
    action: 'export',
    resourceType: 'export',
    metadata: {
      export_type: exportType,
      record_count: recordCount,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log permission change
 */
export async function logPermissionChange(
  adminUserId: string,
  schoolId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await logAuditEvent({
    userId: adminUserId,
    schoolId,
    action: 'permission_change',
    resourceType: 'user',
    resourceId: targetUserId,
    oldValues: { role: oldRole },
    newValues: { role: newRole },
  });
}

/**
 * Log login event
 */
export async function logLoginEvent(
  userId: string,
  schoolSlug?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'login',
    resourceType: 'user',
    metadata: {
      school_slug: schoolSlug,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(
  schoolId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    action?: AuditAction;
    resourceType?: ResourceType;
    userId?: string;
    limit?: number;
    offset?: number;
  }
) {
  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from('audit_logs')
    .select('*, user:users(email, first_name, last_name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (options.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }

  if (options.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  if (options.action) {
    query = query.eq('action', options.action);
  }

  if (options.resourceType) {
    query = query.eq('resource_type', options.resourceType);
  }

  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AUDIT] Error querying logs:', error);
    return [];
  }

  return data;
}
