# Fix Missing Products & Inventory Data

## Problem
✅ Orders are syncing
❌ Products are missing
❌ Inventory data is missing

## Quick Fix (Choose One)

### Option 1: Use the Sync UI (Easiest)

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Visit the sync page:**
   ```
   http://localhost:[port]/app/sync
   ```
   Or if using tunnel:
   ```
   https://[your-tunnel-url]/app/sync
   ```

3. **Click these buttons in order:**
   - ✅ "Sync Products from Shopify"
   - ✅ "Sync Orders from Shopify" (if not done)

4. **Wait 2-5 minutes** - Watch the console logs for progress

5. **Verify data:**
   ```bash
   npx prisma studio
   ```
   Check the `Product` table - you should see your products!

---

### Option 2: Use Command Line Script (Faster)

```bash
# Install missing dependency if needed
npm install @shopify/admin-api-client

# Run comprehensive sync
npx tsx sync-all-data.ts
```

**This will sync:**
- ✅ All products (with inventory levels)
- ✅ All orders (with line items)
- ✅ Inventory snapshots (for War Room)

**Expected output:**
```
🚀 Complete Shopify → Neon Data Sync
✅ Connected to Neon PostgreSQL
📦 Syncing Products from Shopify...
   📄 Fetching page 1...
   ✅ Page 1: 50 products synced so far
...
✅ Products synced: 247
✅ Orders synced: 1543
✅ Inventory snapshots: 247
```

---

## Why Products Weren't Syncing

**Reason:** Webhooks only catch NEW changes, not existing data.

**What happened:**
1. ✅ You installed the app
2. ✅ Webhooks were registered
3. ✅ NEW orders started syncing automatically
4. ❌ But EXISTING products were never fetched
5. ❌ No inventory snapshots were created

**Solution:** Run initial sync once, then webhooks keep everything updated.

---

## Verify Everything is Working

### 1. Check Product Count
```bash
npx tsx -e "
import db from './app/db.server.js';
const count = await db.product.count();
console.log('Products in database:', count);
await db.\$disconnect();
"
```

**Expected:** Your actual product count from Shopify

### 2. Check Inventory Snapshots
```bash
npx tsx -e "
import db from './app/db.server.js';
const count = await db.inventorySnapshot.count();
console.log('Inventory snapshots:', count);
await db.\$disconnect();
"
```

**Expected:** Same as product count

### 3. Visual Check
```bash
npx prisma studio
```

**Check these tables:**
- `Product` - Should have all your products
- `Order` - Should have all your orders
- `OrderLineItem` - Should have line items
- `InventorySnapshot` - Should have inventory data

---

## After Initial Sync

### Webhooks Keep Everything Updated

**Product changes:**
```
Shopify: Product Created → Webhook → Saved to Neon ✅
Shopify: Product Updated → Webhook → Updated in Neon ✅
Shopify: Inventory Changed → Webhook → Updated in Neon ✅
```

**Order changes:**
```
Shopify: Order Created → Webhook → Saved to Neon ✅
Shopify: Order Updated → Webhook → Updated in Neon ✅
```

**No manual syncing needed after the first time!**

---

## Troubleshooting

### "Sync is still not working"

**Check 1: Verify scopes**
```bash
cat .env | grep SCOPES
```

Should include:
- `read_products`
- `read_inventory`
- `read_orders`

**Check 2: Check app permissions**
```
In Shopify Admin:
Settings → Apps and sales channels → [Your App] → Configuration
```

Verify app has access to:
- Products
- Inventory
- Orders

**Check 3: Re-register webhooks**
```bash
npm run deploy
```

This updates Shopify with your webhook URLs.

### "Script fails with authentication error"

The `sync-all-data.ts` script needs Shopify credentials.

**Add to `.env`:**
```env
SHOPIFY_API_KEY=your_api_key
# This is actually used as access token in the script
```

**Better: Use the UI method**
- Visit `/app/sync` instead
- Uses your existing authenticated session
- No extra configuration needed

### "Products syncing but inventory is 0"

Some products might not have inventory tracked.

**Check in Shopify:**
- Product → Inventory tab
- Make sure "Track quantity" is enabled

**Or run snapshot script:**
```bash
npx tsx populate-war-room-data.ts
```

This creates mock inventory snapshots for testing.

---

## Complete Verification Checklist

Run these in order:

```bash
# 1. Start app
npm run dev

# 2. Open sync UI
# Visit: http://localhost:[port]/app/sync

# 3. Click "Sync Products"
# Wait for completion

# 4. Verify products
npx tsx -e "import db from './app/db.server.js'; console.log('Products:', await db.product.count()); await db.\$disconnect();"

# 5. Check War Room dashboard
# Visit: /app/war-room
# Should show data now

# 6. Check analytics
# Visit: /app/analytics
# Should show products and orders
```

---

## Quick Commands Reference

```bash
# Sync via UI (recommended)
npm run dev
# Then visit /app/sync

# Sync via script
npx tsx sync-all-data.ts

# Check product count
npx tsx -e "import db from './app/db.server.js'; console.log(await db.product.count()); await db.\$disconnect();"

# View database
npx prisma studio

# Regenerate Prisma client
npx prisma generate

# Re-deploy webhooks
npm run deploy
```

---

## Expected Timeline

| Action | Time |
|--------|------|
| Sync 100 products | ~1 minute |
| Sync 1000 products | ~5 minutes |
| Sync 100 orders | ~1 minute |
| Sync 1000 orders | ~5 minutes |
| Create inventory snapshots | ~30 seconds |

**Rate limiting:** 500ms between requests (Shopify requirement)

---

## Summary

**To fix missing products & inventory:**

1. **Run:** `npm run dev`
2. **Visit:** `/app/sync`
3. **Click:** "Sync Products from Shopify"
4. **Wait:** 2-5 minutes
5. **Verify:** Visit `/app/war-room` - data should appear!

**Or use script:**
```bash
npx tsx sync-all-data.ts
```

**After that:** Webhooks keep everything in sync automatically! 🚀

---

## Need More Help?

- **Sync not working:** Check [DATA_SYNC_GUIDE.md](DATA_SYNC_GUIDE.md)
- **Connection issues:** Check [NEON_CONNECTION_TIPS.md](NEON_CONNECTION_TIPS.md)
- **General setup:** Check [README_NEON_SETUP.md](README_NEON_SETUP.md)

---

**Your products will sync in minutes! ⚡**
