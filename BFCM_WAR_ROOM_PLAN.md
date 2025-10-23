# BFCM War Room: Multi-Session Implementation Plan

## Project Overview

Transform the Shopify analytics dashboard into a mission-critical command center for Black Friday/Cyber Monday (BFCM) operations. This feature provides real-time inventory intelligence, predictive analytics, and automated intervention capabilities to prevent stockouts and maximize revenue during peak shopping periods.

**Business Value:**
- Prevent stockouts worth $100K+ during peak season
- Reduce emergency shipping costs by 60%
- Capture competitor overflow (20-40% revenue uplift)
- Enable proactive crisis management
- Target price point: $10K+ for enterprise merchants

**Technical Approach:**
- Build on existing analytics infrastructure (Redis + Database + Webhooks)
- Leverage existing analytics API for ML predictions
- Progressive enhancement across 8 sessions
- Each session delivers testable, production-ready features

---

## Architecture Overview

### Data Flow
```
Shopify Webhooks → Local Database → Analytics Aggregator → Redis Cache
                                           ↓
                    Analytics API (ML) ← Historical Data
                                           ↓
                    War Room Dashboard ← Real-time Metrics
```

### Key Components
1. **DEFCON Status Engine** - Overall health scoring system
2. **Velocity Monitor** - Real-time burn rate tracking
3. **Predictive Engine** - 4hr/24hr/72hr forecasts
4. **Action Center** - Prescriptive recommendations
5. **Alert System** - Multi-channel notifications
6. **Simulation Lab** - What-if scenario testing

### Technology Stack
- **Frontend:** Remix + Polaris components
- **Backend:** Existing Shopify sync + Analytics API
- **Cache:** Redis (5-min TTL)
- **Database:** Prisma (extended schema)
- **Real-time:** Webhooks + incremental sync

---

## Session Breakdown

### Session 1: Foundation & DEFCON Status Board ✅
**Estimated Time:** 3-4 hours
**Priority:** CRITICAL - Foundation for all features

#### Goals
1. Extend database schema for War Room data models
2. Create DEFCON calculation service
3. Build basic War Room UI with status board
4. Implement health scoring algorithm

#### Deliverables
- [ ] Database schema extension
  - `WarRoomMetrics` model (DEFCON level, risk scores, timestamps)
  - `InventorySnapshot` model (real-time coverage calculations)
  - `AlertLog` model (historical alert tracking)
- [ ] Service: `app/services/defcon-calculator.server.ts`
  - Calculate inventory coverage hours
  - Compute velocity anomalies
  - Generate DEFCON level (1-5)
  - Track escalation triggers
- [ ] Route: `app/routes/app.war-room.tsx`
  - DEFCON status display with color coding
  - System health indicators
  - Last update timestamp
  - Quick stats overview
- [ ] Migration: `add_war_room_models`

#### Success Criteria
- [ ] DEFCON level displays correctly based on inventory coverage
- [ ] Color coding matches severity (Green/Blue/Yellow/Orange/Red)
- [ ] Updates every 5 minutes via Redis cache
- [ ] Manual refresh button works
- [ ] Database queries complete in <100ms

#### Testing Checklist
```bash
# Test DEFCON calculation
npx tsx test-defcon-calculator.ts

# Verify database schema
npx prisma studio

# Test War Room route loads
npm run dev
# Navigate to /app/war-room
# Verify DEFCON status displays
# Check browser console for errors
# Verify Redis cache hit/miss in logs
```

---

### Session 2: Mission Critical Metrics Dashboard ✅
**Estimated Time:** 3-4 hours
**Priority:** HIGH - Core analytics display

#### Prerequisites
- Session 1 complete and tested
- DEFCON board rendering correctly
- Database contains inventory snapshots

#### Goals
1. Build revenue-at-risk calculations
2. Create velocity anomaly detection
3. Display fulfillment capacity metrics
4. Integrate with existing analytics

#### Deliverables
- [ ] Service: `app/services/revenue-risk.server.ts`
  - Calculate revenue at risk (24h/48h/72h windows)
  - Break down by SKU, location, channel
  - Compute lost sale probability
  - Cache results in Redis (5min TTL)
- [ ] Service: `app/services/velocity-detector.server.ts`
  - Detect burn rate acceleration (>85th percentile)
  - Identify viral products (300%+ velocity increase)
  - Flag dead stock (<10% expected velocity)
  - Track category surge patterns
- [ ] Component: `app/components/MetricsDashboard.tsx`
  - Revenue at risk cards (24h/48h/72h)
  - Top 10 at-risk products table
  - Velocity anomaly alerts
  - Fulfillment capacity gauges
- [ ] Update: `app/routes/app.war-room.tsx`
  - Add metrics dashboard section
  - Wire up revenue risk data
  - Display velocity anomalies

#### Success Criteria
- [ ] Revenue at risk calculates correctly for test data
- [ ] Velocity anomalies detect products selling 2x+ forecast
- [ ] Dashboard displays all metrics without layout issues
- [ ] Data refreshes from cache in <100ms
- [ ] Mobile responsive layout works

#### Testing Checklist
```bash
# Generate test data with velocity spikes
npx tsx test-velocity-anomalies.ts

# Verify calculations
npx tsx test-revenue-risk.ts

# Load dashboard
npm run dev → /app/war-room
# Check revenue at risk displays
# Verify anomaly alerts show products
# Test responsive layout (resize browser)
# Check Redis cache keys: war-room:revenue-risk, war-room:velocity
```

---

### Session 3: Predictive Intelligence Engine ✅
**Estimated Time:** 4-5 hours
**Priority:** HIGH - Core differentiator

#### Prerequisites
- Session 1 & 2 complete
- Metrics dashboard displaying correctly
- Analytics API connection working

#### Goals
1. Integrate ML forecasting from analytics API
2. Build 4-hour stockout countdown
3. Create 24-hour demand scenarios
4. Implement 72-hour strategic forecasts

#### Deliverables
- [ ] Service: `app/services/prediction-engine.server.ts`
  - Call analytics API for demand forecasting
  - Calculate stockout countdown timers
  - Generate confidence intervals
  - Model best/likely/worst case scenarios
  - Cache predictions (15min TTL)
- [ ] Service: `app/services/stockout-countdown.server.ts`
  - Calculate exact stockout time per SKU
  - Factor in open orders, transfers in-transit
  - Adjust for velocity trends
  - Provide minute-level precision
- [ ] Component: `app/components/PredictionPanel.tsx`
  - 4-hour predictions section
  - 24-hour forecast scenarios
  - 72-hour strategic view
  - Countdown timers for critical SKUs
  - Confidence bands visualization
- [ ] Update: `app/routes/app.war-room.tsx`
  - Add prediction panel
  - Wire up forecast data
  - Display countdown timers

#### Success Criteria
- [ ] Stockout countdown accurate to within 30 minutes
- [ ] Demand scenarios show 3 cases (best/likely/worst)
- [ ] Confidence intervals display correctly
- [ ] Analytics API integration tested
- [ ] Predictions cache properly

#### Testing Checklist
```bash
# Test prediction engine
npx tsx test-prediction-engine.ts

# Verify analytics API integration
npx tsx test-analytics-api-forecasting.ts

# Load War Room
npm run dev → /app/war-room
# Verify countdown timers tick down
# Check scenario forecasts display
# Validate confidence bands render
# Test cache invalidation (trigger webhook)
```

---

### Session 4: Prescriptive Action Center ✅
**Estimated Time:** 4-5 hours
**Priority:** CRITICAL - Revenue impact driver

#### Prerequisites
- Session 1-3 complete
- Predictions displaying correctly
- DEFCON system working

#### Goals
1. Build recommendation engine
2. Create action prioritization (by ROI)
3. Implement one-click execution
4. Add action logging and rollback

#### Deliverables
- [ ] Service: `app/services/recommendation-engine.server.ts`
  - Detect transfer opportunities
  - Generate reorder triggers
  - Suggest price adjustments
  - Recommend traffic throttling
  - Calculate ROI for each action
  - Rank by expected revenue impact
- [ ] Service: `app/services/action-executor.server.ts`
  - Execute transfers via Shopify API
  - Create draft purchase orders
  - Update product prices
  - Pause/resume marketing campaigns
  - Log all actions for audit
  - Implement rollback capability
- [ ] Model: Add to schema
  - `RecommendedAction` (type, priority, roi, status)
  - `ExecutedAction` (action_id, result, timestamp, user_id)
  - `ActionTemplate` (pre-configured playbooks)
- [ ] Component: `app/components/ActionCenter.tsx`
  - Priority-ranked action queue
  - One-click execute buttons
  - Bulk approval interface
  - Action history log
  - ROI impact tracking
- [ ] Route: `app/routes/app.war-room.actions.tsx`
  - Action center UI
  - Execution handlers
  - Rollback interface

#### Success Criteria
- [ ] Recommendations generate correctly based on metrics
- [ ] ROI calculations accurate
- [ ] One-click execution works for test actions
- [ ] Action log persists in database
- [ ] Rollback restores previous state

#### Testing Checklist
```bash
# Test recommendation engine
npx tsx test-recommendations.ts

# Test action execution (sandbox mode)
npx tsx test-action-executor.ts --sandbox

# Load Action Center
npm run dev → /app/war-room/actions
# Verify actions display with ROI
# Test one-click execution (sandbox)
# Check action log updates
# Test rollback functionality
# Verify Shopify API calls succeed
```

---

### Session 5: Smart Alert System ✅
**Estimated Time:** 3-4 hours
**Priority:** MEDIUM - User engagement

#### Prerequisites
- Session 1-4 complete
- Action center working
- DEFCON levels calculating

#### Goals
1. Create alert rule engine
2. Implement multi-channel notifications
3. Build alert dashboard
4. Add alert history and analytics

#### Deliverables
- [ ] Service: `app/services/alert-engine.server.ts`
  - Monitor DEFCON escalations
  - Detect stockout countdowns
  - Track velocity anomalies
  - Check competitor status
  - Evaluate alert rules
  - Deduplicate similar alerts
- [ ] Service: `app/services/notification-dispatcher.server.ts`
  - Send email via existing email service
  - Post to Slack webhook
  - SMS via Twilio (optional)
  - In-app notifications
  - Respect user preferences
- [ ] Model: Add to schema
  - `AlertRule` (condition, severity, channels)
  - `AlertHistory` (rule_id, triggered_at, resolved_at)
  - `NotificationPreference` (user settings)
- [ ] Component: `app/components/AlertPanel.tsx`
  - Active alerts list
  - Alert severity badges
  - Acknowledge/dismiss actions
  - Alert history timeline
- [ ] Route: `app/routes/app.war-room.alerts.tsx`
  - Alert configuration UI
  - Alert history
  - Notification settings

#### Success Criteria
- [ ] Critical alerts trigger correctly
- [ ] Email notifications send successfully
- [ ] Slack integration works (if configured)
- [ ] Alert deduplication prevents spam
- [ ] User preferences respected

#### Testing Checklist
```bash
# Test alert rules
npx tsx test-alert-engine.ts

# Test notification dispatch
npx tsx test-notifications.ts --email --slack

# Trigger test alerts
npx tsx trigger-test-alert.ts --severity critical

# Load Alerts panel
npm run dev → /app/war-room/alerts
# Verify alerts display
# Test acknowledge/dismiss
# Check email received
# Verify Slack message (if configured)
```

---

### Session 6: Performance Scoreboard & Competitive Intelligence ✅
**Estimated Time:** 3-4 hours
**Priority:** MEDIUM - Analytics depth

#### Prerequisites
- Session 1-5 complete
- All core features working
- Metrics dashboard stable

#### Goals
1. Build performance tracking
2. Add competitive intelligence (mock data)
3. Create KPI comparison views
4. Implement trend analysis

#### Deliverables
- [ ] Service: `app/services/performance-tracker.server.ts`
  - Calculate revenue run rate
  - Track perfect order rate
  - Measure inventory efficiency
  - Compute margin protection
  - Compare vs. targets and prior year
- [ ] Service: `app/services/competitive-intel.server.ts`
  - Mock competitor data for demo
  - Calculate market share capture
  - Track pricing position
  - Measure category domination
  - Analyze substitution patterns
- [ ] Component: `app/components/Scoreboard.tsx`
  - Real-time KPIs
  - vs. Plan/Last Year comparisons
  - Trend sparklines
  - Competitive metrics cards
- [ ] Update: `app/routes/app.war-room.tsx`
  - Add scoreboard section
  - Display performance metrics
  - Show competitive position

#### Success Criteria
- [ ] KPIs calculate correctly
- [ ] Comparisons show accurate deltas
- [ ] Trend charts render properly
- [ ] Competitive data displays (mock)
- [ ] Dashboard layout remains clean

#### Testing Checklist
```bash
# Test performance calculations
npx tsx test-performance-tracker.ts

# Generate mock competitive data
npx tsx seed-competitive-data.ts

# Load War Room
npm run dev → /app/war-room
# Verify scoreboard displays
# Check KPI comparisons
# Validate trend charts
# Test competitive intel section
```

---

### Session 7: Simulation Command Center ✅
**Estimated Time:** 4-5 hours
**Priority:** MEDIUM - Premium feature

#### Prerequisites
- Session 1-6 complete
- Prediction engine stable
- Action center tested

#### Goals
1. Build what-if scenario engine
2. Create simulation UI
3. Implement contingency playbooks
4. Add scenario comparison

#### Deliverables
- [ ] Service: `app/services/simulation-engine.server.ts`
  - Model flash sale impacts
  - Simulate traffic spikes
  - Calculate supplier delay effects
  - Test carrier outage scenarios
  - Compare multiple scenarios
  - Export simulation results
- [ ] Service: `app/services/playbook-manager.server.ts`
  - Store pre-built contingency plans
  - Template-based scenario creation
  - Escalation path definitions
  - Resource allocation models
- [ ] Model: Add to schema
  - `Simulation` (scenario, parameters, results)
  - `Playbook` (name, triggers, actions)
  - `SimulationResult` (metrics, recommendations)
- [ ] Component: `app/components/SimulationLab.tsx`
  - Scenario parameter inputs
  - Run simulation button
  - Results comparison table
  - Playbook selector
- [ ] Route: `app/routes/app.war-room.simulate.tsx`
  - Simulation lab UI
  - Playbook library
  - Scenario history

#### Success Criteria
- [ ] Simulations run without errors
- [ ] Results logically consistent
- [ ] Playbooks load and execute
- [ ] Scenario comparison works
- [ ] UI intuitive and responsive

#### Testing Checklist
```bash
# Test simulation engine
npx tsx test-simulation-engine.ts

# Run test scenarios
npx tsx run-test-scenarios.ts

# Load Simulation Lab
npm run dev → /app/war-room/simulate
# Create flash sale scenario
# Run simulation
# Compare multiple scenarios
# Test playbook activation
# Verify results export
```

---

### Session 8: Financial Impact Tracker & Polish ✅
**Estimated Time:** 3-4 hours
**Priority:** HIGH - ROI demonstration

#### Prerequisites
- Session 1-7 complete
- All features tested individually
- Integration testing passed

#### Goals
1. Build ROI tracking system
2. Create attribution engine
3. Add financial impact dashboard
4. Final polish and optimization

#### Deliverables
- [ ] Service: `app/services/roi-tracker.server.ts`
  - Track revenue saved from prevented stockouts
  - Calculate margin protected (avoided expedited shipping)
  - Measure opportunity captured (competitor overflow)
  - Attribute outcomes to specific actions
  - Generate ROI reports
- [ ] Service: `app/services/attribution-engine.server.ts`
  - Log decision audit trail
  - Perform counterfactual analysis
  - Identify success patterns
  - Track model accuracy
  - Continuous improvement metrics
- [ ] Component: `app/components/ROIDashboard.tsx`
  - Revenue saved counter
  - Margin protected display
  - Opportunity captured metrics
  - Attribution breakdown
  - Hourly tracking chart
- [ ] Route: `app/routes/app.war-room.roi.tsx`
  - Financial impact dashboard
  - Attribution reports
  - Decision audit log
- [ ] Polish:
  - Performance optimization (all queries <100ms)
  - Mobile responsive refinements
  - Loading states and error handling
  - Help documentation
  - Onboarding tour

#### Success Criteria
- [ ] ROI calculations accurate
- [ ] Attribution logic sound
- [ ] All dashboards load <100ms
- [ ] Mobile layout perfect
- [ ] No console errors
- [ ] Help docs complete

#### Testing Checklist
```bash
# Test ROI tracking
npx tsx test-roi-tracker.ts

# Test attribution
npx tsx test-attribution-engine.ts

# Full integration test
npm run dev
# Test all War Room features
# Navigate through all sections
# Verify data consistency
# Check mobile responsiveness
# Test with real webhook data
# Load test with 1000+ products

# Performance audit
npx tsx audit-war-room-performance.ts
```

---

## Session Start Prompts

### Session 1 Start Prompt
```
I'm ready to start Session 1 of the BFCM War Room implementation. Please:

1. Read BFCM_WAR_ROOM_PLAN.md Session 1 section
2. Verify current analytics infrastructure is working (Redis, Database, Webhooks)
3. Create database schema extension for War Room models
4. Build DEFCON calculation service
5. Create basic War Room UI route
6. Test DEFCON status board displays correctly

Prerequisites check:
- Analytics dashboard loads in <100ms (Session 6 from analytics optimization)
- Redis cache is operational
- Webhook sync is working
- Database has recent orders and products

Please confirm prerequisites are met, then proceed with Session 1 deliverables.
```

### Session 2 Start Prompt
```
I'm ready to start Session 2 of the BFCM War Room implementation. Please:

1. Read BFCM_WAR_ROOM_PLAN.md Session 2 section
2. Verify Session 1 is complete:
   - War Room route exists and loads
   - DEFCON status displays correctly
   - Database schema migration applied
3. Build revenue-at-risk calculation service
4. Create velocity anomaly detector
5. Build metrics dashboard component
6. Test all metrics display correctly

Prerequisites check:
- /app/war-room route loads successfully
- DEFCON level shows correct color coding
- Database has WarRoomMetrics and InventorySnapshot tables

Please confirm Session 1 is working, then proceed with Session 2 deliverables.
```

### Session 3 Start Prompt
```
I'm ready to start Session 3 of the BFCM War Room implementation. Please:

1. Read BFCM_WAR_ROOM_PLAN.md Session 3 section
2. Verify Session 2 is complete:
   - Metrics dashboard displays revenue at risk
   - Velocity anomalies detected correctly
   - All metrics update from cache
3. Build prediction engine with analytics API integration
4. Create stockout countdown service
5. Build prediction panel component
6. Test forecasts and countdowns display correctly

Prerequisites check:
- Revenue at risk calculations working
- Velocity detector identifying anomalies
- Analytics API connection available (app/utils/analytics-api.ts)

Please confirm Session 2 is working, then proceed with Session 3 deliverables.
```

### Session 4 Start Prompt
```
I'm ready to start Session 4 of the BFCM War Room implementation. Please:

1. Read BFCM_WAR_ROOM_PLAN.md Session 4 section
2. Verify Session 3 is complete:
   - Prediction engine displays forecasts
   - Stockout countdowns working
   - Confidence intervals render correctly
3. Build recommendation engine
4. Create action executor service
5. Build action center UI
6. Test action execution in sandbox mode

Prerequisites check:
- Predictions displaying for next 4/24/72 hours
- Countdown timers functioning
- Shopify API connection working

Please confirm Session 3 is working, then proceed with Session 4 deliverables.
```

### Session 5 Start Prompt
```
I'm ready to start Session 5 of the BFCM War Room implementation. Please:

1. Read BFCM_WAR_ROOM_PLAN.md Session 5 section
2. Verify Session 4 is complete:
   - Action center displays recommendations
   - ROI calculations accurate
   - One-click execution works
3. Build alert rule engine
4. Create notification dispatcher
5. Build alert panel UI
6. Test multi-channel notifications

Prerequisites check:
- Action center generating recommendations
- Action execution logging correctly
- DEFCON escalations triggering

Please confirm Session 4 is working, then proceed with Session 5 deliverables.
```

### Session 6 Start Prompt
```
I'm ready to start Session 6 of the BFCM War Room implementation. Please:

1. Read BFCM_WAR_ROOM_PLAN.md Session 6 section
2. Verify Session 5 is complete:
   - Alert engine detecting conditions
   - Notifications dispatching correctly
   - Alert history tracking
3. Build performance tracker
4. Create competitive intelligence (mock data)
5. Build scoreboard component
6. Test KPIs and comparisons

Prerequisites check:
- Alerts triggering correctly
- Notification preferences working
- Performance metrics available in database

Please confirm Session 5 is working, then proceed with Session 6 deliverables.
```

### Session 7 Start Prompt
```
I'm ready to start Session 7 of the BFCM War Room implementation. Please:

1. Read BFCM_WAR_ROOM_PLAN.md Session 7 section
2. Verify Session 6 is complete:
   - Scoreboard displaying KPIs
   - Competitive metrics showing
   - Trend analysis working
3. Build simulation engine
4. Create playbook manager
5. Build simulation lab UI
6. Test scenario execution

Prerequisites check:
- Performance metrics calculating
- All previous dashboards stable
- Prediction engine reliable

Please confirm Session 6 is working, then proceed with Session 7 deliverables.
```

### Session 8 Start Prompt
```
I'm ready to start Session 8 of the BFCM War Room implementation. Please:

1. Read BFCM_WAR_ROOM_PLAN.md Session 8 section
2. Verify Session 7 is complete:
   - Simulation lab running scenarios
   - Playbooks executing
   - Results comparing correctly
3. Build ROI tracking system
4. Create attribution engine
5. Build financial impact dashboard
6. Final polish and optimization
7. Complete end-to-end testing

Prerequisites check:
- All 7 previous sessions complete
- All dashboards functional
- No critical bugs

Please confirm Session 7 is working, then proceed with Session 8 deliverables and final polish.
```

---

## Testing Strategy

### Unit Testing
Each service should have accompanying test file:
- `test-defcon-calculator.ts`
- `test-revenue-risk.ts`
- `test-velocity-detector.ts`
- `test-prediction-engine.ts`
- `test-recommendation-engine.ts`
- `test-alert-engine.ts`
- `test-simulation-engine.ts`
- `test-roi-tracker.ts`

### Integration Testing
After each session:
1. Load War Room dashboard
2. Verify new features display
3. Check Redis cache hit/miss
4. Monitor database query performance
5. Test with webhook-triggered updates

### End-to-End Testing (Session 8)
1. Simulate full BFCM day with test data
2. Trigger velocity spikes
3. Generate stockout scenarios
4. Execute recommended actions
5. Verify alerts fire correctly
6. Validate ROI tracking

### Performance Benchmarks
- Dashboard load: <100ms (cache hit)
- Dashboard load: <2s (cache miss, DB only)
- DEFCON calculation: <50ms
- Revenue risk calculation: <200ms
- Prediction engine: <500ms
- Action execution: <2s

---

## Database Schema Extensions

### Session 1 Models
```prisma
model WarRoomMetrics {
  id                String   @id @default(cuid())
  defconLevel       Int      // 1-5
  inventoryCoverageHours Float
  velocityAnomaly   Float
  riskScore         Float
  escalationTriggers Json
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model InventorySnapshot {
  id                String   @id @default(cuid())
  sku               String
  location          String
  currentStock      Int
  burnRate          Float    // units/hour
  coverageHours     Float
  reorderPoint      Int
  createdAt         DateTime @default(now())

  @@index([sku, location])
  @@index([createdAt])
}

model AlertLog {
  id          String   @id @default(cuid())
  severity    String   // critical, warning, info
  title       String
  message     String
  metadata    Json
  acknowledged Boolean @default(false)
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())

  @@index([severity, createdAt])
}
```

### Session 4 Models
```prisma
model RecommendedAction {
  id          String   @id @default(cuid())
  type        String   // transfer, reorder, price, throttle
  priority    Int      // 1-10
  estimatedROI Float
  status      String   // pending, approved, executing, completed, failed
  parameters  Json
  createdAt   DateTime @default(now())

  executedActions ExecutedAction[]

  @@index([status, priority])
}

model ExecutedAction {
  id              String   @id @default(cuid())
  recommendationId String
  result          String
  revenue         Float?
  cost            Float?
  metadata        Json
  executedBy      String
  executedAt      DateTime @default(now())
  rolledBackAt    DateTime?

  recommendation  RecommendedAction @relation(fields: [recommendationId], references: [id])

  @@index([recommendationId])
}

model ActionTemplate {
  id          String @id @default(cuid())
  name        String
  description String
  type        String
  parameters  Json
  active      Boolean @default(true)
  createdAt   DateTime @default(now())
}
```

### Session 5 Models
```prisma
model AlertRule {
  id          String   @id @default(cuid())
  name        String
  condition   Json
  severity    String
  channels    Json     // ['email', 'slack', 'sms']
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  history     AlertHistory[]
}

model AlertHistory {
  id          String   @id @default(cuid())
  ruleId      String
  triggeredAt DateTime @default(now())
  resolvedAt  DateTime?
  metadata    Json

  rule        AlertRule @relation(fields: [ruleId], references: [id])

  @@index([ruleId, triggeredAt])
}

model NotificationPreference {
  id        String @id @default(cuid())
  userId    String @unique
  email     Boolean @default(true)
  slack     Boolean @default(false)
  sms       Boolean @default(false)
  settings  Json
}
```

### Session 7 Models
```prisma
model Simulation {
  id          String   @id @default(cuid())
  name        String
  scenario    String   // flash_sale, traffic_spike, supplier_delay
  parameters  Json
  status      String   // running, completed, failed
  createdAt   DateTime @default(now())
  completedAt DateTime?

  results     SimulationResult[]
}

model SimulationResult {
  id            String   @id @default(cuid())
  simulationId  String
  metrics       Json
  recommendations Json
  impactScore   Float
  createdAt     DateTime @default(now())

  simulation    Simulation @relation(fields: [simulationId], references: [id])

  @@index([simulationId])
}

model Playbook {
  id          String @id @default(cuid())
  name        String
  description String
  triggers    Json
  actions     Json
  active      Boolean @default(true)
  createdAt   DateTime @default(now())
}
```

---

## Redis Cache Strategy

### Cache Keys
```
war-room:defcon                    # TTL: 5 min
war-room:revenue-risk              # TTL: 5 min
war-room:velocity-anomalies        # TTL: 5 min
war-room:predictions:4h            # TTL: 15 min
war-room:predictions:24h           # TTL: 1 hour
war-room:predictions:72h           # TTL: 4 hours
war-room:recommendations           # TTL: 5 min
war-room:performance-kpis          # TTL: 5 min
war-room:competitive-intel         # TTL: 1 hour
```

### Cache Invalidation Triggers
- Order webhook → Invalidate revenue-risk, velocity, defcon
- Product webhook → Invalidate predictions, recommendations
- Inventory webhook → Invalidate all cache keys
- Action executed → Invalidate recommendations

---

## API Integration Points

### Analytics API (Existing)
- `POST /api/forecast` - Demand forecasting
- `POST /api/anomaly-detection` - Velocity anomalies
- `POST /api/optimize-reorder` - Reorder point optimization

### Shopify Admin API (New Calls)
- `inventoryAdjust` mutation - Execute transfers
- `draftOrderCreate` - Generate purchase orders
- `productUpdate` - Price adjustments
- `inventoryItemUpdate` - Stock level changes

### External Services (Optional)
- Slack Incoming Webhook
- Twilio SMS API
- SendGrid Email API

---

## Success Metrics

### Technical Performance
- [ ] Dashboard load time: <100ms (cache hit), <2s (cache miss)
- [ ] All service methods: <500ms execution time
- [ ] Zero N+1 queries
- [ ] Cache hit rate: >80%
- [ ] Mobile responsive on all screen sizes

### Feature Completeness
- [ ] DEFCON status calculates correctly
- [ ] Revenue at risk accurate within 10%
- [ ] Stockout countdown accurate within 1 hour
- [ ] Recommendations generate for >80% of scenarios
- [ ] Alerts trigger with <5 min latency
- [ ] Simulations complete in <10 seconds
- [ ] ROI tracking attributes >90% of actions

### User Experience
- [ ] Intuitive navigation between sections
- [ ] Clear error messages
- [ ] Loading states for all async operations
- [ ] Help documentation accessible
- [ ] Onboarding tour guides first use

---

## Post-Implementation Checklist

### Documentation
- [ ] Update CLAUDE.md with War Room section
- [ ] Create WAR_ROOM_USER_GUIDE.md
- [ ] Document API endpoints in WAR_ROOM_API.md
- [ ] Add deployment notes to README.md

### Production Readiness
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Redis failover tested (graceful degradation)
- [ ] Error logging configured
- [ ] Monitoring alerts set up

### Future Enhancements
- [ ] Real competitive data integration
- [ ] Advanced ML models (beyond analytics API)
- [ ] Multi-location optimization
- [ ] Automated action execution (beyond one-click)
- [ ] Mobile app companion
- [ ] White-label customization

---

## Session Dependencies Graph

```
Session 1 (Foundation)
    ↓
Session 2 (Metrics) ← Depends on Session 1
    ↓
Session 3 (Predictions) ← Depends on Session 1, 2
    ↓
Session 4 (Actions) ← Depends on Session 1, 2, 3
    ↓
Session 5 (Alerts) ← Depends on Session 1, 4
    ↓
Session 6 (Scoreboard) ← Depends on Session 1, 2, 4
    ↓
Session 7 (Simulation) ← Depends on Session 3, 4
    ↓
Session 8 (ROI & Polish) ← Depends on ALL sessions
```

---

## Risk Mitigation

### Context Fatigue Prevention
- Each session limited to 3-5 hours
- Clear start/stop prompts
- Comprehensive testing after each session
- Session summary documentation

### Technical Risks
- **Redis unavailable:** Graceful fallback to database
- **Analytics API down:** Use cached predictions
- **Shopify API rate limits:** Queue actions, retry logic
- **Database performance:** Indexes on all query fields

### Scope Creep Prevention
- Stick to session deliverables
- Mark "future enhancements" separately
- Timebox each session
- Test before moving to next session

---

## Revenue Impact Projection

### Prevented Stockouts
- Average merchant: $500K BFCM weekend revenue
- Typical stockout rate: 15-20% of top SKUs
- Revenue at risk: $75-100K
- War Room prevention rate: 60-80%
- **Revenue saved: $45-80K per merchant**

### Avoided Emergency Costs
- Emergency air freight: $10-20K per incident
- Expedited shipping: $5-15K over weekend
- Lost margin: $15-30K from discounting alternatives
- **Cost avoided: $30-65K per merchant**

### Competitive Capture
- Competitor stockout rate: 20-30%
- Market overflow: 10-15% of competitor revenue
- Merchant capture rate: 30-50% if in stock
- **Opportunity revenue: $15-50K per merchant**

### Total Value
**Per merchant per BFCM: $90-195K value creation**
**Subscription price: $10K (5-20x ROI)**

---

## Next Steps After Completion

1. **Beta Testing**
   - Select 5-10 pilot merchants
   - Run simulations with historical BFCM data
   - Collect feedback and iterate

2. **Marketing Enablement**
   - Create demo videos
   - Write case studies
   - Build sales collateral
   - Develop ROI calculator

3. **Sales Strategy**
   - Target merchants with $5M+ annual revenue
   - Focus on multi-location businesses
   - Emphasize enterprise features
   - Offer BFCM guarantee

4. **Support Preparation**
   - Train support team on War Room features
   - Create troubleshooting guides
   - Develop escalation playbooks
   - Set up monitoring dashboards

---

## Questions for Product/Business Team

1. Do we have access to competitor inventory data, or should Session 6 use mock data?
2. What email/SMS/Slack services are already integrated?
3. Should action execution be fully automated or require human approval?
4. What are the target KPIs for beta testing success?
5. Do we have historical BFCM data for simulation testing?
6. What's the go-to-market timeline for this feature?

---

**Implementation Start Date:** [To be scheduled]
**Estimated Completion:** 8 sessions × 4 hours = 32 hours (~4-6 weeks at 2 sessions/week)
**Target Launch:** 6 weeks before BFCM 2025 (October 1, 2025)

