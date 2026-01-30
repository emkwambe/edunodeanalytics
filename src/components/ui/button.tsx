'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button component with EduNode styling
 */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-indigo-500 text-white hover:bg-indigo-600 focus-visible:ring-indigo-500',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
        outline:
          'border border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800 hover:border-slate-500 focus-visible:ring-slate-500',
        secondary:
          'bg-slate-700 text-slate-200 hover:bg-slate-600 focus-visible:ring-slate-500',
        ghost:
          'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 focus-visible:ring-slate-500',
        link: 'text-indigo-400 underline-offset-4 hover:underline focus-visible:ring-indigo-500',
        gradient:
          'bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 text-white hover:opacity-90 focus-visible:ring-indigo-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
