/**
 * MTSS (Multi-Tiered System of Supports) Intervention Types
 * =========================================================
 *
 * Comprehensive type definitions for Tier 2 (targeted) and Tier 3 (intensive)
 * intervention management with flexible customization support.
 */

// ---------------------------------------------------------------------------
// Strategy Types - Flexible hybrid model (string OR object)
// ---------------------------------------------------------------------------

export type StrategySource = 'system' | 'district' | 'user';

export interface CustomStrategy {
  id?: string;
  name: string;
  source: StrategySource;
  category?: string;
  tags?: string[];
  description?: string;
  districtId?: string;
}

// Strategy can be either a simple string reference or a custom object
export type InterventionStrategy = string | CustomStrategy;

// ---------------------------------------------------------------------------
// Progress Monitoring Types
// ---------------------------------------------------------------------------

export type ProgressTrend = 'improving' | 'stable' | 'declining' | 'insufficient_data';
export type MonitoringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface ProgressMonitoring {
  tool: string;
  frequency: MonitoringFrequency;
  notes?: string;
  trend?: ProgressTrend;
  showGraph: boolean;
  lastDataEntry?: string; // ISO date
  dataPoints?: ProgressDataPoint[];
}

export interface ProgressDataPoint {
  date: string; // ISO date
  value: number;
  note?: string;
  recordedBy?: string;
}

// ---------------------------------------------------------------------------
// Dosage Types
// ---------------------------------------------------------------------------

export interface DosagePlan {
  sessionsPerWeek: number;
  minutesPerSession: number;
  totalWeeks: number;
  // Derived values (computed but can be overridden when customization enabled)
  totalSessions?: number;
  totalMinutes?: number;
  // Override flags for customization mode
  overrideTotalSessions?: boolean;
  overrideTotalMinutes?: boolean;
}

// ---------------------------------------------------------------------------
// Goal Types
// ---------------------------------------------------------------------------

export interface InterventionGoal {
  id: string;
  description: string;
  baseline: number;
  target: number;
  currentValue?: number;
  unit?: string; // e.g., "WPM", "%", "score"
  successCriteria?: string;
  isPrimary: boolean;
}

// ---------------------------------------------------------------------------
// Tier 3 Specific: Fidelity Tracking
// ---------------------------------------------------------------------------

export interface FidelityTracking {
  implementedAsDesigned: boolean;
  missedSessions: number;
  missedSessionReasons?: string[];
  fidelityScore?: number; // 0-100
  notes?: string;
  lastCheckedDate?: string;
  checkedBy?: string;
}

// ---------------------------------------------------------------------------
// Tier 3 Specific: Team Involvement
// ---------------------------------------------------------------------------

export interface TeamMember {
  userId?: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface TeamInvolvement {
  staffList: TeamMember[];
  parentContact: ParentContact;
  notes?: string;
  lastMeetingDate?: string;
  nextMeetingDate?: string;
}

export interface ParentContact {
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  preferredContactMethod?: 'phone' | 'email' | 'text' | 'in_person';
  lastContactDate?: string;
  contactHistory?: ContactRecord[];
}

export interface ContactRecord {
  date: string;
  method: string;
  summary: string;
  initiatedBy: string;
}

// ---------------------------------------------------------------------------
// Customization Types
// ---------------------------------------------------------------------------

export interface CustomField {
  key: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'date';
}

export interface SupportingFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface InterventionCustomization {
  enabled: boolean;
  customFields?: CustomField[];
  additionalGoals?: InterventionGoal[];
  supportingFiles?: SupportingFile[];
  extendedNotes?: string;
  dosageOverrides?: {
    totalSessions?: number;
    totalMinutes?: number;
  };
}

// ---------------------------------------------------------------------------
// Review Types
// ---------------------------------------------------------------------------

export type ReviewDecision =
  | 'continue'
  | 'modify'
  | 'intensify'
  | 'fade'
  | 'exit_successful'
  | 'exit_unsuccessful'
  | 'refer_for_evaluation';

export interface InterventionReview {
  reviewDate: string;
  decision: ReviewDecision;
  notes?: string;
  reviewedBy?: string;
  nextReviewDate?: string;
  recommendations?: string[];
}

// ---------------------------------------------------------------------------
// Intervention Setting Types
// ---------------------------------------------------------------------------

export type InterventionSetting =
  | 'general_education'
  | 'small_group'
  | 'one_on_one'
  | 'resource_room'
  | 'home'
  | 'community'
  | 'virtual'
  | 'other';

// ---------------------------------------------------------------------------
// Tier Types
// ---------------------------------------------------------------------------

export type InterventionTier = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Main MTSS Intervention Interface
// ---------------------------------------------------------------------------

export interface MTSSInterventionPlan {
  // Student Info
  student: {
    id: string;
    name: string;
    grade: number;
    riskLevel: 'on_track' | 'watch' | 'at_risk' | 'critical';
  };

  // Intervention Details
  title: string;
  type: 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tier: InterventionTier;
  status: 'planned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

  // Plan Details
  description: string;
  groupSize?: number; // Tier 2: typically 3-6, Tier 3: typically 1
  strategy: InterventionStrategy;
  setting: InterventionSetting;
  startDate: string;
  targetEndDate?: string;
  actualEndDate?: string;

  // Goals
  primaryGoal: InterventionGoal;
  additionalGoals?: InterventionGoal[];

  // Progress Monitoring
  progressMonitoring: ProgressMonitoring;

  // Dosage
  dosage: DosagePlan;

  // Review
  reviews?: InterventionReview[];
  nextReviewDate?: string;

  // Tier 3 Required Fields
  fidelityTracking?: FidelityTracking; // Required for Tier 3
  teamInvolvement?: TeamInvolvement; // Required for Tier 3

  // Customization
  customization?: InterventionCustomization;
}

// ---------------------------------------------------------------------------
// Metadata structure for existing intervention table
// ---------------------------------------------------------------------------

export interface MTSSInterventionMetadata {
  tier: InterventionTier;

  // Plan details
  groupSize?: number;
  strategy?: InterventionStrategy;
  setting?: InterventionSetting;

  // Primary goal details
  primaryGoal?: Omit<InterventionGoal, 'id' | 'isPrimary'>;
  additionalGoals?: InterventionGoal[];

  // Progress monitoring
  progressMonitoring?: ProgressMonitoring;

  // Dosage plan
  dosagePlan?: DosagePlan;

  // Reviews
  reviews?: InterventionReview[];
  nextReviewDate?: string;

  // Tier 3 specific
  fidelityTracking?: FidelityTracking;
  teamInvolvement?: TeamInvolvement;

  // Customization
  customization?: InterventionCustomization;

  // AI Flight Plan reference
  flightPlan?: unknown;
  sourceInterventionId?: string;
  generatedAt?: string;
}

// ---------------------------------------------------------------------------
// Strategy Database Model
// ---------------------------------------------------------------------------

export interface StrategyRecord {
  id: string;
  name: string;
  source: StrategySource;
  districtId?: string;
  category?: string;
  description?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// ---------------------------------------------------------------------------
// Form State Types
// ---------------------------------------------------------------------------

export interface MTSSInterventionFormState {
  // Student
  studentId: string;

  // Basic Info
  title: string;
  type: 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tier: InterventionTier;
  status: 'planned' | 'in_progress';
  description: string;

  // Plan
  groupSize: number;
  strategy: InterventionStrategy;
  customStrategyName?: string; // For "Add Custom Strategy" flow
  setting: InterventionSetting;
  startDate: string;
  targetEndDate: string;

  // Goals
  primaryGoalDescription: string;
  baseline: number;
  target: number;
  unit: string;
  successCriteria: string;

  // Progress Monitoring
  monitoringTool: string;
  monitoringFrequency: MonitoringFrequency;
  monitoringNotes: string;
  showProgressGraph: boolean;

  // Dosage
  sessionsPerWeek: number;
  minutesPerSession: number;
  totalWeeks: number;

  // Review
  nextReviewDate: string;

  // Tier 3 Specific
  fidelityImplementedAsDesigned?: boolean;
  fidelityNotes?: string;
  teamStaff?: TeamMember[];
  parentContactName?: string;
  parentContactRelationship?: string;
  parentContactPhone?: string;
  parentContactEmail?: string;
  parentPreferredContact?: 'phone' | 'email' | 'text' | 'in_person';
  teamNotes?: string;

  // Customization
  customizationEnabled: boolean;
  customFields?: CustomField[];
  additionalGoals?: Omit<InterventionGoal, 'id'>[];
  supportingFileUrls?: string[];
  extendedNotes?: string;
  overrideTotalSessions?: number;
  overrideTotalMinutes?: number;
}

// ---------------------------------------------------------------------------
// Default Values
// ---------------------------------------------------------------------------

export const DEFAULT_MTSS_FORM_STATE: MTSSInterventionFormState = {
  studentId: '',
  title: '',
  type: 'academic',
  priority: 'medium',
  tier: 2,
  status: 'planned',
  description: '',
  groupSize: 4,
  strategy: '',
  setting: 'small_group',
  startDate: new Date().toISOString().slice(0, 10),
  targetEndDate: '',
  primaryGoalDescription: '',
  baseline: 0,
  target: 0,
  unit: '',
  successCriteria: '',
  monitoringTool: '',
  monitoringFrequency: 'weekly',
  monitoringNotes: '',
  showProgressGraph: true,
  sessionsPerWeek: 3,
  minutesPerSession: 30,
  totalWeeks: 8,
  nextReviewDate: '',
  customizationEnabled: false,
};

// Tier 2 defaults
export const TIER_2_DEFAULTS = {
  groupSize: 4, // Small group 3-6
  monitoringFrequency: 'weekly' as MonitoringFrequency,
  setting: 'small_group' as InterventionSetting,
};

// Tier 3 defaults
export const TIER_3_DEFAULTS = {
  groupSize: 1, // Individualized
  monitoringFrequency: 'biweekly' as MonitoringFrequency,
  setting: 'one_on_one' as InterventionSetting,
  fidelityTracking: {
    implementedAsDesigned: true,
    missedSessions: 0,
    notes: '',
  } as FidelityTracking,
};

// ---------------------------------------------------------------------------
// Utility Types for API Responses
// ---------------------------------------------------------------------------

export interface StrategiesResponse {
  data: StrategyRecord[];
  total: number;
}

export interface CreateStrategyInput {
  name: string;
  source?: StrategySource;
  districtId?: string;
  category?: string;
  description?: string;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Validation Helper Types
// ---------------------------------------------------------------------------

export interface MTSSValidationError {
  field: string;
  message: string;
  tier?: InterventionTier;
}

export interface MTSSValidationResult {
  isValid: boolean;
  errors: MTSSValidationError[];
}
