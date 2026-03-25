'use client';

/**
 * MTSS Program Effectiveness Summary
 * ==================================
 *
 * Sprint 5D: Summary card showing school-wide MTSS program effectiveness.
 *
 * Displays:
 * - Total active interventions count
 * - Average dosage compliance (color-coded gauge)
 * - Outcomes breakdown (improved/maintained/worsened)
 * - Best performing strategy
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMtssSummary } from '@/lib/hooks/use-mtss-summary';
import { Target, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';

interface ProgramEffectivenessSummaryProps {
  schoolId: string | null;
  className?: string;
}

/**
 * Get dosage compliance color based on percentage
 */
function getDosageColor(compliance: number): { text: string; bg: string; border: string } {
  if (compliance >= 0.8) {
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
  }
  if (compliance >= 0.6) {
    return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' };
  }
  return { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
}

/**
 * Circular gauge component for dosage compliance
 */
function DosageGauge({ compliance, size = 80 }: { compliance: number; size?: number }) {
  const colors = getDosageColor(compliance);
  const percent = Math.round(compliance * 100);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compliance * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={colors.text}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-lg font-bold', colors.text)}>{percent}%</span>
      </div>
    </div>
  );
}

export function ProgramEffectivenessSummary({
  schoolId,
  className,
}: ProgramEffectivenessSummaryProps) {
  const { data, isLoading, error } = useMtssSummary(schoolId);

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-indigo-400" />
            MTSS Program Effectiveness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-8 bg-slate-700 rounded" />
                <div className="h-4 bg-slate-700/50 rounded w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-6 text-center text-slate-400">
          Unable to load effectiveness data
        </CardContent>
      </Card>
    );
  }

  const totalOutcomes = data.students_improved + data.students_maintained + data.students_worsened;
  const improvedPct = totalOutcomes > 0 ? Math.round((data.students_improved / totalOutcomes) * 100) : 0;
  const maintainedPct = totalOutcomes > 0 ? Math.round((data.students_maintained / totalOutcomes) * 100) : 0;
  const worsenedPct = totalOutcomes > 0 ? Math.round((data.students_worsened / totalOutcomes) * 100) : 0;

  const bestStrategy = data.top_strategies?.[0];
  const dosageColors = getDosageColor(data.avg_dosage_compliance);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3 border-b border-slate-700/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-indigo-400" />
          MTSS Program Effectiveness
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Interventions */}
          <div className="text-center lg:text-left">
            <div className="text-3xl font-black text-white mb-1">
              {data.total_active_interventions}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest">
              Active Interventions
            </div>
          </div>

          {/* Dosage Compliance Gauge */}
          <div className="flex flex-col items-center lg:items-start gap-2">
            <div className="flex items-center gap-3">
              <DosageGauge compliance={data.avg_dosage_compliance} size={60} />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Dosage</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">Compliance</div>
              </div>
            </div>
          </div>

          {/* Outcomes Breakdown */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">
              Outcomes
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sm text-white font-medium">{data.students_improved}</span>
                <span className="text-xs text-emerald-400">({improvedPct}% improved)</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm text-white font-medium">{data.students_maintained}</span>
                <span className="text-xs text-amber-400">({maintainedPct}% maintained)</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <span className="text-sm text-white font-medium">{data.students_worsened}</span>
                <span className="text-xs text-red-400">({worsenedPct}% worsened)</span>
              </div>
            </div>
          </div>

          {/* Best Performing Strategy */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">
              Best Strategy
            </div>
            {bestStrategy ? (
              <div className={cn('p-3 rounded-lg', dosageColors.bg, dosageColors.border, 'border')}>
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-white truncate">
                    {bestStrategy.strategy_name}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {Math.round(bestStrategy.improvement_rate * 100)}% improvement rate
                </div>
                <div className="text-xs text-slate-500">
                  {bestStrategy.student_count} students
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">
                Not enough data yet
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgramEffectivenessSummarySkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3 border-b border-slate-700/50">
        <div className="animate-pulse h-6 w-48 bg-slate-700 rounded" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="animate-pulse grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-8 bg-slate-700 rounded" />
              <div className="h-4 bg-slate-700/50 rounded w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
