// Items Service - Business logic for item operations
// Constitution Art. 5.4: Audit logging for all state changes

import { prisma } from '../lib/prisma';
import { Prisma, Item, ItemStatus, ItemCondition } from '@prisma/client';
import { auditCreate, auditUpdate } from './audit.service';
import type { Request } from 'express';

// =============================================================================
// Types
// =============================================================================

export interface ItemCreateInput {
  assetId: string;
  name: string;
  category: string;
  condition?: string;
  brand?: string;
  model?: string;
  serialNumber: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiration?: string;
  location?: string;
  notes?: string;
  isConsumable?: boolean;
  minStockLevel?: number;
}

export interface ItemUpdateInput {
  name?: string;
  category?: string;
  condition?: string;
  brand?: string | null;
  model?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  warrantyExpiration?: string | null;
  location?: string | null;
  notes?: string | null;
  isConsumable?: boolean;
  minStockLevel?: number | null;
}

export interface ItemListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  category?: string;
  status?: string;
  condition?: string;
  includeDeleted?: boolean;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Generate a unique asset ID with format: CAT-YYYY-NNN
 */
export async function generateAssetId(category: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = category.substring(0, 3).toUpperCase();

  // Find the highest number for this prefix-year combination
  const latestItem = await prisma.item.findFirst({
    where: {
      assetId: {
        startsWith: `${prefix}-${year}-`,
      },
    },
    orderBy: {
      assetId: 'desc',
    },
  });

  let nextNumber = 1;
  if (latestItem) {
    const match = latestItem.assetId.match(/-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${year}-${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Create a new item
 */
export async function createItem(
  req: Request,
  data: ItemCreateInput,
  userId: string
): Promise<Item> {
  const item = await prisma.item.create({
    data: {
      assetId: data.assetId,
      name: data.name,
      category: data.category as any,
      condition: (data.condition || 'NEW') as ItemCondition,
      status: 'AVAILABLE' as ItemStatus,
      brand: data.brand || null,
      model: data.model || null,
      serialNumber: data.serialNumber,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchasePrice: data.purchasePrice ?? null,
      warrantyExpiration: data.warrantyExpiration ? new Date(data.warrantyExpiration) : null,
      location: data.location || null,
      notes: data.notes || null,
      isConsumable: data.isConsumable ?? false,
      minStockLevel: data.minStockLevel ?? null,
      createdById: userId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Audit log
  await auditCreate(req, 'ITEM', item.id, item as unknown as Record<string, unknown>);

  return item;
}

/**
 * Find item by ID
 */
export async function findItemById(id: string, includeDeleted = false): Promise<Item | null> {
  return prisma.item.findFirst({
    where: {
      id,
      ...(includeDeleted ? {} : { deletedAt: null }),
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      assignments: {
        where: {
          returnedAt: null,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Find item by asset ID
 */
export async function findItemByAssetId(assetId: string): Promise<Item | null> {
  return prisma.item.findUnique({
    where: { assetId },
  });
}

/**
 * List items with pagination and filtering
 */
export async function listItems(query: ItemListQuery = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    category,
    status,
    condition,
    includeDeleted = false,
  } = query;

  const where: Prisma.ItemWhereInput = {
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(category && { category: category as any }),
    ...(status && { status: status as any }),
    ...(condition && { condition: condition as any }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { assetId: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          where: {
            returnedAt: null,
          },
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.item.count({ where }),
  ]);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update an item
 */
export async function updateItem(
  req: Request,
  id: string,
  data: ItemUpdateInput
): Promise<Item> {
  const existing = await findItemById(id);
  if (!existing) {
    throw new Error('Item not found');
  }

  const updateData: Prisma.ItemUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category as any;
  if (data.condition !== undefined) updateData.condition = data.condition as ItemCondition;
  if (data.brand !== undefined) updateData.brand = data.brand;
  if (data.model !== undefined) updateData.model = data.model;
  if (data.purchaseDate !== undefined) {
    updateData.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
  }
  if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice;
  if (data.warrantyExpiration !== undefined) {
    updateData.warrantyExpiration = data.warrantyExpiration ? new Date(data.warrantyExpiration) : null;
  }
  if (data.location !== undefined) updateData.location = data.location;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.isConsumable !== undefined) updateData.isConsumable = data.isConsumable;
  if (data.minStockLevel !== undefined) updateData.minStockLevel = data.minStockLevel;

  const item = await prisma.item.update({
    where: { id },
    data: updateData,
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Audit log
  await auditUpdate(
    req,
    'ITEM',
    item.id,
    existing as unknown as Record<string, unknown>,
    item as unknown as Record<string, unknown>
  );

  return item;
}

/**
 * Soft delete an item
 */
export async function deleteItem(req: Request, id: string): Promise<Item> {
  const existing = await findItemById(id);
  if (!existing) {
    throw new Error('Item not found');
  }

  // Check if item has active assignments
  const activeAssignment = await prisma.assignment.findFirst({
    where: {
      itemId: id,
      returnedAt: null,
    },
  });

  if (activeAssignment) {
    throw new Error('Cannot delete item with active assignment');
  }

  const item = await prisma.item.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  // Audit log
  await auditUpdate(
    req,
    'ITEM',
    item.id,
    { deletedAt: null },
    { deletedAt: item.deletedAt }
  );

  return item;
}

/**
 * Bulk delete items (soft delete)
 */
export async function bulkDeleteItems(
  req: Request,
  ids: string[]
): Promise<{ deleted: string[]; skipped: string[] }> {
  const deleted: string[] = [];
  const skipped: string[] = [];

  for (const id of ids) {
    try {
      const item = await findItemById(id);
      if (!item) {
        skipped.push(id);
        continue;
      }

      // Check for active assignments
      const activeAssignment = await prisma.assignment.findFirst({
        where: {
          itemId: id,
          returnedAt: null,
        },
      });

      if (activeAssignment) {
        skipped.push(id);
        continue;
      }

      await prisma.item.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await auditUpdate(req, 'ITEM', id, { deletedAt: null }, { deletedAt: new Date() });
      deleted.push(id);
    } catch {
      skipped.push(id);
    }
  }

  return { deleted, skipped };
}

/**
 * Change item status
 */
export async function changeItemStatus(
  req: Request,
  id: string,
  status: ItemStatus,
  reason?: string
): Promise<Item> {
  const existing = await findItemById(id);
  if (!existing) {
    throw new Error('Item not found');
  }

  const updateData: Prisma.ItemUpdateInput = { status };

  // If decommissioning, set condition and reason
  if (status === 'DECOMMISSIONED') {
    updateData.condition = 'DECOMMISSIONED';
    if (reason) {
      updateData.decommissionReason = reason;
    }
  }

  const item = await prisma.item.update({
    where: { id },
    data: updateData,
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Audit log
  await auditUpdate(
    req,
    'ITEM',
    item.id,
    { status: existing.status, condition: existing.condition },
    { status: item.status, condition: item.condition, reason }
  );

  return item;
}

/**
 * Update item photo URLs
 */
export async function updateItemPhoto(
  req: Request,
  id: string,
  photoUrl: string,
  thumbnailUrl: string
): Promise<Item> {
  const existing = await findItemById(id);
  if (!existing) {
    throw new Error('Item not found');
  }

  const item = await prisma.item.update({
    where: { id },
    data: {
      photoUrl,
      thumbnailUrl,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Audit log
  await auditUpdate(
    req,
    'ITEM',
    item.id,
    { photoUrl: existing.photoUrl, thumbnailUrl: existing.thumbnailUrl },
    { photoUrl, thumbnailUrl }
  );

  return item;
}

/**
 * Get item history from audit logs
 */
export async function getItemHistory(id: string) {
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: 'ITEM',
      entityId: id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return auditLogs;
}
