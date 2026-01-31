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
  Calendar,
  BookOpen,
  Target,
  GraduationCap,
  Activity,
  Shield,
  Clock,
  FileText,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Home,
  Pencil,
} from 'lucide-react';

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
  );
}
