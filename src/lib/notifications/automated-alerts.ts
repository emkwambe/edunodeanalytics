/**
 * Automated Alert Notifications
 * =============================
 *
 * Premium notification features with tier gating:
 * - Student risk escalation alerts (Pro+)
 * - Weekly digest summaries for principals (Pro+)
 * - Parent notification triggers (Enterprise)
 * - Sync failure alerts (Pro+)
 */

import { sendEmail, wrapEmailTemplate } from '@/lib/email/service';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { hasFeatureAccess, type SubscriptionTier } from '@/lib/features/feature-gates';

// Notification type definitions
export type NotificationType =
  | 'risk_escalation'
  | 'weekly_digest'
  | 'parent_notification'
  | 'sync_failure';

export interface NotificationPreferences {
  risk_escalation_enabled: boolean;
  risk_escalation_threshold: 'watch' | 'at_risk' | 'critical';
  risk_escalation_recipients: string[];

  weekly_digest_enabled: boolean;
  weekly_digest_day: 'monday' | 'friday' | 'sunday';
  weekly_digest_recipients: string[];

  parent_notifications_enabled: boolean;
  parent_notification_types: ('risk_change' | 'intervention_update' | 'attendance_alert')[];

  sync_failure_alerts_enabled: boolean;
  sync_failure_recipients: string[];
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  risk_escalation_enabled: true,
  risk_escalation_threshold: 'critical',
  risk_escalation_recipients: [],

  weekly_digest_enabled: true,
  weekly_digest_day: 'monday',
  weekly_digest_recipients: [],

  parent_notifications_enabled: false,
  parent_notification_types: ['risk_change'],

  sync_failure_alerts_enabled: true,
  sync_failure_recipients: [],
};

// Feature requirements for each notification type
export const NOTIFICATION_TIER_REQUIREMENTS: Record<NotificationType, SubscriptionTier> = {
  risk_escalation: 'pro',
  weekly_digest: 'pro',
  parent_notification: 'enterprise',
  sync_failure: 'pro',
};

/**
 * Check if a notification type is available for the school's tier
 */
export function isNotificationAvailable(
  notificationType: NotificationType,
  schoolTier: SubscriptionTier
): boolean {
  const requiredTier = NOTIFICATION_TIER_REQUIREMENTS[notificationType];
  const tierHierarchy = { starter: 1, pro: 2, enterprise: 3 };
  return tierHierarchy[schoolTier] >= tierHierarchy[requiredTier];
}

// =============================================================================
// Risk Escalation Alerts
// =============================================================================

export interface RiskEscalationData {
  studentId: string;
  studentName: string;
  previousLevel: string;
  newLevel: string;
  riskScore: number;
  topFactors: string[];
  schoolName: string;
}

export async function sendRiskEscalationAlert(
  schoolId: string,
  data: RiskEscalationData,
  preferences: NotificationPreferences
): Promise<{ success: boolean; error?: string }> {
  if (!preferences.risk_escalation_enabled) {
    return { success: true }; // Silently skip if disabled
  }

  if (preferences.risk_escalation_recipients.length === 0) {
    return { success: false, error: 'No recipients configured' };
  }

  const levelColors: Record<string, string> = {
    on_track: '#10b981',
    watch: '#f59e0b',
    at_risk: '#f97316',
    critical: '#ef4444',
  };

  const emailContent = `
    <div class="alert-${data.newLevel === 'critical' ? 'error' : 'warning'}">
      <strong>Student Risk Level Changed</strong>
    </div>

    <h2 style="margin-top: 24px;">${data.studentName}</h2>

    <p>Risk level has changed from
      <span style="color: ${levelColors[data.previousLevel] || '#64748b'}; font-weight: bold;">
        ${data.previousLevel.replace('_', ' ').toUpperCase()}
      </span>
      to
      <span style="color: ${levelColors[data.newLevel] || '#64748b'}; font-weight: bold;">
        ${data.newLevel.replace('_', ' ').toUpperCase()}
      </span>
    </p>

    <p><strong>Risk Score:</strong> ${data.riskScore.toFixed(1)}</p>

    <h3>Contributing Factors:</h3>
    <ul>
      ${data.topFactors.map(f => `<li>${f}</li>`).join('')}
    </ul>

    <p style="margin-top: 24px;">
      <a href="https://app.edunode.app/student-360/${data.studentId}" class="button">
        View Student Profile
      </a>
    </p>
  `;

  const result = await sendEmail({
    to: preferences.risk_escalation_recipients.map(email => ({ email })),
    subject: `[Risk Alert] ${data.studentName} moved to ${data.newLevel.replace('_', ' ').toUpperCase()}`,
    html: wrapEmailTemplate(emailContent, data.schoolName),
    tags: {
      type: 'risk_escalation',
      school_id: schoolId,
      risk_level: data.newLevel,
    },
  });

  return result;
}

// =============================================================================
// Weekly Digest Summaries
// =============================================================================

export interface WeeklyDigestData {
  schoolName: string;
  weekEnding: string;
  totalStudents: number;
  riskDistribution: {
    on_track: number;
    watch: number;
    at_risk: number;
    critical: number;
  };
  riskChanges: {
    improved: number;
    worsened: number;
    unchanged: number;
  };
  interventionStats: {
    active: number;
    startedThisWeek: number;
    completedThisWeek: number;
    successRate: number;
  };
  attendanceRate: number;
  chronicAbsenceCount: number;
  topConcerns: string[];
  topWins: string[];
}

export async function sendWeeklyDigest(
  schoolId: string,
  data: WeeklyDigestData,
  recipients: string[]
): Promise<{ success: boolean; error?: string }> {
  if (recipients.length === 0) {
    return { success: false, error: 'No recipients configured' };
  }

  const totalRisk = data.riskDistribution.on_track + data.riskDistribution.watch +
    data.riskDistribution.at_risk + data.riskDistribution.critical;

  const emailContent = `
    <h1>Weekly School Performance Digest</h1>
    <p style="color: #64748b;">Week ending ${data.weekEnding}</p>

    <h2>Risk Distribution</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px; background: #d1fae5; text-align: center; border-radius: 4px 0 0 4px;">
          <strong style="color: #10b981;">${data.riskDistribution.on_track}</strong><br>
          <span style="font-size: 12px; color: #64748b;">On Track</span>
        </td>
        <td style="padding: 8px; background: #fef3c7; text-align: center;">
          <strong style="color: #f59e0b;">${data.riskDistribution.watch}</strong><br>
          <span style="font-size: 12px; color: #64748b;">Watch</span>
        </td>
        <td style="padding: 8px; background: #ffedd5; text-align: center;">
          <strong style="color: #f97316;">${data.riskDistribution.at_risk}</strong><br>
          <span style="font-size: 12px; color: #64748b;">At Risk</span>
        </td>
        <td style="padding: 8px; background: #fee2e2; text-align: center; border-radius: 0 4px 4px 0;">
          <strong style="color: #ef4444;">${data.riskDistribution.critical}</strong><br>
          <span style="font-size: 12px; color: #64748b;">Critical</span>
        </td>
      </tr>
    </table>

    <h2>Weekly Movement</h2>
    <p>
      <span style="color: #10b981;">↑ ${data.riskChanges.improved} improved</span> ·
      <span style="color: #ef4444;">↓ ${data.riskChanges.worsened} worsened</span> ·
      <span style="color: #64748b;">→ ${data.riskChanges.unchanged} unchanged</span>
    </p>

    <h2>Interventions</h2>
    <ul>
      <li><strong>${data.interventionStats.active}</strong> active interventions</li>
      <li><strong>${data.interventionStats.startedThisWeek}</strong> started this week</li>
      <li><strong>${data.interventionStats.completedThisWeek}</strong> completed this week</li>
      <li><strong>${Math.round(data.interventionStats.successRate * 100)}%</strong> success rate</li>
    </ul>

    <h2>Attendance</h2>
    <p>
      <strong>${data.attendanceRate.toFixed(1)}%</strong> attendance rate ·
      <strong>${data.chronicAbsenceCount}</strong> chronically absent students
    </p>

    ${data.topConcerns.length > 0 ? `
      <h2 style="color: #f97316;">⚠️ Top Concerns</h2>
      <ul>
        ${data.topConcerns.map(c => `<li>${c}</li>`).join('')}
      </ul>
    ` : ''}

    ${data.topWins.length > 0 ? `
      <h2 style="color: #10b981;">🎉 Wins This Week</h2>
      <ul>
        ${data.topWins.map(w => `<li>${w}</li>`).join('')}
      </ul>
    ` : ''}

    <p style="margin-top: 24px;">
      <a href="https://app.edunode.app/dashboard" class="button">
        View Full Dashboard
      </a>
    </p>
  `;

  const result = await sendEmail({
    to: recipients.map(email => ({ email })),
    subject: `[${data.schoolName}] Weekly Digest - ${data.weekEnding}`,
    html: wrapEmailTemplate(emailContent, data.schoolName),
    tags: {
      type: 'weekly_digest',
      school_id: schoolId,
    },
  });

  return result;
}

// =============================================================================
// Parent Notification Triggers
// =============================================================================

export interface ParentNotificationData {
  studentName: string;
  parentName: string;
  parentEmail: string;
  notificationType: 'risk_change' | 'intervention_update' | 'attendance_alert';
  schoolName: string;
  details: Record<string, string>;
}

export async function sendParentNotification(
  schoolId: string,
  data: ParentNotificationData
): Promise<{ success: boolean; error?: string }> {
  let subject: string;
  let content: string;

  switch (data.notificationType) {
    case 'risk_change':
      subject = `Update about ${data.studentName}'s academic progress`;
      content = `
        <p>Dear ${data.parentName},</p>

        <p>We wanted to share an update about ${data.studentName}'s academic progress.</p>

        <div class="alert-warning">
          <p>${data.details.message || 'Your student may benefit from additional support.'}</p>
        </div>

        <p>Our team is committed to supporting every student's success. If you have any questions
        or would like to discuss strategies to support ${data.studentName} at home, please don't
        hesitate to reach out.</p>

        <p>Best regards,<br>${data.schoolName} Team</p>
      `;
      break;

    case 'intervention_update':
      subject = `${data.studentName}'s intervention progress update`;
      content = `
        <p>Dear ${data.parentName},</p>

        <p>We're writing to share progress on ${data.studentName}'s current support program.</p>

        <div class="alert-success">
          <strong>Program:</strong> ${data.details.interventionName || 'Academic Support'}<br>
          <strong>Status:</strong> ${data.details.status || 'In Progress'}<br>
          ${data.details.progress ? `<strong>Progress:</strong> ${data.details.progress}` : ''}
        </div>

        <p>${data.details.notes || ''}</p>

        <p>Thank you for your continued partnership in your child's education.</p>

        <p>Best regards,<br>${data.schoolName} Team</p>
      `;
      break;

    case 'attendance_alert':
      subject = `Attendance update for ${data.studentName}`;
      content = `
        <p>Dear ${data.parentName},</p>

        <p>We're reaching out regarding ${data.studentName}'s recent attendance.</p>

        <div class="alert-warning">
          <strong>Days Absent:</strong> ${data.details.daysAbsent || 'N/A'}<br>
          <strong>Attendance Rate:</strong> ${data.details.attendanceRate || 'N/A'}
        </div>

        <p>Regular attendance is crucial for academic success. If there are circumstances
        affecting ${data.studentName}'s ability to attend school, please let us know how we
        can help.</p>

        <p>Best regards,<br>${data.schoolName} Team</p>
      `;
      break;
  }

  const result = await sendEmail({
    to: [{ email: data.parentEmail, name: data.parentName }],
    subject,
    html: wrapEmailTemplate(content, data.schoolName),
    tags: {
      type: 'parent_notification',
      school_id: schoolId,
      notification_type: data.notificationType,
    },
  });

  return result;
}

// =============================================================================
// Sync Failure Alerts
// =============================================================================

export interface SyncFailureData {
  schoolName: string;
  sourceName: string;
  errorType: string;
  errorMessage: string;
  lastSuccessfulSync: string;
  attemptCount: number;
  affectedRecords?: number;
}

export async function sendSyncFailureAlert(
  schoolId: string,
  data: SyncFailureData,
  recipients: string[]
): Promise<{ success: boolean; error?: string }> {
  if (recipients.length === 0) {
    return { success: false, error: 'No recipients configured' };
  }

  const emailContent = `
    <div class="alert-error">
      <strong>Data Sync Failure Detected</strong>
    </div>

    <h2>Sync Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Source:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.sourceName}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Error Type:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.errorType}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Error Message:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #ef4444;">${data.errorMessage}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Last Successful Sync:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.lastSuccessfulSync}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Failed Attempts:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.attemptCount}</td>
      </tr>
      ${data.affectedRecords ? `
        <tr>
          <td style="padding: 8px;"><strong>Affected Records:</strong></td>
          <td style="padding: 8px;">${data.affectedRecords}</td>
        </tr>
      ` : ''}
    </table>

    <h2>Recommended Actions</h2>
    <ol>
      <li>Check the integration credentials in Settings → Data Sources</li>
      <li>Verify the source system is accessible</li>
      <li>Review the error logs for more details</li>
      <li>Contact support if the issue persists</li>
    </ol>

    <p style="margin-top: 24px;">
      <a href="https://app.edunode.app/settings/integration-health" class="button">
        View Integration Health
      </a>
    </p>
  `;

  const result = await sendEmail({
    to: recipients.map(email => ({ email })),
    subject: `[Sync Alert] ${data.sourceName} sync failed for ${data.schoolName}`,
    html: wrapEmailTemplate(emailContent, data.schoolName),
    tags: {
      type: 'sync_failure',
      school_id: schoolId,
      source: data.sourceName,
    },
  });

  return result;
}

// =============================================================================
// Notification Preferences Management
// =============================================================================

/**
 * Get notification preferences for a school
 */
export async function getNotificationPreferences(
  schoolId: string
): Promise<NotificationPreferences> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('school_notification_preferences')
    .select('*')
    .eq('school_id', schoolId)
    .single();

  if (error || !data) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return {
    risk_escalation_enabled: data.risk_escalation_enabled ?? true,
    risk_escalation_threshold: data.risk_escalation_threshold ?? 'critical',
    risk_escalation_recipients: data.risk_escalation_recipients ?? [],
    weekly_digest_enabled: data.weekly_digest_enabled ?? true,
    weekly_digest_day: data.weekly_digest_day ?? 'monday',
    weekly_digest_recipients: data.weekly_digest_recipients ?? [],
    parent_notifications_enabled: data.parent_notifications_enabled ?? false,
    parent_notification_types: data.parent_notification_types ?? ['risk_change'],
    sync_failure_alerts_enabled: data.sync_failure_alerts_enabled ?? true,
    sync_failure_recipients: data.sync_failure_recipients ?? [],
  };
}

/**
 * Update notification preferences for a school
 */
export async function updateNotificationPreferences(
  schoolId: string,
  preferences: Partial<NotificationPreferences>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminSupabaseClient();

  const { error } = await (supabase as any)
    .from('school_notification_preferences')
    .upsert({
      school_id: schoolId,
      ...preferences,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[Notifications] Error updating preferences:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
