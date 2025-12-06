// Auth Validators - Constitution Art. 4.3: Input validation with Zod
// Validation schemas for authentication endpoints

import { z } from 'zod';
import { emailSchema, passwordSchema } from '../middleware/validation.middleware.js';

// =============================================================================
// Login Schema
// =============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// =============================================================================
// Register Schema (Admin only)
// =============================================================================

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER']).default('VIEWER'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// =============================================================================
// Change Password Schema
// =============================================================================

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// =============================================================================
// Refresh Token Schema
// =============================================================================

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
