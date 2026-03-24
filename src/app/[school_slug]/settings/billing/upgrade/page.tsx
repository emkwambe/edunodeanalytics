'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TIER_INFO, FEATURES, getLockedFeatures, type SubscriptionTier, type FeatureKey } from '@/lib/features/feature-gates';
import { getSchoolSeed } from '@/lib/data/seed-data';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Shield,
  Sparkles,
  Zap,
  Building2,
  Users,
  Lock,
} from 'lucide-react';

export default function UpgradePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const school_slug = params.school_slug as string;

  const targetTier = (searchParams.get('tier') as SubscriptionTier) || 'pro';
  const schoolSeed = getSchoolSeed(school_slug);
  const currentTier: SubscriptionTier = schoolSeed?.subscriptionTier || 'starter';
  const currentTierInfo = TIER_INFO[currentTier];
  const targetTierInfo = TIER_INFO[targetTier];

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [step, setStep] = React.useState<'review' | 'confirm' | 'success'>('review');

  // Get features that will be unlocked with upgrade
  const newFeatures = Object.values(FEATURES).filter(
    (f) => {
      const tierHierarchy: Record<SubscriptionTier, number> = { starter: 1, pro: 2, enterprise: 3 };
      const currentLevel = tierHierarchy[currentTier];
      const featureLevel = tierHierarchy[f.tier];
      const targetLevel = tierHierarchy[targetTier];
      return featureLevel > currentLevel && featureLevel <= targetLevel;
    }
  );

  // Calculate pricing
  const studentCount = schoolSeed?.studentCount || 450;
  const pricing = {
    starter: { base: 375, perStudent: 0 },
    pro: { base: 625, perStudent: 5 },
    enterprise: { base: 2083, perStudent: 0 },
  };

  const currentMonthly = pricing[currentTier].base + (pricing[currentTier].perStudent * studentCount / 12);
  const targetMonthly = pricing[targetTier].base + (pricing[targetTier].perStudent * studentCount / 12);
  const difference = targetMonthly - currentMonthly;

  const handleUpgrade = async () => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setStep('success');
    setIsProcessing(false);
  };

  if (step === 'success') {
    return (
      <>
        <PageHeader
          title="Upgrade Complete"
          description="Your subscription has been upgraded successfully"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border-emerald-500/30">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to {targetTierInfo.name}!</h2>
              <p className="text-slate-400 mb-6">
                Your account has been upgraded. All new features are now available.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push(`/${school_slug}/dashboard`)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Explore New Features
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${school_slug}/settings/billing`)}
                  className="w-full"
                >
                  Return to Billing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Upgrade to ${targetTierInfo.name}`}
        description={targetTierInfo.tagline}
      />

      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/${school_slug}/settings/billing`)}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Billing
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Current Plan */}
                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                  <Badge className="mb-3 bg-slate-500/20 text-slate-400">Current Plan</Badge>
                  <h3 className="text-xl font-bold text-white mb-1">{currentTierInfo.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{currentTierInfo.tagline}</p>
                  <div className="text-2xl font-black text-white">
                    ${currentMonthly.toFixed(0)}<span className="text-sm font-normal text-slate-400">/mo</span>
                  </div>
                </div>

                {/* Target Plan */}
                <div className="p-4 bg-gradient-to-br from-indigo-900/40 to-cyan-900/40 rounded-lg border border-indigo-500/30">
                  <Badge className="mb-3 bg-indigo-500/20 text-indigo-400">Upgrading To</Badge>
                  <h3 className="text-xl font-bold text-white mb-1">{targetTierInfo.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{targetTierInfo.tagline}</p>
                  <div className="text-2xl font-black text-white">
                    ${targetMonthly.toFixed(0)}<span className="text-sm font-normal text-slate-400">/mo</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Features You&apos;ll Unlock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {newFeatures.map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{feature.name}</div>
                      <div className="text-xs text-slate-500">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-slate-400">256-bit SSL Security</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-slate-400">FERPA Compliant</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-slate-400">Instant Activation</span>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-6 border-indigo-500/30">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current subscription details */}
              <div className="space-y-2 pb-4 border-b border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="w-4 h-4" />
                  <span>{studentCount} students enrolled</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Building2 className="w-4 h-4" />
                  <span>{schoolSeed?.name || 'Your School'}</span>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{targetTierInfo.name} Base</span>
                  <span className="text-white">${pricing[targetTier].base}/mo</span>
                </div>
                {pricing[targetTier].perStudent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Per-student ({studentCount} x ${pricing[targetTier].perStudent})</span>
                    <span className="text-white">${(pricing[targetTier].perStudent * studentCount / 12).toFixed(0)}/mo</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                  <span className="text-slate-400">Current plan</span>
                  <span className="text-slate-500">-${currentMonthly.toFixed(0)}/mo</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-white">Additional Cost</span>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">
                      +${difference.toFixed(0)}<span className="text-sm font-normal text-slate-400">/mo</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      ${(difference * 12).toFixed(0)}/year
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <div className="text-sm text-white">Visa ending in 4242</div>
                  <div className="text-xs text-slate-500">Charges to existing card</div>
                </div>
              </div>

              {/* CTA */}
              <Button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white h-12 text-base font-bold"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">&#9696;</span>
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Upgrade
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                By confirming, you agree to our{' '}
                <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>
              </p>
            </CardContent>
          </Card>

          {/* Help */}
          <Card className="bg-slate-800/30">
            <CardContent className="pt-4">
              <p className="text-sm text-slate-400 mb-2">Need help deciding?</p>
              <Link
                href={`/${school_slug}/help`}
                className="text-sm text-indigo-400 hover:underline"
              >
                Talk to our sales team
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
