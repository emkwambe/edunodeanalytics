'use client';

import * as React from 'react';
import { Lock, Sparkles, ArrowRight, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  type FeatureKey,
  type SubscriptionTier,
  FEATURES,
  TIER_INFO,
  getNextTier,
} from '@/lib/features/feature-gates';
import { cn } from '@/lib/utils';

interface LockedFeatureProps {
  featureKey: FeatureKey;
  currentTier: SubscriptionTier;
  variant?: 'card' | 'overlay' | 'inline' | 'sidebar';
  onUpgradeClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Locked Feature Component
 *
 * Displays a locked feature with upgrade prompt instead of hiding it.
 * This drives "Self-Service Upgrades" by showing the value gap.
 *
 * Variants:
 * - card: Full card with feature description and upgrade CTA
 * - overlay: Semi-transparent overlay on top of blurred content
 * - inline: Small inline badge with lock icon
 * - sidebar: Compact sidebar navigation item
 */
export function LockedFeature({
  featureKey,
  currentTier,
  variant = 'card',
  onUpgradeClick,
  className,
  children,
}: LockedFeatureProps) {
  const feature = FEATURES[featureKey];
  const nextTier = getNextTier(currentTier);
  const nextTierInfo = nextTier ? TIER_INFO[nextTier] : null;

  if (variant === 'overlay' && children) {
    return (
      <div className={cn('relative', className)}>
        {/* Blurred content underneath */}
        <div className="blur-sm opacity-30 pointer-events-none select-none">
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-2xl">
          <div className="text-center p-6 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
              <Lock className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{feature.name}</h3>
            <p className="text-sm text-slate-400 mb-4">{feature.upgradeMessage}</p>
            {nextTierInfo && (
              <Button
                onClick={onUpgradeClick}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to {nextTierInfo.name}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-slate-800/50 border-slate-600 text-slate-400 cursor-pointer hover:border-indigo-500/50 hover:text-indigo-400 transition-colors',
          className
        )}
        onClick={onUpgradeClick}
      >
        <Lock className="w-3 h-3 mr-1" />
        {feature.name}
      </Badge>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={onUpgradeClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-400 hover:bg-slate-800/50 transition-all group',
          className
        )}
      >
        <Lock className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
        <span className="flex-1 text-left text-sm">{feature.name}</span>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 border-indigo-500/30 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          PRO
        </Badge>
      </button>
    );
  }

  // Default: card variant
  return (
    <Card
      className={cn(
        'bg-slate-800/30 border-slate-700/50 hover:border-indigo-500/30 transition-all cursor-pointer group',
        className
      )}
      onClick={onUpgradeClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Lock Icon */}
          <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
            <Lock className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-400 group-hover:text-white transition-colors">
                {feature.name}
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-indigo-500/30 text-indigo-400"
              >
                {feature.tier === 'pro' ? 'PRO' : 'ENTERPRISE'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mb-3">{feature.description}</p>
            <p className="text-xs text-indigo-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {feature.upgradeMessage}
            </p>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Locked Feature Grid
 *
 * Shows multiple locked features in a grid layout
 */
interface LockedFeatureGridProps {
  features: FeatureKey[];
  currentTier: SubscriptionTier;
  onUpgradeClick?: () => void;
  className?: string;
}

export function LockedFeatureGrid({
  features,
  currentTier,
  onUpgradeClick,
  className,
}: LockedFeatureGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {features.map((featureKey) => (
        <LockedFeature
          key={featureKey}
          featureKey={featureKey}
          currentTier={currentTier}
          variant="card"
          onUpgradeClick={onUpgradeClick}
        />
      ))}
    </div>
  );
}

/**
 * Feature Gate Wrapper
 *
 * Conditionally renders children or locked state based on tier access
 */
interface FeatureGateProps {
  featureKey: FeatureKey;
  currentTier: SubscriptionTier;
  onUpgradeClick?: () => void;
  lockedVariant?: 'card' | 'overlay' | 'inline';
  children: React.ReactNode;
}

export function FeatureGate({
  featureKey,
  currentTier,
  onUpgradeClick,
  lockedVariant = 'overlay',
  children,
}: FeatureGateProps) {
  const feature = FEATURES[featureKey];
  const tierLevel = { starter: 1, pro: 2, enterprise: 3 };

  const hasAccess = tierLevel[currentTier] >= tierLevel[feature.tier];

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <LockedFeature
      featureKey={featureKey}
      currentTier={currentTier}
      variant={lockedVariant}
      onUpgradeClick={onUpgradeClick}
    >
      {children}
    </LockedFeature>
  );
}

/**
 * Upgrade Prompt Banner
 *
 * Horizontal banner for promoting upgrades
 */
interface UpgradePromptBannerProps {
  currentTier: SubscriptionTier;
  featureKey?: FeatureKey;
  onUpgradeClick?: () => void;
  className?: string;
}

export function UpgradePromptBanner({
  currentTier,
  featureKey,
  onUpgradeClick,
  className,
}: UpgradePromptBannerProps) {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return null;

  const nextTierInfo = TIER_INFO[nextTier];
  const feature = featureKey ? FEATURES[featureKey] : null;

  return (
    <div
      className={cn(
        'p-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <p className="font-bold text-white">
              {feature
                ? `Unlock ${feature.name}`
                : `Upgrade to ${nextTierInfo.name}`}
            </p>
            <p className="text-sm text-slate-400">
              {feature?.upgradeMessage || nextTierInfo.tagline}
            </p>
          </div>
        </div>
        <Button
          onClick={onUpgradeClick}
          className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}
