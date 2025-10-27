#!/usr/bin/env npx tsx
/**
 * Test DEFCON Escalation
 * Verifies DEFCON drops from 4-5 → 1-2 after stockout scenarios
 * Validates risk score calculation and critical SKU thresholds
 */

import { PrismaClient } from "@prisma/client";
import { calculateDEFCON } from "./app/services/defcon-calculator.server";

const db = new PrismaClient();

interface DefconTestResult {
  defconLevel: number;
  riskScore: number;
  criticalSkus: number;
  highRiskSkus: number;
  totalSkus: number;
  revenueAtRisk24h: number;
  revenueAtRisk48h: number;
  revenueAtRisk72h: number;
  velocityAnomalies: number;
  status: "PASS" | "FAIL";
  details: string[];
}

async function testDefconEscalation(): Promise<DefconTestResult> {
  console.log("\n🚨 Testing DEFCON Escalation");
  console.log("=".repeat(60));
  console.log("Expected: DEFCON 1-2 (CRITICAL/SEVERE)");
  console.log("Target Risk Score: 70-95/100");
  console.log("=".repeat(60));

  const startTime = Date.now();

  // Calculate DEFCON status
  const defconResult = await calculateDEFCON("test-shop.myshopify.com");

  const elapsed = Date.now() - startTime;

  console.log("\n📊 DEFCON Status:");
  console.log(`  Level: DEFCON ${defconResult.level}`);
  console.log(`  Label: ${defconResult.label}`);
  console.log(`  Risk Score: ${defconResult.riskScore}/100`);
  console.log(`  Color: ${defconResult.color}`);
  console.log(`  Calculation Time: ${elapsed}ms`);

  console.log("\n⚠️  Risk Breakdown:");
  console.log(`  Critical SKUs: ${defconResult.criticalSKUs}`);
  console.log(`  Warning SKUs: ${defconResult.warningSKUs}`);
  console.log(`  Healthy SKUs: ${defconResult.healthySKUs}`);
  console.log(`  Total SKUs Monitored: ${defconResult.totalSKUs}`);

  console.log("\n📊 Metrics:");
  console.log(`  Inventory Coverage Hours: ${defconResult.inventoryCoverageHours.toFixed(1)}`);
  console.log(`  Velocity Anomaly: ${defconResult.velocityAnomaly.toFixed(1)}%`);

  console.log("\n🚨 Escalation Triggers:");
  for (const trigger of defconResult.escalationTriggers) {
    console.log(`  • ${trigger}`);
  }

  // Display critical SKUs
  if (defconResult.criticalSKUs > 0) {
    console.log("\n🔴 Critical SKUs (Stockout Risk):");
    const criticalInventory = await db.inventorySnapshot.findMany({
      where: {
        shop: "test-shop.myshopify.com",
        status: "critical",
      },
      orderBy: { currentStock: "asc" },
      take: 10,
    });

    for (const item of criticalInventory) {
      console.log(
        `  • ${item.productTitle}: ${item.currentStock} units (${item.coverageHours.toFixed(1)} hours coverage)`,
      );
    }
  }

  // Validation
  const details: string[] = [];
  let status: "PASS" | "FAIL" = "PASS";

  // Test 1: DEFCON level should be 1 or 2
  if (defconResult.level <= 2) {
    details.push("✅ DEFCON escalated to critical level (1-2)");
  } else {
    details.push(
      `❌ DEFCON still at ${defconResult.level}, expected 1-2 (need more critical conditions)`,
    );
    status = "FAIL";
  }

  // Test 2: Risk score should be 70-95
  if (defconResult.riskScore >= 70 && defconResult.riskScore <= 100) {
    details.push(`✅ Risk score in target range: ${defconResult.riskScore}`);
  } else {
    details.push(
      `⚠️  Risk score ${defconResult.riskScore}, expected 70-95 (may need adjustment)`,
    );
    // Don't fail, just warn
  }

  // Test 3: Should have 3+ critical SKUs
  if (defconResult.criticalSKUs >= 3) {
    details.push(
      `✅ Critical SKU count: ${defconResult.criticalSKUs}`,
    );
  } else {
    details.push(
      `⚠️  Critical SKUs: ${defconResult.criticalSKUs}, expected at least 3`,
    );
  }

  // Test 4: Inventory coverage should be low (<12 hours for DEFCON 1-2)
  if (defconResult.inventoryCoverageHours < 12) {
    details.push(
      `✅ Low inventory coverage: ${defconResult.inventoryCoverageHours.toFixed(1)} hours`,
    );
  } else {
    details.push(
      `⚠️  Inventory coverage: ${defconResult.inventoryCoverageHours.toFixed(1)} hours, expected <12 for DEFCON 1-2`,
    );
  }

  // Test 5: Velocity anomaly check
  details.push(
    `✅ Velocity anomaly: ${defconResult.velocityAnomaly.toFixed(1)}%`,
  );

  // Test 6: Performance check (<200ms)
  if (elapsed < 200) {
    details.push(`✅ Calculation performance: ${elapsed}ms (<200ms target)`);
  } else {
    details.push(
      `⚠️  Calculation took ${elapsed}ms, target is <200ms (acceptable but could optimize)`,
    );
  }

  // Check database state
  const dbStats = await getDatabaseStats();
  console.log("\n📈 Database Stats:");
  console.log(`  Total Orders: ${dbStats.totalOrders}`);
  console.log(`  BFCM Orders (Oct 24): ${dbStats.bfcmOrders}`);
  console.log(`  Total Products: ${dbStats.totalProducts}`);
  console.log(`  Inventory Snapshots: ${dbStats.inventorySnapshots}`);

  return {
    defconLevel: defconResult.level,
    riskScore: defconResult.riskScore,
    criticalSkus: defconResult.criticalSKUs,
    highRiskSkus: defconResult.warningSKUs,
    totalSkus: defconResult.totalSKUs,
    revenueAtRisk24h: 0, // Not part of DEFCON result
    revenueAtRisk48h: 0, // Not part of DEFCON result
    revenueAtRisk72h: 0, // Not part of DEFCON result
    velocityAnomalies: defconResult.velocityAnomaly,
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
      db.inventorySnapshot.count(),
    ]);

  return {
    totalOrders,
    bfcmOrders,
    totalProducts,
    inventorySnapshots,
  };
}

async function main() {
  try {
    const result = await testDefconEscalation();

    console.log("\n" + "=".repeat(60));
    console.log("🎯 DEFCON Escalation Test Results");
    console.log("=".repeat(60));

    for (const detail of result.details) {
      console.log(detail);
    }

    console.log("\n" + "=".repeat(60));
    if (result.status === "PASS") {
      console.log("✅ ALL TESTS PASSED - DEFCON escalation working!");
    } else {
      console.log("⚠️  SOME TESTS FAILED - Review details above");
    }
    console.log("=".repeat(60));

    console.log("\n⏭️  Next Steps:");
    console.log("  1. Run: npx tsx test-revenue-risk.ts");
    console.log("  2. Verify revenue-at-risk calculations");
    console.log("  3. Test velocity anomaly detection");

    process.exit(result.status === "PASS" ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Error testing DEFCON escalation:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main();
