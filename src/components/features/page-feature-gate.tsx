'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Lock, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type FeatureKey,
  type SubscriptionTier,
  FEATURES,
  TIER_INFO,
  hasFeatureAccess,
  getNextTier,
  getLockedFeatures,
} from '@/lib/features/feature-gates';
import { getSchoolSeed } from '@/lib/data/seed-data';

interface PageFeatureGateProps {
  featureKey: FeatureKey;
  children: React.ReactNode;
}

/**
 * Page-Level Feature Gate
 *
 * Wraps an entire page's content. If the current school's tier
 * doesn't have access, shows a full-page locked state with
 * upgrade prompt and preview of what they'd get.
 */
export function PageFeatureGate({ featureKey, children }: PageFeatureGateProps) {
  const params = useParams();
  const schoolSlug = params?.school_slug as string;
  const schoolSeed = getSchoolSeed(schoolSlug);
  const tier: SubscriptionTier = (schoolSeed?.subscriptionTier as SubscriptionTier) || 'starter';

  if (hasFeatureAccess(tier, featureKey)) {
    return <>{children}</>;
  }

  const feature = FEATURES[featureKey];
  const nextTier = getNextTier(tier);
  const nextTierInfo = nextTier ? TIER_INFO[nextTier] : null;

  // Get a few other locked features to show value
  const otherLockedFeatures = getLockedFeatures(tier)
    .filter((f) => f.key !== featureKey)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Main locked state */}
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 mb-6">
          <Lock className="w-10 h-10 text-indigo-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">{feature.name}</h1>
        <p className="text-slate-400 text-center max-w-md mb-2">
          {feature.description}
        </p>
        <p className="text-sm text-indigo-400 mb-8">{feature.upgradeMessage}</p>

        {nextTierInfo && (
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to {nextTierInfo.name} — {nextTierInfo.price}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs text-slate-500">
              {nextTierInfo.tagline} — {nextTierInfo.features.length} features included
            </p>
          </div>
        )}
      </div>

      {/* What you'd unlock */}
      {otherLockedFeatures.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Also included with {nextTierInfo?.name}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherLockedFeatures.map((f) => (
              <div
                key={f.key}
                className="flex items-center gap-3 p-3 bg-slate-800/30 border border-slate-700/50 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">{f.name}</p>
                  <p className="text-xs text-slate-500">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
