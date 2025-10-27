/**
 * BFCM War Room - Alert Engine Service (Session 5)
 *
 * Monitors War Room metrics and triggers alerts based on rules.
 *
 * Features:
 * - Rule-based alert evaluation
 * - DEFCON escalation monitoring
 * - Stockout countdown alerts
 * - Velocity anomaly detection
 * - Deduplication and throttling
 * - Multi-channel notification dispatch
 */

import db from "../db.server";
import { calculateDEFCON } from "./defcon-calculator.server";
import { calculateStockoutCountdowns } from "./stockout-countdown.server";
import { detectVelocityAnomalies } from "./velocity-detector.server";
import { dispatchNotifications } from "./notification-dispatcher.server";
import type { Prisma } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export interface AlertCondition {
  type: 'defcon_level' | 'stockout_countdown' | 'velocity_anomaly' | 'inventory_coverage' | 'revenue_risk';
  operator: '<=' | '>=' | '==' | '<' | '>';
  value: number | string;
  threshold?: number; // Optional secondary threshold
}

export interface AlertTrigger {
  ruleId: string;
  ruleName: string;
  severity: string;
  title: string;
  message: string;
  alertType: string;
  metadata: Record<string, any>;
  channels: string[];
}

export interface AlertSummary {
  active: number;
  acknowledged: number;
  resolved: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recentAlerts: any[];
}

// ============================================================================
// Alert Evaluation
// ============================================================================

/**
 * Evaluate all active alert rules for a shop
 */
export async function evaluateAlertRules(shop: string): Promise<AlertTrigger[]> {
  // Get active rules
  const rules = await db.alertRule.findMany({
    where: {
      shop,
      active: true,
    },
    orderBy: {
      severity: 'asc',
    },
  });

  if (rules.length === 0) {
    console.log(`⚠️  No active alert rules found for ${shop}`);
    return [];
  }

  // Get current metrics
  const metrics = await getCurrentMetrics(shop);

  // Evaluate each rule
  const triggers: AlertTrigger[] = [];

  for (const rule of rules) {
    // Check cooldown
    const inCooldown = await isInCooldown(rule.id, rule.cooldownMinutes);
    if (inCooldown) {
      continue;
    }

    // Check daily limit
    const exceededLimit = await hasExceededDailyLimit(rule.id, rule.maxAlertsPerDay);
    if (exceededLimit) {
      continue;
    }

    // Parse condition
    const condition: AlertCondition = JSON.parse(rule.condition);

    // Evaluate condition
    const triggered = evaluateCondition(condition, metrics);

    if (triggered) {
      const alertMessage = generateAlertMessage(rule, condition, metrics);

      triggers.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        title: alertMessage.title,
        message: alertMessage.message,
        alertType: condition.type,
        metadata: {
          condition,
          metrics,
          triggeredAt: new Date().toISOString(),
        },
        channels: JSON.parse(rule.channels),
      });
    }
  }

  return triggers;
}

/**
 * Get current War Room metrics for evaluation
 */
async function getCurrentMetrics(shop: string) {
  const [defcon, countdowns, anomalies] = await Promise.all([
    calculateDEFCON(shop),
    calculateStockoutCountdowns(shop),
    detectVelocityAnomalies(shop),
  ]);

  return {
    defconLevel: defcon.level,
    inventoryCoverageHours: defcon.inventoryCoverageHours,
    riskScore: defcon.riskScore,
    criticalCountdowns: countdowns.countdowns.filter(c => c.urgency === 'critical').length,
    urgentCountdowns: countdowns.countdowns.filter(c => c.urgency === 'urgent').length,
    viralProducts: anomalies.anomalies.filter(a => a.type === 'viral').length,
    acceleratingProducts: anomalies.anomalies.filter(a => a.type === 'accelerating').length,
    deadStock: anomalies.anomalies.filter(a => a.type === 'dead_stock').length,
  };
}

/**
 * Evaluate a single condition against metrics
 */
function evaluateCondition(condition: AlertCondition, metrics: any): boolean {
  const { type, operator, value } = condition;

  // Get metric value
  let metricValue: number;

  switch (type) {
    case 'defcon_level':
      metricValue = metrics.defconLevel;
      break;
    case 'stockout_countdown':
      metricValue = metrics.criticalCountdowns + metrics.urgentCountdowns;
      break;
    case 'velocity_anomaly':
      metricValue = metrics.viralProducts + metrics.acceleratingProducts;
      break;
    case 'inventory_coverage':
      metricValue = metrics.inventoryCoverageHours;
      break;
    case 'revenue_risk':
      metricValue = metrics.riskScore;
      break;
    default:
      return false;
  }

  // Evaluate operator
  switch (operator) {
    case '<=':
      return metricValue <= Number(value);
    case '>=':
      return metricValue >= Number(value);
    case '==':
      return metricValue === Number(value);
    case '<':
      return metricValue < Number(value);
    case '>':
      return metricValue > Number(value);
    default:
      return false;
  }
}

/**
 * Generate human-readable alert message
 */
function generateAlertMessage(rule: any, condition: AlertCondition, metrics: any) {
  const { type } = condition;

  switch (type) {
    case 'defcon_level':
      return {
        title: `🚨 DEFCON ${metrics.defconLevel} Alert`,
        message: `System escalated to DEFCON ${metrics.defconLevel}. Risk score: ${metrics.riskScore.toFixed(1)}. Inventory coverage: ${metrics.inventoryCoverageHours.toFixed(1)} hours. Immediate attention required.`,
      };

    case 'stockout_countdown':
      return {
        title: `⏰ Stockout Countdown Alert`,
        message: `${metrics.criticalCountdowns} critical and ${metrics.urgentCountdowns} urgent stockouts predicted. Review War Room immediately.`,
      };

    case 'velocity_anomaly':
      return {
        title: `📈 Velocity Anomaly Detected`,
        message: `${metrics.viralProducts} viral products and ${metrics.acceleratingProducts} accelerating products detected. Inventory may be at risk.`,
      };

    case 'inventory_coverage':
      return {
        title: `📦 Low Inventory Coverage`,
        message: `Average inventory coverage is ${metrics.inventoryCoverageHours.toFixed(1)} hours. Review at-risk products urgently.`,
      };

    case 'revenue_risk':
      return {
        title: `💰 High Revenue Risk`,
        message: `Risk score elevated to ${metrics.riskScore.toFixed(1)}. Potential stockouts threaten revenue.`,
      };

    default:
      return {
        title: rule.name,
        message: rule.description || 'Alert triggered',
      };
  }
}

// ============================================================================
// Cooldown & Throttling
// ============================================================================

/**
 * Check if a rule is in cooldown period
 */
async function isInCooldown(ruleId: string, cooldownMinutes: number): Promise<boolean> {
  const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);

  const recentAlert = await db.alertHistory.findFirst({
    where: {
      ruleId,
      triggeredAt: {
        gte: cooldownTime,
      },
    },
    orderBy: {
      triggeredAt: 'desc',
    },
  });

  return recentAlert !== null;
}

/**
 * Check if a rule has exceeded daily alert limit
 */
async function hasExceededDailyLimit(ruleId: string, maxAlertsPerDay: number): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const alertsToday = await db.alertHistory.count({
    where: {
      ruleId,
      triggeredAt: {
        gte: startOfDay,
      },
    },
  });

  return alertsToday >= maxAlertsPerDay;
}

// ============================================================================
// Alert Triggering
// ============================================================================

/**
 * Trigger alerts and dispatch notifications
 */
export async function triggerAlerts(shop: string): Promise<AlertTrigger[]> {
  const triggers = await evaluateAlertRules(shop);

  if (triggers.length === 0) {
    return [];
  }

  console.log(`🔔 Triggering ${triggers.length} alerts for ${shop}`);

  // Save alert history and dispatch notifications
  for (const trigger of triggers) {
    await saveAlertHistory(shop, trigger);
    await dispatchNotifications(shop, trigger);
  }

  return triggers;
}

/**
 * Save alert to history
 */
async function saveAlertHistory(shop: string, trigger: AlertTrigger) {
  await db.alertHistory.create({
    data: {
      shop,
      ruleId: trigger.ruleId === 'manual' || trigger.ruleId === 'test' ? null : trigger.ruleId,
      severity: trigger.severity,
      title: trigger.title,
      message: trigger.message,
      alertType: trigger.alertType,
      metadata: JSON.stringify(trigger.metadata),
      channels: JSON.stringify(trigger.channels),
      triggeredAt: new Date(),
    },
  });
}

// ============================================================================
// Manual Alert Triggering
// ============================================================================

/**
 * Manually trigger a specific alert type (for testing)
 */
export async function triggerManualAlert(
  shop: string,
  severity: string,
  alertType: string,
  title: string,
  message: string,
  channels: string[] = ['in_app'],
) {
  const trigger: AlertTrigger = {
    ruleId: 'manual',
    ruleName: 'Manual Alert',
    severity,
    title,
    message,
    alertType,
    metadata: {
      manual: true,
      triggeredAt: new Date().toISOString(),
    },
    channels,
  };

  await saveAlertHistory(shop, trigger);
  await dispatchNotifications(shop, trigger);

  return trigger;
}

// ============================================================================
// Alert Management
// ============================================================================

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string, acknowledgedBy: string) {
  await db.alertHistory.update({
    where: { id: alertId },
    data: {
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    },
  });
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string, resolution?: string) {
  await db.alertHistory.update({
    where: { id: alertId },
    data: {
      resolvedAt: new Date(),
      resolution,
    },
  });
}

/**
 * Get active alerts for a shop
 */
export async function getActiveAlerts(shop: string) {
  if (!db?.alertHistory) {
    console.error('❌ db.alertHistory not available');
    return [];
  }

  return db.alertHistory.findMany({
    where: {
      shop,
      acknowledged: false,
      resolvedAt: null,
    },
    orderBy: [
      { severity: 'asc' },
      { triggeredAt: 'desc' },
    ],
    take: 50,
  });
}

/**
 * Get alert history for a shop
 */
export async function getAlertHistory(
  shop: string,
  options: {
    limit?: number;
    severity?: string;
    alertType?: string;
    acknowledged?: boolean;
  } = {},
) {
  if (!db?.alertHistory) {
    console.error('❌ db.alertHistory not available');
    return [];
  }

  const { limit = 100, severity, alertType, acknowledged } = options;

  return db.alertHistory.findMany({
    where: {
      shop,
      ...(severity && { severity }),
      ...(alertType && { alertType }),
      ...(acknowledged !== undefined && { acknowledged }),
    },
    orderBy: {
      triggeredAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get alert summary statistics
 */
export async function getAlertSummary(shop: string): Promise<AlertSummary> {
  if (!db?.alertHistory) {
    console.error('❌ db.alertHistory not available');
    return {
      active: 0,
      acknowledged: 0,
      resolved: 0,
      bySeverity: {},
      byType: {},
      recentAlerts: [],
    };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [active, acknowledged, resolved, allToday] = await Promise.all([
    db.alertHistory.count({
      where: { shop, acknowledged: false, resolvedAt: null },
    }),
    db.alertHistory.count({
      where: { shop, acknowledged: true, resolvedAt: null },
    }),
    db.alertHistory.count({
      where: { shop, resolvedAt: { not: null } },
    }),
    db.alertHistory.findMany({
      where: {
        shop,
        triggeredAt: { gte: startOfDay },
      },
    }),
  ]);

  // Count by severity
  const bySeverity: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const alert of allToday) {
    bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    byType[alert.alertType] = (byType[alert.alertType] || 0) + 1;
  }

  // Get recent alerts
  const recentAlerts = await db.alertHistory.findMany({
    where: { shop },
    orderBy: { triggeredAt: 'desc' },
    take: 10,
  });

  return {
    active,
    acknowledged,
    resolved,
    bySeverity,
    byType,
    recentAlerts,
  };
}

// ============================================================================
// Alert Rule Management
// ============================================================================

/**
 * Create default alert rules for a shop
 */
export async function createDefaultAlertRules(shop: string) {
  const defaultRules = [
    {
      shop,
      name: 'DEFCON 1 Critical Alert',
      description: 'Alerts when system reaches DEFCON 1 (critical)',
      condition: JSON.stringify({
        type: 'defcon_level',
        operator: '<=',
        value: 1,
      }),
      severity: 'critical',
      channels: JSON.stringify(['email', 'slack', 'sms', 'in_app']),
      cooldownMinutes: 30,
      maxAlertsPerDay: 50,
      active: true,
    },
    {
      shop,
      name: 'DEFCON 2 Warning',
      description: 'Alerts when system reaches DEFCON 2 (warning)',
      condition: JSON.stringify({
        type: 'defcon_level',
        operator: '<=',
        value: 2,
      }),
      severity: 'high',
      channels: JSON.stringify(['email', 'slack', 'in_app']),
      cooldownMinutes: 60,
      maxAlertsPerDay: 20,
      active: true,
    },
    {
      shop,
      name: 'Multiple Imminent Stockouts',
      description: 'Alerts when 3+ products have critical stockout countdowns',
      condition: JSON.stringify({
        type: 'stockout_countdown',
        operator: '>=',
        value: 3,
      }),
      severity: 'high',
      channels: JSON.stringify(['email', 'in_app']),
      cooldownMinutes: 60,
      maxAlertsPerDay: 10,
      active: true,
    },
    {
      shop,
      name: 'Velocity Spike Detected',
      description: 'Alerts when viral or accelerating products detected',
      condition: JSON.stringify({
        type: 'velocity_anomaly',
        operator: '>=',
        value: 2,
      }),
      severity: 'medium',
      channels: JSON.stringify(['email', 'in_app']),
      cooldownMinutes: 120,
      maxAlertsPerDay: 5,
      active: true,
    },
    {
      shop,
      name: 'Low Inventory Coverage',
      description: 'Alerts when average inventory coverage falls below 24 hours',
      condition: JSON.stringify({
        type: 'inventory_coverage',
        operator: '<=',
        value: 24,
      }),
      severity: 'medium',
      channels: JSON.stringify(['email', 'in_app']),
      cooldownMinutes: 240,
      maxAlertsPerDay: 3,
      active: true,
    },
  ];

  try {
    // Ensure db is initialized
    if (!db || !db.alertRule) {
      console.error('❌ Prisma client not initialized properly');
      return;
    }

    // Check if rules already exist
    const existingRules = await db.alertRule.findMany({
      where: { shop },
      take: 1
    });

    if (existingRules.length > 0) {
      console.log(`✅ Alert rules already exist for ${shop}`);
      return;
    }

    // Create rules
    await db.alertRule.createMany({
      data: defaultRules,
    });

    console.log(`✅ Created ${defaultRules.length} default alert rules for ${shop}`);
  } catch (error: any) {
    console.error('Error creating default alert rules:', error?.message || error);
    // Don't throw - just log and continue
    // This allows the app to function even if alert rules fail to create
  }
}

/**
 * Get all alert rules for a shop
 */
export async function getAlertRules(shop: string, activeOnly: boolean = false) {
  return db.alertRule.findMany({
    where: {
      shop,
      ...(activeOnly && { active: true }),
    },
    orderBy: [
      { severity: 'asc' },
      { name: 'asc' },
    ],
  });
}

/**
 * Update alert rule
 */
export async function updateAlertRule(
  ruleId: string,
  updates: Partial<Prisma.AlertRuleUpdateInput>,
) {
  return db.alertRule.update({
    where: { id: ruleId },
    data: updates,
  });
}

/**
 * Delete alert rule
 */
export async function deleteAlertRule(ruleId: string) {
  return db.alertRule.delete({
    where: { id: ruleId },
  });
}
