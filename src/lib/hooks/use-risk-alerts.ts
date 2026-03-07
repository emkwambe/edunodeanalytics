import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, mutationFetcher, buildQueryString } from './fetcher';
import type { AlertStatus, AlertSeverity, AlertType, RiskLevel } from '@/lib/risk-engine/types';

// Types matching API response
export interface RiskAlert {
  id: string;
  studentId: string;
  studentName: string;
  alertType: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  data: Record<string, unknown> | null;
  createdAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  interventionId: string | null;
}

export interface RiskAlertsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RiskAlertsResponse {
  data: RiskAlert[];
  pagination: RiskAlertsPagination;
}

export interface UseRiskAlertsOptions {
  page?: number;
  limit?: number;
  status?: AlertStatus;
  severity?: AlertSeverity;
  studentId?: string;
}

/**
 * Fetch paginated, filterable risk alerts for a school
 */
export function useRiskAlerts(schoolId: string | null, options: UseRiskAlertsOptions = {}) {
  const queryString = buildQueryString(options as Record<string, string | number | boolean | undefined | null>);

  const { data, error, isLoading, isValidating, mutate } = useSWR<RiskAlertsResponse>(
    schoolId ? `/api/schools/${schoolId}/risk/alerts${queryString}` : null,
    fetcher
  );

  return {
    alerts: data?.data ?? [],
    pagination: data?.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 },
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

/**
 * Get unacknowledged alerts count (useful for badges)
 */
export function useUnacknowledgedAlertsCount(schoolId: string | null) {
  const { alerts, isLoading, error } = useRiskAlerts(schoolId, {
    status: 'new',
    limit: 100,
  });

  return {
    count: alerts.length,
    isLoading,
    error,
  };
}

export interface AcknowledgeAlertInput {
  acknowledgedBy?: string;
  status?: 'acknowledged';
}

export interface ResolveAlertInput {
  resolvedBy?: string;
  resolutionNotes?: string;
  interventionId?: string;
  status?: 'resolved';
}

/**
 * Acknowledge an alert
 */
export function useAcknowledgeAlert(schoolId: string, alertId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/risk/alerts/${alertId}`,
    mutationFetcher<RiskAlert, AcknowledgeAlertInput>
  );

  return {
    acknowledgeAlert: (input?: AcknowledgeAlertInput) =>
      trigger({ method: 'PATCH', body: { ...input, status: 'acknowledged' } }),
    isAcknowledging: isMutating,
    error,
  };
}

/**
 * Resolve an alert
 */
export function useResolveAlert(schoolId: string, alertId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/risk/alerts/${alertId}`,
    mutationFetcher<RiskAlert, ResolveAlertInput>
  );

  return {
    resolveAlert: (input?: ResolveAlertInput) =>
      trigger({ method: 'PATCH', body: { ...input, status: 'resolved' } }),
    isResolving: isMutating,
    error,
  };
}

/**
 * Group alerts by severity for display
 */
export function groupAlertsBySeverity(alerts: RiskAlert[]): Record<AlertSeverity, RiskAlert[]> {
  return {
    critical: alerts.filter((a) => a.severity === 'critical'),
    urgent: alerts.filter((a) => a.severity === 'urgent'),
    warning: alerts.filter((a) => a.severity === 'warning'),
    info: alerts.filter((a) => a.severity === 'info'),
  };
}

/**
 * Get severity badge styling
 */
export function getAlertSeverityBadge(severity: AlertSeverity): {
  label: string;
  className: string;
} {
  const badges: Record<AlertSeverity, { label: string; className: string }> = {
    critical: {
      label: 'Critical',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    urgent: {
      label: 'Urgent',
      className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
    warning: {
      label: 'Warning',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    },
    info: {
      label: 'Info',
      className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    },
  };
  return badges[severity];
}
