'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useStudentTimeline,
  getTimelineEventStyle,
  type TimelineEvent,
  type TimelineEventType,
} from '@/lib/hooks/use-student-timeline';
import {
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  GraduationCap,
  Target,
  Info,
  ArrowUpRight,
} from 'lucide-react';

/**
 * Student Journey Timeline Component
 *
 * Displays chronological events showing the student's risk detection,
 * intervention response, and outcome trajectory.
 *
 * Features:
 * - Vertical timeline with distinct visual markers per event type
 * - Scrollable for many events (max-height with overflow)
 * - Empty state for students with no events
 * - Loading skeleton
 */

interface StudentTimelineProps {
  schoolId: string;
  studentId: string;
  className?: string;
}

function TimelineEventIcon({ type }: { type: TimelineEventType }) {
  switch (type) {
    case 'enrollment':
      return <GraduationCap className="w-4 h-4" />;
    case 'risk_flag':
      return <AlertTriangle className="w-4 h-4" />;
    case 'risk_escalation':
      return <TrendingUp className="w-4 h-4" />;
    case 'risk_improvement':
      return <TrendingDown className="w-4 h-4" />;
    case 'risk_maintained':
      return <Clock className="w-4 h-4" />;
    case 'intervention_created':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'dosage_milestone':
      return <Target className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
}

function TimelineEventDot({ type }: { type: TimelineEventType }) {
  const style = getTimelineEventStyle(type);

  // Different shapes for different event types
  const shapeClass = type === 'risk_flag' || type === 'risk_escalation'
    ? 'rotate-45' // Triangle-like appearance
    : '';

  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center',
        style.bgClass,
        style.borderClass,
        'border',
        shapeClass && 'rounded-sm'
      )}
    >
      <span className={style.colorClass}>
        <TimelineEventIcon type={type} />
      </span>
    </div>
  );
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const style = getTimelineEventStyle(event.type);

  return (
    <div className="flex gap-4">
      {/* Date column */}
      <div className="flex-shrink-0 w-16 text-right">
        <span className="text-xs font-medium text-slate-400">
          {formatEventDate(event.date)}
        </span>
      </div>

      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <TimelineEventDot type={event.type} />
        <div className="w-0.5 flex-1 bg-slate-700 mt-2" />
      </div>

      {/* Event content */}
      <div className={cn(
        'flex-1 pb-6 -mt-1',
      )}>
        <div className={cn(
          'p-3 rounded-lg border',
          style.bgClass,
          style.borderClass,
        )}>
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn('text-sm font-semibold', style.colorClass)}>
              {event.title}
            </h4>
            {event.metadata.riskScore !== undefined && (
              <Badge variant="outline" className="text-[10px]">
                Score: {(event.metadata.riskScore * 100).toFixed(0)}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {event.description}
          </p>
          {event.metadata.interventionId && (
            <a
              href={`#intervention-${event.metadata.interventionId}`}
              className="inline-flex items-center gap-1 text-[10px] text-cyan-400 mt-2 hover:underline"
            >
              View intervention <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="flex-shrink-0 w-16">
            <div className="h-4 w-12 bg-slate-700 rounded ml-auto" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-700" />
            <div className="w-0.5 flex-1 bg-slate-700 mt-2 min-h-[60px]" />
          </div>
          <div className="flex-1 pb-6 -mt-1">
            <div className="p-3 rounded-lg border border-slate-700 bg-slate-800/50">
              <div className="h-4 w-3/4 bg-slate-700 rounded mb-2" />
              <div className="h-3 w-full bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyTimeline() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Clock className="w-10 h-10 text-slate-600 mb-3" />
      <p className="text-sm text-slate-400 max-w-xs">
        No timeline events yet. Events will appear as risk scores are computed and interventions are created.
      </p>
    </div>
  );
}

export function StudentTimeline({ schoolId, studentId, className }: StudentTimelineProps) {
  const { events, isLoading, error } = useStudentTimeline(schoolId, studentId);

  return (
    <Card className={cn('bg-slate-800/30 border-slate-700', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <CardTitle className="text-base">Student Journey</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded hover:bg-slate-700/50 transition">
                  <Info className="w-4 h-4 text-slate-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[250px]">
                <p className="text-xs">
                  Chronological record of risk detection, interventions, and outcomes.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TimelineSkeleton />
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-sm text-red-400">Failed to load timeline</p>
          </div>
        ) : events.length === 0 ? (
          <EmptyTimeline />
        ) : (
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-0">
            {events.map((event, index) => (
              <React.Fragment key={event.id}>
                <TimelineEventCard event={event} />
                {/* Remove trailing line from last event */}
                {index === events.length - 1 && (
                  <style jsx>{`
                    :global(.flex-col:last-child .w-0\\.5) {
                      display: none;
                    }
                  `}</style>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Event count badge */}
        {events.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{events.length} events in timeline</span>
              <span>
                {events.length > 0 && (
                  <>
                    {formatEventDate(events[0].date)} - {formatEventDate(events[events.length - 1].date)}
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StudentTimeline;
