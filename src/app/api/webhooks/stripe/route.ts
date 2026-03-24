/**
 * Stripe Webhook Handler
 * ======================
 *
 * Handles Stripe webhook events for subscription lifecycle management.
 *
 * Events handled:
 * - checkout.session.completed - New subscription created
 * - customer.subscription.updated - Subscription modified (upgrade/downgrade)
 * - customer.subscription.deleted - Subscription canceled
 * - invoice.paid - Successful payment
 * - invoice.payment_failed - Failed payment
 *
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import {
  updateSchoolSubscriptionBySlug,
  updateSchoolSubscriptionByStripeId,
  getSchoolByStripeSubscriptionId,
} from '@/lib/db/queries/schools';
import { createPayment } from '@/lib/db/queries/payments';
import {
  startEventProcessing,
  markEventProcessed,
  markEventFailed,
} from '@/lib/db/queries/webhook-events';
import { createNotification } from '@/lib/db/queries/notifications';
import {
  sendPaymentFailureEmail,
  sendPaymentSuccessEmail,
} from '@/lib/email/templates';
import { captureException } from '@/lib/monitoring/sentry';
import type { Json } from '@/lib/database.types';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';

/**
 * Verify Stripe webhook signature
 */
async function verifySignature(
  request: NextRequest
): Promise<Stripe.Event | null> {
  if (!stripe || !webhookSecret) {
    console.warn('Stripe not configured for webhooks');
    return null;
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing Stripe signature header');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return null;
  }
}

/**
 * Map Stripe subscription status to our status enum
 */
function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): 'active' | 'trialing' | 'past_due' | 'canceled' {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
    default:
      return 'canceled';
  }
}

/**
 * Map tier from metadata or price lookup
 */
function getTierFromMetadata(
  metadata?: Stripe.Metadata | null
): 'starter' | 'pro' | 'enterprise' {
  const tier = metadata?.tier;
  if (tier === 'pro' || tier === 'enterprise' || tier === 'starter') {
    return tier;
  }
  return 'starter';
}

/**
 * Handle checkout.session.completed
 * Create subscription record in database
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const schoolSlug = session.client_reference_id;
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const tier = getTierFromMetadata(session.metadata);
  const studentCount = parseInt(session.metadata?.studentCount || '0', 10);

  console.log('Checkout completed:', {
    schoolSlug,
    subscriptionId,
    customerId,
    tier,
    studentCount,
  });

  if (!schoolSlug) {
    console.error('[Webhook] No school slug in checkout session');
    return;
  }

  // Update school with subscription details
  const school = await updateSchoolSubscriptionBySlug(schoolSlug, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionTier: tier,
    subscriptionStatus: 'active',
    studentCount,
  });

  if (!school) {
    console.error('[Webhook] Failed to update school after checkout:', schoolSlug);
    return;
  }

  console.log('[Webhook] School subscription activated:', {
    schoolId: school.id,
    schoolSlug,
    tier,
  });
}

/**
 * Handle customer.subscription.updated
 * Update subscription tier/status in database
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const tier = getTierFromMetadata(subscription.metadata);
  const status = mapSubscriptionStatus(subscription.status);

  console.log('Subscription updated:', {
    id: subscription.id,
    tier,
    status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // Get current_period_end from subscription
  const currentPeriodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;

  const school = await updateSchoolSubscriptionByStripeId(subscription.id, {
    subscriptionTier: tier,
    subscriptionStatus: status,
    currentPeriodEnd: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000)
      : undefined,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  if (!school) {
    console.error('[Webhook] Failed to update subscription:', subscription.id);
    return;
  }

  console.log('[Webhook] School subscription updated:', {
    schoolId: school.id,
    tier,
    status,
  });
}

/**
 * Handle customer.subscription.deleted
 * Mark subscription as canceled in database
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('Subscription deleted:', subscription.id);

  const school = await updateSchoolSubscriptionByStripeId(subscription.id, {
    subscriptionStatus: 'canceled',
    subscriptionTier: 'starter', // Downgrade to free tier
    canceledAt: new Date(),
    cancelAtPeriodEnd: false,
  });

  if (!school) {
    console.error('[Webhook] Failed to mark subscription as deleted:', subscription.id);
    return;
  }

  console.log('[Webhook] School subscription canceled:', {
    schoolId: school.id,
    previousTier: subscription.metadata?.tier,
  });
}

/**
 * Handle invoice.paid
 * Record successful payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // Access subscription from invoice
  const invoiceData = invoice as unknown as {
    subscription?: string | { id: string };
    parent?: { subscription?: string | { id: string } };
    amount_paid?: number;
    invoice_pdf?: string;
    hosted_invoice_url?: string;
    period_start?: number;
    period_end?: number;
    number?: string;
    payment_intent?: string | { id: string };
    charge?: string | { id: string };
  };

  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id ||
      (typeof invoiceData.parent?.subscription === 'string'
        ? invoiceData.parent?.subscription
        : invoiceData.parent?.subscription?.id);
  const amountPaid = invoiceData.amount_paid || 0;

  console.log('Invoice paid:', {
    id: invoice.id,
    subscriptionId,
    amountPaid,
  });

  if (!subscriptionId) {
    console.log('[Webhook] Invoice has no subscription, skipping payment record');
    return;
  }

  // Get school from subscription
  const school = await getSchoolByStripeSubscriptionId(subscriptionId);
  if (!school) {
    console.error('[Webhook] No school found for subscription:', subscriptionId);
    return;
  }

  // Create payment record
  const paymentIntentId = typeof invoiceData.payment_intent === 'string'
    ? invoiceData.payment_intent
    : invoiceData.payment_intent?.id;
  const chargeId = typeof invoiceData.charge === 'string'
    ? invoiceData.charge
    : invoiceData.charge?.id;

  const payment = await createPayment({
    school_id: school.id,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    stripe_payment_intent_id: paymentIntentId ?? null,
    stripe_charge_id: chargeId ?? null,
    amount: amountPaid,
    currency: invoice.currency || 'usd',
    status: 'paid',
    invoice_number: invoiceData.number ?? null,
    invoice_pdf_url: invoiceData.invoice_pdf ?? null,
    hosted_invoice_url: invoiceData.hosted_invoice_url ?? null,
    period_start: invoiceData.period_start
      ? new Date(invoiceData.period_start * 1000).toISOString()
      : null,
    period_end: invoiceData.period_end
      ? new Date(invoiceData.period_end * 1000).toISOString()
      : null,
    subscription_tier: school.subscription_tier,
    student_count: school.student_count,
    paid_at: new Date().toISOString(),
  });

  if (payment) {
    console.log('[Webhook] Payment record created:', payment.id);

    // Send payment success email
    const adminEmail = school.contact_email || null;
    if (adminEmail) {
      try {
        // Get period end for email
        const periodEnd = invoiceData.period_end
          ? new Date(invoiceData.period_end * 1000).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          : 'your next billing date';

        const emailResult = await sendPaymentSuccessEmail(
          { email: adminEmail, name: school.name },
          {
            schoolName: school.name,
            amount: amountPaid,
            currency: invoice.currency || 'usd',
            invoiceUrl: invoiceData.hosted_invoice_url || undefined,
            periodEnd,
          }
        );

        if (emailResult.success) {
          console.log('[Webhook] Payment success email sent to:', adminEmail);
        }
      } catch (emailError) {
        console.error('[Webhook] Failed to send payment success email:', emailError);
        captureException(emailError, { schoolId: school.id, paymentId: payment.id });
      }
    }
  }
}

/**
 * Handle invoice.payment_failed
 * Notify school of failed payment via email and in-app notification
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  // Access properties with type assertion for newer Stripe API versions
  const invoiceData = invoice as unknown as {
    customer?: string | { id: string };
    subscription?: string | { id: string };
    parent?: { subscription?: string | { id: string } };
    amount_due?: number;
    next_payment_attempt?: number | null;
  };

  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id ||
      (typeof invoiceData.parent?.subscription === 'string'
        ? invoiceData.parent?.subscription
        : invoiceData.parent?.subscription?.id);

  console.log('Invoice payment failed:', {
    id: invoice.id,
    subscriptionId,
  });

  if (!subscriptionId) {
    console.log('[Webhook] Failed invoice has no subscription, skipping');
    return;
  }

  // Get school from subscription
  const school = await getSchoolByStripeSubscriptionId(subscriptionId);
  if (!school) {
    console.error('[Webhook] No school found for subscription:', subscriptionId);
    return;
  }

  // Update subscription status to past_due
  await updateSchoolSubscriptionByStripeId(subscriptionId, {
    subscriptionStatus: 'past_due',
  });

  console.log('[Webhook] School marked as past_due:', school.id);

  // Get payment failure reason from invoice
  const failureReason = 'Your card was declined. Please update your payment method.';
  const amountDue = invoiceData.amount_due || 0;
  const nextRetry = invoiceData.next_payment_attempt
    ? new Date(invoiceData.next_payment_attempt * 1000).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined;

  // Send email notification to school contact
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.edunode.io';
  const updatePaymentUrl = `${baseUrl}/${school.slug}/settings/billing`;

  // Get school admin email - in production, query users table for school admins
  // For now, we'll use the school's contact email if available
  const adminEmail = school.contact_email || null;

  if (adminEmail) {
    try {
      const emailResult = await sendPaymentFailureEmail(
        { email: adminEmail, name: school.name },
        {
          schoolName: school.name,
          amount: amountDue,
          currency: invoice.currency || 'usd',
          reason: failureReason,
          retryDate: nextRetry,
          updatePaymentUrl,
        }
      );

      if (emailResult.success) {
        console.log('[Webhook] Payment failure email sent to:', adminEmail);
      } else {
        console.error('[Webhook] Failed to send payment failure email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('[Webhook] Exception sending payment failure email:', emailError);
      captureException(emailError, { schoolId: school.id, invoiceId: invoice.id });
    }
  } else {
    console.warn('[Webhook] No contact email for school:', school.id);
  }

  // Create in-app notification for school admins
  try {
    await createNotification({
      school_id: school.id,
      user_id: school.id, // Placeholder - should be school admin user ID
      type: 'alert',
      priority: 'urgent',
      title: 'Payment Failed',
      message: 'Your subscription payment has failed. Please update your payment method to continue using all features.',
      action_url: '/settings/billing',
      action_label: 'Update Payment Method',
    });
    console.log('[Webhook] Payment failed notification created for school:', school.id);
  } catch (err) {
    console.error('[Webhook] Failed to create payment notification:', err);
  }
}

/**
 * POST /api/webhooks/stripe
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  // For development without Stripe, return success
  if (!stripe || !webhookSecret) {
    console.log('Stripe webhooks not configured - skipping');
    return NextResponse.json({ received: true });
  }

  const event = await verifySignature(request);

  if (!event) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Idempotency check - prevent duplicate processing
  const canProcess = await startEventProcessing(
    event.id,
    event.type,
    event.data.object as unknown as Json
  );

  if (!canProcess) {
    console.log('[Webhook] Event already processed or processing:', event.id);
    return NextResponse.json({ received: true, status: 'already_processed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await markEventProcessed(event.id, { success: true });

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing webhook:', error);

    // Mark event as failed for potential retry
    await markEventFailed(event.id, errorMessage);

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
