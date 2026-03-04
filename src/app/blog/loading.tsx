/**
 * Blog Loading Skeleton
 */
export default function BlogLoading() {
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

      {/* Hero skeleton */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-12 w-48 bg-slate-800 rounded-lg mx-auto mb-6" />
          <div className="h-6 w-80 bg-slate-800/60 rounded mx-auto" />
        </div>
      </section>

      {/* Featured post skeleton */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="h-48 bg-slate-700/50 rounded-xl mb-6" />
            <div className="h-8 w-3/4 bg-slate-700 rounded mb-4" />
            <div className="h-4 w-full bg-slate-700/60 rounded mb-2" />
            <div className="h-4 w-2/3 bg-slate-700/60 rounded" />
          </div>
        </div>
      </section>

      {/* Blog posts grid skeleton */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
              >
                <div className="h-40 bg-slate-700/50" />
                <div className="p-6">
                  <div className="h-4 w-20 bg-slate-700 rounded mb-3" />
                  <div className="h-6 w-full bg-slate-700 rounded mb-2" />
                  <div className="h-4 w-full bg-slate-700/60 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-slate-700/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
