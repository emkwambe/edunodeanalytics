/**
 * Stripe Billing Portal API
 * =========================
 *
 * Creates a Stripe Billing Portal session for customers to manage
 * their subscription, payment methods, and invoices.
 *
 * POST /api/subscriptions/portal - Create portal session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * POST /api/subscriptions/portal
 * Create a Stripe Billing Portal session
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, returnUrl } = body;

    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Missing required field: returnUrl' },
        { status: 400 }
      );
    }

    if (!stripe) {
      // Return mock portal URL for development
      return NextResponse.json({
        portalUrl: returnUrl,
        message: 'Stripe not configured - redirecting to settings',
      });
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer ID found for this school' },
        { status: 400 }
      );
    }

    // Create Billing Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({
      portalUrl: portalSession.url,
    });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
