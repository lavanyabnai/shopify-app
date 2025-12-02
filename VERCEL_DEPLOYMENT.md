# Vercel Deployment Guide for Control Tower

This guide explains how to deploy the Control Tower Shopify app to Vercel and distribute it to multiple stores without the App Store.

## Prerequisites

- GitHub account with your code pushed
- Vercel account (free tier works)
- Shopify Partners account
- Neon database (already configured)

## Part 1: Deploy Remix App to Vercel

### Step 1: Prepare Your Code

The following has already been configured:
- `@vercel/remix` package installed
- `vite.config.ts` updated with `vercelPreset()`
- `vercel.json` created with proper headers for Shopify iframe

### Step 2: Push to GitHub

```bash
git add -A
git commit -m "Configure for Vercel deployment"
git push origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Select your `shopify-app-template-remix` repository
4. Vercel will auto-detect it as a Remix project

### Step 4: Configure Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `SHOPIFY_API_KEY` | `a00d0fcb089f64c2b0d6a88e6eea5b90` |
| `SHOPIFY_API_SECRET` | `1793a69e4f5f769d5f5f73bca6af0911` |
| `SCOPES` | `write_products,read_products,read_orders,write_orders,read_customers,read_inventory,read_locations,read_analytics,read_reports,read_fulfillments,read_shipping,read_discounts,read_price_rules,read_marketing_events` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_nwt5u3EokpIc@ep-dark-meadow-a68wijmr-pooler.us-west-2.aws.neon.tech/shopify_replica_db?sslmode=require&pgbouncer=true` |

**Optional:**
| Variable | Value |
|----------|-------|
| `REDIS_URL` | Your Redis URL (e.g., from Upstash) |
| `ANALYTICS_API_URL` | Your Python backend URL |

### Step 5: Deploy

Click **"Deploy"** - Vercel will build and deploy your app.

After deployment, you'll get a URL like:
```
https://your-project-name.vercel.app
```

### Step 6: Update Shopify App Configuration

Update `shopify.app.toml` with your Vercel URL:

```toml
name = "control-tower"
client_id = "4a14d7f9a2aa6a560d71afeb29f4cbb6"
application_url = "https://your-project-name.vercel.app"
embedded = true

[auth]
redirect_urls = [
  "https://your-project-name.vercel.app/auth/callback",
  "https://your-project-name.vercel.app/auth/shopify/callback",
  "https://your-project-name.vercel.app/api/auth/callback"
]

[webhooks]
api_version = "2024-10"

[[webhooks.subscriptions]]
topics = ["orders/create", "orders/updated", "orders/cancelled"]
uri = "/webhooks/orders"

[[webhooks.subscriptions]]
topics = ["products/create", "products/update"]
uri = "/webhooks/products"
```

Then sync with Shopify:
```bash
npm run deploy
```

---

## Part 2: Deploy Python Backend

Vercel supports Python, but for FastAPI you need a serverless function approach. **Recommended: Use Railway or Render for the Python backend.**

### Option A: Deploy Python to Railway (Recommended)

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your repo and set root directory to `analytics_service`
4. Railway will auto-detect the Dockerfile
5. Get your URL: `https://analytics-xxx.up.railway.app`
6. Add `ANALYTICS_API_URL` to your Vercel environment variables

### Option B: Deploy Python to Vercel (Serverless)

Create `api/analytics.py` in your project root:

```python
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "healthy"}).encode())
        return
```

**Note:** This approach has limitations for complex FastAPI apps. Railway is recommended.

### Option C: Skip Python Backend

The Control Tower app works without the Python backend - you just won't have ML forecasting features. The core inventory management, War Room, and analytics from your database will still work.

---

## Part 3: Install on Other Stores (Without App Store)

### Method 1: Custom Distribution (Recommended)

This allows installation on any Shopify store without App Store approval.

#### Step 1: Enable Custom Distribution

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com)
2. Click **Apps** → Select **control-tower**
3. Go to **Distribution** tab
4. Select **"Custom distribution"**
5. Click **"Generate link"**

#### Step 2: Share Installation Link

You'll get a link like:
```
https://admin.shopify.com/oauth/install_custom_app?client_id=4a14d7f9a2aa6a560d71afeb29f4cbb6
```

Send this to any merchant. When they click it:
1. They log into their Shopify admin
2. They see the permissions your app requests
3. They click **Install**
4. Done! The app is installed on their store

### Method 2: Direct Installation URL

Construct the OAuth URL manually:

```
https://{store-name}.myshopify.com/admin/oauth/authorize?client_id=4a14d7f9a2aa6a560d71afeb29f4cbb6&scope=write_products,read_products,read_orders,write_orders,read_customers,read_inventory,read_locations,read_analytics,read_reports,read_fulfillments,read_shipping,read_discounts,read_price_rules,read_marketing_events&redirect_uri=https://your-project-name.vercel.app/auth/callback
```

Replace:
- `{store-name}` with the store's myshopify subdomain
- `your-project-name.vercel.app` with your actual Vercel URL

### Method 3: Development Stores

For your own development stores:
1. Go to Partners Dashboard → Stores
2. Select a development store
3. Go to Apps → Install app → Select control-tower

---

## Part 4: Configure GDPR Webhooks

After deployment, configure GDPR webhooks in Partners Dashboard:

1. Go to **Partners Dashboard** → **Apps** → **control-tower** → **Configuration**
2. Under **"GDPR mandatory webhooks"**, enter:

| Webhook | URL |
|---------|-----|
| Customer data request | `https://your-project-name.vercel.app/webhooks/gdpr/customers_data_request` |
| Customer data erasure | `https://your-project-name.vercel.app/webhooks/gdpr/customers_redact` |
| Shop data erasure | `https://your-project-name.vercel.app/webhooks/gdpr/shop_redact` |

---

## Part 5: Verify Deployment

### Test the App

1. Open your Vercel URL in a browser
2. You should see a landing page or redirect to Shopify OAuth

### Test Installation

1. Use your custom distribution link
2. Install on a development store
3. Verify:
   - App loads in Shopify Admin
   - Navigation works
   - Data displays correctly

### Check Webhooks

In your Vercel dashboard, go to **Logs** to see incoming webhook requests.

---

## Quick Reference

### Vercel Environment Variables

```bash
NODE_ENV=production
SHOPIFY_API_KEY=a00d0fcb089f64c2b0d6a88e6eea5b90
SHOPIFY_API_SECRET=1793a69e4f5f769d5f5f73bca6af0911
SCOPES=write_products,read_products,read_orders,...
DATABASE_URL=postgresql://...neon.tech/...
ANALYTICS_API_URL=https://your-python-backend.railway.app  # Optional
REDIS_URL=redis://...  # Optional
```

### Update Shopify Config

```bash
# After changing shopify.app.toml
npm run deploy
```

### Installation Link Format

```
https://admin.shopify.com/oauth/install_custom_app?client_id=YOUR_CLIENT_ID
```

---

## Troubleshooting

### "Invalid redirect_uri" error
- Ensure redirect URLs in `shopify.app.toml` match exactly with Vercel URL
- Run `npm run deploy` after any changes

### App doesn't load in iframe
- Check `vercel.json` has correct headers (X-Frame-Options, CSP)
- Verify the app is set to `embedded = true`

### Database connection errors
- Verify `DATABASE_URL` is set in Vercel environment variables
- Use the pooled connection string for Neon

### Webhooks not received
- Check Vercel function logs
- Verify webhook URLs in `shopify.app.toml`
- Ensure app is installed (not just authorized)

### OAuth loops
- Run `npm run deploy` to sync config
- Clear browser cookies
- Check SHOPIFY_API_KEY matches client_id

---

## Cost Summary

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Vercel | 100GB bandwidth/month | Sufficient for most apps |
| Neon | 0.5GB storage | Already configured |
| Railway (Python) | 500 hours/month | ~$5/month if exceeded |
| Upstash Redis | 10K commands/day | Optional |

**Estimated monthly cost:** $0-10 depending on traffic
