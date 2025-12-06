// Users Routes - Constitution Art. 4.2: RESTful API
// User management (Admin only)

import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../app.js';
import { validate, idParamsSchema } from '../middleware/validation.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission, requireRole } from '../middleware/rbac.middleware.js';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../middleware/error.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  userListQuerySchema,
} from '../validators/user.validators.js';
import { auditCreate, auditUpdate, createAuditLog, extractAuditMetadata } from '../services/audit.service.js';
import type { ApiResponse, PaginatedResponse } from '@shared/types/api.types.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// =============================================================================
// GET /users - List users with filtering and pagination
// =============================================================================

router.get(
  '/',
  requirePermission('users:read'),
  validate({ query: userListQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page,
        limit,
        sortBy = 'lastName',
        sortOrder,
        search,
        role,
        isActive,
      } = req.query as Record<string, unknown>;

      const skip = ((page as number) - 1) * (limit as number);

      // Build where clause
      const where: Record<string, unknown> = {};

      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
      }

      if (role) where.role = role;

      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Execute query
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { [sortBy as string]: sortOrder },
          skip,
          take: limit as number,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      const response: PaginatedResponse<typeof users> = {
        success: true,
        data: users,
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
// GET /users/:id - Get single user
// =============================================================================

router.get(
  '/:id',
  requirePermission('users:read'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignmentsMade: true,
              returnsProcessed: true,
              auditLogs: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /users - Create new user (Admin only)
// =============================================================================

router.post(
  '/',
  requireRole('ADMIN'),
  validate({ body: createUserSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Check for duplicate email
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        throw new ConflictError('Email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Audit create
      await auditCreate(req, 'User', user.id, user as unknown as Record<string, unknown>);

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /users/:id - Update user (Admin only)
// =============================================================================

router.patch(
  '/:id',
  requireRole('ADMIN'),
  validate({ params: idParamsSchema, body: updateUserSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Prevent self-demotion from Admin
      if (id === req.user!.id && data.role && data.role !== 'ADMIN') {
        throw new ForbiddenError('Cannot demote your own admin account');
      }

      // Prevent self-deactivation
      if (id === req.user!.id && data.isActive === false) {
        throw new ForbiddenError('Cannot deactivate your own account');
      }

      // Get current user
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      if (!currentUser) {
        throw new NotFoundError('User');
      }

      // Check for duplicate email if changing
      if (data.email && data.email !== currentUser.email) {
        const existing = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existing) {
          throw new ConflictError('Email already exists');
        }
      }

      // Update user
      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });

      // Audit update
      await auditUpdate(
        req,
        'User',
        user.id,
        currentUser as unknown as Record<string, unknown>,
        user as unknown as Record<string, unknown>
      );

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /users/:id - Delete user (Admin only)
// =============================================================================

router.delete(
  '/:id',
  requireRole('ADMIN'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user!.id) {
        throw new ForbiddenError('Cannot delete your own account');
      }

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              assignmentsMade: true,
              returnsProcessed: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // Check if user has any activity
      if (user._count.assignmentsMade > 0 || user._count.returnsProcessed > 0) {
        throw new BadRequestError(
          'Cannot delete user with activity history. Deactivate the account instead.'
        );
      }

      await prisma.user.delete({
        where: { id },
      });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'User deleted successfully' },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /users/:id/reset-password - Reset user password (Admin only)
// =============================================================================

router.post(
  '/:id/reset-password',
  requireRole('ADMIN'),
  validate({ params: idParamsSchema, body: resetPasswordSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id },
        data: { passwordHash },
      });

      // Audit password reset
      await createAuditLog({
        entityType: 'User',
        entityId: id,
        action: 'PASSWORD_CHANGE',
        userId: req.user!.id,
        before: null,
        after: null,
        metadata: {
          ...extractAuditMetadata(req),
          resetBy: req.user!.id,
        },
      });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Password reset successfully' },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /users/:id/activate - Activate user (Admin only)
// =============================================================================

router.post(
  '/:id/activate',
  requireRole('ADMIN'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (user.isActive) {
        throw new BadRequestError('User is already active');
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: true },
      });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'User activated successfully' },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /users/:id/deactivate - Deactivate user (Admin only)
// =============================================================================

router.post(
  '/:id/deactivate',
  requireRole('ADMIN'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Prevent self-deactivation
      if (id === req.user!.id) {
        throw new ForbiddenError('Cannot deactivate your own account');
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (!user.isActive) {
        throw new BadRequestError('User is already inactive');
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'User deactivated successfully' },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export { router as usersRoutes };
