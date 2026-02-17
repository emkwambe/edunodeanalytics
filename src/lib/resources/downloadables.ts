/**
 * Downloadable Assets Library
 * ===========================
 *
 * Templates, worksheets, and tools for data strategy implementation.
 */

import { DownloadableAsset, ResourceCategory, UserRole } from './types';

/**
 * All downloadable assets
 */
export const DOWNLOADABLE_ASSETS: DownloadableAsset[] = [
  // ===========================================
  // DATA LITERACY ASSETS
  // ===========================================
  {
    id: 'dl-ws-001',
    title: 'Data Interpretation Worksheet',
    description: 'Step-by-step guide for analyzing a single data point with context, avoiding common traps.',
    category: 'data_literacy',
    format: 'pdf',
    targetRoles: ['teacher', 'school_leader'],
    tags: ['worksheet', 'analysis', 'interpretation'],
    templateId: 'data-interpretation-worksheet',
  },
  {
    id: 'dl-ws-002',
    title: 'Metric Quick Reference Card',
    description: 'Pocket guide to EduNode metrics: definitions, thresholds, and recommended actions.',
    category: 'data_literacy',
    format: 'pdf',
    targetRoles: ['teacher', 'school_leader', 'cmo_executive'],
    tags: ['reference', 'metrics', 'quick-guide'],
    templateId: 'metric-reference-card',
  },
  {
    id: 'dl-ws-003',
    title: 'Chart Reading Checklist',
    description: 'Questions to ask before trusting any data visualization.',
    category: 'data_literacy',
    format: 'pdf',
    targetRoles: ['teacher', 'school_leader', 'cmo_executive'],
    tags: ['checklist', 'visualization', 'critical-thinking'],
    templateId: 'chart-reading-checklist',
  },
  {
    id: 'dl-ws-004',
    title: 'Student Profile Analysis Template',
    description: 'Structured template for analyzing a student using Momentum, Risk, and Cohort Sync.',
    category: 'data_literacy',
    format: 'pdf',
    targetRoles: ['teacher', 'school_leader'],
    tags: ['template', 'student-analysis', 'intervention'],
    templateId: 'student-profile-template',
  },

  // ===========================================
  // CULTURE CHANGE ASSETS
  // ===========================================
  {
    id: 'cc-ws-001',
    title: 'Data Meeting Agenda Template',
    description: 'Ready-to-use 45-minute data meeting agenda with the See-Think-Wonder protocol.',
    category: 'culture_change',
    format: 'docx',
    targetRoles: ['school_leader'],
    tags: ['template', 'meeting', 'agenda'],
    templateId: 'data-meeting-agenda',
  },
  {
    id: 'cc-ws-002',
    title: 'Change Readiness Assessment',
    description: 'Survey tool to diagnose organizational readiness for data culture change.',
    category: 'culture_change',
    format: 'xlsx',
    targetRoles: ['school_leader', 'cmo_executive'],
    tags: ['assessment', 'survey', 'readiness'],
    templateId: 'change-readiness-assessment',
  },
  {
    id: 'cc-ws-003',
    title: 'Champion Identification Worksheet',
    description: 'Framework for identifying and activating data champions in your organization.',
    category: 'culture_change',
    format: 'pdf',
    targetRoles: ['school_leader', 'cmo_executive'],
    tags: ['worksheet', 'leadership', 'change-management'],
    templateId: 'champion-identification',
  },
  {
    id: 'cc-ws-004',
    title: 'Data Conversation Sentence Starters',
    description: 'Inquiry-stance phrases for data conversations with teachers.',
    category: 'culture_change',
    format: 'pdf',
    targetRoles: ['school_leader'],
    tags: ['reference', 'coaching', 'communication'],
    templateId: 'conversation-starters',
  },
  {
    id: 'cc-ws-005',
    title: 'ADKAR Progress Tracker',
    description: 'Spreadsheet for tracking individual and team progress through change stages.',
    category: 'culture_change',
    format: 'xlsx',
    targetRoles: ['school_leader', 'cmo_executive'],
    tags: ['tracker', 'change-management', 'ADKAR'],
    templateId: 'adkar-tracker',
  },
  {
    id: 'cc-ws-006',
    title: 'Data Culture Pulse Survey',
    description: 'Staff survey template with ADKAR-aligned questions and scoring rubric.',
    category: 'culture_change',
    format: 'pdf',
    targetRoles: ['school_leader', 'cmo_executive'],
    tags: ['survey', 'culture', 'assessment'],
    templateId: 'culture-pulse-survey',
  },

  // ===========================================
  // IMPLEMENTATION ASSETS
  // ===========================================
  {
    id: 'im-ws-001',
    title: 'Pre-Implementation Checklist',
    description: 'Complete checklist of everything needed before connecting EduNode.',
    category: 'implementation',
    format: 'pdf',
    targetRoles: ['school_leader', 'cmo_executive'],
    tags: ['checklist', 'setup', 'planning'],
    templateId: 'pre-implementation-checklist',
  },
  {
    id: 'im-ws-002',
    title: 'Rollout Timeline Template',
    description: 'Customizable project timeline for three-phase EduNode rollout.',
    category: 'implementation',
    format: 'xlsx',
    targetRoles: ['school_leader', 'cmo_executive'],
    tags: ['template', 'timeline', 'project-plan'],
    templateId: 'rollout-timeline',
  },
  {
    id: 'im-ws-003',
    title: 'Pilot Selection Matrix',
    description: 'Scoring rubric for selecting optimal pilot participants.',
    category: 'implementation',
    format: 'xlsx',
    targetRoles: ['school_leader', 'cmo_executive'],
    tags: ['template', 'pilot', 'selection'],
    templateId: 'pilot-selection-matrix',
  },
  {
    id: 'im-ws-004',
    title: 'Training Session Agendas (Bundle)',
    description: 'Ready-to-use agendas for the three recommended training sessions.',
    category: 'implementation',
    format: 'docx',
    targetRoles: ['school_leader'],
    tags: ['template', 'training', 'agenda'],
    templateId: 'training-agendas-bundle',
  },
  {
    id: 'im-ws-005',
    title: 'Data Quality Audit Template',
    description: 'Structured template for conducting completeness, accuracy, and consistency audits.',
    category: 'implementation',
    format: 'xlsx',
    targetRoles: ['school_leader', 'cmo_executive'],
    tags: ['template', 'audit', 'data-quality'],
    templateId: 'data-quality-audit',
  },
  {
    id: 'im-ws-006',
    title: 'New Staff Onboarding Checklist',
    description: 'Step-by-step guide for onboarding new staff to EduNode and data practices.',
    category: 'implementation',
    format: 'pdf',
    targetRoles: ['school_leader'],
    tags: ['checklist', 'onboarding', 'staff'],
    templateId: 'staff-onboarding-checklist',
  },
  {
    id: 'im-ws-007',
    title: 'Quarterly Review Template',
    description: 'Structured template for quarterly data practice improvement reviews.',
    category: 'implementation',
    format: 'docx',
    targetRoles: ['school_leader', 'cmo_executive'],
    tags: ['template', 'review', 'continuous-improvement'],
    templateId: 'quarterly-review',
  },

  // ===========================================
  // CMO-SPECIFIC ASSETS
  // ===========================================
  {
    id: 'cmo-001',
    title: 'Network Rollout Playbook',
    description: 'Comprehensive guide for deploying EduNode across multiple schools.',
    category: 'implementation',
    format: 'pdf',
    targetRoles: ['cmo_executive'],
    tags: ['playbook', 'network', 'enterprise'],
    templateId: 'network-rollout-playbook',
  },
  {
    id: 'cmo-002',
    title: 'Cross-School Benchmarking Guide',
    description: 'How to use Network View for meaningful cross-school comparison.',
    category: 'data_literacy',
    format: 'pdf',
    targetRoles: ['cmo_executive'],
    tags: ['guide', 'benchmarking', 'network'],
    templateId: 'benchmarking-guide',
  },
  {
    id: 'cmo-003',
    title: 'School Leader Data Compact',
    description: 'Template agreement establishing data use expectations for school leaders.',
    category: 'culture_change',
    format: 'docx',
    targetRoles: ['cmo_executive'],
    tags: ['template', 'agreement', 'leadership'],
    templateId: 'data-compact',
  },
];

/**
 * Get all downloadable assets
 */
export function getAllAssets(): DownloadableAsset[] {
  return DOWNLOADABLE_ASSETS;
}

/**
 * Get assets by category
 */
export function getAssetsByCategory(category: ResourceCategory): DownloadableAsset[] {
  return DOWNLOADABLE_ASSETS.filter((a) => a.category === category);
}

/**
 * Get assets by role
 */
export function getAssetsByRole(role: UserRole): DownloadableAsset[] {
  return DOWNLOADABLE_ASSETS.filter((a) => a.targetRoles.includes(role));
}

/**
 * Get assets filtered by category and role
 */
export function getAssetsFiltered(
  category?: ResourceCategory,
  role?: UserRole
): DownloadableAsset[] {
  return DOWNLOADABLE_ASSETS.filter((a) => {
    const matchesCategory = !category || a.category === category;
    const matchesRole = !role || a.targetRoles.includes(role);
    return matchesCategory && matchesRole;
  });
}

/**
 * Get asset by ID
 */
export function getAssetById(id: string): DownloadableAsset | undefined {
  return DOWNLOADABLE_ASSETS.find((a) => a.id === id);
}

/**
 * Search assets by tag
 */
export function getAssetsByTag(tag: string): DownloadableAsset[] {
  return DOWNLOADABLE_ASSETS.filter((a) =>
    a.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
  );
}

/**
 * Get asset summary
 */
export function getAssetSummary() {
  return {
    total: DOWNLOADABLE_ASSETS.length,
    byCategory: {
      data_literacy: DOWNLOADABLE_ASSETS.filter((a) => a.category === 'data_literacy').length,
      culture_change: DOWNLOADABLE_ASSETS.filter((a) => a.category === 'culture_change').length,
      implementation: DOWNLOADABLE_ASSETS.filter((a) => a.category === 'implementation').length,
    },
    byFormat: {
      pdf: DOWNLOADABLE_ASSETS.filter((a) => a.format === 'pdf').length,
      xlsx: DOWNLOADABLE_ASSETS.filter((a) => a.format === 'xlsx').length,
      docx: DOWNLOADABLE_ASSETS.filter((a) => a.format === 'docx').length,
      pptx: DOWNLOADABLE_ASSETS.filter((a) => a.format === 'pptx').length,
    },
  };
}
