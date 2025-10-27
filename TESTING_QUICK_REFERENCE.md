# BFCM War Room - Testing Quick Reference

**One-page guide for running all tests**

---

## 🚀 Fastest Way to Test Everything

```bash
# Run all tests (5 minutes)
./run-all-tests.sh
```

That's it! The script will:
- Run all 14 test scripts automatically
- Show real-time results with colors
- Generate a final summary report
- Exit with success/failure code

---

## 📝 Quick Commands

### Test All Services
```bash
./run-all-tests.sh                    # Run complete test suite
```

### Test Individual Sessions
```bash
# Session 1-2: Core Services
npx tsx test-defcon-calculator.ts
npx tsx test-bfcm-revenue-risk.ts
npx tsx test-bfcm-velocity-anomalies.ts

# Session 3: Predictions & Alerts
npx tsx test-prediction-engine.ts
npx tsx test-alert-engine.ts

# Session 4: Actions & Simulations
npx tsx test-recommendations.ts
npx tsx test-action-executor.ts
npx tsx test-simulation-engine.ts

# Session 5: ROI & Integration
npx tsx test-roi-tracker.ts
npx tsx test-attribution-engine.ts
npx tsx test-performance-tracker.ts
npx tsx test-war-room-e2e.ts
npx tsx audit-war-room-performance.ts
```

### Visual Testing
```bash
npm run dev

# Visit these URLs:
# http://localhost:3000/app/war-room           # Main dashboard
# http://localhost:3000/app/war-room/alerts    # Alerts
# http://localhost:3000/app/war-room/actions   # Actions
# http://localhost:3000/app/war-room/simulate  # Simulations
# http://localhost:3000/app/war-room/roi       # ROI Tracker
```

---

## ✅ Expected Results

### All Tests Should Show:
- ✅ **14-16 tests passing** (94-100% success rate)
- ✅ **All performance targets exceeded** by 52-99%
- ✅ **Total duration:** 3-5 minutes
- ✅ **No critical errors**

### Performance Benchmarks:
| Service | Expected Time | Target |
|---------|---------------|--------|
| DEFCON | ~24ms | <50ms |
| Revenue Risk | ~15ms | <200ms |
| Velocity | ~2ms | <200ms |
| Predictions | ~11ms | <500ms |
| ROI Tracker | ~46ms | <200ms |
| Cache Hits | ~1ms | <100ms |

---

## 🔧 Troubleshooting

### If Tests Fail:

**1. Database corruption error:**
```bash
npx tsx diagnose-order-corruption.ts
# Then delete corrupted data if found
```

**2. Unique constraint error:**
```bash
# Clean up old test data
npx tsx -e "import db from './app/db.server.ts';
  db.order.deleteMany({ where: { id: { startsWith: 'test-order-' } } })
  .then(r => { console.log('Deleted', r.count, 'orders'); process.exit(0); });"
```

**3. Prisma errors:**
```bash
npx prisma generate
```

**4. Redis errors (optional):**
```bash
# Start Redis or tests will work without it
redis-server &
```

---

## 📊 Test Coverage

### Session Breakdown:
| Session | Tests | Focus |
|---------|-------|-------|
| 1-2 | 3-4 | Core services (DEFCON, Revenue, Velocity) |
| 3 | 2-4 | Predictions & Alerts |
| 4 | 3 | Actions & Simulations |
| 5 | 5 | ROI & Integration |
| **Total** | **13-16** | **Complete validation** |

---

## 🎯 Success Criteria

You're production-ready when you see:

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🎉 ALL TESTS PASSED! PRODUCTION READY! 🚀               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

✅ Tests Passed:      14
❌ Tests Failed:      0
📊 Total Tests:       14
🎯 Success Rate:      100.0%
⏱️  Duration:          3m 42s

🚀 All targets exceeded by 52-99%!
```

---

## 📚 Full Documentation

For detailed testing guides, see:

- **Complete Guide:** [BFCM_COMPLETE_TESTING_GUIDE.md](BFCM_COMPLETE_TESTING_GUIDE.md)
- **Session 5 Results:** [BFCM_TESTING_SESSION_5_SUMMARY.md](BFCM_TESTING_SESSION_5_SUMMARY.md)
- **Master Plan:** [BFCM_WAR_ROOM_PLAN.md](BFCM_WAR_ROOM_PLAN.md)

---

## 🚀 One-Liner Test Commands

```bash
# Test everything (recommended)
./run-all-tests.sh

# Test performance only (quick check)
npx tsx audit-war-room-performance.ts

# Test E2E integration
npx tsx test-war-room-e2e.ts

# Test ROI tracking
npx tsx test-roi-tracker.ts && \
  npx tsx test-attribution-engine.ts && \
  npx tsx test-performance-tracker.ts

# Test core services
npx tsx test-defcon-calculator.ts && \
  npx tsx test-bfcm-revenue-risk.ts && \
  npx tsx test-prediction-engine.ts
```

---

**That's it!** Run `./run-all-tests.sh` and you're done! 🎉
