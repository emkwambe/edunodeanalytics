/**
 * Email Service
 * =============
 *
 * Sends transactional emails via Resend API.
 *
 * Features:
 * - Template-based email rendering
 * - School branding support
 * - Batch sending for bulk notifications
 * - Delivery tracking
 * - Rate limiting (100 emails/second)
 *
 * Email Types:
 * - Payment notifications (success, failure, refund)
 * - Subscription alerts (expiring, expired, upgraded)
 * - Intervention alerts (stale, assigned, completed)
 * - System notifications (sync failures, security alerts)
 *
 * Setup:
 * - Set RESEND_API_KEY environment variable
 * - Configure FROM_EMAIL for your domain
 */

import { captureException } from '@/lib/monitoring/sentry';

// Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'EduNode Analytics <noreply@edunode.app>';
const IS_EMAIL_ENABLED = !!RESEND_API_KEY;

// Rate limiting
const RATE_LIMIT_PER_SECOND = 100;
let emailsSentThisSecond = 0;
let lastSecondTimestamp = Date.now();

// Types
export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Check rate limit and wait if necessary
 */
async function checkRateLimit(): Promise<void> {
  const now = Date.now();

  if (now - lastSecondTimestamp >= 1000) {
    // Reset counter for new second
    emailsSentThisSecond = 0;
    lastSecondTimestamp = now;
  }

  if (emailsSentThisSecond >= RATE_LIMIT_PER_SECOND) {
    // Wait until next second
    const waitTime = 1000 - (now - lastSecondTimestamp);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    emailsSentThisSecond = 0;
    lastSecondTimestamp = Date.now();
  }

  emailsSentThisSecond++;
}

/**
 * Send an email via Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  if (!IS_EMAIL_ENABLED) {
    console.log('[Email Mock] Would send email:', {
      to: options.to,
      subject: options.subject,
    });
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  await checkRateLimit();

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        cc: options.cc?.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
        bcc: options.bcc?.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content:
            typeof a.content === 'string' ? a.content : a.content.toString('base64'),
          type: a.contentType,
        })),
        tags: options.tags
          ? Object.entries(options.tags).map(([name, value]) => ({ name, value }))
          : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as { message?: string }).message || `HTTP ${response.status}`;
      throw new Error(`Resend API error: ${errorMessage}`);
    }

    const data = await response.json();

    return {
      success: true,
      messageId: (data as { id?: string }).id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown email error';
    console.error('[Email] Send failed:', errorMessage);
    captureException(error, { emailSubject: options.subject });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send multiple emails in batch
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);
  }

  return results;
}

// =============================================================================
// Email Template Helpers
// =============================================================================

/**
 * Base email wrapper with EduNode branding
 */
export function wrapEmailTemplate(content: string, schoolName?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduNode Analytics</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 32px;
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #6366f1;
    }
    .footer {
      text-align: center;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      margin-top: 24px;
      font-size: 12px;
      color: #6b7280;
    }
    .button {
      display: inline-block;
      background: #6366f1;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      margin: 16px 0;
    }
    .button:hover {
      background: #4f46e5;
    }
    .alert-warning {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
    }
    .alert-error {
      background: #fee2e2;
      border: 1px solid #ef4444;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
    }
    .alert-success {
      background: #d1fae5;
      border: 1px solid #10b981;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
    }
    h1 { font-size: 24px; margin: 0 0 16px; }
    h2 { font-size: 20px; margin: 0 0 12px; }
    p { margin: 0 0 16px; }
    ul { padding-left: 20px; margin: 0 0 16px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">EduNode Analytics</div>
        ${schoolName ? `<div style="color: #6b7280; margin-top: 8px;">${schoolName}</div>` : ''}
      </div>
      ${content}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} EduNode Analytics. All rights reserved.</p>
        <p>
          <a href="https://edunode.app/help" style="color: #6366f1;">Help Center</a> |
          <a href="https://edunode.app/privacy" style="color: #6366f1;">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Convert HTML to plain text (basic)
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export { IS_EMAIL_ENABLED };
