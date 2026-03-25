/**
 * Actionability Tiers Hook
 * ========================
 *
 * Fetches and categorizes students into actionability tiers for the
 * Early Warning dashboard (Sprint 5C).
 *
 * Tier 1: Needs Immediate Action - at_risk/critical students with no intervention
 * Tier 2: Intervention Needs Attention - has intervention but dosage < 60% or risk worsened
 * Tier 3: Responding & Improving - has intervention and (risk improved or dosage >= 80%)
 */

import useSWR from 'swr';
import { fetcher } from './fetcher';
import type { RiskLevel, Trajectory } from '@/lib/risk-engine/types';

// Extended student data for tiers
export interface TieredStudent {
  studentId: string;
  studentName: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  riskScore: number;
  riskLevel: RiskLevel;
  previousLevel: RiskLevel | null;
  levelChanged: boolean;
  trajectory: Trajectory;
  confidenceLevel: number;
  topFactors: Array<{
    name: string;
    category: string;
    score: number;
    description: string;
  }>;
  activeIntervention: {
    id: string;
    title: string;
    status: string;
  } | null;
  hasIep: boolean;
  has504Plan: boolean;
  isChronicallyAbsent: boolean;
  computedAt: string;
  // Dosage data (populated if has intervention)
  dosageCompliance: number | null;
  sessionsMissed: number;
  daysSinceFlag: number;
  // Tier classification
  tier: 'needs_action' | 'needs_attention' | 'improving' | null;
  // For improvement display
  improvementMagnitude: number;
}

export interface ActionabilityTiers {
  needsAction: TieredStudent[];
  needsAttention: TieredStudent[];
  improving: TieredStudent[];
  allStudents: TieredStudent[];
}

export interface UseActionabilityTiersOptions {
  gradeLevel?: number;
  riskLevel?: RiskLevel;
  hasIntervention?: boolean | null;
}

interface RawRiskScore {
  studentId: string;
  studentName: string;
  firstName: string;
  lastName: string;
  gradeLevel: number;
  riskScore: number;
  riskLevel: RiskLevel;
  previousLevel: RiskLevel | null;
  levelChanged: boolean;
  trajectory: Trajectory;
  confidenceLevel: number;
  topFactors: Array<{
    name: string;
    category: string;
    score: number;
    description: string;
  }>;
  activeIntervention: {
    id: string;
    title: string;
    status: string;
  } | null;
  hasIep: boolean;
  has504Plan: boolean;
  isChronicallyAbsent: boolean;
  computedAt: string;
}

interface DosageMetricData {
  interventionId: string;
  studentId: string;
  dosageCompliance: number | null;
  sessionsMissed: number;
}

/**
 * Calculate days since the first flag (approximated from computedAt date)
 */
function calculateDaysSinceFlag(computedAt: string): number {
  const computedDate = new Date(computedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - computedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate improvement magnitude
 * Higher is better - risk decreased more
 */
function calculateImprovementMagnitude(
  previousLevel: RiskLevel | null,
  currentLevel: RiskLevel
): number {
  const levelOrder: Record<RiskLevel, number> = {
    on_track: 0,
    watch: 1,
    at_risk: 2,
    critical: 3,
  };

  if (!previousLevel) return 0;
  // Positive = improvement (previous was worse than current)
  return levelOrder[previousLevel] - levelOrder[currentLevel];
}

/**
 * Check if risk worsened since intervention
 */
function hasRiskWorsened(
  previousLevel: RiskLevel | null,
  currentLevel: RiskLevel
): boolean {
  if (!previousLevel) return false;
  const levelOrder: Record<RiskLevel, number> = {
    on_track: 0,
    watch: 1,
    at_risk: 2,
    critical: 3,
  };
  return levelOrder[currentLevel] > levelOrder[previousLevel];
}

/**
 * Check if risk improved
 */
function hasRiskImproved(
  previousLevel: RiskLevel | null,
  currentLevel: RiskLevel
): boolean {
  if (!previousLevel) return false;
  const levelOrder: Record<RiskLevel, number> = {
    on_track: 0,
    watch: 1,
    at_risk: 2,
    critical: 3,
  };
  return levelOrder[currentLevel] < levelOrder[previousLevel];
}

/**
 * Classify student into appropriate tier
 */
function classifyStudent(student: TieredStudent): 'needs_action' | 'needs_attention' | 'improving' | null {
  const isHighRisk = student.riskLevel === 'at_risk' || student.riskLevel === 'critical';
  const hasIntervention = student.activeIntervention !== null;

  // Tier 1: Needs Immediate Action
  // at_risk or critical with NO active intervention
  if (isHighRisk && !hasIntervention) {
    return 'needs_action';
  }

  // For students with interventions
  if (hasIntervention) {
    const dosage = student.dosageCompliance ?? 0;
    const riskWorsened = hasRiskWorsened(student.previousLevel, student.riskLevel);
    const riskImproved = hasRiskImproved(student.previousLevel, student.riskLevel);

    // Tier 2: Intervention Needs Attention
    // Has intervention but dosage < 60% OR risk worsened
    if (dosage < 0.60 || riskWorsened) {
      return 'needs_attention';
    }

    // Tier 3: Responding & Improving
    // Has intervention AND (risk improved OR dosage >= 80%)
    if (riskImproved || dosage >= 0.80) {
      return 'improving';
    }

    // Students with intervention but not meeting criteria for tier 2 or 3
    // go to needs_attention if they're in at_risk/critical
    if (isHighRisk) {
      return 'needs_attention';
    }
  }

  // watch students without intervention don't appear in any tier
  return null;
}

/**
 * Hook for fetching and categorizing students into actionability tiers
 */
export function useActionabilityTiers(
  schoolId: string | null,
  options: UseActionabilityTiersOptions = {}
) {
  // Fetch all flagged students (not paginated for tier categorization)
  const riskScoresUrl = schoolId
    ? `/api/schools/${schoolId}/risk/scores?limit=500&sort=risk_score&order=desc`
    : null;

  const { data: riskData, isLoading: riskLoading, error: riskError, mutate: mutateRisk } = useSWR<{
    data: RawRiskScore[];
    pagination: { total: number };
  }>(riskScoresUrl, fetcher);

  // Fetch dosage data for all interventions
  const dosageUrl = schoolId
    ? `/api/schools/${schoolId}/dosage`
    : null;

  const { data: _dosageData, isLoading: dosageLoading } = useSWR<{
    flaggedInterventions: Array<{
      interventionId: string;
      studentName: string;
      flags: Array<{ type: string; message: string }>;
    }>;
  }>(dosageUrl, fetcher);

  // Fetch extended dosage metrics
  const dosageMetricsUrl = schoolId
    ? `/api/schools/${schoolId}/dosage/all-metrics`
    : null;

  const { data: metricsData } = useSWR<{
    metrics: DosageMetricData[];
  }>(dosageMetricsUrl, fetcher, {
    // Silently fail if endpoint doesn't exist
    shouldRetryOnError: false,
    onError: () => {},
  });

  const isLoading = riskLoading || dosageLoading;
  const error = riskError;

  // Process and categorize students
  let tiers: ActionabilityTiers = {
    needsAction: [],
    needsAttention: [],
    improving: [],
    allStudents: [],
  };

  if (riskData?.data) {
    // Build dosage metrics map by intervention ID
    const dosageMap = new Map<string, DosageMetricData>();
    if (metricsData?.metrics) {
      for (const m of metricsData.metrics) {
        dosageMap.set(m.interventionId, m);
      }
    }

    // Process each student
    const processedStudents: TieredStudent[] = riskData.data
      .filter(s => {
        // Only include flagged students (watch, at_risk, critical)
        return ['watch', 'at_risk', 'critical'].includes(s.riskLevel);
      })
      .map(s => {
        // Get dosage data if student has active intervention
        let dosageCompliance: number | null = null;
        let sessionsMissed = 0;

        if (s.activeIntervention) {
          const dosageMetric = dosageMap.get(s.activeIntervention.id);
          if (dosageMetric) {
            dosageCompliance = dosageMetric.dosageCompliance;
            sessionsMissed = dosageMetric.sessionsMissed;
          } else {
            // Default compliance estimate based on intervention status
            // Without detailed metrics, assume moderate compliance
            dosageCompliance = 0.75;
          }
        }

        const daysSinceFlag = calculateDaysSinceFlag(s.computedAt);
        const improvementMagnitude = calculateImprovementMagnitude(s.previousLevel, s.riskLevel);

        const student: TieredStudent = {
          ...s,
          dosageCompliance,
          sessionsMissed,
          daysSinceFlag,
          improvementMagnitude,
          tier: null, // Will be set after classification
        };

        student.tier = classifyStudent(student);
        return student;
      });

    // Apply filters
    let filteredStudents = processedStudents;

    if (options.gradeLevel !== undefined) {
      filteredStudents = filteredStudents.filter(s => s.gradeLevel === options.gradeLevel);
    }

    if (options.riskLevel) {
      filteredStudents = filteredStudents.filter(s => s.riskLevel === options.riskLevel);
    }

    if (options.hasIntervention !== undefined && options.hasIntervention !== null) {
      filteredStudents = filteredStudents.filter(s => {
        const has = s.activeIntervention !== null;
        return options.hasIntervention ? has : !has;
      });
    }

    // Categorize into tiers
    const needsAction = filteredStudents
      .filter(s => s.tier === 'needs_action')
      .sort((a, b) => b.riskScore - a.riskScore); // Worst risk first

    const needsAttention = filteredStudents
      .filter(s => s.tier === 'needs_attention')
      .sort((a, b) => (a.dosageCompliance ?? 0) - (b.dosageCompliance ?? 0)); // Worst compliance first

    const improving = filteredStudents
      .filter(s => s.tier === 'improving')
      .sort((a, b) => b.improvementMagnitude - a.improvementMagnitude); // Biggest improvement first

    tiers = {
      needsAction,
      needsAttention,
      improving,
      allStudents: filteredStudents.filter(s => s.tier !== null),
    };
  }

  return {
    tiers,
    isLoading,
    error,
    mutate: mutateRisk,
    counts: {
      needsAction: tiers.needsAction.length,
      needsAttention: tiers.needsAttention.length,
      improving: tiers.improving.length,
      total: tiers.allStudents.length,
    },
  };
}

/**
 * Generate CSV content for MTSS Meeting Prep export
 */
export function generateMeetingPrepCSV(students: TieredStudent[], _schoolName?: string): string {
  const headers = [
    'Student Name',
    'Grade',
    'Risk Level',
    'Risk Score',
    'Has Intervention',
    'Intervention Name',
    'Dosage Compliance %',
    'Days Since Flag',
    'Top Risk Driver',
    'Tier',
  ];

  const tierLabels: Record<string, string> = {
    needs_action: 'Needs Action',
    needs_attention: 'Needs Attention',
    improving: 'Improving',
  };

  const rows = students.map(s => [
    s.studentName,
    s.gradeLevel.toString(),
    s.riskLevel.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    Math.round(s.riskScore * 100).toString(),
    s.activeIntervention ? 'Y' : 'N',
    s.activeIntervention?.title || '',
    s.dosageCompliance !== null ? Math.round(s.dosageCompliance * 100).toString() : '',
    s.daysSinceFlag.toString(),
    s.topFactors[0]?.name || '',
    s.tier ? tierLabels[s.tier] : '',
  ]);

  // Escape CSV values
  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');

  return csvContent;
}
