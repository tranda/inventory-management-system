// Authentication test helpers
// Provides JWT token generation and mock auth middleware for testing

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

// =============================================================================
// Types
// =============================================================================

interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  isActive: boolean;
}

// =============================================================================
// Token Generation
// =============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_testing_only';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_for_testing_only';

/**
 * Generate a test access token
 */
export function generateTestAccessToken(user: TestUser): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generate a test refresh token
 */
export function generateTestRefreshToken(user: TestUser): string {
  return jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Generate both tokens for a test user
 */
export function generateTestTokens(user: TestUser) {
  return {
    accessToken: generateTestAccessToken(user),
    refreshToken: generateTestRefreshToken(user),
  };
}

// =============================================================================
// Mock Auth Middleware
// =============================================================================

/**
 * Create a mock auth middleware that injects a test user
 */
export function createMockAuthMiddleware(user: TestUser) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.user = user;
    next();
  };
}

// =============================================================================
// Test Users
// =============================================================================

export const testUsers = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
    isActive: true,
  },
  manager: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'manager@test.com',
    firstName: 'Manager',
    lastName: 'User',
    role: 'MANAGER' as const,
    isActive: true,
  },
  viewer: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'viewer@test.com',
    firstName: 'Viewer',
    lastName: 'User',
    role: 'VIEWER' as const,
    isActive: true,
  },
};

/**
 * Get auth header with bearer token for a test user
 */
export function getAuthHeader(user: TestUser): { Authorization: string } {
  return {
    Authorization: `Bearer ${generateTestAccessToken(user)}`,
  };
}
