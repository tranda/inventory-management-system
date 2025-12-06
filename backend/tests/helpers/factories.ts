// Entity factories for testing
// Creates test data for User, Item, Employee, Assignment entities

import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import type { UserRole, ItemCategory, ItemStatus, ItemCondition } from '@prisma/client';

// =============================================================================
// User Factory
// =============================================================================

export interface UserFactoryInput {
  id?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export async function createUserData(input: UserFactoryInput = {}) {
  const id = input.id || uuid();
  const password = input.password || 'TestPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);

  return {
    id,
    email: input.email || `test-${id.slice(0, 8)}@example.com`,
    passwordHash,
    firstName: input.firstName || 'Test',
    lastName: input.lastName || 'User',
    role: input.role || ('VIEWER' as UserRole),
    isActive: input.isActive ?? true,
    _password: password, // Keep original password for login tests
  };
}

// =============================================================================
// Item Factory
// =============================================================================

export interface ItemFactoryInput {
  id?: string;
  assetId?: string;
  name?: string;
  category?: ItemCategory;
  status?: ItemStatus;
  condition?: ItemCondition;
  serialNumber?: string;
  brand?: string;
  model?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiration?: Date;
}

export function createItemData(input: ItemFactoryInput = {}) {
  const id = input.id || uuid();

  return {
    id,
    assetId: input.assetId || `IT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    name: input.name || 'Test Laptop',
    category: input.category || ('LAPTOP' as ItemCategory),
    status: input.status || ('AVAILABLE' as ItemStatus),
    condition: input.condition || ('NEW' as ItemCondition),
    serialNumber: input.serialNumber || `SN-${id.slice(0, 12).toUpperCase()}`,
    brand: input.brand || 'Dell',
    model: input.model || 'Latitude 5520',
    purchaseDate: input.purchaseDate || new Date(),
    purchasePrice: input.purchasePrice ?? 1200.00,
    warrantyExpiration: input.warrantyExpiration || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  };
}

// =============================================================================
// Employee Factory
// =============================================================================

export interface EmployeeFactoryInput {
  id?: string;
  employeeId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  title?: string;
  isActive?: boolean;
}

export function createEmployeeData(input: EmployeeFactoryInput = {}) {
  const id = input.id || uuid();

  return {
    id,
    employeeId: input.employeeId || `EMP-${Date.now().toString(36).toUpperCase()}`,
    email: input.email || `employee-${id.slice(0, 8)}@example.com`,
    firstName: input.firstName || 'John',
    lastName: input.lastName || 'Doe',
    department: input.department || 'Engineering',
    title: input.title || 'Software Developer',
    isActive: input.isActive ?? true,
  };
}

// =============================================================================
// Assignment Factory
// =============================================================================

export interface AssignmentFactoryInput {
  id?: string;
  itemId?: string;
  employeeId?: string;
  assignedById?: string;
  assignedAt?: Date;
  expectedReturnDate?: Date;
  returnedAt?: Date | null;
  notes?: string;
  acknowledged?: boolean;
}

export function createAssignmentData(input: AssignmentFactoryInput = {}) {
  return {
    id: input.id || uuid(),
    itemId: input.itemId || uuid(),
    employeeId: input.employeeId || uuid(),
    assignedById: input.assignedById || uuid(),
    assignedAt: input.assignedAt || new Date(),
    expectedReturnDate: input.expectedReturnDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    returnedAt: input.returnedAt ?? null,
    notes: input.notes || null,
    acknowledged: input.acknowledged ?? false,
  };
}
