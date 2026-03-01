/**
 * Single Notification API
 * =======================
 *
 * GET /api/schools/[schoolId]/notifications/[notificationId] - Get notification details
 * PATCH /api/schools/[schoolId]/notifications/[notificationId] - Update notification (mark read)
 * DELETE /api/schools/[schoolId]/notifications/[notificationId] - Dismiss notification
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNotificationById,
  markAsRead,
  dismissNotification,
} from '@/lib/db/queries/notifications';

interface RouteParams {
  params: Promise<{ schoolId: string; notificationId: string }>;
}

/**
 * GET /api/schools/[schoolId]/notifications/[notificationId]
 * Get a single notification by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { notificationId } = await params;

    const notification = await getNotificationById(notificationId);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/schools/[schoolId]/notifications/[notificationId]
 * Update a notification (e.g., mark as read)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { notificationId } = await params;
    const body = await request.json();

    // Currently only supports marking as read
    if (body.is_read === true) {
      const notification = await markAsRead(notificationId);

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(notification);
    }

    return NextResponse.json(
      { error: 'No valid update fields provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schools/[schoolId]/notifications/[notificationId]
 * Dismiss (soft delete) a notification
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { notificationId } = await params;

    const notification = await dismissNotification(notificationId);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss notification' },
      { status: 500 }
    );
  }
}
