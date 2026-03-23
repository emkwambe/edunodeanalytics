/**
 * Integrations API
 * =================
 *
 * Unified entry point for integration operations.
 *
 * GET /api/integrations - List available integrations
 * GET /api/integrations?schoolId=xxx - Get school's integration summary
 * POST /api/integrations - Connect a new integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getIntegrationService } from '@/lib/integration';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const category = searchParams.get('category');
    const tier = searchParams.get('tier') as 'starter' | 'pro' | 'enterprise' | null;

    const service = getIntegrationService();

    // If no schoolId, return available integrations
    if (!schoolId) {
      let integrations = service.getAvailableIntegrations();

      if (category) {
        integrations = integrations.filter((i) => i.category === category);
      }

      if (tier) {
        integrations = service.getIntegrationsForTier(tier);
      }

      return NextResponse.json({
        success: true,
        integrations: integrations.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          category: i.category,
          icon: i.icon,
          brandColor: i.brandColor,
          logoUrl: i.logoUrl,
          tables: i.tables,
          usesOAuth: i.usesOAuth,
          requiredTier: i.requiredTier,
          supportedFrequencies: i.supportedFrequencies,
          defaultFrequency: i.defaultFrequency,
        })),
      });
    }

    // Verify user has access to school
    const supabase = await createServerSupabaseClient();
    const { data: membership } = await supabase
      .from('school_memberships')
      .select('role')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get school summary
    const summary = await service.getSchoolSummary(schoolId);
    const connectorStatuses = await service.getSchoolConnectorStatuses(schoolId);

    return NextResponse.json({
      success: true,
      schoolId,
      summary: {
        totalActiveIntegrations: summary.totalActiveIntegrations,
        totalMonthlyCost: summary.totalMonthlyCost,
        healthScore: summary.healthScore,
        lastSyncAt: summary.lastSyncAt,
        nextSyncAt: summary.nextSyncAt,
      },
      integrations: summary.integrations,
      connectors: connectorStatuses,
    });
  } catch (error) {
    console.error('[API] Integrations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schoolId, integrationId, credentials, settings } = body;

    if (!schoolId || !integrationId) {
      return NextResponse.json(
        { error: 'schoolId and integrationId are required' },
        { status: 400 }
      );
    }

    // Verify user has admin access to school
    const supabase = await createServerSupabaseClient();
    const { data: membership } = await supabase
      .from('school_memberships')
      .select('role')
      .eq('school_id', schoolId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!membership || !['school_admin', 'principal'].includes(membership.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const service = getIntegrationService();
    const result = await service.connect(schoolId, integrationId, credentials || {}, settings);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      dataSourceId: result.dataSourceId,
      message: result.message,
    });
  } catch (error) {
    console.error('[API] Integration connect error:', error);
    return NextResponse.json(
      { error: 'Failed to connect integration' },
      { status: 500 }
    );
  }
}
