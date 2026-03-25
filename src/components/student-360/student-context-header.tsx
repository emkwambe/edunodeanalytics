'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertTriangle,
  Clock,
  Info,
  Lightbulb,
  TrendingUp,
  BookOpen,
  Calendar,
  Users,
  GraduationCap,
} from 'lucide-react';

/**
 * Student Context Header Enhancement
 *
 * Adds to the top of the Student 360 page:
 * - Primary risk drivers (top 2-3) as badges
 * - Days since last risk evaluation
 * - Root cause insight when limited prerequisites indicators present
 */

export interface RiskFactor {
  name: string;
  category: string;
  weightedScore: number;
}

interface StudentContextHeaderProps {
  /** Top risk factors from the risk profile */
  riskFactors?: RiskFactor[];
  /** Date of last risk evaluation */
  lastEvaluationDate?: string | null;
  /** Student attendance rate (0-1) */
  attendanceRate?: number;
  /** Whether student has mobility flag */
  hasMobility?: boolean;
  /** Whether student is English Learner */
  isEnglishLearner?: boolean;
  /** Risk level */
  riskLevel?: 'on_track' | 'watch' | 'at_risk' | 'critical';
  /** Optional className */
  className?: string;
}

function formatFactorName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function getFactorIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'attendance':
      return <Calendar className="w-3 h-3" />;
    case 'academic':
      return <BookOpen className="w-3 h-3" />;
    case 'behavior':
      return <AlertTriangle className="w-3 h-3" />;
    case 'engagement':
      return <Users className="w-3 h-3" />;
    case 'growth':
      return <TrendingUp className="w-3 h-3" />;
    default:
      return <GraduationCap className="w-3 h-3" />;
  }
}

function getDaysSinceEvaluation(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const evalDate = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - evalDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getRootCauseInsight(
  attendanceRate: number | undefined,
  hasMobility: boolean | undefined,
  isEnglishLearner: boolean | undefined
): { indicator: string; insight: string } | null {
  const indicators: string[] = [];

  if (attendanceRate !== undefined && attendanceRate < 0.9) {
    indicators.push('attendance patterns');
  }
  if (hasMobility) {
    indicators.push('mobility');
  }
  if (isEnglishLearner) {
    indicators.push('EL status');
  }

  if (indicators.length === 0) return null;

  const indicatorList = indicators.join(', ');
  return {
    indicator: indicatorList,
    insight: `This student's risk profile is consistent with exposure gaps related to ${indicatorList}. Research shows students with similar profiles respond well to targeted prerequisite instruction.`,
  };
}

export function StudentContextHeader({
  riskFactors = [],
  lastEvaluationDate,
  attendanceRate,
  hasMobility,
  isEnglishLearner,
  riskLevel,
  className,
}: StudentContextHeaderProps) {
  const daysSinceEval = getDaysSinceEvaluation(lastEvaluationDate);
  const topFactors = riskFactors.slice(0, 3);
  const rootCause = getRootCauseInsight(attendanceRate, hasMobility, isEnglishLearner);

  // Only show if we have risk factors or insight to display
  if (topFactors.length === 0 && !rootCause && daysSinceEval === null) {
    return null;
  }

  // Don't show for on_track students
  if (riskLevel === 'on_track' && !rootCause) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Risk Drivers + Days Since Evaluation */}
      {(topFactors.length > 0 || daysSinceEval !== null) && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Risk drivers */}
          {topFactors.length > 0 && (
            <>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Risk Drivers:
              </span>
              {topFactors.map((factor, idx) => (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        className={cn(
                          'gap-1 text-[10px] cursor-help',
                          factor.weightedScore >= 0.3 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          factor.weightedScore >= 0.15 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        )}
                        variant="outline"
                      >
                        {getFactorIcon(factor.category)}
                        {formatFactorName(factor.name)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <p>Weight: {(factor.weightedScore * 100).toFixed(0)}%</p>
                      <p className="text-slate-400">Category: {factor.category}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </>
          )}

          {/* Days since evaluation */}
          {daysSinceEval !== null && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
              <Clock className="w-3 h-3" />
              <span>
                {daysSinceEval === 0 ? 'Evaluated today' :
                 daysSinceEval === 1 ? '1 day since evaluation' :
                 `${daysSinceEval} days since evaluation`}
              </span>
              {daysSinceEval > 14 && (
                <span className="text-amber-400">(stale)</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Root Cause Insight */}
      {rootCause && (
        <div className="p-3 rounded-lg bg-indigo-900/20 border border-indigo-500/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Root Cause Insight
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-indigo-400/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[250px]">
                      <p className="text-xs">
                        This insight is informational based on research patterns. It does not diagnose or prescribe specific interventions.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {rootCause.insight}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentContextHeader;
