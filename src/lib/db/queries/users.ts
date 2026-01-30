import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type {
  User,
  UserInsert,
  UserUpdate,
  SchoolMembership,
  SchoolMembershipInsert,
} from '@/lib/database.types';

/**
 * User Queries
 *
 * Data access layer for user and membership operations
 */

/**
 * Get user by Clerk user ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    // User might not exist yet
    if (error.code === 'PGRST116') return null;
    console.error('[DB] Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[DB] Error fetching user by email:', error);
    return null;
  }

  return data;
}

/**
 * Create or update user from Clerk webhook
 */
export async function upsertUser(
  clerkUserId: string,
  userData: Partial<UserInsert>
): Promise<User | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        clerk_user_id: clerkUserId,
        email: userData.email!.toLowerCase(),
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar_url: userData.avatar_url,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'clerk_user_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('[DB] Error upserting user:', error);
    return null;
  }

  return data;
}

/**
 * Get user's school memberships
 */
export async function getUserMemberships(userId: string): Promise<SchoolMembership[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('school_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('[DB] Error fetching memberships:', error);
    return [];
  }

  return data;
}

/**
 * Get user's membership for a specific school
 */
export async function getUserSchoolMembership(
  userId: string,
  schoolId: string
): Promise<SchoolMembership | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('school_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[DB] Error fetching membership:', error);
    return null;
  }

  return data;
}

/**
 * Add user to a school
 */
export async function addUserToSchool(
  membership: SchoolMembershipInsert
): Promise<SchoolMembership | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('school_memberships')
    .insert({
      ...membership,
      invited_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] Error adding user to school:', error);
    return null;
  }

  return data;
}

/**
 * Update user's school role
 */
export async function updateUserSchoolRole(
  userId: string,
  schoolId: string,
  role: SchoolMembership['role']
): Promise<SchoolMembership | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('school_memberships')
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating user role:', error);
    return null;
  }

  return data;
}

/**
 * Remove user from a school
 */
export async function removeUserFromSchool(
  userId: string,
  schoolId: string
): Promise<boolean> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('school_memberships')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('school_id', schoolId);

  if (error) {
    console.error('[DB] Error removing user from school:', error);
    return false;
  }

  return true;
}

/**
 * Get all staff members for a school
 */
export async function getSchoolStaff(schoolId: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('school_memberships')
    .select(`
      *,
      user:users(*)
    `)
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('role');

  if (error) {
    console.error('[DB] Error fetching school staff:', error);
    return [];
  }

  return data;
}

/**
 * Update user's last login timestamp
 */
export async function updateUserLastLogin(clerkUserId: string): Promise<void> {
  const supabase = createAdminSupabaseClient();

  await supabase
    .from('users')
    .update({
      last_login_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', clerkUserId);
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Record<string, unknown>
): Promise<User | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .update({
      preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating preferences:', error);
    return null;
  }

  return data;
}
