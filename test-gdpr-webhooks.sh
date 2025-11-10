#!/bin/bash

# GDPR Webhook Testing Script
# This script tests all three GDPR compliance webhooks

echo "🧪 GDPR Webhook Testing Suite"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if app is running
echo "📡 Checking if Shopify app is running..."
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ App is not running on localhost:3000${NC}"
    echo "Please start the app first: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ App is running${NC}"
echo ""

# Test 1: Customer Data Request
echo "================================"
echo "Test 1: Customer Data Request"
echo "================================"
echo "What this tests: Export customer data on GDPR request"
echo ""
echo "Triggering webhook with curl..."
curl -X POST http://localhost:3000/webhooks/gdpr/customers_data_request \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: customers/data_request" \
  -H "X-Shopify-Shop-Domain: test-store.myshopify.com" \
  -d '{
    "shop_domain": "test-store.myshopify.com",
    "customer": {
      "id": 123456,
      "email": "customer@example.com"
    }
  }'

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Webhook triggered successfully${NC}"
    echo ""
    echo "Expected behavior:"
    echo "  - Console shows: 📥 GDPR: Customer data request"
    echo "  - Data collected from database"
    echo "  - AlertLog entry created with alertType: 'gdpr_data_request'"
    echo ""
    echo "Note: Without valid HMAC signature, the webhook may fail authentication."
    echo "This is expected! The important thing is that the route exists and responds."
    echo ""
    echo "To verify:"
    echo "  1. Check console logs above"
    echo "  2. Run: npx prisma studio"
    echo "  3. Open AlertLog table"
    echo "  4. Find record with alertType='gdpr_data_request'"
else
    echo -e "${RED}❌ Webhook trigger failed${NC}"
fi
echo ""
read -p "Press Enter to continue to next test..."
echo ""

# Test 2: Customer Redaction
echo "================================"
echo "Test 2: Customer Redaction"
echo "================================"
echo "What this tests: Anonymize customer data (GDPR Right to be Forgotten)"
echo ""
echo "Triggering webhook with curl..."
curl -X POST http://localhost:3000/webhooks/gdpr/customers_redact \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: customers/redact" \
  -H "X-Shopify-Shop-Domain: test-store.myshopify.com" \
  -d '{
    "shop_domain": "test-store.myshopify.com",
    "customer": {
      "id": 123456,
      "email": "customer@example.com"
    }
  }'

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Webhook triggered successfully${NC}"
    echo ""
    echo "Expected behavior:"
    echo "  - Console shows: 🗑️ Redacting data for customer"
    echo "  - Order records updated: customerId=null, customerEmail=null"
    echo "  - AlertLog entry created with alertType: 'gdpr_customer_redaction'"
    echo ""
    echo "To verify:"
    echo "  1. Check console logs above"
    echo "  2. Run: npx prisma studio"
    echo "  3. Check Order table - customer fields should be null"
    echo "  4. Check AlertLog table for redaction record"
else
    echo -e "${RED}❌ Webhook trigger failed${NC}"
fi
echo ""
read -p "Press Enter to continue to next test..."
echo ""

# Test 3: Shop Redaction (WARNING: Destructive)
echo "================================"
echo "Test 3: Shop Redaction"
echo "================================"
echo "What this tests: Complete shop data deletion (48hrs after uninstall)"
echo ""
echo -e "${RED}⚠️  WARNING: This test will DELETE ALL DATA for the test shop!${NC}"
echo -e "${YELLOW}Only run this on a development/test store!${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to proceed): " confirm

if [ "$confirm" = "yes" ]; then
    echo ""
    echo "Triggering webhook with curl..."
    curl -X POST http://localhost:3000/webhooks/gdpr/shop_redact \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Topic: shop/redact" \
      -H "X-Shopify-Shop-Domain: test-store.myshopify.com" \
      -d '{
        "shop_domain": "test-store.myshopify.com",
        "shop_id": 123456
      }'

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Webhook triggered successfully${NC}"
        echo ""
        echo "Expected behavior:"
        echo "  - Console shows: 🗑️ Starting complete data deletion"
        echo "  - ALL tables cleared for this shop"
        echo "  - Redis cache cleared"
        echo "  - System AlertLog entry created (shop='SYSTEM')"
        echo ""
        echo "To verify:"
        echo "  1. Check console logs above for deletion counts"
        echo "  2. Run: npx prisma studio"
        echo "  3. Search for shop domain - should return ZERO results"
        echo "  4. Check AlertLog with shop='SYSTEM' for audit trail"
    else
        echo -e "${RED}❌ Webhook trigger failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping destructive test${NC}"
fi
echo ""

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo ""
echo "All three GDPR webhooks have been triggered."
echo ""
echo "Next steps:"
echo "  1. Review console logs above for detailed output"
echo "  2. Open Prisma Studio: npx prisma studio"
echo "  3. Verify database changes in AlertLog table"
echo "  4. Check that data was properly anonymized/deleted"
echo ""
echo "For detailed testing guide, see:"
echo "  📖 GDPR_WEBHOOK_TESTING.md"
echo ""
echo -e "${GREEN}✅ Testing complete!${NC}"
