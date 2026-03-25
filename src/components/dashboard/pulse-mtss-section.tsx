'use client';

/**
 * Pulse Dashboard MTSS Section
 * ============================
 *
 * Client component that renders the MTSS evidence metrics, action alert,
 * and "This Week" activity summary on the Pulse Dashboard.
 *
 * Sprint 5B - Adds MTSS operational metrics to daily principal view.
 */

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MTSSEvidenceMetrics } from './mtss-evidence-metrics';
import { useSchoolBySlug } from '@/lib/hooks/use-school-context';
import { useMtssSummary } from '@/lib/hooks/use-mtss-summary';
import { useMtssWeekly, isMtssWeeklyEmpty } from '@/lib/hooks/use-mtss-weekly';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Sparkles,
  TrendingUp,
  TrendingDown,
  CalendarDays,
} from 'lucide-react';

export interface PulseMtssSectionProps {
  schoolSlug: string;
  className?: string;
}

/**
 * Loading skeleton for the action alert card
 */
function ActionAlertSkeleton() {
  return (
    <Card className="animate-pulse border-l-4 border-l-slate-700">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-slate-700 rounded" />
            <div className="h-3 w-32 bg-slate-700/50 rounded" />
          </div>
          <div className="h-8 w-32 bg-slate-700 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for the weekly summary card
 */
function WeeklySummarySkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-5 w-24 bg-slate-700 rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-4 bg-slate-700 rounded" />
            <div className="h-4 flex-1 bg-slate-700/50 rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * "Needs Immediate Action" alert card
 * Only renders when students_flagged_no_intervention > 0
 */
function NeedsImmediateActionAlert({
  count,
  schoolSlug,
}: {
  count: number;
  schoolSlug: string;
}) {
  if (count === 0) return null;

  return (
    <Card className="border-l-4 border-l-red-500 bg-red-500/5">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-400">
              {count} student{count !== 1 ? 's' : ''} flagged with no active intervention
            </p>
            <p className="text-sm text-slate-400">
              Immediate action recommended
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            <Link href={`/${schoolSlug}/dashboard/early-warning`}>
              View in Early Warning
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * "This Week" activity summary card
 */
function ThisWeekSummary({
  schoolSlug,
  schoolId,
}: {
  schoolSlug: string;
  schoolId: string;
}) {
  const { data, isLoading, error } = useMtssWeekly(schoolId);

  if (isLoading) {
    return <WeeklySummarySkeleton />;
  }

  // Don't show on error - graceful degradation
  if (error) {
    return null;
  }

  const isEmpty = isMtssWeeklyEmpty(data);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex items-center gap-3 text-slate-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">No new alerts this week</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* New risk alerts */}
            {data && data.new_risk_alerts > 0 && (
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-slate-300">
                  <span className="font-medium text-amber-400">
                    {data.new_risk_alerts}
                  </span>{' '}
                  new risk alert{data.new_risk_alerts !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Interventions created */}
            {data && data.interventions_created > 0 && (
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-300">
                  <span className="font-medium text-cyan-400">
                    {data.interventions_created}
                  </span>{' '}
                  intervention{data.interventions_created !== 1 ? 's' : ''} created
                </span>
              </div>
            )}

            {/* Students who changed risk level */}
            {data && (data.students_improved > 0 || data.students_worsened > 0) && (
              <div className="flex items-center gap-3">
                {data.students_improved > data.students_worsened ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className="text-sm text-slate-300">
                  {data.students_improved > 0 && (
                    <>
                      <span className="font-medium text-emerald-400">
                        {data.students_improved}
                      </span>{' '}
                      improved
                    </>
                  )}
                  {data.students_improved > 0 && data.students_worsened > 0 && ', '}
                  {data.students_worsened > 0 && (
                    <>
                      <span className="font-medium text-red-400">
                        {data.students_worsened}
                      </span>{' '}
                      worsened
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Link to early warning for more details */}
            <div className="pt-2">
              <Link
                href={`/${schoolSlug}/dashboard/early-warning`}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View details in Early Warning &rarr;
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Pulse Dashboard MTSS Section
 *
 * Renders above existing Pulse page content:
 * 1. MTSS Evidence Metrics (operational variant)
 * 2. Needs Immediate Action alert (if applicable)
 * 3. This Week activity summary
 */
export function PulseMtssSection({ schoolSlug, className }: PulseMtssSectionProps) {
  // Get school ID from slug
  const { schoolId, isLoading: schoolLoading } = useSchoolBySlug(schoolSlug);

  // Fetch MTSS summary to get students_flagged_no_intervention for the action alert
  const { data: mtssSummary, isLoading: summaryLoading } = useMtssSummary(schoolId);

  const isLoading = schoolLoading || !schoolId;

  return (
    <div className={cn('space-y-4 mb-6', className)}>
      {/* MTSS Evidence Metrics - operational variant */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-slate-700 rounded" />
                <div className="h-8 w-32 bg-slate-700 rounded" />
                <div className="h-3 w-20 bg-slate-700 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <MTSSEvidenceMetrics schoolId={schoolId} variant="operational" />
      )}

      {/* Needs Immediate Action Alert */}
      {isLoading || summaryLoading ? (
        <ActionAlertSkeleton />
      ) : (
        <NeedsImmediateActionAlert
          count={mtssSummary?.students_flagged_no_intervention ?? 0}
          schoolSlug={schoolSlug}
        />
      )}

      {/* This Week Activity Summary */}
      {isLoading ? (
        <WeeklySummarySkeleton />
      ) : (
        <ThisWeekSummary schoolSlug={schoolSlug} schoolId={schoolId} />
      )}
    </div>
  );
}

/**
 * Loading skeleton for the entire MTSS section
 * Used when we don't have the school ID yet
 */
export function PulseMtssSectionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 mb-6', className)}>
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-slate-700 rounded" />
              <div className="h-8 w-32 bg-slate-700 rounded" />
              <div className="h-3 w-20 bg-slate-700 rounded" />
            </div>
          </Card>
        ))}
      </div>

      {/* Alert skeleton */}
      <ActionAlertSkeleton />

      {/* Weekly summary skeleton */}
      <WeeklySummarySkeleton />
    </div>
  );
}
