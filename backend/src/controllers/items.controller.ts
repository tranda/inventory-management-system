// Items Controller - HTTP handlers for item operations
// Constitution Art. 4.2: Standard response format
// Constitution Art. 5.2: Role-based access control

import { Request, Response, NextFunction, Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { itemCreateSchema, itemUpdateSchema } from '../validators/item.validators';
import * as itemsService from '../services/items.service';
import { processImage, upload, deleteUploadedFiles } from '../utils/upload';
import { NotFoundError, BadRequestError, ConflictError } from '../middleware/error.middleware';

const router = Router();

// =============================================================================
// GET /items - List items with pagination and filtering
// =============================================================================

router.get(
  '/',
  requireAuth,
  requirePermission('items:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        search: req.query.search as string | undefined,
        category: req.query.category as string | undefined,
        status: req.query.status as string | undefined,
        condition: req.query.condition as string | undefined,
        includeDeleted: req.query.includeDeleted === 'true',
      };

      const result = await itemsService.listItems(query);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// GET /items/:id - Get single item by ID
// =============================================================================

router.get(
  '/:id',
  requireAuth,
  requirePermission('items:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await itemsService.findItemById(req.params.id);

      if (!item) {
        throw new NotFoundError('Item not found');
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// POST /items - Create new item
// =============================================================================

router.post(
  '/',
  requireAuth,
  requirePermission('items:create'),
  validate(itemCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;

      // Check for duplicate asset ID
      const existing = await itemsService.findItemByAssetId(req.body.assetId);
      if (existing) {
        throw new ConflictError('Item with this asset ID already exists');
      }

      const item = await itemsService.createItem(req, req.body, authReq.user.id);

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// PATCH /items/:id - Update item
// =============================================================================

router.patch(
  '/:id',
  requireAuth,
  requirePermission('items:update'),
  validate(itemUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await itemsService.findItemById(req.params.id);
      if (!item) {
        throw new NotFoundError('Item not found');
      }

      const updated = await itemsService.updateItem(req, req.params.id, req.body);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// DELETE /items/:id - Soft delete item
// =============================================================================

router.delete(
  '/:id',
  requireAuth,
  requirePermission('items:delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await itemsService.findItemById(req.params.id);
      if (!item) {
        throw new NotFoundError('Item not found');
      }

      await itemsService.deleteItem(req, req.params.id);

      res.json({
        success: true,
        data: { message: 'Item deleted successfully' },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Cannot delete item with active assignment') {
        next(new BadRequestError(error.message));
      } else {
        next(error);
      }
    }
  }
);

// =============================================================================
// POST /items/bulk-delete - Bulk delete items (ADMIN only)
// =============================================================================

router.post(
  '/bulk-delete',
  requireAuth,
  requirePermission('items:bulk-delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new BadRequestError('ids must be a non-empty array');
      }

      const result = await itemsService.bulkDeleteItems(req, ids);

      res.json({
        success: true,
        data: {
          message: `Deleted ${result.deleted.length} items, skipped ${result.skipped.length}`,
          deleted: result.deleted,
          skipped: result.skipped,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// POST /items/:id/status - Change item status
// =============================================================================

router.post(
  '/:id/status',
  requireAuth,
  requirePermission('items:update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, reason } = req.body;

      if (!status) {
        throw new BadRequestError('status is required');
      }

      const validStatuses = ['AVAILABLE', 'ASSIGNED', 'RESERVED', 'IN_REPAIR', 'DECOMMISSIONED', 'LOST_STOLEN'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestError(`status must be one of: ${validStatuses.join(', ')}`);
      }

      const item = await itemsService.changeItemStatus(req, req.params.id, status, reason);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Item not found') {
        next(new NotFoundError(error.message));
      } else {
        next(error);
      }
    }
  }
);

// =============================================================================
// POST /items/:id/decommission - Decommission item
// =============================================================================

router.post(
  '/:id/decommission',
  requireAuth,
  requirePermission('items:update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;

      if (!reason) {
        throw new BadRequestError('reason is required for decommissioning');
      }

      const item = await itemsService.changeItemStatus(req, req.params.id, 'DECOMMISSIONED', reason);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Item not found') {
        next(new NotFoundError(error.message));
      } else {
        next(error);
      }
    }
  }
);

// =============================================================================
// POST /items/:id/photo - Upload item photo
// =============================================================================

router.post(
  '/:id/photo',
  requireAuth,
  requirePermission('items:update'),
  upload.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await itemsService.findItemById(req.params.id);
      if (!item) {
        // Clean up uploaded file if item not found
        if (req.file) {
          await deleteUploadedFiles([req.file.path]);
        }
        throw new NotFoundError('Item not found');
      }

      if (!req.file) {
        throw new BadRequestError('No photo file provided');
      }

      // Process image (resize and create thumbnail)
      const { photoUrl, thumbnailUrl } = await processImage(req.file);

      // Update item with photo URLs
      const updated = await itemsService.updateItemPhoto(req, req.params.id, photoUrl, thumbnailUrl);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        await deleteUploadedFiles([req.file.path]);
      }
      next(error);
    }
  }
);

// =============================================================================
// GET /items/:id/history - Get item history
// =============================================================================

router.get(
  '/:id/history',
  requireAuth,
  requirePermission('items:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await itemsService.findItemById(req.params.id);
      if (!item) {
        throw new NotFoundError('Item not found');
      }

      const history = await itemsService.getItemHistory(req.params.id);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// POST /items/generate-asset-id - Generate asset ID for category
// =============================================================================

router.post(
  '/generate-asset-id',
  requireAuth,
  requirePermission('items:create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.body;

      if (!category) {
        throw new BadRequestError('category is required');
      }

      const assetId = await itemsService.generateAssetId(category);

      res.json({
        success: true,
        data: { assetId },
      });
    } catch (error) {
      next(error);
    }
  }
);

export const itemsController = router;
