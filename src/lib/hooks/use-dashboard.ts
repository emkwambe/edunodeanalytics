import useSWR from 'swr';
import { fetcher } from './fetcher';

// Types matching the API response
export interface DashboardMetrics {
  school: {
    id: string;
    name: string;
    studentCount: number;
    teacherCount: number;
    attendanceRate: number;
    gpa: number;
    graduationRate: number;
  };
  students: {
    total: number;
    active: number;
    riskDistribution: {
      onTrack: number;
      atRisk: number;
      critical: number;
    };
    attendanceRate: number;
    chronicAbsenceRate: number;
    avgGrowthScore: number;
    avgProficiencyScore: number;
  };
  interventions: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    successRate: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    activeCount: number;
    averageDurationDays: number | null;
  };
}

export function useDashboard(schoolId: string | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardMetrics>(
    schoolId ? `/api/dashboard?schoolId=${schoolId}` : null,
    fetcher,
    {
      // Refresh dashboard data every 30 seconds
      refreshInterval: 30000,
      // Keep previous data while revalidating
      keepPreviousData: true,
    }
  );

  return {
    dashboard: data,
    school: data?.school,
    students: data?.students,
    interventions: data?.interventions,
    error,
    isLoading,
    isValidating,
    mutate,
    // Computed helpers
    totalStudents: data?.students.total ?? 0,
    atRiskCount: (data?.students.riskDistribution.atRisk ?? 0) +
                 (data?.students.riskDistribution.critical ?? 0),
    activeInterventions: data?.interventions.activeCount ?? 0,
  };
}

// Hook for just the risk distribution (useful for charts)
export function useRiskDistribution(schoolId: string | null) {
  const { data, error, isLoading } = useSWR<DashboardMetrics>(
    schoolId ? `/api/dashboard?schoolId=${schoolId}` : null,
    fetcher
  );

  const distribution = data?.students.riskDistribution;
  const total = distribution
    ? distribution.onTrack + distribution.atRisk + distribution.critical
    : 0;

  return {
    distribution,
    total,
    percentages: distribution && total > 0 ? {
      onTrack: Math.round((distribution.onTrack / total) * 100),
      atRisk: Math.round((distribution.atRisk / total) * 100),
      critical: Math.round((distribution.critical / total) * 100),
    } : null,
    error,
    isLoading,
  };
}
