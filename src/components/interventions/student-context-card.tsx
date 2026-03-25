'use client';

/**
 * Student Context Card
 * ====================
 *
 * Sprint 5D: Shows student risk context on intervention detail page.
 *
 * Displays:
 * - Current risk level and score
 * - Primary risk drivers (top 2-3)
 * - Attendance rate and trend (if attendance is a driver)
 * - Assessment scores and trend (if academic is a driver)
 * - Placement recommendation (informational)
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStudentRiskProfile, type RiskFactorResponse } from '@/lib/hooks/use-risk';
import {
  User,
  AlertTriangle,
  BookOpen,
  CalendarOff,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface StudentContextCardProps {
  schoolId: string | null;
  studentId: string | null;
  className?: string;
}

const RISK_LEVEL_CONFIG = {
  on_track: { label: 'On Track', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  watch: { label: 'Watch', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  at_risk: { label: 'At Risk', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const TRAJECTORY_ICONS = {
  improving: { icon: TrendingUp, color: 'text-emerald-400' },
  stable: { icon: Minus, color: 'text-slate-400' },
  declining: { icon: TrendingDown, color: 'text-red-400' },
};

/**
 * Get friendly name for risk driver
 */
function getDriverDisplayName(name: string): string {
  const displayNames: Record<string, string> = {
    attendance_rate: 'Attendance Rate',
    chronic_absence: 'Chronic Absence',
    assessment_performance: 'Assessment Performance',
    grade_level_proficiency: 'Grade Level Proficiency',
    assignment_completion: 'Assignment Completion',
    missing_assignments: 'Missing Assignments',
    behavior_incidents: 'Behavior Incidents',
    engagement_score: 'Engagement Score',
    academic_trend: 'Academic Trend',
  };
  return displayNames[name] || name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Get placement recommendation based on risk drivers
 */
function getPlacementRecommendation(
  factors: RiskFactorResponse[]
): { text: string; strategies: string[] } | null {
  const topFactors = factors.slice(0, 3);
  const categories = new Set(topFactors.map((f) => f.category));

  // Exposure gap patterns
  if (categories.has('attendance')) {
    return {
      text: "This student's risk profile suggests exposure gaps due to missed instruction. Research shows students with attendance-driven risk respond best to:",
      strategies: [
        'Targeted tutoring to fill content gaps',
        'Condensed re-teaching of missed concepts',
        'Check-in/check-out attendance support',
      ],
    };
  }

  if (categories.has('academic') && !categories.has('behavior')) {
    return {
      text: "This student's risk profile suggests academic exposure gaps. Research shows students with similar profiles grow 1.3x faster when correctly placed in:",
      strategies: [
        'Prerequisite skill building interventions',
        'Small group targeted instruction',
        'Scaffolded practice with immediate feedback',
      ],
    };
  }

  if (categories.has('behavior')) {
    return {
      text: "This student's risk profile includes behavioral factors. Research suggests a multi-tiered approach:",
      strategies: [
        'Behavior intervention plan (BIP)',
        'Social-emotional learning support',
        'Positive behavior reinforcement system',
      ],
    };
  }

  if (categories.has('engagement')) {
    return {
      text: "This student's risk profile shows engagement as a key factor. Consider:",
      strategies: [
        'Interest-based learning connections',
        'Student mentoring relationship',
        'Goal-setting and progress monitoring',
      ],
    };
  }

  return null;
}

export function StudentContextCard({
  schoolId,
  studentId,
  className,
}: StudentContextCardProps) {
  const { profile, isLoading, error } = useStudentRiskProfile(schoolId, studentId);

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-indigo-400" />
            Student Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-slate-700 rounded" />
            <div className="h-4 w-48 bg-slate-700/50 rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-slate-700/30 rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3 border-b border-slate-700/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-indigo-400" />
            Student Context
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="py-4 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm">Risk data not available for this student</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskConfig = RISK_LEVEL_CONFIG[profile.riskLevel] || RISK_LEVEL_CONFIG.watch;
  const trajectoryConfig = TRAJECTORY_ICONS[profile.trajectory] || TRAJECTORY_ICONS.stable;
  const TrajectoryIcon = trajectoryConfig.icon;

  // Get top 3 risk factors
  const topFactors = profile.factors
    .filter((f) => f.weightedScore > 0)
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 3);

  // Get placement recommendation
  const recommendation = getPlacementRecommendation(profile.factors);

  // Check for specific driver categories
  const hasAttendanceDriver = profile.factors.some((f) => f.category === 'attendance' && f.weightedScore > 0.1);
  const hasAcademicDriver = profile.factors.some((f) => f.category === 'academic' && f.weightedScore > 0.1);

  // Get attendance rate from factors
  const attendanceFactor = profile.factors.find((f) => f.name === 'attendance_rate' || f.category === 'attendance');
  const academicFactor = profile.factors.find((f) => f.name === 'assessment_performance' || f.category === 'academic');

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3 border-b border-slate-700/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="w-5 h-5 text-indigo-400" />
          Student Context
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Risk Level and Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={cn('text-xs border', riskConfig.color)}>
              {riskConfig.label}
            </Badge>
            <span className="text-sm text-slate-400">
              Risk Score: <span className="text-white font-medium">{Math.round(profile.riskScore * 100)}</span>
            </span>
          </div>
          <div className={cn('flex items-center gap-1 text-sm', trajectoryConfig.color)}>
            <TrajectoryIcon className="w-4 h-4" />
            <span className="capitalize">{profile.trajectory}</span>
          </div>
        </div>

        {/* Primary Risk Drivers */}
        <div>
          <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-2">
            Primary Risk Drivers
          </h3>
          <div className="space-y-2">
            {topFactors.map((factor) => {
              const factorTrajConfig = TRAJECTORY_ICONS[factor.trend] || TRAJECTORY_ICONS.stable;
              const FactorTrajIcon = factorTrajConfig.icon;

              return (
                <div
                  key={factor.name}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {factor.category === 'attendance' && <CalendarOff className="w-4 h-4 text-cyan-400" />}
                    {factor.category === 'academic' && <BookOpen className="w-4 h-4 text-indigo-400" />}
                    {factor.category === 'behavior' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                    {!['attendance', 'academic', 'behavior'].includes(factor.category) && (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm text-white">
                      {getDriverDisplayName(factor.name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {Math.round(factor.weightedScore * 100)}%
                    </span>
                    <FactorTrajIcon className={cn('w-3 h-3', factorTrajConfig.color)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver-Specific Details */}
        {(hasAttendanceDriver || hasAcademicDriver) && (
          <div className="grid grid-cols-2 gap-3">
            {hasAttendanceDriver && attendanceFactor && (
              <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <div className="text-xs text-cyan-400 uppercase tracking-widest mb-1">Attendance</div>
                <div className="text-lg font-bold text-white">
                  {Math.round((1 - attendanceFactor.normalizedScore) * 100)}%
                </div>
                <div className={cn('text-xs flex items-center gap-1', TRAJECTORY_ICONS[attendanceFactor.trend].color)}>
                  {React.createElement(TRAJECTORY_ICONS[attendanceFactor.trend].icon, { className: 'w-3 h-3' })}
                  <span className="capitalize">{attendanceFactor.trend}</span>
                </div>
              </div>
            )}
            {hasAcademicDriver && academicFactor && (
              <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                <div className="text-xs text-indigo-400 uppercase tracking-widest mb-1">Academic</div>
                <div className="text-lg font-bold text-white">
                  {Math.round((1 - academicFactor.normalizedScore) * 100)}%
                </div>
                <div className={cn('text-xs flex items-center gap-1', TRAJECTORY_ICONS[academicFactor.trend].color)}>
                  {React.createElement(TRAJECTORY_ICONS[academicFactor.trend].icon, { className: 'w-3 h-3' })}
                  <span className="capitalize">{academicFactor.trend}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Placement Recommendation */}
        {recommendation && (
          <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <h3 className="text-sm font-medium text-indigo-400">Placement Recommendation</h3>
            </div>
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              {recommendation.text}
            </p>
            <ul className="space-y-1">
              {recommendation.strategies.map((strategy, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  {strategy}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 italic mt-2">
              Note: This is informational guidance based on research patterns. The coordinator makes the final placement decision.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StudentContextCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3 border-b border-slate-700/50">
        <div className="animate-pulse h-6 w-32 bg-slate-700 rounded" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-slate-700 rounded" />
          <div className="h-4 w-48 bg-slate-700/50 rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-slate-700/30 rounded" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
