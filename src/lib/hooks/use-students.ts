import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, mutationFetcher, buildQueryString } from './fetcher';
import type { Student } from '@/lib/database.types';

// Types
export interface StudentsResponse {
  data: Student[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface StudentMetrics {
  totalStudents: number;
  activeStudents: number;
  riskDistribution: {
    onTrack: number;
    atRisk: number;
    critical: number;
  };
  averageAttendanceRate: number;
  chronicAbsenceRate: number;
  averageGrowthPercentile: number;
  averageProficiencyLevel: number;
}

export interface UseStudentsOptions {
  limit?: number;
  offset?: number;
  gradeLevel?: number;
  riskLevel?: string;
  teacherName?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Hooks
export function useStudents(schoolId: string | null, options: UseStudentsOptions = {}) {
  const queryString = buildQueryString(options as Record<string, string | number | boolean | undefined | null>);

  const { data, error, isLoading, isValidating, mutate } = useSWR<StudentsResponse>(
    schoolId ? `/api/schools/${schoolId}/students${queryString}` : null,
    fetcher
  );

  return {
    students: data?.data ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

export function useStudent(schoolId: string | null, studentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Student>(
    schoolId && studentId ? `/api/schools/${schoolId}/students/${studentId}` : null,
    fetcher
  );

  return {
    student: data,
    error,
    isLoading,
    mutate,
  };
}

export function useStudentsAtRisk(schoolId: string | null, options: { limit?: number; offset?: number } = {}) {
  const queryString = buildQueryString(options);

  const { data, error, isLoading, mutate } = useSWR<StudentsResponse>(
    schoolId ? `/api/schools/${schoolId}/students/at-risk${queryString}` : null,
    fetcher
  );

  return {
    students: data?.data ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    error,
    isLoading,
    mutate,
  };
}

export function useStudentMetrics(schoolId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<StudentMetrics>(
    schoolId ? `/api/schools/${schoolId}/students/metrics` : null,
    fetcher
  );

  return {
    metrics: data,
    error,
    isLoading,
    mutate,
  };
}

export function useCreateStudent(schoolId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/students`,
    mutationFetcher<Student, Partial<Student>>
  );

  return {
    createStudent: (student: Partial<Student>) =>
      trigger({ method: 'POST', body: student }),
    isCreating: isMutating,
    error,
  };
}

export function useUpdateStudent(schoolId: string, studentId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/students/${studentId}`,
    mutationFetcher<Student, Partial<Student>>
  );

  return {
    updateStudent: (updates: Partial<Student>) =>
      trigger({ method: 'PATCH', body: updates }),
    isUpdating: isMutating,
    error,
  };
}
