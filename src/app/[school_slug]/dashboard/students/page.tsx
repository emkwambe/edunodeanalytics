'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PageHeader,
  DashboardGrid,
  GridItem,
} from '@/components/layout/dashboard-shell';
import {
  Student360Card,
  Student360CardSkeleton,
  type Student360Data,
} from '@/components/dashboard/student-360-card';
import { RiskDistribution, StatusBadge } from '@/components/dashboard/status-indicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateMockStudents } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Search, Filter, Download, Grid3X3, List, Users } from 'lucide-react';

/**
 * Student 360 Dashboard
 *
 * Holistic view of all students with filtering and search
 * RLS ensures teachers only see their own roster
 */

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'on_track' | 'at_risk' | 'critical';

export default function StudentsPage({
  params,
}: {
  params: { school_slug: string };
}) {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('filter') as FilterStatus) || 'all';

  const [students, setStudents] = React.useState<Student360Data[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [filter, setFilter] = React.useState<FilterStatus>(initialFilter);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedGrade, setSelectedGrade] = React.useState<number | null>(null);

  // Load mock data
  React.useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStudents(generateMockStudents(120));
      setLoading(false);
    }, 500);
  }, []);

  // Filter and search logic
  const filteredStudents = React.useMemo(() => {
    let result = students;

    // Status filter
    if (filter !== 'all') {
      result = result.filter((s) => s.riskLevel === filter);
    }

    // Grade filter
    if (selectedGrade !== null) {
      result = result.filter((s) => s.gradeLevel === selectedGrade);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.firstName.toLowerCase().includes(query) ||
          s.lastName.toLowerCase().includes(query) ||
          s.displayName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [students, filter, selectedGrade, searchQuery]);

  // Risk distribution for filtered students
  const riskDistribution = React.useMemo(() => ({
    onTrack: filteredStudents.filter((s) => s.riskLevel === 'on_track').length,
    atRisk: filteredStudents.filter((s) => s.riskLevel === 'at_risk').length,
    critical: filteredStudents.filter((s) => s.riskLevel === 'critical').length,
  }), [filteredStudents]);

  const grades = [6, 7, 8, 9, 10, 11, 12];

  return (
    <>
      <PageHeader
        title="Student 360"
        description="Holistic view of student performance and well-being"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${params.school_slug}/dashboard` },
          { label: 'Student 360' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {/* Filters Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students by name..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="flex gap-1">
                {(['all', 'on_track', 'at_risk', 'critical'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(status)}
                    className={cn(
                      filter === status && status === 'critical' && 'bg-red-500 hover:bg-red-600',
                      filter === status && status === 'at_risk' && 'bg-amber-500 hover:bg-amber-600',
                      filter === status && status === 'on_track' && 'bg-emerald-500 hover:bg-emerald-600'
                    )}
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Grade Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Grade:</span>
              <select
                className="input-field w-24"
                value={selectedGrade ?? ''}
                onChange={(e) =>
                  setSelectedGrade(e.target.value ? parseInt(e.target.value) : null)
                }
              >
                <option value="">All</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 border border-slate-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <RiskDistribution
              onTrack={riskDistribution.onTrack}
              atRisk={riskDistribution.atRisk}
              critical={riskDistribution.critical}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Users className="w-4 h-4" />
          <span>
            Showing <span className="text-slate-200 font-medium">{filteredStudents.length}</span> students
          </span>
          {(filter !== 'all' || selectedGrade !== null || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilter('all');
                setSelectedGrade(null);
                setSearchQuery('');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Student Cards */}
      {loading ? (
        <DashboardGrid>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <GridItem key={i} span={viewMode === 'grid' ? 4 : 12}>
              <Student360CardSkeleton />
            </GridItem>
          ))}
        </DashboardGrid>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              No students found
            </h3>
            <p className="text-slate-500">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <DashboardGrid>
          {filteredStudents.map((student) => (
            <GridItem key={student.id} span={4}>
              <Student360Card
                student={student}
                onClick={() => {
                  // Navigate to student detail page
                  window.location.href = `/${params.school_slug}/dashboard/students/${student.id}`;
                }}
              />
            </GridItem>
          ))}
        </DashboardGrid>
      ) : (
        <div className="space-y-2">
          {filteredStudents.map((student) => (
            <Student360Card
              key={student.id}
              student={student}
              variant="compact"
              onClick={() => {
                window.location.href = `/${params.school_slug}/dashboard/students/${student.id}`;
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
