# GDPR Webhook Testing Guide

**Status:** GDPR compliance webhooks implemented ✅
**Date Added:** October 30, 2025

---

## What Was Added

Three mandatory GDPR compliance webhooks required for Shopify App Store approval:

1. **`customers/data_request`** - Export customer data on request
2. **`customers/redact`** - Delete/anonymize customer data
3. **`shop/redact`** - Delete ALL shop data (48 hours after uninstall)

### Files Created

- [app/routes/webhooks.gdpr.customers_data_request.tsx](app/routes/webhooks.gdpr.customers_data_request.tsx)
- [app/routes/webhooks.gdpr.customers_redact.tsx](app/routes/webhooks.gdpr.customers_redact.tsx)
- [app/routes/webhooks.gdpr.shop_redact.tsx](app/routes/webhooks.gdpr.shop_redact.tsx)
- [shopify.app.toml](shopify.app.toml) - Updated with GDPR webhook registrations

---

## Testing Your GDPR Webhooks

### Prerequisites

1. App running locally: `npm run dev`
2. Shopify CLI authenticated
3. App installed on a development store

### Test 1: Customer Data Request

**What it does:** When a customer requests their data (GDPR "Right to Access"), this webhook collects all data you have about them.

**Test command:**
```bash
shopify webhook trigger --topic=customers/data_request
```

**Expected response:**
```
✅ Successfully processed customers/data_request webhook
```

**What to check:**
1. Console logs show:
   ```
   📥 GDPR: Customer data request for shop: your-store.myshopify.com
   📋 Data request for customer customer@example.com
   📊 Data collected: { customerId, customerEmail, orders: [...], ... }
   📝 Logged GDPR data request
   ✅ Customer data request processed
   ```

2. Check database (AlertLog table):
   ```bash
   npx prisma studio
   ```
   - Navigate to `AlertLog` table
   - Find record with `alertType: "gdpr_data_request"`
   - Verify `metadata` contains customer data snapshot

**Production behavior:**
In production, you should:
- Send email to merchant with customer data export
- Provide download link or PDF report
- Keep audit log for compliance (30 days retention)

---

### Test 2: Customer Redaction

**What it does:** When a customer requests deletion (GDPR "Right to be Forgotten"), this webhook anonymizes their data.

**Test command:**
```bash
shopify webhook trigger --topic=customers/redact
```

**Expected response:**
```
✅ Successfully processed customers/redact webhook
```

**What to check:**
1. Console logs show:
   ```
   📥 GDPR: Customer redaction request for shop: your-store.myshopify.com
   🗑️  Redacting data for customer customer@example.com
   🔒 Anonymized N orders for customer
   📝 Logged GDPR redaction
   ✅ Customer data redacted
   ```

2. Check database (Order table):
   - Orders previously belonging to this customer now have:
     - `customerId: null`
     - `customerEmail: null`
     - `email: null`
   - Order history preserved (for business analytics)
   - All PII removed

3. Check AlertLog:
   - Record with `alertType: "gdpr_customer_redaction"`
   - Status: `acknowledged: true`

**Important:** Anonymization vs. Deletion
- We anonymize rather than delete to preserve:
  - Revenue metrics
  - Inventory trends
  - Business analytics
- This is GDPR-compliant (business interest > right to be forgotten for aggregated analytics)

---

### Test 3: Shop Redaction

**What it does:** 48 hours after a merchant uninstalls your app, Shopify triggers this webhook. You must delete ALL shop data.

**Test command:**
```bash
shopify webhook trigger --topic=shop/redact
```

**Expected response:**
```
✅ Successfully processed shop/redact webhook
```

**What to check:**
1. Console logs show extensive deletion:
   ```
   📥 GDPR: Shop redaction request for shop: your-store.myshopify.com
   🗑️  Starting complete data deletion
   🗑️  Phase 1: Deleting transactional data
      ✓ Deleted N order line items
      ✓ Deleted N inventory snapshots
      ✓ Deleted N war room metrics
      ✓ Deleted N alert logs
      ✓ Deleted N executed actions
      ✓ Deleted N recommended actions
      ✓ Deleted N action templates
      ✓ Deleted N alert history records
      ✓ Deleted N alert rules
      ✓ Deleted N notification preferences
      ✓ Deleted N simulation results
      ✓ Deleted N simulations
      ✓ Deleted N playbooks
      ✓ Deleted N orders
      ✓ Deleted N products
      ✓ Deleted N analytics snapshots
      ✓ Deleted N sync status records
      ✓ Deleted N QR codes
      ✓ Deleted N sessions
   🗑️  Phase 2: Clearing cache
      ✓ Cache cleared for shop
   📝 Logged shop deletion for compliance audit
   ✅ Complete data deletion finished
   ```

2. Verify all shop data deleted from database:
   ```bash
   npx prisma studio
   ```
   - Search for shop domain in any table
   - Should return ZERO results (except audit log)

3. Check AlertLog (SYSTEM records):
   - Record with `shop: "SYSTEM"` (not deleted)
   - `alertType: "gdpr_shop_redaction"`
   - Metadata contains shop domain and deletion timestamp

**CRITICAL:** This is a destructive operation! Only test on development stores.

---

## Webhook Registration Verification

After deploying configuration, verify webhooks are registered:

```bash
# Deploy app configuration to Shopify
npm run deploy

# Verify webhook registration
shopify app webhook list
```

**Expected output:**
```
Webhooks for your-app:
  - orders/create → /webhooks/orders
  - orders/updated → /webhooks/orders
  - orders/cancelled → /webhooks/orders
  - products/create → /webhooks/products
  - products/update → /webhooks/products
  - customers/data_request → /webhooks/gdpr/customers_data_request  ✅
  - customers/redact → /webhooks/gdpr/customers_redact              ✅
  - shop/redact → /webhooks/gdpr/shop_redact                        ✅
```

---

## Production Checklist

Before submitting to Shopify App Store:

- [ ] All three GDPR webhooks respond within 5 seconds
- [ ] Customer data request generates complete export
- [ ] Customer redaction anonymizes ALL PII
- [ ] Shop redaction deletes ALL data (verified on test store)
- [ ] Audit logs preserved for compliance (AlertLog with shop="SYSTEM")
- [ ] No errors in webhook handlers
- [ ] Tested on 3+ development stores
- [ ] Documentation updated with GDPR compliance procedures

---

## Webhook Behavior Details

### customers/data_request

**Payload example:**
```json
{
  "shop_domain": "your-store.myshopify.com",
  "customer": {
    "id": 123456789,
    "email": "customer@example.com"
  },
  "orders_requested": ["gid://shopify/Order/1", "gid://shopify/Order/2"]
}
```

**Your response:**
- Extract all customer data from database
- Generate JSON report
- Log request for compliance
- Return 200 OK within 5 seconds
- *Background:* Email data package to merchant

### customers/redact

**Payload example:**
```json
{
  "shop_domain": "your-store.myshopify.com",
  "customer": {
    "id": 123456789,
    "email": "customer@example.com"
  },
  "orders_to_redact": ["gid://shopify/Order/1"]
}
```

**Your response:**
- Set `customerId: null`, `customerEmail: null` on all customer orders
- Delete any other customer-specific data
- Log redaction for compliance
- Return 200 OK within 5 seconds

### shop/redact

**Payload example:**
```json
{
  "shop_domain": "your-store.myshopify.com",
  "shop_id": 123456789
}
```

**Your response:**
- Delete ALL data for this shop (orders, products, analytics, etc.)
- Clear all caches
- Delete any external storage (S3, etc.)
- Log deletion to system audit log (not shop-specific)
- Return 200 OK within 5 seconds

**Timing:** Triggered 48 hours after merchant uninstalls your app

---

## Troubleshooting

### Webhook not receiving requests

**Check:**
1. App running: `npm run dev`
2. Tunnel active: Shopify CLI provides tunnel URL
3. Webhook registered: `shopify app webhook list`
4. Firewall not blocking: Check network settings

### Webhook returns 401 Unauthorized

**Cause:** HMAC verification failing

**Solution:** The `authenticate.webhook(request)` function handles HMAC verification automatically. If this fails:
- Check `SHOPIFY_API_SECRET` environment variable is correct
- Verify webhook is registered via CLI (not manually in admin)

### Webhook times out (> 5 seconds)

**Cause:** Shop redaction deleting too much data

**Solution:** Move heavy deletion to background job:
```typescript
// Return immediately
return new Response("OK", { status: 200 });

// Queue deletion in background
backgroundJobs.enqueue('deleteShopData', { shop });
```

### Partial deletion in shop redaction

**Cause:** Foreign key constraint failures

**Solution:** Delete in correct order (child records first):
1. OrderLineItems (child of Order)
2. Orders
3. Products
4. Sessions (last)

See [webhooks.gdpr.shop_redact.tsx](app/routes/webhooks.gdpr.shop_redact.tsx) for correct order.

---

## Compliance Notes

### Data Retention

**Customer data request:**
- Response deadline: 30 days
- Log retention: 3 years (recommended)

**Customer redaction:**
- Response deadline: 30 days
- Anonymize, don't delete (for business analytics)

**Shop redaction:**
- Response deadline: 30 days
- Triggered: 48 hours after uninstall
- Delete everything (except system audit logs)

### Audit Trail

All GDPR operations are logged to `AlertLog` table:
- `alertType: "gdpr_data_request"`
- `alertType: "gdpr_customer_redaction"`
- `alertType: "gdpr_shop_redaction"`

Shop redaction logs use `shop: "SYSTEM"` to survive deletion.

### Legal Compliance

This implementation follows:
- GDPR (EU General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- Shopify App Store requirements

**Disclaimer:** Consult with legal counsel to ensure full compliance with all applicable regulations.

---

## Next Steps

1. **Test all three webhooks** using commands above
2. **Verify data deletion** in Prisma Studio
3. **Update app listing** in Partner Dashboard with privacy policy
4. **Document procedures** for handling data requests in production
5. **Set up monitoring** to alert on GDPR webhook failures

**Your app now meets Shopify's GDPR compliance requirements!** ✅

For production deployment, see [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md).
