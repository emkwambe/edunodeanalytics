'use client';

/**
 * Early Warning Dashboard
 * =======================
 *
 * Sprint 5C: Restructured into actionability tiers for MTSS coordinators.
 *
 * Features:
 * - MTSS Evidence Metrics (compact) at top
 * - Export MTSS Meeting Prep button
 * - Three collapsible sections: Needs Action, Needs Attention, Improving
 * - Has Intervention filter
 * - Existing filters (risk level, search) preserved
 */

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  PageHeader,
  DashboardGrid,
  GridItem,
} from '@/components/layout/dashboard-shell';
import { MetricCard, MetricCardSkeleton } from '@/components/dashboard/metric-card';
import {
  RiskDistributionChart,
  RiskDistributionChartSkeleton,
} from '@/components/charts/risk-distribution-chart';
import {
  AlertFeed,
  AlertFeedSkeleton,
  RiskDriverBreakdown,
  RiskDriverBreakdownSkeleton,
  ActionabilityTierSection,
} from '@/components/risk';
import {
  DosageSummary,
} from '@/components/dashboard/dosage-summary';
import {
  DosageAlerts,
} from '@/components/dashboard/dosage-alerts';
import { MTSSEvidenceMetrics } from '@/components/dashboard/mtss-evidence-metrics';
import { Button } from '@/components/ui/button';
import { useRiskDistribution } from '@/lib/hooks/use-risk-distribution';
import { useRiskAlerts } from '@/lib/hooks/use-risk-alerts';
import { useRiskDrivers } from '@/lib/hooks/use-risk-drivers';
import { useSchoolBySlug } from '@/lib/hooks/use-school-context';
import {
  useActionabilityTiers,
  generateMeetingPrepCSV,
} from '@/lib/hooks/use-actionability-tiers';
import { AlertTriangle, Users, TrendingDown, Eye, RefreshCw, Download } from 'lucide-react';
import type { RiskLevel } from '@/lib/risk-engine/types';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

type HasInterventionFilter = 'all' | 'yes' | 'no';

export default function EarlyWarningDashboardPage() {
  const params = useParams();
  const schoolSlug = params.school_slug as string;

  // Filter state
  const [selectedLevel, setSelectedLevel] = React.useState<RiskLevel | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [hasInterventionFilter, setHasInterventionFilter] = React.useState<HasInterventionFilter>('all');

  // Get school ID from slug
  const { school, isLoading: schoolLoading } = useSchoolBySlug(schoolSlug);
  const schoolId = school?.id ?? null;

  // Fetch risk distribution
  const {
    distribution,
    isLoading: distributionLoading,
    mutate: mutateDistribution,
  } = useRiskDistribution(schoolId);

  const {
    alerts,
    isLoading: alertsLoading,
    mutate: mutateAlerts,
  } = useRiskAlerts(schoolId, { status: 'new', limit: 10 });

  const {
    drivers,
    totalStudents,
    isLoading: driversLoading,
  } = useRiskDrivers(schoolId);

  // Fetch actionability tiers
  const hasInterventionOption = hasInterventionFilter === 'all'
    ? null
    : hasInterventionFilter === 'yes';

  const {
    tiers,
    counts,
    isLoading: tiersLoading,
    mutate: mutateTiers,
  } = useActionabilityTiers(schoolId, {
    riskLevel: selectedLevel ?? undefined,
    hasIntervention: hasInterventionOption,
  });

  // Alert actions
  const [, setActiveAlertId] = React.useState<string | null>(null);

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!schoolId) return;
    setActiveAlertId(alertId);
    try {
      const response = await fetch(`/api/schools/${schoolId}/risk/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' }),
      });
      if (response.ok) {
        mutateAlerts();
      }
    } finally {
      setActiveAlertId(null);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!schoolId) return;
    setActiveAlertId(alertId);
    try {
      const response = await fetch(`/api/schools/${schoolId}/risk/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      if (response.ok) {
        mutateAlerts();
      }
    } finally {
      setActiveAlertId(null);
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    mutateDistribution();
    mutateAlerts();
    mutateTiers();
  };

  // Export MTSS Meeting Prep CSV
  const handleExportMeetingPrep = () => {
    const csv = generateMeetingPrepCSV(tiers.allStudents, school?.name);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mtss-meeting-prep-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter students by search query
  const filterBySearch = React.useCallback((students: typeof tiers.needsAction) => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(s =>
      s.studentName.toLowerCase().includes(query) ||
      s.firstName.toLowerCase().includes(query) ||
      s.lastName.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filtered tiers
  const filteredTiers = React.useMemo(() => ({
    needsAction: filterBySearch(tiers.needsAction),
    needsAttention: filterBySearch(tiers.needsAttention),
    improving: filterBySearch(tiers.improving),
  }), [tiers, filterBySearch]);

  // Calculate metrics
  const atRiskCount = distribution.at_risk + distribution.critical;
  const watchCount = distribution.watch;
  const needsAttention = atRiskCount + watchCount;
  const newAlertCount = alerts.filter((a) => a.status === 'new').length;

  const isLoading = schoolLoading || distributionLoading;
  const hasNoStudents = !isLoading && distribution.total === 0;

  // Show empty state if no students imported
  if (hasNoStudents) {
    return (
      <>
        <PageHeader
          title="Early Warning Dashboard"
          description="Monitor student risk levels and coordinate MTSS interventions"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${schoolSlug}/dashboard` },
            { label: 'Early Warning' },
          ]}
        />
        <Card className="border-slate-700 bg-slate-800/30">
          <CardContent>
            <EmptyState
              icon={AlertTriangle}
              title="No Students Imported Yet"
              description="Import your student roster to start tracking risk levels and coordinating MTSS interventions. The early warning system will automatically evaluate students for risk indicators."
              action={{
                label: 'Import Student Roster',
                href: `/${schoolSlug}/settings/import`,
              }}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Early Warning Dashboard"
        description="Monitor student risk levels and coordinate MTSS interventions"
        breadcrumbs={[
          { label: 'Dashboard', href: `/${schoolSlug}/dashboard` },
          { label: 'Early Warning' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMeetingPrep}
              disabled={tiers.allStudents.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export MTSS Meeting Prep
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* MTSS Evidence Metrics - Compact variant at top */}
      {schoolId && (
        <div className="mb-6">
          <Card className="border-slate-700 bg-slate-800/30 p-4">
            <MTSSEvidenceMetrics
              schoolId={schoolId}
              variant="compact"
            />
          </Card>
        </div>
      )}

      {/* Summary Metrics */}
      <DashboardGrid className="mb-6">
        <GridItem span={3}>
          {isLoading ? (
            <MetricCardSkeleton />
          ) : (
            <MetricCard
              title="Total Students"
              value={distribution.total}
              format="number"
              subtitle="In risk evaluation"
              icon={<Users className="w-5 h-5" />}
              variant="default"
            />
          )}
        </GridItem>

        <GridItem span={3}>
          {isLoading ? (
            <MetricCardSkeleton />
          ) : (
            <MetricCard
              title="Needs Attention"
              value={needsAttention}
              format="number"
              subtitle={`${atRiskCount} at-risk, ${watchCount} watch`}
              icon={<Eye className="w-5 h-5" />}
              variant={needsAttention > 0 ? 'warning' : 'default'}
            />
          )}
        </GridItem>

        <GridItem span={3}>
          {isLoading ? (
            <MetricCardSkeleton />
          ) : (
            <MetricCard
              title="Critical"
              value={distribution.critical}
              format="number"
              subtitle="Immediate attention needed"
              icon={<AlertTriangle className="w-5 h-5" />}
              variant={distribution.critical > 0 ? 'danger' : 'default'}
            />
          )}
        </GridItem>

        <GridItem span={3}>
          {alertsLoading ? (
            <MetricCardSkeleton />
          ) : (
            <MetricCard
              title="New Alerts"
              value={newAlertCount}
              format="number"
              subtitle="Unacknowledged"
              icon={<TrendingDown className="w-5 h-5" />}
              variant={newAlertCount > 0 ? 'warning' : 'default'}
            />
          )}
        </GridItem>
      </DashboardGrid>

      {/* Charts Row */}
      <DashboardGrid className="mb-6">
        <GridItem span={4}>
          {distributionLoading ? (
            <RiskDistributionChartSkeleton />
          ) : (
            <RiskDistributionChart
              data={{
                onTrack: distribution.on_track,
                watch: distribution.watch,
                atRisk: distribution.at_risk,
                critical: distribution.critical,
              }}
              title="Risk Distribution"
              subtitle="Current student risk levels"
            />
          )}
        </GridItem>

        <GridItem span={4}>
          {driversLoading ? (
            <RiskDriverBreakdownSkeleton />
          ) : (
            <RiskDriverBreakdown
              drivers={drivers}
              totalStudents={totalStudents}
              maxItems={5}
            />
          )}
        </GridItem>

        <GridItem span={4}>
          {alertsLoading ? (
            <AlertFeedSkeleton />
          ) : (
            <AlertFeed
              alerts={alerts}
              schoolSlug={schoolSlug}
              onAcknowledge={handleAcknowledgeAlert}
              onResolve={handleResolveAlert}
              maxItems={5}
            />
          )}
        </GridItem>
      </DashboardGrid>

      {/* Dosage Section */}
      <DashboardGrid className="mb-6">
        <GridItem span={6}>
          <DosageSummary
            schoolId={schoolId}
            schoolSlug={schoolSlug}
            maxIssues={5}
          />
        </GridItem>
        <GridItem span={6}>
          <DosageAlerts
            schoolId={schoolId}
            schoolSlug={schoolSlug}
            maxItems={5}
          />
        </GridItem>
      </DashboardGrid>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Risk level:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedLevel(null)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedLevel === null
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {(['critical', 'at_risk', 'watch'] as RiskLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedLevel === level
                    ? level === 'critical'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : level === 'at_risk'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
                }`}
              >
                {level === 'at_risk' ? 'At Risk' : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Has Intervention Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Has Intervention:</span>
          <select
            value={hasInterventionFilter}
            onChange={(e) => setHasInterventionFilter(e.target.value as HasInterventionFilter)}
            className="px-3 py-1 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div className="flex-1" />

        <div className="relative">
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Actionability Tier Sections */}
      <div className="space-y-4">
        {/* Tier 1: Needs Immediate Action (expanded by default) */}
        <ActionabilityTierSection
          tier="needs_action"
          students={filteredTiers.needsAction}
          schoolSlug={schoolSlug}
          isLoading={tiersLoading}
          defaultExpanded={true}
        />

        {/* Tier 2: Intervention Needs Attention (expanded by default) */}
        <ActionabilityTierSection
          tier="needs_attention"
          students={filteredTiers.needsAttention}
          schoolSlug={schoolSlug}
          isLoading={tiersLoading}
          defaultExpanded={true}
        />

        {/* Tier 3: Responding & Improving (collapsed by default) */}
        <ActionabilityTierSection
          tier="improving"
          students={filteredTiers.improving}
          schoolSlug={schoolSlug}
          isLoading={tiersLoading}
          defaultExpanded={false}
        />
      </div>

      {/* Summary footer */}
      {!tiersLoading && counts.total > 0 && (
        <div className="mt-6 text-center text-sm text-slate-500">
          Showing {counts.total} flagged student{counts.total !== 1 ? 's' : ''} across all tiers
          {selectedLevel && ` (filtered by ${selectedLevel === 'at_risk' ? 'At Risk' : selectedLevel})`}
          {hasInterventionFilter !== 'all' && ` (${hasInterventionFilter === 'yes' ? 'with' : 'without'} intervention)`}
        </div>
      )}
    </>
  );
}
