// User Validators - Constitution Art. 4.3: Input validation with Zod
// Validation schemas for user management endpoints

import { z } from 'zod';
import { USER_ROLES } from '@shared/constants/index.js';
import { emailSchema, passwordSchema, listQuerySchema } from '../middleware/validation.middleware.js';

// =============================================================================
// Create User Schema
// =============================================================================

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.enum(USER_ROLES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: `Role must be one of: ${USER_ROLES.join(', ')}` }),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// =============================================================================
// Update User Schema
// =============================================================================

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z
    .enum(USER_ROLES as unknown as [string, ...string[]])
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// =============================================================================
// Reset Password Schema (Admin)
// =============================================================================

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// =============================================================================
// User List Query Schema
// =============================================================================

export const userListQuerySchema = listQuerySchema.extend({
  role: z.enum(USER_ROLES as unknown as [string, ...string[]]).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;
