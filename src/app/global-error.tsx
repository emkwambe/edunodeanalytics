'use client';

/**
 * Global Error Boundary
 *
 * Catches errors thrown at the root layout level (e.g., Clerk auth failures).
 * This is required because the regular error.tsx cannot catch errors from
 * providers in the root layout like ClerkProvider.
 */

export default function GlobalError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-10 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-rose-500/20 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Session Error</h1>
          <p className="text-slate-400 text-sm mb-6">
            Your session may have expired. Please try again or sign in.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
            <a
              href="/sign-in"
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
