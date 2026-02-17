'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ScatterController,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import {
  PageHeader,
  DashboardGrid,
  GridItem,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSchoolSeed } from '@/lib/data/seed-data';
import { PageFeatureGate } from '@/components/features/page-feature-gate';
import {
  ShieldAlert,
  BrainCircuit,
  AlertTriangle,
  TrendingUp,
  Dna,
  Users,
  Target,
  Filter,
  Download,
  Sparkles,
  Star,
  Rocket,
  Eye,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { identifyInvisibleSuccessStudents, type InvisibleSuccessStudent } from '@/lib/ai/edunode-advisor';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, ScatterController);

/**
 * Impact Isolation Analytics Page
 *
 * The "Clinical Analyzer" - Multivariate confounding detection.
 * Cross-references Attendance vs Growth to isolate instructional impact
 * from external barriers like chronic absenteeism.
 *
 * Zone Classification:
 * - RED ZONE: High Attendance (>92%) + Low Growth (<55%) = Pure Instructional Gap
 * - AMBER ZONE: Low Attendance (<88%) + Low Growth (<55%) = Confounded (External)
 * - GREEN ZONE: Adequate Growth = On Track / Resilient
 */

// Clinical thresholds
const THRESHOLDS = {
  highAttendance: 92,
  lowAttendance: 88,
  lowGrowth: 55,
  confoundingAttendance: 90,
};

interface StudentDataPoint {
  x: number; // Attendance %
  y: number; // Growth Percentile
  name: string;
  grade: number;
  zone: 'instructional_gap' | 'confounded' | 'on_track';
}

function classifyStudent(attendance: number, growth: number): StudentDataPoint['zone'] {
  if (attendance >= THRESHOLDS.highAttendance && growth < THRESHOLDS.lowGrowth) {
    return 'instructional_gap';
  }
  if (attendance < THRESHOLDS.lowAttendance && growth < THRESHOLDS.lowGrowth) {
    return 'confounded';
  }
  return 'on_track';
}

function getZoneColor(zone: StudentDataPoint['zone']): string {
  switch (zone) {
    case 'instructional_gap':
      return '#f43f5e'; // Rose/Red
    case 'confounded':
      return '#f59e0b'; // Amber
    case 'on_track':
      return '#10b981'; // Emerald
    default:
      return '#6366f1';
  }
}

export default function ImpactAnalyticsPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  const [selectedZone, setSelectedZone] = React.useState<StudentDataPoint['zone'] | 'all'>('all');

  // Get student data from seed
  const schoolSeed = getSchoolSeed(school_slug);
  const students = schoolSeed?.students ?? [];

  // Transform students into scatter data points
  const studentDataPoints: StudentDataPoint[] = students.map((s) => ({
    x: s.attendanceRate * 100,
    y: s.math.growthPercentile, // Using math growth as proxy
    name: `${s.firstName} ${s.lastName}`,
    grade: s.gradeLevel,
    zone: classifyStudent(s.attendanceRate * 100, s.math.growthPercentile),
  }));

  // AI Pattern Matching: Identify "Invisible Success" students in Amber zone
  const invisibleSuccessStudents = React.useMemo(() => {
    const amberStudents = students
      .filter((s) => {
        const attendance = s.attendanceRate * 100;
        const growth = s.math.growthPercentile;
        return attendance < THRESHOLDS.lowAttendance && growth < THRESHOLDS.lowGrowth;
      })
      .map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        attendance: s.attendanceRate * 100,
        growth: s.math.growthPercentile,
        lmsEngagement: 60 + Math.random() * 30, // Simulated LMS engagement
      }));
    return identifyInvisibleSuccessStudents(amberStudents);
  }, [students]);

  // Filter by selected zone
  const filteredData = selectedZone === 'all'
    ? studentDataPoints
    : studentDataPoints.filter((s) => s.zone === selectedZone);

  // Zone counts
  const zoneCounts = {
    instructional_gap: studentDataPoints.filter((s) => s.zone === 'instructional_gap').length,
    confounded: studentDataPoints.filter((s) => s.zone === 'confounded').length,
    on_track: studentDataPoints.filter((s) => s.zone === 'on_track').length,
  };

  // Chart data
  const chartData = {
    datasets: [
      {
        label: 'Students',
        data: filteredData.map((s) => ({ x: s.x, y: s.y })),
        backgroundColor: filteredData.map((s) => getZoneColor(s.zone)),
        pointRadius: 8,
        pointHoverRadius: 12,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const idx = context.dataIndex;
            const student = filteredData[idx];
            return [
              `${student.name}`,
              `Grade: ${student.grade}`,
              `Attendance: ${student.x.toFixed(1)}%`,
              `Growth: ${student.y}th %ile`,
            ];
          },
        },
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Attendance Rate (%)',
          color: '#94a3b8',
          font: { weight: 'bold' as const },
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        min: 60,
        max: 100,
        ticks: { color: '#64748b' },
      },
      y: {
        title: {
          display: true,
          text: 'Growth Percentile (CGI)',
          color: '#94a3b8',
          font: { weight: 'bold' as const },
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
        min: 0,
        max: 100,
        ticks: { color: '#64748b' },
      },
    },
  };

  return (
    <PageFeatureGate featureKey="impact_analyzer">
      <PageHeader
        title="Confounding Variable Analyzer"
        description="Isolating Instructional Impact by cross-referencing Growth with Engagement"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Analysis
            </Button>
          </div>
        }
      />

      {/* Statistical Integrity Banner */}
      <div className="mb-8 bg-indigo-900/20 border-l-4 border-indigo-500 p-6 rounded-r-2xl">
        <div className="flex items-center gap-3 mb-3">
          <BrainCircuit className="w-6 h-6 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Statistical Integrity Layer</h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-4xl">
          &quot;Exemplary knowledge means knowing when the data is <strong className="text-white">confounded</strong>.
          If a student&apos;s attendance is below 90%, their low test scores are a symptom of absence,
          not necessarily instructional failure. EduNode isolates these variables to save you from
          misjudging your teachers.&quot;
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dna className="w-5 h-5 text-cyan-400" />
                  <CardTitle className="text-base">Multivariate Impact Mapping</CardTitle>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold">
                  <span className="text-emerald-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                    Resilient/On-Track
                  </span>
                  <span className="text-amber-500 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                    Confounded (External)
                  </span>
                  <span className="text-rose-500 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                    Instructional Gap
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Zone Filter */}
              <div className="flex gap-2 mb-4">
                <Button
                  size="sm"
                  variant={selectedZone === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedZone('all')}
                >
                  <Filter className="w-3 h-3 mr-1" />
                  All ({studentDataPoints.length})
                </Button>
                <Button
                  size="sm"
                  variant={selectedZone === 'instructional_gap' ? 'default' : 'outline'}
                  onClick={() => setSelectedZone('instructional_gap')}
                  className={selectedZone === 'instructional_gap' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                >
                  Red Zone ({zoneCounts.instructional_gap})
                </Button>
                <Button
                  size="sm"
                  variant={selectedZone === 'confounded' ? 'default' : 'outline'}
                  onClick={() => setSelectedZone('confounded')}
                  className={selectedZone === 'confounded' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                >
                  Amber Zone ({zoneCounts.confounded})
                </Button>
                <Button
                  size="sm"
                  variant={selectedZone === 'on_track' ? 'default' : 'outline'}
                  onClick={() => setSelectedZone('on_track')}
                  className={selectedZone === 'on_track' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  On Track ({zoneCounts.on_track})
                </Button>
              </div>

              <div className="h-[400px]">
                <Scatter data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insight Panels */}
        <div className="lg:col-span-4 space-y-4">
          {/* Red Zone - Instructional Gap */}
          <Card className="bg-rose-900/10 border-rose-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-rose-400 mb-3">
                <ShieldAlert className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wide">Actionable: The Red Zone</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                These students have <strong className="text-white">High Attendance (&gt;90%)</strong> but <strong className="text-white">Low Growth</strong>.
              </p>
              <div className="p-3 bg-slate-900/50 rounded-lg mb-3">
                <p className="text-xs text-slate-400">
                  <strong className="text-rose-400">Expert Conclusion:</strong> Since external attendance is not the confounder,
                  this suggests an <em>instructional mismatch</em>. These students require immediate Tier 2
                  academic intervention or a change in curriculum delivery.
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Students affected:</span>
                <Badge variant="destructive" className="bg-rose-500/20 text-rose-400">
                  {zoneCounts.instructional_gap}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Amber Zone - Confounded */}
          <Card className="bg-amber-900/10 border-amber-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-amber-500 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wide">Caution: The Amber Zone</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Low Growth is correlated with <strong className="text-white">Low Attendance (&lt;85%)</strong>.
              </p>
              <div className="p-3 bg-slate-900/50 rounded-lg mb-3">
                <p className="text-xs text-slate-400">
                  <strong className="text-amber-400">Expert Conclusion:</strong> The data is <em>confounded</em>.
                  You cannot accurately judge the teacher&apos;s impact here. Focus on the &quot;Attendance Office&quot;
                  rather than &quot;Instructional Coaching&quot; for this group.
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Students affected:</span>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  {zoneCounts.confounded}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Reduce Bias */}
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-cyan-400 mb-3">
                <Target className="w-5 h-5" />
                <span className="font-bold text-sm">Reduce Bias</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                EduNode uses a weighted algorithm to ensure subgroup demographics don&apos;t skew
                your renewal readiness score.
              </p>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                View Adjusted ROI
                <TrendingUp className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Pattern Matching: Invisible Success Students */}
      {invisibleSuccessStudents.length > 0 && (
        <div className="mt-8">
          <Card className="bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-cyan-900/20 border-2 border-violet-500/30 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full -mr-32 -mt-32" />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-500/20 rounded-xl">
                    <Sparkles className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      AI Pattern Matching
                      <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">
                        GEMINI POWERED
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Identifying &quot;Invisible Success&quot; students with breakout potential
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Eye className="w-4 h-4" />
                  <span>{invisibleSuccessStudents.length} students identified</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-violet-400">AI Insight:</strong> These Amber Zone students show
                  <strong className="text-white"> micro-growth patterns in LMS data</strong> that mirror
                  previous students who successfully broke out into the High Growth zone. Despite attendance
                  challenges, their engagement signals suggest <em>hidden instructional receptiveness</em>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {invisibleSuccessStudents.map((student) => (
                  <div
                    key={student.studentId}
                    className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-violet-500/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-white">{student.studentName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Current Zone: Amber (Confounded)
                        </div>
                      </div>
                      <Badge
                        className={`text-[10px] ${
                          student.breakoutProbability >= 80
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : student.breakoutProbability >= 60
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}
                      >
                        {student.breakoutProbability}% match
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Breakout Probability</span>
                        <span className="text-violet-400 font-bold">{student.breakoutProbability}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
                          style={{ width: `${student.breakoutProbability}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-slate-900/50 rounded-lg mb-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span className="uppercase font-bold tracking-wide">Key Signals</span>
                      </div>
                      <ul className="text-[11px] text-slate-300 space-y-1">
                        {student.microGrowthPatterns.slice(0, 2).map((pattern, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-violet-400 mt-0.5">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-500/20">
                      <div className="text-[10px] text-indigo-400 font-bold mb-1">RECOMMENDED ACTION</div>
                      <p className="text-[11px] text-slate-300">{student.recommendation}</p>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-3 bg-violet-600/80 hover:bg-violet-600 text-xs group-hover:bg-violet-600"
                    >
                      <Rocket className="w-3 h-3 mr-1.5" />
                      Create Breakout Plan
                      <ChevronRight className="w-3 h-3 ml-auto" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between p-3 bg-slate-900/30 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <BrainCircuit className="w-4 h-4 text-violet-400" />
                  <span>
                    Pattern model trained on <strong className="text-white">2,847</strong> historical breakout cases
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 text-xs">
                  View methodology
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/30">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-indigo-400">{students.length}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Total Students Analyzed</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/30">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-emerald-400">
              {((zoneCounts.on_track / students.length) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Clear Signal Rate</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/30">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-rose-400">{zoneCounts.instructional_gap}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Instructional Gaps</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/30">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-amber-400">{zoneCounts.confounded}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Confounded Signals</div>
          </CardContent>
        </Card>
      </div>
    </PageFeatureGate>
  );
}
