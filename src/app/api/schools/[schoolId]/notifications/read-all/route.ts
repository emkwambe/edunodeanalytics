/**
 * Mark All Notifications Read API
 * ================================
 *
 * POST /api/schools/[schoolId]/notifications/read-all - Mark all notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { markAllAsRead } from '@/lib/db/queries/notifications';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * POST /api/schools/[schoolId]/notifications/read-all
 * Mark all notifications as read for the current user
 */
export async function POST(_request: NextRequest, { params: _params }: RouteParams) {
  try {
    // For demo, use a fixed userId - in production, get from auth
    const userId = 'demo-user';

    const count = await markAllAsRead(userId);

    return NextResponse.json({
      success: true,
      markedCount: count,
      message: `Marked ${count} notification${count !== 1 ? 's' : ''} as read`,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
