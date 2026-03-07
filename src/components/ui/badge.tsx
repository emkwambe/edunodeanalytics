'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge component with EduNode status variants
 */

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-700 text-slate-200 border border-slate-600',
        primary: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        secondary: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
        accent: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        destructive: 'bg-red-500/20 text-red-400 border border-red-500/30',
        warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        outline: 'bg-transparent text-slate-300 border border-slate-600',
        // Status variants for student risk levels (4-tier MTSS model)
        'on-track': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        watch: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        'at-risk': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
