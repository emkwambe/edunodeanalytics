'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Zap,
  Crown,
  X,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface UpgradeBannerProps {
  currentPlan?: 'starter' | 'professional';
  feature?: string;
  dismissible?: boolean;
}

export function UpgradeBanner({
  currentPlan = 'starter',
  feature,
  dismissible = true,
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const targetPlan = currentPlan === 'starter' ? 'Professional' : 'Enterprise';
  const message = feature
    ? `Unlock ${feature} with ${targetPlan}`
    : `Upgrade to ${targetPlan} for more powerful features`;

  return (
    <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-lg flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={`/pricing${currentPlan === 'starter' ? '?highlight=pro' : '?highlight=enterprise'}`}
          className="bg-white text-indigo-600 px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-1"
        >
          Upgrade Now
          <ArrowRight className="w-3 h-3" />
        </Link>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface UpgradeInlineProps {
  feature: string;
  description?: string;
  targetPlan?: 'professional' | 'enterprise';
  size?: 'sm' | 'md' | 'lg';
}

export function UpgradeInline({
  feature,
  description,
  targetPlan = 'professional',
  size = 'md',
}: UpgradeInlineProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Card className={`${sizeClasses[size]} border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Zap className={iconSize[size]} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
            {feature}
          </h4>
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {description}
            </p>
          )}
          <Link
            href={`/compare-plans#${feature.toLowerCase().replace(/\s+/g, '-')}`}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2"
          >
            Upgrade to {targetPlan === 'enterprise' ? 'Enterprise' : 'Professional'}
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

interface FeatureLockedProps {
  feature: string;
  requiredPlan: 'professional' | 'enterprise';
  children?: React.ReactNode;
  showPreview?: boolean;
}

export function FeatureLocked({
  feature,
  requiredPlan,
  children,
  showPreview = false,
}: FeatureLockedProps) {
  return (
    <div className="relative">
      {showPreview && children && (
        <div className="opacity-30 pointer-events-none select-none">
          {children}
        </div>
      )}
      <div className={`${showPreview ? 'absolute inset-0' : ''} flex items-center justify-center`}>
        <Card className="p-6 text-center max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-lg">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            {feature}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            This feature requires{' '}
            {requiredPlan === 'enterprise' ? 'an Enterprise' : 'a Professional'} plan.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Crown className="w-4 h-4" />
            Upgrade Plan
          </Link>
        </Card>
      </div>
    </div>
  );
}

interface UpgradeCardProps {
  title?: string;
  description?: string;
  features?: string[];
  targetPlan?: 'professional' | 'enterprise';
  variant?: 'default' | 'gradient' | 'minimal';
}

export function UpgradeCard({
  title = 'Unlock More Features',
  description = 'Get access to advanced analytics, AI-powered insights, and more.',
  features = [],
  targetPlan = 'professional',
  variant = 'default',
}: UpgradeCardProps) {
  const variantClasses = {
    default: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700',
    gradient: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800',
    minimal: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  };

  return (
    <Card className={`p-6 ${variantClasses[variant]}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
          <Crown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-indigo-600">
            {targetPlan === 'enterprise' ? 'Enterprise' : 'Professional'} Plan
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        {description}
      </p>

      {features.length > 0 && (
        <ul className="space-y-2 mb-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <Link
          href="/pricing"
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors text-center"
        >
          View Plans
        </Link>
        <Link
          href="/compare-plans"
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-300 transition-colors"
        >
          Compare
        </Link>
      </div>
    </Card>
  );
}

interface TrialCountdownProps {
  daysRemaining: number;
}

export function TrialCountdown({ daysRemaining }: TrialCountdownProps) {
  const urgency = daysRemaining <= 3 ? 'high' : daysRemaining <= 7 ? 'medium' : 'low';

  const urgencyClasses = {
    high: 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
    medium: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    low: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400',
  };

  return (
    <Card className={`p-4 ${urgencyClasses[urgency]} border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold">{daysRemaining}</div>
          <div className="text-sm">
            <p className="font-medium">days left</p>
            <p className="opacity-80">in your trial</p>
          </div>
        </div>
        <Link
          href="/pricing"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            urgency === 'high'
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : urgency === 'medium'
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          Choose Plan
        </Link>
      </div>
    </Card>
  );
}
