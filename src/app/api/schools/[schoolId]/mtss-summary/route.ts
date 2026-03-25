/**
 * MTSS Summary API
 * ================
 *
 * GET: Returns MTSS evidence metrics summary for a school.
 *
 * Sprint 5A - Foundation endpoint for all MTSS dashboards.
 * Computes aggregate metrics from risk_scores, interventions,
 * intervention_sessions, and intervention_dosage_metrics tables.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, type RiskRouteParams } from '../risk/_shared/auth';
import { logMetricsAccess } from '@/lib/compliance/ferpa-audit';

export interface StrategyEffectiveness {
  strategy_name: string;
  student_count: number;
  improvement_rate: number;
}

export interface MtssSummaryResponse {
  students_identified: number;
  students_flagged_no_intervention: number;
  response_rate: number;
  avg_time_to_action_days: number;
  avg_dosage_compliance: number;
  improvement_rate: number;
  students_improved: number;
  students_maintained: number;
  students_worsened: number;
  total_active_interventions: number;
  top_strategies: StrategyEffectiveness[];
  period: string;
  last_updated: string;
}

/**
 * Get current academic year string (e.g., "2025-2026")
 */
function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Academic year starts in August (month 7)
  if (month >= 7) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Format intervention type to readable strategy name
 */
function formatStrategyName(type: string): string {
  const names: Record<string, string> = {
    academic: 'Academic Tutoring',
    attendance: 'Attendance Support',
    behavior: 'Behavior Intervention',
    sel: 'Social-Emotional Learning',
    family_engagement: 'Family Engagement',
    other: 'Other Support',
  };
  return names[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Get start of current academic year
 */
function getAcademicYearStart(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Academic year starts August 1
  if (month >= 7) {
    return new Date(year, 7, 1); // August 1 of current year
  }
  return new Date(year - 1, 7, 1); // August 1 of previous year
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

    const academicYearStart = getAcademicYearStart();
    const academicYearStartISO = academicYearStart.toISOString();

    // Query 1: Get flagged students (watch, at_risk, critical) from current_risk_scores view
    const { data: flaggedStudents, error: flaggedError } = await adminSupabase
      .from('current_risk_scores')
      .select('student_id, risk_level, computed_at')
      .eq('school_id', schoolId)
      .in('risk_level', ['watch', 'at_risk', 'critical']);

    if (flaggedError) {
      console.error('[MTSS Summary API] Error fetching flagged students:', flaggedError.message);
      return NextResponse.json(
        { error: 'Failed to fetch MTSS metrics' },
        { status: 500 }
      );
    }

    const flaggedStudentIds = (flaggedStudents || [])
      .map((s) => s.student_id)
      .filter((id): id is string => id != null);

    const studentsIdentified = flaggedStudentIds.length;

    // If no flagged students, return zeros
    if (studentsIdentified === 0) {
      return NextResponse.json<MtssSummaryResponse>({
        students_identified: 0,
        students_flagged_no_intervention: 0,
        response_rate: 0,
        avg_time_to_action_days: 0,
        avg_dosage_compliance: 0,
        improvement_rate: 0,
        students_improved: 0,
        students_maintained: 0,
        students_worsened: 0,
        total_active_interventions: 0,
        top_strategies: [],
        period: getCurrentAcademicYear(),
        last_updated: new Date().toISOString(),
      });
    }

    // Query 2: Get active interventions for flagged students
    const { data: activeInterventions, error: interventionError } = await adminSupabase
      .from('interventions')
      .select('id, student_id, created_at, status')
      .eq('school_id', schoolId)
      .in('student_id', flaggedStudentIds)
      .in('status', ['planned', 'in_progress']);

    if (interventionError) {
      console.error('[MTSS Summary API] Error fetching interventions:', interventionError.message);
      return NextResponse.json(
        { error: 'Failed to fetch MTSS metrics' },
        { status: 500 }
      );
    }

    // Calculate students with active interventions
    const studentsWithIntervention = new Set(
      (activeInterventions || []).map((i) => i.student_id)
    );
    const studentsWithNoIntervention = flaggedStudentIds.filter(
      (id) => !studentsWithIntervention.has(id)
    );
    const studentsFlaggedNoIntervention = studentsWithNoIntervention.length;

    // Response rate: % of flagged students with at least one active intervention
    const responseRate =
      studentsIdentified > 0
        ? studentsWithIntervention.size / studentsIdentified
        : 0;

    const totalActiveInterventions = (activeInterventions || []).length;

    // Query 3: Calculate avg time to action
    // Find earliest risk flag date per student (from risk_evaluations) and earliest intervention created_at
    let avgTimeToActionDays = 0;

    if (studentsWithIntervention.size > 0) {
      // Get first risk flag per student (from risk_evaluations table)
      const { data: riskEvaluations } = await adminSupabase
        .from('risk_evaluations')
        .select('student_id, computed_at')
        .eq('school_id', schoolId)
        .in('student_id', Array.from(studentsWithIntervention))
        .in('risk_level', ['watch', 'at_risk', 'critical'])
        .gte('computed_at', academicYearStartISO)
        .order('computed_at', { ascending: true });

      // Find first risk flag per student
      const firstRiskFlagByStudent: Record<string, string> = {};
      for (const re of riskEvaluations || []) {
        if (!firstRiskFlagByStudent[re.student_id]) {
          firstRiskFlagByStudent[re.student_id] = re.computed_at;
        }
      }

      // Get first intervention per student
      const firstInterventionByStudent: Record<string, string> = {};
      for (const iv of activeInterventions || []) {
        if (!firstInterventionByStudent[iv.student_id] ||
            iv.created_at < firstInterventionByStudent[iv.student_id]) {
          firstInterventionByStudent[iv.student_id] = iv.created_at;
        }
      }

      // Calculate time to action for each student
      const timeToActionDays: number[] = [];
      for (const studentId of studentsWithIntervention) {
        const firstFlag = firstRiskFlagByStudent[studentId];
        const firstIntervention = firstInterventionByStudent[studentId];

        if (firstFlag && firstIntervention) {
          const flagDate = new Date(firstFlag);
          const interventionDate = new Date(firstIntervention);
          const diffMs = interventionDate.getTime() - flagDate.getTime();
          const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
          timeToActionDays.push(diffDays);
        }
      }

      if (timeToActionDays.length > 0) {
        avgTimeToActionDays =
          timeToActionDays.reduce((a, b) => a + b, 0) / timeToActionDays.length;
      }
    }

    // Query 4: Get dosage compliance from intervention_dosage_metrics
    let avgDosageCompliance = 0;

    if (totalActiveInterventions > 0) {
      const activeInterventionIds = (activeInterventions || []).map((i) => i.id);

      const { data: dosageMetrics } = await adminSupabase
        .from('intervention_dosage_metrics')
        .select('dosage_compliance_rate')
        .eq('school_id', schoolId)
        .in('intervention_id', activeInterventionIds);

      if (dosageMetrics && dosageMetrics.length > 0) {
        const complianceRates = dosageMetrics
          .map((m) => m.dosage_compliance_rate)
          .filter((r): r is number => r !== null);

        if (complianceRates.length > 0) {
          avgDosageCompliance =
            complianceRates.reduce((a, b) => a + b, 0) / complianceRates.length;
        }
      }
    }

    // Query 5: Calculate improvement rate using risk_evaluations history
    // Compare earliest vs latest risk_level for each flagged student
    let studentsImproved = 0;
    let studentsMaintained = 0;
    let studentsWorsened = 0;

    // Declare evalsByStudent at higher scope for use in strategy calculation
    let evalsByStudent: Record<string, Array<{ risk_level: string; computed_at: string }>> = {};

    if (studentsIdentified > 0) {
      const { data: allEvaluations } = await adminSupabase
        .from('risk_evaluations')
        .select('student_id, risk_level, computed_at')
        .eq('school_id', schoolId)
        .in('student_id', flaggedStudentIds)
        .gte('computed_at', academicYearStartISO)
        .order('computed_at', { ascending: true });

      // Group evaluations by student
      for (const ev of allEvaluations || []) {
        if (!evalsByStudent[ev.student_id]) {
          evalsByStudent[ev.student_id] = [];
        }
        evalsByStudent[ev.student_id].push({
          risk_level: ev.risk_level,
          computed_at: ev.computed_at,
        });
      }

      // Risk level severity map (lower is better)
      const riskSeverity: Record<string, number> = {
        on_track: 0,
        watch: 1,
        at_risk: 2,
        critical: 3,
      };

      // Compare first and last evaluation for each student
      for (const studentId of flaggedStudentIds) {
        const evals = evalsByStudent[studentId];
        if (evals && evals.length >= 2) {
          const firstLevel = evals[0].risk_level;
          const lastLevel = evals[evals.length - 1].risk_level;

          const firstSeverity = riskSeverity[firstLevel] ?? 2;
          const lastSeverity = riskSeverity[lastLevel] ?? 2;

          if (lastSeverity < firstSeverity) {
            studentsImproved++;
          } else if (lastSeverity > firstSeverity) {
            studentsWorsened++;
          } else {
            studentsMaintained++;
          }
        } else {
          // Only one evaluation, consider maintained
          studentsMaintained++;
        }
      }
    }

    // Calculate improvement rate
    const improvementRate =
      studentsIdentified > 0 ? studentsImproved / studentsIdentified : 0;

    // Query 6: Calculate top strategies by intervention type
    const topStrategies: StrategyEffectiveness[] = [];

    if (totalActiveInterventions > 0) {
      // Get interventions with their types and student risk changes
      const { data: allInterventions } = await adminSupabase
        .from('interventions')
        .select('id, student_id, type, status, was_successful')
        .eq('school_id', schoolId)
        .in('status', ['in_progress', 'completed']);

      if (allInterventions && allInterventions.length > 0) {
        // Group by type and calculate effectiveness
        const typeStats: Record<string, { count: number; improved: number }> = {};

        for (const iv of allInterventions) {
          const typeName = iv.type || 'other';
          if (!typeStats[typeName]) {
            typeStats[typeName] = { count: 0, improved: 0 };
          }
          typeStats[typeName].count++;

          // Check if student improved (using evalsByStudent from earlier)
          if (evalsByStudent && evalsByStudent[iv.student_id]) {
            const evals = evalsByStudent[iv.student_id];
            if (evals.length >= 2) {
              const firstLevel = evals[0].risk_level;
              const lastLevel = evals[evals.length - 1].risk_level;
              const riskSeverity: Record<string, number> = {
                on_track: 0, watch: 1, at_risk: 2, critical: 3,
              };
              if ((riskSeverity[lastLevel] ?? 2) < (riskSeverity[firstLevel] ?? 2)) {
                typeStats[typeName].improved++;
              }
            }
          } else if (iv.was_successful) {
            // Fallback: use was_successful flag for completed interventions
            typeStats[typeName].improved++;
          }
        }

        // Convert to array and sort by improvement rate
        const strategyList = Object.entries(typeStats)
          .map(([name, stats]) => ({
            strategy_name: formatStrategyName(name),
            student_count: stats.count,
            improvement_rate: stats.count > 0 ? stats.improved / stats.count : 0,
          }))
          .sort((a, b) => b.improvement_rate - a.improvement_rate)
          .slice(0, 3); // Top 3

        topStrategies.push(...strategyList);
      }
    }

    // Build response
    const response: MtssSummaryResponse = {
      students_identified: studentsIdentified,
      students_flagged_no_intervention: studentsFlaggedNoIntervention,
      response_rate: Math.round(responseRate * 1000) / 1000, // 3 decimal places
      avg_time_to_action_days: Math.round(avgTimeToActionDays * 10) / 10, // 1 decimal
      avg_dosage_compliance: Math.round(avgDosageCompliance * 1000) / 1000, // 3 decimal places
      improvement_rate: Math.round(improvementRate * 1000) / 1000, // 3 decimal places
      students_improved: studentsImproved,
      students_maintained: studentsMaintained,
      students_worsened: studentsWorsened,
      total_active_interventions: totalActiveInterventions,
      top_strategies: topStrategies,
      period: getCurrentAcademicYear(),
      last_updated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[MTSS Summary API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
