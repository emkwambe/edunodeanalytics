'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Status Indicator Component
 *
 * Visual indicator for student risk levels and other status displays
 * Using Unicode/CSS for lightweight rendering (no SVG per design spec)
 */

export type StatusLevel = 'on_track' | 'watch' | 'at_risk' | 'critical' | 'no_data';

interface StatusIndicatorProps {
  status: StatusLevel;
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
  pulse?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  StatusLevel,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
  }
> = {
  on_track: {
    label: 'On Track',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    icon: '\u2714', // Check mark
  },
  watch: {
    label: 'Watch',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    icon: '\u25CB', // Circle
  },
  at_risk: {
    label: 'At Risk',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    icon: '\u26A0', // Warning sign
  },
  critical: {
    label: 'Critical',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    icon: '\u2716', // X mark
  },
  no_data: {
    label: 'No Data',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
    icon: '\u2014', // Em dash
  },
};

export function StatusIndicator({
  status,
  size = 'default',
  showLabel = false,
  pulse = false,
  className,
}: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'w-2 h-2',
    default: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const labelSizeClasses = {
    sm: 'text-[10px]',
    default: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Dot indicator */}
      <span className="relative flex">
        <span
          className={cn(
            'rounded-full',
            sizeClasses[size],
            config.bgColor,
            pulse && status === 'critical' && 'animate-ping absolute inline-flex opacity-75'
          )}
        />
        <span
          className={cn(
            'relative inline-flex rounded-full',
            sizeClasses[size],
            config.bgColor,
            'border',
            config.borderColor
          )}
        />
      </span>

      {/* Label */}
      {showLabel && (
        <span className={cn('font-medium', config.color, labelSizeClasses[size])}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * Status Badge - Full badge with icon and text
 */
interface StatusBadgeProps {
  status: StatusLevel;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
    >
      <span className="text-[10px]">{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}

/**
 * Risk Distribution Visualization
 * Shows percentage breakdown by status
 */
interface RiskDistributionProps {
  onTrack: number;
  atRisk: number;
  critical: number;
  showLabels?: boolean;
  className?: string;
}

export function RiskDistribution({
  onTrack,
  atRisk,
  critical,
  showLabels = true,
  className,
}: RiskDistributionProps) {
  const total = onTrack + atRisk + critical;

  const getWidth = (value: number) =>
    total > 0 ? `${(value / total) * 100}%` : '0%';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-700">
        <div
          className="bg-emerald-500 transition-all duration-500"
          style={{ width: getWidth(onTrack) }}
        />
        <div
          className="bg-amber-500 transition-all duration-500"
          style={{ width: getWidth(atRisk) }}
        />
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: getWidth(critical) }}
        />
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">On Track</span>
            <span className="text-slate-300 font-medium">{onTrack}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-400">At Risk</span>
            <span className="text-slate-300 font-medium">{atRisk}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-400">Critical</span>
            <span className="text-slate-300 font-medium">{critical}</span>
          </div>
        </div>
      )}
    </div>
  );
}
