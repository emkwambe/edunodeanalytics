// src/app/api/schools/[schoolId]/risk/scores/route.ts
/**
 * Risk Scores API
 * GET: Paginated list of current risk scores.
 * Filterable by level, grade, search term.
 * Returns student name, score, level, top factors, active intervention.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, type RiskRouteParams } from '../_shared/auth';
import type { RiskLevel } from '@/lib/risk-engine/types';

export async function GET(request: NextRequest, { params }: RiskRouteParams) {
  const { schoolId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { adminSupabase } = authResult;
  const searchParams = request.nextUrl.searchParams;

  // Parse query params
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
  const level = searchParams.get('level') as RiskLevel | null;
  const grade = searchParams.get('grade');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sort') || 'risk_score';
  const sortOrder = searchParams.get('order') === 'asc' ? true : false;

  const offset = (page - 1) * limit;

  try {
    // Query the current_risk_scores view
    let query = adminSupabase
      .from('current_risk_scores')
      .select('*', { count: 'exact' })
      .eq('school_id', schoolId);

    // Apply filters
    if (level) {
      query = query.eq('risk_level', level);
    }
    if (grade) {
      query = query.eq('grade_level', parseInt(grade, 10));
    }
    if (search) {
      query = query.ilike('student_name', `%${search}%`);
    }

    // Sort
    const validSortColumns = ['risk_score', 'student_name', 'grade_level', 'computed_at'];
    const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'risk_score';
    query = query.order(sortCol, { ascending: sortOrder });

    // Paginate
    query = query.range(offset, offset + limit - 1);

    const { data: scores, count, error } = await query;

    if (error) {
      console.error('[Risk Scores API] Query error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch risk scores' },
        { status: 500 }
      );
    }

    // Enrich with active intervention status
    const studentIds = (scores || []).map((s) => s.student_id).filter((id): id is string => id != null);
    let interventionMap: Record<string, { id: string; title: string; status: string }> = {};

    if (studentIds.length > 0) {
      const { data: interventions } = await adminSupabase
        .from('interventions')
        .select('id, title, status, student_id')
        .eq('school_id', schoolId)
        .in('student_id', studentIds)
        .in('status', ['planned', 'in_progress']);

      if (interventions) {
        for (const iv of interventions) {
          // Keep the first (most recent) active intervention per student
          if (!interventionMap[iv.student_id]) {
            interventionMap[iv.student_id] = {
              id: iv.id,
              title: iv.title,
              status: iv.status,
            };
          }
        }
      }
    }

    // Format response
    const formattedScores = (scores || []).map((s) => ({
      studentId: s.student_id,
      studentName: s.student_name,
      firstName: s.first_name,
      lastName: s.last_name,
      gradeLevel: s.grade_level,
      riskScore: Number(s.risk_score),
      riskLevel: s.risk_level,
      previousLevel: s.previous_level,
      levelChanged: s.level_changed,
      trajectory: s.trajectory,
      confidenceLevel: Number(s.confidence_level),
      topFactors: Array.isArray(s.risk_factors)
        ? (s.risk_factors as any[])
            .sort((a: { weightedScore: number }, b: { weightedScore: number }) =>
              b.weightedScore - a.weightedScore
            )
            .slice(0, 3)
            .map((f: { name: string; category: string; weightedScore: number; description: string }) => ({
              name: f.name,
              category: f.category,
              score: f.weightedScore,
              description: f.description,
            }))
        : [],
      activeIntervention: s.student_id ? (interventionMap[s.student_id] || null) : null,
      hasIep: s.has_iep,
      has504Plan: s.has_504_plan,
      isChronicallyAbsent: s.is_chronically_absent,
      computedAt: s.computed_at,
    }));

    return NextResponse.json({
      data: formattedScores,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    console.error('[Risk Scores API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}