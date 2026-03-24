'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { calculateConfidenceBandSeries } from '@/lib/analytics/purpose-driven-metrics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export interface ConfidenceBandChartProps {
  /** Chart title */
  title?: string;
  /** Time period labels (x-axis) */
  labels: string[];
  /** Observed scores */
  observedScores: number[];
  /** Expected/target scores */
  expectedScores: number[];
  /** Standard Error of Measurement (default 4 for RIT scores) */
  sem?: number;
  /** Height of the chart in pixels */
  height?: number;
  /** Y-axis range */
  yRange?: { min: number; max: number };
  /** Whether data is stale (applies opacity) */
  isStale?: boolean;
  /** Optional subtitle/description */
  subtitle?: string;
}

export function ConfidenceBandChart({
  title = 'Growth Trajectory with Confidence Band',
  labels,
  observedScores,
  expectedScores,
  sem = 4,
  height = 280,
  yRange,
  isStale = false,
  subtitle,
}: ConfidenceBandChartProps) {
  // Calculate confidence bands
  const confidenceBands = useMemo(() => {
    return calculateConfidenceBandSeries(observedScores, sem, 0.95);
  }, [observedScores, sem]);

  // Calculate if observed is significantly different from expected
  const isSignificantlyDifferent = useMemo(() => {
    const _latestObserved = observedScores[observedScores.length - 1];
    const latestExpected = expectedScores[expectedScores.length - 1];
    const latestUpper = confidenceBands.upper[confidenceBands.upper.length - 1];
    const latestLower = confidenceBands.lower[confidenceBands.lower.length - 1];

    // Expected is outside confidence band = significant
    return latestExpected > latestUpper || latestExpected < latestLower;
  }, [observedScores, expectedScores, confidenceBands]);

  // Calculate auto y-range
  const autoYRange = useMemo(() => {
    if (yRange) return yRange;

    const allValues = [
      ...observedScores,
      ...expectedScores,
      ...confidenceBands.upper,
      ...confidenceBands.lower,
    ].filter((v) => v !== null && v !== undefined);

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;

    return {
      min: Math.floor(min - padding),
      max: Math.ceil(max + padding),
    };
  }, [observedScores, expectedScores, confidenceBands, yRange]);

  const chartData: ChartData<'line'> = useMemo(() => ({
    labels,
    datasets: [
      // Upper confidence band (invisible line for fill reference)
      {
        label: 'Upper Band',
        data: confidenceBands.upper,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        pointRadius: 0,
        fill: false,
        order: 4,
      },
      // Confidence band fill (between upper and lower)
      {
        label: '95% Confidence Band',
        data: confidenceBands.lower,
        borderColor: 'rgba(6, 182, 212, 0.2)',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        pointRadius: 0,
        fill: '-1', // Fill to previous dataset (upper band)
        order: 3,
      },
      // Observed trajectory (main line)
      {
        label: 'Observed Growth',
        data: observedScores,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.5)',
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#0f172a',
        pointBorderWidth: 2,
        fill: false,
        tension: 0.3,
        order: 1,
      },
      // Expected trajectory (dashed line)
      {
        label: 'Expected Growth',
        data: expectedScores,
        borderColor: '#6366f1',
        borderDash: [8, 4],
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#0f172a',
        pointBorderWidth: 2,
        fill: false,
        tension: 0.3,
        order: 2,
      },
    ],
  }), [labels, observedScores, expectedScores, confidenceBands]);

  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 11 },
          filter: (legendItem) => {
            // Hide the upper band from legend
            return legendItem.text !== 'Upper Band';
          },
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          afterBody: (context) => {
            const index = context[0].dataIndex;
            const upper = confidenceBands.upper[index];
            const lower = confidenceBands.lower[index];
            return [
              '',
              `95% CI: ${lower.toFixed(1)} - ${upper.toFixed(1)}`,
              `SEM: ±${sem}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        min: autoYRange.min,
        max: autoYRange.max,
        grid: {
          color: 'rgba(255,255,255,0.05)',
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
        },
        title: {
          display: true,
          text: 'RIT Score',
          color: '#64748b',
          font: { size: 11 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
        },
      },
    },
  }), [autoYRange, confidenceBands, sem]);

  // Calculate delta
  const latestExpected = expectedScores[expectedScores.length - 1];
  const delta = observedScores[observedScores.length - 1] - latestExpected;

  return (
    <Card
      className="bg-slate-800/30 border-slate-700"
      style={{ opacity: isStale ? 0.5 : 1 }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isSignificantlyDifferent && (
              <Badge
                variant={delta > 0 ? 'default' : 'destructive'}
                className="text-xs"
              >
                {delta > 0 ? '+' : ''}{delta.toFixed(1)} from expected
              </Badge>
            )}
            {isStale && (
              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Stale Data
              </Badge>
            )}
          </div>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Legend explanation */}
        <div className="mt-4 p-3 rounded-lg bg-slate-900/50 text-xs text-slate-400">
          <p>
            <strong className="text-slate-300">Confidence Band</strong> shows the range where
            the true score likely falls (95% confidence). Wider bands indicate more uncertainty.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConfidenceBandChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <Card className="bg-slate-800/30 border-slate-700 animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-5 w-48 bg-slate-700 rounded" />
      </CardHeader>
      <CardContent>
        <div
          className="bg-slate-700/50 rounded-lg"
          style={{ height }}
        />
      </CardContent>
    </Card>
  );
}
