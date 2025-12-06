// User role constants and helpers

import { UserRole } from '../types/user.types.js';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.VIEWER]: 'Viewer',
};

export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Full system access including user management, system configuration, and permanent deletion',
  [UserRole.MANAGER]: 'Add/edit items, assign/return items, and view all reports. Cannot permanently delete items or manage users',
  [UserRole.VIEWER]: 'Read-only access to inventory. Can only view their own assignments',
};

// Role hierarchy (higher index = more permissions)
export const ROLE_HIERARCHY: UserRole[] = [
  UserRole.VIEWER,
  UserRole.MANAGER,
  UserRole.ADMIN,
];

/**
 * Check if a role has at least the permissions of another role
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const minimumIndex = ROLE_HIERARCHY.indexOf(minimumRole);
  return userIndex >= minimumIndex;
}

/**
 * Check if user can perform admin-only actions
 */
export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/**
 * Check if user can manage inventory (add, edit, assign, return)
 */
export function canManageInventory(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.MANAGER);
}

/**
 * Check if user can only view (no mutations)
 */
export function isViewerOnly(role: UserRole): boolean {
  return role === UserRole.VIEWER;
}

/**
 * Get all roles as array for select dropdowns
 */
export function getRoleOptions(): Array<{ value: UserRole; label: string }> {
  return Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
    value: value as UserRole,
    label,
  }));
}

// Permissions by action
export const PERMISSIONS = {
  // Item permissions
  'items:create': [UserRole.ADMIN, UserRole.MANAGER],
  'items:read': [UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER],
  'items:update': [UserRole.ADMIN, UserRole.MANAGER],
  'items:delete': [UserRole.ADMIN], // Permanent delete
  'items:soft-delete': [UserRole.ADMIN, UserRole.MANAGER], // Decommission

  // Assignment permissions
  'assignments:create': [UserRole.ADMIN, UserRole.MANAGER],
  'assignments:read': [UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER],
  'assignments:return': [UserRole.ADMIN, UserRole.MANAGER],
  'assignments:transfer': [UserRole.ADMIN, UserRole.MANAGER],

  // Employee permissions
  'employees:read': [UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER],
  'employees:manage': [UserRole.ADMIN, UserRole.MANAGER],

  // Report permissions
  'reports:read': [UserRole.ADMIN, UserRole.MANAGER],
  'reports:export': [UserRole.ADMIN, UserRole.MANAGER],

  // Audit permissions
  'audit:read': [UserRole.ADMIN],

  // User management permissions
  'users:read': [UserRole.ADMIN],
  'users:create': [UserRole.ADMIN],
  'users:update': [UserRole.ADMIN],
  'users:delete': [UserRole.ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[permission]?.includes(role) ?? false;
}
