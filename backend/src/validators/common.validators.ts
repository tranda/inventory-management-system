// Common Validators - Reusable Zod schemas
// Constitution Art. 4.2: Input validation at API boundaries

import { z } from 'zod';

// =============================================================================
// UUID Validation
// =============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

// =============================================================================
// Pagination
// =============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// =============================================================================
// Sorting
// =============================================================================

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

export const baseSortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: sortOrderSchema.optional(),
});

// =============================================================================
// Date Range
// =============================================================================

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: 'Start date must be before or equal to end date' }
);

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

// =============================================================================
// Search
// =============================================================================

export const searchSchema = z.object({
  search: z.string().max(255).optional(),
});

// =============================================================================
// ID Params (for route parameters)
// =============================================================================

export const idParamsSchema = z.object({
  id: uuidSchema,
});

// =============================================================================
// Boolean Query Param
// =============================================================================

export const booleanQuerySchema = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .transform((val) => val === true || val === 'true');

// =============================================================================
// Common List Query Schema
// =============================================================================

export const listQuerySchema = paginationSchema.merge(baseSortSchema).merge(searchSchema);

export type ListQueryInput = z.infer<typeof listQuerySchema>;

// =============================================================================
// Email Validation
// =============================================================================

export const emailSchema = z.string().email('Invalid email format').max(255);

// =============================================================================
// Password Validation
// =============================================================================

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// =============================================================================
// Phone Number Validation
// =============================================================================

export const phoneSchema = z
  .string()
  .max(20)
  .regex(/^[\d\s\-+()]*$/, 'Invalid phone number format')
  .optional()
  .nullable();

// =============================================================================
// Money/Currency Validation
// =============================================================================

export const moneySchema = z.coerce
  .number()
  .min(0, 'Amount cannot be negative')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places');

// =============================================================================
// Date Validation
// =============================================================================

export const futureDateSchema = z.coerce.date().refine(
  (date) => date > new Date(),
  { message: 'Date must be in the future' }
);

export const pastDateSchema = z.coerce.date().refine(
  (date) => date < new Date(),
  { message: 'Date must be in the past' }
);

export const dateSchema = z.coerce.date();

// =============================================================================
// URL Validation
// =============================================================================

export const urlSchema = z.string().url('Invalid URL format').optional().nullable();

// =============================================================================
// Notes/Comments Validation
// =============================================================================

export const notesSchema = z.string().max(2000).optional().nullable();

// =============================================================================
// Reason Validation (for status changes, etc.)
// =============================================================================

export const reasonSchema = z.string().min(1, 'Reason is required').max(500);

export const optionalReasonSchema = z.string().max(500).optional().nullable();
