import { z } from 'zod';

export const createStudentSchema = z.object({
  school_id: z.string().uuid('Invalid school ID'),
  sis_student_id: z.string().min(1, 'SIS ID is required').max(50),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  middle_name: z.string().max(100).optional(),
  preferred_name: z.string().max(100).optional(),
  email: z.string().email().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  grade_level: z.number().min(0).max(12),
  enrollment_status: z.enum(['active', 'inactive', 'withdrawn', 'graduated']).default('active'),
  enrollment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  homeroom_teacher: z.string().max(100).optional(),
  cohort: z.string().max(20).optional(),
  is_iep: z.boolean().default(false),
  is_504: z.boolean().default(false),
  is_el: z.boolean().default(false),
  el_level: z.string().max(20).optional(),
  primary_language: z.string().max(50).optional(),
  race_ethnicity: z.string().max(100).optional(),
  gender: z.string().max(50).optional(),
});

export const updateStudentSchema = createStudentSchema.partial().omit({ school_id: true });

export const studentQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  gradeLevel: z.coerce.number().min(0).max(12).optional(),
  riskLevel: z.enum(['on_track', 'at_risk', 'critical']).optional(),
  teacherName: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQueryParams = z.infer<typeof studentQuerySchema>;
