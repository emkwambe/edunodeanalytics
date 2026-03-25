/**
 * Student Timeline Hook
 * =====================
 *
 * Client-side hook for fetching student timeline data.
 * Returns chronological events for the Student 360 view.
 */

import useSWR from 'swr';
import { fetcher } from './fetcher';

/** Timeline event types */
export type TimelineEventType =
  | 'enrollment'
  | 'risk_flag'
  | 'risk_escalation'
  | 'risk_improvement'
  | 'risk_maintained'
  | 'intervention_created'
  | 'dosage_milestone';

/** Single timeline event */
export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  description: string;
  metadata: {
    riskScore?: number;
    riskLevel?: string;
    previousLevel?: string;
    interventionId?: string;
    interventionTitle?: string;
    dosageCompliance?: number;
    topDriver?: string;
  };
}

/** Timeline API response */
export interface TimelineResponse {
  studentId: string;
  studentName: string;
  events: TimelineEvent[];
  total: number;
}

/**
 * Fetch student timeline events
 *
 * @param schoolId - School identifier
 * @param studentId - Student identifier
 * @returns Timeline events, loading state, and error
 */
export function useStudentTimeline(
  schoolId: string | null,
  studentId: string | null
) {
  const { data, error, isLoading, mutate } = useSWR<TimelineResponse>(
    schoolId && studentId
      ? `/api/schools/${schoolId}/students/${studentId}/timeline`
      : null,
    fetcher
  );

  return {
    events: data?.events ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Get visual configuration for timeline event type
 */
export function getTimelineEventStyle(type: TimelineEventType): {
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
} {
  switch (type) {
    case 'enrollment':
      return {
        icon: 'enrollment',
        colorClass: 'text-blue-400',
        bgClass: 'bg-blue-500/20',
        borderClass: 'border-blue-500/30',
      };
    case 'risk_flag':
      return {
        icon: 'risk_flag',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/20',
        borderClass: 'border-amber-500/30',
      };
    case 'risk_escalation':
      return {
        icon: 'risk_escalation',
        colorClass: 'text-red-400',
        bgClass: 'bg-red-500/20',
        borderClass: 'border-red-500/30',
      };
    case 'risk_improvement':
      return {
        icon: 'risk_improvement',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/20',
        borderClass: 'border-emerald-500/30',
      };
    case 'risk_maintained':
      return {
        icon: 'risk_maintained',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/20',
        borderClass: 'border-amber-500/30',
      };
    case 'intervention_created':
      return {
        icon: 'intervention_created',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/20',
        borderClass: 'border-emerald-500/30',
      };
    case 'dosage_milestone':
      return {
        icon: 'dosage_milestone',
        colorClass: 'text-orange-400',
        bgClass: 'bg-orange-500/20',
        borderClass: 'border-orange-500/30',
      };
    default:
      return {
        icon: 'default',
        colorClass: 'text-slate-400',
        bgClass: 'bg-slate-500/20',
        borderClass: 'border-slate-500/30',
      };
  }
}
