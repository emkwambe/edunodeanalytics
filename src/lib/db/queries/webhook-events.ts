import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { WebhookEvent, Json } from '@/lib/database.types';

/**
 * Webhook Events Queries
 *
 * Idempotency tracking for Stripe webhooks
 */

/**
 * Check if a webhook event has already been processed
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('webhook_events')
    .select('status')
    .eq('event_id', eventId)
    .single();

  if (error) {
    // No record found = not processed
    if (error.code === 'PGRST116') {
      return false;
    }
    console.error('[DB] Error checking webhook event:', error);
    return false;
  }

  // Already processed or currently being processed
  return data.status === 'processed' || data.status === 'processing';
}

/**
 * Start processing a webhook event (idempotency lock)
 * Returns false if event is already being processed
 */
export async function startEventProcessing(
  eventId: string,
  eventType: string,
  payload: Json
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from('webhook_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      status: 'processing',
      payload,
    });

  if (error) {
    // Unique constraint violation = already exists
    if (error.code === '23505') {
      console.log('[Webhook] Event already being processed:', eventId);
      return false;
    }
    console.error('[DB] Error starting webhook event processing:', error);
    return false;
  }

  return true;
}

/**
 * Mark event as successfully processed
 */
export async function markEventProcessed(
  eventId: string,
  result?: Json
): Promise<void> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from('webhook_events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      result,
    })
    .eq('event_id', eventId);

  if (error) {
    console.error('[DB] Error marking webhook event as processed:', error);
  }
}

/**
 * Mark event as failed
 */
export async function markEventFailed(
  eventId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createAdminSupabaseClient();

  // Increment retry count
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('retry_count')
    .eq('event_id', eventId)
    .single();

  const retryCount = (existing?.retry_count || 0) + 1;

  const { error } = await supabase
    .from('webhook_events')
    .update({
      status: 'failed',
      error_message: errorMessage,
      retry_count: retryCount,
    })
    .eq('event_id', eventId);

  if (error) {
    console.error('[DB] Error marking webhook event as failed:', error);
  }
}

/**
 * Get recent webhook events (for debugging/monitoring)
 */
export async function getRecentWebhookEvents(
  limit: number = 50
): Promise<WebhookEvent[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[DB] Error fetching recent webhook events:', error);
    return [];
  }

  return data;
}

/**
 * Get failed webhook events for retry
 */
export async function getFailedWebhookEvents(
  maxRetries: number = 3
): Promise<WebhookEvent[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('webhook_events')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', maxRetries)
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error('[DB] Error fetching failed webhook events:', error);
    return [];
  }

  return data;
}
