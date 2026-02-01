'use client';

import { useState, useMemo } from 'react';
import {
  PageHeader,
  DashboardGrid,
  GridItem,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  BarChart3,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { SCHOOL_SEEDS, type StudentSeedData } from '@/lib/data/seed-data';
import {
  calculateVolatilityIndex,
  calculateMomentumScore,
  calculateDosageMetrics,
  calculateMetricVitality,
  calculateDataSufficiency,
  type VolatilityMetrics,
  type MomentumScore,
  type DosageMetrics,
  type MetricVitality,
} from '@/lib/analytics/purpose-driven-metrics';

/**
 * Instructional Momentum Dashboard
 *
 * Purpose-Driven Intelligence implementation:
 * - 21-Day Diagnostic Cycle tracking
 * - Volatility Index for growth stability
 * - Momentum Score for trajectory analysis
 * - Dosage Counter for intervention fidelity
 * - Metric Vitality for data freshness
 */

interface MomentumPageProps {
  params: Promise<{ school_slug: string }>;
}

// Component for the 21-Day Diagnostic Cycle Header
function DiagnosticCycleHeader({
  updateCadence,
  dataSufficiency,
  metricVitality,
}: {
  updateCadence: string;
  dataSufficiency: number;
  metricVitality: MetricVitality;
}) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">
            21-Day Diagnostic Cycle
          </span>
          <Badge variant="outline" className="ml-2">
            Day 14 of 21
          </Badge>
        </div>

        <div className="flex items-center gap-6">
          {/* Update Cadence */}
          <div className="text-center">
            <div className="text-xs text-slate-400">Update Cadence</div>
            <div className="text-sm font-medium text-slate-200">{updateCadence}</div>
          </div>

          {/* Data Sufficiency */}
          <div className="text-center">
            <div className="text-xs text-slate-400">Data Sufficiency</div>
            <div
              className={`text-sm font-medium ${
                dataSufficiency >= 80
                  ? 'text-emerald-400'
                  : dataSufficiency >= 50
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}
            >
              {dataSufficiency}%
            </div>
          </div>

          {/* Metric Vitality */}
          <div className="text-center">
            <div className="text-xs text-slate-400">Metric Vitality</div>
            <div
              className={`text-sm font-medium flex items-center gap-1 ${
                metricVitality.freshness === 'fresh'
                  ? 'text-emerald-400'
                  : metricVitality.freshness === 'stale'
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}
            >
              {metricVitality.freshness === 'fresh' ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {metricVitality.freshness === 'fresh'
                ? 'Fresh'
                : `${metricVitality.daysSinceUpdate}d stale`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Volatility Index Display Component
function VolatilityIndexCard({ volatility }: { volatility: VolatilityMetrics }) {
  const getVolatilityColor = (index: number) => {
    if (index <= 3) return 'text-emerald-400';
    if (index <= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  const getVolatilityBg = (index: number) => {
    if (index <= 3) return 'bg-emerald-500/20 border-emerald-500/30';
    if (index <= 6) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Volatility Index
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div
            className={`text-4xl font-bold ${getVolatilityColor(volatility.volatilityIndex)}`}
          >
            {volatility.volatilityIndex === -1 ? '--' : volatility.volatilityIndex.toFixed(1)}
          </div>
          <div className={`px-3 py-1 rounded-full border ${getVolatilityBg(volatility.volatilityIndex)}`}>
            <span className={`text-sm font-medium ${getVolatilityColor(volatility.volatilityIndex)}`}>
              {volatility.label}
            </span>
          </div>
        </div>

        {/* Visual scale */}
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`absolute h-full rounded-full transition-all ${
              volatility.volatilityIndex <= 3
                ? 'bg-emerald-500'
                : volatility.volatilityIndex <= 6
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
            style={{
              width: `${Math.max(10, (volatility.volatilityIndex / 10) * 100)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Stable</span>
          <span>Fragile</span>
        </div>

        {volatility.alertMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm text-red-300 font-medium">Fragile Growth Alert</p>
                <p className="text-xs text-red-400/80 mt-1">{volatility.alertMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-slate-400">
          <span className="font-medium">Standard Deviation:</span>{' '}
          {volatility.standardDeviation.toFixed(2)} RIT points
        </div>
      </CardContent>
    </Card>
  );
}

// Momentum Score Card Component
function MomentumScoreCard({ momentum }: { momentum: MomentumScore }) {
  const ArrowIcon =
    momentum.arrow === '↑' ? ArrowUp : momentum.arrow === '↓' ? ArrowDown : ArrowRight;

  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    red: 'text-red-400 bg-red-500/20 border-red-500/30',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          Momentum Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-bold ${
                momentum.color === 'emerald'
                  ? 'text-emerald-400'
                  : momentum.color === 'amber'
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}
            >
              {momentum.value > 0 ? '+' : ''}
              {momentum.value}
            </span>
            <ArrowIcon
              className={`w-6 h-6 ${
                momentum.color === 'emerald'
                  ? 'text-emerald-400'
                  : momentum.color === 'amber'
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}
            />
          </div>
          <div className={`px-3 py-1 rounded-full border ${colorClasses[momentum.color]}`}>
            <span className="text-sm font-medium capitalize">{momentum.classification}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Delta from Expected</span>
            <span
              className={
                momentum.deltaFromExpected > 0
                  ? 'text-emerald-400'
                  : momentum.deltaFromExpected < 0
                    ? 'text-red-400'
                    : 'text-slate-300'
              }
            >
              {momentum.deltaFromExpected > 0 ? '+' : ''}
              {momentum.deltaFromExpected} pts
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Velocity</span>
            <span className="text-slate-300">{momentum.velocityPerWeek} pts/week</span>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-700/30">
          <p className="text-xs text-slate-400">
            {momentum.classification === 'accelerating' &&
              'Growth exceeding expectations. Maintain current interventions.'}
            {momentum.classification === 'steady' &&
              'Growth meeting expectations. Continue monitoring.'}
            {momentum.classification === 'decelerating' &&
              'Growth slowing. Consider intervention adjustments.'}
            {momentum.classification === 'stalled' &&
              'Growth has stalled. Immediate intervention review needed.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Dosage Counter Component
function DosageCounterCard({ dosage }: { dosage: DosageMetrics }) {
  const getStatusColor = () => {
    if (dosage.classification === 'on_track') return 'text-emerald-400';
    if (dosage.classification === 'behind') return 'text-amber-400';
    return 'text-red-400';
  };

  const getProgressColor = () => {
    if (dosage.classification === 'on_track') return 'bg-emerald-500';
    if (dosage.classification === 'behind') return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Intervention Dosage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <span className={`text-3xl font-bold ${getStatusColor()}`}>
              {dosage.actualMinutes}
            </span>
            <span className="text-slate-400 text-lg"> / {dosage.targetMinutes}</span>
          </div>
          <Badge
            variant={
              dosage.classification === 'on_track'
                ? 'default'
                : dosage.classification === 'behind'
                  ? 'secondary'
                  : 'destructive'
            }
          >
            {dosage.percentComplete}%
          </Badge>
        </div>

        <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
          <div
            className={`absolute h-full rounded-full transition-all ${getProgressColor()}`}
            style={{ width: `${Math.min(100, dosage.percentComplete)}%` }}
          />
          {/* Target line */}
          <div className="absolute h-full w-0.5 bg-white/50" style={{ left: '85%' }} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-slate-700/30">
            <div className="text-2xl font-bold text-slate-200">
              {dosage.sessionsCompleted}
            </div>
            <div className="text-xs text-slate-400">Sessions Done</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-700/30">
            <div className="text-2xl font-bold text-slate-200">
              {dosage.avgSessionDuration}m
            </div>
            <div className="text-xs text-slate-400">Avg Duration</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Target: {dosage.sessionsPlanned} sessions</span>
          <span>{dosage.sessionsPlanned - dosage.sessionsCompleted} remaining</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Signal -> Response -> Outcome Card
function SRONarrativeCard({
  signal,
  response,
  outcome,
  effectiveness,
}: {
  signal: string;
  response: string;
  outcome: string;
  effectiveness: 'effective' | 'partial' | 'ineffective' | 'pending';
}) {
  const effectivenessColors = {
    effective: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    partial: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    ineffective: 'bg-red-500/20 border-red-500/30 text-red-400',
    pending: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Signal - Response - Outcome
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Signal */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Signal</div>
              <div className="text-sm text-slate-200">{signal}</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-600" />
          </div>

          {/* Response */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Response</div>
              <div className="text-sm text-slate-200">{response}</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-600" />
          </div>

          {/* Outcome */}
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                effectiveness === 'effective'
                  ? 'bg-emerald-500/20'
                  : effectiveness === 'partial'
                    ? 'bg-amber-500/20'
                    : effectiveness === 'ineffective'
                      ? 'bg-red-500/20'
                      : 'bg-slate-500/20'
              }`}
            >
              {effectiveness === 'effective' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : effectiveness === 'ineffective' ? (
                <XCircle className="w-4 h-4 text-red-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">Outcome</div>
              <div className="text-sm text-slate-200">{outcome}</div>
            </div>
          </div>

          {/* Effectiveness Badge */}
          <div className={`mt-2 p-2 rounded border text-center ${effectivenessColors[effectiveness]}`}>
            <span className="text-xs font-medium uppercase tracking-wider">
              {effectiveness === 'pending' ? 'Awaiting Outcome' : `${effectiveness} Intervention`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Metric Degradation Wrapper
function DegradedMetric({
  children,
  vitality,
}: {
  children: React.ReactNode;
  vitality: MetricVitality;
}) {
  return (
    <div
      style={{ opacity: vitality.opacity }}
      className={`relative transition-opacity ${
        vitality.freshness !== 'fresh' ? 'ring-1 ring-amber-500/30 rounded-lg' : ''
      }`}
    >
      {children}
      {vitality.freshness !== 'fresh' && (
        <div className="absolute -top-2 -right-2">
          <Badge variant="outline" className="text-xs bg-slate-800 border-amber-500/50 text-amber-400">
            {vitality.daysSinceUpdate}d old
          </Badge>
        </div>
      )}
    </div>
  );
}

// Cohort Momentum Summary Table
function CohortMomentumTable({
  students,
}: {
  students: Array<{
    name: string;
    volatility: VolatilityMetrics;
    momentum: MomentumScore;
    dosage: DosageMetrics;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          Cohort Momentum Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="pb-2 font-medium">Student</th>
                <th className="pb-2 font-medium text-center">Volatility</th>
                <th className="pb-2 font-medium text-center">Momentum</th>
                <th className="pb-2 font-medium text-center">Dosage %</th>
                <th className="pb-2 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {students.map((student, idx) => (
                <tr key={idx} className="text-slate-300">
                  <td className="py-3">{student.name}</td>
                  <td className="py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        student.volatility.classification === 'stable'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : student.volatility.classification === 'moderate'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {student.volatility.volatilityIndex.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={
                        student.momentum.color === 'emerald'
                          ? 'text-emerald-400'
                          : student.momentum.color === 'amber'
                            ? 'text-amber-400'
                            : 'text-red-400'
                      }
                    >
                      {student.momentum.arrow} {student.momentum.value > 0 ? '+' : ''}
                      {student.momentum.value}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Progress
                        value={student.dosage.percentComplete}
                        className="w-16 h-2"
                      />
                      <span className="text-xs">{student.dosage.percentComplete}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    {student.volatility.classification === 'fragile' ? (
                      <Badge variant="destructive" className="text-xs">
                        Fragile
                      </Badge>
                    ) : student.momentum.classification === 'stalled' ? (
                      <Badge variant="secondary" className="text-xs">
                        Stalled
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">
                        On Track
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MomentumPage({ params }: MomentumPageProps) {
  // Resolve params
  const [schoolSlug, setSchoolSlug] = useState<string>('');

  // Get school data
  useMemo(async () => {
    const { school_slug } = await params;
    setSchoolSlug(school_slug);
  }, [params]);

  // Get demo data
  const schoolData = SCHOOL_SEEDS[schoolSlug] || SCHOOL_SEEDS['academy-charter'];
  const students = schoolData?.students.slice(0, 20) || [];

  // Calculate aggregate metrics
  const aggregateVolatility = useMemo(() => {
    const allScores = students.flatMap((s) =>
      s.purposeDriven?.assessmentHistory
        .filter((a) => a.subject === 'reading')
        .map((a) => a.score) || []
    );
    return calculateVolatilityIndex(allScores.slice(0, 50));
  }, [students]);

  const aggregateMomentum = useMemo(() => {
    const avgFallRit = students.reduce((sum, s) => sum + s.reading.fallRit, 0) / students.length;
    const avgWinterRit = students.reduce((sum, s) => sum + s.reading.winterRit, 0) / students.length;
    const avgExpectedGrowth = students.reduce(
      (sum, s) => sum + (s.purposeDriven?.expectedGrowthPoints || 4),
      0
    ) / students.length;
    return calculateMomentumScore(avgWinterRit, avgFallRit, avgExpectedGrowth, 18);
  }, [students]);

  const aggregateDosage = useMemo(() => {
    const allSessions = students.flatMap(
      (s) =>
        s.purposeDriven?.interventionSessions.map((sess) => ({
          date: sess.date,
          durationMinutes: sess.durationMinutes,
        })) || []
    );
    const targetMinutes = students.reduce(
      (sum, s) => sum + (s.purposeDriven?.targetInterventionMinutes || 0),
      0
    );
    return calculateDosageMetrics(allSessions, targetMinutes);
  }, [students]);

  const metricVitality = useMemo(() => {
    const latestUpdate = students.reduce((latest, s) => {
      const studentUpdate = s.purposeDriven?.lastDataUpdate;
      if (!studentUpdate) return latest;
      if (!latest) return studentUpdate;
      return studentUpdate > latest ? studentUpdate : latest;
    }, null as Date | null);
    return calculateMetricVitality(latestUpdate);
  }, [students]);

  // Calculate student-level summaries for table
  const studentSummaries = useMemo(() => {
    return students.slice(0, 10).map((student) => {
      const readingScores =
        student.purposeDriven?.assessmentHistory
          .filter((a) => a.subject === 'reading')
          .map((a) => a.score) || [];

      const volatility = calculateVolatilityIndex(readingScores);
      const momentum = calculateMomentumScore(
        student.reading.winterRit,
        student.reading.fallRit,
        student.purposeDriven?.expectedGrowthPoints || 4,
        18
      );
      const dosage = calculateDosageMetrics(
        student.purposeDriven?.interventionSessions.map((s) => ({
          date: s.date,
          durationMinutes: s.durationMinutes,
        })) || [],
        student.purposeDriven?.targetInterventionMinutes || 300
      );

      return {
        name: student.displayName,
        volatility,
        momentum,
        dosage,
      };
    });
  }, [students]);

  const dataSufficiency = calculateDataSufficiency(
    students.filter((s) => (s.purposeDriven?.assessmentHistory.length || 0) >= 3).length,
    students.length
  );

  return (
    <>
      <PageHeader
        title="Instructional Momentum"
        description="Purpose-Driven Intelligence: Growth trajectory, stability, and intervention fidelity"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${schoolSlug}/dashboard` },
          { label: 'Momentum' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Activity className="w-3 h-3" />
              21-Day Cycle
            </Badge>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        }
      />

      {/* Diagnostic Cycle Header */}
      <DiagnosticCycleHeader
        updateCadence="Biweekly"
        dataSufficiency={dataSufficiency.percentage}
        metricVitality={metricVitality}
      />

      {/* Key Metrics Row */}
      <DashboardGrid className="mb-6">
        <GridItem span={4}>
          <DegradedMetric vitality={metricVitality}>
            <VolatilityIndexCard volatility={aggregateVolatility} />
          </DegradedMetric>
        </GridItem>

        <GridItem span={4}>
          <DegradedMetric vitality={metricVitality}>
            <MomentumScoreCard momentum={aggregateMomentum} />
          </DegradedMetric>
        </GridItem>

        <GridItem span={4}>
          <DegradedMetric vitality={metricVitality}>
            <DosageCounterCard dosage={aggregateDosage} />
          </DegradedMetric>
        </GridItem>
      </DashboardGrid>

      {/* Signal -> Response -> Outcome */}
      <DashboardGrid className="mb-6">
        <GridItem span={4}>
          <SRONarrativeCard
            signal="3 students showing decelerating growth in reading fluency"
            response="Added 15-min daily phonics intervention (Orton-Gillingham approach)"
            outcome="2/3 students showed +8 RIT improvement over 3 weeks"
            effectiveness="partial"
          />
        </GridItem>

        <GridItem span={8}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Growth Delta vs. Expectation (with Confidence Band)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-slate-800/50 rounded-lg border border-slate-700/50">
                {/* Chart placeholder - would integrate with Chart.js */}
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">
                    Growth trajectory chart with confidence bands
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Showing observed growth vs. expected with SEM-based uncertainty
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-slate-400">Observed Growth</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-slate-400">Expected Growth</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-3 rounded bg-cyan-500/20" />
                  <span className="text-slate-400">95% Confidence Band</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </GridItem>
      </DashboardGrid>

      {/* Cohort Summary Table */}
      <CohortMomentumTable students={studentSummaries} />

      {/* Footer note about data freshness */}
      {metricVitality.warningMessage && (
        <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-amber-300">{metricVitality.warningMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}
