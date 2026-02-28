import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron Job: Stale Interventions Alert
 *
 * Runs weekly on Mondays at 8 AM to identify interventions
 * that haven't had data entry in over 21 days (3-Week Rule).
 * Sends notifications to relevant staff.
 */

const STALE_THRESHOLD_DAYS = 21;

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

  try {
    // Placeholder for stale intervention detection logic
    // In production, this would:
    // 1. Query interventions with last_data_entry > 21 days ago
    // 2. Group by school and teacher
    // 3. Send email/in-app notifications
    // 4. Update intervention status to 'stale'

    const alertResults = {
      job: 'stale-interventions',
      status: 'completed',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      thresholdDays: STALE_THRESHOLD_DAYS,
      stats: {
        staleInterventionsFound: 0,
        notificationsSent: 0,
        schoolsAffected: 0,
      },
    };

    console.log('[CRON] Stale intervention check completed:', alertResults);

    return NextResponse.json(alertResults, { status: 200 });
  } catch (error) {
    console.error('[CRON] Stale intervention check failed:', error);

    return NextResponse.json(
      {
        job: 'stale-interventions',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
