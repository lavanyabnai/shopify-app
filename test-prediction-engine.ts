/**
 * Test script for Prediction Engine and Stockout Countdown services
 *
 * Run with: npx tsx test-prediction-engine.ts
 */

import { PrismaClient } from "@prisma/client";
import { generatePredictions, getPredictionSummary } from "./app/services/prediction-engine.server";
import {
  calculateStockoutCountdowns,
  getCountdownSummary,
  getCriticalCountdowns,
  formatCountdown,
} from "./app/services/stockout-countdown.server";

const db = new PrismaClient();

async function main() {
  console.log("🧪 Testing Prediction Engine & Stockout Countdown\n");

  // Get a shop to test with
  const session = await db.session.findFirst();
  if (!session) {
    console.error("❌ No session found in database. Please run the app first.");
    process.exit(1);
  }

  const shop = session.shop;
  console.log(`📍 Testing with shop: ${shop}\n`);

  // Test 1: Generate predictions
  console.log("🔮 Test 1: Generating demand forecasts...");
  try {
    const predictions = await generatePredictions(shop);
    console.log(`✅ Generated predictions successfully!\n`);
    console.log("📊 Prediction Summary:");
    console.log("━".repeat(60));
    console.log(`  Total SKUs: ${predictions.totalSKUs}`);
    console.log(`  Critical (4h): ${predictions.criticalSKUs}`);
    console.log(`  High Risk (24h): ${predictions.highRiskSKUs}`);
    console.log(`  Category Forecasts: ${predictions.categoryForecasts.length}`);
    console.log("━".repeat(60));

    if (predictions.predictions.length > 0) {
      console.log(`\n📈 Top 3 Critical Predictions:\n`);
      predictions.predictions.slice(0, 3).forEach((pred, index) => {
        console.log(`  ${index + 1}. ${pred.productTitle} (${pred.sku})`);
        console.log(`     Current Stock: ${pred.currentStock} units`);
        console.log(`     Burn Rate: ${pred.burnRate.toFixed(1)} units/hr`);
        console.log(`     4h Forecast:`);
        console.log(`       - Best: ${pred.predictions["4h"].scenarios.best.expectedDemand} units`);
        console.log(`       - Likely: ${pred.predictions["4h"].scenarios.likely.expectedDemand} units`);
        console.log(`       - Worst: ${pred.predictions["4h"].scenarios.worst.expectedDemand} units`);
        console.log(`       - Stockout Risk: ${pred.predictions["4h"].scenarios.likely.stockoutRisk}%`);
        console.log(``);
      });
    }

    if (predictions.categoryForecasts.length > 0) {
      console.log(`📊 Category Forecasts:\n`);
      predictions.categoryForecasts.forEach((cat) => {
        console.log(`  ${cat.category}:`);
        console.log(`    Current Velocity: ${cat.currentVelocity.toFixed(1)} units/hr`);
        console.log(`    24h Forecast: ${cat.predicted24h.toFixed(0)} units`);
        console.log(`    72h Forecast: ${cat.predicted72h.toFixed(0)} units`);
        console.log(`    Trend: ${cat.trend} (${cat.confidence}% confidence)`);
        console.log(``);
      });
    }
  } catch (error) {
    console.error("❌ Prediction generation failed:", error);
  }

  console.log("\n" + "━".repeat(60) + "\n");

  // Test 2: Calculate stockout countdowns
  console.log("⏱️  Test 2: Calculating stockout countdowns...");
  try {
    const countdowns = await calculateStockoutCountdowns(shop);
    console.log(`✅ Calculated countdowns successfully!\n`);
    console.log("⏱️  Countdown Summary:");
    console.log("━".repeat(60));
    console.log(`  Total SKUs: ${countdowns.totalSKUs}`);
    console.log(`  🚨 Critical (<4h): ${countdowns.criticalCount}`);
    console.log(`  ⚠️  Urgent (4-12h): ${countdowns.urgentCount}`);
    console.log(`  ⚡ Warning (12-24h): ${countdowns.warningCount}`);
    console.log(`  👀 Watch (24-72h): ${countdowns.watchCount}`);
    console.log("━".repeat(60));

    if (countdowns.countdowns.length > 0) {
      console.log(`\n⏳ Top 5 Countdowns:\n`);
      countdowns.countdowns.slice(0, 5).forEach((countdown, index) => {
        console.log(`  ${index + 1}. ${countdown.productTitle} (${countdown.sku})`);
        console.log(`     Available Stock: ${countdown.availableStock} units`);
        console.log(`     Allocated: ${countdown.allocatedStock} units`);
        console.log(`     Burn Rate: ${countdown.adjustedBurnRate.toFixed(2)} units/hr`);
        console.log(`     Time Until Stockout: ${formatCountdown(countdown)}`);
        console.log(`     Status: ${countdown.status}`);
        console.log(`     Confidence: ${countdown.confidence}%`);
        console.log(``);
      });
    }
  } catch (error) {
    console.error("❌ Countdown calculation failed:", error);
  }

  console.log("\n" + "━".repeat(60) + "\n");

  // Test 3: Get prediction summary for dashboard
  console.log("📊 Test 3: Getting prediction summary for dashboard...");
  try {
    const summary = await getPredictionSummary(shop);
    console.log("✅ Prediction summary retrieved!\n");
    console.log("💰 Prediction Summary for Dashboard:");
    console.log("━".repeat(60));
    console.log(`  Total SKUs: ${summary.totalSKUs}`);
    console.log(`  Critical SKUs: ${summary.criticalSKUs}`);
    console.log(`  High Risk SKUs: ${summary.highRiskSKUs}`);
    console.log(`  Top 10 Critical: ${summary.top10Critical.length} products`);
    console.log(`  Category Forecasts: ${summary.categoryForecasts.length} categories`);
    console.log("━".repeat(60));
  } catch (error) {
    console.error("❌ Prediction summary failed:", error);
  }

  console.log("\n" + "━".repeat(60) + "\n");

  // Test 4: Get countdown summary for dashboard
  console.log("⏱️  Test 4: Getting countdown summary for dashboard...");
  try {
    const summary = await getCountdownSummary(shop);
    console.log("✅ Countdown summary retrieved!\n");
    console.log("⏳ Countdown Summary for Dashboard:");
    console.log("━".repeat(60));
    console.log(`  Total SKUs: ${summary.totalSKUs}`);
    console.log(`  Critical: ${summary.criticalCount}`);
    console.log(`  Urgent: ${summary.urgentCount}`);
    console.log(`  Warning: ${summary.warningCount}`);
    console.log(`  Watch: ${summary.watchCount}`);
    console.log(`  Top Critical: ${summary.topCritical.length} products`);
    console.log("━".repeat(60));
  } catch (error) {
    console.error("❌ Countdown summary failed:", error);
  }

  console.log("\n" + "━".repeat(60) + "\n");

  // Test 5: Get critical countdowns only
  console.log("🚨 Test 5: Getting only critical countdowns (<4h)...");
  try {
    const critical = await getCriticalCountdowns(shop, 5);
    if (critical.length > 0) {
      console.log(`✅ Found ${critical.length} critical countdowns!\n`);
      critical.forEach((countdown, index) => {
        console.log(`  ${index + 1}. ${countdown.productTitle} (${countdown.sku})`);
        console.log(`     Time Left: ${formatCountdown(countdown)}`);
        console.log(`     Status: ${countdown.status}`);
        console.log(``);
      });
    } else {
      console.log("✅ No critical stockouts predicted - all inventory levels healthy!\n");
    }
  } catch (error) {
    console.error("❌ Critical countdowns failed:", error);
  }

  console.log("\n✅ All prediction engine tests completed successfully!\n");
  console.log("💡 Next Steps:");
  console.log("  1. Start your dev server: npm run dev");
  console.log("  2. Navigate to: /app/war-room");
  console.log("  3. Verify prediction panel displays correctly");
  console.log("  4. Check countdown timers are counting down");
  console.log("  5. Verify 4h/24h/72h forecasts show scenarios");
  console.log("  6. Test Redis cache (refresh page - should be faster)\n");

  await db.$disconnect();
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
