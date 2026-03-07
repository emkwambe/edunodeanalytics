// src/app/api/schools/[schoolId]/dosage/route.ts
/**
 * School Dosage Summary API
 * GET: School-wide dosage metrics summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest, type DosageRouteParams } from './_shared/auth';
import { createDosageAnalyzer } from '@/lib/dosage';

export async function GET(request: NextRequest, { params }: DosageRouteParams) {
  const { schoolId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  try {
    const analyzer = createDosageAnalyzer(schoolId);
    const summary = await analyzer.analyzeSchool();

    return NextResponse.json({
      data: {
        totalInterventions: summary.totalInterventions,
        byStatus: summary.byStatus,
        onTrackCount: summary.onTrackCount,
        behindCount: summary.behindCount,
        criticalCount: summary.criticalCount,
        averageCompletionRate: summary.averageCompletionRate,
        averageFidelityScore: summary.averageFidelityScore,
        flaggedInterventions: summary.flaggedInterventions.map((f) => ({
          interventionId: f.interventionId,
          studentName: f.studentName,
          flags: f.flags.map((flag) => ({
            rule: flag.rule,
            severity: flag.severity,
            message: flag.message,
          })),
        })),
        computedAt: summary.computedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[Dosage Summary API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch dosage summary' },
      { status: 500 }
    );
  }
}
