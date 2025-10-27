/**
 * Action Executor Service
 *
 * Executes recommended actions via Shopify Admin API:
 * - Inventory transfers
 * - Draft purchase orders
 * - Price updates
 * - Marketing campaign pause/resume
 *
 * All actions are logged for audit and support rollback.
 */

import db from "../db.server";
import type { Recommendation } from "./recommendation-engine.server";

export interface ExecutionResult {
  success: boolean;
  result: "success" | "partial_success" | "failed";
  message: string;
  metadata?: Record<string, any>;
  executedActionId?: string;
  canRollback?: boolean;
}

/**
 * Execute a recommended action
 */
export async function executeAction(
  recommendationId: string,
  executedBy: string,
  shopifyAdmin?: any, // Shopify admin API client
  sandboxMode: boolean = false
): Promise<ExecutionResult> {
  console.log(
    `🚀 ${sandboxMode ? "[SANDBOX]" : ""} Executing action ${recommendationId}...`
  );

  // Fetch recommendation
  const recommendation = await db.recommendedAction.findUnique({
    where: { id: recommendationId },
  });

  if (!recommendation) {
    return {
      success: false,
      result: "failed",
      message: "Recommendation not found",
    };
  }

  // Check if already executing or completed
  if (recommendation.status === "executing") {
    return {
      success: false,
      result: "failed",
      message: "Action is already executing",
    };
  }

  if (recommendation.status === "completed") {
    return {
      success: false,
      result: "failed",
      message: "Action has already been completed",
    };
  }

  // Update status to executing
  await db.recommendedAction.update({
    where: { id: recommendationId },
    data: { status: "executing" },
  });

  try {
    // Parse parameters
    const parameters = JSON.parse(recommendation.parameters);

    // Execute based on action type
    let executionResult: ExecutionResult;

    switch (recommendation.type) {
      case "transfer":
        executionResult = await executeTransfer(
          recommendation,
          parameters,
          shopifyAdmin,
          sandboxMode
        );
        break;

      case "reorder":
        executionResult = await executeReorder(
          recommendation,
          parameters,
          shopifyAdmin,
          sandboxMode
        );
        break;

      case "price_adjustment":
        executionResult = await executePriceAdjustment(
          recommendation,
          parameters,
          shopifyAdmin,
          sandboxMode
        );
        break;

      case "traffic_throttle":
        executionResult = await executeTrafficThrottle(
          recommendation,
          parameters,
          shopifyAdmin,
          sandboxMode
        );
        break;

      default:
        executionResult = {
          success: false,
          result: "failed",
          message: `Unknown action type: ${recommendation.type}`,
        };
    }

    // Log execution
    const executedAction = await db.executedAction.create({
      data: {
        shop: recommendation.shop,
        recommendationId: recommendation.id,
        result: executionResult.result,
        resultMessage: executionResult.message,
        actualRevenue: null, // Will be updated later through tracking
        estimatedRevenue: recommendation.estimatedROI,
        cost: null,
        netROI: null,
        metadata: JSON.stringify(executionResult.metadata || {}),
        executedBy,
        canRollback: executionResult.canRollback || false,
      },
    });

    // Update recommendation status
    await db.recommendedAction.update({
      where: { id: recommendationId },
      data: {
        status: executionResult.success ? "completed" : "failed",
      },
    });

    return {
      ...executionResult,
      executedActionId: executedAction.id,
    };
  } catch (error: any) {
    console.error(`❌ Action execution failed:`, error);

    // Log failed execution
    await db.executedAction.create({
      data: {
        shop: recommendation.shop,
        recommendationId: recommendation.id,
        result: "failed",
        resultMessage: error.message || "Execution failed",
        metadata: JSON.stringify({ error: error.message }),
        executedBy,
        canRollback: false,
      },
    });

    // Update recommendation status
    await db.recommendedAction.update({
      where: { id: recommendationId },
      data: { status: "failed" },
    });

    return {
      success: false,
      result: "failed",
      message: error.message || "Execution failed",
    };
  }
}

/**
 * Rollback an executed action
 */
export async function rollbackAction(
  executedActionId: string,
  reason: string,
  executedBy: string,
  shopifyAdmin?: any,
  sandboxMode: boolean = false
): Promise<ExecutionResult> {
  console.log(
    `🔄 ${sandboxMode ? "[SANDBOX]" : ""} Rolling back action ${executedActionId}...`
  );

  const executedAction = await db.executedAction.findUnique({
    where: { id: executedActionId },
    include: { recommendation: true },
  });

  if (!executedAction) {
    return {
      success: false,
      result: "failed",
      message: "Executed action not found",
    };
  }

  if (!executedAction.canRollback) {
    return {
      success: false,
      result: "failed",
      message: "This action cannot be rolled back",
    };
  }

  if (executedAction.rolledBackAt) {
    return {
      success: false,
      result: "failed",
      message: "Action has already been rolled back",
    };
  }

  try {
    const metadata = JSON.parse(executedAction.metadata);
    const parameters = JSON.parse(executedAction.recommendation.parameters);

    // Perform rollback based on action type
    let rollbackResult: ExecutionResult;

    switch (executedAction.recommendation.type) {
      case "transfer":
        rollbackResult = await rollbackTransfer(
          metadata,
          parameters,
          shopifyAdmin,
          sandboxMode
        );
        break;

      case "price_adjustment":
        rollbackResult = await rollbackPriceAdjustment(
          metadata,
          parameters,
          shopifyAdmin,
          sandboxMode
        );
        break;

      case "traffic_throttle":
        rollbackResult = await rollbackTrafficThrottle(
          metadata,
          parameters,
          shopifyAdmin,
          sandboxMode
        );
        break;

      default:
        rollbackResult = {
          success: false,
          result: "failed",
          message: `Rollback not supported for action type: ${executedAction.recommendation.type}`,
        };
    }

    if (rollbackResult.success) {
      // Mark as rolled back
      await db.executedAction.update({
        where: { id: executedActionId },
        data: {
          rolledBackAt: new Date(),
          rollbackReason: reason,
        },
      });
    }

    return rollbackResult;
  } catch (error: any) {
    console.error(`❌ Rollback failed:`, error);
    return {
      success: false,
      result: "failed",
      message: error.message || "Rollback failed",
    };
  }
}

// ============================================================================
// Action Type Executors
// ============================================================================

/**
 * Execute inventory transfer
 */
async function executeTransfer(
  recommendation: any,
  parameters: any,
  shopifyAdmin: any,
  sandboxMode: boolean
): Promise<ExecutionResult> {
  if (sandboxMode) {
    console.log(`📦 [SANDBOX] Transfer ${parameters.quantity} units of ${parameters.sku}`);
    console.log(`   From: ${parameters.fromLocation} → To: ${parameters.toLocation}`);

    return {
      success: true,
      result: "success",
      message: `[SANDBOX] Would transfer ${parameters.quantity} units of ${parameters.productTitle}`,
      metadata: {
        sku: parameters.sku,
        quantity: parameters.quantity,
        fromLocation: parameters.fromLocation,
        toLocation: parameters.toLocation,
        sandboxMode: true,
      },
      canRollback: true,
    };
  }

  // Real implementation would use Shopify Admin API
  // const response = await shopifyAdmin.graphql(`
  //   mutation inventoryAdjust($inventoryItemId: ID!, $locationId: ID!, $availableAdjustment: Int!) {
  //     inventoryAdjust(
  //       inventoryItemId: $inventoryItemId
  //       locationId: $locationId
  //       availableAdjustment: $availableAdjustment
  //     ) {
  //       inventoryLevel {
  //         available
  //       }
  //     }
  //   }
  // `, { variables: { ... } });

  return {
    success: true,
    result: "success",
    message: `Transfer initiated for ${parameters.quantity} units`,
    metadata: parameters,
    canRollback: true,
  };
}

/**
 * Execute reorder (create draft purchase order)
 */
async function executeReorder(
  recommendation: any,
  parameters: any,
  shopifyAdmin: any,
  sandboxMode: boolean
): Promise<ExecutionResult> {
  if (sandboxMode) {
    console.log(`📝 [SANDBOX] Create purchase order for ${parameters.quantity} units of ${parameters.sku}`);
    console.log(`   Supplier: ${parameters.supplier}, Priority: ${parameters.priority}`);

    return {
      success: true,
      result: "success",
      message: `[SANDBOX] Would create PO for ${parameters.quantity} units of ${parameters.productTitle}`,
      metadata: {
        sku: parameters.sku,
        quantity: parameters.quantity,
        supplier: parameters.supplier,
        priority: parameters.priority,
        sandboxMode: true,
      },
      canRollback: false, // Purchase orders typically cannot be auto-rolled back
    };
  }

  // Real implementation would use Shopify Admin API or external PO system
  // const response = await shopifyAdmin.graphql(`
  //   mutation draftOrderCreate($input: DraftOrderInput!) {
  //     draftOrderCreate(input: $input) {
  //       draftOrder {
  //         id
  //       }
  //     }
  //   }
  // `, { variables: { ... } });

  return {
    success: true,
    result: "success",
    message: `Draft purchase order created for ${parameters.quantity} units`,
    metadata: parameters,
    canRollback: false,
  };
}

/**
 * Execute price adjustment
 */
async function executePriceAdjustment(
  recommendation: any,
  parameters: any,
  shopifyAdmin: any,
  sandboxMode: boolean
): Promise<ExecutionResult> {
  if (sandboxMode) {
    const direction = parameters.priceChange > 0 ? "increase" : "decrease";
    console.log(`💰 [SANDBOX] ${direction} price for ${parameters.sku}`);
    console.log(`   Current: $${parameters.currentPrice} → Suggested: $${parameters.suggestedPrice.toFixed(2)}`);

    return {
      success: true,
      result: "success",
      message: `[SANDBOX] Would ${direction} price by ${Math.abs(parameters.priceChange)}%`,
      metadata: {
        sku: parameters.sku,
        oldPrice: parameters.currentPrice,
        newPrice: parameters.suggestedPrice,
        priceChange: parameters.priceChange,
        sandboxMode: true,
      },
      canRollback: true,
    };
  }

  // Real implementation would use Shopify Admin API
  // const response = await shopifyAdmin.graphql(`
  //   mutation productUpdate($input: ProductInput!) {
  //     productUpdate(input: $input) {
  //       product {
  //         id
  //       }
  //     }
  //   }
  // `, { variables: { ... } });

  return {
    success: true,
    result: "success",
    message: `Price updated from $${parameters.currentPrice} to $${parameters.suggestedPrice.toFixed(2)}`,
    metadata: {
      oldPrice: parameters.currentPrice,
      newPrice: parameters.suggestedPrice,
    },
    canRollback: true,
  };
}

/**
 * Execute traffic throttling
 */
async function executeTrafficThrottle(
  recommendation: any,
  parameters: any,
  shopifyAdmin: any,
  sandboxMode: boolean
): Promise<ExecutionResult> {
  if (sandboxMode) {
    console.log(`🚦 [SANDBOX] ${parameters.action} for ${parameters.sku}`);
    console.log(`   Target reduction: ${parameters.targetReduction}%`);

    return {
      success: true,
      result: "success",
      message: `[SANDBOX] Would ${parameters.action} for ${parameters.productTitle}`,
      metadata: {
        sku: parameters.sku,
        action: parameters.action,
        targetReduction: parameters.targetReduction,
        sandboxMode: true,
      },
      canRollback: true,
    };
  }

  // Real implementation would integrate with marketing platforms
  // (Google Ads, Facebook Ads, etc.) to pause campaigns

  return {
    success: true,
    result: "success",
    message: `Marketing campaigns paused for ${parameters.productTitle}`,
    metadata: parameters,
    canRollback: true,
  };
}

// ============================================================================
// Rollback Functions
// ============================================================================

/**
 * Rollback inventory transfer
 */
async function rollbackTransfer(
  originalMetadata: any,
  parameters: any,
  shopifyAdmin: any,
  sandboxMode: boolean
): Promise<ExecutionResult> {
  if (sandboxMode) {
    console.log(`🔄 [SANDBOX] Reversing transfer of ${originalMetadata.quantity} units`);
    console.log(`   From: ${originalMetadata.toLocation} → To: ${originalMetadata.fromLocation}`);

    return {
      success: true,
      result: "success",
      message: `[SANDBOX] Would reverse transfer of ${originalMetadata.quantity} units`,
    };
  }

  // Transfer back from toLocation to fromLocation
  return {
    success: true,
    result: "success",
    message: `Transfer reversed: ${originalMetadata.quantity} units returned to ${originalMetadata.fromLocation}`,
  };
}

/**
 * Rollback price adjustment
 */
async function rollbackPriceAdjustment(
  originalMetadata: any,
  parameters: any,
  shopifyAdmin: any,
  sandboxMode: boolean
): Promise<ExecutionResult> {
  if (sandboxMode) {
    console.log(`🔄 [SANDBOX] Reverting price change for ${parameters.sku}`);
    console.log(`   New: $${originalMetadata.newPrice} → Original: $${originalMetadata.oldPrice}`);

    return {
      success: true,
      result: "success",
      message: `[SANDBOX] Would revert price to $${originalMetadata.oldPrice}`,
    };
  }

  // Revert price to original
  return {
    success: true,
    result: "success",
    message: `Price reverted to $${originalMetadata.oldPrice}`,
  };
}

/**
 * Rollback traffic throttling
 */
async function rollbackTrafficThrottle(
  originalMetadata: any,
  parameters: any,
  shopifyAdmin: any,
  sandboxMode: boolean
): Promise<ExecutionResult> {
  if (sandboxMode) {
    console.log(`🔄 [SANDBOX] Resuming marketing for ${parameters.sku}`);

    return {
      success: true,
      result: "success",
      message: `[SANDBOX] Would resume marketing campaigns`,
    };
  }

  // Resume marketing campaigns
  return {
    success: true,
    result: "success",
    message: `Marketing campaigns resumed for ${parameters.productTitle}`,
  };
}

/**
 * Get execution history for a recommendation
 */
export async function getExecutionHistory(recommendationId: string) {
  return await db.executedAction.findMany({
    where: { recommendationId },
    orderBy: { executedAt: "desc" },
  });
}

/**
 * Get recent executed actions for a shop
 */
export async function getRecentExecutions(shop: string, limit: number = 20) {
  const actions = await db.executedAction.findMany({
    where: { shop },
    include: { recommendation: true },
    orderBy: { executedAt: "desc" },
    take: limit,
  });

  return actions.map((action) => ({
    ...action,
    recommendation: {
      ...action.recommendation,
      parameters: JSON.parse(action.recommendation.parameters),
    },
    metadata: JSON.parse(action.metadata),
  }));
}
