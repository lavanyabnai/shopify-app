# 🚀 BFCM War Room - Start Here Guide

**Complete step-by-step guide to start and check everything**

---

## 📋 Quick Start (5 Minutes)

### Step 1: Start the Application

```bash
# Navigate to project directory
cd ~/shopify-app-template-remix

# Start the dev server (Terminal 1)
npm run dev
```

**Expected output:**
```
✓ Ready on http://localhost:XXXXX
Using shopify.app.toml for default values
Dev store: control-tower-2.myshopify.com
```

**Note the port number** (e.g., http://localhost:38063)

---

### Step 2: Open War Room Dashboard

Open your browser and visit:

```
http://localhost:XXXXX/app/war-room
```

Replace `XXXXX` with the port number from Step 1.

**Expected UI:**
- ✅ DEFCON status badge (green/yellow/red)
- ✅ Risk score display
- ✅ SKU health breakdown
- ✅ System health indicators
- ✅ Navigation menu on left

**Screenshot what you should see:**
```
┌─────────────────────────────────────────────────────┐
│  🎯 War Room - BFCM Command Center                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  DEFCON 5: NORMAL          Risk Score: 5/100       │
│  [Green Badge]             [Green Indicator]       │
│                                                     │
│  📦 SKU Health:                                     │
│  • Critical: 0                                      │
│  • Warning: 0                                       │
│  • Healthy: 24                                      │
│                                                     │
│  ⏱️ Last Updated: Just now    [Refresh Button]     │
└─────────────────────────────────────────────────────┘
```

---

### Step 3: Run Quick Health Check

Open a **new terminal** (Terminal 2) and run:

```bash
# Quick validation test (1 minute)
npx tsx test-defcon-calculator.ts
```

**Expected output:**
```
🧪 Testing DEFCON Calculator
✅ DEFCON 5 calculated in 27ms (NORMAL)
✅ All tests completed successfully!
```

---

## 🧪 Complete Testing (10 Minutes)

### Option A: Run All Tests Automatically (Recommended)

```bash
# In Terminal 2 (keep dev server running in Terminal 1)
./run-all-tests.sh
```

**Expected output after 3-5 minutes:**
```
╔════════════════════════════════════════════════════╗
║  🎉 ALL TESTS PASSED! PRODUCTION READY! 🚀        ║
╚════════════════════════════════════════════════════╝

✅ Tests Passed:      14
❌ Tests Failed:      0
⚠️  Tests Skipped:    2
📊 Total Tests:       16
🎯 Success Rate:      100.0%
⏱️  Duration:          3m 42s
```

---

### Option B: Run Individual Tests

```bash
# Test each component separately
npx tsx test-defcon-calculator.ts      # DEFCON status
npx tsx test-bfcm-revenue-risk.ts      # Revenue risk
npx tsx test-prediction-engine.ts      # Predictions
npx tsx test-alert-engine.ts           # Alerts
npx tsx test-recommendations.ts        # Actions
npx tsx test-simulation-engine.ts      # Simulations
npx tsx test-roi-tracker.ts            # ROI tracking
npx tsx audit-war-room-performance.ts  # Performance
```

Each test takes **10-30 seconds** and shows immediate results.

---

## 🌐 Visual Dashboard Tour

### Visit All 5 War Room Sections

With dev server running (Terminal 1), visit these URLs:

#### 1. **Main Dashboard** (DEFCON & Metrics)
```
http://localhost:XXXXX/app/war-room
```
**Check for:**
- ✅ DEFCON status badge
- ✅ Risk score
- ✅ Revenue at risk
- ✅ SKU health breakdown
- ✅ System health indicators

---

#### 2. **Alerts Dashboard**
```
http://localhost:XXXXX/app/war-room/alerts
```
**Check for:**
- ✅ Active alerts list
- ✅ Alert history table
- ✅ Alert rules display
- ✅ Notification preferences
- ✅ Test alert button

---

#### 3. **Actions Center**
```
http://localhost:XXXXX/app/war-room/actions
```
**Check for:**
- ✅ Recommended actions list
- ✅ ROI ranking
- ✅ One-click execute buttons
- ✅ Action history/audit log
- ✅ Action status tracking

---

#### 4. **Simulation Lab**
```
http://localhost:XXXXX/app/war-room/simulate
```
**Check for:**
- ✅ Scenario parameter inputs (tabs for each type)
- ✅ Run simulation button
- ✅ Simulation history table
- ✅ Playbook library
- ✅ Results comparison interface

---

#### 5. **ROI Tracker**
```
http://localhost:XXXXX/app/war-room/roi
```
**Check for:**
- ✅ Revenue saved counter
- ✅ Margin protected display
- ✅ Opportunity captured metrics
- ✅ Action impact breakdown
- ✅ Time series chart

---

## 📊 Check Database State

### Verify Data Exists

```bash
# Check order count
npx tsx -e "import db from './app/db.server.ts';
  db.order.count().then(c => {
    console.log('Total orders:', c);
    process.exit(0);
  });"

# Expected: Total orders: 14000-15000
```

```bash
# Check BFCM orders (Oct 24)
npx tsx -e "import db from './app/db.server.ts';
  db.order.count({
    where: {
      shop: 'control-tower-2.myshopify.com',
      createdAt: {
        gte: new Date('2025-10-24T00:00:00Z'),
        lt: new Date('2025-10-25T00:00:00Z')
      }
    }
  }).then(c => {
    console.log('BFCM orders (Oct 24):', c);
    process.exit(0);
  });"

# Expected: BFCM orders: 700-1100
```

```bash
# Check products
npx tsx -e "import db from './app/db.server.ts';
  db.product.count().then(c => {
    console.log('Total products:', c);
    process.exit(0);
  });"

# Expected: Total products: 30-40
```

---

## 🔍 Check Performance

### Quick Performance Test

```bash
npx tsx audit-war-room-performance.ts
```

**Expected results:**
```
1️⃣  Testing DEFCON Calculation...
   ✅ 24ms (target: <50ms)

2️⃣  Testing Revenue Risk Calculation...
   ✅ 15ms (target: <200ms)

3️⃣  Testing Velocity Anomaly Detection...
   ✅ 2ms (target: <200ms)

4️⃣  Testing Prediction Engine...
   ✅ 11ms (target: <500ms)

5️⃣  Testing Recommendations...
   ✅ 15ms (target: <500ms)

🎉 All services exceed targets by 52-99%!
```

---

## ✅ Checklist - Everything Working?

Use this checklist to verify all systems:

### Backend Services
- [ ] Dev server starts without errors
- [ ] Database has orders (14,000+)
- [ ] Database has products (30-40)
- [ ] BFCM data exists (700-1,100 Oct 24 orders)
- [ ] All test scripts pass (14+ tests)
- [ ] Performance targets exceeded

### Frontend Dashboard
- [ ] Main dashboard loads (<2 seconds)
- [ ] DEFCON status displays
- [ ] Risk score shows
- [ ] SKU health breakdown visible
- [ ] All 5 sections accessible

### War Room Features
- [ ] DEFCON calculator working
- [ ] Revenue risk calculations working
- [ ] Velocity detection working
- [ ] Predictions generating
- [ ] Alerts displaying
- [ ] Actions recommending
- [ ] Simulations running
- [ ] ROI tracking working

### Performance
- [ ] Dashboard loads <100ms (cached)
- [ ] All services <500ms
- [ ] No console errors
- [ ] No database errors

---

## 🔧 Common Issues & Fixes

### Issue 1: Dev Server Won't Start

**Error:** `Port XXXX already in use`

**Fix:**
```bash
# Kill existing process
pkill -f "npm run dev"

# Or use different port
npm run dev -- --port 3001
```

---

### Issue 2: "No session found"

**Error:** `Session not found in database`

**Fix:**
```bash
# 1. Make sure dev server is running
npm run dev

# 2. Visit Shopify admin and click your app
# https://admin.shopify.com/store/control-tower-2/apps

# 3. This will authenticate and create session
```

---

### Issue 3: Database Errors

**Error:** `Table does not exist`

**Fix:**
```bash
# Regenerate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

---

### Issue 4: Tests Failing

**Error:** Test scripts show errors

**Fix:**
```bash
# 1. Check database state
npx tsx diagnose-order-corruption.ts

# 2. Clean up old test data if needed
npx tsx -e "import db from './app/db.server.ts';
  db.order.deleteMany({ where: { shop: 'test-shop.myshopify.com' } })
  .then(r => { console.log('Cleaned up', r.count, 'test orders'); process.exit(0); });"

# 3. Re-run tests
./run-all-tests.sh
```

---

### Issue 5: Dashboard Loads Slowly

**Symptom:** Dashboard takes >2 seconds to load

**Fix:**
```bash
# 1. Start Redis for caching (optional)
redis-server &

# 2. Verify cache is working
npx tsx -e "import { cache } from './app/services/cache.server.ts';
  cache.set('test', 'value', 60).then(() => {
    cache.get('test').then(v => {
      console.log('Cache working:', v === 'value');
      process.exit(0);
    });
  });"

# Expected: Cache working: true

# Without Redis: Dashboard still works, just slightly slower (1-2s)
# With Redis: Dashboard loads in <100ms
```

---

## 📈 Performance Expectations

### Load Times
| Component | With Redis | Without Redis | Target |
|-----------|------------|---------------|--------|
| Dashboard | <100ms | 1-2s | <2s |
| DEFCON | 24ms | 24ms | <50ms |
| Revenue Risk | 15ms | 15ms | <200ms |
| Predictions | 11ms | 11ms | <500ms |
| Actions | 15ms | 15ms | <500ms |

### Test Suite
| Metric | Expected |
|--------|----------|
| Total Duration | 3-5 minutes |
| Tests Passing | 14-16 (88-100%) |
| Performance | All targets exceeded |

---

## 🎯 Success Criteria

You're all set when you see:

### ✅ Development Server
```bash
npm run dev

# Output shows:
✓ Ready on http://localhost:38063
Using shopify.app.toml
Dev store: control-tower-2.myshopify.com
```

### ✅ Dashboard Loads
Visit http://localhost:38063/app/war-room

- Displays DEFCON status
- Shows risk metrics
- No console errors
- Navigation works

### ✅ Tests Pass
```bash
./run-all-tests.sh

# Output shows:
🎉 ALL TESTS PASSED! PRODUCTION READY! 🚀
✅ Tests Passed: 14-16
```

### ✅ Performance Good
```bash
npx tsx audit-war-room-performance.ts

# All services < target times
🚀 All targets exceeded by 52-99%!
```

---

## 🚀 Quick Commands Reference

```bash
# Start application
npm run dev

# Run all tests
./run-all-tests.sh

# Quick health check
npx tsx test-defcon-calculator.ts

# Performance audit
npx tsx audit-war-room-performance.ts

# Check database
npx tsx diagnose-order-corruption.ts

# View in browser
# http://localhost:XXXXX/app/war-room
```

---

## 📞 Need Help?

### Documentation
- **This Guide:** [START_HERE.md](START_HERE.md) ⭐ You are here!
- **Complete Testing:** [BFCM_COMPLETE_TESTING_GUIDE.md](BFCM_COMPLETE_TESTING_GUIDE.md)
- **Quick Reference:** [TESTING_QUICK_REFERENCE.md](TESTING_QUICK_REFERENCE.md)
- **Session 5 Results:** [BFCM_TESTING_SESSION_5_SUMMARY.md](BFCM_TESTING_SESSION_5_SUMMARY.md)

### Quick Checks
1. Is dev server running? (`npm run dev`)
2. Can you access dashboard? (http://localhost:XXXXX/app/war-room)
3. Do tests pass? (`./run-all-tests.sh`)
4. Is database healthy? (`npx tsx diagnose-order-corruption.ts`)

---

## 🎉 You're Ready!

If you can:
1. ✅ Start dev server (`npm run dev`)
2. ✅ Open dashboard in browser
3. ✅ See DEFCON status
4. ✅ Run tests successfully

**You're all set! The BFCM War Room is working!** 🚀

---

## Next Steps

1. **Explore the dashboard** - Click through all 5 sections
2. **Run simulations** - Try the Simulation Lab
3. **Check performance** - Run the performance audit
4. **Deploy to staging** - When ready for production
5. **User testing** - Get feedback from your team

**Happy testing!** 🎊
