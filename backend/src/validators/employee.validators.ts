// Employee Validators - Constitution Art. 4.3: Input validation with Zod
// Validation schemas for employee-related endpoints

import { z } from 'zod';
import { emailSchema, listQuerySchema } from '../middleware/validation.middleware.js';

// =============================================================================
// Create Employee Schema
// =============================================================================

export const createEmployeeSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  department: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// =============================================================================
// Update Employee Schema
// =============================================================================

export const updateEmployeeSchema = z.object({
  email: emailSchema.optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  department: z.string().max(100).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

// =============================================================================
// Deactivate Employee Schema
// =============================================================================

export const deactivateEmployeeSchema = z.object({
  returnItems: z.boolean().default(true),
  reason: z.string().max(500).optional(),
});

export type DeactivateEmployeeInput = z.infer<typeof deactivateEmployeeSchema>;

// =============================================================================
// Employee List Query Schema
// =============================================================================

export const employeeListQuerySchema = listQuerySchema.extend({
  department: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
