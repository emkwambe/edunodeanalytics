'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiskScore } from '@/lib/hooks/use-risk-scores';
import type { RiskLevel, Trajectory } from '@/lib/risk-engine/types';
import {
  getRiskBadgeText,
  getRiskBadgeColor,
  getTrajectoryIcon,
  getTrajectoryColor,
  interpretFactor,
  getPrimaryConcern,
  type RiskFactor,
} from '@/lib/risk-engine/interpreter';

interface StudentRiskTableProps {
  scores: RiskScore[];
  isLoading?: boolean;
  schoolSlug: string;
  onSort?: (column: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  className?: string;
}

const RISK_LEVEL_ORDER: RiskLevel[] = ['critical', 'at_risk', 'watch', 'on_track'];

function getRiskLevelBadgeVariant(level: RiskLevel): 'on-track' | 'watch' | 'at-risk' | 'critical' {
  switch (level) {
    case 'on_track':
      return 'on-track';
    case 'watch':
      return 'watch';
    case 'at_risk':
      return 'at-risk';
    case 'critical':
      return 'critical';
  }
}

function TrajectoryIndicator({ trajectory }: { trajectory: Trajectory }) {
  const icon = getTrajectoryIcon(trajectory);
  const colorClass = getTrajectoryColor(trajectory);

  const icons = {
    up: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    right: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    ),
  };

  return (
    <span className={cn('inline-flex items-center', colorClass)} title={trajectory}>
      {icons[icon]}
    </span>
  );
}

function SortIcon({ active, order }: { active: boolean; order: 'asc' | 'desc' }) {
  if (!active) {
    return (
      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return order === 'asc' ? (
    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function StudentRiskTable({
  scores,
  isLoading,
  schoolSlug,
  onSort,
  sortBy = 'risk_score',
  sortOrder = 'desc',
  className,
}: StudentRiskTableProps) {
  const handleSort = (column: string) => {
    onSort?.(column);
  };

  const columns = [
    { key: 'student_name', label: 'Student', sortable: true },
    { key: 'grade_level', label: 'Grade', sortable: true },
    { key: 'risk_score', label: 'Risk Score', sortable: true },
    { key: 'risk_level', label: 'Status', sortable: false },
    { key: 'primary_concern', label: 'Primary Concern', sortable: false },
    { key: 'intervention', label: 'Intervention', sortable: false },
  ];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <CardTitle>At-Risk Students</CardTitle>
          <span className="text-sm text-slate-400">
            {scores.length} student{scores.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider',
                      col.sortable && 'cursor-pointer hover:text-slate-200 transition-colors'
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && (
                        <SortIcon active={sortBy === col.key} order={sortOrder} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 bg-slate-700 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : scores.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                    No students found matching the current filters.
                  </td>
                </tr>
              ) : (
                scores.map((score) => {
                  // Convert topFactors to RiskFactor format for interpreter
                  const factors: RiskFactor[] = score.topFactors.map((f) => ({
                    name: f.name,
                    category: f.category as RiskFactor['category'],
                    rawValue: 0,
                    normalizedScore: f.score,
                    weight: 1,
                    weightedScore: f.score,
                    description: f.description,
                    trend: 'stable' as Trajectory,
                  }));
                  const primaryConcern = getPrimaryConcern(factors);

                  return (
                    <tr
                      key={score.studentId}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/${schoolSlug}/students/${score.studentId}`}
                          className="flex items-center gap-2 group"
                        >
                          <span className="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                            {score.studentName}
                          </span>
                          <TrajectoryIndicator trajectory={score.trajectory} />
                          {score.levelChanged && (
                            <span className="text-xs text-slate-500">(changed)</span>
                          )}
                        </Link>
                        <div className="flex gap-1 mt-1">
                          {score.hasIep && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">
                              IEP
                            </span>
                          )}
                          {score.has504Plan && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                              504
                            </span>
                          )}
                          {score.isChronicallyAbsent && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                              Chronic Absence
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {score.gradeLevel}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-slate-200">
                            {(score.riskScore * 100).toFixed(0)}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                score.riskLevel === 'critical' && 'bg-red-500',
                                score.riskLevel === 'at_risk' && 'bg-orange-500',
                                score.riskLevel === 'watch' && 'bg-yellow-500',
                                score.riskLevel === 'on_track' && 'bg-emerald-500'
                              )}
                              style={{ width: `${score.riskScore * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getRiskLevelBadgeVariant(score.riskLevel)}>
                          {getRiskBadgeText(score.riskLevel)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate">
                        {primaryConcern || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {score.activeIntervention ? (
                          <Link
                            href={`/${schoolSlug}/interventions/${score.activeIntervention.id}`}
                            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors truncate block max-w-[150px]"
                            title={score.activeIntervention.title}
                          >
                            {score.activeIntervention.title}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-500">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function StudentRiskTableSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-6 w-32 bg-slate-700 rounded" />
          <div className="h-4 w-20 bg-slate-700 rounded" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-700/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded flex-1" />
              <div className="h-4 bg-slate-700 rounded w-12" />
              <div className="h-4 bg-slate-700 rounded w-20" />
              <div className="h-4 bg-slate-700 rounded w-16" />
              <div className="h-4 bg-slate-700 rounded w-24" />
              <div className="h-4 bg-slate-700 rounded w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
