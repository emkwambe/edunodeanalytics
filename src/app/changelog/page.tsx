import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  Bug,
  Wrench,
  Shield,
  Zap,
  Users,
  BarChart3,
  Bell,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Changelog | EduNode Analytics',
  description: 'See what\'s new in EduNode Analytics - features, improvements, and fixes.',
};

type ChangeType = 'feature' | 'improvement' | 'fix' | 'security';

interface ChangeItem {
  type: ChangeType;
  title: string;
  description: string;
}

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: ChangeItem[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.4.0',
    date: 'March 1, 2026',
    title: 'Strategic Data Blueprint & Enhanced Analytics',
    changes: [
      {
        type: 'feature',
        title: 'Strategic Data Blueprint',
        description: 'New interactive visualization of our data taxonomy with maturity model radar charts.',
      },
      {
        type: 'feature',
        title: 'AI Advisor Enhancements',
        description: 'Improved intervention recommendations with confidence scores and evidence citations.',
      },
      {
        type: 'improvement',
        title: 'Dashboard Performance',
        description: '40% faster initial load time through optimized data fetching and caching.',
      },
      {
        type: 'fix',
        title: 'Export Date Formatting',
        description: 'Fixed issue where CSV exports showed incorrect date formats in some locales.',
      },
    ],
  },
  {
    version: '2.3.0',
    date: 'February 15, 2026',
    title: 'Notification Center & Scheduled Reports',
    changes: [
      {
        type: 'feature',
        title: 'Notification Center',
        description: 'New centralized notification hub with filtering, bulk actions, and priority levels.',
      },
      {
        type: 'feature',
        title: 'Scheduled Reports',
        description: 'Automatically generate and email reports on daily, weekly, or monthly schedules.',
      },
      {
        type: 'improvement',
        title: 'Student 360 View',
        description: 'Added intervention history timeline and academic trajectory visualizations.',
      },
      {
        type: 'security',
        title: 'Session Management',
        description: 'Enhanced session timeout controls and concurrent session detection.',
      },
    ],
  },
  {
    version: '2.2.0',
    date: 'January 28, 2026',
    title: 'Renaissance STAR Integration',
    changes: [
      {
        type: 'feature',
        title: 'Renaissance STAR Integration',
        description: 'Sync STAR Reading and Math assessment data for comprehensive growth tracking.',
      },
      {
        type: 'feature',
        title: 'Cohort Comparison Tool',
        description: 'Compare performance across grade levels, teachers, or custom cohorts.',
      },
      {
        type: 'improvement',
        title: 'Mobile Responsiveness',
        description: 'Improved tablet and mobile experience for on-the-go data access.',
      },
      {
        type: 'fix',
        title: 'Attendance Calculation',
        description: 'Corrected chronic absenteeism calculation for mid-year enrollees.',
      },
    ],
  },
  {
    version: '2.1.0',
    date: 'January 10, 2026',
    title: 'White-Label & Network View',
    changes: [
      {
        type: 'feature',
        title: 'White-Label Branding',
        description: 'Custom logos and brand colors for Professional and Enterprise customers.',
      },
      {
        type: 'feature',
        title: 'Network View (Enterprise)',
        description: 'Unified dashboard for CMOs to monitor all schools in their network.',
      },
      {
        type: 'improvement',
        title: 'Intervention Hub Workflow',
        description: 'Streamlined MTSS tier assignment with bulk actions and templates.',
      },
      {
        type: 'security',
        title: 'SOC 2 Type II Certification',
        description: 'Completed annual SOC 2 Type II audit with zero findings.',
      },
    ],
  },
  {
    version: '2.0.0',
    date: 'December 1, 2025',
    title: 'EduNode 2.0 - The Intelligence Update',
    changes: [
      {
        type: 'feature',
        title: 'AI Qualitative Pulse',
        description: 'Gemini-powered sentiment analysis of MTSS logs and teacher notes.',
      },
      {
        type: 'feature',
        title: 'Impact Analyzer',
        description: 'Measure intervention effectiveness with quasi-experimental analysis.',
      },
      {
        type: 'feature',
        title: 'Early Warning System 2.0',
        description: 'Redesigned risk scoring with configurable weights and thresholds.',
      },
      {
        type: 'improvement',
        title: 'Complete UI Refresh',
        description: 'Modern design system with improved accessibility and dark mode.',
      },
    ],
  },
  {
    version: '1.9.0',
    date: 'November 15, 2025',
    title: 'Google Classroom & i-Ready Integration',
    changes: [
      {
        type: 'feature',
        title: 'Google Classroom Integration',
        description: 'Sync rosters and assignment data from Google Classroom.',
      },
      {
        type: 'feature',
        title: 'i-Ready Integration',
        description: 'Import diagnostic and growth data from Curriculum Associates i-Ready.',
      },
      {
        type: 'improvement',
        title: 'Data Source Management',
        description: 'New UI for managing and troubleshooting data integrations.',
      },
    ],
  },
];

const TYPE_CONFIG: Record<ChangeType, { icon: React.ReactNode; label: string; color: string }> = {
  feature: {
    icon: <Sparkles className="w-4 h-4" />,
    label: 'New',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  improvement: {
    icon: <Zap className="w-4 h-4" />,
    label: 'Improved',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  fix: {
    icon: <Bug className="w-4 h-4" />,
    label: 'Fixed',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  security: {
    icon: <Shield className="w-4 h-4" />,
    label: 'Security',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
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
            <Link href="/docs" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Docs
            </Link>
            <Link href="/status" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Status
            </Link>
            <Link
              href="/sign-in"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Changelog
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            New features, improvements, and fixes in EduNode Analytics.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="#"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline"
            >
              <Bell className="w-4 h-4" />
              Subscribe to updates
            </Link>
          </div>
        </div>

        {/* Changelog Entries */}
        <div className="space-y-12">
          {CHANGELOG.map((entry) => (
            <article key={entry.version} id={`v${entry.version}`}>
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {entry.title}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Version {entry.version}
                      </p>
                    </div>
                    <time className="text-sm text-slate-500 font-medium">
                      {entry.date}
                    </time>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {entry.changes.map((change, i) => {
                    const config = TYPE_CONFIG[change.type];
                    return (
                      <div key={i} className="flex gap-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold h-fit ${config.color}`}>
                          {config.icon}
                          {config.label}
                        </span>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {change.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {change.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </article>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Looking for older releases?{' '}
            <Link href="/contact" className="text-indigo-600 hover:underline">
              Contact us
            </Link>{' '}
            for the full release history.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} EduNode Analytics
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-indigo-600">Privacy</Link>
            <Link href="/terms" className="hover:text-indigo-600">Terms</Link>
            <Link href="/docs" className="hover:text-indigo-600">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
