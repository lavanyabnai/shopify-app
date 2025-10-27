/**
 * Test script for DEFCON Calculator
 *
 * Usage: npx tsx test-defcon-calculator.ts
 */

import db from "./app/db.server";
import {
  calculateDEFCON,
  updateInventorySnapshot,
  getLatestDEFCON,
} from "./app/services/defcon-calculator.server";

async function main() {
  console.log("🧪 Testing DEFCON Calculator\n");

  // Get shop from first session
  const session = await db.session.findFirst();

  if (!session) {
    console.error("❌ No session found. Please authenticate with Shopify first.");
    process.exit(1);
  }

  const shop = session.shop;
  console.log(`📍 Testing with shop: ${shop}\n`);

  // Test 1: Create sample inventory snapshots
  console.log("📸 Test 1: Creating sample inventory snapshots...");

  const testProducts = [
    {
      productId: "gid://shopify/Product/1",
      sku: "TEST-SKU-001",
      title: "Critical Product (2h coverage)",
      location: "Main Warehouse",
      currentStock: 10,
    },
    {
      productId: "gid://shopify/Product/2",
      sku: "TEST-SKU-002",
      title: "Warning Product (12h coverage)",
      location: "Main Warehouse",
      currentStock: 50,
    },
    {
      productId: "gid://shopify/Product/3",
      sku: "TEST-SKU-003",
      title: "Healthy Product (100h coverage)",
      location: "Main Warehouse",
      currentStock: 500,
    },
    {
      productId: "gid://shopify/Product/4",
      sku: "TEST-SKU-004",
      title: "Stockout Product",
      location: "Main Warehouse",
      currentStock: 0,
    },
  ];

  for (const product of testProducts) {
    await updateInventorySnapshot(
      shop,
      product.productId,
      product.sku,
      product.title,
      product.location,
      product.currentStock
    );
  }

  console.log(`✅ Created ${testProducts.length} test inventory snapshots\n`);

  // Test 2: Calculate DEFCON level
  console.log("🎯 Test 2: Calculating DEFCON level...");
  const defcon = await calculateDEFCON(shop);

  console.log("\n📊 DEFCON Status:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  DEFCON Level: ${defcon.level} (${defcon.label})`);
  console.log(`  Color Code: ${defcon.color.toUpperCase()}`);
  console.log(`  Risk Score: ${defcon.riskScore}/100`);
  console.log(
    `  Avg Coverage: ${defcon.inventoryCoverageHours.toFixed(1)} hours`
  );
  console.log(`  Velocity Anomalies: ${defcon.velocityAnomaly.toFixed(1)}%`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📦 SKU Health Breakdown:");
  console.log(`  Critical: ${defcon.criticalSKUs} SKUs`);
  console.log(`  Warning: ${defcon.warningSKUs} SKUs`);
  console.log(`  Healthy: ${defcon.healthySKUs} SKUs`);
  console.log(`  Total: ${defcon.totalSKUs} SKUs\n`);

  console.log("🚨 Escalation Triggers:");
  defcon.escalationTriggers.forEach((trigger, index) => {
    console.log(`  ${index + 1}. ${trigger}`);
  });
  console.log();

  // Test 3: Retrieve cached DEFCON
  console.log("💾 Test 3: Retrieving latest DEFCON from database...");
  const cachedDEFCON = await getLatestDEFCON(shop);

  if (cachedDEFCON) {
    console.log(`✅ Retrieved DEFCON ${cachedDEFCON.level} from cache\n`);
  } else {
    console.log("⚠️ No cached DEFCON found\n");
  }

  // Test 4: Verify database records
  console.log("🔍 Test 4: Verifying database records...");

  const metricsCount = await db.warRoomMetrics.count({ where: { shop } });
  const snapshotsCount = await db.inventorySnapshot.count({ where: { shop } });

  console.log(`  WarRoomMetrics: ${metricsCount} records`);
  console.log(`  InventorySnapshot: ${snapshotsCount} records\n`);

  // Test 5: Display recent inventory snapshots
  console.log("📸 Test 5: Recent inventory snapshots:");
  const recentSnapshots = await db.inventorySnapshot.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  recentSnapshots.forEach((snapshot) => {
    console.log(
      `  ${snapshot.sku.padEnd(15)} | Stock: ${snapshot.currentStock
        .toString()
        .padStart(4)} | Coverage: ${snapshot.coverageHours
        .toFixed(1)
        .padStart(6)}h | Status: ${snapshot.status.toUpperCase()}`
    );
  });
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Summary
  console.log("✅ All tests completed successfully!");
  console.log("\n🎯 DEFCON System Summary:");
  console.log(`  - Current Status: DEFCON ${defcon.level} (${defcon.label})`);
  console.log(`  - Risk Level: ${defcon.riskScore}/100`);
  console.log(
    `  - ${defcon.criticalSKUs} SKUs need immediate attention`
  );
  console.log("\n💡 Next Steps:");
  console.log("  1. Start your dev server: npm run dev");
  console.log("  2. Navigate to: /app/war-room");
  console.log("  3. Verify DEFCON status board displays correctly\n");

  await db.$disconnect();
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
