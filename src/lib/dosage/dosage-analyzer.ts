/**
 * Dosage Analyzer
 * ===============
 *
 * Analyzes intervention dosage compliance, fidelity, and delivery patterns.
 * Implements 10 inference rules to detect issues and generate recommendations.
 *
 * Inference Rules:
 *   1. chronic_no_show - Student has 3+ no-shows in last 2 weeks
 *   2. declining_attendance - Attendance rate dropped >20% from baseline
 *   3. low_fidelity - Average fidelity score below 70%
 *   4. declining_fidelity - Fidelity score declining over 3+ sessions
 *   5. behind_schedule - 2+ sessions behind planned pace
 *   6. critically_behind - 4+ sessions behind or <50% compliance
 *   7. low_engagement - Student engagement rate below 60%
 *   8. cancelled_streak - 3+ consecutive cancelled sessions
 *   9. missing_sessions - No sessions logged in 2+ weeks
 *  10. dosage_gap - Gap of 10+ days between sessions
 *
 * Note: Uses type assertions for new tables not yet in database.types.ts.
 * Run `npx supabase gen types` after migration to remove these assertions.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Type helper for tables not yet in database.types.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;
import type {
  Session,
  SessionRow,
  SessionStatus,
  DosageMetrics,
  DosageMetricsRow,
  DosageStatus,
  InferenceFlag,
  InferenceRule,
  InferenceRuleId,
  DosageAnalysisResult,
  SchoolDosageSummary,
  SessionLogInput,
  ScheduleOptions,
  GeneratedSchedule,
} from './types';

// ============================================================
// INFERENCE RULES (10 total)
// ============================================================

const inferenceRules: InferenceRule[] = [
  // Rule 1: Chronic No-Show
  {
    id: 'chronic_no_show',
    name: 'Chronic No-Show',
    description: 'Student has 3+ no-shows in the last 2 weeks',
    severity: 'critical',
    evaluate: (metrics, sessions) => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentNoShows = sessions.filter(
        (s) =>
          s.status === 'no_show' &&
          s.scheduledDate >= twoWeeksAgo
      );

      if (recentNoShows.length >= 3) {
        return {
          rule: 'chronic_no_show',
          severity: 'critical',
          message: `Student has ${recentNoShows.length} no-shows in the last 2 weeks. Consider family outreach.`,
          detectedAt: new Date().toISOString(),
          data: { noShowCount: recentNoShows.length },
        };
      }
      return null;
    },
  },

  // Rule 2: Declining Attendance
  {
    id: 'declining_attendance',
    name: 'Declining Attendance',
    description: 'Attendance rate dropped >20% from first 2 weeks',
    severity: 'warning',
    evaluate: (metrics, sessions) => {
      if (sessions.length < 6) return null;

      const sorted = [...sessions].sort(
        (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()
      );

      // First half vs second half
      const midpoint = Math.floor(sorted.length / 2);
      const firstHalf = sorted.slice(0, midpoint);
      const secondHalf = sorted.slice(midpoint);

      const attendedStatuses: SessionStatus[] = ['completed', 'partial'];

      const firstHalfRate =
        firstHalf.filter((s) => attendedStatuses.includes(s.status)).length /
        firstHalf.length;
      const secondHalfRate =
        secondHalf.filter((s) => attendedStatuses.includes(s.status)).length /
        secondHalf.length;

      const decline = firstHalfRate - secondHalfRate;

      if (decline > 0.2) {
        return {
          rule: 'declining_attendance',
          severity: 'warning',
          message: `Attendance dropped ${Math.round(decline * 100)}% from early sessions. Check for barriers.`,
          detectedAt: new Date().toISOString(),
          data: { firstHalfRate, secondHalfRate, decline },
        };
      }
      return null;
    },
  },

  // Rule 3: Low Fidelity
  {
    id: 'low_fidelity',
    name: 'Low Fidelity',
    description: 'Average fidelity score below 70%',
    severity: 'warning',
    evaluate: (metrics) => {
      const { fidelity } = metrics;
      if (fidelity.averageScore === null) return null;

      if (fidelity.averageScore < 0.7) {
        return {
          rule: 'low_fidelity',
          severity: 'warning',
          message: `Fidelity score is ${Math.round(fidelity.averageScore * 100)}%. Review delivery protocols.`,
          detectedAt: new Date().toISOString(),
          data: { averageFidelity: fidelity.averageScore },
        };
      }
      return null;
    },
  },

  // Rule 4: Declining Fidelity
  {
    id: 'declining_fidelity',
    name: 'Declining Fidelity',
    description: 'Fidelity score declining over 3+ sessions',
    severity: 'warning',
    evaluate: (metrics, sessions) => {
      const sessionsWithFidelity = sessions
        .filter((s) => s.fidelityScore !== null && s.status === 'completed')
        .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

      if (sessionsWithFidelity.length < 3) return null;

      // Check last 3 sessions
      const last3 = sessionsWithFidelity.slice(-3);
      let declining = true;
      for (let i = 1; i < last3.length; i++) {
        if ((last3[i].fidelityScore ?? 0) >= (last3[i - 1].fidelityScore ?? 0)) {
          declining = false;
          break;
        }
      }

      if (declining) {
        return {
          rule: 'declining_fidelity',
          severity: 'warning',
          message: 'Fidelity scores declining over last 3 sessions. Schedule coaching support.',
          detectedAt: new Date().toISOString(),
          data: {
            scores: last3.map((s) => s.fidelityScore),
          },
        };
      }
      return null;
    },
  },

  // Rule 5: Behind Schedule
  {
    id: 'behind_schedule',
    name: 'Behind Schedule',
    description: '2+ sessions behind planned pace',
    severity: 'warning',
    evaluate: (metrics) => {
      const { pace } = metrics;
      if (pace.sessionsBehind >= 2 && pace.sessionsBehind < 4) {
        return {
          rule: 'behind_schedule',
          severity: 'warning',
          message: `${pace.sessionsBehind} sessions behind schedule. Consider adding make-up sessions.`,
          detectedAt: new Date().toISOString(),
          data: { sessionsBehind: pace.sessionsBehind },
        };
      }
      return null;
    },
  },

  // Rule 6: Critically Behind
  {
    id: 'critically_behind',
    name: 'Critically Behind',
    description: '4+ sessions behind or <50% compliance',
    severity: 'critical',
    evaluate: (metrics) => {
      const { pace, compliance } = metrics;
      const isCriticallyBehind = pace.sessionsBehind >= 4;
      const hasLowCompliance =
        compliance.dosageComplianceRate !== null &&
        compliance.dosageComplianceRate < 0.5;

      if (isCriticallyBehind || hasLowCompliance) {
        return {
          rule: 'critically_behind',
          severity: 'critical',
          message: 'Intervention critically behind on dosage. Immediate action required.',
          detectedAt: new Date().toISOString(),
          data: {
            sessionsBehind: pace.sessionsBehind,
            complianceRate: compliance.dosageComplianceRate,
          },
        };
      }
      return null;
    },
  },

  // Rule 7: Low Engagement
  {
    id: 'low_engagement',
    name: 'Low Engagement',
    description: 'Student engagement rate below 60%',
    severity: 'warning',
    evaluate: (metrics, sessions) => {
      const completedSessions = sessions.filter(
        (s) => s.status === 'completed' || s.status === 'partial'
      );
      if (completedSessions.length < 3) return null;

      const engagedCount = completedSessions.filter(
        (s) => s.studentEngaged
      ).length;
      const engagementRate = engagedCount / completedSessions.length;

      if (engagementRate < 0.6) {
        return {
          rule: 'low_engagement',
          severity: 'warning',
          message: `Student engagement at ${Math.round(engagementRate * 100)}%. Review intervention fit.`,
          detectedAt: new Date().toISOString(),
          data: { engagementRate },
        };
      }
      return null;
    },
  },

  // Rule 8: Cancelled Streak
  {
    id: 'cancelled_streak',
    name: 'Cancelled Streak',
    description: '3+ consecutive cancelled sessions',
    severity: 'warning',
    evaluate: (metrics, sessions) => {
      const sorted = [...sessions].sort(
        (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()
      );

      let maxStreak = 0;
      let currentStreak = 0;

      for (const session of sorted) {
        if (session.status === 'cancelled') {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }

      // Check if current streak is at the end
      const lastSessions = sorted.slice(-3);
      const endingStreak = lastSessions.every((s) => s.status === 'cancelled');

      if (endingStreak || maxStreak >= 3) {
        return {
          rule: 'cancelled_streak',
          severity: 'warning',
          message: `${maxStreak}+ consecutive cancelled sessions. Investigate barriers.`,
          detectedAt: new Date().toISOString(),
          data: { maxStreak },
        };
      }
      return null;
    },
  },

  // Rule 9: Missing Sessions
  {
    id: 'missing_sessions',
    name: 'Missing Sessions',
    description: 'No sessions logged in 2+ weeks for active intervention',
    severity: 'warning',
    evaluate: (metrics, sessions) => {
      if (metrics.status === 'not_started' || metrics.status === 'completed') {
        return null;
      }

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentSessions = sessions.filter(
        (s) => s.scheduledDate >= twoWeeksAgo
      );

      if (recentSessions.length === 0 && sessions.length > 0) {
        return {
          rule: 'missing_sessions',
          severity: 'warning',
          message: 'No sessions logged in 2+ weeks. Update session log or check-in with provider.',
          detectedAt: new Date().toISOString(),
          data: {
            lastSessionDate: metrics.lastSessionDate?.toISOString(),
          },
        };
      }
      return null;
    },
  },

  // Rule 10: Dosage Gap
  {
    id: 'dosage_gap',
    name: 'Dosage Gap',
    description: 'Gap of 10+ days between sessions',
    severity: 'info',
    evaluate: (metrics, sessions) => {
      const completed = sessions
        .filter((s) => s.status === 'completed' || s.status === 'partial')
        .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

      if (completed.length < 2) return null;

      let maxGap = 0;
      for (let i = 1; i < completed.length; i++) {
        const gap =
          (completed[i].scheduledDate.getTime() -
            completed[i - 1].scheduledDate.getTime()) /
          (1000 * 60 * 60 * 24);
        maxGap = Math.max(maxGap, gap);
      }

      if (maxGap >= 10) {
        return {
          rule: 'dosage_gap',
          severity: 'info',
          message: `${Math.round(maxGap)}-day gap detected between sessions. May impact effectiveness.`,
          detectedAt: new Date().toISOString(),
          data: { maxGapDays: Math.round(maxGap) },
        };
      }
      return null;
    },
  },
];

// ============================================================
// DOSAGE ANALYZER CLASS
// ============================================================

export class DosageAnalyzer {
  private schoolId: string;

  constructor(schoolId: string) {
    this.schoolId = schoolId;
  }

  /**
   * Analyze dosage for a single intervention
   */
  async analyzeIntervention(
    interventionId: string
  ): Promise<DosageAnalysisResult | null> {
    const supabase = createAdminSupabaseClient() as AnySupabase;

    // Load dosage metrics
    const { data: metricsRow, error: metricsError } = await supabase
      .from('intervention_dosage_metrics')
      .select('*')
      .eq('intervention_id', interventionId)
      .single();

    if (metricsError || !metricsRow) {
      console.error('[DosageAnalyzer] Failed to load metrics:', metricsError);
      return null;
    }

    // Load sessions
    const { data: sessionRows, error: sessionsError } = await supabase
      .from('intervention_sessions')
      .select('*')
      .eq('intervention_id', interventionId)
      .order('scheduled_date', { ascending: true });

    if (sessionsError) {
      console.error('[DosageAnalyzer] Failed to load sessions:', sessionsError);
      return null;
    }

    const metrics = this.parseMetricsRow(metricsRow as DosageMetricsRow);
    const sessions = (sessionRows || []).map((r) =>
      this.parseSessionRow(r as SessionRow)
    );

    // Run inference rules
    const flags = this.runInferenceRules(metrics, sessions);

    // Generate recommendations
    const recommendations = this.generateRecommendations(flags);

    // Determine overall health
    const overallHealth = this.determineHealth(flags);

    return {
      interventionId,
      metrics,
      sessions,
      flags,
      recommendations,
      overallHealth,
    };
  }

  /**
   * Analyze all interventions for a school
   */
  async analyzeSchool(): Promise<SchoolDosageSummary> {
    const supabase = createAdminSupabaseClient() as AnySupabase;

    // Load all dosage metrics for the school
    const { data: metricsRows, error } = await supabase
      .from('intervention_dosage_metrics')
      .select(`
        *,
        interventions!inner(
          id,
          title,
          status,
          type
        ),
        students!inner(
          id,
          display_name
        )
      `)
      .eq('school_id', this.schoolId);

    if (error) {
      console.error('[DosageAnalyzer] Failed to load school metrics:', error);
      return this.emptySchoolSummary();
    }

    const rows = metricsRows || [];

    // Aggregate by status
    const byStatus: Record<DosageStatus, number> = {
      not_started: 0,
      on_track: 0,
      behind: 0,
      critical: 0,
      completed: 0,
      discontinued: 0,
    };

    let totalCompletionRate = 0;
    let totalFidelityScore = 0;
    let completionCount = 0;
    let fidelityCount = 0;

    const flaggedInterventions: SchoolDosageSummary['flaggedInterventions'] = [];

    for (const row of rows) {
      const metricsRow = row as DosageMetricsRow & {
        interventions: { id: string; title: string; status: string };
        students: { id: string; display_name: string };
      };

      byStatus[metricsRow.dosage_status]++;

      if (metricsRow.session_completion_rate !== null) {
        totalCompletionRate += metricsRow.session_completion_rate;
        completionCount++;
      }

      if (metricsRow.average_fidelity_score !== null) {
        totalFidelityScore += metricsRow.average_fidelity_score;
        fidelityCount++;
      }

      // Check for flags
      const flags = metricsRow.inference_flags || [];
      if (flags.length > 0) {
        flaggedInterventions.push({
          interventionId: metricsRow.intervention_id,
          studentName: metricsRow.students.display_name,
          flags: flags as InferenceFlag[],
        });
      }
    }

    return {
      schoolId: this.schoolId,
      totalInterventions: rows.length,
      byStatus,
      onTrackCount: byStatus.on_track,
      behindCount: byStatus.behind,
      criticalCount: byStatus.critical,
      averageCompletionRate:
        completionCount > 0 ? totalCompletionRate / completionCount : 0,
      averageFidelityScore:
        fidelityCount > 0 ? totalFidelityScore / fidelityCount : 0,
      flaggedInterventions,
      computedAt: new Date(),
    };
  }

  /**
   * Compute and update metrics for an intervention based on sessions
   */
  async computeMetrics(interventionId: string): Promise<DosageMetrics | null> {
    const supabase = createAdminSupabaseClient() as AnySupabase;

    // Load current metrics (for plan details)
    const { data: currentMetrics } = await supabase
      .from('intervention_dosage_metrics')
      .select('*')
      .eq('intervention_id', interventionId)
      .single();

    if (!currentMetrics) {
      console.error('[DosageAnalyzer] No metrics found for intervention');
      return null;
    }

    // Load all sessions
    const { data: sessionRows } = await supabase
      .from('intervention_sessions')
      .select('*')
      .eq('intervention_id', interventionId)
      .order('scheduled_date', { ascending: true });

    const sessions = (sessionRows || []).map((r) =>
      this.parseSessionRow(r as SessionRow)
    );

    // Compute aggregates
    const completed = sessions.filter((s) => s.status === 'completed');
    const partial = sessions.filter((s) => s.status === 'partial');
    const cancelled = sessions.filter((s) => s.status === 'cancelled');
    const noShow = sessions.filter((s) => s.status === 'no_show');

    const actualTotalMinutes = sessions
      .filter((s) => s.status === 'completed' || s.status === 'partial')
      .reduce((sum, s) => sum + (s.actualDurationMinutes || 0), 0);

    // Calculate weeks elapsed
    const firstSession = sessions.find((s) => s.status === 'completed');
    const weeksElapsed = firstSession
      ? Math.ceil(
          (Date.now() - firstSession.scheduledDate.getTime()) /
            (1000 * 60 * 60 * 24 * 7)
        )
      : 0;

    // Calculate expected sessions to date
    const metricsRow = currentMetrics as DosageMetricsRow;
    const expectedSessions = Math.floor(
      weeksElapsed * metricsRow.planned_sessions_per_week
    );
    const sessionsBehind = Math.max(0, expectedSessions - completed.length);

    // Calculate compliance rates
    const sessionCompletionRate =
      expectedSessions > 0 ? completed.length / expectedSessions : null;

    const expectedMinutes =
      expectedSessions * metricsRow.planned_minutes_per_session;
    const dosageComplianceRate =
      expectedMinutes > 0 ? actualTotalMinutes / expectedMinutes : null;

    const totalScheduled = sessions.filter(
      (s) => new Date(s.scheduledDate) <= new Date()
    ).length;
    const attended = completed.length + partial.length;
    const attendanceRate = totalScheduled > 0 ? attended / totalScheduled : null;

    // Calculate fidelity
    const sessionsWithFidelity = sessions.filter(
      (s) => s.fidelityScore !== null
    );
    const avgFidelity =
      sessionsWithFidelity.length > 0
        ? sessionsWithFidelity.reduce((sum, s) => sum + (s.fidelityScore || 0), 0) /
          sessionsWithFidelity.length
        : null;

    // Calculate engagement
    const sessionsWithEngagement = sessions.filter(
      (s) => s.status === 'completed' || s.status === 'partial'
    );
    const engagedCount = sessionsWithEngagement.filter(
      (s) => s.studentEngaged
    ).length;
    const avgEngagement =
      sessionsWithEngagement.length > 0
        ? engagedCount / sessionsWithEngagement.length
        : null;

    // Determine status
    let dosageStatus: DosageStatus = 'not_started';
    if (completed.length === 0 && sessions.length === 0) {
      dosageStatus = 'not_started';
    } else if (sessionsBehind >= 4 || (dosageComplianceRate !== null && dosageComplianceRate < 0.5)) {
      dosageStatus = 'critical';
    } else if (sessionsBehind >= 2) {
      dosageStatus = 'behind';
    } else if (completed.length >= metricsRow.planned_total_sessions) {
      dosageStatus = 'completed';
    } else {
      dosageStatus = 'on_track';
    }

    // Build metrics object for inference
    const metrics: DosageMetrics = {
      id: metricsRow.id,
      interventionId,
      schoolId: this.schoolId,
      studentId: metricsRow.student_id,
      plan: {
        sessionsPerWeek: metricsRow.planned_sessions_per_week,
        minutesPerSession: metricsRow.planned_minutes_per_session,
        totalWeeks: metricsRow.planned_total_weeks,
        totalSessions: metricsRow.planned_total_sessions,
        totalMinutes: metricsRow.planned_total_minutes,
      },
      actual: {
        sessionsCompleted: completed.length,
        sessionsPartial: partial.length,
        sessionsCancelled: cancelled.length,
        sessionsNoShow: noShow.length,
        totalMinutes: actualTotalMinutes,
      },
      compliance: {
        sessionCompletionRate,
        dosageComplianceRate,
        attendanceRate,
      },
      fidelity: {
        averageScore: avgFidelity,
        trend: this.computeFidelityTrend(sessions),
      },
      pace: {
        weeksElapsed,
        sessionsBehind,
        minutesBehind: Math.max(0, expectedMinutes - actualTotalMinutes),
        onTrack: sessionsBehind <= 2,
      },
      status: dosageStatus,
      inferenceFlags: [],
      firstSessionDate: firstSession?.scheduledDate || null,
      lastSessionDate:
        sessions.length > 0
          ? sessions[sessions.length - 1].scheduledDate
          : null,
      nextSessionDate: this.findNextSession(sessions),
      computedAt: new Date(),
    };

    // Run inference rules
    const flags = this.runInferenceRules(metrics, sessions);
    metrics.inferenceFlags = flags;

    // Update database
    await supabase
      .from('intervention_dosage_metrics')
      .update({
        actual_sessions_completed: completed.length,
        actual_sessions_partial: partial.length,
        actual_sessions_cancelled: cancelled.length,
        actual_sessions_no_show: noShow.length,
        actual_total_minutes: actualTotalMinutes,
        session_completion_rate: sessionCompletionRate,
        dosage_compliance_rate: dosageComplianceRate,
        attendance_rate: attendanceRate,
        average_fidelity_score: avgFidelity,
        fidelity_trend: metrics.fidelity.trend,
        weeks_elapsed: weeksElapsed,
        sessions_behind_schedule: sessionsBehind,
        minutes_behind_schedule: Math.max(0, expectedMinutes - actualTotalMinutes),
        average_engagement_rate: avgEngagement,
        dosage_status: dosageStatus,
        inference_flags: flags,
        first_session_date: metrics.firstSessionDate?.toISOString().split('T')[0],
        last_session_date: metrics.lastSessionDate?.toISOString().split('T')[0],
        next_session_date: metrics.nextSessionDate?.toISOString().split('T')[0],
        computed_at: new Date().toISOString(),
      })
      .eq('intervention_id', interventionId);

    return metrics;
  }

  /**
   * Log a session completion/status update
   */
  async logSession(input: SessionLogInput): Promise<Session | null> {
    const supabase = createAdminSupabaseClient() as AnySupabase;

    const updates: Record<string, unknown> = {
      status: input.status,
      updated_at: new Date().toISOString(),
    };

    if (input.actualDate) {
      updates.actual_date = input.actualDate.toISOString().split('T')[0];
    }
    if (input.actualStartTime) {
      updates.actual_start_time = input.actualStartTime;
    }
    if (input.actualDurationMinutes !== undefined) {
      updates.actual_duration_minutes = input.actualDurationMinutes;
    }
    if (input.cancellationReason) {
      updates.cancellation_reason = input.cancellationReason;
    }
    if (input.fidelityChecklist) {
      updates.fidelity_checklist = input.fidelityChecklist;
      // Calculate fidelity score
      const completed = input.fidelityChecklist.filter((i) => i.completed).length;
      updates.fidelity_score =
        input.fidelityChecklist.length > 0
          ? completed / input.fidelityChecklist.length
          : null;
    }
    if (input.studentEngaged !== undefined) {
      updates.student_engaged = input.studentEngaged;
    }
    if (input.engagementNotes) {
      updates.engagement_notes = input.engagementNotes;
    }
    if (input.sessionNotes) {
      updates.session_notes = input.sessionNotes;
    }
    if (input.skillsPracticed) {
      updates.skills_practiced = input.skillsPracticed;
    }
    if (input.homeworkAssigned) {
      updates.homework_assigned = input.homeworkAssigned;
    }
    if (input.parentCommunication !== undefined) {
      updates.parent_communication = input.parentCommunication;
    }

    const { data, error } = await supabase
      .from('intervention_sessions')
      .update(updates)
      .eq('id', input.sessionId)
      .select()
      .single();

    if (error) {
      console.error('[DosageAnalyzer] Failed to log session:', error);
      return null;
    }

    // Recompute metrics
    const row = data as SessionRow;
    await this.computeMetrics(row.intervention_id);

    return this.parseSessionRow(row);
  }

  /**
   * Generate a session schedule for an intervention
   */
  generateSchedule(options: ScheduleOptions): GeneratedSchedule {
    const sessions: GeneratedSchedule['sessions'] = [];
    const { startDate, endDate, sessionsPerWeek, minutesPerSession } = options;

    // Default to Mon/Wed/Fri if no preferred days
    const preferredDays = options.preferredDays || [1, 3, 5];
    const preferredTime = options.preferredTime || '09:00';

    let currentDate = new Date(startDate);
    let sessionsThisWeek = 0;
    let currentWeek = this.getWeekNumber(currentDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const thisWeek = this.getWeekNumber(currentDate);

      // Reset week counter
      if (thisWeek !== currentWeek) {
        sessionsThisWeek = 0;
        currentWeek = thisWeek;
      }

      // Check if this day is preferred and we haven't hit weekly limit
      if (
        preferredDays.includes(dayOfWeek) &&
        sessionsThisWeek < sessionsPerWeek
      ) {
        // Skip holidays if configured
        const isHoliday =
          options.skipHolidays &&
          options.holidays?.some(
            (h) => h.toDateString() === currentDate.toDateString()
          );

        if (!isHoliday) {
          sessions.push({
            date: new Date(currentDate),
            time: preferredTime,
            duration: minutesPerSession,
          });
          sessionsThisWeek++;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const weeksSpanned = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );

    return {
      sessions,
      totalSessions: sessions.length,
      totalMinutes: sessions.length * minutesPerSession,
      weeksSpanned,
    };
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private runInferenceRules(
    metrics: DosageMetrics,
    sessions: Session[]
  ): InferenceFlag[] {
    const flags: InferenceFlag[] = [];

    for (const rule of inferenceRules) {
      const flag = rule.evaluate(metrics, sessions);
      if (flag) {
        flags.push(flag);
      }
    }

    // Sort by severity (critical first)
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    flags.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    return flags;
  }

  private generateRecommendations(flags: InferenceFlag[]): string[] {
    const recommendations: string[] = [];

    const ruleRecommendations: Record<InferenceRuleId, string> = {
      chronic_no_show:
        'Schedule family meeting to discuss attendance barriers and commitment.',
      declining_attendance:
        'Review intervention fit and check for schedule conflicts.',
      low_fidelity:
        'Provide additional training or coaching to intervention provider.',
      declining_fidelity:
        'Observe upcoming sessions and provide feedback.',
      behind_schedule:
        'Add make-up sessions or increase weekly frequency.',
      critically_behind:
        'Escalate to MTSS team lead for intervention review.',
      low_engagement:
        'Consider alternative intervention approach or format.',
      cancelled_streak:
        'Contact family and provider to identify systemic issues.',
      missing_sessions:
        'Check in with intervention provider about session logging.',
      dosage_gap:
        'Review scheduling to ensure consistent session frequency.',
    };

    for (const flag of flags) {
      const rec = ruleRecommendations[flag.rule];
      if (rec && !recommendations.includes(rec)) {
        recommendations.push(rec);
      }
    }

    return recommendations;
  }

  private determineHealth(
    flags: InferenceFlag[]
  ): 'healthy' | 'warning' | 'critical' {
    if (flags.some((f) => f.severity === 'critical')) {
      return 'critical';
    }
    if (flags.some((f) => f.severity === 'warning')) {
      return 'warning';
    }
    return 'healthy';
  }

  private computeFidelityTrend(
    sessions: Session[]
  ): 'improving' | 'stable' | 'declining' | null {
    const withFidelity = sessions
      .filter((s) => s.fidelityScore !== null)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    if (withFidelity.length < 3) return null;

    const recent = withFidelity.slice(-3);
    const first = recent[0].fidelityScore || 0;
    const last = recent[recent.length - 1].fidelityScore || 0;

    const diff = last - first;
    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  private findNextSession(sessions: Session[]): Date | null {
    const now = new Date();
    const future = sessions
      .filter(
        (s) =>
          s.scheduledDate > now &&
          (s.status === 'scheduled' || s.status === 'rescheduled')
      )
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    return future.length > 0 ? future[0].scheduledDate : null;
  }

  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  private parseMetricsRow(row: DosageMetricsRow): DosageMetrics {
    return {
      id: row.id,
      interventionId: row.intervention_id,
      schoolId: row.school_id,
      studentId: row.student_id,
      plan: {
        sessionsPerWeek: row.planned_sessions_per_week,
        minutesPerSession: row.planned_minutes_per_session,
        totalWeeks: row.planned_total_weeks,
        totalSessions: row.planned_total_sessions,
        totalMinutes: row.planned_total_minutes,
      },
      actual: {
        sessionsCompleted: row.actual_sessions_completed,
        sessionsPartial: row.actual_sessions_partial,
        sessionsCancelled: row.actual_sessions_cancelled,
        sessionsNoShow: row.actual_sessions_no_show,
        totalMinutes: row.actual_total_minutes,
      },
      compliance: {
        sessionCompletionRate: row.session_completion_rate,
        dosageComplianceRate: row.dosage_compliance_rate,
        attendanceRate: row.attendance_rate,
      },
      fidelity: {
        averageScore: row.average_fidelity_score,
        trend: row.fidelity_trend,
      },
      pace: {
        weeksElapsed: row.weeks_elapsed,
        sessionsBehind: row.sessions_behind_schedule,
        minutesBehind: row.minutes_behind_schedule,
        onTrack: row.on_track,
      },
      status: row.dosage_status,
      inferenceFlags: row.inference_flags || [],
      firstSessionDate: row.first_session_date
        ? new Date(row.first_session_date)
        : null,
      lastSessionDate: row.last_session_date
        ? new Date(row.last_session_date)
        : null,
      nextSessionDate: row.next_session_date
        ? new Date(row.next_session_date)
        : null,
      computedAt: new Date(row.computed_at),
    };
  }

  private parseSessionRow(row: SessionRow): Session {
    return {
      id: row.id,
      interventionId: row.intervention_id,
      schoolId: row.school_id,
      studentId: row.student_id,
      scheduledDate: new Date(row.scheduled_date),
      scheduledStartTime: row.scheduled_start_time,
      scheduledDurationMinutes: row.scheduled_duration_minutes,
      actualDate: row.actual_date ? new Date(row.actual_date) : null,
      actualStartTime: row.actual_start_time,
      actualDurationMinutes: row.actual_duration_minutes,
      status: row.status,
      cancellationReason: row.cancellation_reason,
      deliveredBy: row.delivered_by,
      location: row.location,
      modality: row.modality,
      groupSize: row.group_size,
      fidelityScore: row.fidelity_score,
      studentEngaged: row.student_engaged,
      sessionNotes: row.session_notes,
      createdAt: new Date(row.created_at),
    };
  }

  private emptySchoolSummary(): SchoolDosageSummary {
    return {
      schoolId: this.schoolId,
      totalInterventions: 0,
      byStatus: {
        not_started: 0,
        on_track: 0,
        behind: 0,
        critical: 0,
        completed: 0,
        discontinued: 0,
      },
      onTrackCount: 0,
      behindCount: 0,
      criticalCount: 0,
      averageCompletionRate: 0,
      averageFidelityScore: 0,
      flaggedInterventions: [],
      computedAt: new Date(),
    };
  }
}

// ============================================================
// FACTORY
// ============================================================

export function createDosageAnalyzer(schoolId: string): DosageAnalyzer {
  return new DosageAnalyzer(schoolId);
}

// Export rules for testing
export { inferenceRules };
