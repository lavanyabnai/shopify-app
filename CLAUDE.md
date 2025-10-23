# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Shopify embedded app built with Remix, designed as a control tower for inventory management and analytics. The app integrates with Shopify's Admin API and connects to an external FastAPI analytics backend.

## Essential Commands

**Development:**
- `npm run dev` - Start development server with Shopify CLI (includes tunnel setup, OAuth flow)
- `npm run build` - Build production bundle with Remix
- `npm run start` - Start production server (requires prior build)
- `npm run lint` - Run ESLint

**Database:**
- `npm run setup` - Initialize Prisma (generate client + run migrations)
- `npx prisma generate` - Regenerate Prisma client after schema changes
- `npx prisma migrate dev` - Create and apply database migrations
- `npx prisma studio` - Open Prisma Studio to view/edit database

**Shopify CLI:**
- `npm run deploy` - Deploy app configuration to Shopify
- `npm run generate` - Generate app extensions
- `npm run config:link` - Link to different app configuration
- `shopify app env show` - View environment variables

**Testing webhooks:**
- `shopify webhook trigger --topic <TOPIC>` - Trigger webhook events for testing

## Architecture

### Authentication & Session Management

Authentication is centralized in [app/shopify.server.ts](app/shopify.server.ts):
- Uses `@shopify/shopify-app-remix` package
- Prisma-based session storage (SQLite by default)
- All authenticated admin routes must call `authenticate.admin(request)` in their loader
- Returns `{ admin, session }` where `admin.graphql` is used for API queries

### Route Structure

**Remix file-based routing:**
- `app/routes/app.*.tsx` - Authenticated admin routes (embedded in Shopify Admin)
- `app/routes/webhooks.*.tsx` - Webhook handlers (no UI, process POST requests)
- `app/routes/auth.*.tsx` - OAuth/authentication routes
- `app/routes/_index/route.tsx` - Public landing page

**Key route pattern:**
- `app.tsx` is the layout for all `/app/*` routes, provides AppProvider + NavMenu
- Loaders should authenticate first, then fetch data
- Use `redirect` from `authenticate.admin` (not from `@remix-run/node`) to maintain session in iframe

### Data Layer

**Prisma Models ([prisma/schema.prisma](prisma/schema.prisma)):**
- `Session` - Shopify OAuth sessions
- `QRCode` - Custom app data model example

**Database access:**
- Import `db` from `app/db.server.ts` (Prisma client singleton)
- Model logic in `app/models/*.server.js` files
- Server-side only files use `.server.ts/.js` suffix (excluded from client bundle)

### External Integrations

**Analytics API ([app/utils/analytics-api.ts](app/utils/analytics-api.ts)):**
- Connects to FastAPI backend (configurable via `ANALYTICS_API_URL` env var)
- Provides: alerts generation, demand forecasting, trend analysis, anomaly detection, reorder point optimization
- Use `analyticsAPI.methodName()` singleton instance
- Helper functions: `transformShopifyInventory()`, `prepareHistoricalData()`

### Analytics & Performance Optimization

**Performance Architecture (3-Tier System):**

The analytics dashboard uses a 3-tier performance optimization strategy:

1. **Redis Cache Layer** (Fastest - <100ms)
   - In-memory caching with 5-minute TTL
   - Cache service: [app/services/cache.server.ts](app/services/cache.server.ts)
   - Automatic invalidation on webhook events
   - Optional - app works without Redis

2. **Local Database** (Fast - <2s)
   - Pre-computed analytics snapshots (daily/monthly)
   - Prisma models: Order, OrderLineItem, Product, AnalyticsSnapshot
   - Webhook-driven incremental sync
   - See [prisma/schema.prisma](prisma/schema.prisma)

3. **Shopify API** (Slow - 30-60s) **NEVER USE IN PRODUCTION**
   - Only for initial data backfill via [app/routes/app.sync.tsx](app/routes/app.sync.tsx)
   - Rate-limited background jobs (500ms delay between requests)

**Dashboard Performance Best Practices:**
- ✅ **DO:** Use Redis cache for instant loads (<100ms)
- ✅ **DO:** Query pre-computed AnalyticsSnapshot for <2s loads
- ✅ **DO:** Use webhooks to keep local database in sync
- ❌ **NEVER:** Fetch large datasets from Shopify on page load
- ❌ **NEVER:** Make Shopify GraphQL calls in route loaders

**Performance Results:**
- Baseline (Session #1): 30-60 seconds (Shopify API calls)
- Database Only (Session #5): <2 seconds (99.2% improvement)
- With Redis Cache (Session #6): <100ms on cache hit (99.8% improvement)

**Key Files:**
- Cache service: [app/services/cache.server.ts](app/services/cache.server.ts)
- Analytics route: [app/routes/app.analytics.tsx](app/routes/app.analytics.tsx)
- Sync service: [app/services/shopify-sync.server.ts](app/services/shopify-sync.server.ts)
- Analytics aggregator: [app/services/analytics-aggregator.server.ts](app/services/analytics-aggregator.server.ts)
- Deployment guide: [REDIS_DEPLOYMENT_GUIDE.md](REDIS_DEPLOYMENT_GUIDE.md)

**How It Works:**
1. Webhooks ([webhooks.orders.tsx](app/routes/webhooks.orders.tsx), [webhooks.products.tsx](app/routes/webhooks.products.tsx)) sync data to local DB
2. Background job computes daily analytics snapshots
3. Redis caches computed results for 5 minutes
4. Cache invalidates automatically when new orders/products arrive
5. Dashboard loads from cache (instant) or DB (fast) - never from Shopify API

### Shopify Admin GraphQL

**Making queries:**
```javascript
const { admin } = await authenticate.admin(request);
const response = await admin.graphql(`
  query { products(first: 25) { nodes { title } } }
`);
const data = await response.json();
```

**GraphQL config:**
- `.graphqlrc.ts` configures VSCode IntelliSense for Shopify Admin API
- Change schema if using other APIs (Storefront API, third-party GraphQL)

### UI Components

**Polaris Design System:**
- Import components from `@shopify/polaris`
- Icons from `@shopify/polaris-icons`
- Styles imported in `app/routes/app.tsx`
- Use `AppProvider` from `@shopify/shopify-app-remix/react` (not direct from Polaris)

**App Bridge:**
- Import components from `@shopify/app-bridge-react` (NavMenu, TitleBar, etc.)
- Required for embedded apps to function properly in Shopify Admin iframe

### Important Patterns

**Navigation in embedded apps:**
- Use `Link` from `@remix-run/react` or `@shopify/polaris` - NEVER `<a>` tags
- Use `<Form>` or `useSubmit` from `@remix-run/react` - NEVER `<form>`
- Use `redirect` from `authenticate.admin` - NEVER from `@remix-run/node`

**Webhooks:**
- Prefer app-specific webhooks in `shopify.app.toml` over shop-specific in `afterAuth` hook
- Route naming: `webhooks.app.<topic-name>.tsx` (e.g., `webhooks.app.order-create.tsx`)
- Authenticate with `await authenticate.webhook(request)`
- Admin-created webhooks will fail HMAC validation

**Error handling:**
- Export `ErrorBoundary` that calls `boundary.error(useRouteError())`
- Export `headers` function that calls `boundary.headers(headersArgs)`
- Required for Shopify-specific error handling in embedded context

## Environment Variables

**Required in `.env`:**
- `SHOPIFY_API_KEY` - From Partners dashboard
- `SHOPIFY_API_SECRET` - From Partners dashboard
- `SCOPES` - Comma-separated OAuth scopes (defined in shopify.app.toml)
- `SHOPIFY_APP_URL` - Public URL (auto-set by Shopify CLI in dev)
- `DATABASE_URL` - Prisma database connection (default: file:dev.sqlite)

**Optional (Performance):**
- `REDIS_URL` - Redis connection string for caching (optional, defaults to redis://localhost:6379)
  - Without Redis: Dashboard loads in <2 seconds from database
  - With Redis: Dashboard loads in <100ms from cache
  - Format: `redis://[username]:[password]@[host]:[port]`
  - Examples:
    - Local: `redis://localhost:6379`
    - Production: `redis://:password@redis.example.com:6379`
    - TLS: `rediss://default:password@upstash.io:6380`
  - See [REDIS_DEPLOYMENT_GUIDE.md](REDIS_DEPLOYMENT_GUIDE.md) for setup instructions

**Optional (External Services):**
- `ANALYTICS_API_URL` - FastAPI backend URL (optional, defaults to http://localhost:8000)

## Deployment Considerations

**Database:**
- SQLite works for single-instance deployments only
- For production with multiple instances, migrate to PostgreSQL/MySQL (update `prisma/schema.prisma` datasource)
- Run `npm run setup` after database changes to generate client and apply migrations

**Build process:**
1. `npm run build` - Creates production bundle in `build/`
2. `npm run setup` - Ensures database is ready
3. `npm run start` - Runs production server

**Environment:**
- Set `NODE_ENV=production`
- Update `shopify.app.toml` with production URLs via `npm run deploy`

**Hosting platforms:**
- Generic: Heroku, Fly.io (requires `Dockerfile` with Node.js)
- Vercel: Install `@vercel/remix` and add `vercelPreset()` to `vite.config.ts`

## Active Development Tasks

### BFCM War Room Feature (⏳ PLANNING COMPLETE - Ready for Session 1)

**Status:** Planning phase complete - Implementation ready to begin
**Timeline:** 8 sessions × 4 hours = 32 hours total (est. 4-6 weeks)
**Target Launch:** October 1, 2025 (6 weeks before BFCM)

**Business Value:**
- Prevent stockouts worth $100K+ during peak season
- Reduce emergency shipping costs by 60%
- Capture competitor overflow (20-40% revenue uplift)
- Enable proactive crisis management during BFCM
- Target price point: $10K+ for enterprise merchants

**Feature Overview:**
Transform the analytics dashboard into a mission-critical command center for Black Friday/Cyber Monday operations with:
- 🚨 **DEFCON Status Board** - Real-time health monitoring with 5-level severity system
- 📊 **Mission Critical Metrics** - Revenue at risk, velocity anomalies, fulfillment capacity
- 🎯 **Predictive Intelligence** - 4hr/24hr/72hr forecasts with stockout countdowns
- 🚀 **Prescriptive Actions** - AI-powered recommendations with one-click execution
- 🔔 **Smart Alerts** - Multi-channel notifications (email, Slack, SMS)
- 📈 **Performance Scoreboard** - Real-time KPIs vs. plan/last year
- 🎮 **Simulation Lab** - What-if scenario testing and contingency playbooks
- 💰 **ROI Tracker** - Financial impact attribution and decision audit

**Technical Approach:**
- Build on existing analytics infrastructure (Redis + Database + Webhooks)
- Leverage analytics API for ML predictions
- Progressive enhancement across 8 sessions
- Each session delivers testable, production-ready features

**Key Documents:**
- Master plan: [BFCM_WAR_ROOM_PLAN.md](BFCM_WAR_ROOM_PLAN.md) - Complete implementation details
- Session tracker: [WAR_ROOM_SESSION_STATUS.md](WAR_ROOM_SESSION_STATUS.md) - Progress tracking
- Start Session 1: See "Session 1 Start Prompt" in BFCM_WAR_ROOM_PLAN.md

**Implementation Sessions:**

1. **Session 1: Foundation & DEFCON Status Board** (⏳ NOT STARTED)
   - Database schema extension (WarRoomMetrics, InventorySnapshot, AlertLog)
   - DEFCON calculation service
   - Basic War Room UI with status board
   - Health scoring algorithm

2. **Session 2: Mission Critical Metrics Dashboard** (⏳ NOT STARTED)
   - Revenue-at-risk calculations (24h/48h/72h windows)
   - Velocity anomaly detection
   - Fulfillment capacity metrics
   - Metrics dashboard component

3. **Session 3: Predictive Intelligence Engine** (⏳ NOT STARTED)
   - Analytics API integration for forecasting
   - Stockout countdown timers
   - 4hr/24hr/72hr demand scenarios
   - Confidence interval visualization

4. **Session 4: Prescriptive Action Center** (⏳ NOT STARTED)
   - Recommendation engine with ROI ranking
   - One-click action execution
   - Transfer/reorder/pricing/throttling actions
   - Action logging and rollback capability

5. **Session 5: Smart Alert System** (⏳ NOT STARTED)
   - Alert rule engine
   - Multi-channel notifications (email, Slack, SMS)
   - Alert dashboard and history
   - Deduplication and user preferences

6. **Session 6: Performance Scoreboard** (⏳ NOT STARTED)
   - Performance tracking (revenue run rate, perfect order rate)
   - Competitive intelligence (mock data)
   - KPI comparisons vs. plan/last year
   - Trend analysis

7. **Session 7: Simulation Command Center** (⏳ NOT STARTED)
   - What-if scenario engine (flash sales, traffic spikes, delays)
   - Contingency playbooks
   - Scenario comparison
   - Results export

8. **Session 8: ROI Tracker & Polish** (⏳ NOT STARTED)
   - Revenue saved tracking
   - Attribution engine
   - Decision audit trail
   - Performance optimization and mobile polish
   - Help documentation and onboarding

**Performance Targets:**
- Dashboard load: <100ms (cache hit), <2s (cache miss)
- DEFCON calculation: <50ms
- Revenue risk calculation: <200ms
- Prediction engine: <500ms
- Action execution: <2s
- Cache hit rate: >80%

**Next Steps:**
1. Verify analytics infrastructure is working (Redis, Database, Webhooks)
2. Review BFCM_WAR_ROOM_PLAN.md Session 1 section
3. Use Session 1 Start Prompt from plan document
4. Begin implementation

---

### Analytics Dashboard Optimization (✅ COMPLETE)

**Status:** ALL PHASES COMPLETE - Production ready with Redis caching

**Problem Solved:**
- Original issue: [app/routes/app.analytics.tsx](app/routes/app.analytics.tsx) loaded in 30-60 seconds
- Solution: 3-tier architecture (Redis → Database → Shopify API)
- Result: <100ms load time with Redis cache (99.8% improvement)

**Architecture Overview:**
See the "Analytics & Performance Optimization" section above for complete details on the 3-tier system.

**Implementation Phases:**

1. **Phase 1: Database Schema** (✅ COMPLETE - Session #2, 2025-10-09)
   - Added Prisma models: Order, OrderLineItem, Product, AnalyticsSnapshot, SyncStatus
   - Migration: `20251009060110_add_analytics_models`
   - See [prisma/schema.prisma](prisma/schema.prisma)

2. **Phase 2: Webhook Integration** (✅ COMPLETE - Session #2, 2025-10-09)
   - Created [app/routes/webhooks.orders.tsx](app/routes/webhooks.orders.tsx)
   - Created [app/routes/webhooks.products.tsx](app/routes/webhooks.products.tsx)
   - Real-time sync with Redis cache invalidation

3. **Phase 3: Background Sync Job** (✅ COMPLETE - Session #3, 2025-10-09)
   - Created [app/services/shopify-sync.server.ts](app/services/shopify-sync.server.ts)
   - Admin UI: [app/routes/app.sync.tsx](app/routes/app.sync.tsx)
   - Rate-limited backfill (500ms delay)

4. **Phase 4: Analytics Pre-computation** (✅ COMPLETE - Session #4, 2025-10-09)
   - Created [app/services/analytics-aggregator.server.ts](app/services/analytics-aggregator.server.ts)
   - Admin UI: [app/routes/app.compute-analytics.tsx](app/routes/app.compute-analytics.tsx)
   - Daily/monthly snapshot generation

5. **Phase 5: Update Dashboard** (✅ COMPLETE - Session #5, 2025-10-09)
   - Removed ALL Shopify API calls from analytics loader
   - Query local database only
   - Added sync status indicators
   - Load time: <2 seconds

6. **Phase 6: Redis Caching** (✅ COMPLETE - Session #6, 2025-10-09)
   - Created [app/services/cache.server.ts](app/services/cache.server.ts)
   - Automatic cache invalidation on webhooks
   - Graceful fallback (Redis is optional)
   - Load time: <100ms on cache hit
   - Deployment guide: [REDIS_DEPLOYMENT_GUIDE.md](REDIS_DEPLOYMENT_GUIDE.md)

**Performance Results:**
- **Baseline (Session #1):** 30-60 seconds
- **Database Only (Session #5):** <2 seconds (96.7% faster)
- **With Redis (Session #6):** <100ms on cache hit (99.8% faster)

**Files Created:**
- Session #1: Planning documents (ANALYTICS_OPTIMIZATION_PLAN.md, SESSION_STATUS.md, etc.)
- Session #2: Webhooks and database migration
- Session #3: Sync service and admin UI
- Session #4: Analytics aggregator
- Session #5: Dashboard optimization
- Session #6: Redis cache service and deployment guide

**Production Deployment:**
See [REDIS_DEPLOYMENT_GUIDE.md](REDIS_DEPLOYMENT_GUIDE.md) for complete instructions on deploying with Redis on Heroku, Fly.io, Railway, Vercel, or AWS.

**Monitoring:**
- Check console logs for cache hit/miss stats
- View `X-Cache` response headers (HIT/MISS)
- Monitor Redis memory usage in production
- Expected cache hit rate: >80% after warmup

---

## Common Gotchas

- If OAuth loops after scope changes, run `npm run deploy` to update Shopify config
- "Table does not exist" error: Run `npm run setup` to create database
- Webhooks triggered by CLI will have `admin` as `undefined` (shop doesn't exist)
- For MongoDB: Use `prisma db push` instead of `migrate`, update `shopify.web.toml` predev command
- Streaming responses (defer/await) require ngrok tunnel in dev, not default Cloudflare tunnel
- Clock sync issues causing JWT "nbf" errors: Enable automatic time sync on your system

## Development Workflow

**When starting a new Claude Code session:**
1. Read this CLAUDE.md file to understand the project
2. Check "Active Development Tasks" section above for ongoing work
3. Review referenced implementation plans before starting
4. Update task status (⏳ NOT STARTED → 🔄 IN PROGRESS → ✅ COMPLETE)
5. Add new tasks or update status for next session

**When completing work:**
1. Update "Active Development Tasks" with your progress
2. Mark completed phases with ✅
3. Note any blockers or issues for next session
4. Update "Next Session Starting Point" with clear instructions
