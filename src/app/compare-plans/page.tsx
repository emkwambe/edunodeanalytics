import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Check,
  X,
  Minus,
  ArrowRight,
  HelpCircle,
  Calculator,
  Shield,
  Zap,
  Users,
  BarChart3,
  Brain,
  Building2,
  Headphones,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compare Plans | EduNode Analytics',
  description: 'Detailed feature comparison across all EduNode Analytics plans.',
};

type FeatureValue = boolean | string | 'limited';

interface FeatureRow {
  name: string;
  tooltip?: string;
  starter: FeatureValue;
  professional: FeatureValue;
  enterprise: FeatureValue;
}

interface FeatureCategory {
  name: string;
  icon: React.ReactNode;
  features: FeatureRow[];
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    name: 'Core Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    features: [
      { name: 'School Dashboard', starter: true, professional: true, enterprise: true },
      { name: 'Student Roster Management', starter: true, professional: true, enterprise: true },
      { name: 'Attendance Tracking', starter: true, professional: true, enterprise: true },
      { name: 'Basic Mastery Trends', starter: true, professional: true, enterprise: true },
      { name: 'Student 360 Deep Dive', tooltip: 'Comprehensive view of individual student data', starter: false, professional: true, enterprise: true },
      { name: 'Momentum Dashboard', tooltip: '21-day cycle performance tracking', starter: false, professional: true, enterprise: true },
      { name: 'Impact Analyzer', tooltip: 'Measure intervention effectiveness', starter: false, professional: true, enterprise: true },
      { name: 'Cohort Comparison', starter: false, professional: true, enterprise: true },
      { name: 'Custom Dashboards', starter: false, professional: 'limited', enterprise: true },
    ],
  },
  {
    name: 'Compliance & Reporting',
    icon: <Shield className="w-5 h-5" />,
    features: [
      { name: 'Authorizer Portal', tooltip: 'Board-ready compliance dashboards', starter: true, professional: true, enterprise: true },
      { name: 'Standard Compliance Reports', starter: true, professional: true, enterprise: true },
      { name: 'FERPA Audit Trail', starter: true, professional: true, enterprise: true },
      { name: 'Custom Report Builder', starter: false, professional: true, enterprise: true },
      { name: 'Scheduled Reports', tooltip: 'Automatic email delivery', starter: false, professional: true, enterprise: true },
      { name: 'White-Label Reports', starter: false, professional: false, enterprise: true },
      { name: 'Board Packet Generation', starter: false, professional: true, enterprise: true },
    ],
  },
  {
    name: 'Early Warning & Interventions',
    icon: <Zap className="w-5 h-5" />,
    features: [
      { name: 'At-Risk Student Flags', starter: 'limited', professional: true, enterprise: true },
      { name: 'Early Warning System', starter: false, professional: true, enterprise: true },
      { name: 'MTSS Tier Tracking', starter: false, professional: true, enterprise: true },
      { name: 'Intervention Hub', tooltip: 'Central intervention management', starter: false, professional: true, enterprise: true },
      { name: 'Dosage Counter', tooltip: 'Track intervention minutes vs targets', starter: false, professional: true, enterprise: true },
      { name: 'Intervention Templates', starter: false, professional: '10 templates', enterprise: 'Unlimited' },
      { name: 'Progress Monitoring', starter: false, professional: true, enterprise: true },
    ],
  },
  {
    name: 'AI Features',
    icon: <Brain className="w-5 h-5" />,
    features: [
      { name: 'AI Qualitative Pulse', tooltip: 'Sentiment analysis of teacher notes', starter: false, professional: true, enterprise: true },
      { name: 'EduNode Advisor', tooltip: 'AI-powered intervention recommendations', starter: false, professional: true, enterprise: true },
      { name: 'Predictive Risk Scoring', starter: false, professional: true, enterprise: true },
      { name: 'Natural Language Queries', starter: false, professional: false, enterprise: true },
      { name: 'Custom AI Training', starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: 'Integrations',
    icon: <Zap className="w-5 h-5" />,
    features: [
      { name: 'Clever / ClassLink SSO', starter: true, professional: true, enterprise: true },
      { name: 'PowerSchool Integration', starter: true, professional: true, enterprise: true },
      { name: 'NWEA MAP Sync', starter: false, professional: true, enterprise: true },
      { name: 'i-Ready Integration', starter: false, professional: true, enterprise: true },
      { name: 'Renaissance STAR', starter: false, professional: true, enterprise: true },
      { name: 'Google Classroom', starter: false, professional: true, enterprise: true },
      { name: 'Custom API Access', starter: false, professional: false, enterprise: true },
      { name: 'Webhook Notifications', starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: 'Network & Multi-School',
    icon: <Building2 className="w-5 h-5" />,
    features: [
      { name: 'Single School View', starter: true, professional: true, enterprise: true },
      { name: 'Multi-School Dashboard', starter: false, professional: false, enterprise: true },
      { name: 'Network Benchmarking', starter: false, professional: false, enterprise: true },
      { name: 'Cross-School Reports', starter: false, professional: false, enterprise: true },
      { name: 'Centralized User Management', starter: false, professional: false, enterprise: true },
      { name: 'Custom Branding', starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: 'User Management',
    icon: <Users className="w-5 h-5" />,
    features: [
      { name: 'User Accounts', starter: '5 users', professional: '25 users', enterprise: 'Unlimited' },
      { name: 'Role-Based Access', starter: '3 roles', professional: '5 roles', enterprise: 'Custom roles' },
      { name: 'SSO (SAML/OAuth)', starter: false, professional: true, enterprise: true },
      { name: 'Two-Factor Authentication', starter: true, professional: true, enterprise: true },
      { name: 'IP Allowlisting', starter: false, professional: false, enterprise: true },
      { name: 'Session Management', starter: false, professional: true, enterprise: true },
    ],
  },
  {
    name: 'Support & Training',
    icon: <Headphones className="w-5 h-5" />,
    features: [
      { name: 'Email Support', starter: true, professional: true, enterprise: true },
      { name: 'Response Time SLA', starter: '48 hours', professional: '24 hours', enterprise: '4 hours' },
      { name: 'Knowledge Base', starter: true, professional: true, enterprise: true },
      { name: 'Video Tutorials', starter: true, professional: true, enterprise: true },
      { name: 'Live Training Webinars', starter: false, professional: 'Monthly', enterprise: 'On-demand' },
      { name: 'Dedicated Success Manager', starter: false, professional: false, enterprise: true },
      { name: 'On-Site Training', starter: false, professional: false, enterprise: true },
      { name: 'Priority Phone Support', starter: false, professional: false, enterprise: true },
    ],
  },
];

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
  }
  if (value === false) {
    return <X className="w-5 h-5 text-slate-300 mx-auto" />;
  }
  if (value === 'limited') {
    return <Minus className="w-5 h-5 text-amber-500 mx-auto" />;
  }
  return (
    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
      {value}
    </span>
  );
}

export default function ComparePlansPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Edu<span className="text-indigo-600">Node</span>
              </span>
            </Link>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/pricing" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Pricing
            </Link>
            <Link href="/roi-calculator" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              ROI Calculator
            </Link>
            <Link
              href="/demo"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Request Demo
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Compare Plans
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Detailed feature comparison to help you choose the right plan for your school.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/roi-calculator"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
            >
              <Calculator className="w-4 h-4" />
              Calculate your ROI
            </Link>
          </div>
        </div>

        {/* Pricing Header */}
        <div className="sticky top-16 z-40 bg-slate-50 dark:bg-slate-950 pb-4">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-4">
              <div className="p-6 bg-slate-100 dark:bg-slate-800 flex items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Compare Features
                </span>
              </div>

              {/* Starter */}
              <div className="p-6 text-center border-l border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Starter</h3>
                <p className="text-sm text-indigo-600">Compliance Focus</p>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">$4,500</span>
                  <span className="text-slate-500 text-sm">/year</span>
                </div>
                <Link
                  href="/checkout?tier=starter&period=annual"
                  className="mt-4 block w-full py-2 px-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-300 transition-colors"
                >
                  Start Trial
                </Link>
              </div>

              {/* Professional */}
              <div className="p-6 text-center border-l border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20">
                <div className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-full mb-2">
                  Most Popular
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Professional</h3>
                <p className="text-sm text-indigo-600">Operational Excellence</p>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">$7,500</span>
                  <span className="text-slate-500 text-sm">/yr + $5/student</span>
                </div>
                <Link
                  href="/checkout?tier=pro&period=annual"
                  className="mt-4 block w-full py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Start Trial
                </Link>
              </div>

              {/* Enterprise */}
              <div className="p-6 text-center border-l border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Enterprise</h3>
                <p className="text-sm text-indigo-600">Network Strategy</p>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">Custom</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Starting at $25,000/year</p>
                <Link
                  href="/contact"
                  className="mt-4 block w-full py-2 px-4 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <div className="space-y-6 mt-6">
          {FEATURE_CATEGORIES.map((category) => (
            <Card key={category.name} className="overflow-hidden">
              {/* Category Header */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  {category.icon}
                </div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  {category.name}
                </h2>
              </div>

              {/* Features */}
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {category.features.map((feature, i) => (
                  <div
                    key={feature.name}
                    className={`grid grid-cols-4 ${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900/50'}`}
                  >
                    <div className="p-4 flex items-center gap-2">
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {feature.name}
                      </span>
                      {feature.tooltip && (
                        <span className="group relative cursor-help">
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            {feature.tooltip}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="p-4 text-center border-l border-slate-200 dark:border-slate-700">
                      <FeatureCell value={feature.starter} />
                    </div>
                    <div className="p-4 text-center border-l border-slate-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/10">
                      <FeatureCell value={feature.professional} />
                    </div>
                    <div className="p-4 text-center border-l border-slate-200 dark:border-slate-700">
                      <FeatureCell value={feature.enterprise} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="mt-12 p-8 bg-gradient-to-br from-indigo-600 to-indigo-700 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Not sure which plan is right for you?
          </h2>
          <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
            Book a personalized demo and our team will help you find the perfect fit for your school&apos;s needs.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              Schedule Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-400 transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </Card>

        {/* FAQ Link */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Have questions? Check our{' '}
            <Link href="/faq" className="text-indigo-600 hover:underline">
              FAQ
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-indigo-600 hover:underline">
              contact support
            </Link>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} EduNode Analytics
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-indigo-600">Privacy</Link>
            <Link href="/terms" className="hover:text-indigo-600">Terms</Link>
            <Link href="/security" className="hover:text-indigo-600">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
