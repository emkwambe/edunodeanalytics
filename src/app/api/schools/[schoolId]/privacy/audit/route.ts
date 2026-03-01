/**
 * Privacy Audit Log API
 *
 * Provides FERPA-compliant audit logging for all external data transmissions,
 * including AI API calls and data exports.
 *
 * GET /api/schools/[schoolId]/privacy/audit
 * - Returns audit log entries for the school
 * - Supports filtering by feature, date range, and user
 *
 * POST /api/schools/[schoolId]/privacy/audit
 * - Records a new audit event (internal use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SecureAIProxy } from '@/lib/privacy';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  schoolId: string;
  userId: string;
  eventType: 'ai_call' | 'data_export' | 'webhook_send' | 'api_access';
  feature: string;
  anonymizationLevel: string;
  recordCount: number;
  fieldsIncluded: string[];
  piiDetected: boolean;
  destinationType: 'internal' | 'external_ai' | 'external_webhook' | 'file_export';
  destinationName: string;
  successful: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory audit log (in production, this would be stored in database)
const privacyAuditLog: AuditLogEntry[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { schoolId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const feature = searchParams.get('feature');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get AI audit logs from SecureAIProxy
    const aiAuditLogs = SecureAIProxy.getAuditLog(schoolId, {
      limit: limit,
      feature: feature || undefined,
    });

    // Convert AI audit logs to common format
    const formattedAILogs: AuditLogEntry[] = aiAuditLogs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      schoolId: log.schoolId,
      userId: log.userId,
      eventType: 'ai_call' as const,
      feature: log.feature,
      anonymizationLevel: log.anonymizationLevel,
      recordCount: log.studentCount,
      fieldsIncluded: log.fieldsSanitized,
      piiDetected: log.piiDetected,
      destinationType: 'external_ai' as const,
      destinationName: log.provider,
      successful: log.responseReceived,
      errorMessage: log.error,
    }));

    // Combine with other audit logs
    let allLogs = [...formattedAILogs, ...privacyAuditLog.filter(l => l.schoolId === schoolId)];

    // Apply filters
    if (eventType) {
      allLogs = allLogs.filter(l => l.eventType === eventType);
    }
    if (startDate) {
      const start = new Date(startDate);
      allLogs = allLogs.filter(l => new Date(l.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      allLogs = allLogs.filter(l => new Date(l.timestamp) <= end);
    }

    // Sort by timestamp descending
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const total = allLogs.length;
    const paginatedLogs = allLogs.slice(offset, offset + limit);

    // Calculate summary statistics
    const summary = {
      totalEvents: total,
      aiCallCount: allLogs.filter(l => l.eventType === 'ai_call').length,
      exportCount: allLogs.filter(l => l.eventType === 'data_export').length,
      webhookCount: allLogs.filter(l => l.eventType === 'webhook_send').length,
      piiDetectedCount: allLogs.filter(l => l.piiDetected).length,
      anonymizationRate: total > 0
        ? Math.round((allLogs.filter(l => l.anonymizationLevel !== 'none').length / total) * 100)
        : 100,
    };

    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      summary,
    });
  } catch (error) {
    console.error('Privacy audit log fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { schoolId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.eventType || !body.feature) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, feature' },
        { status: 400 }
      );
    }

    // Create audit entry
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      schoolId,
      userId,
      eventType: body.eventType,
      feature: body.feature,
      anonymizationLevel: body.anonymizationLevel || 'none',
      recordCount: body.recordCount || 0,
      fieldsIncluded: body.fieldsIncluded || [],
      piiDetected: body.piiDetected || false,
      destinationType: body.destinationType || 'internal',
      destinationName: body.destinationName || 'unknown',
      successful: body.successful !== false,
      errorMessage: body.errorMessage,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    // Store audit entry
    privacyAuditLog.push(entry);

    // Log to console for monitoring
    console.log('[Privacy Audit]', {
      id: entry.id,
      eventType: entry.eventType,
      feature: entry.feature,
      recordCount: entry.recordCount,
      piiDetected: entry.piiDetected,
      anonymizationLevel: entry.anonymizationLevel,
    });

    return NextResponse.json({
      success: true,
      auditId: entry.id,
    });
  } catch (error) {
    console.error('Privacy audit log error:', error);
    return NextResponse.json(
      { error: 'Failed to record audit entry' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to log data export events
 * Call this from export endpoints
 */
export function logDataExport(
  schoolId: string,
  userId: string,
  feature: string,
  options: {
    recordCount: number;
    fieldsIncluded: string[];
    anonymizationLevel: string;
    exportFormat: string;
  }
): string {
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    schoolId,
    userId,
    eventType: 'data_export',
    feature,
    anonymizationLevel: options.anonymizationLevel,
    recordCount: options.recordCount,
    fieldsIncluded: options.fieldsIncluded,
    piiDetected: options.anonymizationLevel === 'none',
    destinationType: 'file_export',
    destinationName: options.exportFormat,
    successful: true,
  };

  privacyAuditLog.push(entry);

  console.log('[Privacy Audit - Export]', {
    id: entry.id,
    feature,
    recordCount: options.recordCount,
    anonymizationLevel: options.anonymizationLevel,
  });

  return entry.id;
}
