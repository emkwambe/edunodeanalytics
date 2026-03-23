/**
 * Intervention Strategies Queries
 * ================================
 *
 * Data access layer for intervention strategy operations.
 * Strategies can be system-defined, district-defined, or user-created.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { StrategyRecord, StrategySource, CreateStrategyInput } from '@/lib/mtss/types';

// ---------------------------------------------------------------------------
// Demo Mode
// ---------------------------------------------------------------------------

const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.EDUNODE_DEMO_MODE === 'true';

// System-defined strategies (always available)
const SYSTEM_STRATEGIES: StrategyRecord[] = [
  {
    id: 'sys-strategy-1',
    name: 'Small Group Instruction',
    source: 'system',
    category: 'academic',
    description: 'Targeted instruction with 3-6 students focusing on specific skill gaps',
    tags: ['reading', 'math', 'writing', 'small-group'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-2',
    name: 'One-on-One Tutoring',
    source: 'system',
    category: 'academic',
    description: 'Individualized instruction tailored to student needs',
    tags: ['intensive', 'individualized', 'tier-3'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-3',
    name: 'Check-In/Check-Out (CICO)',
    source: 'system',
    category: 'behavior',
    description: 'Daily monitoring with adult mentoring and feedback',
    tags: ['behavior', 'pbis', 'daily-monitoring'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-4',
    name: 'Social Skills Group',
    source: 'system',
    category: 'sel',
    description: 'Structured lessons on social-emotional skills with peer practice',
    tags: ['sel', 'social-skills', 'group'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-5',
    name: 'Attendance Mentoring',
    source: 'system',
    category: 'attendance',
    description: 'Adult mentor check-ins focused on attendance barriers and support',
    tags: ['attendance', 'mentoring', 'chronic-absenteeism'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-6',
    name: 'Parent Communication Protocol',
    source: 'system',
    category: 'family_engagement',
    description: 'Structured weekly communication with families',
    tags: ['family', 'communication', 'engagement'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-7',
    name: 'Phonics Intervention',
    source: 'system',
    category: 'academic',
    description: 'Systematic phonics instruction for decoding skills',
    tags: ['reading', 'phonics', 'decoding', 'tier-2'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-8',
    name: 'Reading Fluency Practice',
    source: 'system',
    category: 'academic',
    description: 'Repeated reading and fluency-building activities',
    tags: ['reading', 'fluency', 'repeated-reading'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-9',
    name: 'Math Fact Fluency',
    source: 'system',
    category: 'academic',
    description: 'Targeted practice for math fact automaticity',
    tags: ['math', 'fluency', 'facts', 'automaticity'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-10',
    name: 'Comprehension Strategies',
    source: 'system',
    category: 'academic',
    description: 'Explicit instruction in reading comprehension strategies',
    tags: ['reading', 'comprehension', 'strategies'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-11',
    name: 'Behavior Contract',
    source: 'system',
    category: 'behavior',
    description: 'Written agreement with student outlining expected behaviors and rewards',
    tags: ['behavior', 'contract', 'agreement'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-12',
    name: 'Self-Monitoring',
    source: 'system',
    category: 'behavior',
    description: 'Student tracks own behavior with periodic teacher feedback',
    tags: ['behavior', 'self-monitoring', 'independence'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-13',
    name: 'Anxiety/Coping Skills',
    source: 'system',
    category: 'sel',
    description: 'Counseling focused on anxiety management and coping strategies',
    tags: ['sel', 'anxiety', 'coping', 'counseling'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-14',
    name: 'Home Visit Program',
    source: 'system',
    category: 'family_engagement',
    description: 'Regular home visits to build family partnerships',
    tags: ['family', 'home-visit', 'engagement', 'intensive'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-strategy-15',
    name: 'Wrap-Around Services',
    source: 'system',
    category: 'sel',
    description: 'Coordinated community services for intensive support',
    tags: ['intensive', 'wrap-around', 'community', 'tier-3'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Demo district strategies
const DEMO_DISTRICT_STRATEGIES: StrategyRecord[] = [
  {
    id: 'dist-strategy-1',
    name: 'Wilson Reading System',
    source: 'district',
    districtId: 'demo-district-1',
    category: 'academic',
    description: 'District-adopted structured literacy program for struggling readers',
    tags: ['reading', 'wilson', 'structured-literacy', 'dyslexia'],
    isActive: true,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'dist-strategy-2',
    name: 'Second Step SEL Curriculum',
    source: 'district',
    districtId: 'demo-district-1',
    category: 'sel',
    description: 'District-adopted social-emotional learning curriculum',
    tags: ['sel', 'second-step', 'curriculum'],
    isActive: true,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'dist-strategy-3',
    name: 'Bridges Math Intervention',
    source: 'district',
    districtId: 'demo-district-1',
    category: 'academic',
    description: 'District math intervention program aligned with core curriculum',
    tags: ['math', 'bridges', 'intervention'],
    isActive: true,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
];

// Demo user-created strategies (mutable in demo mode)
let DEMO_USER_STRATEGIES: StrategyRecord[] = [];

// ---------------------------------------------------------------------------
// Query Functions
// ---------------------------------------------------------------------------

export interface StrategyQueryOptions {
  source?: StrategySource;
  category?: string;
  search?: string;
  districtId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all strategies (system + district + user) for a school/district
 */
export async function getStrategies(
  schoolId: string,
  options: StrategyQueryOptions = {}
): Promise<{ data: StrategyRecord[]; count: number }> {
  const { source, category, search, districtId, limit = 50, offset = 0 } = options;

  // Demo mode
  if (isDemoMode) {
    let allStrategies = [
      ...SYSTEM_STRATEGIES,
      ...DEMO_DISTRICT_STRATEGIES,
      ...DEMO_USER_STRATEGIES,
    ];

    // Filter by source
    if (source) {
      allStrategies = allStrategies.filter((s) => s.source === source);
    }

    // Filter by category
    if (category) {
      allStrategies = allStrategies.filter((s) => s.category === category);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      allStrategies = allStrategies.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower) ||
          s.tags?.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    // Active only
    allStrategies = allStrategies.filter((s) => s.isActive);

    const total = allStrategies.length;
    const paginated = allStrategies.slice(offset, offset + limit);

    return { data: paginated, count: total };
  }

  // Production mode - query from database
  const supabase = await createServerSupabaseClient();

  // First get the district ID for this school
  const { data: schoolData } = await supabase
    .from('schools')
    .select('district_id')
    .eq('id', schoolId)
    .single();

  const schoolDistrictId = districtId || schoolData?.district_id;

  let query = supabase
    .from('intervention_strategies')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name', { ascending: true });

  // Filter to include system strategies, district strategies for this school's district, and user strategies
  if (source) {
    query = query.eq('source', source);
  } else {
    // Include system strategies + this school's district strategies
    query = query.or(
      `source.eq.system,and(source.eq.district,district_id.eq.${schoolDistrictId}),source.eq.user`
    );
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[DB] Error fetching strategies:', error);
    return { data: [], count: 0 };
  }

  return {
    data: (data || []).map(mapDbStrategyToRecord),
    count: count || 0,
  };
}

/**
 * Get a single strategy by ID
 */
export async function getStrategyById(id: string): Promise<StrategyRecord | null> {
  // Demo mode
  if (isDemoMode) {
    const allStrategies = [
      ...SYSTEM_STRATEGIES,
      ...DEMO_DISTRICT_STRATEGIES,
      ...DEMO_USER_STRATEGIES,
    ];
    return allStrategies.find((s) => s.id === id) || null;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('intervention_strategies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[DB] Error fetching strategy by ID:', error);
    return null;
  }

  return mapDbStrategyToRecord(data);
}

/**
 * Create a new custom strategy
 */
export async function createStrategy(
  schoolId: string,
  strategy: CreateStrategyInput,
  createdBy?: string
): Promise<StrategyRecord | null> {
  // Demo mode
  if (isDemoMode) {
    const newStrategy: StrategyRecord = {
      id: `user-strategy-${Date.now()}`,
      name: strategy.name,
      source: strategy.source || 'user',
      districtId: strategy.districtId,
      category: strategy.category,
      description: strategy.description,
      tags: strategy.tags || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy,
    };
    DEMO_USER_STRATEGIES.push(newStrategy);
    return newStrategy;
  }

  const supabase = await createServerSupabaseClient();

  // Get district ID from school if not provided
  let districtId = strategy.districtId;
  if (!districtId && strategy.source === 'district') {
    const { data: schoolData } = await supabase
      .from('schools')
      .select('district_id')
      .eq('id', schoolId)
      .single();
    districtId = schoolData?.district_id;
  }

  const { data, error } = await supabase
    .from('intervention_strategies')
    .insert({
      name: strategy.name,
      source: strategy.source || 'user',
      district_id: districtId,
      category: strategy.category,
      description: strategy.description,
      tags: strategy.tags || [],
      is_active: true,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('[DB] Error creating strategy:', error);
    return null;
  }

  return mapDbStrategyToRecord(data);
}

/**
 * Update an existing strategy
 */
export async function updateStrategy(
  id: string,
  updates: Partial<CreateStrategyInput>
): Promise<StrategyRecord | null> {
  // Demo mode
  if (isDemoMode) {
    const index = DEMO_USER_STRATEGIES.findIndex((s) => s.id === id);
    if (index === -1) return null;

    DEMO_USER_STRATEGIES[index] = {
      ...DEMO_USER_STRATEGIES[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return DEMO_USER_STRATEGIES[index];
  }

  const supabase = await createServerSupabaseClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.tags !== undefined) updateData.tags = updates.tags;

  const { data, error } = await supabase
    .from('intervention_strategies')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error updating strategy:', error);
    return null;
  }

  return mapDbStrategyToRecord(data);
}

/**
 * Soft delete a strategy (mark as inactive)
 */
export async function deleteStrategy(id: string): Promise<boolean> {
  // Demo mode
  if (isDemoMode) {
    const index = DEMO_USER_STRATEGIES.findIndex((s) => s.id === id);
    if (index === -1) return false;
    DEMO_USER_STRATEGIES.splice(index, 1);
    return true;
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('intervention_strategies')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[DB] Error deleting strategy:', error);
    return false;
  }

  return true;
}

/**
 * Get strategies grouped by category
 */
export async function getStrategiesByCategory(
  schoolId: string
): Promise<Record<string, StrategyRecord[]>> {
  const { data } = await getStrategies(schoolId, { limit: 200 });

  const grouped: Record<string, StrategyRecord[]> = {};
  for (const strategy of data) {
    const category = strategy.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(strategy);
  }

  return grouped;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

interface DbStrategyRow {
  id: string;
  name: string;
  source: string;
  district_id: string | null;
  category: string | null;
  description: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

function mapDbStrategyToRecord(row: DbStrategyRow): StrategyRecord {
  return {
    id: row.id,
    name: row.name,
    source: row.source as StrategySource,
    districtId: row.district_id || undefined,
    category: row.category || undefined,
    description: row.description || undefined,
    tags: row.tags || undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by || undefined,
  };
}
