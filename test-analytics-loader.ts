/**
 * Test script to simulate what the analytics loader returns
 *
 * Run this script with: npx tsx test-analytics-loader.ts
 */

import db from "./app/db.server";

async function main() {
  console.log("🧪 Testing Analytics Loader Logic...\n");

  const shop = "control-tower-2.myshopify.com";

  // Get daily snapshots for trend chart and aggregation (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlySnapshots = await db.analyticsSnapshot.findMany({
    where: {
      shop,
      period: "daily",
      date: { gte: twelveMonthsAgo },
    },
    orderBy: { date: "asc" },
  });

  console.log(`📊 Found ${monthlySnapshots.length} snapshots in last 12 months`);
  console.log(`   Date range: ${monthlySnapshots[0]?.date.toISOString()} to ${monthlySnapshots[monthlySnapshots.length - 1]?.date.toISOString()}`);

  // Aggregate ALL snapshots (this is what the loader does)
  let totalOrders = 0;
  let totalRevenue = 0;
  let fulfilledOrders = 0;
  let paidOrders = 0;

  monthlySnapshots.forEach((snapshot) => {
    totalOrders += snapshot.totalOrders;
    totalRevenue += snapshot.totalRevenue;
    fulfilledOrders += snapshot.fulfilledOrders;
    paidOrders += snapshot.paidOrders;
  });

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const fulfillmentRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;

  console.log(`\n📈 Aggregated Metrics (what dashboard should show):`);
  console.log(`   Total Orders: ${totalOrders}`);
  console.log(`   Total Revenue: $${totalRevenue.toFixed(2)}`);
  console.log(`   Average Order Value: $${averageOrderValue.toFixed(2)}`);
  console.log(`   Fulfilled Orders: ${fulfilledOrders}`);
  console.log(`   Fulfillment Rate: ${fulfillmentRate.toFixed(1)}%`);
  console.log(`   Paid Orders: ${paidOrders}`);

  // Check what the current date range captures
  console.log(`\n⏰ Timeframe Analysis:`);
  console.log(`   12 months ago: ${twelveMonthsAgo.toISOString()}`);
  console.log(`   Today: ${new Date().toISOString()}`);

  // Check if there are older snapshots not included
  const olderSnapshots = await db.analyticsSnapshot.count({
    where: {
      shop,
      period: "daily",
      date: { lt: twelveMonthsAgo },
    },
  });

  if (olderSnapshots > 0) {
    console.log(`\n⚠️  Note: ${olderSnapshots} snapshots are older than 12 months and NOT included in dashboard`);

    // Show what ALL snapshots would give us
    const allSnapshots = await db.analyticsSnapshot.findMany({
      where: {
        shop,
        period: "daily",
      },
    });

    let allTotalOrders = 0;
    let allTotalRevenue = 0;
    let allFulfilledOrders = 0;

    allSnapshots.forEach((snapshot) => {
      allTotalOrders += snapshot.totalOrders;
      allTotalRevenue += snapshot.totalRevenue;
      allFulfilledOrders += snapshot.fulfilledOrders;
    });

    console.log(`\n📊 If ALL snapshots were included (no 12-month limit):`);
    console.log(`   Total Orders: ${allTotalOrders}`);
    console.log(`   Total Revenue: $${allTotalRevenue.toFixed(2)}`);
    console.log(`   Average Order Value: $${(allTotalRevenue / allTotalOrders).toFixed(2)}`);
  } else {
    console.log(`\n✅ All snapshots are within the 12-month window`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
