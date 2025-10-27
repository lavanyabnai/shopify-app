# Team Collaboration Guide

This guide helps multiple developers work on this Shopify app repository simultaneously without conflicts.

---

## Quick Start for New Team Members

### 1. Clone the Repository

```bash
# Clone the repo
git clone <YOUR_REPO_URL>
cd shopify-app-template-remix

# Install dependencies
npm install

# Set up the database
npm run setup
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials:
# - SHOPIFY_API_KEY (from Partners dashboard)
# - SHOPIFY_API_SECRET (from Partners dashboard)
# - DATABASE_URL (default: file:dev.sqlite)
# - REDIS_URL (optional: redis://localhost:6379)
```

### 3. Start Development

```bash
# Start development server
npm run dev

# In another terminal, run tests
npx tsx test-defcon-calculator.ts
```

### 4. Access the Dashboard

```
http://localhost:<PORT>/app/war-room
```

The port will be shown in the terminal after `npm run dev`.

---

## Current Repository Status

**Branch:** `dashboard-design`
**Main Branch:** Not set (need to configure)
**Status:** BFCM War Room feature complete, testing phase done

**Latest Work:**
- ✅ All 8 BFCM War Room sessions complete
- ✅ Testing Session 5 complete (ROI tracking)
- ✅ Dashboard fixed (inventory snapshots populated)
- ✅ Production build successful
- ✅ All performance targets met

**See:** [BFCM_WAR_ROOM_COMPLETE.md](BFCM_WAR_ROOM_COMPLETE.md) for full feature documentation.

---

## Git Workflow (Best Practices)

### Branch Strategy

We recommend **Git Flow** for this project:

```
main (or master)
  ├── develop (integration branch)
  │   ├── feature/war-room-enhancements
  │   ├── feature/analytics-improvements
  │   └── bugfix/dashboard-zeros
  └── hotfix/critical-production-fix
```

### Current Branches

```bash
# List all branches
git branch -a

# Current branch
dashboard-design (all BFCM War Room work)
```

### Working Simultaneously - Option 1: Feature Branches (Recommended)

**Best for:** Working on different features

```bash
# Developer 1: Works on alerts
git checkout -b feature/alert-enhancements
# Make changes...
git add .
git commit -m "feat: enhance alert notification system"
git push origin feature/alert-enhancements

# Developer 2: Works on ROI
git checkout -b feature/roi-dashboard
# Make changes...
git add .
git commit -m "feat: add ROI visualization charts"
git push origin feature/roi-dashboard
```

**Benefits:**
- ✅ No conflicts between developers
- ✅ Clean, focused commits
- ✅ Easy code reviews via Pull Requests
- ✅ Can merge independently

### Working Simultaneously - Option 2: Personal Branches

**Best for:** Experimental work or personal customization

```bash
# Developer: Lavanya
git checkout -b lavanya/testing-improvements
# Make changes...

# Developer: Colleague
git checkout -b john/performance-optimization
# Make changes...
```

### Working Simultaneously - Option 3: Shared Branch (Not Recommended)

**⚠️ Requires coordination to avoid conflicts**

```bash
# Both developers on dashboard-design
# Developer 1:
git pull origin dashboard-design
# Make changes...
git add .
git commit -m "feat: add feature X"
git push origin dashboard-design

# Developer 2 (MUST pull first!):
git pull origin dashboard-design  # ← IMPORTANT!
# Make changes...
git add .
git commit -m "feat: add feature Y"
git push origin dashboard-design
```

**⚠️ Risk:** Merge conflicts if editing same files

---

## Recommended Workflow

### Setup (One Time)

```bash
# 1. Set up main branch (if not already set)
git checkout -b main
git push -u origin main

# 2. Create develop branch for integration
git checkout -b develop
git push -u origin develop

# 3. Protect main branch on GitHub
# Settings → Branches → Add rule → Require pull request reviews
```

### Daily Workflow

```bash
# 1. Start your day - pull latest changes
git checkout develop
git pull origin develop

# 2. Create feature branch for your work
git checkout -b feature/your-feature-name

# 3. Work on your feature
# ... edit files ...

# 4. Commit regularly with clear messages
git add .
git commit -m "feat: add stockout prediction improvement"

# 5. Push your branch
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub
# - Compare: feature/your-feature-name → develop
# - Request review from teammate
# - Merge after approval

# 7. Update your local develop
git checkout develop
git pull origin develop

# 8. Delete merged feature branch
git branch -d feature/your-feature-name
```

---

## Avoiding Merge Conflicts

### 1. Pull Before You Push

```bash
# ALWAYS pull before starting work
git pull origin develop

# Before pushing
git pull origin develop  # Merge any new changes
git push origin develop
```

### 2. Work on Different Files

**Coordinate with your teammate:**
- Developer 1: Works on [app/routes/app.war-room.alerts.tsx](app/routes/app.war-room.alerts.tsx)
- Developer 2: Works on [app/routes/app.war-room.roi.tsx](app/routes/app.war-room.roi.tsx)

### 3. Use Feature Branches

```bash
# Each developer has their own branch
git checkout -b feature/my-work
# No conflicts possible!
```

### 4. Communicate About Shared Files

**If both need to edit same file:**
- Coordinate timing (one after the other)
- Use fine-grained commits
- Review each other's changes frequently

---

## Handling Merge Conflicts

### When Conflicts Happen

```bash
# Pull latest changes
git pull origin develop

# Git shows conflicts:
# CONFLICT (content): Merge conflict in app/routes/app.war-room.tsx
# Automatic merge failed; fix conflicts and then commit the result.
```

### Resolving Conflicts

```bash
# 1. Open conflicted file
code app/routes/app.war-room.tsx

# 2. Look for conflict markers:
<<<<<<< HEAD
// Your changes
const defconLevel = 4;
=======
// Their changes
const defconLevel = 5;
>>>>>>> develop

# 3. Decide what to keep (or combine both)
const defconLevel = 5; // Keep their version

# 4. Remove conflict markers and save

# 5. Mark as resolved
git add app/routes/app.war-room.tsx

# 6. Complete the merge
git commit -m "merge: resolve conflict in war-room.tsx"

# 7. Push
git push origin feature/my-feature
```

### Prevention Tips

- ✅ Pull frequently (multiple times per day)
- ✅ Use feature branches
- ✅ Keep commits small and focused
- ✅ Communicate about which files you're editing

---

## File Organization (Who Works Where)

### Core Application Files (Coordinate!)
- [app/shopify.server.ts](app/shopify.server.ts) - Auth/session (rarely changed)
- [app/routes/app.tsx](app/routes/app.tsx) - Main layout (rarely changed)
- [prisma/schema.prisma](prisma/schema.prisma) - Database schema ⚠️ **Coordinate!**

### BFCM War Room Routes (Can Split)
- [app/routes/app.war-room.tsx](app/routes/app.war-room.tsx) - Main dashboard (Developer 1)
- [app/routes/app.war-room.alerts.tsx](app/routes/app.war-room.alerts.tsx) - Alerts tab (Developer 2)
- [app/routes/app.war-room.actions.tsx](app/routes/app.war-room.actions.tsx) - Actions tab (Developer 1)
- [app/routes/app.war-room.roi.tsx](app/routes/app.war-room.roi.tsx) - ROI tab (Developer 2)
- [app/routes/app.war-room.simulate.tsx](app/routes/app.war-room.simulate.tsx) - Simulations (Developer 1)

### BFCM War Room Services (Can Split)
- [app/services/defcon-calculator.server.ts](app/services/defcon-calculator.server.ts) - DEFCON logic
- [app/services/alert-engine.server.ts](app/services/alert-engine.server.ts) - Alert logic
- [app/services/action-executor.server.ts](app/services/action-executor.server.ts) - Action execution
- [app/services/roi-tracker.server.ts](app/services/roi-tracker.server.ts) - ROI tracking
- [app/services/simulation-engine.server.ts](app/services/simulation-engine.server.ts) - Simulations

### Test Files (Can Work Independently)
- `test-*.ts` - Each developer can create their own test files

### Documentation (Can Work Independently)
- `*.md` - Each developer can document their work

---

## Database Management

### Running Migrations

**⚠️ Coordinate database changes!**

```bash
# Developer 1: Creates migration
npx prisma migrate dev --name add_new_field

# Commit the migration files
git add prisma/migrations/
git commit -m "feat: add new field to Product model"
git push

# Developer 2: Pulls and applies migration
git pull origin develop
npm run setup  # Applies migrations
```

### Migration Conflicts

**If two developers create migrations at the same time:**

```bash
# 1. One developer's migration takes precedence
# 2. Second developer must:
git pull origin develop
npx prisma migrate resolve --applied <migration-name>
npx prisma migrate dev

# 3. Resolve schema.prisma conflicts manually
```

**Best Practice:** One person manages schema changes per sprint.

---

## Environment Variables

### Each Developer Has Their Own

```bash
# .env file is gitignored - each developer maintains their own

# Developer 1 (.env):
SHOPIFY_API_KEY=dev1_key
DATABASE_URL=file:dev-lavanya.sqlite
REDIS_URL=redis://localhost:6379

# Developer 2 (.env):
SHOPIFY_API_KEY=dev2_key
DATABASE_URL=file:dev-john.sqlite
REDIS_URL=redis://localhost:6380  # Different port!
```

### Shared Environment Template

```bash
# .env.example (committed to git)
SHOPIFY_API_KEY=your_key_here
SHOPIFY_API_SECRET=your_secret_here
DATABASE_URL=file:dev.sqlite
REDIS_URL=redis://localhost:6379
ANALYTICS_API_URL=http://localhost:8000
```

---

## Testing Strategy

### Before Pushing Code

```bash
# 1. Run your specific test
npx tsx test-your-feature.ts

# 2. Run all tests
./run-all-tests.sh

# 3. Build check
npm run build

# 4. Lint check
npm run lint
```

### Test Organization

```bash
# Unit tests - test individual services
test-defcon-calculator.ts
test-roi-tracker.ts

# Integration tests - test service interactions
test-alert-engine.ts
test-action-executor.ts

# E2E tests - test complete workflows
test-war-room-e2e.ts
```

---

## Pull Request Guidelines

### Creating a Good PR

```markdown
## Description
Brief description of what this PR does

## Changes
- Added feature X
- Fixed bug Y
- Updated documentation Z

## Testing
- [ ] All tests passing (./run-all-tests.sh)
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Performance check passed

## Screenshots (if UI changes)
[Add screenshots]

## Related Issues
Closes #123
```

### Reviewing a PR

```bash
# 1. Check out the PR branch
git fetch origin
git checkout feature/teammate-branch

# 2. Run the app
npm run dev

# 3. Test the feature
npx tsx test-related-feature.ts

# 4. Review code on GitHub
# - Check for code quality
# - Suggest improvements
# - Approve or request changes
```

---

## Communication Checklist

### Daily Standup (Async or Sync)

**Each developer shares:**
1. ✅ What I completed yesterday
2. 🎯 What I'm working on today
3. ⚠️ Any blockers or conflicts
4. 📁 Which files I'll be editing

**Example:**
```
Yesterday: ✅ Completed ROI tracker service
Today: 🎯 Building ROI dashboard component
Editing: app/routes/app.war-room.roi.tsx, app/components/ROIChart.tsx
```

### Before Making Large Changes

**Communicate in team chat:**
- "I'm going to refactor the DEFCON calculator today"
- "I need to update the database schema - will create migration"
- "I'm working on app.war-room.tsx for the next 2 hours"

---

## CI/CD Setup (Recommended)

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run setup
      - run: npm run build
      - run: ./run-all-tests.sh
```

**Benefits:**
- ✅ Automatic testing on every push
- ✅ Catch bugs before merging
- ✅ Enforce code quality

---

## Emergency Procedures

### Rolling Back Changes

```bash
# If something breaks in develop:
git revert <commit-hash>
git push origin develop

# Or create hotfix branch:
git checkout -b hotfix/fix-critical-bug
# Fix the bug...
git commit -m "hotfix: fix critical dashboard bug"
git push origin hotfix/fix-critical-bug
# Create PR → merge to main
```

### Database Corruption

```bash
# If database gets corrupted:
# 1. Backup current database
cp prisma/dev.sqlite prisma/dev.sqlite.backup

# 2. Reset database
rm prisma/dev.sqlite
npm run setup

# 3. Re-populate data
npx tsx populate-war-room-data.ts
```

### Stuck in Merge Hell

```bash
# Nuclear option - start fresh from develop:
git stash  # Save your uncommitted changes
git checkout develop
git pull origin develop
git checkout -b feature/my-work-v2
git stash pop  # Restore your changes
```

---

## Tools & Extensions

### Recommended VS Code Extensions

- **GitLens** - Visualize git history
- **Prisma** - Schema autocomplete
- **ESLint** - Code quality
- **Prettier** - Code formatting

### Git Aliases (Optional)

```bash
# Add to ~/.gitconfig
[alias]
  st = status
  co = checkout
  br = branch
  cm = commit -m
  pl = pull origin develop
  ps = push origin HEAD
  lg = log --oneline --graph --decorate
```

---

## Quick Reference Commands

```bash
# Daily routine
git pull origin develop               # Start of day
git checkout -b feature/my-feature    # Create feature branch
git add .                             # Stage changes
git commit -m "feat: description"     # Commit
git push origin feature/my-feature    # Push to GitHub

# Sync with teammate
git fetch origin                      # See all remote branches
git checkout teammate-branch          # Check their work
git pull origin develop               # Get latest develop

# Clean up
git branch -d feature/merged-branch   # Delete local branch
git fetch --prune                     # Clean up remote-tracking branches
```

---

## Getting Help

### Documentation

1. **[START_HERE.md](START_HERE.md)** - Quick start guide
2. **[CLAUDE.md](CLAUDE.md)** - Project overview and architecture
3. **[BFCM_WAR_ROOM_COMPLETE.md](BFCM_WAR_ROOM_COMPLETE.md)** - Feature documentation
4. **[DASHBOARD_FIXED.md](DASHBOARD_FIXED.md)** - Latest fixes and status

### When Stuck

1. Check documentation in the repo
2. Ask your teammate
3. Review recent commits: `git log --oneline -10`
4. Check test files for examples
5. Review error messages in console

---

## Next Claude Session Setup

**For the next developer using Claude Code:**

1. **Clone the repo** (if not already)
2. **Read [CLAUDE.md](CLAUDE.md)** - Full project context
3. **Read [BFCM_WAR_ROOM_COMPLETE.md](BFCM_WAR_ROOM_COMPLETE.md)** - Current feature status
4. **Check git log** - See recent work
5. **Ask Claude to:** "Read CLAUDE.md and summarize current project status"

**Context for Claude:**
- All 8 BFCM War Room sessions complete
- Testing phase complete (Session 5)
- Dashboard issue fixed (inventory snapshots populated)
- Production build successful
- Ready for deployment or next feature

---

## Summary

**Best Practice for Your Team:**

1. ✅ **Use feature branches** - safest, cleanest workflow
2. ✅ **Pull before push** - avoid conflicts
3. ✅ **Communicate daily** - share what files you're editing
4. ✅ **Test before committing** - run tests locally
5. ✅ **Write clear commit messages** - use conventional commits
6. ✅ **Create PRs for review** - code quality and knowledge sharing

**Recommended Workflow:**
```
main branch (production)
  └── develop branch (integration)
      ├── feature/lavanya-work
      └── feature/colleague-work
```

Each developer works on their feature branch, creates PR to develop, reviews each other's code, merges to develop, then periodically merge develop → main for releases.

---

**Need help?** Check the documentation or ask in team chat! 🚀
