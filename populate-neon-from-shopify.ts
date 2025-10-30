/**
 * Populate Neon Database with Shopify Data
 *
 * This script fetches data from Shopify and populates your Neon database.
 * Run this once to get initial data, then webhooks keep it in sync.
 *
 * Usage: npx tsx populate-neon-from-shopify.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Your Shopify store credentials
const SHOP = process.env.HOST || 'control-tower-2.myshopify.com';
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';

interface ShopifyOrder {
  id: string;
  name: string;
  created_at: string;
  processed_at: string | null;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  customer: { id: string } | null;
  line_items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: string;
    product_id: string | null;
    variant_id: string | null;
    variant_title: string | null;
  }>;
  shipping_address: {
    city: string | null;
    province: string | null;
    country: string | null;
  } | null;
}

interface ShopifyProduct {
  id: string;
  title: string;
  product_type: string | null;
  vendor: string | null;
  status: string;
  created_at: string;
  variants: Array<{
    id: string;
    inventory_quantity: number;
  }>;
}

async function fetchShopifyData(endpoint: string) {
  const url = `https://${SHOP}/admin/api/2024-01/${endpoint}`;

  if (!ACCESS_TOKEN) {
    console.error('❌ SHOPIFY_ACCESS_TOKEN not found in environment');
    console.log('\n💡 To get your access token:');
    console.log('1. Go to your Shopify admin');
    console.log('2. Settings > Apps and sales channels');
    console.log('3. Develop apps > [Your App]');
    console.log('4. API credentials > Admin API access token');
    console.log('\nThen add to .env:');
    console.log('SHOPIFY_ACCESS_TOKEN=your_token_here\n');
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error);
    return null;
  }
}

async function syncOrders() {
  console.log('\n📦 Syncing orders from Shopify...');

  const data = await fetchShopifyData('orders.json?limit=250&status=any');
  if (!data || !data.orders) {
    console.log('⚠️  No orders found or error occurred');
    return 0;
  }

  const orders: ShopifyOrder[] = data.orders;
  console.log(`   Found ${orders.length} orders`);

  let synced = 0;
  for (const order of orders) {
    try {
      // Convert REST API ID to GraphQL GID format
      const gid = `gid://shopify/Order/${order.id}`;

      await prisma.order.upsert({
        where: { id: gid },
        create: {
          id: gid,
          shopifyOrderId: order.id.toString(),
          name: order.name,
          shop: SHOP,
          email: null,
          totalPrice: parseFloat(order.total_price),
          currency: order.currency,
          financialStatus: order.financial_status?.toUpperCase(),
          fulfillmentStatus: order.fulfillment_status?.toUpperCase(),
          processedAt: order.processed_at ? new Date(order.processed_at) : null,
          createdAt: new Date(order.created_at),
          customerId: order.customer?.id?.toString() || null,
          customerEmail: null,
          shippingCity: order.shipping_address?.city || null,
          shippingProvince: order.shipping_address?.province || null,
          shippingCountry: order.shipping_address?.country || null,
          lineItems: {
            create: order.line_items.map(item => ({
              productId: item.product_id?.toString() || 'unknown',
              productTitle: item.title,
              variantId: item.variant_id?.toString() || 'unknown',
              variantTitle: item.variant_title,
              quantity: item.quantity,
              price: parseFloat(item.price),
            })),
          },
        },
        update: {
          shopifyOrderId: order.id.toString(),
          name: order.name,
          totalPrice: parseFloat(order.total_price),
          currency: order.currency,
          financialStatus: order.financial_status?.toUpperCase(),
          fulfillmentStatus: order.fulfillment_status?.toUpperCase(),
          processedAt: order.processed_at ? new Date(order.processed_at) : null,
          shippingCity: order.shipping_address?.city || null,
          shippingProvince: order.shipping_address?.province || null,
          shippingCountry: order.shipping_address?.country || null,
        },
      });

      synced++;
    } catch (error: any) {
      console.error(`   ❌ Error syncing order ${order.name}:`, error.message);
    }
  }

  console.log(`   ✅ Synced ${synced}/${orders.length} orders`);
  return synced;
}

async function syncProducts() {
  console.log('\n📦 Syncing products from Shopify...');

  const data = await fetchShopifyData('products.json?limit=250');
  if (!data || !data.products) {
    console.log('⚠️  No products found or error occurred');
    return 0;
  }

  const products: ShopifyProduct[] = data.products;
  console.log(`   Found ${products.length} products`);

  let synced = 0;
  for (const product of products) {
    try {
      const gid = `gid://shopify/Product/${product.id}`;
      const totalInventory = product.variants.reduce(
        (sum, v) => sum + (v.inventory_quantity || 0),
        0
      );

      await prisma.product.upsert({
        where: { id: gid },
        create: {
          id: gid,
          shop: SHOP,
          title: product.title,
          productType: product.product_type,
          vendor: product.vendor,
          totalInventory,
          status: product.status.toLowerCase(),
          createdAt: new Date(product.created_at),
        },
        update: {
          title: product.title,
          productType: product.product_type,
          vendor: product.vendor,
          totalInventory,
          status: product.status.toLowerCase(),
        },
      });

      synced++;
    } catch (error: any) {
      console.error(`   ❌ Error syncing product ${product.title}:`, error.message);
    }
  }

  console.log(`   ✅ Synced ${synced}/${products.length} products`);
  return synced;
}

async function updateSyncStatus(orderCount: number, productCount: number) {
  await prisma.syncStatus.upsert({
    where: { shop: SHOP },
    create: {
      shop: SHOP,
      lastOrderSync: new Date(),
      lastProductSync: new Date(),
      totalOrders: orderCount,
      totalProducts: productCount,
      syncInProgress: false,
    },
    update: {
      lastOrderSync: new Date(),
      lastProductSync: new Date(),
      totalOrders: orderCount,
      totalProducts: productCount,
      syncInProgress: false,
    },
  });
}

async function main() {
  console.log('🚀 Starting Shopify → Neon data sync\n');
  console.log(`Shop: ${SHOP}`);
  console.log(`Database: Neon PostgreSQL\n`);

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to Neon PostgreSQL\n');

    // Sync data
    const orderCount = await syncOrders();
    const productCount = await syncProducts();

    // Update sync status
    await updateSyncStatus(orderCount, productCount);

    console.log('\n' + '='.repeat(60));
    console.log('SYNC COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Orders synced: ${orderCount}`);
    console.log(`📊 Products synced: ${productCount}`);
    console.log('='.repeat(60));

    console.log('\n✅ Your Neon database is now populated!');
    console.log('\n💡 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Visit: /app/analytics or /app/war-room');
    console.log('3. Webhooks will keep data in sync automatically\n');

  } catch (error: any) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
