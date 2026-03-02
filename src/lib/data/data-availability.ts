/**
 * Data Availability System
 * ========================
 *
 * Tracks which data sources are connected for a school and provides
 * adaptive insight generation based on available data.
 *
 * Design Philosophy:
 * - Always produce actionable insights from whatever data is available
 * - Clear indication of data completeness
 * - Graceful degradation when sources are missing
 * - Minimum viable insights from attendance alone
 */

import type { Student360Data } from '@/components/dashboard/student-360-card';
import type { StatusLevel } from '@/components/dashboard/status-indicator';

// =============================================================================
// DATA SOURCE AVAILABILITY
// =============================================================================

export type DataSourceType =
  | 'sis'           // Student Information System (Clever, ClassLink, PowerSchool)
  | 'lms'           // Learning Management System (Canvas, Google Classroom)
  | 'assessment'    // Assessment providers (NWEA MAP, iReady, Renaissance)
  | 'behavior'      // Behavior tracking (PBIS, behavior logs)
  | 'sel';          // Social-Emotional Learning surveys

export interface DataSourceStatus {
  type: DataSourceType;
  name: string;
  connected: boolean;
  lastSyncAt?: Date;
  recordCount?: number;
}

export interface SchoolDataAvailability {
  schoolId: string;
  sources: DataSourceStatus[];
  completenessScore: number; // 0-100
  tier: 'minimal' | 'basic' | 'standard' | 'comprehensive';
}

/**
 * Determine data availability tier based on connected sources
 */
export function calculateDataTier(sources: DataSourceStatus[]): SchoolDataAvailability['tier'] {
  const connected = sources.filter(s => s.connected);
  const hasSis = connected.some(s => s.type === 'sis');
  const hasLms = connected.some(s => s.type === 'lms');
  const hasAssessment = connected.some(s => s.type === 'assessment');

  if (!hasSis) return 'minimal'; // Only manual data entry
  if (hasSis && !hasLms && !hasAssessment) return 'basic';
  if (hasSis && (hasLms || hasAssessment)) return 'standard';
  if (hasSis && hasLms && hasAssessment) return 'comprehensive';

  return 'basic';
}

/**
 * Calculate completeness score (0-100)
 */
export function calculateCompletenessScore(sources: DataSourceStatus[]): number {
  const weights: Record<DataSourceType, number> = {
    sis: 30,        // Essential - attendance, enrollment
    assessment: 25, // Important - academic performance
    lms: 25,        // Important - engagement
    behavior: 10,   // Nice to have
    sel: 10,        // Nice to have
  };

  let score = 0;
  for (const source of sources) {
    if (source.connected) {
      score += weights[source.type] || 0;
    }
  }
  return Math.min(100, score);
}

// =============================================================================
// ADAPTIVE INSIGHT GENERATION
// =============================================================================

export interface StudentInsight {
  category: 'attendance' | 'academic' | 'engagement' | 'overall';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  dataSource: DataSourceType;
}

/**
 * Generate insights based on available data
 * Always produces at least one actionable insight
 */
export function generateStudentInsights(
  student: Student360Data,
  availability: SchoolDataAvailability
): StudentInsight[] {
  const insights: StudentInsight[] = [];
  const connectedTypes = new Set(
    availability.sources.filter(s => s.connected).map(s => s.type)
  );

  // TIER 1: Attendance insights (always available from SIS)
  if (connectedTypes.has('sis') || student.attendanceRate !== undefined) {
    if (student.isChronicallyAbsent) {
      insights.push({
        category: 'attendance',
        priority: 'high',
        title: 'Chronic Absence Alert',
        description: `${student.daysAbsent} days absent (${formatPercent(1 - student.attendanceRate)} absence rate). Immediate intervention recommended.`,
        actionable: true,
        dataSource: 'sis',
      });
    } else if (student.attendanceRate < 0.93) {
      insights.push({
        category: 'attendance',
        priority: 'medium',
        title: 'Attendance Concern',
        description: `Attendance at ${formatPercent(student.attendanceRate)} - approaching chronic absence threshold.`,
        actionable: true,
        dataSource: 'sis',
      });
    } else {
      insights.push({
        category: 'attendance',
        priority: 'low',
        title: 'Good Attendance',
        description: `Maintaining ${formatPercent(student.attendanceRate)} attendance rate.`,
        actionable: false,
        dataSource: 'sis',
      });
    }
  }

  // TIER 2: Assessment insights (if connected)
  if (connectedTypes.has('assessment') || student.readingPercentile !== undefined) {
    const hasReading = student.readingPercentile !== undefined;
    const hasMath = student.mathPercentile !== undefined;
    const hasGrowth = student.readingGrowthPercentile !== undefined || student.mathGrowthPercentile !== undefined;

    if (hasReading || hasMath) {
      const avgPercentile = calculateAverage([student.readingPercentile, student.mathPercentile]);

      if (avgPercentile !== null && avgPercentile < 25) {
        insights.push({
          category: 'academic',
          priority: 'high',
          title: 'Below Grade Level',
          description: `Performance at ${Math.round(avgPercentile)}th percentile. Targeted intervention needed.`,
          actionable: true,
          dataSource: 'assessment',
        });
      } else if (hasGrowth) {
        const avgGrowth = calculateAverage([student.readingGrowthPercentile, student.mathGrowthPercentile]);
        if (avgGrowth !== null && avgGrowth >= 60) {
          insights.push({
            category: 'academic',
            priority: 'low',
            title: 'Strong Growth',
            description: `Growth at ${Math.round(avgGrowth)}th percentile - above typical progress.`,
            actionable: false,
            dataSource: 'assessment',
          });
        }
      }
    }
  }

  // TIER 3: LMS engagement insights (if connected)
  if (connectedTypes.has('lms') || student.assignmentCompletionRate !== undefined) {
    if (student.missingAssignments !== undefined && student.missingAssignments >= 5) {
      insights.push({
        category: 'engagement',
        priority: 'high',
        title: 'Multiple Missing Assignments',
        description: `${student.missingAssignments} assignments missing. Check in with student about workload.`,
        actionable: true,
        dataSource: 'lms',
      });
    } else if (student.assignmentCompletionRate !== undefined && student.assignmentCompletionRate < 0.7) {
      insights.push({
        category: 'engagement',
        priority: 'medium',
        title: 'Low Assignment Completion',
        description: `Only ${formatPercent(student.assignmentCompletionRate)} of assignments completed.`,
        actionable: true,
        dataSource: 'lms',
      });
    } else if (student.courseGPA !== undefined && student.courseGPA < 2.0) {
      insights.push({
        category: 'engagement',
        priority: 'medium',
        title: 'GPA Below 2.0',
        description: `Current GPA is ${student.courseGPA.toFixed(2)}. Academic support recommended.`,
        actionable: true,
        dataSource: 'lms',
      });
    }
  }

  // FALLBACK: If no specific insights, provide overall status
  if (insights.length === 0) {
    insights.push({
      category: 'overall',
      priority: 'low',
      title: 'On Track',
      description: 'No immediate concerns based on available data.',
      actionable: false,
      dataSource: 'sis',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
}

// =============================================================================
// COMPUTED METRICS (adapt to available data)
// =============================================================================

export interface ComputedStudentMetrics {
  // Primary metric that's always computable
  primaryMetric: {
    label: string;
    value: string | number;
    tier: StatusLevel;
    source: DataSourceType;
  };
  // Secondary metrics based on what's available
  secondaryMetrics: Array<{
    label: string;
    value: string | number;
    tier?: StatusLevel;
    source: DataSourceType;
  }>;
  // Overall risk computation
  computedRiskScore: number;
  riskFactors: string[];
  dataConfidence: 'high' | 'medium' | 'low';
}

/**
 * Compute adaptive metrics based on available data
 */
export function computeStudentMetrics(
  student: Student360Data,
  availability: SchoolDataAvailability
): ComputedStudentMetrics {
  const riskFactors: string[] = [];
  let riskScore = 0;
  const secondaryMetrics: ComputedStudentMetrics['secondaryMetrics'] = [];

  // Always use attendance as primary if available
  const primaryMetric: ComputedStudentMetrics['primaryMetric'] = {
    label: 'Attendance',
    value: formatPercent(student.attendanceRate),
    tier: student.attendanceTier,
    source: 'sis',
  };

  // Calculate risk from attendance
  if (student.isChronicallyAbsent) {
    riskScore += 35;
    riskFactors.push('Chronic absence');
  } else if (student.attendanceRate < 0.93) {
    riskScore += 20;
    riskFactors.push('Attendance concern');
  }

  // Add assessment metrics if available
  const hasAssessment = student.readingPercentile !== undefined || student.mathPercentile !== undefined;
  if (hasAssessment) {
    if (student.readingPercentile !== undefined) {
      secondaryMetrics.push({
        label: 'Reading',
        value: `${student.readingPercentile}%ile`,
        tier: student.readingPercentile >= 50 ? 'on_track' : student.readingPercentile >= 25 ? 'at_risk' : 'critical',
        source: 'assessment',
      });
      if (student.readingPercentile < 25) {
        riskScore += 20;
        riskFactors.push('Reading below 25th percentile');
      }
    }
    if (student.mathPercentile !== undefined) {
      secondaryMetrics.push({
        label: 'Math',
        value: `${student.mathPercentile}%ile`,
        tier: student.mathPercentile >= 50 ? 'on_track' : student.mathPercentile >= 25 ? 'at_risk' : 'critical',
        source: 'assessment',
      });
      if (student.mathPercentile < 25) {
        riskScore += 20;
        riskFactors.push('Math below 25th percentile');
      }
    }
    // Growth is protective
    const avgGrowth = calculateAverage([student.readingGrowthPercentile, student.mathGrowthPercentile]);
    if (avgGrowth !== null) {
      secondaryMetrics.push({
        label: 'Growth',
        value: `${Math.round(avgGrowth)}%ile`,
        tier: avgGrowth >= 60 ? 'on_track' : avgGrowth >= 40 ? 'at_risk' : 'critical',
        source: 'assessment',
      });
      if (avgGrowth >= 60) {
        riskScore -= 15; // High growth reduces risk
      }
    }
  }

  // Add LMS metrics if available
  const hasLms = student.assignmentCompletionRate !== undefined || student.courseGPA !== undefined;
  if (hasLms) {
    if (student.courseGPA !== undefined) {
      secondaryMetrics.push({
        label: 'GPA',
        value: student.courseGPA.toFixed(2),
        tier: student.courseGPA >= 3.0 ? 'on_track' : student.courseGPA >= 2.0 ? 'at_risk' : 'critical',
        source: 'lms',
      });
      if (student.courseGPA < 2.0) {
        riskScore += 15;
        riskFactors.push('GPA below 2.0');
      }
    }
    if (student.missingAssignments !== undefined && student.missingAssignments > 0) {
      secondaryMetrics.push({
        label: 'Missing Work',
        value: student.missingAssignments,
        tier: student.missingAssignments <= 2 ? 'on_track' : student.missingAssignments <= 5 ? 'at_risk' : 'critical',
        source: 'lms',
      });
      if (student.missingAssignments >= 5) {
        riskScore += 15;
        riskFactors.push('Multiple missing assignments');
      }
    }
  }

  // Determine data confidence
  const connectedCount = availability.sources.filter(s => s.connected).length;
  const dataConfidence: ComputedStudentMetrics['dataConfidence'] =
    connectedCount >= 3 ? 'high' : connectedCount >= 2 ? 'medium' : 'low';

  return {
    primaryMetric,
    secondaryMetrics,
    computedRiskScore: Math.max(0, Math.min(100, riskScore)),
    riskFactors,
    dataConfidence,
  };
}

// =============================================================================
// MINIMUM VIABLE DATA
// =============================================================================

/**
 * Check if minimum data requirements are met for Student 360
 */
export function hasMinimumViableData(student: Student360Data): boolean {
  // At minimum, need attendance data
  return student.attendanceRate !== undefined && student.daysPresent !== undefined;
}

/**
 * Get list of missing data sources for a student
 */
export function getMissingDataSources(student: Student360Data): DataSourceType[] {
  const missing: DataSourceType[] = [];

  // Check SIS data
  if (student.attendanceRate === undefined) {
    missing.push('sis');
  }

  // Check assessment data
  if (student.readingPercentile === undefined && student.mathPercentile === undefined) {
    missing.push('assessment');
  }

  // Check LMS data
  if (student.assignmentCompletionRate === undefined && student.courseGPA === undefined) {
    missing.push('lms');
  }

  return missing;
}

/**
 * Generate recommendation for missing data
 */
export function getDataRecommendation(missing: DataSourceType[]): string | null {
  if (missing.length === 0) return null;

  const recommendations: Record<DataSourceType, string> = {
    sis: 'Connect your SIS (Clever, ClassLink) to enable attendance tracking.',
    assessment: 'Connect NWEA MAP or iReady to see academic performance data.',
    lms: 'Connect Canvas or Google Classroom to track assignment completion.',
    behavior: 'Connect your PBIS system for behavior insights.',
    sel: 'Add SEL surveys for social-emotional tracking.',
  };

  const priority: DataSourceType[] = ['sis', 'assessment', 'lms', 'behavior', 'sel'];
  const highest = priority.find(p => missing.includes(p));

  return highest ? recommendations[highest] : null;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function calculateAverage(values: (number | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// =============================================================================
// MOCK DATA AVAILABILITY (for seed data)
// =============================================================================

/**
 * Create mock data availability for a school
 */
export function createMockDataAvailability(
  schoolId: string,
  config: {
    hasSis?: boolean;
    hasLms?: boolean;
    hasAssessment?: boolean;
    hasBehavior?: boolean;
    hasSel?: boolean;
  } = {}
): SchoolDataAvailability {
  const {
    hasSis = true,
    hasLms = true,
    hasAssessment = true,
    hasBehavior = false,
    hasSel = false,
  } = config;

  const sources: DataSourceStatus[] = [
    {
      type: 'sis',
      name: 'Clever',
      connected: hasSis,
      lastSyncAt: hasSis ? new Date(Date.now() - 4 * 60 * 60 * 1000) : undefined,
      recordCount: hasSis ? 487 : undefined,
    },
    {
      type: 'lms',
      name: 'Canvas LMS',
      connected: hasLms,
      lastSyncAt: hasLms ? new Date(Date.now() - 6 * 60 * 60 * 1000) : undefined,
      recordCount: hasLms ? 1948 : undefined,
    },
    {
      type: 'assessment',
      name: 'NWEA MAP',
      connected: hasAssessment,
      lastSyncAt: hasAssessment ? new Date(Date.now() - 24 * 60 * 60 * 1000) : undefined,
      recordCount: hasAssessment ? 974 : undefined,
    },
    {
      type: 'behavior',
      name: 'PBIS Rewards',
      connected: hasBehavior,
    },
    {
      type: 'sel',
      name: 'Panorama',
      connected: hasSel,
    },
  ];

  return {
    schoolId,
    sources,
    completenessScore: calculateCompletenessScore(sources),
    tier: calculateDataTier(sources),
  };
}
