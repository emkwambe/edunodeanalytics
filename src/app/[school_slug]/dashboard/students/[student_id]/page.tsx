'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSchoolSeed } from '@/lib/data/seed-data';
import { cn } from '@/lib/utils';
import { useStudent360Audit } from '@/lib/hooks/use-ferpa-audit';
import {
  analyzeQualitativePulse,
  generateMockMTSSLogs,
  type QualitativePulseResult,
} from '@/lib/ai/edunode-advisor';
import {
  ArrowLeft,
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  BookOpen,
  Target,
  GraduationCap,
  Activity,
  Shield,
  FileText,
  MessageSquare,
  Sparkles,
  Home,
  Pencil,
  Timer,
  Gauge,
  Zap,
} from 'lucide-react';
import {
  calculateVolatilityIndex,
  calculateTimeToImpact,
  calculateDosageMetrics,
  calculateMetricVitality,
  type VolatilityMetrics,
  type TimeToImpact,
  type DosageMetrics,
  type MetricVitality,
} from '@/lib/analytics/purpose-driven-metrics';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

/**
 * Student 360 Dashboard View
 *
 * Dynamic route for individual student within dashboard context.
 * Provides comprehensive student view with:
 * - EduNode Advisor: Clinical interpretation layer
 * - AI Qualitative Pulse: Gemini-powered sentiment analysis
 * - Conditional Growth Index (CGI) trajectory
 * - Confounding Alert System
 * - Intervention history and recommendations
 * - Purpose-Driven Intelligence metrics
 */

// Threshold constants
const _THRESHOLDS = {
  chronicAbsence: 90,
  lowGrowth: 55,
  highGrowth: 70,
  proficiencyTarget: 50,
  masteryTarget: 80,
};

function getSynthesisColor(result: QualitativePulseResult['synthesisResult']): string {
  switch (result) {
    case 'Positive': return 'text-emerald-400';
    case 'Neutral': return 'text-slate-300';
    case 'Concerning': return 'text-amber-400';
    case 'Critical': return 'text-rose-400';
    default: return 'text-slate-400';
  }
}

function getLogIcon(category: string) {
  switch (category) {
    case 'home': return <Home className="w-4 h-4" />;
    case 'instructional': return <Pencil className="w-4 h-4" />;
    case 'behavioral': return <AlertTriangle className="w-4 h-4" />;
    case 'social': return <MessageSquare className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

export default function StudentDashboardDetailPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;
  const student_id = params.student_id as string;

  // FERPA Audit: Log this page view for compliance
  useStudent360Audit(student_id, school_slug);

  // Get student data from seed
  const schoolSeed = getSchoolSeed(school_slug);
  const students = schoolSeed?.students ?? [];
  const student = students.find((s) => s.id === student_id) || students[0];

  // AI Qualitative Pulse — on-demand only
  const [pulseLoading, setPulseLoading] = React.useState(false);
  const [qualitativePulse, setQualitativePulse] = React.useState<QualitativePulseResult | null>(null);
  const mtssLogs = React.useMemo(() => generateMockMTSSLogs(student_id), [student_id]);
  const runAIPulse = React.useCallback(async () => {
    if (pulseLoading || qualitativePulse) return;
    setPulseLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setQualitativePulse(analyzeQualitativePulse(student_id, mtssLogs));
    setPulseLoading(false);
  }, [student_id, mtssLogs, pulseLoading, qualitativePulse]);



  // Calculate metrics with null safety
  const avgGrowth = student?.reading?.growthPercentile && student?.math?.growthPercentile
    ? (student.reading.growthPercentile + student.math.growthPercentile) / 2
    : 50;
  const attendancePercent = student?.attendanceRate ? student.attendanceRate * 100 : 95;
  const mtssStatus = student?.riskLevel === 'critical' ? 'Tier 3' : student?.riskLevel === 'at_risk' ? 'Tier 2' : 'Tier 1';

  // Purpose-Driven Intelligence Metrics
  const volatilityMetrics = React.useMemo<VolatilityMetrics>(() => {
    if (!student?.purposeDriven?.assessmentHistory) {
      return calculateVolatilityIndex([]);
    }
    const readingScores = student.purposeDriven.assessmentHistory
      .filter((a) => a.subject === 'reading')
      .map((a) => a.score);
    return calculateVolatilityIndex(readingScores);
  }, [student]);

  const timeToImpact = React.useMemo<TimeToImpact>(() => {
    if (!student?.purposeDriven?.assessmentHistory || !student.reading) {
      return {
        daysToTarget: -1,
        targetScore: 212,
        slope: 0,
        onTrack: false,
        estimate: 'Insufficient data',
        confidence: 'low' as const,
      };
    }
    const targetRit = 212; // Grade-level target
    const history = student.purposeDriven.assessmentHistory
      .filter((a) => a.subject === 'reading')
      .map((a) => ({ score: a.score, date: a.date }));
    return calculateTimeToImpact(student.reading.winterRit, targetRit, history);
  }, [student]);

  const dosageMetrics = React.useMemo<DosageMetrics>(() => {
    if (!student?.purposeDriven?.interventionSessions) {
      return {
        targetMinutes: 300,
        actualMinutes: 0,
        percentComplete: 0,
        classification: 'critical' as const,
        sessionsCompleted: 0,
        sessionsPlanned: 15,
        avgSessionDuration: 0,
      };
    }
    const sessions = student.purposeDriven.interventionSessions.map((s) => ({
      date: s.date,
      durationMinutes: s.durationMinutes,
    }));
    return calculateDosageMetrics(
      sessions,
      student.purposeDriven.targetInterventionMinutes || 300
    );
  }, [student]);

  const metricVitality = React.useMemo<MetricVitality>(() => {
    return calculateMetricVitality(student?.purposeDriven?.lastDataUpdate ?? null);
  }, [student]);

  // Generate CGI trajectory data (RIT-style for the screenshot)
  const periods = ['Fall', 'Early Winter', 'Mid Winter', 'Projected'];
  const baseRit = 202 + Math.floor(avgGrowth / 5);
  const studentTrajectory = [baseRit, baseRit + 3, baseRit + 6, baseRit + 12];
  const targetLine = [212, 212, 212, 212];

  const chartData = {
    labels: periods,
    datasets: [
      {
        label: 'Student CGI',
        data: studentTrajectory,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 10,
        pointBackgroundColor: '#06b6d4',
      },
      {
        label: 'Grade-Level Target',
        data: targetLine,
        borderColor: '#64748b',
        borderDash: [8, 4],
        fill: false,
        pointRadius: 0,
        tension: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        min: 200,
        max: 220,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
    },
  };

  // Expert tip based on student data
  const expertTip = attendancePercent >= 90 && avgGrowth < 50
    ? `"When growth is low but attendance is high, focus on the 'Pure Instructional Gap'. Re-examine the student's mastery of prerequisite standards from the ${(student?.gradeLevel ?? 7) - 1}th grade."`
    : avgGrowth >= 70
    ? `"This student shows strong growth momentum. Continue current instructional strategies and consider enrichment opportunities."`
    : `"Monitor closely. Cross-reference attendance patterns with growth data before making instructional changes."`;

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Student Not Found</h2>
          <p className="text-slate-400 mb-4">The requested student could not be found.</p>
          <Link href={`/${school_slug}/dashboard/students`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Students
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Avatar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${school_slug}/dashboard/students`}
            className="text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl">
            {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">
                {student.firstName} {student.lastName}
              </h1>
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                {student.gradeLevel}th Grade
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              Advisor: {student.homeroomTeacher ?? 'Ms. Henderson'} | Student ID: {student.id?.slice(0, 8) ?? 'STU-882'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Log Note
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            Update Plan
          </Button>
        </div>
      </div>

      {/* High Confounding Risk Banner */}
      {attendancePercent < 90 && avgGrowth < 50 && (
        <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-bold text-amber-400 text-sm uppercase tracking-wider">
                HIGH CONFOUNDING RISK
              </span>
              <p className="text-sm text-slate-300 mt-1">
                This student has both attendance ({attendancePercent.toFixed(0)}%) and growth ({avgGrowth.toFixed(0)}th %ile) concerns.
                Address attendance before attributing growth gaps to instruction.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Purpose-Driven Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time-to-Impact Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Time-to-Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-3xl font-black",
                timeToImpact.onTrack ? "text-emerald-400" : "text-amber-400"
              )}>
                {timeToImpact.estimate}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {timeToImpact.onTrack
                ? `On track to reach ${timeToImpact.targetScore} RIT`
                : `Current slope: ${timeToImpact.slope.toFixed(2)} RIT/month`
              }
            </p>
            <Badge
              variant="outline"
              className={cn(
                "mt-2 text-xs",
                timeToImpact.confidence === 'high' ? "border-emerald-500/50 text-emerald-400" :
                timeToImpact.confidence === 'medium' ? "border-amber-500/50 text-amber-400" :
                "border-slate-500/50 text-slate-400"
              )}
            >
              {timeToImpact.confidence} confidence
            </Badge>
          </CardContent>
        </Card>

        {/* Volatility Index Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Volatility Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-3xl font-black",
                volatilityMetrics.volatilityIndex <= 3 ? "text-emerald-400" :
                volatilityMetrics.volatilityIndex <= 6 ? "text-amber-400" :
                "text-rose-400"
              )}>
                {volatilityMetrics.volatilityIndex.toFixed(1)}
              </span>
              <span className="text-sm text-slate-500">/10</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {volatilityMetrics.label}
            </p>
            {volatilityMetrics.classification === 'fragile' && (
              <Badge variant="destructive" className="mt-2 text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Fragile Growth
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Dosage Counter Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Intervention Dosage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-3xl font-black",
                dosageMetrics.classification === 'on_track' ? "text-emerald-400" :
                dosageMetrics.classification === 'behind' ? "text-amber-400" :
                "text-rose-400"
              )}>
                {dosageMetrics.percentComplete}%
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{dosageMetrics.actualMinutes} / {dosageMetrics.targetMinutes} min</span>
              <span>{dosageMetrics.sessionsCompleted} sessions</span>
            </div>
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  dosageMetrics.classification === 'on_track' ? "bg-emerald-500" :
                  dosageMetrics.classification === 'behind' ? "bg-amber-500" :
                  "bg-rose-500"
                )}
                style={{ width: `${Math.min(dosageMetrics.percentComplete, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CGI Trajectory Chart - 2 columns */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Conditional Growth Index (CGI)
              </CardTitle>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                Reading
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-slate-400">Student CGI</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-slate-500" />
                <span className="text-slate-400">Grade-Level Target (212 RIT)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Attendance
                </span>
                <span className={cn(
                  "font-bold",
                  attendancePercent >= 95 ? "text-emerald-400" :
                  attendancePercent >= 90 ? "text-amber-400" :
                  "text-rose-400"
                )}>
                  {attendancePercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Avg Growth
                </span>
                <span className={cn(
                  "font-bold",
                  avgGrowth >= 70 ? "text-emerald-400" :
                  avgGrowth >= 50 ? "text-amber-400" :
                  "text-rose-400"
                )}>
                  {avgGrowth.toFixed(0)}th %ile
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  MTSS Tier
                </span>
                <Badge className={cn(
                  mtssStatus === 'Tier 1' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                  mtssStatus === 'Tier 2' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                  "bg-rose-500/20 text-rose-400 border-rose-500/30"
                )}>
                  {mtssStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Data Freshness
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    metricVitality.freshness === 'fresh' ? "border-emerald-500/50 text-emerald-400" :
                    metricVitality.freshness === 'stale' ? "border-amber-500/50 text-amber-400" :
                    "border-rose-500/50 text-rose-400"
                  )}
                >
                  {metricVitality.freshness}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Academic Scores */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Academic Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Reading RIT
                  </span>
                  <span className="font-bold text-white">{student.reading?.winterRit ?? 'N/A'}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Growth: {student.reading?.growthPercentile ?? 'N/A'}{student.reading?.growthPercentile ? 'th %ile' : ''}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Math RIT
                  </span>
                  <span className="font-bold text-white">{student.math?.winterRit ?? 'N/A'}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Growth: {student.math?.growthPercentile ?? 'N/A'}{student.math?.growthPercentile ? 'th %ile' : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Qualitative Pulse Section */}
      <Card className="bg-gradient-to-br from-slate-800/50 to-violet-900/20 border-violet-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-violet-400" />
            AI Qualitative Pulse
            <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              Gemini Analysis
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
                    {!qualitativePulse ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <p className="text-sm text-slate-400 text-center max-w-sm">Analyze recent MTSS logs to surface behavioral patterns, social-emotional indicators, and recommended actions.</p>
              <Button type="button" onClick={runAIPulse} disabled={pulseLoading} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                <Sparkles className="w-4 h-4" />
                {pulseLoading ? 'Analyzing...' : 'Run AI Pulse'}
              </Button>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Synthesis Result */}
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3">Synthesis Result</h4>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  qualitativePulse.synthesisResult === 'Positive' ? "bg-emerald-500/20" :
                  qualitativePulse.synthesisResult === 'Neutral' ? "bg-slate-500/20" :
                  qualitativePulse.synthesisResult === 'Concerning' ? "bg-amber-500/20" :
                  "bg-rose-500/20"
                )}>
                  {qualitativePulse.synthesisResult === 'Positive' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : qualitativePulse.synthesisResult === 'Critical' ? (
                    <AlertTriangle className="w-6 h-6 text-rose-400" />
                  ) : (
                    <Activity className="w-6 h-6 text-amber-400" />
                  )}
                </div>
                <div>
                  <p className={cn("font-bold text-lg", getSynthesisColor(qualitativePulse.synthesisResult))}>
                    {qualitativePulse.synthesisResult}
                  </p>
                  <p className="text-sm text-slate-400">
                    Confidence: {(qualitativePulse.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-300 italic">
                {qualitativePulse.summary}
              </p>
            </div>

            {/* Recent MTSS Logs */}
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3">Recent Logs (Last 21 Days)</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mtssLogs.slice(0, 5).map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2 bg-slate-900/50 rounded-lg"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      log.category === 'home' ? "bg-cyan-500/20 text-cyan-400" :
                      log.category === 'behavioral' ? "bg-amber-500/20 text-amber-400" :
                      log.category === 'social' ? "bg-violet-500/20 text-violet-400" :
                      "bg-slate-500/20 text-slate-400"
                    )}>
                      {getLogIcon(log.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">{log.content}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(log.date).toLocaleDateString()} - {log.author}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Expert Tip Footer */}
      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-2xl">
        <div className="flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
              EduNode Advisor
            </p>
            <p className="text-sm text-slate-300 italic">
              {expertTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
