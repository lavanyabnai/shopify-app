# Data Sync Guide - Populate Neon Database

## Problem: Tables Created but No Data

Your Neon database has all the tables but they're empty. Here's how to populate them with your Shopify data.

---

## Solution: 2 Easy Ways to Sync Data

### Method 1: Using the App UI (Easiest) ⭐

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Visit the sync page:**
   ```
   https://[your-tunnel-url]/app/sync-data
   ```

3. **Click "Sync All Data"**
   - This will fetch all orders and products from Shopify
   - Store them in your Neon database
   - Takes 2-5 minutes depending on data volume

4. **Done!** Your database is now populated

### Method 2: Using Shopify Admin Sync

If you've already been using the app with SQLite, your local database has data. The existing sync service can populate Neon:

1. **Check your sync route:**
   ```bash
   npm run dev
   ```

2. **Visit:**
   ```
   https://[your-tunnel-url]/app/sync
   ```

3. **Click sync buttons** for orders and products

---

## How Data Stays Synced

### Automatic Webhook Sync

Once you have initial data, **webhooks keep everything in sync automatically**:

**Order Changes:**
- Customer places order → Webhook → Saved to Neon
- Order updated → Webhook → Updated in Neon
- Order fulfilled → Webhook → Status updated in Neon

**Product Changes:**
- Product created → Webhook → Added to Neon
- Inventory updated → Webhook → Updated in Neon
- Product deleted → Webhook → Marked in Neon

**Your webhooks are already configured:**
- `/webhooks/orders` - Handles all order events
- `/webhooks/products` - Handles all product events

---

## Verifying Data

### Check if Data is Syncing

```bash
# Option 1: Use Prisma Studio (Visual)
npx prisma studio

# Opens in browser - you can see all your data
# Navigate to: http://localhost:5555
```

```bash
# Option 2: Quick query
npx tsx -e "
import db from './app/db.server.js';
const orders = await db.order.count();
const products = await db.product.count();
console.log('Orders:', orders);
console.log('Products:', products);
await db.\$disconnect();
"
```

### Expected Results

After syncing, you should see:
- **Orders:** Your actual order count from Shopify
- **Products:** Your actual product count from Shopify
- **OrderLineItems:** Line items from all orders
- **SyncStatus:** Last sync timestamps

---

## Troubleshooting

### Issue: "No data showing up"

**Check 1: Did you run the sync?**
```
Visit: /app/sync-data
Click: "Sync All Data"
```

**Check 2: Are webhooks registered?**
```bash
# Check in Shopify Admin:
# Settings > Notifications > Webhooks
# You should see:
# - orders/create
# - orders/updated
# - products/create
# - products/update
```

**Check 3: Check sync status**
```bash
npx tsx -e "
import db from './app/db.server.js';
const status = await db.syncStatus.findFirst();
console.log(status);
await db.\$disconnect();
"
```

### Issue: "Sync is slow"

**This is normal!**
- 1,000 orders = ~2 minutes
- 1,000 products = ~1 minute
- Rate limiting: 500ms between requests (Shopify requirement)

**Progress indicators:**
- Check console logs during sync
- Look for "Fetching page X/Y" messages

### Issue: "Sync failed with error"

**Common errors:**

**"GraphQL Error: throttled"**
- Shopify rate limit hit
- Wait 30 seconds and try again
- Reduce batch size in sync service

**"Connection pool timeout"**
- Too many processes running
- Kill all: `pkill -9 node && pkill -9 tsx`
- Restart: `npm run dev`

**"Permission denied"**
- Check your OAuth scopes include:
  - `read_orders`
  - `read_products`
  - `read_inventory`

---

## Data Flow Diagram

```
Initial Sync:
┌─────────────────┐
│ Shopify Store   │
│ (All Orders &   │
│  Products)      │
└────────┬────────┘
         │
         │ Manual Sync
         │ (/app/sync-data)
         ↓
┌─────────────────┐
│ Neon PostgreSQL │
│ (Empty Tables)  │
└─────────────────┘

Ongoing Sync:
┌─────────────────┐
│ Shopify Event   │
│ (New Order)     │
└────────┬────────┘
         │
         │ Webhook
         ↓
┌─────────────────┐
│ Your App        │
│ (Webhook Handler)│
└────────┬────────┘
         │
         │ Save Data
         ↓
┌─────────────────┐
│ Neon PostgreSQL │
│ (Updated)       │
└─────────────────┘
```

---

## Quick Start Checklist

Follow these steps in order:

- [ ] **Step 1:** Start app - `npm run dev`
- [ ] **Step 2:** Visit `/app/sync-data`
- [ ] **Step 3:** Click "Sync All Data"
- [ ] **Step 4:** Wait 2-5 minutes
- [ ] **Step 5:** Verify data - `npx prisma studio`
- [ ] **Step 6:** Check dashboard - `/app/analytics`
- [ ] **Step 7:** Done! Webhooks keep it synced

---

## Advanced: Populate War Room Data

After syncing Shopify data, populate War Room metrics:

```bash
npx tsx populate-war-room-data.ts
```

This creates:
- DEFCON status
- Inventory snapshots
- Revenue risk calculations
- Alert logs
- Test scenarios

---

## Monitoring Sync Health

### View Sync Status
```
Visit: /app/sync
```

Shows:
- Last order sync time
- Last product sync time
- Total orders in database
- Total products in database
- Any sync errors

### Check Webhook Health

```bash
# View recent webhook logs
# (In your app console during npm run dev)

# Look for:
✅ Successfully processed orders/create webhook
✅ Successfully processed products/update webhook
```

---

## Summary

**To populate your Neon database:**

1. **Run:** `npm run dev`
2. **Visit:** `/app/sync-data`
3. **Click:** "Sync All Data"
4. **Wait:** 2-5 minutes
5. **Verify:** Data appears in `/app/analytics`

**After that:**
- Webhooks keep data in sync automatically
- No manual syncing needed
- Real-time updates on every Shopify change

---

## Need Help?

**Data not showing:**
- Check [NEON_SETUP_COMPLETE.md](NEON_SETUP_COMPLETE.md)
- Verify connection: `npx tsx sync-to-neon.ts --verify-only`

**Sync failing:**
- Check [NEON_CONNECTION_TIPS.md](NEON_CONNECTION_TIPS.md)
- View logs in terminal

**Performance issues:**
- Check [STARTUP_GUIDE.md](STARTUP_GUIDE.md)
- Enable Redis caching

---

**Your data will be synced in minutes! 🚀**
