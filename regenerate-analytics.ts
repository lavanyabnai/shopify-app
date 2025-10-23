/**
 * Script to regenerate analytics snapshots with corrected customer segments
 *
 * Run this script with: npx tsx regenerate-analytics.ts
 */

import db from "./app/db.server";
import { generateAnalyticsForDateRange } from "./app/services/analytics-aggregator.server";

async function main() {
  console.log("🔄 Starting analytics snapshot regeneration...\n");

  // Get all shops that have orders
  const shops = await db.syncStatus.findMany({
    where: {
      totalOrders: {
        gt: 0,
      },
    },
  });

  if (shops.length === 0) {
    console.log("⚠️  No shops with orders found. Please sync data first.");
    return;
  }

  for (const shopStatus of shops) {
    const shop = shopStatus.shop;
    console.log(`\n📊 Processing shop: ${shop}`);
    console.log(`   Total orders in DB: ${shopStatus.totalOrders}`);

    // Find the date range of orders
    const oldestOrder = await db.order.findFirst({
      where: { shop },
      orderBy: { processedAt: "asc" },
      select: { processedAt: true },
    });

    const newestOrder = await db.order.findFirst({
      where: { shop },
      orderBy: { processedAt: "desc" },
      select: { processedAt: true },
    });

    if (!oldestOrder?.processedAt || !newestOrder?.processedAt) {
      console.log(`   ⚠️  No orders with processedAt date found for ${shop}`);
      continue;
    }

    const startDate = new Date(oldestOrder.processedAt);
    const endDate = new Date(newestOrder.processedAt);

    console.log(`   Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);
    console.log(`   🔄 Regenerating daily analytics snapshots...`);

    // Delete existing snapshots for this shop (to avoid duplicates)
    const deletedCount = await db.analyticsSnapshot.deleteMany({
      where: {
        shop,
        period: "daily",
      },
    });
    console.log(`   🗑️  Deleted ${deletedCount.count} old snapshots`);

    // Regenerate snapshots with corrected customer segments
    const results = await generateAnalyticsForDateRange(shop, startDate, endDate);

    console.log(`   ✅ Generated ${results.length} new snapshots with corrected customer segments`);
    console.log(`   Total orders: ${results.reduce((sum, r) => sum + r.totalOrders, 0)}`);
    console.log(`   Total revenue: $${results.reduce((sum, r) => sum + r.totalRevenue, 0).toFixed(2)}`);
  }

  console.log("\n✅ Analytics regeneration complete!");
  console.log("💡 The dashboard will now show correct customer segments and cumulative totals.");
}

main()
  .catch((error) => {
    console.error("❌ Error regenerating analytics:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
