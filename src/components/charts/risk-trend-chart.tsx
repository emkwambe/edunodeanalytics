'use client';

import * as React from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { barChartOptions, EDUNODE_COLORS } from './chart-config';
import { cn } from '@/lib/utils';
import type { ChartData, ChartOptions } from 'chart.js';
import type { WeeklyTrendPoint } from '@/lib/hooks/use-risk-distribution';

/**
 * Risk Trend Chart
 *
 * Stacked bar chart showing risk level distribution over time (weekly)
 * Displays how the student population has shifted between risk tiers
 */

interface RiskTrendChartProps {
  data: WeeklyTrendPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
}

/**
 * Format week date for display
 */
function formatWeekLabel(weekStart: string): string {
  const date = new Date(weekStart);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

export function RiskTrendChart({
  data,
  title = 'Risk Trend Over Time',
  subtitle,
  height = 280,
  className,
  showLegend = true,
}: RiskTrendChartProps) {
  // Sort data by date
  const sortedData = React.useMemo(() => {
    return [...data].sort(
      (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
    );
  }, [data]);

  // Prepare chart data for stacked bar
  const chartData: ChartData<'bar'> = React.useMemo(
    () => ({
      labels: sortedData.map((point) => formatWeekLabel(point.weekStart)),
      datasets: [
        {
          label: 'On Track',
          data: sortedData.map((point) => point.on_track),
          backgroundColor: EDUNODE_COLORS.emerald[500],
          borderColor: EDUNODE_COLORS.emerald[500],
          borderWidth: 0,
          borderRadius: 2,
        },
        {
          label: 'Watch',
          data: sortedData.map((point) => point.watch),
          backgroundColor: EDUNODE_COLORS.yellow[500],
          borderColor: EDUNODE_COLORS.yellow[500],
          borderWidth: 0,
          borderRadius: 2,
        },
        {
          label: 'At Risk',
          data: sortedData.map((point) => point.at_risk),
          backgroundColor: EDUNODE_COLORS.orange[500],
          borderColor: EDUNODE_COLORS.orange[500],
          borderWidth: 0,
          borderRadius: 2,
        },
        {
          label: 'Critical',
          data: sortedData.map((point) => point.critical),
          backgroundColor: EDUNODE_COLORS.red[500],
          borderColor: EDUNODE_COLORS.red[500],
          borderWidth: 0,
          borderRadius: 2,
        },
      ],
    }),
    [sortedData]
  );

  // Chart options for stacked bar
  const options: ChartOptions<'bar'> = React.useMemo(
    () => ({
      ...barChartOptions,
      plugins: {
        ...barChartOptions.plugins,
        legend: {
          display: showLegend,
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            color: EDUNODE_COLORS.slate[400],
            font: {
              family: 'Plus Jakarta Sans, system-ui, sans-serif',
              size: 11,
            },
            usePointStyle: true,
            pointStyle: 'rect',
            padding: 12,
          },
        },
        tooltip: {
          ...barChartOptions.plugins?.tooltip,
          mode: 'index' as const,
          callbacks: {
            footer: (items) => {
              const total = items.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0);
              return `Total: ${total} students`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false,
          },
          ticks: {
            color: EDUNODE_COLORS.slate[500],
            font: {
              family: 'Plus Jakarta Sans, system-ui, sans-serif',
              size: 11,
            },
          },
        },
        y: {
          stacked: true,
          grid: {
            color: EDUNODE_COLORS.slate[800],
          },
          ticks: {
            color: EDUNODE_COLORS.slate[500],
            font: {
              family: 'Plus Jakarta Sans, system-ui, sans-serif',
              size: 11,
            },
            stepSize: Math.ceil(
              sortedData.reduce((max, point) => {
                const total =
                  (point.on_track ?? 0) +
                  (point.watch ?? 0) +
                  (point.at_risk ?? 0) +
                  (point.critical ?? 0);
                return Math.max(max, total);
              }, 0) / 5
            ),
          },
          title: {
            display: true,
            text: 'Students',
            color: EDUNODE_COLORS.slate[500],
            font: {
              family: 'Plus Jakarta Sans, system-ui, sans-serif',
              size: 11,
            },
          },
        },
      },
    }),
    [showLegend, sortedData]
  );

  // Calculate trend summary
  const trendSummary = React.useMemo(() => {
    if (sortedData.length < 2) return null;

    const first = sortedData[0];
    const last = sortedData[sortedData.length - 1];

    const firstAtRisk = (first.at_risk ?? 0) + (first.critical ?? 0);
    const lastAtRisk = (last.at_risk ?? 0) + (last.critical ?? 0);
    const change = lastAtRisk - firstAtRisk;

    return {
      change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      weeks: sortedData.length,
    };
  }, [sortedData]);

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card className={cn('chart-container', className)}>
        <CardHeader className="chart-header">
          <div>
            <CardTitle className="chart-title">{title}</CardTitle>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-slate-500"
            style={{ height }}
          >
            No trend data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('chart-container', className)}>
      <CardHeader className="chart-header">
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle className="chart-title">{title}</CardTitle>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
          {trendSummary && (
            <div className="text-right">
              <div
                className={cn(
                  'text-sm font-medium',
                  trendSummary.direction === 'up' && 'text-red-400',
                  trendSummary.direction === 'down' && 'text-emerald-400',
                  trendSummary.direction === 'stable' && 'text-slate-400'
                )}
              >
                {trendSummary.direction === 'up' && '+'}
                {trendSummary.change} at-risk
              </div>
              <div className="text-xs text-slate-500">
                over {trendSummary.weeks} weeks
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Risk Trend Chart Skeleton
 */
export function RiskTrendChartSkeleton({
  height = 280,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <Card className={cn('chart-container', className)}>
      <CardHeader className="chart-header">
        <div className="animate-pulse flex justify-between w-full">
          <div className="h-5 w-40 bg-slate-700 rounded" />
          <div className="h-4 w-20 bg-slate-700 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse" style={{ height }}>
          <div className="flex items-end justify-around h-full gap-2 pb-8">
            {[65, 80, 55, 75, 60, 85, 70, 90].map((h, i) => (
              <div
                key={i}
                className="w-8 bg-slate-700/50 rounded-t"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
