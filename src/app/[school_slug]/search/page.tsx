'use client';

import * as React from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSchoolSeed, toStudent360Data } from '@/lib/data/seed-data';
import { cn } from '@/lib/utils';
import {
  Search,
  Users,
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react';

/**
 * Global Search Page
 *
 * Unified search across students, interventions, and reports.
 * Accessible via Cmd+K command palette or direct navigation.
 */

type SearchCategory = 'all' | 'students' | 'interventions' | 'reports';

interface SearchResult {
  id: string;
  type: 'student' | 'intervention' | 'report';
  title: string;
  subtitle: string;
  href: string;
  metadata?: Record<string, string>;
}

export default function SearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const school_slug = params.school_slug as string;

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = React.useState(initialQuery);
  const [category, setCategory] = React.useState<SearchCategory>('all');
  const [_isSearching, _setIsSearching] = React.useState(false);

  // Get seed data
  const schoolSeed = getSchoolSeed(school_slug);
  const students = schoolSeed?.students.map(toStudent360Data) || [];

  // Search logic
  const searchResults = React.useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search students
    if (category === 'all' || category === 'students') {
      students
        .filter(
          (s) =>
            s.firstName.toLowerCase().includes(q) ||
            s.lastName.toLowerCase().includes(q) ||
            s.displayName.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q)
        )
        .slice(0, 10)
        .forEach((s) => {
          results.push({
            id: s.id,
            type: 'student',
            title: s.displayName,
            subtitle: `Grade ${s.gradeLevel} | ${s.riskLevel.replace('_', ' ')}`,
            href: `/${school_slug}/dashboard/students/${s.id}`,
            metadata: {
              attendance: `${(s.attendanceRate * 100).toFixed(1)}%`,
              growth: `${s.readingGrowthPercentile || 'N/A'}th %ile`,
            },
          });
        });
    }

    // Search interventions (mock)
    if (category === 'all' || category === 'interventions') {
      const interventionTypes = [
        'Small Group Reading',
        'Math Tutoring',
        'Phonics Intervention',
        'Writing Workshop',
      ];

      interventionTypes
        .filter((i) => i.toLowerCase().includes(q))
        .forEach((intervention, idx) => {
          results.push({
            id: `int-${idx}`,
            type: 'intervention',
            title: intervention,
            subtitle: 'MTSS Tier 2 Intervention',
            href: `/${school_slug}/interventions`,
          });
        });
    }

    // Search reports (mock)
    if (category === 'all' || category === 'reports') {
      const reports = [
        { name: 'Charter Renewal Summary', category: 'Compliance' },
        { name: 'Annual Performance Report', category: 'Academic' },
        { name: 'Monthly Attendance Report', category: 'Attendance' },
        { name: 'MAP Growth Summary', category: 'Growth' },
        { name: 'Subgroup Parity Analysis', category: 'Compliance' },
      ];

      reports
        .filter((r) => r.name.toLowerCase().includes(q))
        .forEach((report, idx) => {
          results.push({
            id: `report-${idx}`,
            type: 'report',
            title: report.name,
            subtitle: report.category,
            href: `/${school_slug}/dashboard/reports`,
          });
        });
    }

    return results;
  }, [query, category, students, school_slug]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${school_slug}/search?q=${encodeURIComponent(query)}`);
    }
  };

  // Result counts by type
  const resultCounts = {
    students: searchResults.filter((r) => r.type === 'student').length,
    interventions: searchResults.filter((r) => r.type === 'intervention').length,
    reports: searchResults.filter((r) => r.type === 'report').length,
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'student':
        return <Users className="w-4 h-4" />;
      case 'intervention':
        return <AlertTriangle className="w-4 h-4" />;
      case 'report':
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'student':
        return 'bg-indigo-500/20 text-indigo-400';
      case 'intervention':
        return 'bg-amber-500/20 text-amber-400';
      case 'report':
        return 'bg-cyan-500/20 text-cyan-400';
    }
  };

  return (
    <>
      <PageHeader
        title="Search"
        description="Find students, interventions, and reports"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${school_slug}/dashboard` },
          { label: 'Search' },
        ]}
      />

      {/* Search Form */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search for students, interventions, reports..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white text-lg focus:border-indigo-500 focus:outline-none"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <Button type="submit" size="lg" className="px-8">
              Search
            </Button>
          </form>

          {/* Category Filters */}
          <div className="flex gap-2 mt-4">
            {[
              { key: 'all', label: 'All Results', count: searchResults.length },
              { key: 'students', label: 'Students', count: resultCounts.students },
              { key: 'interventions', label: 'Interventions', count: resultCounts.interventions },
              { key: 'reports', label: 'Reports', count: resultCounts.reports },
            ].map((cat) => (
              <Button
                key={cat.key}
                variant={category === cat.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat.key as SearchCategory)}
                className={category === cat.key ? 'bg-indigo-600' : ''}
              >
                {cat.label}
                {query && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {cat.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {query ? (
        searchResults.length > 0 ? (
          <div className="space-y-2">
            {searchResults.map((result) => (
              <Link key={`${result.type}-${result.id}`} href={result.href}>
                <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', getTypeColor(result.type))}>
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white">{result.title}</div>
                      <div className="text-sm text-slate-400">{result.subtitle}</div>
                    </div>
                    {result.metadata && (
                      <div className="flex gap-4 text-xs">
                        {Object.entries(result.metadata).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="text-slate-500 capitalize">{key}</div>
                            <div className="text-white font-medium">{value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No results found</h3>
              <p className="text-slate-500">
                Try adjusting your search terms or filters
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">Start searching</h3>
            <p className="text-slate-500">
              Enter a search term to find students, interventions, or reports
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
              <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Cmd</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700">K</kbd>
              <span className="ml-2">for quick search</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      {!query && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href={`/${school_slug}/dashboard/students?filter=critical`}>
              <Card className="hover:border-rose-500/50 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">Critical Students</div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/${school_slug}/dashboard/students?filter=chronic`}>
              <Card className="hover:border-amber-500/50 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">Chronic Absence</div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/${school_slug}/interventions`}>
              <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">Interventions</div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/${school_slug}/analytics/impact`}>
              <Card className="hover:border-cyan-500/50 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">Impact Analytics</div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
