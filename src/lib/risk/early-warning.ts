// @ts-nocheck - risk engine tables not yet in database.types.ts (regen pending)
/**
 * Early Warning System
 * ====================
 *
 * Real-time monitoring for student risk indicators with
 * configurable alerts and notifications.
 *
 * SPRINT 1B REFACTOR:
 *   - Alerts persisted to risk_alerts table (not early_warning_alerts)
 *   - Previous state loaded from student_metric_history (not student_snapshots)
 *   - Added cooldown_key for DB-level deduplication
 *   - Alert queries use risk_alerts table
 *   - Compatible with risk_evaluations for linking alerts to evaluations
 *
 * Features:
 * - Threshold-based alerting
 * - Trend detection alerts
 * - Batch monitoring
 * - Alert suppression and deduplication (DB + in-memory)
 */

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { Student } from '@/lib/database.types';
import type {
  AlertType,
  AlertSeverity,
  AlertStatus,
  RiskAlertInsert,
  RiskAlertRow,
} from '@/lib/risk-engine/types';

// ============================================================
// Alert Rule Types
// ============================================================

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  alertType: AlertType;
  enabled: boolean;
  cooldownMinutes: number;
  notifyRoles: string[];
}

export interface AlertCondition {
  type: 'threshold' | 'change' | 'trend' | 'absence';
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'change_by';
  value: number;
  windowDays?: number;
}

/** Alert as returned to consumers (hydrated from DB row) */
export interface Alert {
  id: string;
  schoolId: string;
  studentId: string;
  ruleId: string | null;
  alertType: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  data: Record<string, unknown>;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

// ============================================================
// Default Alert Rules (enhanced with alertType)
// ============================================================

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'attendance-drop',
    name: 'Sudden Attendance Drop',
    description: 'Attendance drops by more than 10% in a week',
    condition: { type: 'change', field: 'attendance_rate', operator: 'change_by', value: -0.1, windowDays: 7 },
    severity: 'warning',
    alertType: 'attendance_drop',
    enabled: true,
    cooldownMinutes: 1440,
    notifyRoles: ['teacher', 'counselor'],
  },
  {
    id: 'chronic-absence-new',
    name: 'New Chronic Absence',
    description: 'Student becomes chronically absent',
    condition: { type: 'threshold', field: 'is_chronically_absent', operator: 'eq', value: 1 },
    severity: 'critical',
    alertType: 'chronic_absence',
    enabled: true,
    cooldownMinutes: 10080,
    notifyRoles: ['teacher', 'counselor', 'admin'],
  },
  {
    id: 'risk-critical',
    name: 'Critical Risk Level',
    description: 'Student moves to critical risk level',
    condition: { type: 'threshold', field: 'risk_score', operator: 'gte', value: 0.7 },
    severity: 'critical',
    alertType: 'threshold_breach',
    enabled: true,
    cooldownMinutes: 1440,
    notifyRoles: ['teacher', 'counselor', 'admin'],
  },
  {
    id: 'grade-decline',
    name: 'Significant Grade Decline',
    description: 'Proficiency level drops by 1 or more',
    condition: { type: 'change', field: 'proficiency_level', operator: 'change_by', value: -1, windowDays: 30 },
    severity: 'warning',
    alertType: 'grade_decline',
    enabled: true,
    cooldownMinutes: 2880,
    notifyRoles: ['teacher'],
  },
  {
    id: 'consecutive-absences',
    name: 'Consecutive Absences',
    description: 'Student absent 3+ consecutive days',
    condition: { type: 'absence', field: 'consecutive_absences', operator: 'gte', value: 3 },
    severity: 'warning',
    alertType: 'consecutive_absences',
    enabled: true,
    cooldownMinutes: 1440,
    notifyRoles: ['teacher', 'counselor'],
  },
];

// ============================================================
// Early Warning System
// ============================================================

export class EarlyWarningSystem {
  private schoolId: string;
  private rules: AlertRule[];
  private alertCache: Map<string, Date> = new Map();

  constructor(schoolId: string, customRules?: AlertRule[]) {
    this.schoolId = schoolId;
    this.rules = customRules || [...DEFAULT_ALERT_RULES];
  }

  /**
   * Check a single student against all rules
   */
  async checkStudent(student: Student, previousState?: Student): Promise<Alert[]> {
    const alerts: Alert[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const cooldownKey = `${rule.id}:${student.id}`;

      // In-memory cooldown check
      const lastAlert = this.alertCache.get(cooldownKey);
      if (lastAlert) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastAlert.getTime() < cooldownMs) {
          continue;
        }
      }

      // DB-level cooldown check (survives restarts)
      const dbCooldownActive = await this.checkDbCooldown(cooldownKey, rule.cooldownMinutes);
      if (dbCooldownActive) continue;

      const triggered = await this.evaluateCondition(rule.condition, student, previousState);

      if (triggered) {
        const alert = this.createAlert(rule, student, cooldownKey);
        alerts.push(alert);
        this.alertCache.set(cooldownKey, new Date());
      }
    }

    if (alerts.length > 0) {
      await this.storeAlerts(alerts);
      await this.sendNotifications(alerts);
    }

    return alerts;
  }

  /**
   * Check DB-level cooldown using cooldown_key
   */
  private async checkDbCooldown(cooldownKey: string, cooldownMinutes: number): Promise<boolean> {
    try {
      const supabase = createAdminSupabaseClient();
      const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000).toISOString();

      const { data } = await supabase
        .from('risk_alerts')
        .select('id')
        .eq('cooldown_key', cooldownKey)
        .gte('created_at', cutoff)
        .limit(1);

      return (data && data.length > 0) || false;
    } catch {
      return false;
    }
  }

  /**
   * Evaluate an alert condition
   */
  private async evaluateCondition(
    condition: AlertCondition,
    current: Student,
    previous?: Student
  ): Promise<boolean> {
    const currentValue = this.getFieldValue(current, condition.field);

    switch (condition.type) {
      case 'threshold':
        return this.evaluateThreshold(currentValue, condition.operator, condition.value);

      case 'change':
        if (!previous) {
          previous = await this.getPreviousState(current.id, condition.windowDays || 7);
        }
        if (!previous) return false;
        const previousValue = this.getFieldValue(previous, condition.field);
        const change = currentValue - previousValue;
        return this.evaluateThreshold(change, condition.operator, condition.value);

      case 'trend':
        return false;

      case 'absence':
        return this.evaluateThreshold(currentValue, condition.operator, condition.value);

      default:
        return false;
    }
  }

  private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'change_by': return value <= threshold;
      default: return false;
    }
  }

  private getFieldValue(student: Student, field: string): number {
    const value = student[field as keyof Student];
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return 0;
  }

  /**
   * Get previous student state from student_metric_history
   * (replaces missing student_snapshots table)
   */
  private async getPreviousState(studentId: string, daysAgo: number): Promise<Student | null> {
    try {
      const supabase = await createServerSupabaseClient();
      const targetDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const { data } = await supabase
        .from('student_metric_history')
        .select('*')
        .eq('student_id', studentId)
        .eq('school_id', this.schoolId)
        .lte('snapshot_date', targetDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (!data) return null;

      // Map metric history fields to Student-like shape
      return {
        id: studentId,
        attendance_rate: data.attendance_rate,
        proficiency_level: data.proficiency_level,
        growth_percentile: data.growth_percentile,
        is_chronically_absent: false,
      } as unknown as Student;
    } catch {
      return null;
    }
  }

  /**
   * Create an alert object with cooldown_key
   */
  private createAlert(rule: AlertRule, student: Student, cooldownKey: string): Alert {
    return {
      id: crypto.randomUUID(),
      schoolId: this.schoolId,
      studentId: student.id,
      ruleId: rule.id,
      alertType: rule.alertType,
      severity: rule.severity,
      status: 'new',
      title: rule.name,
      message: `${rule.description} for ${student.display_name} (Grade ${student.grade_level})`,
      data: {
        studentName: student.display_name,
        gradeLevel: student.grade_level,
        riskLevel: student.risk_level,
        riskScore: student.risk_score,
        teacher: student.homeroom_teacher,
        cooldownKey,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Store alerts in risk_alerts table (replaces early_warning_alerts)
   */
  private async storeAlerts(alerts: Alert[]): Promise<void> {
    const supabase = createAdminSupabaseClient();

    const inserts: RiskAlertInsert[] = alerts.map((a) => ({
      student_id: a.studentId,
      school_id: a.schoolId,
      rule_id: a.ruleId,
      alert_type: a.alertType,
      severity: a.severity,
      title: a.title,
      message: a.message,
      risk_score: typeof a.data.riskScore === 'number' ? a.data.riskScore : undefined,
      risk_level: a.data.riskLevel as string | undefined,
      data: a.data,
      cooldown_key: a.data.cooldownKey as string | undefined,
    }));

    const { error } = await supabase.from('risk_alerts').insert(inserts);
    if (error) {
      console.error('[EarlyWarning] Failed to store alerts:', error.message);
    }
  }

  /**
   * Send notifications for alerts
   */
  private async sendNotifications(alerts: Alert[]): Promise<void> {
    const supabase = createAdminSupabaseClient();

    for (const alert of alerts) {
      const rule = this.rules.find((r) => r.id === alert.ruleId);
      if (!rule) continue;

      const { data: members } = await supabase
        .from('school_memberships')
        .select('user_id, role')
        .eq('school_id', this.schoolId)
        .eq('is_active', true)
        .in('role', rule.notifyRoles);

      if (!members) continue;

      const notifications = members.map((member) => ({
        school_id: this.schoolId,
        user_id: member.user_id,
        type: 'early_warning' as const,
        title: alert.title,
        message: alert.message,
        priority: alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'high' : 'medium',
        metadata: { alertId: alert.id, studentId: alert.studentId, alertType: alert.alertType },
        is_read: false,
        is_dismissed: false,
      }));

      await supabase.from('notifications').insert(notifications);
    }
  }

  /**
   * Batch check all students
   */
  async runBatchCheck(): Promise<{ alertCount: number; studentsChecked: number }> {
    const supabase = await createServerSupabaseClient();

    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', this.schoolId)
      .eq('is_active', true);

    if (!students) return { alertCount: 0, studentsChecked: 0 };

    let alertCount = 0;

    for (const student of students) {
      const alerts = await this.checkStudent(student);
      alertCount += alerts.length;
    }

    return { alertCount, studentsChecked: students.length };
  }

  /**
   * Get active alerts from risk_alerts table
   */
  async getActiveAlerts(limit = 50): Promise<Alert[]> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('risk_alerts')
      .select('*')
      .eq('school_id', this.schoolId)
      .is('resolved_at', null)
      .neq('status', 'dismissed')
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map((d: RiskAlertRow) => this.mapRowToAlert(d));
  }

  /**
   * Acknowledge an alert in risk_alerts
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const supabase = createAdminSupabaseClient();

    await supabase
      .from('risk_alerts')
      .update({
        status: 'acknowledged' as AlertStatus,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
      })
      .eq('id', alertId)
      .eq('school_id', this.schoolId);
  }

  /**
   * Resolve an alert in risk_alerts
   */
  async resolveAlert(alertId: string, userId: string, notes?: string): Promise<void> {
    const supabase = createAdminSupabaseClient();

    await supabase
      .from('risk_alerts')
      .update({
        status: 'resolved' as AlertStatus,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_notes: notes || null,
      })
      .eq('id', alertId)
      .eq('school_id', this.schoolId);
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(alertId: string, userId: string): Promise<void> {
    const supabase = createAdminSupabaseClient();

    await supabase
      .from('risk_alerts')
      .update({
        status: 'dismissed' as AlertStatus,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
      })
      .eq('id', alertId)
      .eq('school_id', this.schoolId);
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) rule.enabled = enabled;
  }

  /**
   * Get alert statistics from risk_alerts
   */
  async getAlertStats(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    avgResolutionTimeHours: number;
  }> {
    const supabase = await createServerSupabaseClient();

    const { data: alerts } = await supabase
      .from('risk_alerts')
      .select('severity, alert_type, status, created_at, resolved_at')
      .eq('school_id', this.schoolId);

    if (!alerts || alerts.length === 0) {
      return { total: 0, bySeverity: {}, byType: {}, byStatus: {}, avgResolutionTimeHours: 0 };
    }

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const alert of alerts) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byType[alert.alert_type] = (byType[alert.alert_type] || 0) + 1;
      byStatus[alert.status] = (byStatus[alert.status] || 0) + 1;

      if (alert.resolved_at) {
        const ms = new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime();
        totalResolutionTime += ms;
        resolvedCount++;
      }
    }

    return {
      total: alerts.length,
      bySeverity,
      byType,
      byStatus,
      avgResolutionTimeHours: resolvedCount > 0 ? totalResolutionTime / resolvedCount / (1000 * 60 * 60) : 0,
    };
  }

  /**
   * Map a DB row to an Alert object
   */
  private mapRowToAlert(row: RiskAlertRow): Alert {
    return {
      id: row.id,
      schoolId: row.school_id,
      studentId: row.student_id,
      ruleId: row.rule_id || null,
      alertType: row.alert_type,
      severity: row.severity,
      status: row.status,
      title: row.title,
      message: row.message,
      data: (row.data || {}) as Record<string, unknown>,
      createdAt: new Date(row.created_at),
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
      acknowledgedBy: row.acknowledged_by || undefined,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolvedBy: row.resolved_by || undefined,
      resolutionNotes: row.resolution_notes || undefined,
    };
  }
}

/**
 * Create an early warning system for a school
 */
export function createEarlyWarningSystem(schoolId: string, customRules?: AlertRule[]): EarlyWarningSystem {
  return new EarlyWarningSystem(schoolId, customRules);
}