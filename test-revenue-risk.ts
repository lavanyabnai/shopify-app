/**
 * Test script for Revenue Risk Calculator
 *
 * Usage: npx tsx test-revenue-risk.ts
 */

import db from "./app/db.server";
import {
  calculateRevenueRisk,
  getTopAtRiskProducts,
  getRevenueRiskSummary,
} from "./app/services/revenue-risk.server";

async function main() {
  console.log("🧪 Testing Revenue Risk Calculator\n");

  // Get shop from first session
  const session = await db.session.findFirst();

  if (!session) {
    console.error("❌ No session found. Please authenticate with Shopify first.");
    process.exit(1);
  }

  const shop = session.shop;
  console.log(`📍 Testing with shop: ${shop}\n`);

  // Test 1: Calculate revenue at risk
  console.log("💰 Test 1: Calculating revenue at risk for all time windows...");
  const risks = await calculateRevenueRisk(shop);

  console.log("\n📊 Revenue At Risk Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  risks.forEach((risk) => {
    console.log(`\n  ${risk.window} Window:`);
    console.log(`  Total Revenue at Risk: $${risk.totalRevenue.toFixed(2)}`);
    console.log(`  Expected Loss: $${risk.expectedLoss.toFixed(2)}`);
    console.log(`  Lost Sale Probability: ${(risk.lostSaleProbability * 100).toFixed(1)}%`);
    console.log(`  Affected SKUs: ${risk.affectedSKUs}`);

    if (risk.breakdown.length > 0) {
      console.log(`\n  Top 3 At-Risk Products:`);
      risk.breakdown.slice(0, 3).forEach((item, index) => {
        console.log(`    ${index + 1}. ${item.sku} - ${item.productTitle}`);
        console.log(`       Revenue Risk: $${item.revenueAtRisk.toFixed(2)}`);
        console.log(`       Expected Loss: $${item.expectedLoss.toFixed(2)}`);
        console.log(`       Coverage: ${item.coverageHours.toFixed(1)}h`);
        console.log(`       Urgency: ${item.urgency.toUpperCase()}`);
      });
    }
  });

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Test 2: Get top at-risk products
  console.log("🎯 Test 2: Getting top 10 at-risk products...");
  const topProducts = await getTopAtRiskProducts(shop, 10);

  if (topProducts.length > 0) {
    console.log("\n📦 Top At-Risk Products:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      "Rank | SKU            | Product                  | Coverage | Revenue Risk | Urgency"
    );
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    topProducts.forEach((product) => {
      const sku = product.sku.padEnd(15);
      const title = product.productTitle.substring(0, 25).padEnd(25);
      const coverage = `${product.hoursUntilStockout.toFixed(1)}h`.padStart(8);
      const revenue = `$${product.revenueAtRisk.toFixed(0)}`.padStart(12);
      const urgency = product.urgency.padEnd(8);

      console.log(
        `${product.rank.toString().padStart(4)} | ${sku} | ${title} | ${coverage} | ${revenue} | ${urgency}`
      );
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } else {
    console.log("✅ No products currently at risk!\n");
  }

  // Test 3: Get revenue risk summary
  console.log("📊 Test 3: Getting revenue risk summary for dashboard...");
  const summary = await getRevenueRiskSummary(shop);

  console.log("\n💰 Revenue Risk Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  24h: $${summary["24h"].expectedLoss.toFixed(2)} loss (${summary["24h"].affectedSKUs} SKUs)`);
  console.log(`  48h: $${summary["48h"].expectedLoss.toFixed(2)} loss (${summary["48h"].affectedSKUs} SKUs)`);
  console.log(`  72h: $${summary["72h"].expectedLoss.toFixed(2)} loss (${summary["72h"].affectedSKUs} SKUs)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Summary
  console.log("✅ All revenue risk tests completed successfully!");
  console.log("\n💡 Next Steps:");
  console.log("  1. Start your dev server: npm run dev");
  console.log("  2. Navigate to: /app/war-room");
  console.log("  3. Verify revenue at risk cards display correctly\n");

  await db.$disconnect();
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
