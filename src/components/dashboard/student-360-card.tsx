'use client';

import * as React from 'react';
import { cn, formatPercent } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/avatar';
import { StatusIndicator, StatusBadge, type StatusLevel } from './status-indicator';
import {
  type SchoolDataAvailability,
  type StudentInsight,
  type DataSourceType,
  generateStudentInsights,
  hasMinimumViableData,
  createMockDataAvailability,
} from '@/lib/data/data-availability';

// Re-export data availability types for consumers
export type { SchoolDataAvailability, StudentInsight, DataSourceType };
export { createMockDataAvailability, generateStudentInsights, hasMinimumViableData };

/**
 * Student 360 Card Component
 *
 * Holistic view of a single student merging SEL, Behavior, and Academic data
 * Designed with RLS in mind - teachers only see their own roster
 *
 * Adaptive Design:
 * - Shows available metrics with clear labels
 * - Indicates "Not connected" vs "No data" states
 * - Provides actionable insights from whatever data exists
 * - Minimum viable: attendance data alone enables core functionality
 */

export interface Student360Data {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gradeLevel: number | string;
  avatarUrl?: string;

  // Risk & Status
  riskLevel: StatusLevel;
  riskScore: number;

  // Attendance
  attendanceRate: number;
  attendanceTier: StatusLevel;
  daysAbsent: number;
  daysPresent: number;
  isChronicallyAbsent: boolean;

  // Academic (Assessments)
  readingPercentile?: number;
  mathPercentile?: number;
  readingGrowthPercentile?: number;
  mathGrowthPercentile?: number;
  growthTier: StatusLevel;

  // LMS Engagement (Canvas, Google Classroom)
  courseGPA?: number;
  assignmentCompletionRate?: number;
  missingAssignments?: number;
  lastLmsActivity?: Date | string;
  engagementTier?: StatusLevel;
  activeCourses?: number;

  // Program flags
  hasIep?: boolean;
  has504Plan?: boolean;
  isEnglishLearner?: boolean;

  // Homeroom
  homeroomTeacher?: string;
}

interface Student360CardProps {
  student: Student360Data;
  variant?: 'default' | 'compact' | 'expanded';
  onClick?: (student: Student360Data) => void;
  className?: string;
  /** Data availability for the school - enables adaptive display */
  dataAvailability?: SchoolDataAvailability;
  /** Show top insight from available data */
  showInsight?: boolean;
}

/**
 * Metric display with "not connected" state
 */
function MetricValue({
  value,
  suffix,
  isConnected = true,
  colorClass = 'text-slate-100',
}: {
  value: number | string | undefined;
  suffix?: string;
  isConnected?: boolean;
  colorClass?: string;
}) {
  if (!isConnected) {
    return <span className="text-sm text-slate-600 italic">Not connected</span>;
  }
  if (value === undefined || value === null) {
    return <span className="text-lg font-bold text-slate-500">-</span>;
  }
  return (
    <span className={cn('text-lg font-bold', colorClass)}>
      {value}
      {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
    </span>
  );
}

/**
 * Data source indicator badge
 */
function DataSourceBadge({
  connected,
  name
}: {
  connected: boolean;
  name: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
        connected
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-slate-700/50 text-slate-500'
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        connected ? 'bg-emerald-400' : 'bg-slate-600'
      )} />
      {name}
    </span>
  );
}

/**
 * Insight badge for quick visibility
 */
function InsightBadge({ insight }: { insight: StudentInsight }) {
  const colorMap = {
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className={cn(
      'text-xs px-2 py-1 rounded border',
      colorMap[insight.priority]
    )}>
      {insight.title}
    </div>
  );
}

export function Student360Card({
  student,
  variant = 'default',
  onClick,
  className,
  dataAvailability,
  showInsight = false,
}: Student360CardProps) {
  const handleClick = () => {
    if (onClick) onClick(student);
  };

  // Determine what data sources are connected
  const hasLms = dataAvailability
    ? dataAvailability.sources.some(s => s.type === 'lms' && s.connected)
    : student.assignmentCompletionRate !== undefined || student.courseGPA !== undefined;
  const hasAssessment = dataAvailability
    ? dataAvailability.sources.some(s => s.type === 'assessment' && s.connected)
    : student.readingPercentile !== undefined || student.mathPercentile !== undefined;

  // Generate insights if requested
  const insights = showInsight && dataAvailability
    ? generateStudentInsights(student, dataAvailability)
    : [];
  const topInsight = insights[0];

  // Compact variant for list views
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50',
          'hover:bg-slate-800 hover:border-slate-600/50 transition-all cursor-pointer',
          className
        )}
        onClick={handleClick}
      >
        <UserAvatar name={student.displayName} imageUrl={student.avatarUrl} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-100 truncate">
              {student.displayName}
            </span>
            <span className="text-xs text-slate-500">Grade {student.gradeLevel}</span>
            {student.missingAssignments && student.missingAssignments > 0 && (
              <Badge variant="destructive" size="sm" className="text-[10px]">
                {student.missingAssignments} missing
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>Attendance: {formatPercent(student.attendanceRate)}</span>
            {student.courseGPA !== undefined && (
              <span>GPA: {student.courseGPA.toFixed(1)}</span>
            )}
            {student.readingPercentile && (
              <span>Reading: {student.readingPercentile}%ile</span>
            )}
          </div>
        </div>

        <StatusIndicator status={student.riskLevel} size="lg" />
      </div>
    );
  }

  // Default card variant
  return (
    <Card
      className={cn(
        'group hover:shadow-glass transition-all cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={student.displayName}
              imageUrl={student.avatarUrl}
              size="lg"
            />
            <div>
              <h3 className="font-semibold text-slate-100">{student.displayName}</h3>
              <p className="text-sm text-slate-400">Grade {student.gradeLevel}</p>
            </div>
          </div>
          <StatusBadge status={student.riskLevel} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Program Flags */}
        {(student.hasIep || student.has504Plan || student.isEnglishLearner) && (
          <div className="flex flex-wrap gap-1.5">
            {student.hasIep && <Badge variant="primary" size="sm">IEP</Badge>}
            {student.has504Plan && <Badge variant="secondary" size="sm">504</Badge>}
            {student.isEnglishLearner && <Badge variant="accent" size="sm">EL</Badge>}
          </div>
        )}

        {/* Top Insight (if enabled) */}
        {topInsight && (
          <InsightBadge insight={topInsight} />
        )}

        {/* Metrics Grid - Adaptive based on available data */}
        <div className="grid grid-cols-2 gap-3">
          {/* Attendance - Always shown (core metric) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Attendance</span>
              <StatusIndicator status={student.attendanceTier} size="sm" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                'text-lg font-bold',
                student.isChronicallyAbsent ? 'text-red-400' : 'text-slate-100'
              )}>
                {formatPercent(student.attendanceRate)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              {student.daysAbsent} days absent
            </div>
          </div>

          {/* Engagement (LMS) - Shows connection status */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Engagement</span>
              {hasLms && student.engagementTier && (
                <StatusIndicator status={student.engagementTier} size="sm" />
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <MetricValue
                value={student.assignmentCompletionRate !== undefined
                  ? formatPercent(student.assignmentCompletionRate)
                  : undefined}
                isConnected={hasLms}
              />
            </div>
            <div className="text-[10px] text-slate-500">
              {!hasLms ? (
                <span className="text-slate-600">Connect LMS</span>
              ) : student.missingAssignments !== undefined && student.missingAssignments > 0 ? (
                <span className="text-amber-400">{student.missingAssignments} missing</span>
              ) : (
                'Assignment rate'
              )}
            </div>
          </div>

          {/* Growth - Shows connection status */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Growth</span>
              {hasAssessment && <StatusIndicator status={student.growthTier} size="sm" />}
            </div>
            <div className="flex items-baseline gap-1">
              <MetricValue
                value={student.readingGrowthPercentile ?? student.mathGrowthPercentile}
                suffix={(student.readingGrowthPercentile || student.mathGrowthPercentile) ? '%ile' : undefined}
                isConnected={hasAssessment}
              />
            </div>
            <div className="text-[10px] text-slate-500">
              {hasAssessment ? 'Composite SGP' : <span className="text-slate-600">Connect assessments</span>}
            </div>
          </div>

          {/* GPA - Shows connection status */}
          <div className="space-y-1">
            <span className="text-xs text-slate-500">Course GPA</span>
            <div className="flex items-baseline gap-1">
              <MetricValue
                value={student.courseGPA !== undefined ? student.courseGPA.toFixed(2) : undefined}
                isConnected={hasLms}
                colorClass={student.courseGPA !== undefined
                  ? student.courseGPA >= 3.0 ? 'text-emerald-400'
                    : student.courseGPA >= 2.0 ? 'text-amber-400'
                    : 'text-red-400'
                  : 'text-slate-100'}
              />
            </div>
            {hasLms && student.activeCourses !== undefined ? (
              <div className="text-[10px] text-slate-500">
                {student.activeCourses} courses
              </div>
            ) : !hasLms && (
              <div className="text-[10px] text-slate-600">Connect LMS</div>
            )}
          </div>

          {/* Reading - Shows connection status */}
          <div className="space-y-1">
            <span className="text-xs text-slate-500">Reading</span>
            <div className="flex items-baseline gap-1">
              <MetricValue
                value={student.readingPercentile}
                suffix={student.readingPercentile ? '%ile' : undefined}
                isConnected={hasAssessment}
                colorClass="text-cyan-400"
              />
            </div>
            {!hasAssessment && (
              <div className="text-[10px] text-slate-600">Connect NWEA MAP</div>
            )}
          </div>

          {/* Math - Shows connection status */}
          <div className="space-y-1">
            <span className="text-xs text-slate-500">Math</span>
            <div className="flex items-baseline gap-1">
              <MetricValue
                value={student.mathPercentile}
                suffix={student.mathPercentile ? '%ile' : undefined}
                isConnected={hasAssessment}
                colorClass="text-emerald-400"
              />
            </div>
            {!hasAssessment && (
              <div className="text-[10px] text-slate-600">Connect NWEA MAP</div>
            )}
          </div>
        </div>

        {/* Risk Score Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Risk Score</span>
            <span className="text-slate-300 font-medium">{student.riskScore}/100</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                student.riskScore >= 60 ? 'bg-red-500' :
                student.riskScore >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
              )}
              style={{ width: `${student.riskScore}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Data Completeness Indicator
 * Shows which data sources are connected for the school
 */
export function DataCompletenessIndicator({
  availability,
  compact = false,
}: {
  availability: SchoolDataAvailability;
  compact?: boolean;
}) {
  const connectedCount = availability.sources.filter(s => s.connected).length;
  const totalCount = availability.sources.length;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="flex gap-0.5">
          {availability.sources.map((source, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full',
                source.connected ? 'bg-emerald-400' : 'bg-slate-600'
              )}
              title={`${source.name}: ${source.connected ? 'Connected' : 'Not connected'}`}
            />
          ))}
        </div>
        <span className="text-slate-500">{connectedCount}/{totalCount} sources</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">Data Sources</span>
        <span className="text-xs text-slate-500">
          {availability.completenessScore}% complete
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            availability.completenessScore >= 80 ? 'bg-emerald-500' :
            availability.completenessScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${availability.completenessScore}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {availability.sources.map((source, i) => (
          <DataSourceBadge key={i} connected={source.connected} name={source.name} />
        ))}
      </div>
    </div>
  );
}

/**
 * Student 360 Card Skeleton
 */
export function Student360CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-slate-700" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-700 rounded" />
            <div className="h-3 w-16 bg-slate-700 rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-slate-700 rounded" />
              <div className="h-6 w-12 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
