import { authenticate } from "../shopify.server";
import db from "../db.server";
import cache from "../services/cache.server";
import type { ActionFunctionArgs } from "@remix-run/node";

/**
 * GDPR Compliance: Shop Redaction Webhook
 *
 * Triggered 48 hours after a merchant uninstalls your app.
 * You must delete ALL data associated with this shop.
 *
 * Response time: You have 30 days to complete the deletion.
 *
 * CRITICAL: This deletes ALL shop data. Ensure you:
 * 1. Have backups (for compliance/audit purposes only)
 * 2. Delete from all tables
 * 3. Clear all caches
 * 4. Delete any external storage (S3, etc.)
 * 5. Notify any connected services
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);

    console.log(`📥 GDPR: Shop redaction request for shop: ${shop}`);

    if (!payload) {
      console.error("❌ No payload received");
      return new Response("No payload", { status: 400 });
    }

    const shopDomain = payload.shop_domain || shop;

    console.log(`🗑️  Starting complete data deletion for shop: ${shopDomain}`);

    // Log deletion request BEFORE deleting (for audit trail)
    await logShopDeletion(shopDomain);

    // Delete all shop data
    await deleteShopData(shopDomain);

    console.log(`✅ All data deleted for shop: ${shopDomain}`);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`❌ Error processing shop redaction:`, error);

    // Log error but still return 200 (Shopify will retry if we return 500)
    try {
      await db.alertLog.create({
        data: {
          shop: "SYSTEM",
          severity: "critical",
          alertType: "gdpr_shop_redaction_failed",
          title: "Shop Redaction Failed",
          message: `Failed to delete data for shop: ${error}`,
          metadata: JSON.stringify({ error: String(error) }),
        },
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response("Error", { status: 500 });
  }
};

/**
 * Delete ALL data associated with a shop
 * Order matters: Delete child records before parent records
 */
async function deleteShopData(shop: string) {
  console.log(`🗑️  Phase 1: Deleting transactional data for ${shop}...`);

  // Use transaction to ensure all-or-nothing deletion
  await db.$transaction(async (tx) => {
    // 1. Delete child records first (foreign key constraints)

    // Order line items (child of Order)
    const lineItemsDeleted = await tx.orderLineItem.deleteMany({
      where: { order: { shop } },
    });
    console.log(`   ✓ Deleted ${lineItemsDeleted.count} order line items`);

    // 2. Delete BFCM War Room data
    const inventorySnapshotsDeleted = await tx.inventorySnapshot.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${inventorySnapshotsDeleted.count} inventory snapshots`);

    const warRoomMetricsDeleted = await tx.warRoomMetrics.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${warRoomMetricsDeleted.count} war room metrics`);

    const alertsDeleted = await tx.alertLog.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${alertsDeleted.count} alert logs`);

    // 3. Delete action center data
    const executedActionsDeleted = await tx.executedAction.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${executedActionsDeleted.count} executed actions`);

    const recommendedActionsDeleted = await tx.recommendedAction.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${recommendedActionsDeleted.count} recommended actions`);

    const actionTemplatesDeleted = await tx.actionTemplate.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${actionTemplatesDeleted.count} action templates`);

    // 4. Delete alert system data
    const alertHistoryDeleted = await tx.alertHistory.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${alertHistoryDeleted.count} alert history records`);

    const alertRulesDeleted = await tx.alertRule.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${alertRulesDeleted.count} alert rules`);

    const notificationPrefsDeleted = await tx.notificationPreference.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${notificationPrefsDeleted.count} notification preferences`);

    // 5. Delete simulation data
    const simulationResultsDeleted = await tx.simulationResult.deleteMany({
      where: { simulation: { shop } },
    });
    console.log(`   ✓ Deleted ${simulationResultsDeleted.count} simulation results`);

    const simulationsDeleted = await tx.simulation.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${simulationsDeleted.count} simulations`);

    const playbooksDeleted = await tx.playbook.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${playbooksDeleted.count} playbooks`);

    // 6. Delete analytics data
    const ordersDeleted = await tx.order.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${ordersDeleted.count} orders`);

    const productsDeleted = await tx.product.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${productsDeleted.count} products`);

    const analyticsSnapshotsDeleted = await tx.analyticsSnapshot.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${analyticsSnapshotsDeleted.count} analytics snapshots`);

    // 7. Delete sync status
    const syncStatusDeleted = await tx.syncStatus.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${syncStatusDeleted.count} sync status records`);

    // 8. Delete QR codes (example app data)
    const qrCodesDeleted = await tx.qRCode.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${qrCodesDeleted.count} QR codes`);

    // 9. Delete sessions (last - needed for auth)
    const sessionsDeleted = await tx.session.deleteMany({
      where: { shop },
    });
    console.log(`   ✓ Deleted ${sessionsDeleted.count} sessions`);
  });

  console.log(`🗑️  Phase 2: Clearing cache for ${shop}...`);

  // Clear all cached data for this shop
  try {
    await cache.clearShopCache(shop);
    console.log(`   ✓ Cache cleared for ${shop}`);
  } catch (error) {
    console.error(`   ⚠️  Failed to clear cache:`, error);
    // Continue even if cache clearing fails
  }

  /**
   * TODO: If you have external storage, delete it here
   * Examples:
   * - S3 buckets with shop-specific files
   * - External analytics services
   * - Third-party integrations
   * - Logs in external systems
   */

  console.log(`✅ Complete data deletion finished for ${shop}`);
}

/**
 * Log shop deletion for compliance audit trail
 * IMPORTANT: Log to a system table (not shop-specific) since shop data will be deleted
 */
async function logShopDeletion(shop: string) {
  // Log to AlertLog with shop="SYSTEM" so it survives the deletion
  await db.alertLog.create({
    data: {
      shop: "SYSTEM",
      severity: "info",
      alertType: "gdpr_shop_redaction",
      title: "Shop Data Deletion",
      message: `Complete data deletion completed for shop: ${shop}`,
      metadata: JSON.stringify({
        shop,
        deletedAt: new Date(),
        reason: "GDPR shop redaction webhook (48 hours after uninstall)",
      }),
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
  });

  console.log(`📝 Logged shop deletion for compliance audit`);
}
