'use client';

import * as React from 'react';
import { AlertTriangle, Clock, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { checkDataFreshness, type DataFreshnessStatus } from '@/lib/data/fidelity_monitor';

/**
 * Data Freshness Banner
 * =====================
 *
 * Production Hardening: System-wide alert when BigQuery data
 * hasn't refreshed in 24+ hours.
 *
 * Prevents principals from making decisions on stale data.
 */

interface DataFreshnessBannerProps {
  lastRefreshDate?: Date | null;
  className?: string;
  onDismiss?: () => void;
  onRefresh?: () => void;
}

export function DataFreshnessBanner({
  lastRefreshDate,
  className,
  onDismiss,
  onRefresh,
}: DataFreshnessBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Check data freshness status
  const freshnessStatus: DataFreshnessStatus = React.useMemo(
    () => checkDataFreshness(lastRefreshDate ?? null),
    [lastRefreshDate]
  );

  // Don't render if data is fresh or dismissed
  if (!freshnessStatus.isStale || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'relative flex items-center gap-4 px-6 py-4 bg-amber-900/30 border-b border-amber-500/30',
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-amber-400">Data Latency Warning</h4>
          <p className="text-xs text-slate-300">{freshnessStatus.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right mr-4">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>
              Last sync:{' '}
              {freshnessStatus.lastRefreshDate
                ? freshnessStatus.lastRefreshDate.toLocaleString()
                : 'Unknown'}
            </span>
          </div>
        </div>

        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Sync Now
          </Button>
        )}

        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Compact version for use in cards
 */
export function DataFreshnessIndicator({
  lastRefreshDate,
  className,
}: {
  lastRefreshDate?: Date | null;
  className?: string;
}) {
  const freshnessStatus = React.useMemo(
    () => checkDataFreshness(lastRefreshDate ?? null),
    [lastRefreshDate]
  );

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          freshnessStatus.isStale ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
        )}
      />
      <span className={freshnessStatus.isStale ? 'text-amber-400' : 'text-slate-400'}>
        {freshnessStatus.isStale
          ? `Stale: ${freshnessStatus.hoursSinceRefresh}h ago`
          : `Fresh: ${freshnessStatus.hoursSinceRefresh}h ago`}
      </span>
    </div>
  );
}
