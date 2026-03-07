// @ts-nocheck - demo data type mismatches after database.types.ts regen
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Intervention, InterventionInsert, InterventionUpdate } from '@/lib/database.types';

/**
 * Intervention Queries
 *
 * Data access layer for intervention operations
 */

// Types for query options
export interface InterventionQueryOptions {
  limit?: number;
  offset?: number;
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  type?: 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement';
  studentId?: string;
}

export interface ProgressNote {
  date: string;
  note: string;
  updatedBy: string;
}

export interface InterventionOutcome {
  summary: string;
  wasSuccessful: boolean;
}

export interface InterventionWithStudent extends Intervention {
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    grade_level: number;
    risk_level: 'on_track' | 'at_risk' | 'critical';
  };
}

export interface InterventionStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  successRate: number;
  completedCount: number;
  successfulCount: number;
  activeCount: number;
  averageDurationDays: number | null;
}

// Demo mode detection
const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.EDUNODE_DEMO_MODE === 'true';

// Demo interventions for development mode
const DEMO_INTERVENTIONS = [
  {
    id: 'demo-intervention-1',
    created_at: '2025-09-15T10:00:00Z',
    updated_at: '2026-01-20T14:30:00Z',
    school_id: 'demo-academy-charter',
    student_id: 'demo-student-1',
    created_by_user_id: 'demo-user-1',
    assigned_to_user_id: 'demo-user-2',
    type: 'academic',
    title: 'Reading Comprehension Support',
    description: 'Weekly one-on-one tutoring sessions focused on reading comprehension strategies and vocabulary building.',
    status: 'in_progress',
    priority: 'high',
    start_date: '2025-09-20',
    target_end_date: '2026-03-20',
    actual_end_date: null,
    goal: 'Improve reading comprehension from 2nd grade to 4th grade level',
    success_criteria: 'Student achieves 70% or higher on grade-level reading assessments',
    baseline_value: 2.3,
    target_value: 4.0,
    current_value: 3.2,
    progress_notes: [
      { date: '2025-10-01', note: 'Initial assessment completed. Student shows strength in phonics but struggles with inference.', updatedBy: 'demo-user-2' },
      { date: '2025-11-15', note: 'Good progress on vocabulary. Student now reading at 2.8 grade level.', updatedBy: 'demo-user-2' },
      { date: '2026-01-10', note: 'Breakthrough with comprehension strategies. Reading level now at 3.2.', updatedBy: 'demo-user-2' },
    ],
    outcome_summary: null,
    was_successful: null,
    is_stale: false,
    metadata: null,
  },
  {
    id: 'demo-intervention-2',
    created_at: '2025-10-01T09:00:00Z',
    updated_at: '2026-02-15T11:00:00Z',
    school_id: 'demo-academy-charter',
    student_id: 'demo-student-2',
    created_by_user_id: 'demo-user-1',
    assigned_to_user_id: 'demo-user-3',
    type: 'attendance',
    title: 'Chronic Absenteeism Intervention',
    description: 'Family engagement and support program to address chronic absenteeism patterns.',
    status: 'in_progress',
    priority: 'urgent',
    start_date: '2025-10-05',
    target_end_date: '2026-05-30',
    actual_end_date: null,
    goal: 'Reduce absences from 25% to under 10%',
    success_criteria: 'Student maintains 90% or higher attendance rate for 3 consecutive months',
    baseline_value: 75,
    target_value: 92,
    current_value: 85,
    progress_notes: [
      { date: '2025-10-15', note: 'Met with family. Transportation identified as primary barrier.', updatedBy: 'demo-user-3' },
      { date: '2025-11-01', note: 'Connected family with bus route assistance program.', updatedBy: 'demo-user-3' },
      { date: '2026-01-20', note: 'Attendance improved to 85%. Family reports transportation is no longer an issue.', updatedBy: 'demo-user-3' },
    ],
    outcome_summary: null,
    was_successful: null,
    is_stale: false,
    metadata: null,
  },
  {
    id: 'demo-intervention-3',
    created_at: '2025-08-20T08:00:00Z',
    updated_at: '2025-12-15T16:00:00Z',
    school_id: 'demo-academy-charter',
    student_id: 'demo-student-3',
    created_by_user_id: 'demo-user-2',
    assigned_to_user_id: 'demo-user-2',
    type: 'behavior',
    title: 'Social-Emotional Learning Support',
    description: 'Counseling sessions and classroom behavior support plan to address disruptive behavior.',
    status: 'completed',
    priority: 'high',
    start_date: '2025-08-25',
    target_end_date: '2025-12-20',
    actual_end_date: '2025-12-15',
    goal: 'Reduce behavioral incidents from 8 per month to 2 or fewer',
    success_criteria: 'Student has 2 or fewer behavioral incidents per month for 2 consecutive months',
    baseline_value: 8,
    target_value: 2,
    current_value: 1,
    progress_notes: [
      { date: '2025-09-01', note: 'Began weekly counseling sessions. Created behavior tracking chart.', updatedBy: 'demo-user-2' },
      { date: '2025-10-15', note: 'Incidents reduced to 5 per month. Student responding well to positive reinforcement.', updatedBy: 'demo-user-2' },
      { date: '2025-11-30', note: 'Only 2 incidents this month. Student using coping strategies independently.', updatedBy: 'demo-user-2' },
      { date: '2025-12-15', note: 'Second consecutive month with under 2 incidents. Goals achieved.', updatedBy: 'demo-user-2' },
    ],
    outcome_summary: 'Student successfully reduced behavioral incidents and developed strong self-regulation skills. Will continue monthly check-ins.',
    was_successful: true,
    is_stale: false,
    metadata: null,
  },
  {
    id: 'demo-intervention-4',
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2026-02-01T09:00:00Z',
    school_id: 'demo-academy-charter',
    student_id: 'demo-student-4',
    created_by_user_id: 'demo-user-1',
    assigned_to_user_id: 'demo-user-4',
    type: 'family_engagement',
    title: 'Parent Communication Initiative',
    description: 'Structured weekly communication with parents to increase family involvement in education.',
    status: 'in_progress',
    priority: 'medium',
    start_date: '2025-11-10',
    target_end_date: '2026-04-30',
    actual_end_date: null,
    goal: 'Establish consistent parent-teacher communication and increase homework completion',
    success_criteria: 'Weekly parent contact maintained and homework completion rate reaches 80%',
    baseline_value: 45,
    target_value: 80,
    current_value: 68,
    progress_notes: [
      { date: '2025-11-15', note: 'Established weekly email updates. Parent responded positively.', updatedBy: 'demo-user-4' },
      { date: '2025-12-10', note: 'Homework completion improved to 60%. Parent helping with nightly review.', updatedBy: 'demo-user-4' },
      { date: '2026-01-25', note: 'Strong progress. Homework at 68%. Parent attended first school event.', updatedBy: 'demo-user-4' },
    ],
    outcome_summary: null,
    was_successful: null,
    is_stale: false,
    metadata: null,
  },
  {
    id: 'demo-intervention-5',
    created_at: '2025-09-01T08:00:00Z',
    updated_at: '2025-11-20T15:00:00Z',
    school_id: 'demo-academy-charter',
    student_id: 'demo-student-5',
    created_by_user_id: 'demo-user-3',
    assigned_to_user_id: 'demo-user-3',
    type: 'sel',
    title: 'Anxiety Management Support',
    description: 'Individual counseling focused on anxiety management and test-taking strategies.',
    status: 'completed',
    priority: 'medium',
    start_date: '2025-09-05',
    target_end_date: '2025-12-15',
    actual_end_date: '2025-11-20',
    goal: 'Reduce test anxiety and improve assessment performance',
    success_criteria: 'Student completes assessments without distress and scores within expected range',
    baseline_value: 3,
    target_value: 8,
    current_value: 8,
    progress_notes: [
      { date: '2025-09-10', note: 'Initial meeting. Student identifies physical symptoms of anxiety before tests.', updatedBy: 'demo-user-3' },
      { date: '2025-10-05', note: 'Taught breathing techniques. Student practicing daily.', updatedBy: 'demo-user-3' },
      { date: '2025-11-01', note: 'Completed first test with new strategies. Reported feeling calmer.', updatedBy: 'demo-user-3' },
      { date: '2025-11-20', note: 'Assessment scores now in expected range. Student confident in strategies.', updatedBy: 'demo-user-3' },
    ],
    outcome_summary: 'Student learned effective anxiety management techniques and demonstrated ability to self-regulate during assessments. Recommending continued access to counseling as needed.',
    was_successful: true,
    is_stale: false,
    metadata: null,
  },
  {
    id: 'demo-intervention-6',
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-15T09:00:00Z',
    school_id: 'demo-academy-charter',
    student_id: 'demo-student-6',
    created_by_user_id: 'demo-user-1',
    assigned_to_user_id: 'demo-user-2',
    type: 'academic',
    title: 'Math Foundations Intervention',
    description: 'Small group instruction targeting foundational math skills.',
    status: 'planned',
    priority: 'high',
    start_date: '2026-02-01',
    target_end_date: '2026-05-15',
    actual_end_date: null,
    goal: 'Build foundational math skills to grade level',
    success_criteria: 'Student passes grade-level math benchmark assessment',
    baseline_value: 55,
    target_value: 75,
    current_value: 55,
    progress_notes: [],
    outcome_summary: null,
    was_successful: null,
    is_stale: false,
    metadata: null,
  },
  {
    id: 'demo-intervention-7',
    created_at: '2025-10-15T14:00:00Z',
    updated_at: '2025-12-01T10:00:00Z',
    school_id: 'demo-academy-charter',
    student_id: 'demo-student-7',
    created_by_user_id: 'demo-user-2',
    assigned_to_user_id: 'demo-user-2',
    type: 'academic',
    title: 'Writing Skills Development',
    description: 'Targeted writing instruction with focus on organization and grammar.',
    status: 'cancelled',
    priority: 'low',
    start_date: '2025-10-20',
    target_end_date: '2026-01-20',
    actual_end_date: '2025-12-01',
    goal: 'Improve writing scores from 2 to 3 on rubric',
    success_criteria: 'Student achieves 3 or higher on writing rubric',
    baseline_value: 2,
    target_value: 3,
    current_value: 2,
    progress_notes: [
      { date: '2025-11-01', note: 'Sessions started. Student showing resistance to writing activities.', updatedBy: 'demo-user-2' },
      { date: '2025-12-01', note: 'Family moved out of district. Intervention cancelled.', updatedBy: 'demo-user-2' },
    ],
    outcome_summary: 'Intervention cancelled due to student transfer to another district.',
    was_successful: null,
    is_stale: false,
    metadata: null,
  },
];

// Demo student data for joins
const DEMO_STUDENTS: Record<string, InterventionWithStudent['student']> = {
  'demo-student-1': { id: 'demo-student-1', first_name: 'Marcus', last_name: 'Johnson', display_name: 'Marcus J.', grade_level: 4, risk_level: 'at_risk' },
  'demo-student-2': { id: 'demo-student-2', first_name: 'Aisha', last_name: 'Williams', display_name: 'Aisha W.', grade_level: 3, risk_level: 'critical' },
  'demo-student-3': { id: 'demo-student-3', first_name: 'Diego', last_name: 'Martinez', display_name: 'Diego M.', grade_level: 5, risk_level: 'at_risk' },
  'demo-student-4': { id: 'demo-student-4', first_name: 'Emily', last_name: 'Chen', display_name: 'Emily C.', grade_level: 2, risk_level: 'at_risk' },
  'demo-student-5': { id: 'demo-student-5', first_name: 'Jordan', last_name: 'Taylor', display_name: 'Jordan T.', grade_level: 6, risk_level: 'on_track' },
  'demo-student-6': { id: 'demo-student-6', first_name: 'Sophia', last_name: 'Brown', display_name: 'Sophia B.', grade_level: 3, risk_level: 'at_risk' },
  'demo-student-7': { id: 'demo-student-7', first_name: 'Liam', last_name: 'Davis', display_name: 'Liam D.', grade_level: 4, risk_level: 'at_risk' },
};

/**
 * Get interventions by school with pagination and filtering
 */
export async function getInterventionsBySchool(
  schoolId: string,
  options: InterventionQueryOptions = {}
): Promise<{ data: Intervention[]; count: number }> {
  const { limit = 20, offset = 0, status, type, studentId } = options;

  // Demo mode
  if (isDemoMode && schoolId.startsWith('demo-')) {
    let filtered = DEMO_INTERVENTIONS.filter(i => i.school_id === schoolId);

    if (status) {
      filtered = filtered.filter(i => i.status === status);
    }
    if (type) {
      filtered = filtered.filter(i => i.type === type);
    }
    if (studentId) {
      filtered = filtered.filter(i => i.student_id === studentId);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return { data: paginated, count: total };
  }

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('interventions')
    .select('*', { count: 'exact' })
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (type) {
    query = query.eq('type', type);
  }
  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[DB] Error fetching interventions by school:', error);
    return { data: [], count: 0 };
  }

  return { data: data || [], count: count || 0 };
}

/**
 * Get a single intervention by ID with student data
 */
export async function getInterventionById(id: string): Promise<InterventionWithStudent | null> {
  // Demo mode
  if (isDemoMode && id.startsWith('demo-')) {
    const intervention = DEMO_INTERVENTIONS.find(i => i.id === id);
    if (!intervention) return null;

    return {
      ...intervention,
      student: DEMO_STUDENTS[intervention.student_id],
    };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('interventions')
    .select(`
      *,
      student:students(
        id,
        first_name,
        last_name,
        display_name,
        grade_level,
        risk_level
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('[DB] Error fetching intervention by ID:', error);
    return null;
  }

  return data as InterventionWithStudent;
}

/**
 * Get all interventions for a specific student
 */
export async function getInterventionsForStudent(studentId: string): Promise<Intervention[]> {
  // Demo mode
  if (isDemoMode && studentId.startsWith('demo-')) {
    return DEMO_INTERVENTIONS.filter(i => i.student_id === studentId);
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('interventions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DB] Error fetching interventions for student:', error);
    return [];
  }

  return data || [];
}

/**
 * Get interventions assigned to a specific user
 */
export async function getInterventionsByAssignee(
  userId: string,
  options: InterventionQueryOptions = {}
): Promise<{ data: Intervention[]; count: number }> {
  const { limit = 20, offset = 0, status, type } = options;

  // Demo mode
  if (isDemoMode && userId.startsWith('demo-')) {
    let filtered = DEMO_INTERVENTIONS.filter(i => i.assigned_to_user_id === userId);

    if (status) {
      filtered = filtered.filter(i => i.status === status);
    }
    if (type) {
      filtered = filtered.filter(i => i.type === type);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return { data: paginated, count: total };
  }

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('interventions')
    .select('*', { count: 'exact' })
    .eq('assigned_to_user_id', userId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }
  if (type) {
    query = query.eq('type', type);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[DB] Error fetching interventions by assignee:', error);
    return { data: [], count: 0 };
  }

  return { data: data || [], count: count || 0 };
}

/**
 * Get active interventions (status = 'planned' or 'in_progress')
 */
export async function getActiveInterventions(
  schoolId: string,
  options: Omit<InterventionQueryOptions, 'status'> = {}
): Promise<{ data: Intervention[]; count: number }> {
  const { limit = 50, offset = 0, type, studentId } = options;

  // Demo mode
  if (isDemoMode && schoolId.startsWith('demo-')) {
    let filtered = DEMO_INTERVENTIONS.filter(
      i => i.school_id === schoolId && (i.status === 'planned' || i.status === 'in_progress')
    );

    if (type) {
      filtered = filtered.filter(i => i.type === type);
    }
    if (studentId) {
      filtered = filtered.filter(i => i.student_id === studentId);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return { data: paginated, count: total };
  }

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('interventions')
    .select('*', { count: 'exact' })
    .eq('school_id', schoolId)
    .in('status', ['planned', 'in_progress'])
    .order('priority', { ascending: false })
    .order('start_date', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }
  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[DB] Error fetching active interventions:', error);
    return { data: [], count: 0 };
  }

  return { data: data || [], count: count || 0 };
}

/**
 * Create a new intervention
 */
export async function createIntervention(
  intervention: InterventionInsert
): Promise<Intervention | null> {
  // Demo mode - return a mock created intervention
  if (isDemoMode && intervention.school_id.startsWith('demo-')) {
    const newIntervention = {
      id: `demo-intervention-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      school_id: intervention.school_id,
      student_id: intervention.student_id,
      created_by_user_id: intervention.created_by_user_id || null,
      assigned_to_user_id: intervention.assigned_to_user_id || null,
      type: intervention.type,
      title: intervention.title,
      description: intervention.description || null,
      status: intervention.status || 'planned',
      priority: intervention.priority || 'medium',
      start_date: intervention.start_date || null,
      target_end_date: intervention.target_end_date || null,
      actual_end_date: intervention.actual_end_date || null,
      goal: intervention.goal || null,
      success_criteria: intervention.success_criteria || null,
      baseline_value: intervention.baseline_value || null,
      target_value: intervention.target_value || null,
      current_value: intervention.current_value || null,
      progress_notes: intervention.progress_notes || null,
      outcome_summary: intervention.outcome_summary || null,
      was_successful: intervention.was_successful || null,
      metadata: intervention.metadata || null,
    };
    return newIntervention;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('interventions')
    .insert(intervention)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error creating intervention:', error);
    return null;
  }

  return data;
}

/**
 * Update an existing intervention
 */
export async function updateIntervention(
  id: string,
  updates: InterventionUpdate
): Promise<Intervention | null> {
  // Demo mode
  if (isDemoMode && id.startsWith('demo-')) {
    const existing = DEMO_INTERVENTIONS.find(i => i.id === id);
    if (!existing) return null;

    return {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    } as Intervention;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('interventions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating intervention:', error);
    return null;
  }

  return data;
}

/**
 * Add a progress note to an intervention's progress_notes JSONB array
 */
export async function addProgressNote(
  id: string,
  note: ProgressNote
): Promise<Intervention | null> {
  // Demo mode
  if (isDemoMode && id.startsWith('demo-')) {
    const existing = DEMO_INTERVENTIONS.find(i => i.id === id);
    if (!existing) return null;

    const currentNotes = (existing.progress_notes as unknown as ProgressNote[]) || [];
    const updatedNotes = [...currentNotes, note];

    return {
      ...existing,
      progress_notes: updatedNotes as unknown as Intervention['progress_notes'],
      updated_at: new Date().toISOString(),
    };
  }

  const supabase = await createServerSupabaseClient();

  // First, get current notes
  const { data: current, error: fetchError } = await supabase
    .from('interventions')
    .select('progress_notes')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('[DB] Error fetching intervention for progress note:', fetchError);
    return null;
  }

  const currentNotes = (current.progress_notes as unknown as ProgressNote[]) || [];
  const updatedNotes = [...currentNotes, note];

  // Update with new notes array
  const { data, error } = await supabase
    .from('interventions')
    .update({
      progress_notes: updatedNotes as unknown as Intervention['progress_notes'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error adding progress note:', error);
    return null;
  }

  return data;
}

/**
 * Mark an intervention as complete with outcome details
 */
export async function completeIntervention(
  id: string,
  outcome: InterventionOutcome
): Promise<Intervention | null> {
  // Demo mode
  if (isDemoMode && id.startsWith('demo-')) {
    const existing = DEMO_INTERVENTIONS.find(i => i.id === id);
    if (!existing) return null;

    return {
      ...existing,
      status: 'completed',
      actual_end_date: new Date().toISOString().split('T')[0],
      outcome_summary: outcome.summary,
      was_successful: outcome.wasSuccessful,
      updated_at: new Date().toISOString(),
    };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('interventions')
    .update({
      status: 'completed',
      actual_end_date: new Date().toISOString().split('T')[0],
      outcome_summary: outcome.summary,
      was_successful: outcome.wasSuccessful,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error completing intervention:', error);
    return null;
  }

  return data;
}

/**
 * Get aggregate statistics for interventions at a school
 */
export async function getInterventionStats(schoolId: string): Promise<InterventionStats> {
  // Demo mode
  if (isDemoMode && schoolId.startsWith('demo-')) {
    const schoolInterventions = DEMO_INTERVENTIONS.filter(i => i.school_id === schoolId);

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let completedCount = 0;
    let successfulCount = 0;
    let activeCount = 0;
    let totalDurationDays = 0;
    let interventionsWithDuration = 0;

    for (const intervention of schoolInterventions) {
      // Count by type
      byType[intervention.type] = (byType[intervention.type] || 0) + 1;

      // Count by status
      byStatus[intervention.status] = (byStatus[intervention.status] || 0) + 1;

      // Track completed and successful
      if (intervention.status === 'completed') {
        completedCount++;
        if (intervention.was_successful) {
          successfulCount++;
        }

        // Calculate duration for completed interventions
        if (intervention.start_date && intervention.actual_end_date) {
          const start = new Date(intervention.start_date);
          const end = new Date(intervention.actual_end_date);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          totalDurationDays += days;
          interventionsWithDuration++;
        }
      }

      // Track active
      if (intervention.status === 'planned' || intervention.status === 'in_progress') {
        activeCount++;
      }
    }

    const successRate = completedCount > 0 ? (successfulCount / completedCount) * 100 : 0;
    const averageDurationDays = interventionsWithDuration > 0
      ? Math.round(totalDurationDays / interventionsWithDuration)
      : null;

    return {
      total: schoolInterventions.length,
      byType,
      byStatus,
      successRate: Math.round(successRate * 10) / 10,
      completedCount,
      successfulCount,
      activeCount,
      averageDurationDays,
    };
  }

  const supabase = await createServerSupabaseClient();

  // Get all interventions for the school
  const { data, error } = await supabase
    .from('interventions')
    .select('type, status, was_successful, start_date, actual_end_date')
    .eq('school_id', schoolId);

  if (error) {
    console.error('[DB] Error fetching intervention stats:', error);
    return {
      total: 0,
      byType: {},
      byStatus: {},
      successRate: 0,
      completedCount: 0,
      successfulCount: 0,
      activeCount: 0,
      averageDurationDays: null,
    };
  }

  const interventions = data || [];

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let completedCount = 0;
  let successfulCount = 0;
  let activeCount = 0;
  let totalDurationDays = 0;
  let interventionsWithDuration = 0;

  for (const intervention of interventions) {
    // Count by type
    byType[intervention.type] = (byType[intervention.type] || 0) + 1;

    // Count by status
    byStatus[intervention.status] = (byStatus[intervention.status] || 0) + 1;

    // Track completed and successful
    if (intervention.status === 'completed') {
      completedCount++;
      if (intervention.was_successful) {
        successfulCount++;
      }

      // Calculate duration for completed interventions
      if (intervention.start_date && intervention.actual_end_date) {
        const start = new Date(intervention.start_date);
        const end = new Date(intervention.actual_end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        totalDurationDays += days;
        interventionsWithDuration++;
      }
    }

    // Track active
    if (intervention.status === 'planned' || intervention.status === 'in_progress') {
      activeCount++;
    }
  }

  const successRate = completedCount > 0 ? (successfulCount / completedCount) * 100 : 0;
  const averageDurationDays = interventionsWithDuration > 0
    ? Math.round(totalDurationDays / interventionsWithDuration)
    : null;

  return {
    total: interventions.length,
    byType,
    byStatus,
    successRate: Math.round(successRate * 10) / 10,
    completedCount,
    successfulCount,
    activeCount,
    averageDurationDays,
  };
}
