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
    const { data: schoolUser } = await supabase
      .from('school_users')
      .select('role')
      .eq('user_id', userId)
      .eq('school_id', this.schoolId)
      .single();

    const memberData = {
      intervention_id: interventionId,
      user_id: userId,
      role,
      assigned_at: new Date().toISOString(),
      assigned_by: addedBy,
    };

    const { error } = await supabase
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

    const { error } = await supabase
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

    const { error } = await supabase
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

    const { data } = await supabase
      .from('intervention_team_members')
      .select(`
        *,
        user:users(id, email, first_name, last_name),
        school_user:school_users(role)
      `)
      .eq('intervention_id', interventionId);

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

    const { data, error } = await supabase
      .from('intervention_tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
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
      status: data.status,
      priority: data.priority,
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

    const { error } = await supabase
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

    const { data } = await supabase
      .from('intervention_tasks')
      .select('*')
      .eq('intervention_id', interventionId)
      .order('due_date', { ascending: true });

    if (!data) return [];

    return data.map((t) => ({
      id: t.id,
      interventionId: t.intervention_id,
      title: t.title,
      description: t.description,
      assignedTo: t.assigned_to,
      createdBy: t.created_by,
      status: t.status,
      priority: t.priority,
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

    const { data, error } = await supabase
      .from('intervention_comments')
      .insert(commentData)
      .select()
      .single();

    if (error) {
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

    const { data } = await supabase
      .from('intervention_comments')
      .select('*')
      .eq('intervention_id', interventionId)
      .order('created_at', { ascending: true });

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
      attachments: c.attachments || [],
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

    const { data, error } = await supabase
      .from('intervention_meetings')
      .insert(meetingData)
      .select()
      .single();

    if (error) {
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

    const { error } = await supabase
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

    const { data } = await supabase
      .from('intervention_meetings')
      .select('*')
      .eq('intervention_id', interventionId)
      .order('scheduled_at', { ascending: true });

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
      status: m.status,
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

    await supabase.from('notifications').insert({
      school_id: this.schoolId,
      user_id: userId,
      type: 'intervention',
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
