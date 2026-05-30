/**
 * Slug Utility
 * ============
 *
 * Battle-tested slug generation and management.
 *
 * Features:
 * - Unicode/international text support via slugify library
 * - Collision detection with auto-suffix
 * - Reserved route protection
 * - Slug history tracking for redirects
 * - Immutable slugs option
 *
 * Best Practices Implemented:
 * - Uses slugify library (not naive regex)
 * - Database unique constraint enforced
 * - Handles é vs e+accent (Unicode normalization)
 * - Prevents route conflicts (admin, api, auth, etc.)
 */

import slugify from 'slugify';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// Reserved routes that slugs cannot use
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'login',
  'logout',
  'signup',
  'sign-in',
  'sign-up',
  'register',
  'settings',
  'dashboard',
  'account',
  'profile',
  'help',
  'support',
  'docs',
  'blog',
  'about',
  'contact',
  'pricing',
  'terms',
  'privacy',
  'security',
  'status',
  'health',
  'webhooks',
  'oauth',
  'callback',
  'sso',
  'saml',
  'oidc',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  '.well-known',
  'authorizer',
  'network',
  'select-school',
  'onboarding',
  'checkout',
  'demo',
  'static',
  'assets',
  '_next',
  'null',
  'undefined',
  'new',
  'edit',
  'delete',
  'create',
]);

// Slugify configuration
const SLUGIFY_CONFIG = {
  lower: true,
  strict: true, // Strip special characters
  locale: 'en',
  trim: true,
};

/**
 * Generate a URL-safe slug from text
 * Handles Unicode, special characters, and edge cases
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Slug input must be a non-empty string');
  }

  // Normalize Unicode (é vs e+accent issue)
  const normalized = text.normalize('NFKD');

  // Generate slug using battle-tested library
  let slug = slugify(normalized, SLUGIFY_CONFIG);

  // Handle empty result (e.g., pure emoji input)
  if (!slug) {
    slug = `item-${Date.now()}`;
  }

  // Ensure minimum length
  if (slug.length < 2) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  // Truncate if too long (URLs have practical limits)
  if (slug.length > 100) {
    slug = slug.slice(0, 100).replace(/-$/, '');
  }

  return slug;
}

/**
 * Check if a slug is reserved (would conflict with app routes)
 */
export function isReservedSlug(slug: string): boolean {
  const normalized = slug.toLowerCase().trim();
  return RESERVED_SLUGS.has(normalized);
}

/**
 * Generate a unique slug, adding suffix if collision exists
 */
export async function generateUniqueSlug(
  text: string,
  table: 'schools' | 'authorizers' | 'dashboard_configs',
  existingId?: string
): Promise<string> {
  const baseSlug = generateSlug(text);

  // Check if reserved
  if (isReservedSlug(baseSlug)) {
    return generateUniqueSlug(`${text} school`, table, existingId);
  }

  const supabase = createAdminSupabaseClient();
  let slug = baseSlug;
  let suffix = 0;
  const maxAttempts = 100;

  while (suffix < maxAttempts) {
    const candidateSlug = suffix === 0 ? slug : `${slug}-${suffix}`;

    // Check if slug exists
    let query = (supabase as any)
      .from(table)
      .select('id')
      .eq('slug', candidateSlug);

    // Exclude current record if updating
    if (existingId) {
      query = query.neq('id', existingId);
    }

    const { data } = await query.single();

    if (!data) {
      // Slug is available
      return candidateSlug;
    }

    suffix++;
  }

  // Fallback: append timestamp
  return `${baseSlug}-${Date.now().toString(36)}`;
}

/**
 * Validate a slug
 */
export function validateSlug(slug: string): {
  valid: boolean;
  error?: string;
} {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug is required' };
  }

  if (slug.length < 2) {
    return { valid: false, error: 'Slug must be at least 2 characters' };
  }

  if (slug.length > 100) {
    return { valid: false, error: 'Slug must be 100 characters or less' };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      valid: false,
      error: 'Slug must contain only lowercase letters, numbers, and hyphens',
    };
  }

  if (isReservedSlug(slug)) {
    return { valid: false, error: 'This slug is reserved' };
  }

  return { valid: true };
}

// =============================================================================
// Slug History & Redirects
// =============================================================================

export interface SlugHistoryEntry {
  id: string;
  entity_type: 'school' | 'authorizer';
  entity_id: string;
  old_slug: string;
  new_slug: string;
  changed_at: string;
  changed_by?: string;
}

/**
 * Record a slug change for redirect purposes
 */
export async function recordSlugChange(
  entityType: 'school' | 'authorizer',
  entityId: string,
  oldSlug: string,
  newSlug: string,
  changedBy?: string
): Promise<void> {
  const supabase = createAdminSupabaseClient();

  await (supabase as any).from('slug_history').insert({
    entity_type: entityType,
    entity_id: entityId,
    old_slug: oldSlug,
    new_slug: newSlug,
    changed_by: changedBy,
  });

  console.log(`[Slug] Recorded change: ${entityType} ${oldSlug} → ${newSlug}`);
}

/**
 * Look up current slug from an old slug (for redirects)
 */
export async function resolveSlugRedirect(
  entityType: 'school' | 'authorizer',
  slug: string
): Promise<string | null> {
  const supabase = createAdminSupabaseClient();

  // First, check if this is a current valid slug
  const table = entityType === 'school' ? 'schools' : 'authorizers';
  const { data: current } = await (supabase as any)
    .from(table)
    .select('slug')
    .eq('slug', slug)
    .single();

  if (current) {
    // It's a current slug, no redirect needed
    return null;
  }

  // Check slug history for redirect
  const { data: history } = await (supabase as any)
    .from('slug_history')
    .select('new_slug, entity_id')
    .eq('entity_type', entityType)
    .eq('old_slug', slug)
    .order('changed_at', { ascending: false })
    .limit(1)
    .single();

  if (!history) {
    return null;
  }

  // Get the current slug for this entity (in case it changed multiple times)
  const { data: entity } = await (supabase as any)
    .from(table)
    .select('slug')
    .eq('id', history.entity_id)
    .single();

  return entity?.slug || history.new_slug;
}

/**
 * Get full slug history for an entity
 */
export async function getSlugHistory(
  entityType: 'school' | 'authorizer',
  entityId: string
): Promise<SlugHistoryEntry[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('slug_history')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('changed_at', { ascending: false });

  if (error) {
    console.error('[Slug] Error fetching history:', error);
    return [];
  }

  return data || [];
}

// =============================================================================
// School-Specific Helpers
// =============================================================================

/**
 * Generate a unique school slug
 */
export async function generateSchoolSlug(name: string): Promise<string> {
  return generateUniqueSlug(name, 'schools');
}

/**
 * Update school slug with history tracking
 */
export async function updateSchoolSlug(
  schoolId: string,
  currentSlug: string,
  newSlug: string,
  changedBy?: string
): Promise<{ success: boolean; slug?: string; error?: string }> {
  // Validate new slug
  const validation = validateSlug(newSlug);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Check if new slug is available
  const supabase = createAdminSupabaseClient();
  const { data: existing } = await (supabase as any)
    .from('schools')
    .select('id')
    .eq('slug', newSlug)
    .neq('id', schoolId)
    .single();

  if (existing) {
    return { success: false, error: 'This slug is already in use' };
  }

  // Record the change in history
  await recordSlugChange('school', schoolId, currentSlug, newSlug, changedBy);

  // Update the slug
  const { error: updateError } = await (supabase as any)
    .from('schools')
    .update({ slug: newSlug, updated_at: new Date().toISOString() })
    .eq('id', schoolId);

  if (updateError) {
    console.error('[Slug] Error updating school slug:', updateError);
    return { success: false, error: 'Failed to update slug' };
  }

  return { success: true, slug: newSlug };
}

// =============================================================================
// Exports
// =============================================================================

export {
  RESERVED_SLUGS,
  SLUGIFY_CONFIG,
};
