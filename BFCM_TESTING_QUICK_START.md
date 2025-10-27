# BFCM War Room Testing - Quick Start Guide

**Quick reference for running BFCM War Room comprehensive testing**

---

## 📋 Testing Sessions Overview

| Session | Focus | Duration | Scripts | Orders Generated |
|---------|-------|----------|---------|------------------|
| **1** | Baseline Data (Oct 1-23) | 1-1.5h | 3 | ~1,000 |
| **2** | BFCM Day Surge (Oct 24) | 2-3h | 5 | ~500 |
| **3** | Predictions & Alerts | 2-3h | 5 | 0 (analysis only) |
| **4** | Actions & Simulations | 2-3h | 5 | 0 (testing only) |
| **5** | ROI & E2E Testing | 2-3h | 6 | ~100 (E2E) |
| **Total** | | **10-15h** | **24** | **~1,600** |

---

## 🚀 Session 1: Baseline Data Setup

**Goal:** Create Oct 1-23, 2025 baseline with velocity patterns

### Quick Commands

```bash
# 0. Setup (first time only)
cd ~/shopify-app-template-remix
./setup-session-1.sh

# 1. Generate baseline orders (45-60 min)
cd ~/scripts/shopify-order-generator
source venv/bin/activate  # Activate virtual environment
python bfcm-order-generator.py

# 2. Sync to database (10-15 min)
cd ~/shopify-app-template-remix
npx tsx sync-and-verify-direct.ts

# 3. Verify baseline (5 min)
npx tsx verify-war-room-baseline.ts

# 4. Check dashboard
npm run dev  # Visit /app/war-room
```

**Expected Result:** DEFCON 4-5, ~1,000 orders, all tests passing

**Full docs:** [BFCM_TESTING_SESSION_1.md](BFCM_TESTING_SESSION_1.md)

---

## 🔥 Session 2: BFCM Day Critical Scenarios

**Goal:** Create Oct 24 surge and critical stockout scenarios

### Scripts to Create (Session 2)

1. `bfcm-day-surge-orders.py` - 300-500 orders on Oct 24
2. `create-stockout-scenarios.ts` - Adjust inventory for critical/warning states
3. `test-defcon-escalation.ts` - Monitor DEFCON 1-2 triggers
4. `test-revenue-risk.ts` - Validate $50K-$150K at risk
5. `test-velocity-anomalies.ts` - Verify viral product detection

**Expected Result:** DEFCON 1-2, revenue at risk $50K-$150K, 5-6 viral products

---

## 📊 Session 3: Predictions & Alerts

**Goal:** Test forecasting engine and alert system

### Scripts to Create (Session 3)

1. `test-predictions-accuracy.ts` - 4h/24h/72h forecasts
2. `test-stockout-countdowns.ts` - Minute-precision timers
3. `test-alert-rules.ts` - All 5 default rules
4. `trigger-test-alerts.ts` - Manual alert triggering
5. `test-category-forecasts.ts` - Category-level predictions

**Expected Result:** Accurate forecasts, 10-15 countdowns, 5-10 alerts triggered

---

## ⚡ Session 4: Actions & Simulations

**Goal:** Test recommendation engine and simulation scenarios

### Scripts to Create (Session 4)

1. `test-recommendations.ts` - All 4 action types
2. `execute-test-actions-sandbox.ts` - Sandbox execution
3. `run-simulation-scenarios.ts` - 6 simulation types
4. `test-playbook-execution.ts` - Playbook testing
5. `test-action-templates.ts` - Template validation

**Expected Result:** 15-20 recommendations, 6 simulations complete

---

## 💰 Session 5: ROI & E2E Testing

**Goal:** Validate financial tracking and run full simulation

### Scripts to Create (Session 5)

1. `seed-executed-actions.ts` - 20-30 historical actions
2. `test-roi-calculations.ts` - Revenue saved validation
3. `test-attribution-engine.ts` - Action→outcome linking
4. `test-performance-scoreboard.ts` - KPI calculations
5. `bfcm-full-day-simulation.ts` - Complete BFCM day
6. `generate-war-room-test-report.ts` - Final report

**Expected Result:** $50K-$200K tracked ROI, full E2E passing

---

## 📁 File Organization

```
shopify-app-template-remix/
├── BFCM Testing Plans
│   ├── BFCM_WAR_ROOM_PLAN.md           # Master plan
│   ├── BFCM_TESTING_QUICK_START.md     # This file
│   ├── BFCM_TESTING_SESSION_1.md       # Session 1 details
│   ├── BFCM_TESTING_SESSION_2.md       # (To be created)
│   ├── BFCM_TESTING_SESSION_3.md       # (To be created)
│   ├── BFCM_TESTING_SESSION_4.md       # (To be created)
│   └── BFCM_TESTING_SESSION_5.md       # (To be created)
│
├── Python Scripts (Order Generation)
│   ├── bfcm-order-generator.py         # Session 1: Oct 1-23 baseline
│   ├── bfcm-day-surge-orders.py        # Session 2: Oct 24 surge
│   └── bfcm-full-day-simulation.py     # Session 5: E2E test
│
├── TypeScript Scripts (Testing & Verification)
│   ├── Session 1 (Baseline)
│   │   ├── sync-and-verify.ts
│   │   └── verify-war-room-baseline.ts
│   │
│   ├── Session 2 (Critical Scenarios)
│   │   ├── create-stockout-scenarios.ts
│   │   ├── test-defcon-escalation.ts
│   │   ├── test-revenue-risk.ts
│   │   └── test-velocity-anomalies.ts
│   │
│   ├── Session 3 (Predictions & Alerts)
│   │   ├── test-predictions-accuracy.ts
│   │   ├── test-stockout-countdowns.ts
│   │   ├── test-alert-rules.ts
│   │   ├── trigger-test-alerts.ts
│   │   └── test-category-forecasts.ts
│   │
│   ├── Session 4 (Actions & Simulations)
│   │   ├── test-recommendations.ts
│   │   ├── execute-test-actions-sandbox.ts
│   │   ├── run-simulation-scenarios.ts
│   │   ├── test-playbook-execution.ts
│   │   └── test-action-templates.ts
│   │
│   └── Session 5 (ROI & E2E)
│       ├── seed-executed-actions.ts
│       ├── test-roi-calculations.ts
│       ├── test-attribution-engine.ts
│       ├── test-performance-scoreboard.ts
│       └── generate-war-room-test-report.ts
│
└── Existing Test Scripts
    ├── test-defcon-calculator.ts
    ├── test-revenue-risk.ts
    ├── test-velocity-anomalies.ts
    ├── test-prediction-engine.ts
    ├── test-alert-engine.ts
    ├── test-action-executor.ts
    ├── test-simulation-engine.ts
    ├── test-roi-tracker.ts
    └── test-war-room-e2e.ts
```

---

## 🔧 Environment Setup

### One-time Setup

```bash
# 1. Python environment (for order generation)
cd ~/scripts/shopify-order-generator
python3 -m venv venv
source venv/bin/activate
pip install requests python-dotenv

# Create .env file
cat > .env << EOF
SHOP_DOMAIN=control-tower-2.myshopify.com
ACCESS_TOKEN=your_admin_api_token
API_VERSION=2024-01
EOF

# 2. Node environment (for testing scripts)
cd ~/shopify-app-template-remix
npm install
npx prisma generate

# 3. Optional: Redis (for caching)
brew install redis  # macOS
# OR
sudo apt install redis  # Ubuntu
```

### Before Each Session

```bash
# Terminal 1: Dev server (for webhooks)
cd ~/shopify-app-template-remix
npm run dev

# Terminal 2: Redis (optional, for caching)
redis-server

# Terminal 3: Scripts execution
cd ~/shopify-app-template-remix
# Run session scripts here
```

---

## 🎯 Success Criteria

### Overall Testing Goals

- [ ] All 8 War Room features tested with realistic data
- [ ] DEFCON escalates correctly (5 → 1) based on scenarios
- [ ] Revenue at risk calculated accurately
- [ ] Velocity anomalies detected (viral products)
- [ ] Predictions generated for all horizons
- [ ] Alerts fire correctly
- [ ] Actions recommended and executed
- [ ] Simulations complete successfully
- [ ] ROI tracked accurately
- [ ] Performance targets met
- [ ] Full E2E test passes

### Performance Targets

| Metric | Target | Session |
|--------|--------|---------|
| Dashboard load (cache) | <100ms | 1, 5 |
| Dashboard load (DB) | <500ms | 1, 5 |
| DEFCON calculation | <50ms | 1, 2 |
| Revenue risk | <200ms | 2 |
| Predictions | <500ms | 3 |
| Alert evaluation | <100ms | 3 |
| Action execution | <2s | 4 |
| Simulation | <10s | 4 |
| ROI calculation | <500ms | 5 |

---

## 📊 Data Summary by Session

| Session | Orders | Products | Snapshots | Alerts | Actions | Simulations |
|---------|--------|----------|-----------|--------|---------|-------------|
| Existing | 13,598 | 24 | 12 | 0 | 5 | 0 |
| Session 1 | +1,000 | 24 | +24 | +5 rules | 0 | 0 |
| Session 2 | +500 | 24 | +24 | +10 | +5 | 0 |
| Session 3 | 0 | 24 | 0 | +5 | +10 | 0 |
| Session 4 | 0 | 24 | 0 | 0 | +10 | +6 |
| Session 5 | +100 | 24 | 0 | 0 | +15 | +3 |
| **Total** | **15,198** | **24** | **60** | **20** | **45** | **9** |

---

## 🐛 Common Issues & Solutions

### Issue: "No session found"

**Solution:**
```bash
# Authenticate via Shopify admin
npm run dev
# Visit: https://admin.shopify.com/store/control-tower-2/apps
# Click your app to authenticate
```

### Issue: Rate limit errors (429)

**Solution:**
- All scripts handle rate limiting automatically
- Wait for script to complete (may take 20-60 minutes for large batches)
- Dev store limit: 5 orders/minute (300/hour)

### Issue: DEFCON level unexpected

**Solution:**
```bash
# Regenerate inventory snapshots
npx tsx sync-and-verify.ts

# Check product inventory in Shopify admin
# Adjust stock levels if needed

# Re-calculate DEFCON
npx tsx test-defcon-calculator.ts
```

### Issue: Webhooks not syncing

**Solution:**
```bash
# Verify dev server running
npm run dev

# Check shopify.app.toml for webhook config
# Manually trigger sync
npx tsx sync-and-verify.ts
```

### Issue: Performance tests failing

**Solution:**
```bash
# Rebuild Prisma client
npx prisma generate

# Start Redis
redis-server

# Clear cache
npx tsx clear-roi-cache.ts

# Re-run tests
npx tsx verify-war-room-baseline.ts
```

---

## 📞 Support Resources

- **Shopify Admin API:** https://shopify.dev/docs/api/admin-graphql
- **War Room Docs:** [BFCM_WAR_ROOM_COMPLETE.md](BFCM_WAR_ROOM_COMPLETE.md)
- **Master Plan:** [BFCM_WAR_ROOM_PLAN.md](BFCM_WAR_ROOM_PLAN.md)
- **Session Details:** BFCM_TESTING_SESSION_*.md files

---

## ⏱️ Time Estimates

### Conservative (first-time execution)
- **Session 1:** 1.5 hours
- **Session 2:** 3 hours
- **Session 3:** 3 hours
- **Session 4:** 3 hours
- **Session 5:** 3 hours
- **Total:** 13.5 hours

### Optimistic (familiar with tools)
- **Session 1:** 1 hour
- **Session 2:** 2 hours
- **Session 3:** 2 hours
- **Session 4:** 2 hours
- **Session 5:** 2 hours
- **Total:** 9 hours

---

## 🎯 Next Steps

**Start with Session 1:**

1. Review [BFCM_TESTING_SESSION_1.md](BFCM_TESTING_SESSION_1.md)
2. Set up environment (Python + Node + Redis)
3. Run baseline order generator
4. Sync and verify
5. Check War Room dashboard

**Questions before starting?**
- Review environment prerequisites
- Check existing data: `npx tsx check-order-data.ts`
- Verify Shopify authentication works

**Ready to begin!** 🚀
