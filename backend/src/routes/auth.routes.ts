// Auth Routes - Constitution Art. 5.1: JWT authentication
// Handles login, logout, token refresh, and password management

import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../app.js';
import { validate } from '../middleware/validation.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth.middleware.js';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from '../middleware/error.middleware.js';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validators.js';
import { auditLogin, auditLogout, createAuditLog, extractAuditMetadata } from '../services/audit.service.js';
import type { ApiResponse } from '@shared/types/api.types.js';

const router = Router();

// =============================================================================
// POST /auth/login - User login
// =============================================================================

router.post(
  '/login',
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is disabled');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate tokens
      const authenticatedUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as 'ADMIN' | 'MANAGER' | 'VIEWER',
        isActive: user.isActive,
      };

      const accessToken = generateAccessToken(authenticatedUser);
      const refreshToken = generateRefreshToken(user.id);

      // Set HTTP-only cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Audit login
      await auditLogin(req, user.id);

      const response: ApiResponse<{
        user: typeof authenticatedUser;
        accessToken: string;
        refreshToken: string;
      }> = {
        success: true,
        data: {
          user: authenticatedUser,
          accessToken,
          refreshToken,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /auth/logout - User logout
// =============================================================================

router.post(
  '/logout',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Audit logout
      await auditLogout(req);

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Logged out successfully' },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /auth/refresh - Refresh access token
// =============================================================================

router.post(
  '/refresh',
  validate({ body: refreshTokenSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get refresh token from body or cookie
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token required');
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is disabled');
      }

      // Generate new tokens
      const authenticatedUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as 'ADMIN' | 'MANAGER' | 'VIEWER',
        isActive: user.isActive,
      };

      const newAccessToken = generateAccessToken(authenticatedUser);
      const newRefreshToken = generateRefreshToken(user.id);

      // Set new cookies
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const response: ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }> = {
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /auth/me - Get current user
// =============================================================================

router.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const response: ApiResponse<typeof req.user> = {
        success: true,
        data: req.user,
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /auth/change-password - Change current user's password
// =============================================================================

router.post(
  '/change-password',
  requireAuth,
  validate({ body: changePasswordSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      // Get current password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new BadRequestError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // Audit password change
      await createAuditLog({
        entityType: 'User',
        entityId: userId,
        action: 'PASSWORD_CHANGE',
        userId,
        before: null,
        after: null,
        metadata: extractAuditMetadata(req),
      });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Password changed successfully' },
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /auth/register - Register new user (Admin only - for seeding)
// =============================================================================

router.post(
  '/register',
  validate({ body: registerSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestError('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

export { router as authRoutes };
