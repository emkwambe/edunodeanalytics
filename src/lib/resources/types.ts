/**
 * Data Strategy & Culture Resources Types
 * ========================================
 *
 * Type definitions for the resource center, learning modules,
 * and downloadable assets system.
 */

export type UserRole = 'teacher' | 'school_leader' | 'cmo_executive';

export type ResourceCategory =
  | 'data_literacy'
  | 'culture_change'
  | 'implementation';

export type ResourceFormat =
  | 'article'
  | 'video'
  | 'interactive'
  | 'worksheet'
  | 'template'
  | 'checklist'
  | 'playbook';

export type ContentDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Learning Module - A structured unit of learning content
 */
export interface LearningModule {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: ResourceCategory;
  targetRoles: UserRole[];
  difficulty: ContentDifficulty;
  estimatedMinutes: number;
  sections: ModuleSection[];
  outcomes: string[];
  prerequisites?: string[];
  relatedModules?: string[];
}

export interface ModuleSection {
  id: string;
  title: string;
  content: string; // Markdown content
  format: ResourceFormat;
  keyTakeaways?: string[];
  reflectionQuestions?: string[];
  practiceActivity?: PracticeActivity;
}

export interface PracticeActivity {
  title: string;
  instructions: string;
  estimatedMinutes: number;
  deliverable?: string;
}

/**
 * Downloadable Asset
 */
export interface DownloadableAsset {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  format: 'pdf' | 'xlsx' | 'docx' | 'pptx';
  targetRoles: UserRole[];
  fileUrl?: string; // For pre-generated files
  templateId?: string; // For dynamic generation
  tags: string[];
}

/**
 * User Progress Tracking
 */
export interface UserProgress {
  moduleId: string;
  sectionsCompleted: string[];
  startedAt: Date;
  completedAt?: Date;
  quizScores?: Record<string, number>;
  notes?: string;
}

export interface ResourceCenterProgress {
  userId: string;
  schoolId: string;
  moduleProgress: Record<string, UserProgress>;
  downloadedAssets: string[];
  bookmarkedResources: string[];
  lastActivityAt: Date;
}

/**
 * Resource Display Helpers
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  teacher: 'Teachers',
  school_leader: 'School Leaders',
  cmo_executive: 'CMO Executives',
};

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  data_literacy: 'Data Literacy',
  culture_change: 'Culture Change',
  implementation: 'Implementation',
};

export const CATEGORY_DESCRIPTIONS: Record<ResourceCategory, string> = {
  data_literacy: 'Build foundational skills for reading, interpreting, and acting on data',
  culture_change: 'Transform your organization into a data-informed learning community',
  implementation: 'Practical guides for deploying EduNode and driving adoption',
};

export const DIFFICULTY_LABELS: Record<ContentDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const FORMAT_ICONS: Record<ResourceFormat, string> = {
  article: 'FileText',
  video: 'Video',
  interactive: 'MousePointer',
  worksheet: 'ClipboardList',
  template: 'FileSpreadsheet',
  checklist: 'CheckSquare',
  playbook: 'Book',
};
