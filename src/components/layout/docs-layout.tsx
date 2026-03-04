'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Rocket,
  Code,
  History,
  Activity,
  Settings,
  Database,
  Shield,
  Zap,
  Users,
  ChevronRight,
} from 'lucide-react';

interface DocsLayoutProps {
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  items: {
    href: string;
    label: string;
    icon: React.ReactNode;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs', label: 'Introduction', icon: <BookOpen className="w-4 h-4" /> },
      { href: '/docs/getting-started', label: 'Quick Start', icon: <Rocket className="w-4 h-4" /> },
      { href: '/docs/integrations', label: 'Integrations', icon: <Zap className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Platform',
    items: [
      { href: '/docs/dashboard', label: 'Dashboard', icon: <Activity className="w-4 h-4" /> },
      { href: '/docs/students', label: 'Student Data', icon: <Users className="w-4 h-4" /> },
      { href: '/docs/interventions', label: 'Interventions', icon: <Settings className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Developers',
    items: [
      { href: '/docs/api', label: 'API Reference', icon: <Code className="w-4 h-4" /> },
      { href: '/docs/webhooks', label: 'Webhooks', icon: <Database className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Resources',
    items: [
      { href: '/changelog', label: 'Changelog', icon: <History className="w-4 h-4" /> },
      { href: '/status', label: 'System Status', icon: <Activity className="w-4 h-4" /> },
      { href: '/docs/security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    ],
  },
];

export function DocsLayout({ children }: DocsLayoutProps) {
  const pathname = usePathname();

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
            <div className="hidden md:flex items-center gap-1 text-sm">
              <span className="text-slate-400">/</span>
              <Link href="/docs" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
                Documentation
              </Link>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/docs/api" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              API
            </Link>
            <Link href="/changelog" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600">
              Changelog
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

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <nav className="sticky top-24 space-y-8">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} EduNode Analytics. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-indigo-600">Privacy</Link>
            <Link href="/terms" className="hover:text-indigo-600">Terms</Link>
            <Link href="/contact" className="hover:text-indigo-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Breadcrumb component for docs pages
export function DocsBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
      <Link href="/docs" className="hover:text-indigo-600">Docs</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          {item.href ? (
            <Link href={item.href} className="hover:text-indigo-600">{item.label}</Link>
          ) : (
            <span className="text-slate-900 dark:text-white font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// Code block component
export function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <div className="relative rounded-lg bg-slate-900 dark:bg-slate-800 overflow-hidden my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
        <span className="text-xs text-slate-400">{language}</span>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-slate-300">{code}</code>
      </pre>
    </div>
  );
}

export default DocsLayout;
