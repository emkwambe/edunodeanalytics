/**
 * Data Strategy & Culture Resources
 * ==================================
 *
 * Main entry point for the resource library.
 */

export * from './types';
export * from './content';
export * from './downloadables';

import {
  LearningModule,
  DownloadableAsset,
  ResourceCategory,
  UserRole,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  ROLE_LABELS,
} from './types';
import { getAllModules, getModulesFiltered, getResourceSummary } from './content';
import { getAllAssets, getAssetsFiltered, getAssetSummary } from './downloadables';

/**
 * Combined resource library interface
 */
export interface ResourceLibrary {
  modules: LearningModule[];
  assets: DownloadableAsset[];
  categories: {
    id: ResourceCategory;
    label: string;
    description: string;
    moduleCount: number;
    assetCount: number;
  }[];
  summary: {
    totalModules: number;
    totalAssets: number;
    totalMinutes: number;
  };
}

/**
 * Get the complete resource library
 */
export function getResourceLibrary(
  category?: ResourceCategory,
  role?: UserRole
): ResourceLibrary {
  const modules = getModulesFiltered(category, role);
  const assets = getAssetsFiltered(category, role);

  const categories: ResourceLibrary['categories'] = [
    {
      id: 'data_literacy',
      label: CATEGORY_LABELS.data_literacy,
      description: CATEGORY_DESCRIPTIONS.data_literacy,
      moduleCount: modules.filter((m) => m.category === 'data_literacy').length,
      assetCount: assets.filter((a) => a.category === 'data_literacy').length,
    },
    {
      id: 'culture_change',
      label: CATEGORY_LABELS.culture_change,
      description: CATEGORY_DESCRIPTIONS.culture_change,
      moduleCount: modules.filter((m) => m.category === 'culture_change').length,
      assetCount: assets.filter((a) => a.category === 'culture_change').length,
    },
    {
      id: 'implementation',
      label: CATEGORY_LABELS.implementation,
      description: CATEGORY_DESCRIPTIONS.implementation,
      moduleCount: modules.filter((m) => m.category === 'implementation').length,
      assetCount: assets.filter((a) => a.category === 'implementation').length,
    },
  ];

  return {
    modules,
    assets,
    categories,
    summary: {
      totalModules: modules.length,
      totalAssets: assets.length,
      totalMinutes: modules.reduce((sum, m) => sum + m.estimatedMinutes, 0),
    },
  };
}

/**
 * Get recommended resources for a role
 */
export function getRecommendedResources(role: UserRole): {
  startHere: LearningModule[];
  essentialAssets: DownloadableAsset[];
} {
  const allModules = getAllModules();
  const allAssets = getAllAssets();

  // Recommendations by role
  const recommendations: Record<UserRole, { moduleIds: string[]; assetIds: string[] }> = {
    teacher: {
      moduleIds: ['dl-001', 'dl-002', 'dl-003', 'cc-002'],
      assetIds: ['dl-ws-001', 'dl-ws-002', 'dl-ws-004'],
    },
    school_leader: {
      moduleIds: ['dl-001', 'dl-004', 'cc-001', 'cc-002', 'im-001', 'im-002'],
      assetIds: ['cc-ws-001', 'cc-ws-003', 'im-ws-001', 'im-ws-002'],
    },
    cmo_executive: {
      moduleIds: ['dl-004', 'cc-001', 'cc-003', 'im-002', 'im-004'],
      assetIds: ['cmo-001', 'cmo-002', 'cmo-003', 'cc-ws-002'],
    },
  };

  const rec = recommendations[role];

  return {
    startHere: rec.moduleIds
      .map((id) => allModules.find((m) => m.id === id))
      .filter((m): m is LearningModule => m !== undefined),
    essentialAssets: rec.assetIds
      .map((id) => allAssets.find((a) => a.id === id))
      .filter((a): a is DownloadableAsset => a !== undefined),
  };
}

/**
 * Get learning path for a role
 */
export function getLearningPath(role: UserRole): {
  phase: string;
  description: string;
  modules: LearningModule[];
}[] {
  const allModules = getAllModules();

  const paths: Record<UserRole, { phase: string; description: string; moduleIds: string[] }[]> = {
    teacher: [
      {
        phase: 'Foundation',
        description: 'Build core data literacy skills',
        moduleIds: ['dl-001', 'dl-002'],
      },
      {
        phase: 'Application',
        description: 'Apply to EduNode metrics',
        moduleIds: ['dl-003'],
      },
      {
        phase: 'Practice',
        description: 'Use data in daily work',
        moduleIds: ['cc-002'],
      },
    ],
    school_leader: [
      {
        phase: 'Foundation',
        description: 'Master data interpretation',
        moduleIds: ['dl-001', 'dl-002', 'dl-003'],
      },
      {
        phase: 'Leadership',
        description: 'Lead data-informed decision making',
        moduleIds: ['dl-004', 'cc-001'],
      },
      {
        phase: 'Culture',
        description: 'Build organizational data culture',
        moduleIds: ['cc-002', 'cc-003', 'cc-004'],
      },
      {
        phase: 'Implementation',
        description: 'Deploy and sustain EduNode',
        moduleIds: ['im-001', 'im-002', 'im-003', 'im-004'],
      },
    ],
    cmo_executive: [
      {
        phase: 'Strategy',
        description: 'Data-informed decision making at scale',
        moduleIds: ['dl-004'],
      },
      {
        phase: 'Change Leadership',
        description: 'Lead network-wide transformation',
        moduleIds: ['cc-001', 'cc-003'],
      },
      {
        phase: 'Implementation',
        description: 'Deploy across the network',
        moduleIds: ['im-002', 'im-004'],
      },
    ],
  };

  return paths[role].map((p) => ({
    phase: p.phase,
    description: p.description,
    modules: p.moduleIds
      .map((id) => allModules.find((m) => m.id === id))
      .filter((m): m is LearningModule => m !== undefined),
  }));
}
