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
import { getSchoolSeed } from '@/lib/data/seed-data';
import { cn } from '@/lib/utils';
import {
  GraduationCap,
  BookOpen,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
} from 'lucide-react';

/**
 * Assessments Dashboard
 *
 * Mastery trends and assessment performance overview.
 * Starter tier feature - available to all plans.
 */

export default function AssessmentsPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  const schoolSeed = getSchoolSeed(school_slug);
  const students = schoolSeed?.students ?? [];

  // Calculate assessment stats
  const stats = React.useMemo(() => {
    const readingAvg = students.reduce((s, st) => s + st.reading.nationalPercentile, 0) / students.length;
    const mathAvg = students.reduce((s, st) => s + st.math.nationalPercentile, 0) / students.length;
    const readingGrowth = students.reduce((s, st) => s + st.reading.growthPercentile, 0) / students.length;
    const mathGrowth = students.reduce((s, st) => s + st.math.growthPercentile, 0) / students.length;

    // Proficiency bands
    const readingProficient = students.filter((s) => s.reading.nationalPercentile >= 50).length;
    const mathProficient = students.filter((s) => s.math.nationalPercentile >= 50).length;

    return {
      readingAvg, mathAvg, readingGrowth, mathGrowth,
      readingProficient, mathProficient,
    };
  }, [students]);

  // Grade-level mastery
  const gradeData = React.useMemo(() => {
    const grades = new Map<number, { count: number; readingAvg: number; mathAvg: number; readingGrowth: number; mathGrowth: number }>();
    students.forEach((s) => {
      const current = grades.get(s.gradeLevel) || { count: 0, readingAvg: 0, mathAvg: 0, readingGrowth: 0, mathGrowth: 0 };
      current.count += 1;
      current.readingAvg += s.reading.nationalPercentile;
      current.mathAvg += s.math.nationalPercentile;
      current.readingGrowth += s.reading.growthPercentile;
      current.mathGrowth += s.math.growthPercentile;
      grades.set(s.gradeLevel, current);
    });
    return Array.from(grades.entries())
      .map(([grade, data]) => ({
        grade,
        count: data.count,
        readingAvg: data.readingAvg / data.count,
        mathAvg: data.mathAvg / data.count,
        readingGrowth: data.readingGrowth / data.count,
        mathGrowth: data.mathGrowth / data.count,
      }))
      .sort((a, b) => a.grade - b.grade);
  }, [students]);

  return (
    <>
      <PageHeader
        title="Assessment Overview"
        description="MAP Growth mastery trends and proficiency analysis"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${school_slug}/dashboard` },
          { label: 'Assessments' },
        ]}
        actions={
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Winter 2024-25
          </Badge>
        }
      />

      {/* Summary Row */}
      <DashboardGrid className="mb-6">
        {[
          { label: 'Reading Avg', value: `${stats.readingAvg.toFixed(0)}th`, sub: '%ile', icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
          { label: 'Math Avg', value: `${stats.mathAvg.toFixed(0)}th`, sub: '%ile', icon: Target, color: 'text-violet-400', bg: 'bg-violet-500/20' },
          { label: 'Reading Growth', value: `${stats.readingGrowth.toFixed(0)}th`, sub: '%ile', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
          { label: 'Math Growth', value: `${stats.mathGrowth.toFixed(0)}th`, sub: '%ile', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/20' },
        ].map((m) => (
          <GridItem key={m.label} span={3}>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', m.bg)}>
                    <m.icon className={cn('w-5 h-5', m.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">
                      {m.value} <span className="text-sm font-normal text-slate-400">{m.sub}</span>
                    </p>
                    <p className="text-xs text-slate-400">{m.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </GridItem>
        ))}
      </DashboardGrid>

      {/* Proficiency Distribution */}
      <DashboardGrid className="mb-6">
        <GridItem span={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Reading Proficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-black text-white">
                  {((stats.readingProficient / students.length) * 100).toFixed(0)}%
                </div>
                <p className="text-sm text-slate-400">
                  {stats.readingProficient} of {students.length} at or above grade level
                </p>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                  style={{ width: `${(stats.readingProficient / students.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </GridItem>

        <GridItem span={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-400" />
                Math Proficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-black text-white">
                  {((stats.mathProficient / students.length) * 100).toFixed(0)}%
                </div>
                <p className="text-sm text-slate-400">
                  {stats.mathProficient} of {students.length} at or above grade level
                </p>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                  style={{ width: `${(stats.mathProficient / students.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </GridItem>
      </DashboardGrid>

      {/* Grade-Level Breakdown */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            Grade-Level Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-xs text-slate-400 uppercase">Grade</th>
                  <th className="text-right py-2 px-3 text-xs text-slate-400 uppercase">Students</th>
                  <th className="text-right py-2 px-3 text-xs text-slate-400 uppercase">Reading %ile</th>
                  <th className="text-right py-2 px-3 text-xs text-slate-400 uppercase">Math %ile</th>
                  <th className="text-right py-2 px-3 text-xs text-slate-400 uppercase">Reading Growth</th>
                  <th className="text-right py-2 px-3 text-xs text-slate-400 uppercase">Math Growth</th>
                </tr>
              </thead>
              <tbody>
                {gradeData.map((g) => (
                  <tr key={g.grade} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <Badge variant="outline">{g.grade}th Grade</Badge>
                    </td>
                    <td className="py-3 px-3 text-sm text-slate-300 text-right">{g.count}</td>
                    <td className="py-3 px-3 text-sm text-right">
                      <span className={cn(
                        'font-bold',
                        g.readingAvg >= 50 ? 'text-emerald-400' : 'text-amber-400'
                      )}>
                        {g.readingAvg.toFixed(0)}th
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm text-right">
                      <span className={cn(
                        'font-bold',
                        g.mathAvg >= 50 ? 'text-emerald-400' : 'text-amber-400'
                      )}>
                        {g.mathAvg.toFixed(0)}th
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm text-right">
                      <span className={cn(
                        'font-bold',
                        g.readingGrowth >= 60 ? 'text-emerald-400' :
                        g.readingGrowth >= 40 ? 'text-amber-400' : 'text-rose-400'
                      )}>
                        {g.readingGrowth.toFixed(0)}th
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm text-right">
                      <span className={cn(
                        'font-bold',
                        g.mathGrowth >= 60 ? 'text-emerald-400' :
                        g.mathGrowth >= 40 ? 'text-amber-400' : 'text-rose-400'
                      )}>
                        {g.mathGrowth.toFixed(0)}th
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
