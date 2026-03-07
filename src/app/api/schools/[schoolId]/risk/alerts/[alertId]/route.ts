// src/app/api/schools/[schoolId]/risk/alerts/[alertId]/route.ts
/**
 * Risk Alert Actions API
 * PATCH: Acknowledge, resolve, or dismiss an alert.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, type RiskAlertRouteParams } from '../../_shared/auth';

type AlertAction = 'acknowledge' | 'resolve' | 'dismiss';

export async function PATCH(request: NextRequest, { params }: RiskAlertRouteParams) {
  const { schoolId, alertId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { adminSupabase, userId } = authResult;

  try {
    const body = await request.json();
    const action = body.action as AlertAction;

    if (!['acknowledge', 'resolve', 'dismiss'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: acknowledge, resolve, or dismiss' },
        { status: 400 }
      );
    }

    // Verify alert exists and belongs to this school
    const { data: existing, error: fetchError } = await adminSupabase
      .from('risk_alerts')
      .select('id, status')
      .eq('id', alertId)
      .eq('school_id', schoolId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Build update based on action
    const update: Record<string, unknown> = {};
    const now = new Date().toISOString();

    switch (action) {
      case 'acknowledge':
        update.status = 'acknowledged';
        update.acknowledged_at = now;
        update.acknowledged_by = userId;
        break;

      case 'resolve':
        update.status = 'resolved';
        update.resolved_at = now;
        update.resolved_by = userId;
        if (body.notes) {
          update.resolution_notes = body.notes;
        }
        if (body.interventionId) {
          update.intervention_id = body.interventionId;
        }
        break;

      case 'dismiss':
        update.status = 'dismissed';
        update.resolved_at = now;
        update.resolved_by = userId;
        if (body.notes) {
          update.resolution_notes = body.notes;
        }
        break;
    }

    const { data: updated, error: updateError } = await adminSupabase
      .from('risk_alerts')
      .update(update)
      .eq('id', alertId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update alert: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ alert: updated });
  } catch (err) {
    console.error('[Risk Alert PATCH] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}