'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Check,
  ArrowLeft,
  Building2,
  CreditCard,
  Shield,
  Loader2,
} from 'lucide-react';

type SubscriptionTier = 'starter' | 'pro';
type BillingPeriod = 'monthly' | 'annual';

interface TierConfig {
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  perStudentFee?: number;
  features: string[];
}

const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  starter: {
    name: 'Starter',
    tagline: 'Compliance Focus',
    monthlyPrice: 450,
    annualPrice: 4500,
    features: [
      'Authorizer Portal',
      'Basic Mastery Trends',
      'Attendance Tracking',
      'Standard Reports',
      'Email Support',
    ],
  },
  pro: {
    name: 'Professional',
    tagline: 'Operational Excellence',
    monthlyPrice: 750,
    annualPrice: 7500,
    perStudentFee: 5,
    features: [
      'Everything in Starter',
      'Student 360 Deep Dive',
      'Intervention Hub',
      'AI Qualitative Pulse',
      'Impact Analyzer',
      'Momentum Dashboard',
      'Brand Colors Customization',
      'Live Training Sessions',
    ],
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tierParam = searchParams.get('tier') as SubscriptionTier | null;
  const periodParam = searchParams.get('period') as BillingPeriod | null;

  const [tier, setTier] = useState<SubscriptionTier>(tierParam || 'pro');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(periodParam || 'annual');
  const [studentCount, setStudentCount] = useState<string>('450');
  const [schoolName, setSchoolName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tierConfig = TIER_CONFIG[tier];
  const studentCountNum = parseInt(studentCount, 10) || 0;

  // Calculate pricing
  const basePrice = billingPeriod === 'annual' ? tierConfig.annualPrice : tierConfig.monthlyPrice;
  const perStudentTotal = tier === 'pro' && tierConfig.perStudentFee
    ? tierConfig.perStudentFee * studentCountNum
    : 0;
  const totalPrice = billingPeriod === 'annual'
    ? basePrice + perStudentTotal
    : basePrice + (perStudentTotal / 12);

  const handleCheckout = async () => {
    if (!schoolName.trim()) {
      setError('Please enter your school name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate a slug from the school name
      const schoolSlug = schoolName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          billingPeriod,
          schoolSlug,
          studentCount: tier === 'pro' ? studentCountNum : undefined,
          successUrl: `${window.location.origin}/onboarding?checkout=success&school=${schoolSlug}`,
          cancelUrl: `${window.location.origin}/checkout?tier=${tier}&period=${billingPeriod}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">EduNode</span>
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Pricing
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Complete your subscription
          </h1>
          <p className="text-slate-600">
            Start your 30-day free trial. No credit card required to start.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Configuration */}
          <div className="space-y-6">
            {/* Plan Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Select your plan</h2>
              <div className="space-y-3">
                {(Object.keys(TIER_CONFIG) as SubscriptionTier[]).map((t) => (
                  <label
                    key={t}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                      tier === t
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tier"
                      value={t}
                      checked={tier === t}
                      onChange={() => setTier(t)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900">
                            {TIER_CONFIG[t].name}
                          </span>
                          <span className="text-sm text-blue-600 ml-2">
                            {TIER_CONFIG[t].tagline}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">
                          ${billingPeriod === 'annual'
                            ? TIER_CONFIG[t].annualPrice.toLocaleString()
                            : TIER_CONFIG[t].monthlyPrice.toLocaleString()}
                          <span className="text-sm font-normal text-slate-500">
                            /{billingPeriod === 'annual' ? 'year' : 'month'}
                          </span>
                        </span>
                      </div>
                      {t === 'pro' && (
                        <p className="text-sm text-slate-500 mt-1">
                          + $5/student/year for usage-based pricing
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Billing Period */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Billing period</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    billingPeriod === 'annual'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">Annual</div>
                  <div className="text-sm text-green-600">Save 17%</div>
                </button>
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    billingPeriod === 'monthly'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">Monthly</div>
                  <div className="text-sm text-slate-500">Flexible</div>
                </button>
              </div>
            </div>

            {/* School Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">School information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-slate-700 mb-1">
                    School name *
                  </label>
                  <input
                    type="text"
                    id="schoolName"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g., Riverdale Charter Academy"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                {tier === 'pro' && (
                  <div>
                    <label htmlFor="studentCount" className="block text-sm font-medium text-slate-700 mb-1">
                      Estimated student enrollment
                    </label>
                    <input
                      type="number"
                      id="studentCount"
                      value={studentCount}
                      onChange={(e) => setStudentCount(e.target.value)}
                      min="1"
                      max="10000"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      We&apos;ll sync with your SIS monthly and adjust billing automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24">
              <h2 className="font-semibold text-slate-900 mb-4">Order summary</h2>

              {/* Selected Plan */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{tierConfig.name} Plan</div>
                  <div className="text-sm text-slate-500">
                    {billingPeriod === 'annual' ? 'Annual billing' : 'Monthly billing'}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {tierConfig.features.slice(0, 5).map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {feature}
                  </div>
                ))}
                {tierConfig.features.length > 5 && (
                  <div className="text-sm text-slate-500">
                    + {tierConfig.features.length - 5} more features
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {tierConfig.name} ({billingPeriod})
                  </span>
                  <span className="text-slate-900">
                    ${basePrice.toLocaleString()}
                  </span>
                </div>
                {tier === 'pro' && perStudentTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      Per-student fee ({studentCountNum} students)
                    </span>
                    <span className="text-slate-900">
                      ${perStudentTotal.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">
                    Total {billingPeriod === 'annual' ? 'per year' : 'per month'}
                  </span>
                  <span className="text-slate-900">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Trial Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-800 text-sm">
                      30-day free trial included
                    </div>
                    <div className="text-green-700 text-xs">
                      You won&apos;t be charged until your trial ends. Cancel anytime.
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Start Free Trial
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center mt-4">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
