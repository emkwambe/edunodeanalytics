'use client';

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
  StudentRiskTable,
  StudentRiskTableSkeleton,
  AlertFeed,
  AlertFeedSkeleton,
  RiskDriverBreakdown,
  RiskDriverBreakdownSkeleton,
} from '@/components/risk';
import {
  DosageSummary,
  DosageSummarySkeleton,
} from '@/components/dashboard/dosage-summary';
import {
  DosageAlerts,
  DosageAlertsSkeleton,
} from '@/components/dashboard/dosage-alerts';
import { Button } from '@/components/ui/button';
import { useRiskScores } from '@/lib/hooks/use-risk-scores';
import { useRiskDistribution } from '@/lib/hooks/use-risk-distribution';
import { useRiskAlerts, useAcknowledgeAlert, useResolveAlert } from '@/lib/hooks/use-risk-alerts';
import { useRiskDrivers } from '@/lib/hooks/use-risk-drivers';
import { useSchoolBySlug } from '@/lib/hooks/use-school-context';
import { AlertTriangle, Users, TrendingDown, Eye, RefreshCw } from 'lucide-react';
import type { RiskLevel } from '@/lib/risk-engine/types';

/**
 * Early Warning Dashboard
 *
 * MTSS coordinator dashboard for monitoring student risk levels,
 * viewing alerts, and tracking intervention needs.
 */

type SortOrder = 'asc' | 'desc';
type SortColumn = 'risk_score' | 'student_name' | 'grade_level' | 'computed_at';

export default function EarlyWarningDashboardPage() {
  const params = useParams();
  const schoolSlug = params.school_slug as string;

  // Filter state
  const [selectedLevel, setSelectedLevel] = React.useState<RiskLevel | null>(null);
  const [sortBy, setSortBy] = React.useState<SortColumn>('risk_score');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);

  // Get school ID from slug
  const { school, isLoading: schoolLoading } = useSchoolBySlug(schoolSlug);
  const schoolId = school?.id ?? null;

  // Fetch risk data
  const {
    scores,
    pagination,
    isLoading: scoresLoading,
    mutate: mutateScores,
  } = useRiskScores(schoolId, {
    page: currentPage,
    limit: 25,
    level: selectedLevel ?? undefined,
    sort: sortBy,
    order: sortOrder,
    search: searchQuery || undefined,
  });

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

  // Alert actions - we'll track which alert is being acted on
  const [activeAlertId, setActiveAlertId] = React.useState<string | null>(null);

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

  // Sort handler
  const handleSort = (column: string) => {
    if (column === sortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column as SortColumn);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Refresh all data
  const handleRefresh = () => {
    mutateScores();
    mutateDistribution();
    mutateAlerts();
  };

  // Calculate metrics
  const atRiskCount = distribution.at_risk + distribution.critical;
  const watchCount = distribution.watch;
  const needsAttention = atRiskCount + watchCount;
  const newAlertCount = alerts.filter((a) => a.status === 'new').length;

  const isLoading = schoolLoading || scoresLoading || distributionLoading;

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
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

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
          <span className="text-sm text-slate-400">Filter by level:</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setSelectedLevel(null);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedLevel === null
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {(['critical', 'at_risk', 'watch', 'on_track'] as RiskLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => {
                  setSelectedLevel(level);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedLevel === level
                    ? level === 'critical'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : level === 'at_risk'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : level === 'watch'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
                }`}
              >
                {level === 'on_track' ? 'On Track' : level === 'at_risk' ? 'At Risk' : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        <div className="relative">
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-64 px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Student Risk Table */}
      <DashboardGrid>
        <GridItem span={12}>
          {scoresLoading ? (
            <StudentRiskTableSkeleton />
          ) : (
            <StudentRiskTable
              scores={scores}
              schoolSlug={schoolSlug}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          )}
        </GridItem>
      </DashboardGrid>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} students
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-400">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
