/**
 * Subscription Management API
 * ============================
 *
 * Endpoints for managing school subscriptions via Stripe
 *
 * POST /api/subscriptions - Create a new subscription (checkout session)
 * GET /api/subscriptions - Get current subscription status
 * PATCH /api/subscriptions - Update subscription (change plan)
 * DELETE /api/subscriptions - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

// Initialize Stripe (will use env var in production)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Price IDs for each tier (configured in Stripe Dashboard)
const STRIPE_PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || 'price_starter_annual',
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_pro_annual',
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
    annual: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || 'price_enterprise_annual',
  },
};

// Per-student pricing for Professional tier
const PER_STUDENT_PRICE_ID = process.env.STRIPE_PER_STUDENT_PRICE_ID || 'price_per_student';

export interface SubscriptionResponse {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  tier: 'starter' | 'pro' | 'enterprise';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  studentCount: number;
  monthlyAmount: number;
}

/**
 * GET /api/subscriptions
 * Retrieve the current subscription for the authenticated school
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolSlug = request.nextUrl.searchParams.get('school');
    if (!schoolSlug) {
      return NextResponse.json({ error: 'School slug required' }, { status: 400 });
    }

    // In production, fetch from database
    // const subscription = await getSubscriptionBySchoolSlug(schoolSlug);

    // Mock response for development
    const mockSubscription: SubscriptionResponse = {
      id: 'sub_mock_123',
      status: 'active',
      tier: 'pro',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      studentCount: 450,
      monthlyAmount: 8125, // $7500/12 + $5*450/12
    };

    return NextResponse.json(mockSubscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions
 * Create a new Stripe Checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, billingPeriod, schoolSlug, studentCount, successUrl, cancelUrl } = body;

    if (!tier || !billingPeriod || !schoolSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: tier, billingPeriod, schoolSlug' },
        { status: 400 }
      );
    }

    if (!stripe) {
      // Return mock checkout URL for development
      return NextResponse.json({
        checkoutUrl: `${successUrl}?session_id=mock_session_${Date.now()}`,
        sessionId: `mock_session_${Date.now()}`,
      });
    }

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: STRIPE_PRICE_IDS[tier][billingPeriod as 'monthly' | 'annual'],
        quantity: 1,
      },
    ];

    // Add per-student pricing for Professional tier
    if (tier === 'pro' && studentCount) {
      lineItems.push({
        price: PER_STUDENT_PRICE_ID,
        quantity: studentCount,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: schoolSlug,
      metadata: {
        schoolSlug,
        tier,
        studentCount: studentCount?.toString() || '0',
      },
      subscription_data: {
        metadata: {
          schoolSlug,
          tier,
        },
        trial_period_days: 30,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true,
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subscriptions
 * Update subscription (upgrade/downgrade plan)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, newTier, billingPeriod, studentCount } = body as {
      subscriptionId: string;
      newTier: string;
      billingPeriod?: 'monthly' | 'annual';
      studentCount?: number;
    };

    if (!subscriptionId || !newTier) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, newTier' },
        { status: 400 }
      );
    }

    if (!stripe) {
      // Mock response for development
      return NextResponse.json({
        success: true,
        subscription: {
          id: subscriptionId,
          tier: newTier,
          status: 'active',
        },
      });
    }

    // Get the current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Prepare updated items
    const items: Stripe.SubscriptionUpdateParams.Item[] = [
      {
        id: subscription.items.data[0].id,
        price: STRIPE_PRICE_IDS[newTier][billingPeriod || 'annual'],
      },
    ];

    // Handle per-student pricing
    if (newTier === 'pro' && studentCount) {
      // Check if per-student item exists
      const perStudentItem = subscription.items.data.find(
        (item) => item.price.id === PER_STUDENT_PRICE_ID
      );

      if (perStudentItem) {
        items.push({
          id: perStudentItem.id,
          quantity: studentCount,
        });
      } else {
        items.push({
          price: PER_STUDENT_PRICE_ID,
          quantity: studentCount,
        });
      }
    }

    // Update the subscription
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items,
      proration_behavior: 'create_prorations',
      metadata: {
        tier: newTier,
        studentCount: studentCount?.toString() || '0',
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        tier: newTier,
        status: updatedSubscription.status,
      },
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscriptions
 * Cancel subscription (at period end)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, immediate } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required field: subscriptionId' },
        { status: 400 }
      );
    }

    if (!stripe) {
      // Mock response for development
      return NextResponse.json({
        success: true,
        canceledAt: immediate ? new Date().toISOString() : null,
        cancelAtPeriodEnd: !immediate,
      });
    }

    if (immediate) {
      // Cancel immediately
      const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      return NextResponse.json({
        success: true,
        canceledAt: new Date(canceledSubscription.canceled_at! * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      });
    } else {
      // Cancel at period end
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      // Access current_period_end from the subscription response
      const periodEnd = (updatedSubscription as unknown as { current_period_end: number }).current_period_end;
      return NextResponse.json({
        success: true,
        canceledAt: null,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(periodEnd * 1000).toISOString(),
      });
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
