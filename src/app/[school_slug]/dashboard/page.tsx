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
import { Button } from '@/components/ui/button';
import { generateMockDashboardData } from '@/lib/mock-data';
import { Users, Calendar, AlertTriangle, TrendingUp, Download, RefreshCw } from 'lucide-react';

/**
 * Dashboard Overview Page
 *
 * Main landing page for the school dashboard
 * Shows key metrics and visualizations
 */

interface DashboardPageProps {
  params: { school_slug: string };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  // In production, this would fetch from BigQuery via a data layer
  // For now, using mock data
  const data = generateMockDashboardData();

  return (
    <>
      <PageHeader
        title="Dashboard Overview"
        description="Real-time insights for your school"
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

      {/* Metrics Row */}
      <DashboardGrid className="mb-6">
        <GridItem span={4}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="Total Enrollment"
              value={data.metrics.totalEnrollment}
              format="number"
              subtitle="Active students"
              icon={<Users className="w-5 h-5" />}
              variant="default"
            />
          </Suspense>
        </GridItem>

        <GridItem span={4}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="Attendance Rate"
              value={data.metrics.attendanceRate}
              format="percent"
              previousValue={0.94}
              subtitle="YTD Average"
              icon={<Calendar className="w-5 h-5" />}
              variant={data.metrics.attendanceRate >= 0.95 ? 'success' : 'warning'}
            />
          </Suspense>
        </GridItem>

        <GridItem span={4}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="Chronic Absence"
              value={data.metrics.chronicAbsenceCount}
              format="number"
              subtitle="Students < 90% attendance"
              icon={<AlertTriangle className="w-5 h-5" />}
              variant="danger"
            />
          </Suspense>
        </GridItem>

        <GridItem span={4}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="Growth Percentile"
              value={data.metrics.avgGrowthPercentile}
              subtitle="Composite SGP"
              icon={<TrendingUp className="w-5 h-5" />}
              variant={data.metrics.avgGrowthPercentile >= 50 ? 'success' : 'warning'}
            />
          </Suspense>
        </GridItem>
      </DashboardGrid>

      {/* Charts Row */}
      <DashboardGrid>
        <GridItem span={8}>
          <Suspense fallback={<AttendanceTrendChartSkeleton />}>
            <AttendanceTrendChart
              data={data.attendanceTrend}
              title="Attendance Trend"
              subtitle="Weekly attendance rate"
              showTarget
              showChronicAbsence
              schoolName={params.school_slug.replace(/-/g, ' ')}
            />
          </Suspense>
        </GridItem>

        <GridItem span={4}>
          <Suspense fallback={<RiskDistributionChartSkeleton />}>
            <RiskDistributionChart
              data={data.riskDistribution}
              title="Risk Distribution"
              subtitle="Student classification"
            />
          </Suspense>
        </GridItem>
      </DashboardGrid>
    </>
  );
}

// Page metadata
export const metadata = {
  title: 'Dashboard Overview',
};
