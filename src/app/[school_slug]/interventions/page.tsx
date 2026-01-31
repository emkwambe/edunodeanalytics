'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Target,
  Activity,
  TrendingUp,
  Calendar,
  Plus,
  Filter,
  Search,
  ChevronRight,
  RefreshCw,
  BrainCircuit,
} from 'lucide-react';

/**
 * MTSS Intervention Hub
 *
 * Purpose-Driven Logic for Tier 2 and Tier 3 intervention tracking.
 * Implements the "3-Week Rule" - diagnostic expiry logic that flags
 * interventions without recent data as "Stale/Invalid."
 *
 * Key Features:
 * - Tier classification (1, 2, 3)
 * - Diagnostic freshness tracking
 * - 21-day data validity window
 * - Intervention effectiveness monitoring
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

  const atRiskStudents = students.filter((s) => s.riskLevel !== 'on_track').slice(0, 15);

  return atRiskStudents.map((student, idx) => {
    const daysAgo = Math.floor(Math.random() * 30);
    const lastDataDaysAgo = Math.floor(Math.random() * 28);

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
      currentProgress: Math.floor(Math.random() * 60) + 20,
      status: lastDataDaysAgo > DIAGNOSTIC_WINDOW_DAYS ? 'stale' : 'active',
    };
  });
}

export default function InterventionsPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  const [filterTier, setFilterTier] = React.useState<'all' | 2 | 3>('all');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'stale'>('all');

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
    warning: interventions.filter((i) => getInterventionStatus(i.lastDataEntry) === 'warning').length,
  };

  return (
    <>
      <PageHeader
        title="MTSS Intervention Hub"
        description="Tier 2 and Tier 3 intervention tracking with diagnostic validity monitoring"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Data
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Intervention
            </Button>
          </div>
        }
      />

      {/* 3-Week Rule Banner */}
      <div className="mb-6 bg-indigo-900/20 border-l-4 border-indigo-500 p-5 rounded-r-2xl">
        <div className="flex items-center gap-3 mb-2">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-white">The 3-Week Rule</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          &quot;Data loses 50% of its predictive power every 14 days it sits un-analyzed.&quot;
          <span className="block mt-1 text-slate-400">
            EduNode requires a minimum of one formative data point every 21 days. Interventions without
            fresh data are flagged as <strong className="text-amber-400">Stale/Invalid</strong>.
          </span>
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-slate-800/30">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-white">{stats.total}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">Active Interventions</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/30">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-amber-400">{stats.tier2}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">Tier 2</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/30">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-rose-400">{stats.tier3}</div>
            <div className="text-xs text-slate-500 uppercase mt-1">Tier 3</div>
          </CardContent>
        </Card>
        <Card className="bg-rose-900/20 border-rose-500/30">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-rose-400">{stats.stale}</div>
            <div className="text-xs text-rose-400 uppercase mt-1">Stale/Invalid</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/20 border-amber-500/30">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-black text-amber-400">{stats.warning}</div>
            <div className="text-xs text-amber-400 uppercase mt-1">Needs Update</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
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

          return (
            <Card
              key={intervention.id}
              className={cn(
                'transition-all hover:border-slate-600',
                dataStatus === 'stale' && 'border-rose-500/30 bg-rose-900/5',
                dataStatus === 'warning' && 'border-amber-500/30 bg-amber-900/5'
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
                    {dataStatus === 'fresh' && <CheckCircle2 className="w-5 h-5" />}
                    {dataStatus === 'warning' && <Clock className="w-5 h-5" />}
                    {dataStatus === 'stale' && <AlertTriangle className="w-5 h-5" />}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/${school_slug}/student-360/${intervention.studentId}`}
                        className="font-bold text-white hover:text-indigo-400 transition"
                      >
                        {intervention.studentName}
                      </Link>
                      <Badge variant="outline" className="text-[10px]">
                        Grade {intervention.grade}
                      </Badge>
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
                    <div className="text-sm text-slate-400">{intervention.type}</div>
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
                      {daysSinceData === 0 ? 'Today' : `${daysSinceData} days ago`}
                    </div>
                    <div className="text-xs text-slate-500">Last data entry</div>
                  </div>

                  {/* Progress */}
                  <div className="w-32">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-bold text-white">{intervention.currentProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          intervention.currentProgress >= 80 && 'bg-emerald-500',
                          intervention.currentProgress >= 50 &&
                            intervention.currentProgress < 80 &&
                            'bg-cyan-500',
                          intervention.currentProgress < 50 && 'bg-amber-500'
                        )}
                        style={{ width: `${intervention.currentProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <Button variant="ghost" size="sm">
                    <Activity className="w-4 h-4 mr-1" />
                    Log Data
                  </Button>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>

                {/* Stale Warning */}
                {dataStatus === 'stale' && (
                  <div className="mt-4 p-3 bg-rose-900/20 border border-rose-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1">
                      <XCircle className="w-4 h-4" />
                      DIAGNOSTIC EXPIRED
                    </div>
                    <p className="text-xs text-slate-400">
                      No formative data in {daysSinceData} days. This intervention&apos;s effectiveness
                      cannot be measured. Enter new data to restore validity.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredInterventions.length === 0 && (
        <Card className="bg-slate-800/30">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400 mb-2">No Interventions Found</h3>
            <p className="text-sm text-slate-500">
              No interventions match your current filters.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
