'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  PageHeader,
  DashboardGrid,
  GridItem,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getSchoolSeed } from '@/lib/data/seed-data';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
} from 'lucide-react';

/**
 * Attendance Dashboard
 *
 * Chronic absenteeism monitoring and attendance trend analysis.
 * Starter tier feature - available to all plans.
 */

// Loading skeleton component
function AttendancePageSkeleton() {
  return (
    <>
      <div className="h-8 w-48 bg-slate-800/50 rounded animate-pulse mb-2" />
      <div className="h-4 w-64 bg-slate-800/50 rounded animate-pulse mb-6" />
      <DashboardGrid className="mb-6">
        {[1, 2, 3, 4].map((i) => (
          <GridItem key={i} span={3}>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 animate-pulse" />
                  <div>
                    <div className="h-6 w-16 bg-slate-700 rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </GridItem>
        ))}
      </DashboardGrid>
      <DashboardGrid className="mb-6">
        <GridItem span={6}>
          <Card className="bg-slate-800/50 border-slate-700 h-64">
            <CardContent className="pt-6">
              <div className="h-full bg-slate-700/50 rounded animate-pulse" />
            </CardContent>
          </Card>
        </GridItem>
        <GridItem span={6}>
          <Card className="bg-slate-800/50 border-slate-700 h-64">
            <CardContent className="pt-6">
              <div className="h-full bg-slate-700/50 rounded animate-pulse" />
            </CardContent>
          </Card>
        </GridItem>
      </DashboardGrid>
    </>
  );
}

export default function AttendancePage() {
  const params = useParams();
  const school_slug = params.school_slug as string;
  const [loading, setLoading] = React.useState(true);

  const schoolSeed = getSchoolSeed(school_slug);
  const students = schoolSeed?.students ?? [];
  const metrics = schoolSeed?.metrics;

  // Simulate loading state
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Calculate attendance breakdown
  const attendanceTiers = React.useMemo(() => {
    const satisfactory = students.filter((s) => s.attendanceRate >= 0.95).length;
    const atRisk = students.filter((s) => s.attendanceRate >= 0.90 && s.attendanceRate < 0.95).length;
    const chronic = students.filter((s) => s.attendanceRate < 0.90).length;
    return { satisfactory, atRisk, chronic };
  }, [students]);

  // Grade-level breakdown
  const gradeBreakdown = React.useMemo(() => {
    const grades = new Map<number, { total: number; avgRate: number; chronicCount: number }>();
    students.forEach((s) => {
      const current = grades.get(s.gradeLevel) || { total: 0, avgRate: 0, chronicCount: 0 };
      current.total += 1;
      current.avgRate += s.attendanceRate;
      if (s.isChronicallyAbsent) current.chronicCount += 1;
      grades.set(s.gradeLevel, current);
    });
    return Array.from(grades.entries())
      .map(([grade, data]) => ({
        grade,
        total: data.total,
        avgRate: data.avgRate / data.total,
        chronicCount: data.chronicCount,
        chronicRate: data.chronicCount / data.total,
      }))
      .sort((a, b) => a.grade - b.grade);
  }, [students]);

  // Top chronic absentees
  const chronicStudents = React.useMemo(() => {
    return students
      .filter((s) => s.isChronicallyAbsent)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 10);
  }, [students]);

  const overallRate = metrics?.attendanceRate ?? 0;
  const hasData = students.length > 0;

  // Show loading skeleton
  if (loading) {
    return <AttendancePageSkeleton />;
  }

  // Show empty state if no data
  if (!hasData) {
    return (
      <>
        <PageHeader
          title="Attendance Monitor"
          description="Chronic absenteeism tracking and attendance trend analysis"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${school_slug}/dashboard` },
            { label: 'Attendance' },
          ]}
        />
        <Card className="border-slate-700 bg-slate-800/30">
          <CardContent>
            <EmptyState
              icon={Calendar}
              title="No Attendance Data Available"
              description="Import attendance records or connect your SIS to see trends. Attendance data helps identify chronic absenteeism and track student engagement."
              action={{
                label: 'Import Attendance Data',
                href: `/${school_slug}/settings/import`,
              }}
              secondaryAction={{
                label: 'Connect SIS',
                href: `/${school_slug}/settings/integrations`,
              }}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Attendance Monitor"
        description="Chronic absenteeism tracking and attendance trend analysis"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${school_slug}/dashboard` },
          { label: 'Attendance' },
        ]}
        actions={
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Updated today
          </Badge>
        }
      />

      {/* Summary Metrics */}
      <DashboardGrid className="mb-6">
        <GridItem span={3}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">
                    {(overallRate * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400">Average Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem span={3}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">
                    {metrics?.chronicAbsenceCount ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">Chronically Absent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem span={3}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">
                    {((metrics?.chronicAbsenceRate ?? 0) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400">Chronic Absence Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem span={3}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">
                    {students.length}
                  </p>
                  <p className="text-xs text-slate-400">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </GridItem>
      </DashboardGrid>

      {/* Attendance Tiers Breakdown */}
      <DashboardGrid className="mb-6">
        <GridItem span={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Attendance Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Satisfactory (95%+)', count: attendanceTiers.satisfactory, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                  { label: 'At Risk (90-95%)', count: attendanceTiers.atRisk, color: 'bg-amber-500', textColor: 'text-amber-400' },
                  { label: 'Chronic (<90%)', count: attendanceTiers.chronic, color: 'bg-rose-500', textColor: 'text-rose-400' },
                ].map((tier) => (
                  <div key={tier.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{tier.label}</span>
                      <span className={cn('text-sm font-bold', tier.textColor)}>
                        {tier.count} ({((tier.count / students.length) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', tier.color)}
                        style={{ width: `${(tier.count / students.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem span={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                By Grade Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gradeBreakdown.map((g) => (
                  <div key={g.grade} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {g.grade}th
                      </Badge>
                      <span className="text-sm text-slate-300">{g.total} students</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        'text-sm font-bold',
                        g.avgRate >= 0.95 ? 'text-emerald-400' :
                        g.avgRate >= 0.90 ? 'text-amber-400' : 'text-rose-400'
                      )}>
                        {(g.avgRate * 100).toFixed(1)}%
                      </span>
                      {g.chronicCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {g.chronicCount} chronic
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </GridItem>
      </DashboardGrid>

      {/* Chronic Absentee List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Chronically Absent Students
            <Badge variant="destructive" className="ml-2">
              {chronicStudents.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chronicStudents.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No chronically absent students.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-xs text-slate-400 uppercase">Student</th>
                    <th className="text-left py-2 px-3 text-xs text-slate-400 uppercase">Grade</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 uppercase">Rate</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 uppercase">Days Absent</th>
                    <th className="text-left py-2 px-3 text-xs text-slate-400 uppercase">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {chronicStudents.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-2 px-3">
                        <a
                          href={`/${school_slug}/dashboard/students/${s.id}`}
                          className="text-sm text-white hover:text-indigo-400 transition-colors"
                        >
                          {s.firstName} {s.lastName}
                        </a>
                      </td>
                      <td className="py-2 px-3 text-sm text-slate-400">{s.gradeLevel}th</td>
                      <td className="py-2 px-3 text-sm text-right font-bold text-rose-400">
                        {(s.attendanceRate * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-sm text-right text-slate-300">{s.daysAbsent}</td>
                      <td className="py-2 px-3">
                        <Badge
                          className={cn(
                            'text-xs',
                            s.riskLevel === 'critical'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          )}
                        >
                          {s.riskLevel === 'critical' ? 'Critical' : 'At Risk'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
