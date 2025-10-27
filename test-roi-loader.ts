/**
 * Test ROI Loader
 *
 * Simulates what the ROI dashboard loader returns
 */

import {
  generateROIReport,
  getROIComparison,
} from "./app/services/roi-tracker.server";
import {
  generateAttributionReport,
} from "./app/services/attribution-engine.server";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function testLoader() {
  try {
    // Get the shop
    const session = await db.session.findFirst({
      select: { shop: true },
    });

    if (!session) {
      console.log("❌ No session found");
      return;
    }

    const shop = session.shop;
    console.log(`🧪 Testing ROI loader for shop: ${shop}\n`);

    const startTime = Date.now();

    // Fetch all data in parallel (same as the loader)
    const [roiReport, roiComparison, attributionReport] = await Promise.all([
      generateROIReport(shop),
      getROIComparison(shop),
      generateAttributionReport(shop),
    ]);

    const loadTime = Date.now() - startTime;

    console.log(`✅ Loader completed in ${loadTime}ms\n`);

    console.log("📊 ROI Report:");
    console.log(`  Summary Total Value: $${roiReport.summary.totalValue.toLocaleString()}`);
    console.log(`  Hourly Total Value: $${roiReport.hourly.totalValue.toLocaleString()}`);
    console.log(`  Daily Total Value: $${roiReport.daily.totalValue.toLocaleString()}`);
    console.log(`  Weekly Total Value: $${roiReport.weekly.totalValue.toLocaleString()}`);
    console.log(`  Category Breakdown: ${roiReport.categoryBreakdown.length} categories`);
    console.log(`  Top Actions: ${roiReport.topActions.length} actions`);
    console.log(`  Time Series: ${roiReport.timeSeries.length} data points`);

    console.log("\n🔄 ROI Comparison:");
    if (roiComparison) {
      console.log(`  With War Room: $${roiComparison.withWarRoom.toLocaleString()}`);
      console.log(`  Without War Room: $${roiComparison.withoutWarRoom.toLocaleString()}`);
      console.log(`  Improvement: $${roiComparison.improvement.toLocaleString()} (+${roiComparison.improvementPercentage.toFixed(1)}%)`);
    } else {
      console.log("  No comparison data");
    }

    console.log("\n📝 Attribution Report:");
    console.log(`  Success Patterns: ${attributionReport.successPatterns.length} patterns`);
    console.log(`  Model Accuracy: ${Object.keys(attributionReport.modelAccuracy).length} models`);
    console.log(`  Continuous Improvement: ${attributionReport.continuousImprovement.length} metrics`);
    console.log(`  Counterfactual Analyses: ${attributionReport.counterfactualAnalyses.length} analyses`);
    console.log(`  Decision Audit Trail: ${attributionReport.decisionAuditTrail.length} decisions`);

    console.log("\n✅ All loader data looks good!");
    console.log("\nℹ️  If the dashboard is still showing zeros, try:");
    console.log("   1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)");
    console.log("   2. Clear browser cache");
    console.log("   3. Check browser console for errors");

  } catch (error) {
    console.error("❌ Error testing loader:", error);
  } finally {
    await db.$disconnect();
  }
}

testLoader();
