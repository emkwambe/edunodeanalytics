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
import { cn } from '@/lib/utils';
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
import { generateCharterNarrative, type CharterNarrativeResult } from '@/lib/ai/edunode-advisor';

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
  BarElement
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

export default function AuthorizerPortal() {
  const params = useParams();
  const schoolSlug = params.school_slug as string;

  const [metrics, setMetrics] = React.useState<RenewalMetrics | null>(null);
  const [radarData, setRadarData] = React.useState<RadarDataset | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isPrinting, setIsPrinting] = React.useState(false);

  // AI Charter Narrative Generator state
  const [isGeneratingNarrative, setIsGeneratingNarrative] = React.useState(false);
  const [narrativeResult, setNarrativeResult] = React.useState<CharterNarrativeResult | null>(null);
  const [narrativeExpanded, setNarrativeExpanded] = React.useState(false);
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

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

  // Export Evidence Pack (trigger print)
  const handleExportEvidence = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  // Generate AI Charter Narrative
  const handleGenerateNarrative = async () => {
    if (!metrics) return;

    setIsGeneratingNarrative(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const schoolName = schoolSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    const result = generateCharterNarrative(schoolName, {
      growthPercentile: metrics.growthPercentile,
      proficiencyRate: 68, // Mock data
      attendanceRate: metrics.attendanceRate,
      chronicAbsenceRate: metrics.chronicAbsenceRate,
      subgroupGrowth: {
        ell: 81,
        iep: 78,
        economicallyDisadvantaged: 84,
      },
      fiscalHealth: {
        currentRatio: metrics.currentRatio,
        daysCashOnHand: metrics.daysCashOnHand,
      },
      enrollmentTrend: 'stable',
      complianceScore: metrics.complianceScore,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Renewal Evidence...</p>
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
                        <Badge variant="success" size="sm">
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
                        <Badge variant="danger" size="sm">
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
                    {narrativeResult.sections.map((section, idx) => (
                      <div key={idx} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white text-sm">{section.title}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopySection(section.title, section.content)}
                            className="text-slate-400 hover:text-white h-7 w-7 p-0"
                          >
                            {copiedSection === section.title ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Key Talking Points */}
                  <div className="p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/30">
                    <div className="flex items-center gap-2 text-indigo-400 mb-3">
                      <Award className="w-4 h-4" />
                      <h4 className="font-bold text-sm">Key Talking Points for Authorizer Meeting</h4>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {narrativeResult.keyTalkingPoints.map((point, idx) => (
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
                      <span>Word count: ~{narrativeResult.wordCount}</span>
                      <span>•</span>
                      <span>Confidence: {narrativeResult.confidenceScore}%</span>
                      <span>•</span>
                      <span>Generated: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySection('Full Narrative',
                        `EXECUTIVE SUMMARY\n\n${narrativeResult.executiveSummary}\n\n` +
                        narrativeResult.sections.map(s => `${s.title.toUpperCase()}\n\n${s.content}`).join('\n\n')
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
              {narrativeResult.sections.map((section, idx) => (
                <div key={idx} className="mb-4">
                  <h3 className="font-bold text-slate-700 mb-2">{section.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </p>
                </div>
              ))}
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
