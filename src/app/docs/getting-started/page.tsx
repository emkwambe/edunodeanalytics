import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { DocsLayout, DocsBreadcrumb, CodeBlock } from '@/components/layout/docs-layout';
import {
  CheckCircle,
  Circle,
  ArrowRight,
  Clock,
  Users,
  Zap,
  BarChart3,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Getting Started | EduNode Documentation',
  description: 'Get up and running with EduNode Analytics in under 15 minutes.',
};

const STEPS = [
  {
    number: 1,
    title: 'Create Your Account',
    description: 'Sign up with your school email and verify your account.',
    time: '2 min',
    details: [
      'Visit app.edunode.com/sign-up',
      'Enter your school email address',
      'Create a secure password',
      'Verify your email via the confirmation link',
    ],
  },
  {
    number: 2,
    title: 'Set Up Your School',
    description: 'Configure your school profile and basic settings.',
    time: '3 min',
    details: [
      'Enter your school name and location',
      'Upload your school logo (optional)',
      'Set your academic calendar (start/end dates)',
      'Configure grade levels served',
    ],
  },
  {
    number: 3,
    title: 'Connect Your Data',
    description: 'Link your SIS to automatically sync student rosters.',
    time: '5 min',
    details: [
      'Navigate to Settings > Data Sources',
      'Select your SIS provider (Clever, ClassLink, PowerSchool, etc.)',
      'Authorize the connection via OAuth',
      'Map fields if needed (usually automatic)',
      'Trigger initial sync',
    ],
  },
  {
    number: 4,
    title: 'Invite Your Team',
    description: 'Add teachers and staff with appropriate access levels.',
    time: '3 min',
    details: [
      'Go to Settings > Team',
      'Click "Invite Users"',
      'Enter email addresses and assign roles',
      'Users receive invitation emails automatically',
    ],
  },
  {
    number: 5,
    title: 'Explore Your Dashboard',
    description: 'See your data come to life with actionable insights.',
    time: '2 min',
    details: [
      'View school-wide metrics on the main dashboard',
      'Drill into student details via the Students tab',
      'Check the Early Warning System for at-risk students',
      'Explore intervention tracking features',
    ],
  },
];

const NEXT_STEPS = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Connect Assessment Data',
    description: 'Link NWEA, i-Ready, or Renaissance for growth metrics.',
    href: '/docs/integrations',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Set Up Interventions',
    description: 'Configure your MTSS tiers and intervention workflows.',
    href: '/docs/interventions',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Create Custom Reports',
    description: 'Build reports tailored to your school\'s needs.',
    href: '/docs/reports',
  },
];

export default function GettingStartedPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl">
        <DocsBreadcrumb items={[{ label: 'Getting Started' }]} />

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-medium">
              <Clock className="w-4 h-4" />
              ~15 minutes
            </span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Getting Started with EduNode
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            This guide will walk you through setting up EduNode for your school.
            By the end, you&apos;ll have your data connected and your team ready to go.
          </p>
        </div>

        {/* Prerequisites */}
        <Card className="p-6 mb-10 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <h2 className="font-semibold text-amber-800 dark:text-amber-400 mb-3">
            Before You Begin
          </h2>
          <ul className="space-y-2 text-amber-700 dark:text-amber-300 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Admin access to your Student Information System (SIS)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              List of staff members who need access
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Your school&apos;s academic calendar dates
            </li>
          </ul>
        </Card>

        {/* Steps */}
        <div className="space-y-8 mb-12">
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
              )}

              <div className="flex gap-6">
                {/* Step number */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg relative z-10">
                  {step.number}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h2>
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {step.time}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {step.description}
                  </p>
                  <Card className="p-4">
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Circle className="w-2 h-2 mt-1.5 text-indigo-500 flex-shrink-0 fill-current" />
                          <span className="text-slate-700 dark:text-slate-300">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Success Message */}
        <Card className="p-6 mb-10 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-1">
                Congratulations!
              </h3>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                You&apos;ve completed the initial setup. Your roster data will sync within
                a few minutes, and you&apos;ll start seeing insights on your dashboard.
              </p>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Next Steps
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {NEXT_STEPS.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="p-5 h-full hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 w-fit mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                    {item.title}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Help */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-slate-600 dark:text-slate-400">
            Need help? <Link href="/contact" className="text-indigo-600 hover:underline">Contact our support team</Link> or
            check out our <Link href="/faq" className="text-indigo-600 hover:underline">FAQ</Link>.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
