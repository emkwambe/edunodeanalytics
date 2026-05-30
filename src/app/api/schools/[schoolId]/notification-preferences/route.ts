/**
 * Notification Preferences API
 * ============================
 *
 * GET: Retrieve notification preferences for a school
 * PUT: Update notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/lib/notifications/automated-alerts';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { schoolId } = await params;

  try {
    const preferences = await getNotificationPreferences(schoolId);
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('[Notification Preferences] Error fetching:', error);
    return NextResponse.json(DEFAULT_NOTIFICATION_PREFERENCES);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { schoolId } = await params;

  // Verify user has access to this school
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has admin access to this school
  const adminSupabase = createAdminSupabaseClient();
  const { data: membership } = await adminSupabase
    .from('school_memberships')
    .select('role')
    .eq('school_id', schoolId)
    .eq('user_id', user.id)
    .single();

  if (!membership || !['school_admin', 'principal', 'platform_admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const result = await updateNotificationPreferences(schoolId, {
      risk_escalation_enabled: body.risk_escalation_enabled,
      risk_escalation_threshold: body.risk_escalation_threshold,
      risk_escalation_recipients: body.risk_escalation_recipients,
      weekly_digest_enabled: body.weekly_digest_enabled,
      weekly_digest_day: body.weekly_digest_day,
      weekly_digest_recipients: body.weekly_digest_recipients,
      parent_notifications_enabled: body.parent_notifications_enabled,
      parent_notification_types: body.parent_notification_types,
      sync_failure_alerts_enabled: body.sync_failure_alerts_enabled,
      sync_failure_recipients: body.sync_failure_recipients,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notification Preferences] Error updating:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
