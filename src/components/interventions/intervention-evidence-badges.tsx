'use client';

/**
 * Intervention Evidence Badges
 * ============================
 *
 * Sprint 5D: Badges for intervention cards showing evidence of response.
 *
 * Includes:
 * - Risk driver badge (primary risk category)
 * - Dosage compliance badge (green/amber/red)
 * - Trajectory indicator (improving/stable/worsening)
 */

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CalendarOff,
  BookOpen,
  AlertTriangle,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from 'lucide-react';

export interface EvidenceData {
  riskDriver?: 'attendance' | 'academic' | 'behavior' | 'multiple' | null;
  dosageCompliance?: number;
  trajectory?: 'improving' | 'stable' | 'worsening';
}

/**
 * Risk Driver Badge
 */
export function RiskDriverBadge({
  driver,
  className,
}: {
  driver: 'attendance' | 'academic' | 'behavior' | 'multiple' | null;
  className?: string;
}) {
  if (!driver) return null;

  const config = {
    attendance: {
      label: 'Attendance',
      icon: CalendarOff,
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    academic: {
      label: 'Academic',
      icon: BookOpen,
      color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
    behavior: {
      label: 'Behavior',
      icon: AlertTriangle,
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
    multiple: {
      label: 'Multiple',
      icon: Brain,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
  };

  const driverConfig = config[driver];
  const Icon = driverConfig.icon;

  return (
    <Badge className={cn('text-[10px] gap-1 border', driverConfig.color, className)}>
      <Icon className="w-3 h-3" />
      {driverConfig.label}
    </Badge>
  );
}

/**
 * Dosage Compliance Badge
 */
export function DosageComplianceBadge({
  compliance,
  className,
}: {
  compliance: number;
  className?: string;
}) {
  const percent = Math.round(compliance * 100);

  let color: string;
  if (compliance >= 0.8) {
    color = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  } else if (compliance >= 0.6) {
    color = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  } else {
    color = 'bg-red-500/20 text-red-400 border-red-500/30';
  }

  return (
    <Badge className={cn('text-[10px] gap-1 border', color, className)}>
      <Activity className="w-3 h-3" />
      {percent}% dosage
    </Badge>
  );
}

/**
 * Trajectory Indicator
 */
export function TrajectoryIndicator({
  trajectory,
  className,
}: {
  trajectory: 'improving' | 'stable' | 'worsening';
  className?: string;
}) {
  const config = {
    improving: {
      icon: TrendingUp,
      color: 'text-emerald-400',
      label: 'Improving',
    },
    stable: {
      icon: Minus,
      color: 'text-slate-400',
      label: 'Stable',
    },
    worsening: {
      icon: TrendingDown,
      color: 'text-red-400',
      label: 'Declining',
    },
  };

  const trajConfig = config[trajectory];
  const Icon = trajConfig.icon;

  return (
    <div className={cn('flex items-center gap-1', trajConfig.color, className)}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{trajConfig.label}</span>
    </div>
  );
}

/**
 * Combined Evidence of Response section for intervention cards
 */
export function EvidenceOfResponse({
  data,
  compact = false,
  className,
}: {
  data: EvidenceData;
  compact?: boolean;
  className?: string;
}) {
  const { riskDriver, dosageCompliance, trajectory } = data;

  const hasData = riskDriver || dosageCompliance !== undefined || trajectory;

  if (!hasData) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        {riskDriver && <RiskDriverBadge driver={riskDriver} />}
        {dosageCompliance !== undefined && <DosageComplianceBadge compliance={dosageCompliance} />}
        {trajectory && <TrajectoryIndicator trajectory={trajectory} />}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg', className)}>
      <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">
        Evidence
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {riskDriver && <RiskDriverBadge driver={riskDriver} />}
        {dosageCompliance !== undefined && <DosageComplianceBadge compliance={dosageCompliance} />}
        {trajectory && <TrajectoryIndicator trajectory={trajectory} />}
      </div>
    </div>
  );
}
