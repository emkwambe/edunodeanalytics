'use client';

import { useUser, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';

/**
 * Unauthorized Access Page
 *
 * Shown when a user tries to access a school they don't have permission for.
 * Provides helpful options for next steps.
 */
export default function UnauthorizedPage() {
  const { user, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Glass Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Warning Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Access Denied
          </h1>

          {/* Description */}
          <p className="text-slate-400 text-center mb-6">
            You don&apos;t have permission to access this school. This could be because:
          </p>

          {/* Reasons List */}
          <ul className="text-sm text-slate-400 space-y-2 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>Your account hasn&apos;t been linked to this school yet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>You need to be invited by a school administrator</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">•</span>
              <span>The school URL may be incorrect</span>
            </li>
          </ul>

          {/* User Info */}
          {isLoaded && user && (
            <div className="bg-slate-800/50 rounded-lg p-3 mb-6">
              <p className="text-xs text-slate-500 mb-1">Signed in as:</p>
              <p className="text-sm text-white font-medium">
                {user.emailAddresses[0]?.emailAddress || user.firstName || 'User'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/select-school"
              className="block w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium rounded-xl text-center hover:from-indigo-600 hover:to-cyan-600 transition-all"
            >
              Go to School Selection
            </Link>

            <Link
              href="/"
              className="block w-full py-3 px-4 bg-white/5 text-white font-medium rounded-xl text-center hover:bg-white/10 transition-all border border-white/10"
            >
              Return to Home
            </Link>

            <SignOutButton>
              <button className="block w-full py-3 px-4 text-slate-400 text-sm text-center hover:text-white transition-colors">
                Sign out and use a different account
              </button>
            </SignOutButton>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Need help? Contact your school administrator or{' '}
          <a href="mailto:support@edunode.io" className="text-cyan-400 hover:underline">
            EduNode Support
          </a>
        </p>
      </div>
    </div>
  );
}
