import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  DashboardConfig,
  DashboardConfigInsert,
  DashboardConfigUpdate,
} from '@/lib/database.types';

/**
 * Dashboard Configuration Queries
 *
 * Data access layer for dashboard layouts and widget configurations
 */

/**
 * Get all dashboards for a school
 */
export async function getSchoolDashboards(
  schoolId: string
): Promise<DashboardConfig[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dashboard_configs')
    .select('*')
    .eq('school_id', schoolId)
    .or('is_shared.eq.true,user_id.is.null')
    .order('is_default', { ascending: false })
    .order('name');

  if (error) {
    console.error('[DB] Error fetching dashboards:', error);
    return [];
  }

  return data;
}

/**
 * Get user's personal dashboards
 */
export async function getUserDashboards(
  userId: string,
  schoolId: string
): Promise<DashboardConfig[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dashboard_configs')
    .select('*')
    .eq('school_id', schoolId)
    .eq('user_id', userId)
    .order('name');

  if (error) {
    console.error('[DB] Error fetching user dashboards:', error);
    return [];
  }

  return data;
}

/**
 * Get dashboard by slug
 */
export async function getDashboardBySlug(
  schoolId: string,
  slug: string
): Promise<DashboardConfig | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dashboard_configs')
    .select('*')
    .eq('school_id', schoolId)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[DB] Error fetching dashboard:', error);
    return null;
  }

  return data;
}

/**
 * Get the default dashboard for a school
 */
export async function getDefaultDashboard(
  schoolId: string
): Promise<DashboardConfig | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dashboard_configs')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_default', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[DB] Error fetching default dashboard:', error);
    return null;
  }

  return data;
}

/**
 * Create a new dashboard
 */
export async function createDashboard(
  dashboard: DashboardConfigInsert
): Promise<DashboardConfig | null> {
  const supabase = await createServerSupabaseClient();

  // Generate slug from name if not provided
  const slug =
    dashboard.slug ||
    dashboard.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const { data, error } = await supabase
    .from('dashboard_configs')
    .insert({
      ...dashboard,
      slug,
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] Error creating dashboard:', error);
    return null;
  }

  return data;
}

/**
 * Update dashboard configuration
 */
export async function updateDashboard(
  id: string,
  updates: DashboardConfigUpdate
): Promise<DashboardConfig | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dashboard_configs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating dashboard:', error);
    return null;
  }

  return data;
}

/**
 * Update dashboard layout
 */
export async function updateDashboardLayout(
  id: string,
  layoutConfig: Record<string, unknown>
): Promise<DashboardConfig | null> {
  return updateDashboard(id, { layout_config: layoutConfig });
}

/**
 * Update dashboard widgets
 */
export async function updateDashboardWidgets(
  id: string,
  widgetConfigs: Record<string, unknown>
): Promise<DashboardConfig | null> {
  return updateDashboard(id, { widget_configs: widgetConfigs });
}

/**
 * Delete a dashboard
 */
export async function deleteDashboard(id: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('dashboard_configs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[DB] Error deleting dashboard:', error);
    return false;
  }

  return true;
}

/**
 * Set a dashboard as the default (unsets other defaults)
 */
export async function setDefaultDashboard(
  schoolId: string,
  dashboardId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  // Unset existing default
  await supabase
    .from('dashboard_configs')
    .update({ is_default: false })
    .eq('school_id', schoolId)
    .eq('is_default', true);

  // Set new default
  const { error } = await supabase
    .from('dashboard_configs')
    .update({ is_default: true })
    .eq('id', dashboardId);

  if (error) {
    console.error('[DB] Error setting default dashboard:', error);
    return false;
  }

  return true;
}

/**
 * Clone a dashboard
 */
export async function cloneDashboard(
  id: string,
  newName: string,
  userId?: string
): Promise<DashboardConfig | null> {
  const supabase = await createServerSupabaseClient();

  // Get original dashboard
  const { data: original, error: fetchError } = await supabase
    .from('dashboard_configs')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !original) {
    console.error('[DB] Error fetching dashboard to clone:', fetchError);
    return null;
  }

  // Create clone
  const { data, error } = await supabase
    .from('dashboard_configs')
    .insert({
      school_id: original.school_id,
      user_id: userId || null,
      name: newName,
      slug: `${original.slug}-copy-${Date.now()}`,
      description: `Copy of ${original.name}`,
      is_default: false,
      is_shared: false,
      layout_config: original.layout_config,
      widget_configs: original.widget_configs,
      filters: original.filters,
      refresh_interval_seconds: original.refresh_interval_seconds,
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] Error cloning dashboard:', error);
    return null;
  }

  return data;
}

// Default dashboard configuration for new schools
export const DEFAULT_DASHBOARD_CONFIG: Omit<
  DashboardConfigInsert,
  'school_id' | 'name' | 'slug'
> = {
  is_default: true,
  is_shared: true,
  layout_config: {
    columns: 12,
    rowHeight: 80,
    margin: [16, 16],
  },
  widget_configs: {
    enrollment_summary: {
      type: 'metric_card',
      title: 'Total Enrollment',
      position: { x: 0, y: 0, w: 3, h: 2 },
      dataSource: 'student_master_fact',
      metric: 'count',
    },
    attendance_rate: {
      type: 'metric_card',
      title: 'Attendance Rate',
      position: { x: 3, y: 0, w: 3, h: 2 },
      dataSource: 'attendance_daily',
      metric: 'avg_rate',
    },
    chronic_absence: {
      type: 'metric_card',
      title: 'Chronic Absence',
      position: { x: 6, y: 0, w: 3, h: 2 },
      dataSource: 'student_master_fact',
      metric: 'chronic_absence_count',
      variant: 'warning',
    },
    academic_growth: {
      type: 'metric_card',
      title: 'Growth Percentile',
      position: { x: 9, y: 0, w: 3, h: 2 },
      dataSource: 'student_master_fact',
      metric: 'avg_growth_percentile',
    },
    attendance_trend: {
      type: 'line_chart',
      title: 'Attendance Trend',
      position: { x: 0, y: 2, w: 8, h: 4 },
      dataSource: 'attendance_weekly',
    },
    risk_distribution: {
      type: 'donut_chart',
      title: 'Student Risk Distribution',
      position: { x: 8, y: 2, w: 4, h: 4 },
      dataSource: 'student_master_fact',
      groupBy: 'risk_level',
    },
  },
  refresh_interval_seconds: 300, // 5 minutes
};
