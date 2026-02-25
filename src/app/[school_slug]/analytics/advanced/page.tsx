'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  PageHeader,
  DashboardGrid,
  GridItem,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageFeatureGate } from '@/components/features/page-feature-gate';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Users,
  TrendingUp,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Calendar,
  GraduationCap,
  Layers,
  Target,
  ChevronDown,
  AlertTriangle,
  Sparkles,
  Activity,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
interface CohortYear {
  label: string;
  mathProficiency: number;
  readingProficiency: number;
  attendanceRate: number;
  growthPercentile: number;
  studentCount: number;
}

const COHORT_DATA: CohortYear[] = [
  { label: 'Class of 2022', mathProficiency: 58, readingProficiency: 62, attendanceRate: 91.2, growthPercentile: 48, studentCount: 112 },
  { label: 'Class of 2023', mathProficiency: 63, readingProficiency: 65, attendanceRate: 92.8, growthPercentile: 54, studentCount: 118 },
  { label: 'Class of 2024', mathProficiency: 67, readingProficiency: 69, attendanceRate: 93.5, growthPercentile: 59, studentCount: 125 },
  { label: 'Class of 2025', mathProficiency: 72, readingProficiency: 74, attendanceRate: 94.1, growthPercentile: 64, studentCount: 131 },
];

interface SubgroupRow {
  group: string;
  enrollment: number;
  mathProficiency: number;
  readingProficiency: number;
  growthPercentile: number;
  attendanceRate: number;
  gapToSchoolAvg: number;
}

const SUBGROUP_DATA: SubgroupRow[] = [
  { group: 'All Students',            enrollment: 131, mathProficiency: 72, readingProficiency: 74, growthPercentile: 64, attendanceRate: 94.1, gapToSchoolAvg: 0 },
  { group: 'English Learners (ELL)',   enrollment: 34,  mathProficiency: 58, readingProficiency: 52, growthPercentile: 55, attendanceRate: 92.3, gapToSchoolAvg: -16.5 },
  { group: 'Special Education (SPED)', enrollment: 22,  mathProficiency: 49, readingProficiency: 47, growthPercentile: 51, attendanceRate: 91.0, gapToSchoolAvg: -25.0 },
  { group: 'Free/Reduced Lunch (FRL)', enrollment: 89,  mathProficiency: 64, readingProficiency: 66, growthPercentile: 59, attendanceRate: 93.0, gapToSchoolAvg: -8.0 },
  { group: 'Gifted & Talented',        enrollment: 18,  mathProficiency: 91, readingProficiency: 89, growthPercentile: 78, attendanceRate: 96.5, gapToSchoolAvg: 17.0 },
  { group: 'Male',                     enrollment: 68,  mathProficiency: 74, readingProficiency: 70, growthPercentile: 62, attendanceRate: 93.8, gapToSchoolAvg: -1.0 },
  { group: 'Female',                   enrollment: 63,  mathProficiency: 70, readingProficiency: 78, growthPercentile: 66, attendanceRate: 94.5, gapToSchoolAvg: 1.0 },
];
interface ForecastMetric {
  metric: string;
  current: number;
  projected: number;
  confidence: number;
  trend: 'up' | 'down' | 'flat';
  unit: string;
}

const FORECAST_DATA: ForecastMetric[] = [
  { metric: 'Math Proficiency',    current: 72,   projected: 75,   confidence: 82, trend: 'up',   unit: '%' },
  { metric: 'Reading Proficiency', current: 74,   projected: 76,   confidence: 79, trend: 'up',   unit: '%' },
  { metric: 'Attendance Rate',     current: 94.1, projected: 94.4, confidence: 91, trend: 'up',   unit: '%' },
  { metric: 'Growth Percentile',   current: 64,   projected: 67,   confidence: 74, trend: 'up',   unit: 'th %ile' },
  { metric: 'Chronic Absence',     current: 8.2,  projected: 7.5,  confidence: 70, trend: 'down', unit: '%' },
  { metric: 'SPED Gap',            current: -25,  projected: -22,  confidence: 65, trend: 'up',   unit: 'pts' },
];
const GRADE_LEVELS = ['All Grades', 'K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const SUBJECTS = ['All Subjects', 'Math', 'Reading', 'Science', 'Social Studies'];
const TIME_PERIODS = ['Current Year', 'Last 2 Years', 'Last 3 Years', 'All Time'];
const DEMOGRAPHICS = ['All Students', 'ELL', 'SPED', 'FRL', 'Gifted & Talented'];
// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------
/** Dropdown-style filter button (visual only, toggles open state) */
function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
          'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-indigo-500/50 hover:text-white'
        )}
      >
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}:</span>
        <span className="font-medium">{value}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-500 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-48 rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-slate-700/60 transition-colors first:rounded-t-lg last:rounded-b-lg',
                opt === value ? 'text-indigo-400 font-medium bg-indigo-500/10' : 'text-slate-300'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Visual bar for the cohort chart */
function CohortBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = Math.min(100, (value / maxValue) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-10 text-right shrink-0">{value}%</span>
      <div className="flex-1 h-6 bg-slate-700/40 rounded overflow-hidden">
        <div className={cn('h-full rounded transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 w-16 shrink-0">{label}</span>
    </div>
  );
}

/** Trend arrow icon */
function TrendArrow({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'up') return <ArrowUp className="w-4 h-4 text-emerald-400" />;
  if (direction === 'down') return <ArrowDown className="w-4 h-4 text-rose-400" />;
  return <ArrowRight className="w-4 h-4 text-slate-400" />;
}

/** Color-coded metric badge for subgroup table cells */
function MetricBadge({ value, thresholds, suffix = '%' }: { value: number; thresholds: [number, number]; suffix?: string }) {
  const color = value >= thresholds[0] ? 'bg-emerald-500/20 text-emerald-400'
    : value >= thresholds[1] ? 'bg-amber-500/20 text-amber-400'
    : 'bg-rose-500/20 text-rose-400';
  return <span className={cn('px-2 py-0.5 rounded text-xs font-medium', color)}>{value}{suffix}</span>;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function AdvancedAnalyticsPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  // Filter state
  const [gradeLevel, setGradeLevel] = React.useState('All Grades');
  const [subject, setSubject] = React.useState('All Subjects');
  const [timePeriod, setTimePeriod] = React.useState('Current Year');
  const [demographic, setDemographic] = React.useState('All Students');
  const [selectedCohorts, setSelectedCohorts] = React.useState<string[]>(['Class of 2025', 'Class of 2024']);

  function toggleCohort(label: string) {
    setSelectedCohorts((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  }

  const visibleCohorts = COHORT_DATA.filter((c) => selectedCohorts.includes(c.label));
  const maxProficiency = 100;

  return (
    <PageFeatureGate featureKey="advanced_analytics">
      <PageHeader
        title="Advanced Analytics"
        description="Cohort analysis, subgroup comparisons, and trend forecasting for data-driven decision making"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${school_slug}/dashboard` },
          { label: 'Analytics', href: `/${school_slug}/analytics/impact` },
          { label: 'Advanced' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-indigo-500/40 text-indigo-400">
              <Sparkles className="w-3 h-3" />
              Pro
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* ------- Custom Filters Bar ------- */}
      <div className="mb-8 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect label="Grade" options={GRADE_LEVELS} value={gradeLevel} onChange={setGradeLevel} />
          <FilterSelect label="Subject" options={SUBJECTS} value={subject} onChange={setSubject} />
          <FilterSelect label="Period" options={TIME_PERIODS} value={timePeriod} onChange={setTimePeriod} />
          <FilterSelect label="Group" options={DEMOGRAPHICS} value={demographic} onChange={setDemographic} />
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white ml-auto"
            onClick={() => {
              setGradeLevel('All Grades');
              setSubject('All Subjects');
              setTimePeriod('Current Year');
              setDemographic('All Students');
            }}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* ------- Cohort Analysis ------- */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Cohort Analysis</h2>
          <span className="text-xs text-slate-500 ml-2">Compare student cohorts across graduating classes</span>
        </div>

        {/* Cohort Toggle */}
        <div className="flex flex-wrap gap-2 mb-5">
          {COHORT_DATA.map((c) => (
            <Button
              key={c.label}
              size="sm"
              variant={selectedCohorts.includes(c.label) ? 'default' : 'outline'}
              onClick={() => toggleCohort(c.label)}
              className={cn(
                selectedCohorts.includes(c.label) && 'bg-indigo-600 hover:bg-indigo-700'
              )}
            >
              {c.label}
              <Badge variant="secondary" className="ml-2 text-[10px]">{c.studentCount}</Badge>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Math Proficiency Cohort Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Math Proficiency by Cohort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {visibleCohorts.map((c) => (
                  <CohortBar
                    key={c.label}
                    label={c.label.replace('Class of ', "'")}
                    value={c.mathProficiency}
                    maxValue={maxProficiency}
                    color="bg-gradient-to-r from-indigo-600 to-indigo-400"
                  />
                ))}
              </div>
              {visibleCohorts.length >= 2 && (
                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-400">
                    <strong className="text-indigo-400">Year-over-year: </strong>
                    Math proficiency rose{' '}
                    <strong className="text-white">
                      +{visibleCohorts[visibleCohorts.length - 1].mathProficiency - visibleCohorts[0].mathProficiency} pts
                    </strong>{' '}
                    from {visibleCohorts[0].label} to {visibleCohorts[visibleCohorts.length - 1].label}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reading Proficiency Cohort Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Reading Proficiency by Cohort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {visibleCohorts.map((c) => (
                  <CohortBar
                    key={c.label}
                    label={c.label.replace('Class of ', "'")}
                    value={c.readingProficiency}
                    maxValue={maxProficiency}
                    color="bg-gradient-to-r from-cyan-600 to-cyan-400"
                  />
                ))}
              </div>
              {visibleCohorts.length >= 2 && (
                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <p className="text-xs text-slate-400">
                    <strong className="text-cyan-400">Year-over-year: </strong>
                    Reading proficiency rose{' '}
                    <strong className="text-white">
                      +{visibleCohorts[visibleCohorts.length - 1].readingProficiency - visibleCohorts[0].readingProficiency} pts
                    </strong>{' '}
                    from {visibleCohorts[0].label} to {visibleCohorts[visibleCohorts.length - 1].label}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Growth Percentile & Attendance Cohort Cards */}
          {([
            { title: 'Growth Percentile by Cohort', icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, field: 'growthPercentile' as const, color: 'bg-gradient-to-r from-emerald-600 to-emerald-400' },
            { title: 'Attendance Rate by Cohort', icon: <Calendar className="w-4 h-4 text-amber-400" />, field: 'attendanceRate' as const, color: 'bg-gradient-to-r from-amber-600 to-amber-400' },
          ] as const).map((chart) => (
            <Card key={chart.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {chart.icon}
                  {chart.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {visibleCohorts.map((c) => (
                    <CohortBar
                      key={c.label}
                      label={c.label.replace('Class of ', "'")}
                      value={Number(c[chart.field].toFixed(1))}
                      maxValue={maxProficiency}
                      color={chart.color}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ------- Subgroup Comparisons ------- */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Subgroup Comparisons</h2>
          <span className="text-xs text-slate-500 ml-2">Disaggregated performance by demographic group</span>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="pb-3 font-medium text-slate-400">Subgroup</th>
                    <th className="pb-3 font-medium text-slate-400 text-center">N</th>
                    <th className="pb-3 font-medium text-slate-400 text-center">Math Prof.</th>
                    <th className="pb-3 font-medium text-slate-400 text-center">Reading Prof.</th>
                    <th className="pb-3 font-medium text-slate-400 text-center">Growth %ile</th>
                    <th className="pb-3 font-medium text-slate-400 text-center">Attendance</th>
                    <th className="pb-3 font-medium text-slate-400 text-center">Gap to Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {SUBGROUP_DATA.map((row) => {
                    const isAll = row.group === 'All Students';
                    return (
                      <tr
                        key={row.group}
                        className={cn(
                          'text-slate-300 transition-colors hover:bg-slate-800/40',
                          isAll && 'bg-slate-800/30 font-medium'
                        )}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            {isAll && <Layers className="w-3.5 h-3.5 text-indigo-400" />}
                            <span className={cn(isAll && 'text-white')}>{row.group}</span>
                          </div>
                        </td>
                        <td className="py-3 text-center text-slate-400">{row.enrollment}</td>
                        <td className="py-3 text-center">
                          <MetricBadge value={row.mathProficiency} thresholds={[70, 55]} />
                        </td>
                        <td className="py-3 text-center">
                          <MetricBadge value={row.readingProficiency} thresholds={[70, 55]} />
                        </td>
                        <td className="py-3 text-center">
                          <MetricBadge value={row.growthPercentile} thresholds={[60, 50]} suffix="th" />
                        </td>
                        <td className="py-3 text-center text-slate-300">{row.attendanceRate}%</td>
                        <td className="py-3 text-center">
                          {isAll ? (
                            <span className="text-slate-500">--</span>
                          ) : (
                            <span className={cn(
                              'text-xs font-bold',
                              row.gapToSchoolAvg > 0 ? 'text-emerald-400' :
                              row.gapToSchoolAvg >= -10 ? 'text-amber-400' :
                              'text-rose-400'
                            )}>
                              {row.gapToSchoolAvg > 0 ? '+' : ''}{row.gapToSchoolAvg} pts
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Equity Insight Banner */}
            <div className="mt-6 p-4 bg-indigo-900/20 border-l-4 border-indigo-500 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-300">
                    <strong className="text-indigo-400">Equity Insight: </strong>
                    The SPED subgroup shows the largest gap at{' '}
                    <strong className="text-white">-25 pts</strong> below the school average in combined proficiency.
                    However, their growth percentile of 51st suggests slow but positive progress. Recommend
                    reviewing IEP goal alignment and increasing Tier 2 dosage by 15 minutes weekly.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ------- Trend Forecasting ------- */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Trend Forecasting</h2>
          <span className="text-xs text-slate-500 ml-2">Projected metrics for next quarter based on current trajectory</span>
        </div>

        <DashboardGrid className="mb-6">
          {FORECAST_DATA.map((f) => (
            <GridItem key={f.metric} span={4}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{f.metric}</span>
                    <TrendArrow direction={f.trend} />
                  </div>

                  {/* Current vs Projected */}
                  <div className="flex items-end gap-4 mb-4">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Current</div>
                      <div className="text-2xl font-bold text-slate-200">
                        {f.current}{f.unit === 'pts' ? '' : f.unit === 'th %ile' ? '' : ''}<span className="text-sm text-slate-400">{f.unit}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 mb-2" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Projected</div>
                      <div className={cn(
                        'text-2xl font-bold',
                        f.trend === 'up' ? 'text-emerald-400' :
                        f.trend === 'down' && f.metric === 'Chronic Absence' ? 'text-emerald-400' :
                        f.trend === 'down' ? 'text-rose-400' : 'text-slate-300'
                      )}>
                        {f.projected}<span className="text-sm opacity-70">{f.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-500">Confidence</span>
                      <span className={cn(
                        'font-bold',
                        f.confidence >= 80 ? 'text-emerald-400' :
                        f.confidence >= 65 ? 'text-amber-400' :
                        'text-rose-400'
                      )}>{f.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          f.confidence >= 80 ? 'bg-emerald-500' :
                          f.confidence >= 65 ? 'bg-amber-500' :
                          'bg-rose-500'
                        )}
                        style={{ width: `${f.confidence}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </GridItem>
          ))}
        </DashboardGrid>

        {/* Forecast Methodology Note */}
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Forecast Methodology</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Projections use a weighted linear regression model applied to the last 3 assessment cycles,
                  adjusted for seasonal attendance patterns and historical subgroup trajectory curves.
                  Confidence intervals reflect data sufficiency (n-count) and variance stability.
                  Forecasts with confidence below 65% should be treated as directional indicators only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ------- Summary Stats Footer ------- */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/30">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-black text-indigo-400">{COHORT_DATA.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Cohorts Tracked</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-black text-cyan-400">{SUBGROUP_DATA.length - 1}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Subgroups Analyzed</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-black text-emerald-400">{FORECAST_DATA.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Metrics Forecasted</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-black text-amber-400">
                {COHORT_DATA.reduce((sum, c) => sum + c.studentCount, 0)}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Students Across Cohorts</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PageFeatureGate>
  );
}
