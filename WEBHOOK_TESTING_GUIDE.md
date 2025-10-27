# Webhook Testing Guide

This guide explains how to test the webhook handlers for the analytics dashboard optimization.

## Prerequisites

- Development server must be running: `npm run dev`
- Webhooks are configured in `shopify.app.toml`
- Database migration completed with analytics models

## Testing Methods

### Method 1: Shopify CLI Webhook Triggers (Recommended)

The Shopify CLI can trigger test webhooks when the dev server is running:

```bash
# Start dev server first
npm run dev

# In another terminal, trigger webhooks
shopify app webhook trigger --topic orders/create --api-version 2024-10
shopify app webhook trigger --topic orders/updated --api-version 2024-10
shopify app webhook trigger --topic products/create --api-version 2024-10
shopify app webhook trigger --topic products/update --api-version 2024-10
```

**Expected behavior:**
- Webhook handler receives the payload
- Console logs show: `📥 Received webhook: orders/create for shop: ...`
- Order/Product is saved to database
- Console logs show: `✅ Successfully processed ...`
- SyncStatus table is updated

### Method 2: Manual Testing with cURL

When the dev server is running with tunnel, you can send webhook payloads directly:

```bash
# Get your dev server URL from npm run dev output
# Example: https://abc-xyz-123.trycloudflare.com

# Test orders webhook
curl -X POST https://YOUR-DEV-URL.trycloudflare.com/webhooks/orders \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/create" \
  -H "X-Shopify-Shop-Domain: test-shop.myshopify.com" \
  -d @webhook-test-payloads.json

# Test products webhook
curl -X POST https://YOUR-DEV-URL.trycloudflare.com/webhooks/products \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: products/create" \
  -H "X-Shopify-Shop-Domain: test-shop.myshopify.com" \
  -d '{"admin_graphql_api_id":"gid://shopify/Product/123","title":"Test","status":"active","created_at":"2025-10-09T00:00:00Z","variants":[]}'
```

**Note:** The Shopify webhook authentication will fail for manual cURL requests unless you provide a valid HMAC signature. For development testing, you may need to temporarily disable HMAC validation in `shopify.server.ts`.

### Method 3: Test via Prisma Studio

After triggering webhooks, verify the data was saved:

```bash
npx prisma studio
```

Navigate to:
- **Order** table - Check for test orders
- **OrderLineItem** table - Check for line items
- **Product** table - Check for products
- **SyncStatus** table - Check sync timestamps and counts

## Verification Checklist

After testing webhooks, verify:

- [ ] Order data appears in `Order` table with correct fields
- [ ] Line items appear in `OrderLineItem` table linked to orders
- [ ] Product data appears in `Product` table
- [ ] `SyncStatus` table shows:
  - `lastOrderSync` timestamp updated
  - `lastProductSync` timestamp updated
  - `totalOrders` incremented
  - `totalProducts` incremented
  - No errors in `lastError` field

## Console Output Examples

### Successful Order Webhook

```
📥 Received webhook: orders/create for shop: test-shop.myshopify.com
💾 Saved order #1001 (2 items) for test-shop.myshopify.com
✅ Successfully processed orders/create webhook for order #1001
```

### Successful Product Webhook

```
📥 Received webhook: products/create for shop: test-shop.myshopify.com
💾 Saved product "Test Product" (80 total inventory) for test-shop.myshopify.com
✅ Successfully processed products/create webhook for product Test Product
```

### Error Handling

```
📥 Received webhook: orders/create for shop: test-shop.myshopify.com
❌ Error processing orders/create webhook: [error details]
```

## Testing Idempotency

Webhooks should be idempotent (safe to process multiple times):

1. Trigger the same webhook twice
2. Verify only ONE record exists in the database
3. Verify the data is updated, not duplicated

```bash
# Trigger same webhook twice
shopify app webhook trigger --topic orders/create --api-version 2024-10
shopify app webhook trigger --topic orders/create --api-version 2024-10

# Check in Prisma Studio - should see only 1 order with the test ID
```

## Troubleshooting

### Webhooks not being received

1. Check dev server is running: `npm run dev`
2. Check tunnel is active (shown in dev server output)
3. Verify webhook endpoint URLs in Shopify Partner dashboard
4. Check server logs for errors

### Database errors

1. Verify migration ran: `npx prisma migrate status`
2. Check Prisma Client is generated: `npx prisma generate`
3. View database schema: `npx prisma studio`

### Authentication errors

If you see HMAC validation errors:
- This is expected for manual cURL requests
- Use `shopify app webhook trigger` instead
- Or temporarily disable HMAC validation for testing

## Production Testing

Once deployed to production:

1. Monitor webhook delivery in Shopify Partner dashboard
2. Check webhook delivery logs for success/failure
3. Verify data is syncing to production database
4. Monitor error logs for any webhook processing failures

## Next Steps

After webhook testing is complete:
- Proceed to Phase 3: Background Sync Job
- Implement initial data backfill
- Create admin UI for manual sync trigger
