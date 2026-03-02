/**
 * Email Templates
 * ===============
 *
 * Pre-built email templates for common notifications.
 */

import {
  sendEmail,
  wrapEmailTemplate,
  htmlToPlainText,
  type EmailResult,
  type EmailRecipient,
} from '../service';

// =============================================================================
// Payment Emails
// =============================================================================

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(
  to: EmailRecipient,
  params: {
    schoolName: string;
    amount: number;
    currency: string;
    invoiceUrl?: string;
    periodEnd: string;
  }
): Promise<EmailResult> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: params.currency,
  }).format(params.amount / 100);

  const html = wrapEmailTemplate(
    `
    <h1>Payment Successful</h1>
    <div class="alert-success">
      <p style="margin: 0;"><strong>Amount:</strong> ${formattedAmount}</p>
    </div>
    <p>Thank you for your payment! Your subscription is active until <strong>${params.periodEnd}</strong>.</p>
    ${params.invoiceUrl ? `<p><a href="${params.invoiceUrl}" class="button">View Invoice</a></p>` : ''}
    <p>If you have any questions about your billing, please contact our support team.</p>
  `,
    params.schoolName
  );

  return sendEmail({
    to,
    subject: `Payment Receipt - ${formattedAmount}`,
    html,
    text: htmlToPlainText(html),
    tags: { type: 'payment_success' },
  });
}

/**
 * Send payment failure email
 */
export async function sendPaymentFailureEmail(
  to: EmailRecipient,
  params: {
    schoolName: string;
    amount: number;
    currency: string;
    reason: string;
    retryDate?: string;
    updatePaymentUrl: string;
  }
): Promise<EmailResult> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: params.currency,
  }).format(params.amount / 100);

  const html = wrapEmailTemplate(
    `
    <h1>Payment Failed</h1>
    <div class="alert-error">
      <p style="margin: 0;"><strong>Amount:</strong> ${formattedAmount}</p>
      <p style="margin: 8px 0 0;"><strong>Reason:</strong> ${params.reason}</p>
    </div>
    <p>We were unable to process your payment. Please update your payment method to avoid service interruption.</p>
    ${params.retryDate ? `<p>We will automatically retry the payment on <strong>${params.retryDate}</strong>.</p>` : ''}
    <p><a href="${params.updatePaymentUrl}" class="button">Update Payment Method</a></p>
    <p>If you believe this is an error, please contact your bank or our support team.</p>
  `,
    params.schoolName
  );

  return sendEmail({
    to,
    subject: `Action Required: Payment Failed`,
    html,
    text: htmlToPlainText(html),
    tags: { type: 'payment_failure' },
  });
}

// =============================================================================
// Subscription Emails
// =============================================================================

/**
 * Send subscription expiring warning
 */
export async function sendSubscriptionExpiringEmail(
  to: EmailRecipient,
  params: {
    schoolName: string;
    tier: string;
    expiresAt: string;
    daysRemaining: number;
    renewUrl: string;
  }
): Promise<EmailResult> {
  const html = wrapEmailTemplate(
    `
    <h1>Subscription Expiring Soon</h1>
    <div class="alert-warning">
      <p style="margin: 0;">Your <strong>${params.tier}</strong> subscription will expire in <strong>${params.daysRemaining} days</strong> on ${params.expiresAt}.</p>
    </div>
    <p>To continue using all features without interruption, please renew your subscription.</p>
    <p><a href="${params.renewUrl}" class="button">Renew Subscription</a></p>
    <p>If you have any questions, our team is here to help.</p>
  `,
    params.schoolName
  );

  return sendEmail({
    to,
    subject: `Your Subscription Expires in ${params.daysRemaining} Days`,
    html,
    text: htmlToPlainText(html),
    tags: { type: 'subscription_expiring' },
  });
}

/**
 * Send subscription canceled confirmation
 */
export async function sendSubscriptionCanceledEmail(
  to: EmailRecipient,
  params: {
    schoolName: string;
    tier: string;
    accessUntil: string;
    reactivateUrl: string;
  }
): Promise<EmailResult> {
  const html = wrapEmailTemplate(
    `
    <h1>Subscription Canceled</h1>
    <p>Your <strong>${params.tier}</strong> subscription has been canceled.</p>
    <p>You will continue to have access to your current plan until <strong>${params.accessUntil}</strong>.</p>
    <p>After that date, your account will revert to the Starter plan with limited features.</p>
    <p><a href="${params.reactivateUrl}" class="button">Reactivate Subscription</a></p>
    <p>We'd love to have you back! If you canceled by mistake or have feedback, please let us know.</p>
  `,
    params.schoolName
  );

  return sendEmail({
    to,
    subject: `Subscription Canceled - Access Until ${params.accessUntil}`,
    html,
    text: htmlToPlainText(html),
    tags: { type: 'subscription_canceled' },
  });
}

// =============================================================================
// Intervention Emails
// =============================================================================

/**
 * Send stale interventions alert
 */
export async function sendStaleInterventionsEmail(
  to: EmailRecipient,
  params: {
    schoolName: string;
    interventions: Array<{
      studentName: string;
      interventionType: string;
      daysSinceUpdate: number;
    }>;
    dashboardUrl: string;
  }
): Promise<EmailResult> {
  const interventionList = params.interventions
    .map(
      (i) => `
      <li>
        <strong>${i.studentName}</strong> - ${i.interventionType}
        <br><span style="color: #6b7280; font-size: 14px;">No update for ${i.daysSinceUpdate} days</span>
      </li>
    `
    )
    .join('');

  const html = wrapEmailTemplate(
    `
    <h1>Interventions Need Attention</h1>
    <div class="alert-warning">
      <p style="margin: 0;"><strong>${params.interventions.length}</strong> intervention(s) haven't been updated recently.</p>
    </div>
    <h2>Interventions Requiring Review:</h2>
    <ul>
      ${interventionList}
    </ul>
    <p><a href="${params.dashboardUrl}" class="button">Review Interventions</a></p>
    <p>Regular updates help track student progress and ensure timely support.</p>
  `,
    params.schoolName
  );

  return sendEmail({
    to,
    subject: `${params.interventions.length} Intervention(s) Need Attention`,
    html,
    text: htmlToPlainText(html),
    tags: { type: 'stale_interventions' },
  });
}

/**
 * Send intervention assigned notification
 */
export async function sendInterventionAssignedEmail(
  to: EmailRecipient,
  params: {
    schoolName: string;
    studentName: string;
    interventionType: string;
    priority: string;
    assignedBy: string;
    notes?: string;
    viewUrl: string;
  }
): Promise<EmailResult> {
  const priorityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };

  const html = wrapEmailTemplate(
    `
    <h1>New Intervention Assigned</h1>
    <p>You have been assigned a new intervention:</p>
    <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px;"><strong>Student:</strong> ${params.studentName}</p>
      <p style="margin: 0 0 8px;"><strong>Type:</strong> ${params.interventionType}</p>
      <p style="margin: 0 0 8px;"><strong>Priority:</strong> <span style="color: ${priorityColors[params.priority] || '#6b7280'}">${params.priority.toUpperCase()}</span></p>
      <p style="margin: 0;"><strong>Assigned by:</strong> ${params.assignedBy}</p>
    </div>
    ${params.notes ? `<p><strong>Notes:</strong> ${params.notes}</p>` : ''}
    <p><a href="${params.viewUrl}" class="button">View Intervention</a></p>
  `,
    params.schoolName
  );

  return sendEmail({
    to,
    subject: `[${params.priority.toUpperCase()}] New Intervention: ${params.studentName}`,
    html,
    text: htmlToPlainText(html),
    tags: { type: 'intervention_assigned', priority: params.priority },
  });
}

// =============================================================================
// System Emails
// =============================================================================

/**
 * Send data sync failure alert
 */
export async function sendSyncFailureEmail(
  to: EmailRecipient,
  params: {
    schoolName: string;
    sourceName: string;
    errorMessage: string;
    lastSuccessfulSync?: string;
    settingsUrl: string;
  }
): Promise<EmailResult> {
  const html = wrapEmailTemplate(
    `
    <h1>Data Sync Failed</h1>
    <div class="alert-error">
      <p style="margin: 0;"><strong>Source:</strong> ${params.sourceName}</p>
      <p style="margin: 8px 0 0;"><strong>Error:</strong> ${params.errorMessage}</p>
    </div>
    ${params.lastSuccessfulSync ? `<p>Last successful sync: ${params.lastSuccessfulSync}</p>` : ''}
    <p>Please check your integration settings and credentials.</p>
    <p><a href="${params.settingsUrl}" class="button">Check Settings</a></p>
    <p>If the problem persists, contact our support team for assistance.</p>
  `,
    params.schoolName
  );

  return sendEmail({
    to,
    subject: `Data Sync Failed: ${params.sourceName}`,
    html,
    text: htmlToPlainText(html),
    tags: { type: 'sync_failure', source: params.sourceName },
  });
}

/**
 * Send welcome email for new school
 */
export async function sendWelcomeEmail(
  to: EmailRecipient,
  params: {
    schoolName: string;
    userName: string;
    dashboardUrl: string;
    setupGuideUrl: string;
  }
): Promise<EmailResult> {
  const html = wrapEmailTemplate(
    `
    <h1>Welcome to EduNode Analytics!</h1>
    <p>Hi ${params.userName},</p>
    <p>Thank you for creating your account for <strong>${params.schoolName}</strong>. We're excited to help you support student success!</p>
    <h2>Getting Started</h2>
    <ul>
      <li>Connect your SIS to automatically sync student data</li>
      <li>Set up assessment integrations for progress tracking</li>
      <li>Create your first intervention plan</li>
      <li>Invite your team members</li>
    </ul>
    <p><a href="${params.setupGuideUrl}" class="button">View Setup Guide</a></p>
    <p style="margin-top: 16px;"><a href="${params.dashboardUrl}" style="color: #6366f1;">Go to Dashboard</a></p>
    <p>Need help? Our support team is available to assist you every step of the way.</p>
  `,
    params.schoolName
  );

  return sendEmail({
    to,
    subject: `Welcome to EduNode Analytics, ${params.userName}!`,
    html,
    text: htmlToPlainText(html),
    tags: { type: 'welcome' },
  });
}
