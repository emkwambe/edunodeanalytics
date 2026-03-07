// src/app/api/schools/[schoolId]/dosage/[interventionId]/route.ts
/**
 * Intervention Dosage API
 * GET: Detailed dosage analysis for a single intervention
 * POST: Recompute dosage metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest } from '../_shared/auth';
import type { DosageInterventionRouteParams } from '../_shared/auth';
import { createDosageAnalyzer } from '@/lib/dosage';

export async function GET(
  request: NextRequest,
  { params }: DosageInterventionRouteParams
) {
  const { schoolId, interventionId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  try {
    const analyzer = createDosageAnalyzer(schoolId);
    const result = await analyzer.analyzeIntervention(interventionId);

    if (!result) {
      return NextResponse.json(
        { error: 'Intervention dosage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        interventionId: result.interventionId,
        metrics: {
          plan: result.metrics.plan,
          actual: result.metrics.actual,
          compliance: result.metrics.compliance,
          fidelity: result.metrics.fidelity,
          pace: result.metrics.pace,
          status: result.metrics.status,
        },
        sessions: result.sessions.map((s) => ({
          id: s.id,
          scheduledDate: s.scheduledDate.toISOString(),
          scheduledStartTime: s.scheduledStartTime,
          scheduledDurationMinutes: s.scheduledDurationMinutes,
          actualDate: s.actualDate?.toISOString() || null,
          actualDurationMinutes: s.actualDurationMinutes,
          status: s.status,
          fidelityScore: s.fidelityScore,
          studentEngaged: s.studentEngaged,
          modality: s.modality,
        })),
        flags: result.flags.map((f) => ({
          rule: f.rule,
          severity: f.severity,
          message: f.message,
          detectedAt: f.detectedAt,
        })),
        recommendations: result.recommendations,
        overallHealth: result.overallHealth,
      },
    });
  } catch (err) {
    console.error('[Dosage API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to analyze intervention dosage' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: DosageInterventionRouteParams
) {
  const { schoolId, interventionId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  try {
    const analyzer = createDosageAnalyzer(schoolId);
    const metrics = await analyzer.computeMetrics(interventionId);

    if (!metrics) {
      return NextResponse.json(
        { error: 'Failed to compute dosage metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        interventionId,
        status: metrics.status,
        onTrack: metrics.pace.onTrack,
        sessionsBehind: metrics.pace.sessionsBehind,
        complianceRate: metrics.compliance.dosageComplianceRate,
        flagCount: metrics.inferenceFlags.length,
        computedAt: metrics.computedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[Dosage API] Compute error:', err);
    return NextResponse.json(
      { error: 'Failed to compute dosage metrics' },
      { status: 500 }
    );
  }
}
