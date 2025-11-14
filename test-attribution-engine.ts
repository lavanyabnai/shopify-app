/**
 * Attribution Engine Test Script
 *
 * Tests the attribution engine service:
 * - Decision logging
 * - Counterfactual analysis
 * - Success pattern identification
 * - Model accuracy tracking
 * - Continuous improvement metrics
 *
 * Session 8 - BFCM War Room
 */

import { PrismaClient } from "@prisma/client";

import {
  logDecision,
  updateDecisionOutcome,
  getDecisionAuditTrail,
  analyzeCounterfactual,
  analyzeAllCounterfactuals,
  identifySuccessPatterns,
  trackModelAccuracy,
  getContinuousImprovementMetrics,
  generateAttributionReport,
} from "./app/services/attribution-engine.server.js";

const db = new PrismaClient();

const TEST_SHOP = "test-shop.myshopify.com";

console.log("🧪 Attribution Engine Test Suite");
console.log("================================\n");

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ========================================================================
    // Test 1: Log Decision
    // ========================================================================
    console.log("============================================================");
    console.log("Test 1: Log Decision");
    console.log("============================================================");

    const startTime1 = Date.now();
    const decisionId = await logDecision(
      TEST_SHOP,
      "action_executed",
      {
        actionType: "transfer",
        productId: "test-product-123",
        fromLocation: "warehouse-a",
        toLocation: "warehouse-b",
        quantity: 100,
      },
      {
        defconLevel: 2,
        riskScore: 75,
        timestamp: new Date().toISOString(),
      }
    );
    const time1 = Date.now() - startTime1;

    console.log(`✅ Decision logged in ${time1}ms`);
    console.log(`   Decision ID: ${decisionId}`);

    if (time1 < 100) {
      console.log("\n⏱️  PASS: Execution time <100ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time1}ms (target: <100ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 2: Update Decision Outcome
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 2: Update Decision Outcome");
    console.log("============================================================");

    const startTime2 = Date.now();
    await updateDecisionOutcome(
      decisionId,
      {
        transferCompleted: true,
        itemsReceived: 100,
        timeToComplete: "2 hours",
      },
      true,
      85
    );
    const time2 = Date.now() - startTime2;

    console.log(`✅ Decision outcome updated in ${time2}ms`);
    console.log(`   Success: true`);
    console.log(`   Impact Score: 85`);

    if (time2 < 100) {
      console.log("\n⏱️  PASS: Execution time <100ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time2}ms (target: <100ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 3: Get Decision Audit Trail
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 3: Get Decision Audit Trail");
    console.log("============================================================");

    const startTime3 = Date.now();
    const auditTrail = await getDecisionAuditTrail(TEST_SHOP, 50);
    const time3 = Date.now() - startTime3;

    console.log(`✅ Audit trail retrieved in ${time3}ms`);
    console.log(`   Total Decisions: ${auditTrail.length}`);

    if (auditTrail.length > 0) {
      console.log(`\n   Latest Decision:`);
      console.log(`   - ID: ${auditTrail[0].id}`);
      console.log(`   - Type: ${auditTrail[0].decisionType}`);
      console.log(`   - Success: ${auditTrail[0].success}`);
      console.log(`   - Impact Score: ${auditTrail[0].impactScore}`);
    }

    if (time3 < 100) {
      console.log("\n⏱️  PASS: Execution time <100ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time3}ms (target: <100ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 4: Analyze Counterfactual
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 4: Analyze Counterfactual (Single Action)");
    console.log("============================================================");

    // Get an executed action
    const actions = await db.executedAction.findMany({
      where: { shop: TEST_SHOP },
      take: 1,
    });

    if (actions.length > 0) {
      const startTime4 = Date.now();
      const analysis = await analyzeCounterfactual(actions[0].id);
      const time4 = Date.now() - startTime4;

      console.log(`✅ Counterfactual analyzed in ${time4}ms`);
      console.log(`\n   Actual Outcome:`);
      console.log(`   - Revenue: $${analysis.actualOutcome.revenue.toFixed(2)}`);
      console.log(`   - Cost: $${analysis.actualOutcome.cost.toFixed(2)}`);
      console.log(`   - Net ROI: $${analysis.actualOutcome.netROI.toFixed(2)}`);
      console.log(`\n   Counterfactual (Without Action):`);
      console.log(`   - Est. Revenue: $${analysis.counterfactual.estimatedRevenue.toFixed(2)}`);
      console.log(`   - Est. Cost: $${analysis.counterfactual.estimatedCost.toFixed(2)}`);
      console.log(`   - Est. Net ROI: $${analysis.counterfactual.estimatedNetROI.toFixed(2)}`);
      console.log(`\n   Value Created:`);
      console.log(`   - Revenue Difference: $${analysis.difference.revenue.toFixed(2)}`);
      console.log(`   - Cost Savings: $${analysis.difference.cost.toFixed(2)}`);
      console.log(`   - Net ROI Improvement: $${analysis.difference.netROI.toFixed(2)}`);

      if (time4 < 100) {
        console.log("\n⏱️  PASS: Execution time <100ms target");
        testsPassed++;
      } else {
        console.log(`\n⏱️  SLOW: Execution time ${time4}ms (target: <100ms)`);
        testsFailed++;
      }
    } else {
      console.log("⚠️  SKIP: No actions found for counterfactual analysis");
    }

    // ========================================================================
    // Test 5: Analyze All Counterfactuals
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 5: Analyze All Counterfactuals");
    console.log("============================================================");

    const startTime5 = Date.now();
    const allAnalyses = await analyzeAllCounterfactuals(TEST_SHOP, 20);
    const time5 = Date.now() - startTime5;

    console.log(`✅ All counterfactuals analyzed in ${time5}ms`);
    console.log(`   Total Analyses: ${allAnalyses.length}`);

    if (allAnalyses.length > 0) {
      const totalValueCreated = allAnalyses.reduce(
        (sum, a) => sum + a.difference.netROI,
        0
      );
      console.log(`   Total Value Created: $${totalValueCreated.toFixed(2)}`);
    }

    if (time5 < 500) {
      console.log("\n⏱️  PASS: Execution time <500ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time5}ms (target: <500ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 6: Identify Success Patterns
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 6: Identify Success Patterns");
    console.log("============================================================");

    const startTime6 = Date.now();
    const patterns = await identifySuccessPatterns(TEST_SHOP);
    const time6 = Date.now() - startTime6;

    console.log(`✅ Success patterns identified in ${time6}ms`);
    console.log(`   Total Patterns: ${patterns.length}`);

    for (const pattern of patterns.slice(0, 5)) {
      console.log(`\n   Pattern: ${pattern.pattern}`);
      console.log(`   - Description: ${pattern.description}`);
      console.log(`   - Occurrences: ${pattern.occurrences}`);
      console.log(`   - Avg Impact: $${pattern.avgImpact.toFixed(2)}`);
      console.log(`   - Success Rate: ${pattern.successRate.toFixed(1)}%`);
    }

    if (time6 < 200) {
      console.log("\n⏱️  PASS: Execution time <200ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time6}ms (target: <200ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 7: Track Model Accuracy
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 7: Track Model Accuracy");
    console.log("============================================================");

    const startTime7 = Date.now();
    const accuracy = await trackModelAccuracy(TEST_SHOP, "prediction");
    const time7 = Date.now() - startTime7;

    console.log(`✅ Model accuracy tracked in ${time7}ms`);
    console.log(`\n   Model: ${accuracy.model}`);
    console.log(`   Predictions: ${accuracy.predictions}`);
    console.log(`   Correct: ${accuracy.correct}`);
    console.log(`   Accuracy: ${accuracy.accuracy.toFixed(1)}%`);
    console.log(`   MAE: ${accuracy.mae.toFixed(2)}`);
    console.log(`   RMSE: ${accuracy.rmse.toFixed(2)}`);

    if (time7 < 200) {
      console.log("\n⏱️  PASS: Execution time <200ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time7}ms (target: <200ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 8: Get Continuous Improvement Metrics
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 8: Get Continuous Improvement Metrics");
    console.log("============================================================");

    const startTime8 = Date.now();
    const improvements = await getContinuousImprovementMetrics(TEST_SHOP);
    const time8 = Date.now() - startTime8;

    console.log(`✅ Improvement metrics calculated in ${time8}ms`);
    console.log(`   Metrics Tracked: ${improvements.length}`);

    for (const metric of improvements) {
      console.log(`\n   ${metric.metric}:`);
      console.log(`   - Baseline: ${metric.baseline.toFixed(2)}`);
      console.log(`   - Current: ${metric.current.toFixed(2)}`);
      console.log(`   - Improvement: ${metric.improvement >= 0 ? "+" : ""}${metric.improvement.toFixed(2)}`);
      console.log(`   - Trend: ${metric.trend}`);
    }

    if (time8 < 500) {
      console.log("\n⏱️  PASS: Execution time <500ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time8}ms (target: <500ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 9: Generate Attribution Report
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 9: Generate Comprehensive Attribution Report");
    console.log("============================================================");

    const startTime9 = Date.now();
    const report = await generateAttributionReport(TEST_SHOP);
    const time9 = Date.now() - startTime9;

    console.log(`✅ Attribution report generated in ${time9}ms`);
    console.log(`\n   Report Contents:`);
    console.log(`   - Decision Audit Trail: ${report.decisionAuditTrail.length} entries`);
    console.log(`   - Counterfactual Analyses: ${report.counterfactualAnalyses.length} analyses`);
    console.log(`   - Success Patterns: ${report.successPatterns.length} patterns`);
    console.log(`   - Model Accuracy:`);
    console.log(`     - DEFCON: ${report.modelAccuracy.defcon.accuracy.toFixed(1)}%`);
    console.log(`     - Revenue Risk: ${report.modelAccuracy.revenueRisk.accuracy.toFixed(1)}%`);
    console.log(`     - Velocity: ${report.modelAccuracy.velocity.accuracy.toFixed(1)}%`);
    console.log(`     - Prediction: ${report.modelAccuracy.prediction.accuracy.toFixed(1)}%`);
    console.log(`   - Continuous Improvement: ${report.continuousImprovement.length} metrics`);

    if (time9 < 1000) {
      console.log("\n⏱️  PASS: Execution time <1000ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time9}ms (target: <1000ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Cleanup: Delete test decision
    // ========================================================================
    console.log("\n============================================================");
    console.log("Cleanup: Delete Test Decision");
    console.log("============================================================");

    await db.alertLog.delete({
      where: { id: decisionId },
    });
    console.log(`✅ Test decision deleted: ${decisionId}`);

    // ========================================================================
    // Summary
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test Summary");
    console.log("============================================================");
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
    console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
      console.log("\n🎉 All tests passed!");
    } else {
      console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    }
  } catch (error) {
    console.error("\n❌ Test execution failed:", error);
    testsFailed++;
  }

  process.exit(testsFailed === 0 ? 0 : 1);
}

runTests();
