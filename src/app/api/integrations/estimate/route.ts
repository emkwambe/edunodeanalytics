/**
 * Integration Cost Estimate API
 * ==============================
 *
 * POST /api/integrations/estimate - Estimate integration costs for a school
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { estimateSchoolCost } from '@/lib/integration';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { integrationIds, studentCount, tier } = body;

    if (!integrationIds || !Array.isArray(integrationIds)) {
      return NextResponse.json(
        { error: 'integrationIds array is required' },
        { status: 400 }
      );
    }

    if (!studentCount || typeof studentCount !== 'number') {
      return NextResponse.json(
        { error: 'studentCount is required and must be a number' },
        { status: 400 }
      );
    }

    const estimate = estimateSchoolCost(
      integrationIds,
      studentCount,
      tier || 'starter'
    );

    return NextResponse.json({
      success: true,
      estimate: {
        totalMonthlyCost: estimate.totalMonthlyCost,
        totalAnnualCost: estimate.totalMonthlyCost * 12,
        breakdown: estimate.breakdown,
        assumptions: {
          studentCount,
          tier: tier || 'starter',
          syncsPerMonth: {
            sis: 30,
            assessment: 10,
            lms: 30,
          },
        },
      },
    });
  } catch (error) {
    console.error('[API] Integration estimate error:', error);
    return NextResponse.json(
      { error: 'Failed to estimate costs' },
      { status: 500 }
    );
  }
}
