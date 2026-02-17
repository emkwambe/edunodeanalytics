'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TIER_INFO, FEATURES, getLockedFeatures, type SubscriptionTier } from '@/lib/features/feature-gates';
import { getSchoolSeed } from '@/lib/data/seed-data';
import {
  CreditCard,
  Download,
  ExternalLink,
  Check,
  AlertCircle,
  Calendar,
  Users,
  TrendingUp,
  Building2,
  FileText,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  pdfUrl: string;
}

const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-2026-001', date: '2026-02-01', amount: '$625.00', status: 'paid', description: 'Professional Plan - February 2026', pdfUrl: '#' },
  { id: 'INV-2026-000', date: '2026-01-01', amount: '$625.00', status: 'paid', description: 'Professional Plan - January 2026', pdfUrl: '#' },
  { id: 'INV-2025-012', date: '2025-12-01', amount: '$625.00', status: 'paid', description: 'Professional Plan - December 2025', pdfUrl: '#' },
  { id: 'INV-2025-011', date: '2025-11-01', amount: '$625.00', status: 'paid', description: 'Professional Plan - November 2025', pdfUrl: '#' },
];

export default function BillingPage() {
  const params = useParams();
  const router = useRouter();
  const school_slug = params.school_slug as string;

  const schoolSeed = getSchoolSeed(school_slug);
  const currentTier: SubscriptionTier = schoolSeed?.subscriptionTier || 'starter';
  const tierInfo = TIER_INFO[currentTier];
  const lockedFeatures = getLockedFeatures(currentTier);

  const [isManagingBilling, setIsManagingBilling] = React.useState(false);

  // Mock subscription data
  const subscription = {
    status: 'active' as const,
    currentPeriodEnd: '2026-03-01',
    studentCount: schoolSeed?.studentCount || 450,
    staffSeats: 25,
    monthlyBase: currentTier === 'starter' ? 375 : currentTier === 'pro' ? 625 : 2083,
    perStudentFee: currentTier === 'pro' ? 5 : 0,
    paymentMethod: {
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2027,
    },
  };

  const monthlyTotal = subscription.monthlyBase + (subscription.perStudentFee * subscription.studentCount / 12);

  const handleManageBilling = async () => {
    setIsManagingBilling(true);
    // In production, this would call /api/subscriptions/portal to create a Stripe portal session
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // window.location.href = portalUrl;
    setIsManagingBilling(false);
  };

  const handleUpgrade = (targetTier: SubscriptionTier) => {
    // In production, this would call /api/subscriptions/upgrade
    router.push(`/${school_slug}/settings/billing/upgrade?tier=${targetTier}`);
  };

  return (
    <>
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription, payment methods, and invoices"
      />

      <div className="space-y-6">
        {/* Current Plan Overview */}
        <Card className="bg-gradient-to-br from-indigo-900/30 to-cyan-900/30 border-indigo-500/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={cn(
                    'text-xs font-bold',
                    currentTier === 'enterprise' && 'bg-purple-500/20 text-purple-400',
                    currentTier === 'pro' && 'bg-indigo-500/20 text-indigo-400',
                    currentTier === 'starter' && 'bg-slate-500/20 text-slate-400'
                  )}>
                    {tierInfo.name}
                  </Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                    {subscription.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <h2 className="text-3xl font-black text-white mb-1">
                  ${monthlyTotal.toFixed(0)}<span className="text-lg font-normal text-slate-400">/month</span>
                </h2>
                <p className="text-sm text-slate-400">{tierInfo.tagline}</p>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-700/50">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Users className="w-3 h-3" />
                      Students
                    </div>
                    <div className="text-xl font-bold text-white">{subscription.studentCount}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Building2 className="w-3 h-3" />
                      Staff Seats
                    </div>
                    <div className="text-xl font-bold text-white">{subscription.staffSeats}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Calendar className="w-3 h-3" />
                      Renews
                    </div>
                    <div className="text-xl font-bold text-white">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleManageBilling}
                  disabled={isManagingBilling}
                  className="bg-white text-slate-900 hover:bg-slate-100"
                >
                  {isManagingBilling ? (
                    <>
                      <span className="animate-spin mr-2">&#9696;</span>
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Manage Subscription
                    </>
                  )}
                </Button>
                {currentTier !== 'enterprise' && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpgrade(currentTier === 'starter' ? 'pro' : 'enterprise')}
                    className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold uppercase">
                      {subscription.paymentMethod.brand}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      **** **** **** {subscription.paymentMethod.last4}
                    </div>
                    <div className="text-xs text-slate-500">
                      Expires {subscription.paymentMethod.expMonth}/{subscription.paymentMethod.expYear}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleManageBilling}>
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Billing Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Base subscription ({tierInfo.name})</span>
                  <span className="text-white">${subscription.monthlyBase}/mo</span>
                </div>
                {subscription.perStudentFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Per-student fee ({subscription.studentCount} x ${subscription.perStudentFee})</span>
                    <span className="text-white">${(subscription.perStudentFee * subscription.studentCount / 12).toFixed(0)}/mo</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-3 border-t border-slate-700">
                  <span className="font-medium text-white">Monthly Total</span>
                  <span className="font-bold text-white">${monthlyTotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Annual Total</span>
                  <span className="text-slate-400">${(monthlyTotal * 12).toFixed(0)}/year</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Prompt (if not enterprise) */}
        {currentTier !== 'enterprise' && lockedFeatures.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-900/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">
                    Unlock {lockedFeatures.length} more features
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Upgrade to {currentTier === 'starter' ? 'Professional' : 'Enterprise'} to access:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {lockedFeatures.slice(0, 5).map((feature) => (
                      <Badge key={feature.key} className="bg-slate-800 text-slate-300 text-xs">
                        {feature.name}
                      </Badge>
                    ))}
                    {lockedFeatures.length > 5 && (
                      <Badge className="bg-slate-800 text-slate-500 text-xs">
                        +{lockedFeatures.length - 5} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleUpgrade(currentTier === 'starter' ? 'pro' : 'enterprise')}
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      View Upgrade Options
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Link href="/pricing" className="text-sm text-amber-400 hover:underline">
                      Compare all plans
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Invoice History
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-indigo-400">
                Download All
                <Download className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MOCK_INVOICES.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{invoice.description}</div>
                      <div className="text-xs text-slate-500">
                        {invoice.id} &bull; {new Date(invoice.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{invoice.amount}</div>
                      <Badge className={cn(
                        'text-[10px]',
                        invoice.status === 'paid' && 'bg-emerald-500/20 text-emerald-400',
                        invoice.status === 'pending' && 'bg-amber-500/20 text-amber-400',
                        invoice.status === 'failed' && 'bg-rose-500/20 text-rose-400'
                      )}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage This Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-white">{subscription.studentCount}</div>
                <div className="text-xs text-slate-500">Active Students</div>
                <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-white">{subscription.staffSeats}</div>
                <div className="text-xs text-slate-500">Staff Seats Used</div>
                <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '50%' }} />
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-white">2.4k</div>
                <div className="text-xs text-slate-500">API Calls</div>
                <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '24%' }} />
                </div>
              </div>
              <div className="p-4 bg-slate-800/30 rounded-lg">
                <div className="text-2xl font-bold text-white">156</div>
                <div className="text-xs text-slate-500">Reports Generated</div>
                <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '62%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Link */}
        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-400">
              Need help with billing? Our support team is here to assist.
            </span>
          </div>
          <Link href={`/${school_slug}/help`} className="text-sm text-indigo-400 hover:underline flex items-center gap-1">
            Contact Support
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
