'use client';

import * as React from 'react';
import { AlertTriangle, ShieldAlert, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * High Confounding Risk Banner
 * ============================
 *
 * Prominent top-level alert for Student 360 views when:
 * - Attendance < 90% AND Growth < 50th percentile
 *
 * Purpose: Prevent teachers from misjudging instructional effectiveness
 * when the data is confounded by external factors (attendance).
 */

interface ConfoundingRiskBannerProps {
  studentName: string;
  attendancePercent: number;
  growthPercentile: number;
  onDismiss?: () => void;
  className?: string;
}

export function ConfoundingRiskBanner({
  studentName,
  attendancePercent,
  growthPercentile,
  onDismiss,
  className,
}: ConfoundingRiskBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Only show if confounding conditions are met
  const isConfounded = attendancePercent < 90 && growthPercentile < 50;

  if (!isConfounded || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'relative mb-6 p-6 bg-gradient-to-r from-amber-900/30 via-amber-900/20 to-rose-900/20',
        'border-2 border-amber-500/40 rounded-2xl',
        className
      )}
      role="alert"
    >
      {/* Decorative corner accent */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-rose-500 rounded-l-2xl" />

      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-500/20 rounded-xl">
          <ShieldAlert className="w-6 h-6 text-amber-400" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-black text-lg text-amber-400">HIGH CONFOUNDING RISK</h3>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
              Data Warning
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            <strong className="text-white">{studentName}&apos;s</strong> low growth ({growthPercentile}th percentile)
            is <em>correlated</em> with chronic absenteeism ({attendancePercent.toFixed(1)}% attendance).
            <strong className="text-amber-400"> Test scores cannot be reliably attributed to instructional quality.</strong>
          </p>

          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">
                Attendance:{' '}
                <span className="font-bold text-rose-400">{attendancePercent.toFixed(1)}%</span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">
                Growth:{' '}
                <span className="font-bold text-rose-400">{growthPercentile}th %ile</span>
              </span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="font-bold text-xs uppercase tracking-wider">Recommended Action</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Refer to <strong className="text-white">Family Engagement team</strong> to address attendance
              barriers before making instructional changes. Academic interventions alone will not
              resolve growth issues when the root cause is absence.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex-shrink-0"
          aria-label="Dismiss warning"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Compact inline version for use in cards/lists
 */
export function ConfoundingIndicator({
  attendancePercent,
  growthPercentile,
  className,
}: {
  attendancePercent: number;
  growthPercentile: number;
  className?: string;
}) {
  const isConfounded = attendancePercent < 90 && growthPercentile < 50;

  if (!isConfounded) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold',
        className
      )}
      title="Data is confounded by attendance - use caution when interpreting growth metrics"
    >
      <ShieldAlert className="w-3 h-3" />
      CONFOUNDED
    </div>
  );
}
