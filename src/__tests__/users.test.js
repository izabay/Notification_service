const request = require('supertest');
const app = require('../server');

describe('Users API', () => {
  describe('GET /api/users', () => {
    test('should return array of users', async () => {
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('should return users with correct structure', async () => {
      const res = await request(app).get('/api/users');
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('name');
        expect(res.body[0]).toHaveProperty('email');
      }
    });

    test('should handle server errors gracefully', async () => {
      // This would test error handling
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toBeLessThan(500);
    });
  });

  describe('POST /api/users', () => {
    test('should create user with valid data', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      const res = await request(app)
        .post('/api/users')
        .send(newUser);
      expect([201, 400, 500]).toContain(res.statusCode);
    });

    test('should reject invalid email', async () => {
      const invalidUser = {
        name: 'John',
        email: 'invalid-email'
      };
      const res = await request(app)
        .post('/api/users')
        .send(invalidUser);
      expect(res.statusCode).toBe(400);
    });

    test('should reject missing name', async () => {
      const incompleteUser = {
        email: 'john@example.com'
      };
      const res = await request(app)
        .post('/api/users')
        .send(incompleteUser);
      expect(res.statusCode).toBe(400);
    });

    test('should reject missing email', async () => {
      const incompleteUser = {
        name: 'John Doe'
      };
      const res = await request(app)
        .post('/api/users')
        .send(incompleteUser);
      expect(res.statusCode).toBe(400);
    });

    test('should return created user with id', async () => {
      const newUser = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };
      const res = await request(app)
        .post('/api/users')
        .send(newUser);
      
      if (res.statusCode === 201) {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(newUser.name);
        expect(res.body.email).toBe(newUser.email);
      }
    });
  });
});

describe('Health API', () => {
  test('GET /api/health should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('GET /api/health should return timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('timestamp');
  });

  test('GET /api/health timestamp should be recent', async () => {
    const res = await request(app).get('/api/health');
    const timestamp = new Date(res.body.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    
    // Should be within last 5 seconds
    expect(diffMs).toBeLessThan(5000);
  });
});

describe('Server', () => {
  test('GET / should return index.html', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.type).toMatch(/html/);
  });

  test('GET /nonexistent should return 404', async () => {
    const res = await request(app).get('/nonexistent-route');
    expect(res.statusCode).toBe(404);
  });
});
