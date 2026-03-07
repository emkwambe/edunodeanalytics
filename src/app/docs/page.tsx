import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { DocsLayout } from '@/components/layout/docs-layout';
import {
  Rocket,
  Code,
  Zap,
  Users,
  Shield,
  BarChart3,
  Settings,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Documentation | EduNode Analytics',
  description: 'Learn how to use EduNode Analytics - guides, API reference, and best practices.',
};

const QUICK_LINKS = [
  {
    icon: <Rocket className="w-6 h-6" />,
    title: 'Quick Start',
    description: 'Get up and running with EduNode in under 15 minutes.',
    href: '/docs/getting-started',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Integrations',
    description: 'Connect your SIS, LMS, and assessment platforms.',
    href: '/docs/integrations',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    icon: <Code className="w-6 h-6" />,
    title: 'API Reference',
    description: 'Build custom integrations with our REST API.',
    href: '/docs/api',
    color: 'bg-indigo-500/10 text-indigo-600',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Security',
    description: 'Learn about our security practices and compliance.',
    href: '/docs/security',
    color: 'bg-rose-500/10 text-rose-600',
  },
];

const GUIDES = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Dashboard Overview',
    description: 'Understanding your school metrics at a glance.',
    href: '/docs/dashboard',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Student Data Management',
    description: 'Working with student records and rosters.',
    href: '/docs/students',
  },
  {
    icon: <Settings className="w-5 h-5" />,
    title: 'Intervention Tracking',
    description: 'Setting up and managing MTSS/RTI workflows.',
    href: '/docs/interventions',
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: 'Reports & Analytics',
    description: 'Creating and scheduling custom reports.',
    href: '/docs/reports',
  },
];

export default function DocsPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            EduNode Documentation
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Everything you need to get the most out of EduNode Analytics.
            From initial setup to advanced API integrations.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="p-6 h-full hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
                <div className={`p-3 rounded-lg ${link.color} w-fit mb-4`}>
                  {link.icon}
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                  {link.title}
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {link.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>

        {/* Popular Guides */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Popular Guides
          </h2>
          <div className="space-y-3">
            {GUIDES.map((guide) => (
              <Link key={guide.href} href={guide.href}>
                <Card className="p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {guide.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {guide.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Help Section */}
        <section>
          <Card className="p-8 bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-900/20 dark:to-emerald-900/20 border-indigo-200 dark:border-indigo-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Need Help?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                Browse FAQ
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </DocsLayout>
  );
}
