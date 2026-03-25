/**
 * Student Timeline API
 * ====================
 *
 * GET /api/schools/[schoolId]/students/[studentId]/timeline
 *
 * Assembles chronological timeline events from multiple sources:
 * - Student enrollment date
 * - Risk score changes (level transitions)
 * - Interventions created
 * - Dosage milestones
 *
 * T1 Security: FERPA audit logging on all student data access
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest } from '../../../risk/_shared/auth';
import { logSingleStudentAccess } from '@/lib/compliance/ferpa-audit';

interface RouteParams {
  params: Promise<{ schoolId: string; studentId: string }>;
}

/** Timeline event types */
export type TimelineEventType =
  | 'enrollment'
  | 'risk_flag'
  | 'risk_escalation'
  | 'risk_improvement'
  | 'risk_maintained'
  | 'intervention_created'
  | 'dosage_milestone';

/** Single timeline event */
export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  description: string;
  metadata: {
    riskScore?: number;
    riskLevel?: string;
    previousLevel?: string;
    interventionId?: string;
    interventionTitle?: string;
    dosageCompliance?: number;
    topDriver?: string;
  };
}

/**
 * GET /api/schools/[schoolId]/students/[studentId]/timeline
 * Assemble timeline events from multiple data sources
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId, studentId } = await params;

    // Authenticate request
    const authResult = await authenticateSchoolRequest({ schoolId });
    if (authResult instanceof NextResponse) return authResult;
    const { userId, adminSupabase } = authResult;

    // Validate studentId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID format' },
        { status: 400 }
      );
    }

    // Verify student belongs to this school and get enrollment date
    const { data: student, error: studentError } = await adminSupabase
      .from('students')
      .select('id, display_name, grade_level, created_at')
      .eq('id', studentId)
      .eq('school_id', schoolId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found in this school' },
        { status: 404 }
      );
    }

    const events: TimelineEvent[] = [];

    // 1. Enrollment event (use created_at as enrollment date)
    const enrollmentDate = student.created_at;
    if (enrollmentDate) {
      events.push({
        id: `enrollment-${studentId}`,
        date: enrollmentDate,
        type: 'enrollment',
        title: 'Student Enrolled',
        description: `${student.display_name} enrolled in Grade ${student.grade_level}.`,
        metadata: {},
      });
    }

    // 2. Fetch risk evaluation history for level changes
    const { data: riskHistory, error: riskError } = await adminSupabase
      .from('risk_evaluations')
      .select('id, risk_score, risk_level, previous_level, level_changed, trajectory, risk_factors, computed_at')
      .eq('student_id', studentId)
      .eq('school_id', schoolId)
      .order('computed_at', { ascending: true });

    if (!riskError && riskHistory) {
      let lastSignificantLevel: string | null = null;
      let lastSignificantDate: string | null = null;

      for (const evaluation of riskHistory) {
        // Only include events where level changed or first evaluation
        if (evaluation.level_changed || !lastSignificantLevel) {
          const riskScore = Number(evaluation.risk_score);
          const riskLevel = evaluation.risk_level;
          const previousLevel = evaluation.previous_level;

          // Get top risk driver
          const factors = evaluation.risk_factors as Array<{ name: string; weighted_score: number }> | null;
          const topDriver = factors && factors.length > 0
            ? factors.sort((a, b) => b.weighted_score - a.weighted_score)[0]?.name.replace(/_/g, ' ')
            : undefined;

          // Determine event type
          let eventType: TimelineEventType;
          let title: string;
          let description: string;

          if (!lastSignificantLevel) {
            // First evaluation - initial risk flag
            if (riskLevel === 'on_track') {
              continue; // Skip on_track initial status
            }
            eventType = 'risk_flag';
            title = `Risk Flag: ${formatRiskLevel(riskLevel)} (${(riskScore * 100).toFixed(0)})`;
            description = topDriver
              ? `Initial risk detection triggered by ${topDriver}.`
              : 'Initial risk assessment completed.';
          } else if (isEscalation(previousLevel, riskLevel)) {
            eventType = 'risk_escalation';
            title = `Risk Escalated: ${formatRiskLevel(riskLevel)} (${(riskScore * 100).toFixed(0)})`;
            description = topDriver
              ? `Risk increased from ${formatRiskLevel(previousLevel)} due to ${topDriver}.`
              : `Risk increased from ${formatRiskLevel(previousLevel)}.`;
          } else if (isImprovement(previousLevel, riskLevel)) {
            eventType = 'risk_improvement';
            title = `Risk Improved: ${formatRiskLevel(riskLevel)} (${(riskScore * 100).toFixed(0)})`;
            description = `Improved from ${formatRiskLevel(previousLevel)} tier.`;
          } else {
            // Level maintained (watch to watch, etc.) - only log if significant time passed
            const daysSinceLast = lastSignificantDate
              ? Math.floor((new Date(evaluation.computed_at).getTime() - new Date(lastSignificantDate).getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            if (daysSinceLast >= 30) {
              eventType = 'risk_maintained';
              title = `Risk Maintained: ${formatRiskLevel(riskLevel)}`;
              description = `Risk level unchanged after ${daysSinceLast} days.`;
            } else {
              continue;
            }
          }

          events.push({
            id: `risk-${evaluation.id}`,
            date: evaluation.computed_at,
            type: eventType,
            title,
            description,
            metadata: {
              riskScore,
              riskLevel,
              previousLevel: previousLevel || undefined,
              topDriver,
            },
          });

          lastSignificantLevel = riskLevel;
          lastSignificantDate = evaluation.computed_at;
        }
      }
    }

    // 3. Fetch interventions created for this student
    const { data: interventions, error: interventionError } = await adminSupabase
      .from('interventions')
      .select('id, title, type, status, created_at, start_date, assigned_to_user_id')
      .eq('student_id', studentId)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: true });

    if (!interventionError && interventions) {
      for (const intervention of interventions) {
        const strategyType = formatInterventionType(intervention.type);
        events.push({
          id: `intervention-${intervention.id}`,
          date: intervention.start_date || intervention.created_at,
          type: 'intervention_created',
          title: `Intervention Created: ${intervention.title}`,
          description: `${strategyType} intervention assigned.`,
          metadata: {
            interventionId: intervention.id,
            interventionTitle: intervention.title,
          },
        });
      }
    }

    // 4. Fetch dosage metrics for significant milestones
    const { data: dosageMetrics, error: dosageError } = await adminSupabase
      .from('intervention_dosage_metrics')
      .select('id, intervention_id, dosage_compliance_rate, session_completion_rate, actual_sessions_completed, actual_sessions_no_show, inference_flags, computed_at')
      .eq('student_id', studentId)
      .eq('school_id', schoolId)
      .order('computed_at', { ascending: true });

    if (!dosageError && dosageMetrics) {
      const processedInterventions = new Set<string>();

      for (const metric of dosageMetrics) {
        const compliance = metric.dosage_compliance_rate;
        const noShows = metric.actual_sessions_no_show;

        // Milestone: First reached 80% compliance
        if (compliance !== null && compliance >= 0.8 && !processedInterventions.has(`80-${metric.intervention_id}`)) {
          processedInterventions.add(`80-${metric.intervention_id}`);

          // Get intervention title
          const matchingIntervention = interventions?.find(i => i.id === metric.intervention_id);
          const title = matchingIntervention?.title || 'Intervention';

          events.push({
            id: `dosage-80-${metric.id}`,
            date: metric.computed_at,
            type: 'dosage_milestone',
            title: `Dosage Milestone: 80% Compliance`,
            description: `Reached 80% dosage compliance for ${title}.`,
            metadata: {
              interventionId: metric.intervention_id,
              dosageCompliance: compliance,
            },
          });
        }

        // Milestone: 3+ consecutive no-shows
        if (noShows >= 3 && !processedInterventions.has(`noshow-${metric.intervention_id}`)) {
          processedInterventions.add(`noshow-${metric.intervention_id}`);

          const matchingIntervention = interventions?.find(i => i.id === metric.intervention_id);
          const title = matchingIntervention?.title || 'Intervention';

          events.push({
            id: `dosage-noshow-${metric.id}`,
            date: metric.computed_at,
            type: 'dosage_milestone',
            title: `Dosage Alert: ${noShows} Missed Sessions`,
            description: `${noShows} missed sessions for ${title}.`,
            metadata: {
              interventionId: metric.intervention_id,
              dosageCompliance: compliance || undefined,
            },
          });
        }
      }
    }

    // Sort all events by date (oldest first for storytelling)
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // FERPA Audit: Log timeline access
    await logSingleStudentAccess(schoolId, userId, studentId, 'view_student');

    return NextResponse.json({
      studentId,
      studentName: student.display_name,
      events,
      total: events.length,
    });
  } catch (error) {
    console.error('[Timeline API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

// Helper functions

function formatRiskLevel(level: string | null | undefined): string {
  if (!level) return 'Unknown';
  const mapping: Record<string, string> = {
    on_track: 'On Track',
    watch: 'Watch',
    at_risk: 'At Risk',
    critical: 'Critical',
  };
  return mapping[level] || level;
}

function formatInterventionType(type: string): string {
  const mapping: Record<string, string> = {
    academic: 'Academic',
    attendance: 'Attendance',
    behavior: 'Behavior',
    sel: 'SEL',
    family_engagement: 'Family Engagement',
  };
  return mapping[type] || type;
}

function isEscalation(previousLevel: string | null, currentLevel: string): boolean {
  const order = ['on_track', 'watch', 'at_risk', 'critical'];
  const prevIndex = previousLevel ? order.indexOf(previousLevel) : -1;
  const currIndex = order.indexOf(currentLevel);
  return currIndex > prevIndex;
}

function isImprovement(previousLevel: string | null, currentLevel: string): boolean {
  const order = ['on_track', 'watch', 'at_risk', 'critical'];
  const prevIndex = previousLevel ? order.indexOf(previousLevel) : -1;
  const currIndex = order.indexOf(currentLevel);
  return currIndex < prevIndex && prevIndex !== -1;
}
