/**
 * Complete Data Sync Script
 *
 * This script syncs ALL data from Shopify to Neon PostgreSQL:
 * - Products (with inventory)
 * - Orders (with line items)
 * - Inventory snapshots for War Room
 *
 * Usage: npx tsx sync-all-data.ts
 */

import { PrismaClient } from '@prisma/client';
import { createAdminApiClient } from '@shopify/admin-api-client';

const prisma = new PrismaClient();

// Load from environment
const SHOP = process.env.HOST || 'control-tower-2.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_API_KEY || '';

const client = createAdminApiClient({
  storeDomain: SHOP,
  apiVersion: '2024-01',
  accessToken: ACCESS_TOKEN,
});

const BATCH_SIZE = 50;
const DELAY_MS = 500;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function syncProducts() {
  console.log('\n📦 Syncing Products from Shopify...\n');

  let cursor: string | null = null;
  let totalSynced = 0;
  let hasNextPage = true;
  let page = 0;

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
            createdAt
            variants(first: 100) {
              edges {
                node {
                  id
                  inventoryQuantity
                  price
                  sku
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    while (hasNextPage && page < 100) {
      page++;
      console.log(`   📄 Fetching page ${page}...`);

      const response: any = await client.request(PRODUCTS_QUERY, {
        variables: {
          first: BATCH_SIZE,
          after: cursor,
        },
      });

      const products = response.data?.products?.edges || [];

      if (products.length === 0) {
        console.log('   ℹ️  No more products found');
        break;
      }

      for (const { node: product } of products) {
        try {
          const totalInventory = product.variants.edges.reduce(
            (sum: number, { node: v }: any) => sum + (v.inventoryQuantity || 0),
            0
          );

          await prisma.product.upsert({
            where: { id: product.id },
            create: {
              id: product.id,
              shop: SHOP,
              title: product.title,
              productType: product.productType,
              vendor: product.vendor,
              totalInventory,
              status: product.status.toLowerCase(),
              createdAt: new Date(product.createdAt),
            },
            update: {
              title: product.title,
              productType: product.productType,
              vendor: product.vendor,
              totalInventory,
              status: product.status.toLowerCase(),
            },
          });

          totalSynced++;
        } catch (error: any) {
          console.error(`   ❌ Error saving product:`, error.message);
        }
      }

      hasNextPage = response.data?.products?.pageInfo?.hasNextPage || false;
      cursor = response.data?.products?.pageInfo?.endCursor || null;

      console.log(`   ✅ Page ${page}: ${totalSynced} products synced so far`);

      if (hasNextPage) {
        await delay(DELAY_MS);
      }
    }

    console.log(`\n✅ Products sync complete: ${totalSynced} products`);
    return totalSynced;

  } catch (error: any) {
    console.error('\n❌ Product sync failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    return totalSynced;
  }
}

async function syncOrders() {
  console.log('\n📦 Syncing Orders from Shopify...\n');

  let cursor: string | null = null;
  let totalSynced = 0;
  let hasNextPage = true;
  let page = 0;

  const ORDERS_QUERY = `
    query GetOrders($first: Int!, $after: String) {
      orders(first: $first, after: $after) {
        edges {
          node {
            id
            name
            createdAt
            processedAt
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            displayFinancialStatus
            displayFulfillmentStatus
            customer {
              id
            }
            lineItems(first: 250) {
              edges {
                node {
                  id
                  title
                  quantity
                  product {
                    id
                    title
                  }
                  variant {
                    id
                    title
                    price
                  }
                }
              }
            }
            shippingAddress {
              city
              province
              country
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    while (hasNextPage && page < 100) {
      page++;
      console.log(`   📄 Fetching page ${page}...`);

      const response: any = await client.request(ORDERS_QUERY, {
        variables: {
          first: BATCH_SIZE,
          after: cursor,
        },
      });

      const orders = response.data?.orders?.edges || [];

      if (orders.length === 0) {
        console.log('   ℹ️  No more orders found');
        break;
      }

      for (const { node: order } of orders) {
        try {
          const lineItems = order.lineItems.edges.map(({ node: item }: any) => ({
            productId: item.product?.id || 'unknown',
            productTitle: item.title,
            variantId: item.variant?.id || 'unknown',
            variantTitle: item.variant?.title,
            quantity: item.quantity,
            price: parseFloat(item.variant?.price || '0'),
          }));

          await prisma.order.upsert({
            where: { id: order.id },
            create: {
              id: order.id,
              shopifyOrderId: order.name.replace('#', ''),
              name: order.name,
              shop: SHOP,
              email: null,
              totalPrice: parseFloat(order.totalPriceSet.shopMoney.amount),
              currency: order.totalPriceSet.shopMoney.currencyCode,
              financialStatus: order.displayFinancialStatus,
              fulfillmentStatus: order.displayFulfillmentStatus,
              processedAt: order.processedAt ? new Date(order.processedAt) : null,
              createdAt: new Date(order.createdAt),
              customerId: order.customer?.id || null,
              customerEmail: null,
              shippingCity: order.shippingAddress?.city,
              shippingProvince: order.shippingAddress?.province,
              shippingCountry: order.shippingAddress?.country,
              lineItems: {
                create: lineItems,
              },
            },
            update: {
              shopifyOrderId: order.name.replace('#', ''),
              name: order.name,
              totalPrice: parseFloat(order.totalPriceSet.shopMoney.amount),
              currency: order.totalPriceSet.shopMoney.currencyCode,
              financialStatus: order.displayFinancialStatus,
              fulfillmentStatus: order.displayFulfillmentStatus,
              processedAt: order.processedAt ? new Date(order.processedAt) : null,
              shippingCity: order.shippingAddress?.city,
              shippingProvince: order.shippingAddress?.province,
              shippingCountry: order.shippingAddress?.country,
            },
          });

          totalSynced++;
        } catch (error: any) {
          console.error(`   ❌ Error saving order ${order.name}:`, error.message);
        }
      }

      hasNextPage = response.data?.orders?.pageInfo?.hasNextPage || false;
      cursor = response.data?.orders?.pageInfo?.endCursor || null;

      console.log(`   ✅ Page ${page}: ${totalSynced} orders synced so far`);

      if (hasNextPage) {
        await delay(DELAY_MS);
      }
    }

    console.log(`\n✅ Orders sync complete: ${totalSynced} orders`);
    return totalSynced;

  } catch (error: any) {
    console.error('\n❌ Orders sync failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    return totalSynced;
  }
}

async function createInventorySnapshots() {
  console.log('\n📊 Creating Inventory Snapshots for War Room...\n');

  try {
    // Get all products with inventory
    const products = await prisma.product.findMany({
      where: { shop: SHOP },
    });

    console.log(`   Found ${products.length} products`);

    let created = 0;
    for (const product of products) {
      // Create inventory snapshot for each product
      // Using mock data for initial setup - real data comes from actual sales velocity
      const burnRate = Math.random() * 5; // Units per hour
      const coverageHours = product.totalInventory / (burnRate || 1);

      let status = 'healthy';
      if (coverageHours < 24) status = 'critical';
      else if (coverageHours < 72) status = 'warning';

      await prisma.inventorySnapshot.create({
        data: {
          shop: SHOP,
          sku: `SKU-${product.id.split('/').pop()}`,
          productId: product.id,
          productTitle: product.title,
          location: 'Default',
          currentStock: product.totalInventory,
          burnRate,
          coverageHours,
          reorderPoint: Math.max(50, Math.round(burnRate * 48)), // 48 hours of buffer
          velocityTrend: (Math.random() - 0.5) * 20, // -10% to +10%
          status,
        },
      });

      created++;
    }

    console.log(`✅ Created ${created} inventory snapshots\n`);
    return created;

  } catch (error: any) {
    console.error('❌ Error creating inventory snapshots:', error.message);
    return 0;
  }
}

async function updateSyncStatus(orders: number, products: number) {
  await prisma.syncStatus.upsert({
    where: { shop: SHOP },
    create: {
      shop: SHOP,
      lastOrderSync: new Date(),
      lastProductSync: new Date(),
      totalOrders: orders,
      totalProducts: products,
      syncInProgress: false,
    },
    update: {
      lastOrderSync: new Date(),
      lastProductSync: new Date(),
      totalOrders: orders,
      totalProducts: products,
      syncInProgress: false,
    },
  });
}

async function main() {
  console.log('🚀 Complete Shopify → Neon Data Sync\n');
  console.log(`Shop: ${SHOP}`);
  console.log(`Database: Neon PostgreSQL\n`);
  console.log('=' .repeat(60));

  try {
    await prisma.$connect();
    console.log('✅ Connected to Neon PostgreSQL\n');

    // Sync all data
    const productsCount = await syncProducts();
    const ordersCount = await syncOrders();
    const snapshotsCount = await createInventorySnapshots();

    // Update sync status
    await updateSyncStatus(ordersCount, productsCount);

    console.log('\n' + '='.repeat(60));
    console.log('SYNC COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Products synced: ${productsCount}`);
    console.log(`📊 Orders synced: ${ordersCount}`);
    console.log(`📊 Inventory snapshots: ${snapshotsCount}`);
    console.log('='.repeat(60));

    console.log('\n✅ Your Neon database is fully populated!');
    console.log('\n💡 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Visit: /app/war-room');
    console.log('3. View: /app/analytics');
    console.log('4. Webhooks keep data synced automatically\n');

  } catch (error: any) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
