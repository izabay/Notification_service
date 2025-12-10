# CI/CD Pipeline Documentation

## Overview
This project uses GitHub Actions for continuous integration and continuous deployment (CI/CD). The pipeline is triggered on pull requests, pushes, and scheduled intervals.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Event Triggered                        │
│     (PR, Push to main/develop, Schedule)               │
└──────────────────────────┬──────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
         ┌──────▼────────┐      ┌─────▼──────┐
         │   Setup       │      │   Setup    │
         │   (Parallel)  │      │  (Parallel)│
         └──────┬────────┘      └─────┬──────┘
                │                     │
         ┌──────▼────────────────────▼────┐
         │   Lint    │   Test   │  Sec   │
         │ (Parallel jobs)               │
         └──────┬─────────────────────────┘
                │
         ┌──────▼────────┐
         │   Build       │
         │  (On success) │
         └──────┬────────┘
                │
         ┌──────▼────────┐
         │   Push Image  │
         │ (main/develop)│
         └──────┬────────┘
                │
         ┌──────▼────────┐
         │   Deploy      │
         │ (Automatic)   │
         └───────────────┘
```

## Workflows

### 1. CI Pipeline (`ci-pipeline.yml`)
**Trigger**: Pull Request, Push to main/develop

**Jobs** (run in parallel):
- **Setup**: Install dependencies, cache
- **Lint**: ESLint code quality check
- **Test**: Unit & integration tests with coverage
- **Security**: npm audit, vulnerability scan
- **Build**: Multi-stage Docker build
- **Status**: Overall pipeline check

**Duration**: ~5-10 minutes

**Success Criteria**:
- ✅ All linting passes
- ✅ Test coverage ≥ 80%
- ✅ All tests pass
- ✅ No critical vulnerabilities
- ✅ Docker image builds successfully

**Outputs**:
- Coverage report (uploaded as artifact)
- Docker image (tagged with commit SHA, pushed for main/develop)
- Test results (commented on PR)

### 2. Deploy Workflow (`deploy.yml`)
**Trigger**: CI Pipeline completion on main/develop branches

**Stages**:
1. Determine target environment (staging/production)
2. Pull latest image from registry
3. Update deployment configuration
4. Run health checks
5. Configure monitoring/alerting
6. Notify team on Slack

**Environments**:
- **develop** → **staging** environment
- **main** → **production** environment

**Approval Gate**: Production deployments require manual approval (future enhancement)

### 3. Scheduled Tests (`scheduled-tests.yml`)
**Trigger**: Daily at 2 AM UTC, manual dispatch

**Purpose**: Nightly regression testing and performance analysis

**Jobs**:
- Full test suite with coverage
- Performance benchmarks
- Long-running integration tests
- Memory leak detection

**Outputs**: Stored for 30 days

## Configuration Details

### GitHub Actions Setup

#### Secrets Required
Add these to GitHub Settings → Secrets:

```
SLACK_WEBHOOK          # Slack channel webhook for notifications
DOCKER_REGISTRY_TOKEN  # Token for pushing to docker registry
```

#### Environment Variables
```yaml
NODE_VERSION: '18'
REGISTRY: 'ghcr.io'
IMAGE_NAME: '${{ github.repository }}'
```

### Job Dependencies
```
┌─ lint ─┐
│        ├─ build ─ deploy
├─ test  ┤
└─ security ┘
```

Jobs run in parallel until build stage, which waits for all previous jobs.

## Key Features

### 1. Caching
- **Dependencies**: npm packages cached to speed up installs
- **Docker layers**: Multi-stage builds leverage layer caching
- **GitHub Actions**: Uses gha cache backend

Cache hit example:
```
✅ Hit npm dependencies cache (saved ~30s)
✅ Hit Docker layer cache (saved ~2m)
```

### 2. Service Containers
MySQL service available during test runs:
```yaml
services:
  mysql:
    image: mysql:8.0
    env:
      MYSQL_ROOT_PASSWORD: test123
      MYSQL_DATABASE: devops_db_test
    options:
      --health-cmd="mysqladmin ping"
      --health-interval=10s
```

### 3. Artifact Uploads
```
Coverage reports    → 30-day retention
Audit reports       → 30-day retention
Test results        → 30-day retention
```

Access artifacts: GitHub Actions → Workflow → Artifacts

### 4. PR Comments
Pipeline automatically comments on PRs with:
- ✅/❌ Status of each job
- 📊 Coverage report
- ⚠️ Warnings or issues
- 🔗 Links to detailed logs

### 5. Status Checks
Required checks prevent merge:
- Lint: Must pass
- Test: Must pass
- Build: Must pass (if applicable)

Optional checks:
- Security: Advisory only (warnings don't block)
- Coverage: Advisory only (below 80% doesn't block)

### 6. Docker Image Management

**Image Tagging Strategy**:
```
ghcr.io/username/devoperation:latest           # Latest on default branch
ghcr.io/username/devoperation:main-sha12abc    # Feature branch + commit
ghcr.io/username/devoperation:develop-sha34def # Develop branch
ghcr.io/username/devoperation:v1.2.0           # Release tags
```

**Registry**: GitHub Container Registry (ghcr.io)
- Free for public repositories
- Integrated with GitHub authentication

## Workflow Monitoring

### View Pipeline Status
1. **GitHub UI**: Repository → Actions → Select workflow
2. **PR Checks**: Pull request → Checks tab
3. **Commit Status**: Commit history → Status indicator
4. **Badge**: Add to README for public status

### Troubleshooting Failed Pipelines

**1. Lint Failures**
```bash
# Run locally
npm run lint

# Fix automatically
npx eslint src/ --fix
```

**2. Test Failures**
```bash
# Run locally with same config
NODE_ENV=test npm test

# Check test output
npm test -- --verbose
```

**3. Build Failures**
```bash
# Build docker image locally
docker build -t test:latest .

# Check build output
docker build --progress=plain -t test:latest .
```

**4. Security Scan Failures**
```bash
# Check vulnerabilities
npm audit

# Fix if available
npm audit fix

# Or update manually
npm update package-name --depth=deep
```

**5. Deployment Failures**
```bash
# Check deployment logs
docker-compose logs app

# Verify health endpoint
curl http://localhost:3000/api/health
```

## Performance Optimization

### Current Timings
| Stage | Duration | Status |
|-------|----------|--------|
| Setup | 30s | Cached |
| Lint | 20s | Parallel |
| Test | 90s | Parallel + MySQL |
| Security | 45s | Parallel |
| Build | 120s | Cached layers |
| **Total** | **5-6 min** | ✅ |

### Optimization Tips

1. **Use cache effectively**
```yaml
cache:
  npm: 'npm'  # Automatic cache of node_modules
```

2. **Run jobs in parallel**
```yaml
jobs:
  lint:  # Runs with test simultaneously
  test:  # Runs with lint simultaneously
  build: # Waits for lint, test, security
```

3. **Reduce Docker image size**
- Alpine base (5MB vs 70MB)
- Multi-stage builds
- Remove dev dependencies
- Target: < 150MB final image

4. **MySQL health check**
```bash
# Wait for MySQL before tests
until mysqladmin ping -h"127.0.0.1" -u"root" -p"test123"; do
  sleep 1
done
```

## Notifications

### Slack Integration
Failed builds notify Slack channel:
```yaml
- name: Notify Slack on failure
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "❌ Build failed"
      }
```

### Email Notifications
Configured in GitHub Settings:
- Push notifications on every workflow
- Pull request notifications
- Deployment status notifications

### GitHub Notifications
- Check suites pass/fail
- Deployment status
- Review requests

## Advanced Features

### Conditional Workflows

**Run only on main branch**:
```yaml
if: github.ref == 'refs/heads/main'
```

**Run only on pull requests**:
```yaml
if: github.event_name == 'pull_request'
```

**Skip workflow for certain commits**:
```
[skip ci] in commit message
```

### Matrix Builds
Test multiple versions:
```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]
```

### Scheduled Workflows
Run at specific times:
```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

## Maintenance

### Regular Tasks
- [ ] Update Node.js version (quarterly)
- [ ] Update dependencies (monthly)
- [ ] Review and update timeout values
- [ ] Check artifact disk usage
- [ ] Monitor action marketplace for updates

### Cleanup
```bash
# Delete old workflow runs
GitHub Settings → Actions → Storage

# Remove old artifacts (30-day retention)
Automatic cleanup via retention settings
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)
- [Best Practices](https://docs.github.com/en/actions/guides)

## Examples

### Run workflow manually
```bash
# Trigger scheduled workflow
GitHub Actions → workflow_name → Run workflow
```

### Debug workflow
```yaml
- name: Debug info
  run: |
    echo "Branch: ${{ github.ref }}"
    echo "Event: ${{ github.event_name }}"
    echo "Commit: ${{ github.sha }}"
```

### Skip step conditionally
```yaml
- name: Run tests
  if: success()  # Only if previous steps succeeded
  run: npm test
```
