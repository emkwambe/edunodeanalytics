import { Suspense } from 'react';
import {
  PageHeader,
  DashboardGrid,
  GridItem,
} from '@/components/layout/dashboard-shell';
import { MetricCard, MetricCardSkeleton } from '@/components/dashboard/metric-card';
import {
  AttendanceTrendChart,
  AttendanceTrendChartSkeleton,
} from '@/components/charts/attendance-trend-chart';
import {
  RiskDistributionChart,
  RiskDistributionChartSkeleton,
} from '@/components/charts/risk-distribution-chart';
import { SeedImportNotification } from '@/components/dashboard/seed-notification';
import { Button } from '@/components/ui/button';
import { bigQueryProvider } from '@/lib/data/bigquery-provider';
import { Users, Calendar, AlertTriangle, TrendingUp, Download, RefreshCw } from 'lucide-react';

/**
 * Dashboard Overview Page
 *
 * Main landing page for the school dashboard
 * Uses BigQuery provider with "Independent Excellence" seed data
 */

interface DashboardPageProps {
  params: { school_slug: string };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { school_slug } = params;

  // Fetch data from BigQuery provider (uses strategic seed data)
  const [metricsResult, attendanceResult, riskResult] = await Promise.all([
    bigQueryProvider.getSchoolMetrics(school_slug),
    bigQueryProvider.getAttendanceTrend(school_slug, 16),
    bigQueryProvider.getRiskDistribution(school_slug),
  ]);

  const hasData = await bigQueryProvider.hasSchoolData(school_slug);
  const metrics = metricsResult.data;
  const attendanceTrend = attendanceResult.data;
  const riskDistribution = riskResult.data;

  // If no data, show seed import notification
  if (!hasData || !metrics) {
    return (
      <>
        <PageHeader
          title="Dashboard Overview"
          description="Real-time insights for your school"
        />
        <SeedImportNotification schoolSlug={school_slug} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard Overview"
        description="Real-time insights powered by strategic growth metrics"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="default" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Strategic Highlight: Growth Percentile Banner */}
      {metrics.avgGrowthPercentile >= 70 && (
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-400">
                High Growth School
              </p>
              <p className="text-xs text-slate-400">
                Your {metrics.avgGrowthPercentile.toFixed(0)}th percentile growth demonstrates exceptional student progress
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <DashboardGrid className="mb-6">
        <GridItem span={3}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="Total Enrollment"
              value={metrics.totalEnrollment}
              format="number"
              subtitle="Active students"
              icon={<Users className="w-5 h-5" />}
              variant="default"
            />
          </Suspense>
        </GridItem>

        <GridItem span={3}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="Attendance Rate"
              value={metrics.attendanceRate}
              format="percent"
              previousValue={0.94}
              subtitle="YTD Average"
              icon={<Calendar className="w-5 h-5" />}
              variant={metrics.attendanceRate >= 0.95 ? 'success' : 'warning'}
            />
          </Suspense>
        </GridItem>

        <GridItem span={3}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="Chronic Absence"
              value={metrics.chronicAbsenceCount}
              format="number"
              subtitle={`${(metrics.chronicAbsenceRate * 100).toFixed(1)}% of students`}
              icon={<AlertTriangle className="w-5 h-5" />}
              variant="danger"
              href={`/${school_slug}/dashboard/students?filter=chronic`}
            />
          </Suspense>
        </GridItem>

        <GridItem span={3}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="Growth Percentile"
              value={metrics.avgGrowthPercentile}
              subtitle="Composite SGP - Key Renewal Metric"
              icon={<TrendingUp className="w-5 h-5" />}
              variant={metrics.avgGrowthPercentile >= 60 ? 'success' :
                       metrics.avgGrowthPercentile >= 40 ? 'warning' : 'danger'}
            />
          </Suspense>
        </GridItem>
      </DashboardGrid>

      {/* Charts Row */}
      <DashboardGrid>
        <GridItem span={8}>
          <Suspense fallback={<AttendanceTrendChartSkeleton />}>
            <AttendanceTrendChart
              data={attendanceTrend}
              title="Attendance Trend"
              subtitle="Weekly attendance with chronic absence tracking"
              showTarget
              showChronicAbsence
              schoolName={school_slug.replace(/-/g, ' ')}
            />
          </Suspense>
        </GridItem>

        <GridItem span={4}>
          <Suspense fallback={<RiskDistributionChartSkeleton />}>
            <RiskDistributionChart
              data={riskDistribution}
              title="Risk Distribution"
              subtitle="Student classification by risk level"
            />
          </Suspense>
        </GridItem>
      </DashboardGrid>

      {/* Data Source Footer */}
      <div className="mt-6 text-center text-xs text-slate-500">
        Data source: {metricsResult.metadata.source === 'mock' ? 'Strategic Seed Data' : 'BigQuery'} |
        Query time: {metricsResult.metadata.queryTime.toFixed(2)}ms
      </div>
    </>
  );
}

// Page metadata
export const metadata = {
  title: 'Dashboard Overview',
};
