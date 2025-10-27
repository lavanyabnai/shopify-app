/**
 * Sync and Verify Script (Direct API Access)
 *
 * Uses direct GraphQL access with session token to sync data
 * Bypasses authenticate.admin() which requires web request context
 *
 * Usage: npx tsx sync-and-verify-direct.ts
 */

import db from "./app/db.server";
import { updateInventorySnapshot } from "./app/services/defcon-calculator.server";

async function makeGraphQLRequest(session: any, query: string, variables?: any) {
  const response = await fetch(
    `https://${session.shop}/admin/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': session.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchOrdersFromShopify(session: any, since?: Date) {
  console.log(`📥 Fetching orders from Shopify${since ? ` since ${since.toISOString()}` : ''}...`);

  const sinceParam = since ? `created_at:>${since.toISOString()}` : '';

  const query = `
    query getOrders($query: String, $first: Int!, $after: String) {
      orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT) {
        edges {
          node {
            id
            name
            email
            createdAt
            processedAt
            currentTotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            displayFinancialStatus
            displayFulfillmentStatus
            customer {
              id
              email
            }
            shippingAddress {
              city
              province
              country
            }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    title
                    product {
                      id
                      title
                    }
                  }
                  originalUnitPriceSet {
                    shopMoney {
                      amount
                    }
                  }
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

  let allOrders: any[] = [];
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;

  while (hasNextPage) {
    const data = await makeGraphQLRequest(session, query, {
      query: sinceParam,
      first: 250,
      after: cursor,
    });

    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors);
      break;
    }

    const orders = data.data.orders.edges.map((edge: any) => edge.node);
    allOrders = allOrders.concat(orders);

    hasNextPage = data.data.orders.pageInfo.hasNextPage;
    cursor = data.data.orders.pageInfo.endCursor;

    pageCount++;
    console.log(`   Page ${pageCount}: Fetched ${orders.length} orders (total: ${allOrders.length})...`);

    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`✅ Fetched ${allOrders.length} total orders\n`);
  return allOrders;
}

async function syncOrderToDatabase(order: any, shop: string) {
  const orderId = order.id;
  const shopifyOrderId = orderId.split('/').pop() || '';

  // Check if order already exists
  const existing = await db.order.findUnique({
    where: { id: orderId },
  });

  const orderData = {
    id: orderId,
    shopifyOrderId,
    name: order.name,
    shop,
    email: order.email || null,
    totalPrice: parseFloat(order.currentTotalPriceSet.shopMoney.amount),
    currency: order.currentTotalPriceSet.shopMoney.currencyCode,
    financialStatus: order.displayFinancialStatus || null,
    fulfillmentStatus: order.displayFulfillmentStatus || null,
    processedAt: order.processedAt ? new Date(order.processedAt) : null,
    createdAt: new Date(order.createdAt),
    customerId: order.customer?.id || null,
    customerEmail: order.customer?.email || null,
    shippingCity: order.shippingAddress?.city || null,
    shippingProvince: order.shippingAddress?.province || null,
    shippingCountry: order.shippingAddress?.country || null,
  };

  if (existing) {
    await db.order.update({
      where: { id: orderId },
      data: orderData,
    });
  } else {
    await db.order.create({
      data: orderData,
    });
  }

  // Sync line items
  const lineItems = order.lineItems.edges.map((edge: any) => edge.node);

  for (const lineItem of lineItems) {
    const productId = lineItem.variant?.product?.id || '';
    const variantId = lineItem.variant?.id || '';

    const existingLineItem = await db.orderLineItem.findFirst({
      where: {
        orderId,
        productId,
        variantId,
      },
    });

    const lineItemData = {
      orderId,
      productId,
      productTitle: lineItem.variant?.product?.title || lineItem.title,
      variantId,
      variantTitle: lineItem.variant?.title || '',
      quantity: lineItem.quantity,
      price: parseFloat(lineItem.originalUnitPriceSet.shopMoney.amount),
    };

    if (existingLineItem) {
      await db.orderLineItem.update({
        where: { id: existingLineItem.id },
        data: lineItemData,
      });
    } else {
      await db.orderLineItem.create({
        data: lineItemData,
      });
    }
  }
}

async function fetchProductsFromShopify(session: any) {
  console.log(`📦 Fetching products from Shopify...`);

  const query = `
    query getProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        edges {
          node {
            id
            title
            productType
            vendor
            status
            totalInventory
            createdAt
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  let allProducts: any[] = [];
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;

  while (hasNextPage) {
    const data = await makeGraphQLRequest(session, query, {
      first: 250,
      after: cursor,
    });

    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors);
      break;
    }

    const products = data.data.products.edges.map((edge: any) => edge.node);
    allProducts = allProducts.concat(products);

    hasNextPage = data.data.products.pageInfo.hasNextPage;
    cursor = data.data.products.pageInfo.endCursor;

    pageCount++;
    console.log(`   Page ${pageCount}: Fetched ${products.length} products (total: ${allProducts.length})...`);

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`✅ Fetched ${allProducts.length} total products\n`);
  return allProducts;
}

async function syncProductToDatabase(product: any, shop: string) {
  const productId = product.id;

  const productData = {
    id: productId,
    shop,
    title: product.title,
    productType: product.productType || null,
    vendor: product.vendor || null,
    totalInventory: product.totalInventory || 0,
    status: product.status.toLowerCase(),
    createdAt: new Date(product.createdAt),
    updatedAt: new Date(product.updatedAt),
  };

  await db.product.upsert({
    where: { id: productId },
    create: productData,
    update: productData,
  });
}

async function generateInventorySnapshots(shop: string) {
  console.log(`\n📸 Generating inventory snapshots for all products...`);

  const products = await db.product.findMany({
    where: { shop, status: 'active' },
  });

  console.log(`   Found ${products.length} active products`);

  for (const product of products) {
    // Generate SKU (use first 10 chars of product title + product ID suffix)
    const sku = `${product.title.substring(0, 10).toUpperCase().replace(/\s/g, '-')}-${product.id.split('/').pop()?.substring(0, 6) || ''}`;

    await updateInventorySnapshot(
      shop,
      product.id,
      sku,
      product.title,
      'Main Warehouse', // Default location
      product.totalInventory
    );

    console.log(`   ✓ ${product.title.substring(0, 40).padEnd(40)} | Stock: ${product.totalInventory}`);
  }

  console.log(`✅ Created ${products.length} inventory snapshots\n`);
}

async function updateSyncStatus(shop: string) {
  const now = new Date();

  const totalOrders = await db.order.count({ where: { shop } });
  const totalProducts = await db.product.count({ where: { shop } });

  await db.syncStatus.upsert({
    where: { shop },
    create: {
      shop,
      lastOrderSync: now,
      lastProductSync: now,
      totalOrders,
      totalProducts,
      syncInProgress: false,
    },
    update: {
      lastOrderSync: now,
      lastProductSync: now,
      totalOrders,
      totalProducts,
      syncInProgress: false,
    },
  });
}

async function verifySync(shop: string) {
  console.log(`\n🔍 Verifying sync results...`);
  console.log('━'.repeat(70));

  // Orders
  const totalOrders = await db.order.count({ where: { shop } });
  const ordersWithProcessedAt = await db.order.count({
    where: { shop, processedAt: { not: null } },
  });
  const ordersOct2025 = await db.order.count({
    where: {
      shop,
      processedAt: {
        gte: new Date('2025-10-01'),
        lte: new Date('2025-10-23T23:59:59'),
      },
    },
  });

  console.log(`📊 Orders:`);
  console.log(`   Total orders: ${totalOrders}`);
  console.log(`   With processedAt: ${ordersWithProcessedAt}`);
  console.log(`   Oct 1-23, 2025: ${ordersOct2025}`);

  // Products
  const totalProducts = await db.product.count({ where: { shop } });
  const activeProducts = await db.product.count({ where: { shop, status: 'active' } });

  console.log(`\n📦 Products:`);
  console.log(`   Total products: ${totalProducts}`);
  console.log(`   Active products: ${activeProducts}`);

  // Inventory snapshots
  const totalSnapshots = await db.inventorySnapshot.count({ where: { shop } });
  const recentSnapshots = await db.inventorySnapshot.count({
    where: {
      shop,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
    },
  });

  console.log(`\n📸 Inventory Snapshots:`);
  console.log(`   Total snapshots: ${totalSnapshots}`);
  console.log(`   Created in last hour: ${recentSnapshots}`);

  // Sync status
  const syncStatus = await db.syncStatus.findUnique({ where: { shop } });

  if (syncStatus) {
    console.log(`\n🔄 Sync Status:`);
    console.log(`   Last order sync: ${syncStatus.lastOrderSync?.toISOString()}`);
    console.log(`   Last product sync: ${syncStatus.lastProductSync?.toISOString()}`);
    console.log(`   In progress: ${syncStatus.syncInProgress ? 'Yes' : 'No'}`);
  }

  console.log('━'.repeat(70));

  // Validation
  const issues: string[] = [];

  if (ordersOct2025 < 100) {
    issues.push(`⚠️  Expected ~1,000 Oct 2025 orders, found ${ordersOct2025}`);
  }

  if (recentSnapshots < activeProducts) {
    issues.push(`⚠️  Missing inventory snapshots (expected ${activeProducts}, found ${recentSnapshots})`);
  }

  if (issues.length > 0) {
    console.log(`\n⚠️  ISSUES FOUND:`);
    issues.forEach(issue => console.log(`   ${issue}`));
  } else {
    console.log(`\n✅ All verification checks passed!`);
  }

  return issues.length === 0;
}

async function main() {
  console.log('🚀 SYNC AND VERIFY - BFCM War Room Testing\n');
  console.log('='.repeat(70));

  // Get session for API access
  const session = await db.session.findFirst();

  if (!session) {
    console.error('❌ No session found. Please authenticate with Shopify first.');
    console.error('\n💡 To authenticate:');
    console.error('   1. Run: npm run dev');
    console.error('   2. Visit your app in Shopify admin');
    console.error('   3. Complete OAuth flow');
    process.exit(1);
  }

  const shop = session.shop;
  console.log(`Shop: ${shop}`);
  console.log(`Access: Using session token for GraphQL requests`);
  console.log('='.repeat(70));

  try {
    // Step 1: Sync orders
    console.log('\n📥 STEP 1: Sync Orders from Shopify');
    console.log('─'.repeat(70));

    // Fetch orders from Oct 1, 2025 onwards
    const since = new Date('2025-10-01');
    const orders = await fetchOrdersFromShopify(session, since);

    console.log(`💾 Syncing ${orders.length} orders to database...`);
    let syncedOrders = 0;

    for (const order of orders) {
      await syncOrderToDatabase(order, shop);
      syncedOrders++;

      if (syncedOrders % 100 === 0) {
        console.log(`   Synced ${syncedOrders}/${orders.length} orders...`);
      }
    }

    console.log(`✅ Synced ${syncedOrders} orders\n`);

    // Step 2: Sync products
    console.log('📦 STEP 2: Sync Products from Shopify');
    console.log('─'.repeat(70));

    const products = await fetchProductsFromShopify(session);

    console.log(`💾 Syncing ${products.length} products to database...`);

    for (const product of products) {
      await syncProductToDatabase(product, shop);
    }

    console.log(`✅ Synced ${products.length} products\n`);

    // Step 3: Generate inventory snapshots
    console.log('📸 STEP 3: Generate Inventory Snapshots');
    console.log('─'.repeat(70));

    await generateInventorySnapshots(shop);

    // Step 4: Update sync status
    console.log('🔄 STEP 4: Update Sync Status');
    console.log('─'.repeat(70));

    await updateSyncStatus(shop);
    console.log('✅ Sync status updated\n');

    // Step 5: Verify
    console.log('🔍 STEP 5: Verify Sync Results');
    console.log('─'.repeat(70));

    const success = await verifySync(shop);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SYNC COMPLETE');
    console.log('='.repeat(70));

    if (success) {
      console.log('✅ All data synced successfully!');
      console.log('\n💡 NEXT STEPS:');
      console.log('   1. Start dev server: npm run dev');
      console.log('   2. Navigate to: /app/war-room');
      console.log('   3. Check baseline DEFCON level');
      console.log('   4. Run: npx tsx verify-war-room-baseline.ts');
    } else {
      console.log('⚠️  Sync completed with issues. Review warnings above.');
    }

    console.log('='.repeat(70) + '\n');

  } catch (error: any) {
    console.error('❌ Sync failed:', error.message || error);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Check your internet connection');
    console.error('   - Verify session is not expired');
    console.error('   - Check Shopify API status');
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
