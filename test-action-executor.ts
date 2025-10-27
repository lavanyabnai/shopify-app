/**
 * Test Action Executor (Sandbox Mode)
 *
 * Tests action execution and rollback without making real changes
 */

import db from "./app/db.server";
import {
  getPendingRecommendations,
} from "./app/services/recommendation-engine.server";
import {
  executeAction,
  rollbackAction,
  getRecentExecutions,
} from "./app/services/action-executor.server";

async function testActionExecutor() {
  console.log("🧪 Testing Action Executor (Sandbox Mode)\n");

  // Check for sandbox mode flag
  const isSandbox = process.argv.includes("--sandbox");
  if (!isSandbox) {
    console.log("⚠️  WARNING: This test will execute actions in SANDBOX mode only.");
    console.log("   Add --sandbox flag to run: npx tsx test-action-executor.ts --sandbox\n");
    return;
  }

  // Get first shop from database
  const session = await db.session.findFirst();
  if (!session) {
    console.error("❌ No shop found in database. Please sync first.");
    return;
  }

  const shop = session.shop;
  console.log(`📍 Testing with shop: ${shop}`);
  console.log(`🔒 Sandbox Mode: ENABLED (no real changes will be made)\n`);

  // Test 1: Get pending recommendations
  console.log("📥 Test 1: Getting pending recommendations...");
  const pending = await getPendingRecommendations(shop);

  if (pending.length === 0) {
    console.log("ℹ️  No pending recommendations found.");
    console.log("   Run: npx tsx test-recommendations.ts first to generate recommendations\n");
    return;
  }

  console.log(`✅ Found ${pending.length} pending recommendations\n`);

  // Test 2: Execute first 3 actions
  const actionsToExecute = pending.slice(0, Math.min(3, pending.length));
  console.log(`🚀 Test 2: Executing ${actionsToExecute.length} actions in sandbox mode...\n`);

  const executionResults = [];

  for (const action of actionsToExecute) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Executing: ${formatActionType(action.type)}`);
    console.log(`Priority: ${action.priority}/10 | Urgency: ${action.urgency.toUpperCase()}`);
    console.log(`Reason: ${action.reason}`);
    console.log(`Details: ${formatActionDetails(action)}`);
    console.log("");

    const result = await executeAction(
      action.id!,
      "test-user",
      null, // No Shopify admin in test
      true // Sandbox mode
    );

    executionResults.push({ action, result });

    if (result.success) {
      console.log(`✅ Execution Result: ${result.result}`);
      console.log(`   Message: ${result.message}`);
      console.log(`   Executed Action ID: ${result.executedActionId}`);
      console.log(`   Can Rollback: ${result.canRollback ? "Yes" : "No"}`);
    } else {
      console.log(`❌ Execution Failed: ${result.message}`);
    }

    console.log("");
  }

  console.log("✅ All actions executed!\n");

  // Test 3: Get execution history
  console.log("📜 Test 3: Getting execution history...");
  const history = await getRecentExecutions(shop, 10);
  console.log(`✅ Retrieved ${history.length} recent executions\n`);

  console.log("📊 Recent Execution History:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  history.slice(0, 5).forEach((exec: any, i: number) => {
    const timestamp = new Date(exec.executedAt).toLocaleString();
    console.log(`  ${i + 1}. ${formatActionType(exec.recommendation.type)}`);
    console.log(`     Result: ${exec.result} | Executed: ${timestamp}`);
    console.log(`     Message: ${exec.resultMessage}`);
    console.log(`     Can Rollback: ${exec.canRollback ? "Yes" : "No"}`);
    console.log("");
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Test 4: Rollback first action (if possible)
  const rollbackCandidate = executionResults.find(
    (er) => er.result.success && er.result.canRollback
  );

  if (rollbackCandidate && rollbackCandidate.result.executedActionId) {
    console.log("🔄 Test 4: Testing rollback functionality...");
    console.log(`   Rolling back: ${formatActionType(rollbackCandidate.action.type)}\n`);

    const rollbackResult = await rollbackAction(
      rollbackCandidate.result.executedActionId,
      "Test rollback",
      "test-user",
      null, // No Shopify admin in test
      true // Sandbox mode
    );

    if (rollbackResult.success) {
      console.log(`✅ Rollback Result: ${rollbackResult.result}`);
      console.log(`   Message: ${rollbackResult.message}\n`);
    } else {
      console.log(`❌ Rollback Failed: ${rollbackResult.message}\n`);
    }
  } else {
    console.log("ℹ️  Test 4: No rollback-capable actions to test\n");
  }

  // Test 5: Execution summary stats
  console.log("📊 Test 5: Execution summary...");

  const successCount = executionResults.filter((er) => er.result.success).length;
  const failedCount = executionResults.filter((er) => !er.result.success).length;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Total Executed: ${executionResults.length}`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${failedCount}`);
  console.log(`  Success Rate: ${((successCount / executionResults.length) * 100).toFixed(1)}%`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("✅ All action executor tests completed successfully!\n");

  console.log("💡 Next Steps:");
  console.log("  1. Start your dev server: npm run dev");
  console.log("  2. Navigate to: /app/war-room/actions");
  console.log("  3. View executed actions in the UI");
  console.log("  4. Test one-click execution from the UI");
  console.log("  5. Test rollback from the UI\n");

  console.log("⚠️  Note: Sandbox mode is enabled. To execute real actions:");
  console.log("   - Remove sandbox flag in action-executor.server.ts");
  console.log("   - Ensure Shopify Admin API access is configured");
  console.log("   - Test with caution in production\n");
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

function formatActionDetails(action: any): string {
  const params = action.parameters;

  switch (action.type) {
    case "transfer":
      return `Transfer ${params.quantity} units from ${params.fromLocation} to ${params.toLocation}`;
    case "reorder":
      return `Order ${params.quantity} units from ${params.supplier} (${params.priority} priority)`;
    case "price_adjustment":
      const direction = params.priceChange > 0 ? "increase" : "decrease";
      return `${direction} price by ${Math.abs(params.priceChange)}% ($${params.currentPrice} → $${params.suggestedPrice.toFixed(2)})`;
    case "traffic_throttle":
      return `${params.action} to reduce traffic by ${params.targetReduction}%`;
    default:
      return JSON.stringify(params);
  }
}

// Run the test
testActionExecutor()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
