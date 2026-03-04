/**
 * Admin Dashboard Loading Skeleton
 */
export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-900 animate-pulse">
      {/* Navigation skeleton */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="h-8 w-40 bg-slate-800 rounded" />
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-slate-800 rounded-full" />
            </div>
          </div>
        </div>
      </nav>

      {/* Content skeleton */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 w-48 bg-slate-800 rounded-lg mb-2" />
            <div className="h-4 w-72 bg-slate-800/60 rounded" />
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 w-24 bg-slate-700 rounded" />
                  <div className="w-10 h-10 bg-slate-700 rounded-lg" />
                </div>
                <div className="h-8 w-20 bg-slate-700 rounded mb-2" />
                <div className="h-3 w-32 bg-slate-700/60 rounded" />
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <div className="h-6 w-40 bg-slate-700 rounded" />
            </div>
            <div className="p-6">
              {/* Table header */}
              <div className="grid grid-cols-5 gap-4 pb-4 border-b border-slate-700">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-700 rounded" />
                ))}
              </div>
              {/* Table rows */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-5 gap-4 py-4 border-b border-slate-700/50"
                >
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 bg-slate-700/60 rounded" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
