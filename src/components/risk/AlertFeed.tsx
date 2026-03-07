'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiskAlert } from '@/lib/hooks/use-risk-alerts';
import { getAlertSeverityBadge } from '@/lib/hooks/use-risk-alerts';
import type { AlertSeverity, AlertStatus } from '@/lib/risk-engine/types';

interface AlertFeedProps {
  alerts: RiskAlert[];
  isLoading?: boolean;
  schoolSlug: string;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  className?: string;
  maxItems?: number;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'urgent':
      return (
        <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getStatusBadge(status: AlertStatus): { label: string; className: string } {
  switch (status) {
    case 'new':
      return { label: 'New', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    case 'acknowledged':
      return { label: 'Acknowledged', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    case 'in_review':
      return { label: 'In Review', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    case 'resolved':
      return { label: 'Resolved', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    case 'dismissed':
      return { label: 'Dismissed', className: 'bg-slate-600/20 text-slate-500 border-slate-600/30' };
  }
}

function AlertItem({
  alert,
  schoolSlug,
  onAcknowledge,
  onResolve,
}: {
  alert: RiskAlert;
  schoolSlug: string;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}) {
  const severityBadge = getAlertSeverityBadge(alert.severity);
  const statusBadge = getStatusBadge(alert.status);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div
      className={cn(
        'p-4 border-b border-slate-700/30 last:border-0',
        'hover:bg-slate-800/30 transition-colors',
        alert.status === 'new' && 'bg-slate-800/20'
      )}
    >
      <div className="flex items-start gap-3">
        {getSeverityIcon(alert.severity)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/${schoolSlug}/students/${alert.studentId}`}
              className="font-medium text-slate-200 hover:text-cyan-400 transition-colors"
            >
              {alert.studentName}
            </Link>
            <Badge className={severityBadge.className} size="sm">
              {severityBadge.label}
            </Badge>
            {alert.status !== 'new' && (
              <Badge className={statusBadge.className} size="sm">
                {statusBadge.label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-300 mt-1">{alert.title}</p>
          {isExpanded && alert.message && (
            <p className="text-sm text-slate-400 mt-2">{alert.message}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-500">{getTimeAgo(alert.createdAt)}</span>
            {alert.message && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        </div>
        {alert.status === 'new' && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAcknowledge?.(alert.id)}
              className="text-xs"
            >
              Acknowledge
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResolve?.(alert.id)}
              className="text-xs"
            >
              Resolve
            </Button>
          </div>
        )}
        {alert.status === 'acknowledged' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResolve?.(alert.id)}
            className="text-xs"
          >
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}

export function AlertFeed({
  alerts,
  isLoading,
  schoolSlug,
  onAcknowledge,
  onResolve,
  className,
  maxItems = 10,
}: AlertFeedProps) {
  const displayedAlerts = alerts.slice(0, maxItems);
  const newCount = alerts.filter((a) => a.status === 'new').length;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Recent Alerts</CardTitle>
            {newCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-red-500 text-white rounded-full">
                {newCount}
              </span>
            )}
          </div>
          <Link
            href={`/${schoolSlug}/alerts`}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="divide-y divide-slate-700/30">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-slate-700 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-32" />
                    <div className="h-3 bg-slate-700 rounded w-full" />
                    <div className="h-3 bg-slate-700 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">No alerts at this time</p>
            <p className="text-xs mt-1">All students are on track</p>
          </div>
        ) : (
          displayedAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              schoolSlug={schoolSlug}
              onAcknowledge={onAcknowledge}
              onResolve={onResolve}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function AlertFeedSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-6 w-28 bg-slate-700 rounded" />
          <div className="h-4 w-16 bg-slate-700 rounded" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-700/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-slate-700 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-32" />
                  <div className="h-3 bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-700 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
