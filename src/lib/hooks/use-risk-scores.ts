import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, mutationFetcher, buildQueryString } from './fetcher';
import type { RiskLevel, Trajectory } from '@/lib/risk-engine/types';

// Types matching API response
export interface RiskScoreTopFactor {
  name: string;
  category: string;
  score: number;
  description: string;
}

export interface RiskScoreActiveIntervention {
  id: string;
  title: string;
  status: string;
}

export interface RiskScore {
  studentId: string;
  studentName: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  riskScore: number;
  riskLevel: RiskLevel;
  previousLevel: RiskLevel | null;
  levelChanged: boolean;
  trajectory: Trajectory;
  confidenceLevel: number;
  topFactors: RiskScoreTopFactor[];
  activeIntervention: RiskScoreActiveIntervention | null;
  hasIep: boolean;
  has504Plan: boolean;
  isChronicallyAbsent: boolean;
  computedAt: string;
}

export interface RiskScoresPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RiskScoresResponse {
  data: RiskScore[];
  pagination: RiskScoresPagination;
}

export interface UseRiskScoresOptions {
  page?: number;
  limit?: number;
  level?: RiskLevel;
  grade?: number;
  search?: string;
  sort?: 'risk_score' | 'student_name' | 'grade_level' | 'computed_at';
  order?: 'asc' | 'desc';
}

/**
 * Fetch paginated, filterable risk scores for a school
 */
export function useRiskScores(schoolId: string | null, options: UseRiskScoresOptions = {}) {
  const queryString = buildQueryString(options as Record<string, string | number | boolean | undefined | null>);

  const { data, error, isLoading, isValidating, mutate } = useSWR<RiskScoresResponse>(
    schoolId ? `/api/schools/${schoolId}/risk/scores${queryString}` : null,
    fetcher
  );

  return {
    scores: data?.data ?? [],
    pagination: data?.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 },
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

/**
 * Fetch a single student's risk history
 */
export function useStudentRiskHistory(schoolId: string | null, studentId: string | null, weeks: number = 12) {
  const { data, error, isLoading, mutate } = useSWR<{
    studentId: string;
    history: Array<{
      riskScore: number;
      riskLevel: RiskLevel;
      computedAt: string;
    }>;
  }>(
    schoolId && studentId
      ? `/api/schools/${schoolId}/risk/history/${studentId}?weeks=${weeks}`
      : null,
    fetcher
  );

  return {
    history: data?.history ?? [],
    error,
    isLoading,
    mutate,
  };
}
