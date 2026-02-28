import { z } from 'zod';

export const createSchoolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  legal_name: z.string().max(255).optional(),
  domain: z.string().max(255).optional(),
  address_line1: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  zip_code: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  timezone: z.string().default('America/New_York'),
  academic_year_start: z.number().min(1).max(12).default(8),
  subscription_tier: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
});

export const updateSchoolSchema = createSchoolSchema.partial();

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
