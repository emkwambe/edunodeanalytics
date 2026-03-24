'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Search,
  X,
  Users,
  FileText,
  BarChart3,
  Settings,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { SCHOOL_SEEDS, StudentSeedData } from '@/lib/data/seed-data';

interface SearchResult {
  type: 'student' | 'page' | 'resource';
  title: string;
  subtitle: string;
  href: string;
  icon: React.ElementType;
}

interface GlobalSearchProps {
  schoolSlug: string;
}

/**
 * Global Search - Cmd+K searchable dialog for students, pages, and resources
 */
export function GlobalSearch({ schoolSlug }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opening
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Build searchable items
  const allResults = React.useMemo(() => {
    const results: SearchResult[] = [];

    // Pages
    const pages = [
      { title: 'Dashboard Overview', subtitle: 'School health at a glance', href: `/${schoolSlug}/dashboard`, icon: BarChart3 },
      { title: 'Instructional Pulse', subtitle: 'AI-powered formative analysis', href: `/${schoolSlug}/dashboard/pulse`, icon: BarChart3 },
      { title: 'Momentum Dashboard', subtitle: '21-day diagnostic cycle', href: `/${schoolSlug}/dashboard/momentum`, icon: BarChart3 },
      { title: 'Student 360', subtitle: 'Student roster and profiles', href: `/${schoolSlug}/dashboard/students`, icon: Users },
      { title: 'MTSS Interventions', subtitle: 'Tier 2/3 intervention tracking', href: `/${schoolSlug}/interventions`, icon: BarChart3 },
      { title: 'Impact Analyzer', subtitle: 'Measure intervention effectiveness', href: `/${schoolSlug}/analytics/impact`, icon: BarChart3 },
      { title: 'Advanced Analytics', subtitle: 'Cohort analysis and forecasting', href: `/${schoolSlug}/analytics/advanced`, icon: BarChart3 },
      { title: 'Attendance', subtitle: 'Chronic absenteeism monitoring', href: `/${schoolSlug}/dashboard/attendance`, icon: BarChart3 },
      { title: 'Assessments', subtitle: 'Mastery trends and benchmarks', href: `/${schoolSlug}/dashboard/assessments`, icon: BarChart3 },
      { title: 'Authorizer Portal', subtitle: 'Board-ready compliance reports', href: `/${schoolSlug}/authorizer`, icon: FileText },
      { title: 'Reports', subtitle: 'Generate and export reports', href: `/${schoolSlug}/dashboard/reports`, icon: FileText },
      { title: 'Network View', subtitle: 'Cross-school analytics', href: `/${schoolSlug}/network`, icon: BarChart3 },
      { title: 'Resource Center', subtitle: 'Data strategy guides and tools', href: `/${schoolSlug}/resources`, icon: BookOpen },
      { title: 'Settings', subtitle: 'School configuration', href: `/${schoolSlug}/settings`, icon: Settings },
      { title: 'Integrations', subtitle: 'Connect data sources', href: `/${schoolSlug}/settings/integrations`, icon: Settings },
      { title: 'Billing', subtitle: 'Subscription and payments', href: `/${schoolSlug}/settings/billing`, icon: Settings },
    ];

    pages.forEach((p) => {
      results.push({ type: 'page', ...p });
    });

    // Students
    const schoolData = SCHOOL_SEEDS[schoolSlug];
    if (schoolData?.students) {
      schoolData.students.forEach((student: StudentSeedData) => {
        results.push({
          type: 'student',
          title: student.displayName,
          subtitle: `Grade ${student.gradeLevel} · ${student.riskLevel} risk`,
          href: `/${schoolSlug}/dashboard/students/${student.id}`,
          icon: Users,
        });
      });
    }

    return results;
  }, [schoolSlug]);

  // Filter results
  const filteredResults = React.useMemo(() => {
    if (!query.trim()) {
      // Show recent/popular pages when no query
      return allResults.filter((r) => r.type === 'page').slice(0, 8);
    }
    const q = query.toLowerCase();
    return allResults
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, allResults]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-300 hover:border-slate-600 transition text-sm"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-slate-700 rounded text-slate-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Search Dialog */}
      <div
        className="relative max-w-xl mx-auto mt-[15vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 border-b border-slate-700">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search students, pages, resources..."
              className="flex-1 h-14 bg-transparent text-white text-base placeholder:text-slate-500 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="px-2 py-1 text-xs bg-slate-700 rounded text-slate-400">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto py-2">
            {filteredResults.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results for &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              <>
                {/* Group by type */}
                {['page', 'student', 'resource'].map((type) => {
                  const typeResults = filteredResults.filter((r) => r.type === type);
                  if (typeResults.length === 0) return null;

                  const labels: Record<string, string> = {
                    page: 'Pages',
                    student: 'Students',
                    resource: 'Resources',
                  };

                  return (
                    <div key={type}>
                      <div className="px-4 py-1.5 text-xs font-medium text-slate-500 uppercase">
                        {labels[type]}
                      </div>
                      {typeResults.map((result) => {
                        const globalIdx = filteredResults.indexOf(result);
                        const Icon = result.icon;
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <Link
                            key={result.href}
                            href={result.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5 transition',
                              isSelected
                                ? 'bg-indigo-500/20 text-white'
                                : 'text-slate-300 hover:bg-slate-700/50'
                            )}
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                isSelected ? 'bg-indigo-500/30' : 'bg-slate-700'
                              )}
                            >
                              <Icon className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{result.title}</div>
                              <div className="text-xs text-slate-500 truncate">{result.subtitle}</div>
                            </div>
                            {isSelected && (
                              <ArrowRight className="w-4 h-4 text-indigo-400" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-700 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[10px]">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[10px]">↵</kbd> Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-700 rounded text-[10px]">esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
