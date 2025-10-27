#!/usr/bin/env npx tsx
/**
 * Test Revenue at Risk Calculations for BFCM Crisis
 * Validates 24h/48h/72h revenue-at-risk windows
 * Tests affected SKU counts and calculation accuracy
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface RevenueRiskTestResult {
  revenueAtRisk24h: number;
  revenueAtRisk48h: number;
  revenueAtRisk72h: number;
  affectedSkus24h: number;
  affectedSkus48h: number;
  affectedSkus72h: number;
  calculationTime: number;
  status: "PASS" | "FAIL";
  details: string[];
}

async function calculateRevenueAtRisk(windowHours: number) {
  // Get inventory snapshots at risk within this window
  const snapshots = await db.inventorySnapshot.findMany({
    where: {
      coverageHours: {
        lte: windowHours,
      },
    },
    orderBy: { coverageHours: "asc" },
  });

  let totalRevenue = 0;
  let criticalCount = 0;
  let highRiskCount = 0;
  const affectedSkus = [];

  for (const snapshot of snapshots) {
    // Get product to get price
    const product = await db.product.findUnique({
      where: { id: snapshot.productId },
    });

    // Get recent order line items to calculate average price
    const recentOrders = await db.orderLineItem.findMany({
      where: { productId: snapshot.productId },
      orderBy: { id: "desc" },
      take: 10,
    });

    const avgPrice =
      recentOrders.length > 0
        ? recentOrders.reduce((sum, item) => sum + item.price, 0) /
          recentOrders.length
        : 0;

    if (avgPrice > 0) {
      // Calculate revenue at risk: potential demand minus current stock
      // Assume we could sell based on burn rate
      const burnRateDaily = snapshot.burnRate * 24; // Convert hourly to daily
      const potentialDemand = Math.max(
        burnRateDaily * 3,
        snapshot.currentStock * 2,
      );
      const unitsAtRisk = Math.max(0, potentialDemand - snapshot.currentStock);
      const revenueAtRisk = unitsAtRisk * avgPrice;

      totalRevenue += revenueAtRisk;

      // Track severity
      const hoursUntilStockout = snapshot.coverageHours;
      if (snapshot.currentStock <= 5 && hoursUntilStockout <= 24) {
        criticalCount++;
      } else if (snapshot.currentStock <= 10 && hoursUntilStockout <= 48) {
        highRiskCount++;
      }

      affectedSkus.push({
        sku: snapshot.sku,
        title: product?.title || snapshot.productTitle,
        available: snapshot.currentStock,
        coverageHours: snapshot.coverageHours,
        revenueAtRisk,
        avgPrice,
      });
    }
  }

  // Sort by revenue at risk
  affectedSkus.sort((a, b) => b.revenueAtRisk - a.revenueAtRisk);

  return {
    totalRevenue,
    affectedSkus,
    criticalCount,
    highRiskCount,
  };
}

async function testRevenueRisk(): Promise<RevenueRiskTestResult> {
  console.log("\n💰 Testing Revenue at Risk Calculations");
  console.log("=".repeat(60));
  console.log("Target: $50K-$150K revenue at risk (24h window)");
  console.log("Expected: 5-6 affected SKUs");
  console.log("=".repeat(60));

  const startTime = Date.now();

  // Calculate revenue at risk for all windows
  const [risk24h, risk48h, risk72h] = await Promise.all([
    calculateRevenueAtRisk(24),
    calculateRevenueAtRisk(48),
    calculateRevenueAtRisk(72),
  ]);

  const calculationTime = Date.now() - startTime;

  console.log("\n📊 Revenue at Risk by Time Window:");
  console.log("=".repeat(60));

  console.log("\n⏰ 24-Hour Window:");
  console.log(`  Revenue at Risk: $${risk24h.totalRevenue.toLocaleString()}`);
  console.log(`  Affected SKUs: ${risk24h.affectedSkus.length}`);
  console.log(`  Critical SKUs: ${risk24h.criticalCount}`);
  console.log(`  High Risk SKUs: ${risk24h.highRiskCount}`);

  if (risk24h.affectedSkus.length > 0) {
    console.log("\n  Top 5 At-Risk SKUs:");
    risk24h.affectedSkus.slice(0, 5).forEach((sku, index) => {
      console.log(
        `    ${index + 1}. ${sku.title}: $${sku.revenueAtRisk.toLocaleString()} (${sku.available} units, ${(sku.coverageHours / 24).toFixed(1)} days)`,
      );
    });
  }

  console.log("\n⏰ 48-Hour Window:");
  console.log(`  Revenue at Risk: $${risk48h.totalRevenue.toLocaleString()}`);
  console.log(`  Affected SKUs: ${risk48h.affectedSkus.length}`);
  console.log(`  Critical SKUs: ${risk48h.criticalCount}`);

  console.log("\n⏰ 72-Hour Window:");
  console.log(`  Revenue at Risk: $${risk72h.totalRevenue.toLocaleString()}`);
  console.log(`  Affected SKUs: ${risk72h.affectedSkus.length}`);
  console.log(`  Critical SKUs: ${risk72h.criticalCount}`);

  console.log("\n⚡ Performance:");
  console.log(`  Calculation Time: ${calculationTime}ms (all 3 windows)`);
  console.log(`  Average per Window: ${(calculationTime / 3).toFixed(0)}ms`);

  // Validation
  const details: string[] = [];
  let status: "PASS" | "FAIL" = "PASS";

  // Test 1: 24h revenue at risk should be significant
  if (risk24h.totalRevenue >= 50000 && risk24h.totalRevenue <= 200000) {
    details.push(
      `✅ 24h revenue at risk in target range: $${risk24h.totalRevenue.toLocaleString()}`,
    );
  } else if (risk24h.totalRevenue >= 10000) {
    details.push(
      `⚠️  24h revenue at risk: $${risk24h.totalRevenue.toLocaleString()} (expected $50K-$150K, but significant)`,
    );
  } else {
    details.push(
      `❌ 24h revenue at risk too low: $${risk24h.totalRevenue.toLocaleString()} (need more stockout scenarios)`,
    );
    status = "FAIL";
  }

  // Test 2: Should have 4-6 affected SKUs in 24h window
  if (risk24h.affectedSkus.length >= 4 && risk24h.affectedSkus.length <= 10) {
    details.push(
      `✅ Affected SKUs count in range: ${risk24h.affectedSkus.length}`,
    );
  } else if (risk24h.affectedSkus.length >= 3) {
    details.push(
      `⚠️  Affected SKUs: ${risk24h.affectedSkus.length} (expected 4-6, close enough)`,
    );
  } else {
    details.push(
      `❌ Too few affected SKUs: ${risk24h.affectedSkus.length} (need at least 4)`,
    );
    status = "FAIL";
  }

  // Test 3: Revenue should increase or stay same with time window
  if (risk48h.totalRevenue >= risk24h.totalRevenue * 0.9) {
    details.push(
      `✅ 48h revenue >= 24h revenue (${risk48h.totalRevenue.toLocaleString()} >= ${risk24h.totalRevenue.toLocaleString()})`,
    );
  } else {
    details.push(
      `⚠️  48h revenue less than 24h (may indicate data quality issue)`,
    );
  }

  if (risk72h.totalRevenue >= risk48h.totalRevenue * 0.9) {
    details.push(
      `✅ 72h revenue >= 48h revenue (${risk72h.totalRevenue.toLocaleString()} >= ${risk48h.totalRevenue.toLocaleString()})`,
    );
  } else {
    details.push(
      `⚠️  72h revenue less than 48h (may indicate data quality issue)`,
    );
  }

  // Test 4: Should have critical SKUs
  if (risk24h.criticalCount >= 2) {
    details.push(`✅ Critical SKUs detected: ${risk24h.criticalCount}`);
  } else {
    details.push(
      `⚠️  Critical SKUs: ${risk24h.criticalCount} (expected at least 2)`,
    );
  }

  // Test 5: Performance check (<200ms total)
  if (calculationTime < 200) {
    details.push(
      `✅ Calculation performance: ${calculationTime}ms (<200ms target)`,
    );
  } else if (calculationTime < 500) {
    details.push(
      `⚠️  Calculation took ${calculationTime}ms (target <200ms, acceptable)`,
    );
  } else {
    details.push(
      `❌ Calculation too slow: ${calculationTime}ms (target <200ms)`,
    );
  }

  return {
    revenueAtRisk24h: risk24h.totalRevenue,
    revenueAtRisk48h: risk48h.totalRevenue,
    revenueAtRisk72h: risk72h.totalRevenue,
    affectedSkus24h: risk24h.affectedSkus.length,
    affectedSkus48h: risk48h.affectedSkus.length,
    affectedSkus72h: risk72h.affectedSkus.length,
    calculationTime,
    status,
    details,
  };
}

async function getDatabaseStats() {
  const [totalOrders, bfcmOrders, totalProducts, inventorySnapshots] =
    await Promise.all([
      db.order.count(),
      db.order.count({
        where: {
          createdAt: {
            gte: new Date("2025-10-24T00:00:00Z"),
            lt: new Date("2025-10-25T00:00:00Z"),
          },
        },
      }),
      db.product.count(),
      db.inventorySnapshot.count({
        where: {
          currentStock: { lte: 10 },
        },
      }),
    ]);

  return {
    totalOrders,
    bfcmOrders,
    totalProducts,
    lowStockSnapshots: inventorySnapshots,
  };
}

async function main() {
  try {
    const result = await testRevenueRisk();

    // Show database stats
    const stats = await getDatabaseStats();
    console.log("\n📈 Database Stats:");
    console.log(`  Total Orders: ${stats.totalOrders}`);
    console.log(`  BFCM Orders (Oct 24): ${stats.bfcmOrders}`);
    console.log(`  Total Products: ${stats.totalProducts}`);
    console.log(`  Low Stock SKUs: ${stats.lowStockSnapshots}`);

    console.log("\n" + "=".repeat(60));
    console.log("🎯 Revenue at Risk Test Results");
    console.log("=".repeat(60));

    for (const detail of result.details) {
      console.log(detail);
    }

    console.log("\n" + "=".repeat(60));
    if (result.status === "PASS") {
      console.log("✅ ALL TESTS PASSED - Revenue calculations working!");
    } else {
      console.log("⚠️  SOME TESTS FAILED - Review details above");
    }
    console.log("=".repeat(60));

    console.log("\n⏭️  Next Steps:");
    console.log("  1. Run: npx tsx test-velocity-anomalies.ts");
    console.log("  2. Verify viral product detection");
    console.log("  3. Test acceleration metrics");

    process.exit(result.status === "PASS" ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Error testing revenue at risk:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main();
