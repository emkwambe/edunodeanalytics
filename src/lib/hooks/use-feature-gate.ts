'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  type FeatureKey,
  type SubscriptionTier,
  hasFeatureAccess,
  getAvailableFeatures,
  getLockedFeatures,
  getNextTier,
  FEATURES,
  TIER_INFO,
} from '@/lib/features/feature-gates';
import { getSchoolSeed } from '@/lib/data/seed-data';

/**
 * Hook to get the current school's subscription tier
 */
export function useSubscriptionTier(): SubscriptionTier {
  const params = useParams();
  const schoolSlug = params?.school_slug as string;

  // In a real app, this would fetch from the database
  // For demo, we use seed data
  const schoolSeed = getSchoolSeed(schoolSlug);

  // Default to 'starter' for demo purposes
  // In production, this would come from the school's subscription record
  return (schoolSeed?.subscriptionTier as SubscriptionTier) || 'starter';
}

/**
 * Hook to check if a feature is available
 */
export function useFeatureAccess(featureKey: FeatureKey): {
  hasAccess: boolean;
  tier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  upgradeMessage: string;
} {
  const currentTier = useSubscriptionTier();
  const feature = FEATURES[featureKey];

  return {
    hasAccess: hasFeatureAccess(currentTier, featureKey),
    tier: currentTier,
    requiredTier: feature.tier,
    upgradeMessage: feature.upgradeMessage,
  };
}

/**
 * Hook to get all feature access information for the current tier
 */
export function useFeatureGate() {
  const currentTier = useSubscriptionTier();

  const availableFeatures = React.useMemo(
    () => getAvailableFeatures(currentTier),
    [currentTier]
  );

  const lockedFeatures = React.useMemo(
    () => getLockedFeatures(currentTier),
    [currentTier]
  );

  const nextTier = getNextTier(currentTier);
  const tierInfo = TIER_INFO[currentTier];
  const nextTierInfo = nextTier ? TIER_INFO[nextTier] : null;

  const checkAccess = React.useCallback(
    (featureKey: FeatureKey) => hasFeatureAccess(currentTier, featureKey),
    [currentTier]
  );

  return {
    /** Current subscription tier */
    tier: currentTier,
    /** Current tier display info */
    tierInfo,
    /** Next tier for upgrade */
    nextTier,
    /** Next tier display info */
    nextTierInfo,
    /** List of available feature keys */
    availableFeatures,
    /** List of locked feature definitions */
    lockedFeatures,
    /** Check if a specific feature is available */
    checkAccess,
    /** Whether on the highest tier */
    isMaxTier: nextTier === null,
  };
}

/**
 * Context for feature gating (optional, for avoiding prop drilling)
 */
interface FeatureGateContextValue {
  tier: SubscriptionTier;
  checkAccess: (featureKey: FeatureKey) => boolean;
  openUpgradeModal: () => void;
}

const FeatureGateContext = React.createContext<FeatureGateContextValue | null>(null);

export function useFeatureGateContext() {
  const context = React.useContext(FeatureGateContext);
  if (!context) {
    throw new Error('useFeatureGateContext must be used within a FeatureGateProvider');
  }
  return context;
}

export { FeatureGateContext };
