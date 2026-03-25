/**
 * MTSS Weekly Activity API
 * ========================
 *
 * GET: Returns MTSS activity summary for the current 7-day window.
 *
 * Sprint 5B - Weekly activity metrics for Pulse Dashboard.
 * Computes counts of alerts, interventions, and risk changes from the past 7 days.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, type RiskRouteParams } from '../risk/_shared/auth';
import { logMetricsAccess } from '@/lib/compliance/ferpa-audit';

export interface MtssWeeklyActivityResponse {
  new_risk_alerts: number;
  interventions_created: number;
  students_improved: number;
  students_worsened: number;
  period_start: string;
  period_end: string;
  last_updated: string;
}

/**
 * Get start of 7-day window (midnight 7 days ago)
 */
function getWeekAgoMidnight(): Date {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);
  return weekAgo;
}

export async function GET(_request: NextRequest, { params }: RiskRouteParams) {
  const { schoolId } = await params;

  // Authenticate and authorize
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { adminSupabase, userId } = authResult;

  try {
    // Log FERPA access for aggregate metrics
    await logMetricsAccess(schoolId, userId);

    const weekAgo = getWeekAgoMidnight();
    const weekAgoISO = weekAgo.toISOString();
    const now = new Date();

    // Query 1: Count new risk alerts created this week
    const { count: newAlertCount, error: alertError } = await adminSupabase
      .from('risk_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .gte('created_at', weekAgoISO);

    if (alertError) {
      console.error('[MTSS Weekly API] Error fetching alerts:', alertError.message);
      return NextResponse.json(
        { error: 'Failed to fetch weekly metrics' },
        { status: 500 }
      );
    }

    // Query 2: Count interventions created this week
    const { count: interventionsCreated, error: interventionError } = await adminSupabase
      .from('interventions')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .gte('created_at', weekAgoISO);

    if (interventionError) {
      console.error('[MTSS Weekly API] Error fetching interventions:', interventionError.message);
      return NextResponse.json(
        { error: 'Failed to fetch weekly metrics' },
        { status: 500 }
      );
    }

    // Query 3: Count students who changed risk level this week
    // Get all risk evaluations from this week that show a level change
    const { data: recentEvaluations, error: evalError } = await adminSupabase
      .from('risk_evaluations')
      .select('student_id, risk_level, computed_at')
      .eq('school_id', schoolId)
      .gte('computed_at', weekAgoISO)
      .order('computed_at', { ascending: true });

    if (evalError) {
      console.error('[MTSS Weekly API] Error fetching evaluations:', evalError.message);
      return NextResponse.json(
        { error: 'Failed to fetch weekly metrics' },
        { status: 500 }
      );
    }

    // Get the prior evaluation for each student to compare
    const studentIds = [...new Set((recentEvaluations || []).map((e) => e.student_id))];

    let studentsImproved = 0;
    let studentsWorsened = 0;

    if (studentIds.length > 0) {
      // Get the most recent evaluation BEFORE the week window for each student
      const { data: priorEvaluations } = await adminSupabase
        .from('risk_evaluations')
        .select('student_id, risk_level, computed_at')
        .eq('school_id', schoolId)
        .lt('computed_at', weekAgoISO)
        .in('student_id', studentIds)
        .order('computed_at', { ascending: false });

      // Build a map of student_id -> prior risk level
      const priorLevelByStudent: Record<string, string> = {};
      for (const ev of priorEvaluations || []) {
        if (!priorLevelByStudent[ev.student_id]) {
          priorLevelByStudent[ev.student_id] = ev.risk_level;
        }
      }

      // Build a map of student_id -> latest risk level this week
      const currentLevelByStudent: Record<string, string> = {};
      for (const ev of recentEvaluations || []) {
        // Take the most recent (they're sorted ascending, so last wins)
        currentLevelByStudent[ev.student_id] = ev.risk_level;
      }

      // Risk level severity map (lower is better)
      const riskSeverity: Record<string, number> = {
        on_track: 0,
        watch: 1,
        at_risk: 2,
        critical: 3,
      };

      // Compare prior vs current for each student
      for (const studentId of studentIds) {
        const priorLevel = priorLevelByStudent[studentId];
        const currentLevel = currentLevelByStudent[studentId];

        if (priorLevel && currentLevel && priorLevel !== currentLevel) {
          const priorSeverity = riskSeverity[priorLevel] ?? 2;
          const currentSeverity = riskSeverity[currentLevel] ?? 2;

          if (currentSeverity < priorSeverity) {
            studentsImproved++;
          } else if (currentSeverity > priorSeverity) {
            studentsWorsened++;
          }
        }
      }
    }

    // Build response
    const response: MtssWeeklyActivityResponse = {
      new_risk_alerts: newAlertCount ?? 0,
      interventions_created: interventionsCreated ?? 0,
      students_improved: studentsImproved,
      students_worsened: studentsWorsened,
      period_start: weekAgoISO,
      period_end: now.toISOString(),
      last_updated: now.toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[MTSS Weekly API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
