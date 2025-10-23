# Quick Start Guide for Multi-Session Development

This guide helps you quickly start each development session.

## 🚀 Starting a New Session

### Option 1: Use Ready-Made Prompts (RECOMMENDED)

1. **Open SESSION_PROMPTS.md**
2. **Find the session number** you're working on (Session #2, #3, #4, etc.)
3. **Copy the entire prompt** for that session
4. **Paste it** into Claude Code to start

**Example for Session #2:**
```
Open SESSION_PROMPTS.md → Find "Session #2" → Copy full prompt → Paste into Claude Code
```

The prompt automatically includes:
- ✅ Validation of previous session work
- 🎯 Implementation objectives
- 🧪 Testing requirements
- 📦 Deliverables
- 🔄 Handoff preparation

### Option 2: Manual Start

If you prefer to write your own prompt, include these elements:

```
I'm continuing the analytics dashboard optimization project. This is Session #[NUMBER].

VALIDATION FIRST:
[Copy validation steps from SESSION_PROMPTS.md for your session]

OBJECTIVES:
[Copy objectives from SESSION_PROMPTS.md for your session]

REQUIREMENTS:
- Follow ANALYTICS_OPTIMIZATION_PLAN.md
- Include comprehensive tests
- Update SESSION_STATUS.md when complete

After completion, update SESSION_STATUS.md with results.
```

## 📁 Key Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| **SESSION_PROMPTS.md** | Copy-paste prompts for each session | At start of every session |
| **SESSION_STATUS.md** | Progress tracker | Update during and after each session |
| **CLAUDE.md** | Project context and architecture | Read at start of first session |
| **ANALYTICS_OPTIMIZATION_PLAN.md** | Complete code implementations | Reference during implementation |
| **DASHBOARD_OPTIMIZATION_SUMMARY.md** | Quick architecture reference | When you need to understand the big picture |

## 🔄 Session Flow

```
┌─────────────────────────────────────────┐
│ 1. Open SESSION_PROMPTS.md             │
│    Find your session number             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. Copy full prompt for session         │
│    (includes validation + tasks)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Paste into Claude Code               │
│    Claude validates previous work       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Claude implements features           │
│    Following ANALYTICS_OPTIMIZATION_    │
│    PLAN.md code examples                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. Claude runs comprehensive tests      │
│    Validates everything works           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. Claude updates SESSION_STATUS.md     │
│    Documents results and next steps     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 7. Ready for next session!              │
│    Repeat from step 1                   │
└─────────────────────────────────────────┘
```

## 📊 Session Overview

| Session | Focus | Duration | Key Deliverables |
|---------|-------|----------|------------------|
| **#1** | ✅ Planning | DONE | All documentation created |
| **#2** | Database + Webhooks | 2-3 hours | Schema migrated, webhooks deployed |
| **#3** | Background Sync | 2-3 hours | Sync service, admin UI, data backfill |
| **#4** | Analytics Computation | 2-3 hours | Aggregator service, pre-computed snapshots |
| **#5** | Dashboard Update | 2-3 hours | Optimized dashboard (<2s load) |
| **#6** | Redis Caching (Optional) | 2-3 hours | Cache layer (<500ms load) |

## ✅ Pre-Session Checklist

Before starting each session, verify:

- [ ] You've read SESSION_STATUS.md to see current progress
- [ ] You know which session number you're on
- [ ] Previous session is marked COMPLETE in SESSION_STATUS.md
- [ ] You have the session prompt ready from SESSION_PROMPTS.md

## 🧪 Quick Validation Commands

Run these at the start of each session to check previous work:

```bash
# Check all docs exist
ls -la *.md

# Check database status
npx prisma studio

# Check git status
git status

# View current session status
cat SESSION_STATUS.md | grep "Status:"
```

## 📝 Quick Update Template

After each session, update SESSION_STATUS.md with:

```markdown
## Session #X - [Title]
**Date:** 2025-10-09
**Status:** ✅ COMPLETE

### What Was Completed
- ✅ Phase X implemented
- ✅ Tests passing
- ✅ Performance target met

### Performance Metrics
- Load time: X seconds
- [other relevant metrics]

### Next Session Should Start With
Use Session #[X+1] prompt from SESSION_PROMPTS.md
```

## 🎯 Success Indicators

You'll know the project is progressing well when:

- ✅ Each session's validation steps pass
- ✅ Tests are green
- ✅ Performance improves with each phase
- ✅ SESSION_STATUS.md is up to date
- ✅ No blockers noted for next session

## 🆘 Troubleshooting

**Problem: Validation fails at start of session**
- Review previous session's work in SESSION_STATUS.md
- Check "Issues Encountered" section
- May need to fix previous session before continuing

**Problem: Tests failing**
- Check ANALYTICS_OPTIMIZATION_PLAN.md for correct implementation
- Review test requirements in SESSION_PROMPTS.md
- Document issue in SESSION_STATUS.md

**Problem: Lost context between sessions**
- Read CLAUDE.md for project overview
- Read SESSION_STATUS.md for current progress
- Check "Next Session Should Start With" section

## 📞 Getting Help

If you're stuck:

1. **Check ANALYTICS_OPTIMIZATION_PLAN.md** - Has complete code examples
2. **Check DASHBOARD_OPTIMIZATION_SUMMARY.md** - Has troubleshooting section
3. **Check SESSION_STATUS.md** - See if issue was noted in previous session
4. **Document the blocker** - Update SESSION_STATUS.md with details

## 🎉 Project Complete!

You'll know you're done when:

- ✅ All 6 phases complete in SESSION_STATUS.md
- ✅ Dashboard loads in <2 seconds (or <500ms with Redis)
- ✅ Zero Shopify API calls on page load
- ✅ All tests passing
- ✅ Performance metrics documented

---

**Remember:** Each session prompt in SESSION_PROMPTS.md is designed to be self-contained. Just copy, paste, and let Claude Code do the work!
