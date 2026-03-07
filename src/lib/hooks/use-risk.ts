/**
 * Risk Engine React Hooks
 * =======================
 *
 * Client-side hooks for accessing risk data in React components.
 * Uses SWR for caching and real-time updates.
 *
 * Usage:
 *   const { distribution } = useDetailedRiskDistribution(schoolId);
 *   const { profile } = useStudentRiskProfile(schoolId, studentId);
 *   const { alerts } = useRiskAlerts(schoolId);
 */

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, mutationFetcher, buildQueryString } from './fetcher';
import type { RiskLevel, Trajectory, AlertSeverity, AlertStatus } from '@/lib/risk-engine/types';

// ============================================================
// Types
// ============================================================

export interface RiskDistribution {
  onTrack: number;
  watch: number;
  atRisk: number;
  critical: number;
  total: number;
}

export interface RiskScoreResponse {
  studentId: string;
  studentName: string;
  gradeLevel: number;
  riskScore: number;
  riskLevel: RiskLevel;
  trajectory: Trajectory;
  previousLevel: RiskLevel | null;
  levelChanged: boolean;
  factors: RiskFactorResponse[];
  recommendedActions: string[];
  confidence: number;
  computedAt: string;
}

export interface RiskFactorResponse {
  name: string;
  category: string;
  rawValue: number;
  normalizedScore: number;
  weight: number;
  weightedScore: number;
  description: string;
  trend: Trajectory;
}

export interface RiskAlertResponse {
  id: string;
  studentId: string;
  studentName?: string;
  alertType: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface RiskHistoryPoint {
  date: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: Record<string, number>;
}

export interface TrendAnalysisResponse {
  studentId: string;
  analyzedAt: string;
  lookbackWeeks: number;
  overallTrajectory: Trajectory;
  trends: Array<{
    metric: string;
    slope: number;
    trajectory: Trajectory;
    confidence: 'high' | 'medium' | 'low';
    predictedValue: number;
  }>;
  earlyWarningFlags: string[];
}

export interface RiskDriversResponse {
  topDrivers: Array<{
    category: string;
    studentCount: number;
    percentage: number;
  }>;
  byGradeLevel: Record<number, Record<string, number>>;
}

// ============================================================
// Distribution & Summary Hooks
// ============================================================

/**
 * Get detailed risk distribution from the risk API endpoint
 * (Note: use-dashboard.ts also has useRiskDistribution from the dashboard API)
 */
export function useDetailedRiskDistribution(schoolId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<RiskDistribution>(
    schoolId ? `/api/schools/${schoolId}/risk/distribution` : null,
    fetcher
  );

  return {
    distribution: data,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Get top risk drivers for a school
 */
export function useRiskDrivers(schoolId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<RiskDriversResponse>(
    schoolId ? `/api/schools/${schoolId}/risk/drivers` : null,
    fetcher
  );

  return {
    drivers: data,
    error,
    isLoading,
    mutate,
  };
}

// ============================================================
// Student Risk Hooks
// ============================================================

/**
 * Get current risk scores for all students
 */
export function useRiskScores(
  schoolId: string | null,
  options: {
    limit?: number;
    offset?: number;
    riskLevel?: RiskLevel;
    gradeLevel?: number;
    sortBy?: 'risk_score' | 'student_name' | 'computed_at';
    sortOrder?: 'asc' | 'desc';
  } = {}
) {
  const queryString = buildQueryString(options as Record<string, string | number | boolean | undefined | null>);

  const { data, error, isLoading, mutate } = useSWR<{
    data: RiskScoreResponse[];
    total: number;
    hasMore: boolean;
  }>(
    schoolId ? `/api/schools/${schoolId}/risk/scores${queryString}` : null,
    fetcher
  );

  return {
    scores: data?.data ?? [],
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Get risk profile for a specific student
 */
export function useStudentRiskProfile(schoolId: string | null, studentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<RiskScoreResponse>(
    schoolId && studentId ? `/api/schools/${schoolId}/risk/scores?studentId=${studentId}` : null,
    fetcher
  );

  return {
    profile: data,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Get risk history for a student
 */
export function useStudentRiskHistory(
  schoolId: string | null,
  studentId: string | null,
  options: { days?: number } = {}
) {
  const queryString = buildQueryString({ days: options.days ?? 90 });

  const { data, error, isLoading, mutate } = useSWR<RiskHistoryPoint[]>(
    schoolId && studentId
      ? `/api/schools/${schoolId}/risk/history/${studentId}${queryString}`
      : null,
    fetcher
  );

  return {
    history: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

/**
 * Get trend analysis for a student
 */
export function useStudentTrends(schoolId: string | null, studentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TrendAnalysisResponse>(
    schoolId && studentId
      ? `/api/schools/${schoolId}/risk/trends/${studentId}`
      : null,
    fetcher
  );

  return {
    trends: data,
    error,
    isLoading,
    mutate,
  };
}

// ============================================================
// Alert Hooks
// ============================================================

/**
 * Get active risk alerts for a school
 */
export function useRiskAlerts(
  schoolId: string | null,
  options: {
    limit?: number;
    status?: AlertStatus;
    severity?: AlertSeverity;
    studentId?: string;
  } = {}
) {
  const queryString = buildQueryString(options as Record<string, string | number | boolean | undefined | null>);

  const { data, error, isLoading, mutate } = useSWR<{
    data: RiskAlertResponse[];
    total: number;
  }>(
    schoolId ? `/api/schools/${schoolId}/risk/alerts${queryString}` : null,
    fetcher
  );

  return {
    alerts: data?.data ?? [],
    total: data?.total ?? 0,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Acknowledge an alert
 */
export function useAcknowledgeAlert(schoolId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/risk/alerts`,
    mutationFetcher<void, { alertId: string; action: string }>
  );

  return {
    acknowledge: (alertId: string) =>
      trigger({ method: 'PATCH', body: { alertId, action: 'acknowledge' } }),
    isAcknowledging: isMutating,
    error,
  };
}

/**
 * Resolve an alert
 */
export function useResolveAlert(schoolId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/risk/alerts`,
    mutationFetcher<void, { alertId: string; action: string; notes?: string }>
  );

  return {
    resolve: (alertId: string, notes?: string) =>
      trigger({ method: 'PATCH', body: { alertId, action: 'resolve', notes } }),
    isResolving: isMutating,
    error,
  };
}

/**
 * Dismiss an alert
 */
export function useDismissAlert(schoolId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/risk/alerts`,
    mutationFetcher<void, { alertId: string; action: string }>
  );

  return {
    dismiss: (alertId: string) =>
      trigger({ method: 'PATCH', body: { alertId, action: 'dismiss' } }),
    isDismissing: isMutating,
    error,
  };
}

// ============================================================
// Configuration Hooks
// ============================================================

export interface RiskConfigResponse {
  id: string;
  name: string;
  isActive: boolean;
  weights: {
    attendance: number;
    academic: number;
    assignments: number;
    behavior: number;
    trend: number;
  };
  thresholds: {
    onTrack: number;
    watch: number;
    atRisk: number;
  };
  indicators: {
    attendanceFloor: number;
    attendanceCritical: number;
    assignmentMissingWarn: number;
    behaviorIncidentCap: number;
    assessmentFloorPct: number;
    trendLookbackWeeks: number;
    trendDeclineThreshold: number;
  };
}

/**
 * Get risk model configuration for a school
 */
export function useRiskConfig(schoolId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<RiskConfigResponse>(
    schoolId ? `/api/schools/${schoolId}/risk/config` : null,
    fetcher
  );

  return {
    config: data,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Update risk model configuration
 */
export function useUpdateRiskConfig(schoolId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/risk/config`,
    mutationFetcher<RiskConfigResponse, Partial<RiskConfigResponse>>
  );

  return {
    updateConfig: (updates: Partial<RiskConfigResponse>) =>
      trigger({ method: 'PATCH', body: updates }),
    isUpdating: isMutating,
    error,
  };
}

// ============================================================
// Trigger Evaluation Hook
// ============================================================

/**
 * Manually trigger risk evaluation for a school
 */
export function useTriggerEvaluation(schoolId: string) {
  const { trigger, isMutating, error, data } = useSWRMutation(
    `/api/schools/${schoolId}/risk/evaluate`,
    mutationFetcher<{
      success: boolean;
      studentsEvaluated: number;
      alertsGenerated: number;
      durationMs: number;
    }, { studentId?: string }>
  );

  return {
    evaluate: (studentId?: string) =>
      trigger({ method: 'POST', body: studentId ? { studentId } : {} }),
    isEvaluating: isMutating,
    result: data,
    error,
  };
}
