/**
 * Authorizer-related TypeScript types
 * Maps to database tables from authorizer_enhancements migration
 */

// ==============================================
// ENUMS
// ==============================================

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending' | 'expired' | 'not_applicable';

export type ComplianceCategory =
  | 'financial_audit'
  | 'board_governance'
  | 'health_safety'
  | 'special_education'
  | 'ell_services'
  | 'teacher_certification'
  | 'background_checks'
  | 'facility'
  | 'ferpa_privacy'
  | 'civil_rights'
  | 'reporting'
  | 'other';

export type AuthorizerType = 'lea' | 'sea' | 'university' | 'nonprofit' | 'independent';

export type PerformanceFramework = 'nacsa' | 'dc_aspire' | 'suny' | 'icsb' | 'california_ab1505' | 'custom';

export type AuthorizerMemberRole = 'admin' | 'analyst' | 'viewer';

export type BoardMemberRole = 'chair' | 'vice_chair' | 'treasurer' | 'secretary' | 'member';

export type MeetingType = 'regular' | 'special' | 'annual' | 'emergency';

export type SnapshotType = 'annual' | 'quarterly' | 'monthly';

export type FinancialReportType = 'annual' | 'quarterly' | 'interim';

export type AuditStatus = 'pending' | 'clean' | 'qualified' | 'adverse';

// ==============================================
// SCHOOL METRICS HISTORY
// ==============================================

export interface SchoolMetricsHistory {
  id: string;
  school_id: string;
  metric_date: string;
  school_year: string;
  snapshot_type: SnapshotType;

  // Academic
  ela_proficiency: number | null;
  math_proficiency: number | null;
  science_proficiency: number | null;
  ela_growth_percentile: number | null;
  math_growth_percentile: number | null;

  // High School
  graduation_rate_4yr: number | null;
  graduation_rate_5yr: number | null;
  college_enrollment_rate: number | null;
  college_persistence_rate: number | null;

  // Attendance
  average_daily_attendance: number | null;
  chronic_absence_rate: number | null;

  // Enrollment
  total_enrollment: number | null;
  projected_enrollment: number | null;
  enrollment_variance: number | null;

  // Risk Distribution
  students_low_risk: number;
  students_medium_risk: number;
  students_high_risk: number;
  students_critical_risk: number;

  // Subgroups (JSONB)
  subgroup_proficiency: Record<string, { ela?: number; math?: number; science?: number }>;
  subgroup_growth: Record<string, { ela?: number; math?: number }>;

  // State Comparison
  state_ela_average: number | null;
  state_math_average: number | null;
  state_graduation_average: number | null;

  // Metadata
  data_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type SchoolMetricsHistoryInsert = Omit<SchoolMetricsHistory, 'id' | 'created_at' | 'updated_at'>;
export type SchoolMetricsHistoryUpdate = Partial<SchoolMetricsHistoryInsert>;

// ==============================================
// SCHOOL FINANCIALS
// ==============================================

export interface SchoolFinancials {
  id: string;
  school_id: string;
  fiscal_year: string;
  report_type: FinancialReportType;
  report_date: string;
  period_end_date: string | null;

  // Near-Term Health
  current_ratio: number | null;
  days_cash_on_hand: number | null;

  // Long-Term Stability
  debt_to_asset_ratio: number | null;
  debt_service_coverage: number | null;
  total_margin: number | null;

  // Revenue & Expenses
  total_revenue: number | null;
  total_expenses: number | null;
  net_income: number | null;
  per_pupil_revenue: number | null;
  per_pupil_expenditure: number | null;

  // Enrollment
  actual_adm: number | null;
  projected_adm: number | null;
  adm_variance_percent: number | null;

  // Fund Balance
  unrestricted_fund_balance: number | null;
  fund_balance_ratio: number | null;

  // Audit
  audit_status: AuditStatus;
  audit_findings_count: number;
  audit_document_url: string | null;

  // Metadata
  data_source: string;
  preparer_notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type SchoolFinancialsInsert = Omit<SchoolFinancials, 'id' | 'created_at' | 'updated_at'>;
export type SchoolFinancialsUpdate = Partial<SchoolFinancialsInsert>;

// ==============================================
// COMPLIANCE ITEMS
// ==============================================

export interface ComplianceItem {
  id: string;
  school_id: string;
  category: ComplianceCategory;
  item_name: string;
  description: string | null;
  status: ComplianceStatus;
  due_date: string | null;
  completed_date: string | null;
  expiration_date: string | null;
  next_review_date: string | null;
  document_url: string | null;
  document_name: string | null;
  assigned_to: string | null;
  reviewer: string | null;
  notes: string | null;
  last_status_change: string | null;
  is_recurring: boolean;
  recurrence_interval: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type ComplianceItemInsert = Omit<ComplianceItem, 'id' | 'created_at' | 'updated_at'>;
export type ComplianceItemUpdate = Partial<ComplianceItemInsert>;

// ==============================================
// AUTHORIZER MEMBERSHIP
// ==============================================

export interface AuthorizerMembership {
  id: string;
  authorizer_id: string;
  user_id: string;
  role: AuthorizerMemberRole;
  is_active: boolean;
  can_export: boolean;
  can_view_financials: boolean;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AuthorizerMembershipInsert = Omit<AuthorizerMembership, 'id' | 'created_at' | 'updated_at'>;
export type AuthorizerMembershipUpdate = Partial<AuthorizerMembershipInsert>;

// ==============================================
// BOARD MEMBERS
// ==============================================

export interface BoardMember {
  id: string;
  school_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: BoardMemberRole;
  committee_assignments: string[];
  term_start: string | null;
  term_end: string | null;
  is_active: boolean;
  background_check_date: string | null;
  background_check_clear: boolean | null;
  financial_disclosure_date: string | null;
  financial_disclosure_on_file: boolean;
  conflict_of_interest_date: string | null;
  conflict_of_interest_on_file: boolean;
  training_completed_date: string | null;
  profession: string | null;
  expertise_areas: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BoardMemberInsert = Omit<BoardMember, 'id' | 'created_at' | 'updated_at'>;
export type BoardMemberUpdate = Partial<BoardMemberInsert>;

// ==============================================
// BOARD MEETINGS
// ==============================================

export interface BoardMeeting {
  id: string;
  school_id: string;
  meeting_date: string;
  meeting_type: MeetingType;
  location: string | null;
  quorum_met: boolean;
  members_present: number | null;
  members_absent: number | null;
  agenda_url: string | null;
  minutes_url: string | null;
  minutes_approved: boolean;
  minutes_approved_date: string | null;
  key_actions: string[];
  resolutions_passed: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BoardMeetingInsert = Omit<BoardMeeting, 'id' | 'created_at' | 'updated_at'>;
export type BoardMeetingUpdate = Partial<BoardMeetingInsert>;

// ==============================================
// AUTHORIZER (Extended)
// ==============================================

export interface Authorizer {
  id: string;
  name: string;
  slug: string;
  contact_email: string;
  is_active: boolean;
  authorizer_type: AuthorizerType;
  state: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  performance_framework: PerformanceFramework;
  renewal_cycle_years: number;
  schools_count: number;
  created_at: string;
  updated_at: string;
}

// ==============================================
// PORTFOLIO SUMMARY (Computed)
// ==============================================

export interface AuthorizerPortfolioSchool {
  id: string;
  name: string;
  slug: string;
  enrollment: number;
  subscription_tier: string;

  // Academic Performance
  ela_proficiency: number | null;
  math_proficiency: number | null;
  chronic_absence_rate: number | null;

  // Financial Health
  current_ratio: number | null;
  days_cash_on_hand: number | null;

  // Risk Status
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  students_at_risk_percent: number;

  // Compliance
  compliance_status: 'good' | 'warning' | 'critical';
  compliance_items_due: number;

  // Renewal
  charter_term_end: string | null;
  years_until_renewal: number | null;
}

export interface AuthorizerPortfolioSummary {
  authorizer: Authorizer;
  schools: AuthorizerPortfolioSchool[];

  // Aggregate Metrics
  total_schools: number;
  total_enrollment: number;
  avg_ela_proficiency: number | null;
  avg_math_proficiency: number | null;
  avg_chronic_absence_rate: number | null;

  // Risk Distribution
  schools_low_risk: number;
  schools_medium_risk: number;
  schools_high_risk: number;
  schools_critical_risk: number;

  // Compliance Overview
  schools_compliant: number;
  schools_with_issues: number;
  total_compliance_items_due: number;

  // Upcoming Events
  schools_approaching_renewal: number; // Within 18 months
}

// ==============================================
// FINANCIAL HEALTH INDICATORS
// ==============================================

export interface FinancialHealthIndicator {
  metric: string;
  value: number | null;
  threshold: number;
  status: 'meets' | 'approaching' | 'does_not_meet' | 'unknown';
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
}

export interface SchoolFinancialHealth {
  school_id: string;
  fiscal_year: string;
  overall_status: 'healthy' | 'watch' | 'concern' | 'critical';
  indicators: FinancialHealthIndicator[];
  recommendations: string[];
}

// ==============================================
// COMPLIANCE SUMMARY
// ==============================================

export interface ComplianceSummary {
  school_id: string;
  total_items: number;
  compliant: number;
  non_compliant: number;
  pending: number;
  expired: number;
  upcoming_due: number; // Due within 30 days
  overdue: number;
  by_category: Record<ComplianceCategory, {
    total: number;
    compliant: number;
    issues: number;
  }>;
}

// ==============================================
// MULTI-YEAR TREND DATA
// ==============================================

export interface MetricTrendPoint {
  school_year: string;
  value: number | null;
  state_average: number | null;
}

export interface SchoolMetricsTrend {
  school_id: string;
  metric_name: string;
  data_points: MetricTrendPoint[];
  trend_direction: 'improving' | 'stable' | 'declining';
  years_of_data: number;
}
