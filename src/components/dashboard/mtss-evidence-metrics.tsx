'use client';

/**
 * MTSS Evidence Metrics Component
 * ================================
 *
 * Reusable component for displaying MTSS evidence metrics.
 * Supports 3 variants:
 *   - operational: Full dashboard view for Pulse (admin daily use)
 *   - summary: Read-only view for Authorizer dashboards
 *   - compact: Inline stats for embedding in other pages
 *
 * Sprint 5A - Foundation component for all MTSS dashboards.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { MetricCard, MetricCardSkeleton } from './metric-card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  useMtssSummary,
  isMtssSummaryEmpty,
  getResponseRateVariant,
  getDosageComplianceVariant,
  getImprovementRateVariant,
} from '@/lib/hooks/use-mtss-summary';
import { AlertTriangle, Users, Clock, Target, TrendingUp } from 'lucide-react';

export interface MTSSEvidenceMetricsProps {
  schoolId: string;
  variant?: 'operational' | 'summary' | 'compact';
  className?: string;
  /** School name for summary variant sentence */
  schoolName?: string;
}

/**
 * Loading skeleton matching the variant layout
 */
function MTSSLoadingSkeleton({
  variant,
  className,
}: {
  variant: 'operational' | 'summary' | 'compact';
  className?: string;
}) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-6', className)}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse flex items-center gap-2">
            <div className="h-5 w-12 bg-slate-700 rounded" />
            <div className="h-4 w-16 bg-slate-700/50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Operational and Summary variants use same card layout
  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      {variant === 'summary' && (
        <div className="animate-pulse">
          <div className="h-4 w-full bg-slate-700/50 rounded mb-2" />
          <div className="h-4 w-3/4 bg-slate-700/50 rounded" />
        </div>
      )}
    </div>
  );
}

/**
 * Operational variant - for Pulse dashboard (daily admin use)
 */
function OperationalVariant({
  data,
  schoolId,
  className,
}: {
  data: NonNullable<ReturnType<typeof useMtssSummary>['data']>;
  schoolId: string;
  className?: string;
}) {
  const responseRateVariant = getResponseRateVariant(data.response_rate);
  const dosageVariant = getDosageComplianceVariant(data.avg_dosage_compliance);
  const improvementVariant = getImprovementRateVariant(data.improvement_rate);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 4 metric cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Students Identified"
          value={data.students_identified}
          format="number"
          icon={<Users className="w-4 h-4" />}
          subtitle={`${data.period}`}
        />
        <MetricCard
          title="Response Rate"
          value={data.response_rate}
          format="percent"
          variant={responseRateVariant}
          icon={<Clock className="w-4 h-4" />}
          subtitle={`Avg ${data.avg_time_to_action_days.toFixed(1)} days to action`}
        />
        <MetricCard
          title="Dosage Compliance"
          value={data.avg_dosage_compliance}
          format="percent"
          variant={dosageVariant}
          icon={<Target className="w-4 h-4" />}
          subtitle={`${data.total_active_interventions} active interventions`}
        />
        <MetricCard
          title="Improvement Rate"
          value={data.improvement_rate}
          format="percent"
          variant={improvementVariant}
          icon={<TrendingUp className="w-4 h-4" />}
          subtitle={`${data.students_improved} improved`}
        />
      </div>

      {/* Alert for students flagged with no intervention */}
      {data.students_flagged_no_intervention > 0 && (
        <Card className="p-4 border-amber-500/50 bg-amber-500/10">
          <a
            href={`/dashboard/schools/${schoolId}/early-warning`}
            className="flex items-center gap-3 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">
              {data.students_flagged_no_intervention} student
              {data.students_flagged_no_intervention !== 1 ? 's' : ''} flagged
              with no active intervention
            </span>
            <span className="text-xs text-amber-500 ml-auto">
              View in Early Warning &rarr;
            </span>
          </a>
        </Card>
      )}
    </div>
  );
}

/**
 * Summary variant - for Authorizer dashboards (read-only evidence)
 */
function SummaryVariant({
  data,
  schoolName,
  className,
}: {
  data: NonNullable<ReturnType<typeof useMtssSummary>['data']>;
  schoolName?: string;
  className?: string;
}) {
  const responseRateVariant = getResponseRateVariant(data.response_rate);
  const dosageVariant = getDosageComplianceVariant(data.avg_dosage_compliance);
  const improvementVariant = getImprovementRateVariant(data.improvement_rate);

  // Auto-generated summary sentence
  const summaryText = `This year, ${schoolName || 'this school'} identified ${
    data.students_identified
  } student${data.students_identified !== 1 ? 's' : ''} requiring additional support. ${Math.round(
    data.response_rate * 100
  )}% received targeted intervention within ${data.avg_time_to_action_days.toFixed(
    1
  )} days on average, with ${Math.round(data.improvement_rate * 100)}% showing measurable improvement.`;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 4 metric cards - no hover effects for clean export */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Students Identified"
          value={data.students_identified}
          format="number"
          icon={<Users className="w-4 h-4" />}
          className="hover:shadow-none cursor-default"
        />
        <MetricCard
          title="Response Rate"
          value={data.response_rate}
          format="percent"
          variant={responseRateVariant}
          icon={<Clock className="w-4 h-4" />}
          className="hover:shadow-none cursor-default"
        />
        <MetricCard
          title="Dosage Compliance"
          value={data.avg_dosage_compliance}
          format="percent"
          variant={dosageVariant}
          icon={<Target className="w-4 h-4" />}
          className="hover:shadow-none cursor-default"
        />
        <MetricCard
          title="Improvement Rate"
          value={data.improvement_rate}
          format="percent"
          variant={improvementVariant}
          icon={<TrendingUp className="w-4 h-4" />}
          className="hover:shadow-none cursor-default"
        />
      </div>

      {/* Summary sentence */}
      <p className="text-sm text-slate-400 leading-relaxed px-1">{summaryText}</p>
    </div>
  );
}

/**
 * Compact variant - for embedding in other pages
 */
function CompactVariant({
  data,
  className,
}: {
  data: NonNullable<ReturnType<typeof useMtssSummary>['data']>;
  className?: string;
}) {
  const responseRateVariant = getResponseRateVariant(data.response_rate);
  const dosageVariant = getDosageComplianceVariant(data.avg_dosage_compliance);
  const improvementVariant = getImprovementRateVariant(data.improvement_rate);

  const variantColors = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-x-6 gap-y-2', className)}>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-slate-200">
          {data.students_identified}
        </span>
        <span className="text-xs text-slate-500">Identified</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-lg font-semibold',
            variantColors[responseRateVariant]
          )}
        >
          {Math.round(data.response_rate * 100)}%
        </span>
        <span className="text-xs text-slate-500">Response</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn('text-lg font-semibold', variantColors[dosageVariant])}
        >
          {Math.round(data.avg_dosage_compliance * 100)}%
        </span>
        <span className="text-xs text-slate-500">Dosage</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-lg font-semibold',
            variantColors[improvementVariant]
          )}
        >
          {Math.round(data.improvement_rate * 100)}%
        </span>
        <span className="text-xs text-slate-500">Improved</span>
      </div>
    </div>
  );
}

/**
 * MTSS Evidence Metrics Component
 *
 * Displays MTSS evidence metrics in 3 variants:
 * - operational: Full dashboard for admin daily use (Pulse)
 * - summary: Read-only view for Authorizer dashboards
 * - compact: Inline stats for embedding
 */
export function MTSSEvidenceMetrics({
  schoolId,
  variant = 'operational',
  className,
  schoolName,
}: MTSSEvidenceMetricsProps) {
  const { data, isLoading, error } = useMtssSummary(schoolId);

  // Loading state
  if (isLoading) {
    return <MTSSLoadingSkeleton variant={variant} className={className} />;
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        title="Unable to load MTSS metrics"
        description="There was a problem loading the MTSS evidence metrics. Please try again."
        variant="inline"
        className={className}
      />
    );
  }

  // Empty state - all values are zero
  if (isMtssSummaryEmpty(data)) {
    return (
      <EmptyState
        icon={Users}
        title="No MTSS data yet"
        description="Risk evaluations will populate these metrics once students are identified."
        variant={variant === 'compact' ? 'inline' : 'card'}
        className={className}
      />
    );
  }

  // Render appropriate variant
  if (!data) return null;

  switch (variant) {
    case 'operational':
      return (
        <OperationalVariant
          data={data}
          schoolId={schoolId}
          className={className}
        />
      );
    case 'summary':
      return (
        <SummaryVariant
          data={data}
          schoolName={schoolName}
          className={className}
        />
      );
    case 'compact':
      return <CompactVariant data={data} className={className} />;
    default:
      return (
        <OperationalVariant
          data={data}
          schoolId={schoolId}
          className={className}
        />
      );
  }
}
