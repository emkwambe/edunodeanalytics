'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiskScore } from '@/lib/hooks/use-risk-scores';
import type { RiskLevel, Trajectory } from '@/lib/risk-engine/types';
import {
  getRiskBadgeText,
  getRiskBadgeColor,
  getTrajectoryIcon,
  getTrajectoryColor,
  interpretTrajectory,
  interpretFactor,
  generateStudentSummary,
  generateActionPrompts,
  interpretConfidence,
  type RiskFactor,
} from '@/lib/risk-engine/interpreter';

interface StudentRiskCardProps {
  score: RiskScore;
  schoolSlug: string;
  onCreateIntervention?: (studentId: string) => void;
  showActions?: boolean;
  expanded?: boolean;
  className?: string;
}

function getRiskLevelBadgeVariant(level: RiskLevel): 'on-track' | 'watch' | 'at-risk' | 'critical' {
  switch (level) {
    case 'on_track': return 'on-track';
    case 'watch': return 'watch';
    case 'at_risk': return 'at-risk';
    case 'critical': return 'critical';
  }
}

function TrajectoryIndicator({ trajectory, className }: { trajectory: Trajectory; className?: string }) {
  const icon = getTrajectoryIcon(trajectory);
  const colorClass = getTrajectoryColor(trajectory);
  const label = interpretTrajectory(trajectory);

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
    <div className={cn('flex items-center gap-1.5', colorClass, className)} title={label}>
      {icons[icon]}
      <span className="text-sm">{label}</span>
    </div>
  );
}

function FactorRow({ factor }: { factor: RiskFactor }) {
  const interpretation = interpretFactor(factor);
  const barWidth = Math.min(factor.weightedScore * 100, 100);

  const categoryColors: Record<string, string> = {
    attendance: 'bg-cyan-500',
    academic: 'bg-indigo-500',
    behavior: 'bg-orange-500',
    engagement: 'bg-emerald-500',
    assignments: 'bg-purple-500',
    trend: 'bg-yellow-500',
    other: 'bg-slate-500',
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-300">{factor.name}</span>
        <span className="text-xs text-slate-500">
          {(factor.weightedScore * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', categoryColors[factor.category] || 'bg-slate-500')}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">{interpretation}</p>
    </div>
  );
}

export function StudentRiskCard({
  score,
  schoolSlug,
  onCreateIntervention,
  showActions = true,
  expanded = false,
  className,
}: StudentRiskCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(expanded);

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

  // Generate plain language summary
  const summary = generateStudentSummary(
    score.studentName,
    score.riskLevel,
    factors,
    score.trajectory
  );

  // Generate action recommendations
  const actions = generateActionPrompts(
    factors,
    score.riskLevel,
    !!score.activeIntervention
  );

  // Check confidence
  const confidenceWarning = interpretConfidence(score.confidenceLevel || 1);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/${schoolSlug}/students/${score.studentId}`}
                className="text-lg font-medium text-slate-100 hover:text-cyan-400 transition-colors"
              >
                {score.studentName}
              </Link>
              <Badge variant={getRiskLevelBadgeVariant(score.riskLevel)}>
                {getRiskBadgeText(score.riskLevel)}
              </Badge>
              {score.levelChanged && (
                <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                  Changed
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-400">Grade {score.gradeLevel}</span>
              {score.hasIep && (
                <span className="text-xs px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">
                  IEP
                </span>
              )}
              {score.has504Plan && (
                <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                  504
                </span>
              )}
              {score.isChronicallyAbsent && (
                <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                  Chronic Absence
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-100">
                {(score.riskScore * 100).toFixed(0)}
              </span>
              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Plain language summary */}
        <p className="text-sm text-slate-300 mb-3">{summary}</p>

        {/* Trajectory indicator */}
        <TrajectoryIndicator trajectory={score.trajectory} className="mb-3" />

        {/* Confidence warning */}
        {confidenceWarning && (
          <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400">{confidenceWarning}</p>
          </div>
        )}

        {/* Expandable factors */}
        {factors.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <svg
                className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {isExpanded ? 'Hide factors' : `Show ${factors.length} risk factors`}
            </button>
            {isExpanded && (
              <div className="mt-2 pt-2 border-t border-slate-700/50 divide-y divide-slate-700/30">
                {factors.map((factor, i) => (
                  <FactorRow key={i} factor={factor} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active intervention */}
        {score.activeIntervention && (
          <div className="mb-3 p-2 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Active Intervention</span>
              <Link
                href={`/${schoolSlug}/interventions/${score.activeIntervention.id}`}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {score.activeIntervention.title}
              </Link>
            </div>
          </div>
        )}

        {/* Recommended actions */}
        {showActions && actions.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Recommended Actions
            </h4>
            <ul className="space-y-1">
              {actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <svg className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2 pt-3 border-t border-slate-700/50">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/${schoolSlug}/student-360/${score.studentId}`}>
                View Profile
              </Link>
            </Button>
            {!score.activeIntervention && (score.riskLevel === 'at_risk' || score.riskLevel === 'critical') && (
              <Button
                size="sm"
                onClick={() => onCreateIntervention?.(score.studentId)}
              >
                Create Intervention
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StudentRiskCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-6 w-40 bg-slate-700 rounded" />
            <div className="h-4 w-24 bg-slate-700 rounded" />
          </div>
          <div className="h-8 w-16 bg-slate-700 rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 animate-pulse space-y-3">
        <div className="h-4 w-full bg-slate-700 rounded" />
        <div className="h-4 w-3/4 bg-slate-700 rounded" />
        <div className="h-8 w-32 bg-slate-700 rounded" />
      </CardContent>
    </Card>
  );
}
