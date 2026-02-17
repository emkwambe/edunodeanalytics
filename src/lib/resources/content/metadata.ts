/**
 * Module Metadata (Lightweight)
 * =============================
 *
 * Lightweight metadata for module listings without full content.
 * Full content is loaded dynamically when viewing a module.
 */

import { ResourceCategory, UserRole, ContentDifficulty } from '../types';

export interface ModuleMetadata {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: ResourceCategory;
  targetRoles: UserRole[];
  difficulty: ContentDifficulty;
  estimatedMinutes: number;
  sectionCount: number;
  outcomes: string[];
}

/**
 * Lightweight module metadata for listings
 */
export const MODULE_METADATA: ModuleMetadata[] = [
  // Data Literacy
  {
    id: 'dl-001',
    slug: 'reading-data-like-educator',
    title: 'Reading Data Like an Educator',
    description: 'Learn to interpret educational metrics with purpose, avoiding common pitfalls.',
    category: 'data_literacy',
    targetRoles: ['teacher', 'school_leader', 'cmo_executive'],
    difficulty: 'beginner',
    estimatedMinutes: 25,
    sectionCount: 3,
    outcomes: [
      'Distinguish between different types of educational metrics',
      'Identify when data is actionable vs. merely interesting',
      'Avoid the three most common data misinterpretation traps',
    ],
  },
  {
    id: 'dl-002',
    slug: 'understanding-visualizations',
    title: 'Understanding Visualizations',
    description: 'Master reading charts, graphs, and dashboards to extract meaning quickly.',
    category: 'data_literacy',
    targetRoles: ['teacher', 'school_leader', 'cmo_executive'],
    difficulty: 'beginner',
    estimatedMinutes: 20,
    sectionCount: 2,
    outcomes: [
      'Read common chart types used in educational analytics',
      'Identify misleading visualizations and design flaws',
      'Know which chart type fits which question',
    ],
  },
  {
    id: 'dl-003',
    slug: 'edunode-metrics-deep-dive',
    title: 'EduNode Metrics Deep Dive',
    description: 'Understand purpose-driven metrics in EduNode and how to act on each.',
    category: 'data_literacy',
    targetRoles: ['teacher', 'school_leader', 'cmo_executive'],
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    sectionCount: 3,
    outcomes: [
      'Explain what each EduNode metric measures and why',
      'Identify appropriate actions based on metric thresholds',
      'Connect metrics to student intervention decisions',
    ],
  },
  {
    id: 'dl-004',
    slug: 'data-informed-decisions',
    title: 'Data-Informed Decision Making',
    description: 'A framework for systematically incorporating data into leadership decisions.',
    category: 'data_literacy',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'advanced',
    estimatedMinutes: 35,
    sectionCount: 2,
    outcomes: [
      'Apply a structured decision-making framework to school challenges',
      'Balance data with professional judgment and context',
      'Build decision audit trails for continuous improvement',
    ],
  },

  // Culture Change
  {
    id: 'cc-001',
    slug: 'building-buy-in',
    title: 'Building Buy-In for Data Culture',
    description: 'Strategies for gaining organizational support for data-informed practices.',
    category: 'culture_change',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    sectionCount: 3,
    outcomes: [
      'Identify and address common sources of data resistance',
      'Craft messaging that connects data to teacher values',
      'Build a coalition of early adopters and champions',
    ],
  },
  {
    id: 'cc-002',
    slug: 'effective-data-meetings',
    title: 'Running Effective Data Meetings',
    description: 'Transform data meetings into action-oriented sessions that drive outcomes.',
    category: 'culture_change',
    targetRoles: ['teacher', 'school_leader'],
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    sectionCount: 3,
    outcomes: [
      'Design data meeting agendas that drive action',
      'Facilitate discussions that surface insights',
      'Close meetings with clear commitments',
    ],
  },
  {
    id: 'cc-003',
    slug: 'change-management-framework',
    title: 'Leading Organizational Change',
    description: 'A practical framework for managing the human side of data transformation.',
    category: 'culture_change',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'advanced',
    estimatedMinutes: 40,
    sectionCount: 3,
    outcomes: [
      'Apply ADKAR change management framework',
      'Anticipate and address change fatigue',
      'Measure and communicate progress on culture change',
    ],
  },
  {
    id: 'cc-004',
    slug: 'teacher-data-conversations',
    title: 'Data Conversations with Teachers',
    description: 'How to use data in coaching conversations without triggering defensiveness.',
    category: 'culture_change',
    targetRoles: ['school_leader'],
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    sectionCount: 2,
    outcomes: [
      'Frame data conversations as collaborative inquiry',
      'Use data to surface questions rather than judgments',
      'Navigate difficult conversations when data reveals problems',
    ],
  },

  // Implementation
  {
    id: 'im-001',
    slug: 'edunode-quick-start',
    title: 'EduNode Quick Start Guide',
    description: 'Get your school connected and first dashboard running quickly.',
    category: 'implementation',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'beginner',
    estimatedMinutes: 45,
    sectionCount: 3,
    outcomes: [
      'Connect your first data source',
      'Navigate the core dashboards',
      'Set up initial user accounts',
    ],
  },
  {
    id: 'im-002',
    slug: 'rollout-planning',
    title: 'Rollout Planning Guide',
    description: 'Plan a phased rollout that builds momentum without overwhelming your team.',
    category: 'implementation',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    sectionCount: 3,
    outcomes: [
      'Design a phased rollout timeline',
      'Identify pilot groups and success criteria',
      'Plan training and support structures',
    ],
  },
  {
    id: 'im-003',
    slug: 'data-quality-management',
    title: 'Data Quality Management',
    description: 'Identify, address, and prevent data quality issues that undermine trust.',
    category: 'implementation',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    sectionCount: 2,
    outcomes: [
      'Conduct a data quality audit',
      'Prioritize data issues by impact',
      'Build a data quality improvement plan',
    ],
  },
  {
    id: 'im-004',
    slug: 'sustaining-adoption',
    title: 'Sustaining Long-Term Adoption',
    description: 'Maintain momentum and prevent regression after initial implementation.',
    category: 'implementation',
    targetRoles: ['school_leader', 'cmo_executive'],
    difficulty: 'advanced',
    estimatedMinutes: 30,
    sectionCount: 3,
    outcomes: [
      'Build data use into organizational routines',
      'Handle staff turnover without losing capability',
      'Continuously improve data practices',
    ],
  },
];

/**
 * Get all module metadata
 */
export function getAllModuleMetadata(): ModuleMetadata[] {
  return MODULE_METADATA;
}

/**
 * Get metadata by slug
 */
export function getModuleMetadataBySlug(slug: string): ModuleMetadata | undefined {
  return MODULE_METADATA.find((m) => m.slug === slug);
}

/**
 * Get metadata by category
 */
export function getModuleMetadataByCategory(category: ResourceCategory): ModuleMetadata[] {
  return MODULE_METADATA.filter((m) => m.category === category);
}

/**
 * Get metadata by role
 */
export function getModuleMetadataByRole(role: UserRole): ModuleMetadata[] {
  return MODULE_METADATA.filter((m) => m.targetRoles.includes(role));
}

/**
 * Filter metadata
 */
export function getModuleMetadataFiltered(
  category?: ResourceCategory,
  role?: UserRole
): ModuleMetadata[] {
  return MODULE_METADATA.filter((m) => {
    const matchesCategory = !category || m.category === category;
    const matchesRole = !role || m.targetRoles.includes(role);
    return matchesCategory && matchesRole;
  });
}
