// src/app/api/schools/[schoolId]/export/risk-evaluations/route.ts
/**
 * Risk Evaluations Audit Export Endpoint
 *
 * Exports risk evaluation data for compliance/audit purposes.
 * Returns CSV with student risk scores, levels, factors, and historical data.
 * Supports date range filtering and anonymization options.
 *
 * FERPA Compliance: Requires school membership + rate limited.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, type RiskRouteParams } from '../../risk/_shared/auth';
import { generateCSV, type CSVColumn } from '@/lib/export/csv';
import { checkApiRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit';
import type { RiskLevel, Trajectory } from '@/lib/risk-engine/types';

interface RiskEvaluationRow {
  evaluationId: string;
  studentId: string;
  studentName: string;
  firstName: string | null;
  lastName: string | null;
  gradeLevel: number | null;
  riskScore: number;
  riskLevel: RiskLevel;
  previousLevel: RiskLevel | null;
  levelChanged: boolean;
  trajectory: Trajectory;
  confidenceLevel: number;
  factorsJson: string;
  hasIep: boolean;
  has504Plan: boolean;
  isChronicallyAbsent: boolean;
  computedAt: string;
}

// CSV columns for full audit export (includes PII)
const riskEvaluationColumns: CSVColumn<RiskEvaluationRow>[] = [
  { header: 'Evaluation ID', accessor: 'evaluationId' },
  { header: 'Student ID', accessor: 'studentId', isPII: true },
  { header: 'First Name', accessor: 'firstName', isPII: true },
  { header: 'Last Name', accessor: 'lastName', isPII: true },
  { header: 'Display Name', accessor: 'studentName', isPII: true },
  { header: 'Grade Level', accessor: 'gradeLevel' },
  { header: 'Risk Score', accessor: (r) => (r.riskScore * 100).toFixed(1) },
  { header: 'Risk Level', accessor: 'riskLevel' },
  { header: 'Previous Level', accessor: (r) => r.previousLevel || 'N/A' },
  { header: 'Level Changed', accessor: (r) => r.levelChanged ? 'Yes' : 'No' },
  { header: 'Trajectory', accessor: 'trajectory' },
  { header: 'Confidence', accessor: (r) => (r.confidenceLevel * 100).toFixed(0) + '%' },
  { header: 'Has IEP', accessor: (r) => r.hasIep ? 'Yes' : 'No' },
  { header: 'Has 504 Plan', accessor: (r) => r.has504Plan ? 'Yes' : 'No' },
  { header: 'Chronically Absent', accessor: (r) => r.isChronicallyAbsent ? 'Yes' : 'No' },
  { header: 'Risk Factors (JSON)', accessor: 'factorsJson' },
  { header: 'Computed At', accessor: 'computedAt' },
];

// Anonymized columns (no PII - for external auditors)
const anonymizedColumns: CSVColumn<RiskEvaluationRow>[] = [
  { header: 'Anonymous ID', accessor: (r) => hashId(r.studentId) },
  { header: 'Grade Level', accessor: 'gradeLevel' },
  { header: 'Risk Score', accessor: (r) => (r.riskScore * 100).toFixed(1) },
  { header: 'Risk Level', accessor: 'riskLevel' },
  { header: 'Previous Level', accessor: (r) => r.previousLevel || 'N/A' },
  { header: 'Level Changed', accessor: (r) => r.levelChanged ? 'Yes' : 'No' },
  { header: 'Trajectory', accessor: 'trajectory' },
  { header: 'Confidence', accessor: (r) => (r.confidenceLevel * 100).toFixed(0) + '%' },
  { header: 'Has IEP', accessor: (r) => r.hasIep ? 'Yes' : 'No' },
  { header: 'Has 504 Plan', accessor: (r) => r.has504Plan ? 'Yes' : 'No' },
  { header: 'Chronically Absent', accessor: (r) => r.isChronicallyAbsent ? 'Yes' : 'No' },
  { header: 'Risk Factors (JSON)', accessor: 'factorsJson' },
  { header: 'Computed At', accessor: 'computedAt' },
];

// Simple hash for anonymization (deterministic but not reversible)
function hashId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `ANON-${Math.abs(hash).toString(36).toUpperCase().padStart(8, '0')}`;
}

export async function GET(request: NextRequest, { params }: RiskRouteParams) {
  // Rate limiting for export endpoints
  const rateLimitResult = await checkApiRateLimit(request, RATE_LIMITS.export);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  const { schoolId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { adminSupabase } = authResult;
  const searchParams = request.nextUrl.searchParams;

  // Parse query params
  const level = searchParams.get('level') as RiskLevel | null;
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const anonymize = searchParams.get('anonymize') === 'true';
  const format = searchParams.get('format') || 'csv';

  try {
    // Build query - columns match the current_risk_scores view
    let query = adminSupabase
      .from('current_risk_scores')
      .select(`
        evaluation_id,
        student_id,
        student_name,
        first_name,
        last_name,
        grade_level,
        risk_score,
        risk_level,
        previous_level,
        level_changed,
        trajectory,
        confidence_level,
        risk_factors,
        has_iep,
        has_504_plan,
        is_chronically_absent,
        computed_at
      `)
      .eq('school_id', schoolId)
      .order('risk_score', { ascending: false });

    // Apply filters
    if (level) {
      query = query.eq('risk_level', level);
    }
    if (fromDate) {
      query = query.gte('computed_at', fromDate);
    }
    if (toDate) {
      query = query.lte('computed_at', toDate);
    }

    const { data: scores, error } = await query;

    if (error) {
      console.error('[Risk Export API] Query error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch risk evaluations' },
        { status: 500 }
      );
    }

    // Transform data with null safety
    const rows: RiskEvaluationRow[] = (scores || []).map((s) => ({
      evaluationId: s.evaluation_id || '',
      studentId: s.student_id || '',
      studentName: s.student_name || 'Unknown',
      firstName: s.first_name || null,
      lastName: s.last_name || null,
      gradeLevel: s.grade_level,
      riskScore: Number(s.risk_score) || 0,
      riskLevel: (s.risk_level as RiskLevel) || 'on_track',
      previousLevel: (s.previous_level as RiskLevel | null) || null,
      levelChanged: Boolean(s.level_changed),
      trajectory: (s.trajectory as Trajectory) || 'stable',
      confidenceLevel: Number(s.confidence_level) || 1,
      factorsJson: JSON.stringify(s.risk_factors || []),
      hasIep: Boolean(s.has_iep),
      has504Plan: Boolean(s.has_504_plan),
      isChronicallyAbsent: Boolean(s.is_chronically_absent),
      computedAt: s.computed_at || new Date().toISOString(),
    }));

    // Choose columns based on anonymization
    const columns = anonymize ? anonymizedColumns : riskEvaluationColumns;

    if (format === 'json') {
      // JSON format for API integrations
      return NextResponse.json({
        data: rows,
        meta: {
          schoolId,
          exportedAt: new Date().toISOString(),
          totalRecords: rows.length,
          filters: { level, fromDate, toDate },
          anonymized: anonymize,
        },
      });
    }

    // CSV format (default)
    const csv = generateCSV(
      rows as unknown as Record<string, unknown>[],
      columns as unknown as CSVColumn<Record<string, unknown>>[]
    );
    const dateSuffix = new Date().toISOString().split('T')[0];
    const filename = anonymize
      ? `risk-evaluations-anonymized-${dateSuffix}.csv`
      : `risk-evaluations-${schoolId}-${dateSuffix}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Total-Records': String(rows.length),
        'X-Anonymized': String(anonymize),
      },
    });
  } catch (err) {
    console.error('[Risk Export API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
