import { Card, CardContent } from '@/components/ui/card';

/**
 * Students Page Loading Skeleton
 */
export default function StudentsLoading() {
  return (
    <div className="min-h-screen bg-slate-900 p-6 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-40 bg-slate-800 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-slate-800/60 rounded" />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="h-10 w-64 bg-slate-800 rounded-lg" />
          <div className="h-10 w-32 bg-slate-800 rounded-lg" />
          <div className="h-10 w-32 bg-slate-800 rounded-lg" />
        </div>

        {/* Risk summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-4">
                <div className="h-4 w-16 bg-slate-700 rounded mb-2" />
                <div className="h-6 w-10 bg-slate-700 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Student cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-full" />
                  <div>
                    <div className="h-4 w-28 bg-slate-700 rounded mb-1" />
                    <div className="h-3 w-20 bg-slate-700/60 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-700/40 rounded" />
                  <div className="h-3 w-3/4 bg-slate-700/40 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
