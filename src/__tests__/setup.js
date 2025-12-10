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
  error: jest.fn()
};

// Global test timeout
jest.setTimeout(30000);

// Mock timers if needed
// jest.useFakeTimers();

// --- Simple in-memory DB mock to avoid external MySQL dependency during tests ---
const usersStore = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

const mockDb = {
  getConnection: async () => ({
    query: async (sql, params) => {
      // Simple routing based on SQL text used in routes
      if (/SELECT\s+id,\s*name,\s*email\s+FROM\s+users/i.test(sql)) {
        return [usersStore];
      }
      if (/INSERT\s+INTO\s+users/i.test(sql)) {
        const newId = usersStore.length + 1;
        const [name, email] = params;
        usersStore.push({ id: newId, name, email });
        return [{ insertId: newId }];
      }
      return [[]];
    },
    ping: async () => true,
    release: () => {}
  })
};

jest.mock('../config/database', () => mockDb);

// Clean up after all tests
afterAll(async () => {
  // Close database connections
  // await db.closePool();

  // Restore console
  jest.restoreAllMocks();
});
