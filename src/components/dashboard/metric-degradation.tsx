'use client';

import { type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type MetricVitality } from '@/lib/analytics/purpose-driven-metrics';

/**
 * Metric Degradation Wrapper
 *
 * Implements "Cadence-Bound Intelligence" from the Purpose-Driven Intelligence doctrine.
 * Metrics visibly degrade (50% opacity for stale, 30% for expired) when data becomes old,
 * signaling reduced reliability to users.
 */

export interface MetricDegradationProps {
  /** The metric content to wrap */
  children: ReactNode;
  /** Metric vitality/freshness data */
  vitality: MetricVitality;
  /** Show the data age badge */
  showBadge?: boolean;
  /** Show the warning message */
  showWarning?: boolean;
  /** Custom className for the wrapper */
  className?: string;
  /** Callback when refresh is requested */
  onRefreshRequest?: () => void;
}

export function MetricDegradation({
  children,
  vitality,
  showBadge = true,
  showWarning = true,
  className,
  onRefreshRequest,
}: MetricDegradationProps) {
  const isFresh = vitality.freshness === 'fresh';
  const isStale = vitality.freshness === 'stale';
  const isExpired = vitality.freshness === 'expired';

  return (
    <div
      className={cn(
        'relative transition-opacity duration-300',
        !isFresh && 'group',
        className
      )}
      style={{ opacity: vitality.opacity }}
    >
      {/* Content */}
      {children}

      {/* Age Badge */}
      {showBadge && !isFresh && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] bg-slate-900 shadow-md',
              isStale && 'border-amber-500/50 text-amber-400',
              isExpired && 'border-red-500/50 text-red-400'
            )}
          >
            <Clock className="w-3 h-3 mr-1" />
            {vitality.daysSinceUpdate}d old
          </Badge>
        </div>
      )}

      {/* Ring indicator for non-fresh data */}
      {!isFresh && (
        <div
          className={cn(
            'absolute inset-0 rounded-lg ring-1 pointer-events-none',
            isStale && 'ring-amber-500/30',
            isExpired && 'ring-red-500/30'
          )}
        />
      )}

      {/* Hover overlay with refresh action */}
      {!isFresh && onRefreshRequest && (
        <div className="absolute inset-0 bg-slate-900/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={onRefreshRequest}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              isStale && 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400',
              isExpired && 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Refresh Data</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Stale Data Banner
 *
 * A prominent banner shown when critical metrics are stale
 */
export interface StaleDataBannerProps {
  /** Metric vitality data */
  vitality: MetricVitality;
  /** Name of the metric/data that is stale */
  metricName?: string;
  /** Callback when refresh is requested */
  onRefreshRequest?: () => void;
}

export function StaleDataBanner({
  vitality,
  metricName = 'Data',
  onRefreshRequest,
}: StaleDataBannerProps) {
  if (vitality.freshness === 'fresh') {
    return null;
  }

  const isExpired = vitality.freshness === 'expired';

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border',
        isExpired
          ? 'bg-red-500/10 border-red-500/20'
          : 'bg-amber-500/10 border-amber-500/20'
      )}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle
          className={cn(
            'w-5 h-5',
            isExpired ? 'text-red-400' : 'text-amber-400'
          )}
        />
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              isExpired ? 'text-red-300' : 'text-amber-300'
            )}
          >
            {metricName} is {vitality.daysSinceUpdate} days old
          </p>
          {vitality.warningMessage && (
            <p className="text-xs text-slate-400 mt-0.5">
              {vitality.warningMessage}
            </p>
          )}
        </div>
      </div>

      {onRefreshRequest && (
        <button
          onClick={onRefreshRequest}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            isExpired
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
          )}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      )}
    </div>
  );
}

/**
 * Freshness Indicator
 *
 * A small inline indicator showing data freshness
 */
export interface FreshnessIndicatorProps {
  vitality: MetricVitality;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function FreshnessIndicator({
  vitality,
  showLabel = true,
  size = 'sm',
}: FreshnessIndicatorProps) {
  const isFresh = vitality.freshness === 'fresh';
  const isStale = vitality.freshness === 'stale';

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'rounded-full',
          dotSize,
          isFresh && 'bg-emerald-500',
          isStale && 'bg-amber-500',
          !isFresh && !isStale && 'bg-red-500'
        )}
      />
      {showLabel && (
        <span
          className={cn(
            textSize,
            'text-slate-400'
          )}
        >
          {isFresh
            ? 'Updated today'
            : `${vitality.daysSinceUpdate}d ago`}
        </span>
      )}
    </div>
  );
}
