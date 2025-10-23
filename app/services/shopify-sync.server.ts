import db from "../db.server";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

const BATCH_SIZE = 250;
const DELAY_MS = 500; // Rate limiting delay

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface SyncOptions {
  since?: Date;
  limit?: number;
}

interface SyncResult {
  success: boolean;
  synced: number;
  error?: string;
}

export async function syncOrdersFromShopify(
  admin: AdminApiContext['graphql'],
  shop: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  // Initialize sync status
  await db.syncStatus.upsert({
    where: { shop },
    create: { shop, syncInProgress: true },
    update: { syncInProgress: true, lastError: null, lastErrorAt: null },
  });

  let totalSynced = 0;
  let hasNextPage = true;
  let cursor: string | null = null;
  const maxPages = options.limit ? Math.ceil(options.limit / BATCH_SIZE) : 100;

  try {
    console.log(`🚀 Starting order sync for shop: ${shop}`);
    console.log(`📊 Settings: batch=${BATCH_SIZE}, delay=${DELAY_MS}ms, maxPages=${maxPages}`);

    for (let page = 0; page < maxPages && hasNextPage; page++) {
      // Build query for filtering orders by date
      const query = options.since
        ? `processed_at:>='${options.since.toISOString()}'`
        : undefined;

      const variables: any = { first: BATCH_SIZE };
      if (query) variables.query = query;
      if (cursor) variables.after = cursor;

      console.log(`📦 Fetching page ${page + 1}/${maxPages}...`);

      // Fetch orders from Shopify
      const response = await admin(ORDERS_QUERY, { variables });
      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL Error: ${data.errors[0].message}`);
      }

      const edges = data.data?.orders?.edges || [];

      if (edges.length === 0) {
        console.log(`ℹ️  No orders found on page ${page + 1}`);
        break;
      }

      // Process each order
      for (const { node: order } of edges) {
        try {
          await saveOrderToDatabase(shop, order);
          totalSynced++;
        } catch (error: any) {
          console.error(`❌ Error saving order ${order.id}:`, error.message);
          // Continue with other orders instead of failing entire sync
        }
      }

      hasNextPage = data.data.orders.pageInfo.hasNextPage;
      cursor = data.data.orders.pageInfo.endCursor;

      console.log(`✅ Page ${page + 1} complete: ${totalSynced} total orders synced`);

      // Rate limiting: wait before next page
      if (hasNextPage && page + 1 < maxPages) {
        console.log(`⏳ Rate limiting: waiting ${DELAY_MS}ms...`);
        await delay(DELAY_MS);
      }
    }

    // Get actual count from database
    const actualOrderCount = await db.order.count({
      where: { shop },
    });

    // Update sync status with success
    await db.syncStatus.update({
      where: { shop },
      data: {
        lastOrderSync: new Date(),
        syncInProgress: false,
        totalOrders: actualOrderCount,
        lastError: null,
        lastErrorAt: null,
      },
    });

    console.log(`🎉 Sync complete: ${totalSynced} orders synced successfully`);
    return { success: true, synced: totalSynced };

  } catch (error: any) {
    console.error(`❌ Sync failed:`, error.message);

    // Update sync status with error
    await db.syncStatus.update({
      where: { shop },
      data: {
        syncInProgress: false,
        lastError: error.message,
        lastErrorAt: new Date(),
      },
    });

    return { success: false, synced: totalSynced, error: error.message };
  }
}

async function saveOrderToDatabase(shop: string, order: any) {
  const orderData = {
    id: order.id,
    shopifyOrderId: order.name.replace("#", ""),
    name: order.name,
    shop,
    email: null, // Protected field - requires app approval
    totalPrice: parseFloat(order.totalPriceSet.shopMoney.amount),
    currency: order.totalPriceSet.shopMoney.currencyCode,
    financialStatus: order.displayFinancialStatus,
    fulfillmentStatus: order.displayFulfillmentStatus,
    processedAt: order.processedAt ? new Date(order.processedAt) : null,
    createdAt: new Date(order.createdAt),
    customerId: order.customer?.id || null,
    customerEmail: null, // Protected field - requires app approval
    shippingCity: order.shippingAddress?.city,
    shippingProvince: order.shippingAddress?.province,
    shippingCountry: order.shippingAddress?.country,
  };

  const lineItems = order.lineItems.edges.map(({ node: item }: any) => ({
    productId: item.product?.id || "unknown",
    productTitle: item.title,
    variantId: item.variant?.id || "unknown",
    variantTitle: item.variant?.title,
    quantity: item.quantity,
    price: parseFloat(item.variant?.price || "0"),
  }));

  // Use upsert to handle duplicates (idempotent)
  await db.order.upsert({
    where: { id: orderData.id },
    create: {
      ...orderData,
      lineItems: { create: lineItems },
    },
    update: {
      ...orderData,
      // Note: line items are not updated on upsert to avoid complexity
      // If line items change, webhook handler will update them
    },
  });
}

const ORDERS_QUERY = `
  query GetOrders($first: Int!, $query: String, $after: String) {
    orders(first: $first, query: $query, after: $after) {
      edges {
        node {
          id
          name
          createdAt
          processedAt
          totalPriceSet { shopMoney { amount currencyCode } }
          displayFulfillmentStatus
          displayFinancialStatus
          customer { id }
          lineItems(first: 250) {
            edges {
              node {
                id
                title
                quantity
                product { id title }
                variant { id title price }
              }
            }
          }
          shippingAddress { city province country }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export async function syncProductsFromShopify(
  admin: AdminApiContext['graphql'],
  shop: string,
  options: SyncOptions = {}
): Promise<SyncResult> {
  // Initialize sync status
  await db.syncStatus.upsert({
    where: { shop },
    create: { shop, syncInProgress: true },
    update: { syncInProgress: true, lastError: null, lastErrorAt: null },
  });

  let totalSynced = 0;
  let hasNextPage = true;
  let cursor: string | null = null;
  const maxPages = options.limit ? Math.ceil(options.limit / BATCH_SIZE) : 50;

  try {
    console.log(`🚀 Starting product sync for shop: ${shop}`);

    for (let page = 0; page < maxPages && hasNextPage; page++) {
      const variables: any = { first: BATCH_SIZE };
      if (cursor) variables.after = cursor;

      console.log(`📦 Fetching products page ${page + 1}/${maxPages}...`);

      const response = await admin(PRODUCTS_QUERY, { variables });
      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL Error: ${data.errors[0].message}`);
      }

      const edges = data.data?.products?.edges || [];

      if (edges.length === 0) {
        console.log(`ℹ️  No products found on page ${page + 1}`);
        break;
      }

      // Process each product
      for (const { node: product } of edges) {
        try {
          await saveProductToDatabase(shop, product);
          totalSynced++;
        } catch (error: any) {
          console.error(`❌ Error saving product ${product.id}:`, error.message);
        }
      }

      hasNextPage = data.data.products.pageInfo.hasNextPage;
      cursor = data.data.products.pageInfo.endCursor;

      console.log(`✅ Page ${page + 1} complete: ${totalSynced} total products synced`);

      // Rate limiting
      if (hasNextPage && page + 1 < maxPages) {
        console.log(`⏳ Rate limiting: waiting ${DELAY_MS}ms...`);
        await delay(DELAY_MS);
      }
    }

    // Get actual count from database
    const actualProductCount = await db.product.count({
      where: { shop },
    });

    // Update sync status with success
    await db.syncStatus.update({
      where: { shop },
      data: {
        lastProductSync: new Date(),
        syncInProgress: false,
        totalProducts: actualProductCount,
        lastError: null,
        lastErrorAt: null,
      },
    });

    console.log(`🎉 Product sync complete: ${totalSynced} products synced`);
    return { success: true, synced: totalSynced };

  } catch (error: any) {
    console.error(`❌ Product sync failed:`, error.message);

    await db.syncStatus.update({
      where: { shop },
      data: {
        syncInProgress: false,
        lastError: error.message,
        lastErrorAt: new Date(),
      },
    });

    return { success: false, synced: totalSynced, error: error.message };
  }
}

async function saveProductToDatabase(shop: string, product: any) {
  const totalInventory = product.variants.edges.reduce(
    (sum: number, { node: variant }: any) => sum + (variant.inventoryQuantity || 0),
    0
  );

  const productData = {
    id: product.id,
    shop,
    title: product.title,
    productType: product.productType,
    vendor: product.vendor,
    totalInventory,
    status: product.status.toLowerCase(),
  };

  await db.product.upsert({
    where: { id: productData.id },
    create: productData,
    update: productData,
  });
}

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          title
          productType
          vendor
          status
          variants(first: 100) {
            edges {
              node {
                id
                inventoryQuantity
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
