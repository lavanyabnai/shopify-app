# Google Cloud Pub/Sub Quick Start

This guide will get you up and running with Google Cloud Pub/Sub for Shopify webhooks in 15 minutes.

## What You Need

- Google Cloud account ([sign up free](https://cloud.google.com/free))
- Shopify app (already created)
- Your app running locally or deployed

## Step 1: Set Up Google Cloud (5 minutes)

### 1.1 Create GCP Project

```bash
# Go to https://console.cloud.google.com/
# Click "Select a project" → "New Project"
# Name: control-tower-prod (or your choice)
# Note your PROJECT_ID

```

### 1.2 Enable Pub/Sub API

```bash
# Via Console:
# https://console.cloud.google.com/apis/library/pubsub.googleapis.com
# Click "Enable"

# Or via gcloud CLI:
gcloud services enable pubsub.googleapis.com --project=shop-webhooks
```

### 1.3 Create Topic

```bash
# Via gcloud CLI:
gcloud pubsub topics create shopify-webhooks --project=YOUR_PROJECT_ID

# Or via Console:
# https://console.cloud.google.com/cloudpubsub/topic/list
# Click "Create Topic" → Name: shopify-webhooks
```

### 1.4 Create Subscription

```bash
# Via gcloud CLI:
gcloud pubsub subscriptions create shopify-webhooks-sub \
  --topic=shopify-webhooks \
  --ack-deadline=60 \
  --project=YOUR_PROJECT_ID

# Or via Console:
# Click on your topic → "Create Subscription"
# Subscription ID: shopify-webhooks-sub
# Delivery Type: Pull
```

### 1.5 Create Service Account

```bash
# Via gcloud CLI:
gcloud iam service-accounts create shopify-webhook-consumer \
  --display-name="Shopify Webhook Consumer" \
  --project=shop-webhooks

# Grant Pub/Sub Subscriber role:
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:shopify-webhook-consumer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"

# Create and download key:
gcloud iam service-accounts keys create control-tower-credentials.json \
  --iam-account=shopify-webhook-consumer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 1.6 Grant Shopify Publisher Access

```bash
# Via gcloud CLI:
gcloud pubsub topics add-iam-policy-binding shopify-webhooks \
  --member='serviceAccount:shopify-eventbridge@shopify-prs.iam.gserviceaccount.com' \
  --role='roles/pubsub.publisher' \
  --project=YOUR_PROJECT_ID

# Or via Console:
# Go to topic → Permissions → Add Principal
# Principal: shopify-eventbridge@shopify-prs.iam.gserviceaccount.com
# Role: Pub/Sub Publisher
```

## Step 2: Configure Your App (3 minutes)

### 2.1 Update .env File

```bash
# Edit .env file:
GOOGLE_CLOUD_PROJECT_ID=shop-webhooks
GOOGLE_CLOUD_TOPIC_ID=control-tower
GOOGLE_CLOUD_SUBSCRIPTION_ID=control-tower-sub-2
GOOGLE_APPLICATION_CREDENTIALS=./control-tower-credentials.json
```

### 2.2 Place Credentials File

```bash
# Move the downloaded credentials file to your project root:
mv ~/Downloads/control-tower-credentials.json ./control-tower-credentials.json

# Verify it's ignored by git:
git status  # Should NOT show credentials.json
```

## Step 3: Verify Setup (2 minutes)

```bash
# Run the verification script:
npm run check-gcp-setup
```

**Expected output:**
```
✅ Environment Variables
✅ GCP Credentials
✅ Connection to Google Cloud
✅ Pub/Sub Topic
✅ Pub/Sub Subscription
✅ Topic Permissions (Shopify Publisher)

All checks passed! Your setup is ready.
```

If you see any ❌, follow the troubleshooting steps in the output.

## Step 4: Configure Shopify Webhook (2 minutes)

### 4.1 Get Your Pub/Sub URL

The verification script shows your webhook URL:
```
pubsub://YOUR_PROJECT_ID:shopify-webhooks
```

**Example:**
```
pubsub://shop-webhooks:shopify-webhooks
```

### 4.2 Configure in Shopify

**Via Shopify CLI:**
```bash
shopify webhook create \
  --topic orders/create \
  --address pubsub://YOUR_PROJECT_ID:shopify-webhooks \
  --api-version 2024-10
```

**Via Partners Dashboard:**
1. Go to your app in Partners dashboard
2. Configuration → Webhooks
3. Click "Add webhook"
4. Topic: `orders/create`
5. **Delivery method**: Google Pub/Sub
6. **Address**: `pubsub://YOUR_PROJECT_ID:shopify-webhooks`
7. API Version: 2024-10

## Step 5: Start the Consumer (1 minute)

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start GCP Pub/Sub consumer
npm run gcp-consumer
```

**Expected output:**
```
╔════════════════════════════════════════════════════════════╗
║     Google Cloud Pub/Sub Consumer for Shopify Webhooks    ║
╚════════════════════════════════════════════════════════════╝

✅ Successfully connected to Google Cloud Pub/Sub
🚀 Starting consumer...
💡 Consumer is running. Press Ctrl+C to stop.
```

## Step 6: Test It (2 minutes)

### 6.1 Trigger a Test Webhook

```bash
shopify webhook trigger --topic orders/create
```

### 6.2 Check the Consumer Logs

You should see in Terminal 2:
```
📥 Received message abc123...
📦 Processing webhook: orders/create for shop: your-shop.myshopify.com
💾 Saved order #1001
✅ Successfully processed message in 250ms
```

### 6.3 Verify in Dashboard

1. Open your app
2. Go to Analytics dashboard
3. You should see the test order

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Shopify App                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Shopify Store                                              │
│       │                                                     │
│       │ (webhook event)                                     │
│       ▼                                                     │
│  Google Cloud Pub/Sub                                       │
│       │                                                     │
│       │ (pull messages)                                     │
│       ▼                                                     │
│  GCP Consumer (npm run gcp-consumer)                        │
│       │                                                     │
│       │ (process webhook)                                   │
│       ▼                                                     │
│  Local Database (SQLite/PostgreSQL)                         │
│       │                                                     │
│       │ (optional: publish to internal Redis Pub/Sub)       │
│       ▼                                                     │
│  Redis Pub/Sub (for real-time dashboard updates)            │
│       │                                                     │
│       ▼                                                     │
│  Analytics Dashboard (instant updates)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Common Issues

### Issue: "Invalid address" in Shopify

**Problem:** Wrong webhook URL format

**Solution:** Use `pubsub://PROJECT_ID:TOPIC_ID` (not `{shop-webhooks}:{control-tower}`)

### Issue: "Permission denied" when creating topic

**Problem:** Your GCP account doesn't have required permissions

**Solution:**
```bash
# Grant yourself Owner role (if you're the project owner)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/owner"
```

### Issue: Consumer can't connect

**Problem:** Credentials not configured correctly

**Solution:**
1. Verify credentials file exists: `ls -la control-tower-credentials.json`
2. Verify .env has correct path: `cat .env | grep GOOGLE`
3. Test with verification script: `npm run check-gcp-setup`

### Issue: Messages not being received

**Problem:** Shopify service account not granted publisher access

**Solution:**
```bash
gcloud pubsub topics add-iam-policy-binding shopify-webhooks \
  --member='serviceAccount:shopify-eventbridge@shopify-prs.iam.gserviceaccount.com' \
  --role='roles/pubsub.publisher' \
  --project=YOUR_PROJECT_ID
```

## Production Deployment

### Environment Variables

Set these in your production environment:

```bash
GOOGLE_CLOUD_PROJECT_ID=your-production-project
GOOGLE_CLOUD_TOPIC_ID=shopify-webhooks
GOOGLE_CLOUD_SUBSCRIPTION_ID=shopify-webhooks-sub

# Use JSON credentials for production (not file path)
GOOGLE_CLOUD_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### Running the Consumer

**Option 1: Separate Process**
```bash
# Start app
npm start &

# Start consumer
npm run gcp-consumer
```

**Option 2: Process Manager (PM2)**
```bash
pm2 start npm --name "app" -- run start
pm2 start npm --name "gcp-consumer" -- run gcp-consumer
pm2 save
```

**Option 3: Docker**
```dockerfile
# Start both app and consumer
CMD ["sh", "-c", "npm start & npm run gcp-consumer"]
```

## Monitoring

### Google Cloud Console

View metrics at:
```
https://console.cloud.google.com/cloudpubsub/topic/detail/shopify-webhooks?project=YOUR_PROJECT_ID
```

Metrics available:
- Messages published (from Shopify)
- Messages pulled (by your consumer)
- Unacknowledged messages (backlog)
- Oldest unacknowledged message age

### Application Logs

Monitor consumer logs for:
- `📥 Received message` - Message received from GCP
- `✅ Successfully processed` - Message processed successfully
- `❌ Error processing` - Processing failed (will retry)

### API Endpoint

Check status programmatically:
```bash
curl http://localhost:3000/api/gcp-pubsub
```

## Cost Estimate

**Google Cloud Pub/Sub Pricing:**
- First 10 GB/month: **FREE**
- Additional data: $0.06 per GB

**Typical Shopify webhook volume:**
- Small store (< 100 orders/day): **FREE**
- Medium store (100-1000 orders/day): **$1-5/month**
- Large store (1000+ orders/day): **$5-20/month**

**Example calculation:**
- 500 orders/day
- Average webhook size: 5 KB
- Monthly data: 500 × 5 KB × 30 = 75 MB
- Cost: **FREE** (under 10 GB)

## Next Steps

1. ✅ Configure more webhook topics:
   - `products/create`
   - `products/update`
   - `inventory_levels/update`

2. ✅ Set up monitoring alerts in GCP Console

3. ✅ Deploy to production

4. ✅ Monitor performance and costs

## Getting Help

- **Full Documentation**: See [GOOGLE_PUBSUB_SETUP_GUIDE.md](GOOGLE_PUBSUB_SETUP_GUIDE.md)
- **Verify Setup**: `npm run check-gcp-setup`
- **View Status**: Open `/api/gcp-pubsub` in your browser
- **GCP Documentation**: https://cloud.google.com/pubsub/docs
- **Shopify Documentation**: https://shopify.dev/docs/apps/webhooks

---

**Congratulations!** You now have a production-ready webhook system powered by Google Cloud Pub/Sub.
