# BFCM War Room Testing - Session Prompts

Quick copy-paste prompts to start each testing session with Claude Code.

**Dev Store:** control-tower-2.myshopify.com
**Test Date:** October 24, 2025 (BFCM simulation day)
**Existing Data:** 13,598 orders, 24 active products

---

## Session 1: Baseline Data Setup ✅

**Status:** Scripts ready, not yet executed
**Duration:** 60-90 minutes
**Goal:** Establish healthy baseline (Oct 1-23) with ~1,000 orders

### Quick Start Commands

```bash
# Step 1: Generate baseline orders (45-60 min)
cd ~/scripts/shopify-order-generator
source venv/bin/activate
python bfcm-order-generator.py

# Step 2: Sync to database (10-15 min)
cd ~/shopify-app-template-remix
npx tsx sync-and-verify-direct.ts

# Step 3: Verify baseline (5 min)
npx tsx verify-war-room-baseline.ts

# Step 4: Check dashboard (2 min)
npm run dev
# Visit: /app/war-room
```

### Session 1 Claude Prompt

```
I'm starting BFCM War Room testing Session 1: Baseline Data Setup.

CONTEXT:
- Dev store: control-tower-2.myshopify.com
- Current data: 13,598 orders, 24 active products
- Goal: Add ~1,000 baseline orders (Oct 1-23, 2025)
- All Session 1 scripts exist and are tested

VERIFY FILES EXIST:
1. Check these scripts are ready:
   - ~/scripts/shopify-order-generator/bfcm-order-generator.py
   - sync-and-verify-direct.ts
   - verify-war-room-baseline.ts

2. If missing, see:
   - SESSION_1_READY.md (quick guide)
   - BFCM_TESTING_SESSION_1.md (detailed guide)

EXECUTE SESSION 1:
Guide me through running these 4 steps:

Step 1: Generate ~1,000 baseline orders
Step 2: Sync orders + products to database
Step 3: Verify War Room baseline state
Step 4: Visual check in dashboard

EXPECTED RESULTS:
- Total orders: ~14,600 (13,598 + 1,000 new)
- DEFCON level: 4-5 (GUARDED/NORMAL)
- Risk score: 10-40/100
- Coverage: 400-800 hours
- All 8 verification tests passing

If issues occur, help me debug and fix before proceeding.
```

---

## Session 2: BFCM Day Critical Scenarios ⏳

**Status:** Not started (requires Session 1 complete)
**Duration:** 2-3 hours
**Goal:** Simulate BFCM surge, trigger DEFCON 1-2 escalation

### Session 2 Claude Prompt

```
I'm starting BFCM War Room testing Session 2: BFCM Day Critical Scenarios.

VALIDATE SESSION 1 FIRST:
Run these commands to verify baseline is ready:

npx tsx verify-war-room-baseline.ts
# Should show: DEFCON 4-5, ~14,600 orders, all tests passing

npm run dev
# Navigate to /app/war-room
# Should show: Healthy baseline, DEFCON 4-5

If validation fails, complete Session 1 first.

SESSION 2 OBJECTIVES:
Create 5 test scripts to simulate BFCM day crisis:

1. bfcm-day-surge-orders.py
   - Generate 300-500 orders on Oct 24, 2025
   - Focus on viral products (AirFlow Pro, Phone Case)
   - Peak velocity: 150-200 orders/hour
   - Build on Session 1 baseline (don't clear data)

2. create-stockout-scenarios.ts
   - Set critical inventory levels (0-10 units)
   - Target: 5-6 products with stockout risk
   - Update inventory snapshots
   - Create high burn rate conditions

3. test-defcon-escalation.ts
   - Verify DEFCON drops from 4-5 → 1-2
   - Validate risk score calculation
   - Test critical SKU thresholds
   - Check DEFCON status in database

4. test-revenue-risk.ts
   - Target: $50K-$150K revenue at risk
   - Verify 24h/48h/72h windows
   - Validate affected SKU counts
   - Test calculation accuracy

5. test-velocity-anomalies.ts
   - Expected: 5-6 viral products detected
   - Verify acceleration metrics
   - Test category surge detection
   - Validate anomaly thresholds

REQUIREMENTS:
- Use Oct 24, 2025 as BFCM day
- Don't clear Session 1 baseline data
- Create realistic stockout scenarios
- Target DEFCON 1-2 escalation
- All services must stay <200ms

EXPECTED RESULTS:
- DEFCON escalates to 1-2 (CRITICAL/SEVERE)
- Risk score: 70-95/100
- Revenue at risk: $50K-$150K
- Critical SKUs: 5-6
- Velocity anomalies: 5-6 viral products
- 8-10 critical alerts triggered

Create all 5 scripts, then guide me through execution.
```

### Quick Commands (after scripts created)

```bash
# Step 1: Generate BFCM day surge (30-40 min)
cd ~/scripts/shopify-order-generator
source venv/bin/activate
python3 bfcm-day-surge-orders.py

# Step 2: Create stockout scenarios (5 min)
cd ~/shopify-app-template-remix
npx tsx create-stockout-scenarios.ts

# Step 3: Sync to database (10 min)
npx tsx sync-and-verify-direct.ts

# Step 4: Verify DEFCON escalation (5 min)
npx tsx test-defcon-escalation.ts
npx tsx test-revenue-risk.ts
npx tsx test-velocity-anomalies.ts

# Step 5: Check dashboard (2 min)
npm run dev
# Visit: /app/war-room
# Should show: DEFCON 1-2, critical state
```

---

## Session 3: Predictions & Alerts Testing ⏳

**Status:** Not started (requires Session 2 complete)
**Duration:** 2 hours
**Goal:** Validate predictive intelligence and alert system

### Session 3 Claude Prompt

```
I'm starting BFCM War Room testing Session 3: Predictions & Alerts Testing.

VALIDATE SESSION 2 FIRST:
Run these commands to verify critical state:

npm run dev
# Navigate to /app/war-room
# Verify: DEFCON 1-2, Revenue at risk $50K-$150K, 5-6 critical SKUs

npx tsx test-defcon-escalation.ts
# Should show: DEFCON 1-2 confirmed

If validation fails, complete Session 2 first.

SESSION 3 OBJECTIVES:
Create 4 test scripts to validate predictions and alerts:

1. test-predictions-accuracy.ts
   - Validate 4hr/24hr/72hr forecasts
   - Test stockout countdown timers
   - Verify confidence intervals
   - Check category-level predictions
   - Compare predictions with actual burn rates

2. test-alert-rules.ts
   - Verify all alert rules evaluate correctly
   - Test critical stockout alerts (5-6 expected)
   - Validate velocity anomaly alerts
   - Check revenue risk alerts
   - Test alert threshold accuracy

3. test-alert-notifications.ts
   - Mock email notification delivery
   - Mock Slack notification delivery
   - Verify alert deduplication logic
   - Test alert cooldown periods
   - Check notification formatting

4. test-alert-dashboard.ts
   - Navigate to /app/war-room/alerts
   - Verify alert history displays
   - Test alert severity levels
   - Check alert acknowledgment
   - Validate search/filter functionality

REQUIREMENTS:
- Use real DEFCON 1-2 state from Session 2
- Test all prediction time windows
- Verify alert accuracy (no false positives)
- Test notification formatting
- All queries must be <200ms

EXPECTED RESULTS:
- 4hr predictions: 3-4 critical stockouts imminent
- 24hr predictions: 5-6 high-risk products
- 72hr predictions: Cover all viral products
- 8-10 critical alerts active
- Alert dashboard shows full history
- Email/Slack mock notifications formatted correctly

Create all 4 scripts, then guide me through execution.
```

### Quick Commands (after scripts created)

```bash
# Step 1: Test prediction accuracy (5 min)
npx tsx test-predictions-accuracy.ts

# Step 2: Test alert rules (5 min)
npx tsx test-alert-rules.ts

# Step 3: Test notifications (5 min)
npx tsx test-alert-notifications.ts

# Step 4: Visual alert dashboard check (5 min)
npm run dev
# Navigate to: /app/war-room/alerts
# Verify: 8-10 active alerts, history populated

# Step 5: Run comprehensive alert test (5 min)
npx tsx test-alert-dashboard.ts
```

---

## Session 4: Actions & Simulations Testing ⏳

**Status:** Not started (requires Session 3 complete)
**Duration:** 2-3 hours
**Goal:** Test prescriptive actions and simulation lab

### Session 4 Claude Prompt

```
I'm starting BFCM War Room testing Session 4: Actions & Simulations Testing.

VALIDATE SESSION 3 FIRST:
Run these commands to verify predictions and alerts working:

npm run dev
# Navigate to /app/war-room
# Verify: 4hr/24hr/72hr forecasts visible, countdowns running

# Navigate to /app/war-room/alerts
# Verify: 8-10 active alerts, history populated

npx tsx test-predictions-accuracy.ts
# Should show: All prediction tests passing

If validation fails, complete Session 3 first.

SESSION 4 OBJECTIVES:
Create 5 test scripts to validate actions and simulations:

1. test-recommendations.ts
   - Verify AI-powered action suggestions (10-15 actions)
   - Test ROI ranking algorithm
   - Check action prioritization logic
   - Validate all 4 action types:
     * Transfer actions (move inventory)
     * Reorder actions (purchase stock)
     * Price actions (adjust pricing)
     * Throttle actions (limit sales)

2. test-action-executor.ts
   - Execute transfer actions (mock Shopify API)
   - Execute reorder actions
   - Execute price adjustments
   - Test throttle recommendations
   - Verify action logging
   - Test rollback capability

3. test-action-dashboard.ts
   - Navigate to /app/war-room/actions
   - Verify recommended actions display
   - Test one-click action execution
   - Check action history/audit log
   - Validate action status tracking

4. test-simulation-engine.ts
   - Test flash sale scenario (20% off viral products)
   - Test traffic spike scenario (5x normal traffic)
   - Test fulfillment delay scenario (2-day delay)
   - Compare simulation results vs actual state
   - Verify impact calculations

5. test-playbooks.ts
   - Create "Viral Product Stockout" playbook
   - Create "Revenue Protection" playbook
   - Test playbook execution
   - Validate scenario templates
   - Check playbook reusability

REQUIREMENTS:
- Use DEFCON 1-2 state for realistic recommendations
- Mock Shopify API calls (don't modify actual inventory)
- Test all 4 action types
- Run 3+ simulation scenarios
- Create 2+ contingency playbooks
- Action execution must complete in <2s

EXPECTED RESULTS:
- 10-15 recommended actions generated
- All 4 action types represented
- Actions ranked by ROI/urgency
- 3 simulation scenarios completed
- 2 contingency playbooks created
- Action execution audit log complete
- Simulations show accurate impact predictions

Create all 5 scripts, then guide me through execution.
```

### Quick Commands (after scripts created)

```bash
# Step 1: Test recommendation engine (5 min)
npx tsx test-recommendations.ts

# Step 2: Test action execution (10 min)
npx tsx test-action-executor.ts

# Step 3: Visual action dashboard check (5 min)
npm run dev
# Navigate to: /app/war-room/actions
# Verify: 10-15 recommendations, execute one action

# Step 4: Test simulation lab (15 min)
npm run dev
# Navigate to: /app/war-room/simulate
npx tsx test-simulation-engine.ts

# Step 5: Test playbooks (10 min)
npx tsx test-playbooks.ts
```

---

## Session 5: ROI Tracking & E2E Testing ⏳

**Status:** Not started (requires Session 4 complete)
**Duration:** 2-3 hours
**Goal:** Test ROI attribution, performance, complete E2E validation

### Session 5 Claude Prompt

```
I'm starting BFCM War Room testing Session 5: ROI Tracking & E2E Testing.
This is the FINAL testing session!

VALIDATE SESSION 4 FIRST:
Run these commands to verify actions and simulations working:

npm run dev
# Navigate to /app/war-room/actions
# Verify: 10-15 recommended actions, history populated

# Navigate to /app/war-room/simulate
# Verify: 3+ simulation scenarios completed

npx tsx test-recommendations.ts
# Should show: All recommendation tests passing

If validation fails, complete Session 4 first.

SESSION 5 OBJECTIVES:
Create 5 test scripts for final validation:

1. test-roi-tracker.ts
   - Navigate to /app/war-room/roi
   - Verify revenue saved calculations
   - Test stockout prevention attribution
   - Validate action impact tracking
   - Check ROI dashboard displays correctly
   - Target: $50K-$150K revenue saved

2. test-attribution-engine.ts
   - Link actions to revenue outcomes
   - Track margin preservation
   - Test multi-action attribution
   - Validate decision audit trail
   - Verify attribution accuracy

3. test-performance-scoreboard.ts
   - Verify real-time KPIs display
   - Check vs. plan comparisons
   - Test vs. last year comparisons
   - Validate trend analysis
   - Test scoreboard calculations

4. test-war-room-e2e.ts
   - Complete user journey: Alert → Recommendation → Action → ROI
   - Test data flow: Webhook → Calculation → Cache → UI
   - Validate all services working together
   - Test concurrent operations
   - Verify dashboard load <500ms

5. audit-war-room-performance.ts
   - Measure all service response times
   - Test concurrent user scenarios (10+ users)
   - Validate cache hit rates (target: >80%)
   - Check database query performance
   - Verify all performance targets met

REQUIREMENTS:
- Use complete DEFCON 1-2 state with all session data
- Test ROI attribution for executed actions
- Validate performance scoreboard accuracy
- Run complete E2E user scenarios
- Performance audit across all services

PERFORMANCE TARGETS:
- DEFCON calculation: <50ms
- Revenue risk: <200ms
- Velocity detection: <200ms
- Predictions: <500ms
- Action execution: <2s
- Dashboard load: <500ms (cache hit)
- ROI tracker: <200ms
- Attribution engine: <1s

EXPECTED RESULTS:
- ROI tracker: $50K-$150K revenue saved
- Attribution: 10-15 actions linked to outcomes
- Performance scoreboard: Real-time KPIs displayed
- E2E test: Complete user journey successful
- Performance audit: All targets exceeded
- Cache hit rate: >80%

This is the final session - ensure EVERYTHING is production-ready!

Create all 5 scripts, then guide me through execution.
```

### Quick Commands (after scripts created)

```bash
# Step 1: Test ROI tracker (10 min)
npm run dev
# Navigate to: /app/war-room/roi
npx tsx test-roi-tracker.ts

# Step 2: Test attribution engine (10 min)
npx tsx test-attribution-engine.ts

# Step 3: Test performance scoreboard (5 min)
npx tsx test-performance-scoreboard.ts

# Step 4: Run E2E test (15 min)
npx tsx test-war-room-e2e.ts

# Step 5: Final performance audit (10 min)
npx tsx audit-war-room-performance.ts

# Step 6: Generate final report
# All results should be documented in SESSION_5_SUMMARY.md
```

---

## Quick Validation Between Sessions

### Check Database State

```bash
# Order count
npx tsx -e "import db from './app/db.server'; db.order.count().then(c => console.log('Orders:', c))"

# Inventory snapshots
npx tsx -e "import db from './app/db.server'; db.inventorySnapshot.count().then(c => console.log('Snapshots:', c))"

# Sync status
npx tsx -e "import db from './app/db.server'; db.syncStatus.findFirst().then(s => console.log(s))"
```

### Check DEFCON Status

```bash
# Quick DEFCON check
npx tsx -e "import { calculateDEFCON } from './app/services/defcon-calculator.server'; import db from './app/db.server'; db.session.findFirst().then(s => calculateDEFCON(s.shop).then(d => console.log('DEFCON', d.level, d.label, 'Risk:', d.riskScore)))"
```

### Check Dashboard

```bash
# Start dev server
npm run dev

# Navigate to:
# /app/war-room           - Main dashboard
# /app/war-room/alerts    - Alert system
# /app/war-room/actions   - Action center
# /app/war-room/simulate  - Simulation lab
# /app/war-room/roi       - ROI tracker
```

---

## Session Progress Tracking

- [x] Session 1: Baseline Data Setup - **SCRIPTS READY** (not executed)
- [ ] Session 2: BFCM Day Critical Scenarios - NOT STARTED
- [ ] Session 3: Predictions & Alerts Testing - NOT STARTED
- [ ] Session 4: Actions & Simulations Testing - NOT STARTED
- [ ] Session 5: ROI Tracking & E2E Testing - NOT STARTED

---

## Testing Goals Summary

| Session | State | DEFCON | Risk | Revenue at Risk | Critical SKUs |
|---------|-------|--------|------|-----------------|---------------|
| 1 | Baseline | 4-5 | 10-40 | $0 | 0 |
| 2 | Crisis | 1-2 | 70-95 | $50K-$150K | 5-6 |
| 3 | Validated | 1-2 | 70-95 | $50K-$150K | 5-6 |
| 4 | Actionable | 1-2 | 70-95 | $50K-$150K | 5-6 |
| 5 | Measured | 1-2 | 70-95 | $50K-$150K | 5-6 |

---

**Ready to test! Copy any session prompt above to start that session with Claude Code.** 🚀
