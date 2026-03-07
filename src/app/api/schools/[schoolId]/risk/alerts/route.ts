// src/app/api/schools/[schoolId]/risk/alerts/route.ts
/**
 * Risk Alerts API
 * GET: List alerts, filterable by status, severity, type.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, type RiskRouteParams } from '../_shared/auth';
import type { AlertStatus, AlertSeverity } from '@/lib/risk-engine/types';

export async function GET(request: NextRequest, { params }: RiskRouteParams) {
  const { schoolId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { adminSupabase } = authResult;
  const searchParams = request.nextUrl.searchParams;

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
  const status = searchParams.get('status') as AlertStatus | null;
  const severity = searchParams.get('severity') as AlertSeverity | null;
  const studentId = searchParams.get('studentId');
  const offset = (page - 1) * limit;

  try {
    let query = adminSupabase
      .from('risk_alerts')
      .select('*', { count: 'exact' })
      .eq('school_id', schoolId);

    if (status) {
      query = query.eq('status', status);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: alerts, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }

    // Enrich with student names
    const studentIds = [...new Set((alerts || []).map((a) => a.student_id))];
    let studentNameMap: Record<string, string> = {};

    if (studentIds.length > 0) {
      const { data: students } = await adminSupabase
        .from('students')
        .select('id, display_name')
        .in('id', studentIds);

      if (students) {
        studentNameMap = Object.fromEntries(
          students.map((s) => [s.id, s.display_name])
        );
      }
    }

    const formattedAlerts = (alerts || []).map((a) => ({
      id: a.id,
      studentId: a.student_id,
      studentName: studentNameMap[a.student_id] || 'Unknown',
      alertType: a.alert_type,
      severity: a.severity,
      status: a.status,
      title: a.title,
      message: a.message,
      riskScore: a.risk_score ? Number(a.risk_score) : null,
      riskLevel: a.risk_level,
      data: a.data,
      createdAt: a.created_at,
      acknowledgedAt: a.acknowledged_at,
      acknowledgedBy: a.acknowledged_by,
      resolvedAt: a.resolved_at,
      resolvedBy: a.resolved_by,
      resolutionNotes: a.resolution_notes,
      interventionId: a.intervention_id,
    }));

    return NextResponse.json({
      data: formattedAlerts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    console.error('[Risk Alerts API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}