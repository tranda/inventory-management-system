// Item Validators - Constitution Art. 4.3: Input validation with Zod
// Validation schemas for item-related endpoints

import { z } from 'zod';
import { ITEM_CATEGORIES, ITEM_STATUSES, ITEM_CONDITIONS } from '@shared/constants/index.js';
import {
  assetIdSchema,
  serialNumberSchema,
  optionalPositiveDecimalSchema,
  optionalDateStringSchema,
  listQuerySchema,
} from '../middleware/validation.middleware.js';

// =============================================================================
// Create Item Schema
// =============================================================================

export const createItemSchema = z.object({
  assetId: assetIdSchema,
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  category: z.enum(ITEM_CATEGORIES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: `Category must be one of: ${ITEM_CATEGORIES.join(', ')}` }),
  }),
  condition: z
    .enum(ITEM_CONDITIONS as unknown as [string, ...string[]], {
      errorMap: () => ({ message: `Condition must be one of: ${ITEM_CONDITIONS.join(', ')}` }),
    })
    .default('NEW'),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: serialNumberSchema,
  purchaseDate: optionalDateStringSchema,
  purchasePrice: optionalPositiveDecimalSchema,
  warrantyExpiration: optionalDateStringSchema,
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  isConsumable: z.boolean().default(false),
  minStockLevel: z.number().int().min(0).optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

// =============================================================================
// Update Item Schema
// =============================================================================

export const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z
    .enum(ITEM_CATEGORIES as unknown as [string, ...string[]])
    .optional(),
  condition: z
    .enum(ITEM_CONDITIONS as unknown as [string, ...string[]])
    .optional(),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  purchaseDate: optionalDateStringSchema.nullable(),
  purchasePrice: optionalPositiveDecimalSchema.nullable(),
  warrantyExpiration: optionalDateStringSchema.nullable(),
  location: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isConsumable: z.boolean().optional(),
  minStockLevel: z.number().int().min(0).optional().nullable(),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// =============================================================================
// Item Status Change Schema
// =============================================================================

export const statusChangeSchema = z.object({
  status: z.enum(ITEM_STATUSES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: `Status must be one of: ${ITEM_STATUSES.join(', ')}` }),
  }),
  reason: z.string().max(500).optional(),
});

export type StatusChangeInput = z.infer<typeof statusChangeSchema>;

// =============================================================================
// Decommission Schema
// =============================================================================

export const decommissionSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export type DecommissionInput = z.infer<typeof decommissionSchema>;

// =============================================================================
// Bulk Delete Schema
// =============================================================================

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required').max(100, 'Maximum 100 items at once'),
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;

// =============================================================================
// Item List Query Schema
// =============================================================================

export const itemListQuerySchema = listQuerySchema.extend({
  category: z.enum(ITEM_CATEGORIES as unknown as [string, ...string[]]).optional(),
  status: z.enum(ITEM_STATUSES as unknown as [string, ...string[]]).optional(),
  condition: z.enum(ITEM_CONDITIONS as unknown as [string, ...string[]]).optional(),
  includeDeleted: z.coerce.boolean().default(false),
});

export type ItemListQuery = z.infer<typeof itemListQuerySchema>;
