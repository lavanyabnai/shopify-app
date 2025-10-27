# Fix Google Cloud Pub/Sub Permissions

## Problem Identified

Your service account `shopify-webhook-consumer@shop-webhooks.iam.gserviceaccount.com` doesn't have the necessary permissions to access the Pub/Sub topic and subscription.

**Error:** `7 PERMISSION_DENIED: User not authorized to perform this action.`

## Solution: Grant Required Permissions

You need to grant your service account the following roles:

1. **Pub/Sub Viewer** - To list topics and subscriptions
2. **Pub/Sub Subscriber** - To receive messages from subscriptions
3. **Pub/Sub Publisher** - To publish test messages (optional, for testing)

---

## Option 1: Using Google Cloud Console (Easiest)

### Step 1: Go to IAM & Admin

1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **shop-webhooks**
3. Go to **IAM & Admin** → **IAM**
4. Click **"Grant Access"** or **"Add"**

### Step 2: Add Service Account Permissions

1. **Principal (Member):** `shopify-webhook-consumer@shop-webhooks.iam.gserviceaccount.com`
2. **Role:** Select these roles one by one:
   - `Pub/Sub Viewer`
   - `Pub/Sub Subscriber`
   - `Pub/Sub Publisher` (optional, for testing)
3. Click **"Save"**

### Step 3: Verify

Run the verification script again:
```bash
node check-gcp-pubsub-setup.js
```

---

## Option 2: Using gcloud CLI (Fastest)

If you have `gcloud` CLI installed and authenticated:

### Install gcloud CLI (if not installed)

**Linux/WSL:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

**macOS:**
```bash
brew install google-cloud-sdk
gcloud init
```

**Windows:**
Download from: https://cloud.google.com/sdk/docs/install

### Authenticate
```bash
gcloud auth login
gcloud config set project shop-webhooks
```

### Grant Permissions

Run these commands:

```bash
# Grant Pub/Sub Viewer role
gcloud projects add-iam-policy-binding shop-webhooks \
  --member="serviceAccount:shopify-webhook-consumer@shop-webhooks.iam.gserviceaccount.com" \
  --role="roles/pubsub.viewer"

# Grant Pub/Sub Subscriber role
gcloud projects add-iam-policy-binding shop-webhooks \
  --member="serviceAccount:shopify-webhook-consumer@shop-webhooks.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"

# Grant Pub/Sub Publisher role (optional, for testing)
gcloud projects add-iam-policy-binding shop-webhooks \
  --member="serviceAccount:shopify-webhook-consumer@shop-webhooks.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
```

### Grant Shopify Permission to Publish

Shopify needs permission to publish to your topic:

```bash
gcloud pubsub topics add-iam-policy-binding control-tower \
  --member='serviceAccount:shopify-eventbridge@shopify-prs.iam.gserviceaccount.com' \
  --role='roles/pubsub.publisher' \
  --project=shop-webhooks
```

### Verify

```bash
node check-gcp-pubsub-setup.js
```

---

## Option 3: Using Terraform (Infrastructure as Code)

If you want to manage this with Terraform, create a `gcp-permissions.tf` file:

```hcl
# Grant service account permissions
resource "google_project_iam_member" "pubsub_viewer" {
  project = "shop-webhooks"
  role    = "roles/pubsub.viewer"
  member  = "serviceAccount:shopify-webhook-consumer@shop-webhooks.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "pubsub_subscriber" {
  project = "shop-webhooks"
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:shopify-webhook-consumer@shop-webhooks.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "pubsub_publisher" {
  project = "shop-webhooks"
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:shopify-webhook-consumer@shop-webhooks.iam.gserviceaccount.com"
}

# Grant Shopify permission to publish to topic
resource "google_pubsub_topic_iam_member" "shopify_publisher" {
  project = "shop-webhooks"
  topic   = "control-tower"
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:shopify-eventbridge@shopify-prs.iam.gserviceaccount.com"
}
```

Then run:
```bash
terraform init
terraform apply
```

---

## What Each Role Does

| Role | Purpose | Required? |
|------|---------|-----------|
| **Pub/Sub Viewer** | View topics, subscriptions, and snapshots | ✅ Yes |
| **Pub/Sub Subscriber** | Pull messages from subscriptions | ✅ Yes |
| **Pub/Sub Publisher** | Publish messages to topics | ⚠️ Optional (for testing) |
| **Pub/Sub Admin** | Full access (create/delete topics) | ❌ Not needed |

---

## Troubleshooting

### Still getting permission errors?

1. **Wait 1-2 minutes** - IAM changes can take time to propagate
2. **Clear credentials cache:**
   ```bash
   rm -rf ~/.config/gcloud/
   gcloud auth login
   ```
3. **Verify service account:**
   ```bash
   gcloud iam service-accounts list --project=shop-webhooks
   ```
4. **Check current permissions:**
   ```bash
   gcloud projects get-iam-policy shop-webhooks \
     --flatten="bindings[].members" \
     --filter="bindings.members:shopify-webhook-consumer@shop-webhooks.iam.gserviceaccount.com"
   ```

### Wrong project selected?

Make sure you're in the correct project:
```bash
gcloud config get-value project
# Should output: shop-webhooks
```

Change project if needed:
```bash
gcloud config set project shop-webhooks
```

### Service account doesn't exist?

List all service accounts:
```bash
gcloud iam service-accounts list --project=shop-webhooks
```

If it doesn't exist, create it:
```bash
gcloud iam service-accounts create shopify-webhook-consumer \
  --display-name="Shopify Webhook Consumer" \
  --project=shop-webhooks
```

---

## Next Steps After Fixing

Once permissions are granted:

1. **Verify setup:**
   ```bash
   node check-gcp-pubsub-setup.js
   ```

2. **Start the consumer:**
   ```bash
   npm run gcp-consumer
   ```

3. **Test with Shopify webhook:**
   ```bash
   shopify webhook trigger --topic orders/create
   ```

4. **Monitor in Cloud Console:**
   - https://console.cloud.google.com/cloudpubsub/topic/detail/control-tower?project=shop-webhooks

---

## Security Best Practices

✅ **DO:**
- Use separate service accounts for different environments (dev/staging/prod)
- Grant minimum required permissions (principle of least privilege)
- Rotate service account keys regularly
- Use Workload Identity Federation instead of key files (for GKE/Cloud Run)

❌ **DON'T:**
- Grant `Pub/Sub Admin` unless you need to create/delete resources
- Commit service account keys to version control (already in .gitignore)
- Share service account keys via email/Slack
- Use the same service account for publisher and subscriber

---

## Need Help?

- [Pub/Sub IAM Roles](https://cloud.google.com/pubsub/docs/access-control)
- [Service Accounts Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [Troubleshooting Pub/Sub](https://cloud.google.com/pubsub/docs/troubleshooting)
