/**
 * Intervention Strategies Hooks
 * =============================
 *
 * React hooks for managing intervention strategies.
 */

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, mutationFetcher, buildQueryString } from './fetcher';
import type { StrategyRecord, CreateStrategyInput, StrategySource } from '@/lib/mtss/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StrategiesResponse {
  data: StrategyRecord[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface UseStrategiesOptions {
  source?: StrategySource;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch all available strategies for a school
 */
export function useStrategies(schoolId: string | null, options: UseStrategiesOptions = {}) {
  const queryString = buildQueryString(options as Record<string, string | number | boolean | undefined | null>);

  const { data, error, isLoading, isValidating, mutate } = useSWR<StrategiesResponse>(
    schoolId ? `/api/schools/${schoolId}/strategies${queryString}` : null,
    fetcher
  );

  return {
    strategies: data?.data ?? [],
    total: data?.pagination.total ?? 0,
    hasMore: data?.pagination.hasMore ?? false,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

/**
 * Fetch strategies grouped by category
 */
export function useStrategiesByCategory(schoolId: string | null) {
  const { strategies, isLoading, error, mutate } = useStrategies(schoolId, { limit: 200 });

  const grouped = strategies.reduce(
    (acc, strategy) => {
      const category = strategy.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(strategy);
      return acc;
    },
    {} as Record<string, StrategyRecord[]>
  );

  return {
    strategiesByCategory: grouped,
    strategies,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Fetch a single strategy by ID
 */
export function useStrategy(schoolId: string | null, strategyId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<StrategyRecord>(
    schoolId && strategyId
      ? `/api/schools/${schoolId}/strategies/${strategyId}`
      : null,
    fetcher
  );

  return {
    strategy: data,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Create a new custom strategy
 */
export function useCreateStrategy(schoolId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/strategies`,
    mutationFetcher<StrategyRecord, CreateStrategyInput>
  );

  return {
    createStrategy: (strategy: CreateStrategyInput) =>
      trigger({ method: 'POST', body: strategy }),
    isCreating: isMutating,
    error,
  };
}

/**
 * Update an existing strategy
 */
export function useUpdateStrategy(schoolId: string, strategyId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/strategies/${strategyId}`,
    mutationFetcher<StrategyRecord, Partial<CreateStrategyInput>>
  );

  return {
    updateStrategy: (updates: Partial<CreateStrategyInput>) =>
      trigger({ method: 'PATCH', body: updates }),
    isUpdating: isMutating,
    error,
  };
}

/**
 * Delete a strategy
 */
export function useDeleteStrategy(schoolId: string, strategyId: string) {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/schools/${schoolId}/strategies/${strategyId}`,
    mutationFetcher<{ success: boolean }, never>
  );

  return {
    deleteStrategy: () => trigger({ method: 'DELETE' }),
    isDeleting: isMutating,
    error,
  };
}

// ---------------------------------------------------------------------------
// Strategy Selector Helper
// ---------------------------------------------------------------------------

/**
 * Categories for organizing strategies in the UI
 */
export const STRATEGY_CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'behavior', label: 'Behavior' },
  { value: 'sel', label: 'Social-Emotional' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'family_engagement', label: 'Family Engagement' },
  { value: 'other', label: 'Other' },
] as const;

/**
 * Get category label from value
 */
export function getCategoryLabel(value: string): string {
  const category = STRATEGY_CATEGORIES.find((c) => c.value === value);
  return category?.label ?? value;
}

/**
 * Get source label
 */
export function getSourceLabel(source: StrategySource): string {
  switch (source) {
    case 'system':
      return 'System';
    case 'district':
      return 'District';
    case 'user':
      return 'Custom';
    default:
      return source;
  }
}
