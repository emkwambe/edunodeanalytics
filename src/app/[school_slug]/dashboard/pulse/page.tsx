import { Suspense } from 'react';
import {
  PageHeader,
  DashboardGrid,
  GridItem,
} from '@/components/layout/dashboard-shell';
import { MetricCard, MetricCardSkeleton } from '@/components/dashboard/metric-card';
import {
  MasteryCurveChart,
  MasteryCurveChartSkeleton,
} from '@/components/charts/mastery-curve-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Student360Card,
  Student360CardSkeleton,
} from '@/components/dashboard/student-360-card';
import { RiskDistribution } from '@/components/dashboard/status-indicator';
import { generateMockDashboardData } from '@/lib/mock-data';
import { Activity, BookOpen, Target, AlertCircle } from 'lucide-react';
import { PageFeatureGate } from '@/components/features/page-feature-gate';

/**
 * Instructional Pulse Dashboard
 *
 * Real-time formative assessment mastery curves and early warning indicators
 * Key page for instructional staff to monitor student progress
 */

interface PulsePageProps {
  params: Promise<{ school_slug: string }>;
}

export default async function PulsePage({ params }: PulsePageProps) {
  // In Next.js 15+, params is a Promise
  const { school_slug } = await params;
  const data = generateMockDashboardData();

  // Get critical students for alert section
  const criticalStudents = data.students
    .filter((s) => s.riskLevel === 'critical')
    .slice(0, 4);

  // Calculate mastery stats
  const latestMastery = data.masteryData.reduce(
    (acc, subject) => {
      const latest = subject.data[subject.data.length - 1];
      acc[subject.subject] = latest?.masteryRate ?? 0;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgMastery =
    Object.values(latestMastery).reduce((a, b) => a + b, 0) /
    Object.values(latestMastery).length;

  return (
    <PageFeatureGate featureKey="ai_pulse">
      <PageHeader
        title="Instructional Pulse"
        description="Real-time formative assessment mastery and early warning indicators"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${school_slug}/dashboard` },
          { label: 'Instructional Pulse' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Activity className="w-3 h-3 mr-1" />
              Updated 5m ago
            </Badge>
          </div>
        }
      />

      {/* Metrics Row */}
      <DashboardGrid className="mb-6">
        <GridItem span={4}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="Average Mastery"
              value={avgMastery}
              format="percent"
              subtitle="All subjects"
              icon={<Target className="w-5 h-5" />}
              variant={avgMastery >= 0.8 ? 'success' : avgMastery >= 0.6 ? 'warning' : 'danger'}
            />
          </Suspense>
        </GridItem>

        <GridItem span={4}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="ELA Mastery"
              value={latestMastery['ELA'] || 0}
              format="percent"
              subtitle="Latest assessment"
              icon={<BookOpen className="w-5 h-5" />}
              variant={(latestMastery['ELA'] || 0) >= 0.8 ? 'success' : 'warning'}
            />
          </Suspense>
        </GridItem>

        <GridItem span={4}>
          <Suspense fallback={<MetricCardSkeleton />}>
            <MetricCard
              title="Critical Alerts"
              value={criticalStudents.length}
              format="number"
              subtitle="Students need intervention"
              icon={<AlertCircle className="w-5 h-5" />}
              variant="danger"
            />
          </Suspense>
        </GridItem>
      </DashboardGrid>

      {/* Main Content Grid */}
      <DashboardGrid className="mb-6">
        {/* Mastery Curves */}
        <GridItem span={8}>
          <Suspense fallback={<MasteryCurveChartSkeleton />}>
            <MasteryCurveChart
              subjects={data.masteryData}
              title="Weekly Mastery Trends"
              subtitle="Formative assessment performance by subject"
              height={350}
            />
          </Suspense>
        </GridItem>

        {/* Risk Summary */}
        <GridItem span={4}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Early Warning Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RiskDistribution
                onTrack={data.riskDistribution.onTrack}
                atRisk={data.riskDistribution.atRisk}
                critical={data.riskDistribution.critical}
              />

              <div className="pt-4 border-t border-slate-700/50">
                <h4 className="text-sm font-medium text-slate-300 mb-3">
                  Chronic Absenteeism Warning
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Students at risk</span>
                  <span className="font-medium text-amber-400">
                    {data.metrics.chronicAbsenceCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-400">Below 85% attendance</span>
                  <span className="font-medium text-red-400">
                    {Math.round(data.metrics.chronicAbsenceCount * 0.4)}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <a href={`/${school_slug}/dashboard/students?filter=at_risk`}>
                  View All At-Risk Students
                </a>
              </Button>
            </CardContent>
          </Card>
        </GridItem>
      </DashboardGrid>

      {/* Critical Students Alert Section */}
      {criticalStudents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Critical Attention Needed
              </h2>
              <p className="text-sm text-slate-400">
                Students requiring immediate intervention
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/${school_slug}/dashboard/students?filter=critical`}>
                View All
              </a>
            </Button>
          </div>

          <DashboardGrid>
            {criticalStudents.map((student) => (
              <GridItem key={student.id} span={4}>
                <Suspense fallback={<Student360CardSkeleton />}>
                  <Student360Card student={student} />
                </Suspense>
              </GridItem>
            ))}
          </DashboardGrid>
        </div>
      )}

      {/* Grade-Level Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mastery by Grade Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[6, 7, 8, 9, 10, 11, 12].map((grade) => {
              const gradeStudents = data.students.filter((s) => s.gradeLevel === grade);
              const onTrack = gradeStudents.filter((s) => s.riskLevel === 'on_track').length;
              const total = gradeStudents.length;
              const pct = total > 0 ? (onTrack / total) * 100 : 0;

              return (
                <div
                  key={grade}
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center"
                >
                  <div className="text-sm text-slate-400 mb-1">Grade {grade}</div>
                  <div
                    className={`text-2xl font-bold ${
                      pct >= 75 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'
                    }`}
                  >
                    {pct.toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-500">{total} students</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </PageFeatureGate>
  );
}

export const metadata = {
  title: 'Instructional Pulse',
};
