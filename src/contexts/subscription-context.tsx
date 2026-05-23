'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  type SubscriptionTier,
  hasFeatureAccess,
  getLockedFeatures,
  TIER_INFO,
  type FeatureKey,
} from '@/lib/features/feature-gates';
import { getSchoolSeed } from '@/lib/data/seed-data';

/**
 * Subscription Context
 * ====================
 *
 * Provides subscription state and feature access throughout the app.
 * In production, this fetches from the API. In development, uses seed data.
 */

export interface SubscriptionState {
  tier: SubscriptionTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'loading';
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  studentCount: number;
  staffSeats: number;
}

interface SubscriptionContextValue {
  subscription: SubscriptionState;
  tierInfo: typeof TIER_INFO[SubscriptionTier];
  isLoading: boolean;
  error: Error | null;

  // Feature access helpers
  hasAccess: (featureKey: FeatureKey) => boolean;
  lockedFeatures: ReturnType<typeof getLockedFeatures>;

  // Actions
  refreshSubscription: () => Promise<void>;
  openBillingPortal: () => Promise<void>;
  startUpgrade: (targetTier: SubscriptionTier) => void;
}

const SubscriptionContext = React.createContext<SubscriptionContextValue | null>(null);

const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  tier: 'starter',
  status: 'loading',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  studentCount: 0,
  staffSeats: 0,
};

export function SubscriptionProvider({
  children,
  initialTier,
}: {
  children: React.ReactNode;
  initialTier?: SubscriptionTier;
}) {
  const params = useParams();
  const schoolSlug = params?.school_slug as string;

  // Start in a loading state. Tier resolution happens in the effect below
  // once `useParams()` has actually resolved the slug — reading the seed
  // (or the NEXT_PUBLIC_DEMO_MODE env var) inside a useState initializer is
  // unreliable on first render and forces every school to start as 'starter'.
  const [subscription, setSubscription] = React.useState<SubscriptionState>({
    ...DEFAULT_SUBSCRIPTION,
    status: 'loading',
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Resolve tier once the slug is available.
  React.useEffect(() => {
    if (!schoolSlug) return;

    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      setSubscription({
        ...DEFAULT_SUBSCRIPTION,
        tier: 'enterprise',
        status: 'active',
        studentCount: 487,
        staffSeats: 25,
      });
      return;
    }

    const seed = getSchoolSeed(schoolSlug);
    if (seed) {
      setSubscription({
        ...DEFAULT_SUBSCRIPTION,
        tier: seed.subscriptionTier,
        status: 'active',
        studentCount: seed.studentCount,
        staffSeats: 25,
      });
      return;
    }

    if (initialTier) {
      setSubscription({
        ...DEFAULT_SUBSCRIPTION,
        tier: initialTier,
        status: 'active',
      });
    }
  }, [schoolSlug, initialTier]);

  // Fetch subscription from API in production
  const refreshSubscription = React.useCallback(async () => {
    if (!schoolSlug) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/subscriptions?school=${schoolSlug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();

      setSubscription({
        tier: data.tier as SubscriptionTier,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        studentCount: data.studentCount || 0,
        staffSeats: data.staffSeats || 25,
      });
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));

      // Fall back to seed data
      const schoolSeed = getSchoolSeed(schoolSlug);
      if (schoolSeed) {
        setSubscription({
          ...DEFAULT_SUBSCRIPTION,
          tier: schoolSeed.subscriptionTier,
          status: 'active',
          studentCount: schoolSeed.studentCount,
          staffSeats: 25,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [schoolSlug]);

  // Open Stripe Billing Portal
  const openBillingPortal = React.useCallback(async () => {
    if (!schoolSlug) return;

    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
    }
  }, [schoolSlug]);

  // Start upgrade flow
  const startUpgrade = React.useCallback((targetTier: SubscriptionTier) => {
    // Navigate to upgrade page or open modal
    window.location.href = `/${schoolSlug}/settings/billing/upgrade?tier=${targetTier}`;
  }, [schoolSlug]);

  // Feature access check
  const hasAccess = React.useCallback(
    (featureKey: FeatureKey) => hasFeatureAccess(subscription.tier, featureKey),
    [subscription.tier]
  );

  // Get locked features for current tier
  const lockedFeatures = React.useMemo(
    () => getLockedFeatures(subscription.tier),
    [subscription.tier]
  );

  // Get tier info
  const tierInfo = React.useMemo(
    () => TIER_INFO[subscription.tier],
    [subscription.tier]
  );

  const value: SubscriptionContextValue = {
    subscription,
    tierInfo,
    isLoading,
    error,
    hasAccess,
    lockedFeatures,
    refreshSubscription,
    openBillingPortal,
    startUpgrade,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access subscription context
 */
export function useSubscription() {
  const context = React.useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

/**
 * Hook to check feature access
 */
export function useFeature(featureKey: FeatureKey) {
  const { hasAccess, subscription } = useSubscription();
  return {
    hasAccess: hasAccess(featureKey),
    tier: subscription.tier,
    status: subscription.status,
  };
}

/**
 * HOC to wrap components requiring specific features
 */
export function withFeatureAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredFeature: FeatureKey
) {
  return function WithFeatureAccessComponent(props: P) {
    const { hasAccess, subscription, startUpgrade } = useSubscription();

    if (!hasAccess(requiredFeature)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Feature Locked</h3>
          <p className="text-slate-400 mb-4">
            Upgrade to access this feature.
          </p>
          <button
            onClick={() => startUpgrade(subscription.tier === 'starter' ? 'pro' : 'enterprise')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Upgrade Now
          </button>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
