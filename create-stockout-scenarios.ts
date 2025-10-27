#!/usr/bin/env npx tsx
/**
 * Create Stockout Scenarios
 * Sets critical inventory levels (0-10 units) to trigger DEFCON 1-2
 * Updates inventory snapshots and creates high burn rate conditions
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// BFCM Day: October 24, 2025
const BFCM_DATE = new Date("2025-10-24T00:00:00Z");

// Critical stockout scenarios
const STOCKOUT_SCENARIOS = [
  {
    productId: "gid://shopify/Product/8891382743338",
    title: "Premium Leather Phone Case",
    sku: "CASE-LEATHER-001",
    inventoryLevel: 3, // CRITICAL - 3 units left
    category: "Accessories",
    locationId: "gid://shopify/Location/1",
    severity: "CRITICAL",
    expectedBurnRate: 45, // units/hour during peak
  },
  {
    productId: "gid://shopify/Product/8891382710570",
    title: "AirFlow Pro Wireless Earbuds",
    sku: "AIRFLOW-PRO-001",
    inventoryLevel: 8, // HIGH RISK - 8 units left
    category: "Electronics",
    locationId: "gid://shopify/Location/1",
    severity: "HIGH",
    expectedBurnRate: 35, // units/hour during peak
  },
  {
    productId: "gid://shopify/Product/8891382776106",
    title: "USB-C Fast Charging Cable",
    sku: "CABLE-USBC-001",
    inventoryLevel: 5, // CRITICAL - 5 units left
    category: "Electronics",
    locationId: "gid://shopify/Location/1",
    severity: "CRITICAL",
    expectedBurnRate: 25, // units/hour
  },
  {
    productId: "gid://shopify/Product/8891382808874",
    title: "Wireless Charging Pad",
    sku: "CHARGER-WIRELESS-001",
    inventoryLevel: 7, // MODERATE RISK
    category: "Electronics",
    locationId: "gid://shopify/Location/1",
    severity: "MODERATE",
    expectedBurnRate: 18, // units/hour
  },
  {
    productId: "gid://shopify/Product/8891382841642",
    title: "Screen Protector Bundle",
    sku: "SCREEN-PROTECT-001",
    inventoryLevel: 10, // LOW RISK
    category: "Accessories",
    locationId: "gid://shopify/Location/1",
    severity: "LOW",
    expectedBurnRate: 12, // units/hour
  },
  {
    productId: "gid://shopify/Product/8891382677802",
    title: "Bluetooth Speaker Mini",
    sku: "SPEAKER-MINI-001",
    inventoryLevel: 2, // CRITICAL - 2 units left
    category: "Electronics",
    locationId: "gid://shopify/Location/1",
    severity: "CRITICAL",
    expectedBurnRate: 20, // units/hour
  },
];

async function createStockoutScenarios() {
  console.log("\n⚠️  Creating BFCM Day Stockout Scenarios");
  console.log("=".repeat(60));
  console.log(`Date: ${BFCM_DATE.toISOString().split("T")[0]}`);
  console.log(`Target: ${STOCKOUT_SCENARIOS.length} products with stockout risk`);
  console.log(`Severity: CRITICAL to LOW`);
  console.log("=".repeat(60));

  let criticalCount = 0;
  let highCount = 0;
  let moderateCount = 0;

  for (const scenario of STOCKOUT_SCENARIOS) {
    // Update or create product
    await db.product.upsert({
      where: { id: scenario.productId },
      update: {
        totalInventory: scenario.inventoryLevel,
      },
      create: {
        id: scenario.productId,
        title: scenario.title,
        status: "ACTIVE",
        totalInventory: scenario.inventoryLevel,
        shop: "test-shop.myshopify.com",
      },
    });

    // Calculate velocity from recent orders
    const recentOrders = await db.orderLineItem.aggregate({
      where: {
        productId: scenario.productId,
        order: {
          createdAt: {
            gte: new Date(BFCM_DATE.getTime() - 24 * 60 * 60 * 1000), // Last 24h
          },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const velocity24h = recentOrders._sum.quantity || 0;

    // Calculate days until stockout
    const avgDailyVelocity = velocity24h;
    const daysUntilStockout =
      avgDailyVelocity > 0 ? scenario.inventoryLevel / avgDailyVelocity : 999;

    // Calculate hours until stockout (using expected burn rate)
    const hoursUntilStockout =
      scenario.expectedBurnRate > 0
        ? scenario.inventoryLevel / scenario.expectedBurnRate
        : 999;

    // Create inventory snapshot
    await db.inventorySnapshot.create({
      data: {
        shop: "test-shop.myshopify.com",
        productId: scenario.productId,
        productTitle: scenario.title,
        sku: scenario.sku,
        location: scenario.locationId,
        currentStock: scenario.inventoryLevel,
        burnRate: scenario.expectedBurnRate,
        coverageHours: scenario.inventoryLevel / scenario.expectedBurnRate,
        reorderPoint: Math.ceil(scenario.expectedBurnRate * 24), // 24 hours of coverage
        velocityTrend: 0, // Neutral trend
        status:
          scenario.inventoryLevel <= 3
            ? "critical"
            : scenario.inventoryLevel <= 8
              ? "warning"
              : "healthy",
        createdAt: BFCM_DATE,
      },
    });

    // Track severity counts
    if (scenario.severity === "CRITICAL") criticalCount++;
    else if (scenario.severity === "HIGH") highCount++;
    else if (scenario.severity === "MODERATE") moderateCount++;

    console.log(`\n📦 ${scenario.title}`);
    console.log(`  SKU: ${scenario.sku}`);
    console.log(`  Inventory: ${scenario.inventoryLevel} units`);
    console.log(`  24h Velocity: ${velocity24h} units`);
    console.log(`  Burn Rate: ${scenario.expectedBurnRate} units/hour (peak)`);
    console.log(
      `  Stockout ETA: ${hoursUntilStockout.toFixed(1)} hours (${daysUntilStockout.toFixed(1)} days avg)`,
    );
    console.log(`  Severity: ${scenario.severity}`);
  }

  // Calculate total revenue at risk
  const revenueAtRisk = await calculateRevenueAtRisk();

  console.log("\n⚠️  Stockout Scenario Summary");
  console.log("=".repeat(60));
  console.log(`🔴 CRITICAL SKUs: ${criticalCount}`);
  console.log(`🟠 HIGH RISK SKUs: ${highCount}`);
  console.log(`🟡 MODERATE RISK SKUs: ${moderateCount}`);
  console.log(`💰 Revenue at Risk (24h): $${revenueAtRisk.toLocaleString()}`);

  console.log("\n🎯 Expected DEFCON Impact:");
  console.log(`  Current: DEFCON 4-5 (BASELINE)`);
  console.log(`  Expected: DEFCON 1-2 (CRITICAL/SEVERE)`);
  console.log(`  Risk Score: 70-95/100`);

  console.log("\n⏭️  Next Steps:");
  console.log(`  1. Run: npx tsx test-defcon-escalation.ts`);
  console.log(`  2. Verify DEFCON drops to 1-2`);
  console.log(`  3. Check critical SKU count matches ${criticalCount}`);
}

async function calculateRevenueAtRisk(): Promise<number> {
  let totalRevenue = 0;

  for (const scenario of STOCKOUT_SCENARIOS) {
    // Get product price from recent orders
    const recentOrder = await db.orderLineItem.findFirst({
      where: { productId: scenario.productId },
      orderBy: { id: "desc" },
    });

    if (recentOrder) {
      // Calculate potential lost revenue if product stocks out
      // Assume we could sell 3x current inventory during BFCM peak
      const potentialDemand = scenario.inventoryLevel * 3;
      const lostSales = potentialDemand - scenario.inventoryLevel;
      const revenue = lostSales * recentOrder.price;
      totalRevenue += revenue;
    }
  }

  return totalRevenue;
}

async function main() {
  try {
    await createStockoutScenarios();
    console.log("\n✅ Stockout scenarios created successfully!");
  } catch (error) {
    console.error("\n❌ Error creating stockout scenarios:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main();
