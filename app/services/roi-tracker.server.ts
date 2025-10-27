/**
 * ROI Tracker Service
 *
 * Tracks financial impact from War Room actions:
 * - Revenue saved from prevented stockouts
 * - Margin protected (avoided expedited shipping costs)
 * - Opportunity captured (competitor overflow)
 * - Attribution to specific actions
 *
 * Session 8 - BFCM War Room
 */

import db from "../db.server";
import cache, { getCacheKey } from "./cache.server";

// ============================================================================
// Types
// ============================================================================

export interface ROIMetrics {
  revenueSaved: number;
  marginProtected: number;
  opportunityCaptured: number;
  totalValue: number;
  actionCount: number;
  avgROIPerAction: number;
  period: "hourly" | "daily" | "weekly" | "total";
}

export interface ActionImpact {
  actionId: string;
  actionType: string;
  executedAt: Date;
  estimatedImpact: number;
  actualImpact: number;
  cost: number;
  netROI: number;
  category: "revenue_saved" | "margin_protected" | "opportunity_captured";
  confidence: number; // 0-100
}

export interface TimeSeriesROI {
  timestamp: Date;
  revenueSaved: number;
  marginProtected: number;
  opportunityCaptured: number;
  cumulativeValue: number;
}

export interface CategoryBreakdown {
  category: string;
  value: number;
  percentage: number;
  actionCount: number;
}

// ============================================================================
// Core ROI Tracking Functions
// ============================================================================

/**
 * Calculate overall ROI metrics for a shop
 */
export async function calculateROIMetrics(
  shop: string,
  period: "hourly" | "daily" | "weekly" | "total" = "total"
): Promise<ROIMetrics> {
  const cacheKey = getCacheKey("war-room:roi:metrics", shop, period);

  return cache.getOrSet(cacheKey, async () => {
    const startTime = Date.now();

    // Determine time window based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "hourly":
        startDate = new Date(now.getTime() - 60 * 60 * 1000); // Last hour
        break;
      case "daily":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case "total":
      default:
        startDate = new Date(0); // All time
        break;
    }

    // Fetch all executed actions in the time period
    const executedActions = await db.executedAction.findMany({
      where: {
        shop,
        executedAt: {
          gte: startDate,
        },
      },
      include: {
        recommendation: true,
      },
    });

    // Calculate metrics by category
    let revenueSaved = 0;
    let marginProtected = 0;
    let opportunityCaptured = 0;

    for (const action of executedActions) {
      const netROI = action.netROI || 0;

      // Categorize based on action type
      const actionType = action.recommendation.type;

      if (actionType === "transfer" || actionType === "reorder") {
        // Transfers and reorders prevent stockouts → revenue saved
        revenueSaved += netROI;
      } else if (actionType === "price_adjustment") {
        // Price adjustments can capture opportunity or protect margin
        if (netROI > 0) {
          opportunityCaptured += netROI;
        } else {
          // Sometimes we reduce price to clear inventory (margin protection)
          marginProtected += Math.abs(netROI);
        }
      } else if (actionType === "traffic_throttle") {
        // Traffic throttling protects margin (prevents over-selling)
        marginProtected += netROI;
      }
    }

    // Calculate additional metrics from avoided costs
    const avoidedCosts = await calculateAvoidedCosts(shop, startDate);
    marginProtected += avoidedCosts.expeditedShipping + avoidedCosts.emergencyOrders;

    // Calculate opportunity captured from competitor stockouts
    const competitorOpportunity = await calculateCompetitorOpportunity(shop, startDate);
    opportunityCaptured += competitorOpportunity;

    const totalValue = revenueSaved + marginProtected + opportunityCaptured;
    const actionCount = executedActions.length;
    const avgROIPerAction = actionCount > 0 ? totalValue / actionCount : 0;

    const executionTime = Date.now() - startTime;
    console.log(`✅ ROI metrics calculated in ${executionTime}ms`);

    return {
      revenueSaved,
      marginProtected,
      opportunityCaptured,
      totalValue,
      actionCount,
      avgROIPerAction,
      period,
    };
  }, 5 * 60); // Cache for 5 minutes
}

/**
 * Get detailed action impact breakdown
 */
export async function getActionImpacts(
  shop: string,
  limit: number = 50
): Promise<ActionImpact[]> {
  const executedActions = await db.executedAction.findMany({
    where: { shop },
    include: {
      recommendation: true,
    },
    orderBy: {
      executedAt: "desc",
    },
    take: limit,
  });

  return executedActions.map((action) => {
    const category = categorizeAction(action.recommendation.type);

    return {
      actionId: action.id,
      actionType: action.recommendation.type,
      executedAt: action.executedAt,
      estimatedImpact: action.estimatedRevenue || action.recommendation.estimatedROI,
      actualImpact: action.actualRevenue || 0,
      cost: action.cost || 0,
      netROI: action.netROI || 0,
      category,
      confidence: action.recommendation.confidence,
    };
  });
}

/**
 * Get time series ROI data for charts
 */
export async function getTimeSeriesROI(
  shop: string,
  hours: number = 24
): Promise<TimeSeriesROI[]> {
  const cacheKey = getCacheKey("war-room:roi:timeseries", shop, `${hours}h`);

  return cache.getOrSet(cacheKey, async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);

    // Fetch all actions in the time period
    const actions = await db.executedAction.findMany({
      where: {
        shop,
        executedAt: {
          gte: startDate,
        },
      },
      include: {
        recommendation: true,
      },
      orderBy: {
        executedAt: "asc",
      },
    });

    // Group by hour
    const hourlyBuckets: Map<string, TimeSeriesROI> = new Map();

    for (const action of actions) {
      const hourKey = action.executedAt.toISOString().slice(0, 13); // YYYY-MM-DDTHH

      if (!hourlyBuckets.has(hourKey)) {
        hourlyBuckets.set(hourKey, {
          timestamp: new Date(hourKey + ":00:00Z"),
          revenueSaved: 0,
          marginProtected: 0,
          opportunityCaptured: 0,
          cumulativeValue: 0,
        });
      }

      const bucket = hourlyBuckets.get(hourKey)!;
      const category = categorizeAction(action.recommendation.type);
      const netROI = action.netROI || 0;

      if (category === "revenue_saved") {
        bucket.revenueSaved += netROI;
      } else if (category === "margin_protected") {
        bucket.marginProtected += netROI;
      } else if (category === "opportunity_captured") {
        bucket.opportunityCaptured += netROI;
      }
    }

    // Convert to array and calculate cumulative values
    const timeSeries = Array.from(hourlyBuckets.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    let cumulative = 0;
    for (const dataPoint of timeSeries) {
      const hourValue = dataPoint.revenueSaved + dataPoint.marginProtected + dataPoint.opportunityCaptured;
      cumulative += hourValue;
      dataPoint.cumulativeValue = cumulative;
    }

    return timeSeries;
  }, 5 * 60); // Cache for 5 minutes
}

/**
 * Get category breakdown for pie charts
 */
export async function getCategoryBreakdown(shop: string): Promise<CategoryBreakdown[]> {
  const metrics = await calculateROIMetrics(shop, "total");

  // Safely calculate percentage, avoiding division by zero
  const safePercentage = (value: number, total: number): number => {
    if (total === 0 || !isFinite(total)) return 0;
    const pct = (value / total) * 100;
    return isFinite(pct) ? pct : 0;
  };

  const categories: CategoryBreakdown[] = [
    {
      category: "Revenue Saved",
      value: metrics.revenueSaved,
      percentage: safePercentage(metrics.revenueSaved, metrics.totalValue),
      actionCount: 0,
    },
    {
      category: "Margin Protected",
      value: metrics.marginProtected,
      percentage: safePercentage(metrics.marginProtected, metrics.totalValue),
      actionCount: 0,
    },
    {
      category: "Opportunity Captured",
      value: metrics.opportunityCaptured,
      percentage: safePercentage(metrics.opportunityCaptured, metrics.totalValue),
      actionCount: 0,
    },
  ];

  // Count actions per category
  const actions = await db.executedAction.findMany({
    where: { shop },
    include: { recommendation: true },
  });

  for (const action of actions) {
    const category = categorizeAction(action.recommendation.type);

    if (category === "revenue_saved") {
      categories[0].actionCount++;
    } else if (category === "margin_protected") {
      categories[1].actionCount++;
    } else if (category === "opportunity_captured") {
      categories[2].actionCount++;
    }
  }

  return categories;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate avoided costs (expedited shipping, emergency orders, etc.)
 */
async function calculateAvoidedCosts(
  shop: string,
  startDate: Date
): Promise<{
  expeditedShipping: number;
  emergencyOrders: number;
}> {
  // Look for transfer and reorder actions that prevented stockouts
  const preventionActions = await db.executedAction.findMany({
    where: {
      shop,
      executedAt: {
        gte: startDate,
      },
      recommendation: {
        type: {
          in: ["transfer", "reorder"],
        },
      },
    },
    include: {
      recommendation: true,
    },
  });

  let expeditedShipping = 0;
  let emergencyOrders = 0;

  for (const action of preventionActions) {
    // Estimate avoided expedited shipping costs
    // Average expedited shipping: $50-200 per order
    // If we prevented a stockout, we avoided expediting orders
    const metadata = JSON.parse(action.metadata);

    if (metadata.preventedStockout) {
      const estimatedOrders = metadata.estimatedOrders || 10;
      expeditedShipping += estimatedOrders * 75; // $75 avg expedited shipping cost
    }

    // Emergency orders typically cost 20-30% more
    if (action.recommendation.urgency === "critical") {
      const orderValue = action.estimatedRevenue || 0;
      emergencyOrders += orderValue * 0.25; // 25% premium for emergency orders
    }
  }

  return {
    expeditedShipping,
    emergencyOrders,
  };
}

/**
 * Calculate revenue from competitor stockout opportunities
 */
async function calculateCompetitorOpportunity(
  shop: string,
  startDate: Date
): Promise<number> {
  // Look for actions that captured competitor overflow
  const opportunityActions = await db.executedAction.findMany({
    where: {
      shop,
      executedAt: {
        gte: startDate,
      },
      recommendation: {
        type: "price_adjustment", // Price reductions to capture market share
      },
    },
    include: {
      recommendation: true,
    },
  });

  let opportunityRevenue = 0;

  for (const action of opportunityActions) {
    const metadata = JSON.parse(action.metadata);

    // Check if this was a competitor capture scenario
    if (metadata.competitorStockout) {
      opportunityRevenue += action.actualRevenue || action.estimatedRevenue || 0;
    }
  }

  return opportunityRevenue;
}

/**
 * Categorize action type into ROI category
 */
function categorizeAction(
  actionType: string
): "revenue_saved" | "margin_protected" | "opportunity_captured" {
  switch (actionType) {
    case "transfer":
    case "reorder":
      return "revenue_saved"; // Preventing stockouts

    case "traffic_throttle":
      return "margin_protected"; // Preventing over-selling

    case "price_adjustment":
      return "opportunity_captured"; // Capturing market share

    default:
      return "revenue_saved"; // Default category
  }
}

// ============================================================================
// Reporting Functions
// ============================================================================

/**
 * Generate comprehensive ROI report
 */
export async function generateROIReport(shop: string): Promise<{
  summary: ROIMetrics;
  hourly: ROIMetrics;
  daily: ROIMetrics;
  weekly: ROIMetrics;
  categoryBreakdown: CategoryBreakdown[];
  topActions: ActionImpact[];
  timeSeries: TimeSeriesROI[];
}> {
  const [summary, hourly, daily, weekly, categoryBreakdown, topActions, timeSeries] = await Promise.all([
    calculateROIMetrics(shop, "total"),
    calculateROIMetrics(shop, "hourly"),
    calculateROIMetrics(shop, "daily"),
    calculateROIMetrics(shop, "weekly"),
    getCategoryBreakdown(shop),
    getActionImpacts(shop, 10), // Top 10 actions
    getTimeSeriesROI(shop, 24), // Last 24 hours
  ]);

  return {
    summary,
    hourly,
    daily,
    weekly,
    categoryBreakdown,
    topActions,
    timeSeries,
  };
}

/**
 * Update action with actual impact (called after measuring real results)
 */
export async function updateActionImpact(
  actionId: string,
  actualRevenue: number,
  actualCost: number
): Promise<void> {
  const netROI = actualRevenue - actualCost;

  await db.executedAction.update({
    where: { id: actionId },
    data: {
      actualRevenue,
      cost: actualCost,
      netROI,
    },
  });

  // Invalidate ROI caches
  const action = await db.executedAction.findUnique({
    where: { id: actionId },
    select: { shop: true },
  });

  if (action) {
    await cache.deletePattern(`*:war-room:roi:metrics:${action.shop}:*`);
    await cache.deletePattern(`*:war-room:roi:timeseries:${action.shop}:*`);
  }
}

/**
 * Get ROI comparison vs. baseline (what would have happened without War Room)
 */
export async function getROIComparison(shop: string): Promise<{
  withWarRoom: number;
  withoutWarRoom: number;
  improvement: number;
  improvementPercentage: number;
}> {
  const metrics = await calculateROIMetrics(shop, "total");
  const withWarRoom = metrics.totalValue;

  // Estimate baseline (without War Room)
  // Assumptions:
  // - 15% stockout rate on top SKUs during peak
  // - 20% emergency shipping premium
  // - 0% competitor overflow capture
  const estimatedStockoutLoss = metrics.revenueSaved * 0.15;
  const estimatedExpeditedCosts = metrics.marginProtected * 0.20;
  const missedOpportunities = metrics.opportunityCaptured * 0;

  const withoutWarRoom = estimatedStockoutLoss + estimatedExpeditedCosts + missedOpportunities;

  const improvement = withWarRoom - withoutWarRoom;
  const improvementPercentage = withoutWarRoom > 0
    ? (improvement / withoutWarRoom) * 100
    : 0;

  return {
    withWarRoom,
    withoutWarRoom,
    improvement,
    improvementPercentage,
  };
}

// ============================================================================
// Cache Invalidation
// ============================================================================

/**
 * Invalidate ROI caches for a shop
 */
export async function invalidateROICaches(shop: string): Promise<void> {
  await cache.deletePattern(`*:war-room:roi:metrics:${shop}:*`);
  await cache.deletePattern(`*:war-room:roi:timeseries:${shop}:*`);
}
