# Git Workflow & Branching Strategy

## Overview
This project uses **Git Flow** workflow with protected branches and automated CI/CD checks.

## Branch Protection Rules

### Main Branch (`main`)
**Purpose**: Production-ready code
- ✅ Requires pull request reviews
- ✅ Requires status checks to pass
- ✅ Requires up-to-date branches
- ✅ Dismiss stale reviews
- ✅ Require code owner review
- ✅ Restrict who can push: Admins only

### Develop Branch (`develop`)
**Purpose**: Integration branch for next release
- ✅ Requires pull request reviews
- ✅ Requires status checks to pass
- ✅ Merge method: Squash & merge

## Branch Types

### Feature Branches
```
Pattern: feature/<description>
Example: feature/user-auth
         feature/user-profile-page
         feature/payment-integration

From: develop
Into: develop (via PR)
Delete after merge: Yes
```

### Bug Fix Branches
```
Pattern: bugfix/<description>
Example: bugfix/login-crash
         bugfix/null-pointer
         bugfix/memory-leak

From: develop
Into: develop (via PR)
Delete after merge: Yes
```

### Release Branches
```
Pattern: release/v<version>
Example: release/v1.2.0
         release/v1.3.0

From: develop
Into: main (with tag) + develop
Delete after merge: Yes
```

### Hotfix Branches
```
Pattern: hotfix/<description>
Example: hotfix/security-patch
         hotfix/critical-bug

From: main
Into: main (with tag) + develop
Delete after merge: Yes
Urgency: Immediate (out of release cycle)
```

## Workflow Examples

### Feature Development
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/user-auth

# 2. Make commits with proper messages
git add src/routes/auth.js
git commit -m "feat(auth): add login endpoint"

git add src/routes/auth.js
git commit -m "test(auth): add login tests"

# 3. Push to remote
git push -u origin feature/user-auth

# 4. Create Pull Request on GitHub
# - Title: Feature: User Authentication
# - Description: Explain what this feature does
# - Link to issue if applicable

# 5. Address code review comments
git add .
git commit -m "refactor(auth): improve error handling (review feedback)"
git push origin feature/user-auth

# 6. After approval, merge is done via GitHub UI
# Merge method: Squash & merge

# 7. Delete feature branch locally
git checkout develop
git pull origin develop
git branch -d feature/user-auth

# 8. Delete remote branch
git push origin --delete feature/user-auth
```

### Release Process
```bash
# 1. Create release branch when ready to release
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Update version numbers
# Update package.json version: "version": "1.2.0"
# Update CHANGELOG.md with release notes

git add package.json CHANGELOG.md
git commit -m "chore(release): bump version to 1.2.0"

# 3. Create PR to main for final review
git push -u origin release/v1.2.0

# 4. After approval, merge to main and tag
# On GitHub, merge release/v1.2.0 into main
# Then tag: git tag -a v1.2.0 -m "Release version 1.2.0"

# 5. Merge back into develop
git checkout develop
git pull origin develop
git merge --no-ff release/v1.2.0
git push origin develop

# 6. Delete release branch
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0

# 7. Verify deployment
# CI/CD automatically deploys main branch
# Monitor at https://app.example.com
```

### Hotfix for Production Bug
```bash
# 1. Create hotfix from main (not develop!)
git checkout main
git pull origin main
git checkout -b hotfix/security-patch

# 2. Fix the issue and test thoroughly
git add src/security/fix.js
git commit -m "fix(security): patch authentication vulnerability"

# 3. Push and create PR to main
git push -u origin hotfix/security-patch

# 4. After approval, merge to main with tag
# Merge hotfix/security-patch into main
# Tag with incremented patch version

# 5. Merge back into develop
git checkout develop
git pull origin develop
git merge --no-ff hotfix/security-patch
git push origin develop

# 6. Delete hotfix branch
git branch -d hotfix/security-patch
git push origin --delete hotfix/security-patch
```

## Commit Message Guidelines

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, missing semicolons, etc)
- `refactor`: Code refactoring without feature/fix changes
- `test`: Adding or updating tests
- `chore`: Dependency updates, build scripts, etc
- `ci`: CI/CD workflow changes
- `perf`: Performance improvements

### Scope
Short scope of what's being changed:
- `users`: User-related changes
- `auth`: Authentication changes
- `database`: Database schema/config
- `api`: API endpoint changes
- `docker`: Docker/container changes
- `ci`: CI/CD pipeline changes
- etc.

### Subject
- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period (.) at the end
- Max 50 characters

### Body (Optional)
- Explain **what** and **why**, not **how**
- Wrap at 72 characters
- Separate from subject with blank line

### Footer (Optional)
Reference issues:
```
Fixes #123
Relates to #456
```

### Examples

✅ Good commit messages:
```
feat(users): add user registration endpoint

Add new POST /api/users endpoint to handle user registration.
Validates email format and ensures unique email constraint.

Fixes #123
```

```
fix(database): resolve connection pool leak

The connection pool wasn't properly releasing connections
after queries completed, causing pool exhaustion over time.
Now explicitly call connection.release() after each query.

Fixes #456
```

```
test(users): add validation tests for registration

Add comprehensive test suite for user registration endpoint
covering both valid and invalid input scenarios.
```

❌ Bad commit messages:
```
Fixed stuff
Updated code
WIP
asdf
feat: this is too long and should not be written like this because it contains too much information
```

## Pull Request Checklist

Before creating a PR:
- [ ] Branch created from correct base branch
- [ ] Branch name follows convention (feature/bugfix/hotfix)
- [ ] All tests pass locally: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Code coverage meets threshold (80%+)
- [ ] No console.log or debug code
- [ ] No sensitive data in commits
- [ ] Commit messages follow standards
- [ ] Documentation updated if needed
- [ ] .gitignore checked for new files

PR description template:
```markdown
## Description
Brief description of changes

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Breaking change

## Testing
How to test these changes

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] All checks passing

## Related Issues
Fixes #123
```

## Merge Strategies

### Feature/Bugfix Branches → Develop
**Strategy**: Squash & merge
- Combines all commits into one
- Keeps develop history clean
- Preserves commit message as PR description

### Release/Hotfix Branches → Main
**Strategy**: Create a merge commit
- Preserves branch history
- Tagged with version number
- Full audit trail

### Main → Develop (after hotfix/release)
**Strategy**: Fast-forward if possible
- Keeps develop in sync with main
- No merge commits if possible

## Git Commands Reference

```bash
# Setup local git hooks
git config core.hooksPath .githooks

# View branch history
git log --graph --oneline --all

# Stash work-in-progress
git stash
git stash pop

# Rebase develop into feature branch
git checkout feature/my-feature
git rebase develop

# Interactive rebase to squash commits
git rebase -i HEAD~3

# Reset changes (careful!)
git reset --soft HEAD~1    # Undo last commit, keep changes
git reset --hard HEAD~1    # Undo last commit, discard changes

# View unpushed commits
git log origin/main..HEAD

# Sync feature branch with develop
git fetch origin
git rebase origin/develop
git push --force-with-lease origin feature/my-feature
```

## Troubleshooting

### Accidentally committed to main
```bash
git reset --soft HEAD~1
git checkout -b feature/my-feature
git commit -m "feat: properly formatted message"
```

### Need to undo last commit
```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard everything
git reset --hard HEAD~1
```

### Feature branch is behind develop
```bash
git fetch origin
git rebase origin/develop
git push --force-with-lease origin feature/my-feature
```

### Merge conflicts
```bash
# During merge/rebase
# 1. Manually resolve conflicts in your editor
# 2. Mark as resolved
git add <resolved-file>

# Continue rebase
git rebase --continue

# Or during merge
git merge --continue
```

---

## References
- [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
