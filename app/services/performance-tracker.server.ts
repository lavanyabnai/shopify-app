/**
 * BFCM War Room - Performance Tracker Service (Session 6)
 *
 * Tracks key performance indicators and compares against targets.
 *
 * Features:
 * - Revenue run rate calculation
 * - Perfect order rate tracking
 * - Inventory efficiency metrics
 * - Margin protection analysis
 * - Year-over-year comparisons
 */

import db from "../db.server";
import cache, { getCacheKey } from "./cache.server";

// ============================================================================
// Types
// ============================================================================

export interface PerformanceMetrics {
  // Revenue metrics
  revenueRunRate: number; // $/hour
  dailyRevenue: number;
  weeklyRevenue: number;
  vsLastYear: number; // % change
  vsPlan: number; // % vs target

  // Order metrics
  totalOrders: number;
  avgOrderValue: number;
  perfectOrderRate: number; // % fulfilled without issues
  orderVelocity: number; // orders/hour

  // Inventory metrics
  inventoryTurnover: number; // times per period
  stockoutRate: number; // % of time out of stock
  inventoryEfficiency: number; // 0-100 score

  // Margin metrics
  avgMargin: number; // %
  marginProtection: number; // $ saved from avoiding discounts
  expeditedShippingCost: number; // $ spent on rush orders

  // Timestamps
  periodStart: Date;
  periodEnd: Date;
  calculatedAt: Date;
}

export interface Trend {
  metric: string;
  current: number;
  previous: number;
  change: number; // %
  direction: 'up' | 'down' | 'flat';
  sparkline: number[]; // Last 24 data points
}

// ============================================================================
// Performance Calculation
// ============================================================================

/**
 * Calculate performance metrics for a shop
 */
export async function calculatePerformanceMetrics(
  shop: string,
  periodHours: number = 24,
): Promise<PerformanceMetrics> {
  const cacheKey = getCacheKey("war-room", "performance", shop, `${periodHours}h`);

  // Try cache first
  const cached = await cache.get<PerformanceMetrics>(cacheKey);
  if (cached) {
    return cached;
  }

  const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000);
  const periodEnd = new Date();

  // Get orders for current period
  const orders = await db.order.findMany({
    where: {
      shop,
      processedAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
    include: {
      lineItems: true,
    },
  });

  // Calculate revenue metrics
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const revenueRunRate = totalRevenue / periodHours;
  const dailyRevenue = revenueRunRate * 24;
  const weeklyRevenue = dailyRevenue * 7;

  // Calculate order metrics
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const fulfilledOrders = orders.filter(o => o.fulfillmentStatus === 'FULFILLED').length;
  const perfectOrderRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;
  const orderVelocity = totalOrders / periodHours;

  // Get last year's data for comparison
  const lastYearStart = new Date(periodStart);
  lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
  const lastYearEnd = new Date(periodEnd);
  lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

  const lastYearOrders = await db.order.findMany({
    where: {
      shop,
      processedAt: {
        gte: lastYearStart,
        lte: lastYearEnd,
      },
    },
  });

  const lastYearRevenue = lastYearOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const vsLastYear = lastYearRevenue > 0
    ? ((totalRevenue - lastYearRevenue) / lastYearRevenue) * 100
    : 0;

  // Get plan/target (mock - in production, this would come from user settings)
  const plan = dailyRevenue * 1.15; // Assuming 15% growth target
  const vsPlan = plan > 0 ? ((dailyRevenue - plan) / plan) * 100 : 0;

  // Calculate inventory metrics
  const products = await db.product.findMany({
    where: { shop, status: 'active' },
  });

  const inventoryTurnover = calculateInventoryTurnover(orders, products);
  const stockoutRate = await calculateStockoutRate(shop, periodStart, periodEnd);
  const inventoryEfficiency = Math.max(0, Math.min(100, 100 - stockoutRate * 10)); // 0-100 score

  // Calculate margin metrics (mock data - would need cost data in production)
  const avgMargin = 40; // Mock 40% margin
  const marginProtection = totalRevenue * 0.05; // Mock 5% saved from avoiding discounts
  const expeditedShippingCost = totalOrders * 5; // Mock $5 per order expedited shipping

  const metrics: PerformanceMetrics = {
    revenueRunRate,
    dailyRevenue,
    weeklyRevenue,
    vsLastYear,
    vsPlan,
    totalOrders,
    avgOrderValue,
    perfectOrderRate,
    orderVelocity,
    inventoryTurnover,
    stockoutRate,
    inventoryEfficiency,
    avgMargin,
    marginProtection,
    expeditedShippingCost,
    periodStart,
    periodEnd,
    calculatedAt: new Date(),
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, metrics, 300);

  return metrics;
}

/**
 * Calculate inventory turnover rate
 */
function calculateInventoryTurnover(orders: any[], products: any[]): number {
  if (products.length === 0) return 0;

  const totalSold = orders.reduce((sum, order) => {
    return sum + order.lineItems.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
  }, 0);

  const avgInventory = products.reduce((sum, p) => sum + p.totalInventory, 0) / products.length;

  return avgInventory > 0 ? totalSold / avgInventory : 0;
}

/**
 * Calculate stockout rate
 */
async function calculateStockoutRate(
  shop: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<number> {
  // Check inventory snapshots for stockouts
  const snapshots = await db.inventorySnapshot.findMany({
    where: {
      shop,
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
  });

  if (snapshots.length === 0) return 0;

  const stockoutSnapshots = snapshots.filter(s => s.status === 'stockout');
  return (stockoutSnapshots.length / snapshots.length) * 100;
}

// ============================================================================
// Trend Analysis
// ============================================================================

/**
 * Calculate trend for a specific metric
 */
export async function calculateTrend(
  shop: string,
  metric: string,
  hours: number = 24,
): Promise<Trend> {
  // Get hourly data points for the last N hours
  const dataPoints: number[] = [];

  for (let i = hours; i >= 0; i--) {
    const hourStart = new Date(Date.now() - i * 60 * 60 * 1000);
    const hourEnd = new Date(Date.now() - (i - 1) * 60 * 60 * 1000);

    const hourOrders = await db.order.findMany({
      where: {
        shop,
        processedAt: {
          gte: hourStart,
          lte: hourEnd,
        },
      },
    });

    const value = hourOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    dataPoints.push(value);
  }

  const current = dataPoints[dataPoints.length - 1] || 0;
  const previous = dataPoints[dataPoints.length - 2] || 0;
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

  let direction: 'up' | 'down' | 'flat' = 'flat';
  if (change > 5) direction = 'up';
  if (change < -5) direction = 'down';

  return {
    metric,
    current,
    previous,
    change,
    direction,
    sparkline: dataPoints.slice(-24), // Last 24 hours
  };
}

/**
 * Get all performance trends
 */
export async function getPerformanceTrends(shop: string): Promise<Trend[]> {
  const cacheKey = getCacheKey("war-room", "performance-trends", shop);

  // Try cache first
  const cached = await cache.get<Trend[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const trends = await Promise.all([
    calculateTrend(shop, 'revenue', 24),
    calculateTrend(shop, 'orders', 24),
  ]);

  // Cache for 5 minutes
  await cache.set(cacheKey, trends, 300);

  return trends;
}

// ============================================================================
// Performance Summary
// ============================================================================

/**
 * Get performance summary with key highlights
 */
export async function getPerformanceSummary(shop: string) {
  const metrics = await calculatePerformanceMetrics(shop, 24);
  const trends = await getPerformanceTrends(shop);

  return {
    metrics,
    trends,
    highlights: generateHighlights(metrics),
    alerts: generatePerformanceAlerts(metrics),
  };
}

/**
 * Generate performance highlights
 */
function generateHighlights(metrics: PerformanceMetrics): string[] {
  const highlights: string[] = [];

  if (metrics.vsLastYear > 20) {
    highlights.push(`📈 Revenue up ${metrics.vsLastYear.toFixed(1)}% vs last year`);
  }

  if (metrics.perfectOrderRate > 95) {
    highlights.push(`✨ ${metrics.perfectOrderRate.toFixed(1)}% perfect order rate`);
  }

  if (metrics.inventoryEfficiency > 80) {
    highlights.push(`🎯 ${metrics.inventoryEfficiency.toFixed(0)}% inventory efficiency`);
  }

  if (metrics.stockoutRate < 5) {
    highlights.push(`✅ Low stockout rate (${metrics.stockoutRate.toFixed(1)}%)`);
  }

  return highlights;
}

/**
 * Generate performance alerts
 */
function generatePerformanceAlerts(metrics: PerformanceMetrics): string[] {
  const alerts: string[] = [];

  if (metrics.vsPlan < -10) {
    alerts.push(`⚠️ Revenue ${Math.abs(metrics.vsPlan).toFixed(1)}% below plan`);
  }

  if (metrics.perfectOrderRate < 90) {
    alerts.push(`⚠️ Perfect order rate low (${metrics.perfectOrderRate.toFixed(1)}%)`);
  }

  if (metrics.stockoutRate > 10) {
    alerts.push(`🚨 High stockout rate (${metrics.stockoutRate.toFixed(1)}%)`);
  }

  if (metrics.inventoryEfficiency < 60) {
    alerts.push(`⚠️ Inventory efficiency needs improvement (${metrics.inventoryEfficiency.toFixed(0)}%)`);
  }

  return alerts;
}
