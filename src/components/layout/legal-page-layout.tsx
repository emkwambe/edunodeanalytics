'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LegalPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  lastUpdated: string;
}

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/ferpa', label: 'FERPA Compliance' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/accessibility', label: 'Accessibility' },
];

export function LegalPageLayout({
  children,
  title,
  description,
  lastUpdated,
}: LegalPageLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
              E
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Edu<span className="text-indigo-600">Node</span>
            </span>
          </Link>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
              Pricing
            </Link>
            <Link href="/security" className="hover:text-indigo-600 transition-colors">
              Security
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

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Legal
              </h3>
              <nav className="space-y-1">
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      pathname === link.href
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">
                  Questions about our policies?
                </p>
                <Link
                  href="/contact"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <article className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 md:p-12">
              <header className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                  {title}
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
                  {description}
                </p>
                <p className="text-sm text-slate-500">
                  Last updated: {lastUpdated}
                </p>
              </header>

              <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-li:text-slate-600 dark:prose-li:text-slate-400 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">
                {children}
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} EduNode Analytics. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LegalPageLayout;
