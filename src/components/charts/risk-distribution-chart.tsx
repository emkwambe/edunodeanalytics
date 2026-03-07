'use client';

import * as React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { donutChartOptions, EDUNODE_COLORS } from './chart-config';
import { cn, formatNumber } from '@/lib/utils';
import type { ChartData, ChartOptions } from 'chart.js';

/**
 * Risk Distribution Chart
 *
 * Doughnut chart showing student distribution by risk level (4-tier MTSS model)
 * Center displays total student count
 */

export interface RiskDistributionData {
  onTrack: number;
  watch: number;
  atRisk: number;
  critical: number;
}

interface RiskDistributionChartProps {
  data: RiskDistributionData;
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  // Multi-tenant props
  tenantId?: string;
  showPercentages?: boolean;
}

export function RiskDistributionChart({
  data,
  title = 'Student Risk Distribution',
  subtitle,
  height = 280,
  className,
  showPercentages = true,
}: RiskDistributionChartProps) {
  const total = data.onTrack + data.watch + data.atRisk + data.critical;

  // Prepare chart data
  const chartData: ChartData<'doughnut'> = React.useMemo(() => ({
    labels: ['On Track', 'Watch', 'At Risk', 'Critical'],
    datasets: [
      {
        data: [data.onTrack, data.watch, data.atRisk, data.critical],
        backgroundColor: [
          EDUNODE_COLORS.emerald[500],
          EDUNODE_COLORS.yellow[500],
          EDUNODE_COLORS.orange[500],
          EDUNODE_COLORS.red[500],
        ],
        borderColor: [
          EDUNODE_COLORS.emerald[500],
          EDUNODE_COLORS.yellow[500],
          EDUNODE_COLORS.orange[500],
          EDUNODE_COLORS.red[500],
        ],
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }), [data]);

  // Chart options
  const options: ChartOptions<'doughnut'> = React.useMemo(() => ({
    ...donutChartOptions,
    plugins: {
      ...donutChartOptions.plugins,
      tooltip: {
        ...donutChartOptions.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatNumber(value)} (${percentage}%)`;
          },
        },
      },
    },
  }), [total]);

  // Calculate percentages
  const percentages = {
    onTrack: total > 0 ? ((data.onTrack / total) * 100).toFixed(0) : '0',
    watch: total > 0 ? ((data.watch / total) * 100).toFixed(0) : '0',
    atRisk: total > 0 ? ((data.atRisk / total) * 100).toFixed(0) : '0',
    critical: total > 0 ? ((data.critical / total) * 100).toFixed(0) : '0',
  };

  return (
    <Card className={cn('chart-container', className)}>
      <CardHeader className="chart-header">
        <div>
          <CardTitle className="chart-title">{title}</CardTitle>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          <Doughnut data={chartData} options={options} />

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-slate-100">
              {formatNumber(total)}
            </span>
            <span className="text-sm text-slate-400">Students</span>
          </div>
        </div>

        {/* Legend with numbers */}
        {showPercentages && (
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400">On Track</span>
              </div>
              <div className="text-lg font-bold text-emerald-400">
                {percentages.onTrack}%
              </div>
              <div className="text-xs text-slate-500">
                {formatNumber(data.onTrack)}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-xs text-slate-400">Watch</span>
              </div>
              <div className="text-lg font-bold text-yellow-400">
                {percentages.watch}%
              </div>
              <div className="text-xs text-slate-500">
                {formatNumber(data.watch)}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs text-slate-400">At Risk</span>
              </div>
              <div className="text-lg font-bold text-orange-400">
                {percentages.atRisk}%
              </div>
              <div className="text-xs text-slate-500">
                {formatNumber(data.atRisk)}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-slate-400">Critical</span>
              </div>
              <div className="text-lg font-bold text-red-400">
                {percentages.critical}%
              </div>
              <div className="text-xs text-slate-500">
                {formatNumber(data.critical)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Risk Distribution Chart Skeleton
 */
export function RiskDistributionChartSkeleton({
  height = 280,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <Card className={cn('chart-container', className)}>
      <CardHeader className="chart-header">
        <div className="animate-pulse">
          <div className="h-5 w-40 bg-slate-700 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="animate-pulse bg-slate-800/50 rounded-full mx-auto"
          style={{ height, width: height }}
        />
        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/50 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-3 w-16 bg-slate-700 rounded mx-auto" />
              <div className="h-6 w-12 bg-slate-700 rounded mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
