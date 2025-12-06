// Test setup and utilities
// Provides test database connection, mocking, and helper functions

import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_testing_only';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Global test setup
beforeAll(async () => {
  // Setup that runs once before all tests
});

afterAll(async () => {
  // Cleanup that runs once after all tests
});

afterEach(() => {
  // Reset mocks after each test
  vi.clearAllMocks();
});
