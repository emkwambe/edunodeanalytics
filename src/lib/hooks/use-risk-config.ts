import useSWR, { mutate as globalMutate } from 'swr';
import { fetcher } from './fetcher';
import type { RiskModelConfig } from '@/lib/risk-engine/types';

/**
 * API response structure for risk config endpoint
 */
export interface RiskConfigResponse {
  config: RiskModelConfig;
  raw: Record<string, unknown>;
}

/**
 * Update payload for risk config
 */
export interface RiskConfigUpdate {
  name?: string;
  weights?: {
    attendance?: number;
    academic?: number;
    assignments?: number;
    behavior?: number;
    trend?: number;
  };
  thresholds?: {
    onTrack?: number;
    watch?: number;
    atRisk?: number;
  };
  indicators?: {
    attendanceFloor?: number;
    attendanceCritical?: number;
    assignmentMissingWarn?: number;
    behaviorIncidentCap?: number;
    assessmentFloorPct?: number;
    trendLookbackWeeks?: number;
    trendDeclineThreshold?: number;
  };
}

/**
 * Fetch and manage risk model configuration for a school
 *
 * @param schoolId - The school ID to fetch config for
 * @returns Config data, loading state, error, and update function
 */
export function useRiskConfig(schoolId: string | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<RiskConfigResponse>(
    schoolId ? `/api/schools/${schoolId}/risk/config` : null,
    fetcher
  );

  /**
   * Update the risk configuration
   * Only admins can update - will return 403 for non-admins
   */
  const updateConfig = async (update: RiskConfigUpdate): Promise<{
    success: boolean;
    config?: RiskModelConfig;
    error?: string;
  }> => {
    if (!schoolId) {
      return { success: false, error: 'No school ID provided' };
    }

    try {
      const response = await fetch(`/api/schools/${schoolId}/risk/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to update config' };
      }

      // Revalidate the cache
      mutate();

      return { success: true, config: result.config };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  /**
   * Reset config to school defaults (placeholder for future implementation)
   */
  const resetToDefaults = async (): Promise<{ success: boolean; error?: string }> => {
    // This would call a specific reset endpoint when implemented
    return { success: false, error: 'Reset to defaults not yet implemented' };
  };

  return {
    config: data?.config ?? null,
    rawConfig: data?.raw ?? null,
    error,
    isLoading,
    isValidating,
    mutate,
    updateConfig,
    resetToDefaults,
  };
}

/**
 * Helper to validate weights sum to 1.0
 */
export function validateWeights(weights: RiskConfigUpdate['weights']): {
  valid: boolean;
  sum: number;
  error?: string;
} {
  if (!weights) {
    return { valid: true, sum: 0 };
  }

  const sum =
    (weights.attendance ?? 0) +
    (weights.academic ?? 0) +
    (weights.assignments ?? 0) +
    (weights.behavior ?? 0) +
    (weights.trend ?? 0);

  if (Math.abs(sum - 1.0) >= 0.01) {
    return {
      valid: false,
      sum,
      error: `Weights must sum to 1.0 (current sum: ${sum.toFixed(2)})`,
    };
  }

  return { valid: true, sum };
}

/**
 * Helper to validate threshold ordering
 */
export function validateThresholds(thresholds: RiskConfigUpdate['thresholds']): {
  valid: boolean;
  error?: string;
} {
  if (!thresholds) {
    return { valid: true };
  }

  const { onTrack, watch, atRisk } = thresholds;

  // All three must be provided together for validation
  if (onTrack != null && watch != null && atRisk != null) {
    if (!(onTrack < watch && watch < atRisk && atRisk <= 1.0)) {
      return {
        valid: false,
        error: 'Thresholds must be ordered: onTrack < watch < atRisk <= 1.0',
      };
    }
  }

  return { valid: true };
}

/**
 * Combined validation for a config update
 */
export function validateConfigUpdate(update: RiskConfigUpdate): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const weightsResult = validateWeights(update.weights);
  if (!weightsResult.valid && weightsResult.error) {
    errors.push(weightsResult.error);
  }

  const thresholdsResult = validateThresholds(update.thresholds);
  if (!thresholdsResult.valid && thresholdsResult.error) {
    errors.push(thresholdsResult.error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
