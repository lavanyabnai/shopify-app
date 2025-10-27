/**
 * Simulation Engine Service (Session 7)
 *
 * Provides what-if scenario modeling for BFCM operations:
 * - Flash sale simulations
 * - Traffic spike predictions
 * - Supplier delay modeling
 * - Carrier outage scenarios
 *
 * Performance target: <10 seconds per simulation
 */

import db from "../db.server";
import cache, { getCacheKey } from "./cache.server";
import { getLatestDEFCON } from "./defcon-calculator.server";
import { getRevenueRiskSummary } from "./revenue-risk.server";
import { getPredictionSummary } from "./prediction-engine.server";

// ============================================================================
// Types
// ============================================================================

export type ScenarioType =
  | "flash_sale"
  | "traffic_spike"
  | "supplier_delay"
  | "carrier_outage"
  | "competitor_stockout"
  | "custom";

export interface SimulationParameters {
  // Common parameters
  duration_hours: number; // How long the scenario lasts
  start_delay_hours?: number; // When scenario starts (default: now)

  // Flash sale parameters
  discount_percent?: number; // Discount depth
  affected_products?: string[]; // Product IDs
  expected_traffic_multiplier?: number; // Traffic increase

  // Traffic spike parameters
  traffic_multiplier?: number; // 2x, 5x, 10x normal traffic
  conversion_rate_change?: number; // +/- percentage points

  // Supplier delay parameters
  delay_days?: number; // How many days delayed
  affected_skus?: string[]; // Which SKUs are affected
  alternative_sources?: boolean; // Can source from elsewhere

  // Carrier outage parameters
  affected_carriers?: string[]; // Which carriers
  alternative_shipping_cost?: number; // Extra cost per order

  // Custom parameters
  custom_parameters?: Record<string, any>;
}

export interface SimulationResult {
  id: string;
  simulationId: string;
  category: string;
  metrics: any;
  predictions: any;
  recommendations: any[];
  impactScore: number;
  severity: "low" | "medium" | "high" | "critical";
  baseline?: any;
  delta?: number;
}

export interface Simulation {
  id: string;
  shop: string;
  name: string;
  scenario: ScenarioType;
  parameters: SimulationParameters;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  impactScore?: number;
  riskLevel?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  results: SimulationResult[];
}

// ============================================================================
// Simulation Creation
// ============================================================================

/**
 * Create a new simulation
 */
export async function createSimulation(
  shop: string,
  name: string,
  scenario: ScenarioType,
  parameters: SimulationParameters,
  createdBy: string = "system"
): Promise<Simulation> {
  const simulation = await db.simulation.create({
    data: {
      shop,
      name,
      scenario,
      parameters: JSON.stringify(parameters),
      status: "pending",
      progress: 0,
      createdBy,
    },
    include: {
      results: true,
    },
  });

  return {
    ...simulation,
    parameters: JSON.parse(simulation.parameters),
    results: [],
  };
}

/**
 * Run simulation (main execution function)
 */
export async function runSimulation(simulationId: string): Promise<Simulation> {
  const startTime = Date.now();

  // Mark simulation as running
  await db.simulation.update({
    where: { id: simulationId },
    data: {
      status: "running",
      startedAt: new Date(),
      progress: 10,
    },
  });

  try {
    // Fetch simulation
    const sim = await db.simulation.findUnique({
      where: { id: simulationId },
      include: { results: true },
    });

    if (!sim) {
      throw new Error(`Simulation ${simulationId} not found`);
    }

    const parameters: SimulationParameters = JSON.parse(sim.parameters);
    const scenario = sim.scenario as ScenarioType;

    console.log(`🎮 Running simulation: ${sim.name} (${scenario})`);

    // Progress: 20%
    await updateProgress(simulationId, 20);

    // Get baseline metrics
    const baseline = await getBaselineMetrics(sim.shop);

    // Progress: 40%
    await updateProgress(simulationId, 40);

    // Run scenario-specific simulation
    let results: SimulationResult[];
    switch (scenario) {
      case "flash_sale":
        results = await simulateFlashSale(sim.shop, parameters, baseline);
        break;
      case "traffic_spike":
        results = await simulateTrafficSpike(sim.shop, parameters, baseline);
        break;
      case "supplier_delay":
        results = await simulateSupplierDelay(sim.shop, parameters, baseline);
        break;
      case "carrier_outage":
        results = await simulateCarrierOutage(sim.shop, parameters, baseline);
        break;
      case "competitor_stockout":
        results = await simulateCompetitorStockout(sim.shop, parameters, baseline);
        break;
      default:
        results = await simulateCustom(sim.shop, parameters, baseline);
    }

    // Progress: 70%
    await updateProgress(simulationId, 70);

    // Save results to database
    await saveResults(simulationId, results);

    // Progress: 90%
    await updateProgress(simulationId, 90);

    // Calculate overall impact score
    const impactScore = calculateOverallImpact(results);
    const riskLevel = determineRiskLevel(impactScore);

    // Mark as completed
    const completedSim = await db.simulation.update({
      where: { id: simulationId },
      data: {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
        impactScore,
        riskLevel,
      },
      include: { results: true },
    });

    const executionTime = Date.now() - startTime;
    console.log(
      `✅ Simulation completed in ${executionTime}ms (impact: ${impactScore.toFixed(1)}, risk: ${riskLevel})`
    );

    return {
      ...completedSim,
      parameters: JSON.parse(completedSim.parameters),
      results: completedSim.results.map((r) => ({
        ...r,
        metrics: JSON.parse(r.metrics),
        predictions: JSON.parse(r.predictions),
        recommendations: JSON.parse(r.recommendations),
        baseline: r.baseline ? JSON.parse(r.baseline) : undefined,
      })),
    };
  } catch (error: any) {
    console.error(`❌ Simulation failed:`, error);

    await db.simulation.update({
      where: { id: simulationId },
      data: {
        status: "failed",
        errorMessage: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

// ============================================================================
// Baseline Metrics
// ============================================================================

async function getBaselineMetrics(shop: string) {
  console.log(`📊 Fetching baseline metrics for ${shop}`);

  const [defcon, revenueRisk, predictions] = await Promise.all([
    getLatestDEFCON(shop),
    getRevenueRiskSummary(shop),
    getPredictionSummary(shop),
  ]);

  // Get recent order statistics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const orders = await db.order.findMany({
    where: {
      shop,
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      lineItems: true,
    },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const dailyOrders = orders.length / 30;

  return {
    defcon,
    revenueRisk,
    predictions,
    totalRevenue,
    avgOrderValue,
    dailyOrders,
    totalOrders: orders.length,
  };
}

// ============================================================================
// Scenario Simulations
// ============================================================================

/**
 * Simulate a flash sale scenario
 */
async function simulateFlashSale(
  shop: string,
  params: SimulationParameters,
  baseline: any
): Promise<SimulationResult[]> {
  console.log(`⚡ Simulating flash sale...`);

  const discountPercent = params.discount_percent || 30;
  const trafficMultiplier = params.expected_traffic_multiplier || 5;
  const durationHours = params.duration_hours || 4;

  // Simulate inventory impact
  const inventoryImpact = {
    expected_order_increase: baseline.dailyOrders * trafficMultiplier * (durationHours / 24),
    stockout_risk_increase: discountPercent * 2, // Higher discount = higher stockout risk
    critical_skus_affected: Math.floor((baseline.defcon?.criticalSKUs || 0) * 1.5),
  };

  // Simulate revenue impact
  const revenueImpact = {
    gross_revenue_increase:
      baseline.avgOrderValue *
      inventoryImpact.expected_order_increase *
      (1 - discountPercent / 100),
    margin_impact: -discountPercent,
    net_revenue_increase:
      baseline.avgOrderValue *
      inventoryImpact.expected_order_increase *
      (1 - discountPercent / 100) *
      0.7, // Account for margin loss
  };

  // Simulate fulfillment impact
  const fulfillmentImpact = {
    order_processing_backlog_hours: Math.max(
      0,
      inventoryImpact.expected_order_increase / (baseline.dailyOrders / 24) - durationHours
    ),
    shipping_cost_increase: inventoryImpact.expected_order_increase * 2, // Expedited shipping
    customer_service_tickets: inventoryImpact.expected_order_increase * 0.15,
  };

  // Generate recommendations
  const recommendations = [];
  if (inventoryImpact.critical_skus_affected > 5) {
    recommendations.push({
      action: "increase_inventory",
      reason: "Flash sale will likely cause stockouts",
      priority: 10,
      estimated_cost: 5000,
    });
  }
  if (fulfillmentImpact.order_processing_backlog_hours > 4) {
    recommendations.push({
      action: "add_fulfillment_capacity",
      reason: "Order backlog expected during flash sale",
      priority: 8,
      estimated_cost: 2000,
    });
  }

  const impactScore = Math.min(
    100,
    (inventoryImpact.stockout_risk_increase +
      Math.abs(revenueImpact.margin_impact) +
      fulfillmentImpact.order_processing_backlog_hours * 2) /
      2
  );

  return [
    {
      id: "",
      simulationId: "",
      category: "inventory",
      metrics: inventoryImpact,
      predictions: {
        stockout_probability: Math.min(100, inventoryImpact.stockout_risk_increase * 1.5),
        expected_duration_hours: durationHours,
      },
      recommendations: recommendations.filter((r) => r.action === "increase_inventory"),
      impactScore: impactScore * 0.4,
      severity: impactScore > 70 ? "critical" : impactScore > 50 ? "high" : "medium",
      baseline: {
        daily_orders: baseline.dailyOrders,
        critical_skus: baseline.defcon?.criticalSKUs || 0,
      },
      delta: (inventoryImpact.expected_order_increase / baseline.dailyOrders) * 100,
    },
    {
      id: "",
      simulationId: "",
      category: "revenue",
      metrics: revenueImpact,
      predictions: {
        revenue_at_risk: revenueImpact.net_revenue_increase * 0.2, // 20% at risk
        margin_protection_needed: Math.abs(revenueImpact.margin_impact),
      },
      recommendations: recommendations.filter((r) => r.action !== "increase_inventory"),
      impactScore: impactScore * 0.3,
      severity: revenueImpact.net_revenue_increase > 10000 ? "high" : "medium",
      baseline: {
        avg_order_value: baseline.avgOrderValue,
        daily_revenue: baseline.avgOrderValue * baseline.dailyOrders,
      },
      delta: (revenueImpact.net_revenue_increase / (baseline.avgOrderValue * baseline.dailyOrders)) * 100,
    },
    {
      id: "",
      simulationId: "",
      category: "fulfillment",
      metrics: fulfillmentImpact,
      predictions: {
        backlog_clearance_time: fulfillmentImpact.order_processing_backlog_hours,
        customer_satisfaction_impact: -fulfillmentImpact.customer_service_tickets / 10,
      },
      recommendations,
      impactScore: impactScore * 0.3,
      severity: fulfillmentImpact.order_processing_backlog_hours > 8 ? "high" : "medium",
      baseline: {
        normal_processing_time: 2,
        normal_cs_tickets: baseline.dailyOrders * 0.05,
      },
      delta: (fulfillmentImpact.order_processing_backlog_hours / 2) * 100,
    },
  ];
}

/**
 * Simulate a traffic spike scenario
 */
async function simulateTrafficSpike(
  shop: string,
  params: SimulationParameters,
  baseline: any
): Promise<SimulationResult[]> {
  console.log(`📈 Simulating traffic spike...`);

  const trafficMultiplier = params.traffic_multiplier || 10;
  const conversionChange = params.conversion_rate_change || -2; // Traffic spikes often lower conversion
  const durationHours = params.duration_hours || 2;

  const expectedOrders =
    baseline.dailyOrders * trafficMultiplier * (durationHours / 24) * (1 + conversionChange / 100);

  const inventoryImpact = {
    expected_orders: expectedOrders,
    stockout_probability: Math.min(100, (expectedOrders / baseline.dailyOrders) * 10),
    critical_skus_at_risk: Math.ceil((baseline.defcon?.criticalSKUs || 0) * 2),
  };

  const systemImpact = {
    site_slowdown_risk: Math.min(100, trafficMultiplier * 8),
    checkout_failure_rate: Math.min(50, trafficMultiplier * 2),
    expected_abandoned_carts: expectedOrders * 0.3,
  };

  const impactScore = (inventoryImpact.stockout_probability + systemImpact.site_slowdown_risk) / 2;

  return [
    {
      id: "",
      simulationId: "",
      category: "inventory",
      metrics: inventoryImpact,
      predictions: {
        stockout_time: durationHours / 2,
        recovery_time: durationHours * 2,
      },
      recommendations: [
        {
          action: "enable_queue_system",
          reason: "Traffic spike may overwhelm inventory",
          priority: 9,
        },
      ],
      impactScore: impactScore * 0.5,
      severity: impactScore > 70 ? "critical" : "high",
      baseline: { daily_orders: baseline.dailyOrders },
      delta: (expectedOrders / baseline.dailyOrders) * 100 - 100,
    },
    {
      id: "",
      simulationId: "",
      category: "customer_impact",
      metrics: systemImpact,
      predictions: {
        revenue_lost: systemImpact.expected_abandoned_carts * baseline.avgOrderValue,
        reputation_damage: systemImpact.checkout_failure_rate / 10,
      },
      recommendations: [
        {
          action: "scale_infrastructure",
          reason: "Prevent site slowdown",
          priority: 10,
        },
      ],
      impactScore: impactScore * 0.5,
      severity: systemImpact.site_slowdown_risk > 50 ? "critical" : "high",
      baseline: { normal_conversion_rate: 3 },
      delta: conversionChange,
    },
  ];
}

/**
 * Simulate a supplier delay scenario
 */
async function simulateSupplierDelay(
  shop: string,
  params: SimulationParameters,
  baseline: any
): Promise<SimulationResult[]> {
  console.log(`🚚 Simulating supplier delay...`);

  const delayDays = params.delay_days || 7;
  const hasAlternatives = params.alternative_sources !== false;

  const dailyBurnRate = baseline.dailyOrders * 2; // Assume 2 units per order on average
  const unitsShort = dailyBurnRate * delayDays;

  const inventoryImpact = {
    units_short: unitsShort,
    days_of_stockouts: hasAlternatives ? delayDays * 0.3 : delayDays,
    affected_skus: params.affected_skus?.length || 10,
  };

  const revenueImpact = {
    revenue_at_risk: unitsShort * (baseline.avgOrderValue / 2),
    lost_sales: hasAlternatives
      ? unitsShort * (baseline.avgOrderValue / 2) * 0.3
      : unitsShort * (baseline.avgOrderValue / 2),
    alternative_sourcing_cost: hasAlternatives ? unitsShort * 5 : 0,
  };

  const impactScore = (inventoryImpact.days_of_stockouts / delayDays) * 100;

  return [
    {
      id: "",
      simulationId: "",
      category: "inventory",
      metrics: inventoryImpact,
      predictions: {
        stockout_start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        recovery_date: new Date(Date.now() + (delayDays + 3) * 24 * 60 * 60 * 1000),
      },
      recommendations: [
        {
          action: hasAlternatives ? "activate_alternative_supplier" : "emergency_reorder",
          reason: `${delayDays} day delay will cause stockouts`,
          priority: 10,
          estimated_cost: revenueImpact.alternative_sourcing_cost,
        },
      ],
      impactScore: impactScore * 0.6,
      severity: impactScore > 70 ? "critical" : "high",
      baseline: { daily_burn_rate: dailyBurnRate },
      delta: -(inventoryImpact.days_of_stockouts / delayDays) * 100,
    },
    {
      id: "",
      simulationId: "",
      category: "revenue",
      metrics: revenueImpact,
      predictions: {
        total_revenue_impact: revenueImpact.lost_sales + revenueImpact.alternative_sourcing_cost,
        margin_impact: hasAlternatives ? -15 : 0,
      },
      recommendations: [
        {
          action: "increase_prices_temporarily",
          reason: "Offset alternative sourcing costs",
          priority: 5,
        },
      ],
      impactScore: impactScore * 0.4,
      severity: revenueImpact.lost_sales > 50000 ? "critical" : "high",
      baseline: { monthly_revenue: baseline.totalRevenue },
      delta: -(revenueImpact.lost_sales / baseline.totalRevenue) * 100,
    },
  ];
}

/**
 * Simulate a carrier outage scenario
 */
async function simulateCarrierOutage(
  shop: string,
  params: SimulationParameters,
  baseline: any
): Promise<SimulationResult[]> {
  console.log(`📦 Simulating carrier outage...`);

  const durationHours = params.duration_hours || 24;
  const extraCostPerOrder = params.alternative_shipping_cost || 15;
  const affectedOrderPercent = 60; // Assume 60% of orders use affected carrier

  const ordersAffected = (baseline.dailyOrders * durationHours) / 24;
  const ordersNeedingAlternative = ordersAffected * (affectedOrderPercent / 100);

  const fulfillmentImpact = {
    orders_delayed: ordersAffected,
    orders_needing_alternative: ordersNeedingAlternative,
    delay_hours: durationHours,
  };

  const costImpact = {
    alternative_shipping_cost: ordersNeedingAlternative * extraCostPerOrder,
    refund_risk: ordersAffected * baseline.avgOrderValue * 0.05, // 5% may request refunds
    customer_service_cost: ordersAffected * 5, // $5 per affected order
  };

  const impactScore = (ordersAffected / baseline.dailyOrders) * 50 + durationHours * 2;

  return [
    {
      id: "",
      simulationId: "",
      category: "fulfillment",
      metrics: fulfillmentImpact,
      predictions: {
        delivery_delay_days: Math.ceil(durationHours / 24) + 2,
        customer_satisfaction_drop: -ordersAffected / 10,
      },
      recommendations: [
        {
          action: "activate_backup_carrier",
          reason: "Primary carrier outage",
          priority: 10,
          estimated_cost: costImpact.alternative_shipping_cost,
        },
      ],
      impactScore: impactScore * 0.6,
      severity: durationHours > 48 ? "critical" : "high",
      baseline: { normal_delivery_time: 3 },
      delta: (durationHours / 24 / 3) * 100,
    },
    {
      id: "",
      simulationId: "",
      category: "revenue",
      metrics: costImpact,
      predictions: {
        total_cost_impact:
          costImpact.alternative_shipping_cost +
          costImpact.refund_risk +
          costImpact.customer_service_cost,
        margin_impact:
          ((costImpact.alternative_shipping_cost + costImpact.customer_service_cost) /
            (baseline.avgOrderValue * ordersAffected)) *
          100,
      },
      recommendations: [
        {
          action: "offer_discounts_proactively",
          reason: "Prevent refund requests",
          priority: 7,
        },
      ],
      impactScore: impactScore * 0.4,
      severity: costImpact.alternative_shipping_cost > 10000 ? "high" : "medium",
      baseline: { normal_shipping_cost: ordersAffected * 5 },
      delta: (extraCostPerOrder / 5) * 100,
    },
  ];
}

/**
 * Simulate a competitor stockout (opportunity capture)
 */
async function simulateCompetitorStockout(
  shop: string,
  params: SimulationParameters,
  baseline: any
): Promise<SimulationResult[]> {
  console.log(`🎯 Simulating competitor stockout (opportunity)...`);

  const durationHours = params.duration_hours || 48;
  const marketShareCapture = 30; // Assume 30% of competitor's traffic comes to us

  const additionalOrders = (baseline.dailyOrders * 0.5 * durationHours) / 24; // 50% increase
  const capturedRevenue = additionalOrders * baseline.avgOrderValue;

  const opportunityMetrics = {
    additional_orders: additionalOrders,
    captured_revenue: capturedRevenue,
    market_share_gain: marketShareCapture,
  };

  const preparednessMetrics = {
    inventory_adequate: baseline.defcon?.criticalSKUs === 0,
    fulfillment_ready: true,
    marketing_budget_needed: capturedRevenue * 0.1, // 10% for marketing
  };

  const impactScore = 20; // Low risk, high opportunity

  return [
    {
      id: "",
      simulationId: "",
      category: "revenue",
      metrics: opportunityMetrics,
      predictions: {
        potential_revenue: capturedRevenue,
        customer_retention_rate: 40, // 40% may become repeat customers
      },
      recommendations: [
        {
          action: "increase_marketing_spend",
          reason: "Capitalize on competitor stockout",
          priority: 9,
          estimated_cost: preparednessMetrics.marketing_budget_needed,
        },
      ],
      impactScore: impactScore * 0.7,
      severity: "low",
      baseline: { daily_revenue: baseline.avgOrderValue * baseline.dailyOrders },
      delta: (capturedRevenue / (baseline.avgOrderValue * baseline.dailyOrders)) * 100,
    },
    {
      id: "",
      simulationId: "",
      category: "inventory",
      metrics: preparednessMetrics,
      predictions: {
        stockout_risk_if_unprepared: preparednessMetrics.inventory_adequate ? 10 : 70,
        recommended_buffer_stock: additionalOrders * 2,
      },
      recommendations: [
        {
          action: preparednessMetrics.inventory_adequate
            ? "monitor_inventory"
            : "increase_inventory_immediately",
          reason: "Prepare for competitor overflow",
          priority: preparednessMetrics.inventory_adequate ? 5 : 10,
        },
      ],
      impactScore: impactScore * 0.3,
      severity: preparednessMetrics.inventory_adequate ? "low" : "high",
      baseline: { critical_skus: baseline.defcon?.criticalSKUs || 0 },
      delta: preparednessMetrics.inventory_adequate ? 0 : 50,
    },
  ];
}

/**
 * Simulate a custom scenario
 */
async function simulateCustom(
  shop: string,
  params: SimulationParameters,
  baseline: any
): Promise<SimulationResult[]> {
  console.log(`🎨 Simulating custom scenario...`);

  // Placeholder for custom scenarios
  return [
    {
      id: "",
      simulationId: "",
      category: "custom",
      metrics: params.custom_parameters || {},
      predictions: {},
      recommendations: [],
      impactScore: 50,
      severity: "medium",
    },
  ];
}

// ============================================================================
// Helper Functions
// ============================================================================

async function updateProgress(simulationId: string, progress: number) {
  await db.simulation.update({
    where: { id: simulationId },
    data: { progress },
  });
}

async function saveResults(simulationId: string, results: SimulationResult[]) {
  for (const result of results) {
    await db.simulationResult.create({
      data: {
        simulationId,
        category: result.category,
        metrics: JSON.stringify(result.metrics),
        predictions: JSON.stringify(result.predictions),
        recommendations: JSON.stringify(result.recommendations),
        impactScore: result.impactScore,
        severity: result.severity,
        baseline: result.baseline ? JSON.stringify(result.baseline) : null,
        delta: result.delta || null,
      },
    });
  }
}

function calculateOverallImpact(results: SimulationResult[]): number {
  if (results.length === 0) return 0;
  const total = results.reduce((sum, r) => sum + r.impactScore, 0);
  return total / results.length;
}

function determineRiskLevel(impactScore: number): string {
  if (impactScore >= 75) return "critical";
  if (impactScore >= 50) return "high";
  if (impactScore >= 25) return "medium";
  return "low";
}

// ============================================================================
// Querying Simulations
// ============================================================================

/**
 * Get simulation by ID
 */
export async function getSimulation(simulationId: string): Promise<Simulation | null> {
  const sim = await db.simulation.findUnique({
    where: { id: simulationId },
    include: { results: true },
  });

  if (!sim) return null;

  return {
    ...sim,
    parameters: JSON.parse(sim.parameters),
    results: sim.results.map((r) => ({
      ...r,
      metrics: JSON.parse(r.metrics),
      predictions: JSON.parse(r.predictions),
      recommendations: JSON.parse(r.recommendations),
      baseline: r.baseline ? JSON.parse(r.baseline) : undefined,
    })),
  };
}

/**
 * List all simulations for a shop
 */
export async function listSimulations(
  shop: string,
  limit: number = 20
): Promise<Simulation[]> {
  const sims = await db.simulation.findMany({
    where: { shop },
    include: { results: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return sims.map((sim) => ({
    ...sim,
    parameters: JSON.parse(sim.parameters),
    results: sim.results.map((r) => ({
      ...r,
      metrics: JSON.parse(r.metrics),
      predictions: JSON.parse(r.predictions),
      recommendations: JSON.parse(r.recommendations),
      baseline: r.baseline ? JSON.parse(r.baseline) : undefined,
    })),
  }));
}

/**
 * Delete simulation
 */
export async function deleteSimulation(simulationId: string): Promise<void> {
  await db.simulation.delete({
    where: { id: simulationId },
  });
}

/**
 * Compare multiple simulations
 */
export async function compareSimulations(
  simulationIds: string[]
): Promise<{ simulations: Simulation[]; comparison: any }> {
  const simulations = await Promise.all(simulationIds.map((id) => getSimulation(id)));

  const validSims = simulations.filter((s): s is Simulation => s !== null);

  // Create comparison matrix
  const comparison = {
    scenarios: validSims.map((s) => s.scenario),
    impact_scores: validSims.map((s) => s.impactScore || 0),
    risk_levels: validSims.map((s) => s.riskLevel || "unknown"),
    recommendations_count: validSims.map(
      (s) => s.results.reduce((sum, r) => sum + r.recommendations.length, 0)
    ),
  };

  return { simulations: validSims, comparison };
}
