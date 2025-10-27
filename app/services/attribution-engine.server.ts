/**
 * Attribution Engine Service
 *
 * Provides decision audit trails and attribution analysis:
 * - Log all War Room decisions and their context
 * - Perform counterfactual analysis ("what would have happened")
 * - Identify success patterns
 * - Track model accuracy
 * - Continuous improvement metrics
 *
 * Session 8 - BFCM War Room
 */

import db from "../db.server";

// ============================================================================
// Types
// ============================================================================

export interface DecisionLog {
  id: string;
  timestamp: Date;
  decisionType: "action_executed" | "alert_triggered" | "simulation_run" | "prediction_made";
  context: Record<string, any>;
  outcome?: Record<string, any>;
  success: boolean;
  impactScore: number; // 0-100
}

export interface CounterfactualAnalysis {
  actionId: string;
  actualOutcome: {
    revenue: number;
    cost: number;
    netROI: number;
  };
  counterfactual: {
    estimatedRevenue: number;
    estimatedCost: number;
    estimatedNetROI: number;
  };
  difference: {
    revenue: number;
    cost: number;
    netROI: number;
  };
  confidence: number; // 0-100
}

export interface SuccessPattern {
  pattern: string;
  description: string;
  occurrences: number;
  avgImpact: number;
  successRate: number;
  conditions: Record<string, any>;
}

export interface ModelAccuracy {
  model: string;
  predictions: number;
  correct: number;
  accuracy: number; // 0-100
  avgError: number;
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
}

export interface ContinuousImprovement {
  metric: string;
  baseline: number;
  current: number;
  improvement: number;
  trend: "improving" | "stable" | "declining";
}

// ============================================================================
// Decision Logging
// ============================================================================

/**
 * Log a decision made by the War Room system
 */
export async function logDecision(
  shop: string,
  decisionType: DecisionLog["decisionType"],
  context: Record<string, any>,
  metadata?: Record<string, any>
): Promise<string> {
  // Create decision log in database (using existing models)
  const log = await db.alertLog.create({
    data: {
      shop,
      severity: "info",
      alertType: decisionType,
      title: `Decision: ${decisionType}`,
      message: JSON.stringify(context),
      metadata: JSON.stringify(metadata || {}),
    },
  });

  return log.id;
}

/**
 * Update decision log with outcome
 */
export async function updateDecisionOutcome(
  decisionId: string,
  outcome: Record<string, any>,
  success: boolean,
  impactScore: number
): Promise<void> {
  await db.alertLog.update({
    where: { id: decisionId },
    data: {
      metadata: JSON.stringify({ outcome, success, impactScore }),
      resolvedAt: new Date(),
    },
  });
}

/**
 * Get decision audit trail
 */
export async function getDecisionAuditTrail(
  shop: string,
  limit: number = 100
): Promise<DecisionLog[]> {
  const logs = await db.alertLog.findMany({
    where: {
      shop,
      alertType: {
        in: ["action_executed", "alert_triggered", "simulation_run", "prediction_made"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return logs.map((log) => {
    const context = JSON.parse(log.message);
    const metadata = JSON.parse(log.metadata);

    return {
      id: log.id,
      timestamp: log.createdAt,
      decisionType: log.alertType as DecisionLog["decisionType"],
      context,
      outcome: metadata.outcome,
      success: metadata.success || false,
      impactScore: metadata.impactScore || 0,
    };
  });
}

// ============================================================================
// Counterfactual Analysis
// ============================================================================

/**
 * Perform counterfactual analysis for an action
 * ("What would have happened if we didn't take this action?")
 */
export async function analyzeCounterfactual(
  actionId: string
): Promise<CounterfactualAnalysis> {
  const action = await db.executedAction.findUnique({
    where: { id: actionId },
    include: {
      recommendation: true,
    },
  });

  if (!action) {
    throw new Error(`Action ${actionId} not found`);
  }

  // Actual outcome
  const actualOutcome = {
    revenue: action.actualRevenue || action.estimatedRevenue || 0,
    cost: action.cost || 0,
    netROI: action.netROI || 0,
  };

  // Counterfactual: what would have happened without the action
  const metadata = JSON.parse(action.metadata);
  let counterfactual: CounterfactualAnalysis["counterfactual"];

  switch (action.recommendation.type) {
    case "transfer":
    case "reorder":
      // Without action: stockout would have occurred
      counterfactual = {
        estimatedRevenue: 0, // Lost sales
        estimatedCost: actualOutcome.cost * 1.5, // Emergency shipping premium
        estimatedNetROI: -(actualOutcome.cost * 1.5),
      };
      break;

    case "price_adjustment":
      // Without action: missed opportunity or lost margin
      counterfactual = {
        estimatedRevenue: actualOutcome.revenue * 0.7, // 30% less revenue
        estimatedCost: actualOutcome.cost,
        estimatedNetROI: actualOutcome.revenue * 0.7 - actualOutcome.cost,
      };
      break;

    case "traffic_throttle":
      // Without action: over-selling and cancellations
      counterfactual = {
        estimatedRevenue: actualOutcome.revenue * 0.5, // 50% cancellations
        estimatedCost: actualOutcome.cost * 2, // Customer service + refunds
        estimatedNetROI: actualOutcome.revenue * 0.5 - actualOutcome.cost * 2,
      };
      break;

    default:
      counterfactual = {
        estimatedRevenue: actualOutcome.revenue * 0.8,
        estimatedCost: actualOutcome.cost,
        estimatedNetROI: actualOutcome.revenue * 0.8 - actualOutcome.cost,
      };
  }

  // Calculate difference (value created by action)
  const difference = {
    revenue: actualOutcome.revenue - counterfactual.estimatedRevenue,
    cost: counterfactual.estimatedCost - actualOutcome.cost,
    netROI: actualOutcome.netROI - counterfactual.estimatedNetROI,
  };

  const confidence = action.recommendation.confidence;

  return {
    actionId,
    actualOutcome,
    counterfactual,
    difference,
    confidence,
  };
}

/**
 * Get counterfactual analysis for multiple actions
 */
export async function analyzeAllCounterfactuals(
  shop: string,
  limit: number = 50
): Promise<CounterfactualAnalysis[]> {
  const actions = await db.executedAction.findMany({
    where: { shop },
    orderBy: {
      executedAt: "desc",
    },
    take: limit,
  });

  const analyses = await Promise.all(
    actions.map((action) => analyzeCounterfactual(action.id))
  );

  return analyses;
}

// ============================================================================
// Success Pattern Identification
// ============================================================================

/**
 * Identify success patterns from historical data
 */
export async function identifySuccessPatterns(shop: string): Promise<SuccessPattern[]> {
  const actions = await db.executedAction.findMany({
    where: { shop },
    include: {
      recommendation: true,
    },
  });

  // Group actions by type and urgency
  const patterns: Map<string, {
    occurrences: number;
    totalImpact: number;
    successes: number;
    conditions: any[];
  }> = new Map();

  for (const action of actions) {
    const key = `${action.recommendation.type}_${action.recommendation.urgency}`;

    if (!patterns.has(key)) {
      patterns.set(key, {
        occurrences: 0,
        totalImpact: 0,
        successes: 0,
        conditions: [],
      });
    }

    const pattern = patterns.get(key)!;
    pattern.occurrences++;
    pattern.totalImpact += action.netROI || 0;

    if (action.result === "success") {
      pattern.successes++;
    }

    // Extract conditions from source metrics
    if (action.recommendation.sourceMetrics) {
      pattern.conditions.push(JSON.parse(action.recommendation.sourceMetrics));
    }
  }

  // Convert to array and calculate metrics
  const successPatterns: SuccessPattern[] = [];

  for (const [key, data] of patterns.entries()) {
    const [type, urgency] = key.split("_");

    successPatterns.push({
      pattern: key,
      description: `${type} actions with ${urgency} urgency`,
      occurrences: data.occurrences,
      avgImpact: data.totalImpact / data.occurrences,
      successRate: (data.successes / data.occurrences) * 100,
      conditions: {
        type,
        urgency,
        commonMetrics: aggregateConditions(data.conditions),
      },
    });
  }

  // Sort by success rate and average impact
  return successPatterns.sort((a, b) => {
    const scoreA = a.successRate * a.avgImpact;
    const scoreB = b.successRate * b.avgImpact;
    return scoreB - scoreA;
  });
}

/**
 * Aggregate common conditions from pattern instances
 */
function aggregateConditions(conditions: any[]): Record<string, any> {
  if (conditions.length === 0) return {};

  // Calculate averages for numeric fields
  const aggregated: Record<string, any> = {};

  for (const condition of conditions) {
    for (const [key, value] of Object.entries(condition)) {
      if (typeof value === "number") {
        if (!aggregated[key]) {
          aggregated[key] = { sum: 0, count: 0 };
        }
        aggregated[key].sum += value;
        aggregated[key].count++;
      }
    }
  }

  // Calculate averages
  for (const key in aggregated) {
    aggregated[key] = aggregated[key].sum / aggregated[key].count;
  }

  return aggregated;
}

// ============================================================================
// Model Accuracy Tracking
// ============================================================================

/**
 * Track prediction model accuracy
 */
export async function trackModelAccuracy(
  shop: string,
  model: "defcon" | "revenue_risk" | "velocity" | "prediction"
): Promise<ModelAccuracy> {
  // Fetch predictions and actual outcomes
  const predictions = await getPredictionsAndOutcomes(shop, model);

  let correct = 0;
  let totalError = 0;
  let squaredError = 0;

  for (const pred of predictions) {
    const error = Math.abs(pred.predicted - pred.actual);
    totalError += error;
    squaredError += error * error;

    // Consider "correct" if within 10% of actual
    if (error / pred.actual < 0.1) {
      correct++;
    }
  }

  const total = predictions.length;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const mae = total > 0 ? totalError / total : 0;
  const rmse = total > 0 ? Math.sqrt(squaredError / total) : 0;
  const avgError = total > 0 ? totalError / total : 0;

  return {
    model,
    predictions: total,
    correct,
    accuracy,
    avgError,
    mae,
    rmse,
  };
}

/**
 * Get predictions and actual outcomes for a model
 */
async function getPredictionsAndOutcomes(
  shop: string,
  model: string
): Promise<Array<{ predicted: number; actual: number }>> {
  // For now, use executed actions as proxy for predictions vs. outcomes
  const actions = await db.executedAction.findMany({
    where: { shop },
    include: {
      recommendation: true,
    },
  });

  return actions
    .filter((action) => action.estimatedRevenue && action.actualRevenue)
    .map((action) => ({
      predicted: action.estimatedRevenue!,
      actual: action.actualRevenue!,
    }));
}

// ============================================================================
// Continuous Improvement Metrics
// ============================================================================

/**
 * Track continuous improvement metrics
 */
export async function getContinuousImprovementMetrics(
  shop: string
): Promise<ContinuousImprovement[]> {
  // Define metrics to track
  const metrics = [
    "action_success_rate",
    "prediction_accuracy",
    "average_roi",
    "response_time",
  ];

  const improvements: ContinuousImprovement[] = [];

  for (const metricName of metrics) {
    const baseline = await getBaselineMetric(shop, metricName);
    const current = await getCurrentMetric(shop, metricName);
    const improvement = current - baseline;
    const trend = improvement > 0.05 ? "improving" : improvement < -0.05 ? "declining" : "stable";

    improvements.push({
      metric: metricName,
      baseline,
      current,
      improvement,
      trend,
    });
  }

  return improvements;
}

/**
 * Get baseline metric value (first 30 days)
 */
async function getBaselineMetric(shop: string, metric: string): Promise<number> {
  const firstAction = await db.executedAction.findFirst({
    where: { shop },
    orderBy: {
      executedAt: "asc",
    },
  });

  if (!firstAction) return 0;

  const baselineEnd = new Date(firstAction.executedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  return calculateMetricValue(shop, metric, firstAction.executedAt, baselineEnd);
}

/**
 * Get current metric value (last 30 days)
 */
async function getCurrentMetric(shop: string, metric: string): Promise<number> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return calculateMetricValue(shop, metric, thirtyDaysAgo, now);
}

/**
 * Calculate metric value for a time period
 */
async function calculateMetricValue(
  shop: string,
  metric: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const actions = await db.executedAction.findMany({
    where: {
      shop,
      executedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      recommendation: true,
    },
  });

  if (actions.length === 0) return 0;

  switch (metric) {
    case "action_success_rate":
      const successes = actions.filter((a) => a.result === "success").length;
      return (successes / actions.length) * 100;

    case "prediction_accuracy":
      const accurate = actions.filter((a) => {
        if (!a.estimatedRevenue || !a.actualRevenue) return false;
        const error = Math.abs(a.estimatedRevenue - a.actualRevenue) / a.actualRevenue;
        return error < 0.1; // Within 10%
      }).length;
      return (accurate / actions.length) * 100;

    case "average_roi":
      const totalROI = actions.reduce((sum, a) => sum + (a.netROI || 0), 0);
      return totalROI / actions.length;

    case "response_time":
      // Average time from recommendation to execution
      const totalTime = actions.reduce((sum, a) => {
        const timeDiff = a.executedAt.getTime() - a.recommendation.createdAt.getTime();
        return sum + timeDiff;
      }, 0);
      return totalTime / actions.length / (60 * 1000); // Convert to minutes

    default:
      return 0;
  }
}

// ============================================================================
// Attribution Reports
// ============================================================================

/**
 * Generate comprehensive attribution report
 */
export async function generateAttributionReport(shop: string): Promise<{
  decisionAuditTrail: DecisionLog[];
  counterfactualAnalyses: CounterfactualAnalysis[];
  successPatterns: SuccessPattern[];
  modelAccuracy: {
    defcon: ModelAccuracy;
    revenueRisk: ModelAccuracy;
    velocity: ModelAccuracy;
    prediction: ModelAccuracy;
  };
  continuousImprovement: ContinuousImprovement[];
}> {
  const [
    decisionAuditTrail,
    counterfactualAnalyses,
    successPatterns,
    defconAccuracy,
    revenueRiskAccuracy,
    velocityAccuracy,
    predictionAccuracy,
    continuousImprovement,
  ] = await Promise.all([
    getDecisionAuditTrail(shop, 50),
    analyzeAllCounterfactuals(shop, 20),
    identifySuccessPatterns(shop),
    trackModelAccuracy(shop, "defcon"),
    trackModelAccuracy(shop, "revenue_risk"),
    trackModelAccuracy(shop, "velocity"),
    trackModelAccuracy(shop, "prediction"),
    getContinuousImprovementMetrics(shop),
  ]);

  return {
    decisionAuditTrail,
    counterfactualAnalyses,
    successPatterns,
    modelAccuracy: {
      defcon: defconAccuracy,
      revenueRisk: revenueRiskAccuracy,
      velocity: velocityAccuracy,
      prediction: predictionAccuracy,
    },
    continuousImprovement,
  };
}
