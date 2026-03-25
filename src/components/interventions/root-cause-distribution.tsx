'use client';

/**
 * Root Cause Distribution Card
 * ============================
 *
 * Sprint 5D: Shows distribution of risk drivers across intervened students.
 *
 * Categories:
 * - Attendance (chronic absence)
 * - Academic (below grade level)
 * - Behavior
 * - Multiple Factors
 *
 * Includes insight about primary driver patterns and effectiveness.
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRiskDrivers } from '@/lib/hooks/use-risk-drivers';
import { useMtssSummary } from '@/lib/hooks/use-mtss-summary';
import { PieChart, Lightbulb, Users } from 'lucide-react';

interface RootCauseDistributionProps {
  schoolId: string | null;
  className?: string;
}

interface CategoryData {
  name: string;
  label: string;
  count: number;
  percent: number;
  color: string;
  bgColor: string;
}

const CATEGORY_COLORS: Record<string, { color: string; bgColor: string }> = {
  attendance: { color: 'bg-cyan-500', bgColor: 'text-cyan-400' },
  academic: { color: 'bg-indigo-500', bgColor: 'text-indigo-400' },
  behavior: { color: 'bg-orange-500', bgColor: 'text-orange-400' },
  multiple: { color: 'bg-purple-500', bgColor: 'text-purple-400' },
  other: { color: 'bg-slate-500', bgColor: 'text-slate-400' },
};

export function RootCauseDistribution({
  schoolId,
  className,
}: RootCauseDistributionProps) {
  const { drivers, totalStudents, isLoading: driversLoading } = useRiskDrivers(schoolId);
  const { data: mtssData, isLoading: mtssLoading } = useMtssSummary(schoolId);

  const isLoading = driversLoading || mtssLoading;

  // Aggregate drivers by main category
  const categoryData = React.useMemo<CategoryData[]>(() => {
    if (!drivers || drivers.length === 0) return [];

    // Group by category
    const categoryTotals: Record<string, number> = {};
    let total = 0;

    for (const driver of drivers) {
      const category = driver.category || 'other';
      categoryTotals[category] = (categoryTotals[category] || 0) + driver.studentsAffected;
      total += driver.studentsAffected;
    }

    // Map to display categories
    const result: CategoryData[] = [];

    const categoryMapping: Record<string, string> = {
      attendance: 'Attendance',
      academic: 'Academic',
      behavior: 'Behavior',
      engagement: 'Academic', // Group engagement with academic
      assignments: 'Academic', // Group assignments with academic
      trend: 'Academic', // Group trend with academic
    };

    const displayTotals: Record<string, number> = {};

    for (const [cat, count] of Object.entries(categoryTotals)) {
      const displayCat = categoryMapping[cat] || 'Other';
      displayTotals[displayCat] = (displayTotals[displayCat] || 0) + count;
    }

    // Check for multiple factors (students with both attendance AND academic issues)
    // Approximate: if total exceeds totalStudents, some students have multiple factors
    const multipleFactorCount = Math.max(0, total - totalStudents);
    if (multipleFactorCount > 0 && totalStudents > 0) {
      displayTotals['Multiple Factors'] = Math.round(multipleFactorCount * 0.3); // Estimate
    }

    const grandTotal = Object.values(displayTotals).reduce((a, b) => a + b, 0);

    for (const [name, count] of Object.entries(displayTotals)) {
      const colorKey = name === 'Attendance' ? 'attendance' :
                       name === 'Academic' ? 'academic' :
                       name === 'Behavior' ? 'behavior' :
                       name === 'Multiple Factors' ? 'multiple' : 'other';

      const colors = CATEGORY_COLORS[colorKey];

      result.push({
        name: colorKey,
        label: name,
        count,
        percent: grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0,
        color: colors.color,
        bgColor: colors.bgColor,
      });
    }

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    return result;
  }, [drivers, totalStudents]);

  // Find the primary driver for insight
  const primaryDriver = categoryData[0];
  const attendanceCategory = categoryData.find(c => c.name === 'attendance');

  // Get attendance strategy improvement rate from MTSS data
  const attendanceStrategy = mtssData?.top_strategies?.find(s =>
    s.strategy_name.toLowerCase().includes('attendance')
  );

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Why Students Need Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-slate-700/50 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categoryData.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3 border-b border-slate-700/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Why Students Need Support
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="py-6 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No risk data available</p>
            <p className="text-xs text-slate-500 mt-1">
              Distribution will appear after risk evaluations run
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...categoryData.map(c => c.count));

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3 border-b border-slate-700/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChart className="w-5 h-5 text-indigo-400" />
          Why Students Need Support
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Horizontal bar chart */}
        <div className="space-y-3 mb-4">
          {categoryData.map((category) => (
            <div key={category.name}>
              <div className="flex items-center justify-between mb-1">
                <span className={cn('text-sm font-medium', category.bgColor)}>
                  {category.label}
                </span>
                <div className="text-right">
                  <span className="text-sm text-white font-medium">{category.count}</span>
                  <span className="text-xs text-slate-500 ml-1">({category.percent}%)</span>
                </div>
              </div>
              <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', category.color)}
                  style={{ width: `${maxCount > 0 ? (category.count / maxCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Insight */}
        {primaryDriver && attendanceCategory && (
          <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="text-white font-medium">{attendanceCategory.percent}%</span> of flagged students have attendance as a primary risk driver.
                {attendanceStrategy && (
                  <>
                    {' '}Targeted attendance interventions show{' '}
                    <span className="text-emerald-400 font-medium">
                      {Math.round(attendanceStrategy.improvement_rate * 100)}% improvement rate
                    </span>.
                  </>
                )}
                {!attendanceStrategy && (
                  <> Consider adding targeted attendance support strategies.</>
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RootCauseDistributionSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3 border-b border-slate-700/50">
        <div className="animate-pulse h-6 w-48 bg-slate-700 rounded" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-slate-700 rounded" />
                <div className="h-4 w-12 bg-slate-700 rounded" />
              </div>
              <div className="h-3 bg-slate-700/50 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
