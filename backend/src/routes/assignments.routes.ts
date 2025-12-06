// Assignments Routes - Constitution Art. 4.2: RESTful API
// Assignment lifecycle: assign, return, transfer, acknowledge

import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../app.js';
import { validate, idParamsSchema } from '../middleware/validation.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission, requireAnyPermission } from '../middleware/rbac.middleware.js';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware.js';
import {
  createAssignmentSchema,
  returnAssignmentSchema,
  transferAssignmentSchema,
  acknowledgeAssignmentSchema,
  assignmentListQuerySchema,
} from '../validators/assignment.validators.js';
import {
  auditAssignment,
  auditReturn,
  auditTransfer,
  auditUpdate,
} from '../services/audit.service.js';
import { queueAssignmentEmail } from '../jobs/email.queue.js';
import type { ApiResponse, PaginatedResponse } from '@shared/types/api.types.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// =============================================================================
// GET /assignments - List assignments with filtering and pagination
// =============================================================================

router.get(
  '/',
  requireAnyPermission(['assignments:read', 'assignments:read:own']),
  validate({ query: assignmentListQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page,
        limit,
        sortBy = 'assignedAt',
        sortOrder = 'desc',
        itemId,
        employeeId,
        active,
        acknowledged,
        overdue,
      } = req.query as Record<string, unknown>;

      const skip = ((page as number) - 1) * (limit as number);

      // Build where clause
      const where: Record<string, unknown> = {};

      if (itemId) where.itemId = itemId;
      if (employeeId) where.employeeId = employeeId;

      if (typeof active === 'boolean') {
        where.returnedAt = active ? null : { not: null };
      }

      if (typeof acknowledged === 'boolean') {
        where.acknowledged = acknowledged;
      }

      if (overdue === true) {
        where.returnedAt = null;
        where.expectedReturnAt = { lt: new Date() };
      }

      // Execute query
      const [assignments, total] = await Promise.all([
        prisma.assignment.findMany({
          where,
          orderBy: { [sortBy as string]: sortOrder },
          skip,
          take: limit as number,
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
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: true,
              },
            },
            assignedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            returnedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        }),
        prisma.assignment.count({ where }),
      ]);

      const response: PaginatedResponse<typeof assignments> = {
        success: true,
        data: assignments,
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
// GET /assignments/overdue - Get overdue assignments
// =============================================================================

router.get(
  '/overdue',
  requirePermission('assignments:read'),
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();

      const assignments = await prisma.assignment.findMany({
        where: {
          returnedAt: null,
          expectedReturnAt: { lt: now },
        },
        orderBy: { expectedReturnAt: 'asc' },
        include: {
          item: {
            select: {
              id: true,
              assetId: true,
              name: true,
              category: true,
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
            },
          },
        },
      });

      // Calculate days overdue
      const overdueAssignments = assignments.map((assignment) => ({
        ...assignment,
        daysOverdue: Math.floor(
          (now.getTime() - new Date(assignment.expectedReturnAt!).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));

      const response: ApiResponse<typeof overdueAssignments> = {
        success: true,
        data: overdueAssignments,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /assignments/:id - Get single assignment
// =============================================================================

router.get(
  '/:id',
  requireAnyPermission(['assignments:read', 'assignments:read:own']),
  validate({ params: idParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          item: {
            select: {
              id: true,
              assetId: true,
              name: true,
              category: true,
              status: true,
              condition: true,
              brand: true,
              model: true,
              serialNumber: true,
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
              title: true,
            },
          },
          assignedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          returnedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          transferredTo: {
            select: {
              id: true,
              employee: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          transferredFrom: {
            select: {
              id: true,
              employee: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });

      if (!assignment) {
        throw new NotFoundError('Assignment');
      }

      const response: ApiResponse<typeof assignment> = {
        success: true,
        data: assignment,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /assignments - Create new assignment
// =============================================================================

router.post(
  '/',
  requirePermission('assignments:create'),
  validate({ body: createAssignmentSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { itemId, employeeId, assignedAt, expectedReturnAt, purpose, notes } = req.body;

      // Check item exists and is available
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: {
          assignments: {
            where: { returnedAt: null },
          },
        },
      });

      if (!item) {
        throw new NotFoundError('Item');
      }

      if (item.deletedAt) {
        throw new BadRequestError('Cannot assign a deleted item');
      }

      if (item.status !== 'AVAILABLE' && item.status !== 'RESERVED') {
        throw new BadRequestError(`Item is not available for assignment (status: ${item.status})`);
      }

      if (item.assignments.length > 0) {
        throw new BadRequestError('Item is already assigned');
      }

      // Check employee exists and is active
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new NotFoundError('Employee');
      }

      if (!employee.isActive) {
        throw new BadRequestError('Cannot assign to an inactive employee');
      }

      // Create assignment and update item in transaction
      const assignment = await prisma.$transaction(async (tx) => {
        const newAssignment = await tx.assignment.create({
          data: {
            itemId,
            employeeId,
            assignedById: req.user!.id,
            assignedAt: assignedAt || new Date(),
            expectedReturnAt,
            purpose,
            notes,
            conditionAtAssignment: item.condition,
          },
          include: {
            item: {
              select: { id: true, assetId: true, name: true, category: true },
            },
            employee: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            assignedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        });

        // Update item status
        await tx.item.update({
          where: { id: itemId },
          data: { status: 'ASSIGNED' },
        });

        return newAssignment;
      });

      // Audit assignment
      await auditAssignment(
        req,
        assignment.id,
        itemId,
        employeeId,
        assignment as unknown as Record<string, unknown>
      );

      // Queue assignment notification email (fire and forget)
      if (assignment.employee?.email) {
        queueAssignmentEmail({
          employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
          employeeEmail: assignment.employee.email,
          itemName: assignment.item.name,
          assetId: assignment.item.assetId,
          category: assignment.item.category,
          assignedBy: `${assignment.assignedBy?.firstName} ${assignment.assignedBy?.lastName}`,
          assignedAt: new Date(assignment.assignedAt),
          expectedReturnDate: expectedReturnAt ? new Date(expectedReturnAt) : null,
          notes: notes || null,
        }).catch((err) => {
          console.error('Failed to queue assignment email:', err);
        });
      }

      const response: ApiResponse<typeof assignment> = {
        success: true,
        data: assignment,
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /assignments/:id/return - Return an assignment
// =============================================================================

router.post(
  '/:id/return',
  requirePermission('assignments:return'),
  validate({ params: idParamsSchema, body: returnAssignmentSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { conditionAtReturn, returnNotes } = req.body;

      const currentAssignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          item: true,
        },
      });

      if (!currentAssignment) {
        throw new NotFoundError('Assignment');
      }

      if (currentAssignment.returnedAt) {
        throw new BadRequestError('Assignment has already been returned');
      }

      // Determine new item status based on condition
      let newItemStatus: 'AVAILABLE' | 'IN_REPAIR' = 'AVAILABLE';
      if (conditionAtReturn === 'NEEDS_REPAIR') {
        newItemStatus = 'IN_REPAIR';
      }

      // Return assignment and update item in transaction
      const assignment = await prisma.$transaction(async (tx) => {
        const updatedAssignment = await tx.assignment.update({
          where: { id },
          data: {
            returnedAt: new Date(),
            returnedById: req.user!.id,
            conditionAtReturn,
            returnNotes,
          },
          include: {
            item: {
              select: { id: true, assetId: true, name: true, category: true },
            },
            employee: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            returnedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        });

        // Update item status and condition
        await tx.item.update({
          where: { id: currentAssignment.itemId },
          data: {
            status: newItemStatus,
            condition: conditionAtReturn,
          },
        });

        return updatedAssignment;
      });

      // Audit return
      await auditReturn(
        req,
        assignment.id,
        currentAssignment as unknown as Record<string, unknown>,
        assignment as unknown as Record<string, unknown>
      );

      const response: ApiResponse<typeof assignment> = {
        success: true,
        data: assignment,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /assignments/:id/transfer - Transfer to another employee
// =============================================================================

router.post(
  '/:id/transfer',
  requirePermission('assignments:transfer'),
  validate({ params: idParamsSchema, body: transferAssignmentSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { toEmployeeId, reason, notes } = req.body;

      const currentAssignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          item: true,
          employee: true,
        },
      });

      if (!currentAssignment) {
        throw new NotFoundError('Assignment');
      }

      if (currentAssignment.returnedAt) {
        throw new BadRequestError('Cannot transfer a returned assignment');
      }

      if (currentAssignment.employeeId === toEmployeeId) {
        throw new BadRequestError('Cannot transfer to the same employee');
      }

      // Check new employee exists and is active
      const newEmployee = await prisma.employee.findUnique({
        where: { id: toEmployeeId },
      });

      if (!newEmployee) {
        throw new NotFoundError('Target employee');
      }

      if (!newEmployee.isActive) {
        throw new BadRequestError('Cannot transfer to an inactive employee');
      }

      // Create new assignment and close old one in transaction
      const { oldAssignment, newAssignment } = await prisma.$transaction(async (tx) => {
        // Create new assignment
        const created = await tx.assignment.create({
          data: {
            itemId: currentAssignment.itemId,
            employeeId: toEmployeeId,
            assignedById: req.user!.id,
            assignedAt: new Date(),
            conditionAtAssignment: currentAssignment.item.condition,
            purpose: reason,
            notes,
          },
        });

        // Close old assignment with reference to new one
        const updated = await tx.assignment.update({
          where: { id },
          data: {
            returnedAt: new Date(),
            returnedById: req.user!.id,
            conditionAtReturn: currentAssignment.item.condition,
            returnNotes: `Transferred to ${newEmployee.firstName} ${newEmployee.lastName}. Reason: ${reason || 'Not specified'}`,
            transferredToId: created.id,
          },
        });

        return { oldAssignment: updated, newAssignment: created };
      });

      // Audit transfer
      await auditTransfer(
        req,
        oldAssignment.id,
        newAssignment.id,
        currentAssignment.itemId,
        currentAssignment.employeeId,
        toEmployeeId
      );

      // Fetch complete new assignment
      const completeAssignment = await prisma.assignment.findUnique({
        where: { id: newAssignment.id },
        include: {
          item: {
            select: { id: true, assetId: true, name: true, category: true },
          },
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          transferredFrom: {
            select: {
              id: true,
              employee: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });

      const response: ApiResponse<typeof completeAssignment> = {
        success: true,
        data: completeAssignment,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /assignments/:id/acknowledge - Acknowledge assignment receipt
// =============================================================================

router.post(
  '/:id/acknowledge',
  requireAnyPermission(['assignments:read:own', 'assignments:read']),
  validate({ params: idParamsSchema, body: acknowledgeAssignmentSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const currentAssignment = await prisma.assignment.findUnique({
        where: { id },
      });

      if (!currentAssignment) {
        throw new NotFoundError('Assignment');
      }

      if (currentAssignment.returnedAt) {
        throw new BadRequestError('Cannot acknowledge a returned assignment');
      }

      if (currentAssignment.acknowledged) {
        throw new BadRequestError('Assignment has already been acknowledged');
      }

      const assignment = await prisma.assignment.update({
        where: { id },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
        },
        include: {
          item: {
            select: { id: true, assetId: true, name: true },
          },
          employee: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // Audit update
      await auditUpdate(
        req,
        'Assignment',
        assignment.id,
        { acknowledged: false, acknowledgedAt: null },
        { acknowledged: true, acknowledgedAt: assignment.acknowledgedAt }
      );

      const response: ApiResponse<typeof assignment> = {
        success: true,
        data: assignment,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export { router as assignmentsRoutes };
