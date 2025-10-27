/**
 * Playbook Manager Service (Session 7)
 *
 * Manages contingency playbooks - pre-configured action plans for common scenarios.
 * Playbooks contain:
 * - Trigger conditions (when to activate)
 * - Ordered action sequences
 * - Priority/urgency settings
 * - Success criteria
 *
 * Performance target: <100ms for playbook retrieval
 */

import db from "../db.server";
import type { ScenarioType } from "./simulation-engine.server";

// ============================================================================
// Types
// ============================================================================

export interface PlaybookTrigger {
  type: "defcon_level" | "revenue_at_risk" | "stockout_countdown" | "velocity_spike" | "custom";
  operator: ">" | ">=" | "<" | "<=" | "==" | "!=";
  value: number | string;
  unit?: string; // 'dollars', 'hours', 'percent', etc.
}

export interface PlaybookAction {
  type: "transfer" | "reorder" | "price_adjustment" | "traffic_throttle" | "notification" | "simulation";
  priority: number; // 1-10
  params: Record<string, any>;
  autoExecute?: boolean; // Default: false (requires approval)
  successCriteria?: string;
}

export interface Playbook {
  id: string;
  shop: string | null;
  name: string;
  description: string;
  scenario: ScenarioType;
  tags: string[];
  triggers: PlaybookTrigger[];
  actions: PlaybookAction[];
  active: boolean;
  autoExecute: boolean;
  priority: number;
  timesUsed: number;
  lastUsedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Playbook CRUD
// ============================================================================

/**
 * Create a new playbook
 */
export async function createPlaybook(
  shop: string | null,
  name: string,
  description: string,
  scenario: ScenarioType,
  triggers: PlaybookTrigger[],
  actions: PlaybookAction[],
  options: {
    tags?: string[];
    active?: boolean;
    autoExecute?: boolean;
    priority?: number;
    createdBy?: string;
  } = {}
): Promise<Playbook> {
  const playbook = await db.playbook.create({
    data: {
      shop,
      name,
      description,
      scenario,
      tags: JSON.stringify(options.tags || []),
      triggers: JSON.stringify(triggers),
      actions: JSON.stringify(actions),
      active: options.active !== false,
      autoExecute: options.autoExecute || false,
      priority: options.priority || 5,
      createdBy: options.createdBy || "system",
    },
  });

  return parsePlaybook(playbook);
}

/**
 * Get playbook by ID
 */
export async function getPlaybook(playbookId: string): Promise<Playbook | null> {
  const playbook = await db.playbook.findUnique({
    where: { id: playbookId },
  });

  if (!playbook) return null;
  return parsePlaybook(playbook);
}

/**
 * List playbooks for a shop (includes global playbooks)
 */
export async function listPlaybooks(
  shop: string,
  filters: {
    scenario?: ScenarioType;
    active?: boolean;
    tags?: string[];
  } = {}
): Promise<Playbook[]> {
  const where: any = {
    OR: [{ shop }, { shop: null }], // Shop-specific or global
  };

  if (filters.scenario) {
    where.scenario = filters.scenario;
  }

  if (filters.active !== undefined) {
    where.active = filters.active;
  }

  const playbooks = await db.playbook.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  let results = playbooks.map(parsePlaybook);

  // Filter by tags if provided
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter((p) =>
      filters.tags!.some((tag) => p.tags.includes(tag))
    );
  }

  return results;
}

/**
 * Update playbook
 */
export async function updatePlaybook(
  playbookId: string,
  updates: {
    name?: string;
    description?: string;
    triggers?: PlaybookTrigger[];
    actions?: PlaybookAction[];
    tags?: string[];
    active?: boolean;
    autoExecute?: boolean;
    priority?: number;
  }
): Promise<Playbook> {
  const data: any = {};

  if (updates.name) data.name = updates.name;
  if (updates.description) data.description = updates.description;
  if (updates.triggers) data.triggers = JSON.stringify(updates.triggers);
  if (updates.actions) data.actions = JSON.stringify(updates.actions);
  if (updates.tags) data.tags = JSON.stringify(updates.tags);
  if (updates.active !== undefined) data.active = updates.active;
  if (updates.autoExecute !== undefined) data.autoExecute = updates.autoExecute;
  if (updates.priority !== undefined) data.priority = updates.priority;

  const playbook = await db.playbook.update({
    where: { id: playbookId },
    data,
  });

  return parsePlaybook(playbook);
}

/**
 * Delete playbook
 */
export async function deletePlaybook(playbookId: string): Promise<void> {
  await db.playbook.delete({
    where: { id: playbookId },
  });
}

/**
 * Activate/deactivate playbook
 */
export async function togglePlaybook(
  playbookId: string,
  active: boolean
): Promise<Playbook> {
  const playbook = await db.playbook.update({
    where: { id: playbookId },
    data: { active },
  });

  return parsePlaybook(playbook);
}

// ============================================================================
// Playbook Execution
// ============================================================================

/**
 * Check if playbook should be triggered based on current metrics
 */
export async function evaluatePlaybookTriggers(
  playbook: Playbook,
  metrics: {
    defconLevel?: number;
    revenueAtRisk?: number;
    stockoutCountdown?: number;
    velocitySpike?: number;
    [key: string]: any;
  }
): Promise<{ triggered: boolean; matchedTriggers: PlaybookTrigger[] }> {
  if (!playbook.active) {
    return { triggered: false, matchedTriggers: [] };
  }

  const matchedTriggers: PlaybookTrigger[] = [];

  for (const trigger of playbook.triggers) {
    let metricValue: any;

    // Map trigger type to metric value
    switch (trigger.type) {
      case "defcon_level":
        metricValue = metrics.defconLevel;
        break;
      case "revenue_at_risk":
        metricValue = metrics.revenueAtRisk;
        break;
      case "stockout_countdown":
        metricValue = metrics.stockoutCountdown;
        break;
      case "velocity_spike":
        metricValue = metrics.velocitySpike;
        break;
      default:
        metricValue = metrics[trigger.type];
    }

    if (metricValue === undefined) continue;

    // Evaluate condition
    const triggered = evaluateCondition(metricValue, trigger.operator, trigger.value);

    if (triggered) {
      matchedTriggers.push(trigger);
    }
  }

  // Playbook triggers if ANY trigger matches
  return {
    triggered: matchedTriggers.length > 0,
    matchedTriggers,
  };
}

/**
 * Execute a playbook (generate recommended actions)
 */
export async function executePlaybook(
  playbookId: string,
  context: Record<string, any> = {}
): Promise<{
  playbook: Playbook;
  actions: PlaybookAction[];
  executionPlan: string;
}> {
  const playbook = await getPlaybook(playbookId);

  if (!playbook) {
    throw new Error(`Playbook ${playbookId} not found`);
  }

  if (!playbook.active) {
    throw new Error(`Playbook ${playbook.name} is not active`);
  }

  console.log(`📘 Executing playbook: ${playbook.name} (${playbook.scenario})`);

  // Update usage tracking
  await db.playbook.update({
    where: { id: playbookId },
    data: {
      timesUsed: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });

  // Generate execution plan
  const executionPlan = generateExecutionPlan(playbook, context);

  return {
    playbook,
    actions: playbook.actions,
    executionPlan,
  };
}

/**
 * Find playbooks that match current conditions
 */
export async function findTriggeredPlaybooks(
  shop: string,
  metrics: {
    defconLevel?: number;
    revenueAtRisk?: number;
    stockoutCountdown?: number;
    velocitySpike?: number;
    [key: string]: any;
  }
): Promise<Playbook[]> {
  const allPlaybooks = await listPlaybooks(shop, { active: true });

  const triggeredPlaybooks: Playbook[] = [];

  for (const playbook of allPlaybooks) {
    const { triggered } = await evaluatePlaybookTriggers(playbook, metrics);
    if (triggered) {
      triggeredPlaybooks.push(playbook);
    }
  }

  // Sort by priority (highest first)
  return triggeredPlaybooks.sort((a, b) => b.priority - a.priority);
}

// ============================================================================
// Default Playbooks
// ============================================================================

/**
 * Create default/template playbooks for a shop
 */
export async function createDefaultPlaybooks(shop: string): Promise<Playbook[]> {
  console.log(`📘 Creating default playbooks for ${shop}`);

  const playbooks: Playbook[] = [];

  // 1. DEFCON 1 Emergency Response
  playbooks.push(
    await createPlaybook(
      shop,
      "DEFCON 1 Emergency Response",
      "Immediate actions when system reaches critical status (DEFCON 1)",
      "custom",
      [{ type: "defcon_level", operator: "<=", value: 1 }],
      [
        {
          type: "notification",
          priority: 10,
          params: {
            channels: ["email", "slack", "sms"],
            severity: "critical",
            message: "DEFCON 1 reached - immediate attention required",
          },
          autoExecute: true,
        },
        {
          type: "reorder",
          priority: 9,
          params: {
            mode: "emergency",
            all_critical_skus: true,
            expedited_shipping: true,
          },
        },
        {
          type: "traffic_throttle",
          priority: 8,
          params: {
            reduce_marketing_spend: 50,
            enable_waitlist: true,
          },
        },
      ],
      {
        tags: ["emergency", "defcon", "critical"],
        priority: 10,
        autoExecute: false,
      }
    )
  );

  // 2. Flash Sale Preparation
  playbooks.push(
    await createPlaybook(
      shop,
      "Flash Sale Preparation",
      "Pre-checks and setup before running a flash sale",
      "flash_sale",
      [{ type: "custom", operator: "==", value: "flash_sale_scheduled" }],
      [
        {
          type: "simulation",
          priority: 10,
          params: {
            scenario: "flash_sale",
            duration_hours: 4,
            discount_percent: 30,
          },
          autoExecute: true,
        },
        {
          type: "reorder",
          priority: 9,
          params: {
            increase_buffer_stock: 50,
            high_demand_products: true,
          },
        },
        {
          type: "notification",
          priority: 5,
          params: {
            channels: ["email"],
            message: "Flash sale preparation complete - review simulation results",
          },
          autoExecute: true,
        },
      ],
      {
        tags: ["flash_sale", "preparation", "bfcm"],
        priority: 8,
        autoExecute: false,
      }
    )
  );

  // 3. Stockout Prevention
  playbooks.push(
    await createPlaybook(
      shop,
      "Stockout Prevention Protocol",
      "Actions to take when stockout is imminent (< 4 hours)",
      "custom",
      [{ type: "stockout_countdown", operator: "<", value: 4, unit: "hours" }],
      [
        {
          type: "transfer",
          priority: 10,
          params: {
            mode: "emergency",
            source: "all_locations",
            consolidate_to_primary: true,
          },
        },
        {
          type: "notification",
          priority: 9,
          params: {
            channels: ["slack", "email"],
            severity: "high",
            message: "Critical SKU stockout imminent - transfers initiated",
          },
          autoExecute: true,
        },
        {
          type: "price_adjustment",
          priority: 7,
          params: {
            increase_percent: 5,
            reason: "Reduce demand velocity temporarily",
          },
        },
      ],
      {
        tags: ["stockout", "emergency", "inventory"],
        priority: 9,
        autoExecute: false,
      }
    )
  );

  // 4. Supplier Delay Response
  playbooks.push(
    await createPlaybook(
      shop,
      "Supplier Delay Response",
      "Actions to take when supplier shipment is delayed",
      "supplier_delay",
      [{ type: "custom", operator: "==", value: "supplier_delay_detected" }],
      [
        {
          type: "simulation",
          priority: 10,
          params: {
            scenario: "supplier_delay",
            delay_days: 7,
            alternative_sources: true,
          },
          autoExecute: true,
        },
        {
          type: "reorder",
          priority: 9,
          params: {
            source: "alternative_supplier",
            affected_skus: "from_simulation",
          },
        },
        {
          type: "notification",
          priority: 8,
          params: {
            channels: ["email", "slack"],
            severity: "high",
            message: "Supplier delay detected - alternative sourcing activated",
          },
          autoExecute: true,
        },
      ],
      {
        tags: ["supplier", "delay", "contingency"],
        priority: 7,
        autoExecute: false,
      }
    )
  );

  // 5. Competitor Stockout Opportunity
  playbooks.push(
    await createPlaybook(
      shop,
      "Competitor Stockout Capture",
      "Capitalize on competitor stockouts by increasing marketing",
      "competitor_stockout",
      [{ type: "custom", operator: "==", value: "competitor_stockout_detected" }],
      [
        {
          type: "simulation",
          priority: 10,
          params: {
            scenario: "competitor_stockout",
            duration_hours: 48,
          },
          autoExecute: true,
        },
        {
          type: "notification",
          priority: 9,
          params: {
            channels: ["email", "slack"],
            severity: "medium",
            message: "Competitor stockout opportunity - review recommendations",
          },
          autoExecute: true,
        },
        {
          type: "reorder",
          priority: 8,
          params: {
            increase_buffer_stock: 30,
            reason: "Prepare for competitor overflow",
          },
        },
      ],
      {
        tags: ["opportunity", "competitor", "marketing"],
        priority: 6,
        autoExecute: false,
      }
    )
  );

  console.log(`✅ Created ${playbooks.length} default playbooks`);
  return playbooks;
}

// ============================================================================
// Helper Functions
// ============================================================================

function parsePlaybook(rawPlaybook: any): Playbook {
  return {
    ...rawPlaybook,
    tags: JSON.parse(rawPlaybook.tags || "[]"),
    triggers: JSON.parse(rawPlaybook.triggers),
    actions: JSON.parse(rawPlaybook.actions),
  };
}

function evaluateCondition(
  leftValue: any,
  operator: PlaybookTrigger["operator"],
  rightValue: any
): boolean {
  switch (operator) {
    case ">":
      return leftValue > rightValue;
    case ">=":
      return leftValue >= rightValue;
    case "<":
      return leftValue < rightValue;
    case "<=":
      return leftValue <= rightValue;
    case "==":
      return leftValue == rightValue;
    case "!=":
      return leftValue != rightValue;
    default:
      return false;
  }
}

function generateExecutionPlan(
  playbook: Playbook,
  context: Record<string, any>
): string {
  const lines: string[] = [];

  lines.push(`Playbook: ${playbook.name}`);
  lines.push(`Scenario: ${playbook.scenario}`);
  lines.push(`Priority: ${playbook.priority}/10`);
  lines.push("");
  lines.push("Execution Plan:");

  playbook.actions
    .sort((a, b) => b.priority - a.priority)
    .forEach((action, index) => {
      lines.push(
        `${index + 1}. [Priority ${action.priority}] ${action.type.replace(/_/g, " ").toUpperCase()}`
      );
      if (action.autoExecute) {
        lines.push(`   ⚡ Auto-execute: YES`);
      }
      lines.push(`   Parameters: ${JSON.stringify(action.params)}`);
    });

  if (context && Object.keys(context).length > 0) {
    lines.push("");
    lines.push("Context:");
    Object.entries(context).forEach(([key, value]) => {
      lines.push(`  - ${key}: ${value}`);
    });
  }

  return lines.join("\n");
}

/**
 * Get playbook usage statistics
 */
export async function getPlaybookStats(shop: string): Promise<{
  total: number;
  active: number;
  inactive: number;
  byScenario: Record<string, number>;
  mostUsed: Playbook[];
}> {
  const playbooks = await listPlaybooks(shop);

  const active = playbooks.filter((p) => p.active).length;
  const inactive = playbooks.filter((p) => !p.active).length;

  const byScenario: Record<string, number> = {};
  playbooks.forEach((p) => {
    byScenario[p.scenario] = (byScenario[p.scenario] || 0) + 1;
  });

  const mostUsed = playbooks
    .filter((p) => p.timesUsed > 0)
    .sort((a, b) => b.timesUsed - a.timesUsed)
    .slice(0, 5);

  return {
    total: playbooks.length,
    active,
    inactive,
    byScenario,
    mostUsed,
  };
}
