# BFCM War Room: Quick Start Guide

**Ready to start building the War Room feature? Start here!**

---

## 🎯 What You're Building

A mission-critical command center for BFCM operations that helps merchants:
- Prevent $100K+ in stockout losses
- Get real-time alerts before disasters happen
- See 4hr/24hr/72hr forecasts with AI predictions
- Execute one-click actions to fix problems
- Track ROI from every decision

**Think of it as:** Air traffic control for inventory during the busiest shopping weekend of the year.

---

## 📋 Before You Begin

### Prerequisites Check
1. **Analytics infrastructure working?**
   ```bash
   # Test analytics dashboard
   npm run dev
   # Navigate to /app/analytics - should load in <100ms
   ```

2. **Redis running?**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. **Database has data?**
   ```bash
   npx prisma studio
   # Check: Orders, Products, AnalyticsSnapshot tables have data
   ```

4. **GCP Pub/Sub webhooks syncing?**
   ```bash
   # Test GCP Pub/Sub webhook system
   npm run test-gcp-pubsub
   # Should show: "✅ All tests passed! Your GCP Pub/Sub setup is working correctly."

   # Or verify consumer is receiving webhooks
   npm run gcp-consumer
   # Should show: "👂 Waiting for webhook messages..."
   # Create a test order in Shopify Admin and verify webhook arrives
   ```

✅ **All good?** Proceed to Session 1!

⚠️ **Something broken?** Fix analytics infrastructure first - War Room builds on top of it.

---

## 🚀 Starting Session 1

### Step 1: Read the Plan
Open and read these sections in order:
1. [BFCM_WAR_ROOM_PLAN.md](BFCM_WAR_ROOM_PLAN.md) - Overview and architecture
2. BFCM_WAR_ROOM_PLAN.md → "Session 1" section - Detailed deliverables
3. [WAR_ROOM_SESSION_STATUS.md](WAR_ROOM_SESSION_STATUS.md) → "Session 1" - Checklist

### Step 2: Use the Start Prompt
Copy this exact prompt to Claude:

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
- GCP Pub/Sub webhook system is working (test with: npm run test-gcp-pubsub)
- GCP consumer is receiving webhooks (test with: npm run gcp-consumer)
- Database has recent orders and products

Please confirm prerequisites are met, then proceed with Session 1 deliverables.
```

### Step 3: What Gets Built
By the end of Session 1, you'll have:
- ✅ 3 new database models (WarRoomMetrics, InventorySnapshot, AlertLog)
- ✅ DEFCON calculator service (calculates health score 1-5)
- ✅ War Room route at `/app/war-room`
- ✅ Status board showing DEFCON level with color coding

### Step 4: Testing Your Work
```bash
# Test DEFCON calculation
npx tsx test-defcon-calculator.ts

# View database
npx prisma studio

# Test War Room UI
npm run dev
# Navigate to /app/war-room
# Should see DEFCON status with color coding (Green/Blue/Yellow/Orange/Red)
```

### Step 5: Mark Complete
Update [WAR_ROOM_SESSION_STATUS.md](WAR_ROOM_SESSION_STATUS.md):
- Change Session 1 status: ⏳ NOT STARTED → ✅ COMPLETE
- Check off all deliverables
- Add completion date and duration
- Note any issues or lessons learned

---

## 📊 Session Sequence

Each session builds on the previous one:

```
Session 1: Foundation (DEFCON Board)
    ↓
Session 2: Metrics (Revenue at Risk, Velocity)
    ↓
Session 3: Predictions (Stockout Countdowns, Forecasts)
    ↓
Session 4: Actions (Recommendations, Execution)
    ↓
Session 5: Alerts (Smart Notifications)
    ↓
Session 6: Scoreboard (Performance KPIs)
    ↓
Session 7: Simulation (What-If Scenarios)
    ↓
Session 8: ROI & Polish (Financial Impact)
```

**Never skip sessions!** Each depends on the previous one.

---

## 🎓 Key Concepts

### DEFCON Levels
The War Room uses a 5-level severity system (like military readiness):
- **DEFCON 5 (Green):** All good, 72+ hours inventory coverage
- **DEFCON 4 (Blue):** Minor concerns, 48-72 hours coverage
- **DEFCON 3 (Yellow):** Issues developing, 24-48 hours coverage
- **DEFCON 2 (Orange):** Critical, <24 hours coverage
- **DEFCON 1 (Red):** Active failures, stockouts happening NOW

### Velocity Anomalies
Products selling faster/slower than expected:
- **Viral Products:** 300%+ velocity increase (TikTok spike!)
- **Burn Rate Acceleration:** >85th percentile of forecast
- **Dead Stock:** <10% expected velocity (redirect traffic)

### Stockout Countdown
Exact time until out-of-stock:
```
Current Stock: 500 units
Burn Rate: 50 units/hour
Countdown: 10 hours (stockout at 3:00 PM)
```

### Revenue at Risk
Money you'll lose if you stockout:
```
SKU-123: 100 units left × $50/unit × 80% sell-through = $4,000 at risk
```

---

## 📁 File Structure (After All Sessions)

```
app/
├── routes/
│   ├── app.war-room.tsx              # Main dashboard (Session 1)
│   ├── app.war-room.actions.tsx      # Action center (Session 4)
│   ├── app.war-room.alerts.tsx       # Alert management (Session 5)
│   ├── app.war-room.simulate.tsx     # Simulation lab (Session 7)
│   └── app.war-room.roi.tsx          # ROI tracking (Session 8)
├── services/
│   ├── defcon-calculator.server.ts   # DEFCON levels (Session 1)
│   ├── revenue-risk.server.ts        # Revenue at risk (Session 2)
│   ├── velocity-detector.server.ts   # Velocity anomalies (Session 2)
│   ├── prediction-engine.server.ts   # Forecasting (Session 3)
│   ├── stockout-countdown.server.ts  # Countdown timers (Session 3)
│   ├── recommendation-engine.server.ts # Actions (Session 4)
│   ├── action-executor.server.ts     # Execute actions (Session 4)
│   ├── alert-engine.server.ts        # Alert rules (Session 5)
│   ├── notification-dispatcher.server.ts # Send alerts (Session 5)
│   ├── performance-tracker.server.ts # KPIs (Session 6)
│   ├── competitive-intel.server.ts   # Competition (Session 6)
│   ├── simulation-engine.server.ts   # What-if (Session 7)
│   ├── playbook-manager.server.ts    # Playbooks (Session 7)
│   ├── roi-tracker.server.ts         # ROI (Session 8)
│   └── attribution-engine.server.ts  # Attribution (Session 8)
└── components/
    ├── MetricsDashboard.tsx          # Metrics (Session 2)
    ├── PredictionPanel.tsx           # Predictions (Session 3)
    ├── ActionCenter.tsx              # Actions (Session 4)
    ├── AlertPanel.tsx                # Alerts (Session 5)
    ├── Scoreboard.tsx                # Scoreboard (Session 6)
    ├── SimulationLab.tsx             # Simulation (Session 7)
    └── ROIDashboard.tsx              # ROI (Session 8)

prisma/
└── schema.prisma                     # Extended with War Room models

test files/
├── test-defcon-calculator.ts
├── test-revenue-risk.ts
├── test-velocity-anomalies.ts
├── test-prediction-engine.ts
├── test-recommendations.ts
├── test-alert-engine.ts
├── test-performance-tracker.ts
├── test-simulation-engine.ts
└── test-roi-tracker.ts
```

---

## 🛠️ Development Tips

### Performance First
Every query must be fast:
- Use Redis cache (5-15min TTL)
- Pre-compute expensive calculations
- Index all database queries
- Target: <100ms dashboard load

### Graceful Degradation
Always handle failures:
```typescript
// Redis unavailable? Fall back to database
const data = await cache.get('key') || await db.query();

// Analytics API down? Use cached predictions
const forecast = await predictAPI().catch(() => cachedForecast);
```

### Test After Every Session
Don't skip testing! Each session has specific tests:
```bash
# Session 1
npx tsx test-defcon-calculator.ts

# Session 2
npx tsx test-revenue-risk.ts
npx tsx test-velocity-anomalies.ts

# Session 3
npx tsx test-prediction-engine.ts
# ... etc
```

### Update Documentation
After each session, update:
1. WAR_ROOM_SESSION_STATUS.md - Mark complete, add notes
2. CLAUDE.md - Update "Active Development Tasks" if needed
3. Commit with clear message:
   ```bash
   git add .
   git commit -m "War Room Session 1: DEFCON Status Board

   - Added database models for war room metrics
   - Implemented DEFCON calculation service
   - Created war room UI route with status board
   - All tests passing, load time <100ms

   🤖 Generated with Claude Code"
   ```

---

## 🐛 Common Issues

### "Redis connection failed"
```bash
# Start Redis locally
redis-server

# Or use remote Redis
export REDIS_URL="redis://your-redis-url:6379"
```

### "Table does not exist"
```bash
# Run migrations
npx prisma migrate dev

# Or reset database
npx prisma migrate reset
```

### "Shopify API rate limit"
- Actions use Shopify API - batch requests
- Add 500ms delay between calls
- Queue actions instead of executing immediately

### "Analytics API timeout"
- Cache predictions for 15+ minutes
- Graceful fallback to previous forecast
- Don't block UI on external API

### "GCP Pub/Sub webhooks not arriving"
```bash
# Verify GCP setup
npm run check-gcp-setup
# Should show all ✅

# Test webhook system
npm run test-gcp-pubsub
# Should publish and receive test message

# Start consumer
npm run gcp-consumer
# Should show: "👂 Waiting for webhook messages..."

# Grant Shopify permission to publish (if needed)
gcloud pubsub topics add-iam-policy-binding control-tower \
  --member='serviceAccount:shopify-eventbridge@shopify-prs.iam.gserviceaccount.com' \
  --role='roles/pubsub.publisher' \
  --project=shop-webhooks
```

See [TESTING_GCP_PUBSUB_WEBHOOKS.md](TESTING_GCP_PUBSUB_WEBHOOKS.md) for detailed troubleshooting.

---

## 📞 Getting Help

### During Implementation
1. Check BFCM_WAR_ROOM_PLAN.md for detailed specs
2. Review WAR_ROOM_SESSION_STATUS.md for checklist
3. Look at existing analytics code for patterns (app/services/, app/routes/app.analytics.tsx)

### Stuck on a Session?
1. Re-read the session deliverables
2. Check if previous session is truly complete
3. Review "Success Criteria" for that session
4. Test each component individually

### Architecture Questions?
- **Cache strategy:** See REDIS_DEPLOYMENT_GUIDE.md
- **Database patterns:** See prisma/schema.prisma
- **Shopify API:** See app/shopify.server.ts
- **Analytics API:** See app/utils/analytics-api.ts

---

## 🎯 Success Metrics

After all 8 sessions, you should have:

**Technical Performance:**
- [ ] Dashboard loads in <100ms (cache hit)
- [ ] All services respond in <500ms
- [ ] Cache hit rate >80%
- [ ] Zero N+1 queries
- [ ] Mobile responsive

**Feature Completeness:**
- [ ] DEFCON status calculates correctly
- [ ] Revenue at risk accurate within 10%
- [ ] Stockout countdown accurate within 1 hour
- [ ] Actions generate for >80% of scenarios
- [ ] Alerts trigger within 5 minutes
- [ ] Simulations complete in <10 seconds
- [ ] ROI tracking attributes >90% of actions

**User Experience:**
- [ ] Intuitive navigation
- [ ] Clear error messages
- [ ] Loading states on all async ops
- [ ] Help docs accessible
- [ ] Onboarding tour works

---

## 🚢 After Completion

Once all 8 sessions are done:

1. **Update CLAUDE.md**
   - Change status: ⏳ PLANNING → ✅ COMPLETE
   - Add production deployment notes

2. **Create User Guide**
   - Write WAR_ROOM_USER_GUIDE.md
   - Document all features
   - Add screenshots/examples

3. **Production Checklist**
   - Test with real merchant data
   - Load test with 1000+ products
   - Set up monitoring/alerts
   - Configure email/Slack/SMS
   - Deploy to staging
   - User acceptance testing
   - Deploy to production

4. **Marketing**
   - Demo videos
   - Case studies
   - Sales collateral
   - ROI calculator

---

## 📚 Additional Resources

- [BFCM_WAR_ROOM_PLAN.md](BFCM_WAR_ROOM_PLAN.md) - Master implementation plan
- [WAR_ROOM_SESSION_STATUS.md](WAR_ROOM_SESSION_STATUS.md) - Session tracker
- [CLAUDE.md](CLAUDE.md) - Project overview and architecture
- [REDIS_DEPLOYMENT_GUIDE.md](REDIS_DEPLOYMENT_GUIDE.md) - Redis setup
- [SESSION_6_SUMMARY.md](SESSION_6_SUMMARY.md) - Analytics optimization lessons
- [TESTING_GCP_PUBSUB_WEBHOOKS.md](TESTING_GCP_PUBSUB_WEBHOOKS.md) - GCP Pub/Sub testing guide
- [MULTI_MERCHANT_WEBHOOK_ARCHITECTURE.md](MULTI_MERCHANT_WEBHOOK_ARCHITECTURE.md) - Webhook architecture best practices
- [GCP_PUBSUB_READY.md](GCP_PUBSUB_READY.md) - GCP Pub/Sub setup summary

---

**Ready to start?** Use the Session 1 Start Prompt above and let's build! 🚀

