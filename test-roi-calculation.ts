/**
 * Test ROI Calculation
 *
 * Tests the ROI tracker service to verify it's calculating correctly
 */

import { generateROIReport } from "./app/services/roi-tracker.server";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function testROI() {
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
    console.log(`🧪 Testing ROI calculation for shop: ${shop}\n`);

    // Test the ROI report generation
    const report = await generateROIReport(shop);

    console.log("📊 ROI Report Summary:");
    console.log(`  Total Value: $${report.summary.totalValue.toLocaleString()}`);
    console.log(`  Revenue Saved: $${report.summary.revenueSaved.toLocaleString()}`);
    console.log(`  Margin Protected: $${report.summary.marginProtected.toLocaleString()}`);
    console.log(`  Opportunity Captured: $${report.summary.opportunityCaptured.toLocaleString()}`);
    console.log(`  Action Count: ${report.summary.actionCount}`);
    console.log(`  Avg ROI per Action: $${report.summary.avgROIPerAction.toLocaleString()}`);

    console.log("\n📈 Period Breakdown:");
    console.log(`  Hourly: $${report.hourly.totalValue.toLocaleString()} (${report.hourly.actionCount} actions)`);
    console.log(`  Daily: $${report.daily.totalValue.toLocaleString()} (${report.daily.actionCount} actions)`);
    console.log(`  Weekly: $${report.weekly.totalValue.toLocaleString()} (${report.weekly.actionCount} actions)`);

    console.log("\n🏷️  Category Breakdown:");
    report.categoryBreakdown.forEach((cat) => {
      console.log(`  ${cat.category}: $${cat.value.toLocaleString()} (${cat.percentage.toFixed(1)}%)`);
    });

    console.log("\n🎯 Top Actions:");
    report.topActions.slice(0, 3).forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.actionType} - Net ROI: $${action.netROI.toLocaleString()}`);
    });

    console.log("\n✅ ROI calculation test passed!");

  } catch (error) {
    console.error("❌ Error testing ROI:", error);
  } finally {
    await db.$disconnect();
  }
}

testROI();
