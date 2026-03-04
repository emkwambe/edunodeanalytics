import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendStaleInterventionsEmail } from '@/lib/email/templates';
import { captureException } from '@/lib/monitoring/sentry';

/**
 * Cron Job: Stale Interventions Alert
 *
 * Runs weekly on Mondays at 8 AM to identify interventions
 * that haven't had data entry in over 21 days (3-Week Rule).
 * Sends notifications to relevant staff.
 *
 * Schedule: 0 8 * * 1 (Every Monday at 8 AM)
 */

const STALE_THRESHOLD_DAYS = 21;

interface StaleIntervention {
  id: string;
  student_id: string;
  student_name: string;
  intervention_type: string;
  days_since_update: number;
  owner_id: string;
  owner_email: string;
  owner_name: string;
  school_id: string;
  school_slug: string;
  school_name: string;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const stats = {
    staleInterventionsFound: 0,
    notificationsSent: 0,
    schoolsAffected: 0,
    errors: [] as string[],
  };

  try {
    const supabase = createAdminSupabaseClient();

    // Calculate the stale date threshold
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - STALE_THRESHOLD_DAYS);

    // Find stale interventions with owner and school info
    // This joins interventions with students, schools, and users
    const { data: staleInterventions, error: queryError } = await supabase
      .from('interventions')
      .select(`
        id,
        type,
        updated_at,
        student_id,
        assigned_to_user_id,
        students!inner (
          first_name,
          last_name,
          school_id
        )
      `)
      .eq('status', 'in_progress')
      .lt('updated_at', staleDate.toISOString())
      .order('updated_at', { ascending: true });

    if (queryError) {
      console.error('[CRON] Failed to query stale interventions:', queryError);
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    if (!staleInterventions || staleInterventions.length === 0) {
      console.log('[CRON] No stale interventions found');
      return NextResponse.json({
        job: 'stale-interventions',
        status: 'completed',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        thresholdDays: STALE_THRESHOLD_DAYS,
        stats,
      });
    }

    stats.staleInterventionsFound = staleInterventions.length;

    // Group interventions by owner for batched notifications
    const interventionsByOwner = new Map<string, {
      ownerEmail: string;
      ownerName: string;
      schoolName: string;
      schoolSlug: string;
      interventions: Array<{
        studentName: string;
        interventionType: string;
        daysSinceUpdate: number;
      }>;
    }>();

    // Get unique school IDs
    const schoolIds = new Set<string>();
    const ownerIds = new Set<string>();

    for (const intervention of staleInterventions) {
      const student = intervention.students as unknown as {
        first_name: string;
        last_name: string;
        school_id: string;
      };
      schoolIds.add(student.school_id);
      if (intervention.assigned_to_user_id) {
        ownerIds.add(intervention.assigned_to_user_id);
      }
    }

    // Fetch school info
    const { data: schools } = await supabase
      .from('schools')
      .select('id, name, slug')
      .in('id', Array.from(schoolIds));

    const schoolMap = new Map(schools?.map(s => [s.id, s]) || []);

    // Fetch owner info from users table
    const { data: users } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .in('id', Array.from(ownerIds));

    const userMap = new Map(users?.map(u => [u.id, u]) || []);

    // Group interventions by owner
    for (const intervention of staleInterventions) {
      const student = intervention.students as unknown as {
        first_name: string;
        last_name: string;
        school_id: string;
      };

      const ownerId = intervention.assigned_to_user_id;
      if (!ownerId) continue;

      const owner = userMap.get(ownerId);
      if (!owner?.email) continue;

      const school = schoolMap.get(student.school_id);
      if (!school) continue;

      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(intervention.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (!interventionsByOwner.has(ownerId)) {
        interventionsByOwner.set(ownerId, {
          ownerEmail: owner.email,
          ownerName: `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Staff Member',
          schoolName: school.name,
          schoolSlug: school.slug,
          interventions: [],
        });
      }

      const ownerData = interventionsByOwner.get(ownerId)!;
      ownerData.interventions.push({
        studentName: `${student.first_name} ${student.last_name}`,
        interventionType: intervention.type,
        daysSinceUpdate,
      });
    }

    stats.schoolsAffected = schoolIds.size;

    // Send email notifications
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.edunode.io';

    for (const [ownerId, ownerData] of interventionsByOwner) {
      try {
        const result = await sendStaleInterventionsEmail(
          { email: ownerData.ownerEmail, name: ownerData.ownerName },
          {
            schoolName: ownerData.schoolName,
            interventions: ownerData.interventions,
            dashboardUrl: `${baseUrl}/${ownerData.schoolSlug}/dashboard/interventions?filter=stale`,
          }
        );

        if (result.success) {
          stats.notificationsSent++;
          console.log(`[CRON] Sent stale intervention alert to ${ownerData.ownerEmail}`);
        } else {
          stats.errors.push(`Failed to send to ${ownerData.ownerEmail}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push(`Exception sending to ${ownerData.ownerEmail}: ${errorMsg}`);
        captureException(error, { ownerId, ownerEmail: ownerData.ownerEmail });
      }
    }

    // Note: is_stale column not yet in schema, skipping update for now
    // When column is added, can mark interventions with:
    // await supabase.from('interventions').update({ is_stale: true }).in('id', interventionIds);

    const alertResults = {
      job: 'stale-interventions',
      status: stats.errors.length === 0 ? 'completed' : 'completed_with_errors',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      thresholdDays: STALE_THRESHOLD_DAYS,
      stats,
    };

    console.log('[CRON] Stale intervention check completed:', alertResults);

    return NextResponse.json(alertResults, { status: 200 });
  } catch (error) {
    console.error('[CRON] Stale intervention check failed:', error);
    captureException(error, { job: 'stale-interventions' });

    return NextResponse.json(
      {
        job: 'stale-interventions',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        stats,
      },
      { status: 500 }
    );
  }
}
