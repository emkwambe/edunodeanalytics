// src/app/api/schools/[schoolId]/risk/drivers/route.ts
/**
 * Risk Drivers API
 * GET: Aggregated risk drivers across the school.
 * Shows which indicators are causing the most risk and how many students affected.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, type RiskRouteParams } from '../_shared/auth';

interface DriverSummary {
  name: string;
  category: string;
  studentsAffected: number;
  avgWeightedScore: number;
  maxWeightedScore: number;
  totalWeightedScore: number;
}

export async function GET(request: NextRequest, { params }: RiskRouteParams) {
  const { schoolId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { adminSupabase } = authResult;

  try {
    // Get all current risk scores with their factors
    const { data: scores, error } = await adminSupabase
      .from('current_risk_scores')
      .select('risk_factors, risk_level')
      .eq('school_id', schoolId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch risk drivers' },
        { status: 500 }
      );
    }

    if (!scores || scores.length === 0) {
      return NextResponse.json({ drivers: [], totalStudents: 0 });
    }

    // Aggregate factors across all students
    const driverMap: Map<string, DriverSummary> = new Map();

    for (const score of scores) {
      const factors = Array.isArray(score.risk_factors) ? score.risk_factors : [];

      for (const factor of factors as any[]) {
        if (!factor) continue; const key = factor.name || factor.category;
        if (!key) continue;

        const existing = driverMap.get(key);
        const weightedScore = Number(factor.weightedScore) || 0;

        if (existing) {
          // Only count as "affected" if weighted score > threshold
          if (weightedScore > 0.05) {
            existing.studentsAffected++;
          }
          existing.totalWeightedScore += weightedScore;
          existing.maxWeightedScore = Math.max(existing.maxWeightedScore, weightedScore);
        } else {
          driverMap.set(key, {
            name: factor.name || key,
            category: factor.category || 'other',
            studentsAffected: weightedScore > 0.05 ? 1 : 0,
            avgWeightedScore: 0, // computed below
            maxWeightedScore: weightedScore,
            totalWeightedScore: weightedScore,
          });
        }
      }
    }

    // Compute averages and sort by total impact
    const drivers = Array.from(driverMap.values())
      .map((d) => ({
        ...d,
        avgWeightedScore: d.studentsAffected > 0
          ? Math.round((d.totalWeightedScore / d.studentsAffected) * 1000) / 1000
          : 0,
        maxWeightedScore: Math.round(d.maxWeightedScore * 1000) / 1000,
        totalWeightedScore: Math.round(d.totalWeightedScore * 1000) / 1000,
      }))
      .sort((a, b) => b.totalWeightedScore - a.totalWeightedScore);

    return NextResponse.json({
      drivers,
      totalStudents: scores.length,
    });
  } catch (err) {
    console.error('[Risk Drivers API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}