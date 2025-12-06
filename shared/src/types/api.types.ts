// API types for IT Inventory Management System
// Constitution Art. 4.2: Consistent response format

/**
 * Standard API success response format per Constitution Art. 4.2
 */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Meta;
}

/**
 * Standard API error response format per Constitution Art. 4.2
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationError[];
  };
}

/**
 * Validation error detail
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Pagination metadata
 */
export interface Meta {
  total: number;
  page?: number;
  limit?: number;
  cursor?: string | null;
  hasMore: boolean;
}

/**
 * Common pagination query parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * Standard error codes
 */
export const ErrorCode = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Authorization errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business logic errors
  ITEM_NOT_AVAILABLE: 'ITEM_NOT_AVAILABLE',
  ITEM_ALREADY_ASSIGNED: 'ITEM_ALREADY_ASSIGNED',
  ASSIGNMENT_NOT_ACTIVE: 'ASSIGNMENT_NOT_ACTIVE',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  EMPLOYEE_INACTIVE: 'EMPLOYEE_INACTIVE',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // File errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Type guard for API success response
 */
export function isApiSuccess<T>(response: ApiResponse<T> | ApiError): response is ApiResponse<T> {
  return response.success === true;
}

/**
 * Type guard for API error response
 */
export function isApiError(response: ApiResponse | ApiError): response is ApiError {
  return response.success === false;
}
