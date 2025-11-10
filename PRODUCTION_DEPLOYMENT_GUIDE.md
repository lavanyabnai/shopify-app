# Production Deployment Guide: Multi-Merchant Shopify App

**Status:** Your app is being prepared for production deployment
**Last Updated:** October 30, 2025
**Distribution Type:** Public App (App Store)

---

## Table of Contents

1. [Current Status Assessment](#current-status-assessment)
2. [Pre-Launch Checklist](#pre-launch-checklist)
3. [Security Hardening](#security-hardening)
4. [Multi-Tenant Testing](#multi-tenant-testing)
5. [Deployment Steps](#deployment-steps)
6. [Monitoring & Observability](#monitoring--observability)
7. [Post-Launch Tasks](#post-launch-tasks)

---

## Current Status Assessment

### ✅ Already Implemented (Production-Ready)

Your app is already well-architected! Here's what's working:

1. **Modern Authentication**
   - ✅ Session token verification via `@shopify/shopify-app-remix`
   - ✅ Shopify Managed Installation enabled (`unstable_newEmbeddedAuthStrategy`)
   - ✅ Webhook HMAC verification automatic
   - ✅ OAuth flow handled by framework

2. **Multi-Tenant Database**
   - ✅ All tables include `shop` field
   - ✅ Proper indexes: `@@index([shop, createdAt])`, etc.
   - ✅ PostgreSQL database (Neon) - production-ready
   - ✅ Webhook handlers scope data by shop

3. **Performance Architecture**
   - ✅ 3-tier caching (Redis → Database → Shopify API)
   - ✅ Pre-computed analytics snapshots
   - ✅ Intelligent cache invalidation
   - ✅ Background job processing

4. **GDPR Compliance** ✅ **NEWLY ADDED**
   - ✅ `customers/data_request` webhook
   - ✅ `customers/redact` webhook
   - ✅ `shop/redact` webhook
   - ✅ Complete data deletion on shop uninstall

5. **Distribution Configuration**
   - ✅ Set to `AppDistribution.AppStore`
   - ✅ Scopes properly defined in `shopify.app.toml`
   - ✅ Webhooks registered

### ⚠️ Needs Implementation

| Priority | Task | Status | Effort |
|----------|------|--------|--------|
| 🔴 HIGH | Repository pattern for shop isolation | Not Started | 4-6 hours |
| 🔴 HIGH | Access token encryption | Not Started | 2-3 hours |
| 🔴 HIGH | Multi-tenant isolation tests | Not Started | 4-6 hours |
| 🟡 MEDIUM | Error monitoring (Sentry) | Not Started | 2-3 hours |
| 🟡 MEDIUM | Rate limit monitoring | Not Started | 2-3 hours |
| 🟢 LOW | Production environment setup | Not Started | 1-2 hours |

**Total estimated effort:** 15-23 hours

---

## Pre-Launch Checklist

Use this checklist before deploying to production:

### Distribution

- [x] Distribution method selected (`AppDistribution.AppStore`)
- [ ] App listing complete in Partner Dashboard
  - [ ] App name and description
  - [ ] Screenshots (minimum 3, recommended 5)
  - [ ] Feature video or hero image
  - [ ] Pricing configured
- [ ] Privacy policy published and linked
- [ ] Support contact information provided

### Authentication & Security

- [x] Session token verification working
- [x] OAuth flow tested on development stores
- [ ] Access tokens encrypted at rest
- [ ] Token rotation procedure documented
- [ ] CORS configured to allow only `https://admin.shopify.com`
- [ ] Rate limiting implemented
- [ ] Input validation using TypeScript types

### Multi-Tenancy

- [x] All tables include `shop` column
- [ ] **CRITICAL:** Repository pattern enforces shop filtering
- [ ] Data isolation tested across 3+ stores
- [ ] Shop context extraction from session working
- [x] Webhook handlers scope by shop

### GDPR Compliance

- [x] `customers/data_request` webhook implemented
- [x] `customers/redact` webhook implemented
- [x] `shop/redact` webhook implemented
- [ ] GDPR webhooks tested with CLI
- [ ] Data export functionality working
- [ ] Data deletion verified

### API Integration

- [x] GraphQL queries optimized for cost
- [ ] Rate limit monitoring implemented
- [ ] Exponential backoff on 429 errors
- [x] API version set to stable (January 2025)

### Webhooks

- [x] HMAC verification implemented
- [x] All webhooks respond within 5 seconds
- [x] Background job queue configured (via cache invalidation)
- [x] Idempotency using upsert
- [x] Mandatory webhooks registered

### Testing

- [ ] Tested installation on 3+ development stores
- [ ] Multi-tenant isolation verified
- [ ] Webhook delivery tested with CLI
- [ ] Uninstall/reinstall flow tested
- [ ] GDPR webhooks triggered and verified
- [ ] Performance tested (Lighthouse score)

### Performance

- [x] Database indexes on shop and common patterns
- [x] Connection pooling (Prisma handles this)
- [x] Caching strategy (Redis)
- [ ] Lighthouse performance score verified (max 10-point reduction)

### Deployment

- [ ] Production environment configured
- [x] HTTPS with valid certificate (handled by hosting)
- [ ] Environment variables set
- [ ] Database backups automated
- [ ] Monitoring and alerting configured
- [x] Health check endpoint exists
- [ ] CI/CD pipeline configured

---

## Security Hardening

### 1. Access Token Encryption

**Why:** Session table stores access tokens in plain text. Encrypt them at rest.

**Implementation:**

```typescript
// app/services/encryption.server.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Usage in session storage:** Wrap Prisma session storage with encryption layer.

### 2. Repository Pattern for Shop Isolation

**Why:** Enforce shop-level filtering on ALL database queries to prevent data leaks.

**Implementation:**

```typescript
// app/repositories/base.repository.server.ts
import { PrismaClient } from '@prisma/client';

export abstract class BaseRepository {
  constructor(
    protected db: PrismaClient,
    protected shop: string
  ) {}

  /**
   * Apply shop filter to all queries automatically
   */
  protected applyShopFilter<T extends { shop?: string }>(query: T): T {
    return { ...query, shop: this.shop };
  }
}

// app/repositories/order.repository.server.ts
export class OrderRepository extends BaseRepository {
  async getOrders() {
    // Shop filter automatically applied
    return this.db.order.findMany({
      where: this.applyShopFilter({}),
      include: { lineItems: true },
    });
  }

  async getOrderById(id: string) {
    return this.db.order.findUnique({
      where: this.applyShopFilter({ id }),
    });
  }

  async createOrder(data: CreateOrderInput) {
    return this.db.order.create({
      data: {
        ...data,
        shop: this.shop, // Always set shop
      },
    });
  }
}
```

**Usage in routes:**

```typescript
// app/routes/app.analytics.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Use repository instead of direct db access
  const orderRepo = new OrderRepository(db, shop);
  const orders = await orderRepo.getOrders();

  return json({ orders });
}
```

### 3. Rate Limit Monitoring

**Implementation:**

```typescript
// app/services/shopify-api.server.ts
export async function executeGraphQL(shop: string, query: string) {
  const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();

  // Monitor rate limits
  const cost = result.extensions?.cost;
  if (cost) {
    const available = cost.currentlyAvailable;
    const max = cost.requestedQueryCost;

    console.log(`📊 GraphQL cost: ${max} (${available} remaining)`);

    // Alert if approaching limit
    if (available < 100) {
      console.warn(`⚠️ Low query cost available for ${shop}: ${available}`);
      // TODO: Send alert to monitoring system
    }

    // Implement backoff if needed
    if (available < 50) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
    }
  }

  return result.data;
}
```

---

## Multi-Tenant Testing

### Test Script: Data Isolation Verification

Create this test to verify shop-level data isolation:

```typescript
// tests/multi-tenant-isolation.test.ts
import { describe, it, expect, beforeAll } from '@jest/globals';
import db from '../app/db.server';

describe('Multi-Tenant Data Isolation', () => {
  const shopA = 'store-a.myshopify.com';
  const shopB = 'store-b.myshopify.com';

  beforeAll(async () => {
    // Clean test data
    await db.order.deleteMany({ where: { shop: { in: [shopA, shopB] } } });
  });

  it('should isolate order data between shops', async () => {
    // Create order for Shop A
    const orderA = await db.order.create({
      data: {
        id: 'gid://shopify/Order/1',
        shopifyOrderId: '1',
        name: '#1001',
        shop: shopA,
        totalPrice: 100,
        currency: 'USD',
        createdAt: new Date(),
      },
    });

    // Create order for Shop B
    const orderB = await db.order.create({
      data: {
        id: 'gid://shopify/Order/2',
        shopifyOrderId: '2',
        name: '#2001',
        shop: shopB,
        totalPrice: 200,
        currency: 'USD',
        createdAt: new Date(),
      },
    });

    // Verify Shop A only sees their orders
    const shopAOrders = await db.order.findMany({ where: { shop: shopA } });
    expect(shopAOrders).toHaveLength(1);
    expect(shopAOrders[0].id).toBe(orderA.id);

    // Verify Shop B only sees their orders
    const shopBOrders = await db.order.findMany({ where: { shop: shopB } });
    expect(shopBOrders).toHaveLength(1);
    expect(shopBOrders[0].id).toBe(orderB.id);

    // Verify no cross-shop data leak
    expect(shopAOrders.find(o => o.shop === shopB)).toBeUndefined();
    expect(shopBOrders.find(o => o.shop === shopA)).toBeUndefined();
  });

  it('should prevent cross-shop updates', async () => {
    // This should fail if repository pattern is implemented correctly
    await expect(async () => {
      await db.order.update({
        where: { id: 'gid://shopify/Order/1' },
        data: { shop: shopB }, // Try to move order to different shop
      });
    }).rejects.toThrow();
  });

  it('should isolate War Room data between shops', async () => {
    // Create inventory snapshot for Shop A
    await db.inventorySnapshot.create({
      data: {
        shop: shopA,
        sku: 'TEST-SKU',
        productId: '123',
        productTitle: 'Test Product',
        location: 'Main',
        currentStock: 100,
        burnRate: 10,
        coverageHours: 10,
        reorderPoint: 50,
        velocityTrend: 0,
        status: 'healthy',
      },
    });

    // Verify Shop B cannot see Shop A's inventory
    const shopBInventory = await db.inventorySnapshot.findMany({
      where: { shop: shopB },
    });
    expect(shopBInventory).toHaveLength(0);
  });
});
```

Run tests:
```bash
npm install --save-dev jest @jest/globals ts-jest @types/jest
npx jest tests/multi-tenant-isolation.test.ts
```

---

## Deployment Steps

### Phase 1: Prepare Infrastructure

**Option A: Railway (Recommended for MVP)**

1. Create Railway account
2. New Project → Deploy from GitHub
3. Add PostgreSQL database (included)
4. Add Redis (included)
5. Set environment variables:
   ```
   SHOPIFY_API_KEY=your_key
   SHOPIFY_API_SECRET=your_secret
   DATABASE_URL_NEON=postgresql://...
   REDIS_URL=redis://...
   ENCRYPTION_KEY=generate_32_byte_hex
   NODE_ENV=production
   ```

**Option B: Vercel + Heroku Postgres + Upstash Redis**

1. Deploy frontend to Vercel
2. Provision Heroku Postgres
3. Provision Upstash Redis
4. Connect services

### Phase 2: Deploy Application

```bash
# 1. Build production bundle
npm run build

# 2. Run database migrations
npm run setup

# 3. Deploy configuration to Shopify
npm run deploy

# 4. Test production deployment
curl https://your-app.com/health
```

### Phase 3: Configure Shopify Partner Dashboard

1. Navigate to Partner Dashboard → Apps → [Your App]
2. **App Setup:**
   - App URL: `https://your-production-domain.com`
   - Allowed redirection URLs: `https://your-production-domain.com/auth/callback`
3. **Webhooks:** Verify all webhooks registered (automatic via CLI)
4. **App Listing:**
   - Upload screenshots
   - Write compelling description
   - Set pricing (if applicable)
5. **Test on Development Store:** Install and verify all features

### Phase 4: Submit for Review

1. Click "Submit for Review" in Partner Dashboard
2. Shopify runs automated tests:
   - OAuth flow validation
   - HMAC verification
   - Performance testing (Lighthouse)
   - GDPR compliance check
3. Address any flagged issues
4. Manual review (2-5 business days)
5. Respond to reviewer feedback promptly

---

## Monitoring & Observability

### Sentry Integration

**Install:**
```bash
npm install @sentry/remix
```

**Configure:**
```typescript
// entry.server.tsx
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
```

**Track errors:**
```typescript
try {
  await processOrder(shop, order);
} catch (error) {
  Sentry.captureException(error, {
    tags: { shop },
    extra: { orderId: order.id },
  });
  throw error;
}
```

### Key Metrics to Monitor

1. **Webhook Delivery Success Rate** (should be > 99%)
2. **API Rate Limit Hits** (should be near zero)
3. **Database Query Performance** (< 100ms average)
4. **Cache Hit Rate** (> 80% after warmup)
5. **Error Rate by Shop** (identify problematic merchants)
6. **Session Token Verification Failures**

### Dashboard Setup

Create monitoring dashboard with:
- Active installations
- Daily active shops
- Webhook processing times
- Cache performance
- Error rates
- GraphQL query costs

---

## Post-Launch Tasks

### Week 1: Monitor Closely

- [ ] Check error logs daily
- [ ] Monitor webhook delivery rates
- [ ] Verify GDPR webhooks fire correctly
- [ ] Track performance metrics
- [ ] Respond to merchant support requests < 24 hours

### Week 2-4: Optimize

- [ ] Analyze slow queries and add indexes
- [ ] Optimize cache TTLs based on hit rates
- [ ] Implement additional monitoring alerts
- [ ] Gather merchant feedback
- [ ] Plan feature enhancements

### Ongoing Maintenance

- [ ] Weekly dependency updates
- [ ] Monthly security audits
- [ ] Quarterly performance reviews
- [ ] Monitor Shopify API version deprecations
- [ ] Update to latest Shopify API version annually

---

## Environment Variables Reference

**Required:**
```bash
SHOPIFY_API_KEY=your_client_id
SHOPIFY_API_SECRET=your_client_secret
SHOPIFY_APP_URL=https://your-production-domain.com
SCOPES=write_products,read_products,read_orders,... # from shopify.app.toml
DATABASE_URL_NEON=postgresql://user:pass@host/db
```

**Recommended:**
```bash
REDIS_URL=redis://user:pass@host:port
ENCRYPTION_KEY=your_32_byte_hex_key # generate with: openssl rand -hex 32
SENTRY_DSN=https://your-sentry-dsn
NODE_ENV=production
```

**Optional:**
```bash
ANALYTICS_API_URL=http://your-fastapi-backend.com
```

---

## Common Pitfalls & Solutions

### Pitfall: Webhook handler blocks for > 5 seconds
**Solution:** Immediately return 200 OK, queue processing in background

### Pitfall: Queries missing shop filter
**Solution:** Implement repository pattern that enforces filtering

### Pitfall: HMAC verification on parsed JSON
**Solution:** Framework handles this automatically via `authenticate.webhook()`

### Pitfall: Rate limits not handled
**Solution:** Monitor query costs, implement exponential backoff

### Pitfall: No monitoring until production issues
**Solution:** Set up Sentry from day one

---

## Support & Resources

**Documentation:**
- Shopify App Development: https://shopify.dev/docs/apps
- Remix Documentation: https://remix.run/docs
- Prisma Documentation: https://www.prisma.io/docs

**Getting Help:**
- Shopify Community Forums
- Shopify Partners Slack
- Your app's GitHub issues

**Next Steps:**
1. Complete security hardening (repository pattern + encryption)
2. Write multi-tenant isolation tests
3. Set up Sentry monitoring
4. Deploy to staging environment
5. Test with 3-5 development stores
6. Complete app listing in Partner Dashboard
7. Submit for review

---

**Congratulations!** Your app has a solid foundation. Focus on the "Needs Implementation" section to make it production-ready. Estimated time to launch: 2-3 weeks with the remaining tasks.
