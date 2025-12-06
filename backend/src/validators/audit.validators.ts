// Audit Validators - Constitution Art. 4.3: Input validation with Zod
// Validation schemas for audit log endpoints

import { z } from 'zod';
import { listQuerySchema, optionalDateStringSchema } from '../middleware/validation.middleware.js';

// =============================================================================
// Audit Log Query Schema
// =============================================================================

const entityTypes = ['Item', 'Assignment', 'Employee', 'User'] as const;
const auditActions = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'ASSIGN',
  'RETURN',
  'TRANSFER',
  'STATUS_CHANGE',
  'DECOMMISSION',
  'LOGIN',
  'LOGOUT',
  'PASSWORD_CHANGE',
] as const;

export const auditLogQuerySchema = listQuerySchema.extend({
  entityType: z.enum(entityTypes).optional(),
  entityId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.enum(auditActions).optional(),
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

// =============================================================================
// Entity History Params Schema
// =============================================================================

export const entityHistoryParamsSchema = z.object({
  entityType: z.enum(entityTypes),
  entityId: z.string().uuid(),
});

export type EntityHistoryParams = z.infer<typeof entityHistoryParamsSchema>;
