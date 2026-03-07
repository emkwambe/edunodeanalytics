/**
 * Dosage Analysis Types
 * =====================
 *
 * Type definitions for the intervention dosage tracking system.
 * Maps to tables created in migration 00007_intervention_dosage_metrics.sql
 *
 * Tables:
 *   - intervention_sessions -> SessionRow
 *   - intervention_dosage_metrics -> DosageMetricsRow
 */

// ============================================================
// ENUMS
// ============================================================

/** Session completion status */
export type SessionStatus =
  | 'scheduled'
  | 'completed'
  | 'partial'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

/** Session modality */
export type SessionModality = 'in_person' | 'virtual' | 'hybrid' | 'async';

/** Overall dosage status for an intervention */
export type DosageStatus =
  | 'not_started'
  | 'on_track'
  | 'behind'
  | 'critical'
  | 'completed'
  | 'discontinued';

/** Trend direction for fidelity */
export type FidelityTrend = 'improving' | 'stable' | 'declining';

/** Inference rule severity */
export type InferenceSeverity = 'info' | 'warning' | 'critical';

// ============================================================
// SESSION TYPES (intervention_sessions table)
// ============================================================

/** Fidelity checklist item */
export interface FidelityChecklistItem {
  item: string;
  completed: boolean;
}

/** Row from intervention_sessions table */
export interface SessionRow {
  id: string;
  intervention_id: string;
  school_id: string;
  student_id: string;

  // Scheduled
  scheduled_date: string;
  scheduled_start_time: string | null;
  scheduled_duration_minutes: number;

  // Actual
  actual_date: string | null;
  actual_start_time: string | null;
  actual_duration_minutes: number | null;

  // Status
  status: SessionStatus;
  cancellation_reason: string | null;

  // Delivery
  delivered_by: string | null;
  location: string | null;
  modality: SessionModality | null;
  group_size: number;

  // Fidelity
  fidelity_checklist: FidelityChecklistItem[];
  fidelity_score: number | null;
  fidelity_notes: string | null;

  // Engagement
  student_engaged: boolean;
  engagement_notes: string | null;

  // Outcomes
  session_notes: string | null;
  skills_practiced: string[];
  homework_assigned: string | null;
  parent_communication: boolean;

  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/** Session input for creating/updating */
export interface SessionInput {
  interventionId: string;
  schoolId: string;
  studentId: string;
  scheduledDate: Date;
  scheduledStartTime?: string;
  scheduledDurationMinutes?: number;
  modality?: SessionModality;
  deliveredBy?: string;
  location?: string;
}

/** Session for API responses */
export interface Session {
  id: string;
  interventionId: string;
  schoolId: string;
  studentId: string;
  scheduledDate: Date;
  scheduledStartTime: string | null;
  scheduledDurationMinutes: number;
  actualDate: Date | null;
  actualStartTime: string | null;
  actualDurationMinutes: number | null;
  status: SessionStatus;
  cancellationReason: string | null;
  deliveredBy: string | null;
  location: string | null;
  modality: SessionModality | null;
  groupSize: number;
  fidelityScore: number | null;
  studentEngaged: boolean;
  sessionNotes: string | null;
  createdAt: Date;
}

// ============================================================
// DOSAGE METRICS TYPES (intervention_dosage_metrics table)
// ============================================================

/** Row from intervention_dosage_metrics table */
export interface DosageMetricsRow {
  id: string;
  intervention_id: string;
  school_id: string;
  student_id: string;

  // Plan
  planned_sessions_per_week: number;
  planned_minutes_per_session: number;
  planned_total_weeks: number;
  planned_total_sessions: number;
  planned_total_minutes: number;

  // Actual
  actual_sessions_completed: number;
  actual_sessions_partial: number;
  actual_sessions_cancelled: number;
  actual_sessions_no_show: number;
  actual_total_minutes: number;

  // Compliance
  session_completion_rate: number | null;
  dosage_compliance_rate: number | null;
  attendance_rate: number | null;

  // Fidelity
  average_fidelity_score: number | null;
  fidelity_trend: FidelityTrend | null;

  // Pace
  weeks_elapsed: number;
  sessions_behind_schedule: number;
  minutes_behind_schedule: number;
  on_track: boolean;

  // Engagement
  average_engagement_rate: number | null;

  // Status
  dosage_status: DosageStatus;
  inference_flags: InferenceFlag[];

  // Dates
  first_session_date: string | null;
  last_session_date: string | null;
  next_session_date: string | null;
  computed_at: string;
  created_at: string;
  updated_at: string;
}

/** Dosage metrics for API responses */
export interface DosageMetrics {
  id: string;
  interventionId: string;
  schoolId: string;
  studentId: string;

  plan: DosagePlan;
  actual: DosageActual;
  compliance: DosageCompliance;
  fidelity: DosageFidelity;
  pace: DosagePace;

  status: DosageStatus;
  inferenceFlags: InferenceFlag[];

  firstSessionDate: Date | null;
  lastSessionDate: Date | null;
  nextSessionDate: Date | null;
  computedAt: Date;
}

/** Dosage plan configuration */
export interface DosagePlan {
  sessionsPerWeek: number;
  minutesPerSession: number;
  totalWeeks: number;
  totalSessions: number;
  totalMinutes: number;
  modality?: SessionModality;
  groupSize?: number;
  deliveredBy?: string[];
  fidelityChecklist?: string[];
}

/** Actual delivery stats */
export interface DosageActual {
  sessionsCompleted: number;
  sessionsPartial: number;
  sessionsCancelled: number;
  sessionsNoShow: number;
  totalMinutes: number;
}

/** Compliance rates */
export interface DosageCompliance {
  sessionCompletionRate: number | null;
  dosageComplianceRate: number | null;
  attendanceRate: number | null;
}

/** Fidelity metrics */
export interface DosageFidelity {
  averageScore: number | null;
  trend: FidelityTrend | null;
}

/** Pace tracking */
export interface DosagePace {
  weeksElapsed: number;
  sessionsBehind: number;
  minutesBehind: number;
  onTrack: boolean;
}

// ============================================================
// INFERENCE FLAGS
// ============================================================

/** Inference rule identifiers */
export type InferenceRuleId =
  | 'chronic_no_show'
  | 'declining_attendance'
  | 'low_fidelity'
  | 'declining_fidelity'
  | 'behind_schedule'
  | 'critically_behind'
  | 'low_engagement'
  | 'cancelled_streak'
  | 'missing_sessions'
  | 'dosage_gap';

/** Inference flag from analyzer */
export interface InferenceFlag {
  rule: InferenceRuleId;
  severity: InferenceSeverity;
  message: string;
  detectedAt: string;
  data?: Record<string, unknown>;
}

/** Inference rule definition */
export interface InferenceRule {
  id: InferenceRuleId;
  name: string;
  description: string;
  severity: InferenceSeverity;
  evaluate: (metrics: DosageMetrics, sessions: Session[]) => InferenceFlag | null;
}

// ============================================================
// ANALYSIS RESULTS
// ============================================================

/** Result of dosage analysis for a single intervention */
export interface DosageAnalysisResult {
  interventionId: string;
  metrics: DosageMetrics;
  sessions: Session[];
  flags: InferenceFlag[];
  recommendations: string[];
  overallHealth: 'healthy' | 'warning' | 'critical';
}

/** School-wide dosage summary */
export interface SchoolDosageSummary {
  schoolId: string;
  totalInterventions: number;
  byStatus: Record<DosageStatus, number>;
  onTrackCount: number;
  behindCount: number;
  criticalCount: number;
  averageCompletionRate: number;
  averageFidelityScore: number;
  flaggedInterventions: Array<{
    interventionId: string;
    studentName: string;
    flags: InferenceFlag[];
  }>;
  computedAt: Date;
}

// ============================================================
// SESSION SCHEDULING
// ============================================================

/** Schedule generation options */
export interface ScheduleOptions {
  startDate: Date;
  endDate: Date;
  sessionsPerWeek: number;
  minutesPerSession: number;
  preferredDays?: number[]; // 0 = Sunday, 6 = Saturday
  preferredTime?: string; // HH:mm format
  modality?: SessionModality;
  skipHolidays?: boolean;
  holidays?: Date[];
}

/** Generated schedule */
export interface GeneratedSchedule {
  sessions: Array<{
    date: Date;
    time: string;
    duration: number;
  }>;
  totalSessions: number;
  totalMinutes: number;
  weeksSpanned: number;
}

// ============================================================
// API TYPES
// ============================================================

/** Dosage API query params */
export interface DosageQueryParams {
  status?: DosageStatus;
  onTrack?: boolean;
  hasFlags?: boolean;
  interventionType?: string;
  page?: number;
  limit?: number;
}

/** Session log input */
export interface SessionLogInput {
  sessionId: string;
  actualDate?: Date;
  actualStartTime?: string;
  actualDurationMinutes?: number;
  status: SessionStatus;
  cancellationReason?: string;
  fidelityChecklist?: FidelityChecklistItem[];
  studentEngaged?: boolean;
  engagementNotes?: string;
  sessionNotes?: string;
  skillsPracticed?: string[];
  homeworkAssigned?: string;
  parentCommunication?: boolean;
}
