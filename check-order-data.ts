/**
 * Script to check order data completeness
 *
 * Run this script with: npx tsx check-order-data.ts
 */

import db from "./app/db.server";

async function main() {
  console.log("🔍 Checking order data in database...\n");

  // Total orders
  const totalOrders = await db.order.count();
  console.log(`📊 Total orders in database: ${totalOrders}`);

  // Orders with processedAt
  const ordersWithProcessedAt = await db.order.count({
    where: {
      processedAt: {
        not: null,
      },
    },
  });
  console.log(`✅ Orders WITH processedAt: ${ordersWithProcessedAt}`);
  console.log(`❌ Orders WITHOUT processedAt: ${totalOrders - ordersWithProcessedAt}`);

  // Date range of orders with processedAt
  const oldestOrder = await db.order.findFirst({
    where: {
      processedAt: {
        not: null,
      },
    },
    orderBy: { processedAt: "asc" },
    select: { processedAt: true, shopifyOrderId: true },
  });

  const newestOrder = await db.order.findFirst({
    where: {
      processedAt: {
        not: null,
      },
    },
    orderBy: { processedAt: "desc" },
    select: { processedAt: true, shopifyOrderId: true },
  });

  if (oldestOrder && newestOrder) {
    console.log(`\n📅 Date Range:`);
    console.log(`   Oldest: ${oldestOrder.processedAt?.toISOString()} (Order: ${oldestOrder.shopifyOrderId})`);
    console.log(`   Newest: ${newestOrder.processedAt?.toISOString()} (Order: ${newestOrder.shopifyOrderId})`);
  }

  // Check if orders have customer IDs
  const ordersWithCustomerId = await db.order.count({
    where: {
      customerId: {
        not: null,
      },
    },
  });
  console.log(`\n👤 Customer Data:`);
  console.log(`   Orders WITH customerId: ${ordersWithCustomerId}`);
  console.log(`   Orders WITHOUT customerId: ${totalOrders - ordersWithCustomerId}`);

  // Sample a few orders to see their data
  console.log(`\n📋 Sample Orders (first 5):`);
  const sampleOrders = await db.order.findMany({
    take: 5,
    include: {
      lineItems: true,
    },
  });

  sampleOrders.forEach((order, index) => {
    console.log(`\n   Order ${index + 1}:`);
    console.log(`      Shopify ID: ${order.shopifyOrderId}`);
    console.log(`      ProcessedAt: ${order.processedAt?.toISOString() || "NULL"}`);
    console.log(`      Customer ID: ${order.customerId || "NULL"}`);
    console.log(`      Total Price: $${order.totalPrice}`);
    console.log(`      Financial Status: ${order.financialStatus}`);
    console.log(`      Fulfillment Status: ${order.fulfillmentStatus}`);
    console.log(`      Line Items: ${order.lineItems.length}`);
  });

  // Check snapshots
  console.log(`\n\n📊 Analytics Snapshots:`);
  const snapshotCount = await db.analyticsSnapshot.count({
    where: { period: "daily" },
  });
  console.log(`   Total daily snapshots: ${snapshotCount}`);

  const snapshotStats = await db.analyticsSnapshot.aggregate({
    where: { period: "daily" },
    _sum: {
      totalOrders: true,
      totalRevenue: true,
    },
  });

  console.log(`   Total orders in snapshots: ${snapshotStats._sum.totalOrders || 0}`);
  console.log(`   Total revenue in snapshots: $${(snapshotStats._sum.totalRevenue || 0).toFixed(2)}`);

  // Check if there's a mismatch
  const mismatch = totalOrders - (snapshotStats._sum.totalOrders || 0);
  if (mismatch > 0) {
    console.log(`\n⚠️  WARNING: ${mismatch} orders are NOT included in analytics snapshots!`);
    console.log(`   This usually means:`);
    console.log(`   - Orders don't have a processedAt date`);
    console.log(`   - Orders were created/updated after the last analytics run`);
  } else {
    console.log(`\n✅ All orders are included in analytics snapshots!`);
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
