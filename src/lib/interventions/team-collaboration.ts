/**
 * Team Collaboration for Interventions
 * =====================================
 *
 * Manages team assignments, communication, and coordination
 * for intervention planning and execution.
 *
 * Features:
 * - Team member assignment and roles
 * - Communication threads
 * - Task delegation
 * - Meeting scheduling
 * - Document sharing
 */

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/database.types';

// Type definitions for tables not yet in the schema
// These are used for type assertions when querying tables that don't exist in generated types
type InterventionTeamMemberRow = {
  intervention_id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  assigned_by: string;
  user?: { id: string; email: string; first_name: string; last_name: string } | null;
  school_user?: { role: string } | null;
};

type InterventionTaskRow = {
  id: string;
  intervention_id: string;
  title: string;
  description: string;
  assigned_to: string;
  created_by: string;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string;
};

type InterventionCommentRow = {
  id: string;
  intervention_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  reply_to: string | null;
  mentions: string[];
  attachments: Json;
};

type InterventionMeetingRow = {
  id: string;
  intervention_id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration: number;
  location: string;
  attendees: string[];
  organizer: string;
  status: string;
  notes: string | null;
  decisions: string[];
  action_items: string[];
};

export type TeamRole = 'owner' | 'lead' | 'contributor' | 'observer';

export interface TeamMember {
  id: string;
  userId: string;
  interventionId: string;
  role: TeamRole;
  name: string;
  email: string;
  title: string;           // Job title
  assignedAt: Date;
  permissions: TeamPermissions;
}

export interface TeamPermissions {
  canEdit: boolean;
  canAddProgress: boolean;
  canAssignTasks: boolean;
  canComplete: boolean;
  canViewAllNotes: boolean;
}

export interface TeamTask {
  id: string;
  interventionId: string;
  title: string;
  description: string;
  assignedTo: string;       // User ID
  createdBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
  completedAt: Date | null;
  notes: string;
}

export interface TeamComment {
  id: string;
  interventionId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date | null;
  replyTo: string | null;   // Parent comment ID
  mentions: string[];       // User IDs mentioned
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TeamMeeting {
  id: string;
  interventionId: string;
  title: string;
  description: string;
  scheduledAt: Date;
  duration: number;         // Minutes
  location: string;         // Room or video link
  attendees: string[];      // User IDs
  organizer: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string | null;
  decisions: string[];
  actionItems: string[];
}

// Role-based permissions
const ROLE_PERMISSIONS: Record<TeamRole, TeamPermissions> = {
  owner: {
    canEdit: true,
    canAddProgress: true,
    canAssignTasks: true,
    canComplete: true,
    canViewAllNotes: true,
  },
  lead: {
    canEdit: true,
    canAddProgress: true,
    canAssignTasks: true,
    canComplete: false,
    canViewAllNotes: true,
  },
  contributor: {
    canEdit: false,
    canAddProgress: true,
    canAssignTasks: false,
    canComplete: false,
    canViewAllNotes: true,
  },
  observer: {
    canEdit: false,
    canAddProgress: false,
    canAssignTasks: false,
    canComplete: false,
    canViewAllNotes: false,
  },
};

/**
 * Team Collaboration Manager
 */
export class TeamCollaborationManager {
  private schoolId: string;

  constructor(schoolId: string) {
    this.schoolId = schoolId;
  }

  /**
   * Add a team member to an intervention
   */
  async addTeamMember(
    interventionId: string,
    userId: string,
    role: TeamRole,
    addedBy: string
  ): Promise<TeamMember | null> {
    const supabase = createAdminSupabaseClient();

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', userId)
      .single();

    if (!user) return null;

    // Get user's school role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: schoolUser } = await (supabase as any)
      .from('school_users')
      .select('role')
      .eq('user_id', userId)
      .eq('school_id', this.schoolId)
      .single() as { data: { role: string } | null };

    const memberData = {
      intervention_id: interventionId,
      user_id: userId,
      role,
      assigned_at: new Date().toISOString(),
      assigned_by: addedBy,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('intervention_team_members')
      .insert(memberData);

    if (error) {
      console.error('[TeamCollab] Error adding team member:', error);
      return null;
    }

    // Create notification for new team member
    await this.notifyTeamMember(userId, interventionId, 'assigned');

    return {
      id: `${interventionId}-${userId}`,
      userId,
      interventionId,
      role,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      title: schoolUser?.role || 'Staff',
      assignedAt: new Date(),
      permissions: ROLE_PERMISSIONS[role],
    };
  }

  /**
   * Remove a team member from an intervention
   */
  async removeTeamMember(interventionId: string, userId: string): Promise<boolean> {
    const supabase = createAdminSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('intervention_team_members')
      .delete()
      .eq('intervention_id', interventionId)
      .eq('user_id', userId);

    if (error) {
      console.error('[TeamCollab] Error removing team member:', error);
      return false;
    }

    return true;
  }

  /**
   * Update team member role
   */
  async updateRole(interventionId: string, userId: string, newRole: TeamRole): Promise<boolean> {
    const supabase = createAdminSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('intervention_team_members')
      .update({ role: newRole })
      .eq('intervention_id', interventionId)
      .eq('user_id', userId);

    if (error) {
      console.error('[TeamCollab] Error updating role:', error);
      return false;
    }

    return true;
  }

  /**
   * Get team members for an intervention
   */
  async getTeamMembers(interventionId: string): Promise<TeamMember[]> {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('intervention_team_members')
      .select(`
        *,
        user:users(id, email, first_name, last_name),
        school_user:school_users(role)
      `)
      .eq('intervention_id', interventionId) as { data: InterventionTeamMemberRow[] | null };

    if (!data) return [];

    return data.map((m) => ({
      id: `${m.intervention_id}-${m.user_id}`,
      userId: m.user_id,
      interventionId: m.intervention_id,
      role: m.role as TeamRole,
      name: m.user ? `${m.user.first_name} ${m.user.last_name}` : 'Unknown',
      email: m.user?.email || '',
      title: m.school_user?.role || 'Staff',
      assignedAt: new Date(m.assigned_at),
      permissions: ROLE_PERMISSIONS[m.role as TeamRole],
    }));
  }

  /**
   * Create a task for the intervention team
   */
  async createTask(
    interventionId: string,
    task: Omit<TeamTask, 'id' | 'completedAt' | 'status'>,
    createdBy: string
  ): Promise<TeamTask | null> {
    const supabase = createAdminSupabaseClient();

    const taskData = {
      intervention_id: interventionId,
      title: task.title,
      description: task.description,
      assigned_to: task.assignedTo,
      created_by: createdBy,
      status: 'pending',
      priority: task.priority,
      due_date: task.dueDate?.toISOString() || null,
      notes: task.notes,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('intervention_tasks')
      .insert(taskData)
      .select()
      .single() as { data: InterventionTaskRow | null; error: Error | null };

    if (error || !data) {
      console.error('[TeamCollab] Error creating task:', error);
      return null;
    }

    // Notify assigned user
    await this.notifyTeamMember(task.assignedTo, interventionId, 'task_assigned', {
      taskTitle: task.title,
    });

    return {
      id: data.id,
      interventionId,
      title: data.title,
      description: data.description,
      assignedTo: data.assigned_to,
      createdBy: data.created_by,
      status: data.status as TeamTask['status'],
      priority: data.priority as TeamTask['priority'],
      dueDate: data.due_date ? new Date(data.due_date) : null,
      completedAt: null,
      notes: data.notes,
    };
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: TeamTask['status'], userId: string): Promise<boolean> {
    const supabase = createAdminSupabaseClient();

    const updates: Record<string, unknown> = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = userId;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('intervention_tasks')
      .update(updates)
      .eq('id', taskId);

    return !error;
  }

  /**
   * Get tasks for an intervention
   */
  async getTasks(interventionId: string): Promise<TeamTask[]> {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('intervention_tasks')
      .select('*')
      .eq('intervention_id', interventionId)
      .order('due_date', { ascending: true }) as { data: InterventionTaskRow[] | null };

    if (!data) return [];

    return data.map((t) => ({
      id: t.id,
      interventionId: t.intervention_id,
      title: t.title,
      description: t.description,
      assignedTo: t.assigned_to,
      createdBy: t.created_by,
      status: t.status as TeamTask['status'],
      priority: t.priority as TeamTask['priority'],
      dueDate: t.due_date ? new Date(t.due_date) : null,
      completedAt: t.completed_at ? new Date(t.completed_at) : null,
      notes: t.notes,
    }));
  }

  /**
   * Add a comment to the intervention
   */
  async addComment(
    interventionId: string,
    userId: string,
    content: string,
    replyTo?: string,
    attachments?: Attachment[]
  ): Promise<TeamComment | null> {
    const supabase = createAdminSupabaseClient();

    // Get user name
    const { data: user } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    // Extract mentions (@username)
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionPattern.exec(content)) !== null) {
      mentions.push(match[2]); // User ID from mention
    }

    const commentData = {
      intervention_id: interventionId,
      user_id: userId,
      user_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
      content,
      reply_to: replyTo || null,
      mentions,
      attachments: attachments || [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('intervention_comments')
      .insert(commentData)
      .select()
      .single() as { data: InterventionCommentRow | null; error: Error | null };

    if (error || !data) {
      console.error('[TeamCollab] Error adding comment:', error);
      return null;
    }

    // Notify mentioned users
    for (const mentionedUserId of mentions) {
      await this.notifyTeamMember(mentionedUserId, interventionId, 'mentioned', {
        commenter: commentData.user_name,
        content: content.substring(0, 100),
      });
    }

    return {
      id: data.id,
      interventionId,
      userId,
      userName: commentData.user_name,
      content,
      createdAt: new Date(data.created_at),
      updatedAt: null,
      replyTo: replyTo || null,
      mentions,
      attachments: attachments || [],
    };
  }

  /**
   * Get comments for an intervention
   */
  async getComments(interventionId: string): Promise<TeamComment[]> {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('intervention_comments')
      .select('*')
      .eq('intervention_id', interventionId)
      .order('created_at', { ascending: true }) as { data: InterventionCommentRow[] | null };

    if (!data) return [];

    return data.map((c) => ({
      id: c.id,
      interventionId: c.intervention_id,
      userId: c.user_id,
      userName: c.user_name,
      content: c.content,
      createdAt: new Date(c.created_at),
      updatedAt: c.updated_at ? new Date(c.updated_at) : null,
      replyTo: c.reply_to,
      mentions: c.mentions || [],
      attachments: (c.attachments || []) as unknown as Attachment[],
    }));
  }

  /**
   * Schedule a team meeting
   */
  async scheduleMeeting(meeting: Omit<TeamMeeting, 'id' | 'status'>): Promise<TeamMeeting | null> {
    const supabase = createAdminSupabaseClient();

    const meetingData = {
      intervention_id: meeting.interventionId,
      title: meeting.title,
      description: meeting.description,
      scheduled_at: meeting.scheduledAt.toISOString(),
      duration: meeting.duration,
      location: meeting.location,
      attendees: meeting.attendees,
      organizer: meeting.organizer,
      status: 'scheduled',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('intervention_meetings')
      .insert(meetingData)
      .select()
      .single() as { data: InterventionMeetingRow | null; error: Error | null };

    if (error || !data) {
      console.error('[TeamCollab] Error scheduling meeting:', error);
      return null;
    }

    // Notify attendees
    for (const attendee of meeting.attendees) {
      await this.notifyTeamMember(attendee, meeting.interventionId, 'meeting_scheduled', {
        title: meeting.title,
        scheduledAt: meeting.scheduledAt.toISOString(),
      });
    }

    return {
      id: data.id,
      interventionId: meeting.interventionId,
      title: meeting.title,
      description: meeting.description,
      scheduledAt: new Date(data.scheduled_at),
      duration: meeting.duration,
      location: meeting.location,
      attendees: meeting.attendees,
      organizer: meeting.organizer,
      status: 'scheduled',
      notes: null,
      decisions: [],
      actionItems: [],
    };
  }

  /**
   * Complete a meeting with notes
   */
  async completeMeeting(
    meetingId: string,
    notes: string,
    decisions: string[],
    actionItems: string[]
  ): Promise<boolean> {
    const supabase = createAdminSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('intervention_meetings')
      .update({
        status: 'completed',
        notes,
        decisions,
        action_items: actionItems,
      })
      .eq('id', meetingId);

    return !error;
  }

  /**
   * Get meetings for an intervention
   */
  async getMeetings(interventionId: string): Promise<TeamMeeting[]> {
    const supabase = await createServerSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('intervention_meetings')
      .select('*')
      .eq('intervention_id', interventionId)
      .order('scheduled_at', { ascending: true }) as { data: InterventionMeetingRow[] | null };

    if (!data) return [];

    return data.map((m) => ({
      id: m.id,
      interventionId: m.intervention_id,
      title: m.title,
      description: m.description,
      scheduledAt: new Date(m.scheduled_at),
      duration: m.duration,
      location: m.location,
      attendees: m.attendees,
      organizer: m.organizer,
      status: m.status as TeamMeeting['status'],
      notes: m.notes,
      decisions: m.decisions || [],
      actionItems: m.action_items || [],
    }));
  }

  /**
   * Send notification to team member
   */
  private async notifyTeamMember(
    userId: string,
    interventionId: string,
    type: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const supabase = createAdminSupabaseClient();

    const titles: Record<string, string> = {
      assigned: 'You have been assigned to an intervention',
      task_assigned: 'A task has been assigned to you',
      mentioned: 'You were mentioned in a comment',
      meeting_scheduled: 'A meeting has been scheduled',
      progress_updated: 'Intervention progress has been updated',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('notifications').insert({
      school_id: this.schoolId,
      user_id: userId,
      type: 'alert', // Using 'alert' as notification type
      title: titles[type] || 'Intervention update',
      message: `Intervention update: ${type}`,
      data: {
        interventionId,
        notificationType: type,
        ...data,
      },
      read: false,
    });
  }
}

/**
 * Create a team collaboration manager
 */
export function createTeamManager(schoolId: string): TeamCollaborationManager {
  return new TeamCollaborationManager(schoolId);
}
