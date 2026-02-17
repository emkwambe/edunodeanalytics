'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSchoolSeed, type StudentSeedData } from '@/lib/data/seed-data';
import { PageFeatureGate } from '@/components/features/page-feature-gate';
import { cn } from '@/lib/utils';
import { generateFlightPlan, type InterventionFlightPlan } from '@/lib/ai/edunode-advisor';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  Activity,
  Plus,
  ChevronRight,
  BrainCircuit,
  Zap,
  RotateCcw,
} from 'lucide-react';

/**
 * MTSS Intervention Hub
 *
 * Purpose-Driven Logic for Tier 2 and Tier 3 intervention tracking.
 * Implements the "3-Week Rule" - diagnostic expiry logic that flags
 * interventions without recent data as "Stale/Invalid."
 *
 * NEW: AI-Generated Intervention "Flight Plans"
 * When a diagnostic expires or student plateaus, the AI drafts
 * a 3-week targeted intervention plan based on mastery gaps.
 */

const DIAGNOSTIC_WINDOW_DAYS = 21;

interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  grade: number;
  tier: 1 | 2 | 3;
  type: string;
  startDate: Date;
  lastDataEntry: Date;
  targetGoal: string;
  currentProgress: number;
  status: 'active' | 'completed' | 'stale' | 'paused';
}

function daysSinceDate(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getInterventionStatus(lastDataEntry: Date): 'fresh' | 'warning' | 'stale' {
  const daysSince = daysSinceDate(lastDataEntry);
  if (daysSince <= 7) return 'fresh';
  if (daysSince <= DIAGNOSTIC_WINDOW_DAYS) return 'warning';
  return 'stale';
}

function generateMockInterventions(students: StudentSeedData[]): Intervention[] {
  const interventionTypes = [
    'Small Group Reading',
    'Math Tutoring',
    'Phonics Intervention',
    'Writing Workshop',
    'Number Sense',
    'Comprehension Strategies',
  ];

  const atRiskStudents = students.filter((s) => s.riskLevel !== 'on_track').slice(0, 8);

  return atRiskStudents.map((student, idx) => {
    const daysAgo = Math.floor(Math.random() * 30);
    // Ensure some are stale (>21 days)
    const lastDataDaysAgo = idx < 2 ? Math.floor(Math.random() * 7) + 1 : // Fresh
                            idx < 5 ? Math.floor(Math.random() * 10) + 8 : // Warning
                            Math.floor(Math.random() * 5) + 22; // Stale

    return {
      id: `int-${idx}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      grade: student.gradeLevel,
      tier: student.riskLevel === 'critical' ? 3 : 2,
      type: interventionTypes[idx % interventionTypes.length],
      startDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      lastDataEntry: new Date(Date.now() - lastDataDaysAgo * 24 * 60 * 60 * 1000),
      targetGoal: 'Achieve 80% mastery on targeted skills',
      currentProgress: Math.floor(Math.random() * 50) + 20,
      status: lastDataDaysAgo > DIAGNOSTIC_WINDOW_DAYS ? 'stale' : 'active',
    };
  });
}

export default function InterventionsPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  const [filterTier, setFilterTier] = React.useState<'all' | 2 | 3>('all');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'stale'>('all');
  const [loadingFlightPlan, setLoadingFlightPlan] = React.useState<string | null>(null);
  const [flightPlans, setFlightPlans] = React.useState<Record<string, InterventionFlightPlan>>({});

  // Get student data and generate interventions
  const schoolSeed = getSchoolSeed(school_slug);
  const students = schoolSeed?.students ?? [];
  const interventions = React.useMemo(
    () => generateMockInterventions(students),
    [students]
  );

  // Filter interventions
  const filteredInterventions = interventions.filter((int) => {
    if (filterTier !== 'all' && int.tier !== filterTier) return false;
    if (filterStatus === 'active' && int.status === 'stale') return false;
    if (filterStatus === 'stale' && int.status !== 'stale') return false;
    return true;
  });

  // Stats
  const stats = {
    total: interventions.length,
    tier2: interventions.filter((i) => i.tier === 2).length,
    tier3: interventions.filter((i) => i.tier === 3).length,
    stale: interventions.filter((i) => getInterventionStatus(i.lastDataEntry) === 'stale').length,
  };

  // Generate AI Flight Plan
  const handleGenerateFlightPlan = async (intervention: Intervention) => {
    setLoadingFlightPlan(intervention.id);

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const plan = generateFlightPlan(
      intervention.studentId,
      intervention.studentName,
      intervention.type,
      intervention.currentProgress,
      ['Multi-digit division', 'Place value understanding', 'Word problem interpretation']
    );

    setFlightPlans((prev) => ({ ...prev, [intervention.id]: plan }));
    setLoadingFlightPlan(null);
  };

  return (
    <PageFeatureGate featureKey="intervention_hub">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">MTSS Intervention Hub</h1>
          <p className="text-slate-400 mt-1">Tier 2 and Tier 3 intervention tracking with diagnostic validity monitoring.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Intervention
        </Button>
      </div>

      {/* 3-Week Rule Banner */}
      <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-white">The 3-Week Rule</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed italic">
          &quot;Data loses 50% of its predictive power every 14 days it sits un-analyzed.&quot;{' '}
          EduNode requires a minimum of one formative data point every 21 days. Interventions without
          fresh data are flagged as <span className="text-rose-400 font-bold">Stale/Invalid</span>.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-white">{stats.total}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Active Interventions</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-amber-400">{stats.tier2}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Tier 2</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-rose-400">{stats.tier3}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Tier 3</div>
          </CardContent>
        </Card>
        <Card className="bg-rose-900/20 border-rose-500/30">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-rose-400">{stats.stale}</div>
            <div className="text-[10px] text-rose-400 uppercase tracking-widest mt-1">Stale/Invalid</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex bg-slate-800 rounded-xl p-1">
          <Button
            size="sm"
            variant={filterTier === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilterTier('all')}
          >
            All Tiers
          </Button>
          <Button
            size="sm"
            variant={filterTier === 2 ? 'default' : 'ghost'}
            onClick={() => setFilterTier(2)}
            className={filterTier === 2 ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            Tier 2
          </Button>
          <Button
            size="sm"
            variant={filterTier === 3 ? 'default' : 'ghost'}
            onClick={() => setFilterTier(3)}
            className={filterTier === 3 ? 'bg-rose-600 hover:bg-rose-700' : ''}
          >
            Tier 3
          </Button>
        </div>

        <div className="flex bg-slate-800 rounded-xl p-1">
          <Button
            size="sm"
            variant={filterStatus === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilterStatus('all')}
          >
            All Status
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'active' ? 'default' : 'ghost'}
            onClick={() => setFilterStatus('active')}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Valid
          </Button>
          <Button
            size="sm"
            variant={filterStatus === 'stale' ? 'default' : 'ghost'}
            onClick={() => setFilterStatus('stale')}
            className={filterStatus === 'stale' ? 'bg-rose-600 hover:bg-rose-700' : ''}
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Stale
          </Button>
        </div>
      </div>

      {/* Intervention List */}
      <div className="space-y-3">
        {filteredInterventions.map((intervention) => {
          const dataStatus = getInterventionStatus(intervention.lastDataEntry);
          const daysSinceData = daysSinceDate(intervention.lastDataEntry);
          const isStale = dataStatus === 'stale';
          const flightPlan = flightPlans[intervention.id];
          const isLoading = loadingFlightPlan === intervention.id;

          return (
            <Card
              key={intervention.id}
              className={cn(
                'transition-all',
                isStale && 'border-rose-500/30 bg-rose-900/5'
              )}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div
                    className={cn(
                      'p-3 rounded-xl',
                      dataStatus === 'fresh' && 'bg-emerald-500/10 text-emerald-400',
                      dataStatus === 'warning' && 'bg-amber-500/10 text-amber-400',
                      dataStatus === 'stale' && 'bg-rose-500/10 text-rose-400'
                    )}
                  >
                    <Target className="w-5 h-5" />
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link
                        href={`/${school_slug}/student-360/${intervention.studentId}`}
                        className="font-bold text-white hover:text-indigo-400 transition"
                      >
                        {intervention.studentName}
                      </Link>
                      <Badge
                        className={cn(
                          'text-[10px]',
                          intervention.tier === 3
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        )}
                      >
                        Tier {intervention.tier}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-400">{intervention.type} | Grade {intervention.grade}</div>
                  </div>

                  {/* Data Freshness */}
                  <div className="text-right">
                    <div
                      className={cn(
                        'text-sm font-bold',
                        dataStatus === 'fresh' && 'text-emerald-400',
                        dataStatus === 'warning' && 'text-amber-400',
                        dataStatus === 'stale' && 'text-rose-400'
                      )}
                    >
                      {daysSinceData} days ago
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">Last Data Entry</div>
                  </div>

                  {/* Progress */}
                  <div className="w-24 hidden md:block">
                    <div className="flex items-center justify-between text-[10px] mb-1 uppercase">
                      <span className="text-slate-500">Progress</span>
                      <span className={cn('font-bold', isStale ? 'text-rose-400' : 'text-white')}>
                        {intervention.currentProgress}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          isStale ? 'bg-rose-500' : 'bg-cyan-500'
                        )}
                        style={{ width: `${intervention.currentProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Flight Plan Button */}
                  <Button
                    variant={isStale ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleGenerateFlightPlan(intervention)}
                    disabled={isLoading}
                    className={cn(
                      'text-xs',
                      isStale && 'bg-rose-600 hover:bg-rose-700'
                    )}
                  >
                    <BrainCircuit className={cn('w-4 h-4 mr-1', isLoading && 'animate-pulse')} />
                    {isLoading ? 'Drafting...' : 'AI Flight Plan'}
                  </Button>
                </div>

                {/* Stale Warning */}
                {isStale && !flightPlan && (
                  <div className="mt-4 p-3 border-t border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Diagnostic Expired: No formative data in {daysSinceData} days. Validity Compromised.</span>
                  </div>
                )}

                {/* AI Flight Plan Output */}
                {flightPlan && (
                  <div className="mt-4 p-5 bg-slate-900/80 rounded-xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-tight">AI Flight Plan Drafted</span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                        {flightPlan.similarStudentOutcomes.successRate}% Success Rate
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                      &quot;Based on analysis of <strong className="text-white">{flightPlan.similarStudentOutcomes.count}</strong> similar
                      student profiles, we recommend a <strong className="text-cyan-400">{flightPlan.duration}</strong> reset focusing on{' '}
                      <strong className="text-white">{flightPlan.strategy}</strong>.{' '}
                      Evidence suggests {intervention.studentName.split(' ')[0]} is hitting a plateau; the concrete-to-abstract
                      progression in this plan addresses the identified gap.&quot;
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {flightPlan.materials.map((material, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px]">
                          {material}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Accept & Launch
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-slate-400"
                        onClick={() => handleGenerateFlightPlan(intervention)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredInterventions.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400 mb-2">No Interventions Found</h3>
            <p className="text-sm text-slate-500">
              No interventions match your current filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </PageFeatureGate>
  );
}
