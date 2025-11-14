/**
 * ROI Tracker Test Script
 *
 * Tests the ROI tracking service:
 * - Calculate ROI metrics
 * - Get action impacts
 * - Time series ROI data
 * - Category breakdown
 * - ROI comparison
 *
 * Session 8 - BFCM War Room
 */

import { PrismaClient } from "@prisma/client";

import {
  calculateROIMetrics,
  getActionImpacts,
  getTimeSeriesROI,
  getCategoryBreakdown,
  generateROIReport,
  getROIComparison,
  updateActionImpact,
} from "./app/services/roi-tracker.server.js";

const db = new PrismaClient();

const TEST_SHOP = "test-shop.myshopify.com";

console.log("🧪 ROI Tracker Test Suite");
console.log("================================\n");

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ========================================================================
    // Test 1: Calculate ROI Metrics (Total)
    // ========================================================================
    console.log("============================================================");
    console.log("Test 1: Calculate ROI Metrics (Total)");
    console.log("============================================================");

    const startTime1 = Date.now();
    const totalMetrics = await calculateROIMetrics(TEST_SHOP, "total");
    const time1 = Date.now() - startTime1;

    console.log(`✅ ROI metrics calculated in ${time1}ms`);
    console.log(`   Total Value: $${totalMetrics.totalValue.toFixed(2)}`);
    console.log(`   Revenue Saved: $${totalMetrics.revenueSaved.toFixed(2)}`);
    console.log(`   Margin Protected: $${totalMetrics.marginProtected.toFixed(2)}`);
    console.log(`   Opportunity Captured: $${totalMetrics.opportunityCaptured.toFixed(2)}`);
    console.log(`   Action Count: ${totalMetrics.actionCount}`);
    console.log(`   Avg ROI per Action: $${totalMetrics.avgROIPerAction.toFixed(2)}`);

    if (time1 < 200) {
      console.log("\n⏱️  PASS: Execution time <200ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time1}ms (target: <200ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 2: Calculate ROI Metrics (Hourly)
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 2: Calculate ROI Metrics (Hourly)");
    console.log("============================================================");

    const startTime2 = Date.now();
    const hourlyMetrics = await calculateROIMetrics(TEST_SHOP, "hourly");
    const time2 = Date.now() - startTime2;

    console.log(`✅ Hourly metrics calculated in ${time2}ms`);
    console.log(`   Total Value: $${hourlyMetrics.totalValue.toFixed(2)}`);
    console.log(`   Action Count: ${hourlyMetrics.actionCount}`);

    if (time2 < 200) {
      console.log("\n⏱️  PASS: Execution time <200ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time2}ms (target: <200ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 3: Get Action Impacts
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 3: Get Action Impacts");
    console.log("============================================================");

    const startTime3 = Date.now();
    const actionImpacts = await getActionImpacts(TEST_SHOP, 10);
    const time3 = Date.now() - startTime3;

    console.log(`✅ Action impacts retrieved in ${time3}ms`);
    console.log(`   Total Actions: ${actionImpacts.length}`);

    if (actionImpacts.length > 0) {
      console.log(`\n   Sample Action:`);
      console.log(`   - Type: ${actionImpacts[0].actionType}`);
      console.log(`   - Category: ${actionImpacts[0].category}`);
      console.log(`   - Estimated Impact: $${actionImpacts[0].estimatedImpact.toFixed(2)}`);
      console.log(`   - Net ROI: $${actionImpacts[0].netROI.toFixed(2)}`);
    }

    if (time3 < 100) {
      console.log("\n⏱️  PASS: Execution time <100ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time3}ms (target: <100ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 4: Get Time Series ROI
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 4: Get Time Series ROI (24 hours)");
    console.log("============================================================");

    const startTime4 = Date.now();
    const timeSeries = await getTimeSeriesROI(TEST_SHOP, 24);
    const time4 = Date.now() - startTime4;

    console.log(`✅ Time series retrieved in ${time4}ms`);
    console.log(`   Data Points: ${timeSeries.length}`);

    if (timeSeries.length > 0) {
      console.log(`\n   Latest Data Point:`);
      console.log(`   - Timestamp: ${timeSeries[timeSeries.length - 1].timestamp}`);
      console.log(`   - Revenue Saved: $${timeSeries[timeSeries.length - 1].revenueSaved.toFixed(2)}`);
      console.log(`   - Cumulative Value: $${timeSeries[timeSeries.length - 1].cumulativeValue.toFixed(2)}`);
    }

    if (time4 < 200) {
      console.log("\n⏱️  PASS: Execution time <200ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time4}ms (target: <200ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 5: Get Category Breakdown
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 5: Get Category Breakdown");
    console.log("============================================================");

    const startTime5 = Date.now();
    const categoryBreakdown = await getCategoryBreakdown(TEST_SHOP);
    const time5 = Date.now() - startTime5;

    console.log(`✅ Category breakdown retrieved in ${time5}ms`);
    console.log(`   Categories: ${categoryBreakdown.length}`);

    for (const category of categoryBreakdown) {
      console.log(`   - ${category.category}: $${category.value.toFixed(2)} (${category.percentage.toFixed(1)}%, ${category.actionCount} actions)`);
    }

    if (time5 < 200) {
      console.log("\n⏱️  PASS: Execution time <200ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time5}ms (target: <200ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 6: Generate ROI Report
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 6: Generate Comprehensive ROI Report");
    console.log("============================================================");

    const startTime6 = Date.now();
    const report = await generateROIReport(TEST_SHOP);
    const time6 = Date.now() - startTime6;

    console.log(`✅ ROI report generated in ${time6}ms`);
    console.log(`\n   Summary:`);
    console.log(`   - Total Value: $${report.summary.totalValue.toFixed(2)}`);
    console.log(`   - Actions: ${report.summary.actionCount}`);
    console.log(`\n   Breakdown:`);
    console.log(`   - Hourly: $${report.hourly.totalValue.toFixed(2)}`);
    console.log(`   - Daily: $${report.daily.totalValue.toFixed(2)}`);
    console.log(`   - Weekly: $${report.weekly.totalValue.toFixed(2)}`);
    console.log(`\n   Top Actions: ${report.topActions.length}`);
    console.log(`   Time Series Points: ${report.timeSeries.length}`);
    console.log(`   Categories: ${report.categoryBreakdown.length}`);

    if (time6 < 500) {
      console.log("\n⏱️  PASS: Execution time <500ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time6}ms (target: <500ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 7: Get ROI Comparison
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 7: Get ROI Comparison (With vs. Without War Room)");
    console.log("============================================================");

    const startTime7 = Date.now();
    const comparison = await getROIComparison(TEST_SHOP);
    const time7 = Date.now() - startTime7;

    console.log(`✅ ROI comparison calculated in ${time7}ms`);
    console.log(`\n   With War Room: $${comparison.withWarRoom.toFixed(2)}`);
    console.log(`   Without War Room (Est.): $${comparison.withoutWarRoom.toFixed(2)}`);
    console.log(`   Improvement: $${comparison.improvement.toFixed(2)}`);
    console.log(`   Improvement %: ${comparison.improvementPercentage.toFixed(1)}%`);

    if (time7 < 200) {
      console.log("\n⏱️  PASS: Execution time <200ms target");
      testsPassed++;
    } else {
      console.log(`\n⏱️  SLOW: Execution time ${time7}ms (target: <200ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Test 8: Update Action Impact
    // ========================================================================
    console.log("\n============================================================");
    console.log("Test 8: Update Action Impact");
    console.log("============================================================");

    // First, get an action to update
    const actions = await db.executedAction.findMany({
      where: { shop: TEST_SHOP },
      take: 1,
    });

    if (actions.length > 0) {
      const startTime8 = Date.now();
      await updateActionImpact(actions[0].id, 5000, 1000);
      const time8 = Date.now() - startTime8;

      console.log(`✅ Action impact updated in ${time8}ms`);
      console.log(`   Action ID: ${actions[0].id}`);
      console.log(`   Updated Revenue: $5000`);
      console.log(`   Updated Cost: $1000`);
      console.log(`   Net ROI: $4000`);

      if (time8 < 100) {
        console.log("\n⏱️  PASS: Execution time <100ms target");
        testsPassed++;
      } else {
        console.log(`\n⏱️  SLOW: Execution time ${time8}ms (target: <100ms)`);
        testsFailed++;
      }
    } else {
      console.log("⚠️  SKIP: No actions found to update");
    }

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
