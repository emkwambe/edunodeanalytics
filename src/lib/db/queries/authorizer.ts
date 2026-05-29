/**
 * Authorizer Database Queries
 *
 * Data access layer for authorizer-related operations
 */

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type {
  Authorizer,
  AuthorizerMembership,
  AuthorizerPortfolioSchool,
  AuthorizerPortfolioSummary,
  SchoolMetricsHistory,
  SchoolFinancials,
  ComplianceItem,
  ComplianceSummary,
  BoardMember,
  BoardMeeting,
} from '../types/authorizer';
import type { School } from '@/lib/database.types';

// ==============================================
// AUTHORIZER QUERIES
// ==============================================

/**
 * Get authorizer by ID
 */
export async function getAuthorizerById(id: string): Promise<Authorizer | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('authorizers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[DB] Error fetching authorizer:', error);
    return null;
  }

  return data as Authorizer;
}

/**
 * Get authorizer by slug
 */
export async function getAuthorizerBySlug(slug: string): Promise<Authorizer | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('authorizers')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[DB] Error fetching authorizer by slug:', error);
    return null;
  }

  return data as Authorizer;
}

/**
 * Get authorizer for a user (via membership)
 */
export async function getAuthorizerForUser(userId: string): Promise<Authorizer | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('authorizer_memberships')
    .select(`
      authorizer:authorizers(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('[DB] Error fetching authorizer for user:', error);
    return null;
  }

  return data?.authorizer as Authorizer;
}

/**
 * Check if user is an authorizer member
 */
export async function isAuthorizerMember(userId: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();

  const { count, error } = await (supabase as any)
    .from('authorizer_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('[DB] Error checking authorizer membership:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

// ==============================================
// PORTFOLIO QUERIES
// ==============================================

/**
 * Get all schools for an authorizer
 */
export async function getSchoolsForAuthorizer(authorizerId: string): Promise<School[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('authorizer_id', authorizerId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[DB] Error fetching schools for authorizer:', error);
    return [];
  }

  return data;
}

/**
 * Get portfolio summary for an authorizer
 */
export async function getAuthorizerPortfolio(authorizerId: string): Promise<AuthorizerPortfolioSummary | null> {
  const supabase = createAdminSupabaseClient();

  // Get authorizer
  const authorizer = await getAuthorizerById(authorizerId);
  if (!authorizer) return null;

  // Get schools with their latest metrics
  const { data: schools, error } = await (supabase as any)
    .from('schools')
    .select(`
      id,
      name,
      slug,
      student_count,
      subscription_tier,
      charter_term_end,
      created_at
    `)
    .eq('authorizer_id', authorizerId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[DB] Error fetching portfolio schools:', error);
    return null;
  }

  // Get latest metrics for each school
  const portfolioSchools: AuthorizerPortfolioSchool[] = await Promise.all(
    schools.map(async (school: any) => {
      // Get latest metrics
      const { data: metrics } = await (supabase as any)
        .from('school_metrics_history')
        .select('*')
        .eq('school_id', school.id)
        .order('metric_date', { ascending: false })
        .limit(1)
        .single();

      // Get latest financials
      const { data: financials } = await (supabase as any)
        .from('school_financials')
        .select('*')
        .eq('school_id', school.id)
        .order('report_date', { ascending: false })
        .limit(1)
        .single();

      // Get compliance summary
      const { data: complianceItems } = await (supabase as any)
        .from('compliance_items')
        .select('status, due_date')
        .eq('school_id', school.id);

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const complianceIssues = complianceItems?.filter(
        (item: any) => item.status === 'non_compliant' || item.status === 'expired'
      ).length ?? 0;

      const complianceDue = complianceItems?.filter((item: any) => {
        if (!item.due_date) return false;
        const dueDate = new Date(item.due_date);
        return dueDate <= thirtyDaysFromNow && item.status === 'pending';
      }).length ?? 0;

      // Calculate years until renewal
      let yearsUntilRenewal: number | null = null;
      if (school.charter_term_end) {
        const termEnd = new Date(school.charter_term_end);
        const yearsRemaining = (termEnd.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        yearsUntilRenewal = Math.max(0, Math.round(yearsRemaining * 10) / 10);
      }

      // Determine risk level based on various factors
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      const chronicAbsence = metrics?.chronic_absence_rate ?? 0;
      const currentRatio = financials?.current_ratio ?? 1.5;

      if (chronicAbsence > 25 || currentRatio < 1.0) {
        riskLevel = 'critical';
      } else if (chronicAbsence > 20 || currentRatio < 1.1) {
        riskLevel = 'high';
      } else if (chronicAbsence > 15 || currentRatio < 1.2) {
        riskLevel = 'medium';
      }

      return {
        id: school.id,
        name: school.name,
        slug: school.slug,
        enrollment: school.student_count ?? 0,
        subscription_tier: school.subscription_tier,
        ela_proficiency: metrics?.ela_proficiency ?? null,
        math_proficiency: metrics?.math_proficiency ?? null,
        chronic_absence_rate: metrics?.chronic_absence_rate ?? null,
        current_ratio: financials?.current_ratio ?? null,
        days_cash_on_hand: financials?.days_cash_on_hand ?? null,
        risk_level: riskLevel,
        students_at_risk_percent: metrics
          ? ((metrics.students_high_risk + metrics.students_critical_risk) /
              (metrics.students_low_risk + metrics.students_medium_risk + metrics.students_high_risk + metrics.students_critical_risk)) * 100
          : 0,
        compliance_status: complianceIssues > 2 ? 'critical' : complianceIssues > 0 ? 'warning' : 'good',
        compliance_items_due: complianceDue,
        charter_term_end: school.charter_term_end,
        years_until_renewal: yearsUntilRenewal,
      };
    })
  );

  // Calculate aggregates
  const totalEnrollment = portfolioSchools.reduce((sum, s) => sum + s.enrollment, 0);
  const schoolsWithEla = portfolioSchools.filter((s) => s.ela_proficiency !== null);
  const schoolsWithMath = portfolioSchools.filter((s) => s.math_proficiency !== null);
  const schoolsWithAbsence = portfolioSchools.filter((s) => s.chronic_absence_rate !== null);

  return {
    authorizer,
    schools: portfolioSchools,
    total_schools: portfolioSchools.length,
    total_enrollment: totalEnrollment,
    avg_ela_proficiency:
      schoolsWithEla.length > 0
        ? schoolsWithEla.reduce((sum, s) => sum + (s.ela_proficiency ?? 0), 0) / schoolsWithEla.length
        : null,
    avg_math_proficiency:
      schoolsWithMath.length > 0
        ? schoolsWithMath.reduce((sum, s) => sum + (s.math_proficiency ?? 0), 0) / schoolsWithMath.length
        : null,
    avg_chronic_absence_rate:
      schoolsWithAbsence.length > 0
        ? schoolsWithAbsence.reduce((sum, s) => sum + (s.chronic_absence_rate ?? 0), 0) / schoolsWithAbsence.length
        : null,
    schools_low_risk: portfolioSchools.filter((s) => s.risk_level === 'low').length,
    schools_medium_risk: portfolioSchools.filter((s) => s.risk_level === 'medium').length,
    schools_high_risk: portfolioSchools.filter((s) => s.risk_level === 'high').length,
    schools_critical_risk: portfolioSchools.filter((s) => s.risk_level === 'critical').length,
    schools_compliant: portfolioSchools.filter((s) => s.compliance_status === 'good').length,
    schools_with_issues: portfolioSchools.filter((s) => s.compliance_status !== 'good').length,
    total_compliance_items_due: portfolioSchools.reduce((sum, s) => sum + s.compliance_items_due, 0),
    schools_approaching_renewal: portfolioSchools.filter(
      (s) => s.years_until_renewal !== null && s.years_until_renewal <= 1.5
    ).length,
  };
}

// ==============================================
// METRICS HISTORY QUERIES
// ==============================================

/**
 * Get metrics history for a school
 */
export async function getSchoolMetricsHistory(
  schoolId: string,
  years: number = 5
): Promise<SchoolMetricsHistory[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('school_metrics_history')
    .select('*')
    .eq('school_id', schoolId)
    .eq('snapshot_type', 'annual')
    .order('school_year', { ascending: false })
    .limit(years);

  if (error) {
    console.error('[DB] Error fetching metrics history:', error);
    return [];
  }

  return data as SchoolMetricsHistory[];
}

/**
 * Insert or update metrics history
 */
export async function upsertSchoolMetrics(
  metrics: Omit<SchoolMetricsHistory, 'id' | 'created_at' | 'updated_at'>
): Promise<SchoolMetricsHistory | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('school_metrics_history')
    .upsert(metrics, {
      onConflict: 'school_id,school_year,snapshot_type',
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] Error upserting metrics:', error);
    return null;
  }

  return data as SchoolMetricsHistory;
}

// ==============================================
// FINANCIALS QUERIES
// ==============================================

/**
 * Get financial history for a school
 */
export async function getSchoolFinancials(
  schoolId: string,
  years: number = 5
): Promise<SchoolFinancials[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('school_financials')
    .select('*')
    .eq('school_id', schoolId)
    .eq('report_type', 'annual')
    .order('fiscal_year', { ascending: false })
    .limit(years);

  if (error) {
    console.error('[DB] Error fetching financials:', error);
    return [];
  }

  return data as SchoolFinancials[];
}

/**
 * Get latest financial report for a school
 */
export async function getLatestFinancials(schoolId: string): Promise<SchoolFinancials | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('school_financials')
    .select('*')
    .eq('school_id', schoolId)
    .order('report_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching latest financials:', error);
    }
    return null;
  }

  return data as SchoolFinancials;
}

// ==============================================
// COMPLIANCE QUERIES
// ==============================================

/**
 * Get compliance items for a school
 */
export async function getComplianceItems(schoolId: string): Promise<ComplianceItem[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('compliance_items')
    .select('*')
    .eq('school_id', schoolId)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('[DB] Error fetching compliance items:', error);
    return [];
  }

  return data as ComplianceItem[];
}

/**
 * Get compliance summary for a school
 */
export async function getComplianceSummary(schoolId: string): Promise<ComplianceSummary> {
  const items = await getComplianceItems(schoolId);
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const byCategory: ComplianceSummary['by_category'] = {} as ComplianceSummary['by_category'];

  items.forEach((item) => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = { total: 0, compliant: 0, issues: 0 };
    }
    byCategory[item.category].total++;
    if (item.status === 'compliant') {
      byCategory[item.category].compliant++;
    } else if (item.status === 'non_compliant' || item.status === 'expired') {
      byCategory[item.category].issues++;
    }
  });

  return {
    school_id: schoolId,
    total_items: items.length,
    compliant: items.filter((i) => i.status === 'compliant').length,
    non_compliant: items.filter((i) => i.status === 'non_compliant').length,
    pending: items.filter((i) => i.status === 'pending').length,
    expired: items.filter((i) => i.status === 'expired').length,
    upcoming_due: items.filter((i) => {
      if (!i.due_date || i.status !== 'pending') return false;
      const dueDate = new Date(i.due_date);
      return dueDate <= thirtyDaysFromNow && dueDate >= now;
    }).length,
    overdue: items.filter((i) => {
      if (!i.due_date || i.status !== 'pending') return false;
      return new Date(i.due_date) < now;
    }).length,
    by_category: byCategory,
  };
}

/**
 * Update compliance item status
 */
export async function updateComplianceStatus(
  itemId: string,
  status: ComplianceItem['status'],
  completedDate?: string
): Promise<ComplianceItem | null> {
  const supabase = createAdminSupabaseClient();

  const updates: Partial<ComplianceItem> = {
    status,
    last_status_change: new Date().toISOString(),
  };

  if (completedDate) {
    updates.completed_date = completedDate;
  }

  const { data, error } = await (supabase as any)
    .from('compliance_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating compliance status:', error);
    return null;
  }

  return data as ComplianceItem;
}

// ==============================================
// BOARD QUERIES
// ==============================================

/**
 * Get board members for a school
 */
export async function getBoardMembers(schoolId: string): Promise<BoardMember[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('board_members')
    .select('*')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('role');

  if (error) {
    console.error('[DB] Error fetching board members:', error);
    return [];
  }

  return data as BoardMember[];
}

/**
 * Get board meetings for a school
 */
export async function getBoardMeetings(
  schoolId: string,
  limit: number = 12
): Promise<BoardMeeting[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('board_meetings')
    .select('*')
    .eq('school_id', schoolId)
    .order('meeting_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[DB] Error fetching board meetings:', error);
    return [];
  }

  return data as BoardMeeting[];
}

// ==============================================
// AUTHORIZER MEMBERSHIP QUERIES
// ==============================================

/**
 * Get membership for a user
 */
export async function getAuthorizerMembership(userId: string): Promise<AuthorizerMembership | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('authorizer_memberships')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching membership:', error);
    }
    return null;
  }

  return data as AuthorizerMembership;
}

/**
 * Invite user to authorizer
 */
export async function inviteAuthorizerUser(
  authorizerId: string,
  userId: string,
  role: AuthorizerMembership['role'],
  invitedBy: string
): Promise<AuthorizerMembership | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase as any)
    .from('authorizer_memberships')
    .insert({
      authorizer_id: authorizerId,
      user_id: userId,
      role,
      invited_by: invitedBy,
      is_active: true,
      can_export: true,
      can_view_financials: role === 'admin' || role === 'analyst',
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] Error inviting authorizer user:', error);
    return null;
  }

  return data as AuthorizerMembership;
}

/**
 * Log authorizer access
 */
export async function logAuthorizerAccess(
  authorizerId: string,
  userId: string,
  action: string,
  schoolId?: string,
  resourceType?: string,
  resourceId?: string
): Promise<void> {
  const supabase = createAdminSupabaseClient();

  await (supabase as any).from('authorizer_access_logs').insert({
    authorizer_id: authorizerId,
    user_id: userId,
    school_id: schoolId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
  });
}
