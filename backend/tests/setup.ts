// Test setup file - Constitution Art. 3.2: Comprehensive test infrastructure
import { beforeAll, afterAll, afterEach } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/inventory_test';

// Global test setup
beforeAll(async () => {
  // Initialize test database, mocks, etc.
  console.log('Setting up test environment...');
});

// Cleanup after each test
afterEach(async () => {
  // Reset mocks, clear data, etc.
});

// Global test teardown
afterAll(async () => {
  // Close connections, cleanup
  console.log('Tearing down test environment...');
});
