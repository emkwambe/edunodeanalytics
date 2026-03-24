// Table intervention_audit_log is defined but not yet migrated to DB
import type { Json } from '@/lib/database.types';

/**
 * Intervention Workflow Manager
 * =============================
 *
 * Layer 3: Comprehensive intervention planning, tracking, and
 * effectiveness measurement system.
 *
 * Features:
 * - Intervention lifecycle management
 * - Progress tracking and milestones
 * - Effectiveness scoring
 * - Team collaboration workflows
 * - Template-based intervention plans
 */

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { Intervention, InterventionInsert } from '@/lib/database.types';

// Intervention types
export type InterventionType =
  | 'academic'
  | 'attendance'
  | 'behavior'
  | 'sel'           // Social-Emotional Learning
  | 'family_engagement'
  | 'mentoring'
  | 'health'
  | 'custom';

export type InterventionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

export type InterventionPriority = 'low' | 'medium' | 'high' | 'urgent';

// Workflow states
export interface WorkflowState {
  status: InterventionStatus;
  phase: 'planning' | 'approval' | 'implementation' | 'monitoring' | 'evaluation' | 'closed';
  progress: number;            // 0-100
  nextAction: string;
  blockers: string[];
  dueDate: Date | null;
}

// Intervention template
export interface InterventionTemplate {
  id: string;
  name: string;
  type: InterventionType;
  description: string;
  defaultDuration: number;     // Days
  goals: string[];
  successCriteria: string[];
  milestones: MilestoneTemplate[];
  resources: Resource[];
  requiredRoles: string[];
}

export interface MilestoneTemplate {
  name: string;
  description: string;
  dayOffset: number;           // Days from start
  checkItems: string[];
}

export interface Resource {
  name: string;
  type: 'document' | 'video' | 'link' | 'tool';
  url?: string;
  description: string;
}

// Progress tracking
export interface ProgressEntry {
  id: string;
  interventionId: string;
  date: Date;
  note: string;
  measuredValue?: number;
  updatedBy: string;
  attachments?: string[];
}

export interface Milestone {
  id: string;
  interventionId: string;
  name: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  checkItems: CheckItem[];
}

export interface CheckItem {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
}

// Team assignment
export interface TeamMember {
  userId: string;
  name: string;
  role: 'owner' | 'contributor' | 'observer';
  assignedAt: Date;
}

// Effectiveness metrics
export interface EffectivenessScore {
  overall: number;            // 0-100
  goalProgress: number;       // 0-100
  timelinessScore: number;    // 0-100
  engagementScore: number;    // 0-100
  outcomeAchieved: boolean;
  recommendation: 'continue' | 'modify' | 'escalate' | 'close';
}

// Default intervention templates
export const INTERVENTION_TEMPLATES: InterventionTemplate[] = [
  {
    id: 'academic-tutoring',
    name: 'Academic Tutoring Support',
    type: 'academic',
    description: 'One-on-one or small group tutoring to address academic gaps',
    defaultDuration: 60,
    goals: [
      'Improve subject proficiency by at least one level',
      'Build foundational skills in identified areas',
      'Develop independent learning strategies',
    ],
    successCriteria: [
      'Student achieves proficiency benchmark on post-assessment',
      'Grade improvement of at least one letter grade',
      'Teacher reports improved classroom participation',
    ],
    milestones: [
      { name: 'Initial Assessment', description: 'Complete diagnostic assessment', dayOffset: 3, checkItems: ['Administer assessment', 'Analyze results', 'Identify focus areas'] },
      { name: 'Intervention Plan', description: 'Create detailed intervention plan', dayOffset: 7, checkItems: ['Set specific goals', 'Schedule sessions', 'Notify family'] },
      { name: 'Mid-point Check', description: 'Evaluate progress at midpoint', dayOffset: 30, checkItems: ['Progress assessment', 'Adjust plan if needed', 'Family update'] },
      { name: 'Final Evaluation', description: 'Complete final assessment', dayOffset: 60, checkItems: ['Post-assessment', 'Document outcomes', 'Recommend next steps'] },
    ],
    resources: [
      { name: 'Tutoring Best Practices Guide', type: 'document', description: 'Evidence-based tutoring strategies' },
      { name: 'Progress Tracking Template', type: 'document', description: 'Weekly progress log template' },
    ],
    requiredRoles: ['teacher', 'tutor'],
  },
  {
    id: 'attendance-family',
    name: 'Attendance Improvement Plan',
    type: 'attendance',
    description: 'Family-centered approach to improving student attendance',
    defaultDuration: 90,
    goals: [
      'Achieve 90% or higher attendance rate',
      'Eliminate chronic absence status',
      'Address root causes of absences',
    ],
    successCriteria: [
      'Attendance rate improves to 90%+ for 3 consecutive months',
      'Student no longer meets chronic absence threshold',
      'Family reports reduced barriers to attendance',
    ],
    milestones: [
      { name: 'Family Meeting', description: 'Initial meeting with family', dayOffset: 5, checkItems: ['Schedule meeting', 'Identify barriers', 'Document concerns'] },
      { name: 'Support Plan', description: 'Implement support services', dayOffset: 14, checkItems: ['Connect with resources', 'Set up check-ins', 'Create incentive plan'] },
      { name: 'Weekly Review', description: 'Review weekly attendance', dayOffset: 21, checkItems: ['Track attendance', 'Contact family if absences', 'Celebrate improvements'] },
      { name: 'Monthly Check-in', description: 'Monthly family check-in', dayOffset: 30, checkItems: ['Review progress', 'Adjust supports', 'Plan next month'] },
    ],
    resources: [
      { name: 'Attendance Resources Guide', type: 'document', description: 'Community resources for attendance barriers' },
      { name: 'Family Communication Templates', type: 'document', description: 'Sample letters and scripts' },
    ],
    requiredRoles: ['counselor', 'teacher', 'social_worker'],
  },
  {
    id: 'sel-counseling',
    name: 'SEL Counseling Support',
    type: 'sel',
    description: 'Individual counseling for social-emotional skill development',
    defaultDuration: 45,
    goals: [
      'Develop self-regulation strategies',
      'Improve social relationships',
      'Reduce anxiety/stress responses',
    ],
    successCriteria: [
      'Student demonstrates use of coping strategies',
      'Reduction in behavioral incidents',
      'Improved peer relationships reported by teacher',
    ],
    milestones: [
      { name: 'SEL Assessment', description: 'Complete SEL screening', dayOffset: 3, checkItems: ['Administer SEL screener', 'Review results', 'Identify focus areas'] },
      { name: 'Counseling Start', description: 'Begin regular sessions', dayOffset: 7, checkItems: ['Schedule weekly sessions', 'Establish rapport', 'Set goals with student'] },
      { name: 'Mid-point Review', description: 'Review progress', dayOffset: 21, checkItems: ['Progress check', 'Adjust approach', 'Teacher feedback'] },
      { name: 'Skill Demonstration', description: 'Student demonstrates skills', dayOffset: 42, checkItems: ['Observe skill use', 'Document progress', 'Plan maintenance'] },
    ],
    resources: [
      { name: 'SEL Curriculum Guide', type: 'document', description: 'Evidence-based SEL activities' },
      { name: 'Coping Strategies Toolkit', type: 'document', description: 'Student-friendly coping tools' },
    ],
    requiredRoles: ['counselor', 'teacher'],
  },
];

/**
 * Intervention Workflow Manager
 *
 * Manages the full lifecycle of student interventions
 */
export class InterventionWorkflowManager {
  private schoolId: string;
  private templates: InterventionTemplate[];

  constructor(schoolId: string) {
    this.schoolId = schoolId;
    this.templates = [...INTERVENTION_TEMPLATES];
  }

  /**
   * Create a new intervention from a template
   */
  async createFromTemplate(
    templateId: string,
    studentId: string,
    assignedTo: string,
    createdBy: string,
    customizations?: Partial<InterventionInsert>
  ): Promise<Intervention | null> {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const startDate = new Date();
    const targetEndDate = new Date(startDate.getTime() + template.defaultDuration * 24 * 60 * 60 * 1000);

    const intervention: InterventionInsert = {
      school_id: this.schoolId,
      student_id: studentId,
      created_by_user_id: createdBy,
      assigned_to_user_id: assignedTo,
      type: template.type as Intervention['type'],
      title: customizations?.title || template.name,
      description: customizations?.description || template.description,
      status: 'planned',
      priority: customizations?.priority || 'medium',
      start_date: startDate.toISOString().split('T')[0],
      target_end_date: targetEndDate.toISOString().split('T')[0],
      goal: template.goals.join('; '),
      success_criteria: template.successCriteria.join('; '),
      metadata: {
        templateId,
        milestones: template.milestones.map((m) => ({
          ...m,
          status: 'pending',
          targetDate: new Date(startDate.getTime() + m.dayOffset * 24 * 60 * 60 * 1000).toISOString(),
        })),
        resources: template.resources.map(r => ({ ...r })),
      } as Json,
      ...customizations,
    };

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('interventions')
      .insert(intervention)
      .select()
      .single();

    if (error) {
      console.error('[Workflow] Error creating intervention:', error);
      return null;
    }

    // Log creation in audit
    await this.logWorkflowEvent(data.id, 'created', createdBy, {
      templateId,
      studentId,
      assignedTo,
    });

    return data;
  }

  /**
   * Get workflow state for an intervention
   */
  async getWorkflowState(interventionId: string): Promise<WorkflowState> {
    const supabase = await createServerSupabaseClient();

    const { data: intervention } = await supabase
      .from('interventions')
      .select('*')
      .eq('id', interventionId)
      .single();

    if (!intervention) {
      throw new Error(`Intervention not found: ${interventionId}`);
    }

    // Calculate progress based on milestones and current value
    const progress = this.calculateProgress(intervention);
    const phase = this.determinePhase(intervention);
    const nextAction = this.determineNextAction(intervention, phase);
    const blockers = await this.getBlockers(interventionId);

    return {
      status: intervention.status,
      phase,
      progress,
      nextAction,
      blockers,
      dueDate: intervention.target_end_date ? new Date(intervention.target_end_date) : null,
    };
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(intervention: Intervention): number {
    // If completed, return 100
    if (intervention.status === 'completed') return 100;
    if (intervention.status === 'cancelled') return 0;

    // Calculate based on baseline, current, and target values
    if (
      intervention.baseline_value !== null &&
      intervention.current_value !== null &&
      intervention.target_value !== null
    ) {
      const range = intervention.target_value - intervention.baseline_value;
      if (range === 0) return 50;

      const progress = (intervention.current_value - intervention.baseline_value) / range;
      return Math.min(100, Math.max(0, Math.round(progress * 100)));
    }

    // Fallback: calculate based on time elapsed
    if (intervention.start_date && intervention.target_end_date) {
      const start = new Date(intervention.start_date).getTime();
      const end = new Date(intervention.target_end_date).getTime();
      const now = Date.now();

      const elapsed = (now - start) / (end - start);
      return Math.min(100, Math.max(0, Math.round(elapsed * 100)));
    }

    return 0;
  }

  /**
   * Determine current phase
   */
  private determinePhase(intervention: Intervention): WorkflowState['phase'] {
    switch (intervention.status) {
      case 'planned':
        return 'planning';
      case 'in_progress': {
        // Check if we're in early, mid, or late stage
        const progress = this.calculateProgress(intervention);
        if (progress < 25) return 'implementation';
        if (progress < 75) return 'monitoring';
        return 'evaluation';
      }
      case 'completed':
        return 'closed';
      case 'cancelled':
        return 'closed';
      default:
        return 'planning';
    }
  }

  /**
   * Determine next action
   */
  private determineNextAction(intervention: Intervention, phase: string): string {
    switch (phase) {
      case 'planning':
        return 'Review and approve intervention plan';
      case 'approval':
        return 'Obtain necessary approvals to proceed';
      case 'implementation':
        return 'Begin intervention activities with student';
      case 'monitoring':
        return 'Record progress and update metrics';
      case 'evaluation':
        return 'Complete final assessment and document outcomes';
      case 'closed':
        return 'Review intervention effectiveness for future reference';
      default:
        return 'Review intervention status';
    }
  }

  /**
   * Get blockers for an intervention
   */
  private async getBlockers(interventionId: string): Promise<string[]> {
    const blockers: string[] = [];

    const supabase = await createServerSupabaseClient();
    const { data: intervention } = await supabase
      .from('interventions')
      .select('*')
      .eq('id', interventionId)
      .single();

    if (!intervention) return blockers;

    // Check for overdue milestones
    const metadata = intervention.metadata as Record<string, unknown> | null;
    if (metadata?.milestones) {
      const milestones = metadata.milestones as Array<{ targetDate: string; status: string; name: string }>;
      const overdue = milestones.filter(
        (m) => m.status === 'pending' && new Date(m.targetDate) < new Date()
      );
      if (overdue.length > 0) {
        blockers.push(`${overdue.length} overdue milestone(s): ${overdue.map((m) => m.name).join(', ')}`);
      }
    }

    // Check if past due date
    if (intervention.target_end_date && new Date(intervention.target_end_date) < new Date()) {
      if (intervention.status !== 'completed' && intervention.status !== 'cancelled') {
        blockers.push('Intervention is past target end date');
      }
    }

    // Check for stale progress
    if (intervention.updated_at) {
      const daysSinceUpdate = (Date.now() - new Date(intervention.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 14 && intervention.status === 'in_progress') {
        blockers.push('No progress updates in over 2 weeks');
      }
    }

    return blockers;
  }

  /**
   * Update intervention progress
   */
  async updateProgress(
    interventionId: string,
    currentValue: number,
    note: string,
    updatedBy: string
  ): Promise<Intervention | null> {
    const supabase = createAdminSupabaseClient();

    // Get existing progress notes
    const { data: existing } = await supabase
      .from('interventions')
      .select('progress_notes')
      .eq('id', interventionId)
      .single();

    const existingNotes = (existing?.progress_notes as Array<Record<string, unknown>>) || [];
    const newNote = {
      date: new Date().toISOString(),
      note,
      value: currentValue,
      updatedBy,
    };

    const { data, error } = await supabase
      .from('interventions')
      .update({
        current_value: currentValue,
        progress_notes: [...existingNotes, newNote] as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', interventionId)
      .select()
      .single();

    if (error) {
      console.error('[Workflow] Error updating progress:', error);
      return null;
    }

    await this.logWorkflowEvent(interventionId, 'progress_updated', updatedBy, {
      currentValue,
      note,
    });

    return data;
  }

  /**
   * Transition intervention to a new status
   */
  async transitionStatus(
    interventionId: string,
    newStatus: InterventionStatus,
    userId: string,
    notes?: string
  ): Promise<Intervention | null> {
    const supabase = createAdminSupabaseClient();

    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Add completion details if completing
    if (newStatus === 'completed') {
      updates.actual_end_date = new Date().toISOString().split('T')[0];
      if (notes) {
        updates.outcome_summary = notes;
      }
    }

    const { data, error } = await supabase
      .from('interventions')
      .update(updates)
      .eq('id', interventionId)
      .select()
      .single();

    if (error) {
      console.error('[Workflow] Error transitioning status:', error);
      return null;
    }

    await this.logWorkflowEvent(interventionId, 'status_changed', userId, {
      newStatus,
      notes,
    });

    return data;
  }

  /**
   * Calculate effectiveness score
   */
  async calculateEffectiveness(interventionId: string): Promise<EffectivenessScore> {
    const supabase = await createServerSupabaseClient();

    const { data: intervention } = await supabase
      .from('interventions')
      .select('*')
      .eq('id', interventionId)
      .single();

    if (!intervention) {
      throw new Error(`Intervention not found: ${interventionId}`);
    }

    // Goal progress score
    let goalProgress = 0;
    if (
      intervention.baseline_value !== null &&
      intervention.current_value !== null &&
      intervention.target_value !== null
    ) {
      const range = intervention.target_value - intervention.baseline_value;
      if (range !== 0) {
        goalProgress = Math.min(100, Math.max(0,
          ((intervention.current_value - intervention.baseline_value) / range) * 100
        ));
      }
    }

    // Timeliness score
    let timelinessScore = 100;
    if (intervention.target_end_date && intervention.actual_end_date) {
      const targetEnd = new Date(intervention.target_end_date).getTime();
      const actualEnd = new Date(intervention.actual_end_date).getTime();
      const daysOverdue = (actualEnd - targetEnd) / (1000 * 60 * 60 * 24);

      if (daysOverdue > 0) {
        timelinessScore = Math.max(0, 100 - daysOverdue * 5);
      }
    } else if (intervention.target_end_date && !intervention.actual_end_date) {
      const targetEnd = new Date(intervention.target_end_date).getTime();
      const daysOverdue = (Date.now() - targetEnd) / (1000 * 60 * 60 * 24);

      if (daysOverdue > 0) {
        timelinessScore = Math.max(0, 100 - daysOverdue * 5);
      }
    }

    // Engagement score based on progress notes
    const progressNotes = (intervention.progress_notes as Array<Record<string, unknown>>) || [];
    const expectedUpdates = intervention.start_date
      ? Math.ceil((Date.now() - new Date(intervention.start_date).getTime()) / (1000 * 60 * 60 * 24 * 7))
      : 4;
    const engagementScore = Math.min(100, (progressNotes.length / expectedUpdates) * 100);

    // Overall score
    const overall = Math.round(
      goalProgress * 0.5 +
      timelinessScore * 0.3 +
      engagementScore * 0.2
    );

    // Determine recommendation
    let recommendation: EffectivenessScore['recommendation'] = 'continue';
    if (overall >= 80 && goalProgress >= 90) {
      recommendation = 'close';
    } else if (overall < 40) {
      recommendation = 'escalate';
    } else if (overall < 60) {
      recommendation = 'modify';
    }

    return {
      overall,
      goalProgress,
      timelinessScore,
      engagementScore,
      outcomeAchieved: intervention.was_successful || false,
      recommendation,
    };
  }

  /**
   * Get interventions needing attention
   */
  async getInterventionsNeedingAttention(): Promise<Array<{
    intervention: Intervention;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  }>> {
    const supabase = await createServerSupabaseClient();

    const { data: interventions } = await supabase
      .from('interventions')
      .select('*')
      .eq('school_id', this.schoolId)
      .in('status', ['planned', 'in_progress']);

    if (!interventions) return [];

    const needsAttention: Array<{
      intervention: Intervention;
      reason: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];

    for (const intervention of interventions) {
      const blockers = await this.getBlockers(intervention.id);

      if (blockers.length > 0) {
        needsAttention.push({
          intervention,
          reason: blockers[0],
          priority: blockers.length > 1 ? 'high' : 'medium',
        });
        continue;
      }

      // Check for stale planned interventions
      if (intervention.status === 'planned' && intervention.start_date) {
        const daysUntilStart = (new Date(intervention.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilStart < 3 && daysUntilStart > 0) {
          needsAttention.push({
            intervention,
            reason: 'Intervention starting soon - needs final preparation',
            priority: 'medium',
          });
        } else if (daysUntilStart < 0) {
          needsAttention.push({
            intervention,
            reason: 'Intervention past start date but not started',
            priority: 'high',
          });
        }
      }
    }

    return needsAttention.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Log workflow event for audit trail
   */
  private async logWorkflowEvent(
    interventionId: string,
    eventType: string,
    userId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const supabase = createAdminSupabaseClient();

    await supabase.from('intervention_audit_log').insert({
      intervention_id: interventionId,
      school_id: this.schoolId,
      event_type: eventType,
      user_id: userId,
      data: data as Json,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Get available templates
   */
  getTemplates(): InterventionTemplate[] {
    return this.templates;
  }

  /**
   * Add a custom template
   */
  addTemplate(template: InterventionTemplate): void {
    this.templates.push(template);
  }
}

/**
 * Create a workflow manager for a school
 */
export function createWorkflowManager(schoolId: string): InterventionWorkflowManager {
  return new InterventionWorkflowManager(schoolId);
}
