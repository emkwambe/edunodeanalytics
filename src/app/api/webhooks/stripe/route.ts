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
import Stripe from 'stripe';
import { headers } from 'next/headers';

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
 * Handle checkout.session.completed
 * Create subscription record in database
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const schoolSlug = session.client_reference_id;
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const tier = session.metadata?.tier || 'starter';
  const studentCount = parseInt(session.metadata?.studentCount || '0', 10);

  console.log('Checkout completed:', {
    schoolSlug,
    subscriptionId,
    customerId,
    tier,
    studentCount,
  });

  // In production, update database:
  // await db.schools.update({
  //   where: { slug: schoolSlug },
  //   data: {
  //     stripeCustomerId: customerId,
  //     stripeSubscriptionId: subscriptionId,
  //     subscriptionTier: tier,
  //     subscriptionStatus: 'active',
  //     studentCount,
  //   },
  // });

  // Send welcome email, trigger onboarding, etc.
}

/**
 * Handle customer.subscription.updated
 * Update subscription tier/status in database
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const schoolSlug = subscription.metadata?.schoolSlug;
  const tier = subscription.metadata?.tier || 'starter';
  const status = subscription.status;

  console.log('Subscription updated:', {
    id: subscription.id,
    schoolSlug,
    tier,
    status,
  });

  // In production, update database:
  // await db.schools.update({
  //   where: { stripeSubscriptionId: subscription.id },
  //   data: {
  //     subscriptionTier: tier,
  //     subscriptionStatus: status,
  //     currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  //     cancelAtPeriodEnd: subscription.cancel_at_period_end,
  //   },
  // });
}

/**
 * Handle customer.subscription.deleted
 * Mark subscription as canceled in database
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  // In production, update database:
  // await db.schools.update({
  //   where: { stripeSubscriptionId: subscription.id },
  //   data: {
  //     subscriptionStatus: 'canceled',
  //     subscriptionTier: 'starter', // Downgrade to free tier
  //     canceledAt: new Date(),
  //   },
  // });
}

/**
 * Handle invoice.paid
 * Record successful payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Access subscription from invoice parent in newer Stripe API versions
  const invoiceData = invoice as unknown as {
    subscription?: string | { id: string };
    parent?: { subscription?: string | { id: string } };
    amount_paid?: number;
  };

  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id || invoiceData.parent?.subscription;
  const amountPaid = invoiceData.amount_paid || 0;

  console.log('Invoice paid:', {
    id: invoice.id,
    subscriptionId,
    amountPaid,
  });

  // In production, record payment:
  // await db.payments.create({
  //   data: {
  //     stripeInvoiceId: invoice.id,
  //     stripeSubscriptionId: subscriptionId,
  //     amount: amountPaid,
  //     currency: invoice.currency,
  //     status: 'paid',
  //     paidAt: new Date(),
  //   },
  // });
}

/**
 * Handle invoice.payment_failed
 * Notify school of failed payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Access properties with type assertion for newer Stripe API versions
  const invoiceData = invoice as unknown as {
    customer?: string | { id: string };
    subscription?: string | { id: string };
    parent?: { subscription?: string | { id: string } };
  };

  const customerId = typeof invoiceData.customer === 'string'
    ? invoiceData.customer
    : invoiceData.customer?.id;
  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription?.id || invoiceData.parent?.subscription;

  console.log('Invoice payment failed:', {
    id: invoice.id,
    customerId,
    subscriptionId,
  });

  // In production:
  // 1. Update subscription status
  // await db.schools.update({
  //   where: { stripeSubscriptionId: subscriptionId },
  //   data: { subscriptionStatus: 'past_due' },
  // });

  // 2. Send notification email
  // await sendPaymentFailedEmail(customerId, invoice);

  // 3. Create in-app notification
  // await createNotification({
  //   type: 'payment_failed',
  //   subscriptionId,
  //   message: 'Your payment failed. Please update your payment method.',
  // });
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
