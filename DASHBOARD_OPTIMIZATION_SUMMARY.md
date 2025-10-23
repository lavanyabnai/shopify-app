# Dashboard Optimization - Quick Reference

## Problem
Current analytics dashboard loads in **30-60 seconds** because it fetches 5,000+ orders from Shopify API on every page load.

## Solution Architecture

```
┌─────────────────┐
│  Shopify Store  │
└────────┬────────┘
         │ Webhooks (orders/create, orders/updated)
         │
         ▼
┌─────────────────────────────────────┐
│  Your Remix App                     │
│  ┌───────────────────────────────┐  │
│  │ Webhook Handlers              │  │
│  │ - Save to local DB            │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Background Jobs               │  │
│  │ - Initial data backfill       │  │
│  │ - Nightly analytics compute   │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Local Database (Prisma)       │  │
│  │ - Orders                      │  │
│  │ - OrderLineItems              │  │
│  │ - AnalyticsSnapshot           │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Dashboard Route               │  │
│  │ - Query local DB (<2s)        │  │
│  │ - No Shopify API calls        │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  User Browser   │
│  <2s load time  │
└─────────────────┘
```

## Best Practices for Shopify Dashboards

### ✅ DO
- **Store data locally** - Sync orders/products to your database via webhooks
- **Pre-compute aggregates** - Run nightly jobs to generate analytics snapshots
- **Use caching** - Cache computed metrics with 5-15 minute TTL
- **Show cached data** - Display with "Last updated" timestamp
- **Provide manual refresh** - Let users trigger sync if needed
- **Respect rate limits** - 500ms delay between paginated requests during backfill

### ❌ DON'T
- **Never fetch 1000+ records on page load** - Use local database instead
- **Don't poll Shopify API** - Use webhooks for real-time sync
- **Don't compute metrics on every request** - Pre-compute in background jobs
- **Don't ignore rate limits** - Shopify will throttle you (50 points/second for GraphQL)

## Implementation Steps (6 Phases)

### Phase 1: Database Schema (30 min)
Add Prisma models for Order, OrderLineItem, Product, AnalyticsSnapshot, SyncStatus

**Command:**
```bash
npx prisma migrate dev --name add_analytics_models
```

### Phase 2: Webhook Integration (1 hour)
- Register webhooks in `shopify.app.toml`
- Create `webhooks.orders.tsx` and `webhooks.products.tsx`
- Deploy: `npm run deploy`

### Phase 3: Background Sync Job (2 hours)
- Create `app/services/shopify-sync.server.ts`
- Create admin page `/app/sync` to trigger manual sync
- Run initial backfill (limit to 1000-5000 orders for safety)

### Phase 4: Analytics Pre-computation (1 hour)
- Create `app/services/analytics-aggregator.server.ts`
- Generate daily snapshots
- Set up cron job or run after each webhook

### Phase 5: Update Dashboard (1 hour)
- Modify `app/routes/app.analytics.tsx` to query local DB
- Add "Last synced" timestamp
- Remove all Shopify API calls from loader

### Phase 6: Optional Caching (1 hour)
- Add Redis for in-memory cache
- Cache analytics with 5-15 minute TTL
- Invalidate on webhook events

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Page load time | 30-60s | <2s |
| Shopify API calls per page load | 20+ | 0 |
| Risk of rate limiting | High | None |
| Works offline | ❌ | ✅ |
| Historical data | Limited | Unlimited |
| Custom metrics | Hard | Easy |

## Quick Start

1. **Read the full plan:**
   ```bash
   cat ANALYTICS_OPTIMIZATION_PLAN.md
   ```

2. **Start with Phase 1:**
   - Copy Prisma schema from plan
   - Run migration
   - Test with Prisma Studio

3. **Implement incrementally:**
   - Each phase is independent
   - Test thoroughly before moving to next phase
   - Can deploy webhooks first for new data while building backfill

## Key Files

- `ANALYTICS_OPTIMIZATION_PLAN.md` - Complete implementation guide with code
- `prisma/schema.prisma` - Database models
- `app/routes/webhooks.orders.tsx` - Real-time order sync
- `app/services/shopify-sync.server.ts` - Background data backfill
- `app/services/analytics-aggregator.server.ts` - Pre-computation logic
- `app/routes/app.analytics.tsx` - Dashboard (to be updated)

## Monitoring

Track these metrics after deployment:
- Webhook delivery success rate (Shopify Partners dashboard)
- Database growth (orders per day)
- Sync job duration
- Dashboard load time
- Cache hit rate (if using Redis)

## Troubleshooting

**Webhooks not firing:**
- Check Shopify Partners dashboard > Webhooks
- Verify `shopify.app.toml` configuration
- Run `npm run deploy`

**Sync job timing out:**
- Reduce `limit` parameter
- Increase `DELAY_MS` between requests
- Use cursor-based pagination properly

**Dashboard still slow:**
- Check database indexes
- Use `EXPLAIN` to analyze queries
- Consider pre-computed snapshots instead of raw data
- Add Redis caching layer

## Migration Strategy

**Safe approach (recommended):**
1. Build new optimized route at `/app/analytics-v2`
2. Test thoroughly with real data
3. Compare results with old route
4. Switch navigation to new route
5. Deprecate old route after validation

**Quick approach (if confident):**
1. Implement all phases
2. Test in development
3. Deploy to production
4. Monitor closely for 24 hours
