'use client';

/**
 * Actionability Tier Section Component
 * =====================================
 *
 * Collapsible section for displaying students grouped by actionability tier.
 * Used on the Early Warning page (Sprint 5C).
 *
 * Tiers:
 * - needs_action: Red accent, students needing immediate intervention
 * - needs_attention: Amber accent, interventions needing attention
 * - improving: Green accent, students responding to intervention
 */

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Plus, Eye, ExternalLink } from 'lucide-react';
import type { TieredStudent } from '@/lib/hooks/use-actionability-tiers';

type TierType = 'needs_action' | 'needs_attention' | 'improving';

interface ActionabilityTierSectionProps {
  tier: TierType;
  students: TieredStudent[];
  schoolSlug: string;
  isLoading?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

const tierConfig: Record<TierType, {
  title: string;
  accentColor: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyPositive?: boolean;
}> = {
  needs_action: {
    title: 'Needs Immediate Action',
    accentColor: 'text-red-400',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    borderClass: 'border-l-red-500',
    bgClass: 'bg-red-500/5',
    emptyTitle: 'All flagged students have active interventions',
    emptyDescription: 'Great work! Every at-risk and critical student is receiving support.',
    emptyPositive: true,
  },
  needs_attention: {
    title: 'Intervention Needs Attention',
    accentColor: 'text-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    borderClass: 'border-l-amber-500',
    bgClass: 'bg-amber-500/5',
    emptyTitle: 'All interventions are on track',
    emptyDescription: 'Dosage compliance is healthy across all active interventions.',
    emptyPositive: false,
  },
  improving: {
    title: 'Responding & Improving',
    accentColor: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    borderClass: 'border-l-emerald-500',
    bgClass: 'bg-emerald-500/5',
    emptyTitle: 'No improving students yet',
    emptyDescription: 'Interventions need time to show results. Check back in a few weeks.',
    emptyPositive: false,
  },
};

function getRiskBadgeVariant(level: string): 'on-track' | 'watch' | 'at-risk' | 'critical' {
  switch (level) {
    case 'on_track': return 'on-track';
    case 'watch': return 'watch';
    case 'at_risk': return 'at-risk';
    case 'critical': return 'critical';
    default: return 'watch';
  }
}

function formatRiskLevel(level: string): string {
  switch (level) {
    case 'on_track': return 'On Track';
    case 'at_risk': return 'At Risk';
    default: return level.charAt(0).toUpperCase() + level.slice(1);
  }
}

/**
 * Student row for Needs Action tier
 */
function NeedsActionRow({ student, schoolSlug }: { student: TieredStudent; schoolSlug: string }) {
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-slate-800/30 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <Link
          href={`/${schoolSlug}/students/${student.studentId}`}
          className="font-medium text-slate-200 hover:text-cyan-400 transition-colors"
        >
          {student.studentName}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500">Grade {student.gradeLevel}</span>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs text-slate-500">{student.daysSinceFlag}d since flag</span>
          {student.topFactors[0] && (
            <>
              <span className="text-xs text-slate-600">|</span>
              <span className="text-xs text-slate-400 truncate max-w-[150px]">
                {student.topFactors[0].name}
              </span>
            </>
          )}
        </div>
      </div>
      <Badge variant={getRiskBadgeVariant(student.riskLevel)}>
        {formatRiskLevel(student.riskLevel)}
      </Badge>
      <div className="text-sm font-mono text-slate-300 w-12 text-right">
        {Math.round(student.riskScore * 100)}
      </div>
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href={`/${schoolSlug}/interventions/new?studentId=${student.studentId}`}>
          <Plus className="w-3.5 h-3.5" />
          Create Intervention
        </Link>
      </Button>
    </div>
  );
}

/**
 * Student row for Needs Attention tier
 */
function NeedsAttentionRow({ student, schoolSlug }: { student: TieredStudent; schoolSlug: string }) {
  const complianceColor = (student.dosageCompliance ?? 0) < 0.6
    ? 'text-red-400'
    : (student.dosageCompliance ?? 0) < 0.8
    ? 'text-amber-400'
    : 'text-emerald-400';

  return (
    <div className="flex items-center gap-4 p-3 hover:bg-slate-800/30 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <Link
          href={`/${schoolSlug}/students/${student.studentId}`}
          className="font-medium text-slate-200 hover:text-cyan-400 transition-colors"
        >
          {student.studentName}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500">Grade {student.gradeLevel}</span>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs text-slate-400 truncate max-w-[150px]">
            {student.activeIntervention?.title}
          </span>
          {student.sessionsMissed > 0 && (
            <>
              <span className="text-xs text-slate-600">|</span>
              <span className="text-xs text-red-400">{student.sessionsMissed} missed</span>
            </>
          )}
        </div>
      </div>
      <Badge variant={getRiskBadgeVariant(student.riskLevel)}>
        {formatRiskLevel(student.riskLevel)}
      </Badge>
      <div className={cn('text-sm font-mono w-16 text-right', complianceColor)}>
        {student.dosageCompliance !== null
          ? `${Math.round(student.dosageCompliance * 100)}%`
          : '--'}
      </div>
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href={`/${schoolSlug}/interventions/${student.activeIntervention?.id}`}>
          <Eye className="w-3.5 h-3.5" />
          View Intervention
        </Link>
      </Button>
    </div>
  );
}

/**
 * Student row for Improving tier
 */
function ImprovingRow({ student, schoolSlug }: { student: TieredStudent; schoolSlug: string }) {
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-slate-800/30 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <Link
          href={`/${schoolSlug}/students/${student.studentId}`}
          className="font-medium text-slate-200 hover:text-cyan-400 transition-colors"
        >
          {student.studentName}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500">Grade {student.gradeLevel}</span>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs text-slate-400 truncate max-w-[150px]">
            {student.activeIntervention?.title}
          </span>
        </div>
      </div>
      {student.previousLevel && (
        <div className="flex items-center gap-1 text-xs">
          <Badge variant={getRiskBadgeVariant(student.previousLevel)} className="text-[10px]">
            {formatRiskLevel(student.previousLevel)}
          </Badge>
          <span className="text-emerald-400">→</span>
          <Badge variant={getRiskBadgeVariant(student.riskLevel)} className="text-[10px]">
            {formatRiskLevel(student.riskLevel)}
          </Badge>
        </div>
      )}
      <div className="text-sm font-mono text-emerald-400 w-16 text-right">
        {student.dosageCompliance !== null
          ? `${Math.round(student.dosageCompliance * 100)}%`
          : '--'}
      </div>
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href={`/${schoolSlug}/students/${student.studentId}`}>
          <ExternalLink className="w-3.5 h-3.5" />
          View Details
        </Link>
      </Button>
    </div>
  );
}

/**
 * Loading skeleton for tier section
 */
function TierSectionSkeleton({ tier }: { tier: TierType }) {
  const config = tierConfig[tier];

  return (
    <Card className={cn('border-l-4 overflow-hidden', config.borderClass)}>
      <CardHeader className={cn('py-3 px-4', config.bgClass)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-slate-700 rounded animate-pulse" />
            <div className="w-40 h-5 bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="w-8 h-5 bg-slate-700 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-700/30">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 p-3">
              <div className="flex-1">
                <div className="w-32 h-4 bg-slate-700 rounded animate-pulse mb-2" />
                <div className="w-48 h-3 bg-slate-700/50 rounded animate-pulse" />
              </div>
              <div className="w-16 h-5 bg-slate-700 rounded animate-pulse" />
              <div className="w-24 h-8 bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state for tier section
 */
function TierEmptyState({ tier }: { tier: TierType }) {
  const config = tierConfig[tier];

  return (
    <div className={cn(
      'p-6 text-center',
      config.emptyPositive ? 'text-emerald-400' : 'text-slate-400'
    )}>
      <p className="font-medium mb-1">{config.emptyTitle}</p>
      <p className="text-sm opacity-75">{config.emptyDescription}</p>
    </div>
  );
}

/**
 * Actionability Tier Section Component
 */
export function ActionabilityTierSection({
  tier,
  students,
  schoolSlug,
  isLoading = false,
  defaultExpanded = true,
  className,
}: ActionabilityTierSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const config = tierConfig[tier];

  if (isLoading) {
    return <TierSectionSkeleton tier={tier} />;
  }

  const StudentRow = {
    needs_action: NeedsActionRow,
    needs_attention: NeedsAttentionRow,
    improving: ImprovingRow,
  }[tier];

  return (
    <Card className={cn('border-l-4 overflow-hidden', config.borderClass, className)}>
      <CardHeader
        className={cn(
          'py-3 px-4 cursor-pointer select-none transition-colors',
          config.bgClass,
          'hover:bg-opacity-75'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className={cn('w-5 h-5', config.accentColor)} />
            ) : (
              <ChevronRight className={cn('w-5 h-5', config.accentColor)} />
            )}
            <h3 className="font-semibold text-slate-200">{config.title}</h3>
            <Badge className={cn('border', config.badgeClass)}>
              {students.length}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {students.length === 0 ? (
            <TierEmptyState tier={tier} />
          ) : (
            <div className="divide-y divide-slate-700/30">
              {students.map(student => (
                <StudentRow
                  key={student.studentId}
                  student={student}
                  schoolSlug={schoolSlug}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export { TierSectionSkeleton as ActionabilityTierSectionSkeleton };
