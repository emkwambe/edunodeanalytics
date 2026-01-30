import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { School, SchoolInsert, SchoolUpdate } from '@/lib/database.types';
import { getCurrentTenantSlug } from '@/lib/auth/rbac';

/**
 * School Queries
 *
 * Data access layer for school/tenant operations
 */

/**
 * Get school by slug (most common query pattern)
 */
export async function getSchoolBySlug(slug: string): Promise<School | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[DB] Error fetching school by slug:', error);
    return null;
  }

  return data;
}

/**
 * Get school by ID
 */
export async function getSchoolById(id: string): Promise<School | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[DB] Error fetching school by ID:', error);
    return null;
  }

  return data;
}

/**
 * Get the current tenant's school (from middleware context)
 */
export async function getCurrentSchool(): Promise<School | null> {
  const slug = getCurrentTenantSlug();
  if (!slug) return null;
  return getSchoolBySlug(slug);
}

/**
 * Get school's white-label configuration
 */
export async function getSchoolBranding(slug: string) {
  const school = await getSchoolBySlug(slug);

  if (!school) {
    return {
      name: 'EduNode Analytics',
      logoUrl: '/edunode-logo.svg',
      primaryColor: '#6366f1',
      secondaryColor: '#06b6d4',
      accentColor: '#10b981',
    };
  }

  return {
    name: school.name,
    logoUrl: school.logo_url || '/edunode-logo.svg',
    primaryColor: school.primary_color,
    secondaryColor: school.secondary_color,
    accentColor: school.accent_color,
  };
}

/**
 * Get all schools a user has access to
 */
export async function getSchoolsForUser(userId: string): Promise<School[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('school_memberships')
    .select(`
      school:schools(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('[DB] Error fetching schools for user:', error);
    return [];
  }

  return data
    .map((membership) => membership.school as unknown as School)
    .filter((school): school is School => school !== null && school.is_active);
}

/**
 * Create a new school (admin only)
 */
export async function createSchool(school: SchoolInsert): Promise<School | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('schools')
    .insert(school)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error creating school:', error);
    return null;
  }

  return data;
}

/**
 * Update school settings
 */
export async function updateSchool(
  id: string,
  updates: SchoolUpdate
): Promise<School | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('schools')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating school:', error);
    return null;
  }

  return data;
}

/**
 * Get school subscription status
 */
export async function getSchoolSubscription(slug: string) {
  const school = await getSchoolBySlug(slug);

  if (!school) return null;

  return {
    tier: school.subscription_tier,
    status: school.subscription_status,
    trialEndsAt: school.trial_ends_at,
    isTrialing: school.subscription_status === 'trialing',
    isPastDue: school.subscription_status === 'past_due',
  };
}

/**
 * Get schools for an authorizer (read-only portal)
 */
export async function getSchoolsByAuthorizer(authorizerId: string): Promise<School[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('authorizer_id', authorizerId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[DB] Error fetching schools by authorizer:', error);
    return [];
  }

  return data;
}
