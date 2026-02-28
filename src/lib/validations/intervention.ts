import { z } from 'zod';

export const interventionTypeSchema = z.enum([
  'academic_support',
  'behavioral',
  'attendance',
  'social_emotional',
  'family_engagement',
  'health_services',
  'counseling',
  'mentoring',
  'tutoring',
  'enrichment',
  'other',
]);

export const interventionStatusSchema = z.enum([
  'planned',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
]);

export const interventionPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const createInterventionSchema = z.object({
  school_id: z.string().uuid('Invalid school ID'),
  student_id: z.string().uuid('Invalid student ID'),
  type: interventionTypeSchema,
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  status: interventionStatusSchema.default('planned'),
  priority: interventionPrioritySchema.default('medium'),
  assigned_to: z.string().uuid().optional(),
  assigned_by: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  target_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  goals: z.array(z.string()).default([]),
  success_metrics: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).default([]),
});

export const updateInterventionSchema = createInterventionSchema.partial().omit({
  school_id: true,
  student_id: true
});

export const addProgressNoteSchema = z.object({
  note: z.string().min(1, 'Note is required').max(5000),
  author_id: z.string().uuid().optional(),
});

export const completeInterventionSchema = z.object({
  outcome: z.enum(['successful', 'partially_successful', 'unsuccessful', 'ongoing']),
  outcome_notes: z.string().max(2000).optional(),
});

export const interventionQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  status: interventionStatusSchema.optional(),
  type: interventionTypeSchema.optional(),
  assignedTo: z.string().uuid().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateInterventionInput = z.infer<typeof createInterventionSchema>;
export type UpdateInterventionInput = z.infer<typeof updateInterventionSchema>;
export type InterventionQueryParams = z.infer<typeof interventionQuerySchema>;
