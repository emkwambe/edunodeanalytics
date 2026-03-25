'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStudentInterventions } from '@/lib/hooks/use-interventions';
import { useInterventionDosage, formatComplianceRate, getComplianceStatus } from '@/lib/hooks/use-dosage';
import {
  Target,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  Minus,
} from 'lucide-react';

/**
 * Intervention Effectiveness Summary
 *
 * Shows per-student intervention outcomes:
 * - Intervention name and strategy
 * - Start date
 * - Dosage compliance % (color-coded)
 * - Risk score at intervention start -> current risk score
 * - Trajectory: improving / stable / worsening
 */

interface InterventionEffectivenessProps {
  schoolId: string;
  studentId: string;
  currentRiskScore?: number;
  className?: string;
}

interface InterventionCardProps {
  intervention: {
    id: string;
    title: string;
    type: string;
    status: string;
    start_date: string | null;
    baseline_value: number | null;
    current_value: number | null;
    priority: string;
  };
  schoolId: string;
  currentRiskScore?: number;
}

function formatInterventionType(type: string): string {
  const mapping: Record<string, string> = {
    academic: 'Academic',
    attendance: 'Attendance',
    behavior: 'Behavior',
    sel: 'SEL',
    family_engagement: 'Family',
  };
  return mapping[type] || type;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not started';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTrajectory(baseline: number | null, current: number | null): {
  label: string;
  icon: React.ReactNode;
  colorClass: string;
} {
  if (baseline === null || current === null) {
    return {
      label: 'No data',
      icon: <Minus className="w-4 h-4" />,
      colorClass: 'text-slate-400',
    };
  }

  // For risk scores, lower is better
  // Assuming these are percentages (0-100)
  const diff = baseline - current;

  if (diff > 5) {
    return {
      label: 'Improving',
      icon: <TrendingDown className="w-4 h-4" />,
      colorClass: 'text-emerald-400',
    };
  } else if (diff < -5) {
    return {
      label: 'Worsening',
      icon: <TrendingUp className="w-4 h-4" />,
      colorClass: 'text-red-400',
    };
  } else {
    return {
      label: 'Stable',
      icon: <ArrowRight className="w-4 h-4" />,
      colorClass: 'text-amber-400',
    };
  }
}

function InterventionCard({ intervention, schoolId, currentRiskScore }: InterventionCardProps) {
  const { dosage, isLoading: dosageLoading } = useInterventionDosage(schoolId, intervention.id);

  // Get compliance rate from dosage data or intervention progress
  const complianceRate = dosage?.metrics?.compliance?.dosageComplianceRate ?? null;
  const complianceStatus = getComplianceStatus(complianceRate);

  // Calculate trajectory based on intervention baseline vs current
  const baseline = intervention.baseline_value ?? null;
  const current = intervention.current_value ?? currentRiskScore ?? null;
  const trajectory = getTrajectory(baseline, current);

  const isActive = intervention.status === 'in_progress' || intervention.status === 'planned';

  return (
    <div
      id={`intervention-${intervention.id}`}
      className={cn(
        'p-3 rounded-lg border bg-slate-800/50',
        isActive ? 'border-slate-600' : 'border-slate-700/50 opacity-70'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-200 truncate">
            {intervention.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5"
            >
              {formatInterventionType(intervention.type)}
            </Badge>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(intervention.start_date)}
            </span>
          </div>
        </div>
        <Badge
          className={cn(
            'text-[10px]',
            intervention.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
            intervention.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
            intervention.status === 'planned' ? 'bg-amber-500/20 text-amber-400' :
            'bg-slate-500/20 text-slate-400'
          )}
        >
          {intervention.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Dosage Compliance */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase">Dosage</span>
          <div className="flex items-center gap-1.5">
            {dosageLoading ? (
              <div className="h-5 w-12 bg-slate-700 rounded animate-pulse" />
            ) : (
              <>
                <span className={cn(
                  'text-sm font-bold',
                  complianceStatus.color === 'emerald' ? 'text-emerald-400' :
                  complianceStatus.color === 'amber' ? 'text-amber-400' :
                  complianceStatus.color === 'red' ? 'text-red-400' :
                  'text-slate-400'
                )}>
                  {formatComplianceRate(complianceRate)}
                </span>
              </>
            )}
          </div>
          {complianceRate !== null && (
            <Progress
              value={complianceRate * 100}
              className="h-1"
            />
          )}
        </div>

        {/* Risk Score Change */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase">Risk Change</span>
          <div className="flex items-center gap-1 text-sm">
            {baseline !== null ? (
              <>
                <span className="text-slate-400">{baseline.toFixed(0)}</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className={cn(
                  'font-bold',
                  current !== null && current < baseline ? 'text-emerald-400' :
                  current !== null && current > baseline ? 'text-red-400' :
                  'text-slate-300'
                )}>
                  {current !== null ? current.toFixed(0) : '--'}
                </span>
              </>
            ) : (
              <span className="text-slate-500">--</span>
            )}
          </div>
        </div>

        {/* Trajectory */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-500 uppercase">Trajectory</span>
          <div className={cn('flex items-center gap-1 text-sm font-medium', trajectory.colorClass)}>
            {trajectory.icon}
            <span>{trajectory.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterventionsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="p-3 rounded-lg border border-slate-700 bg-slate-800/50">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-700 rounded" />
              <div className="h-3 w-24 bg-slate-700 rounded" />
            </div>
            <div className="h-5 w-16 bg-slate-700 rounded" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="space-y-1">
                <div className="h-3 w-12 bg-slate-700 rounded" />
                <div className="h-5 w-16 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyInterventions() {
  return (
    <div className="py-6 text-center">
      <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
      <p className="text-sm text-slate-400">No interventions assigned yet.</p>
    </div>
  );
}

export function InterventionEffectiveness({
  schoolId,
  studentId,
  currentRiskScore,
  className,
}: InterventionEffectivenessProps) {
  const { interventions, isLoading, error } = useStudentInterventions(schoolId, studentId);

  // Sort interventions: active first, then by start date
  const sortedInterventions = React.useMemo(() => {
    if (!interventions) return [];
    return [...interventions].sort((a, b) => {
      // Active status first
      const statusOrder = { in_progress: 0, planned: 1, completed: 2, cancelled: 3 };
      const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] ?? 4) -
                        (statusOrder[b.status as keyof typeof statusOrder] ?? 4);
      if (statusDiff !== 0) return statusDiff;

      // Then by start date (newest first)
      const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
      return bDate - aDate;
    });
  }, [interventions]);

  return (
    <Card className={cn('bg-slate-800/30 border-slate-700', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <CardTitle className="text-base">Intervention Effectiveness</CardTitle>
          </div>
          {sortedInterventions.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {sortedInterventions.filter(i => i.status === 'in_progress').length} active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <InterventionsSkeleton />
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-sm text-red-400">Failed to load interventions</p>
          </div>
        ) : sortedInterventions.length === 0 ? (
          <EmptyInterventions />
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {sortedInterventions.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                schoolId={schoolId}
                currentRiskScore={currentRiskScore}
              />
            ))}
          </div>
        )}

        {/* Link to interventions hub */}
        {sortedInterventions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-700">
            <Link
              href={`#`}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              View all in Interventions Hub
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InterventionEffectiveness;
