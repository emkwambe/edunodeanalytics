import useSWR from 'swr';
import { fetcher, buildQueryString } from './fetcher';

// Types matching API response
export interface RiskDistribution {
  on_track: number;
  watch: number;
  at_risk: number;
  critical: number;
  total: number;
}

export interface GradeDistribution {
  grade: number;
  on_track: number;
  watch: number;
  at_risk: number;
  critical: number;
  total?: number;
}

export interface WeeklyTrendPoint {
  weekStart: string;
  on_track: number;
  watch: number;
  at_risk: number;
  critical: number;
  total?: number;
}

export interface RiskDistributionResponse {
  distribution: RiskDistribution;
  byGrade: GradeDistribution[];
  weeklyTrend: WeeklyTrendPoint[];
}

export interface UseRiskDistributionOptions {
  weeks?: number;
}

/**
 * Fetch risk distribution data for a school
 * Includes current distribution, breakdown by grade, and weekly trend
 */
export function useRiskDistribution(schoolId: string | null, options: UseRiskDistributionOptions = {}) {
  const queryString = buildQueryString(options as Record<string, string | number | boolean | undefined | null>);

  const { data, error, isLoading, isValidating, mutate } = useSWR<RiskDistributionResponse>(
    schoolId ? `/api/schools/${schoolId}/risk/distribution${queryString}` : null,
    fetcher
  );

  return {
    distribution: data?.distribution ?? { on_track: 0, watch: 0, at_risk: 0, critical: 0, total: 0 },
    byGrade: data?.byGrade ?? [],
    weeklyTrend: data?.weeklyTrend ?? [],
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

/**
 * Get percentages for the distribution (useful for charts)
 */
export function getDistributionPercentages(distribution: RiskDistribution): {
  on_track: number;
  watch: number;
  at_risk: number;
  critical: number;
} {
  const total = distribution.total || 1; // Avoid division by zero
  return {
    on_track: Math.round((distribution.on_track / total) * 100),
    watch: Math.round((distribution.watch / total) * 100),
    at_risk: Math.round((distribution.at_risk / total) * 100),
    critical: Math.round((distribution.critical / total) * 100),
  };
}
