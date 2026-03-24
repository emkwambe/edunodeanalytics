'use client';

import * as React from 'react';
import {
  Crown,
  Check,
  Zap,
  Building2,
  ArrowRight,
  X,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  type SubscriptionTier,
  TIER_INFO,
  getNextTier,
} from '@/lib/features/feature-gates';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  highlightedFeature?: string;
}

/**
 * Upgrade Modal
 *
 * Full-screen modal for self-service tier upgrades.
 * Shows comparison of current tier vs upgrade options.
 */
export function UpgradeModal({
  isOpen,
  onClose,
  currentTier,
  highlightedFeature,
}: UpgradeModalProps) {
  const _nextTier = getNextTier(currentTier);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
              <Crown className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Unlock More Powerful Features
              </h2>
              <p className="text-slate-400">
                Choose the plan that fits your school&apos;s needs
              </p>
            </div>
          </div>

          {highlightedFeature && (
            <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-300">
                You clicked on <strong>{highlightedFeature}</strong> - upgrade to unlock this feature
              </span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <PricingCard
            tier="starter"
            currentTier={currentTier}
            icon={<Shield className="w-6 h-6" />}
            features={[
              { label: 'Authorizer Portal', included: true },
              { label: 'Basic Mastery Trends', included: true },
              { label: 'Attendance Tracking', included: true },
              { label: 'Standard Reports', included: true },
              { label: 'Student 360 Deep Dive', included: false },
              { label: 'AI Qualitative Pulse', included: false },
              { label: 'Intervention Hub', included: false },
            ]}
          />

          {/* Professional */}
          <PricingCard
            tier="pro"
            currentTier={currentTier}
            recommended={currentTier === 'starter'}
            icon={<Zap className="w-6 h-6" />}
            features={[
              { label: 'Everything in Starter', included: true, highlight: true },
              { label: 'Student 360 Deep Dive', included: true },
              { label: 'AI Qualitative Pulse', included: true },
              { label: 'Intervention Hub', included: true },
              { label: 'Impact Analyzer', included: true },
              { label: 'Momentum Dashboard', included: true },
              { label: 'Brand Colors', included: true },
              { label: 'Network View', included: false },
            ]}
          />

          {/* Enterprise */}
          <PricingCard
            tier="enterprise"
            currentTier={currentTier}
            recommended={currentTier === 'pro'}
            icon={<Building2 className="w-6 h-6" />}
            features={[
              { label: 'Everything in Professional', included: true, highlight: true },
              { label: 'Custom Logo & Branding', included: true },
              { label: 'Network Benchmarking', included: true },
              { label: 'Network View', included: true },
              { label: 'API Access', included: true },
              { label: 'Custom Integrations', included: true },
              { label: 'Dedicated Success Partner', included: true },
            ]}
          />
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 border-t border-slate-800 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Questions? Contact{' '}
              <a href="mailto:sales@edunodeanalytics.com" className="text-indigo-400 hover:underline">
                sales@edunodeanalytics.com
              </a>
            </div>
            <Button variant="outline" onClick={onClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PricingCardProps {
  tier: SubscriptionTier;
  currentTier: SubscriptionTier;
  recommended?: boolean;
  icon: React.ReactNode;
  features: Array<{ label: string; included: boolean; highlight?: boolean }>;
}

function PricingCard({
  tier,
  currentTier,
  recommended,
  icon,
  features,
}: PricingCardProps) {
  const tierInfo = TIER_INFO[tier];
  const isCurrent = tier === currentTier;
  const tierLevel = { starter: 1, pro: 2, enterprise: 3 };
  const isDowngrade = tierLevel[tier] < tierLevel[currentTier];

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        recommended
          ? 'bg-gradient-to-b from-indigo-900/30 to-slate-800/50 border-indigo-500/50 scale-105'
          : 'bg-slate-800/30 border-slate-700/50',
        isCurrent && 'border-emerald-500/50'
      )}
    >
      {recommended && (
        <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-center py-1">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Recommended
          </span>
        </div>
      )}

      {isCurrent && (
        <div className="absolute top-0 left-0 right-0 bg-emerald-600 text-center py-1">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Current Plan
          </span>
        </div>
      )}

      <CardContent className={cn('p-6', (recommended || isCurrent) && 'pt-10')}>
        {/* Tier Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              tier === 'enterprise'
                ? 'bg-purple-500/20 text-purple-400'
                : tier === 'pro'
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-slate-500/20 text-slate-400'
            )}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-white">{tierInfo.name}</h3>
            <p className="text-xs text-slate-400">{tierInfo.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="text-2xl font-black text-white">{tierInfo.price}</div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-6">
          {features.map((feature, idx) => (
            <li
              key={idx}
              className={cn(
                'flex items-center gap-2 text-sm',
                feature.included ? 'text-slate-300' : 'text-slate-600'
              )}
            >
              {feature.included ? (
                <Check
                  className={cn(
                    'w-4 h-4 shrink-0',
                    feature.highlight ? 'text-indigo-400' : 'text-emerald-400'
                  )}
                />
              ) : (
                <X className="w-4 h-4 text-slate-600 shrink-0" />
              )}
              <span className={feature.highlight ? 'text-indigo-300' : ''}>
                {feature.label}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isCurrent ? (
          <Button disabled className="w-full" variant="outline">
            Current Plan
          </Button>
        ) : isDowngrade ? (
          <Button disabled className="w-full" variant="outline">
            Contact Support
          </Button>
        ) : (
          <Button
            className={cn(
              'w-full',
              recommended
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-slate-700 hover:bg-slate-600'
            )}
          >
            {tier === 'enterprise' ? 'Contact Sales' : 'Upgrade Now'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook for managing upgrade modal state
 */
export function useUpgradeModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedFeature, setHighlightedFeature] = React.useState<string>();

  const openModal = React.useCallback((feature?: string) => {
    setHighlightedFeature(feature);
    setIsOpen(true);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsOpen(false);
    setHighlightedFeature(undefined);
  }, []);

  return {
    isOpen,
    highlightedFeature,
    openModal,
    closeModal,
  };
}
