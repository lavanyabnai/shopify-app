# Session-by-Session Development Prompts

This file contains ready-to-use prompts for each development session. Each prompt includes validation of previous work, implementation tasks, comprehensive testing, and handoff preparation.

---

## 📋 Session #1: Database Schema & Models (CURRENT SESSION - PLANNING COMPLETE)

**Status:** ✅ COMPLETE (Planning phase)

**What was completed:**
- Created implementation plans and documentation
- Prepared Prisma schema models
- Set up multi-session development framework

**Next:** Session #2

---

## 📋 Session #2: Database Schema Implementation & Webhook Setup

**Estimated Time:** 2-3 hours
**Prerequisites:** Planning documents created in Session #1

### Prompt for Session #2

```
I'm continuing the analytics dashboard optimization project for this Shopify Remix app. This is Session #2 of a multi-session development effort.

VALIDATION FIRST - Check previous session work:
1. Verify these files exist:
   - ANALYTICS_OPTIMIZATION_PLAN.md
   - DASHBOARD_OPTIMIZATION_SUMMARY.md
   - prisma/schema.analytics.prisma
   - SESSION_STATUS.md
   - CLAUDE.md (with Active Development Tasks section)

If any files are missing, let me know before proceeding.

SESSION #2 OBJECTIVES:
1. Implement Phase 1: Database Schema
   - Copy models from prisma/schema.analytics.prisma to prisma/schema.prisma
   - Run migration and generate Prisma client
   - Verify schema with Prisma Studio

2. Implement Phase 2: Webhook Integration
   - Create app/routes/webhooks.orders.tsx (complete implementation)
   - Create app/routes/webhooks.products.tsx (complete implementation)
   - Update shopify.app.toml with webhook subscriptions
   - Deploy webhooks to Shopify

3. Write comprehensive tests
   - Unit tests for webhook handlers
   - Integration tests for database operations
   - Mock Shopify webhook payloads for testing

4. Validation & Testing
   - Test webhooks using Shopify CLI triggers
   - Verify data is being saved to database
   - Check error handling

REQUIREMENTS:
- Follow all patterns from ANALYTICS_OPTIMIZATION_PLAN.md
- Use proper TypeScript types
- Implement error handling for all webhook operations
- Add logging for debugging
- Use Prisma transactions where appropriate
- Follow Shopify webhook authentication patterns from app/shopify.server.ts

TESTING REQUIREMENTS:
- Create test webhook payloads (orders and products)
- Test with `shopify webhook trigger` command
- Verify database entries with Prisma Studio
- Test error scenarios (invalid payloads, duplicate orders, etc.)
- Test idempotency (same webhook delivered twice)

DELIVERABLES:
1. Updated prisma/schema.prisma with all new models
2. Migration file created and applied
3. Two webhook handler files with full implementation
4. Updated shopify.app.toml
5. Test results documented
6. SESSION_STATUS.md updated with progress

After completion:
- Update SESSION_STATUS.md with Session #2 results
- Update CLAUDE.md Active Development Tasks (mark Phase 1 & 2 complete)
- Provide clear status for Session #3 handoff
```

**Expected Completion Criteria:**
- [ ] All 5 new Prisma models added to schema
- [ ] Migration successful, verified in Prisma Studio
- [ ] Webhooks deployed and visible in Shopify Partners dashboard
- [ ] Test webhook triggers successfully create database records
- [ ] Error handling tested with invalid payloads
- [ ] Documentation updated

---

## 📋 Session #3: Background Sync Service & Initial Data Backfill

**Estimated Time:** 2-3 hours
**Prerequisites:** Session #2 completed (Database + Webhooks working)

### Prompt for Session #3

```
I'm continuing the analytics dashboard optimization project. This is Session #3.

VALIDATION FIRST - Verify Session #2 completion:
1. Check database schema:
   - Run: npx prisma studio
   - Verify tables exist: Order, OrderLineItem, Product, AnalyticsSnapshot, SyncStatus

2. Check webhook files exist and are deployed:
   - app/routes/webhooks.orders.tsx exists
   - app/routes/webhooks.products.tsx exists
   - Run: shopify app env show (check for webhook URLs)

3. Test webhooks are working:
   - Run: shopify webhook trigger --topic orders/create
   - Check Prisma Studio for new Order record
   - If webhook test fails, we need to fix Session #2 work first

4. Check SESSION_STATUS.md shows Phase 1 & 2 as COMPLETE

If validation fails, debug and fix before proceeding.

SESSION #3 OBJECTIVES:
1. Implement Phase 3: Background Sync Service
   - Create app/services/shopify-sync.server.ts
   - Implement cursor-based pagination for bulk order fetching
   - Add proper rate limiting (500ms between requests)
   - Implement robust error handling and retry logic
   - Add progress tracking

2. Create Admin Sync UI
   - Create app/routes/app.sync.tsx
   - Display sync status (last sync time, total orders, in progress)
   - Add manual sync trigger button
   - Show progress during sync
   - Display sync errors

3. Write comprehensive tests
   - Test pagination logic with mock GraphQL responses
   - Test rate limiting (verify delays between requests)
   - Test error recovery (API errors, timeouts)
   - Test with different data volumes (100, 1000, 5000 orders)

4. Initial Data Backfill
   - Run initial sync with limit of 500 orders (safety first)
   - Verify data quality in database
   - Check for duplicates
   - Validate data transformations

REQUIREMENTS:
- Follow code from ANALYTICS_OPTIMIZATION_PLAN.md Phase 3
- Use the GraphQL query provided (not REST API)
- Implement proper TypeScript types for all functions
- Add detailed logging for monitoring sync progress
- Handle Shopify rate limits gracefully
- Update SyncStatus table throughout the process
- Use Prisma upsert to handle duplicates

TESTING REQUIREMENTS:
- Test with small batch first (50 orders)
- Verify no duplicate orders created
- Test interruption recovery (stop sync midway, restart)
- Test with shop that has no orders
- Test with shop that has 10,000+ orders (pagination)
- Measure sync time for different volumes

DELIVERABLES:
1. app/services/shopify-sync.server.ts (complete implementation)
2. app/routes/app.sync.tsx (admin UI)
3. Test results for different order volumes
4. Performance benchmarks documented
5. SESSION_STATUS.md updated

After completion:
- Document sync performance (orders/second)
- Update SESSION_STATUS.md with Phase 3 status
- Update CLAUDE.md Active Development Tasks
- Note any issues encountered for Session #4
```

**Expected Completion Criteria:**
- [ ] Sync service successfully fetches and stores orders
- [ ] Rate limiting working (500ms between requests)
- [ ] Admin UI shows sync status correctly
- [ ] Can sync 500+ orders without errors
- [ ] SyncStatus table updated correctly
- [ ] No duplicate orders in database
- [ ] Performance documented (e.g., "500 orders in 4 minutes")

---

## 📋 Session #4: Analytics Pre-computation & Aggregation

**Estimated Time:** 2-3 hours
**Prerequisites:** Session #3 completed (Database populated with real order data)

### Prompt for Session #4

```
I'm continuing the analytics dashboard optimization project. This is Session #4.

VALIDATION FIRST - Verify Session #3 completion:
1. Check database has order data:
   - Run: npx prisma studio
   - Verify Order table has records (at least 100 orders)
   - Check OrderLineItem table has line items
   - Verify SyncStatus table shows lastOrderSync timestamp

2. Test sync service:
   - Navigate to /app/sync in the running app
   - Verify UI shows sync status
   - Check "Last sync" shows recent timestamp
   - Verify "Total orders" count is > 0

3. Check app/services/shopify-sync.server.ts exists and has:
   - syncOrdersFromShopify function
   - Cursor-based pagination
   - Rate limiting logic

4. Check SESSION_STATUS.md shows Phase 3 as COMPLETE

If validation fails, we need to complete Session #3 first.

SESSION #4 OBJECTIVES:
1. Implement Phase 4: Analytics Pre-computation Service
   - Create app/services/analytics-aggregator.server.ts
   - Implement generateDailyAnalytics function
   - Calculate metrics: totalOrders, totalRevenue, avgOrderValue, etc.
   - Generate topProducts, topLocations aggregates
   - Store results in AnalyticsSnapshot table

2. Create Analytics Computation Route
   - Create app/routes/app.compute-analytics.tsx
   - Admin UI to trigger analytics computation
   - Show computation progress
   - Display generated snapshots

3. Add Automated Computation
   - Add hook to compute analytics after each webhook
   - Implement date range computation (last 30 days)
   - Add monthly and yearly aggregates (not just daily)

4. Write comprehensive tests
   - Test with empty order data
   - Test with single day of orders
   - Test with 30 days of order history
   - Verify topProducts calculation accuracy
   - Test JSON serialization for complex data

REQUIREMENTS:
- Follow code from ANALYTICS_OPTIMIZATION_PLAN.md Phase 4
- Use proper date handling (start/end of day)
- Store aggregates as JSON strings (use JSON.stringify)
- Add validation for computed metrics
- Handle edge cases (division by zero, null values)
- Use Prisma upsert for AnalyticsSnapshot

TESTING REQUIREMENTS:
- Compute analytics for past 7 days
- Verify calculations manually (compare with raw data)
- Test topProducts ranking (verify order is correct)
- Test with orders from different time zones
- Verify AnalyticsSnapshot records in Prisma Studio
- Test re-computation (should update existing snapshots)

METRICS TO COMPUTE:
Daily snapshots should include:
- totalOrders, totalRevenue, avgOrderValue
- fulfilledOrders, paidOrders
- topProducts (top 10 by quantity)
- topLocations (top 10 by order count)
- ordersByHour (distribution throughout the day)

DELIVERABLES:
1. app/services/analytics-aggregator.server.ts
2. app/routes/app.compute-analytics.tsx
3. Test results showing accurate calculations
4. At least 7 daily snapshots generated
5. SESSION_STATUS.md updated
6. Performance benchmarks (time to compute 30 days)

After completion:
- Verify AnalyticsSnapshot table has records
- Document computation performance
- Update SESSION_STATUS.md with Phase 4 status
- Prepare for Session #5 (dashboard update)
```

**Expected Completion Criteria:**
- [ ] Analytics aggregator service working
- [ ] Daily snapshots generated for all dates with orders
- [ ] TopProducts calculation verified as accurate
- [ ] Admin UI shows computation status
- [ ] Can regenerate snapshots (idempotent)
- [ ] Performance acceptable (e.g., "30 days computed in <5 seconds")
- [ ] JSON data properly formatted and parseable

---

## 📋 Session #5: Dashboard Optimization & Performance Testing

**Estimated Time:** 2-3 hours
**Prerequisites:** Session #4 completed (AnalyticsSnapshot data available)

### Prompt for Session #5

```
I'm continuing the analytics dashboard optimization project. This is Session #5 - the final implementation phase!

VALIDATION FIRST - Verify Session #4 completion:
1. Check AnalyticsSnapshot table has data:
   - Run: npx prisma studio
   - Verify AnalyticsSnapshot table has multiple records
   - Check that period='daily' snapshots exist
   - Verify JSON fields (topProducts, topLocations) are populated

2. Test analytics computation:
   - Navigate to /app/compute-analytics
   - Trigger computation
   - Verify new snapshots are created

3. Check files exist:
   - app/services/analytics-aggregator.server.ts
   - app/services/shopify-sync.server.ts

4. Verify order data quality:
   - Check Order table has meaningful data
   - Verify OrderLineItem relationships

5. Check SESSION_STATUS.md shows Phase 4 as COMPLETE

If validation fails, complete Session #4 first.

SESSION #5 OBJECTIVES:
1. Implement Phase 5: Update Dashboard Route
   - Backup current app/routes/app.analytics.tsx as app.analytics.old.tsx
   - Rewrite loader to query local database ONLY
   - Remove ALL Shopify API calls
   - Use AnalyticsSnapshot for pre-computed metrics
   - Query Order table for recent orders list
   - Add "Last synced" timestamp display

2. Performance Optimization
   - Optimize database queries (use proper indexes)
   - Implement query result caching in loader
   - Add loading states for better UX
   - Use Remix's caching headers

3. UI Enhancements
   - Add "Refresh Data" button (triggers sync + computation)
   - Show data freshness indicator
   - Display sync status
   - Add error states for when data is missing

4. Comprehensive Testing
   - Measure page load time (target: <2 seconds)
   - Test with no data (empty state)
   - Test with partial data
   - Test with full dataset
   - Compare results with old dashboard (verify accuracy)
   - Performance testing with large datasets

REQUIREMENTS:
- Query AnalyticsSnapshot table for metrics
- Query Order table for recent order list (limit 100)
- Parse JSON fields (topProducts, topLocations)
- Add proper TypeScript types for all data
- Handle missing data gracefully
- Add "Last synced" timestamp from SyncStatus table
- Implement proper error boundaries

TESTING REQUIREMENTS:
- Load time benchmark (compare before/after)
- Test with browser DevTools Network tab
- Verify no Shopify API calls in waterfall
- Test on slow connections (throttle network)
- Test error handling (empty database)
- Verify all charts render correctly
- Test refresh functionality

PERFORMANCE TARGETS:
- Page load: <2 seconds (from 30-60s)
- Time to First Byte: <500ms
- Database query time: <100ms
- No Shopify API calls on page load

DELIVERABLES:
1. Updated app/routes/app.analytics.tsx (optimized version)
2. Backup: app/routes/app.analytics.old.tsx
3. Performance test results (before/after comparison)
4. Screenshots/video of <2s load time
5. SESSION_STATUS.md updated with all metrics
6. Updated CLAUDE.md marking Phase 5 complete

VALIDATION TESTS:
After implementation, run these tests:

1. Load Time Test:
   - Open DevTools Network tab
   - Navigate to /app/analytics
   - Record total load time
   - Verify < 2 seconds

2. Accuracy Test:
   - Compare metrics with old dashboard
   - Verify order counts match
   - Verify revenue calculations match
   - Check topProducts list is same

3. Refresh Test:
   - Click "Refresh Data" button
   - Verify sync runs
   - Verify analytics recompute
   - Verify dashboard updates

4. Edge Case Tests:
   - Clear all AnalyticsSnapshot records, reload page
   - Test with only 1 order
   - Test with 10,000+ orders

After completion:
- Document performance improvements
- Update SESSION_STATUS.md with final metrics
- Mark project as COMPLETE if targets met
- Prepare Session #6 prompt (optional Redis caching)
```

**Expected Completion Criteria:**
- [ ] Dashboard loads in <2 seconds
- [ ] Zero Shopify API calls on page load
- [ ] All metrics display correctly
- [ ] TopProducts chart renders
- [ ] "Last synced" timestamp shows
- [ ] Refresh button works
- [ ] Performance documented with benchmarks
- [ ] Old dashboard backed up

---

## 📋 Session #6: Redis Caching & Production Optimization (OPTIONAL)

**Estimated Time:** 2-3 hours
**Prerequisites:** Session #5 completed successfully (Dashboard <2s load time)

### Prompt for Session #6

```
I'm continuing the analytics dashboard optimization project. This is OPTIONAL Session #6 for advanced caching.

VALIDATION FIRST - Verify Session #5 completion:
1. Check dashboard performance:
   - Navigate to /app/analytics
   - Measure load time (should be <2s already)
   - Verify no Shopify API calls

2. Check all phases complete:
   - SESSION_STATUS.md shows Phases 1-5 as COMPLETE
   - Performance targets met (documented in SESSION_STATUS.md)

3. Verify current performance:
   - Dashboard loads in <2 seconds
   - Database queries complete in <100ms

If Session #5 is not complete, finish that first.

SESSION #6 OBJECTIVES (OPTIONAL):
1. Add Redis Caching Layer
   - Install redis package and @types/redis
   - Create app/services/cache.server.ts
   - Implement cache wrapper for analytics queries
   - Add cache invalidation on webhook events

2. Update Dashboard with Caching
   - Modify app/routes/app.analytics.tsx loader
   - Check cache before database query
   - Set 5-minute TTL for analytics data
   - Add cache warming strategy

3. Update Webhooks for Cache Invalidation
   - Modify webhooks.orders.tsx to invalidate cache
   - Modify webhooks.products.tsx to invalidate cache
   - Selective invalidation (only relevant keys)

4. Performance Testing
   - Measure cache hit rate
   - Test cold vs warm cache performance
   - Load test with concurrent users
   - Verify cache invalidation works

REQUIREMENTS:
- Use Redis connection pooling
- Implement graceful fallback (if Redis down, use DB)
- Add cache key versioning
- Implement cache warming on app startup
- Add Redis health check endpoint
- Monitor cache hit/miss rates

TESTING REQUIREMENTS:
- Test cache hit (should be <100ms)
- Test cache miss (falls back to DB)
- Test cache invalidation (webhook triggers clear)
- Test Redis connection failure (graceful degradation)
- Test concurrent requests (cache stampede prevention)
- Measure performance improvement

PERFORMANCE TARGETS:
- Cache hit load time: <500ms (from <2s)
- Cache miss load time: <2s (same as Session #5)
- Cache hit rate: >80% after warmup

DELIVERABLES:
1. app/services/cache.server.ts (Redis wrapper)
2. Updated app/routes/app.analytics.tsx with caching
3. Updated webhook handlers with cache invalidation
4. Performance benchmarks (before/after Redis)
5. Cache monitoring dashboard or logs
6. SESSION_STATUS.md updated with final metrics
7. Production deployment guide

After completion:
- Document cache performance improvements
- Update SESSION_STATUS.md marking all phases COMPLETE
- Update CLAUDE.md with caching architecture
- Create production deployment checklist
```

**Expected Completion Criteria:**
- [ ] Redis installed and configured
- [ ] Cache service implemented
- [ ] Dashboard uses cache (with fallback)
- [ ] Cache invalidation working
- [ ] Load time <500ms on cache hit
- [ ] Graceful degradation if Redis fails
- [ ] Production deployment guide created

---

## 📊 Progress Validation Commands

Use these commands at the start of each session to validate previous work:

### General Validation
```bash
# Check all documentation files exist
ls -la *.md

# Check Prisma schema
cat prisma/schema.prisma | grep "model Order"

# Check database status
npx prisma studio

# Check service files
ls -la app/services/

# Check webhook files
ls -la app/routes/webhooks*

# View session status
cat SESSION_STATUS.md
```

### Session-Specific Validation

**Before Session #2:**
```bash
# Verify planning files
ls ANALYTICS_OPTIMIZATION_PLAN.md DASHBOARD_OPTIMIZATION_SUMMARY.md SESSION_STATUS.md
```

**Before Session #3:**
```bash
# Check database schema
npx prisma studio
# Verify: Order, OrderLineItem, Product, AnalyticsSnapshot, SyncStatus tables exist

# Check webhooks deployed
shopify app env show | grep webhook

# Test webhook
shopify webhook trigger --topic orders/create
```

**Before Session #4:**
```bash
# Check order count in database
npx prisma studio
# Verify Order table has >100 records

# Check sync service exists
cat app/services/shopify-sync.server.ts | grep "syncOrdersFromShopify"

# Check sync UI
ls app/routes/app.sync.tsx
```

**Before Session #5:**
```bash
# Check analytics snapshots exist
npx prisma studio
# Verify AnalyticsSnapshot table has records

# Check aggregator service
cat app/services/analytics-aggregator.server.ts | grep "generateDailyAnalytics"
```

**Before Session #6 (Optional):**
```bash
# Verify Phase 5 performance
# Load /app/analytics and check DevTools Network tab
# Should see <2s load time with no Shopify API calls
```

---

## 🧪 Testing Checklist for Each Session

### Session #2 Testing
- [ ] Prisma migration successful
- [ ] All 5 tables visible in Prisma Studio
- [ ] Webhook trigger creates Order record
- [ ] Invalid webhook payload handled gracefully
- [ ] Duplicate order webhook doesn't create duplicate (upsert works)

### Session #3 Testing
- [ ] Sync service fetches orders successfully
- [ ] Pagination works (multiple pages fetched)
- [ ] Rate limiting delays observed (500ms between requests)
- [ ] SyncStatus table updated correctly
- [ ] Can stop and resume sync
- [ ] No duplicate orders after multiple syncs

### Session #4 Testing
- [ ] Daily analytics computed for all dates
- [ ] TopProducts calculation accurate (verified manually)
- [ ] Metrics match raw data calculations
- [ ] JSON fields parse correctly
- [ ] Re-running computation updates existing snapshots
- [ ] Computation performance acceptable (<5s for 30 days)

### Session #5 Testing
- [ ] Dashboard loads in <2s
- [ ] No Shopify API calls (verified in DevTools)
- [ ] All metrics display correctly
- [ ] Charts render properly
- [ ] "Last synced" timestamp shows
- [ ] Refresh button triggers sync
- [ ] Metrics match old dashboard (accuracy verified)

### Session #6 Testing (Optional)
- [ ] Cache hit < 500ms
- [ ] Cache miss falls back to DB
- [ ] Cache invalidation works (webhook clears cache)
- [ ] Redis failure doesn't break app
- [ ] Cache hit rate >80%
- [ ] Concurrent requests handled correctly

---

## 📝 Session Handoff Template

At the end of each session, update SESSION_STATUS.md with this format:

```markdown
## Session #X - [Title]
**Date:** YYYY-MM-DD
**Status:** ✅ COMPLETE / 🔄 IN PROGRESS / ⚠️ BLOCKED

### What Was Completed
- ✅ Task 1
- ✅ Task 2
- 🔄 Task 3 (partially complete)

### Performance Metrics
- Metric 1: [value]
- Metric 2: [value]

### Issues Encountered
- Issue 1: [description and resolution]
- Issue 2: [description] - BLOCKER for next session

### Files Created/Modified
- file1.ts
- file2.tsx

### Tests Completed
- [x] Test 1
- [x] Test 2
- [ ] Test 3 (failed - needs fixing)

### Next Session Should Start With
1. Specific instruction 1
2. Specific instruction 2

### Questions/Notes for Next Session
- Note 1
- Note 2
```

---

## 🎯 Success Criteria Summary

The project is complete when:
- ✅ Dashboard loads in <2 seconds (or <500ms with Redis)
- ✅ Zero Shopify API calls on dashboard page load
- ✅ All metrics display correctly and match historical calculations
- ✅ Webhooks sync new data in real-time
- ✅ Background sync can backfill historical data
- ✅ Analytics pre-computed and cached
- ✅ All 6 phases tested and validated
- ✅ Production deployment guide created
- ✅ SESSION_STATUS.md documents all metrics and performance

**Use these prompts at the start of each session for a smooth multi-session development experience!**
