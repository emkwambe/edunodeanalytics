'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PipelineStage {
  id: string;
  label: string;
  count: number;
  status: 'planned' | 'active' | 'stale' | 'completed';
  students?: { id: string; name: string }[];
}

interface InterventionPipelineProps {
  stages: PipelineStage[];
  schoolSlug: string;
  onCreateIntervention?: () => void;
  isLoading?: boolean;
  className?: string;
}

const stageConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  planned: {
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  active: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  stale: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  completed: {
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

function PipelineStageCard({
  stage,
  schoolSlug,
}: {
  stage: PipelineStage;
  schoolSlug: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const config = stageConfig[stage.status];

  return (
    <div className={cn('relative')}>
      {/* Connector line */}
      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-700/50" />

      <div
        className={cn(
          'relative p-4 rounded-lg border transition-colors',
          stage.status === 'stale' ? 'border-orange-500/30 bg-orange-500/5' : 'border-slate-700/50 bg-slate-800/30'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', config.bgColor, config.color)}>
            {config.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className={cn('font-medium', config.color)}>{stage.label}</h4>
              <span className={cn('text-2xl font-bold', config.color)}>
                {stage.count}
              </span>
            </div>
            {stage.status === 'stale' && stage.count > 0 && (
              <p className="text-xs text-orange-400 mt-1">
                These interventions need attention
              </p>
            )}
          </div>
        </div>

        {/* Expandable student list */}
        {stage.students && stage.students.length > 0 && (
          <div className="mt-3">
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
              {isExpanded ? 'Hide students' : 'Show students'}
            </button>
            {isExpanded && (
              <ul className="mt-2 space-y-1 pl-4 border-l border-slate-700/50">
                {stage.students.slice(0, 10).map((student) => (
                  <li key={student.id}>
                    <Link
                      href={`/${schoolSlug}/students/${student.id}`}
                      className="text-sm text-slate-300 hover:text-cyan-400 transition-colors"
                    >
                      {student.name}
                    </Link>
                  </li>
                ))}
                {stage.students.length > 10 && (
                  <li className="text-xs text-slate-500">
                    +{stage.students.length - 10} more
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function InterventionPipeline({
  stages,
  schoolSlug,
  onCreateIntervention,
  isLoading,
  className,
}: InterventionPipelineProps) {
  const totalActive = stages.reduce((sum, s) =>
    s.status === 'active' || s.status === 'planned' ? sum + s.count : sum, 0
  );
  const staleCount = stages.find(s => s.status === 'stale')?.count || 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Intervention Pipeline</CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              {totalActive} active interventions
              {staleCount > 0 && (
                <span className="text-orange-400 ml-2">
                  ({staleCount} need attention)
                </span>
              )}
            </p>
          </div>
          <Link
            href={`/${schoolSlug}/interventions`}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-slate-700/50 rounded-lg" />
              </div>
            ))}
          </div>
        ) : stages.length === 0 ? (
          <div className="py-8 text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm text-slate-400">No interventions yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Create interventions to track student support
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stages.map((stage) => (
              <PipelineStageCard
                key={stage.id}
                stage={stage}
                schoolSlug={schoolSlug}
              />
            ))}
          </div>
        )}

        {onCreateIntervention && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <Button
              size="sm"
              onClick={onCreateIntervention}
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Intervention
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InterventionPipelineSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-slate-700/50">
        <div className="animate-pulse flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-slate-700 rounded" />
            <div className="h-4 w-32 bg-slate-700 rounded" />
          </div>
          <div className="h-4 w-16 bg-slate-700 rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-slate-700/50 rounded-lg" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
