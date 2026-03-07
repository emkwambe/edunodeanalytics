// src/lib/risk-engine/metrics-aggregator.ts
/**
 * Student Metrics Aggregator
 * ==========================
 *
 * Computes/updates student_metrics rows from raw data on the students table
 * and connected data sources. Calculates data_completeness.
 *
 * Called:
 *   - After sync events (roster sync, LMS sync, assessment sync)
 *   - Before risk evaluation (by orchestrator)
 *   - Manually via admin action
 *
 * Data flow:
 *   students table (raw) -> metrics-aggregator -> student_metrics (normalized)
 *                                              -> student_metric_history (weekly snapshot)
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { StudentMetricsRow } from '@/lib/risk-engine/types';

// ============================================================
// Types
// ============================================================

export interface AggregationResult {
  schoolId: string;
  studentsProcessed: number;
  metricsUpserted: number;
  historySnapshotted: number;
  errors: string[];
  durationMs: number;
}

interface StudentRawData {
  id: string;
  school_id: string;
  attendance_rate: number | null;
  days_absent: number | null;
  days_present: number | null;
  is_chronically_absent: boolean | null;
  proficiency_level: number | null;
  growth_percentile: number | null;
  math_scores: Record<string, unknown> | null;
  reading_scores: Record<string, unknown> | null;
  risk_factors: Record<string, unknown> | null;
  purpose_driven_metrics: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  grade_level: number;
  has_iep: boolean;
  has_504_plan: boolean;
  is_active: boolean;
}

// ============================================================
// Metrics Aggregator
// ============================================================

/**
 * Aggregate metrics for all active students in a school.
 * Reads raw data from students table, computes normalized metrics,
 * upserts into student_metrics, and optionally creates weekly snapshots.
 */
export async function aggregateSchoolMetrics(
  schoolId: string,
  options: {
    createSnapshot?: boolean;
    syncSource?: 'sis' | 'lms' | 'assessment' | 'manual';
  } = {}
): Promise<AggregationResult> {
  const startTime = Date.now();
  const supabase = createAdminSupabaseClient();
  const errors: string[] = [];
  let metricsUpserted = 0;
  let historySnapshotted = 0;

  // 1. Fetch all active students for this school
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select(
      'id, school_id, attendance_rate, days_absent, days_present, ' +
      'is_chronically_absent, proficiency_level, growth_percentile, ' +
      'math_scores, reading_scores, risk_factors, purpose_driven_metrics, ' +
      'metadata, grade_level, has_iep, has_504_plan, is_active'
    )
    .eq('school_id', schoolId)
    .eq('is_active', true);

  if (fetchError) {
    errors.push(`Failed to fetch students: ${fetchError.message}`);
    return {
      schoolId,
      studentsProcessed: 0,
      metricsUpserted: 0,
      historySnapshotted: 0,
      errors,
      durationMs: Date.now() - startTime,
    };
  }

  if (!students || students.length === 0) {
    return {
      schoolId,
      studentsProcessed: 0,
      metricsUpserted: 0,
      historySnapshotted: 0,
      errors,
      durationMs: Date.now() - startTime,
    };
  }

  // 2. Compute metrics for each student and batch upsert
  const metricsRows: Partial<StudentMetricsRow>[] = [];

  for (const student of students as unknown as StudentRawData[]) {
    try {
      const metrics = computeStudentMetrics(student);
      metricsRows.push(metrics);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Student ${student.id}: ${msg}`);
    }
  }

  // 3. Batch upsert into student_metrics (chunk by 100)
  const chunkSize = 100;
  for (let i = 0; i < metricsRows.length; i += chunkSize) {
    const chunk = metricsRows.slice(i, i + chunkSize);

    // Add sync timestamp based on source
    const syncTimestamp = new Date().toISOString();
    const chunkWithSync = chunk.map((m) => {
      const synced = { ...m, computed_at: syncTimestamp };
      if (options.syncSource === 'sis') synced.last_sis_sync = syncTimestamp;
      if (options.syncSource === 'lms') synced.last_lms_sync = syncTimestamp;
      if (options.syncSource === 'assessment') synced.last_assessment_sync = syncTimestamp;
      return synced;
    });

    const { error: upsertError } = await supabase
      .from('student_metrics')
      .upsert(chunkWithSync as StudentMetricsRow[], {
        onConflict: 'student_id,school_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      errors.push(`Upsert chunk ${i / chunkSize + 1}: ${upsertError.message}`);
    } else {
      metricsUpserted += chunk.length;
    }
  }

  // 4. Create weekly snapshot if requested
  if (options.createSnapshot) {
    historySnapshotted = await createWeeklySnapshot(supabase, schoolId, metricsRows, errors);
  }

  return {
    schoolId,
    studentsProcessed: students.length,
    metricsUpserted,
    historySnapshotted,
    errors,
    durationMs: Date.now() - startTime,
  };
}

// ============================================================
// Metric Computation (per student)
// ============================================================

/**
 * Compute normalized metrics from a student's raw data.
 * Maps raw student table fields into the student_metrics schema.
 */
function computeStudentMetrics(student: StudentRawData): Partial<StudentMetricsRow> {
  // Extract assessment scores from JSON
  const mathPct = extractAssessmentPct(student.math_scores);
  const readingPct = extractAssessmentPct(student.reading_scores);

  // Extract engagement from purpose_driven_metrics
  const engagement = extractEngagement(student.purpose_driven_metrics);

  // Calculate days absent in last 30 (estimate from rate if not available)
  const daysAbsentLast30 = estimateDaysAbsentLast30(
    student.attendance_rate,
    student.days_absent,
    student.days_present
  );

  // Chronic absence flag
  const chronicAbsenceFlag = student.is_chronically_absent ?? false;

  // Data completeness: count non-null indicator fields / total indicator fields
  const completeness = calculateDataCompleteness(student, mathPct, readingPct, engagement);

  return {
    student_id: student.id,
    school_id: student.school_id,

    // Attendance
    attendance_rate: student.attendance_rate != null
      ? Number(student.attendance_rate)
      : null,
    attendance_trend: null, // Computed by trend detector in future
    days_absent_last_30: daysAbsentLast30,
    chronic_absence_flag: chronicAbsenceFlag,

    // Academic
    gpa_current: null, // Not on students table yet
    gpa_trend: null,
    math_assessment_pct: mathPct,
    reading_assessment_pct: readingPct,
    assessment_trend: null,
    proficiency_level: student.proficiency_level != null
      ? Number(student.proficiency_level)
      : null,
    growth_percentile: student.growth_percentile ?? null,

    // Assignments (not yet populated from LMS sync)
    missing_assignment_rate: null,
    missing_assignments_count: 0,
    total_assignments_count: 0,
    assignment_trend: null,

    // Behavior (not yet populated from SIS sync)
    behavior_incident_count: 0,
    behavior_incident_trend: null,
    suspensions_count: 0,

    // Engagement
    engagement_score: engagement,

    // Metadata
    data_completeness: completeness,
    computed_at: new Date().toISOString(),
  };
}

// ============================================================
// Helper functions
// ============================================================

/**
 * Extract assessment percentage from JSON scores object.
 * Supports multiple formats: { latest_pct: N }, { score: N, max: M }, { percentile: N }
 */
function extractAssessmentPct(
  scores: Record<string, unknown> | null
): number | null {
  if (!scores) return null;

  // Direct percentage
  if (typeof scores.latest_pct === 'number') return scores.latest_pct;
  if (typeof scores.percent === 'number') return scores.percent;
  if (typeof scores.percentile === 'number') return scores.percentile;

  // Score / max
  if (typeof scores.score === 'number' && typeof scores.max === 'number' && scores.max > 0) {
    return Math.round((scores.score as number / (scores.max as number)) * 100);
  }

  // Scale score with level
  if (typeof scores.scale_score === 'number') {
    // Can't convert without benchmark; return null
    return null;
  }

  return null;
}

/**
 * Extract engagement score from purpose_driven_metrics JSON.
 */
function extractEngagement(
  metrics: Record<string, unknown> | null
): number | null {
  if (!metrics) return null;
  if (typeof metrics.engagement === 'number') return metrics.engagement;
  if (typeof metrics.engagement_score === 'number') return metrics.engagement_score;
  return null;
}

/**
 * Estimate days absent in the last 30 school days.
 * Uses days_absent if available, otherwise derives from attendance_rate.
 */
function estimateDaysAbsentLast30(
  attendanceRate: number | null,
  daysAbsent: number | null,
  daysPresent: number | null
): number {
  // If we have direct absence count, use it (capped at 30)
  if (daysAbsent != null) {
    return Math.min(daysAbsent, 30);
  }

  // Derive from rate: assume 30 school days in the window
  if (attendanceRate != null) {
    const rate = Number(attendanceRate);
    // Rate could be 0-1 or 0-100
    const normalized = rate > 1 ? rate / 100 : rate;
    return Math.round((1 - normalized) * 30);
  }

  // If we have days_present, infer absent from 30-day window
  if (daysPresent != null) {
    return Math.max(0, 30 - daysPresent);
  }

  return 0;
}

/**
 * Calculate data completeness as a ratio of available indicators.
 * Returns a value between 0 and 1.
 */
function calculateDataCompleteness(
  student: StudentRawData,
  mathPct: number | null,
  readingPct: number | null,
  engagement: number | null
): number {
  const indicators = [
    student.attendance_rate != null,
    student.proficiency_level != null,
    student.growth_percentile != null,
    mathPct != null,
    readingPct != null,
    student.is_chronically_absent != null,
    engagement != null,
    student.days_absent != null || student.days_present != null,
  ];

  const available = indicators.filter(Boolean).length;
  return Math.round((available / indicators.length) * 1000) / 1000;
}

// ============================================================
// Weekly Snapshot
// ============================================================

/**
 * Create weekly snapshot entries in student_metric_history.
 * Only creates one snapshot per student per week (deduped by unique constraint).
 */
async function createWeeklySnapshot(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  schoolId: string,
  metrics: Partial<StudentMetricsRow>[],
  errors: string[]
): Promise<number> {
  const now = new Date();
  const snapshotDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // ISO week number
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

  const snapshots = metrics.map((m) => ({
    student_id: m.student_id!,
    school_id: schoolId,
    snapshot_date: snapshotDate,
    snapshot_week: weekNumber,
    snapshot_year: now.getFullYear(),
    attendance_rate: m.attendance_rate ?? null,
    gpa_current: m.gpa_current ?? null,
    math_assessment_pct: m.math_assessment_pct ?? null,
    reading_assessment_pct: m.reading_assessment_pct ?? null,
    missing_assignment_rate: m.missing_assignment_rate ?? null,
    behavior_incident_count: m.behavior_incident_count ?? null,
    proficiency_level: m.proficiency_level ?? null,
    growth_percentile: m.growth_percentile ?? null,
    engagement_score: m.engagement_score ?? null,
  }));

  // Batch insert, ignoring conflicts (unique constraint on student+school+year+week)
  const chunkSize = 100;
  let inserted = 0;

  for (let i = 0; i < snapshots.length; i += chunkSize) {
    const chunk = snapshots.slice(i, i + chunkSize);

    const { error: insertError, data } = await supabase
      .from('student_metric_history')
      .upsert(chunk, {
        onConflict: 'student_id,school_id,snapshot_year,snapshot_week',
        ignoreDuplicates: true,
      })
      .select('id');

    if (insertError) {
      errors.push(`Snapshot chunk ${i / chunkSize + 1}: ${insertError.message}`);
    } else {
      inserted += data?.length ?? 0;
    }
  }

  return inserted;
}

// ============================================================
// Single-student aggregation (for real-time after individual sync)
// ============================================================

/**
 * Aggregate metrics for a single student.
 * Used after individual data updates (e.g., single student sync).
 */
export async function aggregateStudentMetrics(
  studentId: string,
  schoolId: string,
  syncSource?: 'sis' | 'lms' | 'assessment' | 'manual'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminSupabaseClient();

  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select(
      'id, school_id, attendance_rate, days_absent, days_present, ' +
      'is_chronically_absent, proficiency_level, growth_percentile, ' +
      'math_scores, reading_scores, risk_factors, purpose_driven_metrics, ' +
      'metadata, grade_level, has_iep, has_504_plan, is_active'
    )
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .single();

  if (fetchError || !student) {
    return { success: false, error: fetchError?.message || 'Student not found' };
  }

  const metrics = computeStudentMetrics(student as StudentRawData);

  // Add sync timestamp
  const syncTimestamp = new Date().toISOString();
  if (syncSource === 'sis') metrics.last_sis_sync = syncTimestamp;
  if (syncSource === 'lms') metrics.last_lms_sync = syncTimestamp;
  if (syncSource === 'assessment') metrics.last_assessment_sync = syncTimestamp;

  const { error: upsertError } = await supabase
    .from('student_metrics')
    .upsert(metrics as StudentMetricsRow, {
      onConflict: 'student_id,school_id',
      ignoreDuplicates: false,
    });

  if (upsertError) {
    return { success: false, error: upsertError.message };
  }

  return { success: true };
}