'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Database,
  Users,
  Target,
  Play,
  X,
  Sparkles,
  ChevronRight,
  BookOpen,
  Video,
  MessageSquare,
} from 'lucide-react';

/**
 * Getting Started Checklist
 *
 * Shows new users their setup progress and guides them through
 * essential configuration steps.
 */

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  completed: boolean;
  required: boolean;
}

interface GettingStartedProps {
  schoolSlug: string;
  onDismiss?: () => void;
  checklistItems?: Partial<Record<string, boolean>>;
}

export function GettingStartedChecklist({
  schoolSlug,
  onDismiss,
  checklistItems = {},
}: GettingStartedProps) {
  const items: ChecklistItem[] = [
    {
      id: 'connect-sis',
      title: 'Connect your Student Information System',
      description: 'Sync student rosters automatically from Clever or PowerSchool',
      href: `/${schoolSlug}/settings/integrations`,
      icon: Database,
      completed: checklistItems['connect-sis'] ?? false,
      required: true,
    },
    {
      id: 'connect-assessments',
      title: 'Link assessment data',
      description: 'Import scores from NWEA MAP, iReady, or Renaissance STAR',
      href: `/${schoolSlug}/settings/integrations`,
      icon: Target,
      completed: checklistItems['connect-assessments'] ?? false,
      required: true,
    },
    {
      id: 'invite-team',
      title: 'Invite your team',
      description: 'Add teachers and administrators to collaborate',
      href: `/${schoolSlug}/settings`,
      icon: Users,
      completed: checklistItems['invite-team'] ?? false,
      required: false,
    },
    {
      id: 'explore-dashboard',
      title: 'Explore the dashboard',
      description: 'Take a quick tour of key features and metrics',
      href: `/${schoolSlug}/dashboard`,
      icon: Play,
      completed: checklistItems['explore-dashboard'] ?? false,
      required: false,
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  if (completedCount === items.length) {
    return null; // All complete, hide the checklist
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-900/30 via-slate-800/50 to-cyan-900/20 border-indigo-500/30 mb-8">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Getting Started</h2>
              <p className="text-sm text-slate-400">Complete these steps to unlock the full power of EduNode</p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-slate-500 hover:text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">{completedCount} of {items.length} complete</span>
            <span className="text-sm font-bold text-indigo-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist items */}
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl transition group',
                  item.completed
                    ? 'bg-emerald-900/20 border border-emerald-500/20'
                    : 'bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  item.completed ? 'bg-emerald-500/20' : 'bg-slate-700'
                )}>
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-medium',
                      item.completed ? 'text-emerald-400 line-through' : 'text-white'
                    )}>
                      {item.title}
                    </span>
                    {item.required && !item.completed && (
                      <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate">{item.description}</p>
                </div>
                {!item.completed && (
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition" />
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Quick Start Resources Card
 */
export function QuickStartResources({ schoolSlug }: { schoolSlug: string }) {
  const resources = [
    {
      title: 'Platform Tour',
      description: 'Watch a 5-minute overview of key features',
      icon: Video,
      href: '#',
      badge: 'Video',
    },
    {
      title: 'Documentation',
      description: 'Detailed guides and best practices',
      icon: BookOpen,
      href: `/${schoolSlug}/help`,
      badge: null,
    },
    {
      title: 'Contact Support',
      description: 'Get help from our team',
      icon: MessageSquare,
      href: `/${schoolSlug}/help`,
      badge: null,
    },
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="pt-6">
        <h3 className="font-semibold text-white mb-4">Quick Start Resources</h3>
        <div className="space-y-3">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Link
                key={resource.title}
                href={resource.href}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{resource.title}</span>
                    {resource.badge && (
                      <Badge className="bg-indigo-500/20 text-indigo-400 text-[10px]">{resource.badge}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{resource.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Welcome Banner for first-time users
 */
export function WelcomeBanner({
  schoolName,
  userName,
  onDismiss,
}: {
  schoolName: string;
  userName?: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 rounded-2xl p-6 mb-8 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
      </div>

      <div className="relative flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome{userName ? `, ${userName}` : ''}!
          </h1>
          <p className="text-indigo-100 max-w-xl">
            You&apos;re viewing the analytics dashboard for <span className="font-semibold">{schoolName}</span>.
            Let&apos;s get you set up for success.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
            Start Setup
          </Button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-2 text-indigo-200 hover:text-white transition rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
