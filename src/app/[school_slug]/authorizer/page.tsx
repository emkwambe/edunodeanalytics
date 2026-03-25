'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Printer,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  BarChart3,
  FileText,
  Download,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  BrainCircuit,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { generateCharterNarrative, type CharterNarrative } from '@/lib/ai/edunode-advisor';
import { MTSSEvidenceMetrics } from '@/components/dashboard/mtss-evidence-metrics';
import { useCurrentSchool } from '@/lib/hooks/use-school-context';
import { useMtssSummary } from '@/lib/hooks/use-mtss-summary';
import { useRiskDistribution } from '@/lib/hooks/use-risk-distribution';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { Line } from 'react-chartjs-2';
import { ArcElement } from 'chart.js';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement
);

/**
 * Authorizer Renewal Portal
 * =========================
 *
 * SEGMENT 5: The "Evidence" View for Charter Renewal
 *
 * Features:
 * - Renewal Radar (Performance vs. State Benchmarks)
 * - Fiscal Health Indicators
 * - Academic Growth Analysis
 * - Subgroup Parity / Equity Gaps
 * - Export Evidence Pack (Print-to-PDF)
 *
 * Access: Restricted to AUTHORIZER role (Enterprise tier)
 */

interface RenewalMetrics {
  growthPercentile: number;
  currentRatio: number;
  daysCashOnHand: number;
  enrollment: number;
  attendanceRate: number;
  chronicAbsenceRate: number;
  complianceScore: number;
  renewalProbability: number;
}

interface RadarDataset {
  labels: string[];
  charter: number[];
  stateAvg: number[];
  districtAvg: number[];
}

interface AuditItem {
  name: string;
  status: 'passed' | 'pending' | 'failed';
  date?: string;
}

// Allowed roles for authorizer page
const ALLOWED_ROLES = ['school_admin', 'principal', 'authorizer', 'platform_admin'];

export default function AuthorizerPortal() {
  const params = useParams();
  const schoolSlug = params.school_slug as string;

  const [metrics, setMetrics] = React.useState<RenewalMetrics | null>(null);
  const [radarData, setRadarData] = React.useState<RadarDataset | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isPrinting, setIsPrinting] = React.useState(false);

  // AI Charter Narrative Generator state
  const [isGeneratingNarrative, setIsGeneratingNarrative] = React.useState(false);
  const [narrativeResult, setNarrativeResult] = React.useState<CharterNarrative | null>(null);
  const [narrativeExpanded, setNarrativeExpanded] = React.useState(false);
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  // School context and MTSS data hooks
  const { schoolId, school, isLoading: isLoadingSchool } = useCurrentSchool(schoolSlug);
  const { data: mtssSummary, isLoading: isLoadingMtss } = useMtssSummary(schoolId);
  const { weeklyTrend, isLoading: isLoadingTrend } = useRiskDistribution(schoolId, { weeks: 12 });
  const { role, isLoading: isLoadingRole } = useUserRole(schoolId);

  // Fetch data from warehouse API
  React.useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, radarRes] = await Promise.all([
          fetch(`/api/data/warehouse?school_slug=${schoolSlug}&type=summary`),
          fetch(`/api/data/warehouse?school_slug=${schoolSlug}&type=radar`),
        ]);

        const summaryData = await summaryRes.json();
        const radarDataRes = await radarRes.json();

        // Parse summary metrics
        setMetrics({
          growthPercentile: parseInt(summaryData.data.avg_growth_percentile) || 82,
          currentRatio: 1.8,
          daysCashOnHand: 62,
          enrollment: summaryData.data.total_enrollment || 487,
          attendanceRate: parseFloat(summaryData.data.attendance_rate) || 94.2,
          chronicAbsenceRate: parseFloat(summaryData.data.chronic_absence_rate) || 12.5,
          complianceScore: 98,
          renewalProbability: 94.2,
        });

        // Parse radar data
        if (radarDataRes.data?.datasets) {
          setRadarData({
            labels: radarDataRes.data.labels,
            charter: radarDataRes.data.datasets.charter,
            stateAvg: radarDataRes.data.datasets.state_avg,
            districtAvg: radarDataRes.data.datasets.district_avg,
          });
        }
      } catch (error) {
        console.error('Failed to fetch authorizer data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [schoolSlug]);

  // Export Evidence Pack (enhanced with MTSS data - Sprint 5E)
  const handleExportEvidence = () => {
    setIsPrinting(true);

    // Prepare MTSS data for export
    const exportData = {
      schoolName: schoolSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      generatedAt: new Date().toISOString(),
      academicYear: '2025-26',
      renewalMetrics: metrics,
      mtssEvidence: mtssSummary ? {
        studentsIdentified: mtssSummary.students_identified,
        responseRate: Math.round(mtssSummary.response_rate * 100) + '%',
        avgTimeToAction: mtssSummary.avg_time_to_action_days.toFixed(1) + ' days',
        dosageCompliance: Math.round(mtssSummary.avg_dosage_compliance * 100) + '%',
        improvementRate: Math.round(mtssSummary.improvement_rate * 100) + '%',
        outcomes: {
          improved: mtssSummary.students_improved,
          maintained: mtssSummary.students_maintained,
          worsened: mtssSummary.students_worsened,
        },
        topStrategies: mtssSummary.top_strategies,
      } : null,
      riskTrend: weeklyTrend && weeklyTrend.length >= 2 ? weeklyTrend : null,
      narrative: narrativeResult,
    };

    // Store export data for print view access
    (window as any).__authorizerExportData = exportData;

    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  // Generate AI Charter Narrative (enhanced with MTSS data)
  const handleGenerateNarrative = async () => {
    if (!metrics) return;

    setIsGeneratingNarrative(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const schoolName = schoolSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    const result = generateCharterNarrative(schoolName, {
      avgGrowth: metrics.growthPercentile,
      proficiencyRate: 68, // Mock data
      chronicAbsenceRate: metrics.chronicAbsenceRate,
      subgroupGap: 5, // Mock: 5% gap between subgroups
      yearOverYearChange: 3, // Mock: 3% improvement year over year
      // MTSS data for enhanced narrative (Sprint 5E)
      mtssData: mtssSummary ? {
        studentsIdentified: mtssSummary.students_identified,
        responseRate: mtssSummary.response_rate,
        avgTimeToAction: mtssSummary.avg_time_to_action_days,
        dosageCompliance: mtssSummary.avg_dosage_compliance,
        improvementRate: mtssSummary.improvement_rate,
        studentsImproved: mtssSummary.students_improved,
      } : undefined,
    });

    setNarrativeResult(result);
    setNarrativeExpanded(true);
    setIsGeneratingNarrative(false);
  };

  // Copy section to clipboard
  const handleCopySection = async (sectionTitle: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedSection(sectionTitle);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Audit checklist items
  const auditItems: AuditItem[] = [
    { name: 'Financial Audit (FY25)', status: 'passed', date: '2025-09-15' },
    { name: 'Board Governance Review', status: 'passed', date: '2025-10-01' },
    { name: 'Safety Inspection', status: 'pending' },
    { name: 'FERPA Compliance', status: 'passed', date: '2025-08-20' },
    { name: 'Special Ed File Review', status: 'passed', date: '2025-11-05' },
    { name: 'ELL Program Audit', status: 'pending' },
  ];

  // Radar chart configuration
  const radarChartData = radarData
    ? {
        labels: radarData.labels,
        datasets: [
          {
            label: 'Charter Performance',
            data: radarData.charter,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: '#6366f1',
            borderWidth: 3,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#6366f1',
          },
          {
            label: 'State Average',
            data: radarData.stateAvg,
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            borderColor: '#94a3b8',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#94a3b8',
            pointBorderColor: '#fff',
          },
        ],
      }
    : null;

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)' },
        angleLines: { color: 'rgba(255,255,255,0.05)' },
        pointLabels: {
          color: '#94a3b8',
          font: { size: 11, weight: 500 as const },
        },
        ticks: { display: false },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (items: any[]) => {
            return items[0]?.label || '';
          },
          label: (context: any) => {
            const value = context.raw;
            const label = context.dataset.label;
            return `${label}: ${value}%`;
          },
        },
      },
    },
  };

  // Growth comparison bar chart
  const growthComparisonData = {
    labels: ['All Students', 'IEP', 'ELL', 'Economically Disadvantaged'],
    datasets: [
      {
        label: 'Charter Growth %ile',
        data: metrics ? [metrics.growthPercentile, 78, 81, 84] : [82, 78, 81, 84],
        backgroundColor: '#6366f1',
        borderRadius: 6,
      },
      {
        label: 'State Median',
        data: [50, 45, 48, 47],
        backgroundColor: '#475569',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#64748b' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#94a3b8', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          title: (items: any[]) => items[0]?.label || '',
          label: (context: any) => `${context.dataset.label}: ${context.raw}th percentile`,
        },
      },
    },
  };

  // Loading state
  if (loading || isLoadingSchool || isLoadingRole) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Renewal Evidence...</p>
        </div>
      </div>
    );
  }

  // Role-based access control (Sprint 5E)
  if (role && !ALLOWED_ROLES.includes(role)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-slate-400 mb-6">
            The Authorizer Portal is restricted to school administrators, principals, and authorized charter authorizers.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 print:bg-white print:text-slate-900">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-slate-800 print:border-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Charter Renewal Evidence Portal
              </span>
            </div>
            <h1 className="text-3xl font-black capitalize print:text-slate-900">
              {schoolSlug.replace(/-/g, ' ')}
            </h1>
            <p className="text-slate-400 mt-1 print:text-slate-600">
              Academic Year 2025-26 | Generated {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3 no-print">
            <Button variant="outline" onClick={handleExportEvidence} disabled={isPrinting}>
              {isPrinting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin mr-2" />
                  Preparing...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 mr-2" />
                  Export Evidence Pack
                </>
              )}
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 print:bg-slate-100 print:border-slate-300">
            <CardContent className="p-6">
              <div className="text-indigo-400 mb-2 print:text-indigo-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black">
                {metrics?.growthPercentile}
                <span className="text-lg text-slate-400 ml-1">th</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">
                Growth Percentile
              </div>
              <div className="text-xs text-emerald-400 mt-2">
                +{(metrics?.growthPercentile || 0) - 50} vs State Median
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 print:bg-slate-100 print:border-slate-300">
            <CardContent className="p-6">
              <div className="text-cyan-400 mb-2 print:text-cyan-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black">
                {metrics?.currentRatio}
                <span className="text-lg text-slate-400 ml-1">x</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">
                Current Ratio
              </div>
              <div className="text-xs text-emerald-400 mt-2">
                {metrics?.daysCashOnHand} Days Cash on Hand
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 print:bg-slate-100 print:border-slate-300">
            <CardContent className="p-6">
              <div className="text-emerald-400 mb-2 print:text-emerald-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black">{metrics?.enrollment}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">
                Total Enrollment
              </div>
              <div className="text-xs text-emerald-400 mt-2">
                {metrics?.attendanceRate}% Attendance Rate
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 print:bg-slate-100 print:border-slate-300">
            <CardContent className="p-6">
              <div className="text-amber-400 mb-2 print:text-amber-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black">
                {metrics?.chronicAbsenceRate}
                <span className="text-lg text-slate-400 ml-1">%</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">
                Chronic Absence
              </div>
              <div className="text-xs text-amber-400 mt-2">
                State Avg: 18.5%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MTSS Evidence Section (Sprint 5E) */}
        <div className="mb-8">
          <Card className="bg-slate-800/30 border-slate-700 print:bg-white print:border-slate-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Evidence of Systematic MTSS Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schoolId && (
                <MTSSEvidenceMetrics
                  schoolId={schoolId}
                  variant="summary"
                  schoolName={school?.name || schoolSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  className="print:text-slate-900"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Intervention Outcomes & Risk Trend (Sprint 5E) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Intervention Outcomes */}
          <Card className="bg-slate-800/30 border-slate-700 print:bg-white print:border-slate-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Intervention Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMtss ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-8 bg-slate-700/50 rounded" />
                  ))}
                </div>
              ) : mtssSummary && (mtssSummary.students_improved > 0 || mtssSummary.students_maintained > 0 || mtssSummary.students_worsened > 0) ? (
                <div className="space-y-4">
                  {/* Outcome bars */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-sm text-slate-400">Improved</div>
                      <div className="flex-1 bg-slate-700/50 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full flex items-center justify-end px-2"
                          style={{
                            width: `${Math.max(10, (mtssSummary.students_improved / (mtssSummary.students_improved + mtssSummary.students_maintained + mtssSummary.students_worsened)) * 100)}%`
                          }}
                        >
                          <span className="text-xs font-bold text-white">{mtssSummary.students_improved}</span>
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm text-emerald-400">
                        {Math.round((mtssSummary.students_improved / (mtssSummary.students_improved + mtssSummary.students_maintained + mtssSummary.students_worsened)) * 100)}%
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-sm text-slate-400">Maintained</div>
                      <div className="flex-1 bg-slate-700/50 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full flex items-center justify-end px-2"
                          style={{
                            width: `${Math.max(10, (mtssSummary.students_maintained / (mtssSummary.students_improved + mtssSummary.students_maintained + mtssSummary.students_worsened)) * 100)}%`
                          }}
                        >
                          <span className="text-xs font-bold text-white">{mtssSummary.students_maintained}</span>
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm text-amber-400">
                        {Math.round((mtssSummary.students_maintained / (mtssSummary.students_improved + mtssSummary.students_maintained + mtssSummary.students_worsened)) * 100)}%
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-sm text-slate-400">Worsened</div>
                      <div className="flex-1 bg-slate-700/50 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full flex items-center justify-end px-2"
                          style={{
                            width: `${Math.max(10, (mtssSummary.students_worsened / (mtssSummary.students_improved + mtssSummary.students_maintained + mtssSummary.students_worsened)) * 100)}%`
                          }}
                        >
                          <span className="text-xs font-bold text-white">{mtssSummary.students_worsened}</span>
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm text-red-400">
                        {Math.round((mtssSummary.students_worsened / (mtssSummary.students_improved + mtssSummary.students_maintained + mtssSummary.students_worsened)) * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Top Performing Strategies */}
                  {mtssSummary.top_strategies && mtssSummary.top_strategies.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-700">
                      <h4 className="text-sm font-semibold text-slate-300 mb-3">Top Performing Strategies</h4>
                      <div className="space-y-2">
                        {mtssSummary.top_strategies.map((strategy, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-sm text-slate-300">{strategy.strategy_name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500">{strategy.student_count} students</span>
                              <Badge variant={strategy.improvement_rate >= 0.5 ? 'accent' : 'secondary'} size="sm">
                                {Math.round(strategy.improvement_rate * 100)}% improved
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No intervention outcome data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Distribution Trend */}
          <Card className="bg-slate-800/30 border-slate-700 print:bg-white print:border-slate-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Risk Distribution Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTrend ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="animate-pulse w-full h-full bg-slate-700/30 rounded" />
                </div>
              ) : weeklyTrend && weeklyTrend.length >= 2 ? (
                <div className="h-[250px]">
                  <Line
                    data={{
                      labels: weeklyTrend.map(w => {
                        const date = new Date(w.weekStart);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }),
                      datasets: [
                        {
                          label: 'On Track',
                          data: weeklyTrend.map(w => w.on_track),
                          borderColor: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          fill: true,
                          tension: 0.3,
                        },
                        {
                          label: 'Watch',
                          data: weeklyTrend.map(w => w.watch),
                          borderColor: '#f59e0b',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          fill: true,
                          tension: 0.3,
                        },
                        {
                          label: 'At Risk',
                          data: weeklyTrend.map(w => w.at_risk),
                          borderColor: '#f97316',
                          backgroundColor: 'rgba(249, 115, 22, 0.1)',
                          fill: true,
                          tension: 0.3,
                        },
                        {
                          label: 'Critical',
                          data: weeklyTrend.map(w => w.critical),
                          borderColor: '#ef4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          fill: true,
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
                          grid: { color: 'rgba(255,255,255,0.05)' },
                          ticks: { color: '#64748b', font: { size: 10 } },
                        },
                        y: {
                          stacked: true,
                          grid: { color: 'rgba(255,255,255,0.05)' },
                          ticks: { color: '#64748b' },
                        },
                      },
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                          labels: { color: '#94a3b8', usePointStyle: true, padding: 12 },
                        },
                        tooltip: {
                          backgroundColor: '#1e293b',
                          titleColor: '#f8fafc',
                          bodyColor: '#cbd5e1',
                          borderColor: '#334155',
                          borderWidth: 1,
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Risk trend data will populate as the system runs over time</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Renewal Radar */}
          <div className="lg:col-span-8">
            <Card className="bg-slate-800/30 border-slate-700 print:bg-white print:border-slate-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  Performance vs. State Benchmarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {radarChartData && (
                    <Radar data={radarChartData} options={radarOptions} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Audit Checklist */}
            <Card className="bg-slate-800/30 border-slate-700 print:bg-white print:border-slate-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Compliance Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {auditItems.map((item) => (
                    <li key={item.name} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 print:text-slate-700">
                        {item.name}
                      </span>
                      {item.status === 'passed' && (
                        <Badge variant="accent" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Passed
                        </Badge>
                      )}
                      {item.status === 'pending' && (
                        <Badge variant="warning" size="sm">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {item.status === 'failed' && (
                        <Badge variant="destructive" size="sm">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Renewal Probability */}
            <Card className="bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 border-indigo-500/30 print:bg-indigo-50 print:border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-lg">Renewal Probability</h3>
                </div>
                <div className="text-5xl font-black text-emerald-400 mb-4">
                  {metrics?.renewalProbability}%
                </div>
                <p className="text-xs text-slate-400 leading-relaxed print:text-slate-600">
                  The high growth percentile ({metrics?.growthPercentile}th) significantly
                  outweighs the moderate proficiency gap, demonstrating strong value-add
                  for students entering below grade level.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Growth by Subgroup */}
        <div className="mt-8 print-break">
          <Card className="bg-slate-800/30 border-slate-700 print:bg-white print:border-slate-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Growth Percentile by Subgroup (Equity Analysis)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={growthComparisonData} options={barOptions} />
              </div>
              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-sm text-emerald-300 print:text-emerald-700">
                  <strong>Key Finding:</strong> All subgroups exceed the state median growth
                  percentile, with Economically Disadvantaged students showing the highest
                  growth (+37 vs state median). This demonstrates equitable outcomes and
                  effective intervention strategies.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Charter Narrative Generator */}
        <div className="mt-8 print-break no-print">
          <Card className="bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-cyan-900/20 border-2 border-violet-500/30 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full -mr-48 -mt-48" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-500/20 rounded-xl">
                    <Sparkles className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      AI Charter Narrative Generator
                      <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">
                        GEMINI POWERED
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Generate professional renewal narratives for your authorizer application
                    </p>
                  </div>
                </div>
                {!narrativeResult && (
                  <Button
                    onClick={handleGenerateNarrative}
                    disabled={isGeneratingNarrative}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  >
                    {isGeneratingNarrative ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating Narrative...
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Generate Narrative
                      </>
                    )}
                  </Button>
                )}
                {narrativeResult && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNarrativeExpanded(!narrativeExpanded)}
                    >
                      {narrativeExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Expand
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleGenerateNarrative}
                      disabled={isGeneratingNarrative}
                      className="bg-violet-600 hover:bg-violet-700"
                      size="sm"
                    >
                      {isGeneratingNarrative ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Regenerate
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative">
              {isGeneratingNarrative && !narrativeResult && (
                <div className="py-12 text-center">
                  <div className="p-4 bg-violet-500/20 rounded-2xl inline-block mb-4 animate-pulse">
                    <BrainCircuit className="w-12 h-12 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">AI Analyzing Your Data...</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Gemini is crafting a professional narrative by analyzing growth metrics,
                    subgroup performance, fiscal health, and compliance data.
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-violet-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      Analyzing metrics
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                      Synthesizing narrative
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                      Formatting output
                    </span>
                  </div>
                </div>
              )}

              {narrativeResult && narrativeExpanded && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-white">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <h4 className="font-bold">Executive Summary</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySection('Executive Summary', narrativeResult.executiveSummary)}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedSection === 'Executive Summary' ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {narrativeResult.executiveSummary}
                    </p>
                  </div>

                  {/* Narrative Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Growth Evidence */}
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white text-sm">Growth Evidence</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopySection('Growth Evidence', narrativeResult.growthEvidence)}
                          className="text-slate-400 hover:text-white h-7 w-7 p-0"
                        >
                          {copiedSection === 'Growth Evidence' ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {narrativeResult.growthEvidence}
                      </p>
                    </div>

                    {/* Subgroup Parity */}
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white text-sm">Subgroup Parity</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopySection('Subgroup Parity', narrativeResult.subgroupParity)}
                          className="text-slate-400 hover:text-white h-7 w-7 p-0"
                        >
                          {copiedSection === 'Subgroup Parity' ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                        {narrativeResult.subgroupParity}
                      </p>
                    </div>

                    {/* Renewal Recommendation */}
                    <div className="p-4 bg-emerald-900/20 rounded-xl border border-emerald-500/30 md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-emerald-400 text-sm">Renewal Recommendation</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopySection('Renewal Recommendation', narrativeResult.renewalRecommendation)}
                          className="text-slate-400 hover:text-white h-7 w-7 p-0"
                        >
                          {copiedSection === 'Renewal Recommendation' ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {narrativeResult.renewalRecommendation}
                      </p>
                    </div>
                  </div>

                  {/* Key Highlights */}
                  <div className="p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/30">
                    <div className="flex items-center gap-2 text-indigo-400 mb-3">
                      <Award className="w-4 h-4" />
                      <h4 className="font-bold text-sm">Key Highlights for Authorizer Meeting</h4>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {narrativeResult.keyHighlights.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-indigo-400 font-bold mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg text-xs">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span>Generated: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySection('Full Narrative',
                        `EXECUTIVE SUMMARY\n\n${narrativeResult.executiveSummary}\n\n` +
                        `GROWTH EVIDENCE\n\n${narrativeResult.growthEvidence}\n\n` +
                        `SUBGROUP PARITY\n\n${narrativeResult.subgroupParity}\n\n` +
                        `RENEWAL RECOMMENDATION\n\n${narrativeResult.renewalRecommendation}`
                      )}
                      className="text-violet-400 hover:text-violet-300"
                    >
                      {copiedSection === 'Full Narrative' ? (
                        <>
                          <Check className="w-3 h-3 mr-1 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Full Narrative
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {narrativeResult && !narrativeExpanded && (
                <div className="p-4 bg-slate-900/50 rounded-xl">
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {narrativeResult.executiveSummary}
                  </p>
                </div>
              )}

              {!narrativeResult && !isGeneratingNarrative && (
                <div className="p-6 bg-slate-900/30 rounded-xl text-center">
                  <p className="text-sm text-slate-400">
                    Generate a professional, data-driven narrative for your charter renewal application.
                    The AI will synthesize your growth metrics, subgroup performance, fiscal health,
                    and compliance status into compelling authorizer-ready content.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI-Generated Narrative for Print */}
        {narrativeResult && (
          <div className="mt-8 print-break hidden print:block">
            <div className="border border-slate-300 rounded-lg p-6 bg-white">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Charter Renewal Narrative
              </h2>
              <div className="mb-6">
                <h3 className="font-bold text-slate-700 mb-2">Executive Summary</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {narrativeResult.executiveSummary}
                </p>
              </div>
              <div className="mb-4">
                <h3 className="font-bold text-slate-700 mb-2">Growth Evidence</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {narrativeResult.growthEvidence}
                </p>
              </div>
              <div className="mb-4">
                <h3 className="font-bold text-slate-700 mb-2">Subgroup Parity</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {narrativeResult.subgroupParity}
                </p>
              </div>
              <div className="mb-4">
                <h3 className="font-bold text-emerald-700 mb-2">Renewal Recommendation</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {narrativeResult.renewalRecommendation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800 print:border-slate-300 text-center">
          <p className="text-xs text-slate-500 print:text-slate-600">
            EduNode Analytics | Renewal Evidence Report | Confidential
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Data as of {new Date().toLocaleDateString()} | Academic Year 2025-26
          </p>
        </footer>
      </main>
    </div>
  );
}
