// Test Factories - Constitution Art. 3.2: Test infrastructure
// Creates test data for use in tests

import { v4 as uuid } from 'uuid';
import type { User, Item, Employee, Assignment } from '@prisma/client';

// =============================================================================
// User Factory
// =============================================================================

interface UserFactoryOptions {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'MANAGER' | 'VIEWER';
  isActive?: boolean;
}

export function createUser(options: UserFactoryOptions = {}): User {
  const id = options.id ?? uuid();
  return {
    id,
    email: options.email ?? `user-${id.slice(0, 8)}@test.com`,
    passwordHash: '$2b$12$test.hash.for.testing.only',
    firstName: options.firstName ?? 'Test',
    lastName: options.lastName ?? 'User',
    role: options.role ?? 'VIEWER',
    isActive: options.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// =============================================================================
// Employee Factory
// =============================================================================

interface EmployeeFactoryOptions {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  department?: string | null;
  title?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export function createEmployee(options: EmployeeFactoryOptions = {}): Employee {
  const id = options.id ?? uuid();
  return {
    id,
    email: options.email ?? `employee-${id.slice(0, 8)}@test.com`,
    firstName: options.firstName ?? 'Test',
    lastName: options.lastName ?? 'Employee',
    department: options.department ?? 'Engineering',
    title: options.title ?? 'Developer',
    phone: options.phone ?? null,
    isActive: options.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// =============================================================================
// Item Factory
// =============================================================================

interface ItemFactoryOptions {
  id?: string;
  assetId?: string;
  name?: string;
  category?: 'LAPTOP' | 'MONITOR' | 'KEYBOARD' | 'MOUSE' | 'HEADSET' | 'PHONE' | 'TABLET' | 'CABLES' | 'SOFTWARE_LICENSE' | 'OTHER';
  status?: 'AVAILABLE' | 'ASSIGNED' | 'RESERVED' | 'IN_REPAIR' | 'DECOMMISSIONED' | 'LOST_STOLEN';
  condition?: 'NEW' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DECOMMISSIONED';
  brand?: string | null;
  model?: string | null;
  serialNumber?: string;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  warrantyExpiration?: Date | null;
  location?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  thumbnailUrl?: string | null;
  deletedAt?: Date | null;
  decommissionReason?: string | null;
  isConsumable?: boolean;
  minStockLevel?: number | null;
  createdById: string;
}

export function createItem(options: ItemFactoryOptions): Item {
  const id = options.id ?? uuid();
  return {
    id,
    assetId: options.assetId ?? `IT-TEST-${id.slice(0, 4).toUpperCase()}`,
    name: options.name ?? 'Test Laptop',
    category: options.category ?? 'LAPTOP',
    status: options.status ?? 'AVAILABLE',
    condition: options.condition ?? 'NEW',
    brand: options.brand ?? 'Test Brand',
    model: options.model ?? 'Test Model',
    serialNumber: options.serialNumber ?? `SN-${id.slice(0, 8)}`,
    purchaseDate: options.purchaseDate ?? new Date(),
    purchasePrice: options.purchasePrice !== undefined
      ? options.purchasePrice !== null
        ? { toNumber: () => options.purchasePrice } as unknown as import('@prisma/client/runtime/library').Decimal
        : null
      : { toNumber: () => 999.99 } as unknown as import('@prisma/client/runtime/library').Decimal,
    warrantyExpiration: options.warrantyExpiration ?? null,
    location: options.location ?? 'Test Location',
    notes: options.notes ?? null,
    photoUrl: options.photoUrl ?? null,
    thumbnailUrl: options.thumbnailUrl ?? null,
    deletedAt: options.deletedAt ?? null,
    decommissionReason: options.decommissionReason ?? null,
    isConsumable: options.isConsumable ?? false,
    minStockLevel: options.minStockLevel ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: options.createdById,
  };
}

// =============================================================================
// Assignment Factory
// =============================================================================

interface AssignmentFactoryOptions {
  id?: string;
  itemId: string;
  employeeId: string;
  assignedById: string;
  assignedAt?: Date;
  expectedReturnAt?: Date | null;
  purpose?: string | null;
  conditionAtAssignment?: 'NEW' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DECOMMISSIONED';
  acknowledged?: boolean;
  acknowledgedAt?: Date | null;
  notes?: string | null;
  returnedAt?: Date | null;
  returnedById?: string | null;
  conditionAtReturn?: 'NEW' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DECOMMISSIONED' | null;
  returnNotes?: string | null;
  transferredToId?: string | null;
}

export function createAssignment(options: AssignmentFactoryOptions): Assignment {
  const id = options.id ?? uuid();
  return {
    id,
    itemId: options.itemId,
    employeeId: options.employeeId,
    assignedById: options.assignedById,
    assignedAt: options.assignedAt ?? new Date(),
    expectedReturnAt: options.expectedReturnAt ?? null,
    purpose: options.purpose ?? null,
    conditionAtAssignment: options.conditionAtAssignment ?? 'GOOD',
    acknowledged: options.acknowledged ?? false,
    acknowledgedAt: options.acknowledgedAt ?? null,
    notes: options.notes ?? null,
    returnedAt: options.returnedAt ?? null,
    returnedById: options.returnedById ?? null,
    conditionAtReturn: options.conditionAtReturn ?? null,
    returnNotes: options.returnNotes ?? null,
    transferredToId: options.transferredToId ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
