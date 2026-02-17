/**
 * Resource Content Index
 * ======================
 *
 * Central export for all resource content modules.
 */

export * from './data-literacy';
export * from './culture-change';
export * from './implementation';

import { LearningModule, ResourceCategory, UserRole } from '../types';
import { DATA_LITERACY_MODULES } from './data-literacy';
import { CULTURE_CHANGE_MODULES } from './culture-change';
import { IMPLEMENTATION_MODULES } from './implementation';

/**
 * All learning modules combined
 */
export const ALL_MODULES: LearningModule[] = [
  ...DATA_LITERACY_MODULES,
  ...CULTURE_CHANGE_MODULES,
  ...IMPLEMENTATION_MODULES,
];

/**
 * Get all modules
 */
export function getAllModules(): LearningModule[] {
  return ALL_MODULES;
}

/**
 * Get modules by category
 */
export function getModulesByCategory(category: ResourceCategory): LearningModule[] {
  return ALL_MODULES.filter((m) => m.category === category);
}

/**
 * Get modules by role
 */
export function getModulesByRole(role: UserRole): LearningModule[] {
  return ALL_MODULES.filter((m) => m.targetRoles.includes(role));
}

/**
 * Get modules by category and role
 */
export function getModulesFiltered(
  category?: ResourceCategory,
  role?: UserRole
): LearningModule[] {
  return ALL_MODULES.filter((m) => {
    const matchesCategory = !category || m.category === category;
    const matchesRole = !role || m.targetRoles.includes(role);
    return matchesCategory && matchesRole;
  });
}

/**
 * Get a module by slug
 */
export function getModuleBySlug(slug: string): LearningModule | undefined {
  return ALL_MODULES.find((m) => m.slug === slug);
}

/**
 * Get a module by ID
 */
export function getModuleById(id: string): LearningModule | undefined {
  return ALL_MODULES.find((m) => m.id === id);
}

/**
 * Get related modules
 */
export function getRelatedModules(moduleId: string): LearningModule[] {
  const module = getModuleById(moduleId);
  if (!module?.relatedModules) return [];

  return module.relatedModules
    .map((id) => getModuleById(id))
    .filter((m): m is LearningModule => m !== undefined);
}

/**
 * Get total estimated time for all modules in a category
 */
export function getCategoryTotalTime(category: ResourceCategory): number {
  return getModulesByCategory(category).reduce(
    (sum, m) => sum + m.estimatedMinutes,
    0
  );
}

/**
 * Resource library summary
 */
export function getResourceSummary() {
  return {
    totalModules: ALL_MODULES.length,
    totalTime: ALL_MODULES.reduce((sum, m) => sum + m.estimatedMinutes, 0),
    byCategory: {
      data_literacy: {
        count: DATA_LITERACY_MODULES.length,
        time: DATA_LITERACY_MODULES.reduce((sum, m) => sum + m.estimatedMinutes, 0),
      },
      culture_change: {
        count: CULTURE_CHANGE_MODULES.length,
        time: CULTURE_CHANGE_MODULES.reduce((sum, m) => sum + m.estimatedMinutes, 0),
      },
      implementation: {
        count: IMPLEMENTATION_MODULES.length,
        time: IMPLEMENTATION_MODULES.reduce((sum, m) => sum + m.estimatedMinutes, 0),
      },
    },
  };
}
