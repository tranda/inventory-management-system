// Assignments Service - Business logic for equipment assignment operations
// Constitution Art. 5.4: Audit logging for all state changes

import { prisma } from '../lib/prisma';
import { Prisma, Assignment, ItemStatus, ItemCondition } from '@prisma/client';
import { auditCreate, auditUpdate } from './audit.service';
import type { Request } from 'express';

// =============================================================================
// Types
// =============================================================================

export interface AssignmentCreateInput {
  itemId: string;
  employeeId: string;
  notes?: string;
  expectedReturnDate?: string;
  acknowledged?: boolean;
}

export interface AssignmentReturnInput {
  condition: ItemCondition;
  returnNotes?: string;
}

export interface AssignmentTransferInput {
  newEmployeeId: string;
  transferNotes?: string;
}

export interface AssignmentListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  itemId?: string;
  employeeId?: string;
  isActive?: boolean;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Create a new assignment
 */
export async function createAssignment(
  req: Request,
  data: AssignmentCreateInput,
  userId: string
): Promise<Assignment> {
  // Validate item exists and is available
  const item = await prisma.item.findUnique({
    where: { id: data.itemId },
  });

  if (!item) {
    throw new Error('Item not found');
  }

  if (item.status !== 'AVAILABLE') {
    throw new Error(`Item is not available for assignment (current status: ${item.status})`);
  }

  if (item.deletedAt) {
    throw new Error('Cannot assign a deleted item');
  }

  // Validate employee exists and is active
  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  if (!employee.isActive) {
    throw new Error('Cannot assign to inactive employee');
  }

  // Create assignment and update item status in a transaction
  const assignment = await prisma.$transaction(async (tx) => {
    // Create the assignment
    const newAssignment = await tx.assignment.create({
      data: {
        itemId: data.itemId,
        employeeId: data.employeeId,
        assignedById: userId,
        notes: data.notes || null,
        expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
        acknowledged: data.acknowledged ?? false,
        acknowledgedAt: data.acknowledged ? new Date() : null,
      },
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
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update item status to ASSIGNED
    await tx.item.update({
      where: { id: data.itemId },
      data: { status: 'ASSIGNED' as ItemStatus },
    });

    return newAssignment;
  });

  // Audit log
  await auditCreate(req, 'ASSIGNMENT', assignment.id, {
    ...assignment,
    itemId: data.itemId,
    employeeId: data.employeeId,
    previousItemStatus: 'AVAILABLE',
    newItemStatus: 'ASSIGNED',
  } as unknown as Record<string, unknown>);

  return assignment;
}

/**
 * Find assignment by ID
 */
export async function findAssignmentById(id: string): Promise<Assignment | null> {
  return prisma.assignment.findUnique({
    where: { id },
    include: {
      item: {
        select: {
          id: true,
          assetId: true,
          name: true,
          category: true,
          brand: true,
          model: true,
          serialNumber: true,
          thumbnailUrl: true,
          status: true,
          condition: true,
        },
      },
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      returnedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * List assignments with pagination and filtering
 */
export async function listAssignments(query: AssignmentListQuery = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'assignedAt',
    sortOrder = 'desc',
    itemId,
    employeeId,
    isActive,
  } = query;

  const where: Prisma.AssignmentWhereInput = {
    ...(itemId && { itemId }),
    ...(employeeId && { employeeId }),
    ...(isActive !== undefined && {
      returnedAt: isActive ? null : { not: null },
    }),
  };

  const [assignments, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        item: {
          select: {
            id: true,
            assetId: true,
            name: true,
            category: true,
            thumbnailUrl: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        returnedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.assignment.count({ where }),
  ]);

  return {
    data: assignments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Process equipment return
 */
export async function processReturn(
  req: Request,
  id: string,
  data: AssignmentReturnInput,
  userId: string
): Promise<Assignment> {
  const assignment = await findAssignmentById(id);

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.returnedAt) {
    throw new Error('Equipment has already been returned');
  }

  // Determine new item status based on condition
  let newStatus: ItemStatus = 'AVAILABLE';
  if (data.condition === 'NEEDS_REPAIR') {
    newStatus = 'IN_REPAIR';
  } else if (data.condition === 'DECOMMISSIONED') {
    newStatus = 'DECOMMISSIONED';
  }

  // Process return in a transaction
  const updatedAssignment = await prisma.$transaction(async (tx) => {
    // Update assignment
    const returned = await tx.assignment.update({
      where: { id },
      data: {
        returnedAt: new Date(),
        returnedById: userId,
        returnCondition: data.condition,
        returnNotes: data.returnNotes || null,
      },
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
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        returnedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update item status and condition
    await tx.item.update({
      where: { id: assignment.itemId },
      data: {
        status: newStatus,
        condition: data.condition,
      },
    });

    return returned;
  });

  // Audit log
  await auditUpdate(
    req,
    'ASSIGNMENT',
    assignment.id,
    { returnedAt: null, returnCondition: null },
    {
      returnedAt: updatedAssignment.returnedAt,
      returnCondition: data.condition,
      newItemStatus: newStatus,
    }
  );

  return updatedAssignment;
}

/**
 * Transfer equipment to another employee
 */
export async function transferAssignment(
  req: Request,
  id: string,
  data: AssignmentTransferInput,
  userId: string
): Promise<Assignment> {
  const assignment = await findAssignmentById(id);

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.returnedAt) {
    throw new Error('Cannot transfer returned equipment');
  }

  // Validate new employee exists and is active
  const newEmployee = await prisma.employee.findUnique({
    where: { id: data.newEmployeeId },
  });

  if (!newEmployee) {
    throw new Error('New employee not found');
  }

  if (!newEmployee.isActive) {
    throw new Error('Cannot transfer to inactive employee');
  }

  if (data.newEmployeeId === assignment.employeeId) {
    throw new Error('Cannot transfer to the same employee');
  }

  // Transfer in a transaction
  const newAssignment = await prisma.$transaction(async (tx) => {
    // Close current assignment
    await tx.assignment.update({
      where: { id },
      data: {
        returnedAt: new Date(),
        returnedById: userId,
        returnNotes: `Transferred to ${newEmployee.firstName} ${newEmployee.lastName}`,
      },
    });

    // Create new assignment
    const transferred = await tx.assignment.create({
      data: {
        itemId: assignment.itemId,
        employeeId: data.newEmployeeId,
        assignedById: userId,
        notes: data.transferNotes || `Transferred from ${assignment.employee?.firstName} ${assignment.employee?.lastName}`,
        acknowledged: false,
      },
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
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return transferred;
  });

  // Audit log
  await auditCreate(req, 'ASSIGNMENT', newAssignment.id, {
    type: 'TRANSFER',
    previousAssignmentId: id,
    previousEmployeeId: assignment.employeeId,
    newEmployeeId: data.newEmployeeId,
    itemId: assignment.itemId,
  } as unknown as Record<string, unknown>);

  return newAssignment;
}

/**
 * Acknowledge equipment receipt
 */
export async function acknowledgeAssignment(
  req: Request,
  id: string
): Promise<Assignment> {
  const assignment = await findAssignmentById(id);

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.acknowledged) {
    throw new Error('Assignment has already been acknowledged');
  }

  const updatedAssignment = await prisma.assignment.update({
    where: { id },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
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
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Audit log
  await auditUpdate(
    req,
    'ASSIGNMENT',
    assignment.id,
    { acknowledged: false, acknowledgedAt: null },
    { acknowledged: true, acknowledgedAt: updatedAssignment.acknowledgedAt }
  );

  return updatedAssignment;
}

/**
 * Get assignment history for an item
 */
export async function getItemAssignmentHistory(itemId: string) {
  return prisma.assignment.findMany({
    where: { itemId },
    orderBy: { assignedAt: 'desc' },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      returnedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * Get active assignments count by status
 */
export async function getAssignmentStats() {
  const [activeCount, returnedToday, pendingAcknowledgment] = await Promise.all([
    prisma.assignment.count({
      where: { returnedAt: null },
    }),
    prisma.assignment.count({
      where: {
        returnedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.assignment.count({
      where: {
        returnedAt: null,
        acknowledged: false,
      },
    }),
  ]);

  return {
    activeAssignments: activeCount,
    returnedToday,
    pendingAcknowledgment,
  };
}
