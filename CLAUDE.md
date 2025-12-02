# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **multi-merchant** Shopify embedded app built with Remix, designed as a control tower for inventory management and analytics. The app integrates with Shopify's Admin API and connects to an external FastAPI analytics backend.

**Distribution:** Configured for App Store (public app) with multi-tenant architecture
**Production Status:** 70% ready - see [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)

## Essential Commands

```bash
# Development
npm run dev              # Start dev server with Shopify CLI (tunnel + OAuth)
npm run build            # Build production bundle
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run setup            # Generate Prisma client + run migrations
npx prisma migrate dev   # Create and apply new migrations
npx prisma studio        # Visual database editor

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:gdpr        # Test GDPR webhooks

# Shopify CLI
npm run deploy           # Deploy app config to Shopify
shopify webhook trigger --topic <TOPIC>  # Test webhooks
```

## Architecture

### Authentication ([app/shopify.server.ts](app/shopify.server.ts))
- Uses `@shopify/shopify-app-remix` with Prisma session storage
- All `/app/*` routes must call `authenticate.admin(request)` in their loader
- Returns `{ admin, session }` - use `admin.graphql()` for API queries
- **Critical:** Use `redirect` from `authenticate.admin`, NOT from `@remix-run/node`

### Route Structure

**Remix file-based routing in `app/routes/`:**
- `app.tsx` - Layout for all `/app/*` routes (AppProvider + NavMenu)
- `app.*.tsx` - Authenticated admin routes (embedded in Shopify Admin)
- `inv.*.tsx` - Inventory control tower routes
- `webhooks.*.tsx` - Webhook handlers (no UI)
- `auth.*.tsx` - OAuth/authentication
- `api.*.tsx` - API endpoints (Pub/Sub)

**Key Routes:**
- `app.war-room.*` - BFCM War Room command center
- `app.analytics.tsx` - Analytics dashboard
- `app.sync.tsx` - Data sync admin UI
- `inv.control-tower.tsx` - Inventory control tower
- `inv.finished-goods.tsx` - Finished goods management
- `inv.demand-balancing.tsx` - Demand balancing

### Data Layer

**Database:** Prisma with PostgreSQL (Neon) - see [prisma/schema.prisma](prisma/schema.prisma)
- `Session` - Shopify OAuth sessions
- `Order`, `OrderLineItem`, `Product` - Synced Shopify data
- `AnalyticsSnapshot` - Pre-computed analytics
- `WarRoomMetrics`, `InventorySnapshot`, `AlertLog` - War Room data
- Import client: `import { db } from "~/db.server"`

**Server-only files:** Use `.server.ts` suffix (excluded from client bundle)

### Service Layer ([app/services/](app/services/))

**Performance (3-Tier Caching):**
- `cache.server.ts` - Redis cache (optional, <100ms)
- `analytics-aggregator.server.ts` - Pre-computed snapshots (<2s)
- `shopify-sync.server.ts` - Background data sync from Shopify

**War Room Services:**
- `defcon-calculator.server.ts` - DEFCON status (5-level severity)
- `revenue-risk.server.ts` - Revenue at risk calculations
- `prediction-engine.server.ts` - Demand forecasting
- `recommendation-engine.server.ts` - AI-powered actions
- `alert-engine.server.ts` - Smart alerts
- `simulation-engine.server.ts` - What-if scenarios
- `roi-tracker.server.ts` - Financial impact tracking

**External:**
- `analytics-api.ts` - FastAPI backend integration
- `gcp-pubsub.server.ts` - Google Cloud Pub/Sub for webhooks

### UI Components

- **Polaris:** Import from `@shopify/polaris` (icons from `@shopify/polaris-icons`)
- **App Bridge:** Import from `@shopify/app-bridge-react` for NavMenu, TitleBar
- **Radix UI + Tailwind:** Used for custom components alongside Polaris
- **Recharts:** Data visualization

### GraphQL Queries

```typescript
const { admin } = await authenticate.admin(request);
const response = await admin.graphql(`
  query { products(first: 25) { nodes { title } } }
`);
const data = await response.json();
```

## Environment Variables

**Required:**
```
SHOPIFY_API_KEY=          # From Partners dashboard
SHOPIFY_API_SECRET=       # From Partners dashboard
DATABASE_URL=             # Prisma connection string
```

**Optional:**
```
REDIS_URL=                # Redis for caching (redis://localhost:6379)
ANALYTICS_API_URL=        # FastAPI backend (http://localhost:8000)
```

## Critical Patterns

### Embedded App Navigation
```tsx
// DO: Use Remix/Polaris Link
import { Link } from "@remix-run/react";
<Link to="/app/analytics">Analytics</Link>

// DON'T: Never use raw anchor tags
<a href="/app/analytics">Analytics</a>  // WRONG!
```

### Webhooks
- Define app-specific webhooks in `shopify.app.toml`
- Authenticate with `await authenticate.webhook(request)`
- Route naming: `webhooks.app.<topic>.tsx` or `webhooks.<topic>.tsx`
- Admin-created webhooks will fail HMAC validation

### Performance Best Practices
- **DO:** Use Redis cache for instant loads (<100ms)
- **DO:** Query pre-computed AnalyticsSnapshot for fast loads (<2s)
- **DO:** Use webhooks to keep local database in sync
- **NEVER:** Make Shopify GraphQL calls in route loaders for large datasets
- **NEVER:** Fetch from Shopify API on page load in production

## Common Gotchas

- OAuth loops after scope changes: Run `npm run deploy` to update config
- "Table does not exist" error: Run `npm run setup`
- Webhooks from CLI have `admin` as `undefined` (shop doesn't exist)
- For MongoDB: Use `prisma db push`, not `migrate`
- Streaming (defer/await): Requires ngrok tunnel, not Cloudflare
- JWT "nbf" errors: Enable automatic time sync on your system

## Key Documentation

- [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) - Multi-merchant deployment
- [REDIS_DEPLOYMENT_GUIDE.md](REDIS_DEPLOYMENT_GUIDE.md) - Redis setup for caching
- [NEON_DATABASE_SETUP.md](NEON_DATABASE_SETUP.md) - PostgreSQL configuration
- [BFCM_WAR_ROOM_COMPLETE.md](BFCM_WAR_ROOM_COMPLETE.md) - War Room feature docs
- [COLLABORATION_GUIDE.md](COLLABORATION_GUIDE.md) - Team collaboration guide
