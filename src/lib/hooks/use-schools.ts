import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, mutationFetcher, buildQueryString } from './fetcher';
import type { School } from '@/lib/database.types';

// Types
export interface SchoolsResponse {
  data: School[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SchoolMetrics {
  totalStudents: number;
  totalTeachers: number;
  averageAttendance: number;
  averageGpa: number;
  graduationRate: number;
}

export interface UseSchoolsOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

// Hooks
export function useSchools(options: UseSchoolsOptions = {}) {
  const queryString = buildQueryString(options as Record<string, string | number | boolean | undefined | null>);

  const { data, error, isLoading, isValidating, mutate } = useSWR<SchoolsResponse>(
    `/api/schools${queryString}`,
    fetcher
  );

  return {
    schools: data?.data ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

export function useSchool(schoolIdOrSlug: string | null) {
  const { data, error, isLoading, mutate } = useSWR<School>(
    schoolIdOrSlug ? `/api/schools/${schoolIdOrSlug}` : null,
    fetcher
  );

  return {
    school: data,
    error,
    isLoading,
    mutate,
  };
}

export function useSchoolMetrics(schoolId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<SchoolMetrics>(
    schoolId ? `/api/schools/${schoolId}/metrics` : null,
    fetcher
  );

  return {
    metrics: data,
    error,
    isLoading,
    mutate,
  };
}

export function useCreateSchool() {
  const { trigger, isMutating, error } = useSWRMutation(
    '/api/schools',
    mutationFetcher<School, Partial<School>>
  );

  return {
    createSchool: (school: Partial<School>) =>
      trigger({ method: 'POST', body: school }),
    isCreating: isMutating,
    error,
  };
}

export function useUpdateSchool(schoolId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}`,
    mutationFetcher<School, Partial<School>>
  );

  return {
    updateSchool: (updates: Partial<School>) =>
      trigger({ method: 'PATCH', body: updates }),
    isUpdating: isMutating,
    error,
  };
}
