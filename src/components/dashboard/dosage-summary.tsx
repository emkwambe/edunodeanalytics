'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDosageSummary, formatComplianceRate, getComplianceStatus } from '@/lib/hooks/use-dosage';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';
import type { InferenceFlag } from '@/lib/dosage/types';

/**
 * Dosage Summary Component
 *
 * Shows intervention dosage compliance summary for the school:
 * - Total active interventions
 * - Average compliance %
 * - Average fidelity %
 * - Top 5 interventions with dosage issues
 */

interface DosageSummaryProps {
  schoolId: string | null;
  schoolSlug: string;
  maxIssues?: number;
}

export function DosageSummary({ schoolId, schoolSlug, maxIssues = 5 }: DosageSummaryProps) {
  const { summary, isLoading, error } = useDosageSummary(schoolId);

  if (isLoading) {
    return <DosageSummarySkeleton />;
  }

  if (error || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Dosage Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            No dosage data available. Start tracking intervention sessions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const complianceStatus = getComplianceStatus(summary.averageCompletionRate);
  const fidelityStatus = getComplianceStatus(summary.averageFidelityScore);

  // Get top issues from flagged interventions
  const topIssues: Array<{
    studentName: string;
    interventionTitle: string;
    interventionId: string;
    flag: InferenceFlag;
  }> = [];

  for (const intervention of summary.flaggedInterventions) {
    for (const flag of intervention.flags) {
      topIssues.push({
        studentName: intervention.studentName,
        interventionTitle: intervention.interventionTitle || 'Intervention',
        interventionId: intervention.interventionId,
        flag,
      });
      if (topIssues.length >= maxIssues) break;
    }
    if (topIssues.length >= maxIssues) break;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Dosage Compliance
          </CardTitle>
          <Badge className="bg-slate-700 text-slate-300 text-xs">
            {summary.totalInterventions} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Avg Compliance</span>
              <ComplianceIndicator status={complianceStatus.color} />
            </div>
            <div className="text-xl font-bold text-white">
              {formatComplianceRate(summary.averageCompletionRate)}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Avg Fidelity</span>
              <ComplianceIndicator status={fidelityStatus.color} />
            </div>
            <div className="text-xl font-bold text-white">
              {formatComplianceRate(summary.averageFidelityScore)}
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">On Track: {summary.onTrackCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-400">Behind: {summary.behindCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-400">Critical: {summary.criticalCount}</span>
          </div>
        </div>

        {/* Top Issues */}
        {topIssues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-slate-400 uppercase">
              Top Issues
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {topIssues.map((issue, i) => (
                <DosageIssueItem
                  key={`${issue.interventionId}-${i}`}
                  studentName={issue.studentName}
                  interventionTitle={issue.interventionTitle}
                  flag={issue.flag}
                  schoolSlug={schoolSlug}
                  interventionId={issue.interventionId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {topIssues.length === 0 && summary.totalInterventions > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">
              All interventions are on track!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual dosage issue item
 */
function DosageIssueItem({
  studentName,
  interventionTitle,
  flag,
  schoolSlug,
  interventionId,
}: {
  studentName: string;
  interventionTitle: string;
  flag: InferenceFlag;
  schoolSlug: string;
  interventionId: string;
}) {
  const severityColors = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  };

  const severityIcons = {
    critical: <XCircle className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
    info: <Clock className="w-3 h-3" />,
  };

  return (
    <a
      href={`/${schoolSlug}/interventions/${interventionId}`}
      className={cn(
        'block p-2 rounded-lg border transition hover:bg-slate-800/50',
        severityColors[flag.severity]
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{severityIcons[flag.severity]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {studentName}
            </span>
            <Badge className="text-[10px] bg-slate-700/50 text-slate-300">
              {interventionTitle}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            {flag.message}
          </p>
        </div>
      </div>
    </a>
  );
}

/**
 * Compliance status indicator dot
 */
function ComplianceIndicator({ status }: { status: 'emerald' | 'amber' | 'red' | 'slate' }) {
  const colors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    slate: 'bg-slate-500',
  };

  return <div className={cn('w-2 h-2 rounded-full', colors[status])} />;
}

/**
 * Loading skeleton
 */
export function DosageSummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-700 animate-pulse" />
            <div className="w-32 h-5 rounded bg-slate-700 animate-pulse" />
          </div>
          <div className="w-16 h-5 rounded bg-slate-700 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-800/50">
              <div className="w-20 h-3 rounded bg-slate-700 animate-pulse mb-2" />
              <div className="w-12 h-6 rounded bg-slate-700 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-2 rounded-lg bg-slate-800/30">
              <div className="w-full h-4 rounded bg-slate-700 animate-pulse mb-1" />
              <div className="w-3/4 h-3 rounded bg-slate-700 animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
