/**
 * Compliance Reminders System
 *
 * Automated notification system for upcoming compliance deadlines.
 * Supports email, in-app notifications, and scheduled reminders.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';

export type ReminderType = 'email' | 'in_app' | 'both';
export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ComplianceItem {
  id: string;
  school_id: string;
  school_name: string;
  category: string;
  item_name: string;
  description?: string;
  status: 'pending' | 'compliant' | 'non_compliant' | 'expired';
  due_date: Date;
  assigned_to?: string;
  assigned_email?: string;
}

export interface ReminderConfig {
  days_before: number[];
  reminder_type: ReminderType;
  include_escalation: boolean;
  escalation_days: number;
  recipients: string[];
}

export interface ScheduledReminder {
  id: string;
  compliance_item_id: string;
  school_id: string;
  scheduled_for: Date;
  reminder_type: ReminderType;
  priority: ReminderPriority;
  sent: boolean;
  sent_at?: Date;
  recipients: string[];
  subject: string;
  message: string;
}

export interface ReminderNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'compliance_reminder' | 'compliance_overdue' | 'compliance_escalation';
  priority: ReminderPriority;
  compliance_item_id: string;
  school_id: string;
  read: boolean;
  created_at: Date;
  action_url?: string;
}

// Default reminder configuration
export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  days_before: [30, 14, 7, 3, 1],
  reminder_type: 'both',
  include_escalation: true,
  escalation_days: 7,
  recipients: [],
};

// Reminder templates
const REMINDER_TEMPLATES = {
  upcoming: {
    subject: (item: ComplianceItem, daysUntil: number) =>
      `[Action Required] ${item.item_name} due in ${daysUntil} days`,
    message: (item: ComplianceItem, daysUntil: number) => `
Dear ${item.assigned_to || 'Team'},

This is a reminder that the following compliance item is due in ${daysUntil} days:

**${item.item_name}**
Category: ${item.category}
School: ${item.school_name}
Due Date: ${item.due_date.toLocaleDateString()}

${item.description ? `Description: ${item.description}` : ''}

Please ensure this item is completed before the deadline to maintain compliance.

Best regards,
EduNode Analytics Compliance Team
    `.trim(),
  },
  overdue: {
    subject: (item: ComplianceItem, daysOverdue: number) =>
      `[URGENT] ${item.item_name} is ${daysOverdue} days overdue`,
    message: (item: ComplianceItem, daysOverdue: number) => `
URGENT: Compliance Item Overdue

The following compliance item is now ${daysOverdue} days overdue:

**${item.item_name}**
Category: ${item.category}
School: ${item.school_name}
Original Due Date: ${item.due_date.toLocaleDateString()}

${item.description ? `Description: ${item.description}` : ''}

Immediate action is required. This item affects your school's compliance status.

Please complete this item as soon as possible or contact the compliance team if you need assistance.

EduNode Analytics Compliance Team
    `.trim(),
  },
  escalation: {
    subject: (item: ComplianceItem, daysOverdue: number) =>
      `[ESCALATION] ${item.school_name}: ${item.item_name} overdue ${daysOverdue} days`,
    message: (item: ComplianceItem, daysOverdue: number) => `
ESCALATION NOTICE

The following compliance item has been overdue for ${daysOverdue} days and requires immediate attention:

School: ${item.school_name}
Item: ${item.item_name}
Category: ${item.category}
Original Due Date: ${item.due_date.toLocaleDateString()}
Days Overdue: ${daysOverdue}

${item.description ? `Description: ${item.description}` : ''}

Assigned To: ${item.assigned_to || 'Unassigned'}
${item.assigned_email ? `Contact: ${item.assigned_email}` : ''}

Please review and take appropriate action.

EduNode Analytics Compliance System
    `.trim(),
  },
};

/**
 * Get priority based on days until/overdue
 */
function getPriority(daysUntilDue: number): ReminderPriority {
  if (daysUntilDue < 0) return 'urgent'; // Overdue
  if (daysUntilDue <= 3) return 'high';
  if (daysUntilDue <= 7) return 'medium';
  return 'low';
}

/**
 * Calculate days until due date
 */
function getDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get upcoming compliance items for a school
 */
export async function getUpcomingComplianceItems(
  schoolId: string,
  daysAhead: number = 30
): Promise<ComplianceItem[]> {
  const supabase = createAdminSupabaseClient();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await (supabase as any)
    .from('compliance_items')
    .select(`
      id,
      school_id,
      category,
      item_name,
      description,
      status,
      due_date
    `)
    .eq('school_id', schoolId)
    .eq('status', 'pending')
    .lte('due_date', futureDate.toISOString())
    .order('due_date', { ascending: true });

  if (error) {
    console.error('[Compliance] Error fetching upcoming items:', error);
    return [];
  }

  // Get school name
  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .single();

  return (data || []).map((item: any) => ({
    ...item,
    school_name: school?.name || 'Unknown School',
    due_date: new Date(item.due_date),
  }));
}

/**
 * Get overdue compliance items
 */
export async function getOverdueComplianceItems(schoolId?: string): Promise<ComplianceItem[]> {
  const supabase = createAdminSupabaseClient();

  let query = (supabase as any)
    .from('compliance_items')
    .select(`
      id,
      school_id,
      category,
      item_name,
      description,
      status,
      due_date
    `)
    .eq('status', 'pending')
    .lt('due_date', new Date().toISOString())
    .order('due_date', { ascending: true });

  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Compliance] Error fetching overdue items:', error);
    return [];
  }

  // Get school names
  const schoolIds = Array.from(new Set((data || []).map((item: any) => item.school_id))) as string[];
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .in('id', schoolIds);

  const schoolMap = new Map(schools?.map((s: any) => [s.id, s.name]) || []);

  return (data || []).map((item: any) => ({
    ...item,
    school_name: schoolMap.get(item.school_id) || 'Unknown School',
    due_date: new Date(item.due_date),
  }));
}

/**
 * Generate reminders for upcoming compliance items
 */
export async function generateReminders(
  schoolId: string,
  config: ReminderConfig = DEFAULT_REMINDER_CONFIG
): Promise<ScheduledReminder[]> {
  const items = await getUpcomingComplianceItems(schoolId, 30);
  const reminders: ScheduledReminder[] = [];

  for (const item of items) {
    const daysUntilDue = getDaysUntilDue(item.due_date);

    for (const daysBefore of config.days_before) {
      if (daysUntilDue === daysBefore) {
        const reminder: ScheduledReminder = {
          id: `${item.id}-${daysBefore}d`,
          compliance_item_id: item.id,
          school_id: item.school_id,
          scheduled_for: new Date(),
          reminder_type: config.reminder_type,
          priority: getPriority(daysUntilDue),
          sent: false,
          recipients: config.recipients.length > 0
            ? config.recipients
            : item.assigned_email
              ? [item.assigned_email]
              : [],
          subject: REMINDER_TEMPLATES.upcoming.subject(item, daysUntilDue),
          message: REMINDER_TEMPLATES.upcoming.message(item, daysUntilDue),
        };
        reminders.push(reminder);
      }
    }
  }

  return reminders;
}

/**
 * Generate overdue notifications
 */
export async function generateOverdueNotifications(
  schoolId?: string
): Promise<ScheduledReminder[]> {
  const items = await getOverdueComplianceItems(schoolId);
  const reminders: ScheduledReminder[] = [];

  for (const item of items) {
    const daysOverdue = Math.abs(getDaysUntilDue(item.due_date));

    const reminder: ScheduledReminder = {
      id: `${item.id}-overdue-${daysOverdue}d`,
      compliance_item_id: item.id,
      school_id: item.school_id,
      scheduled_for: new Date(),
      reminder_type: 'both',
      priority: 'urgent',
      sent: false,
      recipients: item.assigned_email ? [item.assigned_email] : [],
      subject: REMINDER_TEMPLATES.overdue.subject(item, daysOverdue),
      message: REMINDER_TEMPLATES.overdue.message(item, daysOverdue),
    };
    reminders.push(reminder);
  }

  return reminders;
}

/**
 * Create in-app notification
 */
export async function createComplianceNotification(
  userId: string,
  item: ComplianceItem,
  type: 'reminder' | 'overdue' | 'escalation'
): Promise<ReminderNotification | null> {
  const supabase = createAdminSupabaseClient();
  const daysUntilDue = getDaysUntilDue(item.due_date);

  let title: string;
  let message: string;
  let notificationType: ReminderNotification['type'];

  if (type === 'reminder') {
    title = `Compliance Reminder: ${item.item_name}`;
    message = `Due in ${daysUntilDue} days for ${item.school_name}`;
    notificationType = 'compliance_reminder';
  } else if (type === 'overdue') {
    const daysOverdue = Math.abs(daysUntilDue);
    title = `OVERDUE: ${item.item_name}`;
    message = `${daysOverdue} days overdue for ${item.school_name}`;
    notificationType = 'compliance_overdue';
  } else {
    const daysOverdue = Math.abs(daysUntilDue);
    title = `ESCALATION: ${item.item_name}`;
    message = `Critical: ${daysOverdue} days overdue - requires immediate action`;
    notificationType = 'compliance_escalation';
  }

  const notification: Omit<ReminderNotification, 'id' | 'created_at'> = {
    user_id: userId,
    title,
    message,
    type: notificationType,
    priority: getPriority(daysUntilDue),
    compliance_item_id: item.id,
    school_id: item.school_id,
    read: false,
    action_url: `/settings/compliance?item=${item.id}`,
  };

  // Note: This would insert into a notifications table
  // For now, return the notification object
  return {
    ...notification,
    id: crypto.randomUUID(),
    created_at: new Date(),
  };
}

/**
 * Send email notification (placeholder - integrate with email provider)
 */
export async function sendComplianceEmail(
  reminder: ScheduledReminder
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // In production, integrate with Resend, SendGrid, or other email provider
  console.log('[Compliance] Sending email:', {
    to: reminder.recipients,
    subject: reminder.subject,
    priority: reminder.priority,
  });

  // Simulate sending
  return {
    success: true,
    messageId: `msg-${Date.now()}`,
  };
}

/**
 * Process all pending reminders (called by cron job)
 */
export async function processComplianceReminders(): Promise<{
  processed: number;
  sent: number;
  errors: number;
}> {
  const supabase = createAdminSupabaseClient();

  // Get all schools
  const { data: schools } = await supabase
    .from('schools')
    .select('id')
    .eq('is_active', true);

  let processed = 0;
  let sent = 0;
  let errors = 0;

  for (const school of schools || []) {
    const reminders = await generateReminders(school.id);
    const overdueReminders = await generateOverdueNotifications(school.id);

    for (const reminder of [...reminders, ...overdueReminders]) {
      processed++;

      if (reminder.reminder_type === 'email' || reminder.reminder_type === 'both') {
        const result = await sendComplianceEmail(reminder);
        if (result.success) {
          sent++;
        } else {
          errors++;
        }
      }
    }
  }

  console.log('[Compliance] Processed reminders:', { processed, sent, errors });

  return { processed, sent, errors };
}

/**
 * Get compliance summary for dashboard
 */
export async function getComplianceSummary(schoolId: string): Promise<{
  total: number;
  compliant: number;
  pending: number;
  overdue: number;
  dueSoon: number; // within 7 days
  nextDueDate: Date | null;
  nextDueItem: string | null;
}> {
  const supabase = createAdminSupabaseClient();

  const { data: items } = await (supabase as any)
    .from('compliance_items')
    .select('id, status, due_date, item_name')
    .eq('school_id', schoolId);

  if (!items || items.length === 0) {
    return {
      total: 0,
      compliant: 0,
      pending: 0,
      overdue: 0,
      dueSoon: 0,
      nextDueDate: null,
      nextDueItem: null,
    };
  }

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let compliant = 0;
  let pending = 0;
  let overdue = 0;
  let dueSoon = 0;
  let nextDueDate: Date | null = null;
  let nextDueItem: string | null = null;

  for (const item of items) {
    if (item.status === 'compliant') {
      compliant++;
    } else if (item.status === 'pending') {
      pending++;
      const dueDate = new Date(item.due_date);

      if (dueDate < now) {
        overdue++;
      } else if (dueDate <= sevenDaysFromNow) {
        dueSoon++;
      }

      if (dueDate >= now && (!nextDueDate || dueDate < nextDueDate)) {
        nextDueDate = dueDate;
        nextDueItem = item.item_name;
      }
    }
  }

  return {
    total: items.length,
    compliant,
    pending,
    overdue,
    dueSoon,
    nextDueDate,
    nextDueItem,
  };
}

/**
 * Subscribe user to compliance reminders
 */
export async function subscribeToReminders(
  userId: string,
  schoolId: string,
  categories?: string[]
): Promise<boolean> {
  // In production, this would update user preferences in the database
  console.log('[Compliance] Subscribed to reminders:', { userId, schoolId, categories });
  return true;
}

/**
 * Unsubscribe user from compliance reminders
 */
export async function unsubscribeFromReminders(
  userId: string,
  schoolId: string
): Promise<boolean> {
  // In production, this would update user preferences in the database
  console.log('[Compliance] Unsubscribed from reminders:', { userId, schoolId });
  return true;
}
