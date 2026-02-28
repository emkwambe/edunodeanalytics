'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorFallbackProps {
  error?: Error;
  reset?: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  reset,
  title = 'Something went wrong',
  description,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="rounded-full bg-red-500/10 p-4 mb-6">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-200 mb-2">{title}</h2>
      <p className="text-sm text-slate-400 mb-6 max-w-md">
        {description || error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <div className="flex gap-3">
        {reset && (
          <Button onClick={reset} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Go home
          </Link>
        </Button>
      </div>
    </div>
  );
}
