/**
 * MTSS Intervention Validation
 * ============================
 *
 * Zod schemas with tier-based conditional validation logic.
 * Tier 2: lighter structure, small group interventions
 * Tier 3: strict validation, required fidelity + team fields, individualized support
 */

import { z } from 'zod';
import type { InterventionTier, MTSSValidationResult, MTSSValidationError } from './types';

// ---------------------------------------------------------------------------
// Base Enums and Constants
// ---------------------------------------------------------------------------

export const interventionTierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const strategySourceSchema = z.enum(['system', 'district', 'user']);

export const progressTrendSchema = z.enum(['improving', 'stable', 'declining', 'insufficient_data']);

export const monitoringFrequencySchema = z.enum(['daily', 'weekly', 'biweekly', 'monthly']);

export const interventionSettingSchema = z.enum([
  'general_education',
  'small_group',
  'one_on_one',
  'resource_room',
  'home',
  'community',
  'virtual',
  'other',
]);

export const reviewDecisionSchema = z.enum([
  'continue',
  'modify',
  'intensify',
  'fade',
  'exit_successful',
  'exit_unsuccessful',
  'refer_for_evaluation',
]);

export const preferredContactMethodSchema = z.enum(['phone', 'email', 'text', 'in_person']);

// ---------------------------------------------------------------------------
// Strategy Schema - Accepts string OR custom object
// ---------------------------------------------------------------------------

export const customStrategySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Strategy name is required'),
  source: strategySourceSchema,
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  districtId: z.string().optional(),
});

export const interventionStrategySchema = z.union([
  z.string().min(1, 'Strategy is required'),
  customStrategySchema,
]);

// ---------------------------------------------------------------------------
// Progress Data Point Schema
// ---------------------------------------------------------------------------

export const progressDataPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  value: z.number(),
  note: z.string().optional(),
  recordedBy: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Progress Monitoring Schema
// ---------------------------------------------------------------------------

export const progressMonitoringSchema = z.object({
  tool: z.string().min(1, 'Monitoring tool is required'),
  frequency: monitoringFrequencySchema,
  notes: z.string().optional(),
  trend: progressTrendSchema.optional(),
  showGraph: z.boolean().default(true),
  lastDataEntry: z.string().optional(),
  dataPoints: z.array(progressDataPointSchema).optional(),
});

// ---------------------------------------------------------------------------
// Dosage Plan Schema
// ---------------------------------------------------------------------------

export const dosagePlanSchema = z.object({
  sessionsPerWeek: z.number().min(1).max(7),
  minutesPerSession: z.number().min(5).max(180),
  totalWeeks: z.number().min(1).max(52),
  totalSessions: z.number().optional(),
  totalMinutes: z.number().optional(),
  overrideTotalSessions: z.boolean().optional(),
  overrideTotalMinutes: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Goal Schema
// ---------------------------------------------------------------------------

export const interventionGoalSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Goal description is required'),
  baseline: z.number(),
  target: z.number(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  successCriteria: z.string().optional(),
  isPrimary: z.boolean(),
});

// ---------------------------------------------------------------------------
// Team Member Schema
// ---------------------------------------------------------------------------

export const teamMemberSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(1, 'Team member name is required'),
  role: z.string().min(1, 'Role is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Parent Contact Schema
// ---------------------------------------------------------------------------

export const contactRecordSchema = z.object({
  date: z.string(),
  method: z.string(),
  summary: z.string(),
  initiatedBy: z.string(),
});

export const parentContactSchema = z.object({
  name: z.string().min(1, 'Parent/guardian name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  preferredContactMethod: preferredContactMethodSchema.optional(),
  lastContactDate: z.string().optional(),
  contactHistory: z.array(contactRecordSchema).optional(),
});

// ---------------------------------------------------------------------------
// Fidelity Tracking Schema (Tier 3 Required)
// ---------------------------------------------------------------------------

export const fidelityTrackingSchema = z.object({
  implementedAsDesigned: z.boolean(),
  missedSessions: z.number().min(0),
  missedSessionReasons: z.array(z.string()).optional(),
  fidelityScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  lastCheckedDate: z.string().optional(),
  checkedBy: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Team Involvement Schema (Tier 3 Required)
// ---------------------------------------------------------------------------

export const teamInvolvementSchema = z.object({
  staffList: z.array(teamMemberSchema).min(1, 'At least one staff member is required'),
  parentContact: parentContactSchema,
  notes: z.string().optional(),
  lastMeetingDate: z.string().optional(),
  nextMeetingDate: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Review Schema
// ---------------------------------------------------------------------------

export const interventionReviewSchema = z.object({
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  decision: reviewDecisionSchema,
  notes: z.string().optional(),
  reviewedBy: z.string().optional(),
  nextReviewDate: z.string().optional(),
  recommendations: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Custom Field Schema
// ---------------------------------------------------------------------------

export const customFieldSchema = z.object({
  key: z.string().min(1, 'Field key is required'),
  value: z.union([z.string(), z.number(), z.boolean()]),
  type: z.enum(['text', 'number', 'boolean', 'date']),
});

// ---------------------------------------------------------------------------
// Supporting File Schema
// ---------------------------------------------------------------------------

export const supportingFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  type: z.string(),
  uploadedAt: z.string(),
  uploadedBy: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Customization Schema
// ---------------------------------------------------------------------------

export const interventionCustomizationSchema = z.object({
  enabled: z.boolean(),
  customFields: z.array(customFieldSchema).optional(),
  additionalGoals: z.array(interventionGoalSchema).optional(),
  supportingFiles: z.array(supportingFileSchema).optional(),
  extendedNotes: z.string().optional(),
  dosageOverrides: z
    .object({
      totalSessions: z.number().optional(),
      totalMinutes: z.number().optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// MTSS Intervention Metadata Schema
// ---------------------------------------------------------------------------

export const mtssInterventionMetadataSchema = z.object({
  tier: interventionTierSchema,
  groupSize: z.number().min(1).max(30).optional(),
  strategy: interventionStrategySchema.optional(),
  setting: interventionSettingSchema.optional(),
  primaryGoal: z
    .object({
      description: z.string(),
      baseline: z.number(),
      target: z.number(),
      currentValue: z.number().optional(),
      unit: z.string().optional(),
      successCriteria: z.string().optional(),
    })
    .optional(),
  additionalGoals: z.array(interventionGoalSchema).optional(),
  progressMonitoring: progressMonitoringSchema.optional(),
  dosagePlan: dosagePlanSchema.optional(),
  reviews: z.array(interventionReviewSchema).optional(),
  nextReviewDate: z.string().optional(),
  fidelityTracking: fidelityTrackingSchema.optional(),
  teamInvolvement: teamInvolvementSchema.optional(),
  customization: interventionCustomizationSchema.optional(),
  // AI Flight Plan fields
  flightPlan: z.unknown().optional(),
  sourceInterventionId: z.string().optional(),
  generatedAt: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Create MTSS Intervention Schema
// ---------------------------------------------------------------------------

export const createMTSSInterventionSchema = z
  .object({
    school_id: z.string().uuid('Invalid school ID'),
    student_id: z.string().uuid('Invalid student ID'),
    type: z.enum(['academic', 'attendance', 'behavior', 'sel', 'family_engagement']),
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().max(2000).optional(),
    status: z.enum(['planned', 'in_progress', 'on_hold', 'completed', 'cancelled']).default('planned'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    assigned_to: z.string().uuid().optional(),
    assigned_by: z.string().uuid().optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    target_end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    goal: z.string().optional(),
    success_criteria: z.string().optional(),
    baseline_value: z.number().optional(),
    target_value: z.number().optional(),
    metadata: mtssInterventionMetadataSchema,
  })
  .superRefine((data, ctx) => {
    const tier = data.metadata.tier;

    // Tier 3 specific validations
    if (tier === 3) {
      // Fidelity tracking required for Tier 3
      if (!data.metadata.fidelityTracking) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Fidelity tracking is required for Tier 3 interventions',
          path: ['metadata', 'fidelityTracking'],
        });
      }

      // Team involvement required for Tier 3
      if (!data.metadata.teamInvolvement) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Team involvement is required for Tier 3 interventions',
          path: ['metadata', 'teamInvolvement'],
        });
      }

      // Setting required for Tier 3
      if (!data.metadata.setting) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Setting is required for Tier 3 interventions',
          path: ['metadata', 'setting'],
        });
      }

      // More frequent monitoring for Tier 3 (biweekly minimum)
      const monitoring = data.metadata.progressMonitoring;
      if (monitoring && monitoring.frequency === 'monthly') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tier 3 interventions require at least biweekly progress monitoring',
          path: ['metadata', 'progressMonitoring', 'frequency'],
        });
      }
    }

    // Tier 2 validations (lighter)
    if (tier === 2) {
      // Group size should be appropriate for Tier 2 (typically 3-6)
      const groupSize = data.metadata.groupSize;
      if (groupSize && groupSize > 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tier 2 small group interventions typically have 8 or fewer students',
          path: ['metadata', 'groupSize'],
        });
      }
    }

    // Date validation
    if (data.start_date && data.target_end_date) {
      if (data.target_end_date < data.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Target end date must be after start date',
          path: ['target_end_date'],
        });
      }
    }

    // Baseline/target validation
    if (data.baseline_value !== undefined && data.target_value !== undefined) {
      if (data.baseline_value === data.target_value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Target value must be different from baseline value',
          path: ['target_value'],
        });
      }
    }
  });

// ---------------------------------------------------------------------------
// Strategy Schema for API
// ---------------------------------------------------------------------------

export const createStrategySchema = z.object({
  name: z.string().min(1, 'Strategy name is required').max(200),
  source: strategySourceSchema.default('user'),
  districtId: z.string().uuid().optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const updateStrategySchema = createStrategySchema.partial();

export const strategyQuerySchema = z.object({
  source: strategySourceSchema.optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// ---------------------------------------------------------------------------
// Validation Helper Functions
// ---------------------------------------------------------------------------

/**
 * Validate MTSS intervention data with tier-based logic
 */
export function validateMTSSIntervention(
  data: unknown,
  tier: InterventionTier
): MTSSValidationResult {
  const errors: MTSSValidationError[] = [];

  try {
    createMTSSInterventionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      for (const issue of error.issues) {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          tier: issue.path.includes('fidelityTracking') || issue.path.includes('teamInvolvement') ? 3 : undefined,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get tier-specific required fields
 */
export function getTierRequiredFields(tier: InterventionTier): string[] {
  const baseRequired = [
    'student_id',
    'title',
    'type',
    'tier',
    'description',
    'strategy',
    'start_date',
    'goal',
    'baseline_value',
    'target_value',
    'progress_monitoring_tool',
    'progress_monitoring_frequency',
    'sessions_per_week',
    'minutes_per_session',
    'total_weeks',
  ];

  if (tier === 3) {
    return [
      ...baseRequired,
      'setting', // Required for Tier 3
      'fidelity_implemented_as_designed',
      'team_staff_list',
      'parent_contact_name',
      'parent_contact_relationship',
    ];
  }

  return baseRequired;
}

/**
 * Calculate derived dosage values
 */
export function calculateDosage(
  sessionsPerWeek: number,
  minutesPerSession: number,
  totalWeeks: number,
  overrides?: { totalSessions?: number; totalMinutes?: number }
) {
  const calculatedTotalSessions = sessionsPerWeek * totalWeeks;
  const calculatedTotalMinutes = calculatedTotalSessions * minutesPerSession;

  return {
    totalSessions: overrides?.totalSessions ?? calculatedTotalSessions,
    totalMinutes: overrides?.totalMinutes ?? calculatedTotalMinutes,
    calculatedTotalSessions,
    calculatedTotalMinutes,
    isOverridden: !!(overrides?.totalSessions || overrides?.totalMinutes),
  };
}

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type CreateMTSSInterventionInput = z.infer<typeof createMTSSInterventionSchema>;
export type MTSSInterventionMetadataInput = z.infer<typeof mtssInterventionMetadataSchema>;
// CreateStrategyInput is exported from types.ts - using inferred type only locally
type _CreateStrategyInput = z.infer<typeof createStrategySchema>;
export type StrategyQueryParams = z.infer<typeof strategyQuerySchema>;
