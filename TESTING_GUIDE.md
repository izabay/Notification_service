# Testing Guide

## Overview
This project uses **Jest** for unit testing and **Supertest** for API integration testing. Target coverage is **80%+**.

## Test Structure

```
src/
├── __tests__/
│   ├── setup.js           # Test environment setup
│   ├── users.test.js      # User endpoint tests
│   └── integration/
│       ├── users.test.js
│       └── auth.test.js
├── config/
│   ├── database.js
│   └── __mocks__/         # Mock modules
├── routes/
│   └── users.js
└── server.js
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (recommended for development)
```bash
npm run test:watch
```

### Specific Test File
```bash
npm test users.test.js
```

### With Coverage Report
```bash
npm test -- --coverage
```

### Verbose Output
```bash
npm test -- --verbose
```

### Update Snapshots
```bash
npm test -- -u
```

## Test Coverage

### Current Coverage Targets
| Module | Target | Status |
|--------|--------|--------|
| Routes | 85% | 🟡 In progress |
| Controllers | 80% | 🟡 In progress |
| Utils | 90% | 🟡 In progress |
| Config | 70% | 🟡 In progress |
| **Overall** | **80%** | 🟡 In progress |

### View Coverage Report
```bash
# Generate coverage
npm test -- --coverage

# Open HTML report
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

## Writing Tests

### Unit Test Example
```javascript
describe('Utils > calculateTotal', () => {
  test('should sum positive numbers', () => {
    const result = calculateTotal([10, 20, 30]);
    expect(result).toBe(60);
  });

  test('should handle empty array', () => {
    const result = calculateTotal([]);
    expect(result).toBe(0);
  });

  test('should throw on invalid input', () => {
    expect(() => calculateTotal(null)).toThrow();
  });
});
```

### API Integration Test Example
```javascript
describe('Users API', () => {
  describe('POST /api/users', () => {
    test('should create user with valid data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('john@example.com');
    });

    test('should reject invalid email', async () => {
      await request(app)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'invalid'
        })
        .expect(400);
    });
  });
});
```

## Testing Best Practices

### 1. Test Organization
- Group related tests with `describe` blocks
- One assertion per test (when possible)
- Clear test names describing what is tested

### 2. Setup & Teardown
```javascript
beforeAll(async () => {
  // Run once before all tests
  await db.connect();
});

beforeEach(async () => {
  // Run before each test
  await db.clearTestData();
});

afterEach(async () => {
  // Run after each test
  jest.clearAllMocks();
});

afterAll(async () => {
  // Run once after all tests
  await db.disconnect();
});
```

### 3. Mocking
```javascript
// Mock a module
jest.mock('../config/database');

// Mock a function
const mockFetch = jest.fn()
  .mockResolvedValue({ ok: true });

// Mock implementation
jest.spyOn(db, 'query')
  .mockResolvedValue([{ id: 1 }]);
```

### 4. Assertions
```javascript
// Equality
expect(value).toBe(5);
expect(value).toEqual({ id: 1 });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);

// Strings
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');

// Arrays
expect(arr).toContain(element);
expect(arr).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toEqual(expected);

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toThrow();
```

### 5. Async Testing
```javascript
// Using async/await
test('should fetch users', async () => {
  const users = await fetchUsers();
  expect(users).toHaveLength(2);
});

// Using promises
test('should fetch users', () => {
  return fetchUsers().then(users => {
    expect(users).toHaveLength(2);
  });
});

// Using done callback
test('should fetch users', (done) => {
  fetchUsers().then(users => {
    expect(users).toHaveLength(2);
    done();
  });
});
```

## Common Test Scenarios

### Testing API Endpoints
```javascript
describe('GET /api/users/:id', () => {
  test('should return user by id', async () => {
    const response = await request(app)
      .get('/api/users/1')
      .expect(200);

    expect(response.body).toEqual({
      id: 1,
      name: 'John',
      email: 'john@example.com'
    });
  });

  test('should return 404 for non-existent user', async () => {
    await request(app)
      .get('/api/users/99999')
      .expect(404);
  });
});
```

### Testing Error Handling
```javascript
test('should handle database errors gracefully', async () => {
  jest.spyOn(db, 'query')
    .mockRejectedValue(new Error('Connection failed'));

  const response = await request(app)
    .get('/api/users')
    .expect(500);

  expect(response.body).toHaveProperty('error');
});
```

### Testing with Database
```javascript
beforeEach(async () => {
  // Create test data
  await db.query('INSERT INTO users (name, email) VALUES (?, ?)', 
    ['John', 'john@example.com']);
});

afterEach(async () => {
  // Clean up
  await db.query('DELETE FROM users');
});

test('should fetch created user', async () => {
  const response = await request(app).get('/api/users');
  expect(response.body).toHaveLength(1);
});
```

## Coverage Requirements

### Branches
```javascript
function checkAccess(user) {
  if (user.admin) {          // Branch 1
    return true;
  } else {                   // Branch 2
    return false;
  }
}

// Tests needed:
test('should allow admin access', () => {
  expect(checkAccess({ admin: true })).toBe(true);  // Branch 1
});

test('should deny non-admin access', () => {
  expect(checkAccess({ admin: false })).toBe(false); // Branch 2
});
```

### Error Cases
```javascript
test('should validate email format', () => {
  expect(() => validateEmail('invalid')).toThrow();
});

test('should handle null input', () => {
  expect(validateEmail(null)).toBeFalsy();
});
```

### Edge Cases
```javascript
test('should handle empty arrays', () => {
  expect(sum([])).toBe(0);
});

test('should handle negative numbers', () => {
  expect(sum([-10, -20])).toBe(-30);
});

test('should handle large numbers', () => {
  expect(sum([999999999, 1])).toBe(1000000000);
});
```

## CI/CD Integration

### Test Execution
```yaml
- name: Run tests with coverage
  run: npm test -- --coverage --passWithNoTests
```

### Coverage Enforcement
```yaml
- name: Check coverage threshold
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | grep -o '"lines":{[^}]*}' | grep -o '[0-9.]*' | head -1)
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage below 80%: $COVERAGE%"
      exit 1
    fi
```

### PR Comments
Test results are automatically commented on PRs with:
- ✅ Passed tests
- ❌ Failed tests
- 📊 Coverage report

## Troubleshooting

### Tests Timing Out
```bash
# Increase timeout
jest.setTimeout(60000);  // 60 seconds

# Or in package.json
"test": "jest --testTimeout=60000"
```

### Database Connection Issues
```bash
# Ensure MySQL is running
docker-compose ps

# Check connection string in .env.test
DB_HOST=127.0.0.1
DB_PORT=3306
```

### Module Not Found
```bash
# Clear Jest cache
npm test -- --clearCache

# Check import paths
# Use relative paths: ../config/database
# Not: /src/config/database
```

### Mocking Issues
```javascript
// Mock before importing module
jest.mock('../database');

// Or mock after import
jest.doMock('../database', () => ({
  getConnection: jest.fn()
}));
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://jestjs.io/docs/getting-started)
- [Coverage Guidelines](https://istanbul.js.org/)
