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
import { getSchoolSeed, type StudentSeedData } from '@/lib/data/seed-data';
import { cn } from '@/lib/utils';
import { PageFeatureGate } from '@/components/features/page-feature-gate';
import { ConfoundingRiskBanner } from '@/components/banners/confounding-risk-banner';
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
  TrendingDown,
  Calendar,
  BookOpen,
  Target,
  GraduationCap,
  Activity,
  Shield,
  ShieldAlert,
  Clock,
  FileText,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Home,
  Pencil,
  Timer,
  Gauge,
  Zap,
  Bell,
  Plus,
} from 'lucide-react';
import {
  useStudentRiskProfile,
  useStudentRiskHistory,
  useRiskAlerts,
} from '@/lib/hooks/use-risk';
import { StatusBadge } from '@/components/dashboard/status-indicator';
import { Progress } from '@/components/ui/progress';
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
 * Student 360 Deep Dive Page
 *
 * Comprehensive individual student view with:
 * - EduNode Advisor: Clinical interpretation layer
 * - AI Qualitative Pulse: Gemini-powered sentiment analysis
 * - Conditional Growth Index (CGI) trajectory
 * - Confounding Alert System
 * - Intervention history and recommendations
 */

// Threshold constants
const THRESHOLDS = {
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

export default function Student360DeepDivePage() {
  const params = useParams();
  const school_slug = params.school_slug as string;
  const student_id = params.student_id as string;

  // FERPA Audit: Log this page view for compliance
  useStudent360Audit(student_id, school_slug);

  // Risk Engine Integration
  const { profile: riskProfile, isLoading: riskLoading } = useStudentRiskProfile(school_slug, student_id);
  const { history: riskHistory, isLoading: historyLoading } = useStudentRiskHistory(school_slug, student_id, { days: 90 });
  const { alerts: studentAlerts, isLoading: alertsLoading } = useRiskAlerts(school_slug, { studentId: student_id, limit: 5 });

  // Get student data from seed
  const schoolSeed = getSchoolSeed(school_slug);
  const students = schoolSeed?.students ?? [];
  const student = students.find((s) => s.id === student_id) || students[0];

  // Generate AI Qualitative Pulse
  const mtssLogs = React.useMemo(() => generateMockMTSSLogs(student_id), [student_id]);
  const qualitativePulse = React.useMemo(
    () => analyzeQualitativePulse(student_id, mtssLogs),
    [student_id, mtssLogs]
  );

  // Calculate metrics
  const avgGrowth = student ? (student.reading.growthPercentile + student.math.growthPercentile) / 2 : 50;
  const attendancePercent = student ? student.attendanceRate * 100 : 95;
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

  return (
    <PageFeatureGate featureKey="student_360">
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
            {student?.firstName?.charAt(0)}{student?.lastName?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">
                {student?.firstName} {student?.lastName}
              </h1>
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                {student?.gradeLevel}th Grade
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              Advisor: {student?.homeroomTeacher ?? 'Ms. Henderson'} | Student ID: {student?.id?.slice(0, 8) ?? 'STU-882'}
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
      {student && attendancePercent < 90 && avgGrowth < 50 && (
        <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-bold text-amber-400 text-sm uppercase tracking-wider">
                HIGH CONFOUNDING RISK
              </span>
              <p className="text-sm text-slate-300 mt-1">
                {student.firstName}&apos;s growth ({avgGrowth.toFixed(0)}th percentile) is being impacted by{' '}
                <strong className="text-amber-400">Chronic Absenteeism ({attendancePercent.toFixed(1)}%)</strong>.
                EduNode Advisor suggests prioritizing family outreach over curriculum changes to isolate the true instructional signal.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Charts & AI Pulse */}
        <div className="lg:col-span-8 space-y-6">
          {/* CGI Trajectory Chart */}
          <Card className="bg-slate-800/30 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <CardTitle className="text-base">CGI Trajectory vs. Target</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">MAP WINTER WINDOW</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* AI Qualitative Pulse */}
          <Card className="bg-slate-800/30 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <CardTitle className="text-base">AI Qualitative Pulse</CardTitle>
                </div>
                <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[10px]">
                  CONFIDENCE: {qualitativePulse.confidence}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Synthesis Result */}
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Synthesis Result
                  </div>
                  <div className={cn('text-2xl font-black', getSynthesisColor(qualitativePulse.synthesisResult))}>
                    {qualitativePulse.synthesisResult}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 italic leading-relaxed">
                    &quot;{qualitativePulse.summary}&quot;
                  </p>
                </div>

                {/* Recent Logs */}
                <div className="md:col-span-2 space-y-2">
                  {qualitativePulse.recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 bg-slate-900/30 rounded-lg"
                    >
                      <div className="p-1.5 bg-slate-800 rounded-lg text-slate-400">
                        {getLogIcon(log.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase mb-1">
                          <span className="font-bold">{log.category}</span>
                          <span>•</span>
                          <span>{log.date.toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-300">{log.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Vitals & Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Risk Profile Card */}
          <Card className={cn(
            "bg-slate-800/30 border-slate-700",
            riskProfile?.riskLevel === 'critical' && "border-red-500/30",
            riskProfile?.riskLevel === 'at_risk' && "border-orange-500/30"
          )}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <ShieldAlert className="w-4 h-4" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">
                    Risk Profile
                  </CardTitle>
                </div>
                {riskProfile && (
                  <StatusBadge status={riskProfile.riskLevel} />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {riskLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-8 w-24 bg-slate-700 rounded" />
                  <div className="h-2 w-full bg-slate-700 rounded" />
                  <div className="h-16 w-full bg-slate-700 rounded" />
                </div>
              ) : riskProfile ? (
                <div className="space-y-4">
                  {/* Risk Score */}
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className={cn(
                        'text-3xl font-black',
                        riskProfile.riskLevel === 'critical' ? 'text-red-400' :
                        riskProfile.riskLevel === 'at_risk' ? 'text-orange-400' :
                        riskProfile.riskLevel === 'watch' ? 'text-yellow-400' :
                        'text-emerald-400'
                      )}>
                        {(riskProfile.riskScore * 100).toFixed(0)}
                      </span>
                      <div className="flex items-center gap-1 text-sm">
                        {riskProfile.trajectory === 'improving' ? (
                          <><TrendingDown className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">Improving</span></>
                        ) : riskProfile.trajectory === 'declining' ? (
                          <><TrendingUp className="w-4 h-4 text-red-400" /><span className="text-red-400">Declining</span></>
                        ) : (
                          <span className="text-slate-400">Stable</span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          riskProfile.riskLevel === 'critical' ? 'bg-red-500' :
                          riskProfile.riskLevel === 'at_risk' ? 'bg-orange-500' :
                          riskProfile.riskLevel === 'watch' ? 'bg-yellow-500' :
                          'bg-emerald-500'
                        )}
                        style={{ width: `${riskProfile.riskScore * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {riskProfile.factors && riskProfile.factors.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Contributing Factors
                      </h4>
                      <div className="space-y-2">
                        {riskProfile.factors.slice(0, 3).map((factor, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-300 capitalize">{factor.name.replace(/_/g, ' ')}</span>
                              <span className="text-slate-500">{(factor.weightedScore * 100).toFixed(0)}%</span>
                            </div>
                            <Progress value={factor.weightedScore * 100} className="h-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Level Change Alert */}
                  {riskProfile.levelChanged && riskProfile.previousLevel && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                      <p className="text-[10px] text-amber-400">
                        Risk level changed from {riskProfile.previousLevel.replace('_', ' ')} to {riskProfile.riskLevel.replace('_', ' ')}
                      </p>
                    </div>
                  )}

                  {/* Create Intervention Link */}
                  {(riskProfile.riskLevel === 'critical' || riskProfile.riskLevel === 'at_risk') && (
                    <Link href={`/${school_slug}/interventions/new?studentId=${student_id}`}>
                      <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Create Intervention
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No risk data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Alerts for Student */}
          {!alertsLoading && studentAlerts && studentAlerts.length > 0 && (
            <Card className="bg-slate-800/30 border-amber-500/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Bell className="w-4 h-4" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">
                      Active Alerts
                    </CardTitle>
                  </div>
                  <Badge variant="warning" className="text-[10px]">
                    {studentAlerts.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {studentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={cn(
                        'text-[9px]',
                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        alert.severity === 'urgent' ? 'bg-orange-500/20 text-orange-400' :
                        alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      )}>
                        {alert.severity}
                      </Badge>
                      <span className="text-[9px] text-slate-500">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{alert.title}</p>
                  </div>
                ))}
                <Link href={`/${school_slug}/dashboard/early-warning?studentId=${student_id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs mt-2">
                    View All Alerts
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Risk History Chart */}
          {!historyLoading && riskHistory && riskHistory.length > 1 && (
            <Card className="bg-slate-800/30 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <TrendingUp className="w-4 h-4" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">
                    Risk History (90 days)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[120px]">
                  <Line
                    data={{
                      labels: riskHistory.map(h => new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                      datasets: [{
                        label: 'Risk Score',
                        data: riskHistory.map(h => h.riskScore * 100),
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
                        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 0 } }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Vitals */}
          <Card className="bg-slate-800/30 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 font-bold uppercase tracking-wider">
                Student Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Attendance</span>
                <span className={cn(
                  'text-lg font-black',
                  attendancePercent >= 95 ? 'text-emerald-400' :
                  attendancePercent >= 90 ? 'text-amber-400' : 'text-rose-400'
                )}>
                  {attendancePercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Growth (CGI)</span>
                <span className={cn(
                  'text-lg font-black',
                  avgGrowth >= 70 ? 'text-emerald-400' :
                  avgGrowth >= 50 ? 'text-cyan-400' : 'text-amber-400'
                )}>
                  {avgGrowth.toFixed(0)}nd %ile
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">MTSS Status</span>
                <span className={cn(
                  'text-lg font-black',
                  mtssStatus === 'Tier 1' ? 'text-emerald-400' :
                  mtssStatus === 'Tier 2' ? 'text-amber-400' : 'text-rose-400'
                )}>
                  {mtssStatus}
                </span>
              </div>
              <Link href={`/${school_slug}/interventions`}>
                <Button variant="outline" className="w-full mt-2">
                  Launch Intervention Hub
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Time-to-Impact Estimate */}
          <Card className="bg-slate-800/30 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Timer className="w-4 h-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider">
                  Time-to-Impact
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-3">
                <span className={cn(
                  'text-3xl font-black',
                  timeToImpact.onTrack ? 'text-emerald-400' :
                  timeToImpact.daysToTarget > 0 ? 'text-amber-400' : 'text-slate-400'
                )}>
                  {timeToImpact.estimate}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target RIT</span>
                  <span className="text-slate-200">{timeToImpact.targetScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trajectory Slope</span>
                  <span className={cn(
                    timeToImpact.slope > 0 ? 'text-emerald-400' : 'text-amber-400'
                  )}>
                    {timeToImpact.slope > 0 ? '+' : ''}{timeToImpact.slope.toFixed(3)}/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence</span>
                  <Badge variant="outline" className={cn(
                    'text-[10px]',
                    timeToImpact.confidence === 'high' ? 'border-emerald-500/50 text-emerald-400' :
                    timeToImpact.confidence === 'medium' ? 'border-amber-500/50 text-amber-400' :
                    'border-slate-500/50 text-slate-400'
                  )}>
                    {timeToImpact.confidence}
                  </Badge>
                </div>
              </div>
              {timeToImpact.onTrack && (
                <div className="mt-3 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400">
                    On track to reach grade-level target within the school year
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volatility Index */}
          <Card className={cn(
            "bg-slate-800/30 border-slate-700",
            volatilityMetrics.classification === 'fragile' && "border-red-500/30"
          )}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-amber-400">
                <Gauge className="w-4 h-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider">
                  Volatility Index
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className={cn(
                  'text-3xl font-black',
                  volatilityMetrics.classification === 'stable' ? 'text-emerald-400' :
                  volatilityMetrics.classification === 'moderate' ? 'text-amber-400' : 'text-rose-400'
                )}>
                  {volatilityMetrics.volatilityIndex === -1 ? '--' : volatilityMetrics.volatilityIndex.toFixed(1)}
                </span>
                <Badge className={cn(
                  'text-[10px]',
                  volatilityMetrics.classification === 'stable' ? 'bg-emerald-500/20 text-emerald-400' :
                  volatilityMetrics.classification === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                )}>
                  {volatilityMetrics.label}
                </Badge>
              </div>

              {/* Visual scale */}
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                  className={cn(
                    "absolute h-full rounded-full transition-all",
                    volatilityMetrics.classification === 'stable' ? 'bg-emerald-500' :
                    volatilityMetrics.classification === 'moderate' ? 'bg-amber-500' : 'bg-rose-500'
                  )}
                  style={{ width: `${Math.max(10, (volatilityMetrics.volatilityIndex / 10) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Stable</span>
                <span>Fragile</span>
              </div>

              {volatilityMetrics.alertMessage && (
                <div className="mt-3 p-2 rounded bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-rose-400 mt-0.5" />
                    <p className="text-[10px] text-rose-400">{volatilityMetrics.alertMessage}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Intervention Dosage */}
          {dosageMetrics.targetMinutes > 0 && (
            <Card className="bg-slate-800/30 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Zap className="w-4 h-4" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">
                    Intervention Dosage
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={cn(
                    'text-2xl font-black',
                    dosageMetrics.classification === 'on_track' ? 'text-emerald-400' :
                    dosageMetrics.classification === 'behind' ? 'text-amber-400' : 'text-rose-400'
                  )}>
                    {dosageMetrics.actualMinutes}
                  </span>
                  <span className="text-slate-400 text-sm">/ {dosageMetrics.targetMinutes} min</span>
                </div>

                {/* Progress bar */}
                <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className={cn(
                      "absolute h-full rounded-full transition-all",
                      dosageMetrics.classification === 'on_track' ? 'bg-emerald-500' :
                      dosageMetrics.classification === 'behind' ? 'bg-amber-500' : 'bg-rose-500'
                    )}
                    style={{ width: `${Math.min(100, dosageMetrics.percentComplete)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-900/50">
                    <div className="text-lg font-bold text-slate-200">{dosageMetrics.sessionsCompleted}</div>
                    <div className="text-[10px] text-slate-500">Sessions</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/50">
                    <div className="text-lg font-bold text-slate-200">{dosageMetrics.avgSessionDuration}m</div>
                    <div className="text-[10px] text-slate-500">Avg Duration</div>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-400 text-center">
                  {dosageMetrics.sessionsPlanned - dosageMetrics.sessionsCompleted} sessions remaining in window
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Freshness Indicator */}
          {metricVitality.freshness !== 'fresh' && (
            <div className={cn(
              "p-3 rounded-lg border",
              metricVitality.freshness === 'stale'
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-rose-500/10 border-rose-500/20"
            )}>
              <div className="flex items-center gap-2">
                <Clock className={cn(
                  "w-4 h-4",
                  metricVitality.freshness === 'stale' ? "text-amber-400" : "text-rose-400"
                )} />
                <div>
                  <p className={cn(
                    "text-xs font-medium",
                    metricVitality.freshness === 'stale' ? "text-amber-400" : "text-rose-400"
                  )}>
                    Data is {metricVitality.daysSinceUpdate} days old
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {metricVitality.warningMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* EduNode Expert Tip */}
          <Card className="bg-slate-800/30 border-indigo-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <BrainCircuit className="w-4 h-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider">
                  EduNode Expert Tip
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  {expertTip}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Recommended Action */}
          {qualitativePulse.recommendedAction && (
            <Card className="bg-cyan-900/20 border-cyan-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">
                    Next Recommended Action
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 mb-3">
                  Based on the detected environmental stress, {qualitativePulse.recommendedAction.toLowerCase()}
                </p>
                <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-700">
                  Assign Task
                  <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="pt-4 text-center">
                <BookOpen className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                <div className="text-lg font-black text-white">
                  {student?.reading?.growthPercentile ?? 'N/A'}<span className="text-xs text-slate-500">th</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase">Reading Growth</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="pt-4 text-center">
                <GraduationCap className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                <div className="text-lg font-black text-white">
                  {student?.math?.growthPercentile ?? 'N/A'}<span className="text-xs text-slate-500">th</span>
                </div>
                <div className="text-[10px] text-slate-500 uppercase">Math Growth</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Intervention History */}
      <Card className="bg-slate-800/30 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <CardTitle className="text-base">Active Interventions</CardTitle>
            </div>
            <Badge className="bg-slate-700">{mtssStatus}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-xl">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Small Group Reading Intervention</div>
                <div className="text-xs text-slate-500">Started: Jan 15, 2026 | Last data: 3 days ago</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-cyan-400">62%</div>
                <div className="text-[10px] text-slate-500">Progress</div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-xl opacity-60">
              <div className="p-2 rounded-lg bg-slate-700 text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Math Tutoring (After School)</div>
                <div className="text-xs text-slate-500">Oct 2025 - Dec 2025 | Completed</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">100%</div>
                <div className="text-[10px] text-slate-500">Progress</div>
              </div>
              <Badge variant="outline">Completed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </PageFeatureGate>
  );
}
