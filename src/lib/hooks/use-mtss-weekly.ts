/**
 * MTSS Weekly Activity Hook
 * =========================
 *
 * Custom hook to fetch MTSS weekly activity metrics for a school.
 * Uses SWR for caching and auto-refresh on window focus.
 *
 * Sprint 5B - Data fetching hook for Pulse Dashboard "This Week" section.
 */

import useSWR from 'swr';
import { fetcher } from './fetcher';

export interface MtssWeeklyActivity {
  new_risk_alerts: number;
  interventions_created: number;
  students_improved: number;
  students_worsened: number;
  period_start: string;
  period_end: string;
  last_updated: string;
}

export interface UseMtssWeeklyResult {
  data: MtssWeeklyActivity | null;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

/**
 * Check if all weekly activity metrics are zero (empty state)
 */
export function isMtssWeeklyEmpty(data: MtssWeeklyActivity | null): boolean {
  if (!data) return true;

  return (
    data.new_risk_alerts === 0 &&
    data.interventions_created === 0 &&
    data.students_improved === 0 &&
    data.students_worsened === 0
  );
}

/**
 * Fetch MTSS weekly activity metrics for a school.
 *
 * @param schoolId - The school ID to fetch metrics for (null to skip fetching)
 * @returns { data, isLoading, error, mutate }
 */
export function useMtssWeekly(schoolId: string | null): UseMtssWeeklyResult {
  const { data, error, isLoading, mutate } = useSWR<MtssWeeklyActivity>(
    schoolId ? `/api/schools/${schoolId}/mtss-weekly-activity` : null,
    fetcher,
    {
      // Auto-refresh on window focus
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
