'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RiskDriver } from '@/lib/hooks/use-risk-drivers';
import { getCategoryInfo } from '@/lib/hooks/use-risk-drivers';

interface RiskDriverBreakdownProps {
  drivers: RiskDriver[];
  totalStudents: number;
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
}

function DriverBar({
  driver,
  maxScore,
  totalStudents,
}: {
  driver: RiskDriver;
  maxScore: number;
  totalStudents: number;
}) {
  const categoryInfo = getCategoryInfo(driver.category);
  const widthPercent = maxScore > 0 ? (driver.totalWeightedScore / maxScore) * 100 : 0;
  const affectedPercent = totalStudents > 0 ? Math.round((driver.studentsAffected / totalStudents) * 100) : 0;

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded', categoryInfo.bgColor, categoryInfo.color)}>
            {categoryInfo.label}
          </span>
          <span className="text-sm text-slate-200 font-medium">{driver.name}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-slate-300">
            {driver.studentsAffected}
          </span>
          <span className="text-xs text-slate-500 ml-1">
            ({affectedPercent}%)
          </span>
        </div>
      </div>
      <div className="relative">
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              driver.category === 'attendance' && 'bg-cyan-500',
              driver.category === 'academic' && 'bg-indigo-500',
              driver.category === 'behavior' && 'bg-orange-500',
              driver.category === 'engagement' && 'bg-emerald-500',
              driver.category === 'assignments' && 'bg-purple-500',
              driver.category === 'trend' && 'bg-yellow-500',
              !['attendance', 'academic', 'behavior', 'engagement', 'assignments', 'trend'].includes(driver.category) && 'bg-slate-500'
            )}
            style={{ width: `${widthPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-500">
          <span>Avg: {(driver.avgWeightedScore * 100).toFixed(0)}%</span>
          <span>Max: {(driver.maxWeightedScore * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

export function RiskDriverBreakdown({
  drivers,
  totalStudents,
  isLoading,
  className,
  maxItems = 6,
}: RiskDriverBreakdownProps) {
  const displayedDrivers = drivers.slice(0, maxItems);
  const maxScore = drivers.length > 0
    ? Math.max(...drivers.map((d) => d.totalWeightedScore))
    : 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-slate-700/50">
        <CardTitle>Risk Drivers</CardTitle>
        <CardDescription>
          Which factors are contributing most to student risk
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-slate-700 rounded w-32" />
                  <div className="h-4 bg-slate-700 rounded w-12" />
                </div>
                <div className="h-2 bg-slate-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : displayedDrivers.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-sm">No risk data available</p>
            <p className="text-xs mt-1">Risk factors will appear after evaluations run</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {displayedDrivers.map((driver) => (
              <DriverBar
                key={driver.name}
                driver={driver}
                maxScore={maxScore}
                totalStudents={totalStudents}
              />
            ))}
          </div>
        )}

        {drivers.length > maxItems && (
          <div className="mt-4 pt-4 border-t border-slate-700/30 text-center">
            <span className="text-sm text-slate-400">
              +{drivers.length - maxItems} more factors
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RiskDriverBreakdownSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-slate-700/50">
        <div className="animate-pulse space-y-2">
          <div className="h-6 w-28 bg-slate-700 rounded" />
          <div className="h-4 w-48 bg-slate-700 rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-700 rounded w-32" />
                <div className="h-4 bg-slate-700 rounded w-12" />
              </div>
              <div className="h-2 bg-slate-700 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
