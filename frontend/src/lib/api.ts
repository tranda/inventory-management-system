// API Client - Constitution Art. 4.2: Consistent API response handling
// Handles all HTTP requests to the backend

import type { ApiResponse, ApiError, PaginatedResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// =============================================================================
// Types
// =============================================================================

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
  params?: Record<string, string | number | boolean | undefined>;
}

// =============================================================================
// API Client
// =============================================================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Make an HTTP request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { body, params, headers: customHeaders, ...restOptions } = options;

    const url = this.buildUrl(endpoint, params);

    const headers: HeadersInit = {
      ...customHeaders,
    };

    let requestBody: BodyInit | undefined;

    if (body) {
      if (body instanceof FormData) {
        requestBody = body;
        // Don't set Content-Type for FormData - browser will set it with boundary
      } else {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
      credentials: 'include', // Include cookies for auth
      ...restOptions,
    });

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new ApiClientError({
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: `Request failed with status ${response.status}`,
          },
        });
      }
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiClientError(data as ApiError);
    }

    return data as T;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('GET', endpoint, options);
  }

  /**
   * GET request with pagination
   */
  async getPaginated<T>(endpoint: string, options?: RequestOptions): Promise<PaginatedResponse<T>> {
    return this.request<PaginatedResponse<T>>('GET', endpoint, options);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('POST', endpoint, { ...options, body });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('PATCH', endpoint, { ...options, body });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: Record<string, unknown>, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('PUT', endpoint, { ...options, body });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('DELETE', endpoint, options);
  }

  /**
   * Upload file
   */
  async upload<T>(endpoint: string, file: File, fieldName = 'file'): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return this.request<ApiResponse<T>>('POST', endpoint, { body: formData });
  }
}

// =============================================================================
// Error Class
// =============================================================================

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly details?: Array<{ field: string; message: string }>;

  constructor(response: ApiError) {
    super(response.error.message);
    this.name = 'ApiClientError';
    this.code = response.error.code;
    this.details = response.error.details;
  }

  /**
   * Check if error is a specific code
   */
  is(code: string): boolean {
    return this.code === code;
  }

  /**
   * Check if error is unauthorized
   */
  isUnauthorized(): boolean {
    return this.code === 'UNAUTHORIZED' || this.code === 'TOKEN_EXPIRED';
  }

  /**
   * Check if error is forbidden
   */
  isForbidden(): boolean {
    return this.code === 'FORBIDDEN';
  }

  /**
   * Check if error is validation error
   */
  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR';
  }

  /**
   * Get validation error for a specific field
   */
  getFieldError(field: string): string | undefined {
    return this.details?.find((d) => d.field === field)?.message;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const api = new ApiClient(API_BASE_URL);

export default api;
