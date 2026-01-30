'use client';

import * as React from 'react';
import { useSearchParams, useParams } from 'next/navigation';
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
import { RiskDistribution } from '@/components/dashboard/status-indicator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSchoolSeed, toStudent360Data } from '@/lib/data/seed-data';
import { cn } from '@/lib/utils';
import { Search, Filter, Download, Grid3X3, List, Users, TrendingUp } from 'lucide-react';

/**
 * Student 360 Dashboard
 *
 * Holistic view of all students with filtering and search
 * Uses strategic seed data with "Independent Excellence" narrative
 * RLS ensures teachers only see their own roster
 */

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'on_track' | 'at_risk' | 'critical';

export default function StudentsPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('filter') as FilterStatus) || 'all';

  const [students, setStudents] = React.useState<Student360Data[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [filter, setFilter] = React.useState<FilterStatus>(initialFilter);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedGrade, setSelectedGrade] = React.useState<number | null>(null);
  const [availableGrades, setAvailableGrades] = React.useState<number[]>([]);

  // Load seed data
  React.useEffect(() => {
    setLoading(true);

    // Small delay to show loading state
    const timer = setTimeout(() => {
      const schoolData = getSchoolSeed(school_slug);

      if (schoolData) {
        const studentData = schoolData.students.map(toStudent360Data);
        setStudents(studentData);

        // Get unique grade levels from the data
        const grades = [...new Set(studentData.map((s) => s.gradeLevel as number))].sort();
        setAvailableGrades(grades);
      } else {
        setStudents([]);
        setAvailableGrades([6, 7, 8, 9, 10, 11, 12]);
      }

      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [school_slug]);

  // Handle chronic absence filter from URL
  React.useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'chronic') {
      // Show only chronically absent students
      setFilter('all');
    }
  }, [searchParams]);

  // Filter and search logic
  const filteredStudents = React.useMemo(() => {
    let result = students;

    // Special chronic absence filter
    if (searchParams.get('filter') === 'chronic') {
      result = result.filter((s) => s.isChronicallyAbsent);
    }

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
  }, [students, filter, selectedGrade, searchQuery, searchParams]);

  // Risk distribution for filtered students
  const riskDistribution = React.useMemo(
    () => ({
      onTrack: filteredStudents.filter((s) => s.riskLevel === 'on_track').length,
      atRisk: filteredStudents.filter((s) => s.riskLevel === 'at_risk').length,
      critical: filteredStudents.filter((s) => s.riskLevel === 'critical').length,
    }),
    [filteredStudents]
  );

  // Calculate growth statistics for banner
  const avgGrowth = React.useMemo(() => {
    if (filteredStudents.length === 0) return 0;
    const growths = filteredStudents
      .map((s) => s.readingGrowthPercentile || s.mathGrowthPercentile || 0)
      .filter((g) => g > 0);
    return growths.length > 0 ? growths.reduce((a, b) => a + b, 0) / growths.length : 0;
  }, [filteredStudents]);

  const isChronic = searchParams.get('filter') === 'chronic';

  return (
    <>
      <PageHeader
        title={isChronic ? 'Chronic Absence Early Warning' : 'Student 360'}
        description={
          isChronic
            ? 'Students with less than 90% attendance rate'
            : 'Holistic view of student performance with strategic growth data'
        }
        breadcrumbs={[
          { label: 'Dashboard', href: `/${school_slug}/dashboard` },
          { label: isChronic ? 'Chronic Absence' : 'Student 360' },
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

      {/* Strategic Growth Banner */}
      {!isChronic && avgGrowth >= 70 && (
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-400">
                High Growth Cohort: {avgGrowth.toFixed(0)}th Percentile Average
              </p>
              <p className="text-xs text-slate-400">
                This demonstrates strong value-add despite varied entry proficiency levels
              </p>
            </div>
          </div>
        </div>
      )}

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
                      filter === status &&
                        status === 'critical' &&
                        'bg-red-500 hover:bg-red-600',
                      filter === status &&
                        status === 'at_risk' &&
                        'bg-amber-500 hover:bg-amber-600',
                      filter === status &&
                        status === 'on_track' &&
                        'bg-emerald-500 hover:bg-emerald-600'
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
                {availableGrades.map((g) => (
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
            Showing{' '}
            <span className="text-slate-200 font-medium">{filteredStudents.length}</span>{' '}
            students
            {isChronic && ' with chronic absence'}
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
            <h3 className="text-lg font-medium text-slate-300 mb-2">No students found</h3>
            <p className="text-slate-500">Try adjusting your filters or search query</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <DashboardGrid>
          {filteredStudents.map((student) => (
            <GridItem key={student.id} span={4}>
              <Student360Card
                student={student}
                onClick={() => {
                  window.location.href = `/${school_slug}/dashboard/students/${student.id}`;
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
                window.location.href = `/${school_slug}/dashboard/students/${student.id}`;
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
