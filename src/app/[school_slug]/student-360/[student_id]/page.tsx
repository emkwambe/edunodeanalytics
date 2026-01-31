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
import {
  PageHeader,
  DashboardGrid,
  GridItem,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSchoolSeed, type StudentSeedData } from '@/lib/data/seed-data';
import { cn } from '@/lib/utils';
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
  User,
  GraduationCap,
  Activity,
  Shield,
  Clock,
  FileText,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

/**
 * Student 360 Deep Dive Page
 *
 * Comprehensive individual student view with:
 * - EduNode Advisor: Clinical interpretation layer
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

interface AdvisorInsight {
  type: 'confounding' | 'instructional' | 'success' | 'warning';
  title: string;
  message: string;
  action?: string;
}

function generateAdvisorInsights(student: StudentSeedData): AdvisorInsight[] {
  const insights: AdvisorInsight[] = [];
  const attendancePercent = student.attendanceRate * 100;
  const avgGrowth = (student.reading.growthPercentile + student.math.growthPercentile) / 2;

  // Confounding Analysis
  if (attendancePercent < THRESHOLDS.chronicAbsence && avgGrowth < THRESHOLDS.lowGrowth) {
    insights.push({
      type: 'confounding',
      title: 'Data Confounding Detected',
      message: `This student's low growth (${avgGrowth.toFixed(0)}th %ile) is correlated with chronic absenteeism (${attendancePercent.toFixed(1)}% attendance). Test scores cannot be reliably attributed to instructional quality.`,
      action: 'Refer to Family Engagement team before making instructional changes.',
    });
  }

  // Pure Instructional Gap
  if (attendancePercent >= 92 && avgGrowth < THRESHOLDS.lowGrowth) {
    insights.push({
      type: 'instructional',
      title: 'Instructional Mismatch Identified',
      message: `Despite high attendance (${attendancePercent.toFixed(1)}%), this student shows low growth (${avgGrowth.toFixed(0)}th %ile). This is a clear signal of instructional gap.`,
      action: 'Recommend Tier 2 intervention and differentiated instruction review.',
    });
  }

  // High Growth Success
  if (avgGrowth >= THRESHOLDS.highGrowth) {
    insights.push({
      type: 'success',
      title: 'High Growth Achievement',
      message: `Student demonstrates exceptional growth (${avgGrowth.toFixed(0)}th %ile). Current instructional approach is effective.`,
    });
  }

  // IEP Consideration
  if (student.hasIep) {
    insights.push({
      type: 'warning',
      title: 'IEP Accommodation Active',
      message: 'Ensure all accommodations are being implemented. Growth metrics should be evaluated against individualized goals.',
    });
  }

  // ELL Consideration
  if (student.isEnglishLearner) {
    insights.push({
      type: 'warning',
      title: 'ELL Student',
      message: 'Language proficiency may impact assessment performance. Consider WIDA-aligned growth metrics.',
    });
  }

  return insights;
}

function getInsightIcon(type: AdvisorInsight['type']) {
  switch (type) {
    case 'confounding':
      return <AlertTriangle className="w-5 h-5" />;
    case 'instructional':
      return <Target className="w-5 h-5" />;
    case 'success':
      return <CheckCircle2 className="w-5 h-5" />;
    case 'warning':
      return <Shield className="w-5 h-5" />;
  }
}

function getInsightStyle(type: AdvisorInsight['type']) {
  switch (type) {
    case 'confounding':
      return 'bg-amber-900/20 border-amber-500/30 text-amber-400';
    case 'instructional':
      return 'bg-rose-900/20 border-rose-500/30 text-rose-400';
    case 'success':
      return 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400';
    case 'warning':
      return 'bg-indigo-900/20 border-indigo-500/30 text-indigo-400';
  }
}

export default function Student360DeepDivePage() {
  const params = useParams();
  const school_slug = params.school_slug as string;
  const student_id = params.student_id as string;

  // Get student data from seed
  const schoolSeed = getSchoolSeed(school_slug);
  const students = schoolSeed?.students ?? [];
  const student = students.find((s) => s.id === student_id) || students[0];

  // Generate advisor insights
  const advisorInsights = student ? generateAdvisorInsights(student) : [];

  // Generate mock growth trajectory data
  const weeks = Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`);
  const baseGrowth = student?.math?.growthPercentile ?? 50;
  const growthTrajectory = weeks.map((_, i) => {
    const variance = Math.sin(i * 0.5) * 5 + Math.random() * 3;
    return Math.max(10, Math.min(99, baseGrowth + variance + i * 0.5));
  });

  const gradeTarget = weeks.map(() => 50); // Grade-level target line

  const chartData = {
    labels: weeks,
    datasets: [
      {
        label: 'Student CGI',
        data: growthTrajectory,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Grade-Level Target',
        data: gradeTarget,
        borderColor: '#64748b',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#94a3b8', usePointStyle: true },
      },
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
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Growth Percentile (CGI)',
          color: '#94a3b8',
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
    },
  };

  const avgGrowth = student ? (student.reading.growthPercentile + student.math.growthPercentile) / 2 : 50;
  const attendancePercent = student ? student.attendanceRate * 100 : 95;

  return (
    <>
      {/* Back Navigation */}
      <div className="mb-4">
        <Link
          href={`/${school_slug}/dashboard/students`}
          className="inline-flex items-center text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Student 360
        </Link>
      </div>

      <PageHeader
        title={`${student?.firstName ?? 'Unknown'} ${student?.lastName ?? 'Student'}`}
        description={`Grade ${student?.gradeLevel ?? 'N/A'} | Student ID: ${student?.id ?? 'N/A'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm">
              <Activity className="w-4 h-4 mr-2" />
              Add Intervention
            </Button>
          </div>
        }
      />

      {/* Student Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {student?.hasIep && (
          <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">IEP</Badge>
        )}
        {student?.isEnglishLearner && (
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">ELL</Badge>
        )}
        {student?.has504Plan && (
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">504</Badge>
        )}
        {student?.riskLevel === 'critical' && (
          <Badge variant="destructive">Critical Risk</Badge>
        )}
        {student?.riskLevel === 'at_risk' && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">At Risk</Badge>
        )}
      </div>

      {/* EduNode Advisor Section */}
      <Card className="mb-6 bg-slate-800/30 border-indigo-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <CardTitle className="text-base">EduNode Advisor</CardTitle>
            <Badge className="bg-indigo-500/20 text-indigo-400 text-[10px]">AI-POWERED</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {advisorInsights.map((insight, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-xl border',
                  getInsightStyle(insight.type)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-white mb-1">{insight.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{insight.message}</p>
                    {insight.action && (
                      <p className="text-xs mt-2 font-medium">
                        <span className="text-slate-500">Recommended Action:</span>{' '}
                        <span className="text-white">{insight.action}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Key Metrics */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Attendance Rate</span>
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <div className={cn(
                'text-3xl font-black',
                attendancePercent >= 95 ? 'text-emerald-400' :
                attendancePercent >= 90 ? 'text-amber-400' : 'text-rose-400'
              )}>
                {attendancePercent.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {Math.round((1 - (student?.attendanceRate ?? 0.95)) * 180)} days absent YTD
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Composite Growth</span>
                <TrendingUp className="w-4 h-4 text-slate-500" />
              </div>
              <div className={cn(
                'text-3xl font-black',
                avgGrowth >= 70 ? 'text-emerald-400' :
                avgGrowth >= 50 ? 'text-cyan-400' :
                avgGrowth >= 35 ? 'text-amber-400' : 'text-rose-400'
              )}>
                {avgGrowth.toFixed(0)}<span className="text-lg text-slate-500">th %ile</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Conditional Growth Index (CGI)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Reading</span>
                <BookOpen className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {student?.reading?.nationalPercentile ?? 'N/A'}<span className="text-sm text-slate-500">th</span>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">Proficiency</div>
                </div>
                <div>
                  <div className={cn(
                    'text-2xl font-bold',
                    (student?.reading?.growthPercentile ?? 0) >= 60 ? 'text-emerald-400' : 'text-amber-400'
                  )}>
                    {student?.reading?.growthPercentile ?? 'N/A'}<span className="text-sm text-slate-500">th</span>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">Growth</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Math</span>
                <GraduationCap className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {student?.math?.nationalPercentile ?? 'N/A'}<span className="text-sm text-slate-500">th</span>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">Proficiency</div>
                </div>
                <div>
                  <div className={cn(
                    'text-2xl font-bold',
                    (student?.math?.growthPercentile ?? 0) >= 60 ? 'text-emerald-400' : 'text-amber-400'
                  )}>
                    {student?.math?.growthPercentile ?? 'N/A'}<span className="text-sm text-slate-500">th</span>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">Growth</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Growth Trajectory Chart */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Conditional Growth Index Trajectory</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    12-week growth pattern compared to grade-level expectations
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Reading</Button>
                  <Button variant="outline" size="sm">Math</Button>
                  <Button size="sm">Composite</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Intervention History */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Intervention History</CardTitle>
            <Badge className="bg-slate-700">MTSS Tier {student?.riskLevel === 'critical' ? '3' : student?.riskLevel === 'at_risk' ? '2' : '1'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Small Group Reading Intervention</div>
                <div className="text-xs text-slate-500">Started: Jan 15, 2026 | Last data: 3 days ago</div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl opacity-60">
              <div className="p-2 rounded-lg bg-slate-700 text-slate-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Math Tutoring (After School)</div>
                <div className="text-xs text-slate-500">Oct 2025 - Dec 2025 | Completed</div>
              </div>
              <Badge variant="outline">Completed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
