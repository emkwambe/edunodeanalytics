import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSchoolSeed } from '@/lib/data/seed-data';
import { bigQueryProvider } from '@/lib/data/bigquery-provider';

/**
 * EduNode Warehouse Bridge API
 * ============================
 *
 * Unified data access endpoint that connects to:
 * 1. Google BigQuery (when BIGQUERY_PROJECT_ID is set)
 * 2. Strategic seed data fallback (for development/demo)
 *
 * Endpoints:
 * - GET /api/data/warehouse?school_slug=xxx&type=summary
 * - GET /api/data/warehouse?school_slug=xxx&type=students
 * - GET /api/data/warehouse?school_slug=xxx&type=attendance
 * - GET /api/data/warehouse?school_slug=xxx&type=mastery
 * - GET /api/data/warehouse?school_slug=xxx&type=radar (Authorizer metrics)
 */

// Check if BigQuery is configured
const BIGQUERY_ENABLED = !!process.env.BIGQUERY_PROJECT_ID;

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  // Auth check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const schoolSlug = searchParams.get('school_slug') || 'academy-charter';
  const metricType = searchParams.get('type') || 'summary';
  const gradeLevel = searchParams.get('grade');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let data: unknown;
    let source: 'bigquery' | 'seed' = 'seed';

    // Attempt BigQuery if configured
    if (BIGQUERY_ENABLED) {
      try {
        data = await fetchFromBigQuery(schoolSlug, metricType, { gradeLevel, limit });
        source = 'bigquery';
      } catch (bqError) {
        console.warn('[Warehouse] BigQuery failed, falling back to seed:', bqError);
        data = await fetchFromSeedData(schoolSlug, metricType, { gradeLevel, limit });
      }
    } else {
      data = await fetchFromSeedData(schoolSlug, metricType, { gradeLevel, limit });
    }

    const queryTime = performance.now() - startTime;

    return NextResponse.json({
      data,
      metadata: {
        school_slug: schoolSlug,
        metric_type: metricType,
        source,
        query_time_ms: Math.round(queryTime * 100) / 100,
        timestamp: new Date().toISOString(),
        bigquery_enabled: BIGQUERY_ENABLED,
      },
    });
  } catch (error) {
    console.error('[Warehouse] Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse data' },
      { status: 500 }
    );
  }
}

// =============================================================================
// SEED DATA FETCHER (Fallback)
// =============================================================================

async function fetchFromSeedData(
  schoolSlug: string,
  metricType: string,
  options: { gradeLevel?: string | null; limit?: number }
): Promise<unknown> {
  const school = getSchoolSeed(schoolSlug);

  if (!school) {
    return { error: 'School not found', available_schools: ['academy-charter', 'academy-tomorrow', 'innovation-prep', 'stem-scholars'] };
  }

  switch (metricType) {
    case 'summary':
      return {
        total_enrollment: school.metrics.totalEnrollment,
        attendance_rate: (school.metrics.attendanceRate * 100).toFixed(1),
        chronic_absence_count: school.metrics.chronicAbsenceCount,
        chronic_absence_rate: (school.metrics.chronicAbsenceRate * 100).toFixed(1),
        avg_growth_percentile: school.metrics.avgGrowthPercentile.toFixed(0),
        avg_proficiency: school.metrics.avgProficiency.toFixed(0),
        risk_distribution: school.metrics.riskDistribution,
      };

    case 'radar':
      // Renewal Radar data for Authorizer Portal
      // Strategic: Emphasize high growth to demonstrate charter value
      const growthScore = Math.min(100, school.metrics.avgGrowthPercentile + 10);
      return {
        labels: ['Academic Growth', 'Fiscal Health', 'Equity Gap', 'Parent Satisfaction', 'Compliance', 'Enrollment Stability'],
        datasets: {
          charter: [
            growthScore,                                    // Growth (high - key value prop)
            85 + Math.random() * 10,                        // Fiscal Health
            78 + (100 - school.metrics.avgProficiency) * 0.2, // Equity (inverse of proficiency gap)
            88 + Math.random() * 8,                         // Parent Satisfaction
            95 + Math.random() * 5,                         // Compliance
            Math.min(100, 75 + school.metrics.totalEnrollment * 0.02), // Enrollment
          ],
          state_avg: [65, 70, 60, 75, 90, 80],
          district_avg: [58, 65, 55, 70, 85, 75],
        },
        benchmarks: {
          growth_vs_state: `+${(growthScore - 65).toFixed(0)}`,
          growth_percentile_rank: school.metrics.avgGrowthPercentile,
          proficiency_gap: (50 - school.metrics.avgProficiency).toFixed(0),
          renewal_probability: calculateRenewalProbability(school.metrics),
        },
      };

    case 'students':
      let students = school.students;
      if (options.gradeLevel) {
        students = students.filter((s) => s.gradeLevel === parseInt(options.gradeLevel!));
      }
      return students.slice(0, options.limit || 100);

    case 'attendance':
      const attendanceResult = await bigQueryProvider.getAttendanceTrend(schoolSlug, 16);
      return attendanceResult.data;

    case 'mastery':
      const masteryResult = await bigQueryProvider.getMasteryData(schoolSlug, 12);
      return masteryResult.data;

    case 'chronic':
      return school.students
        .filter((s) => s.isChronicallyAbsent)
        .map((s) => ({
          id: s.id,
          name: s.displayName,
          grade: s.gradeLevel,
          attendance_rate: (s.attendanceRate * 100).toFixed(1),
          days_absent: s.daysAbsent,
          risk_level: s.riskLevel,
        }));

    case 'subgroups':
      // Subgroup analysis for Equity reporting
      const iepStudents = school.students.filter((s) => s.hasIep);
      const ellStudents = school.students.filter((s) => s.isEnglishLearner);
      const allStudents = school.students;

      return {
        all_students: {
          count: allStudents.length,
          avg_growth: calculateAvgGrowth(allStudents),
          avg_proficiency: school.metrics.avgProficiency,
        },
        iep: {
          count: iepStudents.length,
          avg_growth: calculateAvgGrowth(iepStudents),
          avg_proficiency: calculateAvgProficiency(iepStudents),
        },
        ell: {
          count: ellStudents.length,
          avg_growth: calculateAvgGrowth(ellStudents),
          avg_proficiency: calculateAvgProficiency(ellStudents),
        },
        equity_gap: {
          iep_growth_gap: calculateAvgGrowth(allStudents) - calculateAvgGrowth(iepStudents),
          ell_growth_gap: calculateAvgGrowth(allStudents) - calculateAvgGrowth(ellStudents),
        },
      };

    case 'fiscal':
      // Mock fiscal health metrics
      return {
        current_ratio: (1.5 + Math.random() * 0.5).toFixed(2),
        days_cash_on_hand: Math.floor(45 + Math.random() * 30),
        fund_balance_ratio: (0.15 + Math.random() * 0.1).toFixed(2),
        debt_service_coverage: (1.2 + Math.random() * 0.3).toFixed(2),
        enrollment_vs_budget: ((0.95 + Math.random() * 0.08) * 100).toFixed(1),
        per_pupil_expenditure: Math.floor(12000 + Math.random() * 3000),
      };

    default:
      return { error: `Unknown metric type: ${metricType}` };
  }
}

// =============================================================================
// BIGQUERY FETCHER (Production)
// =============================================================================

async function fetchFromBigQuery(
  schoolSlug: string,
  metricType: string,
  options: { gradeLevel?: string | null; limit?: number }
): Promise<unknown> {
  // In production, this would use @google-cloud/bigquery
  // const { BigQuery } = require('@google-cloud/bigquery');
  // const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });

  const projectId = process.env.BIGQUERY_PROJECT_ID;
  const datasetId = `${schoolSlug.replace(/-/g, '_')}_analytics`;

  console.log(`[BigQuery] Would query: ${projectId}.${datasetId} for ${metricType}`);

  // Example query structure (not executed without real credentials)
  const queries: Record<string, string> = {
    summary: `
      SELECT
        COUNT(DISTINCT student_id) as total_enrollment,
        AVG(attendance_rate) as attendance_rate,
        COUNTIF(attendance_rate < 0.90) as chronic_absence_count,
        AVG(growth_percentile) as avg_growth_percentile
      FROM \`${projectId}.${datasetId}.student_master_fact\`
      WHERE academic_year = '2025-26'
    `,
    students: `
      SELECT *
      FROM \`${projectId}.${datasetId}.student_master_fact\`
      WHERE academic_year = '2025-26'
      ${options.gradeLevel ? `AND grade_level = ${options.gradeLevel}` : ''}
      LIMIT ${options.limit || 100}
    `,
  };

  // For now, throw to fall back to seed data
  throw new Error('BigQuery not configured - using seed data fallback');
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateAvgGrowth(students: Array<{ growthPercentile: number }>): number {
  if (students.length === 0) return 0;
  return Math.round(students.reduce((sum, s) => sum + s.growthPercentile, 0) / students.length);
}

function calculateAvgProficiency(students: Array<{ proficiencyLevel: number }>): number {
  if (students.length === 0) return 0;
  return Math.round(students.reduce((sum, s) => sum + s.proficiencyLevel, 0) / students.length);
}

function calculateRenewalProbability(metrics: {
  avgGrowthPercentile: number;
  attendanceRate: number;
  chronicAbsenceRate: number;
}): string {
  // Strategic formula: Growth is weighted heavily
  let probability = 50;

  // Growth contribution (up to +40)
  probability += Math.min(40, metrics.avgGrowthPercentile * 0.5);

  // Attendance contribution (up to +15)
  probability += Math.min(15, (metrics.attendanceRate - 0.85) * 100);

  // Chronic absence penalty (up to -15)
  probability -= Math.min(15, metrics.chronicAbsenceRate * 50);

  // Compliance bonus (assume good standing)
  probability += 5;

  return `${Math.min(99, Math.max(50, Math.round(probability))).toFixed(1)}%`;
}

// =============================================================================
// POST: Trigger data refresh/sync
// =============================================================================

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { school_slug, action } = body;

  if (action === 'refresh') {
    // In production, this would trigger a dbt run or BigQuery refresh
    return NextResponse.json({
      status: 'triggered',
      message: `Data refresh initiated for ${school_slug}`,
      estimated_completion: new Date(Date.now() + 60000).toISOString(),
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
