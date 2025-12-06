// Validation Middleware Tests - Constitution Art. 3.2: Test coverage
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { validate, paginationSchema, uuidSchema } from '../../src/middleware/validation.middleware';
import { ValidationErrorClass } from '../../src/middleware/error.middleware';

// Mock Express request/response
function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as Request;
}

function createMockRes(): Response {
  return {} as Response;
}

describe('Validation Middleware', () => {
  describe('validate()', () => {
    it('should pass with valid body', async () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });

      const middleware = validate({ body: schema });
      const req = createMockReq({
        body: { name: 'Test', email: 'test@example.com' },
      });
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).toEqual({ name: 'Test', email: 'test@example.com' });
    });

    it('should throw ValidationErrorClass with invalid body', async () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });

      const middleware = validate({ body: schema });
      const req = createMockReq({
        body: { name: '', email: 'invalid-email' },
      });
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationErrorClass));
    });

    it('should validate query parameters', async () => {
      const middleware = validate({ query: paginationSchema });
      const req = createMockReq({
        query: { page: '2', limit: '50' },
      });
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query).toEqual({
        page: 2,
        limit: 50,
        sortOrder: 'asc',
      });
    });

    it('should validate URL params', async () => {
      const schema = z.object({ id: uuidSchema });
      const middleware = validate({ params: schema });
      const req = createMockReq({
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid UUID in params', async () => {
      const schema = z.object({ id: uuidSchema });
      const middleware = validate({ params: schema });
      const req = createMockReq({
        params: { id: 'not-a-uuid' },
      });
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationErrorClass));
    });
  });

  describe('Pagination Schema', () => {
    it('should apply default values', () => {
      const result = paginationSchema.parse({});
      expect(result).toEqual({
        page: 1,
        limit: 20,
        sortOrder: 'asc',
      });
    });

    it('should parse string numbers', () => {
      const result = paginationSchema.parse({ page: '5', limit: '100' });
      expect(result.page).toBe(5);
      expect(result.limit).toBe(100);
    });

    it('should reject page less than 1', () => {
      expect(() => paginationSchema.parse({ page: '0' })).toThrow();
    });

    it('should reject limit greater than 100', () => {
      expect(() => paginationSchema.parse({ limit: '101' })).toThrow();
    });
  });
});
