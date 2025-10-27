#!/bin/bash

###############################################################################
# Performance Validation Script
#
# Checks if your analytics infrastructure meets War Room prerequisites
#
# Usage:
#   chmod +x check-performance.sh
#   ./check-performance.sh
###############################################################################

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         War Room Prerequisites: Performance Check          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Check 1: Redis
echo -e "${BLUE}1️⃣  Checking Redis...${NC}"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Redis is running${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "   ${RED}❌ Redis is NOT running${NC}"
    echo "   Start with:"
    echo "     Mac:    brew services start redis"
    echo "     Linux:  sudo systemctl start redis"
    echo "     Windows: redis-server.exe"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi
echo ""

# Check 2: Database
echo -e "${BLUE}2️⃣  Checking Database...${NC}"
if [ -f "prisma/dev.sqlite" ]; then
    SIZE=$(du -h prisma/dev.sqlite 2>/dev/null | cut -f1)
    ENTRIES=$(sqlite3 prisma/dev.sqlite "SELECT COUNT(*) FROM Order" 2>/dev/null || echo "0")

    echo -e "   ${GREEN}✅ Database exists${NC}"
    echo "      Size: $SIZE"
    echo "      Orders: $ENTRIES"

    if [ "$ENTRIES" -gt "0" ]; then
        echo -e "   ${GREEN}✅ Database has data${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "   ${YELLOW}⚠️  Database is empty${NC}"
        echo "      Run: npm run dev, then navigate to /app/sync"
        CHECKS_WARNING=$((CHECKS_WARNING + 1))
    fi
else
    echo -e "   ${RED}❌ Database not found${NC}"
    echo "   Run: npm run setup"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi
echo ""

# Check 3: GCP Pub/Sub
echo -e "${BLUE}3️⃣  Checking GCP Pub/Sub Webhooks...${NC}"
if [ -f ".env" ] && grep -q "GOOGLE_CLOUD_PROJECT_ID" .env; then
    echo -e "   ${GREEN}✅ GCP environment variables configured${NC}"

    if [ -f "check-gcp-pubsub-setup.js" ]; then
        echo "   Testing GCP Pub/Sub setup..."
        # Run the GCP check script (capture just the summary)
        if node check-gcp-pubsub-setup.js 2>&1 | grep -q "All checks passed"; then
            echo -e "   ${GREEN}✅ GCP Pub/Sub setup is working${NC}"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "   ${YELLOW}⚠️  GCP Pub/Sub has warnings${NC}"
            echo "      Run: npm run check-gcp-setup"
            echo "      See: TESTING_GCP_PUBSUB_WEBHOOKS.md"
            CHECKS_WARNING=$((CHECKS_WARNING + 1))
        fi
    else
        echo -e "   ${YELLOW}⚠️  GCP setup script not found${NC}"
        CHECKS_WARNING=$((CHECKS_WARNING + 1))
    fi
else
    echo -e "   ${YELLOW}⚠️  GCP not configured (using HTTP webhooks)${NC}"
    echo "      For multi-merchant apps, GCP Pub/Sub is recommended"
    echo "      See: MULTI_MERCHANT_WEBHOOK_ARCHITECTURE.md"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
fi
echo ""

# Check 4: Production Build
echo -e "${BLUE}4️⃣  Checking Build Status...${NC}"
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build 2>/dev/null | cut -f1)
    echo -e "   ${GREEN}✅ Production build exists ($BUILD_SIZE)${NC}"
    echo "      Test performance with: npm run build && npm run start"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "   ${YELLOW}⚠️  No production build found${NC}"
    echo "      Development is 2-5x slower than production"
    echo "      Build with: npm run build"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
fi
echo ""

# Check 5: Analytics Snapshots
echo -e "${BLUE}5️⃣  Checking Analytics Snapshots...${NC}"
if [ -f "prisma/dev.sqlite" ]; then
    SNAPSHOTS=$(sqlite3 prisma/dev.sqlite "SELECT COUNT(*) FROM AnalyticsSnapshot" 2>/dev/null || echo "0")

    if [ "$SNAPSHOTS" -gt "0" ]; then
        echo -e "   ${GREEN}✅ Analytics snapshots exist ($SNAPSHOTS snapshots)${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "   ${YELLOW}⚠️  No analytics snapshots${NC}"
        echo "      Compute with: npm run dev → navigate to /app/compute-analytics"
        CHECKS_WARNING=$((CHECKS_WARNING + 1))
    fi
else
    echo -e "   ${RED}❌ Cannot check snapshots (database missing)${NC}"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi
echo ""

# Summary
echo "════════════════════════════════════════════════════════════"
echo "📊 Summary:"
echo "════════════════════════════════════════════════════════════"
echo -e "   ${GREEN}✅ Passed:   $CHECKS_PASSED${NC}"
echo -e "   ${YELLOW}⚠️  Warnings: $CHECKS_WARNING${NC}"
echo -e "   ${RED}❌ Failed:   $CHECKS_FAILED${NC}"
echo ""

# Overall status
if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Prerequisites NOT met - fix failed checks above${NC}"
    echo ""
    exit 1
elif [ $CHECKS_WARNING -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Prerequisites mostly met - review warnings${NC}"
    echo ""
    echo "You can proceed with War Room, but address warnings for optimal performance."
    echo ""
else
    echo -e "${GREEN}✅ All prerequisites met! Ready for War Room Session 1!${NC}"
    echo ""
fi

# Next steps
echo "📋 Next Steps:"
echo ""
echo "  To validate analytics performance manually:"
echo "    1. Start dev server: ${BLUE}npm run dev${NC}"
echo "    2. Open app in Shopify Admin"
echo "    3. Press F12 → Network tab"
echo "    4. Navigate to Analytics"
echo "    5. Check load time for /app/analytics request"
echo "    6. Look for X-Cache: HIT header"
echo ""
echo "  To test production performance:"
echo "    1. Build: ${BLUE}npm run build${NC}"
echo "    2. Start: ${BLUE}npm run start${NC}"
echo "    3. Test as above"
echo ""
echo "  To test GCP Pub/Sub:"
echo "    1. Test: ${BLUE}npm run test-gcp-pubsub${NC}"
echo "    2. Start consumer: ${BLUE}npm run gcp-consumer${NC}"
echo "    3. Create test order in Shopify Admin"
echo ""
echo "  Performance targets:"
echo "    ✅ Analytics (cache hit):  <100ms"
echo "    ✅ Analytics (cache miss): <2 seconds"
echo "    ✅ Initial app load (dev): 3-8 seconds (normal)"
echo "    ✅ Initial app load (prod): 1-3 seconds"
echo ""
echo "📚 Documentation:"
echo "  - ${BLUE}PERFORMANCE_VALIDATION_GUIDE.md${NC} - How to measure performance"
echo "  - ${BLUE}TESTING_GCP_PUBSUB_WEBHOOKS.md${NC} - How to test webhooks"
echo "  - ${BLUE}WAR_ROOM_QUICK_START.md${NC} - Start building War Room"
echo ""
