'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon, FileQuestion } from 'lucide-react';

/**
 * EmptyState Component
 *
 * Consistent empty state pattern for dashboard pages.
 * Shows friendly message with icon, title, description, and optional action.
 */

export interface EmptyStateProps {
  /** Lucide icon to display */
  icon?: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Additional CSS classes */
  className?: string;
  /** Variant for different visual styles */
  variant?: 'default' | 'card' | 'inline';
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const content = (
    <div className={cn(
      'text-center py-12',
      variant === 'inline' && 'py-8',
      className
    )}>
      <div className={cn(
        'mx-auto mb-4 rounded-full flex items-center justify-center',
        'w-16 h-16 bg-slate-800/50 border border-slate-700/50',
        variant === 'inline' && 'w-12 h-12'
      )}>
        <Icon className={cn(
          'text-slate-500',
          variant === 'inline' ? 'w-6 h-6' : 'w-8 h-8'
        )} />
      </div>

      <h3 className={cn(
        'font-semibold text-slate-200 mb-2',
        variant === 'inline' ? 'text-base' : 'text-lg'
      )}>
        {title}
      </h3>

      <p className={cn(
        'text-slate-400 max-w-md mx-auto mb-6',
        variant === 'inline' ? 'text-sm mb-4' : 'text-sm'
      )}>
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3">
          {action && (
            action.href ? (
              <Button asChild>
                <a href={action.href}>{action.label}</a>
              </Button>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Button variant="outline" asChild>
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              </Button>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className="border-slate-700 bg-slate-800/30">
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return content;
}

/**
 * Loading Skeleton for Empty State
 */
export function EmptyStateSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-slate-800/50 animate-pulse" />
      <div className="h-5 w-48 bg-slate-800/50 rounded mx-auto mb-3 animate-pulse" />
      <div className="h-4 w-64 bg-slate-800/50 rounded mx-auto animate-pulse" />
    </div>
  );
}
