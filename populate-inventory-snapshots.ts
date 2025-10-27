/**
 * Populate Inventory Snapshots from BFCM Order Data
 *
 * Creates realistic inventory snapshots by:
 * 1. Analyzing recent order velocity from the database
 * 2. Calculating burn rates for top products
 * 3. Simulating current stock levels
 * 4. Creating inventory snapshots with realistic coverage hours
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateInventorySnapshots() {
  const shop = 'control-tower-2.myshopify.com';

  console.log('📦 Populating Inventory Snapshots from BFCM Order Data\n');
  console.log('='.repeat(70));

  // Get product sales from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  console.log('\n📊 Analyzing product velocity from orders...');

  const lineItems = await prisma.orderLineItem.findMany({
    where: {
      order: {
        shop,
        createdAt: { gte: sevenDaysAgo },
      },
    },
    include: {
      order: true,
    },
  });

  // Aggregate by product
  const productStats = new Map<string, {
    productId: string;
    productTitle: string;
    variantId: string;
    totalSold: number;
    totalRevenue: number;
    orderCount: number;
  }>();

  for (const item of lineItems) {
    const key = `${item.productId}-${item.variantId}`;
    const existing = productStats.get(key) || {
      productId: item.productId,
      productTitle: item.productTitle,
      variantId: item.variantId,
      totalSold: 0,
      totalRevenue: 0,
      orderCount: 0,
    };

    existing.totalSold += item.quantity;
    existing.totalRevenue += item.price * item.quantity;
    existing.orderCount += 1;

    productStats.set(key, existing);
  }

  console.log(`✅ Analyzed ${productStats.size} products from ${lineItems.length} line items`);

  // Sort by total sold (descending)
  const topProducts = Array.from(productStats.values())
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 50); // Top 50 products

  console.log(`\n🔥 Top 50 products by velocity\n`);

  const snapshots: any[] = [];
  const now = new Date();

  for (let i = 0; i < topProducts.length; i++) {
    const product = topProducts[i];

    // Calculate burn rate (units per hour over last 7 days)
    const hoursInPeriod = 7 * 24;
    const burnRate = product.totalSold / hoursInPeriod;

    // Simulate current stock with varying levels (BFCM crisis scenario)
    // Top 5: Critical (<4h stockout)
    // 6-15: High risk (4-24h stockout)
    // 16-30: Medium risk (24-72h)
    // 31-50: Healthy stock
    let currentStock: number;
    if (i < 5) {
      // CRITICAL: 0.5-3 hours of coverage
      currentStock = Math.floor(burnRate * (0.5 + Math.random() * 2.5));
    } else if (i < 15) {
      // HIGH RISK: 4-20 hours of coverage
      currentStock = Math.floor(burnRate * (4 + Math.random() * 16));
    } else if (i < 30) {
      // MEDIUM RISK: 24-72 hours of coverage
      currentStock = Math.floor(burnRate * (24 + Math.random() * 48));
    } else {
      // Healthy: 72-168 hours of coverage
      currentStock = Math.floor(burnRate * (72 + Math.random() * 96));
    }

    // Calculate coverage hours
    const coverageHours = burnRate > 0 ? currentStock / burnRate : 999;

    // Determine status
    let status: string;
    if (currentStock === 0) {
      status = 'stockout';
    } else if (coverageHours < 4) {
      status = 'critical';
    } else if (coverageHours < 24) {
      status = 'warning';
    } else {
      status = 'healthy';
    }

    // Velocity trend (simulate varying trends)
    const velocityTrend = i < 5 ? 50 + Math.random() * 100 : // Top 5: Viral
                          i < 15 ? -10 + Math.random() * 30 : // Next 10: Accelerating
                          -5 + Math.random() * 10; // Rest: Stable

    const snapshot = {
      shop,
      sku: `SKU-${product.productId.split('/').pop()}-${product.variantId.split('/').pop()}`,
      productId: product.productId,
      productTitle: product.productTitle,
      location: 'Main Warehouse',
      currentStock: Math.max(0, currentStock),
      burnRate: Math.max(0.1, burnRate),
      coverageHours: Math.min(999, coverageHours),
      reorderPoint: Math.floor(burnRate * 24), // 24 hours buffer
      velocityTrend,
      status,
      createdAt: now,
    };

    snapshots.push(snapshot);

    // Print sample
    if (i < 10) {
      console.log(`${i + 1}. ${product.productTitle.substring(0, 30).padEnd(30)} | ${status.toUpperCase().padEnd(9)} | Stock: ${currentStock.toString().padStart(4)} | Burn: ${burnRate.toFixed(2).padStart(6)}/hr | Coverage: ${coverageHours.toFixed(1).padStart(6)}h`);
    }
  }

  console.log(`\n💾 Creating ${snapshots.length} inventory snapshots...`);

  // Clear old snapshots
  await prisma.inventorySnapshot.deleteMany({
    where: { shop },
  });

  // Insert new snapshots
  for (const snapshot of snapshots) {
    await prisma.inventorySnapshot.create({
      data: snapshot,
    });
  }

  console.log(`✅ Created ${snapshots.length} inventory snapshots`);

  // Print summary stats
  const stats = {
    critical: snapshots.filter(s => s.status === 'critical').length,
    warning: snapshots.filter(s => s.status === 'warning').length,
    healthy: snapshots.filter(s => s.status === 'healthy').length,
    stockout: snapshots.filter(s => s.status === 'stockout').length,
  };

  console.log(`\n📊 Inventory Status Summary:`);
  console.log(`   🚨 Critical (<4h): ${stats.critical} SKUs`);
  console.log(`   ⚠️  Warning (<24h): ${stats.warning} SKUs`);
  console.log(`   ✅ Healthy (>24h): ${stats.healthy} SKUs`);
  console.log(`   ❌ Stockout: ${stats.stockout} SKUs`);
  console.log();

  await prisma.$disconnect();
}

populateInventorySnapshots();
