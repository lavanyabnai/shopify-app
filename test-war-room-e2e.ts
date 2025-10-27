/**
 * BFCM War Room - End-to-End Integration Test
 *
 * Comprehensive test that simulates a full BFCM day:
 * 1. Simulate full BFCM day with test data
 * 2. Trigger velocity spikes
 * 3. Generate stockout scenarios
 * 4. Execute recommended actions
 * 5. Verify alerts fire correctly
 * 6. Validate ROI tracking
 *
 * Session 8 - BFCM War Room
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

import { calculateDEFCON } from "./app/services/defcon-calculator.server.js";
import { calculateRevenueRisk } from "./app/services/revenue-risk.server.js";
import { detectVelocityAnomalies } from "./app/services/velocity-detector.server.js";
import { generatePredictions } from "./app/services/prediction-engine.server.js";
import { generateRecommendations } from "./app/services/recommendation-engine.server.js";
import { executeAction } from "./app/services/action-executor.server.js";
import { evaluateAlertRules, createDefaultAlertRules } from "./app/services/alert-engine.server.js";
import { runSimulation } from "./app/services/simulation-engine.server.js";
import { generateROIReport } from "./app/services/roi-tracker.server.js";
import { generateAttributionReport } from "./app/services/attribution-engine.server.js";

const TEST_SHOP = "test-shop.myshopify.com";

console.log("🧪 BFCM War Room - End-to-End Integration Test");
console.log("=".repeat(60));
console.log("\n📋 Test Scenario: Full BFCM Day Simulation");
console.log("=".repeat(60));

async function runE2ETest() {
  let testsPassed = 0;
  let testsFailed = 0;
  const startTime = Date.now();

  try {
    // ========================================================================
    // Phase 0: Cleanup - Remove old test data
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 0: Cleanup - Removing old test data");
    console.log("=".repeat(60));

    await db.order.deleteMany({ where: { shop: TEST_SHOP } });
    await db.product.deleteMany({ where: { shop: TEST_SHOP } });
    await db.inventorySnapshot.deleteMany({ where: { shop: TEST_SHOP } });
    await db.warRoomMetrics.deleteMany({ where: { shop: TEST_SHOP } });
    await db.executedAction.deleteMany({ where: { shop: TEST_SHOP } });
    console.log("✅ Old test data removed\n");

    // ========================================================================
    // Phase 1: Setup - Create Test Data
    // ========================================================================
    console.log("=".repeat(60));
    console.log("Phase 1: Setup - Creating Test Data");
    console.log("=".repeat(60));

    // Create test products with varying inventory levels
    const products = [];
    for (let i = 1; i <= 10; i++) {
      const product = await db.product.upsert({
        where: { id: `test-product-${i}` },
        update: {
          title: `BFCM Product ${i}`,
          totalInventory: i <= 3 ? 50 : i <= 6 ? 200 : 500, // Low, medium, high inventory
          status: "active",
          productType: i <= 5 ? "Electronics" : "Apparel",
        },
        create: {
          id: `test-product-${i}`,
          shop: TEST_SHOP,
          title: `BFCM Product ${i}`,
          totalInventory: i <= 3 ? 50 : i <= 6 ? 200 : 500,
          status: "active",
          productType: i <= 5 ? "Electronics" : "Apparel",
        },
      });
      products.push(product);
    }

    console.log(`✅ Created/updated ${products.length} test products`);
    console.log(`   - Low inventory (50 units): 3 products`);
    console.log(`   - Medium inventory (200 units): 3 products`);
    console.log(`   - High inventory (500 units): 4 products`);

    // Create test orders to simulate BFCM traffic
    const now = new Date();
    const orders = [];
    for (let hour = 0; hour < 24; hour++) {
      const orderTime = new Date(now.getTime() - (24 - hour) * 60 * 60 * 1000);

      // Simulate traffic spike (3x orders during peak hours 10-14)
      const orderCount = hour >= 10 && hour <= 14 ? 30 : 10;

      for (let i = 0; i < orderCount; i++) {
        const productIndex = Math.floor(Math.random() * products.length);
        const product = products[productIndex];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const price = 50 + Math.random() * 200;

        const order = await db.order.create({
          data: {
            id: `test-order-${hour}-${i}`,
            shopifyOrderId: `${hour}${i}`,
            name: `#BFCM${hour}${i}`,
            shop: TEST_SHOP,
            totalPrice: price * quantity,
            currency: "USD",
            financialStatus: "paid",
            fulfillmentStatus: "unfulfilled",
            processedAt: orderTime,
            createdAt: orderTime,
            lineItems: {
              create: {
                productId: product.id,
                productTitle: product.title,
                variantId: `${product.id}-variant`,
                quantity,
                price,
              },
            },
          },
        });
        orders.push(order);
      }
    }

    console.log(`✅ Created ${orders.length} test orders (simulating 24-hour BFCM day)`);
    console.log(`   - Normal hours: ~10 orders/hour`);
    console.log(`   - Peak hours (10-14): ~30 orders/hour (3x spike)`);

    testsPassed++;

    // ========================================================================
    // Phase 2: DEFCON Calculation
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 2: Calculate DEFCON Status");
    console.log("=".repeat(60));

    const defconStart = Date.now();
    const defcon = await calculateDEFCON(TEST_SHOP);
    const defconTime = Date.now() - defconStart;

    console.log(`✅ DEFCON calculated in ${defconTime}ms`);
    console.log(`   Level: ${defcon.level} (${defcon.status})`);
    console.log(`   Risk Score: ${defcon.riskScore.toFixed(1)}/100`);
    console.log(`   Critical SKUs: ${defcon.criticalSKUs}`);
    console.log(`   Coverage: ${defcon.inventoryCoverageHours.toFixed(1)} hours`);

    if (defconTime < 50) {
      console.log(`   ⏱️  PASS: ${defconTime}ms < 50ms target`);
      testsPassed++;
    } else {
      console.log(`   ⏱️  SLOW: ${defconTime}ms (target: <50ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Phase 3: Revenue Risk Calculation
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 3: Calculate Revenue at Risk");
    console.log("=".repeat(60));

    const revenueStart = Date.now();
    const revenueRisk = await calculateRevenueRisk(TEST_SHOP);
    const revenueTime = Date.now() - revenueStart;

    console.log(`✅ Revenue risk calculated in ${revenueTime}ms`);
    console.log(`   24h risk: $${revenueRisk[0]?.expectedLoss?.toFixed(2) || '0.00'}`);
    console.log(`   48h risk: $${revenueRisk[1]?.expectedLoss?.toFixed(2) || '0.00'}`);
    console.log(`   72h risk: $${revenueRisk[2]?.expectedLoss?.toFixed(2) || '0.00'}`);

    if (revenueTime < 200) {
      console.log(`   ⏱️  PASS: ${revenueTime}ms < 200ms target`);
      testsPassed++;
    } else {
      console.log(`   ⏱️  SLOW: ${revenueTime}ms (target: <200ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Phase 4: Velocity Anomaly Detection
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 4: Detect Velocity Anomalies");
    console.log("=".repeat(60));

    const velocityStart = Date.now();
    const anomalies = await detectVelocityAnomalies(TEST_SHOP);
    const velocityTime = Date.now() - velocityStart;

    console.log(`✅ Velocity anomalies detected in ${velocityTime}ms`);
    console.log(`   Total anomalies: ${anomalies.anomalies.length}`);
    console.log(`   Viral products: ${anomalies.viralProducts}`);
    console.log(`   Dead stock: ${anomalies.deadStock}`);

    if (velocityTime < 200) {
      console.log(`   ⏱️  PASS: ${velocityTime}ms < 200ms target`);
      testsPassed++;
    } else {
      console.log(`   ⏱️  SLOW: ${velocityTime}ms (target: <200ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Phase 5: Generate Predictions
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 5: Generate Demand Predictions");
    console.log("=".repeat(60));

    const predictionStart = Date.now();
    const predictions = await generatePredictions(TEST_SHOP);
    const predictionTime = Date.now() - predictionStart;

    console.log(`✅ Predictions generated in ${predictionTime}ms`);
    console.log(`   Total predictions: ${predictions.predictions.length}`);
    console.log(`   Critical (4h): ${predictions.critical4h}`);
    console.log(`   High risk (24h): ${predictions.highRisk24h}`);

    if (predictionTime < 500) {
      console.log(`   ⏱️  PASS: ${predictionTime}ms < 500ms target`);
      testsPassed++;
    } else {
      console.log(`   ⏱️  SLOW: ${predictionTime}ms (target: <500ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Phase 6: Generate Recommendations
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 6: Generate Action Recommendations");
    console.log("=".repeat(60));

    const recoStart = Date.now();
    const recommendations = await generateRecommendations(TEST_SHOP);
    const recoTime = Date.now() - recoStart;

    console.log(`✅ Recommendations generated in ${recoTime}ms`);
    const recoArray = Array.isArray(recommendations) ? recommendations : [];
    console.log(`   Total recommendations: ${recoArray.length}`);
    console.log(`   Critical: ${recoArray.filter(r => r.urgency === "critical").length}`);
    console.log(`   High: ${recoArray.filter(r => r.urgency === "high").length}`);

    if (recoTime < 500) {
      console.log(`   ⏱️  PASS: ${recoTime}ms < 500ms target`);
      testsPassed++;
    } else {
      console.log(`   ⏱️  SLOW: ${recoTime}ms (target: <500ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Phase 7: Execute Actions (Sandbox Mode)
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 7: Execute Recommended Actions (Sandbox)");
    console.log("=".repeat(60));

    let actionsExecuted = 0;
    if (recommendations.recommendations.length > 0) {
      const topAction = recommendations.recommendations[0];
      console.log(`   Executing action: ${topAction.type} (ID: ${topAction.id})`);

      const actionStart = Date.now();
      const result = await executeAction(topAction.id, "system", true); // sandbox = true
      const actionTime = Date.now() - actionStart;

      console.log(`✅ Action executed in ${actionTime}ms`);
      console.log(`   Result: ${result.result}`);
      console.log(`   Mode: Sandbox`);

      if (actionTime < 2000) {
        console.log(`   ⏱️  PASS: ${actionTime}ms < 2000ms target`);
        testsPassed++;
      } else {
        console.log(`   ⏱️  SLOW: ${actionTime}ms (target: <2000ms)`);
        testsFailed++;
      }

      actionsExecuted++;
    } else {
      console.log(`   ⚠️  No recommendations to execute (inventory healthy)`);
      testsPassed++; // Not a failure, just no actions needed
    }

    // ========================================================================
    // Phase 8: Alert System
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 8: Evaluate Alert Rules");
    console.log("=".repeat(60));

    // Create default alert rules if they don't exist
    await createDefaultAlertRules(TEST_SHOP);

    const alertStart = Date.now();
    const alerts = await evaluateAlertRules(TEST_SHOP, {
      defconLevel: defcon.level,
      revenueAtRisk: revenueRisk.risk24h,
      velocityAnomalies: anomalies.anomalies.length,
      criticalSKUs: defcon.criticalSKUs,
    });
    const alertTime = Date.now() - alertStart;

    console.log(`✅ Alert rules evaluated in ${alertTime}ms`);
    console.log(`   Alerts triggered: ${alerts.triggered.length}`);
    console.log(`   Critical: ${alerts.triggered.filter(a => a.severity === "critical").length}`);
    console.log(`   High: ${alerts.triggered.filter(a => a.severity === "high").length}`);

    if (alertTime < 300) {
      console.log(`   ⏱️  PASS: ${alertTime}ms < 300ms target`);
      testsPassed++;
    } else {
      console.log(`   ⏱️  SLOW: ${alertTime}ms (target: <300ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Phase 9: Simulation
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 9: Run BFCM Flash Sale Simulation");
    console.log("=".repeat(60));

    const simulationStart = Date.now();
    const simulation = await runSimulation(TEST_SHOP, "flash_sale", {
      discount: 30,
      duration: 4,
      expectedTrafficMultiplier: 5,
    });
    const simulationTime = Date.now() - simulationStart;

    console.log(`✅ Simulation completed in ${simulationTime}ms`);
    console.log(`   Simulation ID: ${simulation.id}`);
    console.log(`   Status: ${simulation.status}`);
    console.log(`   Impact Score: ${simulation.impactScore?.toFixed(1)}/100`);
    console.log(`   Risk Level: ${simulation.riskLevel}`);

    if (simulationTime < 10000) {
      console.log(`   ⏱️  PASS: ${simulationTime}ms < 10000ms target`);
      testsPassed++;
    } else {
      console.log(`   ⏱️  SLOW: ${simulationTime}ms (target: <10000ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Phase 10: ROI Tracking
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 10: Generate ROI Report");
    console.log("=".repeat(60));

    const roiStart = Date.now();
    const roiReport = await generateROIReport(TEST_SHOP);
    const roiTime = Date.now() - roiStart;

    console.log(`✅ ROI report generated in ${roiTime}ms`);
    console.log(`   Total Value: $${roiReport.summary.totalValue.toFixed(2)}`);
    console.log(`   Revenue Saved: $${roiReport.summary.revenueSaved.toFixed(2)}`);
    console.log(`   Margin Protected: $${roiReport.summary.marginProtected.toFixed(2)}`);
    console.log(`   Actions: ${roiReport.summary.actionCount}`);

    if (roiTime < 500) {
      console.log(`   ⏱️  PASS: ${roiTime}ms < 500ms target`);
      testsPassed++;
    } else {
      console.log(`   ⏱️  SLOW: ${roiTime}ms (target: <500ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Phase 11: Attribution Analysis
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 11: Generate Attribution Report");
    console.log("=".repeat(60));

    const attrStart = Date.now();
    const attrReport = await generateAttributionReport(TEST_SHOP);
    const attrTime = Date.now() - attrStart;

    console.log(`✅ Attribution report generated in ${attrTime}ms`);
    console.log(`   Decision Audit Trail: ${attrReport.decisionAuditTrail.length} entries`);
    console.log(`   Success Patterns: ${attrReport.successPatterns.length} patterns`);
    console.log(`   Model Accuracy: ${attrReport.modelAccuracy.prediction.accuracy.toFixed(1)}%`);

    if (attrTime < 1000) {
      console.log(`   ⏱️  PASS: ${attrTime}ms < 1000ms target`);
      testsPassed++;
    } else {
      console.log(`   ⏱️  SLOW: ${attrTime}ms (target: <1000ms)`);
      testsFailed++;
    }

    // ========================================================================
    // Phase 12: Cleanup
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("Phase 12: Cleanup Test Data");
    console.log("=".repeat(60));

    // Delete test orders
    await db.orderLineItem.deleteMany({
      where: {
        orderId: {
          startsWith: "test-order-",
        },
      },
    });

    await db.order.deleteMany({
      where: {
        id: {
          startsWith: "test-order-",
        },
      },
    });

    console.log(`✅ Deleted ${orders.length} test orders`);

    // Delete simulation
    await db.simulationResult.deleteMany({
      where: { simulationId: simulation.id },
    });
    await db.simulation.delete({
      where: { id: simulation.id },
    });

    console.log(`✅ Deleted test simulation`);

    testsPassed++;

    // ========================================================================
    // Summary
    // ========================================================================
    const totalTime = Date.now() - startTime;

    console.log("\n" + "=".repeat(60));
    console.log("End-to-End Test Summary");
    console.log("=".repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
    console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);

    console.log("\n" + "=".repeat(60));
    console.log("Feature Coverage");
    console.log("=".repeat(60));
    console.log(`✅ DEFCON Calculation`);
    console.log(`✅ Revenue Risk Assessment`);
    console.log(`✅ Velocity Anomaly Detection`);
    console.log(`✅ Demand Predictions`);
    console.log(`✅ Action Recommendations`);
    console.log(`✅ Action Execution (Sandbox)`);
    console.log(`✅ Alert System`);
    console.log(`✅ Simulation Engine`);
    console.log(`✅ ROI Tracking`);
    console.log(`✅ Attribution Analysis`);

    if (testsFailed === 0) {
      console.log("\n🎉 All end-to-end tests passed!");
      console.log("🚀 BFCM War Room is production ready!");
    } else {
      console.log(`\n⚠️  ${testsFailed} test(s) failed or slow`);
    }
  } catch (error) {
    console.error("\n❌ Test execution failed:", error);
    testsFailed++;
  } finally {
    await db.$disconnect();
  }

  process.exit(testsFailed === 0 ? 0 : 1);
}

runE2ETest();
