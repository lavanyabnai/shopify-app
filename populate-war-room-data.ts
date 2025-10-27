import db from './app/db.server.ts';
import { calculateDEFCON } from './app/services/defcon-calculator.server.js';
import { createDefaultAlertRules } from './app/services/alert-engine.server.js';

const SHOP = 'control-tower-2.myshopify.com';

async function populate() {
  console.log('🚀 Populating War Room Data...\n');

  // 1. Calculate and save DEFCON
  console.log('1️⃣  Calculating DEFCON...');
  const defcon = await calculateDEFCON(SHOP);
  console.log(`   ✅ DEFCON ${defcon.level}: ${defcon.label}`);
  console.log(`   Risk Score: ${defcon.riskScore}/100\n`);

  // 2. Create alert rules
  console.log('2️⃣  Creating alert rules...');
  await createDefaultAlertRules(SHOP);
  const rules = await db.alertRule.count({ where: { shop: SHOP } });
  console.log(`   ✅ Alert rules: ${rules}\n`);

  // 3. Create inventory snapshots
  console.log('3️⃣  Creating inventory snapshots...');
  const products = await db.product.findMany({
    where: { shop: SHOP },
    take: 30
  });

  let snapshots = 0;
  for (const product of products) {
    try {
      // Generate realistic inventory data
      const currentStock = Math.floor(Math.random() * 100) + 10; // 10-110 units
      const burnRate = Math.random() * 2 + 0.1; // 0.1-2.1 units/hour
      const coverageHours = currentStock / burnRate;
      const velocityTrend = (Math.random() - 0.5) * 200; // -100% to +100%

      // Determine status based on coverage hours
      let status = 'healthy';
      if (currentStock === 0) status = 'stockout';
      else if (coverageHours < 4) status = 'critical';
      else if (coverageHours < 24) status = 'warning';

      await db.inventorySnapshot.create({
        data: {
          shop: SHOP,
          sku: `SKU-${product.id}-${Date.now()}`,
          productId: product.id,
          productTitle: product.title,
          location: 'Main Warehouse',
          currentStock: currentStock,
          burnRate: burnRate,
          coverageHours: coverageHours,
          reorderPoint: Math.max(5, Math.floor(burnRate * 24)), // 24 hours of buffer
          velocityTrend: velocityTrend,
          status: status
        }
      });
      snapshots++;
    } catch (e) {
      // Continue on error (might be duplicates)
    }
  }
  console.log(`   ✅ Inventory snapshots: ${snapshots}\n`);

  // 4. Summary
  console.log('📊 Data Summary:');
  const orders = await db.order.count({ where: { shop: SHOP } });
  const productsCount = await db.product.count({ where: { shop: SHOP } });
  console.log(`   Orders: ${orders}`);
  console.log(`   Products: ${productsCount}`);
  console.log(`   Snapshots: ${snapshots}`);
  console.log(`   Alert Rules: ${rules}`);

  console.log('\n✅ War Room data populated!');
  console.log('\n🔄 Now refresh your dashboard: http://localhost:39607/app/war-room\n');

  process.exit(0);
}

populate().catch(console.error);
