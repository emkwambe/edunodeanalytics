-- ==============================================
-- Sprint 18: Production Billing - Stripe Integration
-- Adds Stripe subscription fields and payment tracking
-- ==============================================

-- ==============================================
-- ALTER SCHOOLS TABLE - Add Stripe fields
-- ==============================================

-- Stripe customer and subscription IDs
ALTER TABLE schools ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

-- Subscription billing period
ALTER TABLE schools ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Cancellation tracking
ALTER TABLE schools ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Student count for per-student billing
ALTER TABLE schools ADD COLUMN IF NOT EXISTS student_count INTEGER NOT NULL DEFAULT 0;

-- Indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_schools_stripe_customer ON schools(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schools_stripe_subscription ON schools(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- ==============================================
-- PAYMENTS TABLE - Track payment history
-- ==============================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Relationships
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Stripe identifiers
    stripe_invoice_id TEXT NOT NULL UNIQUE,
    stripe_subscription_id TEXT,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,

    -- Payment details
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed', 'refunded', 'partially_refunded')),

    -- Invoice details
    invoice_number TEXT,
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,

    -- Period covered
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,

    -- Subscription tier at time of payment
    subscription_tier subscription_tier,
    student_count INTEGER,

    -- Timestamps
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,

    -- Additional metadata
    metadata JSONB
);

CREATE INDEX idx_payments_school ON payments(school_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_payments_stripe_subscription ON payments(stripe_subscription_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: School admins can view their school's payments
CREATE POLICY "School admins can view their payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM school_memberships sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.school_id = payments.school_id
            AND u.clerk_user_id = auth.uid()::TEXT
            AND sm.role IN ('school_admin', 'principal')
            AND sm.is_active = TRUE
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.clerk_user_id = auth.uid()::TEXT
            AND u.platform_role IS NOT NULL
        )
    );

-- ==============================================
-- WEBHOOK_EVENTS TABLE - Idempotency tracking
-- ==============================================

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Event identification
    event_id TEXT NOT NULL UNIQUE, -- Stripe event ID (evt_xxx)
    event_type TEXT NOT NULL,

    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    processed_at TIMESTAMPTZ,

    -- Error tracking
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,

    -- Event payload (for debugging/replay)
    payload JSONB NOT NULL,

    -- Processing result
    result JSONB
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_created ON webhook_events(created_at DESC);
CREATE INDEX idx_webhook_events_status ON webhook_events(status) WHERE status != 'processed';

-- Enable RLS (platform admins only)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view webhook events"
    ON webhook_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.clerk_user_id = auth.uid()::TEXT
            AND u.platform_role = 'platform_admin'
        )
    );

-- ==============================================
-- TRIGGER: Update payments updated_at
-- ==============================================

-- Note: payments table uses created_at only (immutable after creation)

-- ==============================================
-- FUNCTION: Get school by Stripe customer ID
-- ==============================================

CREATE OR REPLACE FUNCTION get_school_by_stripe_customer(customer_id TEXT)
RETURNS UUID AS $$
    SELECT id FROM schools WHERE stripe_customer_id = customer_id LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ==============================================
-- FUNCTION: Get school by Stripe subscription ID
-- ==============================================

CREATE OR REPLACE FUNCTION get_school_by_stripe_subscription(subscription_id TEXT)
RETURNS UUID AS $$
    SELECT id FROM schools WHERE stripe_subscription_id = subscription_id LIMIT 1;
$$ LANGUAGE SQL STABLE;
