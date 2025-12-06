// Assignment Validators - Constitution Art. 4.3: Input validation with Zod
// Validation schemas for assignment-related endpoints

import { z } from 'zod';
import { ITEM_CONDITIONS } from '@shared/constants/index.js';
import {
  uuidSchema,
  optionalDateStringSchema,
  listQuerySchema,
} from '../middleware/validation.middleware.js';

// =============================================================================
// Create Assignment Schema
// =============================================================================

export const createAssignmentSchema = z.object({
  itemId: uuidSchema,
  employeeId: uuidSchema,
  assignedAt: optionalDateStringSchema.default(() => new Date().toISOString()),
  expectedReturnAt: optionalDateStringSchema,
  purpose: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

// =============================================================================
// Return Assignment Schema
// =============================================================================

export const returnAssignmentSchema = z.object({
  conditionAtReturn: z.enum(ITEM_CONDITIONS as unknown as [string, ...string[]], {
    errorMap: () => ({ message: `Condition must be one of: ${ITEM_CONDITIONS.join(', ')}` }),
  }),
  returnNotes: z.string().max(2000).optional(),
});

export type ReturnAssignmentInput = z.infer<typeof returnAssignmentSchema>;

// =============================================================================
// Transfer Assignment Schema
// =============================================================================

export const transferAssignmentSchema = z.object({
  toEmployeeId: uuidSchema,
  reason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export type TransferAssignmentInput = z.infer<typeof transferAssignmentSchema>;

// =============================================================================
// Acknowledge Assignment Schema
// =============================================================================

export const acknowledgeAssignmentSchema = z.object({
  acknowledged: z.literal(true),
});

export type AcknowledgeAssignmentInput = z.infer<typeof acknowledgeAssignmentSchema>;

// =============================================================================
// Assignment List Query Schema
// =============================================================================

export const assignmentListQuerySchema = listQuerySchema.extend({
  itemId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  active: z.coerce.boolean().optional(),
  acknowledged: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
});

export type AssignmentListQuery = z.infer<typeof assignmentListQuerySchema>;
