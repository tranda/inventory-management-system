// Validation Middleware - Constitution Art. 4.3: Input validation with Zod
// All request data must be validated before processing

import type { Request, Response, NextFunction } from 'express';
import { z, ZodError, type ZodSchema } from 'zod';
import { ValidationErrorClass } from './error.middleware.js';
import type { ValidationError } from '@shared/types/api.types.js';

// =============================================================================
// Validation Middleware Factory
// =============================================================================

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Creates a validation middleware that validates request body, query, and params
 * against provided Zod schemas.
 *
 * @example
 * router.post('/items', validate({ body: createItemSchema }), createItem);
 */
export function validate(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const errors: ValidationError[] = [];

    try {
      // Validate body
      if (schemas.body) {
        try {
          req.body = await schemas.body.parseAsync(req.body);
        } catch (err) {
          if (err instanceof ZodError) {
            errors.push(...formatZodErrors(err, 'body'));
          } else {
            throw err;
          }
        }
      }

      // Validate query
      if (schemas.query) {
        try {
          const validatedQuery = await schemas.query.parseAsync(req.query);
          // Replace req.query with validated data using Object.defineProperty
          Object.defineProperty(req, 'query', {
            value: validatedQuery,
            writable: false,
            enumerable: true,
            configurable: true,
          });
        } catch (err) {
          if (err instanceof ZodError) {
            errors.push(...formatZodErrors(err, 'query'));
          } else {
            throw err;
          }
        }
      }

      // Validate params
      if (schemas.params) {
        try {
          req.params = await schemas.params.parseAsync(req.params);
        } catch (err) {
          if (err instanceof ZodError) {
            errors.push(...formatZodErrors(err, 'params'));
          } else {
            throw err;
          }
        }
      }

      if (errors.length > 0) {
        throw new ValidationErrorClass(errors);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// =============================================================================
// Zod Error Formatting
// =============================================================================

function formatZodErrors(error: ZodError, location: string): ValidationError[] {
  return error.issues.map((issue) => ({
    field: `${location}.${issue.path.join('.')}`,
    message: issue.message,
    code: issue.code,
  }));
}

// =============================================================================
// Common Validation Schemas
// =============================================================================

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination query schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Search query schema
export const searchSchema = z.object({
  search: z.string().optional(),
});

// Combined list query schema
export const listQuerySchema = paginationSchema.merge(searchSchema);

// ID params schema
export const idParamsSchema = z.object({
  id: uuidSchema,
});

// =============================================================================
// Custom Zod Refinements
// =============================================================================

// Asset ID pattern (e.g., IT-2024-001)
export const assetIdSchema = z
  .string()
  .min(1, 'Asset ID is required')
  .max(50, 'Asset ID must be 50 characters or less')
  .regex(/^[A-Z0-9-]+$/, 'Asset ID must contain only uppercase letters, numbers, and hyphens');

// Serial number
export const serialNumberSchema = z
  .string()
  .min(1, 'Serial number is required')
  .max(100, 'Serial number must be 100 characters or less');

// Email validation
export const emailSchema = z.string().email('Invalid email format').toLowerCase();

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Optional positive decimal
export const optionalPositiveDecimalSchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num;
  })
  .refine((val) => val === undefined || val >= 0, {
    message: 'Value must be a positive number',
  });

// Date string to Date object
export const dateStringSchema = z
  .string()
  .datetime({ message: 'Invalid date format' })
  .transform((val) => new Date(val));

// Optional date string
export const optionalDateStringSchema = z
  .string()
  .datetime({ message: 'Invalid date format' })
  .optional()
  .transform((val) => (val ? new Date(val) : undefined));
