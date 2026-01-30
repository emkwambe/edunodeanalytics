'use client';

import * as React from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  lineChartOptions,
  EDUNODE_COLORS,
} from './chart-config';
import { cn } from '@/lib/utils';
import type { ChartData, ChartOptions } from 'chart.js';

/**
 * Mastery Curve Chart
 *
 * Real-time weekly formative assessment mastery curves
 * Part of the "Instructional Pulse" dashboard
 */

export interface MasteryCurveDataPoint {
  week: string; // Week label (e.g., "Week 1", "Sep 4")
  masteryRate: number; // 0-1, percentage of students meeting mastery
  assessmentCount?: number;
}

export interface MasterySubjectData {
  subject: string;
  data: MasteryCurveDataPoint[];
  color: string;
  targetMastery?: number;
}

interface MasteryCurveChartProps {
  subjects: MasterySubjectData[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  // Multi-tenant props
  tenantId?: string;
  gradeLevel?: string;
  selectedSubject?: string;
  onSubjectChange?: (subject: string) => void;
}

export function MasteryCurveChart({
  subjects,
  title = 'Weekly Mastery Trends',
  subtitle = 'Formative assessment performance',
  height = 320,
  className,
  gradeLevel,
  selectedSubject,
  onSubjectChange,
}: MasteryCurveChartProps) {
  const [activeSubjects, setActiveSubjects] = React.useState<Set<string>>(
    new Set(subjects.map((s) => s.subject))
  );

  // Toggle subject visibility
  const toggleSubject = (subject: string) => {
    setActiveSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) {
        // Don't allow deselecting all
        if (next.size > 1) {
          next.delete(subject);
        }
      } else {
        next.add(subject);
      }
      return next;
    });
  };

  // Prepare chart data
  const chartData: ChartData<'line'> = React.useMemo(() => {
    // Use the first subject's weeks as labels
    const labels = subjects[0]?.data.map((d) => d.week) || [];

    const datasets = subjects
      .filter((s) => activeSubjects.has(s.subject))
      .map((subject) => ({
        label: subject.subject,
        data: subject.data.map((d) => d.masteryRate * 100),
        borderColor: subject.color,
        backgroundColor: `${subject.color}20`,
        fill: false,
        tension: 0.4,
      }));

    // Add target line if any subject has it
    const targetSubject = subjects.find((s) => s.targetMastery !== undefined);
    if (targetSubject) {
      datasets.push({
        label: 'Mastery Target (80%)',
        data: targetSubject.data.map(() => (targetSubject.targetMastery ?? 0.8) * 100),
        borderColor: EDUNODE_COLORS.slate[500],
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0,
        pointRadius: 0,
      } as any);
    }

    return { labels, datasets };
  }, [subjects, activeSubjects]);

  // Chart options
  const options: ChartOptions<'line'> = React.useMemo(() => ({
    ...lineChartOptions,
    scales: {
      ...lineChartOptions.scales,
      y: {
        ...lineChartOptions.scales?.y,
        min: 0,
        max: 100,
        ticks: {
          ...lineChartOptions.scales?.y?.ticks,
          callback: (value) => `${value}%`,
        },
      },
    },
    plugins: {
      ...lineChartOptions.plugins,
      tooltip: {
        ...lineChartOptions.plugins?.tooltip,
        callbacks: {
          title: (items) => {
            const item = items[0];
            const dataIndex = item.dataIndex;
            const subject = subjects.find((s) => s.subject === item.dataset.label);
            const assessmentCount = subject?.data[dataIndex]?.assessmentCount;
            return assessmentCount
              ? `${item.label} (${assessmentCount} assessments)`
              : item.label;
          },
          label: (context) => {
            const value = context.parsed.y.toFixed(1);
            return `${context.dataset.label}: ${value}% mastery`;
          },
        },
      },
    },
  }), [subjects]);

  // Calculate current mastery for badge
  const latestMastery = subjects[0]?.data[subjects[0].data.length - 1]?.masteryRate ?? 0;
  const masteryStatus = latestMastery >= 0.8 ? 'on-track' : latestMastery >= 0.6 ? 'at-risk' : 'critical';

  return (
    <Card className={cn('chart-container', className)}>
      <CardHeader className="chart-header">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="chart-title">{title}</CardTitle>
            {gradeLevel && (
              <Badge variant="outline" size="sm">
                Grade {gradeLevel}
              </Badge>
            )}
          </div>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
        <Badge variant={masteryStatus}>
          {(latestMastery * 100).toFixed(0)}% Mastery
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Subject toggles */}
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <Button
              key={subject.subject}
              variant={activeSubjects.has(subject.subject) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSubject(subject.subject)}
              style={{
                backgroundColor: activeSubjects.has(subject.subject)
                  ? subject.color
                  : undefined,
                borderColor: subject.color,
              }}
            >
              {subject.subject}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div style={{ height }}>
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Mastery Curve Chart Skeleton
 */
export function MasteryCurveChartSkeleton({
  height = 320,
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
          <div className="h-3 w-32 bg-slate-700 rounded mt-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-20 bg-slate-700 rounded" />
          ))}
        </div>
        <div
          className="animate-pulse bg-slate-800/50 rounded-lg"
          style={{ height }}
        />
      </CardContent>
    </Card>
  );
}
