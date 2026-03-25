/**
 * useMtssSummary Hook Tests
 * =========================
 *
 * Tests for the MTSS summary data fetching hook.
 * Sprint 5A - Hook tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useMtssSummary,
  isMtssSummaryEmpty,
  getResponseRateVariant,
  getDosageComplianceVariant,
  getImprovementRateVariant,
  type MtssSummary,
} from '../use-mtss-summary';

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn(),
}));

// Mock fetcher
vi.mock('../fetcher', () => ({
  fetcher: vi.fn(),
}));

import useSWR from 'swr';
const mockUseSWR = vi.mocked(useSWR);

describe('useMtssSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useMtssSummary('school-123'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns data when loaded', () => {
    const mockData: MtssSummary = {
      students_identified: 25,
      students_flagged_no_intervention: 5,
      response_rate: 0.8,
      avg_time_to_action_days: 3.5,
      avg_dosage_compliance: 0.75,
      improvement_rate: 0.45,
      students_improved: 11,
      students_maintained: 10,
      students_worsened: 4,
      total_active_interventions: 20,
      period: '2025-2026',
      last_updated: '2026-03-25T10:00:00Z',
    };

    mockUseSWR.mockReturnValue({
      data: mockData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useMtssSummary('school-123'));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('returns error when fetch fails', () => {
    const mockError = new Error('Network error');

    mockUseSWR.mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useMtssSummary('school-123'));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(mockError);
  });

  it('does not fetch when schoolId is null', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    });

    renderHook(() => useMtssSummary(null));

    expect(mockUseSWR).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('constructs correct API URL', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: vi.fn(),
    });

    renderHook(() => useMtssSummary('school-abc-123'));

    expect(mockUseSWR).toHaveBeenCalledWith(
      '/api/schools/school-abc-123/mtss-summary',
      expect.any(Function),
      expect.any(Object)
    );
  });

  it('provides mutate function', () => {
    const mockMutate = vi.fn();
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useMtssSummary('school-123'));

    expect(typeof result.current.mutate).toBe('function');
    result.current.mutate();
    expect(mockMutate).toHaveBeenCalled();
  });
});

describe('isMtssSummaryEmpty', () => {
  it('returns true for null data', () => {
    expect(isMtssSummaryEmpty(null)).toBe(true);
  });

  it('returns true when all counts are zero', () => {
    const emptyData: MtssSummary = {
      students_identified: 0,
      students_flagged_no_intervention: 0,
      response_rate: 0,
      avg_time_to_action_days: 0,
      avg_dosage_compliance: 0,
      improvement_rate: 0,
      students_improved: 0,
      students_maintained: 0,
      students_worsened: 0,
      total_active_interventions: 0,
      period: '2025-2026',
      last_updated: '2026-03-25T10:00:00Z',
    };

    expect(isMtssSummaryEmpty(emptyData)).toBe(true);
  });

  it('returns false when students are identified', () => {
    const data: MtssSummary = {
      students_identified: 5,
      students_flagged_no_intervention: 0,
      response_rate: 0,
      avg_time_to_action_days: 0,
      avg_dosage_compliance: 0,
      improvement_rate: 0,
      students_improved: 0,
      students_maintained: 0,
      students_worsened: 0,
      total_active_interventions: 0,
      period: '2025-2026',
      last_updated: '2026-03-25T10:00:00Z',
    };

    expect(isMtssSummaryEmpty(data)).toBe(false);
  });

  it('returns false when there are active interventions', () => {
    const data: MtssSummary = {
      students_identified: 0,
      students_flagged_no_intervention: 0,
      response_rate: 0,
      avg_time_to_action_days: 0,
      avg_dosage_compliance: 0,
      improvement_rate: 0,
      students_improved: 0,
      students_maintained: 0,
      students_worsened: 0,
      total_active_interventions: 3,
      period: '2025-2026',
      last_updated: '2026-03-25T10:00:00Z',
    };

    expect(isMtssSummaryEmpty(data)).toBe(false);
  });
});

describe('getResponseRateVariant', () => {
  it('returns success for rate >= 85%', () => {
    expect(getResponseRateVariant(0.85)).toBe('success');
    expect(getResponseRateVariant(0.90)).toBe('success');
    expect(getResponseRateVariant(1.0)).toBe('success');
  });

  it('returns warning for rate 70-85%', () => {
    expect(getResponseRateVariant(0.70)).toBe('warning');
    expect(getResponseRateVariant(0.75)).toBe('warning');
    expect(getResponseRateVariant(0.84)).toBe('warning');
  });

  it('returns danger for rate < 70%', () => {
    expect(getResponseRateVariant(0.69)).toBe('danger');
    expect(getResponseRateVariant(0.50)).toBe('danger');
    expect(getResponseRateVariant(0)).toBe('danger');
  });
});

describe('getDosageComplianceVariant', () => {
  it('returns success for rate >= 80%', () => {
    expect(getDosageComplianceVariant(0.80)).toBe('success');
    expect(getDosageComplianceVariant(0.95)).toBe('success');
  });

  it('returns warning for rate 60-80%', () => {
    expect(getDosageComplianceVariant(0.60)).toBe('warning');
    expect(getDosageComplianceVariant(0.79)).toBe('warning');
  });

  it('returns danger for rate < 60%', () => {
    expect(getDosageComplianceVariant(0.59)).toBe('danger');
    expect(getDosageComplianceVariant(0.30)).toBe('danger');
  });
});

describe('getImprovementRateVariant', () => {
  it('returns success for rate >= 80%', () => {
    expect(getImprovementRateVariant(0.80)).toBe('success');
    expect(getImprovementRateVariant(1.0)).toBe('success');
  });

  it('returns warning for rate 60-80%', () => {
    expect(getImprovementRateVariant(0.60)).toBe('warning');
    expect(getImprovementRateVariant(0.79)).toBe('warning');
  });

  it('returns danger for rate < 60%', () => {
    expect(getImprovementRateVariant(0.59)).toBe('danger');
    expect(getImprovementRateVariant(0.25)).toBe('danger');
  });
});
