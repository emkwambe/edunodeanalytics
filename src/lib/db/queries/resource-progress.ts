import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ResourceProgress, ResourceProgressInsert, ResourceProgressUpdate } from '@/lib/database.types';

/**
 * Resource Progress Queries
 *
 * Data access layer for tracking user progress through learning modules
 */

// Demo progress data for development mode
const DEMO_PROGRESS: Partial<ResourceProgress>[] = [
  {
    id: 'demo-progress-1',
    user_id: 'demo-user-1',
    school_id: 'demo-academy-charter',
    module_slug: 'understanding-data-dashboards',
    module_category: 'data_literacy',
    is_started: true,
    started_at: '2025-02-01T10:00:00Z',
    is_completed: true,
    completed_at: '2025-02-03T14:30:00Z',
    sections_completed: 5,
    total_sections: 5,
    current_section: 5,
    time_spent_minutes: 45,
    is_bookmarked: true,
    bookmarked_at: '2025-02-02T09:00:00Z',
    user_notes: 'Great overview of key metrics to track.',
  },
  {
    id: 'demo-progress-2',
    user_id: 'demo-user-1',
    school_id: 'demo-academy-charter',
    module_slug: 'interpreting-assessment-data',
    module_category: 'data_literacy',
    is_started: true,
    started_at: '2025-02-05T11:00:00Z',
    is_completed: false,
    completed_at: null,
    sections_completed: 3,
    total_sections: 6,
    current_section: 4,
    time_spent_minutes: 25,
    is_bookmarked: false,
    bookmarked_at: null,
    user_notes: null,
  },
  {
    id: 'demo-progress-3',
    user_id: 'demo-user-1',
    school_id: 'demo-academy-charter',
    module_slug: 'building-data-culture',
    module_category: 'culture_change',
    is_started: true,
    started_at: '2025-02-10T09:00:00Z',
    is_completed: true,
    completed_at: '2025-02-12T16:00:00Z',
    sections_completed: 4,
    total_sections: 4,
    current_section: 4,
    time_spent_minutes: 60,
    is_bookmarked: true,
    bookmarked_at: '2025-02-11T08:00:00Z',
    user_notes: 'Key strategies for team buy-in.',
  },
  {
    id: 'demo-progress-4',
    user_id: 'demo-user-1',
    school_id: 'demo-academy-charter',
    module_slug: 'intervention-planning-basics',
    module_category: 'implementation',
    is_started: true,
    started_at: '2025-02-15T13:00:00Z',
    is_completed: false,
    completed_at: null,
    sections_completed: 2,
    total_sections: 8,
    current_section: 3,
    time_spent_minutes: 20,
    is_bookmarked: false,
    bookmarked_at: null,
    user_notes: null,
  },
  {
    id: 'demo-progress-5',
    user_id: 'demo-user-1',
    school_id: 'demo-academy-charter',
    module_slug: 'data-driven-meetings',
    module_category: 'culture_change',
    is_started: false,
    started_at: null,
    is_completed: false,
    completed_at: null,
    sections_completed: 0,
    total_sections: 5,
    current_section: 0,
    time_spent_minutes: 0,
    is_bookmarked: true,
    bookmarked_at: '2025-02-20T10:00:00Z',
    user_notes: null,
  },
];

const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.EDUNODE_DEMO_MODE === 'true';

/**
 * Get all progress records for a user
 */
export async function getProgressForUser(userId: string): Promise<ResourceProgress[]> {
  if (isDemoMode) {
    return DEMO_PROGRESS.filter((p) => p.user_id === userId || p.user_id === 'demo-user-1') as ResourceProgress[];
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('resource_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[DB] Error fetching progress for user:', userId, error);
    return [];
  }

  return data;
}

/**
 * Get progress for a single module
 */
export async function getProgressByModule(userId: string, moduleSlug: string): Promise<ResourceProgress | null> {
  if (isDemoMode) {
    const progress = DEMO_PROGRESS.find(
      (p) => (p.user_id === userId || p.user_id === 'demo-user-1') && p.module_slug === moduleSlug
    );
    return (progress as ResourceProgress) || null;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('resource_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_slug', moduleSlug)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[DB] Error fetching progress by module:', moduleSlug, error);
    }
    return null;
  }

  return data;
}

/**
 * Get all bookmarked modules for a user
 */
export async function getBookmarkedModules(userId: string): Promise<ResourceProgress[]> {
  if (isDemoMode) {
    return DEMO_PROGRESS.filter(
      (p) => (p.user_id === userId || p.user_id === 'demo-user-1') && p.is_bookmarked
    ) as ResourceProgress[];
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('resource_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('is_bookmarked', true)
    .order('bookmarked_at', { ascending: false });

  if (error) {
    console.error('[DB] Error fetching bookmarked modules:', error);
    return [];
  }

  return data;
}

/**
 * Get all completed modules for a user
 */
export async function getCompletedModules(userId: string): Promise<ResourceProgress[]> {
  if (isDemoMode) {
    return DEMO_PROGRESS.filter(
      (p) => (p.user_id === userId || p.user_id === 'demo-user-1') && p.is_completed
    ) as ResourceProgress[];
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('resource_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('[DB] Error fetching completed modules:', error);
    return [];
  }

  return data;
}

/**
 * Start a module (create or update progress record)
 */
export async function startModule(
  userId: string,
  schoolId: string,
  moduleSlug: string,
  moduleCategory: 'data_literacy' | 'culture_change' | 'implementation',
  totalSections: number
): Promise<ResourceProgress | null> {
  if (isDemoMode) {
    const existingIndex = DEMO_PROGRESS.findIndex(
      (p) => (p.user_id === userId || p.user_id === 'demo-user-1') && p.module_slug === moduleSlug
    );

    const now = new Date().toISOString();
    const newProgress: Partial<ResourceProgress> = {
      id: `demo-progress-${Date.now()}`,
      user_id: userId,
      school_id: schoolId,
      module_slug: moduleSlug,
      module_category: moduleCategory,
      is_started: true,
      started_at: now,
      is_completed: false,
      completed_at: null,
      sections_completed: 0,
      total_sections: totalSections,
      current_section: 1,
      time_spent_minutes: 0,
      is_bookmarked: false,
      bookmarked_at: null,
      user_notes: null,
      created_at: now,
      updated_at: now,
    };

    if (existingIndex >= 0) {
      // Update existing - preserve bookmark status
      DEMO_PROGRESS[existingIndex] = {
        ...DEMO_PROGRESS[existingIndex],
        is_started: true,
        started_at: DEMO_PROGRESS[existingIndex].started_at || now,
        current_section: DEMO_PROGRESS[existingIndex].current_section || 1,
        updated_at: now,
      };
      return DEMO_PROGRESS[existingIndex] as ResourceProgress;
    } else {
      DEMO_PROGRESS.push(newProgress);
      return newProgress as ResourceProgress;
    }
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  // Try to get existing progress first
  const existing = await getProgressByModule(userId, moduleSlug);

  if (existing) {
    // Update existing record if not already started
    if (!existing.is_started) {
      const { data, error } = await supabase
        .from('resource_progress')
        .update({
          is_started: true,
          started_at: now,
          current_section: 1,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[DB] Error updating module start:', error);
        return null;
      }

      return data;
    }
    return existing;
  }

  // Create new progress record
  const insert: ResourceProgressInsert = {
    user_id: userId,
    school_id: schoolId,
    module_slug: moduleSlug,
    module_category: moduleCategory,
    is_started: true,
    started_at: now,
    total_sections: totalSections,
    current_section: 1,
    sections_completed: 0,
    time_spent_minutes: 0,
  };

  const { data, error } = await supabase
    .from('resource_progress')
    .insert(insert)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error starting module:', error);
    return null;
  }

  return data;
}

/**
 * Update progress when completing a section
 */
export async function updateProgress(
  userId: string,
  moduleSlug: string,
  sectionIndex: number,
  timeSpentMinutes: number
): Promise<ResourceProgress | null> {
  if (isDemoMode) {
    const progressIndex = DEMO_PROGRESS.findIndex(
      (p) => (p.user_id === userId || p.user_id === 'demo-user-1') && p.module_slug === moduleSlug
    );

    if (progressIndex >= 0) {
      const progress = DEMO_PROGRESS[progressIndex];
      const newSectionsCompleted = Math.max(progress.sections_completed || 0, sectionIndex);

      DEMO_PROGRESS[progressIndex] = {
        ...progress,
        sections_completed: newSectionsCompleted,
        current_section: sectionIndex + 1,
        time_spent_minutes: (progress.time_spent_minutes || 0) + timeSpentMinutes,
        updated_at: new Date().toISOString(),
      };
      return DEMO_PROGRESS[progressIndex] as ResourceProgress;
    }
    return null;
  }

  const supabase = await createServerSupabaseClient();

  // Get current progress
  const existing = await getProgressByModule(userId, moduleSlug);
  if (!existing) {
    console.error('[DB] Cannot update progress - no existing record for module:', moduleSlug);
    return null;
  }

  const newSectionsCompleted = Math.max(existing.sections_completed, sectionIndex);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('resource_progress')
    .update({
      sections_completed: newSectionsCompleted,
      current_section: sectionIndex + 1,
      time_spent_minutes: existing.time_spent_minutes + timeSpentMinutes,
      updated_at: now,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating progress:', error);
    return null;
  }

  return data;
}

/**
 * Mark a module as completed
 */
export async function completeModule(userId: string, moduleSlug: string): Promise<ResourceProgress | null> {
  if (isDemoMode) {
    const progressIndex = DEMO_PROGRESS.findIndex(
      (p) => (p.user_id === userId || p.user_id === 'demo-user-1') && p.module_slug === moduleSlug
    );

    if (progressIndex >= 0) {
      const now = new Date().toISOString();
      DEMO_PROGRESS[progressIndex] = {
        ...DEMO_PROGRESS[progressIndex],
        is_completed: true,
        completed_at: now,
        sections_completed: DEMO_PROGRESS[progressIndex].total_sections,
        current_section: DEMO_PROGRESS[progressIndex].total_sections,
        updated_at: now,
      };
      return DEMO_PROGRESS[progressIndex] as ResourceProgress;
    }
    return null;
  }

  const supabase = await createServerSupabaseClient();

  const existing = await getProgressByModule(userId, moduleSlug);
  if (!existing) {
    console.error('[DB] Cannot complete module - no existing record for:', moduleSlug);
    return null;
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('resource_progress')
    .update({
      is_completed: true,
      completed_at: now,
      sections_completed: existing.total_sections,
      current_section: existing.total_sections,
      updated_at: now,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error completing module:', error);
    return null;
  }

  return data;
}

/**
 * Toggle bookmark status for a module
 */
export async function toggleBookmark(userId: string, moduleSlug: string): Promise<ResourceProgress | null> {
  if (isDemoMode) {
    const progressIndex = DEMO_PROGRESS.findIndex(
      (p) => (p.user_id === userId || p.user_id === 'demo-user-1') && p.module_slug === moduleSlug
    );

    const now = new Date().toISOString();

    if (progressIndex >= 0) {
      const isCurrentlyBookmarked = DEMO_PROGRESS[progressIndex].is_bookmarked;
      DEMO_PROGRESS[progressIndex] = {
        ...DEMO_PROGRESS[progressIndex],
        is_bookmarked: !isCurrentlyBookmarked,
        bookmarked_at: !isCurrentlyBookmarked ? now : null,
        updated_at: now,
      };
      return DEMO_PROGRESS[progressIndex] as ResourceProgress;
    }

    // Create a new record with just bookmark
    const newProgress: Partial<ResourceProgress> = {
      id: `demo-progress-${Date.now()}`,
      user_id: userId,
      school_id: 'demo-academy-charter',
      module_slug: moduleSlug,
      module_category: 'data_literacy',
      is_started: false,
      started_at: null,
      is_completed: false,
      completed_at: null,
      sections_completed: 0,
      total_sections: 5,
      current_section: 0,
      time_spent_minutes: 0,
      is_bookmarked: true,
      bookmarked_at: now,
      user_notes: null,
      created_at: now,
      updated_at: now,
    };
    DEMO_PROGRESS.push(newProgress);
    return newProgress as ResourceProgress;
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  const existing = await getProgressByModule(userId, moduleSlug);

  if (existing) {
    const newBookmarkStatus = !existing.is_bookmarked;
    const { data, error } = await supabase
      .from('resource_progress')
      .update({
        is_bookmarked: newBookmarkStatus,
        bookmarked_at: newBookmarkStatus ? now : null,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('[DB] Error toggling bookmark:', error);
      return null;
    }

    return data;
  }

  // If no record exists, we need schoolId and category - return null
  // The caller should use startModule first or provide full context
  console.error('[DB] Cannot toggle bookmark - no existing record. Use startModule first.');
  return null;
}

/**
 * Save user notes for a module
 */
export async function saveNotes(
  userId: string,
  moduleSlug: string,
  notes: string
): Promise<ResourceProgress | null> {
  if (isDemoMode) {
    const progressIndex = DEMO_PROGRESS.findIndex(
      (p) => (p.user_id === userId || p.user_id === 'demo-user-1') && p.module_slug === moduleSlug
    );

    if (progressIndex >= 0) {
      DEMO_PROGRESS[progressIndex] = {
        ...DEMO_PROGRESS[progressIndex],
        user_notes: notes,
        updated_at: new Date().toISOString(),
      };
      return DEMO_PROGRESS[progressIndex] as ResourceProgress;
    }
    return null;
  }

  const supabase = await createServerSupabaseClient();

  const existing = await getProgressByModule(userId, moduleSlug);
  if (!existing) {
    console.error('[DB] Cannot save notes - no existing record for module:', moduleSlug);
    return null;
  }

  const { data, error } = await supabase
    .from('resource_progress')
    .update({
      user_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error saving notes:', error);
    return null;
  }

  return data;
}

/**
 * Progress statistics for a user
 */
export interface ProgressStats {
  completedCount: number;
  inProgressCount: number;
  totalTimeSpentMinutes: number;
  bookmarkedCount: number;
  completionRate: number;
}

/**
 * Get progress statistics for a user
 */
export async function getProgressStats(userId: string): Promise<ProgressStats> {
  if (isDemoMode) {
    const userProgress = DEMO_PROGRESS.filter(
      (p) => p.user_id === userId || p.user_id === 'demo-user-1'
    );

    const completedCount = userProgress.filter((p) => p.is_completed).length;
    const inProgressCount = userProgress.filter((p) => p.is_started && !p.is_completed).length;
    const totalTimeSpentMinutes = userProgress.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0);
    const bookmarkedCount = userProgress.filter((p) => p.is_bookmarked).length;
    const startedCount = userProgress.filter((p) => p.is_started).length;

    return {
      completedCount,
      inProgressCount,
      totalTimeSpentMinutes,
      bookmarkedCount,
      completionRate: startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 0,
    };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('resource_progress')
    .select('is_completed, is_started, is_bookmarked, time_spent_minutes')
    .eq('user_id', userId);

  if (error) {
    console.error('[DB] Error fetching progress stats:', error);
    return {
      completedCount: 0,
      inProgressCount: 0,
      totalTimeSpentMinutes: 0,
      bookmarkedCount: 0,
      completionRate: 0,
    };
  }

  const completedCount = data.filter((p) => p.is_completed).length;
  const inProgressCount = data.filter((p) => p.is_started && !p.is_completed).length;
  const totalTimeSpentMinutes = data.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0);
  const bookmarkedCount = data.filter((p) => p.is_bookmarked).length;
  const startedCount = data.filter((p) => p.is_started).length;

  return {
    completedCount,
    inProgressCount,
    totalTimeSpentMinutes,
    bookmarkedCount,
    completionRate: startedCount > 0 ? Math.round((completedCount / startedCount) * 100) : 0,
  };
}
