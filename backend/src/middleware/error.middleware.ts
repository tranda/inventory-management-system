// Error Middleware - Constitution Art. 7.1: Centralized error handling
// All errors flow through this middleware for consistent API responses

import type { Request, Response, NextFunction } from 'express';
import type { ApiError, ValidationError } from '@shared/types/api.types.js';

// =============================================================================
// Custom Error Classes (Constitution Art. 7.1)
// =============================================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: ValidationError[];

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: ValidationError[],
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: ValidationError[]) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationErrorClass extends AppError {
  constructor(details: ValidationError[]) {
    super('Validation failed', 422, 'VALIDATION_ERROR', details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR', undefined, false);
  }
}

// =============================================================================
// Error Middleware Handler
// =============================================================================

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  } else {
    // In production, only log non-operational errors (unexpected errors)
    if (!(err instanceof AppError) || !err.isOperational) {
      console.error('Unexpected error:', err);
    }
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    const response: ApiError = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      const field = prismaError.meta?.target?.[0] || 'field';
      const response: ApiError = {
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `A record with this ${field} already exists`,
        },
      };
      res.status(409).json(response);
      return;
    }

    if (prismaError.code === 'P2025') {
      // Record not found
      const response: ApiError = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
      };
      res.status(404).json(response);
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const response: ApiError = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response: ApiError = {
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    };
    res.status(401).json(response);
    return;
  }

  // Handle unknown errors - Constitution Art. 7.1: Don't expose internal details
  const response: ApiError = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
    },
  };
  res.status(500).json(response);
}
