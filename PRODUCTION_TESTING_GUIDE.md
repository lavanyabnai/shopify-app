# Production Build Testing Guide

## The Problem

When running `npm run start` (production mode), you get this error:

```
Error: listen EADDRNOTAVAIL: address not available 23.227.38.74:3000
```

**Why this happens:**
- Your `.env` file has `HOST=control-tower-2.myshopify.com`
- When running `npm run start`, Node.js tries to bind to this hostname
- It resolves to an external IP (23.227.38.74) that doesn't exist on your local machine
- The `HOST` environment variable is meant for production deployments, not local testing

---

## ✅ Solution: Use the New Local Production Script

I've added a new script to your `package.json` that sets `HOST=localhost`:

```bash
npm run start:local
```

This is equivalent to:
```bash
HOST=localhost PORT=3000 npm run start
```

---

## 🚀 How to Test Production Build Locally

### Step 1: Build for Production

```bash
npm run build
```

**Expected output:**
```
vite v6.x building for production...
✓ 523 modules transformed.
✓ built in 15.23s
```

### Step 2: Start Production Server (Local)

```bash
npm run start:local
```

**Expected output:**
```
[shopify-api/INFO] version 11.14.1, environment Remix
Remix App Server started at http://localhost:3000 (http://127.0.0.1:3000)
```

### Step 3: Access Your App

**Option A: Via Shopify Tunnel (Recommended)**

You still need the Shopify tunnel for OAuth to work. In a separate terminal:

```bash
npm run dev
```

Then access via the Shopify Admin as normal.

**Option B: Direct Access (Limited)**

Open http://localhost:3000 in your browser.

**Note:** This won't work fully because:
- ❌ No OAuth (can't authenticate)
- ❌ No App Bridge (not embedded in Shopify)
- ✅ Can see static routes
- ✅ Can test API performance

---

## 📊 Production vs Development Performance Comparison

After building and running production, test your analytics performance:

### Development (`npm run dev`)

```bash
npm run dev
# Navigate to /app/analytics
# Check Network tab in DevTools
```

**Expected:**
- Initial app load: 5-8 seconds
- Analytics (cache hit): 100-200ms
- JavaScript bundle: ~2-3MB (unminified)

### Production (`npm run start:local`)

```bash
npm run build
npm run start:local
# In another terminal: npm run dev (for tunnel)
# Navigate to /app/analytics
# Check Network tab in DevTools
```

**Expected:**
- Initial app load: 1-3 seconds ✅ **60-70% faster**
- Analytics (cache hit): 50-100ms ✅ **50% faster**
- JavaScript bundle: ~500KB-1MB ✅ **70% smaller**

---

## 🔧 Alternative Solutions

If `npm run start:local` doesn't work, try these:

### Option 1: Unset HOST Before Running

```bash
unset HOST && npm run start
```

### Option 2: Override HOST Inline

```bash
HOST=localhost npm run start
```

### Option 3: Create .env.production.local

Create a separate environment file for local production testing:

```bash
# .env.production.local
SHOPIFY_API_KEY=a00d0fcb089f64c2b0d6a88e6eea5b90
SHOPIFY_API_SECRET=1793a69e4f5f769d5f5f73bca6af0911
SCOPES=write_products,read_products,read_orders,write_orders,read_customers,read_inventory,read_locations,read_analytics,read_reports,read_fulfillments,read_shipping,read_discounts,read_price_rules,read_marketing_events

# Don't set HOST for local testing
# HOST is only needed for deployed environments

SHOPIFY_APP_URL=https://your-tunnel-url.trycloudflare.com
DATABASE_URL=file:dev.sqlite

GOOGLE_CLOUD_PROJECT_ID=shop-webhooks
GOOGLE_CLOUD_TOPIC_ID=control-tower
GOOGLE_CLOUD_SUBSCRIPTION_ID=control-tower-sub-2
GOOGLE_APPLICATION_CREDENTIALS=./control-tower-credentials.json
```

Then use it:
```bash
cp .env.production.local .env
npm run start
```

---

## 🎯 When to Use Each Script

| Script | Use Case | Performance | OAuth Works? |
|--------|----------|-------------|--------------|
| `npm run dev` | Development | Slow | ✅ Yes |
| `npm run build` | Build production bundle | N/A | N/A |
| `npm run start:local` | Test production locally | Fast | ⚠️ Needs tunnel |
| `npm run start` | Production deployment | Fast | ✅ Yes |

---

## 🚀 Complete Testing Workflow

### For War Room Prerequisites Check:

```bash
# Step 1: Build production bundle
npm run build

# Step 2: Start production server (local)
npm run start:local

# Step 3: In another terminal, start dev server for tunnel
npm run dev

# Step 4: Access app via Shopify Admin
# Open Control Tower app in Shopify Admin

# Step 5: Test analytics performance
# F12 → Network tab → Navigate to Analytics
# Check: /app/analytics should load in <100ms (cache hit)
```

---

## 📋 What About Real Production Deployment?

When deploying to a real production environment (Heroku, Fly.io, Railway, etc.):

### ✅ DO set HOST for production:

**For Heroku/Fly.io/Railway:**
```bash
# In production .env or config vars:
HOST=0.0.0.0  # Binds to all interfaces
PORT=8080     # Or whatever your platform uses
```

**For specific domain:**
```bash
# If you have a custom domain:
HOST=control-tower.example.com
PORT=443
```

### ❌ DON'T set HOST for local testing:

```bash
# In local .env:
# HOST=control-tower-2.myshopify.com  # ❌ This causes the error

# Instead, omit HOST or use:
# HOST=localhost  # ✅ For local testing
```

---

## 🔍 Understanding the Error

### What the Error Means:

```
Error: listen EADDRNOTAVAIL: address not available 23.227.38.74:3000
```

**Breakdown:**
- `EADDRNOTAVAIL` = Address not available
- `23.227.38.74` = External IP that `control-tower-2.myshopify.com` resolves to
- `:3000` = Port your app is trying to bind to

**Why it fails:**
- Your local machine doesn't have the IP `23.227.38.74`
- You can't bind to an IP that doesn't exist on your network interfaces
- This IP belongs to Shopify's infrastructure, not your machine

### What HOST Should Be:

| Environment | HOST Value | Why |
|-------------|-----------|-----|
| **Local Development** | `localhost` or omit | Binds to 127.0.0.1 (your machine) |
| **Local Production Test** | `localhost` | Binds to 127.0.0.1 (your machine) |
| **Docker** | `0.0.0.0` | Binds to all interfaces inside container |
| **Heroku/Fly.io/Railway** | `0.0.0.0` | Binds to all interfaces on platform |
| **Custom Domain** | Your domain | Only if platform requires it |

---

## 🛠️ Troubleshooting

### Issue: "Cannot GET /" when accessing localhost:3000

**Problem:** You're accessing the production server directly without OAuth.

**Solution:** Access via Shopify Admin (with tunnel running):
1. Terminal 1: `npm run start:local`
2. Terminal 2: `npm run dev` (for tunnel)
3. Open app in Shopify Admin

### Issue: "Session not found" in production mode

**Problem:** Session storage pointing to wrong database.

**Solution:** Make sure `DATABASE_URL` in `.env` is correct:
```bash
DATABASE_URL=file:dev.sqlite
```

### Issue: Analytics route is still slow in production

**Problem:**
- Redis not running
- Cache not configured
- Database queries slow

**Solution:**
1. Start Redis: `redis-cli ping` (should return PONG)
2. Check cache headers: Look for `X-Cache: HIT`
3. Verify analytics snapshots exist: `npx prisma studio`

### Issue: "Module not found" errors

**Problem:** Production build didn't complete successfully.

**Solution:**
```bash
# Clean build
rm -rf build/

# Rebuild
npm run build

# Check build output
ls -la build/
```

---

## 📊 Performance Checklist

After running production build locally, validate these metrics:

### ✅ Initial App Load
- [ ] Development: 5-8 seconds
- [ ] Production: 1-3 seconds
- [ ] **Improvement: 60-70% faster** ✅

### ✅ Analytics Dashboard
- [ ] Cache hit: <100ms
- [ ] Cache miss: <2 seconds
- [ ] Check `X-Cache: HIT` header

### ✅ JavaScript Bundle
- [ ] Development: ~2-3MB
- [ ] Production: ~500KB-1MB
- [ ] **Reduction: 70% smaller** ✅

### ✅ Page Navigation
- [ ] Client-side routing: <100ms
- [ ] Data fetching routes: <500ms

---

## 🎉 Summary

**Problem:** `npm run start` tried to bind to external IP (23.227.38.74)

**Solution:** Use the new script:
```bash
npm run start:local
```

**Complete workflow:**
```bash
# 1. Build production
npm run build

# 2. Start production server (local)
npm run start:local

# 3. In another terminal, start tunnel
npm run dev

# 4. Test in Shopify Admin
# Check Network tab → Analytics should load in <100ms
```

**Result:** Test production performance locally without the `EADDRNOTAVAIL` error! 🚀

---

## 📚 Related Documentation

- [PERFORMANCE_VALIDATION_GUIDE.md](PERFORMANCE_VALIDATION_GUIDE.md) - How to measure performance
- [check-performance.sh](check-performance.sh) - Automated performance checks
- [WAR_ROOM_QUICK_START.md](WAR_ROOM_QUICK_START.md) - Prerequisites check
