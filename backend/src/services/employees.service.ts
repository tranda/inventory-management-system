// Employees Service - Business logic for employee operations
// Constitution Art. 5.4: Audit logging for all state changes

import { prisma } from '../lib/prisma';
import { Prisma, Employee } from '@prisma/client';
import { auditCreate, auditUpdate } from './audit.service';
import type { Request } from 'express';

// =============================================================================
// Types
// =============================================================================

export interface EmployeeCreateInput {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  position?: string;
  phone?: string;
  hireDate?: string;
  managerId?: string;
}

export interface EmployeeUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string | null;
  position?: string | null;
  phone?: string | null;
  hireDate?: string | null;
  managerId?: string | null;
}

export interface EmployeeListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  department?: string;
  isActive?: boolean;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Create a new employee
 */
export async function createEmployee(
  req: Request,
  data: EmployeeCreateInput
): Promise<Employee> {
  const employee = await prisma.employee.create({
    data: {
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      department: data.department || null,
      position: data.position || null,
      phone: data.phone || null,
      hireDate: data.hireDate ? new Date(data.hireDate) : null,
      managerId: data.managerId || null,
      isActive: true,
    },
    include: {
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Audit log
  await auditCreate(req, 'EMPLOYEE', employee.id, employee as unknown as Record<string, unknown>);

  return employee;
}

/**
 * Find employee by ID
 */
export async function findEmployeeById(id: string): Promise<Employee | null> {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      manager: {
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
          item: {
            select: {
              id: true,
              assetId: true,
              name: true,
              category: true,
              thumbnailUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });
}

/**
 * Find employee by employee ID
 */
export async function findEmployeeByEmployeeId(employeeId: string): Promise<Employee | null> {
  return prisma.employee.findUnique({
    where: { employeeId },
  });
}

/**
 * Find employee by email
 */
export async function findEmployeeByEmail(email: string): Promise<Employee | null> {
  return prisma.employee.findUnique({
    where: { email },
  });
}

/**
 * List employees with pagination and filtering
 */
export async function listEmployees(query: EmployeeListQuery = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'lastName',
    sortOrder = 'asc',
    search,
    department,
    isActive,
  } = query;

  const where: Prisma.EmployeeWhereInput = {
    ...(isActive !== undefined && { isActive }),
    ...(department && { department }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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

  return {
    data: employees,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update an employee
 */
export async function updateEmployee(
  req: Request,
  id: string,
  data: EmployeeUpdateInput
): Promise<Employee> {
  const existing = await findEmployeeById(id);
  if (!existing) {
    throw new Error('Employee not found');
  }

  const updateData: Prisma.EmployeeUpdateInput = {};

  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.hireDate !== undefined) {
    updateData.hireDate = data.hireDate ? new Date(data.hireDate) : null;
  }
  if (data.managerId !== undefined) {
    updateData.manager = data.managerId ? { connect: { id: data.managerId } } : { disconnect: true };
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: {
      manager: {
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
    'EMPLOYEE',
    employee.id,
    existing as unknown as Record<string, unknown>,
    employee as unknown as Record<string, unknown>
  );

  return employee;
}

/**
 * Deactivate an employee
 */
export async function deactivateEmployee(req: Request, id: string): Promise<Employee> {
  const existing = await findEmployeeById(id);
  if (!existing) {
    throw new Error('Employee not found');
  }

  // Check for active assignments
  const activeAssignments = await prisma.assignment.count({
    where: {
      employeeId: id,
      returnedAt: null,
    },
  });

  if (activeAssignments > 0) {
    throw new Error('Cannot deactivate employee with active assignments');
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: { isActive: false },
  });

  // Audit log
  await auditUpdate(
    req,
    'EMPLOYEE',
    employee.id,
    { isActive: true },
    { isActive: false }
  );

  return employee;
}

/**
 * Reactivate an employee
 */
export async function reactivateEmployee(req: Request, id: string): Promise<Employee> {
  const existing = await findEmployeeById(id);
  if (!existing) {
    throw new Error('Employee not found');
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: { isActive: true },
  });

  // Audit log
  await auditUpdate(
    req,
    'EMPLOYEE',
    employee.id,
    { isActive: false },
    { isActive: true }
  );

  return employee;
}

/**
 * Get employee's current equipment
 */
export async function getEmployeeEquipment(id: string) {
  const assignments = await prisma.assignment.findMany({
    where: {
      employeeId: id,
      returnedAt: null,
    },
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
    orderBy: {
      assignedAt: 'desc',
    },
  });

  return assignments;
}

/**
 * Get all departments
 */
export async function getDepartments(): Promise<string[]> {
  const departments = await prisma.employee.findMany({
    where: {
      department: { not: null },
    },
    select: {
      department: true,
    },
    distinct: ['department'],
  });

  return departments.map((d) => d.department!).filter(Boolean).sort();
}
