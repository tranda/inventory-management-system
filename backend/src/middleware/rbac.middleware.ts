// RBAC Middleware - Constitution Art. 5.2: Role-based access control
// Enforces permission checks based on user roles

import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from './error.middleware.js';
import type { UserRole } from '@shared/types/user.types.js';

// =============================================================================
// Permission Definitions (Constitution Art. 5.2)
// =============================================================================

/**
 * Role hierarchy (higher roles inherit lower role permissions):
 * - ADMIN: Full system access
 * - MANAGER: Add/edit items, assign/return, view reports
 * - VIEWER: Read-only, own assignments only
 */

export type Permission =
  // Item permissions
  | 'items:read'
  | 'items:create'
  | 'items:update'
  | 'items:delete'
  | 'items:bulk-delete'
  | 'items:decommission'
  // Assignment permissions
  | 'assignments:read'
  | 'assignments:read:own'
  | 'assignments:create'
  | 'assignments:return'
  | 'assignments:transfer'
  // Employee permissions
  | 'employees:read'
  | 'employees:create'
  | 'employees:update'
  | 'employees:delete'
  | 'employees:deactivate'
  // User permissions
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  // Report permissions
  | 'reports:read'
  | 'reports:export'
  // Audit permissions
  | 'audit:read'
  // Dashboard permissions
  | 'dashboard:read';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // All permissions
    'items:read',
    'items:create',
    'items:update',
    'items:delete',
    'items:bulk-delete',
    'items:decommission',
    'assignments:read',
    'assignments:read:own',
    'assignments:create',
    'assignments:return',
    'assignments:transfer',
    'employees:read',
    'employees:create',
    'employees:update',
    'employees:delete',
    'employees:deactivate',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'reports:read',
    'reports:export',
    'audit:read',
    'dashboard:read',
  ],
  MANAGER: [
    // Item management
    'items:read',
    'items:create',
    'items:update',
    'items:decommission',
    // Assignment management
    'assignments:read',
    'assignments:read:own',
    'assignments:create',
    'assignments:return',
    'assignments:transfer',
    // Employee view
    'employees:read',
    'employees:create',
    'employees:update',
    // Reports
    'reports:read',
    'reports:export',
    // Dashboard
    'dashboard:read',
  ],
  VIEWER: [
    // Read-only access
    'items:read',
    'assignments:read:own',
    'employees:read',
    'dashboard:read',
  ],
};

// =============================================================================
// Permission Checking Utilities
// =============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

// =============================================================================
// RBAC Middleware
// =============================================================================

/**
 * Middleware that requires the user to have a specific permission.
 * Must be used after requireAuth middleware.
 *
 * @example
 * router.post('/items', requireAuth, requirePermission('items:create'), createItem);
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      next(new ForbiddenError(`Missing required permission: ${permission}`));
      return;
    }

    next();
  };
}

/**
 * Middleware that requires the user to have ALL of the specified permissions.
 * Must be used after requireAuth middleware.
 *
 * @example
 * router.delete('/items/:id', requireAuth, requireAllPermissions(['items:read', 'items:delete']), deleteItem);
 */
export function requireAllPermissions(permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    const missingPermissions = permissions.filter((p) => !hasPermission(req.user!.role, p));

    if (missingPermissions.length > 0) {
      next(new ForbiddenError(`Missing required permissions: ${missingPermissions.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * Middleware that requires the user to have ANY of the specified permissions.
 * Must be used after requireAuth middleware.
 *
 * @example
 * router.get('/reports', requireAuth, requireAnyPermission(['reports:read', 'audit:read']), getReports);
 */
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      next(new ForbiddenError(`Requires one of: ${permissions.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * Middleware that requires the user to have a specific role.
 * Must be used after requireAuth middleware.
 *
 * @example
 * router.post('/users', requireAuth, requireRole('ADMIN'), createUser);
 */
export function requireRole(role: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (req.user.role !== role) {
      next(new ForbiddenError(`Requires ${role} role`));
      return;
    }

    next();
  };
}

/**
 * Middleware that requires the user to have one of the specified roles.
 * Must be used after requireAuth middleware.
 *
 * @example
 * router.get('/audit', requireAuth, requireAnyRole(['ADMIN', 'MANAGER']), getAuditLogs);
 */
export function requireAnyRole(roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Requires one of these roles: ${roles.join(', ')}`));
      return;
    }

    next();
  };
}
