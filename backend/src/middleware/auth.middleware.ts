// Auth Middleware - Constitution Art. 5.1: JWT authentication
// Verifies JWT tokens and attaches user to request

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../app.js';
import { UnauthorizedError } from './error.middleware.js';

// =============================================================================
// Types
// =============================================================================

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  isActive: boolean;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      clientIp?: string;
    }
  }
}

// =============================================================================
// Token Utilities
// =============================================================================

const ACCESS_TOKEN_EXPIRY = '15m'; // Constitution Art. 5.1: 15-minute access tokens
const REFRESH_TOKEN_EXPIRY = '7d'; // Constitution Art. 5.1: 7-day refresh tokens

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }
  return secret;
}

export function generateAccessToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    getJwtRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, getJwtRefreshSecret()) as { userId: string };
}

// =============================================================================
// IP Address Extraction (Constitution Art. 5.4)
// =============================================================================

function extractClientIp(req: Request): string {
  // Check for forwarded headers (behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips.trim();
  }

  // Check for real IP header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fall back to connection remote address
  return req.socket.remoteAddress || 'unknown';
}

// =============================================================================
// Authentication Middleware
// =============================================================================

/**
 * Middleware that requires valid JWT authentication.
 * Extracts token from Authorization header (Bearer scheme) or cookies.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract client IP for audit logging
    req.clientIp = extractClientIp(req);

    // Get token from Authorization header or cookie
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Fetch user from database to ensure they still exist and are active
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
      throw new UnauthorizedError('User account is disabled');
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication middleware.
 * If token is present and valid, attaches user to request.
 * Does not throw error if token is missing or invalid.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    req.clientIp = extractClientIp(req);

    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const payload = verifyAccessToken(token);
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

        if (user?.isActive) {
          req.user = user;
        }
      } catch {
        // Token invalid, continue without user
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}
