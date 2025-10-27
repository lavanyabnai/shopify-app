# Google Cloud Pub/Sub Setup Guide for Shopify Webhooks

## What is Google Cloud Pub/Sub?

Google Cloud Pub/Sub is a messaging service that Shopify can use to deliver webhook events. This is **different** from your internal Redis Pub/Sub system.

**Key Differences:**
- **Google Cloud Pub/Sub**: External service where Shopify sends webhooks
- **Redis Pub/Sub** (already implemented): Internal messaging within your app

## Architecture Overview

```
Shopify → Google Cloud Pub/Sub → Your App
         (pubsub://project:topic)    (pulls messages)
```

**Flow:**
1. Shopify sends webhook events to GCP Pub/Sub topic
2. Your app pulls messages from GCP Pub/Sub subscription
3. Your app processes the webhook and stores in database
4. (Optional) Your app publishes to Redis Pub/Sub for internal messaging

## Step-by-Step Setup

### Step 1: Set Up Google Cloud Project

1. **Create/Select a GCP Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Note your **Project ID** (e.g., `control-tower-prod`)

2. **Enable Pub/Sub API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Cloud Pub/Sub API"
   - Click "Enable"

3. **Create a Pub/Sub Topic**
   - Go to "Pub/Sub" → "Topics"
   - Click "Create Topic"
   - **Topic ID**: `shopify-webhooks` (or your choice)
   - Leave other settings as default
   - Click "Create"
   - **Full topic name**: `projects/{YOUR_PROJECT_ID}/topics/shopify-webhooks`

4. **Create a Subscription**
   - In the topic details, click "Create Subscription"
   - **Subscription ID**: `shopify-webhooks-sub`
   - **Delivery Type**: Pull
   - **Acknowledgment Deadline**: 60 seconds
   - Click "Create"

5. **Create Service Account**
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - **Name**: `shopify-webhook-consumer`
   - **Role**: "Pub/Sub Subscriber"
   - Click "Done"
   - Click on the service account → "Keys" → "Add Key" → "Create New Key"
   - Choose **JSON** format
   - Download the key file (e.g., `control-tower-credentials.json`)
   - **Keep this file secure!**

6. **Grant Shopify Publisher Access**
   - In your topic, click "Permissions"
   - Click "Add Principal"
   - **Principal**: `shopify-eventbridge@shopify-prs.iam.gserviceaccount.com`
   - **Role**: "Pub/Sub Publisher"
   - Click "Save"

### Step 2: Configure Shopify Webhook

When setting up the webhook in Shopify CLI or Admin:

**Format:**
```
pubsub://{PROJECT_ID}:{TOPIC_ID}
```

**Example:**
```
pubsub://control-tower-prod:shopify-webhooks
```

**NOT:**
- ❌ `pubsub://{shop-webhooks}:{control-tower}` (This is your Redis pattern)
- ❌ `https://control-tower-2.myshopify.com/` (This is HTTP webhook)

**Correct Example:**
If your GCP Project ID is `control-tower-prod` and topic is `shopify-webhooks`:
```
pubsub://control-tower-prod:shopify-webhooks
```

### Step 3: Install Dependencies

```bash
npm install @google-cloud/pubsub
```

### Step 4: Configure Environment Variables

Add to your `.env` file:

```bash
# Google Cloud Pub/Sub Configuration
GOOGLE_CLOUD_PROJECT_ID=control-tower-prod
GOOGLE_CLOUD_TOPIC_ID=shopify-webhooks
GOOGLE_CLOUD_SUBSCRIPTION_ID=shopify-webhooks-sub

# Path to service account key (DO NOT commit this file!)
GOOGLE_APPLICATION_CREDENTIALS=./control-tower-credentials.json

# Alternative: Use the key content as environment variable
# GOOGLE_CLOUD_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### Step 5: Add Service Account Key

**Option A: File-based (Development)**
1. Place `control-tower-credentials.json` in your project root
2. Add to `.gitignore`:
   ```
   control-tower-credentials.json
   *-credentials.json
   ```

**Option B: Environment Variable (Production)**
1. Copy the entire JSON content
2. Set as environment variable:
   ```bash
   export GOOGLE_CLOUD_CREDENTIALS_JSON='{"type":"service_account","project_id":"..."}'
   ```

## Implementation Files

The following files will be created:

1. **GCP Pub/Sub Service** - `app/services/gcp-pubsub.server.ts`
2. **Consumer Route** - `app/routes/webhooks.gcp-consumer.tsx`
3. **Background Worker** - Script to continuously pull messages
4. **Setup Verification** - `check-gcp-pubsub-setup.js`

## Testing the Setup

### 1. Test GCP Pub/Sub Connection

```bash
node check-gcp-pubsub-setup.js
```

### 2. Manually Publish a Test Message

```bash
# Using gcloud CLI
gcloud pubsub topics publish shopify-webhooks \
  --message '{"test":"message"}' \
  --project control-tower-prod
```

### 3. Trigger a Shopify Webhook

```bash
shopify webhook trigger --topic orders/create
```

## Monitoring

### Google Cloud Console
- Go to Pub/Sub → Topics → `shopify-webhooks`
- View metrics: message count, publish rate, etc.
- Check subscriptions for unacknowledged messages

### Application Logs
Monitor your app logs for:
- `📥 Received GCP Pub/Sub message`
- `✅ Successfully processed webhook`
- `❌ Error processing webhook`

## Cost Considerations

**Google Cloud Pub/Sub Pricing (as of 2024):**
- First 10 GB/month: Free
- Additional data: $0.06 per GB
- Message storage: $0.27 per GB-month

**Typical Shopify webhook volume:**
- Small store: < 1 GB/month (Free)
- Medium store: 1-10 GB/month (~$1-5/month)
- Large store: 10-100 GB/month (~$5-50/month)

## Security Best Practices

1. **Never commit credentials**
   - Add `*-credentials.json` to `.gitignore`
   - Use environment variables in production

2. **Rotate service account keys** regularly

3. **Use least privilege**
   - Service account only needs "Pub/Sub Subscriber" role
   - Shopify service account only needs "Pub/Sub Publisher" role

4. **Monitor unauthorized access**
   - Set up GCP alerts for unusual activity

## Troubleshooting

### Error: "Invalid address" in Shopify
**Problem**: Wrong format for webhook address

**Solution**: Use `pubsub://PROJECT_ID:TOPIC_ID` format
```bash
# Correct
pubsub://control-tower-prod:shopify-webhooks

# Wrong
pubsub://{shop-webhooks}:{control-tower}
```

### Error: "Permission denied"
**Problem**: Shopify service account not granted publisher access

**Solution**:
1. Go to topic permissions
2. Add principal: `shopify-eventbridge@shopify-prs.iam.gserviceaccount.com`
3. Grant role: "Pub/Sub Publisher"

### Error: "Application Default Credentials not found"
**Problem**: Service account key not configured

**Solution**: Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### Messages not being consumed
**Problem**: No active subscriber pulling messages

**Solution**: Ensure consumer is running:
```bash
npm run gcp-consumer
```

## Production Deployment

### Environment Variables
Set in your hosting platform (Heroku, Fly.io, etc.):

```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_TOPIC_ID=shopify-webhooks
GOOGLE_CLOUD_SUBSCRIPTION_ID=shopify-webhooks-sub
GOOGLE_CLOUD_CREDENTIALS_JSON='{"type":"service_account",...}'
```

### Running the Consumer

**Option 1: Background Process**
```bash
npm run gcp-consumer
```

**Option 2: Process Manager (PM2)**
```bash
pm2 start npm --name gcp-consumer -- run gcp-consumer
```

**Option 3: Docker Container**
```dockerfile
CMD ["npm", "run", "start-all"]  # Starts both app and consumer
```

## Integration with Existing Redis Pub/Sub

Your app will now have **two pub/sub systems**:

1. **Google Cloud Pub/Sub** (External)
   - Receives webhooks from Shopify
   - Purpose: Reliable webhook delivery
   - Cost: Pay-per-use

2. **Redis Pub/Sub** (Internal)
   - Internal app messaging
   - Purpose: Real-time notifications within your app
   - Cost: Part of Redis hosting

**Flow:**
```
Shopify
  → GCP Pub/Sub (external)
    → Your consumer pulls message
      → Process webhook
        → Save to database
          → Publish to Redis Pub/Sub (internal)
            → Dashboard updates in real-time
```

## Next Steps

After completing this guide:

1. ✅ Set up GCP project and topic
2. ✅ Configure Shopify webhook with `pubsub://PROJECT_ID:TOPIC_ID`
3. ✅ Install dependencies and create service files
4. ✅ Test the setup
5. ✅ Deploy to production

---

**Need Help?**
- [Google Cloud Pub/Sub Documentation](https://cloud.google.com/pubsub/docs)
- [Shopify Webhook Documentation](https://shopify.dev/docs/apps/webhooks)
- Check `/pubsub-dashboard` for Redis Pub/Sub (internal system)
