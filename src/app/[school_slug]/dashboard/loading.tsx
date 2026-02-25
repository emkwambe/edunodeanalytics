import { Card, CardContent } from '@/components/ui/card';

/**
 * Dashboard Loading Skeleton
 *
 * Displays while the dashboard page is loading.
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-900 p-6 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-slate-800 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-slate-800/60 rounded" />
        </div>

        {/* Metric cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-24 bg-slate-700 rounded" />
                  <div className="w-8 h-8 bg-slate-700 rounded-lg" />
                </div>
                <div className="h-8 w-20 bg-slate-700 rounded mb-2" />
                <div className="h-3 w-32 bg-slate-700/60 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="h-5 w-36 bg-slate-700 rounded mb-4" />
                <div className="h-64 bg-slate-700/30 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
