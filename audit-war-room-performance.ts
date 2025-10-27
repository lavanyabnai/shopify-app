/**
 * BFCM War Room - Performance Audit Script
 *
 * Validates all performance benchmarks:
 * - Dashboard load: <100ms (cache hit), <2s (cache miss)
 * - DEFCON calculation: <50ms
 * - Revenue risk calculation: <200ms
 * - Prediction engine: <500ms
 * - Action execution: <2s
 * - All War Room services
 *
 * Session 8 - BFCM War Room
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Import all War Room services
import { calculateDEFCON, getLatestDEFCON } from "./app/services/defcon-calculator.server.js";
import { calculateRevenueRisk } from "./app/services/revenue-risk.server.js";
import { detectVelocityAnomalies } from "./app/services/velocity-detector.server.js";
import { generatePredictions } from "./app/services/prediction-engine.server.js";
import { calculateStockoutCountdowns } from "./app/services/stockout-countdown.server.js";
import { generateRecommendations } from "./app/services/recommendation-engine.server.js";
import { executeAction } from "./app/services/action-executor.server.js";
import { evaluateAlertRules } from "./app/services/alert-engine.server.js";
import { calculatePerformanceMetrics } from "./app/services/performance-tracker.server.js";
import { getCompetitiveIntelligence } from "./app/services/competitive-intel.server.js";
import { runSimulation } from "./app/services/simulation-engine.server.js";
import { generateROIReport } from "./app/services/roi-tracker.server.js";
import { generateAttributionReport } from "./app/services/attribution-engine.server.js";

const TEST_SHOP = "test-shop.myshopify.com";

console.log("🔍 BFCM War Room - Performance Audit");
console.log("=".repeat(70));
console.log("\n📊 Performance Benchmarks:");
console.log("  • Dashboard load: <100ms (cache hit), <2s (cache miss)");
console.log("  • DEFCON calculation: <50ms");
console.log("  • Revenue risk calculation: <200ms");
console.log("  • Prediction engine: <500ms");
console.log("  • Action execution: <2s");
console.log("  • Simulation engine: <10s");
console.log("=".repeat(70));

interface BenchmarkResult {
  service: string;
  target: number;
  actual: number;
  status: "PASS" | "FAIL" | "SLOW";
  notes?: string;
}

async function runPerformanceAudit() {
  const results: BenchmarkResult[] = [];
  let totalTests = 0;
  let passedTests = 0;

  console.log("\n🚀 Starting Performance Audit...\n");

  try {
    // ========================================================================
    // 1. DEFCON Calculation
    // ========================================================================
    console.log("1️⃣  Testing DEFCON Calculation...");
    const defconStart = Date.now();
    await calculateDEFCON(TEST_SHOP);
    const defconTime = Date.now() - defconStart;

    const defconResult: BenchmarkResult = {
      service: "DEFCON Calculation",
      target: 50,
      actual: defconTime,
      status: defconTime < 50 ? "PASS" : defconTime < 100 ? "SLOW" : "FAIL",
    };
    results.push(defconResult);
    totalTests++;
    if (defconResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(defconResult.status)} ${defconTime}ms (target: <50ms)`);

    // ========================================================================
    // 2. Get Latest DEFCON (Cached)
    // ========================================================================
    console.log("\n2️⃣  Testing DEFCON Retrieval (Cached)...");
    const cachedStart = Date.now();
    await getLatestDEFCON(TEST_SHOP);
    const cachedTime = Date.now() - cachedStart;

    const cachedResult: BenchmarkResult = {
      service: "DEFCON Retrieval (Cached)",
      target: 100,
      actual: cachedTime,
      status: cachedTime < 100 ? "PASS" : cachedTime < 200 ? "SLOW" : "FAIL",
    };
    results.push(cachedResult);
    totalTests++;
    if (cachedResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(cachedResult.status)} ${cachedTime}ms (target: <100ms)`);

    // ========================================================================
    // 3. Revenue Risk Calculation
    // ========================================================================
    console.log("\n3️⃣  Testing Revenue Risk Calculation...");
    const revenueStart = Date.now();
    await calculateRevenueRisk(TEST_SHOP);
    const revenueTime = Date.now() - revenueStart;

    const revenueResult: BenchmarkResult = {
      service: "Revenue Risk Calculation",
      target: 200,
      actual: revenueTime,
      status: revenueTime < 200 ? "PASS" : revenueTime < 400 ? "SLOW" : "FAIL",
    };
    results.push(revenueResult);
    totalTests++;
    if (revenueResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(revenueResult.status)} ${revenueTime}ms (target: <200ms)`);

    // ========================================================================
    // 4. Velocity Anomaly Detection
    // ========================================================================
    console.log("\n4️⃣  Testing Velocity Anomaly Detection...");
    const velocityStart = Date.now();
    await detectVelocityAnomalies(TEST_SHOP);
    const velocityTime = Date.now() - velocityStart;

    const velocityResult: BenchmarkResult = {
      service: "Velocity Anomaly Detection",
      target: 200,
      actual: velocityTime,
      status: velocityTime < 200 ? "PASS" : velocityTime < 400 ? "SLOW" : "FAIL",
    };
    results.push(velocityResult);
    totalTests++;
    if (velocityResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(velocityResult.status)} ${velocityTime}ms (target: <200ms)`);

    // ========================================================================
    // 5. Prediction Engine
    // ========================================================================
    console.log("\n5️⃣  Testing Prediction Engine...");
    const predictionStart = Date.now();
    await generatePredictions(TEST_SHOP);
    const predictionTime = Date.now() - predictionStart;

    const predictionResult: BenchmarkResult = {
      service: "Prediction Engine",
      target: 500,
      actual: predictionTime,
      status: predictionTime < 500 ? "PASS" : predictionTime < 1000 ? "SLOW" : "FAIL",
    };
    results.push(predictionResult);
    totalTests++;
    if (predictionResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(predictionResult.status)} ${predictionTime}ms (target: <500ms)`);

    // ========================================================================
    // 6. Stockout Countdown
    // ========================================================================
    console.log("\n6️⃣  Testing Stockout Countdown...");
    const countdownStart = Date.now();
    await calculateStockoutCountdowns(TEST_SHOP);
    const countdownTime = Date.now() - countdownStart;

    const countdownResult: BenchmarkResult = {
      service: "Stockout Countdown",
      target: 200,
      actual: countdownTime,
      status: countdownTime < 200 ? "PASS" : countdownTime < 400 ? "SLOW" : "FAIL",
    };
    results.push(countdownResult);
    totalTests++;
    if (countdownResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(countdownResult.status)} ${countdownTime}ms (target: <200ms)`);

    // ========================================================================
    // 7. Recommendation Engine
    // ========================================================================
    console.log("\n7️⃣  Testing Recommendation Engine...");
    const recoStart = Date.now();
    const recommendations = await generateRecommendations(TEST_SHOP);
    const recoTime = Date.now() - recoStart;

    const recoResult: BenchmarkResult = {
      service: "Recommendation Engine",
      target: 500,
      actual: recoTime,
      status: recoTime < 500 ? "PASS" : recoTime < 1000 ? "SLOW" : "FAIL",
    };
    results.push(recoResult);
    totalTests++;
    if (recoResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(recoResult.status)} ${recoTime}ms (target: <500ms)`);

    // ========================================================================
    // 8. Action Execution (if recommendations exist)
    // ========================================================================
    if (recommendations.recommendations.length > 0) {
      console.log("\n8️⃣  Testing Action Execution (Sandbox)...");
      const actionStart = Date.now();
      await executeAction(recommendations.recommendations[0].id, "system", true);
      const actionTime = Date.now() - actionStart;

      const actionResult: BenchmarkResult = {
        service: "Action Execution",
        target: 2000,
        actual: actionTime,
        status: actionTime < 2000 ? "PASS" : actionTime < 4000 ? "SLOW" : "FAIL",
      };
      results.push(actionResult);
      totalTests++;
      if (actionResult.status === "PASS") passedTests++;

      console.log(`   ${getStatusIcon(actionResult.status)} ${actionTime}ms (target: <2000ms)`);
    } else {
      console.log("\n8️⃣  Skipping Action Execution (no recommendations)");
    }

    // ========================================================================
    // 9. Alert Rule Evaluation
    // ========================================================================
    console.log("\n9️⃣  Testing Alert Rule Evaluation...");
    const alertStart = Date.now();
    await evaluateAlertRules(TEST_SHOP, {
      defconLevel: 2,
      revenueAtRisk: 10000,
      velocityAnomalies: 5,
      criticalSKUs: 3,
    });
    const alertTime = Date.now() - alertStart;

    const alertResult: BenchmarkResult = {
      service: "Alert Rule Evaluation",
      target: 300,
      actual: alertTime,
      status: alertTime < 300 ? "PASS" : alertTime < 600 ? "SLOW" : "FAIL",
    };
    results.push(alertResult);
    totalTests++;
    if (alertResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(alertResult.status)} ${alertTime}ms (target: <300ms)`);

    // ========================================================================
    // 10. Performance Tracker
    // ========================================================================
    console.log("\n🔟 Testing Performance Tracker...");
    const perfStart = Date.now();
    await calculatePerformanceMetrics(TEST_SHOP);
    const perfTime = Date.now() - perfStart;

    const perfResult: BenchmarkResult = {
      service: "Performance Tracker",
      target: 200,
      actual: perfTime,
      status: perfTime < 200 ? "PASS" : perfTime < 400 ? "SLOW" : "FAIL",
    };
    results.push(perfResult);
    totalTests++;
    if (perfResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(perfResult.status)} ${perfTime}ms (target: <200ms)`);

    // ========================================================================
    // 11. Competitive Intelligence
    // ========================================================================
    console.log("\n1️⃣1️⃣  Testing Competitive Intelligence...");
    const compStart = Date.now();
    await getCompetitiveIntelligence(TEST_SHOP);
    const compTime = Date.now() - compStart;

    const compResult: BenchmarkResult = {
      service: "Competitive Intelligence",
      target: 200,
      actual: compTime,
      status: compTime < 200 ? "PASS" : compTime < 400 ? "SLOW" : "FAIL",
    };
    results.push(compResult);
    totalTests++;
    if (compResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(compResult.status)} ${compTime}ms (target: <200ms)`);

    // ========================================================================
    // 12. Simulation Engine
    // ========================================================================
    console.log("\n1️⃣2️⃣  Testing Simulation Engine...");
    const simStart = Date.now();
    const simulation = await runSimulation(TEST_SHOP, "traffic_spike", {
      trafficMultiplier: 10,
      duration: 2,
    });
    const simTime = Date.now() - simStart;

    const simResult: BenchmarkResult = {
      service: "Simulation Engine",
      target: 10000,
      actual: simTime,
      status: simTime < 10000 ? "PASS" : simTime < 20000 ? "SLOW" : "FAIL",
    };
    results.push(simResult);
    totalTests++;
    if (simResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(simResult.status)} ${simTime}ms (target: <10000ms)`);

    // Cleanup simulation
    await db.simulationResult.deleteMany({ where: { simulationId: simulation.id } });
    await db.simulation.delete({ where: { id: simulation.id } });

    // ========================================================================
    // 13. ROI Report Generation
    // ========================================================================
    console.log("\n1️⃣3️⃣  Testing ROI Report Generation...");
    const roiStart = Date.now();
    await generateROIReport(TEST_SHOP);
    const roiTime = Date.now() - roiStart;

    const roiResult: BenchmarkResult = {
      service: "ROI Report Generation",
      target: 500,
      actual: roiTime,
      status: roiTime < 500 ? "PASS" : roiTime < 1000 ? "SLOW" : "FAIL",
    };
    results.push(roiResult);
    totalTests++;
    if (roiResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(roiResult.status)} ${roiTime}ms (target: <500ms)`);

    // ========================================================================
    // 14. Attribution Report Generation
    // ========================================================================
    console.log("\n1️⃣4️⃣  Testing Attribution Report Generation...");
    const attrStart = Date.now();
    await generateAttributionReport(TEST_SHOP);
    const attrTime = Date.now() - attrStart;

    const attrResult: BenchmarkResult = {
      service: "Attribution Report Generation",
      target: 1000,
      actual: attrTime,
      status: attrTime < 1000 ? "PASS" : attrTime < 2000 ? "SLOW" : "FAIL",
    };
    results.push(attrResult);
    totalTests++;
    if (attrResult.status === "PASS") passedTests++;

    console.log(`   ${getStatusIcon(attrResult.status)} ${attrTime}ms (target: <1000ms)`);

    // ========================================================================
    // Performance Summary
    // ========================================================================
    console.log("\n" + "=".repeat(70));
    console.log("📊 Performance Audit Summary");
    console.log("=".repeat(70));

    const passing = results.filter((r) => r.status === "PASS");
    const slow = results.filter((r) => r.status === "SLOW");
    const failing = results.filter((r) => r.status === "FAIL");

    console.log(`\n✅ Passing: ${passing.length}/${totalTests} (${((passing.length / totalTests) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Slow: ${slow.length}/${totalTests}`);
    console.log(`❌ Failing: ${failing.length}/${totalTests}`);

    // Detailed results table
    console.log("\n" + "=".repeat(70));
    console.log("Detailed Results:");
    console.log("=".repeat(70));
    console.log(
      `${"Service".padEnd(35)} ${"Target".padStart(8)} ${"Actual".padStart(8)} ${"Status".padStart(8)}`
    );
    console.log("-".repeat(70));

    for (const result of results) {
      const status = getStatusIcon(result.status);
      console.log(
        `${result.service.padEnd(35)} ${(result.target + "ms").padStart(8)} ${(result.actual + "ms").padStart(8)} ${status.padStart(8)}`
      );
    }

    // Performance grade
    console.log("\n" + "=".repeat(70));
    const grade = calculateGrade(passedTests, totalTests);
    console.log(`🏆 Performance Grade: ${grade.letter} (${grade.score}%)`);
    console.log("=".repeat(70));

    if (grade.letter === "A" || grade.letter === "A+") {
      console.log("\n🎉 Excellent! All performance targets met or exceeded!");
    } else if (grade.letter === "B" || grade.letter === "B+") {
      console.log("\n👍 Good performance, with room for optimization.");
    } else if (grade.letter === "C" || grade.letter === "C+") {
      console.log("\n⚠️  Performance needs improvement in some areas.");
    } else {
      console.log("\n❌ Performance optimization required.");
    }

    // Recommendations
    if (slow.length > 0 || failing.length > 0) {
      console.log("\n💡 Recommendations:");
      for (const result of [...slow, ...failing]) {
        console.log(`   • Optimize ${result.service} (currently ${result.actual}ms, target: <${result.target}ms)`);
      }
    }
  } catch (error) {
    console.error("\n❌ Performance audit failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }

  process.exit(0);
}

// Helper functions
function getStatusIcon(status: "PASS" | "FAIL" | "SLOW"): string {
  switch (status) {
    case "PASS":
      return "✅";
    case "SLOW":
      return "⚠️ ";
    case "FAIL":
      return "❌";
  }
}

function calculateGrade(passed: number, total: number): { letter: string; score: number } {
  const score = Math.round((passed / total) * 100);

  if (score >= 97) return { letter: "A+", score };
  if (score >= 93) return { letter: "A", score };
  if (score >= 90) return { letter: "A-", score };
  if (score >= 87) return { letter: "B+", score };
  if (score >= 83) return { letter: "B", score };
  if (score >= 80) return { letter: "B-", score };
  if (score >= 77) return { letter: "C+", score };
  if (score >= 73) return { letter: "C", score };
  if (score >= 70) return { letter: "C-", score };
  if (score >= 67) return { letter: "D+", score };
  if (score >= 63) return { letter: "D", score };
  if (score >= 60) return { letter: "D-", score };
  return { letter: "F", score };
}

runPerformanceAudit();
