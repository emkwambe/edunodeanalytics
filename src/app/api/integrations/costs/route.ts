/**
 * Integration Costs API
 * =====================
 *
 * GET /api/integrations/costs - Get current period costs for school
 * GET /api/integrations/costs?pricing=true - Get integration pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getIntegrationService, getIntegrationPricing } from '@/lib/integration';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const showPricing = searchParams.get('pricing') === 'true';

    // If requesting pricing, no auth needed beyond being logged in
    if (showPricing) {
      const service = getIntegrationService();
      const pricing = await service.getIntegrationPricing();

      return NextResponse.json({
        success: true,
        pricing,
      });
    }

    // For cost data, need school context
    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId is required' }, { status: 400 });
    }

    // Verify user has access to school
    const supabase = createServerSupabaseClient();
    const { data: membership } = await supabase
      .from('school_memberships')
      .select('role')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!membership || !['school_admin', 'principal', 'data_manager'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const service = getIntegrationService();
    const costs = await service.getCurrentPeriodCosts(schoolId);
    const summary = await service.getSchoolSummary(schoolId);

    return NextResponse.json({
      success: true,
      schoolId,
      currentPeriod: {
        start: costs.billingPeriod.start,
        end: costs.billingPeriod.end,
        totalCost: costs.totalCost,
        breakdown: costs.breakdown,
      },
      summary: {
        totalActiveIntegrations: summary.totalActiveIntegrations,
        totalMonthlyCost: summary.totalMonthlyCost,
        healthScore: summary.healthScore,
        lastSyncAt: summary.lastSyncAt,
        nextSyncAt: summary.nextSyncAt,
      },
      integrations: summary.integrations,
    });
  } catch (error) {
    console.error('[API] Integration costs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration costs' },
      { status: 500 }
    );
  }
}
