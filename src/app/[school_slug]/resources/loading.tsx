import { Card, CardContent } from '@/components/ui/card';

/**
 * Resources Page Loading Skeleton
 */
export default function ResourcesLoading() {
  return (
    <div className="min-h-screen bg-slate-900 p-6 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-slate-800 rounded-xl" />
            <div className="h-8 w-48 bg-slate-800 rounded-lg" />
          </div>
          <div className="h-4 w-80 bg-slate-800/60 rounded" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-4 pb-4 flex items-center gap-4">
                <div className="w-11 h-11 bg-slate-700 rounded-xl" />
                <div>
                  <div className="h-7 w-12 bg-slate-700 rounded mb-1" />
                  <div className="h-3 w-24 bg-slate-700/60 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Role filter */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 w-32 bg-slate-700 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Module cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-slate-700 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-5 w-48 bg-slate-700 rounded mb-2" />
                      <div className="h-3 w-full bg-slate-700/40 rounded mb-3" />
                      <div className="h-3 w-40 bg-slate-700/30 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-4 pb-4">
                  <div className="h-4 w-36 bg-slate-700 rounded mb-2" />
                  <div className="h-3 w-full bg-slate-700/40 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
