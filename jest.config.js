module.exports = {
  testEnvironment: 'node',
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test setup
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Ignore paths
  testPathIgnorePatterns: [
    '/node_modules/',
    'dist',
    'build'
  ],
  
  // Verbose output
  verbose: true,
  
  // Max workers for parallel execution
  maxWorkers: '50%',
  
  // Timeout for tests (30 seconds)
  testTimeout: 30000,
  
  // Coverage reporting
  coverageReporters: ['text', 'lcov', 'json-summary'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true
};
