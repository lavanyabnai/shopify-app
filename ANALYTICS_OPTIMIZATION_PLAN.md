# Analytics Dashboard Optimization Plan

## Problem Statement

The current analytics dashboard ([app/routes/app.analytics.tsx](app/routes/app.analytics.tsx)) is slow because it:
- Fetches up to 5,000 orders from Shopify on every page load
- Makes 20+ sequential paginated API calls with retry logic
- Has no caching - every visit repeats the entire fetch process
- Subject to Shopify API rate limits and throttling
- Processes all data in real-time on each request

**Current load time:** 30-60+ seconds per page load

**Target load time:** < 2 seconds

---

## Best Practices for Shopify Analytics Dashboards

### 1. **Never Fetch Large Datasets on Page Load**
- Store order data in your own database
- Use webhooks for real-time sync
- Pre-aggregate metrics in background jobs

### 2. **Webhook-Driven Architecture**
Shopify webhooks notify you when data changes:
- `orders/create` - New order placed
- `orders/updated` - Order status changed
- `products/create`, `products/update` - Product changes
- Process these incrementally instead of bulk fetching

### 3. **Caching Strategy**
- **Level 1:** Pre-computed aggregates in DB (daily/hourly snapshots)
- **Level 2:** In-memory cache (Redis) for hot data (optional)
- **Level 3:** HTTP cache headers for browser caching

### 4. **Database Design**
- Separate tables for raw data (Orders, Products) and analytics (AnalyticsSnapshot)
- Use indexes on date ranges and shop fields
- Aggregate data nightly for historical periods

### 5. **User Experience**
- Show cached data immediately with "Last updated" timestamp
- Provide manual refresh option for real-time updates
- Use progressive loading (metrics first, then charts)
- Display loading states for background syncs

---

## Implementation Phases

## Phase 1: Database Schema Design

**Goal:** Add models to store orders and analytics locally

**Files to create/modify:**
- `prisma/schema.prisma` - Add new models

**New Models:**

```prisma
model Order {
  id                String       @id // Shopify GID
  shopifyOrderId    String       // Numeric ID
  name              String       // Order number (e.g., "#1001")
  shop              String
  email             String?
  totalPrice        Float
  currency          String       @default("USD")
  financialStatus   String?
  fulfillmentStatus String?
  processedAt       DateTime?
  createdAt         DateTime
  updatedAt         DateTime     @updatedAt
  customerId        String?
  customerEmail     String?

  lineItems         OrderLineItem[]

  // Address info
  shippingCity      String?
  shippingProvince  String?
  shippingCountry   String?

  @@index([shop, processedAt])
  @@index([shop, createdAt])
}

model OrderLineItem {
  id              String   @id @default(cuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  productId       String
  productTitle    String
  variantId       String
  variantTitle    String?
  quantity        Int
  price           Float

  @@index([productId])
}

model Product {
  id              String   @id // Shopify GID
  shop            String
  title           String
  productType     String?
  vendor          String?
  totalInventory  Int      @default(0)
  status          String   @default("active")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([shop, status])
}

model AnalyticsSnapshot {
  id              String   @id @default(cuid())
  shop            String
  date            DateTime // Date this snapshot represents
  period          String   // 'daily', 'monthly', 'yearly'

  // Aggregated metrics
  totalOrders     Int      @default(0)
  totalRevenue    Float    @default(0)
  avgOrderValue   Float    @default(0)
  fulfilledOrders Int      @default(0)
  paidOrders      Int      @default(0)

  // JSON fields for complex data
  topProducts     String?  // JSON array
  topLocations    String?  // JSON array
  customerSegments String? // JSON object

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([shop, date, period])
  @@index([shop, date])
}

model SyncStatus {
  id              String   @id @default(cuid())
  shop            String   @unique
  lastOrderSync   DateTime?
  lastProductSync DateTime?
  syncInProgress  Boolean  @default(false)
  totalOrders     Int      @default(0)
  lastError       String?
  updatedAt       DateTime @updatedAt
}
```

**Commands:**
```bash
npx prisma migrate dev --name add_analytics_models
npx prisma generate
```

---

## Phase 2: Webhook Integration

**Goal:** Real-time data sync from Shopify to your database

### 2.1 Register Webhooks in `shopify.app.toml`

Add to your `shopify.app.toml`:

```toml
[[webhooks.subscriptions]]
topics = [ "orders/create", "orders/updated", "orders/cancelled" ]
uri = "/webhooks/orders"

[[webhooks.subscriptions]]
topics = [ "products/create", "products/update" ]
uri = "/webhooks/products"
```

### 2.2 Create Webhook Handlers

**File:** `app/routes/webhooks.orders.tsx`

```typescript
import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { ActionFunctionArgs } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  if (!payload) {
    return new Response("No payload", { status: 400 });
  }

  try {
    await processOrderWebhook(shop, topic, payload);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`Error processing ${topic} webhook:`, error);
    return new Response("Error", { status: 500 });
  }
};

async function processOrderWebhook(shop: string, topic: string, order: any) {
  const orderData = {
    id: order.admin_graphql_api_id,
    shopifyOrderId: order.id.toString(),
    name: order.name,
    shop,
    email: order.email,
    totalPrice: parseFloat(order.total_price),
    currency: order.currency,
    financialStatus: order.financial_status,
    fulfillmentStatus: order.fulfillment_status,
    processedAt: order.processed_at ? new Date(order.processed_at) : null,
    createdAt: new Date(order.created_at),
    customerId: order.customer?.id?.toString(),
    customerEmail: order.customer?.email,
    shippingCity: order.shipping_address?.city,
    shippingProvince: order.shipping_address?.province,
    shippingCountry: order.shipping_address?.country,
  };

  const lineItems = order.line_items.map((item: any) => ({
    productId: item.product_id?.toString() || "unknown",
    productTitle: item.title,
    variantId: item.variant_id?.toString() || "unknown",
    variantTitle: item.variant_title,
    quantity: item.quantity,
    price: parseFloat(item.price),
  }));

  // Upsert order and line items
  await db.order.upsert({
    where: { id: orderData.id },
    create: {
      ...orderData,
      lineItems: { create: lineItems },
    },
    update: {
      ...orderData,
      lineItems: {
        deleteMany: {},
        create: lineItems,
      },
    },
  });

  console.log(`✅ Synced order ${order.name} for ${shop}`);
}
```

**File:** `app/routes/webhooks.products.tsx`

```typescript
import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { ActionFunctionArgs } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (!payload) {
    return new Response("No payload", { status: 400 });
  }

  try {
    await db.product.upsert({
      where: { id: payload.admin_graphql_api_id },
      create: {
        id: payload.admin_graphql_api_id,
        shop,
        title: payload.title,
        productType: payload.product_type,
        vendor: payload.vendor,
        status: payload.status,
        createdAt: new Date(payload.created_at),
      },
      update: {
        title: payload.title,
        productType: payload.product_type,
        vendor: payload.vendor,
        status: payload.status,
      },
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`Error processing product webhook:`, error);
    return new Response("Error", { status: 500 });
  }
};
```

**Deploy webhooks:**
```bash
npm run deploy
```

---

## Phase 3: Background Job for Initial Data Backfill

**Goal:** Import historical orders without blocking the UI

### 3.1 Create Sync Service

**File:** `app/services/shopify-sync.server.ts`

```typescript
import db from "../db.server";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

const BATCH_SIZE = 250;
const DELAY_MS = 500; // Rate limiting delay

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function syncOrdersFromShopify(
  admin: AdminApiContext['graphql'],
  shop: string,
  options: {
    since?: Date;
    limit?: number;
  } = {}
) {
  const syncStatus = await db.syncStatus.upsert({
    where: { shop },
    create: { shop, syncInProgress: true },
    update: { syncInProgress: true },
  });

  let totalSynced = 0;
  let hasNextPage = true;
  let cursor: string | null = null;
  const maxPages = options.limit ? Math.ceil(options.limit / BATCH_SIZE) : 100;

  try {
    for (let page = 0; page < maxPages && hasNextPage; page++) {
      const query = options.since
        ? `processed_at:>='${options.since.toISOString()}'`
        : undefined;

      const variables: any = { first: BATCH_SIZE };
      if (query) variables.query = query;
      if (cursor) variables.after = cursor;

      const response = await admin(ORDERS_QUERY, { variables });
      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const edges = data.data.orders.edges;

      // Batch insert orders
      for (const { node: order } of edges) {
        await saveOrderToDatabase(shop, order);
        totalSynced++;
      }

      hasNextPage = data.data.orders.pageInfo.hasNextPage;
      cursor = data.data.orders.pageInfo.endCursor;

      console.log(`📦 Synced ${totalSynced} orders (page ${page + 1})`);

      if (hasNextPage) {
        await delay(DELAY_MS); // Respect rate limits
      }
    }

    await db.syncStatus.update({
      where: { shop },
      data: {
        lastOrderSync: new Date(),
        syncInProgress: false,
        totalOrders: totalSynced,
      },
    });

    console.log(`✅ Sync complete: ${totalSynced} orders`);
    return { success: true, synced: totalSynced };
  } catch (error: any) {
    await db.syncStatus.update({
      where: { shop },
      data: {
        syncInProgress: false,
        lastError: error.message,
      },
    });
    throw error;
  }
}

async function saveOrderToDatabase(shop: string, order: any) {
  const orderData = {
    id: order.id,
    shopifyOrderId: order.name.replace("#", ""),
    name: order.name,
    shop,
    email: order.customer?.email,
    totalPrice: parseFloat(order.totalPriceSet.shopMoney.amount),
    currency: order.totalPriceSet.shopMoney.currencyCode,
    financialStatus: order.displayFinancialStatus,
    fulfillmentStatus: order.displayFulfillmentStatus,
    processedAt: order.processedAt ? new Date(order.processedAt) : null,
    createdAt: new Date(order.createdAt),
    customerId: order.customer?.id,
    customerEmail: order.customer?.email,
    shippingCity: order.shippingAddress?.city,
    shippingProvince: order.shippingAddress?.province,
    shippingCountry: order.shippingAddress?.country,
  };

  const lineItems = order.lineItems.edges.map(({ node: item }: any) => ({
    productId: item.product?.id || "unknown",
    productTitle: item.title,
    variantId: item.variant?.id || "unknown",
    variantTitle: item.variant?.title,
    quantity: item.quantity,
    price: parseFloat(item.variant?.price || "0"),
  }));

  await db.order.upsert({
    where: { id: orderData.id },
    create: {
      ...orderData,
      lineItems: { create: lineItems },
    },
    update: orderData,
  });
}

const ORDERS_QUERY = `
  query GetOrders($first: Int!, $query: String, $after: String) {
    orders(first: $first, query: $query, after: $after) {
      edges {
        node {
          id
          name
          createdAt
          processedAt
          totalPriceSet { shopMoney { amount currencyCode } }
          displayFulfillmentStatus
          displayFinancialStatus
          customer { id email }
          lineItems(first: 250) {
            edges {
              node {
                id
                title
                quantity
                product { id title }
                variant { id title price }
              }
            }
          }
          shippingAddress { city province country }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
```

### 3.2 Create Admin Route to Trigger Sync

**File:** `app/routes/app.sync.tsx`

```typescript
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { syncOrdersFromShopify } from "../services/shopify-sync.server";
import db from "../db.server";
import { Page, Card, Button, Text, BlockStack } from "@shopify/polaris";

export async function loader({ request }: { request: Request }) {
  const { session } = await authenticate.admin(request);

  const syncStatus = await db.syncStatus.findUnique({
    where: { shop: session.shop },
  });

  return json({ syncStatus });
}

export async function action({ request }: { request: Request }) {
  const { admin, session } = await authenticate.admin(request);

  try {
    const result = await syncOrdersFromShopify(admin.graphql, session.shop, {
      limit: 1000, // Limit initial sync
    });
    return json(result);
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export default function SyncPage() {
  const { syncStatus } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <Page title="Data Sync">
      <Card>
        <BlockStack gap="400">
          <Text as="p">
            Last sync: {syncStatus?.lastOrderSync?.toLocaleString() || "Never"}
          </Text>
          <Text as="p">Total orders: {syncStatus?.totalOrders || 0}</Text>
          <Text as="p">
            Status: {syncStatus?.syncInProgress ? "Syncing..." : "Idle"}
          </Text>

          <Button
            onClick={() => fetcher.submit({}, { method: "post" })}
            loading={fetcher.state !== "idle"}
            disabled={syncStatus?.syncInProgress}
          >
            Start Manual Sync
          </Button>
        </BlockStack>
      </Card>
    </Page>
  );
}
```

---

## Phase 4: Analytics Pre-computation Job

**Goal:** Generate daily snapshots for fast dashboard loads

**File:** `app/services/analytics-aggregator.server.ts`

```typescript
import db from "../db.server";

export async function generateDailyAnalytics(shop: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch orders for the day
  const orders = await db.order.findMany({
    where: {
      shop,
      processedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      lineItems: true,
    },
  });

  // Calculate metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const fulfilledOrders = orders.filter(o => o.fulfillmentStatus === "FULFILLED").length;
  const paidOrders = orders.filter(o => o.financialStatus === "PAID").length;

  // Product stats
  const productStats = new Map<string, { quantity: number; revenue: number }>();
  orders.forEach(order => {
    order.lineItems.forEach(item => {
      const key = item.productTitle;
      const stats = productStats.get(key) || { quantity: 0, revenue: 0 };
      stats.quantity += item.quantity;
      stats.revenue += item.quantity * item.price;
      productStats.set(key, stats);
    });
  });

  const topProducts = Array.from(productStats, ([name, stats]) => ({
    name,
    ...stats,
  }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Save snapshot
  await db.analyticsSnapshot.upsert({
    where: {
      shop_date_period: {
        shop,
        date: startOfDay,
        period: "daily",
      },
    },
    create: {
      shop,
      date: startOfDay,
      period: "daily",
      totalOrders,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      fulfilledOrders,
      paidOrders,
      topProducts: JSON.stringify(topProducts),
    },
    update: {
      totalOrders,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      fulfilledOrders,
      paidOrders,
      topProducts: JSON.stringify(topProducts),
    },
  });

  console.log(`📊 Generated analytics for ${date.toDateString()}`);
}
```

**Run this job daily via cron or after each webhook**

---

## Phase 5: Update Dashboard to Use Local Data

**File:** `app/routes/app.analytics.optimized.tsx`

```typescript
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { Page, Card, Text } from "@shopify/polaris";

export async function loader({ request }: { request: Request }) {
  const { session } = await authenticate.admin(request);

  // Query local database - FAST!
  const orders = await db.order.findMany({
    where: {
      shop: session.shop,
      processedAt: {
        gte: new Date("2025-01-01"),
      },
    },
    include: {
      lineItems: true,
    },
    orderBy: {
      processedAt: "desc",
    },
  });

  // Or use pre-computed snapshots (even faster!)
  const snapshots = await db.analyticsSnapshot.findMany({
    where: {
      shop: session.shop,
      period: "daily",
    },
    orderBy: {
      date: "desc",
    },
    take: 365,
  });

  const analytics = computeAnalytics(orders);

  return json({
    analytics,
    lastSync: await getLastSyncTime(session.shop),
  });
}

function computeAnalytics(orders: any[]) {
  // Same logic as before, but running on local data = instant!
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
    // ... rest of calculations
  };
}

async function getLastSyncTime(shop: string) {
  const syncStatus = await db.syncStatus.findUnique({
    where: { shop },
  });
  return syncStatus?.lastOrderSync;
}
```

---

## Phase 6: Add Caching (Optional - Redis)

For even better performance, add Redis caching:

```typescript
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

// In your loader:
const cacheKey = `analytics:${session.shop}:${period}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return json(JSON.parse(cached));
}

// Fetch from DB
const data = await fetchAnalytics();

// Cache for 5 minutes
await redis.setEx(cacheKey, 300, JSON.stringify(data));

return json(data);
```

---

## Deployment Checklist

- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Deploy webhooks: `npm run deploy`
- [ ] Run initial sync via `/app/sync` page
- [ ] Set up daily cron job for analytics aggregation
- [ ] Monitor webhook delivery in Shopify Partners dashboard
- [ ] (Optional) Set up Redis for caching
- [ ] Update analytics route to use local data
- [ ] Test dashboard load time

---

## Expected Results

- **Before:** 30-60 seconds to load analytics
- **After:** < 2 seconds (database query)
- **With Redis:** < 500ms (cache hit)

**Additional benefits:**
- No rate limit issues
- Works offline (data is local)
- Can add custom metrics easily
- Historical data preserved
- Lower Shopify API costs
