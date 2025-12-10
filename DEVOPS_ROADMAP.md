# DevOps Roadmap - Node.js + MySQL Application

## Overview
This document outlines the DevOps implementation plan for a production-ready Node.js application with MySQL database, Bootstrap frontend, and comprehensive CI/CD pipeline.

---

## Phase 1: Plan

### Application Stack
- **Runtime**: Node.js 18 (Alpine)
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **Frontend**: HTML5 + Bootstrap 5
- **Testing**: Jest, Supertest
- **Container**: Docker & Docker Compose

### Service Reliability Targets
| Metric | Target | Comments |
|--------|--------|----------|
| **Uptime** | 99.5% | ~3.6 hours downtime/month acceptable |
| **Error Budget** | 0.5% | Reserve for maintenance & incidents |
| **API Response Time (p95)** | < 200ms | Excluding database queries |
| **Database Connection Pool** | 10 connections | Configurable per environment |

### Error Budget Policy
- **Monthly Downtime Allowance**: 3.6 hours
- **Planned Maintenance Window**: Sunday 2 AM UTC (30 mins max)
- **Incident Response Time**: < 30 minutes
- **Deployment Rollback Time**: < 15 minutes

### DevOps Tools & Pipeline
```
Local Development 
    ↓
GitHub/Git Repository 
    ↓
GitHub Actions (CI/CD Pipeline)
    ├── Build: Docker image creation
    ├── Test: Unit & Integration tests
    ├── Lint: Code quality checks
    └── Deploy: Container registry push
    ↓
Docker Registry (Docker Hub)
    ↓
Production Deployment (Docker Compose / Kubernetes ready)
    ├── App Container
    ├── MySQL Container
    └── Health Checks
```

### Key Policies
1. **No direct production commits** - Always use feature branches and PRs
2. **Automated testing required** - All PRs must pass tests before merging
3. **Code review requirement** - At least 1 approval needed
4. **Container scanning** - Image scanned for vulnerabilities
5. **Automated notifications** - Failed builds alert team immediately

---

## Phase 2: Code - Git Workflow

### Repository Structure
```
main           # Production-ready code (protected branch)
├── develop    # Integration branch for next release
├── feature/*  # Feature branches (feature/user-auth, feature/dashboard)
├── bugfix/*   # Bug fix branches (bugfix/login-crash)
└── hotfix/*   # Emergency production fixes (hotfix/security-patch)
```

### Branching Strategy (Git Flow)
```
Feature Development:
1. Create feature branch: git checkout -b feature/feature-name develop
2. Work and commit with descriptive messages
3. Push to remote: git push -u origin feature/feature-name
4. Create Pull Request (develop as target)
5. Code review & approval
6. Merge with squash to develop
7. Delete feature branch

Release Process:
1. Create release branch: git checkout -b release/v1.2.0 develop
2. Update version numbers
3. Merge to main with tag
4. Merge back to develop
5. Deploy from main tag

Hotfix (Production Issues):
1. Create hotfix branch: git checkout -b hotfix/security-fix main
2. Fix and test immediately
3. Merge to main and develop
4. Tag and deploy immediately
```

### Commit Message Standards
Format: `<type>(<scope>): <subject>`

**Types**: feat, fix, docs, style, refactor, test, chore, ci, perf
**Scope**: users, auth, database, api, ci, docker, etc.
**Subject**: Clear, present tense, < 50 characters

Examples:
```
feat(users): add user registration endpoint
fix(database): resolve connection pool leak
docs(readme): update deployment instructions
test(users): add validation tests
ci(github): improve workflow performance
```

### Pull Request Checklist
- [ ] Branch created from correct base (develop/main)
- [ ] Tests added and passing
- [ ] No console.log or debug code
- [ ] Code follows ESLint rules
- [ ] Documentation updated
- [ ] Commit messages follow standards
- [ ] No sensitive data in commits

---

## Phase 3: Build - CI/CD Pipeline

### Build Pipeline Stages

#### Stage 1: Trigger (On Pull Request)
```
Event: Push to feature/* or Pull Request to develop/main
```

#### Stage 2: Checkout & Install
```
- Checkout code
- Setup Node.js 18
- Install dependencies (npm ci)
- Cache dependencies for speed
```

#### Stage 3: Code Quality
```
- ESLint: Code style check
- Exit with error if violations found
```

#### Stage 4: Build
```
- Build Docker image with multi-stage approach
- Tag image with commit SHA
- Minimal base image (alpine)
- Remove dev dependencies
- Image size target: < 150MB
```

#### Stage 5: Test
```
- Run unit tests (jest)
- Generate coverage reports (target: 80%+)
- Run integration tests
- Publish test results
```

#### Stage 6: Security & Vulnerability Scan
```
- Scan dependencies with npm audit
- Scan container image
- Block merge if critical vulnerabilities found
```

#### Stage 7: Push to Registry
```
- Push image to Docker Hub/GitHub Container Registry
- Tag with: latest, version, commit-sha
- Available only on main branch
```

### Docker Build Optimization
- **Multi-stage builds**: Separate build and runtime stages
- **Layer caching**: Order Dockerfile commands efficiently
- **Minimal base**: Alpine Linux (5MB vs 70MB+ for standard)
- **No root user**: Run container as non-root
- **Health checks**: Built-in container health verification

### Build Configuration
- **Build time target**: < 5 minutes per commit
- **Artifact retention**: 30 days
- **Parallel execution**: Tests run in parallel
- **Failure notifications**: Slack, Email, GitHub PR comment

---

## Phase 4: Test

### Test Strategy

#### Unit Tests (Jest)
**Target Coverage**: 80%+

Coverage by module:
- Routes: 85%
- Controllers: 80%
- Utilities: 90%
- Config: 70%

Run: `npm test`

#### Integration Tests (Supertest)
**Target**: Critical user workflows
- User registration & authentication
- Data validation
- Database operations
- API error handling

Run: `npm run test:integration`

#### Test Automation in CI
```yaml
trigger: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
    steps:
      - Run tests with coverage
      - Comment PR with coverage report
      - Block merge if < 80% coverage
```

#### Feedback Mechanisms

**Slack Notifications**
```
✅ Build passed: #dev-builds channel
❌ Build failed: @oncall mentioned
📊 Coverage report: Posted in PR comments
```

**Email Notifications**
- Build failures
- Low coverage warnings
- Security vulnerabilities found

**GitHub Integration**
- Status checks on PR
- Required status checks prevent merge
- Detailed logs available in Actions tab

### Test Results
Test results are:
- Published to GitHub PR comments
- Stored as artifacts for 30 days
- Compared against baseline (regression detection)
- Blocked merge if coverage drops

---

## Deployment Strategy

### Environments

#### Development
- Auto-deployed on push to develop
- Lax resource limits
- Debug logging enabled

#### Staging
- Deployed on release branch creation
- Mirrors production config
- Full test suite runs
- Performance testing enabled

#### Production
- Deployed only from main branch tags
- Manual approval gate
- Blue-green deployment
- Automatic rollback on health check failure

### Monitoring & Alerts
- Container health checks every 30 seconds
- Prometheus metrics export ready
- Log aggregation: STDOUT to Docker logs
- Alert on: High memory, High CPU, Failed health checks

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Build time | < 5 min | - |
| Test coverage | > 80% | - |
| Deployment frequency | 1x/day | - |
| Mean time to recovery | < 15 min | - |
| Failed deployments | < 5% | - |
| Uptime | 99.5% | - |

---

## Rollback Procedure

1. **Quick rollback** (< 5 minutes):
   - Revert deployment to previous image version
   - `docker-compose pull && docker-compose up -d`

2. **Data consistency check**:
   - Verify database state
   - No schema changes lost

3. **Health check validation**:
   - API responds on /api/health
   - Database connectivity verified

4. **Notification**:
   - Post to Slack #incidents channel
   - Record incident details for postmortem

---

## Next Steps
1. ✅ Phase 1: Plan (Complete)
2. 🔄 Phase 2: Set up Git workflow & hooks
3. 🔄 Phase 3: Configure GitHub Actions workflows
4. 🔄 Phase 4: Expand test coverage
5. 🔄 Phase 5: Set up monitoring and alerting
