'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  PageHeader,
} from '@/components/layout/dashboard-shell';
import { PageFeatureGate } from '@/components/features/page-feature-gate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SCHOOL_SEEDS } from '@/lib/data/seed-data';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Award,
  ChevronRight,
  Download,
  Filter,
} from 'lucide-react';

/**
 * Network View Dashboard
 *
 * Enterprise-only feature for Charter Management Organizations (CMOs)
 * Provides cross-school visibility with:
 * - Comparative metrics across all schools in the network
 * - Network-wide benchmarking
 * - Risk distribution heatmap
 * - School performance rankings
 */

interface SchoolMetric {
  slug: string;
  name: string;
  enrollment: number;
  attendanceRate: number;
  avgGrowthPercentile: number;
  avgProficiency: number;
  riskDistribution: {
    onTrack: number;
    atRisk: number;
    critical: number;
  };
  trend: 'up' | 'down' | 'stable';
  tier: 'starter' | 'pro' | 'enterprise';
}

// Generate network metrics from seed data
function getNetworkMetrics(): SchoolMetric[] {
  return Object.entries(SCHOOL_SEEDS).map(([slug, school]) => ({
    slug,
    name: school.name,
    enrollment: school.metrics.totalEnrollment,
    attendanceRate: school.metrics.attendanceRate,
    avgGrowthPercentile: school.metrics.avgGrowthPercentile,
    avgProficiency: school.metrics.avgProficiency,
    riskDistribution: school.metrics.riskDistribution,
    trend: school.metrics.avgGrowthPercentile > 60 ? 'up' : school.metrics.avgGrowthPercentile > 50 ? 'stable' : 'down',
    tier: school.subscriptionTier,
  }));
}

export default function NetworkViewPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  const [selectedMetric, setSelectedMetric] = React.useState<'growth' | 'proficiency' | 'attendance'>('growth');
  const [sortBy, setSortBy] = React.useState<'name' | 'enrollment' | 'growth'>('growth');

  const networkMetrics = React.useMemo(() => getNetworkMetrics(), []);

  // Calculate network-wide aggregates
  const networkAggregates = React.useMemo(() => {
    const totalEnrollment = networkMetrics.reduce((sum, s) => sum + s.enrollment, 0);
    const avgAttendance = networkMetrics.reduce((sum, s) => sum + s.attendanceRate, 0) / networkMetrics.length;
    const avgGrowth = networkMetrics.reduce((sum, s) => sum + s.avgGrowthPercentile, 0) / networkMetrics.length;
    const avgProficiency = networkMetrics.reduce((sum, s) => sum + s.avgProficiency, 0) / networkMetrics.length;

    const totalOnTrack = networkMetrics.reduce((sum, s) => sum + s.riskDistribution.onTrack, 0);
    const totalAtRisk = networkMetrics.reduce((sum, s) => sum + s.riskDistribution.atRisk, 0);
    const totalCritical = networkMetrics.reduce((sum, s) => sum + s.riskDistribution.critical, 0);

    return {
      totalEnrollment,
      avgAttendance: Math.round(avgAttendance * 1000) / 10,
      avgGrowth: Math.round(avgGrowth * 10) / 10,
      avgProficiency: Math.round(avgProficiency * 10) / 10,
      totalOnTrack,
      totalAtRisk,
      totalCritical,
      schoolCount: networkMetrics.length,
    };
  }, [networkMetrics]);

  // Sort schools
  const sortedSchools = React.useMemo(() => {
    return [...networkMetrics].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'enrollment':
          return b.enrollment - a.enrollment;
        case 'growth':
        default:
          return b.avgGrowthPercentile - a.avgGrowthPercentile;
      }
    });
  }, [networkMetrics, sortBy]);

  return (
    <PageFeatureGate featureKey="network_view">
      <PageHeader
        title="Network View"
        description="Cross-school analytics and benchmarking for your CMO network"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {/* Network Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/10 border-indigo-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <Badge className="bg-indigo-500/20 text-indigo-400 text-xs">Network</Badge>
            </div>
            <div className="text-3xl font-bold text-white">{networkAggregates.schoolCount}</div>
            <div className="text-sm text-slate-400">Schools</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/10 border-cyan-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-xs text-emerald-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +3.2%
              </span>
            </div>
            <div className="text-3xl font-bold text-white">{networkAggregates.totalEnrollment.toLocaleString()}</div>
            <div className="text-sm text-slate-400">Total Students</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +5.1
              </span>
            </div>
            <div className="text-3xl font-bold text-white">{networkAggregates.avgGrowth}%</div>
            <div className="text-sm text-slate-400">Avg Growth Percentile</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +0.8%
              </span>
            </div>
            <div className="text-3xl font-bold text-white">{networkAggregates.avgAttendance}%</div>
            <div className="text-sm text-slate-400">Avg Attendance</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Network Risk Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              Network Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-300">On Track</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {networkAggregates.totalOnTrack} ({Math.round(networkAggregates.totalOnTrack / networkAggregates.totalEnrollment * 100)}%)
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(networkAggregates.totalOnTrack / networkAggregates.totalEnrollment) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-slate-300">At Risk</span>
                  </div>
                  <span className="text-sm font-bold text-amber-400">
                    {networkAggregates.totalAtRisk} ({Math.round(networkAggregates.totalAtRisk / networkAggregates.totalEnrollment * 100)}%)
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(networkAggregates.totalAtRisk / networkAggregates.totalEnrollment) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-sm text-slate-300">Critical</span>
                  </div>
                  <span className="text-sm font-bold text-rose-400">
                    {networkAggregates.totalCritical} ({Math.round(networkAggregates.totalCritical / networkAggregates.totalEnrollment * 100)}%)
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(networkAggregates.totalCritical / networkAggregates.totalEnrollment) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <div className="text-xs text-slate-500 mb-2">Network Benchmark</div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-slate-300">
                  Your network is <span className="text-emerald-400 font-bold">+12%</span> above state average
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Performance Comparison */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                School Performance Comparison
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as typeof selectedMetric)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm text-white"
                >
                  <option value="growth">Growth Percentile</option>
                  <option value="proficiency">Proficiency</option>
                  <option value="attendance">Attendance</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedSchools.map((school, index) => {
                const value = selectedMetric === 'growth'
                  ? school.avgGrowthPercentile
                  : selectedMetric === 'proficiency'
                  ? school.avgProficiency
                  : school.attendanceRate * 100;

                const networkAvg = selectedMetric === 'growth'
                  ? networkAggregates.avgGrowth
                  : selectedMetric === 'proficiency'
                  ? networkAggregates.avgProficiency
                  : networkAggregates.avgAttendance;

                const isAboveAvg = value > networkAvg;

                return (
                  <div key={school.slug} className="flex items-center gap-4">
                    <div className="w-6 text-center text-sm font-bold text-slate-500">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white truncate">
                          {school.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-sm font-bold',
                            isAboveAvg ? 'text-emerald-400' : 'text-amber-400'
                          )}>
                            {value.toFixed(1)}%
                          </span>
                          {isAboveAvg ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            isAboveAvg ? 'bg-emerald-500' : 'bg-amber-500'
                          )}
                          style={{ width: `${Math.min(value, 100)}%` }}
                        />
                        {/* Network average marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-indigo-400"
                          style={{ left: `${networkAvg}%` }}
                        />
                      </div>
                    </div>
                    <Badge className={cn(
                      'text-[10px]',
                      school.slug === school_slug && 'bg-indigo-500/20 text-indigo-400'
                    )}>
                      {school.enrollment}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
              <div className="w-3 h-0.5 bg-indigo-400" />
              <span>Network Average</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Cards */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Schools in Network</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm text-white"
          >
            <option value="growth">Growth</option>
            <option value="enrollment">Enrollment</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedSchools.map((school) => (
          <Card
            key={school.slug}
            className={cn(
              'hover:border-indigo-500/50 transition cursor-pointer',
              school.slug === school_slug && 'border-indigo-500/50 bg-indigo-900/10'
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">{school.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-slate-700 text-slate-300 text-xs">
                      {school.enrollment} students
                    </Badge>
                    {school.slug === school_slug && (
                      <Badge className="bg-indigo-500/20 text-indigo-400 text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={cn(
                  'p-2 rounded-lg',
                  school.trend === 'up' && 'bg-emerald-500/20',
                  school.trend === 'down' && 'bg-rose-500/20',
                  school.trend === 'stable' && 'bg-slate-700'
                )}>
                  {school.trend === 'up' && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                  {school.trend === 'down' && <TrendingDown className="w-5 h-5 text-rose-400" />}
                  {school.trend === 'stable' && <Activity className="w-5 h-5 text-slate-400" />}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Growth</div>
                  <div className="text-lg font-bold text-white">{school.avgGrowthPercentile.toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Proficiency</div>
                  <div className="text-lg font-bold text-white">{school.avgProficiency.toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Attendance</div>
                  <div className="text-lg font-bold text-white">{(school.attendanceRate * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* Mini risk distribution */}
              <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-l-full"
                  style={{ width: `${(school.riskDistribution.onTrack / school.enrollment) * 100}%` }}
                />
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${(school.riskDistribution.atRisk / school.enrollment) * 100}%` }}
                />
                <div
                  className="h-full bg-rose-500 rounded-r-full"
                  style={{ width: `${(school.riskDistribution.critical / school.enrollment) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-end mt-4">
                <Button variant="ghost" size="sm" className="text-indigo-400">
                  View Details
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageFeatureGate>
  );
}
