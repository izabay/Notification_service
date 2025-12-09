// Test setup file - runs before all tests
const dotenv = require('dotenv');

// Load test environment
dotenv.config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(30000);

// Mock timers if needed
// jest.useFakeTimers();

// Clean up after all tests
afterAll(async () => {
  // Close database connections
  // await db.closePool();
  
  // Restore console
  jest.restoreAllMocks();
});
