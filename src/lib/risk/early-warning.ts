/**
 * Early Warning System
 * ====================
 *
 * Real-time monitoring for student risk indicators with
 * configurable alerts and notifications.
 *
 * Features:
 * - Threshold-based alerting
 * - Trend detection alerts
 * - Batch monitoring
 * - Alert suppression and deduplication
 */

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { Student } from '@/lib/database.types';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;   // Minimum time between same alerts
  notifyRoles: string[];     // Roles to notify
}

export interface AlertCondition {
  type: 'threshold' | 'change' | 'trend' | 'absence';
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'change_by';
  value: number;
  windowDays?: number;       // For trend/change conditions
}

export interface Alert {
  id: string;
  schoolId: string;
  studentId: string;
  ruleId: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data: Record<string, unknown>;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Default alert rules
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'attendance-drop',
    name: 'Sudden Attendance Drop',
    description: 'Attendance drops by more than 10% in a week',
    condition: { type: 'change', field: 'attendance_rate', operator: 'change_by', value: -0.1, windowDays: 7 },
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 1440, // 24 hours
    notifyRoles: ['teacher', 'counselor'],
  },
  {
    id: 'chronic-absence-new',
    name: 'New Chronic Absence',
    description: 'Student becomes chronically absent',
    condition: { type: 'threshold', field: 'is_chronically_absent', operator: 'eq', value: 1 },
    severity: 'critical',
    enabled: true,
    cooldownMinutes: 10080, // 7 days
    notifyRoles: ['teacher', 'counselor', 'admin'],
  },
  {
    id: 'risk-critical',
    name: 'Critical Risk Level',
    description: 'Student moves to critical risk level',
    condition: { type: 'threshold', field: 'risk_score', operator: 'gte', value: 0.7 },
    severity: 'critical',
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
    enabled: true,
    cooldownMinutes: 2880, // 2 days
    notifyRoles: ['teacher'],
  },
  {
    id: 'consecutive-absences',
    name: 'Consecutive Absences',
    description: 'Student absent 3+ consecutive days',
    condition: { type: 'absence', field: 'consecutive_absences', operator: 'gte', value: 3 },
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 1440,
    notifyRoles: ['teacher', 'counselor'],
  },
];

/**
 * Early Warning System
 *
 * Monitors student data for concerning patterns and generates alerts
 */
export class EarlyWarningSystem {
  private schoolId: string;
  private rules: AlertRule[];
  private alertCache: Map<string, Date> = new Map(); // For cooldown tracking

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

      // Check cooldown
      const cacheKey = `${rule.id}:${student.id}`;
      const lastAlert = this.alertCache.get(cacheKey);
      if (lastAlert) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastAlert.getTime() < cooldownMs) {
          continue;
        }
      }

      const triggered = await this.evaluateCondition(rule.condition, student, previousState);

      if (triggered) {
        const alert = this.createAlert(rule, student);
        alerts.push(alert);

        // Update cache
        this.alertCache.set(cacheKey, new Date());
      }
    }

    if (alerts.length > 0) {
      await this.storeAlerts(alerts);
      await this.sendNotifications(alerts);
    }

    return alerts;
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
          // Fetch previous state from history
          previous = await this.getPreviousState(current.id, condition.windowDays || 7);
        }
        if (!previous) return false;
        const previousValue = this.getFieldValue(previous, condition.field);
        const change = currentValue - previousValue;
        return this.evaluateThreshold(change, condition.operator, condition.value);

      case 'trend':
        // Would analyze multiple historical points
        return false;

      case 'absence':
        // Would check attendance records for consecutive absences
        return this.evaluateThreshold(currentValue, condition.operator, condition.value);

      default:
        return false;
    }
  }

  /**
   * Evaluate a threshold condition
   */
  private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'change_by': return value <= threshold; // For negative changes
      default: return false;
    }
  }

  /**
   * Get field value from student record
   */
  private getFieldValue(student: Student, field: string): number {
    const value = student[field as keyof Student];
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return 0;
  }

  /**
   * Get previous student state from history
   */
  private async getPreviousState(studentId: string, daysAgo: number): Promise<Student | null> {
    const supabase = await createServerSupabaseClient();
    const targetDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from('student_snapshots')
      .select('*')
      .eq('student_id', studentId)
      .lte('snapshot_at', targetDate.toISOString())
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .single();

    return data as Student | null;
  }

  /**
   * Create an alert object
   */
  private createAlert(rule: AlertRule, student: Student): Alert {
    return {
      id: crypto.randomUUID(),
      schoolId: this.schoolId,
      studentId: student.id,
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: this.formatAlertMessage(rule, student),
      data: {
        studentName: student.display_name,
        gradeLevel: student.grade_level,
        riskLevel: student.risk_level,
        riskScore: student.risk_score,
        teacher: student.homeroom_teacher,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Format alert message with student context
   */
  private formatAlertMessage(rule: AlertRule, student: Student): string {
    return `${rule.description} for ${student.display_name} (Grade ${student.grade_level})`;
  }

  /**
   * Store alerts in database
   */
  private async storeAlerts(alerts: Alert[]): Promise<void> {
    const supabase = createAdminSupabaseClient();

    await supabase.from('early_warning_alerts').insert(
      alerts.map((a) => ({
        id: a.id,
        school_id: a.schoolId,
        student_id: a.studentId,
        rule_id: a.ruleId,
        severity: a.severity,
        title: a.title,
        message: a.message,
        data: a.data,
        created_at: a.createdAt.toISOString(),
      }))
    );
  }

  /**
   * Send notifications for alerts
   */
  private async sendNotifications(alerts: Alert[]): Promise<void> {
    const supabase = createAdminSupabaseClient();

    for (const alert of alerts) {
      const rule = this.rules.find((r) => r.id === alert.ruleId);
      if (!rule) continue;

      // Get users to notify based on roles
      const { data: users } = await supabase
        .from('school_users')
        .select('user_id, role')
        .eq('school_id', this.schoolId)
        .in('role', rule.notifyRoles);

      if (!users) continue;

      // Create notifications
      const notifications = users.map((user) => ({
        school_id: this.schoolId,
        user_id: user.user_id,
        type: 'early_warning',
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        data: { alertId: alert.id, studentId: alert.studentId },
        read: false,
      }));

      await supabase.from('notifications').insert(notifications);
    }
  }

  /**
   * Batch check all students in a school
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
   * Get active alerts for a school
   */
  async getActiveAlerts(limit = 50): Promise<Alert[]> {
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
      .from('early_warning_alerts')
      .select('*')
      .eq('school_id', this.schoolId)
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map((d) => ({
      ...d,
      createdAt: new Date(d.created_at),
      acknowledgedAt: d.acknowledged_at ? new Date(d.acknowledged_at) : undefined,
    })) as Alert[];
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const supabase = createAdminSupabaseClient();

    await supabase
      .from('early_warning_alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
      })
      .eq('id', alertId);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, userId: string, notes?: string): Promise<void> {
    const supabase = createAdminSupabaseClient();

    await supabase
      .from('early_warning_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_notes: notes,
      })
      .eq('id', alertId);
  }

  /**
   * Add a custom alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byRule: Record<string, number>;
    avgResolutionTimeHours: number;
  }> {
    const supabase = await createServerSupabaseClient();

    const { data: alerts } = await supabase
      .from('early_warning_alerts')
      .select('severity, rule_id, created_at, resolved_at')
      .eq('school_id', this.schoolId);

    if (!alerts || alerts.length === 0) {
      return {
        total: 0,
        bySeverity: {},
        byRule: {},
        avgResolutionTimeHours: 0,
      };
    }

    const bySeverity: Record<string, number> = {};
    const byRule: Record<string, number> = {};
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const alert of alerts) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byRule[alert.rule_id] = (byRule[alert.rule_id] || 0) + 1;

      if (alert.resolved_at) {
        const resolutionTime = new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    }

    return {
      total: alerts.length,
      bySeverity,
      byRule,
      avgResolutionTimeHours: resolvedCount > 0 ? totalResolutionTime / resolvedCount / (1000 * 60 * 60) : 0,
    };
  }
}

/**
 * Create an early warning system for a school
 */
export function createEarlyWarningSystem(schoolId: string, customRules?: AlertRule[]): EarlyWarningSystem {
  return new EarlyWarningSystem(schoolId, customRules);
}
