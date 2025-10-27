/**
 * Test Recommendation Engine
 *
 * Generates and validates recommendations based on current metrics
 */

import db from "./app/db.server";
import {
  generateRecommendations,
  saveRecommendations,
  getPendingRecommendations,
  getRecommendationsSummary,
} from "./app/services/recommendation-engine.server";

async function testRecommendationEngine() {
  console.log("🧪 Testing Recommendation Engine\n");

  // Get first shop from database
  const session = await db.session.findFirst();
  if (!session) {
    console.error("❌ No shop found in database. Please sync first.");
    return;
  }

  const shop = session.shop;
  console.log(`📍 Testing with shop: ${shop}\n`);

  // Test 1: Generate recommendations
  console.log("🔮 Test 1: Generating recommendations...");
  const startTime = Date.now();
  const recommendations = await generateRecommendations(shop);
  const duration = Date.now() - startTime;

  console.log(`✅ Generated ${recommendations.length} recommendations in ${duration}ms`);

  if (recommendations.length === 0) {
    console.log("ℹ️  No recommendations generated (inventory may be healthy)");
  } else {
    console.log(`\n📊 Recommendation Breakdown:`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const byType = recommendations.reduce((acc: any, rec) => {
      acc[rec.type] = (acc[rec.type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    const byUrgency = recommendations.reduce((acc: any, rec) => {
      acc[rec.urgency] = (acc[rec.urgency] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n  By Urgency:`);
    Object.entries(byUrgency).forEach(([urgency, count]) => {
      console.log(`    ${urgency}: ${count}`);
    });

    const totalROI = recommendations.reduce((sum, rec) => sum + rec.estimatedROI, 0);
    console.log(`\n  Total Estimated ROI: $${totalROI.toLocaleString()}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Show top 5 recommendations
    console.log("🎯 Top 5 Recommendations (by Priority & ROI):\n");
    recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.urgency.toUpperCase()}] ${formatActionType(rec.type)}`);
      console.log(`     Priority: ${rec.priority}/10 | Est. ROI: $${rec.estimatedROI.toLocaleString()} | Confidence: ${rec.confidence}%`);
      console.log(`     Reason: ${rec.reason}`);
      console.log(`     Details: ${formatActionDetails(rec)}`);
      console.log("");
    });
  }

  // Test 2: Save recommendations to database
  console.log("💾 Test 2: Saving recommendations to database...");
  await saveRecommendations(recommendations);
  console.log(`✅ Saved ${recommendations.length} recommendations\n`);

  // Test 3: Retrieve pending recommendations
  console.log("📥 Test 3: Retrieving pending recommendations...");
  const pending = await getPendingRecommendations(shop);
  console.log(`✅ Retrieved ${pending.length} pending recommendations\n`);

  // Test 4: Get summary
  console.log("📊 Test 4: Getting recommendations summary...");
  const summary = await getRecommendationsSummary(shop);
  console.log("✅ Summary retrieved!\n");

  console.log("📊 Recommendations Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Pending Actions: ${summary.pendingCount}`);
  console.log(`  Critical Actions: ${summary.criticalCount}`);
  console.log(`  Total Estimated ROI: $${summary.totalEstimatedROI.toLocaleString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("✅ All recommendation engine tests completed successfully!\n");

  console.log("💡 Next Steps:");
  console.log("  1. Run: npx tsx test-action-executor.ts --sandbox");
  console.log("  2. Start your dev server: npm run dev");
  console.log("  3. Navigate to: /app/war-room/actions");
  console.log("  4. Execute actions in sandbox mode");
  console.log("  5. Verify action history logs correctly\n");
}

function formatActionType(type: string): string {
  switch (type) {
    case "transfer":
      return "📦 Inventory Transfer";
    case "reorder":
      return "📝 Supplier Reorder";
    case "price_adjustment":
      return "💰 Price Adjustment";
    case "traffic_throttle":
      return "🚦 Traffic Control";
    default:
      return type;
  }
}

function formatActionDetails(rec: any): string {
  const params = rec.parameters;

  switch (rec.type) {
    case "transfer":
      return `Transfer ${params.quantity} units from ${params.fromLocation} to ${params.toLocation}`;
    case "reorder":
      return `Order ${params.quantity} units from ${params.supplier}`;
    case "price_adjustment":
      const direction = params.priceChange > 0 ? "increase" : "decrease";
      return `${direction} price by ${Math.abs(params.priceChange)}%`;
    case "traffic_throttle":
      return `${params.action} to reduce traffic by ${params.targetReduction}%`;
    default:
      return JSON.stringify(params);
  }
}

// Run the test
testRecommendationEngine()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
