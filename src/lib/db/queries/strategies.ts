/**
 * Intervention Strategies Queries
 * ================================
 *
 * Data access layer for intervention strategy operations.
 * Strategies can be system-defined, district-defined, or user-created.
 *
 * NOTE: Currently using demo data. Database table intervention_strategies
 * will be added in a future migration.
 */

import type { StrategyRecord, StrategySource, CreateStrategyInput } from '@/lib/mtss/types';

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

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
  _schoolId: string,
  options: StrategyQueryOptions = {}
): Promise<{ data: StrategyRecord[]; count: number }> {
  const { source, category, search, limit = 50, offset = 0 } = options;

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

/**
 * Get a single strategy by ID
 */
export async function getStrategyById(id: string): Promise<StrategyRecord | null> {
  const allStrategies = [
    ...SYSTEM_STRATEGIES,
    ...DEMO_DISTRICT_STRATEGIES,
    ...DEMO_USER_STRATEGIES,
  ];
  return allStrategies.find((s) => s.id === id) || null;
}

/**
 * Create a new custom strategy
 */
export async function createStrategy(
  _schoolId: string,
  strategy: CreateStrategyInput,
  createdBy?: string
): Promise<StrategyRecord | null> {
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

/**
 * Update an existing strategy
 */
export async function updateStrategy(
  id: string,
  updates: Partial<CreateStrategyInput>
): Promise<StrategyRecord | null> {
  const index = DEMO_USER_STRATEGIES.findIndex((s) => s.id === id);
  if (index === -1) return null;

  DEMO_USER_STRATEGIES[index] = {
    ...DEMO_USER_STRATEGIES[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return DEMO_USER_STRATEGIES[index];
}

/**
 * Soft delete a strategy (mark as inactive)
 */
export async function deleteStrategy(id: string): Promise<boolean> {
  const index = DEMO_USER_STRATEGIES.findIndex((s) => s.id === id);
  if (index === -1) return false;
  DEMO_USER_STRATEGIES.splice(index, 1);
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
