import { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  HelpCircle,
  Search,
  BookOpen,
  Video,
  MessageCircle,
  Mail,
  Phone,
  Zap,
  Users,
  BarChart3,
  Shield,
  Database,
  Settings,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Help Center | EduNode Analytics',
  description: 'Get help with EduNode Analytics - guides, tutorials, and support resources.',
};

interface HelpCategory {
  icon: React.ReactNode;
  title: string;
  description: string;
  articles: number;
  href: string;
}

interface PopularArticle {
  title: string;
  category: string;
  href: string;
}

const HELP_CATEGORIES: HelpCategory[] = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Getting Started',
    description: 'Set up your account, connect data sources, and invite your team.',
    articles: 12,
    href: '/help/getting-started',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Student Management',
    description: 'View student profiles, track progress, and manage rosters.',
    articles: 18,
    href: '/help/students',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Analytics & Reports',
    description: 'Understand dashboards, create reports, and export data.',
    articles: 15,
    href: '/help/analytics',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Interventions & MTSS',
    description: 'Set up intervention plans, track progress, and manage tiers.',
    articles: 22,
    href: '/help/interventions',
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: 'Data & Integrations',
    description: 'Connect your SIS, import data, and troubleshoot sync issues.',
    articles: 14,
    href: '/help/integrations',
  },
  {
    icon: <Settings className="w-6 h-6" />,
    title: 'Account & Settings',
    description: 'Manage users, roles, billing, and school settings.',
    articles: 10,
    href: '/help/settings',
  },
];

const POPULAR_ARTICLES: PopularArticle[] = [
  { title: 'How to connect your SIS via Clever', category: 'Integrations', href: '/help/integrations/clever-setup' },
  { title: 'Understanding the Early Warning System', category: 'Analytics', href: '/help/analytics/early-warning' },
  { title: 'Creating and assigning intervention plans', category: 'Interventions', href: '/help/interventions/create-plan' },
  { title: 'Inviting team members and setting roles', category: 'Settings', href: '/help/settings/invite-users' },
  { title: 'Exporting student data to CSV', category: 'Students', href: '/help/students/export-data' },
  { title: 'Setting up automated reports', category: 'Analytics', href: '/help/analytics/scheduled-reports' },
];

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Edu<span className="text-indigo-600">Node</span>
              </span>
            </Link>
            <span className="text-slate-400">Help Center</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/docs" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Docs
            </Link>
            <Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero with Search */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-700 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            How can we help you?
          </h1>
          <p className="text-indigo-100 mb-8">
            Search our knowledge base or browse categories below.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for articles, guides, tutorials..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 bg-white shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300"
            />
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Categories Grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Browse by Category
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HELP_CATEGORIES.map((category) => (
              <Link key={category.href} href={category.href}>
                <Card className="p-6 h-full hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
                  <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 w-fit mb-4">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {category.description}
                  </p>
                  <span className="text-xs text-slate-500">
                    {category.articles} articles
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Articles */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Popular Articles
          </h2>
          <Card className="divide-y divide-slate-200 dark:divide-slate-700">
            {POPULAR_ARTICLES.map((article, i) => (
              <Link
                key={i}
                href={article.href}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <BookOpen className="w-5 h-5 text-slate-400" />
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-slate-500">{article.category}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </Link>
            ))}
          </Card>
        </section>

        {/* Resources */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Additional Resources
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6">
              <Video className="w-8 h-8 text-indigo-500 mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Video Tutorials
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Watch step-by-step guides on common tasks and features.
              </p>
              <Link
                href="/help/videos"
                className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
              >
                Watch Videos
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Card>

            <Card className="p-6">
              <BookOpen className="w-8 h-8 text-indigo-500 mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                API Documentation
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Build custom integrations with our REST API.
              </p>
              <Link
                href="/docs/api"
                className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
              >
                View API Docs
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Card>

            <Card className="p-6">
              <MessageCircle className="w-8 h-8 text-indigo-500 mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Community Forum
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Connect with other educators using EduNode.
              </p>
              <Link
                href="/community"
                className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
              >
                Join Community
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Card>
          </div>
        </section>

        {/* Contact Support */}
        <section>
          <Card className="p-8 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <HelpCircle className="w-10 h-10 text-indigo-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Still Need Help?
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Our support team is here to help. Reach out through any of these channels.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Average response time: <strong>under 4 hours</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Live chat available 8am-8pm EST
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Enterprise customers: 24/7 priority support
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Link
                  href="/contact"
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
                >
                  <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      Email Support
                    </h3>
                    <p className="text-sm text-slate-500">support@edunode.com</p>
                  </div>
                </Link>

                <button className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group text-left">
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      Live Chat
                    </h3>
                    <p className="text-sm text-slate-500">Talk to us now</p>
                  </div>
                </button>

                <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Phone Support
                    </h3>
                    <p className="text-sm text-slate-500">Enterprise only: 1-800-EDU-NODE</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} EduNode Analytics
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/status" className="hover:text-indigo-600">System Status</Link>
            <Link href="/feedback" className="hover:text-indigo-600">Send Feedback</Link>
            <Link href="/privacy" className="hover:text-indigo-600">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
