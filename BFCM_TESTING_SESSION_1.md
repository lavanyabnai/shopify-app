# BFCM War Room Testing - Session 1: Baseline Data Setup

**Date:** October 24, 2025
**Duration:** 2-3 hours
**Status:** Ready for execution

---

## Overview

Session 1 establishes the baseline data for BFCM testing by generating realistic pre-event order patterns from October 1-23, 2025. This creates the foundation for testing all War Room features with meaningful historical context.

### Objectives

✅ Generate ~1,000 orders with progressive velocity increase (Oct 1-23, 2025)
✅ Create product-specific velocity patterns (viral, steady, slow)
✅ Sync all data from Shopify to local database
✅ Generate initial inventory snapshots for all products
✅ Verify baseline DEFCON level (expected: 4-5)
✅ Validate all War Room services with baseline data

---

## Prerequisites

### Environment Setup

1. **Development Store Ready**
   - Shop: `control-tower-2.myshopify.com`
   - Current products: 24 active products
   - Current orders: 13,598 orders (historical)
   - Existing data will not be affected

2. **Python Environment** (for order generation)
   ```bash
   cd ~/scripts/shopify-order-generator
   source venv/bin/activate  # If using virtual environment
   pip install requests python-dotenv
   ```

3. **.env File** (in `~/scripts/shopify-order-generator/`)
   ```env
   SHOP_DOMAIN=control-tower-2.myshopify.com
   ACCESS_TOKEN=your_admin_api_token
   API_VERSION=2024-01
   ```

4. **Node/TypeScript Environment**
   ```bash
   cd ~/shopify-app-template-remix
   npm install
   npx prisma generate
   ```

5. **Services Running**
   - Redis (optional, for caching): `redis-server`
   - Dev server (for webhooks): `npm run dev` (in separate terminal)

---

## Execution Steps

### Step 1: Generate Baseline Orders (45-60 min)

Run the BFCM order generator to create October 1-23, 2025 orders:

```bash
cd ~/shopify-app-template-remix

# First-time setup: Copy script and check dependencies
./setup-session-1.sh

# Run the generator
cd ~/scripts/shopify-order-generator
source venv/bin/activate  # Activate Python virtual environment
python bfcm-order-generator.py
```

**What it does:**
- Generates ~1,100 orders over 23 days (Oct 1-23, 2025)
- Progressive velocity: 20 → 35 → 60 → 80 orders/day
- Product velocity profiles:
  - **Viral** (4x): AirFlow Pro Earbuds, Phone Case Premium
  - **Steady** (1.8x): Yoga Mat, Coffee Mug, Water Bottle, Notebook
  - **Slow** (0.2x): Winter Jacket
- Realistic time-of-day distribution (evening peak)
- 25% repeat customers
- Respects dev store rate limits (5 orders/minute)

**Expected output:**
```
📊 FINAL SUMMARY
Period        : Oct 1-23, 2025
Duration      : 23 days
Success       : ✅ 1,084 orders
Failed        : ❌ 12 orders
Total         : 1,096 orders
Success Rate  : 98.9%
Avg/Day       : 47.1 orders

📊 WEEKLY BREAKDOWN
Week 1     :  141 orders (✅ 139 | ❌  2) - 20.1/day
Week 2     :  249 orders (✅ 246 | ❌  3) - 35.1/day
Week 3     :  428 orders (✅ 422 | ❌  6) - 60.3/day
Week 4     :  158 orders (✅ 157 | ❌  1) - 78.5/day
```

**Note:** This takes ~20-25 minutes with dev store rate limits.

---

### Step 2: Sync Data to Local Database (10-15 min)

Sync orders and products from Shopify to your local database:

```bash
cd ~/shopify-app-template-remix

# Run sync script (uses direct GraphQL API access)
npx tsx sync-and-verify-direct.ts
```

**What it does:**
- Fetches all orders since Oct 1, 2025 from Shopify GraphQL API
- Syncs orders to local `Order` and `OrderLineItem` tables
- Fetches and syncs all products to `Product` table
- Generates inventory snapshots for all 24 active products
- Updates `SyncStatus` table
- Verifies sync completeness

**Expected output:**
```
📥 STEP 1: Sync Orders from Shopify
✅ Fetched 1,084 total orders
✅ Synced 1,084 orders

📦 STEP 2: Sync Products from Shopify
✅ Fetched 24 total products
✅ Synced 24 products

📸 STEP 3: Generate Inventory Snapshots
✅ Created 24 inventory snapshots

🔍 STEP 5: Verify Sync Results
📊 Orders:
   Total orders: 14,682
   With processedAt: 14,681
   Oct 1-23, 2025: 1,084

✅ All verification checks passed!
```

**Note:** Webhooks will also sync data in real-time, but this script ensures completeness.

---

### Step 3: Verify Baseline Metrics (5-10 min)

Verify all War Room services are working with baseline data:

```bash
npx tsx verify-war-room-baseline.ts
```

**What it does:**
- Tests DEFCON calculation
- Tests revenue risk calculation
- Tests velocity anomaly detection
- Tests prediction engine
- Tests alert rules
- Tests recommendation engine
- Tests cache performance
- Tests database performance
- Generates comprehensive report

**Expected output:**
```
📊 WAR ROOM BASELINE VERIFICATION REPORT

🧪 TEST RESULTS
✅ DEFCON Calculation                      17ms | Completed in 17ms
{
  "level": 4,
  "label": "GUARDED",
  "riskScore": 32,
  "coverageHours": 45.3,
  "criticalSKUs": 0,
  "warningSKUs": 2,
  "healthySKUs": 22
}
✅ Revenue Risk                            8ms | Completed in 8ms
✅ Velocity Detection                     12ms | Completed in 12ms
✅ Predictions                           156ms | Completed in 156ms
✅ Alert Rules                            23ms | Completed in 23ms
✅ Recommendations                        45ms | Completed in 45ms
✅ Cache Performance                       3ms | Completed in 3ms
✅ Database Performance                   18ms | Completed in 18ms

⚡ PERFORMANCE SUMMARY
✅ DEFCON Calculation: 17ms (target: <50ms)
✅ Revenue Risk: 8ms (target: <200ms)
✅ Velocity Detection: 12ms (target: <200ms)
✅ Predictions: 156ms (target: <500ms)

📊 DATA SUMMARY
DEFCON Status:
   Level: DEFCON 4 (GUARDED)
   Risk Score: 32/100
   Coverage: 45.3h
   Critical SKUs: 0
   Warning SKUs: 2
   Healthy SKUs: 22

✅ BASELINE VERIFICATION: PASSED
```

---

### Step 4: Visual Verification (5 min)

Check the War Room dashboard in your browser:

1. **Start dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Navigate to War Room:**
   - Open: `https://your-dev-url/app/war-room`
   - Should show DEFCON 4-5 (normal state)
   - Inventory coverage: ~40-50 hours average
   - Risk score: 20-40/100
   - Few or no critical SKUs

3. **Check other dashboards:**
   - Alerts: `/app/war-room/alerts` - Should have default rules created
   - Actions: `/app/war-room/actions` - May show some low-priority recommendations
   - Simulations: `/app/war-room/simulate` - Should load successfully
   - ROI: `/app/war-room/roi` - May show previous test data

---

## Expected Results

### Data Created

| Metric | Expected Value |
|--------|----------------|
| **New Orders** | ~1,000-1,100 orders |
| **Date Range** | Oct 1-23, 2025 |
| **Total Orders** | ~14,600 (13,598 existing + 1,000 new) |
| **Products** | 24 active products |
| **Inventory Snapshots** | 24 snapshots (one per product) |
| **Alert Rules** | 5 default rules |
| **Repeat Customers** | ~250 (25% of new orders) |

### Velocity Patterns Created

| Product Category | Example Products | Multiplier | Pattern |
|-----------------|------------------|------------|---------|
| **Viral** | AirFlow Pro, Phone Case | 4.0x final | Week 1: 1x → Week 4: 4x |
| **Steady** | Yoga Mat, Coffee Mug | 1.8x final | Week 1: 1x → Week 4: 1.8x |
| **Slow** | Winter Jacket | 0.2x final | Week 1: 0.5x → Week 4: 0.2x |

### DEFCON Baseline

- **Expected Level:** DEFCON 4-5 (GUARDED or NORMAL)
- **Risk Score:** 20-40/100
- **Average Coverage:** 40-60 hours
- **Critical SKUs:** 0-2
- **Warning SKUs:** 2-5
- **Healthy SKUs:** 17-22

### Performance Benchmarks

| Service | Expected | Target |
|---------|----------|--------|
| DEFCON Calculation | <20ms | <50ms |
| Revenue Risk | <15ms | <200ms |
| Velocity Detection | <20ms | <200ms |
| Predictions | <200ms | <500ms |
| Alert Evaluation | <30ms | <100ms |
| Recommendations | <50ms | <200ms |
| Cache Operations | <5ms | <10ms |
| Database Queries | <20ms | <100ms |

---

## Troubleshooting

### Issue: Order generation fails with 429 errors

**Cause:** Rate limit exceeded (dev store: 5 orders/minute)

**Solution:**
- Script automatically handles rate limiting
- Wait for script to complete (will pause between batches)
- If persistent, check Shopify API status

### Issue: Sync script can't authenticate

**Cause:** Missing or invalid session

**Solution:**
```bash
# Authenticate by visiting your app in Shopify admin
npm run dev
# Then visit: https://admin.shopify.com/store/control-tower-2/apps
```

### Issue: Verification shows DEFCON 1-2

**Cause:** Inventory levels too low or old data interfering

**Solution:**
- Check inventory levels in Shopify admin
- Increase stock for products showing as critical
- Re-run sync: `npx tsx sync-and-verify.ts`

### Issue: Missing inventory snapshots

**Cause:** Sync script didn't complete successfully

**Solution:**
```bash
# Re-run just the snapshot generation
npx tsx << 'EOF'
import db from "./app/db.server";
import { updateInventorySnapshot } from "./app/services/defcon-calculator.server";

async function main() {
  const session = await db.session.findFirst();
  const shop = session!.shop;
  const products = await db.product.findMany({ where: { shop, status: 'active' } });

  for (const p of products) {
    const sku = `${p.title.substring(0, 10).toUpperCase()}-${p.id.split('/').pop()?.substring(0, 6)}`;
    await updateInventorySnapshot(shop, p.id, sku, p.title, 'Main Warehouse', p.totalInventory);
    console.log(`✓ ${p.title}`);
  }

  await db.$disconnect();
}

main();
EOF
```

### Issue: Performance tests fail

**Cause:** Database not indexed properly or Redis not running

**Solution:**
```bash
# Regenerate Prisma client with indexes
npx prisma generate

# Start Redis (if using caching)
redis-server

# Re-run verification
npx tsx verify-war-room-baseline.ts
```

---

## Validation Checklist

Before proceeding to Session 2, verify:

- [ ] ~1,000 new orders created (Oct 1-23, 2025)
- [ ] All orders synced to local database
- [ ] 24 inventory snapshots created
- [ ] DEFCON level is 4-5 (baseline normal)
- [ ] All performance tests passing (<50ms, <200ms, <500ms)
- [ ] War Room dashboard loads successfully
- [ ] No critical errors in verification report
- [ ] Viral product patterns visible in order data (AirFlow Pro, Phone Case)
- [ ] Slow product patterns visible (Winter Jacket)

---

## Next Steps

**Session 2: BFCM Day Critical Scenarios**

Once baseline verification passes, you're ready for Session 2:

1. Generate BFCM Day surge (Oct 24, 2025) - 300-500 orders
2. Create critical stockout scenarios
3. Test DEFCON escalation (1-2 levels)
4. Verify revenue at risk calculations ($50K-$150K)
5. Test velocity anomaly detection (viral products)

**Preparation for Session 2:**
- Keep dev server running
- Keep Redis running (if using cache)
- Review product inventory levels in Shopify admin
- Prepare to simulate inventory depletion

---

## Files Created

### Python Scripts
- `bfcm-order-generator.py` - Baseline order generator (Oct 1-23)

### TypeScript Scripts
- `sync-and-verify.ts` - Sync Shopify data to local DB
- `verify-war-room-baseline.ts` - Comprehensive baseline verification

### Documentation
- `BFCM_TESTING_SESSION_1.md` - This file

---

## Time Breakdown

| Step | Activity | Duration |
|------|----------|----------|
| 1 | Generate baseline orders | 45-60 min |
| 2 | Sync to database | 10-15 min |
| 3 | Verify metrics | 5-10 min |
| 4 | Visual verification | 5 min |
| **Total** | | **65-90 min** |

**Actual Time:** Expect 60-75 minutes for first run (may be faster if familiar with tools)

---

## Support & Resources

- **Shopify Admin API:** https://shopify.dev/docs/api/admin-graphql
- **War Room Documentation:** [BFCM_WAR_ROOM_COMPLETE.md](BFCM_WAR_ROOM_COMPLETE.md)
- **Master Testing Plan:** [BFCM_WAR_ROOM_PLAN.md](BFCM_WAR_ROOM_PLAN.md)

---

**Session 1 Status:** ✅ Ready for execution
**Next Session:** [BFCM_TESTING_SESSION_2.md](BFCM_TESTING_SESSION_2.md) (to be created after Session 1 completion)
