// Employee types for IT Inventory Management System

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string | null;
  title: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeCreateInput {
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  title?: string;
  phone?: string;
}

export interface EmployeeUpdateInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  title?: string;
  phone?: string;
  isActive?: boolean;
}

export interface EmployeeListQuery {
  search?: string;
  department?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'lastName' | 'email' | 'department' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Employee with current assignment count
export interface EmployeeWithAssignments extends Employee {
  currentAssignmentCount: number;
}
