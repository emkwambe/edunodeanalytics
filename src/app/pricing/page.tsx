'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Sparkles, Building2, Users, Shield, ArrowRight } from 'lucide-react';

type BillingPeriod = 'annual' | 'monthly';

interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: {
    annual: string;
    monthly: string;
  };
  priceSubtext?: string;
  popular?: boolean;
  cta: string;
  ctaVariant: 'primary' | 'secondary' | 'outline';
  features: {
    category: string;
    items: Array<{
      name: string;
      included: boolean;
      note?: string;
    }>;
  }[];
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Compliance Focus',
    description: 'Essential tools for charter compliance and board reporting',
    price: {
      annual: '$4,500',
      monthly: '$450',
    },
    priceSubtext: '/year',
    cta: 'Start Free Trial',
    ctaVariant: 'outline',
    features: [
      {
        category: 'Compliance & Reporting',
        items: [
          { name: 'Authorizer Portal', included: true, note: 'Board-ready dashboards' },
          { name: 'Standard Compliance Reports', included: true },
          { name: 'Audit Trail & FERPA Logging', included: true },
          { name: 'Custom Report Builder', included: false },
        ],
      },
      {
        category: 'Analytics',
        items: [
          { name: 'School Dashboard Overview', included: true },
          { name: 'Basic Mastery Trends', included: true },
          { name: 'Attendance Tracking', included: true },
          { name: 'Student Roster', included: true },
          { name: 'Student 360 Deep Dive', included: false },
          { name: 'Momentum Dashboard', included: false },
          { name: 'Impact Analyzer', included: false },
        ],
      },
      {
        category: 'Interventions',
        items: [
          { name: 'Basic MTSS Tier Tracking', included: false },
          { name: 'Intervention Hub', included: false },
          { name: 'Dosage Counter', included: false },
        ],
      },
      {
        category: 'AI Features',
        items: [
          { name: 'AI Qualitative Pulse', included: false },
          { name: 'EduNode Advisor', included: false },
        ],
      },
      {
        category: 'Support',
        items: [
          { name: 'Email Support', included: true },
          { name: 'Knowledge Base Access', included: true },
          { name: 'Live Training Sessions', included: false },
          { name: 'Dedicated Success Partner', included: false },
        ],
      },
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    tagline: 'Operational Excellence',
    description: 'Complete toolkit for data-driven instruction and MTSS',
    price: {
      annual: '$7,500',
      monthly: '$750',
    },
    priceSubtext: '/year + $5/student',
    popular: true,
    cta: 'Start Free Trial',
    ctaVariant: 'primary',
    features: [
      {
        category: 'Compliance & Reporting',
        items: [
          { name: 'Authorizer Portal', included: true, note: 'Board-ready dashboards' },
          { name: 'Standard Compliance Reports', included: true },
          { name: 'Audit Trail & FERPA Logging', included: true },
          { name: 'Custom Report Builder', included: true },
        ],
      },
      {
        category: 'Analytics',
        items: [
          { name: 'School Dashboard Overview', included: true },
          { name: 'Basic Mastery Trends', included: true },
          { name: 'Attendance Tracking', included: true },
          { name: 'Student Roster', included: true },
          { name: 'Student 360 Deep Dive', included: true, note: 'With CGI trajectory' },
          { name: 'Momentum Dashboard', included: true, note: '21-day cycles' },
          { name: 'Impact Analyzer', included: true },
        ],
      },
      {
        category: 'Interventions',
        items: [
          { name: 'Basic MTSS Tier Tracking', included: true },
          { name: 'Intervention Hub', included: true },
          { name: 'Dosage Counter', included: true, note: 'Track minutes vs targets' },
        ],
      },
      {
        category: 'AI Features',
        items: [
          { name: 'AI Qualitative Pulse', included: true, note: 'Gemini-powered' },
          { name: 'EduNode Advisor', included: true },
        ],
      },
      {
        category: 'Support',
        items: [
          { name: 'Email Support', included: true },
          { name: 'Knowledge Base Access', included: true },
          { name: 'Live Training Sessions', included: true, note: 'Monthly webinars' },
          { name: 'Dedicated Success Partner', included: false },
        ],
      },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Network Strategy',
    description: 'CMO-grade visibility with dedicated support',
    price: {
      annual: 'Custom',
      monthly: 'Custom',
    },
    priceSubtext: 'Starting at $25,000/year',
    cta: 'Contact Sales',
    ctaVariant: 'secondary',
    features: [
      {
        category: 'Compliance & Reporting',
        items: [
          { name: 'Authorizer Portal', included: true, note: 'Board-ready dashboards' },
          { name: 'Standard Compliance Reports', included: true },
          { name: 'Audit Trail & FERPA Logging', included: true },
          { name: 'Custom Report Builder', included: true },
        ],
      },
      {
        category: 'Analytics',
        items: [
          { name: 'School Dashboard Overview', included: true },
          { name: 'Basic Mastery Trends', included: true },
          { name: 'Attendance Tracking', included: true },
          { name: 'Student Roster', included: true },
          { name: 'Student 360 Deep Dive', included: true, note: 'With CGI trajectory' },
          { name: 'Momentum Dashboard', included: true, note: '21-day cycles' },
          { name: 'Impact Analyzer', included: true },
        ],
      },
      {
        category: 'Interventions',
        items: [
          { name: 'Basic MTSS Tier Tracking', included: true },
          { name: 'Intervention Hub', included: true },
          { name: 'Dosage Counter', included: true, note: 'Track minutes vs targets' },
        ],
      },
      {
        category: 'AI Features',
        items: [
          { name: 'AI Qualitative Pulse', included: true, note: 'Gemini-powered' },
          { name: 'EduNode Advisor', included: true },
        ],
      },
      {
        category: 'Network Features',
        items: [
          { name: 'Network View', included: true, note: 'Cross-school dashboard' },
          { name: 'Network Benchmarking', included: true },
          { name: 'Custom Logo & Full Branding', included: true },
          { name: 'API Access', included: true },
          { name: 'Custom Integrations', included: true },
          { name: 'SSO Configuration', included: true },
        ],
      },
      {
        category: 'Support',
        items: [
          { name: 'Email Support', included: true },
          { name: 'Knowledge Base Access', included: true },
          { name: 'Live Training Sessions', included: true, note: 'On-demand' },
          { name: 'Dedicated Success Partner', included: true, note: 'Named contact with SLA' },
        ],
      },
    ],
  },
];

const VALUE_PROPS = [
  {
    icon: Shield,
    title: 'FERPA Compliant',
    description: 'Enterprise-grade security with complete audit trails',
  },
  {
    icon: Building2,
    title: 'Built for Charters',
    description: 'Purpose-built for charter school accountability',
  },
  {
    icon: Users,
    title: '500+ Schools',
    description: 'Trusted by charter networks nationwide',
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');

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
            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="text-sm text-slate-600 hover:text-slate-900">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your school&apos;s needs. All plans include a 30-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-slate-100 p-1 rounded-lg mb-12">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                billingPeriod === 'annual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-green-600 font-semibold">Save 17%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="-mt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative rounded-2xl bg-white border-2 transition-shadow ${
                  tier.popular
                    ? 'border-blue-600 shadow-xl shadow-blue-100'
                    : 'border-slate-200 hover:shadow-lg'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  {/* Tier Header */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
                    <p className="text-sm text-blue-600 font-medium">{tier.tagline}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-900">
                        {tier.price[billingPeriod]}
                      </span>
                      {tier.priceSubtext && (
                        <span className="text-slate-500 text-sm">{tier.priceSubtext}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{tier.description}</p>
                  </div>

                  {/* CTA */}
                  <Link
                    href={tier.id === 'enterprise' ? '/contact' : '/sign-up'}
                    className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition ${
                      tier.ctaVariant === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : tier.ctaVariant === 'secondary'
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'border-2 border-slate-300 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4 inline-block ml-2" />
                  </Link>
                </div>

                {/* Features */}
                <div className="border-t border-slate-100 p-6 sm:p-8">
                  {tier.features.map((category) => (
                    <div key={category.category} className="mb-6 last:mb-0">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        {category.category}
                      </h4>
                      <ul className="space-y-2">
                        {category.items.map((item) => (
                          <li key={item.name} className="flex items-start gap-2">
                            {item.included ? (
                              <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                            )}
                            <span
                              className={`text-sm ${
                                item.included ? 'text-slate-700' : 'text-slate-400'
                              }`}
                            >
                              {item.name}
                              {item.note && (
                                <span className="text-slate-500 ml-1">({item.note})</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {VALUE_PROPS.map((prop) => (
              <div key={prop.title} className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <prop.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{prop.title}</h3>
                <p className="text-sm text-slate-600">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                How is the per-student fee calculated?
              </h3>
              <p className="text-slate-600">
                The per-student fee on Professional plans is based on your active enrollment count.
                We sync with your SIS monthly and adjust billing accordingly. You only pay for
                students actively enrolled.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Can I switch plans mid-year?
              </h3>
              <p className="text-slate-600">
                Yes! Upgrades take effect immediately with prorated billing. Downgrades take effect
                at the start of your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                What data integrations are included?
              </h3>
              <p className="text-slate-600">
                All plans include standard integrations with major SIS platforms (PowerSchool,
                Infinite Campus, Skyward) and assessment providers (NWEA MAP, iReady, STAR).
                Custom integrations are available on Enterprise plans.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Is my data secure?
              </h3>
              <p className="text-slate-600">
                Absolutely. EduNode is SOC 2 Type II certified, FERPA compliant, and uses
                enterprise-grade encryption. We maintain complete audit trails and never share
                student data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your school&apos;s data?
          </h2>
          <p className="text-blue-100 mb-8">
            Start your 30-day free trial today. No credit card required.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">EduNode Analytics</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900">Terms</Link>
              <Link href="/security" className="hover:text-slate-900">Security</Link>
              <Link href="/contact" className="hover:text-slate-900">Contact</Link>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} EduNode Analytics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
