import { authenticate } from "../shopify.server";
import db from "../db.server";
import cache, { CACHE_KEYS } from "../services/cache.server";
import type { ActionFunctionArgs } from "@remix-run/node";

/**
 * Webhook handler for Shopify product events
 * Handles: products/create, products/update
 *
 * This handler keeps product data in sync with Shopify for analytics purposes.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log(`📥 Received webhook: ${topic} for shop: ${shop}`);

  if (!payload) {
    console.error("❌ No payload received");
    return new Response("No payload", { status: 400 });
  }

  try {
    await processProductWebhook(shop, topic, payload);
    console.log(`✅ Successfully processed ${topic} webhook for product ${payload.title}`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`❌ Error processing ${topic} product webhook:`, error);

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
 * Process product webhook payload and save to database
 * Uses upsert to handle both create and update events idempotently
 */
async function processProductWebhook(shop: string, topic: string, product: any) {
  // Calculate total inventory from variants
  const totalInventory = (product.variants || []).reduce(
    (sum: number, variant: any) => sum + (variant.inventory_quantity || 0),
    0
  );

  const productData = {
    id: product.admin_graphql_api_id,
    shop,
    title: product.title || "Untitled Product",
    productType: product.product_type,
    vendor: product.vendor,
    totalInventory,
    status: product.status || "active",
    createdAt: new Date(product.created_at),
  };

  // Use transaction to ensure data consistency
  await db.$transaction(async (tx) => {
    // Upsert product
    await tx.product.upsert({
      where: { id: productData.id },
      create: productData,
      update: {
        title: productData.title,
        productType: productData.productType,
        vendor: productData.vendor,
        totalInventory: productData.totalInventory,
        status: productData.status,
      },
    });

    // Update sync status
    await tx.syncStatus.upsert({
      where: { shop },
      create: {
        shop,
        lastProductSync: new Date(),
        totalProducts: 1,
      },
      update: {
        lastProductSync: new Date(),
        totalProducts: { increment: topic === "products/create" ? 1 : 0 },
      },
    });
  });

  console.log(
    `💾 Saved product "${product.title}" (${totalInventory} total inventory) for ${shop}`
  );

  // Invalidate analytics cache to ensure fresh data on next load
  try {
    await cache.delete(CACHE_KEYS.ANALYTICS_SNAPSHOT(shop));
    console.log(`🧹 Invalidated analytics cache for ${shop}`);
  } catch (error: any) {
    console.error(`⚠️ Failed to invalidate cache:`, error.message);
    // Don't throw - webhook should succeed even if cache invalidation fails
  }
}
