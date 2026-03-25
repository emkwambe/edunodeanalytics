/**
 * MTSS Summary Hook
 * =================
 *
 * Custom hook to fetch MTSS evidence metrics for a school.
 * Uses SWR for caching and auto-refresh on window focus.
 *
 * Sprint 5A - Data fetching hook for MTSSEvidenceMetrics component.
 */

import useSWR from 'swr';
import { fetcher } from './fetcher';

export interface MtssSummary {
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
  period: string;
  last_updated: string;
}

export interface UseMtssSummaryResult {
  data: MtssSummary | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

/**
 * Check if all MTSS metrics are zero (empty state)
 */
export function isMtssSummaryEmpty(data: MtssSummary | null): boolean {
  if (!data) return true;

  return (
    data.students_identified === 0 &&
    data.total_active_interventions === 0 &&
    data.students_improved === 0 &&
    data.students_maintained === 0 &&
    data.students_worsened === 0
  );
}

/**
 * Fetch MTSS evidence metrics for a school.
 *
 * @param schoolId - The school ID to fetch metrics for (null to skip fetching)
 * @returns { data, isLoading, error, mutate }
 */
export function useMtssSummary(schoolId: string | null): UseMtssSummaryResult {
  const { data, error, isLoading, mutate } = useSWR<MtssSummary>(
    schoolId ? `/api/schools/${schoolId}/mtss-summary` : null,
    fetcher,
    {
      // Auto-refresh on window focus (stale data is bad for dashboards)
      revalidateOnFocus: true,
      // Refresh every 5 minutes in background
      refreshInterval: 5 * 60 * 1000,
      // Keep previous data while revalidating
      keepPreviousData: true,
      // Retry on error
      errorRetryCount: 2,
    }
  );

  return {
    data: data ?? null,
    isLoading,
    error: error ?? null,
    mutate: () => { mutate(); },
  };
}

/**
 * Get variant color for response rate
 * Used by MTSSEvidenceMetrics component
 */
export function getResponseRateVariant(rate: number): 'success' | 'warning' | 'danger' {
  if (rate >= 0.85) return 'success';
  if (rate >= 0.70) return 'warning';
  return 'danger';
}

/**
 * Get variant color for dosage compliance
 */
export function getDosageComplianceVariant(rate: number): 'success' | 'warning' | 'danger' {
  if (rate >= 0.80) return 'success';
  if (rate >= 0.60) return 'warning';
  return 'danger';
}

/**
 * Get variant color for improvement rate
 */
export function getImprovementRateVariant(rate: number): 'success' | 'warning' | 'danger' {
  if (rate >= 0.80) return 'success';
  if (rate >= 0.60) return 'warning';
  return 'danger';
}
