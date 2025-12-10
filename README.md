# DevOps Node.js Application - Complete Guide

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Local Development Setup

1. **Clone and setup**
```bash
git clone <repository-url>
cd devoperation
cp .env.example .env
npm install
```

2. **Start with Docker Compose**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- Health: http://localhost:3000/api/health

4. **Run tests**
```bash
npm test              # Run all tests with coverage
npm run test:watch   # Run tests in watch mode
npm run lint         # Check code quality
```

---

## Project Structure

```
devoperation/
├── .github/
│   └── workflows/                # CI/CD Pipeline
│       ├── ci-pipeline.yml        # Main CI workflow
│       ├── deploy.yml             # Deployment workflow
│       └── scheduled-tests.yml    # Nightly tests
├── src/
│   ├── __tests__/                 # Test files
│   │   └── users.test.js
│   ├── config/
│   │   └── database.js            # MySQL connection
│   ├── routes/
│   │   ├── users.js               # User endpoints
│   │   └── health.js              # Health check endpoint
│   └── server.js                  # Express app
├── public/
│   ├── index.html                 # Frontend
│   └── app.js                     # Frontend JS
├── Dockerfile                     # Multi-stage build
├── docker-compose.yml             # Local dev environment
├── init.sql                       # Database initialization
├── DEVOPS_ROADMAP.md              # DevOps strategy
├── README.md                      # This file
└── package.json                   # Dependencies & scripts
```

---

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/user-auth develop
```

### 2. Make Changes & Commit
```bash
git add .
git commit -m "feat(users): add user authentication"
```

### 3. Push & Create PR
```bash
git push -u origin feature/user-auth
```

Then create Pull Request on GitHub targeting `develop` branch.

### 4. CI/CD Pipeline Runs Automatically
- ✅ Code linting
- ✅ Unit & integration tests
- ✅ Security scan
- ✅ Docker image build
- ✅ Coverage report

### 5. Code Review & Merge
After approval and all checks pass:
```bash
# GitHub will merge with squash
git checkout develop && git pull
```

---

## Git Workflow Reference

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/updates
- `chore`: Build/dependency updates
- `ci`: CI/CD updates
- `perf`: Performance improvements

**Examples:**
```bash
git commit -m "feat(users): add user registration endpoint"
git commit -m "fix(database): resolve connection pool leak"
git commit -m "test(users): add validation tests"
git commit -m "ci(github): improve workflow performance"
```

### Branch Naming Convention
```
feature/description          # New features
bugfix/description          # Bug fixes
hotfix/description          # Production hotfixes
release/v1.2.0             # Release preparation
```

---

## API Endpoints

### Health Check
```bash
GET /api/health
# Response: { status: 'healthy', timestamp: '2024-01-01T12:00:00Z' }
```

### User Management
```bash
GET /api/users
# Response: [{ id: 1, name: 'John', email: 'john@example.com' }]

POST /api/users
# Body: { name: 'Jane', email: 'jane@example.com' }
# Response: { id: 2, name: 'Jane', email: 'jane@example.com' }
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Testing Strategy

### Unit Tests
Test individual functions and components:
```bash
npm test
```

### Test Coverage
Current target: **80%+**

Coverage breakdown:
- Routes: 85%
- Controllers: 80%
- Utilities: 90%
- Config: 70%

View coverage report:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

### Integration Tests
Test API endpoints with database:
```bash
npm test -- --testPathPattern=users.test.js
```

---

## CI/CD Pipeline

### Stages

#### 1. **Setup** (Parallel)
- Checkout code
- Install dependencies
- Setup Node.js

#### 2. **Lint** (Parallel)
- ESLint checks
- Code style validation

#### 3. **Test** (Parallel)
- Unit tests
- Integration tests
- Coverage report
- MySQL service provided

#### 4. **Security** (Parallel)
- npm audit
- Dependency vulnerability scan

#### 5. **Build**
- Multi-stage Docker build
- Image optimization
- Push to registry (main/develop only)

#### 6. **Status Check**
- All jobs must pass
- PR comments with results

### Pipeline Triggers
- **Pull Requests**: feature → develop, develop → main
- **Push**: To main or develop branches
- **Scheduled**: Nightly tests (2 AM UTC)
- **Manual**: Dispatch workflow

### Status Checks

**Required Checks:**
- ✅ Lint
- ✅ Test
- ✅ Build

**Optional Checks:**
- ℹ️ Security (warnings don't block)
- ℹ️ Coverage report

---

## Docker & Containerization

### Build Image Locally
```bash
docker build -t devops-app:latest .
```

### Image Optimization
- **Base**: Alpine Linux (5MB vs 70MB standard)
- **Multi-stage**: Separate build and runtime
- **No root**: App runs as node user
- **Size target**: < 150MB

### Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health')"
```

Health check status:
```bash
docker ps  # Look for "healthy" or "unhealthy" status
```

---

## Deployment

### Local Development
```bash
docker-compose up -d
```

Services:
- **App**: http://localhost:3000
- **MySQL**: localhost:3306
- **Database**: devops_db

### Staging Deployment
Automatic on push to `develop`:
1. Built by CI/CD
2. Deployed to staging environment
3. Available at https://staging.example.com

### Production Deployment
Automatic on push to `main`:
1. Built by CI/CD
2. Requires all checks to pass
3. Deployed to production
4. Available at https://app.example.com
5. Rollback available via previous image tags

### Manual Deployment
```bash
# Pull latest code
git pull origin main

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check health
curl http://localhost:3000/api/health

# View logs
docker-compose logs -f app
```

---

## Monitoring & Logs

### Docker Logs
```bash
# App logs
docker-compose logs app

# MySQL logs
docker-compose logs mysql

# Follow logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Health Monitoring
```bash
# Check container health
docker ps

# Detailed container info
docker inspect <container-name>

# Resource usage
docker stats
```

### Application Metrics
The application exports metrics ready for:
- Prometheus scraping
- Grafana dashboards
- ELK stack integration
- CloudWatch

---

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs app

# Verify MySQL is ready
docker-compose logs mysql

# Rebuild container
docker-compose down
docker-compose up -d --build
```

### Database connection error
```bash
# Check MySQL is running
docker-compose ps

# Test connection
docker exec -it devoperation-mysql-1 \
  mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1"

# Reset database
docker-compose down -v
docker-compose up -d
```

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Or change in docker-compose.yml
# ports:
#   - "3001:3000"
```

### Tests failing
```bash
# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- users.test.js

# Debug mode
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

---

## Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files
- ✅ Use `.env.example` for documentation
- ✅ Rotate secrets regularly
- ✅ Different passwords for each environment

### Container Security
- ✅ Run as non-root user
- ✅ Use minimal base images
- ✅ Regular vulnerability scans
- ✅ Security updates in CI/CD

### Code Security
- ✅ ESLint with security rules
- ✅ npm audit in CI/CD
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (parameterized queries)

### Database Security
- ✅ Strong root passwords
- ✅ Least privilege principles
- ✅ Network isolation (Docker networks)
- ✅ Regular backups

---

## Performance Optimization

### Response Time Targets
| Endpoint | Target | Current |
|----------|--------|---------|
| GET /api/users | < 100ms | - |
| POST /api/users | < 200ms | - |
| GET /api/health | < 50ms | - |

### Optimization Techniques
- Connection pooling (10 connections)
- Query optimization
- Response caching headers
- Gzip compression
- CDN for static assets

### Load Testing
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test health endpoint
ab -n 1000 -c 100 http://localhost:3000/api/health

# Test users endpoint
ab -n 1000 -c 100 http://localhost:3000/api/users
```

---

## Version Management

### Semantic Versioning
```
MAJOR.MINOR.PATCH
1.2.3

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes
```

### Release Process
1. Update version in `package.json`
2. Create release branch: `git checkout -b release/v1.2.0 develop`
3. Update CHANGELOG
4. Merge to `main` with version tag
5. Merge back to `develop`
6. Deploy from tag

---

## Rollback Procedures

### Quick Rollback
```bash
# Get previous image versions
docker images | grep devops-app

# Stop current container
docker-compose down

# Update docker-compose.yml to use previous version
# Then restart
docker-compose up -d
```

### Data Safety
- Database migrations are backward compatible
- No schema changes without migration scripts
- Regular backups before deployments

### Verification
```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Verify database connection
curl http://localhost:3000/api/users

# Monitor logs
docker-compose logs -f app
```

---

## Contributing Guidelines

1. **Fork** the repository
2. **Create** feature branch from `develop`
3. **Commit** with descriptive messages
4. **Push** to your fork
5. **Create Pull Request** to `develop`
6. **Pass all CI checks**
7. **Get code review approval**
8. **Merge with squash**

---

## Support & Documentation

- **DevOps Roadmap**: See `DEVOPS_ROADMAP.md`
- **API Documentation**: See endpoint comments in `src/routes/`
- **Database Schema**: See `init.sql`
- **CI/CD Workflows**: See `.github/workflows/`

---

## License

This project is part of DevOps implementation and follows MIT license.

---

## Contact & Issues

For issues or questions:
1. Check existing issues on GitHub
2. Create new issue with detailed description
3. Include logs, error messages, environment info
4. Tag with appropriate labels

Last Updated: 2024
