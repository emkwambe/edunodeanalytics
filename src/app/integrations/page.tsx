import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  Zap,
  RefreshCw,
  Shield,
  Clock,
  Users,
  Database,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Integration {
  name: string;
  category: 'sis' | 'lms' | 'assessment' | 'rostering' | 'behavior';
  description: string;
  logo: string;
  features: string[];
  popular?: boolean;
}

const INTEGRATIONS: Integration[] = [
  // Student Information Systems
  {
    name: 'PowerSchool',
    category: 'sis',
    description: 'Automatic roster sync, demographics, attendance, and grade data.',
    logo: '/integrations/powerschool.svg',
    features: ['Real-time roster sync', 'Attendance data', 'Demographics', 'Historical grades'],
    popular: true,
  },
  {
    name: 'Infinite Campus',
    category: 'sis',
    description: 'Full student data integration including enrollment, scheduling, and transcripts.',
    logo: '/integrations/infinite-campus.svg',
    features: ['Student enrollment', 'Course scheduling', 'Grade history', 'Special programs'],
    popular: true,
  },
  {
    name: 'Skyward',
    category: 'sis',
    description: 'Comprehensive student management data sync for K-12 schools.',
    logo: '/integrations/skyward.svg',
    features: ['Student profiles', 'Attendance tracking', 'Parent contacts', 'Course data'],
  },
  {
    name: 'Aeries',
    category: 'sis',
    description: 'California-focused SIS integration with state reporting support.',
    logo: '/integrations/aeries.svg',
    features: ['CA state reporting', 'Attendance', 'Demographics', 'Grades'],
  },
  {
    name: 'Focus School Software',
    category: 'sis',
    description: 'Florida-based SIS with comprehensive data syncing capabilities.',
    logo: '/integrations/focus.svg',
    features: ['Student data', 'Attendance', 'Grades', 'FL state reports'],
  },

  // Rostering
  {
    name: 'Clever',
    category: 'rostering',
    description: 'Instant SSO and automatic roster provisioning from your SIS.',
    logo: '/integrations/clever.svg',
    features: ['Single Sign-On', 'Auto-provisioning', 'Roster sync', 'Section data'],
    popular: true,
  },
  {
    name: 'ClassLink',
    category: 'rostering',
    description: 'OneRoster-compliant rostering with LaunchPad SSO integration.',
    logo: '/integrations/classlink.svg',
    features: ['OneRoster API', 'SSO via LaunchPad', 'Real-time sync', 'Custom attributes'],
    popular: true,
  },

  // Assessment
  {
    name: 'NWEA MAP',
    category: 'assessment',
    description: 'Import MAP Growth scores and RIT bands for growth tracking.',
    logo: '/integrations/nwea.svg',
    features: ['RIT scores', 'Growth percentiles', 'Norms data', 'Goal setting'],
    popular: true,
  },
  {
    name: 'Renaissance Star',
    category: 'assessment',
    description: 'Star Reading and Math assessment data with benchmark tracking.',
    logo: '/integrations/renaissance.svg',
    features: ['Star scores', 'Benchmarks', 'Growth metrics', 'Skill mastery'],
    popular: true,
  },
  {
    name: 'iReady',
    category: 'assessment',
    description: 'Curriculum Associates diagnostic and growth monitoring data.',
    logo: '/integrations/iready.svg',
    features: ['Diagnostic scores', 'Growth tracking', 'Domain mastery', 'Placement levels'],
    popular: true,
  },
  {
    name: 'Illuminate Education',
    category: 'assessment',
    description: 'Local assessment data and item-level analysis.',
    logo: '/integrations/illuminate.svg',
    features: ['Assessment results', 'Item analysis', 'Standards mastery', 'Custom assessments'],
  },
  {
    name: 'MasteryConnect',
    category: 'assessment',
    description: 'Formative assessment and standards-based grading data.',
    logo: '/integrations/masteryconnect.svg',
    features: ['Formative data', 'Standards alignment', 'Mastery tracking', 'Item banks'],
  },

  // LMS
  {
    name: 'Canvas',
    category: 'lms',
    description: 'Assignment completion, grades, and engagement data from Canvas LMS.',
    logo: '/integrations/canvas.svg',
    features: ['Assignment grades', 'Completion rates', 'Engagement metrics', 'Course analytics'],
    popular: true,
  },
  {
    name: 'Google Classroom',
    category: 'lms',
    description: 'Sync classes, assignments, and student work completion.',
    logo: '/integrations/google-classroom.svg',
    features: ['Class rosters', 'Assignment data', 'Submission status', 'Grade passback'],
    popular: true,
  },
  {
    name: 'Schoology',
    category: 'lms',
    description: 'Full learning management system integration with analytics.',
    logo: '/integrations/schoology.svg',
    features: ['Course data', 'Grades', 'Completion tracking', 'Usage analytics'],
  },

  // Behavior
  {
    name: 'PBIS Rewards',
    category: 'behavior',
    description: 'Track positive behavior interventions and student recognition.',
    logo: '/integrations/pbis.svg',
    features: ['Point tracking', 'Behavior events', 'Recognition data', 'Tier monitoring'],
  },
  {
    name: 'Kickboard',
    category: 'behavior',
    description: 'Culture and behavior management data for MTSS integration.',
    logo: '/integrations/kickboard.svg',
    features: ['Behavior logs', 'SEL data', 'Culture metrics', 'MTSS tiers'],
  },
  {
    name: 'DeansList',
    category: 'behavior',
    description: 'Comprehensive behavior tracking and family communication data.',
    logo: '/integrations/deanslist.svg',
    features: ['Incident tracking', 'Merits/demerits', 'Family contacts', 'Intervention logs'],
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Integrations' },
  { id: 'sis', name: 'Student Information Systems' },
  { id: 'rostering', name: 'Rostering & SSO' },
  { id: 'assessment', name: 'Assessments' },
  { id: 'lms', name: 'Learning Management' },
  { id: 'behavior', name: 'Behavior & SEL' },
];

const VALUE_PROPS = [
  {
    icon: Zap,
    title: 'Set Up in Minutes',
    description: 'Most integrations connect in under 5 minutes with OAuth or API key.',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Sync',
    description: 'Data syncs automatically every hour. No manual uploads needed.',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description: 'All connections use encrypted channels. No student data stored unnecessarily.',
  },
  {
    icon: Clock,
    title: 'Historical Import',
    description: 'Import historical data to see trends from day one.',
  },
];

export default function IntegrationsPage() {
  const popularIntegrations = INTEGRATIONS.filter((i) => i.popular);

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
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/security" className="text-sm text-slate-600 hover:text-slate-900">
                Security
              </Link>
              <Link href="/case-studies" className="text-sm text-slate-600 hover:text-slate-900">
                Case Studies
              </Link>
              <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900">
                Pricing
              </Link>
            </nav>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <Database className="w-4 h-4" />
              20+ Native Integrations
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              Connect Your Existing
              <span className="block text-blue-600">EdTech Stack</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              EduNode integrates with the SIS, LMS, and assessment tools you already use.
              No manual data entry. No CSV uploads. Just connect and go.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                Request an Integration
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUE_PROPS.map((prop) => (
              <div key={prop.title} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <prop.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{prop.title}</h3>
                  <p className="text-sm text-slate-600">{prop.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Integrations */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Most Popular Integrations
            </h2>
            <p className="text-slate-600">
              The tools charter schools use most, connected out of the box.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularIntegrations.map((integration) => (
              <div
                key={integration.name}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-slate-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {CATEGORIES.find((c) => c.id === integration.category)?.name.split(' ')[0]}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{integration.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{integration.description}</p>
                <ul className="space-y-1.5">
                  {integration.features.slice(0, 3).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Integrations by Category */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              All Integrations
            </h2>
            <p className="text-slate-600">
              Browse our complete integration catalog by category.
            </p>
          </div>

          {CATEGORIES.filter((c) => c.id !== 'all').map((category) => {
            const categoryIntegrations = INTEGRATIONS.filter((i) => i.category === category.id);
            if (categoryIntegrations.length === 0) return null;

            return (
              <div key={category.id} className="mb-12 last:mb-0">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">{category.name}</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryIntegrations.map((integration) => (
                    <div
                      key={integration.name}
                      className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Database className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{integration.name}</h4>
                          <p className="text-xs text-slate-500">
                            {integration.features.length} data points
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom Integration */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-2xl p-8 sm:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Don&apos;t see your tool?
                </h2>
                <p className="text-slate-300 mb-6">
                  We&apos;re constantly adding new integrations. Enterprise customers get priority
                  access to custom integrations built for their specific needs.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Custom API integrations
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    SFTP/CSV automated imports
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    State reporting system connections
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Dedicated integration support
                  </li>
                </ul>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition"
                >
                  Request Integration
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="hidden lg:block">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="text-sm text-slate-400 mb-4">Available on Enterprise</div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <Database className="w-6 h-6 text-blue-400" />
                      <div>
                        <div className="font-medium text-white">Custom API</div>
                        <div className="text-xs text-slate-400">Your proprietary systems</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <RefreshCw className="w-6 h-6 text-green-400" />
                      <div>
                        <div className="font-medium text-white">SFTP Sync</div>
                        <div className="text-xs text-slate-400">Automated file transfers</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <Shield className="w-6 h-6 text-purple-400" />
                      <div>
                        <div className="font-medium text-white">State Systems</div>
                        <div className="text-xs text-slate-400">Direct reporting connections</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to connect your data?
          </h2>
          <p className="text-blue-100 mb-8">
            Start your free trial and connect your first integration in minutes.
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
