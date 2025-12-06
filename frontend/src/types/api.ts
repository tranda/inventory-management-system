// API Types - Constitution Art. 4.2: Consistent response format

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Meta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationError[];
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface Meta {
  pagination?: Pagination;
  [key: string]: unknown;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  meta: {
    pagination: Pagination;
    [key: string]: unknown;
  };
}

// Query parameters for list endpoints
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
