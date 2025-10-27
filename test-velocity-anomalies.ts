/**
 * Test script for Velocity Anomaly Detector
 *
 * Usage: npx tsx test-velocity-anomalies.ts
 */

import db from "./app/db.server";
import {
  detectVelocityAnomalies,
  getViralProducts,
  getDeadStockCandidates,
  getVelocitySummary,
  getCategoryPerformance,
} from "./app/services/velocity-detector.server";

async function main() {
  console.log("🧪 Testing Velocity Anomaly Detector\n");

  // Get shop from first session
  const session = await db.session.findFirst();

  if (!session) {
    console.error("❌ No session found. Please authenticate with Shopify first.");
    process.exit(1);
  }

  const shop = session.shop;
  console.log(`📍 Testing with shop: ${shop}\n`);

  // Test 1: Detect all velocity anomalies
  console.log("🔍 Test 1: Detecting velocity anomalies...");
  const stats = await detectVelocityAnomalies(shop);

  console.log("\n⚡ Velocity Anomaly Statistics:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Total Anomalies: ${stats.totalAnomalies}`);
  console.log(`  🔥 Viral Products: ${stats.viralProducts} (300%+ surge)`);
  console.log(`  ⚡ Accelerating: ${stats.acceleratingProducts} (100%+ increase)`);
  console.log(`  📦 Dead Stock: ${stats.deadStockProducts} (<10% velocity)`);
  console.log(`  📈 Category Surges: ${stats.categorySurges}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (stats.anomalies.length > 0) {
    console.log("📋 Detected Anomalies:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    stats.anomalies.slice(0, 10).forEach((anomaly, index) => {
      const typeIcon = {
        viral: "🔥",
        accelerating: "⚡",
        dead_stock: "📦",
        category_surge: "📈",
      }[anomaly.type];

      console.log(`\n  ${index + 1}. ${typeIcon} ${anomaly.type.toUpperCase()}`);
      console.log(`     Product: ${anomaly.productTitle}`);
      console.log(`     SKU: ${anomaly.sku}`);
      console.log(`     Change: ${anomaly.percentChange > 0 ? "+" : ""}${anomaly.percentChange.toFixed(0)}%`);
      console.log(`     Severity: ${anomaly.severity.toUpperCase()}`);
      console.log(`     Impact: ${anomaly.impact}`);
      console.log(`     💡 ${anomaly.recommendation}`);
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } else {
    console.log("✅ No velocity anomalies detected - all sales patterns normal!\n");
  }

  // Test 2: Get viral products
  console.log("🔥 Test 2: Getting viral products (top performers)...");
  const viralProducts = await getViralProducts(shop, 5);

  if (viralProducts.length > 0) {
    console.log("\n🔥 Viral Products:");
    viralProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.productTitle} (${product.sku})`);
      console.log(`     Velocity: +${product.percentChange.toFixed(0)}%`);
      console.log(`     Current: ${product.currentVelocity.toFixed(2)} units/hour`);
    });
    console.log();
  } else {
    console.log("  No viral products detected\n");
  }

  // Test 3: Get dead stock candidates
  console.log("📦 Test 3: Getting dead stock candidates...");
  const deadStock = await getDeadStockCandidates(shop, 5);

  if (deadStock.length > 0) {
    console.log("\n📦 Dead Stock Candidates:");
    deadStock.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.productTitle} (${product.sku})`);
      console.log(`     Velocity: ${product.percentChange.toFixed(0)}%`);
      console.log(`     Current: ${product.currentVelocity.toFixed(2)} units/hour`);
    });
    console.log();
  } else {
    console.log("  No dead stock detected\n");
  }

  // Test 4: Get velocity summary for dashboard
  console.log("📊 Test 4: Getting velocity summary for dashboard...");
  const summary = await getVelocitySummary(shop);

  console.log("\n⚡ Velocity Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Total Anomalies: ${summary.totalAnomalies}`);
  console.log(`  Critical: ${summary.criticalAnomalies}`);
  console.log(`  High Priority: ${summary.highAnomalies}`);
  console.log(`  Viral: ${summary.viralProducts}`);
  console.log(`  Accelerating: ${summary.acceleratingProducts}`);
  console.log(`  Dead Stock: ${summary.deadStockProducts}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Test 5: Get category performance
  console.log("📈 Test 5: Getting category performance overview...");
  const categories = await getCategoryPerformance(shop);

  if (categories.length > 0) {
    console.log("\n📈 Category Performance:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Category                  | Status     | Change    | SKUs");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    categories.slice(0, 10).forEach((category) => {
      const name = category.category.substring(0, 25).padEnd(25);
      const status = category.status.padEnd(10);
      const change = `${category.percentChange > 0 ? "+" : ""}${category.percentChange.toFixed(0)}%`.padStart(9);
      const skus = category.skuCount.toString().padStart(4);

      console.log(`${name} | ${status} | ${change} | ${skus}`);
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } else {
    console.log("  No category data available\n");
  }

  // Summary
  console.log("✅ All velocity anomaly tests completed successfully!");
  console.log("\n💡 Next Steps:");
  console.log("  1. Start your dev server: npm run dev");
  console.log("  2. Navigate to: /app/war-room");
  console.log("  3. Verify velocity anomaly alerts display correctly\n");

  await db.$disconnect();
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
