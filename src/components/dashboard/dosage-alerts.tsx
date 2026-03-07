'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDosageAlerts } from '@/lib/hooks/use-dosage';
import {
  Bell,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Users,
  Calendar,
  Activity,
} from 'lucide-react';
import type { InferenceSeverity } from '@/lib/dosage/types';

/**
 * Dosage Alerts Component
 *
 * Shows dosage-specific alerts based on inference rules:
 * - chronic_no_show
 * - critically_behind
 * - declining_attendance
 * - low_fidelity
 * etc.
 */

interface DosageAlertsProps {
  schoolId: string | null;
  schoolSlug: string;
  maxItems?: number;
  onViewAll?: () => void;
}

export function DosageAlerts({
  schoolId,
  schoolSlug,
  maxItems = 5,
  onViewAll,
}: DosageAlertsProps) {
  const { alerts, total, isLoading, error } = useDosageAlerts(schoolId, {
    limit: maxItems,
  });

  if (isLoading) {
    return <DosageAlertsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Dosage Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            Unable to load dosage alerts.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Count by severity
  const criticalCount = alerts.filter((a) => a.flag.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.flag.severity === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Dosage Alerts
          </CardTitle>
          {total > 0 && (
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <Badge className="bg-red-500/20 text-red-400 text-xs">
                  {criticalCount} Critical
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                  {warningCount} Warning
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm text-slate-400">
              No dosage alerts at this time.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Interventions are being delivered as planned.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <DosageAlertItem
                key={`${alert.interventionId}-${alert.flag.rule}-${i}`}
                alert={alert}
                schoolSlug={schoolSlug}
              />
            ))}

            {total > maxItems && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-400 hover:text-white"
                onClick={onViewAll}
              >
                View All {total} Alerts
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual alert item
 */
function DosageAlertItem({
  alert,
  schoolSlug,
}: {
  alert: {
    interventionId: string;
    studentName: string;
    interventionTitle: string;
    flag: {
      rule: string;
      severity: InferenceSeverity;
      message: string;
      detectedAt: string;
    };
  };
  schoolSlug: string;
}) {
  const severityConfig = {
    critical: {
      icon: <XCircle className="w-4 h-4" />,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      badgeBg: 'bg-red-500/20',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4" />,
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/20',
    },
    info: {
      icon: <Clock className="w-4 h-4" />,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/20',
    },
  };

  const config = severityConfig[alert.flag.severity];

  // Format rule name for display
  const ruleLabels: Record<string, string> = {
    chronic_no_show: 'Chronic No-Show',
    declining_attendance: 'Attendance Declining',
    low_fidelity: 'Low Fidelity',
    declining_fidelity: 'Fidelity Declining',
    behind_schedule: 'Behind Schedule',
    critically_behind: 'Critically Behind',
    low_engagement: 'Low Engagement',
    cancelled_streak: 'Cancelled Streak',
    missing_sessions: 'Missing Sessions',
    dosage_gap: 'Dosage Gap',
  };

  return (
    <Link
      href={`/${schoolSlug}/interventions/${alert.interventionId}`}
      className={cn(
        'block p-3 rounded-lg border transition',
        config.bgColor,
        config.borderColor,
        'hover:bg-slate-800/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', config.textColor)}>{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">
              {alert.studentName}
            </span>
            <Badge className={cn('text-[10px]', config.badgeBg, config.textColor)}>
              {ruleLabels[alert.flag.rule] || alert.flag.rule}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {alert.flag.message}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {alert.interventionTitle}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(alert.flag.detectedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0" />
      </div>
    </Link>
  );
}

/**
 * Loading skeleton
 */
export function DosageAlertsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-700 animate-pulse" />
            <div className="w-24 h-5 rounded bg-slate-700 animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg bg-slate-800/30">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-slate-700 animate-pulse mt-0.5" />
              <div className="flex-1">
                <div className="w-32 h-4 rounded bg-slate-700 animate-pulse mb-2" />
                <div className="w-full h-3 rounded bg-slate-700 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
