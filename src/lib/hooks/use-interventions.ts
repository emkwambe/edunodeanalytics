import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, mutationFetcher, buildQueryString } from './fetcher';
import type { Intervention } from '@/lib/database.types';

// Types
export interface InterventionsResponse {
  data: Intervention[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface InterventionStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  successRate: number;
  completedCount: number;
  successfulCount: number;
  activeCount: number;
  averageDurationDays: number | null;
}

export interface UseInterventionsOptions {
  limit?: number;
  offset?: number;
  status?: string;
  type?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Hooks
export function useInterventions(schoolId: string | null, options: UseInterventionsOptions = {}) {
  const queryString = buildQueryString(options as Record<string, string | number | boolean | undefined | null>);

  const { data, error, isLoading, isValidating, mutate } = useSWR<InterventionsResponse>(
    schoolId ? `/api/schools/${schoolId}/interventions${queryString}` : null,
    fetcher
  );

  return {
    interventions: data?.data ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

export function useIntervention(schoolId: string | null, interventionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Intervention>(
    schoolId && interventionId
      ? `/api/schools/${schoolId}/interventions/${interventionId}`
      : null,
    fetcher
  );

  return {
    intervention: data,
    error,
    isLoading,
    mutate,
  };
}

export function usePendingInterventions(schoolId: string | null, options: { limit?: number } = {}) {
  const queryString = buildQueryString(options);

  const { data, error, isLoading, mutate } = useSWR<InterventionsResponse>(
    schoolId ? `/api/schools/${schoolId}/interventions/pending${queryString}` : null,
    fetcher
  );

  return {
    interventions: data?.data ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  };
}

export function useStudentInterventions(schoolId: string | null, studentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Intervention[]>(
    schoolId && studentId
      ? `/api/schools/${schoolId}/students/${studentId}/interventions`
      : null,
    fetcher
  );

  return {
    interventions: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

export function useInterventionStats(schoolId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<InterventionStats>(
    schoolId ? `/api/schools/${schoolId}/interventions/metrics` : null,
    fetcher
  );

  return {
    stats: data,
    error,
    isLoading,
    mutate,
  };
}

export function useCreateIntervention(schoolId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/interventions`,
    mutationFetcher<Intervention, Partial<Intervention>>
  );

  return {
    createIntervention: (intervention: Partial<Intervention>) =>
      trigger({ method: 'POST', body: intervention }),
    isCreating: isMutating,
    error,
  };
}

export function useUpdateIntervention(schoolId: string, interventionId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/interventions/${interventionId}`,
    mutationFetcher<Intervention, Partial<Intervention>>
  );

  return {
    updateIntervention: (updates: Partial<Intervention>) =>
      trigger({ method: 'PATCH', body: updates }),
    isUpdating: isMutating,
    error,
  };
}
