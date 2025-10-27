/**
 * Revenue Risk Calculator Service
 *
 * Calculates potential revenue at risk due to stockouts across multiple time horizons:
 * - 24-hour window: Immediate risk requiring urgent action
 * - 48-hour window: Near-term risk for proactive intervention
 * - 72-hour window: Strategic risk for planning and reordering
 *
 * Risk calculation factors:
 * - Current inventory levels
 * - Historical burn rates
 * - Product pricing and margins
 * - Lost sale probability based on customer behavior
 * - Seasonal velocity adjustments
 */

import db from "../db.server";

export interface RevenueAtRisk {
  window: "24h" | "48h" | "72h";
  totalRevenue: number;
  lostSaleProbability: number;
  expectedLoss: number;
  affectedSKUs: number;
  breakdown: RevenueRiskBreakdown[];
}

export interface RevenueRiskBreakdown {
  sku: string;
  productId: string;
  productTitle: string;
  location: string;
  currentStock: number;
  coverageHours: number;
  burnRate: number;
  price: number;
  revenueAtRisk: number;
  lostSaleProbability: number;
  expectedLoss: number;
  urgency: "critical" | "high" | "medium" | "low";
}

export interface TopAtRiskProduct {
  rank: number;
  sku: string;
  productTitle: string;
  hoursUntilStockout: number;
  revenueAtRisk: number;
  currentStock: number;
  burnRate: number;
  location: string;
  urgency: "critical" | "high" | "medium" | "low";
}

/**
 * Calculate revenue at risk for multiple time windows
 */
export async function calculateRevenueRisk(
  shop: string
): Promise<RevenueAtRisk[]> {
  const startTime = Date.now();
  console.log(`💰 Calculating revenue at risk for ${shop}...`);

  // Get recent inventory snapshots (last 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const snapshots = await db.inventorySnapshot.findMany({
    where: {
      shop,
      createdAt: { gte: oneHourAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get latest snapshot per SKU+location
  const latestSnapshots = getLatestSnapshotPerSKU(snapshots);

  // Get product pricing data
  const productIds = [...new Set(latestSnapshots.map((s) => s.productId))];
  const products = await db.product.findMany({
    where: {
      shop,
      id: { in: productIds },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Get recent orders to calculate average prices
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentOrders = await db.order.findMany({
    where: {
      shop,
      processedAt: { gte: sevenDaysAgo },
    },
    include: {
      lineItems: true,
    },
  });

  // Calculate average price per product
  const priceMap = calculateAveragePrices(recentOrders);

  // Calculate risk for each time window
  const windows: Array<"24h" | "48h" | "72h"> = ["24h", "48h", "72h"];
  const results: RevenueAtRisk[] = [];

  for (const window of windows) {
    const windowHours = parseInt(window);
    const risk = calculateRiskForWindow(
      latestSnapshots,
      productMap,
      priceMap,
      windowHours
    );
    results.push(risk);
  }

  const elapsed = Date.now() - startTime;
  console.log(`✅ Revenue risk calculated in ${elapsed}ms`);
  console.log(
    `   24h: $${results[0].expectedLoss.toFixed(2)} | 48h: $${results[1].expectedLoss.toFixed(2)} | 72h: $${results[2].expectedLoss.toFixed(2)}`
  );

  return results;
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
 * Calculate average prices from recent orders
 */
function calculateAveragePrices(orders: any[]): Map<string, number> {
  const priceData = new Map<string, { total: number; count: number }>();

  orders.forEach((order) => {
    order.lineItems.forEach((item: any) => {
      const existing = priceData.get(item.productId) || { total: 0, count: 0 };
      priceData.set(item.productId, {
        total: existing.total + item.price,
        count: existing.count + 1,
      });
    });
  });

  const avgPrices = new Map<string, number>();
  priceData.forEach((data, productId) => {
    avgPrices.set(productId, data.total / data.count);
  });

  return avgPrices;
}

/**
 * Calculate risk for a specific time window
 */
function calculateRiskForWindow(
  snapshots: any[],
  productMap: Map<string, any>,
  priceMap: Map<string, number>,
  windowHours: number
): RevenueAtRisk {
  const window = `${windowHours}h` as "24h" | "48h" | "72h";
  const breakdown: RevenueRiskBreakdown[] = [];
  let totalRevenue = 0;
  let affectedSKUs = 0;

  snapshots.forEach((snapshot) => {
    // Only include products that will stockout within this window
    if (snapshot.coverageHours >= windowHours) {
      return; // Not at risk in this window
    }

    affectedSKUs++;

    // Get product price
    const price = priceMap.get(snapshot.productId) || 0;
    if (price === 0) {
      return; // Skip products with no price data
    }

    // Calculate hours of lost sales
    const hoursUntilStockout = snapshot.coverageHours;
    const hoursOfLostSales = windowHours - hoursUntilStockout;

    // Calculate potential revenue at risk
    const unitsAtRisk = snapshot.burnRate * hoursOfLostSales;
    const revenueAtRisk = unitsAtRisk * price;

    // Calculate lost sale probability based on coverage hours
    // Critical (<4h): 90% probability
    // High (4-12h): 70% probability
    // Medium (12-24h): 50% probability
    // Low (>24h): 30% probability
    let lostSaleProbability: number;
    if (hoursUntilStockout < 4) {
      lostSaleProbability = 0.9;
    } else if (hoursUntilStockout < 12) {
      lostSaleProbability = 0.7;
    } else if (hoursUntilStockout < 24) {
      lostSaleProbability = 0.5;
    } else {
      lostSaleProbability = 0.3;
    }

    // Adjust probability based on velocity trend
    // Accelerating demand = higher risk
    if (snapshot.velocityTrend > 50) {
      lostSaleProbability = Math.min(0.95, lostSaleProbability * 1.2);
    } else if (snapshot.velocityTrend > 20) {
      lostSaleProbability = Math.min(0.95, lostSaleProbability * 1.1);
    }

    const expectedLoss = revenueAtRisk * lostSaleProbability;

    // Determine urgency
    let urgency: "critical" | "high" | "medium" | "low";
    if (hoursUntilStockout < 4) {
      urgency = "critical";
    } else if (hoursUntilStockout < 12) {
      urgency = "high";
    } else if (hoursUntilStockout < 24) {
      urgency = "medium";
    } else {
      urgency = "low";
    }

    totalRevenue += revenueAtRisk;

    breakdown.push({
      sku: snapshot.sku,
      productId: snapshot.productId,
      productTitle: snapshot.productTitle,
      location: snapshot.location,
      currentStock: snapshot.currentStock,
      coverageHours: snapshot.coverageHours,
      burnRate: snapshot.burnRate,
      price,
      revenueAtRisk,
      lostSaleProbability,
      expectedLoss,
      urgency,
    });
  });

  // Calculate overall lost sale probability (weighted average)
  const totalExpectedLoss = breakdown.reduce(
    (sum, item) => sum + item.expectedLoss,
    0
  );
  const overallProbability =
    totalRevenue > 0 ? totalExpectedLoss / totalRevenue : 0;

  // Sort breakdown by expected loss (descending)
  breakdown.sort((a, b) => b.expectedLoss - a.expectedLoss);

  return {
    window,
    totalRevenue,
    lostSaleProbability: overallProbability,
    expectedLoss: totalExpectedLoss,
    affectedSKUs,
    breakdown,
  };
}

/**
 * Get top N products at risk
 */
export async function getTopAtRiskProducts(
  shop: string,
  limit: number = 10
): Promise<TopAtRiskProduct[]> {
  console.log(`📊 Fetching top ${limit} at-risk products for ${shop}...`);

  // Calculate revenue risk
  const risks = await calculateRevenueRisk(shop);

  // Use 48-hour window as default for "top at risk"
  const risk48h = risks.find((r) => r.window === "48h");
  if (!risk48h || risk48h.breakdown.length === 0) {
    return [];
  }

  // Get top N by expected loss
  const topProducts: TopAtRiskProduct[] = risk48h.breakdown
    .slice(0, limit)
    .map((item, index) => ({
      rank: index + 1,
      sku: item.sku,
      productTitle: item.productTitle,
      hoursUntilStockout: item.coverageHours,
      revenueAtRisk: item.revenueAtRisk,
      currentStock: item.currentStock,
      burnRate: item.burnRate,
      location: item.location,
      urgency: item.urgency,
    }));

  return topProducts;
}

/**
 * Get revenue risk summary for dashboard display
 */
export async function getRevenueRiskSummary(shop: string) {
  const risks = await calculateRevenueRisk(shop);

  return {
    "24h": {
      totalRisk: risks[0].totalRevenue,
      expectedLoss: risks[0].expectedLoss,
      affectedSKUs: risks[0].affectedSKUs,
      probability: risks[0].lostSaleProbability,
    },
    "48h": {
      totalRisk: risks[1].totalRevenue,
      expectedLoss: risks[1].expectedLoss,
      affectedSKUs: risks[1].affectedSKUs,
      probability: risks[1].lostSaleProbability,
    },
    "72h": {
      totalRisk: risks[2].totalRevenue,
      expectedLoss: risks[2].expectedLoss,
      affectedSKUs: risks[2].affectedSKUs,
      probability: risks[2].lostSaleProbability,
    },
  };
}

/**
 * Calculate revenue risk by location
 */
export async function getRevenueRiskByLocation(shop: string) {
  const risks = await calculateRevenueRisk(shop);
  const risk48h = risks.find((r) => r.window === "48h");

  if (!risk48h) {
    return [];
  }

  // Group by location
  const locationMap = new Map<
    string,
    { revenue: number; loss: number; skus: number }
  >();

  risk48h.breakdown.forEach((item) => {
    const existing = locationMap.get(item.location) || {
      revenue: 0,
      loss: 0,
      skus: 0,
    };
    locationMap.set(item.location, {
      revenue: existing.revenue + item.revenueAtRisk,
      loss: existing.loss + item.expectedLoss,
      skus: existing.skus + 1,
    });
  });

  // Convert to array and sort by loss
  const locations = Array.from(locationMap.entries())
    .map(([location, data]) => ({
      location,
      revenueAtRisk: data.revenue,
      expectedLoss: data.loss,
      affectedSKUs: data.skus,
    }))
    .sort((a, b) => b.expectedLoss - a.expectedLoss);

  return locations;
}

/**
 * Calculate revenue risk by category/product type
 */
export async function getRevenueRiskByCategory(shop: string) {
  const risks = await calculateRevenueRisk(shop);
  const risk48h = risks.find((r) => r.window === "48h");

  if (!risk48h) {
    return [];
  }

  // Get product types
  const productIds = risk48h.breakdown.map((item) => item.productId);
  const products = await db.product.findMany({
    where: {
      shop,
      id: { in: productIds },
    },
    select: {
      id: true,
      productType: true,
    },
  });

  const productTypeMap = new Map(
    products.map((p) => [p.id, p.productType || "Uncategorized"])
  );

  // Group by product type
  const categoryMap = new Map<
    string,
    { revenue: number; loss: number; skus: number }
  >();

  risk48h.breakdown.forEach((item) => {
    const category = productTypeMap.get(item.productId) || "Uncategorized";
    const existing = categoryMap.get(category) || {
      revenue: 0,
      loss: 0,
      skus: 0,
    };
    categoryMap.set(category, {
      revenue: existing.revenue + item.revenueAtRisk,
      loss: existing.loss + item.expectedLoss,
      skus: existing.skus + 1,
    });
  });

  // Convert to array and sort by loss
  const categories = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      revenueAtRisk: data.revenue,
      expectedLoss: data.loss,
      affectedSKUs: data.skus,
    }))
    .sort((a, b) => b.expectedLoss - a.expectedLoss);

  return categories;
}
