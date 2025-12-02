# Private App Deployment Guide (Without App Store)

This guide explains how to deploy your Control Tower app and install it on multiple stores **without publishing to the Shopify App Store**.

## Overview

Shopify supports two distribution methods for unpublished apps:
1. **Development stores** - Unlimited installs on dev stores you own
2. **Custom app distribution** - Install on specific production stores via direct link

## Architecture Summary

Your app has 3 components to deploy:

| Component | Technology | Deploy To |
|-----------|------------|-----------|
| Remix App (UI) | Node.js/Remix | Railway, Render, Fly.io, or Heroku |
| Python Backend | FastAPI | Railway, Render, or Fly.io |
| Database | PostgreSQL | Neon (already configured) |

---

## Part 1: Deploy the Remix App

### Option A: Deploy to Railway (Recommended)

Railway provides easy deployment with automatic SSL and environment management.

#### Step 1: Push to GitHub
```bash
# Make sure your code is in GitHub
git add -A
git commit -m "Prepare for deployment"
git push origin main
```

#### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `shopify-app-template-remix` repository
4. Railway will auto-detect the Dockerfile

#### Step 3: Configure Environment Variables
In Railway dashboard, add these environment variables:

```
NODE_ENV=production
SHOPIFY_API_KEY=a00d0fcb089f64c2b0d6a88e6eea5b90
SHOPIFY_API_SECRET=1793a69e4f5f769d5f5f73bca6af0911
SCOPES=write_products,read_products,read_orders,write_orders,read_customers,read_inventory,read_locations,read_analytics,read_reports,read_fulfillments,read_shipping,read_discounts,read_price_rules,read_marketing_events
DATABASE_URL=postgresql://neondb_owner:npg_nwt5u3EokpIc@ep-dark-meadow-a68wijmr-pooler.us-west-2.aws.neon.tech/shopify_replica_db?sslmode=require&pgbouncer=true
```

#### Step 4: Get Your App URL
After deployment, Railway provides a URL like:
```
https://your-app-name.up.railway.app
```

#### Step 5: Update Shopify App Configuration
```bash
# Update shopify.app.toml with your production URL
```

Edit `shopify.app.toml`:
```toml
name = "control-tower"
client_id = "4a14d7f9a2aa6a560d71afeb29f4cbb6"
application_url = "https://your-app-name.up.railway.app"
embedded = true

[auth]
redirect_urls = [
  "https://your-app-name.up.railway.app/auth/callback",
  "https://your-app-name.up.railway.app/auth/shopify/callback",
  "https://your-app-name.up.railway.app/api/auth/callback"
]
```

Then deploy the config:
```bash
npm run deploy
```

### Option B: Deploy to Render

#### Step 1: Create render.yaml
Create `render.yaml` in your project root:

```yaml
services:
  - type: web
    name: control-tower
    env: docker
    plan: starter
    healthCheckPath: /app/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: SHOPIFY_API_KEY
        sync: false
      - key: SHOPIFY_API_SECRET
        sync: false
      - key: DATABASE_URL
        sync: false
```

#### Step 2: Deploy
1. Go to [render.com](https://render.com)
2. Connect your GitHub repo
3. Select "New Web Service"
4. Choose Docker environment
5. Add environment variables
6. Deploy

### Option C: Deploy to Fly.io

#### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

#### Step 2: Create fly.toml
```toml
app = "control-tower-shopify"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true

[env]
  NODE_ENV = "production"
```

#### Step 3: Deploy
```bash
fly launch
fly secrets set SHOPIFY_API_KEY=a00d0fcb089f64c2b0d6a88e6eea5b90
fly secrets set SHOPIFY_API_SECRET=1793a69e4f5f769d5f5f73bca6af0911
fly secrets set DATABASE_URL="postgresql://..."
fly deploy
```

---

## Part 2: Deploy the Python Backend

### Create Dockerfile for Python Backend

Create `analytics_service/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Simplified requirements.txt for deployment

Create `analytics_service/requirements-prod.txt`:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
```

### Deploy to Railway (Same Project)

1. In your Railway project, click "New Service"
2. Select "Deploy from GitHub repo"
3. Set the root directory to `analytics_service`
4. Railway will detect the Dockerfile
5. Set port to 8000

After deployment, you'll get a URL like:
```
https://analytics-service-xxx.up.railway.app
```

### Update Remix App to Connect to Python Backend

Add to Railway environment variables:
```
ANALYTICS_API_URL=https://analytics-service-xxx.up.railway.app
```

---

## Part 3: Transfer App to Other Stores

### Method 1: Custom Distribution Link (Recommended)

This allows you to install on any store without App Store review.

#### Step 1: Enable Custom Distribution
1. Go to [Shopify Partners Dashboard](https://partners.shopify.com)
2. Select your app "control-tower"
3. Go to **Distribution** tab
4. Select **Custom distribution**
5. Click "Create link"

#### Step 2: Generate Installation Link
You'll get a URL like:
```
https://admin.shopify.com/oauth/install_custom_app?client_id=4a14d7f9a2aa6a560d71afeb29f4cbb6
```

#### Step 3: Share with Store Owners
Send this link to any merchant. When they click it:
1. They'll be prompted to log into their Shopify store
2. They'll see the permissions your app requests
3. They click "Install" and the app is installed

### Method 2: Development Store Installation

For testing on development stores you own:

1. Go to Partners Dashboard → Stores
2. Create or select a development store
3. Go to Apps → Install app
4. Select your "control-tower" app
5. Click Install

### Method 3: Direct OAuth URL

Construct the OAuth URL manually:

```
https://{shop}.myshopify.com/admin/oauth/authorize?client_id=4a14d7f9a2aa6a560d71afeb29f4cbb6&scope=write_products,read_products,read_orders,write_orders,read_customers,read_inventory,read_locations,read_analytics,read_reports,read_fulfillments,read_shipping,read_discounts,read_price_rules,read_marketing_events&redirect_uri=https://your-app-url.up.railway.app/auth/callback
```

Replace:
- `{shop}` with the store's myshopify domain (e.g., `my-store`)
- `your-app-url.up.railway.app` with your deployed app URL

---

## Part 4: Complete Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] All sensitive data in environment variables (not committed)
- [ ] Neon database accessible (already configured)

### Remix App Deployment
- [ ] Deploy to Railway/Render/Fly.io
- [ ] Set all environment variables
- [ ] Verify app URL is accessible
- [ ] Run database migrations: `npm run setup`

### Python Backend Deployment
- [ ] Create Dockerfile for analytics_service
- [ ] Deploy to same platform
- [ ] Set ANALYTICS_API_URL in Remix app

### Shopify Configuration
- [ ] Update `shopify.app.toml` with production URL
- [ ] Run `npm run deploy` to sync config
- [ ] Update redirect URLs in Partners Dashboard
- [ ] Configure GDPR webhook URLs in Partners Dashboard

### Distribution Setup
- [ ] Enable Custom Distribution in Partners Dashboard
- [ ] Generate installation link
- [ ] Test installation on a development store

### Post-Deployment Verification
- [ ] App installs successfully
- [ ] OAuth flow completes
- [ ] Dashboard loads with data
- [ ] Webhooks are received (check logs)

---

## Part 5: Environment Variables Reference

### Remix App (Required)
```bash
NODE_ENV=production
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_products,read_products,read_orders,...
DATABASE_URL=postgresql://...neon.tech/...
SHOPIFY_APP_URL=https://your-deployed-url.com
```

### Remix App (Optional)
```bash
REDIS_URL=redis://...  # For caching (optional)
ANALYTICS_API_URL=https://your-python-backend.com
```

### Python Backend
```bash
# No required env vars for basic deployment
# Add these if needed:
DATABASE_URL=postgresql://...  # If analytics needs DB access
REDIS_URL=redis://...          # If using Redis
```

---

## Part 6: GDPR Webhook Configuration

After deployment, configure GDPR webhooks in Partners Dashboard:

1. Go to Partners Dashboard → Apps → control-tower → Configuration
2. Under "GDPR mandatory webhooks", enter:

| Webhook | URL |
|---------|-----|
| Customer data request | `https://your-app.com/webhooks/gdpr/customers_data_request` |
| Customer data erasure | `https://your-app.com/webhooks/gdpr/customers_redact` |
| Shop data erasure | `https://your-app.com/webhooks/gdpr/shop_redact` |

---

## Part 7: Troubleshooting

### App won't install
- Verify redirect URLs match exactly in both `shopify.app.toml` and Partners Dashboard
- Check that SHOPIFY_API_KEY matches the client_id in Partners Dashboard

### OAuth loops
- Run `npm run deploy` to sync configuration
- Clear browser cookies and try again

### Webhooks not received
- Check app logs for incoming requests
- Verify webhook URLs are HTTPS
- Ensure app is properly installed (not just authorized)

### Database errors
- Run `npm run setup` after deployment
- Verify DATABASE_URL is correct and accessible

### Python backend not responding
- Check if port 8000 is exposed
- Verify ANALYTICS_API_URL is set correctly in Remix app
- Check backend logs for errors

---

## Quick Start Commands

```bash
# 1. Build and test locally
npm run build
npm run start

# 2. Deploy to Railway
# (Connect GitHub repo in Railway dashboard)

# 3. After deployment, sync Shopify config
npm run deploy

# 4. Generate installation link
# Go to Partners Dashboard → Distribution → Custom distribution

# 5. Share link with merchants
# https://admin.shopify.com/oauth/install_custom_app?client_id=YOUR_CLIENT_ID
```

---

## Cost Estimates

| Service | Free Tier | Paid |
|---------|-----------|------|
| Railway | 500 hours/month | $5-20/month |
| Render | 750 hours/month | $7/month |
| Fly.io | 3 shared VMs | $5/month |
| Neon | 0.5GB storage | Already configured |

**Recommended:** Railway Starter plan (~$5-10/month total)
