/**
 * MTSSEvidenceMetrics Component Tests
 * ====================================
 *
 * Tests for the MTSS evidence metrics component with 3 variants.
 * Sprint 5A - Component tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MTSSEvidenceMetrics } from '../dashboard/mtss-evidence-metrics';
import type { MtssSummary } from '@/lib/hooks/use-mtss-summary';

// Mock the hooks module
vi.mock('@/lib/hooks/use-mtss-summary', () => ({
  useMtssSummary: vi.fn(),
  isMtssSummaryEmpty: vi.fn(),
  getResponseRateVariant: vi.fn((rate: number) => {
    if (rate >= 0.85) return 'success';
    if (rate >= 0.70) return 'warning';
    return 'danger';
  }),
  getDosageComplianceVariant: vi.fn((rate: number) => {
    if (rate >= 0.80) return 'success';
    if (rate >= 0.60) return 'warning';
    return 'danger';
  }),
  getImprovementRateVariant: vi.fn((rate: number) => {
    if (rate >= 0.80) return 'success';
    if (rate >= 0.60) return 'warning';
    return 'danger';
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-icon">!</span>,
  Users: () => <span data-testid="users-icon">U</span>,
  Clock: () => <span data-testid="clock-icon">C</span>,
  Target: () => <span data-testid="target-icon">T</span>,
  TrendingUp: () => <span data-testid="trending-icon">^</span>,
  TrendingDown: () => <span data-testid="trending-down">v</span>,
  Minus: () => <span data-testid="trending-flat">-</span>,
  FileQuestion: () => <span data-testid="file-question">?</span>,
}));

import {
  useMtssSummary,
  isMtssSummaryEmpty,
} from '@/lib/hooks/use-mtss-summary';

const mockUseMtssSummary = vi.mocked(useMtssSummary);
const mockIsMtssSummaryEmpty = vi.mocked(isMtssSummaryEmpty);

const sampleData: MtssSummary = {
  students_identified: 45,
  students_flagged_no_intervention: 8,
  response_rate: 0.822,
  avg_time_to_action_days: 4.5,
  avg_dosage_compliance: 0.78,
  improvement_rate: 0.65,
  students_improved: 29,
  students_maintained: 12,
  students_worsened: 4,
  total_active_interventions: 37,
  period: '2025-2026',
  last_updated: '2026-03-25T10:00:00Z',
};

describe('MTSSEvidenceMetrics', () => {
  const schoolId = '12345678-1234-1234-1234-123456789012';

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMtssSummaryEmpty.mockReturnValue(false);
  });

  describe('loading state', () => {
    it('shows loading skeleton while fetching', () => {
      mockUseMtssSummary.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows compact loading skeleton for compact variant', () => {
      mockUseMtssSummary.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="compact" />);

      const container = document.querySelector('.flex.items-center.gap-6');
      expect(container).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when data is all zeros', () => {
      mockUseMtssSummary.mockReturnValue({
        data: { ...sampleData, students_identified: 0, total_active_interventions: 0 },
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });
      mockIsMtssSummaryEmpty.mockReturnValue(true);

      render(<MTSSEvidenceMetrics schoolId={schoolId} />);

      expect(screen.getByText('No MTSS data yet')).toBeInTheDocument();
    });

    it('shows inline empty state for compact variant', () => {
      mockUseMtssSummary.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });
      mockIsMtssSummaryEmpty.mockReturnValue(true);

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="compact" />);

      expect(screen.getByText('No MTSS data yet')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', () => {
      mockUseMtssSummary.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} />);

      expect(screen.getByText('Unable to load MTSS metrics')).toBeInTheDocument();
    });
  });

  describe('operational variant', () => {
    it('renders 4 metric cards', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="operational" />);

      expect(screen.getByText('Students Identified')).toBeInTheDocument();
      expect(screen.getByText('Response Rate')).toBeInTheDocument();
      expect(screen.getByText('Dosage Compliance')).toBeInTheDocument();
      expect(screen.getByText('Improvement Rate')).toBeInTheDocument();
    });

    it('shows alert when students have no intervention', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="operational" />);

      expect(screen.getByText(/8 students flagged with no active intervention/)).toBeInTheDocument();
    });

    it('hides alert when all flagged students have interventions', () => {
      mockUseMtssSummary.mockReturnValue({
        data: { ...sampleData, students_flagged_no_intervention: 0 },
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="operational" />);

      expect(screen.queryByText(/flagged with no active intervention/)).not.toBeInTheDocument();
    });

    it('includes link to early warning page', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="operational" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', `/dashboard/schools/${schoolId}/early-warning`);
    });
  });

  describe('summary variant', () => {
    it('renders 4 metric cards', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="summary" />);

      expect(screen.getByText('Students Identified')).toBeInTheDocument();
      expect(screen.getByText('Response Rate')).toBeInTheDocument();
      expect(screen.getByText('Dosage Compliance')).toBeInTheDocument();
      expect(screen.getByText('Improvement Rate')).toBeInTheDocument();
    });

    it('shows auto-generated summary sentence', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="summary" />);

      expect(screen.getByText(/This year,/)).toBeInTheDocument();
      expect(screen.getByText(/45 students requiring additional support/)).toBeInTheDocument();
    });

    it('uses school name in summary sentence', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(
        <MTSSEvidenceMetrics
          schoolId={schoolId}
          variant="summary"
          schoolName="Lincoln Charter School"
        />
      );

      expect(screen.getByText(/Lincoln Charter School/)).toBeInTheDocument();
    });

    it('does not show intervention alert', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="summary" />);

      expect(screen.queryByText(/flagged with no active intervention/)).not.toBeInTheDocument();
    });
  });

  describe('compact variant', () => {
    it('renders inline stats', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="compact" />);

      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('Identified')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();
      expect(screen.getByText('Response')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('Dosage')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('Improved')).toBeInTheDocument();
    });

    it('does not render metric cards', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} variant="compact" />);

      // Should not have the card titles
      expect(screen.queryByText('Students Identified')).not.toBeInTheDocument();
      expect(screen.queryByText('Response Rate')).not.toBeInTheDocument();
    });
  });

  describe('default variant', () => {
    it('uses operational variant by default', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      render(<MTSSEvidenceMetrics schoolId={schoolId} />);

      // Operational variant shows the alert
      expect(screen.getByText(/8 students flagged with no active intervention/)).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      mockUseMtssSummary.mockReturnValue({
        data: sampleData,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
      });

      const { container } = render(
        <MTSSEvidenceMetrics schoolId={schoolId} className="my-custom-class" />
      );

      expect(container.querySelector('.my-custom-class')).toBeInTheDocument();
    });
  });
});
