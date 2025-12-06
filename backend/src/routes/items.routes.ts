// Items Routes - Constitution Art. 4.2: RESTful API with consistent response format
// CRUD operations for inventory items

import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../app.js';
import { validate, idParamsSchema } from '../middleware/validation.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { NotFoundError, BadRequestError, ConflictError } from '../middleware/error.middleware.js';
import {
  createItemSchema,
  updateItemSchema,
  statusChangeSchema,
  decommissionSchema,
  bulkDeleteSchema,
  itemListQuerySchema,
} from '../validators/item.validators.js';
import {
  auditCreate,
  auditUpdate,
  auditDelete,
  auditStatusChange,
  auditDecommission,
} from '../services/audit.service.js';
import { upload, processImage, deleteImage } from '../utils/upload.js';
import type { ApiResponse, PaginatedResponse } from '@shared/types/api.types.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// =============================================================================
// GET /items - List items with filtering and pagination
// =============================================================================

router.get(
  '/',
  requirePermission('items:read'),
  validate({ query: itemListQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page,
        limit,
        sortBy = 'createdAt',
        sortOrder,
        search,
        category,
        status,
        condition,
        includeDeleted,
      } = req.query as Record<string, unknown>;

      const skip = ((page as number) - 1) * (limit as number);

      // Build where clause
      const where: Record<string, unknown> = {};

      if (!includeDeleted) {
        where.deletedAt = null;
      }

      if (category) where.category = category;
      if (status) where.status = status;
      if (condition) where.condition = condition;

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { assetId: { contains: search as string, mode: 'insensitive' } },
          { serialNumber: { contains: search as string, mode: 'insensitive' } },
          { brand: { contains: search as string, mode: 'insensitive' } },
          { model: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Execute query
      const [items, total] = await Promise.all([
        prisma.item.findMany({
          where,
          orderBy: { [sortBy as string]: sortOrder },
          skip,
          take: limit as number,
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            assignments: {
              where: { returnedAt: null },
              include: {
                employee: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
              },
              take: 1,
            },
          },
        }),
        prisma.item.count({ where }),
      ]);

      const response: PaginatedResponse<typeof items> = {
        success: true,
        data: items,
        meta: {
          pagination: {
            page: page as number,
            limit: limit as number,
            total,
            totalPages: Math.ceil(total / (limit as number)),
          },
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /items/:id - Get single item
// =============================================================================

router.get(
  '/:id',
  requirePermission('items:read'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const item = await prisma.item.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignments: {
            orderBy: { assignedAt: 'desc' },
            include: {
              employee: {
                select: { id: true, firstName: true, lastName: true, email: true, department: true },
              },
              assignedBy: {
                select: { id: true, firstName: true, lastName: true },
              },
              returnedBy: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });

      if (!item) {
        throw new NotFoundError('Item');
      }

      const response: ApiResponse<typeof item> = {
        success: true,
        data: item,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /items - Create new item
// =============================================================================

router.post(
  '/',
  requirePermission('items:create'),
  validate({ body: createItemSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body;

      // Check for duplicate assetId or serialNumber
      const existing = await prisma.item.findFirst({
        where: {
          OR: [
            { assetId: data.assetId },
            { serialNumber: data.serialNumber },
          ],
        },
      });

      if (existing) {
        if (existing.assetId === data.assetId) {
          throw new ConflictError('Asset ID already exists');
        }
        throw new ConflictError('Serial number already exists');
      }

      const item = await prisma.item.create({
        data: {
          ...data,
          createdById: req.user!.id,
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Audit create
      await auditCreate(req, 'Item', item.id, item as unknown as Record<string, unknown>);

      const response: ApiResponse<typeof item> = {
        success: true,
        data: item,
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /items/:id - Update item
// =============================================================================

router.patch(
  '/:id',
  requirePermission('items:update'),
  validate({ params: idParamsSchema, body: updateItemSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Get current item
      const currentItem = await prisma.item.findUnique({
        where: { id },
      });

      if (!currentItem) {
        throw new NotFoundError('Item');
      }

      if (currentItem.deletedAt) {
        throw new BadRequestError('Cannot update a deleted item');
      }

      // Update item
      const item = await prisma.item.update({
        where: { id },
        data,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Audit update
      await auditUpdate(
        req,
        'Item',
        item.id,
        currentItem as unknown as Record<string, unknown>,
        item as unknown as Record<string, unknown>
      );

      const response: ApiResponse<typeof item> = {
        success: true,
        data: item,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /items/:id - Soft delete item
// =============================================================================

router.delete(
  '/:id',
  requirePermission('items:delete'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Get current item
      const currentItem = await prisma.item.findUnique({
        where: { id },
        include: {
          assignments: {
            where: { returnedAt: null },
          },
        },
      });

      if (!currentItem) {
        throw new NotFoundError('Item');
      }

      if (currentItem.assignments.length > 0) {
        throw new BadRequestError('Cannot delete an item that is currently assigned');
      }

      // Soft delete
      const item = await prisma.item.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Audit delete
      await auditDelete(req, 'Item', item.id, currentItem as unknown as Record<string, unknown>);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Item deleted successfully' },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /items/bulk-delete - Bulk soft delete items
// =============================================================================

router.post(
  '/bulk-delete',
  requirePermission('items:bulk-delete'),
  validate({ body: bulkDeleteSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = req.body;

      // Get items with active assignments
      const items = await prisma.item.findMany({
        where: { id: { in: ids } },
        include: {
          assignments: {
            where: { returnedAt: null },
          },
        },
      });

      const assignedItems = items.filter((item) => item.assignments.length > 0);
      if (assignedItems.length > 0) {
        throw new BadRequestError(
          `Cannot delete items that are currently assigned: ${assignedItems.map((i) => i.assetId).join(', ')}`
        );
      }

      const notFound = ids.filter((id: string) => !items.find((item) => item.id === id));
      if (notFound.length > 0) {
        throw new NotFoundError(`Items not found: ${notFound.join(', ')}`);
      }

      // Bulk soft delete
      await prisma.item.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });

      // Audit each delete
      for (const item of items) {
        await auditDelete(req, 'Item', item.id, item as unknown as Record<string, unknown>);
      }

      const response: ApiResponse<{ message: string; count: number }> = {
        success: true,
        data: {
          message: 'Items deleted successfully',
          count: items.length,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /items/:id/status - Change item status
// =============================================================================

router.post(
  '/:id/status',
  requirePermission('items:update'),
  validate({ params: idParamsSchema, body: statusChangeSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      const currentItem = await prisma.item.findUnique({
        where: { id },
      });

      if (!currentItem) {
        throw new NotFoundError('Item');
      }

      if (currentItem.deletedAt) {
        throw new BadRequestError('Cannot change status of a deleted item');
      }

      // Validate status transition
      if (currentItem.status === 'ASSIGNED' && status !== 'LOST_STOLEN' && status !== 'DECOMMISSIONED') {
        throw new BadRequestError('Assigned items can only be marked as lost/stolen or decommissioned');
      }

      const item = await prisma.item.update({
        where: { id },
        data: { status },
      });

      // Audit status change
      await auditStatusChange(req, 'Item', item.id, currentItem.status, status, reason);

      const response: ApiResponse<typeof item> = {
        success: true,
        data: item,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /items/:id/decommission - Decommission item
// =============================================================================

router.post(
  '/:id/decommission',
  requirePermission('items:decommission'),
  validate({ params: idParamsSchema, body: decommissionSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const currentItem = await prisma.item.findUnique({
        where: { id },
        include: {
          assignments: {
            where: { returnedAt: null },
          },
        },
      });

      if (!currentItem) {
        throw new NotFoundError('Item');
      }

      if (currentItem.assignments.length > 0) {
        throw new BadRequestError('Cannot decommission an item that is currently assigned');
      }

      const item = await prisma.item.update({
        where: { id },
        data: {
          status: 'DECOMMISSIONED',
          condition: 'DECOMMISSIONED',
          decommissionReason: reason,
          deletedAt: new Date(),
        },
      });

      // Audit decommission
      await auditDecommission(req, item.id, currentItem as unknown as Record<string, unknown>, reason);

      const response: ApiResponse<typeof item> = {
        success: true,
        data: item,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /items/:id/photo - Upload item photo
// =============================================================================

router.post(
  '/:id/photo',
  requirePermission('items:update'),
  validate({ params: idParamsSchema }),
  upload.single('photo'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const currentItem = await prisma.item.findUnique({
        where: { id },
      });

      if (!currentItem) {
        throw new NotFoundError('Item');
      }

      if (!req.file) {
        throw new BadRequestError('No photo file provided');
      }

      // Process image and generate thumbnail
      const { photoUrl, thumbnailUrl } = await processImage(req.file);

      // Delete old photos if they exist
      if (currentItem.photoUrl && currentItem.thumbnailUrl) {
        await deleteImage(currentItem.photoUrl, currentItem.thumbnailUrl);
      }

      // Update item with new photo URLs
      const item = await prisma.item.update({
        where: { id },
        data: {
          photoUrl,
          thumbnailUrl,
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Audit update
      await auditUpdate(
        req,
        'Item',
        item.id,
        { photoUrl: currentItem.photoUrl, thumbnailUrl: currentItem.thumbnailUrl },
        { photoUrl, thumbnailUrl }
      );

      const response: ApiResponse<typeof item> = {
        success: true,
        data: item,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /items/:id/photo - Remove item photo
// =============================================================================

router.delete(
  '/:id/photo',
  requirePermission('items:update'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const currentItem = await prisma.item.findUnique({
        where: { id },
      });

      if (!currentItem) {
        throw new NotFoundError('Item');
      }

      if (!currentItem.photoUrl) {
        throw new BadRequestError('Item has no photo to delete');
      }

      // Delete photos from storage
      if (currentItem.photoUrl && currentItem.thumbnailUrl) {
        await deleteImage(currentItem.photoUrl, currentItem.thumbnailUrl);
      }

      // Update item to remove photo URLs
      const item = await prisma.item.update({
        where: { id },
        data: {
          photoUrl: null,
          thumbnailUrl: null,
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Audit update
      await auditUpdate(
        req,
        'Item',
        item.id,
        { photoUrl: currentItem.photoUrl, thumbnailUrl: currentItem.thumbnailUrl },
        { photoUrl: null, thumbnailUrl: null }
      );

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Photo deleted successfully' },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export { router as itemsRoutes };
