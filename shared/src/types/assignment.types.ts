// Assignment types for IT Inventory Management System

import type { ItemCondition } from './item.types.js';
import type { Item } from './item.types.js';
import type { Employee } from './employee.types.js';
import type { User } from './user.types.js';

export interface Assignment {
  id: string;
  itemId: string;
  employeeId: string;
  assignedById: string;
  assignedAt: Date;
  expectedReturnAt: Date | null;
  purpose: string | null;
  conditionAtAssignment: ItemCondition;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  notes: string | null;
  returnedAt: Date | null;
  returnedById: string | null;
  conditionAtReturn: ItemCondition | null;
  returnNotes: string | null;
  transferredToId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Assignment with related entities for display
export interface AssignmentWithRelations extends Assignment {
  item: Item;
  employee: Employee;
  assignedBy: Pick<User, 'id' | 'firstName' | 'lastName'>;
  returnedBy: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
}

export interface AssignmentCreateInput {
  itemId: string;
  employeeId: string;
  assignedAt?: Date; // Defaults to now
  expectedReturnAt?: Date;
  purpose?: string;
  conditionAtAssignment: ItemCondition;
  acknowledged?: boolean;
  notes?: string;
}

export interface AssignmentReturnInput {
  conditionAtReturn: ItemCondition;
  returnNotes?: string;
}

export interface AssignmentTransferInput {
  newEmployeeId: string;
  reason: string;
  transferDate?: Date; // Defaults to now
}

export interface AssignmentListQuery {
  itemId?: string;
  employeeId?: string;
  isActive?: boolean; // returnedAt is null
  assignedAfter?: Date;
  assignedBefore?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'assignedAt' | 'returnedAt';
  sortOrder?: 'asc' | 'desc';
}
