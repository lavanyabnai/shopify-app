/**
 * DEFCON Calculator Service
 *
 * Calculates overall system health and DEFCON level based on:
 * - Inventory coverage hours
 * - Velocity anomalies
 * - Stockout risk
 * - Order fulfillment capacity
 *
 * DEFCON Levels:
 * - DEFCON 1: CRITICAL - Imminent stockouts (<4 hours coverage)
 * - DEFCON 2: SEVERE - High risk (4-12 hours coverage)
 * - DEFCON 3: ELEVATED - Moderate risk (12-24 hours coverage)
 * - DEFCON 4: GUARDED - Low risk (24-48 hours coverage)
 * - DEFCON 5: NORMAL - All clear (>48 hours coverage)
 */

import db from "../db.server";

export interface DEFCONStatus {
  level: number; // 1-5
  label: string;
  color: "critical" | "warning" | "caution" | "info" | "success";
  inventoryCoverageHours: number;
  velocityAnomaly: number;
  riskScore: number;
  escalationTriggers: string[];
  criticalSKUs: number;
  warningSKUs: number;
  healthySKUs: number;
  totalSKUs: number;
}

export interface InventoryHealth {
  sku: string;
  productId: string;
  productTitle: string;
  location: string;
  currentStock: number;
  burnRate: number;
  coverageHours: number;
  status: "healthy" | "warning" | "critical" | "stockout";
  velocityTrend: number;
}

/**
 * Calculate DEFCON level for a shop
 */
export async function calculateDEFCON(shop: string): Promise<DEFCONStatus> {
  const startTime = Date.now();
  console.log(`🎯 Calculating DEFCON level for ${shop}...`);

  // Get recent inventory snapshots (last 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentSnapshots = await db.inventorySnapshot.findMany({
    where: {
      shop,
      createdAt: { gte: oneHourAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  // If no data, compute from live orders
  if (recentSnapshots.length === 0) {
    console.log("⚠️ No inventory snapshots found, computing from live data...");
    return await computeDEFCONFromOrders(shop);
  }

  // Get latest snapshot per SKU+location
  const latestSnapshots = getLatestSnapshotPerSKU(recentSnapshots);

  // Calculate health metrics
  const healthMetrics = calculateHealthMetrics(latestSnapshots);

  // Determine DEFCON level based on metrics
  const defconStatus = determineDEFCONLevel(healthMetrics);

  // Save metrics to database
  await db.warRoomMetrics.create({
    data: {
      shop,
      defconLevel: defconStatus.level,
      inventoryCoverageHours: defconStatus.inventoryCoverageHours,
      velocityAnomaly: defconStatus.velocityAnomaly,
      riskScore: defconStatus.riskScore,
      escalationTriggers: JSON.stringify(defconStatus.escalationTriggers),
    },
  });

  const elapsed = Date.now() - startTime;
  console.log(
    `✅ DEFCON ${defconStatus.level} calculated in ${elapsed}ms (${defconStatus.label})`
  );

  return defconStatus;
}

/**
 * Get latest snapshot for each unique SKU+location combination
 */
function getLatestSnapshotPerSKU(snapshots: any[]): any[] {
  const snapshotMap = new Map<string, any>();

  snapshots.forEach((snapshot) => {
    const key = `${snapshot.sku}:${snapshot.location}`;
    const existing = snapshotMap.get(key);

    if (!existing || snapshot.createdAt > existing.createdAt) {
      snapshotMap.set(key, snapshot);
    }
  });

  return Array.from(snapshotMap.values());
}

/**
 * Calculate overall health metrics from inventory snapshots
 */
function calculateHealthMetrics(snapshots: any[]) {
  let totalCoverageHours = 0;
  let criticalCount = 0; // <4 hours
  let warningCount = 0; // 4-24 hours
  let healthyCount = 0; // >24 hours
  let stockoutCount = 0; // 0 stock
  let velocityAnomalies = 0; // Velocity trend >50% change

  snapshots.forEach((snapshot) => {
    totalCoverageHours += snapshot.coverageHours;

    // Count by status
    if (snapshot.status === "stockout") {
      stockoutCount++;
    } else if (snapshot.status === "critical") {
      criticalCount++;
    } else if (snapshot.status === "warning") {
      warningCount++;
    } else {
      healthyCount++;
    }

    // Detect velocity anomalies (>50% change)
    if (Math.abs(snapshot.velocityTrend) > 50) {
      velocityAnomalies++;
    }
  });

  const totalSKUs = snapshots.length;
  const avgCoverageHours = totalSKUs > 0 ? totalCoverageHours / totalSKUs : 0;
  const velocityAnomalyPercent =
    totalSKUs > 0 ? (velocityAnomalies / totalSKUs) * 100 : 0;

  return {
    avgCoverageHours,
    velocityAnomalyPercent,
    criticalCount,
    warningCount,
    healthyCount,
    stockoutCount,
    totalSKUs,
  };
}

/**
 * Determine DEFCON level based on health metrics
 */
function determineDEFCONLevel(metrics: {
  avgCoverageHours: number;
  velocityAnomalyPercent: number;
  criticalCount: number;
  warningCount: number;
  healthyCount: number;
  stockoutCount: number;
  totalSKUs: number;
}): DEFCONStatus {
  const escalationTriggers: string[] = [];
  let riskScore = 0;

  // Calculate risk score (0-100)
  // Factor 1: Average coverage hours (40 points max)
  const coverageScore = Math.max(0, 40 - metrics.avgCoverageHours);
  riskScore += coverageScore;

  // Factor 2: Critical SKU percentage (30 points max)
  const criticalPercent =
    metrics.totalSKUs > 0 ? (metrics.criticalCount / metrics.totalSKUs) * 100 : 0;
  const criticalScore = criticalPercent * 0.3;
  riskScore += criticalScore;

  // Factor 3: Stockout percentage (20 points max)
  const stockoutPercent =
    metrics.totalSKUs > 0 ? (metrics.stockoutCount / metrics.totalSKUs) * 100 : 0;
  const stockoutScore = stockoutPercent * 0.2;
  riskScore += stockoutScore;

  // Factor 4: Velocity anomalies (10 points max)
  const anomalyScore = Math.min(10, metrics.velocityAnomalyPercent / 10);
  riskScore += anomalyScore;

  riskScore = Math.min(100, Math.round(riskScore));

  // Determine DEFCON level
  let level: number;
  let label: string;
  let color: "critical" | "warning" | "caution" | "info" | "success";

  if (metrics.stockoutCount > 0) {
    escalationTriggers.push(`${metrics.stockoutCount} SKUs out of stock`);
  }

  if (metrics.avgCoverageHours < 4) {
    level = 1;
    label = "CRITICAL";
    color = "critical";
    escalationTriggers.push(
      `Average coverage below 4 hours (${metrics.avgCoverageHours.toFixed(1)}h)`
    );
  } else if (metrics.avgCoverageHours < 12 || criticalPercent > 20) {
    level = 2;
    label = "SEVERE";
    color = "critical";
    if (metrics.avgCoverageHours < 12) {
      escalationTriggers.push(
        `Average coverage below 12 hours (${metrics.avgCoverageHours.toFixed(1)}h)`
      );
    }
    if (criticalPercent > 20) {
      escalationTriggers.push(`${criticalPercent.toFixed(0)}% of SKUs critical`);
    }
  } else if (metrics.avgCoverageHours < 24 || criticalPercent > 10) {
    level = 3;
    label = "ELEVATED";
    color = "warning";
    if (metrics.avgCoverageHours < 24) {
      escalationTriggers.push(
        `Average coverage below 24 hours (${metrics.avgCoverageHours.toFixed(1)}h)`
      );
    }
    if (criticalPercent > 10) {
      escalationTriggers.push(`${criticalPercent.toFixed(0)}% of SKUs critical`);
    }
  } else if (metrics.avgCoverageHours < 48 || metrics.velocityAnomalyPercent > 30) {
    level = 4;
    label = "GUARDED";
    color = "caution";
    if (metrics.avgCoverageHours < 48) {
      escalationTriggers.push(
        `Coverage below 48 hours (${metrics.avgCoverageHours.toFixed(1)}h)`
      );
    }
    if (metrics.velocityAnomalyPercent > 30) {
      escalationTriggers.push(
        `${metrics.velocityAnomalyPercent.toFixed(0)}% velocity anomalies`
      );
    }
  } else {
    level = 5;
    label = "NORMAL";
    color = "success";
    escalationTriggers.push("All systems healthy");
  }

  if (escalationTriggers.length === 0) {
    escalationTriggers.push("Monitoring normal operations");
  }

  return {
    level,
    label,
    color,
    inventoryCoverageHours: metrics.avgCoverageHours,
    velocityAnomaly: metrics.velocityAnomalyPercent,
    riskScore,
    escalationTriggers,
    criticalSKUs: metrics.criticalCount,
    warningSKUs: metrics.warningCount,
    healthySKUs: metrics.healthyCount,
    totalSKUs: metrics.totalSKUs,
  };
}

/**
 * Compute DEFCON from live order data (fallback when no snapshots exist)
 */
async function computeDEFCONFromOrders(shop: string): Promise<DEFCONStatus> {
  console.log("📊 Computing DEFCON from order history...");

  // Get products with inventory data
  const products = await db.product.findMany({
    where: { shop, status: "active" },
    select: {
      id: true,
      title: true,
      totalInventory: true,
    },
  });

  // Get recent orders to calculate burn rate (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentOrders = await db.order.findMany({
    where: {
      shop,
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      lineItems: true,
    },
  });

  // Calculate burn rate per product
  const productBurnRates = new Map<string, number>();
  const hoursSinceStart = (Date.now() - sevenDaysAgo.getTime()) / (1000 * 60 * 60);

  recentOrders.forEach((order) => {
    order.lineItems.forEach((item) => {
      const current = productBurnRates.get(item.productId) || 0;
      productBurnRates.set(item.productId, current + item.quantity);
    });
  });

  // Convert to hourly burn rate
  productBurnRates.forEach((totalSold, productId) => {
    const hourlyRate = totalSold / hoursSinceStart;
    productBurnRates.set(productId, hourlyRate);
  });

  // Calculate coverage hours for each product
  let totalCoverageHours = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let healthyCount = 0;
  let stockoutCount = 0;

  products.forEach((product) => {
    const burnRate = productBurnRates.get(product.id) || 0;
    const coverageHours =
      burnRate > 0 ? product.totalInventory / burnRate : 999;

    totalCoverageHours += coverageHours;

    if (product.totalInventory === 0) {
      stockoutCount++;
    } else if (coverageHours < 4) {
      criticalCount++;
    } else if (coverageHours < 24) {
      warningCount++;
    } else {
      healthyCount++;
    }
  });

  const totalSKUs = products.length;
  const avgCoverageHours = totalSKUs > 0 ? totalCoverageHours / totalSKUs : 0;

  const metrics = {
    avgCoverageHours,
    velocityAnomalyPercent: 0, // Can't calculate without historical data
    criticalCount,
    warningCount,
    healthyCount,
    stockoutCount,
    totalSKUs,
  };

  return determineDEFCONLevel(metrics);
}

/**
 * Update inventory snapshot for a product
 */
export async function updateInventorySnapshot(
  shop: string,
  productId: string,
  sku: string,
  productTitle: string,
  location: string,
  currentStock: number
): Promise<void> {
  console.log(`📸 Updating inventory snapshot for ${sku} at ${location}`);

  // Calculate burn rate from recent orders (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentOrders = await db.order.findMany({
    where: {
      shop,
      processedAt: { gte: oneDayAgo },
    },
    include: {
      lineItems: {
        where: { productId },
      },
    },
  });

  let totalSold = 0;
  recentOrders.forEach((order) => {
    order.lineItems.forEach((item) => {
      totalSold += item.quantity;
    });
  });

  const hoursSinceStart = 24;
  const burnRate = totalSold / hoursSinceStart;
  const coverageHours = burnRate > 0 ? currentStock / burnRate : 999;

  // Calculate velocity trend (compare to 7-day average)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekOrders = await db.order.findMany({
    where: {
      shop,
      processedAt: { gte: sevenDaysAgo },
    },
    include: {
      lineItems: {
        where: { productId },
      },
    },
  });

  let weekTotalSold = 0;
  weekOrders.forEach((order) => {
    order.lineItems.forEach((item) => {
      weekTotalSold += item.quantity;
    });
  });

  const weekBurnRate = weekTotalSold / (7 * 24);
  const velocityTrend =
    weekBurnRate > 0 ? ((burnRate - weekBurnRate) / weekBurnRate) * 100 : 0;

  // Determine status
  let status: "healthy" | "warning" | "critical" | "stockout";
  if (currentStock === 0) {
    status = "stockout";
  } else if (coverageHours < 4) {
    status = "critical";
  } else if (coverageHours < 24) {
    status = "warning";
  } else {
    status = "healthy";
  }

  // Calculate reorder point (safety stock for 48 hours)
  const reorderPoint = Math.ceil(burnRate * 48);

  // Save snapshot
  await db.inventorySnapshot.create({
    data: {
      shop,
      sku,
      productId,
      productTitle,
      location,
      currentStock,
      burnRate,
      coverageHours: Math.min(coverageHours, 999),
      reorderPoint,
      velocityTrend,
      status,
    },
  });
}

/**
 * Get latest DEFCON status from database (cached)
 */
export async function getLatestDEFCON(shop: string): Promise<DEFCONStatus | null> {
  const latest = await db.warRoomMetrics.findFirst({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) return null;

  // Get SKU counts from latest snapshots
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentSnapshots = await db.inventorySnapshot.findMany({
    where: {
      shop,
      createdAt: { gte: fiveMinutesAgo },
    },
  });

  const latestSnapshots = getLatestSnapshotPerSKU(recentSnapshots);
  const criticalSKUs = latestSnapshots.filter((s) => s.status === "critical").length;
  const warningSKUs = latestSnapshots.filter((s) => s.status === "warning").length;
  const healthySKUs = latestSnapshots.filter((s) => s.status === "healthy").length;

  let color: "critical" | "warning" | "caution" | "info" | "success";
  let label: string;

  switch (latest.defconLevel) {
    case 1:
      color = "critical";
      label = "CRITICAL";
      break;
    case 2:
      color = "critical";
      label = "SEVERE";
      break;
    case 3:
      color = "warning";
      label = "ELEVATED";
      break;
    case 4:
      color = "caution";
      label = "GUARDED";
      break;
    default:
      color = "success";
      label = "NORMAL";
  }

  return {
    level: latest.defconLevel,
    label,
    color,
    inventoryCoverageHours: latest.inventoryCoverageHours,
    velocityAnomaly: latest.velocityAnomaly,
    riskScore: latest.riskScore,
    escalationTriggers: JSON.parse(latest.escalationTriggers),
    criticalSKUs,
    warningSKUs,
    healthySKUs,
    totalSKUs: latestSnapshots.length,
  };
}
