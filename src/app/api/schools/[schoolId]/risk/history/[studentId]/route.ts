// src/app/api/schools/[schoolId]/risk/history/[studentId]/route.ts
/**
 * Student Risk History API
 * GET: Risk evaluation history for a single student.
 * Supports pagination and date range filtering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, type RiskHistoryRouteParams } from '../../_shared/auth';

export async function GET(request: NextRequest, { params }: RiskHistoryRouteParams) {
  const { schoolId, studentId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { adminSupabase } = authResult;
  const searchParams = request.nextUrl.searchParams;

  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const after = searchParams.get('after'); // ISO date
  const before = searchParams.get('before'); // ISO date

  // Validate studentId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(studentId)) {
    return NextResponse.json(
      { error: 'Invalid student ID format' },
      { status: 400 }
    );
  }

  try {
    // Verify student belongs to this school
    const { data: student, error: studentError } = await adminSupabase
      .from('students')
      .select('id, display_name, grade_level')
      .eq('id', studentId)
      .eq('school_id', schoolId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found in this school' },
        { status: 404 }
      );
    }

    // Fetch evaluation history
    let query = adminSupabase
      .from('risk_evaluations')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', schoolId)
      .order('computed_at', { ascending: false })
      .limit(limit);

    if (after) {
      query = query.gte('computed_at', after);
    }
    if (before) {
      query = query.lte('computed_at', before);
    }

    const { data: evaluations, error: evalError } = await query;

    if (evalError) {
      return NextResponse.json(
        { error: 'Failed to fetch evaluation history' },
        { status: 500 }
      );
    }

    // Format response
    const history = (evaluations || []).map((ev) => ({
      id: ev.id,
      riskScore: Number(ev.risk_score),
      riskLevel: ev.risk_level,
      previousLevel: ev.previous_level,
      levelChanged: ev.level_changed,
      trajectory: ev.trajectory,
      confidenceLevel: Number(ev.confidence_level),
      riskFactors: ev.risk_factors,
      recommendedActions: ev.recommended_actions,
      triggerType: ev.trigger_type,
      computedAt: ev.computed_at,
    }));

    // Also fetch metric history for trend context
    const { data: metricHistory } = await adminSupabase
      .from('student_metric_history')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', schoolId)
      .order('snapshot_date', { ascending: false })
      .limit(12);

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.display_name,
        gradeLevel: student.grade_level,
      },
      evaluations: history,
      metricHistory: metricHistory || [],
    });
  } catch (err) {
    console.error('[Risk History API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}