'use client';

import * as React from 'react';
import { cn, formatNumber, formatPercent, getTrend } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Metric Card Component
 *
 * Displays a KPI with optional trend indicator
 * Used in the dashboard grid for key metrics like enrollment, attendance, etc.
 */

export interface MetricCardProps {
  title: string;
  value: number | string;
  format?: 'number' | 'percent' | 'currency' | 'raw';
  previousValue?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  format = 'raw',
  previousValue,
  subtitle,
  icon,
  variant = 'default',
  className,
  loading = false,
}: MetricCardProps) {
  // Format the display value
  const displayValue = React.useMemo(() => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'number':
        return formatNumber(value);
      case 'percent':
        return formatPercent(value);
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(value);
      default:
        return String(value);
    }
  }, [value, format]);

  // Calculate trend if previous value provided
  const trend = React.useMemo(() => {
    if (previousValue === undefined || typeof value !== 'number') return null;
    return getTrend(value, previousValue);
  }, [value, previousValue]);

  // Variant colors
  const variantStyles = {
    default: 'from-indigo-500 to-cyan-500',
    success: 'from-emerald-500 to-cyan-500',
    warning: 'from-amber-500 to-orange-500',
    danger: 'from-red-500 to-rose-500',
  };

  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-slate-700 rounded" />
          <div className="h-8 w-32 bg-slate-700 rounded" />
          <div className="h-3 w-20 bg-slate-700 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('metric-card group', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        {icon && (
          <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400 group-hover:text-indigo-400 transition-colors">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <span
          className={cn(
            'text-3xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent',
            variantStyles[variant]
          )}
        >
          {displayValue}
        </span>
      </div>

      {/* Trend & Subtitle */}
      <div className="flex items-center gap-2">
        {trend && (
          <div
            className={cn('flex items-center gap-1 text-xs font-medium', {
              'text-emerald-400': trend.direction === 'up',
              'text-red-400': trend.direction === 'down',
              'text-slate-400': trend.direction === 'flat',
            })}
          >
            {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
            {trend.direction === 'flat' && <Minus className="w-3 h-3" />}
            <span>
              {trend.direction !== 'flat' && `${trend.percentage.toFixed(1)}%`}
            </span>
          </div>
        )}
        {subtitle && (
          <span className="text-xs text-slate-500">{subtitle}</span>
        )}
      </div>
    </Card>
  );
}

/**
 * Metric Card Skeleton for loading states
 */
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 bg-slate-700 rounded" />
        <div className="h-8 w-32 bg-slate-700 rounded" />
        <div className="h-3 w-20 bg-slate-700 rounded" />
      </div>
    </Card>
  );
}
