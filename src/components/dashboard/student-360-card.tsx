'use client';

import * as React from 'react';
import { cn, formatPercent } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/avatar';
import { StatusIndicator, StatusBadge, type StatusLevel } from './status-indicator';

/**
 * Student 360 Card Component
 *
 * Holistic view of a single student merging SEL, Behavior, and Academic data
 * Designed with RLS in mind - teachers only see their own roster
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

  // Academic
  readingPercentile?: number;
  mathPercentile?: number;
  readingGrowthPercentile?: number;
  mathGrowthPercentile?: number;
  growthTier: StatusLevel;

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
}

export function Student360Card({
  student,
  variant = 'default',
  onClick,
  className,
}: Student360CardProps) {
  const handleClick = () => {
    if (onClick) onClick(student);
  };

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
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>Attendance: {formatPercent(student.attendanceRate)}</span>
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

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Attendance */}
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

          {/* Growth */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Growth</span>
              <StatusIndicator status={student.growthTier} size="sm" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-100">
                {student.readingGrowthPercentile ?? student.mathGrowthPercentile ?? '-'}
                {(student.readingGrowthPercentile || student.mathGrowthPercentile) && (
                  <span className="text-xs text-slate-400">%ile</span>
                )}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              Composite SGP
            </div>
          </div>

          {/* Reading */}
          <div className="space-y-1">
            <span className="text-xs text-slate-500">Reading</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-400">
                {student.readingPercentile ?? '-'}
                {student.readingPercentile && (
                  <span className="text-xs text-slate-400">%ile</span>
                )}
              </span>
            </div>
          </div>

          {/* Math */}
          <div className="space-y-1">
            <span className="text-xs text-slate-500">Math</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400">
                {student.mathPercentile ?? '-'}
                {student.mathPercentile && (
                  <span className="text-xs text-slate-400">%ile</span>
                )}
              </span>
            </div>
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
