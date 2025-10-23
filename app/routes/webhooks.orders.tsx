import { authenticate } from "../shopify.server";
import db from "../db.server";
import { generateDailyAnalytics } from "../services/analytics-aggregator.server";
import cache, { CACHE_KEYS } from "../services/cache.server";
import type { ActionFunctionArgs } from "@remix-run/node";

/**
 * Webhook handler for Shopify order events
 * Handles: orders/create, orders/updated, orders/cancelled
 *
 * This handler saves order data to the local database for fast analytics queries.
 * It runs on every order change in the Shopify store.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  console.log(`📥 Received webhook: ${topic} for shop: ${shop}`);

  if (!payload) {
    console.error("❌ No payload received");
    return new Response("No payload", { status: 400 });
  }

  try {
    await processOrderWebhook(shop, topic, payload);
    console.log(`✅ Successfully processed ${topic} webhook for order ${payload.name}`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`❌ Error processing ${topic} webhook:`, error);

    // Update sync status with error
    await db.syncStatus.upsert({
      where: { shop },
      create: {
        shop,
        lastError: error instanceof Error ? error.message : String(error),
        lastErrorAt: new Date(),
      },
      update: {
        lastError: error instanceof Error ? error.message : String(error),
        lastErrorAt: new Date(),
      },
    }).catch(console.error); // Don't fail the webhook if this fails

    return new Response("Error", { status: 500 });
  }
};

/**
 * Process order webhook payload and save to database
 * Uses upsert to handle both create and update events idempotently
 */
async function processOrderWebhook(shop: string, topic: string, order: any) {
  // Map Shopify REST API webhook payload to our database schema
  const orderData = {
    id: order.admin_graphql_api_id,
    shopifyOrderId: order.id.toString(),
    name: order.name,
    shop,
    email: null, // Protected field - requires app approval
    totalPrice: parseFloat(order.total_price || "0"),
    currency: order.currency || "USD",
    financialStatus: order.financial_status?.toUpperCase(),
    fulfillmentStatus: order.fulfillment_status?.toUpperCase(),
    processedAt: order.processed_at ? new Date(order.processed_at) : null,
    createdAt: new Date(order.created_at),
    customerId: order.customer?.id?.toString(),
    customerEmail: null, // Protected field - requires app approval
    shippingCity: order.shipping_address?.city,
    shippingProvince: order.shipping_address?.province,
    shippingCountry: order.shipping_address?.country,
  };

  // Map line items
  const lineItems = (order.line_items || []).map((item: any) => ({
    productId: item.product_id?.toString() || "unknown",
    productTitle: item.title || "Unknown Product",
    variantId: item.variant_id?.toString() || "unknown",
    variantTitle: item.variant_title,
    quantity: item.quantity || 0,
    price: parseFloat(item.price || "0"),
  }));

  // Use transaction to ensure data consistency
  await db.$transaction(async (tx) => {
    // Upsert order
    await tx.order.upsert({
      where: { id: orderData.id },
      create: {
        ...orderData,
        lineItems: { create: lineItems },
      },
      update: {
        ...orderData,
        lineItems: {
          // Delete existing line items and recreate them
          // This ensures we always have the latest data
          deleteMany: {},
          create: lineItems,
        },
      },
    });

    // Update sync status
    await tx.syncStatus.upsert({
      where: { shop },
      create: {
        shop,
        lastOrderSync: new Date(),
        totalOrders: 1,
      },
      update: {
        lastOrderSync: new Date(),
        totalOrders: { increment: topic === "orders/create" ? 1 : 0 },
      },
    });
  });

  console.log(`💾 Saved order ${order.name} (${lineItems.length} items) for ${shop}`);

  // Invalidate analytics cache to ensure fresh data on next load
  try {
    await cache.delete(CACHE_KEYS.ANALYTICS_SNAPSHOT(shop));
    console.log(`🧹 Invalidated analytics cache for ${shop}`);
  } catch (error: any) {
    console.error(`⚠️ Failed to invalidate cache:`, error.message);
    // Don't throw - webhook should succeed even if cache invalidation fails
  }

  // Optional: Auto-compute analytics for today (can be disabled for performance)
  // Uncomment the following lines to enable automatic analytics computation on every order webhook
  /*
  try {
    const today = new Date();
    await generateDailyAnalytics(shop, today);
    console.log(`📊 Auto-computed analytics for ${today.toDateString()}`);
  } catch (error: any) {
    console.error(`⚠️  Failed to auto-compute analytics:`, error.message);
    // Don't throw - webhook should succeed even if analytics computation fails
  }
  */
}
