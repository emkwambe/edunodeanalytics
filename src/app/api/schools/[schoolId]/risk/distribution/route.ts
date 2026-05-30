// src/app/api/schools/[schoolId]/risk/distribution/route.ts
/**
 * Risk Distribution API
 * GET: Risk level counts, trend over time (weekly), breakdown by grade.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, type RiskRouteParams } from '../_shared/auth';

export async function GET(request: NextRequest, { params }: RiskRouteParams) {
  const { schoolId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const weeks = Math.min(12, Math.max(1, parseInt(searchParams.get('weeks') || '8', 10)));

  // Demo mode: Return sample data for demo schools
  const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.EDUNODE_DEMO_MODE === 'true';
  if (isDemoMode && (schoolId.includes('demo') || schoolId.includes('academy-charter') || schoolId.includes('charter'))) {
    // Generate realistic weekly trend data
    const weeklyTrend = [];
    const now = new Date();
    for (let i = weeks - 1; i >= 0; i--) {
      const weekDate = new Date(now);
      weekDate.setDate(weekDate.getDate() - (i * 7));
      weekDate.setDate(weekDate.getDate() - ((weekDate.getDay() + 6) % 7)); // Get Monday

      // Simulate gradual improvement over time
      const improvementFactor = 1 - (i * 0.02);
      weeklyTrend.push({
        weekStart: weekDate.toISOString().split('T')[0],
        on_track: Math.round(320 * improvementFactor + Math.random() * 10),
        watch: Math.round(85 - (i * 2) + Math.random() * 5),
        at_risk: Math.round(52 - (i * 1.5) + Math.random() * 3),
        critical: Math.round(30 - (i * 0.5) + Math.random() * 2),
        total: 487,
      });
    }

    return NextResponse.json({
      distribution: {
        on_track: 320,
        watch: 85,
        at_risk: 52,
        critical: 30,
        total: 487,
      },
      byGrade: [
        { grade: 0, on_track: 35, watch: 8, at_risk: 5, critical: 2 },
        { grade: 1, on_track: 38, watch: 10, at_risk: 6, critical: 3 },
        { grade: 2, on_track: 42, watch: 12, at_risk: 7, critical: 4 },
        { grade: 3, on_track: 45, watch: 11, at_risk: 8, critical: 5 },
        { grade: 4, on_track: 48, watch: 14, at_risk: 9, critical: 6 },
        { grade: 5, on_track: 52, watch: 15, at_risk: 8, critical: 5 },
        { grade: 6, on_track: 60, watch: 15, at_risk: 9, critical: 5 },
      ],
      weeklyTrend,
    });
  }

  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { adminSupabase } = authResult;

  try {
    // 1. Current distribution from current_risk_scores view
    const { data: currentScores, error: currentError } = await adminSupabase
      .from('current_risk_scores')
      .select('risk_level, grade_level')
      .eq('school_id', schoolId);

    if (currentError) {
      return NextResponse.json(
        { error: 'Failed to fetch distribution' },
        { status: 500 }
      );
    }

    const scores = currentScores || [];

    // Count by level
    const distribution = {
      on_track: scores.filter((s) => s.risk_level === 'on_track').length,
      watch: scores.filter((s) => s.risk_level === 'watch').length,
      at_risk: scores.filter((s) => s.risk_level === 'at_risk').length,
      critical: scores.filter((s) => s.risk_level === 'critical').length,
      total: scores.length,
    };

    // Breakdown by grade
    const gradeMap: Record<number, Record<string, number>> = {};
    for (const s of scores) {
      const grade = s.grade_level ?? -1;
      if (!gradeMap[grade]) {
        gradeMap[grade] = { on_track: 0, watch: 0, at_risk: 0, critical: 0, total: 0 };
      }
      const level = s.risk_level ?? 'on_track';
      gradeMap[grade][level] = (gradeMap[grade][level] || 0) + 1;
    }

    const byGrade = Object.entries(gradeMap)
      .map(([grade, counts]) => ({ grade: parseInt(grade, 10), ...counts }))
      .sort((a, b) => a.grade - b.grade);

    // 2. Weekly trend from risk_evaluations (last N weeks)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);

    const { data: evalHistory, error: _histError } = await adminSupabase
      .from('risk_evaluations')
      .select('risk_level, computed_at')
      .eq('school_id', schoolId)
      .gte('computed_at', cutoffDate.toISOString())
      .order('computed_at', { ascending: true });

    // Group evaluations into weekly buckets
    const weeklyTrend: Array<{
      weekStart: string;
      on_track: number;
      watch: number;
      at_risk: number;
      critical: number;
      total: number;
    }> = [];

    if (evalHistory && evalHistory.length > 0) {
      const weekBuckets = new Map<string, { on_track: number; watch: number; at_risk: number; critical: number; total: number }>();

      for (const ev of evalHistory) {
        const date = new Date(ev.computed_at);
        // Get Monday of the week
        const monday = new Date(date);
        monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        const weekKey = monday.toISOString().split('T')[0];

        if (!weekBuckets.has(weekKey)) {
          weekBuckets.set(weekKey, { on_track: 0, watch: 0, at_risk: 0, critical: 0, total: 0 });
        }
        const bucket = weekBuckets.get(weekKey)!;
        const rLevel = ev.risk_level ?? 'on_track';
        bucket[rLevel as keyof typeof bucket]++;
      }

      for (const [weekStart, counts] of weekBuckets) {
        weeklyTrend.push({ weekStart, ...counts });
      }
    }

    return NextResponse.json({
      distribution,
      byGrade,
      weeklyTrend,
    });
  } catch (err) {
    console.error('[Risk Distribution API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}