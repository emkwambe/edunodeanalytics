'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  GraduationCap,
  Target,
  Printer,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

// Mock school data - in production from getSchoolById + getSchoolMetrics
const mockSchoolData = {
  school: {
    id: '1',
    name: 'Innovation Prep Academy',
    slug: 'innovation-prep',
    address: '123 Education Blvd, Springfield, IL 62701',
    phone: '(217) 555-0123',
    email: 'admin@innovationprep.edu',
    website: 'https://innovationprep.edu',
    principal: 'Dr. Sarah Martinez',
    enrollment: 487,
    grades: 'K-8',
    charter_term_start: '2021-07-01',
    charter_term_end: '2026-06-30',
    authorizer_since: '2016-07-01',
  },
  metrics: {
    ela_proficiency: 68,
    math_proficiency: 62,
    ela_growth_percentile: 72,
    math_growth_percentile: 68,
    chronic_absence_rate: 18.3,
    attendance_rate: 94.2,
    suspension_rate: 3.2,
    teacher_retention: 86,
    students_with_iep: 14,
    students_ell: 22,
    students_frl: 68,
  },
  financials: {
    current_ratio: 1.35,
    days_cash_on_hand: 72,
    debt_to_asset_ratio: 0.42,
    enrollment_variance: -2.1,
    operating_margin: 3.8,
    per_pupil_revenue: 12450,
    per_pupil_expense: 11975,
    total_revenue: 6063150,
    total_expenses: 5832075,
    fund_balance: 892000,
    audit_opinion: 'unqualified',
  },
  compliance: {
    status: 'good',
    items: [
      { name: 'Annual Financial Audit', status: 'passed', date: '2025-09-15' },
      { name: 'Board Meeting Minutes', status: 'passed', date: '2025-10-01' },
      { name: 'Safety Inspection', status: 'pending', due_date: '2026-01-15' },
      { name: 'FERPA Compliance', status: 'passed', date: '2025-08-20' },
      { name: 'Special Ed File Review', status: 'pending', due_date: '2025-12-01' },
      { name: 'ELL Program Audit', status: 'passed', date: '2025-11-05' },
    ],
    items_passed: 4,
    items_pending: 2,
    items_failed: 0,
  },
  historical: {
    years: ['2021-22', '2022-23', '2023-24', '2024-25', '2025-26'],
    ela_proficiency: [52, 58, 62, 65, 68],
    math_proficiency: [48, 54, 57, 60, 62],
    enrollment: [412, 438, 456, 472, 487],
    chronic_absence: [22.5, 21.2, 19.8, 19.1, 18.3],
  },
  renewal: {
    years_until_renewal: 2.3,
    risk_score: 32,
    risk_level: 'medium',
    renewal_probability: 87,
    strengths: [
      'Consistent enrollment growth',
      'Strong academic growth metrics',
      'Clean audit history',
      'High teacher retention',
    ],
    concerns: [
      'Chronic absence above state average',
      'Math proficiency gap with state',
      'Current ratio below optimal 1.5',
    ],
    recommendations: [
      'Implement attendance intervention program',
      'Increase math intervention supports',
      'Build cash reserves over next 2 years',
    ],
  },
};

function getRiskBadge(level: string) {
  switch (level) {
    case 'low':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Low Risk</Badge>;
    case 'medium':
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium Risk</Badge>;
    case 'high':
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High Risk</Badge>;
    case 'critical':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'passed':
      return <Badge className="bg-emerald-500/20 text-emerald-400">Passed</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500/20 text-amber-400">Pending</Badge>;
    case 'failed':
      return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
}

export default function AuthorizerSchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const authorizerSlug = params.authorizer_slug as string;
  const schoolId = params.school_id as string;

  const data = mockSchoolData;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: '#94a3b8', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b' },
      },
    },
  };

  // Academic trend chart
  const academicTrendData = {
    labels: data.historical.years,
    datasets: [
      {
        label: 'ELA Proficiency',
        data: data.historical.ela_proficiency,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Math Proficiency',
        data: data.historical.math_proficiency,
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Financial health radar
  const financialRadarData = {
    labels: ['Current Ratio', 'Days Cash', 'Debt Ratio', 'Enrollment Var', 'Operating Margin'],
    datasets: [
      {
        label: 'School',
        data: [
          (data.financials.current_ratio / 2) * 100,
          (data.financials.days_cash_on_hand / 120) * 100,
          (1 - data.financials.debt_to_asset_ratio) * 100,
          Math.max(0, 100 + data.financials.enrollment_variance * 5),
          Math.max(0, data.financials.operating_margin * 10),
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 2,
      },
      {
        label: 'Benchmark',
        data: [75, 75, 70, 100, 50],
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        borderColor: '#94a3b8',
        borderWidth: 2,
        borderDash: [5, 5],
      },
    ],
  };

  // Enrollment composition
  const enrollmentData = {
    labels: ['General Ed', 'IEP', 'ELL', 'Other'],
    datasets: [
      {
        data: [
          100 - data.metrics.students_with_iep - data.metrics.students_ell,
          data.metrics.students_with_iep,
          data.metrics.students_ell,
          5,
        ],
        backgroundColor: ['#6366f1', '#f59e0b', '#22d3ee', '#94a3b8'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/authorizer/${authorizerSlug}/dashboard`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Portfolio
              </Button>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <h1 className="text-lg font-semibold">{data.school.name}</h1>
                <p className="text-sm text-slate-400">Authorizer View</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-slate-700">
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
              <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* School Info Card */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{data.school.name}</h2>
                  <p className="text-sm text-slate-400">{data.school.grades} | {data.school.enrollment} students</p>
                  <p className="text-sm text-slate-400 mt-1">Principal: {data.school.principal}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">{data.school.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">{data.school.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">{data.school.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">
                    Charter Term: {new Date(data.school.charter_term_start).getFullYear()} - {new Date(data.school.charter_term_end).getFullYear()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-400 font-medium">
                    {data.renewal.years_until_renewal.toFixed(1)} years until renewal
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {getRiskBadge(data.renewal.risk_level)}
                <p className="text-sm text-slate-400">Risk Score: {data.renewal.risk_score}/100</p>
                <p className="text-2xl font-bold text-emerald-400">{data.renewal.renewal_probability}%</p>
                <p className="text-xs text-slate-500">Renewal Probability</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="academic" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="renewal">Renewal Analysis</TabsTrigger>
          </TabsList>

          {/* Academic Tab */}
          <TabsContent value="academic" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm text-slate-400">ELA Proficiency</span>
                  </div>
                  <p className="text-3xl font-bold">{data.metrics.ela_proficiency}%</p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>+3% YoY</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-slate-400">Math Proficiency</span>
                  </div>
                  <p className="text-3xl font-bold">{data.metrics.math_proficiency}%</p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>+2% YoY</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-slate-400">Growth Percentile</span>
                  </div>
                  <p className="text-3xl font-bold">{data.metrics.ela_growth_percentile}th</p>
                  <p className="text-sm text-slate-400">ELA: {data.metrics.ela_growth_percentile} | Math: {data.metrics.math_growth_percentile}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm text-slate-400">Chronic Absence</span>
                  </div>
                  <p className="text-3xl font-bold">{data.metrics.chronic_absence_rate}%</p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-emerald-400">
                    <TrendingDown className="h-3 w-3" />
                    <span>-0.8% YoY</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-400" />
                    Academic Trend (5 Years)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <Line data={academicTrendData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-cyan-400" />
                    Student Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="w-[250px]">
                      <Doughnut
                        data={enrollmentData}
                        options={{
                          ...chartOptions,
                          cutout: '60%',
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Additional Academic Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Attendance Rate</p>
                    <p className="text-2xl font-bold text-emerald-400">{data.metrics.attendance_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Suspension Rate</p>
                    <p className="text-2xl font-bold">{data.metrics.suspension_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Teacher Retention</p>
                    <p className="text-2xl font-bold text-emerald-400">{data.metrics.teacher_retention}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Students FRL</p>
                    <p className="text-2xl font-bold">{data.metrics.students_frl}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-slate-400">Current Ratio</span>
                  </div>
                  <p className={`text-3xl font-bold ${data.financials.current_ratio >= 1.2 ? 'text-emerald-400' : data.financials.current_ratio >= 1.0 ? 'text-amber-400' : 'text-red-400'}`}>
                    {data.financials.current_ratio.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-400">Target: 1.5+</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-slate-400">Days Cash on Hand</span>
                  </div>
                  <p className={`text-3xl font-bold ${data.financials.days_cash_on_hand >= 60 ? 'text-emerald-400' : data.financials.days_cash_on_hand >= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                    {data.financials.days_cash_on_hand}
                  </p>
                  <p className="text-sm text-slate-400">Target: 90+</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm text-slate-400">Operating Margin</span>
                  </div>
                  <p className={`text-3xl font-bold ${data.financials.operating_margin >= 3 ? 'text-emerald-400' : data.financials.operating_margin >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                    {data.financials.operating_margin}%
                  </p>
                  <p className="text-sm text-slate-400">Target: 5%+</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-slate-400">Audit Opinion</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-400 capitalize">{data.financials.audit_opinion}</p>
                  <p className="text-sm text-slate-400">Clean audit</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Financial Health Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <Radar
                      data={financialRadarData}
                      options={{
                        ...chartOptions,
                        scales: {
                          r: {
                            min: 0,
                            max: 100,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            angleLines: { color: 'rgba(255,255,255,0.05)' },
                            pointLabels: { color: '#94a3b8' },
                            ticks: { display: false },
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Total Revenue</span>
                    <span className="font-bold">${data.financials.total_revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Total Expenses</span>
                    <span className="font-bold">${data.financials.total_expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Net Income</span>
                    <span className="font-bold text-emerald-400">
                      ${(data.financials.total_revenue - data.financials.total_expenses).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Fund Balance</span>
                    <span className="font-bold">${data.financials.fund_balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Per Pupil Revenue</span>
                    <span className="font-bold">${data.financials.per_pupil_revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Per Pupil Expense</span>
                    <span className="font-bold">${data.financials.per_pupil_expense.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-emerald-500/10 border-emerald-500/30">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-3xl font-bold text-emerald-400">{data.compliance.items_passed}</p>
                  <p className="text-sm text-slate-400">Items Passed</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="pt-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                  <p className="text-3xl font-bold text-amber-400">{data.compliance.items_pending}</p>
                  <p className="text-sm text-slate-400">Items Pending</p>
                </CardContent>
              </Card>
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                  <p className="text-3xl font-bold text-red-400">{data.compliance.items_failed}</p>
                  <p className="text-sm text-slate-400">Items Failed</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Compliance Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.compliance.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {item.status === 'passed' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : item.status === 'pending' ? (
                          <Clock className="h-5 w-5 text-amber-400" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-400">
                            {item.date
                              ? `Completed: ${item.date}`
                              : item.due_date
                                ? `Due: ${item.due_date}`
                                : ''}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Renewal Analysis Tab */}
          <TabsContent value="renewal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border-indigo-500/30">
                <CardContent className="pt-6 text-center">
                  <p className="text-5xl font-black text-white mb-2">{data.renewal.renewal_probability}%</p>
                  <p className="text-lg text-slate-300">Renewal Probability</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Based on academic, financial, and compliance metrics
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.renewal.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Areas of Concern
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.renewal.concerns.map((concern, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-cyan-400" />
                  Recommendations for Renewal Success
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.renewal.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                        <span className="text-cyan-400 font-bold">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{rec}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Renewal Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-400">Charter Start</p>
                    <p className="font-bold">{new Date(data.school.charter_term_start).getFullYear()}</p>
                  </div>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full relative">
                    <div
                      className="absolute h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                      style={{
                        width: `${((5 - data.renewal.years_until_renewal) / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-400">Charter End</p>
                    <p className="font-bold text-amber-400">{new Date(data.school.charter_term_end).getFullYear()}</p>
                  </div>
                </div>
                <p className="text-center mt-4 text-lg">
                  <span className="text-amber-400 font-bold">{data.renewal.years_until_renewal.toFixed(1)} years</span>
                  <span className="text-slate-400"> remaining in charter term</span>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
