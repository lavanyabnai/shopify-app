# How to Configure Shopify Webhooks with Google Cloud Pub/Sub

## ⚠️ Important: Not All Methods Support Pub/Sub URLs

**The Error You're Seeing:**
```
Request errors:
[{"message":"Unable to validate address","fields":[]}]
```

**Why This Happens:**
- ❌ Shopify CLI `webhook trigger` does NOT support Pub/Sub URLs
- ❌ GraphQL Admin API does NOT support Pub/Sub URLs directly
- ✅ Partners Dashboard DOES support Pub/Sub URLs
- ✅ shopify.app.toml configuration DOES support Pub/Sub URLs
- ✅ EventBridge registration API DOES support Pub/Sub URLs

---

## ✅ Method 1: Configure via Partners Dashboard (Easiest)

This is the **recommended method** for Google Cloud Pub/Sub webhooks.

### Step-by-Step Instructions:

1. **Go to Shopify Partners Dashboard:**
   - https://partners.shopify.com

2. **Navigate to Your App:**
   - Apps → Select "control-tower"

3. **Go to Configuration:**
   - Click "Configuration" tab

4. **Scroll to Webhooks Section:**
   - Find "Event subscriptions" or "Webhooks"

5. **Add Webhook Subscription:**
   - Click "Add subscription" or "Create webhook"

6. **Configure the Webhook:**
   - **Event version:** `2024-10` (or latest)
   - **Event topic:** Select from dropdown (e.g., `orders/create`)
   - **Delivery method:** Select **"Google Cloud Pub/Sub"** (not HTTP/HTTPS!)
   - **Pub/Sub project ID:** `shop-webhooks`
   - **Pub/Sub topic ID:** `control-tower`

7. **Save:**
   - Click "Save" or "Create"

8. **Verify:**
   - You should see the webhook listed with status "Active"

---

## ✅ Method 2: Configure via shopify.app.toml (Recommended for Development)

This is the **best method for development** as it's version-controlled.

### Step 1: Update shopify.app.toml

Add webhook subscriptions to your `shopify.app.toml` file:

```toml
# shopify.app.toml

name = "control-tower"
client_id = "your-client-id"
application_url = "https://your-app-url.com"
embedded = true

[access_scopes]
# your existing scopes
scopes = "write_products,read_products,read_orders,write_orders"

[webhooks]
api_version = "2024-10"

# Subscribe to webhooks via Google Cloud Pub/Sub
[[webhooks.subscriptions]]
topics = ["orders/create"]
uri = "pubsub://shop-webhooks:control-tower"

[[webhooks.subscriptions]]
topics = ["orders/updated"]
uri = "pubsub://shop-webhooks:control-tower"

[[webhooks.subscriptions]]
topics = ["products/create"]
uri = "pubsub://shop-webhooks:control-tower"

[[webhooks.subscriptions]]
topics = ["products/update"]
uri = "pubsub://shop-webhooks:control-tower"

[[webhooks.subscriptions]]
topics = ["inventory_levels/update"]
uri = "pubsub://shop-webhooks:control-tower"
```

### Step 2: Deploy Configuration

```bash
shopify app deploy
```

Or if you just want to update webhooks:

```bash
npm run deploy
```

### Step 3: Verify

```bash
shopify app info
```

Look for the webhooks section to confirm they're registered.

---

## ✅ Method 3: Use HTTP Webhooks → Proxy to Pub/Sub (Alternative)

If you cannot use Pub/Sub URLs directly, create an HTTP endpoint that forwards to Pub/Sub.

### Step 1: Create Webhook Proxy Route

Create `app/routes/webhooks.proxy.tsx`:

```typescript
import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { getGCPPubSubService } from "~/services/gcp-pubsub.server";
import { authenticate } from "~/shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Authenticate the webhook
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  console.log(`📥 Webhook proxy: ${topic} from ${shop}`);

  try {
    // Publish to GCP Pub/Sub
    const gcpPubSub = getGCPPubSubService();
    await gcpPubSub.publishTestMessage({
      shop,
      topic,
      payload,
    });

    console.log(`✅ Forwarded webhook to GCP Pub/Sub`);
    return json({ success: true });
  } catch (error: any) {
    console.error(`❌ Failed to forward webhook:`, error.message);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};
```

### Step 2: Register HTTP Webhook

Use the HTTP URL instead:

```bash
shopify webhook create \
  --topic orders/create \
  --address https://your-app-url.com/webhooks/proxy \
  --api-version 2024-10
```

### Step 3: Start Consumer

```bash
npm run gcp-consumer
```

**Note:** This adds an extra hop (HTTP → your server → Pub/Sub), which increases latency but gives you more control.

---

## ❌ What NOT to Do

### DON'T: Use `shopify webhook trigger` with Pub/Sub URL

This will **always fail**:

```bash
# ❌ This doesn't work
shopify webhook trigger --topic orders/create --address pubsub://shop-webhooks:control-tower
```

**Why:** The CLI sends webhooks via HTTP, not Pub/Sub. It's only meant for testing HTTP endpoints.

### DON'T: Use GraphQL Admin API for Pub/Sub Webhooks

```graphql
# ❌ This doesn't work for Pub/Sub
mutation {
  webhookSubscriptionCreate(
    topic: ORDERS_CREATE
    webhookSubscription: {
      format: JSON
      callbackUrl: "pubsub://shop-webhooks:control-tower"
    }
  ) {
    webhookSubscription { id }
  }
}
```

**Why:** The Admin API only supports HTTP/HTTPS URLs.

---

## 🧪 How to Test Pub/Sub Webhooks

Since `shopify webhook trigger` doesn't work with Pub/Sub, use these methods:

### Method 1: Test with Your Test Script

```bash
npm run test-gcp-pubsub
```

This publishes a test message directly to Pub/Sub.

### Method 2: Trigger Real Events in Shopify

1. **Start the consumer:**
   ```bash
   npm run gcp-consumer
   ```

2. **Create a test order in your development store:**
   - Go to Shopify Admin → Orders → Create order
   - Fill in details and save

3. **Watch the consumer logs:**
   - You should see the webhook arrive and get processed

### Method 3: Use HTTP Endpoint for Testing

Temporarily use an HTTP webhook for testing:

```bash
# Start your app
npm run dev

# In another terminal, trigger HTTP webhook
shopify webhook trigger --topic orders/create
```

Then later, switch to Pub/Sub for production.

---

## 📊 Verify Webhooks are Configured

### Via Partners Dashboard

1. Go to https://partners.shopify.com
2. Apps → Your app → Configuration
3. Scroll to "Event subscriptions"
4. You should see your webhooks listed

### Via Shopify CLI

```bash
shopify app info
```

Look for the webhooks section.

### Via GCP Console

1. Go to: https://console.cloud.google.com/cloudpubsub/topic/detail/control-tower?project=shop-webhooks
2. Click "Metrics" tab
3. You should see incoming messages when webhooks fire

---

## 🔍 Troubleshooting

### Issue: "Unable to validate address"

**Problem:** Using wrong method to configure Pub/Sub webhooks

**Solution:** Use Partners Dashboard or shopify.app.toml (see Method 1 or 2 above)

### Issue: Webhooks not arriving in GCP

**Checklist:**
1. ✅ Webhook configured in Partners Dashboard with Pub/Sub URL
2. ✅ Shopify service account has publisher permission on topic
3. ✅ Consumer is running (`npm run gcp-consumer`)
4. ✅ Test event triggered in Shopify (e.g., create an order)

**Grant Shopify publisher permission:**
```bash
gcloud pubsub topics add-iam-policy-binding control-tower \
  --member='serviceAccount:shopify-eventbridge@shopify-prs.iam.gserviceaccount.com' \
  --role='roles/pubsub.publisher' \
  --project=shop-webhooks
```

### Issue: Webhooks arriving but not processing

**Check consumer logs:**
```bash
npm run gcp-consumer
```

Look for errors like:
- `❌ Failed to parse message data` - Message format issue
- `❌ Error processing message` - Database or processing error

---

## 📋 Recommended Configuration

For a production Shopify app, configure these webhooks:

```toml
# shopify.app.toml

[webhooks]
api_version = "2024-10"

# Orders
[[webhooks.subscriptions]]
topics = ["orders/create", "orders/updated", "orders/cancelled"]
uri = "pubsub://shop-webhooks:control-tower"

# Products
[[webhooks.subscriptions]]
topics = ["products/create", "products/update", "products/delete"]
uri = "pubsub://shop-webhooks:control-tower"

# Inventory
[[webhooks.subscriptions]]
topics = ["inventory_levels/update"]
uri = "pubsub://shop-webhooks:control-tower"

# App lifecycle
[[webhooks.subscriptions]]
topics = ["app/uninstalled"]
uri = "pubsub://shop-webhooks:control-tower"
```

Then deploy:
```bash
npm run deploy
```

---

## ✅ Summary

**To configure Google Cloud Pub/Sub webhooks:**

1. ✅ **Use Partners Dashboard** with "Google Cloud Pub/Sub" delivery method
2. ✅ **Use shopify.app.toml** with `uri = "pubsub://project-id:topic-id"`
3. ✅ **Grant Shopify permission** to publish to your topic
4. ✅ **Start consumer** with `npm run gcp-consumer`
5. ✅ **Test with real events** in Shopify (create order, product, etc.)

**Don't use:**
- ❌ `shopify webhook trigger` with Pub/Sub URL (only supports HTTP)
- ❌ GraphQL Admin API for Pub/Sub (only supports HTTP)

---

## 🚀 Quick Start

The fastest way to get started:

1. **Add to shopify.app.toml:**
   ```toml
   [[webhooks.subscriptions]]
   topics = ["orders/create"]
   uri = "pubsub://shop-webhooks:control-tower"
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Grant Shopify permission:**
   ```bash
   gcloud pubsub topics add-iam-policy-binding control-tower \
     --member='serviceAccount:shopify-eventbridge@shopify-prs.iam.gserviceaccount.com' \
     --role='roles/pubsub.publisher' \
     --project=shop-webhooks
   ```

4. **Start consumer:**
   ```bash
   npm run gcp-consumer
   ```

5. **Test by creating an order in Shopify Admin**

Done! 🎉
