/**
 * Notifications API
 * =================
 *
 * GET /api/schools/[schoolId]/notifications - List notifications with pagination and filtering
 * POST /api/schools/[schoolId]/notifications - Create a new notification
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNotificationsForUser,
  createNotification,
  getUnreadCount,
} from '@/lib/db/queries/notifications';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/schools/[schoolId]/notifications
 * List notifications for the current user
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId: _schoolId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // For demo, use a fixed userId - in production, get from auth
    const userId = 'demo-user';

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Filters
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') as 'alert' | 'insight' | 'system' | 'action' | null;

    const { notifications, total } = await getNotificationsForUser(userId, {
      limit,
      offset,
      unreadOnly,
      type: type || undefined,
    });

    const unreadCount = await getUnreadCount(userId);

    return NextResponse.json({
      data: notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schools/[schoolId]/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      );
    }
    if (!body.type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }
    if (!body.title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }
    if (!body.message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['alert', 'insight', 'system', 'action'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      school_id: schoolId,
      user_id: body.user_id,
      type: body.type,
      priority: body.priority || 'medium',
      title: body.title,
      message: body.message,
      action_url: body.action_url || null,
      action_label: body.action_label || null,
      related_student_id: body.related_student_id || null,
      related_intervention_id: body.related_intervention_id || null,
      expires_at: body.expires_at || null,
      metadata: body.metadata || null,
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
