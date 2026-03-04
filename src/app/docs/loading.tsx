/**
 * Documentation Loading Skeleton
 */
export default function DocsLoading() {
  return (
    <div className="min-h-screen bg-slate-900 animate-pulse">
      {/* Navigation skeleton */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="h-8 w-40 bg-slate-800 rounded" />
            <div className="flex items-center gap-4">
              <div className="h-8 w-20 bg-slate-800 rounded" />
              <div className="h-10 w-28 bg-slate-800 rounded-lg" />
            </div>
          </div>
        </div>
      </nav>

      {/* Content skeleton */}
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-8">
            {/* Sidebar skeleton */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="space-y-4">
                <div className="h-5 w-32 bg-slate-800 rounded" />
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 w-full bg-slate-800/60 rounded" />
                ))}
              </div>
            </div>

            {/* Main content skeleton */}
            <div className="flex-1">
              <div className="h-10 w-64 bg-slate-800 rounded-lg mb-6" />
              <div className="h-6 w-full bg-slate-800/60 rounded mb-4" />
              <div className="h-6 w-3/4 bg-slate-800/60 rounded mb-8" />

              {/* Cards skeleton */}
              <div className="grid sm:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
                  >
                    <div className="w-12 h-12 bg-slate-700 rounded-lg mb-4" />
                    <div className="h-6 w-40 bg-slate-700 rounded mb-2" />
                    <div className="h-4 w-full bg-slate-700/60 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
