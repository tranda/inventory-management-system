// Employees Routes - Constitution Art. 4.2: RESTful API
// CRUD operations for employees

import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../app.js';
import { validate, idParamsSchema } from '../middleware/validation.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { NotFoundError, BadRequestError, ConflictError } from '../middleware/error.middleware.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  deactivateEmployeeSchema,
  employeeListQuerySchema,
} from '../validators/employee.validators.js';
import { auditCreate, auditUpdate, auditStatusChange } from '../services/audit.service.js';
import type { ApiResponse, PaginatedResponse } from '@shared/types/api.types.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// =============================================================================
// GET /employees - List employees with filtering and pagination
// =============================================================================

router.get(
  '/',
  requirePermission('employees:read'),
  validate({ query: employeeListQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page,
        limit,
        sortBy = 'lastName',
        sortOrder,
        search,
        department,
        isActive,
      } = req.query as Record<string, unknown>;

      const skip = ((page as number) - 1) * (limit as number);

      // Build where clause
      const where: Record<string, unknown> = {};

      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
      }

      if (department) {
        where.department = department;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { department: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Execute query
      const [employees, total] = await Promise.all([
        prisma.employee.findMany({
          where,
          orderBy: { [sortBy as string]: sortOrder },
          skip,
          take: limit as number,
          include: {
            _count: {
              select: {
                assignments: {
                  where: { returnedAt: null },
                },
              },
            },
          },
        }),
        prisma.employee.count({ where }),
      ]);

      // Transform to include activeAssignmentsCount
      const employeesWithCount = employees.map((emp) => ({
        ...emp,
        activeAssignmentsCount: emp._count.assignments,
        _count: undefined,
      }));

      const response: PaginatedResponse<typeof employeesWithCount> = {
        success: true,
        data: employeesWithCount,
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
// GET /employees/departments - Get list of departments
// =============================================================================

router.get(
  '/departments',
  requirePermission('employees:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departments = await prisma.employee.findMany({
        where: {
          department: { not: null },
        },
        select: { department: true },
        distinct: ['department'],
        orderBy: { department: 'asc' },
      });

      const response: ApiResponse<string[]> = {
        success: true,
        data: departments.map((d) => d.department!).filter(Boolean),
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /employees/:id - Get single employee
// =============================================================================

router.get(
  '/:id',
  requirePermission('employees:read'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          assignments: {
            orderBy: { assignedAt: 'desc' },
            include: {
              item: {
                select: {
                  id: true,
                  assetId: true,
                  name: true,
                  category: true,
                  status: true,
                },
              },
              assignedBy: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });

      if (!employee) {
        throw new NotFoundError('Employee');
      }

      const response: ApiResponse<typeof employee> = {
        success: true,
        data: employee,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /employees - Create new employee
// =============================================================================

router.post(
  '/',
  requirePermission('employees:create'),
  validate({ body: createEmployeeSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body;

      // Check for duplicate email
      const existing = await prisma.employee.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        throw new ConflictError('Email already exists');
      }

      const employee = await prisma.employee.create({
        data,
      });

      // Audit create
      await auditCreate(req, 'Employee', employee.id, employee as unknown as Record<string, unknown>);

      const response: ApiResponse<typeof employee> = {
        success: true,
        data: employee,
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// PATCH /employees/:id - Update employee
// =============================================================================

router.patch(
  '/:id',
  requirePermission('employees:update'),
  validate({ params: idParamsSchema, body: updateEmployeeSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Get current employee
      const currentEmployee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!currentEmployee) {
        throw new NotFoundError('Employee');
      }

      // Check for duplicate email if changing
      if (data.email && data.email !== currentEmployee.email) {
        const existing = await prisma.employee.findUnique({
          where: { email: data.email },
        });

        if (existing) {
          throw new ConflictError('Email already exists');
        }
      }

      // Update employee
      const employee = await prisma.employee.update({
        where: { id },
        data,
      });

      // Audit update
      await auditUpdate(
        req,
        'Employee',
        employee.id,
        currentEmployee as unknown as Record<string, unknown>,
        employee as unknown as Record<string, unknown>
      );

      const response: ApiResponse<typeof employee> = {
        success: true,
        data: employee,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// DELETE /employees/:id - Delete employee (only if no active assignments)
// =============================================================================

router.delete(
  '/:id',
  requirePermission('employees:delete'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          assignments: {
            where: { returnedAt: null },
          },
        },
      });

      if (!employee) {
        throw new NotFoundError('Employee');
      }

      if (employee.assignments.length > 0) {
        throw new BadRequestError(
          'Cannot delete employee with active assignments. Deactivate instead or return all items first.'
        );
      }

      await prisma.employee.delete({
        where: { id },
      });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Employee deleted successfully' },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /employees/:id/deactivate - Deactivate employee
// =============================================================================

router.post(
  '/:id/deactivate',
  requirePermission('employees:deactivate'),
  validate({ params: idParamsSchema, body: deactivateEmployeeSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { returnItems, reason } = req.body;

      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          assignments: {
            where: { returnedAt: null },
            include: {
              item: true,
            },
          },
        },
      });

      if (!employee) {
        throw new NotFoundError('Employee');
      }

      if (!employee.isActive) {
        throw new BadRequestError('Employee is already deactivated');
      }

      // If returnItems is true, auto-return all active assignments
      if (returnItems && employee.assignments.length > 0) {
        const now = new Date();

        await prisma.$transaction(async (tx) => {
          // Return all assignments
          for (const assignment of employee.assignments) {
            await tx.assignment.update({
              where: { id: assignment.id },
              data: {
                returnedAt: now,
                returnedById: req.user!.id,
                conditionAtReturn: assignment.conditionAtAssignment,
                returnNotes: `Auto-returned due to employee deactivation. Reason: ${reason || 'Not specified'}`,
              },
            });

            // Update item status
            await tx.item.update({
              where: { id: assignment.itemId },
              data: { status: 'AVAILABLE' },
            });
          }

          // Deactivate employee
          await tx.employee.update({
            where: { id },
            data: { isActive: false },
          });
        });
      } else if (employee.assignments.length > 0) {
        throw new BadRequestError(
          `Employee has ${employee.assignments.length} active assignments. Set returnItems: true to auto-return them.`
        );
      } else {
        // No active assignments, just deactivate
        await prisma.employee.update({
          where: { id },
          data: { isActive: false },
        });
      }

      // Audit status change
      await auditStatusChange(req, 'Employee', id, 'active', 'inactive', reason);

      const response: ApiResponse<{ message: string; returnedItems?: number }> = {
        success: true,
        data: {
          message: 'Employee deactivated successfully',
          returnedItems: returnItems ? employee.assignments.length : undefined,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /employees/:id/reactivate - Reactivate employee
// =============================================================================

router.post(
  '/:id/reactivate',
  requirePermission('employees:update'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const employee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!employee) {
        throw new NotFoundError('Employee');
      }

      if (employee.isActive) {
        throw new BadRequestError('Employee is already active');
      }

      await prisma.employee.update({
        where: { id },
        data: { isActive: true },
      });

      // Audit status change
      await auditStatusChange(req, 'Employee', id, 'inactive', 'active');

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Employee reactivated successfully' },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /employees/:id/assignments - Get employee's assignments
// =============================================================================

router.get(
  '/:id/assignments',
  requirePermission('employees:read'),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { active } = req.query;

      const employee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!employee) {
        throw new NotFoundError('Employee');
      }

      const where: Record<string, unknown> = { employeeId: id };
      if (active === 'true') {
        where.returnedAt = null;
      } else if (active === 'false') {
        where.returnedAt = { not: null };
      }

      const assignments = await prisma.assignment.findMany({
        where,
        orderBy: { assignedAt: 'desc' },
        include: {
          item: {
            select: {
              id: true,
              assetId: true,
              name: true,
              category: true,
              status: true,
              condition: true,
            },
          },
          assignedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          returnedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      const response: ApiResponse<typeof assignments> = {
        success: true,
        data: assignments,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export { router as employeesRoutes };
