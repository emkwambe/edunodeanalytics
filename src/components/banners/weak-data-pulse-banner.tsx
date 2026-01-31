'use client';

import * as React from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DataPulseAlert } from '@/lib/data/fidelity_monitor';

/**
 * Weak Data Pulse Banner
 * ======================
 *
 * Displays when classrooms have insufficient formative data entry.
 * Links LMS fidelity to Instructional Pulse reliability.
 */

interface WeakDataPulseBannerProps {
  alerts: DataPulseAlert[];
  schoolSlug: string;
  className?: string;
}

export function WeakDataPulseBanner({ alerts, schoolSlug, className }: WeakDataPulseBannerProps) {
  if (alerts.length === 0) return null;

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  return (
    <div
      className={cn(
        'p-5 bg-amber-900/20 border border-amber-500/30 rounded-2xl',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/20 rounded-xl">
          <Activity className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-white">Weak Data Pulse Detected</h3>
          <p className="text-xs text-slate-400">
            {alerts.length} classroom{alerts.length !== 1 ? 's' : ''} below cadence threshold
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {criticalAlerts.length > 0 && (
            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
              {criticalAlerts.length} Critical
            </Badge>
          )}
          {warningAlerts.length > 0 && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              {warningAlerts.length} Warning
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {alerts.slice(0, 3).map((alert, idx) => (
          <div
            key={idx}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl',
              alert.severity === 'critical'
                ? 'bg-rose-900/20 border border-rose-500/20'
                : 'bg-slate-800/50'
            )}
          >
            {alert.severity === 'critical' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-white truncate">
                  {alert.classroom}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 truncate">{alert.teacherName}</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{alert.message}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div
                className={cn(
                  'text-xs font-bold',
                  alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                )}
              >
                {alert.daysSinceLastEntry}d
              </div>
              <div className="text-[10px] text-slate-500">since entry</div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length > 3 && (
        <Link
          href={`/${schoolSlug}/settings/data-fidelity`}
          className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition"
        >
          View all {alerts.length} alerts
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}

      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300">Expert Insight:</strong> Growth predictions for
          classrooms with weak data pulse are unreliable. Focus instructional coaching efforts
          on classrooms with strong data fidelity first.
        </p>
      </div>
    </div>
  );
}
