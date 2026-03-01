/**
 * MetricCard Component Tests
 * ==========================
 *
 * Tests for the dashboard metric card component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard, MetricCardSkeleton } from '../dashboard/metric-card';

// Mock the lucide-react icons
vi.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="trending-up">↑</span>,
  TrendingDown: () => <span data-testid="trending-down">↓</span>,
  Minus: () => <span data-testid="trending-flat">-</span>,
}));

describe('MetricCard', () => {
  describe('basic rendering', () => {
    it('renders title and value', () => {
      render(<MetricCard title="Total Students" value={125} />);

      expect(screen.getByText('Total Students')).toBeInTheDocument();
      expect(screen.getByText('125')).toBeInTheDocument();
    });

    it('renders string values as-is', () => {
      render(<MetricCard title="Status" value="Active" />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(
        <MetricCard title="Growth" value={65} subtitle="This semester" />
      );

      expect(screen.getByText('This semester')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      const icon = <span data-testid="custom-icon">📊</span>;
      render(<MetricCard title="Analytics" value={100} icon={icon} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('value formatting', () => {
    it('formats numbers with thousands separator', () => {
      render(<MetricCard title="Large Number" value={1234567} format="number" />);

      // formatNumber adds commas
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('formats percentages', () => {
      render(<MetricCard title="Attendance Rate" value={0.95} format="percent" />);

      // formatPercent multiplies by 100 and adds % (with decimal precision)
      expect(screen.getByText('95.0%')).toBeInTheDocument();
    });

    it('formats currency', () => {
      render(<MetricCard title="Budget" value={7500} format="currency" />);

      expect(screen.getByText('$7,500')).toBeInTheDocument();
    });

    it('uses raw format by default', () => {
      render(<MetricCard title="Count" value={42} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('trend indicator', () => {
    it('shows upward trend when value increased', () => {
      render(
        <MetricCard
          title="Students"
          value={110}
          previousValue={100}
        />
      );

      expect(screen.getByTestId('trending-up')).toBeInTheDocument();
      expect(screen.getByText('10.0%')).toBeInTheDocument();
    });

    it('shows downward trend when value decreased', () => {
      render(
        <MetricCard
          title="Absences"
          value={90}
          previousValue={100}
        />
      );

      expect(screen.getByTestId('trending-down')).toBeInTheDocument();
      expect(screen.getByText('10.0%')).toBeInTheDocument();
    });

    it('shows flat trend when value unchanged', () => {
      render(
        <MetricCard
          title="Stable"
          value={100}
          previousValue={100}
        />
      );

      expect(screen.getByTestId('trending-flat')).toBeInTheDocument();
    });

    it('does not show trend when previousValue not provided', () => {
      render(<MetricCard title="No Trend" value={100} />);

      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trending-down')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trending-flat')).not.toBeInTheDocument();
    });

    it('does not show trend for string values', () => {
      render(
        <MetricCard
          title="Status"
          value="Active"
          previousValue={100}
        />
      );

      expect(screen.queryByTestId('trending-up')).not.toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies default variant styling', () => {
      render(<MetricCard title="Default" value={100} />);

      // The value should have gradient styling
      const valueElement = screen.getByText('100');
      expect(valueElement).toHaveClass('bg-gradient-to-r');
    });

    it('applies success variant', () => {
      render(<MetricCard title="Success" value={100} variant="success" />);

      const valueElement = screen.getByText('100');
      expect(valueElement).toBeInTheDocument();
    });

    it('applies warning variant', () => {
      render(<MetricCard title="Warning" value={100} variant="warning" />);

      const valueElement = screen.getByText('100');
      expect(valueElement).toBeInTheDocument();
    });

    it('applies danger variant', () => {
      render(<MetricCard title="Danger" value={100} variant="danger" />);

      const valueElement = screen.getByText('100');
      expect(valueElement).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading skeleton when loading is true', () => {
      render(<MetricCard title="Loading" value={100} loading />);

      // Should not show actual value
      expect(screen.queryByText('100')).not.toBeInTheDocument();
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();

      // Should show skeleton animation
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('shows content when loading is false', () => {
      render(<MetricCard title="Loaded" value={100} loading={false} />);

      expect(screen.getByText('Loaded')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className to the card', () => {
      const { container } = render(
        <MetricCard title="Custom" value={100} className="custom-class" />
      );

      // The card should have the custom class
      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });
});

describe('MetricCardSkeleton', () => {
  it('renders a loading skeleton', () => {
    render(<MetricCardSkeleton />);

    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<MetricCardSkeleton className="my-skeleton" />);

    const element = container.querySelector('.my-skeleton');
    expect(element).toBeInTheDocument();
  });
});
