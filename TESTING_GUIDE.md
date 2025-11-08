# Testing Guide: Multi-Tenant Shopify App

This guide covers all testing procedures for your multi-merchant Shopify app.

---

## Table of Contents

1. [Quick Test (5 minutes)](#quick-test-5-minutes)
2. [GDPR Webhook Testing](#gdpr-webhook-testing)
3. [Multi-Tenant Isolation Testing](#multi-tenant-isolation-testing)
4. [Manual Testing with Development Stores](#manual-testing-with-development-stores)
5. [Performance Testing](#performance-testing)

---

## Quick Test (5 minutes)

Verify everything is working before diving into detailed tests.

```bash
# 1. Verify build works
npm run build

# 2. Start development server
npm run dev

# 3. In another terminal, check health endpoint
curl http://localhost:3000/health

# 4. Verify database connection
npx prisma studio
```

**Expected results:**
- ✅ Build completes without errors
- ✅ Dev server starts successfully
- ✅ Health endpoint returns 200 OK
- ✅ Prisma Studio opens and shows tables

---

## GDPR Webhook Testing

### Prerequisites

1. App running: `npm run dev`
2. Shopify CLI authenticated
3. Development store connected

### Automated Test Script

```bash
# Make script executable
chmod +x test-gdpr-webhooks.sh

# Run all GDPR webhook tests
./test-gdpr-webhooks.sh
```

### Manual Testing

#### Test 1: Customer Data Request

```bash
shopify webhook trigger --topic=customers/data_request
```

**What to check:**

1. **Console output:**
   ```
   📥 GDPR: Customer data request for shop: your-store.myshopify.com
   📋 Data request for customer customer@example.com
   📊 Data collected: { customerId, customerEmail, orders: [...] }
   📝 Logged GDPR data request
   ✅ Customer data request processed
   ```

2. **Database (Prisma Studio):**
   - Open `AlertLog` table
   - Find record with `alertType: "gdpr_data_request"`
   - Check `metadata` field contains customer data

3. **Expected behavior:**
   - Webhook responds within 5 seconds
   - All customer data collected (orders, analytics)
   - Audit log created for compliance

#### Test 2: Customer Redaction

```bash
shopify webhook trigger --topic=customers/redact
```

**What to check:**

1. **Console output:**
   ```
   📥 GDPR: Customer redaction request for shop: your-store.myshopify.com
   🗑️  Redacting data for customer customer@example.com
   🔒 Anonymized N orders for customer
   📝 Logged GDPR redaction
   ✅ Customer data redacted
   ```

2. **Database (Prisma Studio):**
   - Open `Order` table
   - Find orders that had customer data
   - Verify: `customerId: null`, `customerEmail: null`, `email: null`
   - Order totals and dates preserved (for business analytics)

3. **Expected behavior:**
   - PII removed (email, customer ID)
   - Business data preserved (revenue, dates)
   - Audit log created

#### Test 3: Shop Redaction

⚠️ **WARNING:** This test deletes ALL shop data!

```bash
shopify webhook trigger --topic=shop/redact
```

**What to check:**

1. **Console output:**
   ```
   📥 GDPR: Shop redaction request for shop: your-store.myshopify.com
   🗑️  Starting complete data deletion
   🗑️  Phase 1: Deleting transactional data
      ✓ Deleted N order line items
      ✓ Deleted N inventory snapshots
      ✓ Deleted N war room metrics
      ... (see full list in console)
   🗑️  Phase 2: Clearing cache
      ✓ Cache cleared
   📝 Logged shop deletion
   ✅ Complete data deletion finished
   ```

2. **Database (Prisma Studio):**
   - Search for shop domain in any table
   - Should return ZERO results (except system audit log)

3. **System Audit Log:**
   - `AlertLog` table has record with `shop: "SYSTEM"`
   - `alertType: "gdpr_shop_redaction"`
   - Metadata contains shop domain and timestamp

**ONLY test this on development/test stores!**

### GDPR Compliance Verification

After testing, verify:

- [ ] All three webhooks respond within 5 seconds
- [ ] Customer data export is complete
- [ ] Customer redaction anonymizes ALL PII
- [ ] Shop redaction deletes ALL data
- [ ] Audit logs preserved for compliance
- [ ] No errors in webhook handlers

---

## Multi-Tenant Isolation Testing

### Setup Jest Testing

```bash
# Install dependencies
npm install --save-dev jest @jest/globals ts-jest @types/jest

# Run tests
npm test
```

### Test Suite: multi-tenant-isolation.test.ts

This comprehensive test suite verifies:

1. **Order Isolation**
   - Shop A's orders not visible to Shop B
   - Shop B's orders not visible to Shop A

2. **Product Isolation**
   - Products scoped by shop
   - No cross-shop product queries

3. **War Room Data Isolation**
   - Inventory snapshots isolated
   - War Room metrics isolated
   - Alert logs isolated

4. **Aggregation Queries**
   - Revenue calculations per shop
   - Order counts per shop

5. **Update Operations**
   - Updates only affect correct shop

6. **Delete Operations**
   - Deletions only affect correct shop

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test multi-tenant-isolation

# Run with coverage
npm test -- --coverage

# Run in watch mode (during development)
npm test -- --watch
```

### Expected Test Results

```
PASS tests/multi-tenant-isolation.test.ts
  Multi-Tenant Data Isolation
    Order Isolation
      ✓ should isolate orders between shops (XXms)
      ✓ should prevent querying all orders without shop filter (XXms)
    Product Isolation
      ✓ should isolate products between shops (XXms)
    War Room Data Isolation
      ✓ should isolate inventory snapshots between shops (XXms)
      ✓ should isolate War Room metrics between shops (XXms)
    Aggregation Queries
      ✓ should correctly aggregate data per shop (XXms)
    Update Operations
      ✓ should only update records for the correct shop (XXms)
    Delete Operations
      ✓ should only delete records for the correct shop (XXms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

---

## Manual Testing with Development Stores

### Setup (One-Time)

1. **Create 3 development stores in Partner Dashboard:**
   - Store A: `store-a.myshopify.com` (empty - new merchant)
   - Store B: `store-b.myshopify.com` (with test data)
   - Store C: `store-c.myshopify.com` (different currency/locale)

2. **Install app on all three stores**

### Test Scenarios

#### Scenario 1: Data Isolation

**Goal:** Verify Store A cannot see Store B's data

1. **In Store A:**
   - Create 3 test orders in Shopify Admin
   - Go to your app's analytics dashboard
   - Note the order count and revenue

2. **Switch to Store B:**
   - Open your app
   - Check analytics dashboard
   - **Verify:** Store A's orders DO NOT appear

3. **Create data in Store B:**
   - Create 5 test orders
   - Check dashboard shows only Store B's data

4. **Switch back to Store A:**
   - Verify count is still 3 orders
   - Store B's orders DO NOT appear

✅ **Pass criteria:** Each store only sees its own data

#### Scenario 2: Concurrent Usage

**Goal:** Verify multiple shops can use app simultaneously

1. **Open Store A in one browser (Chrome)**
2. **Open Store B in another browser (Firefox)**
3. **Create orders in both stores simultaneously**
4. **Check dashboards in both browsers**

✅ **Pass criteria:** Both dashboards update correctly with no cross-contamination

#### Scenario 3: War Room Feature Isolation

**Goal:** Verify BFCM War Room data is shop-specific

1. **In Store A:**
   - Navigate to `/app/war-room`
   - Check DEFCON level
   - Note inventory snapshots

2. **In Store B:**
   - Navigate to `/app/war-room`
   - Should see different DEFCON level
   - Different inventory snapshots

✅ **Pass criteria:** War Room shows unique data per shop

#### Scenario 4: Webhook Processing

**Goal:** Verify webhooks process correctly for each shop

1. **In Store A:**
   - Create an order in Shopify Admin
   - Wait 5 seconds
   - Check your app's analytics

2. **In Store B:**
   - Create an order in Shopify Admin
   - Wait 5 seconds
   - Check your app's analytics

3. **Verify in database (Prisma Studio):**
   - Both orders present
   - Each has correct `shop` field
   - No cross-shop data

✅ **Pass criteria:** Webhooks correctly attribute data to each shop

#### Scenario 5: Uninstall/Reinstall

**Goal:** Verify data persists through uninstall/reinstall

1. **In Store C:**
   - Note current data in analytics
   - Uninstall the app
   - Wait 30 seconds
   - Reinstall the app
   - Check analytics again

✅ **Pass criteria:** Data persists (before 48-hour GDPR deletion window)

#### Scenario 6: GDPR Shop Deletion (48 hours after uninstall)

**Goal:** Verify shop redaction webhook fires

1. **Create test store:** `test-deletion.myshopify.com`
2. **Install app and create test data**
3. **Uninstall app**
4. **Manually trigger shop/redact webhook:**
   ```bash
   shopify webhook trigger --topic=shop/redact --shop=test-deletion.myshopify.com
   ```
5. **Verify in database:** All data deleted

✅ **Pass criteria:** Complete data deletion

---

## Performance Testing

### Dashboard Load Time Testing

**Goal:** Verify dashboard loads in acceptable time

```bash
# Install Apache Bench (if not already installed)
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: brew install ab

# Test dashboard endpoint
ab -n 100 -c 10 http://localhost:3000/app/analytics
```

**Targets:**
- ✅ Average response time: < 2 seconds (database only)
- ✅ Average response time: < 100ms (with Redis cache)
- ✅ 95th percentile: < 500ms

### Cache Performance Testing

**Goal:** Verify Redis caching improves performance

1. **Clear Redis cache:**
   ```bash
   redis-cli FLUSHALL
   ```

2. **First request (cache miss):**
   ```bash
   time curl http://localhost:3000/app/analytics
   ```
   Expected: ~2 seconds

3. **Second request (cache hit):**
   ```bash
   time curl http://localhost:3000/app/analytics
   ```
   Expected: ~100ms

4. **Check cache hit rate in logs:**
   Look for: `📬 Cache hit` vs `📭 Cache miss`

✅ **Pass criteria:** Cache hit is 10-20x faster than cache miss

### Database Query Performance

**Goal:** Verify indexes are being used

```sql
-- In Prisma Studio or psql

-- Check if shop index is used
EXPLAIN ANALYZE SELECT * FROM "Order" WHERE shop = 'store-a.myshopify.com';

-- Should show "Index Scan using Order_shop_createdAt_idx"
```

✅ **Pass criteria:** Query uses index, execution time < 50ms

---

## Lighthouse Performance Testing

**Goal:** Verify app meets Shopify App Store requirements (max 10-point reduction)

1. **Install Lighthouse:**
   ```bash
   npm install -g lighthouse
   ```

2. **Run Lighthouse on your app:**
   ```bash
   lighthouse http://localhost:3000/app/analytics --view
   ```

3. **Check scores:**
   - Performance: > 80 (target: > 90)
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

✅ **Pass criteria:** All scores > 80, performance > 90 preferred

---

## Pre-Production Checklist

Before deploying to production:

### Functional Tests
- [ ] All GDPR webhooks tested and working
- [ ] Multi-tenant isolation tests passing
- [ ] Manual testing with 3+ dev stores completed
- [ ] Webhook processing verified
- [ ] Uninstall/reinstall flow tested

### Performance Tests
- [ ] Dashboard loads in < 2 seconds (database)
- [ ] Dashboard loads in < 100ms (cache)
- [ ] Redis cache hit rate > 80%
- [ ] Database queries use indexes
- [ ] Lighthouse score > 80

### Security Tests
- [ ] Shop A cannot access Shop B's data
- [ ] No SQL injection vulnerabilities
- [ ] CSRF protection verified
- [ ] HMAC verification working
- [ ] Session tokens validated

### Production Readiness
- [ ] Error monitoring configured (Sentry)
- [ ] Rate limit monitoring implemented
- [ ] Database backups configured
- [ ] Production environment variables set
- [ ] Health check endpoint responding

---

## Continuous Testing

### During Development

```bash
# Run tests on every code change
npm test -- --watch
```

### Before Each Commit

```bash
# Run full test suite
npm test

# Run linter
npm run lint

# Build production bundle
npm run build
```

### CI/CD Pipeline (Recommended)

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run build
```

---

## Troubleshooting

### Tests Failing

**Issue:** Jest tests timing out

**Solution:**
```bash
# Increase timeout in jest.config.js
testTimeout: 60000  // 60 seconds
```

**Issue:** Database connection errors

**Solution:**
```bash
# Verify DATABASE_URL_NEON is set
echo $DATABASE_URL_NEON

# Test connection
npx prisma db pull
```

### GDPR Webhooks Not Firing

**Issue:** Webhook returns 401 Unauthorized

**Solution:**
- Ensure `SHOPIFY_API_SECRET` is correct
- Webhooks registered via CLI (not manually)
- App is running and tunnel is active

**Issue:** Webhook times out

**Solution:**
- Check webhook handler responds within 5 seconds
- Move heavy processing to background jobs

### Performance Issues

**Issue:** Dashboard loads slowly

**Solution:**
- Check Redis is running: `redis-cli PING`
- Verify cache is being used (check logs for cache hits)
- Ensure database indexes exist: `npx prisma migrate deploy`

---

## Next Steps

After completing all tests:

1. ✅ Read test results and fix any failures
2. ✅ Document any issues found
3. ✅ Implement repository pattern (see PRODUCTION_DEPLOYMENT_GUIDE.md)
4. ✅ Add access token encryption
5. ✅ Deploy to staging environment
6. ✅ Run tests again in staging
7. ✅ Submit for App Store review

**For detailed implementation guides, see:**
- [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)
- [MULTI_MERCHANT_QUICK_START.md](MULTI_MERCHANT_QUICK_START.md)
- [GDPR_WEBHOOK_TESTING.md](GDPR_WEBHOOK_TESTING.md)
