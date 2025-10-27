/**
 * Recommendation Engine Service
 *
 * Generates prescriptive actions based on War Room metrics:
 * - Transfer inventory between locations
 * - Trigger supplier reorders
 * - Adjust pricing for demand management
 * - Throttle traffic to conserve inventory
 *
 * Actions are ranked by estimated ROI and urgency.
 */

import db from "../db.server";
import { calculateStockoutCountdowns } from "./stockout-countdown.server";
import { detectVelocityAnomalies } from "./velocity-detector.server";
import { generatePredictions } from "./prediction-engine.server";

export interface Recommendation {
  id?: string;
  shop: string;
  type: "transfer" | "reorder" | "price_adjustment" | "traffic_throttle";
  priority: number; // 1-10
  estimatedROI: number;
  confidence: number; // 0-100
  status: string;
  parameters: Record<string, any>;
  reason: string;
  urgency: "critical" | "high" | "medium" | "low";
  sourceMetrics?: Record<string, any>;
  expiresAt?: Date;
}

/**
 * Generate all recommendations for a shop
 */
export async function generateRecommendations(
  shop: string
): Promise<Recommendation[]> {
  const startTime = Date.now();
  console.log(`🎯 Generating recommendations for ${shop}...`);

  // Gather data from prediction and velocity services
  const [countdownData, anomaliesData, predictionsData] = await Promise.all([
    calculateStockoutCountdowns(shop),
    detectVelocityAnomalies(shop),
    generatePredictions(shop),
  ]);

  // Extract arrays from results
  const countdowns = countdownData.countdowns || [];
  const velocityAnomalies = anomaliesData.anomalies || [];
  const predictions = predictionsData.predictions || [];

  const recommendations: Recommendation[] = [];

  // 1. Transfer recommendations (from overstocked to understocked locations)
  const transferRecs = await generateTransferRecommendations(
    shop,
    countdowns,
    velocityAnomalies
  );
  recommendations.push(...transferRecs);

  // 2. Reorder recommendations (for stockouts within 24 hours)
  const reorderRecs = await generateReorderRecommendations(
    shop,
    countdowns,
    predictions
  );
  recommendations.push(...reorderRecs);

  // 3. Price adjustment recommendations (surge pricing or markdowns)
  const priceRecs = await generatePriceRecommendations(
    shop,
    velocityAnomalies,
    countdowns
  );
  recommendations.push(...priceRecs);

  // 4. Traffic throttling recommendations (conserve inventory)
  const throttleRecs = await generateThrottleRecommendations(
    shop,
    countdowns,
    predictions
  );
  recommendations.push(...throttleRecs);

  // Sort by priority (highest first) and estimated ROI
  recommendations.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.estimatedROI - a.estimatedROI;
  });

  const duration = Date.now() - startTime;
  console.log(
    `✅ Generated ${recommendations.length} recommendations in ${duration}ms`
  );

  return recommendations;
}

/**
 * Save recommendations to database
 */
export async function saveRecommendations(
  recommendations: Recommendation[]
): Promise<void> {
  console.log(`💾 Saving ${recommendations.length} recommendations...`);

  // Delete old pending recommendations (older than 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db.recommendedAction.deleteMany({
    where: {
      status: "pending",
      createdAt: { lt: oneDayAgo },
    },
  });

  // Create new recommendations
  for (const rec of recommendations) {
    await db.recommendedAction.create({
      data: {
        shop: rec.shop,
        type: rec.type,
        priority: rec.priority,
        estimatedROI: rec.estimatedROI,
        confidence: rec.confidence,
        status: "pending",
        parameters: JSON.stringify(rec.parameters),
        reason: rec.reason,
        urgency: rec.urgency,
        sourceMetrics: rec.sourceMetrics
          ? JSON.stringify(rec.sourceMetrics)
          : null,
        expiresAt: rec.expiresAt || null,
      },
    });
  }

  console.log(`✅ Saved ${recommendations.length} recommendations`);
}

/**
 * Get pending recommendations for a shop
 */
export async function getPendingRecommendations(
  shop: string
): Promise<Recommendation[]> {
  const actions = await db.recommendedAction.findMany({
    where: {
      shop,
      status: "pending",
      OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
    },
    orderBy: [{ priority: "desc" }, { estimatedROI: "desc" }],
  });

  return actions.map((action) => ({
    id: action.id,
    shop: action.shop,
    type: action.type as any,
    priority: action.priority,
    estimatedROI: action.estimatedROI,
    confidence: action.confidence,
    status: action.status,
    parameters: JSON.parse(action.parameters),
    reason: action.reason,
    urgency: action.urgency as any,
    sourceMetrics: action.sourceMetrics
      ? JSON.parse(action.sourceMetrics)
      : undefined,
    expiresAt: action.expiresAt || undefined,
  }));
}

/**
 * Get recommendations summary for dashboard
 */
export async function getRecommendationsSummary(shop: string) {
  const pending = await db.recommendedAction.count({
    where: {
      shop,
      status: "pending",
      OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
    },
  });

  const critical = await db.recommendedAction.count({
    where: {
      shop,
      status: "pending",
      urgency: "critical",
      OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
    },
  });

  const totalROI = await db.recommendedAction.aggregate({
    where: {
      shop,
      status: "pending",
      OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
    },
    _sum: { estimatedROI: true },
  });

  return {
    pendingCount: pending,
    criticalCount: critical,
    totalEstimatedROI: totalROI._sum.estimatedROI || 0,
  };
}

// ============================================================================
// Recommendation Type Generators
// ============================================================================

/**
 * Generate transfer recommendations
 */
async function generateTransferRecommendations(
  shop: string,
  countdowns: any[],
  velocityAnomalies: any[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Find critical stockouts
  const criticalStockouts = countdowns.filter(
    (c) => c.status === "CRITICAL" || c.status === "URGENT"
  );

  for (const stockout of criticalStockouts) {
    // In a real implementation, we'd query Shopify for multi-location inventory
    // For now, create a transfer recommendation if it's critical

    if (stockout.hoursUntilStockout < 12) {
      recommendations.push({
        shop,
        type: "transfer",
        priority: stockout.hoursUntilStockout < 4 ? 10 : 8,
        estimatedROI: stockout.revenueAtRisk || 5000,
        confidence: 85,
        status: "pending",
        parameters: {
          sku: stockout.sku,
          productId: stockout.productId,
          productTitle: stockout.productTitle,
          fromLocation: "Warehouse B", // Mock data
          toLocation: stockout.location,
          quantity: Math.ceil(stockout.adjustedBurnRate * 24), // 24 hours worth
        },
        reason: `Transfer inventory to prevent stockout in ${stockout.hoursUntilStockout.toFixed(1)}h. Current burn rate: ${stockout.adjustedBurnRate.toFixed(1)}/hr`,
        urgency: stockout.hoursUntilStockout < 4 ? "critical" : "high",
        sourceMetrics: {
          hoursUntilStockout: stockout.hoursUntilStockout,
          burnRate: stockout.adjustedBurnRate,
        },
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // Expires in 6 hours
      });
    }
  }

  return recommendations;
}

/**
 * Generate reorder recommendations
 */
async function generateReorderRecommendations(
  shop: string,
  countdowns: any[],
  predictions: any[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Find products that will stockout within 24-72 hours (reorder window)
  const needReorder = countdowns.filter(
    (c) =>
      c.hoursUntilStockout >= 12 &&
      c.hoursUntilStockout <= 72 &&
      c.status !== "HEALTHY"
  );

  for (const product of needReorder) {
    // Get prediction for this product
    const prediction = predictions.find((p) => p.sku === product.sku);
    const forecast72h = prediction?.predictions?.["72h"];

    const reorderQuantity = forecast72h
      ? forecast72h.scenarios.likely.expectedDemand * 2 // 2x buffer
      : Math.ceil(product.adjustedBurnRate * 72 * 1.5); // 72h at 1.5x rate

    const estimatedROI =
      forecast72h?.scenarios.likely.expectedRevenue || product.revenueAtRisk || 3000;

    recommendations.push({
      shop,
      type: "reorder",
      priority: product.hoursUntilStockout < 24 ? 9 : 7,
      estimatedROI,
      confidence: forecast72h?.confidence || 70,
      status: "pending",
      parameters: {
        sku: product.sku,
        productId: product.productId,
        productTitle: product.productTitle,
        quantity: reorderQuantity,
        supplier: "Primary Supplier", // Mock data
        priority: product.hoursUntilStockout < 24 ? "rush" : "standard",
      },
      reason: `Reorder ${reorderQuantity} units - stockout predicted in ${product.hoursUntilStockout.toFixed(1)}h. Forecast demand: ${forecast72h?.scenarios.likely.expectedDemand || "N/A"}`,
      urgency: product.hoursUntilStockout < 24 ? "high" : "medium",
      sourceMetrics: {
        hoursUntilStockout: product.hoursUntilStockout,
        forecastDemand: forecast72h?.scenarios.likely.expectedDemand,
      },
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // Expires in 12 hours
    });
  }

  return recommendations;
}

/**
 * Generate price adjustment recommendations
 */
async function generatePriceRecommendations(
  shop: string,
  velocityAnomalies: any[],
  countdowns: any[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Surge pricing for viral products with healthy inventory
  const viralProducts = velocityAnomalies.filter(
    (v) => v.type === "viral" && v.velocityChange > 200
  );

  for (const viral of viralProducts.slice(0, 5)) {
    // Limit to top 5
    // Check if inventory is healthy
    const countdown = countdowns.find((c) => c.sku === viral.sku);
    if (countdown && countdown.hoursUntilStockout > 48) {
      recommendations.push({
        shop,
        type: "price_adjustment",
        priority: 6,
        estimatedROI: viral.revenueImpact || 2000,
        confidence: 75,
        status: "pending",
        parameters: {
          sku: viral.sku,
          productId: viral.productId,
          productTitle: viral.productTitle,
          currentPrice: viral.currentPrice || 50, // Mock
          suggestedPrice: (viral.currentPrice || 50) * 1.15, // 15% increase
          priceChange: 15,
        },
        reason: `Viral product (${viral.velocityChange.toFixed(0)}% velocity increase). Increase price 15% to maximize margin while demand is high.`,
        urgency: "medium",
        sourceMetrics: {
          velocityChange: viral.velocityChange,
          hoursUntilStockout: countdown.hoursUntilStockout,
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      });
    }
  }

  // Markdown recommendations for slow-moving inventory
  const slowMovers = velocityAnomalies.filter(
    (v) => v.type === "dead_stock" && v.velocityChange < -50
  );

  for (const slow of slowMovers.slice(0, 3)) {
    // Limit to top 3
    recommendations.push({
      shop,
      type: "price_adjustment",
      priority: 4,
      estimatedROI: 500, // Lower ROI for markdowns
      confidence: 65,
      status: "pending",
      parameters: {
        sku: slow.sku,
        productId: slow.productId,
        productTitle: slow.productTitle,
        currentPrice: slow.currentPrice || 50, // Mock
        suggestedPrice: (slow.currentPrice || 50) * 0.85, // 15% decrease
        priceChange: -15,
      },
      reason: `Slow-moving inventory (${slow.velocityChange.toFixed(0)}% velocity decrease). Markdown 15% to clear stock.`,
      urgency: "low",
      sourceMetrics: {
        velocityChange: slow.velocityChange,
      },
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // Expires in 48 hours
    });
  }

  return recommendations;
}

/**
 * Generate traffic throttling recommendations
 */
async function generateThrottleRecommendations(
  shop: string,
  countdowns: any[],
  predictions: any[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Throttle traffic for products with critical stockouts but high demand
  const criticalHighDemand = countdowns.filter(
    (c) => c.status === "CRITICAL" && c.adjustedBurnRate > 5
  );

  for (const product of criticalHighDemand.slice(0, 2)) {
    // Limit to top 2
    recommendations.push({
      shop,
      type: "traffic_throttle",
      priority: 9,
      estimatedROI: 10000, // High ROI for preventing stockouts
      confidence: 80,
      status: "pending",
      parameters: {
        sku: product.sku,
        productId: product.productId,
        productTitle: product.productTitle,
        action: "pause_ads",
        targetReduction: 50, // Reduce traffic by 50%
      },
      reason: `Pause marketing for ${product.productTitle} to conserve remaining ${product.availableStock} units. Prevents stockout and preserves inventory for organic traffic.`,
      urgency: "critical",
      sourceMetrics: {
        hoursUntilStockout: product.hoursUntilStockout,
        burnRate: product.adjustedBurnRate,
        availableStock: product.availableStock,
      },
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // Expires in 4 hours
    });
  }

  return recommendations;
}

/**
 * Refresh recommendations (generate and save)
 */
export async function refreshRecommendations(shop: string): Promise<number> {
  const recommendations = await generateRecommendations(shop);
  await saveRecommendations(recommendations);
  return recommendations.length;
}
