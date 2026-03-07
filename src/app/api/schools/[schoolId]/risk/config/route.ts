// src/app/api/schools/[schoolId]/risk/config/route.ts
/**
 * Risk Config API
 * GET:  Current active config for the school.
 * PUT:  Update weights/thresholds (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, isAdmin, type RiskRouteParams } from '../_shared/auth';
import { parseConfigRow } from '@/lib/risk-engine/types';
import type { RiskModelConfigRow } from '@/lib/risk-engine/types';

export async function GET(request: NextRequest, { params }: RiskRouteParams) {
  const { schoolId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { adminSupabase } = authResult;

  try {
    const { data, error } = await adminSupabase
      .from('risk_model_configs')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'No active risk config found for this school' },
        { status: 404 }
      );
    }

    const parsed = parseConfigRow(data as RiskModelConfigRow);

    return NextResponse.json({ config: parsed, raw: data });
  } catch (err) {
    console.error('[Risk Config API] GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RiskRouteParams) {
  const { schoolId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { role, adminSupabase, userId } = authResult;

  // Admin-only write
  if (!isAdmin(role)) {
    return NextResponse.json(
      { error: 'Only admins can update risk configuration' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Validate weights sum to ~1.0
    if (body.weights) {
      const w = body.weights;
      const sum = (w.attendance ?? 0) + (w.academic ?? 0) + (w.assignments ?? 0) +
                  (w.behavior ?? 0) + (w.trend ?? 0);
      if (Math.abs(sum - 1.0) >= 0.01) {
        return NextResponse.json(
          { error: `Weights must sum to 1.0 (current sum: ${sum})` },
          { status: 400 }
        );
      }
    }

    // Validate threshold ordering
    if (body.thresholds) {
      const t = body.thresholds;
      if (t.onTrack != null && t.watch != null && t.atRisk != null) {
        if (!(t.onTrack < t.watch && t.watch < t.atRisk && t.atRisk <= 1.0)) {
          return NextResponse.json(
            { error: 'Thresholds must be ordered: onTrack < watch < atRisk <= 1.0' },
            { status: 400 }
          );
        }
      }
    }

    // Build update payload (only set provided fields)
    const update: Record<string, unknown> = {};

    if (body.name) update.name = body.name;

    if (body.weights) {
      if (body.weights.attendance != null) update.weight_attendance = body.weights.attendance;
      if (body.weights.academic != null) update.weight_academic = body.weights.academic;
      if (body.weights.assignments != null) update.weight_assignments = body.weights.assignments;
      if (body.weights.behavior != null) update.weight_behavior = body.weights.behavior;
      if (body.weights.trend != null) update.weight_trend = body.weights.trend;
    }

    if (body.thresholds) {
      if (body.thresholds.onTrack != null) update.threshold_on_track = body.thresholds.onTrack;
      if (body.thresholds.watch != null) update.threshold_watch = body.thresholds.watch;
      if (body.thresholds.atRisk != null) update.threshold_at_risk = body.thresholds.atRisk;
    }

    if (body.indicators) {
      const ind = body.indicators;
      if (ind.attendanceFloor != null) update.attendance_floor = ind.attendanceFloor;
      if (ind.attendanceCritical != null) update.attendance_critical = ind.attendanceCritical;
      if (ind.assignmentMissingWarn != null) update.assignment_missing_warn = ind.assignmentMissingWarn;
      if (ind.behaviorIncidentCap != null) update.behavior_incident_cap = ind.behaviorIncidentCap;
      if (ind.assessmentFloorPct != null) update.assessment_floor_pct = ind.assessmentFloorPct;
      if (ind.trendLookbackWeeks != null) update.trend_lookback_weeks = ind.trendLookbackWeeks;
      if (ind.trendDeclineThreshold != null) update.trend_decline_threshold = ind.trendDeclineThreshold;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await adminSupabase
      .from('risk_model_configs')
      .update(update)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      console.error('[Risk Config API] PUT error:', error.message);
      return NextResponse.json(
        { error: `Failed to update config: ${error.message}` },
        { status: 500 }
      );
    }


    // Log the config change for audit trail
    await adminSupabase.from('audit_logs').insert({
      school_id: schoolId,
      user_id: userId,
      action: 'risk_config_updated',
      resource_type: 'risk_model_configs',
      resource_id: data.id,
      old_values: null,
      new_values: JSON.parse(JSON.stringify(update)),
      metadata: JSON.parse(JSON.stringify({ trigger: 'api' })),
    } as any);
    const parsed = parseConfigRow(data as RiskModelConfigRow);

    return NextResponse.json({ config: parsed, raw: data });
  } catch (err) {
    console.error('[Risk Config API] PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}