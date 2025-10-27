# Testing Google Cloud Pub/Sub Webhooks

## The Problem with `shopify webhook trigger`

**You CANNOT use `shopify webhook trigger` with GCP Pub/Sub URLs.**

```bash
# ❌ This doesn't work
shopify webhook trigger --topic orders/create --address pubsub://shop-webhooks:control-tower
# Error: "Unable to validate address"

# ❌ This also doesn't work (if Pub/Sub is configured)
shopify webhook trigger --topic orders/create
# Error: CLI only supports HTTP/HTTPS endpoints
```

**Why:** The Shopify CLI sends test webhooks via HTTP POST. It cannot publish directly to Google Cloud Pub/Sub.

---

## ✅ How to Test GCP Pub/Sub Webhooks (3 Methods)

### **Method 1: Use Your Test Script** ⭐ **EASIEST**

This is the quickest way to test your GCP Pub/Sub setup:

```bash
npm run test-gcp-pubsub
```

**What it does:**
1. ✅ Publishes a test order webhook to GCP Pub/Sub
2. ✅ Starts a consumer to receive the message
3. ✅ Verifies end-to-end functionality
4. ✅ Shows processing time and confirms data was saved

**Example Output:**
```
╔════════════════════════════════════════════════════════════╗
║        Google Cloud Pub/Sub Test Script                   ║
╚════════════════════════════════════════════════════════════╝

📋 Step 1: Verifying connection to Google Cloud...
✅ Connected to GCP project: shop-webhooks
✅ Topic "control-tower" exists
✅ Subscription "control-tower-sub-2" exists

📋 Step 3: Publishing test webhook message...
📤 Test message:
{
  "shop": "test-shop.myshopify.com",
  "topic": "orders/create",
  "payload": {
    "id": 12345,
    "name": "#TEST-001",
    "total_price": "99.99",
    "currency": "USD",
    ...
  }
}
✅ Message published successfully!
   Message ID: 123456789

📋 Step 4: Starting consumer to receive test message...
⏳ Waiting for test message (will timeout in 30 seconds)...

✅ Test message received and processed successfully!

📊 Test Results:
────────────────────────────────────────────────────────────
✅ Connection to GCP: PASS
✅ Topic access: PASS
✅ Subscription access: PASS
✅ Message publishing: PASS
✅ Message receiving: PASS
✅ Message processing: PASS
────────────────────────────────────────────────────────────

🎉 All tests passed! Your GCP Pub/Sub setup is working correctly.
```

**This is the recommended way to test during development!**

---

### **Method 2: Create Real Events in Shopify** ⭐ **MOST REALISTIC**

This tests the actual Shopify → Pub/Sub flow.

#### Prerequisites

First, configure Shopify to send webhooks to GCP Pub/Sub:

**Option A: Via shopify.app.toml (Recommended)**

Edit your `shopify.app.toml`:

```toml
[webhooks]
api_version = "2024-10"

# Change from HTTP to Pub/Sub
[[webhooks.subscriptions]]
topics = ["orders/create", "orders/updated", "orders/cancelled"]
uri = "pubsub://shop-webhooks:control-tower"  # ← Changed from /webhooks/orders

[[webhooks.subscriptions]]
topics = ["products/create", "products/update"]
uri = "pubsub://shop-webhooks:control-tower"  # ← Changed from /webhooks/products
```

Deploy the configuration:
```bash
npm run deploy
```

**Option B: Via Partners Dashboard**

1. Go to https://partners.shopify.com
2. Apps → control-tower → Configuration
3. Event subscriptions → Create subscription
4. Event: `orders/create`
5. **Delivery method:** Google Cloud Pub/Sub
6. **Pub/Sub project ID:** `shop-webhooks`
7. **Pub/Sub topic ID:** `control-tower`
8. Save

#### Grant Shopify Permission to Publish

**IMPORTANT:** Shopify needs permission to publish to your topic:

```bash
gcloud pubsub topics add-iam-policy-binding control-tower \
  --member='serviceAccount:shopify-eventbridge@shopify-prs.iam.gserviceaccount.com' \
  --role='roles/pubsub.publisher' \
  --project=shop-webhooks
```

Or via Google Cloud Console:
1. https://console.cloud.google.com/cloudpubsub/topic/list?project=shop-webhooks
2. Click `control-tower` → Permissions → Add Principal
3. Principal: `shopify-eventbridge@shopify-prs.iam.gserviceaccount.com`
4. Role: `Pub/Sub Publisher`
5. Save

#### Test with Real Events

**Step 1: Start the consumer**
```bash
npm run gcp-consumer
```

You should see:
```
✅ Successfully connected to Google Cloud Pub/Sub
👂 Waiting for webhook messages...
```

**Step 2: Create a test order in Shopify**

1. Go to your Shopify Admin
2. Orders → Create order
3. Add a product
4. Add customer info
5. Mark as paid
6. Click "Create order"

**Step 3: Watch the consumer logs**

You should see:
```
📥 Received message abc123...
📦 Processing webhook: orders/create for shop: your-shop.myshopify.com
💰 Processing order webhook: #1001
💾 Saved order #1001 (2 items)
🧹 Invalidated analytics cache
✅ Successfully processed message in 350ms
```

**Step 4: Verify in your database**

```bash
# Check if order was saved
npm run prisma studio
# Or query directly:
# SELECT * FROM Order WHERE shopifyOrderId = '5678...' LIMIT 1;
```

**This is the most realistic test - actual Shopify webhook → GCP Pub/Sub → Your app!**

---

### **Method 3: Use HTTP Webhook Proxy (For Testing Only)**

If you want to keep using `shopify webhook trigger` during development, use this workaround:

#### Step 1: Keep HTTP Webhooks Active

Your current `shopify.app.toml` already has HTTP webhooks:

```toml
[[webhooks.subscriptions]]
topics = ["orders/create", "orders/updated", "orders/cancelled"]
uri = "/webhooks/orders"
```

Keep these for development.

#### Step 2: Modify HTTP Webhook to Forward to Pub/Sub

Update `app/routes/webhooks.orders.tsx` to forward to GCP Pub/Sub:

```typescript
// app/routes/webhooks.orders.tsx
import { getGCPPubSubService } from "~/services/gcp-pubsub.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  console.log(`📥 HTTP Webhook: ${topic} from ${shop}`);

  try {
    // Option 1: Process immediately (current behavior)
    await processOrderWebhook(shop, topic, payload);

    // Option 2: Forward to GCP Pub/Sub for testing
    const gcpPubSub = getGCPPubSubService();
    await gcpPubSub.publishTestMessage({
      shop,
      topic,
      payload,
    });
    console.log(`✅ Forwarded to GCP Pub/Sub`);

    return json({ success: true });
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};
```

#### Step 3: Test with CLI

Now you can use the Shopify CLI:

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start GCP consumer
npm run gcp-consumer

# Terminal 3: Trigger webhook
shopify webhook trigger --topic orders/create
```

**Flow:**
```
CLI → HTTP Webhook (/webhooks/orders) → Your Code → GCP Pub/Sub → Consumer
```

This allows you to use the CLI for testing while still validating your GCP Pub/Sub setup.

---

## Complete Testing Workflow

### Development Phase (Now)

**Use Method 1 (Test Script):**
```bash
npm run test-gcp-pubsub
```

**Why:**
- ✅ Fastest way to validate GCP Pub/Sub works
- ✅ No Shopify configuration changes needed
- ✅ Can run unlimited times
- ✅ Verifies end-to-end flow

### Pre-Production (Before Launching)

**Use Method 2 (Real Shopify Events):**

1. Configure Pub/Sub webhooks in shopify.app.toml
2. Deploy: `npm run deploy`
3. Grant Shopify permission to publish
4. Create test orders in Shopify Admin
5. Verify webhooks arrive and process correctly

**Why:**
- ✅ Tests actual production flow
- ✅ Validates Shopify can publish to your topic
- ✅ Confirms your app processes real webhook data

### Production

**Monitor in GCP Console:**

1. Go to: https://console.cloud.google.com/cloudpubsub/topic/detail/control-tower?project=shop-webhooks
2. Click "Metrics" tab
3. Monitor:
   - Messages published (from Shopify)
   - Messages pulled (by your consumer)
   - Unacknowledged messages (backlog)
   - Oldest unacknowledged message age

**Set up alerts:**
- Alert if unacknowledged messages > 1000
- Alert if oldest message > 5 minutes
- Alert if consumer hasn't pulled messages in 5 minutes

---

## Troubleshooting

### Test Script Shows "Message Not Received"

**Problem:** Consumer didn't receive the test message within 30 seconds

**Solutions:**

1. **Check consumer is running:**
   ```bash
   npm run gcp-consumer
   ```

2. **Verify subscription exists:**
   ```bash
   npm run check-gcp-setup
   ```

3. **Check for messages in GCP Console:**
   - https://console.cloud.google.com/cloudpubsub/subscription/detail/control-tower-sub-2?project=shop-webhooks
   - Look for "Unacknowledged messages"

4. **Check service account permissions:**
   - Should have `Pub/Sub Subscriber` role

### Shopify Events Not Arriving

**Problem:** Created order in Shopify, but consumer doesn't receive webhook

**Solutions:**

1. **Verify webhook is configured:**
   ```bash
   shopify app info
   ```
   Look for webhooks section - should show Pub/Sub URLs

2. **Grant Shopify permission to publish:**
   ```bash
   gcloud pubsub topics add-iam-policy-binding control-tower \
     --member='serviceAccount:shopify-eventbridge@shopify-prs.iam.gserviceaccount.com' \
     --role='roles/pubsub.publisher' \
     --project=shop-webhooks
   ```

3. **Check webhook delivery in Shopify Admin:**
   - Settings → Notifications → Webhooks
   - Click on your webhook
   - View "Recent deliveries"
   - Check for errors

4. **Monitor GCP Pub/Sub:**
   - https://console.cloud.google.com/cloudpubsub/topic/detail/control-tower
   - Check if messages are arriving (even if consumer isn't processing)

### Consumer Receives Message but Processing Fails

**Problem:** Message arrives but errors during processing

**Check consumer logs:**
```bash
npm run gcp-consumer
```

**Common errors:**

1. **Database error:**
   - Check database connection
   - Verify tables exist: `npm run prisma studio`
   - Check Prisma schema matches database

2. **Invalid payload:**
   - Log the payload: `console.log(JSON.stringify(payload, null, 2))`
   - Verify payload structure matches expected format

3. **Cache error (Redis):**
   - Redis may be down (this is OK - should not fail webhook)
   - Check Redis connection: `redis-cli ping`

---

## Best Testing Strategy

For your multi-merchant analytics app, use this testing approach:

### 1. Local Development
```bash
# Use test script for quick validation
npm run test-gcp-pubsub
```

### 2. Integration Testing
```bash
# Use HTTP webhook proxy + CLI
# (Keep HTTP webhooks, forward to Pub/Sub)
shopify webhook trigger --topic orders/create
```

### 3. Staging/Pre-Production
```bash
# Switch to Pub/Sub webhooks
# Create real events in test store
# Monitor GCP Console
```

### 4. Production
```bash
# Pub/Sub webhooks only
# Monitor GCP metrics
# Set up alerting
# Review logs daily
```

---

## Quick Reference

| Test Method | Use Case | Command |
|-------------|----------|---------|
| Test Script | Quick validation | `npm run test-gcp-pubsub` |
| Real Shopify Events | Integration testing | Create order in Shopify Admin |
| HTTP Proxy | CLI testing | `shopify webhook trigger` + HTTP proxy |
| GCP Console | Monitoring | View metrics in GCP Console |

---

## Summary

**Question:** What address should I use for `shopify webhook trigger` with GCP Pub/Sub?

**Answer:** You can't use `shopify webhook trigger` with GCP Pub/Sub. Use one of these instead:

1. ✅ **Recommended:** `npm run test-gcp-pubsub`
2. ✅ **Best for integration:** Create real events in Shopify
3. ✅ **Workaround:** HTTP webhook proxy (forward to Pub/Sub)

**For development, use Method 1. For production validation, use Method 2.**
