'use client';

import * as React from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  lineChartOptions,
  EDUNODE_COLORS,
  datasetPresets,
} from './chart-config';
import { cn } from '@/lib/utils';
import type { ChartData, ChartOptions } from 'chart.js';

/**
 * Attendance Trend Chart
 *
 * Line chart displaying attendance rate over time
 * Accepts multi-tenant data props for school-specific rendering
 */

export interface AttendanceTrendDataPoint {
  date: string; // ISO date or label
  attendanceRate: number; // 0-1
  targetRate?: number; // Expected/goal rate
  chronicAbsenceRate?: number; // % of students chronically absent
}

interface AttendanceTrendChartProps {
  data: AttendanceTrendDataPoint[];
  title?: string;
  subtitle?: string;
  showTarget?: boolean;
  showChronicAbsence?: boolean;
  height?: number;
  className?: string;
  // Multi-tenant props
  tenantId?: string;
  schoolName?: string;
  benchmarkData?: AttendanceTrendDataPoint[]; // Optional benchmark comparison
}

export function AttendanceTrendChart({
  data,
  title = 'Attendance Trend',
  subtitle,
  showTarget = true,
  showChronicAbsence = false,
  height = 300,
  className,
  schoolName,
  benchmarkData,
}: AttendanceTrendChartProps) {
  const chartRef = React.useRef<any>(null);

  // Prepare chart data
  const chartData: ChartData<'line'> = React.useMemo(() => {
    const labels = data.map((d) => d.date);

    const datasets: ChartData<'line'>['datasets'] = [
      {
        label: schoolName || 'Attendance Rate',
        data: data.map((d) => d.attendanceRate * 100),
        borderColor: EDUNODE_COLORS.cyan[500],
        backgroundColor: `${EDUNODE_COLORS.cyan[500]}20`,
        fill: true,
        tension: 0.4,
      },
    ];

    // Add target line if available
    if (showTarget && data.some((d) => d.targetRate !== undefined)) {
      datasets.push({
        label: 'Target (95%)',
        data: data.map((d) => (d.targetRate ?? 0.95) * 100),
        borderColor: EDUNODE_COLORS.emerald[500],
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0,
        pointRadius: 0,
      });
    }

    // Add chronic absence line if requested
    if (showChronicAbsence && data.some((d) => d.chronicAbsenceRate !== undefined)) {
      datasets.push({
        label: 'Chronic Absence %',
        data: data.map((d) => (d.chronicAbsenceRate ?? 0) * 100),
        borderColor: EDUNODE_COLORS.red[500],
        backgroundColor: `${EDUNODE_COLORS.red[500]}10`,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      });
    }

    // Add benchmark comparison if provided
    if (benchmarkData && benchmarkData.length > 0) {
      datasets.push({
        label: 'Platform Average',
        data: benchmarkData.map((d) => d.attendanceRate * 100),
        borderColor: EDUNODE_COLORS.slate[500],
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      });
    }

    return { labels, datasets };
  }, [data, showTarget, showChronicAbsence, benchmarkData, schoolName]);

  // Chart options with customizations
  const options: ChartOptions<'line'> = React.useMemo(() => ({
    ...lineChartOptions,
    scales: {
      ...lineChartOptions.scales,
      y: {
        ...lineChartOptions.scales?.y,
        min: 80,
        max: 100,
        ticks: {
          ...lineChartOptions.scales?.y?.ticks,
          callback: (value) => `${value}%`,
        },
      },
      ...(showChronicAbsence && {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          min: 0,
          max: 30,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: EDUNODE_COLORS.slate[500],
            callback: (value) => `${value}%`,
          },
        },
      }),
    },
    plugins: {
      ...lineChartOptions.plugins,
      tooltip: {
        ...lineChartOptions.plugins?.tooltip,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y.toFixed(1);
            return `${context.dataset.label}: ${value}%`;
          },
        },
      },
    },
  }), [showChronicAbsence]);

  // Calculate current status
  const currentRate = data[data.length - 1]?.attendanceRate ?? 0;
  const statusVariant = currentRate >= 0.95 ? 'on-track' : currentRate >= 0.90 ? 'at-risk' : 'critical';

  return (
    <Card className={cn('chart-container', className)}>
      <CardHeader className="chart-header">
        <div>
          <CardTitle className="chart-title">{title}</CardTitle>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
        <Badge variant={statusVariant}>
          {(currentRate * 100).toFixed(1)}%
        </Badge>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Attendance Trend Chart Skeleton
 */
export function AttendanceTrendChartSkeleton({
  height = 300,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <Card className={cn('chart-container', className)}>
      <CardHeader className="chart-header">
        <div className="animate-pulse">
          <div className="h-5 w-32 bg-slate-700 rounded" />
          <div className="h-3 w-24 bg-slate-700 rounded mt-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="animate-pulse bg-slate-800/50 rounded-lg"
          style={{ height }}
        />
      </CardContent>
    </Card>
  );
}
