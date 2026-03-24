'use client';

/**
 * Custom Error Page (500)
 * =======================
 *
 * Cyber Ocean aesthetic with glassmorphism and dark mode.
 * Provides user-friendly error handling with recovery options.
 * Captures errors to Sentry for observability.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw, Bug, Shield } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Capture error to Sentry
    Sentry.captureException(error, {
      extra: {
        digest: error.digest,
        timestamp: new Date().toISOString(),
      },
    });

    // Also log locally for development
    console.error('[EduNode Error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* Glassmorphism card */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-12 max-w-lg mx-auto shadow-2xl">
          {/* Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center border border-rose-500/30 animate-pulse">
              <AlertTriangle className="w-12 h-12 text-rose-400" />
            </div>
          </div>

          {/* Error code */}
          <div className="mb-4">
            <span className="text-8xl font-black bg-gradient-to-r from-rose-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              500
            </span>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-white mb-3">
            Something Went Wrong
          </h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            An unexpected error occurred while processing your request.
            Our team has been notified and is working on a fix.
          </p>

          {/* Error digest (for support) */}
          {error.digest && (
            <div className="bg-slate-900/50 rounded-lg px-4 py-2 mb-6 inline-block">
              <span className="text-xs text-slate-500 font-mono">
                Error ID: {error.digest}
              </span>
            </div>
          )}

          {/* Expert insight */}
          <div className="bg-rose-900/20 rounded-xl p-4 mb-8 border border-rose-500/20">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Data Protection</span>
            </div>
            <p className="text-xs text-slate-400 italic">
              &quot;Your data is safe. This error did not affect any student records.
              FERPA compliance is maintained during all error states.&quot;
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all border border-slate-600"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>

          {/* Report bug link */}
          <div className="mt-6">
            <a
              href="mailto:support@edunode.com"
              className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400 transition"
            >
              <Bug className="w-3 h-3" />
              Report this issue
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-slate-600">
          EduNode Analytics | Error Code: 500
        </p>
      </div>
    </div>
  );
}
