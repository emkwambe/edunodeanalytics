'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRightLeft,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeMobilityEvent, type MobilityEvent } from '@/lib/analytics/purpose-driven-metrics';
import { type MobilityRecord } from '@/lib/data/seed-data';

/**
 * Mobility Events Component
 *
 * Tracks student transfers and enrollment changes, showing how mobility
 * affects data sufficiency and analytics reliability.
 *
 * Students who transfer mid-year have less data, impacting the
 * reliability of growth projections and intervention recommendations.
 */

export interface MobilityEventsProps {
  /** Student's mobility record */
  mobilityRecord: MobilityRecord;
  /** Student's full name */
  studentName?: string;
  /** Whether to show the full detail view */
  expanded?: boolean;
}

export function MobilityEvents({
  mobilityRecord,
  studentName,
  expanded = false,
}: MobilityEventsProps) {
  const mobilityEvent = useMemo(
    () =>
      analyzeMobilityEvent(
        mobilityRecord.enrollmentDate,
        mobilityRecord.exitDate || null
      ),
    [mobilityRecord]
  );

  const dataSufficiencyColor = {
    minimal: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    moderate: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    significant: 'text-red-400 bg-red-500/20 border-red-500/30',
  };

  const dataSufficiencyLabel = {
    minimal: 'Full Data Coverage',
    moderate: 'Partial Data',
    significant: 'Limited Data',
  };

  const dataSufficiencyIcon = {
    minimal: CheckCircle,
    moderate: AlertTriangle,
    significant: AlertTriangle,
  };

  const Icon = dataSufficiencyIcon[mobilityEvent.dataSufficiencyImpact];

  if (!expanded) {
    // Compact view
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <div className="p-2 rounded-lg bg-slate-700/50">
          <Building2 className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400">Enrolled</div>
          <div className="text-sm font-medium text-slate-200">
            {mobilityRecord.daysEnrolled} days
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px]',
            dataSufficiencyColor[mobilityEvent.dataSufficiencyImpact]
          )}
        >
          <Icon className="w-3 h-3 mr-1" />
          {dataSufficiencyLabel[mobilityEvent.dataSufficiencyImpact]}
        </Badge>
      </div>
    );
  }

  // Expanded view
  return (
    <Card className="bg-slate-800/30 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <CardTitle className="text-sm">Mobility History</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={cn(dataSufficiencyColor[mobilityEvent.dataSufficiencyImpact])}
          >
            <Icon className="w-3 h-3 mr-1" />
            {dataSufficiencyLabel[mobilityEvent.dataSufficiencyImpact]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline */}
        <div className="relative pl-4 border-l-2 border-slate-700 space-y-4">
          {/* Enrollment Event */}
          <div className="relative">
            <div className="absolute -left-[1.35rem] w-3 h-3 rounded-full bg-emerald-500" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                {mobilityRecord.enrollmentDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div className="text-sm font-medium text-slate-200">
                Enrolled at current school
              </div>
              {mobilityRecord.previousSchool && (
                <div className="text-xs text-slate-400">
                  Transferred from: {mobilityRecord.previousSchool}
                </div>
              )}
            </div>
          </div>

          {/* Exit Event (if applicable) */}
          {mobilityRecord.exitDate && (
            <div className="relative">
              <div className="absolute -left-[1.35rem] w-3 h-3 rounded-full bg-amber-500" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {mobilityRecord.exitDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Exited school
                </div>
                {mobilityRecord.newSchool && (
                  <div className="text-xs text-slate-400">
                    Transferred to: {mobilityRecord.newSchool}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current status */}
          {!mobilityRecord.exitDate && (
            <div className="relative">
              <div className="absolute -left-[1.35rem] w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  Currently
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Active enrollment ({mobilityRecord.daysEnrolled} days)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Sufficiency Warning */}
        {mobilityEvent.dataSufficiencyImpact !== 'minimal' && (
          <div
            className={cn(
              'mt-4 p-3 rounded-lg border',
              mobilityEvent.dataSufficiencyImpact === 'moderate'
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-red-500/10 border-red-500/20'
            )}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className={cn(
                  'w-4 h-4 mt-0.5',
                  mobilityEvent.dataSufficiencyImpact === 'moderate'
                    ? 'text-amber-400'
                    : 'text-red-400'
                )}
              />
              <div>
                <p
                  className={cn(
                    'text-xs font-medium',
                    mobilityEvent.dataSufficiencyImpact === 'moderate'
                      ? 'text-amber-300'
                      : 'text-red-300'
                  )}
                >
                  {mobilityEvent.dataSufficiencyImpact === 'moderate'
                    ? 'Limited Diagnostic Window'
                    : 'Insufficient Data for Growth Analysis'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {mobilityEvent.dataSufficiencyImpact === 'moderate'
                    ? `${studentName || 'This student'} has been enrolled for ${mobilityEvent.daysEnrolled} days. At least 45 days needed for reliable growth projections.`
                    : `${studentName || 'This student'} has been enrolled for only ${mobilityEvent.daysEnrolled} days. Growth metrics and interventions should be interpreted with caution.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enrollment Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-slate-900/50">
            <div className="text-2xl font-bold text-slate-200">
              {mobilityRecord.daysEnrolled}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Days Enrolled
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-900/50">
            <div className="text-2xl font-bold text-slate-200">
              {Math.ceil(mobilityRecord.daysEnrolled / 7)}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Weeks
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Mobility Warning Badge
 *
 * A small badge indicating mobility-related data sufficiency concerns
 */
export function MobilityWarningBadge({
  daysEnrolled,
  thresholdDays = 45,
}: {
  daysEnrolled: number;
  thresholdDays?: number;
}) {
  if (daysEnrolled >= thresholdDays * 2) {
    return null; // No warning needed
  }

  const isCritical = daysEnrolled < thresholdDays;

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px]',
        isCritical
          ? 'border-red-500/50 text-red-400'
          : 'border-amber-500/50 text-amber-400'
      )}
    >
      <Building2 className="w-3 h-3 mr-1" />
      {daysEnrolled}d enrolled
    </Badge>
  );
}
