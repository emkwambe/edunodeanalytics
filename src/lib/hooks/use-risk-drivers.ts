import useSWR from 'swr';
import { fetcher } from './fetcher';

export interface RiskDriver {
  name: string;
  category: string;
  studentsAffected: number;
  avgWeightedScore: number;
  maxWeightedScore: number;
  totalWeightedScore: number;
}

export interface RiskDriversResponse {
  drivers: RiskDriver[];
  totalStudents: number;
}

/**
 * Fetch aggregated risk drivers for a school
 * Shows which indicators are causing the most risk and how many students are affected
 */
export function useRiskDrivers(schoolId: string | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<RiskDriversResponse>(
    schoolId ? `/api/schools/${schoolId}/risk/drivers` : null,
    fetcher
  );

  return {
    drivers: data?.drivers ?? [],
    totalStudents: data?.totalStudents ?? 0,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: string): {
  label: string;
  color: string;
  bgColor: string;
} {
  const categories: Record<string, { label: string; color: string; bgColor: string }> = {
    attendance: {
      label: 'Attendance',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
    },
    academic: {
      label: 'Academic',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/20',
    },
    behavior: {
      label: 'Behavior',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
    },
    engagement: {
      label: 'Engagement',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
    },
    assignments: {
      label: 'Assignments',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    trend: {
      label: 'Trend',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    other: {
      label: 'Other',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/20',
    },
  };

  return categories[category] || categories.other;
}
