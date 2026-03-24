import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { Payment, PaymentInsert } from '@/lib/database.types';

/**
 * Payment Queries
 *
 * Data access layer for payment records (Stripe invoices)
 */

/**
 * Create a payment record from Stripe invoice
 */
export async function createPayment(payment: PaymentInsert): Promise<Payment | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();

  if (error) {
    // Handle duplicate invoice (idempotency)
    if (error.code === '23505') {
      console.log('[DB] Payment already exists for invoice:', payment.stripe_invoice_id);
      // Return existing record
      const { data: existing } = await supabase
        .from('payments')
        .select('*')
        .eq('stripe_invoice_id', payment.stripe_invoice_id)
        .single();
      return existing;
    }
    console.error('[DB] Error creating payment:', error);
    return null;
  }

  console.log('[DB] Created payment record:', {
    id: data.id,
    invoiceId: data.stripe_invoice_id,
    amount: data.amount,
  });

  return data;
}

/**
 * Get payment by Stripe invoice ID
 */
export async function getPaymentByInvoiceId(invoiceId: string): Promise<Payment | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('stripe_invoice_id', invoiceId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching payment by invoice ID:', error);
    }
    return null;
  }

  return data;
}

/**
 * Get payments for a school
 */
export async function getPaymentsBySchoolId(
  schoolId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: Payment['status'];
  }
): Promise<Payment[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('payments')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DB] Error fetching payments for school:', error);
    return [];
  }

  return data;
}

/**
 * Update payment status (e.g., for refunds)
 */
export async function updatePaymentStatus(
  invoiceId: string,
  status: Payment['status'],
  refundedAt?: Date
): Promise<Payment | null> {
  const supabase = createAdminSupabaseClient();

  const updates: Partial<Payment> = { status };
  if (refundedAt) {
    updates.refunded_at = refundedAt.toISOString();
  }

  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('stripe_invoice_id', invoiceId)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating payment status:', error);
    return null;
  }

  return data;
}

/**
 * Get total revenue for a school
 */
export async function getSchoolRevenue(
  schoolId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ total: number; count: number }> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('payments')
    .select('amount')
    .eq('school_id', schoolId)
    .eq('status', 'paid');

  if (options?.startDate) {
    query = query.gte('paid_at', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('paid_at', options.endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DB] Error calculating school revenue:', error);
    return { total: 0, count: 0 };
  }

  const total = data.reduce((sum, p) => sum + p.amount, 0);
  return { total, count: data.length };
}
