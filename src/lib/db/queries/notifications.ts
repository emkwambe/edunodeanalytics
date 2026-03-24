import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Notification, NotificationInsert } from '@/lib/database.types';

/**
 * Notification Queries
 *
 * Data access layer for user notifications
 */

// Options interface for listing notifications
export interface GetNotificationsOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: 'alert' | 'insight' | 'system' | 'action';
}

// Demo mode detection
const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.EDUNODE_DEMO_MODE === 'true';

// Demo notifications matching the UI from notification-center.tsx
const generateDemoNotifications = (userId: string): Notification[] => {
  const now = Date.now();
  return [
    {
      id: 'demo-n1',
      created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      school_id: 'demo-school',
      user_id: userId,
      type: 'alert',
      priority: 'urgent',
      title: '3 students moved to critical risk',
      message: 'Aiden M., Sofia R., and Marcus J. exceeded risk threshold this week.',
      action_url: '/dashboard/students',
      action_label: 'View Students',
      related_student_id: null,
      related_intervention_id: null,
      is_read: false,
      read_at: null,
      is_dismissed: false,
      dismissed_at: null,
      expires_at: null,
      metadata: null,
    },
    {
      id: 'demo-n2',
      created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      school_id: 'demo-school',
      user_id: userId,
      type: 'insight',
      priority: 'high',
      title: 'Attendance dip detected in Grade 7',
      message: 'Chronic absence rate increased 4% this month. 3 classrooms affected.',
      action_url: '/dashboard/attendance',
      action_label: 'View Attendance',
      related_student_id: null,
      related_intervention_id: null,
      is_read: false,
      read_at: null,
      is_dismissed: false,
      dismissed_at: null,
      expires_at: null,
      metadata: null,
    },
    {
      id: 'demo-n3',
      created_at: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      school_id: 'demo-school',
      user_id: userId,
      type: 'action',
      priority: 'medium',
      title: 'Weekly data review due',
      message: "Your scheduled data review for this week hasn't been completed.",
      action_url: null,
      action_label: null,
      related_student_id: null,
      related_intervention_id: null,
      is_read: false,
      read_at: null,
      is_dismissed: false,
      dismissed_at: null,
      expires_at: null,
      metadata: null,
    },
    {
      id: 'demo-n4',
      created_at: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
      school_id: 'demo-school',
      user_id: userId,
      type: 'insight',
      priority: 'low',
      title: 'Math momentum improving',
      message: '62% of intervention students showing positive trajectory.',
      action_url: '/dashboard/momentum',
      action_label: 'View Momentum',
      related_student_id: null,
      related_intervention_id: null,
      is_read: true,
      read_at: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
      is_dismissed: false,
      dismissed_at: null,
      expires_at: null,
      metadata: null,
    },
    {
      id: 'demo-n5',
      created_at: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
      school_id: 'demo-school',
      user_id: userId,
      type: 'system',
      priority: 'low',
      title: 'Data sync completed',
      message: 'Clever roster sync finished. 487 students, 42 teachers updated.',
      action_url: null,
      action_label: null,
      related_student_id: null,
      related_intervention_id: null,
      is_read: true,
      read_at: new Date(now - 60 * 60 * 60 * 1000).toISOString(),
      is_dismissed: false,
      dismissed_at: null,
      expires_at: null,
      metadata: null,
    },
  ];
};

/**
 * Get notifications for a user with pagination and filtering
 */
export async function getNotificationsForUser(
  userId: string,
  options: GetNotificationsOptions = {}
): Promise<{ notifications: Notification[]; total: number }> {
  const { limit = 20, offset = 0, unreadOnly = false, type } = options;

  // In demo mode, return mock notifications
  if (isDemoMode) {
    let demoNotifications = generateDemoNotifications(userId);

    // Apply filters
    if (unreadOnly) {
      demoNotifications = demoNotifications.filter((n) => !n.is_read);
    }
    if (type) {
      demoNotifications = demoNotifications.filter((n) => n.type === type);
    }

    const total = demoNotifications.length;
    const paginated = demoNotifications.slice(offset, offset + limit);

    return { notifications: paginated, total };
  }

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (type) {
    query = query.eq('type', type);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[DB] Error fetching notifications for user:', userId, error);
    return { notifications: [], total: 0 };
  }

  return { notifications: data || [], total: count || 0 };
}

/**
 * Get count of unread notifications for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  // In demo mode, count unread demo notifications
  if (isDemoMode) {
    const demoNotifications = generateDemoNotifications(userId);
    return demoNotifications.filter((n) => !n.is_read).length;
  }

  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_dismissed', false);

  if (error) {
    console.error('[DB] Error fetching unread count:', userId, error);
    return 0;
  }

  return count || 0;
}

/**
 * Get a single notification by ID
 */
export async function getNotificationById(id: string): Promise<Notification | null> {
  // In demo mode, check demo notifications
  if (isDemoMode && id.startsWith('demo-')) {
    const demoNotifications = generateDemoNotifications('demo-user');
    return demoNotifications.find((n) => n.id === id) || null;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching notification by ID:', id, error);
    }
    return null;
  }

  return data;
}

/**
 * Create a notification (uses admin client for system notifications)
 */
export async function createNotification(
  notification: NotificationInsert
): Promise<Notification | null> {
  // In demo mode, return a mock created notification
  if (isDemoMode) {
    return {
      id: `demo-created-${Date.now()}`,
      created_at: new Date().toISOString(),
      school_id: notification.school_id,
      user_id: notification.user_id,
      type: notification.type,
      priority: notification.priority || 'medium',
      title: notification.title,
      message: notification.message,
      action_url: notification.action_url || null,
      action_label: notification.action_label || null,
      related_student_id: notification.related_student_id || null,
      related_intervention_id: notification.related_intervention_id || null,
      is_read: false,
      read_at: null,
      is_dismissed: false,
      dismissed_at: null,
      expires_at: notification.expires_at || null,
      metadata: notification.metadata || null,
    };
  }

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error creating notification:', error);
    return null;
  }

  return data;
}

/**
 * Create multiple notifications in batch (for alerts)
 */
export async function createBulkNotifications(
  notifications: NotificationInsert[]
): Promise<Notification[]> {
  if (notifications.length === 0) {
    return [];
  }

  // In demo mode, return mock created notifications
  if (isDemoMode) {
    return notifications.map((notification, index) => ({
      id: `demo-bulk-${Date.now()}-${index}`,
      created_at: new Date().toISOString(),
      school_id: notification.school_id,
      user_id: notification.user_id,
      type: notification.type,
      priority: notification.priority || 'medium',
      title: notification.title,
      message: notification.message,
      action_url: notification.action_url || null,
      action_label: notification.action_label || null,
      related_student_id: notification.related_student_id || null,
      related_intervention_id: notification.related_intervention_id || null,
      is_read: false,
      read_at: null,
      is_dismissed: false,
      dismissed_at: null,
      expires_at: notification.expires_at || null,
      metadata: notification.metadata || null,
    }));
  }

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) {
    console.error('[DB] Error creating bulk notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(id: string): Promise<Notification | null> {
  // In demo mode, return mock updated notification
  if (isDemoMode && id.startsWith('demo-')) {
    const demoNotifications = generateDemoNotifications('demo-user');
    const notification = demoNotifications.find((n) => n.id === id);
    if (notification) {
      return { ...notification, is_read: true, read_at: new Date().toISOString() };
    }
    return null;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error marking notification as read:', id, error);
    return null;
  }

  return data;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  // In demo mode, return count of unread notifications
  if (isDemoMode) {
    const demoNotifications = generateDemoNotifications(userId);
    return demoNotifications.filter((n) => !n.is_read).length;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select();

  if (error) {
    console.error('[DB] Error marking all notifications as read:', userId, error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Soft delete (dismiss) a notification
 */
export async function dismissNotification(id: string): Promise<Notification | null> {
  // In demo mode, return mock dismissed notification
  if (isDemoMode && id.startsWith('demo-')) {
    const demoNotifications = generateDemoNotifications('demo-user');
    const notification = demoNotifications.find((n) => n.id === id);
    if (notification) {
      return { ...notification, is_dismissed: true, dismissed_at: new Date().toISOString() };
    }
    return null;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error dismissing notification:', id, error);
    return null;
  }

  return data;
}

/**
 * Delete old notifications (admin cleanup operation)
 */
export async function deleteOldNotifications(olderThanDays: number): Promise<number> {
  // In demo mode, return 0 (no actual deletions)
  if (isDemoMode) {
    console.log(`[Demo] Would delete notifications older than ${olderThanDays} days`);
    return 0;
  }

  const supabase = createAdminSupabaseClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .select();

  if (error) {
    console.error('[DB] Error deleting old notifications:', error);
    return 0;
  }

  return data?.length || 0;
}
