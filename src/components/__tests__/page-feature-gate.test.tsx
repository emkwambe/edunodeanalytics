/**
 * PageFeatureGate Component Tests
 * ================================
 *
 * Tests for the page-level feature gating component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageFeatureGate } from '../features/page-feature-gate';

// Mock next/navigation
const mockParams = { school_slug: 'test-school' };
vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
}));

// Mock seed data to control subscription tier
vi.mock('@/lib/data/seed-data', () => ({
  getSchoolSeed: vi.fn((slug: string) => {
    if (slug === 'enterprise-school') {
      return { subscriptionTier: 'enterprise' };
    }
    if (slug === 'pro-school') {
      return { subscriptionTier: 'pro' };
    }
    return { subscriptionTier: 'starter' };
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Lock: () => <span data-testid="lock-icon">🔒</span>,
  Crown: () => <span data-testid="crown-icon">👑</span>,
  ArrowRight: () => <span data-testid="arrow-icon">→</span>,
  Sparkles: () => <span data-testid="sparkles-icon">✨</span>,
}));

describe('PageFeatureGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when user has access', () => {
    it('renders children for starter features with starter tier', () => {
      mockParams.school_slug = 'test-school';

      render(
        <PageFeatureGate featureKey="dashboard_overview">
          <div data-testid="protected-content">Dashboard Content</div>
        </PageFeatureGate>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('renders children for pro features with pro tier', () => {
      mockParams.school_slug = 'pro-school';

      render(
        <PageFeatureGate featureKey="student_360">
          <div data-testid="student-360">Student 360 Content</div>
        </PageFeatureGate>
      );

      expect(screen.getByTestId('student-360')).toBeInTheDocument();
    });

    it('renders children for enterprise features with enterprise tier', () => {
      mockParams.school_slug = 'enterprise-school';

      render(
        <PageFeatureGate featureKey="network_view">
          <div data-testid="network">Network Content</div>
        </PageFeatureGate>
      );

      expect(screen.getByTestId('network')).toBeInTheDocument();
    });

    it('enterprise tier has access to all features', () => {
      mockParams.school_slug = 'enterprise-school';

      // Starter feature
      render(
        <PageFeatureGate featureKey="basic_reports">
          <div data-testid="basic">Basic Reports</div>
        </PageFeatureGate>
      );
      expect(screen.getByTestId('basic')).toBeInTheDocument();
    });
  });

  describe('when user does not have access', () => {
    it('shows locked state for pro features with starter tier', () => {
      mockParams.school_slug = 'test-school'; // starter tier

      render(
        <PageFeatureGate featureKey="student_360">
          <div data-testid="hidden">Should not see this</div>
        </PageFeatureGate>
      );

      // Should not render children
      expect(screen.queryByTestId('hidden')).not.toBeInTheDocument();

      // Should show feature name
      expect(screen.getByText('Student 360 Deep Dive')).toBeInTheDocument();

      // Should show at least one lock icon (there may be multiple in the "also included" section)
      const lockIcons = screen.getAllByTestId('lock-icon');
      expect(lockIcons.length).toBeGreaterThan(0);
    });

    it('shows locked state for enterprise features with pro tier', () => {
      mockParams.school_slug = 'pro-school';

      render(
        <PageFeatureGate featureKey="network_view">
          <div data-testid="hidden">Should not see this</div>
        </PageFeatureGate>
      );

      expect(screen.queryByTestId('hidden')).not.toBeInTheDocument();
      expect(screen.getByText('Network View')).toBeInTheDocument();
    });

    it('shows feature description', () => {
      mockParams.school_slug = 'test-school';

      render(
        <PageFeatureGate featureKey="intervention_hub">
          <div>Content</div>
        </PageFeatureGate>
      );

      expect(
        screen.getByText('MTSS tier management and intervention planning')
      ).toBeInTheDocument();
    });

    it('shows upgrade message', () => {
      mockParams.school_slug = 'test-school';

      render(
        <PageFeatureGate featureKey="ai_pulse">
          <div>Content</div>
        </PageFeatureGate>
      );

      expect(
        screen.getByText(/Upgrade to Professional to unlock AI-driven insights/)
      ).toBeInTheDocument();
    });

    it('shows upgrade button with next tier info', () => {
      mockParams.school_slug = 'test-school';

      render(
        <PageFeatureGate featureKey="student_360">
          <div>Content</div>
        </PageFeatureGate>
      );

      // Should show upgrade button
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(/Professional/);
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
    });

    it('shows other locked features', () => {
      mockParams.school_slug = 'test-school';

      render(
        <PageFeatureGate featureKey="student_360">
          <div>Content</div>
        </PageFeatureGate>
      );

      // Should show "Also included" section
      expect(screen.getByText(/Also included with/)).toBeInTheDocument();
    });
  });

  describe('tier hierarchy', () => {
    it('starter tier cannot access pro features', () => {
      mockParams.school_slug = 'test-school';

      render(
        <PageFeatureGate featureKey="intervention_hub">
          <div data-testid="intervention">Intervention Hub</div>
        </PageFeatureGate>
      );

      expect(screen.queryByTestId('intervention')).not.toBeInTheDocument();
    });

    it('starter tier cannot access enterprise features', () => {
      mockParams.school_slug = 'test-school';

      render(
        <PageFeatureGate featureKey="api_access">
          <div data-testid="api">API Access</div>
        </PageFeatureGate>
      );

      expect(screen.queryByTestId('api')).not.toBeInTheDocument();
    });

    it('pro tier cannot access enterprise features', () => {
      mockParams.school_slug = 'pro-school';

      render(
        <PageFeatureGate featureKey="network_benchmarking">
          <div data-testid="benchmark">Benchmarking</div>
        </PageFeatureGate>
      );

      expect(screen.queryByTestId('benchmark')).not.toBeInTheDocument();
    });

    it('pro tier can access starter features', () => {
      mockParams.school_slug = 'pro-school';

      render(
        <PageFeatureGate featureKey="basic_reports">
          <div data-testid="reports">Reports</div>
        </PageFeatureGate>
      );

      expect(screen.getByTestId('reports')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles missing school slug gracefully', () => {
      mockParams.school_slug = '';

      // Should default to starter tier
      render(
        <PageFeatureGate featureKey="student_360">
          <div data-testid="content">Content</div>
        </PageFeatureGate>
      );

      // Pro feature should be locked for default (starter) tier
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('handles unknown school slug with default tier', () => {
      mockParams.school_slug = 'unknown-school';

      render(
        <PageFeatureGate featureKey="dashboard_overview">
          <div data-testid="dashboard">Dashboard</div>
        </PageFeatureGate>
      );

      // Starter feature should still work
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });
});
