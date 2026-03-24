/**
 * Dosage React Hooks
 * ==================
 *
 * Client-side hooks for accessing intervention dosage data.
 * Uses SWR for caching and real-time updates.
 *
 * Usage:
 *   const { summary } = useDosageSummary(schoolId);
 *   const { dosage } = useInterventionDosage(schoolId, interventionId);
 */

import useSWR from 'swr';
import { fetcher } from './fetcher';
import type {
  DosageStatus,
  InferenceFlag,
  InferenceSeverity,
} from '@/lib/dosage/types';

// ============================================================
// Types
// ============================================================

export interface DosageSummaryResponse {
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
    interventionTitle?: string;
    flags: InferenceFlag[];
  }>;
  computedAt: string;
}

export interface InterventionDosageResponse {
  interventionId: string;
  studentId: string;
  studentName: string;
  interventionTitle: string;
  metrics: {
    plan: {
      sessionsPerWeek: number;
      minutesPerSession: number;
      totalSessions: number;
      totalMinutes: number;
    };
    actual: {
      sessionsCompleted: number;
      sessionsPartial: number;
      sessionsCancelled: number;
      sessionsNoShow: number;
      totalMinutes: number;
    };
    compliance: {
      sessionCompletionRate: number | null;
      dosageComplianceRate: number | null;
      attendanceRate: number | null;
    };
    fidelity: {
      averageScore: number | null;
      trend: 'improving' | 'stable' | 'declining' | null;
    };
    pace: {
      weeksElapsed: number;
      sessionsBehind: number;
      minutesBehind: number;
      onTrack: boolean;
    };
  };
  status: DosageStatus;
  flags: InferenceFlag[];
  recommendations: string[];
  overallHealth: 'healthy' | 'warning' | 'critical';
}

export interface DosageAlertItem {
  interventionId: string;
  studentId: string;
  studentName: string;
  interventionTitle: string;
  flag: InferenceFlag;
}

// ============================================================
// Hooks
// ============================================================

/**
 * Get school-wide dosage summary
 */
export function useDosageSummary(schoolId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<DosageSummaryResponse>(
    schoolId ? `/api/schools/${schoolId}/dosage` : null,
    fetcher
  );

  return {
    summary: data,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Get dosage data for a single intervention
 */
export function useInterventionDosage(
  schoolId: string | null,
  interventionId: string | null
) {
  const { data, error, isLoading, mutate } = useSWR<InterventionDosageResponse>(
    schoolId && interventionId
      ? `/api/schools/${schoolId}/dosage/${interventionId}`
      : null,
    fetcher
  );

  return {
    dosage: data,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Get dosage alerts (flagged interventions) for a school
 * Returns a flattened list of alerts from all flagged interventions
 */
export function useDosageAlerts(
  schoolId: string | null,
  options: {
    severity?: InferenceSeverity;
    limit?: number;
  } = {}
) {
  const { summary, error, isLoading, mutate } = useDosageSummary(schoolId);

  // Flatten flags into individual alerts
  let alerts: DosageAlertItem[] = [];

  if (summary?.flaggedInterventions) {
    for (const intervention of summary.flaggedInterventions) {
      for (const flag of intervention.flags) {
        if (options.severity && flag.severity !== options.severity) {
          continue;
        }
        alerts.push({
          interventionId: intervention.interventionId,
          studentId: '', // Will be fetched from intervention detail if needed
          studentName: intervention.studentName,
          interventionTitle: intervention.interventionTitle || 'Intervention',
          flag,
        });
      }
    }
  }

  // Sort by severity (critical first, then warning, then info)
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.flag.severity] - severityOrder[b.flag.severity]);

  // Apply limit
  if (options.limit && options.limit > 0) {
    alerts = alerts.slice(0, options.limit);
  }

  return {
    alerts,
    total: summary?.flaggedInterventions?.reduce((sum, i) => sum + i.flags.length, 0) || 0,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Get compliance rate for dashboard display
 * Returns a color-coded status based on rate
 */
export function getComplianceStatus(rate: number | null): {
  label: string;
  color: 'emerald' | 'amber' | 'red' | 'slate';
} {
  if (rate === null) {
    return { label: 'No Data', color: 'slate' };
  }
  if (rate >= 0.8) {
    return { label: 'On Track', color: 'emerald' };
  }
  if (rate >= 0.6) {
    return { label: 'Behind', color: 'amber' };
  }
  return { label: 'Critical', color: 'red' };
}

/**
 * Format compliance rate as percentage string
 */
export function formatComplianceRate(rate: number | null): string {
  if (rate === null) return '--%';
  return `${Math.round(rate * 100)}%`;
}
