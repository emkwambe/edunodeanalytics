/**
 * Custom 404 Not Found Page
 * =========================
 *
 * Cyber Ocean aesthetic with glassmorphism and dark mode.
 * Maintains brand consistency during error states.
 */

import Link from 'next/link';
import { FileSearch, Home, ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
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
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
              <FileSearch className="w-12 h-12 text-indigo-400" />
            </div>
          </div>

          {/* Error code */}
          <div className="mb-4">
            <span className="text-8xl font-black bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              404
            </span>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-white mb-3">
            Page Not Found
          </h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            This could be an invalid school URL or a removed feature.
          </p>

          {/* Expert insight */}
          <div className="bg-slate-900/50 rounded-xl p-4 mb-8 border border-slate-700/50">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Compass className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Navigation Help</span>
            </div>
            <p className="text-xs text-slate-400 italic">
              &quot;Check that your school slug is correct in the URL. If you were redirected here,
              you may not have access to the requested resource.&quot;
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            <button
              onClick={() => typeof window !== 'undefined' && window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all border border-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-slate-600">
          EduNode Analytics | Error Code: 404
        </p>
      </div>
    </div>
  );
}
