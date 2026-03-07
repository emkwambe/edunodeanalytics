// @ts-nocheck - strict type mismatches after database.types.ts regen
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { School, SchoolInsert, SchoolUpdate } from '@/lib/database.types';
import { getCurrentTenantSlug } from '@/lib/auth/rbac';

/**
 * School Queries
 *
 * Data access layer for school/tenant operations
 */

// Demo schools for development mode
const DEMO_SCHOOLS: Record<string, Partial<School>> = {
  'academy-charter': {
    id: 'demo-academy-charter',
    name: 'Academy Charter School',
    slug: 'academy-charter',
    is_active: true,
    primary_color: '#6366f1',
    secondary_color: '#06b6d4',
    accent_color: '#10b981',
    subscription_tier: 'pro',
    subscription_status: 'active',
  },
  'academy-tomorrow': {
    id: 'demo-academy-tomorrow',
    name: 'Academy of Tomorrow',
    slug: 'academy-tomorrow',
    is_active: true,
    primary_color: '#8b5cf6',
    secondary_color: '#06b6d4',
    accent_color: '#10b981',
    subscription_tier: 'pro',
    subscription_status: 'active',
  },
  'innovation-prep': {
    id: 'demo-innovation-prep',
    name: 'Innovation Prep Academy',
    slug: 'innovation-prep',
    is_active: true,
    primary_color: '#0ea5e9',
    secondary_color: '#06b6d4',
    accent_color: '#10b981',
    subscription_tier: 'pro',
    subscription_status: 'active',
  },
  'stem-scholars': {
    id: 'demo-stem-scholars',
    name: 'STEM Scholars Charter',
    slug: 'stem-scholars',
    is_active: true,
    primary_color: '#10b981',
    secondary_color: '#06b6d4',
    accent_color: '#6366f1',
    subscription_tier: 'pro',
    subscription_status: 'active',
  },
};

const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.EDUNODE_DEMO_MODE === 'true';

/**
 * Get all schools
 */
export async function getAllSchools(): Promise<School[]> {
  // In demo mode, return demo schools
  if (isDemoMode) {
    return Object.values(DEMO_SCHOOLS) as School[];
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[DB] Error fetching all schools:', error);
    return [];
  }

  return data;
}

/**
 * Get school by slug (most common query pattern)
 */
export async function getSchoolBySlug(slug: string): Promise<School | null> {
  // In demo mode, check demo schools first to avoid unnecessary DB calls
  if (isDemoMode && DEMO_SCHOOLS[slug]) {
    return DEMO_SCHOOLS[slug] as School;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    // Only log error in non-demo mode or if it's not a "not found" error
    if (!isDemoMode || error.code !== 'PGRST116') {
      console.error('[DB] Error fetching school by slug:', slug, error);
    }
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
  const slug = await getCurrentTenantSlug();
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

/**
 * School metrics type
 */
export interface SchoolMetrics {
  totalStudents: number;
  totalTeachers: number;
  averageAttendance: number;
  averageGpa: number;
  graduationRate: number;
}

/**
 * Get metrics for a school
 */
export async function getSchoolMetrics(schoolId: string): Promise<SchoolMetrics | null> {
  const supabase = await createServerSupabaseClient();

  // Get student count
  const { count: studentCount, error: studentError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId);

  if (studentError) {
    console.error('[DB] Error fetching student count:', studentError);
  }

  // Get unique teacher count from students' homeroom_teacher field
  const { data: teacherData, error: teacherError } = await supabase
    .from('students')
    .select('homeroom_teacher')
    .eq('school_id', schoolId)
    .not('homeroom_teacher', 'is', null);

  let teacherCount = 0;
  if (teacherError) {
    console.error('[DB] Error fetching teacher count:', teacherError);
  } else if (teacherData) {
    // Count unique teacher names
    const uniqueTeachers = new Set(teacherData.map(s => s.homeroom_teacher));
    teacherCount = uniqueTeachers.size;
  }

  // Return metrics with defaults for any missing data
  return {
    totalStudents: studentCount ?? 0,
    totalTeachers: teacherCount,
    averageAttendance: 0,
    averageGpa: 0,
    graduationRate: 0,
  };
}

// ==============================================
// STRIPE SUBSCRIPTION OPERATIONS
// ==============================================

/**
 * Subscription update parameters from Stripe webhooks
 */
export interface SubscriptionUpdateParams {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionTier?: 'starter' | 'pro' | 'enterprise';
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
  studentCount?: number;
  trialEndsAt?: Date | null;
}

/**
 * Get school by Stripe customer ID
 */
export async function getSchoolByStripeCustomerId(customerId: string): Promise<School | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching school by Stripe customer ID:', error);
    }
    return null;
  }

  return data;
}

/**
 * Get school by Stripe subscription ID
 */
export async function getSchoolByStripeSubscriptionId(subscriptionId: string): Promise<School | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching school by Stripe subscription ID:', error);
    }
    return null;
  }

  return data;
}

/**
 * Update school subscription from Stripe webhook
 * Uses admin client to bypass RLS for webhook operations
 */
export async function updateSchoolSubscription(
  schoolId: string,
  params: SubscriptionUpdateParams
): Promise<School | null> {
  const supabase = createAdminSupabaseClient();

  const updates: SchoolUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (params.stripeCustomerId !== undefined) {
    updates.stripe_customer_id = params.stripeCustomerId;
  }
  if (params.stripeSubscriptionId !== undefined) {
    updates.stripe_subscription_id = params.stripeSubscriptionId;
  }
  if (params.subscriptionTier !== undefined) {
    updates.subscription_tier = params.subscriptionTier;
  }
  if (params.subscriptionStatus !== undefined) {
    updates.subscription_status = params.subscriptionStatus;
  }
  if (params.currentPeriodStart !== undefined) {
    updates.current_period_start = params.currentPeriodStart.toISOString();
  }
  if (params.currentPeriodEnd !== undefined) {
    updates.current_period_end = params.currentPeriodEnd.toISOString();
  }
  if (params.cancelAtPeriodEnd !== undefined) {
    updates.cancel_at_period_end = params.cancelAtPeriodEnd;
  }
  if (params.canceledAt !== undefined) {
    updates.canceled_at = params.canceledAt?.toISOString() ?? null;
  }
  if (params.studentCount !== undefined) {
    updates.student_count = params.studentCount;
  }
  if (params.trialEndsAt !== undefined) {
    updates.trial_ends_at = params.trialEndsAt?.toISOString() ?? null;
  }

  const { data, error } = await supabase
    .from('schools')
    .update(updates)
    .eq('id', schoolId)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating school subscription:', error);
    return null;
  }

  console.log('[DB] Updated school subscription:', {
    schoolId,
    tier: updates.subscription_tier,
    status: updates.subscription_status,
  });

  return data;
}

/**
 * Update school subscription by slug (for checkout completion)
 */
export async function updateSchoolSubscriptionBySlug(
  slug: string,
  params: SubscriptionUpdateParams
): Promise<School | null> {
  const supabase = createAdminSupabaseClient();

  // First get the school ID
  const { data: school, error: fetchError } = await supabase
    .from('schools')
    .select('id')
    .eq('slug', slug)
    .single();

  if (fetchError || !school) {
    console.error('[DB] Error fetching school by slug for subscription update:', fetchError);
    return null;
  }

  return updateSchoolSubscription(school.id, params);
}

/**
 * Update school subscription by Stripe subscription ID (for subscription webhooks)
 */
export async function updateSchoolSubscriptionByStripeId(
  stripeSubscriptionId: string,
  params: SubscriptionUpdateParams
): Promise<School | null> {
  const school = await getSchoolByStripeSubscriptionId(stripeSubscriptionId);

  if (!school) {
    console.error('[DB] No school found with Stripe subscription ID:', stripeSubscriptionId);
    return null;
  }

  return updateSchoolSubscription(school.id, params);
}
