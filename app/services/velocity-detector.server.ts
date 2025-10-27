/**
 * Velocity Anomaly Detector Service
 *
 * Detects unusual sales velocity patterns that require attention:
 * - Viral products: 300%+ velocity increase (opportunity)
 * - Accelerating demand: >85th percentile burn rate (restocking alert)
 * - Dead stock: <10% expected velocity (clearance candidate)
 * - Category surges: Unexpected demand in product category
 *
 * Detection uses statistical analysis comparing:
 * - 24-hour velocity vs. 7-day average
 * - Current burn rate vs. historical percentiles
 * - Category performance vs. shop average
 */

import db from "../db.server";

export interface VelocityAnomaly {
  type: "viral" | "accelerating" | "dead_stock" | "category_surge";
  severity: "critical" | "high" | "medium" | "low";
  sku: string;
  productId: string;
  productTitle: string;
  location: string;
  currentVelocity: number; // units/hour
  expectedVelocity: number; // units/hour from 7-day avg
  percentChange: number; // percentage
  impact: string; // Human-readable impact description
  recommendation: string; // Action to take
}

export interface VelocityStats {
  totalAnomalies: number;
  viralProducts: number;
  acceleratingProducts: number;
  deadStockProducts: number;
  categorySurges: number;
  anomalies: VelocityAnomaly[];
}

export interface CategoryVelocity {
  category: string;
  currentVelocity: number;
  expectedVelocity: number;
  percentChange: number;
  skuCount: number;
  status: "surging" | "normal" | "declining";
}

/**
 * Detect all velocity anomalies for a shop
 */
export async function detectVelocityAnomalies(
  shop: string
): Promise<VelocityStats> {
  const startTime = Date.now();
  console.log(`🔍 Detecting velocity anomalies for ${shop}...`);

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

  // Calculate velocity percentiles for threshold detection
  const velocities = latestSnapshots
    .map((s) => s.burnRate)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);

  const p85 = calculatePercentile(velocities, 0.85);
  const p50 = calculatePercentile(velocities, 0.5);

  // Detect anomalies
  const anomalies: VelocityAnomaly[] = [];

  latestSnapshots.forEach((snapshot) => {
    // Skip if no velocity trend data
    if (snapshot.velocityTrend === 0 && snapshot.burnRate === 0) {
      return;
    }

    // Calculate expected velocity from 7-day average
    const velocityTrendMultiplier = 1 + snapshot.velocityTrend / 100;
    const expectedVelocity =
      snapshot.burnRate / Math.max(0.1, velocityTrendMultiplier);

    // Detect viral products (300%+ increase)
    if (snapshot.velocityTrend >= 300) {
      anomalies.push({
        type: "viral",
        severity: "critical",
        sku: snapshot.sku,
        productId: snapshot.productId,
        productTitle: snapshot.productTitle,
        location: snapshot.location,
        currentVelocity: snapshot.burnRate,
        expectedVelocity,
        percentChange: snapshot.velocityTrend,
        impact: `Selling ${snapshot.velocityTrend.toFixed(0)}% faster than normal - high stockout risk`,
        recommendation: "Urgent: Transfer stock from other locations or emergency reorder",
      });
    }
    // Detect accelerating demand (>85th percentile and 100%+ increase)
    else if (snapshot.burnRate >= p85 && snapshot.velocityTrend >= 100) {
      anomalies.push({
        type: "accelerating",
        severity: "high",
        sku: snapshot.sku,
        productId: snapshot.productId,
        productTitle: snapshot.productTitle,
        location: snapshot.location,
        currentVelocity: snapshot.burnRate,
        expectedVelocity,
        percentChange: snapshot.velocityTrend,
        impact: `Demand accelerating ${snapshot.velocityTrend.toFixed(0)}% above forecast`,
        recommendation: "Proactive reorder recommended before stockout",
      });
    }
    // Detect dead stock (<10% expected velocity)
    else if (
      snapshot.burnRate > 0 &&
      snapshot.burnRate < expectedVelocity * 0.1 &&
      snapshot.velocityTrend < -50
    ) {
      anomalies.push({
        type: "dead_stock",
        severity: "medium",
        sku: snapshot.sku,
        productId: snapshot.productId,
        productTitle: snapshot.productTitle,
        location: snapshot.location,
        currentVelocity: snapshot.burnRate,
        expectedVelocity,
        percentChange: snapshot.velocityTrend,
        impact: `Sales velocity ${Math.abs(snapshot.velocityTrend).toFixed(0)}% below forecast`,
        recommendation: "Consider promotion, markdown, or transfer to higher-demand location",
      });
    }
  });

  // Sort anomalies by severity and percent change
  anomalies.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return Math.abs(b.percentChange) - Math.abs(a.percentChange);
  });

  // Count by type
  const viralProducts = anomalies.filter((a) => a.type === "viral").length;
  const acceleratingProducts = anomalies.filter(
    (a) => a.type === "accelerating"
  ).length;
  const deadStockProducts = anomalies.filter(
    (a) => a.type === "dead_stock"
  ).length;

  // Detect category surges
  const categorySurges = await detectCategorySurges(shop, latestSnapshots);
  const categorySurgeAnomalies: VelocityAnomaly[] = categorySurges
    .filter((c) => c.status === "surging" && c.percentChange > 100)
    .map((c) => ({
      type: "category_surge" as const,
      severity: c.percentChange > 200 ? "critical" : ("high" as const),
      sku: `${c.skuCount} SKUs`,
      productId: "",
      productTitle: `${c.category} Category`,
      location: "All locations",
      currentVelocity: c.currentVelocity,
      expectedVelocity: c.expectedVelocity,
      percentChange: c.percentChange,
      impact: `Category-wide surge: ${c.skuCount} products up ${c.percentChange.toFixed(0)}%`,
      recommendation: "Review entire category for restocking needs",
    }));

  anomalies.push(...categorySurgeAnomalies);

  const elapsed = Date.now() - startTime;
  console.log(`✅ Detected ${anomalies.length} velocity anomalies in ${elapsed}ms`);
  console.log(
    `   Viral: ${viralProducts} | Accelerating: ${acceleratingProducts} | Dead: ${deadStockProducts} | Category: ${categorySurgeAnomalies.length}`
  );

  return {
    totalAnomalies: anomalies.length,
    viralProducts,
    acceleratingProducts,
    deadStockProducts,
    categorySurges: categorySurgeAnomalies.length,
    anomalies,
  };
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
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;

  const index = Math.ceil(sortedValues.length * percentile) - 1;
  return sortedValues[Math.max(0, index)];
}

/**
 * Detect category-level velocity surges
 */
async function detectCategorySurges(
  shop: string,
  snapshots: any[]
): Promise<CategoryVelocity[]> {
  // Get product types for all snapshots
  const productIds = [...new Set(snapshots.map((s) => s.productId))];
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

  // Group snapshots by category
  const categoryMap = new Map<
    string,
    { current: number; expected: number; count: number }
  >();

  snapshots.forEach((snapshot) => {
    const category = productTypeMap.get(snapshot.productId) || "Uncategorized";
    const existing = categoryMap.get(category) || {
      current: 0,
      expected: 0,
      count: 0,
    };

    const velocityTrendMultiplier = 1 + snapshot.velocityTrend / 100;
    const expectedVelocity =
      snapshot.burnRate / Math.max(0.1, velocityTrendMultiplier);

    categoryMap.set(category, {
      current: existing.current + snapshot.burnRate,
      expected: existing.expected + expectedVelocity,
      count: existing.count + 1,
    });
  });

  // Calculate category velocities
  const categories: CategoryVelocity[] = [];

  categoryMap.forEach((data, category) => {
    if (data.count < 2) return; // Skip categories with too few products

    const currentVelocity = data.current / data.count;
    const expectedVelocity = data.expected / data.count;
    const percentChange =
      expectedVelocity > 0
        ? ((currentVelocity - expectedVelocity) / expectedVelocity) * 100
        : 0;

    let status: "surging" | "normal" | "declining";
    if (percentChange > 50) {
      status = "surging";
    } else if (percentChange < -50) {
      status = "declining";
    } else {
      status = "normal";
    }

    categories.push({
      category,
      currentVelocity,
      expectedVelocity,
      percentChange,
      skuCount: data.count,
      status,
    });
  });

  // Sort by absolute percent change
  categories.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));

  return categories;
}

/**
 * Get viral products (top performers)
 */
export async function getViralProducts(
  shop: string,
  limit: number = 10
): Promise<VelocityAnomaly[]> {
  const stats = await detectVelocityAnomalies(shop);
  return stats.anomalies
    .filter((a) => a.type === "viral")
    .slice(0, limit);
}

/**
 * Get dead stock candidates
 */
export async function getDeadStockCandidates(
  shop: string,
  limit: number = 10
): Promise<VelocityAnomaly[]> {
  const stats = await detectVelocityAnomalies(shop);
  return stats.anomalies
    .filter((a) => a.type === "dead_stock")
    .slice(0, limit);
}

/**
 * Get velocity summary for dashboard
 */
export async function getVelocitySummary(shop: string) {
  const stats = await detectVelocityAnomalies(shop);

  // Calculate impact metrics
  const criticalAnomalies = stats.anomalies.filter(
    (a) => a.severity === "critical"
  ).length;
  const highAnomalies = stats.anomalies.filter(
    (a) => a.severity === "high"
  ).length;

  return {
    totalAnomalies: stats.totalAnomalies,
    criticalAnomalies,
    highAnomalies,
    viralProducts: stats.viralProducts,
    acceleratingProducts: stats.acceleratingProducts,
    deadStockProducts: stats.deadStockProducts,
    categorySurges: stats.categorySurges,
    topAnomalies: stats.anomalies.slice(0, 5), // Top 5 for dashboard
  };
}

/**
 * Get category performance overview
 */
export async function getCategoryPerformance(shop: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const snapshots = await db.inventorySnapshot.findMany({
    where: {
      shop,
      createdAt: { gte: oneHourAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  const latestSnapshots = getLatestSnapshotPerSKU(snapshots);
  const categories = await detectCategorySurges(shop, latestSnapshots);

  return categories.slice(0, 10); // Top 10 categories
}

/**
 * Check if a specific SKU is experiencing velocity anomaly
 */
export async function checkSKUVelocity(
  shop: string,
  sku: string
): Promise<VelocityAnomaly | null> {
  const stats = await detectVelocityAnomalies(shop);
  return stats.anomalies.find((a) => a.sku === sku) || null;
}
