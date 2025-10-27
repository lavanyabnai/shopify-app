import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSession2State() {
  try {
    console.log('🔍 Validating Session 2 Completion...\n');

    // Check order counts
    const totalOrders = await prisma.order.count();
    const oct24Orders = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date('2025-10-24T00:00:00Z'),
        },
      },
    });

    console.log('📦 ORDER VALIDATION:');
    console.log(`   Total orders: ${totalOrders}`);
    console.log(`   Oct 24 orders: ${oct24Orders}`);
    console.log(`   ✅ Expected: 15,000+ total, 300-500 on Oct 24`);
    console.log();

    // Check War Room metrics
    const metrics = await prisma.warRoomMetrics.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (metrics) {
      console.log('🚨 DEFCON STATUS:');
      console.log(`   Level: DEFCON ${metrics.defconLevel}`);
      console.log(`   Risk Score: ${metrics.riskScore}/100`);
      console.log(`   Inventory Coverage: ${Math.round(metrics.inventoryCoverageHours)}h`);
      console.log(`   Velocity Anomaly: ${metrics.velocityAnomaly.toFixed(1)}%`);
      console.log(`   ✅ Expected: DEFCON 1-2, high risk score`);
      console.log();
    }

    // Check inventory snapshots
    const totalInventorySnapshots = await prisma.inventorySnapshot.count();
    const criticalInventory = await prisma.inventorySnapshot.count({
      where: {
        coverageHours: {
          lt: 48, // Less than 2 days
        },
      },
    });

    const stockoutInventory = await prisma.inventorySnapshot.count({
      where: {
        status: 'critical',
      },
    });

    console.log('📊 INVENTORY STATUS:');
    console.log(`   Total SKUs tracked: ${totalInventorySnapshots}`);
    console.log(`   Critical (<48h coverage): ${criticalInventory}`);
    console.log(`   Critical status: ${stockoutInventory}`);
    console.log(`   ✅ Expected: 5-10 critical SKUs`);
    console.log();

    // Calculate revenue at risk from critical inventory
    const criticalProducts = await prisma.inventorySnapshot.findMany({
      where: {
        coverageHours: { lt: 48 },
      },
      take: 10,
    });

    let estimatedRevenueAtRisk = 0;
    for (const item of criticalProducts) {
      // Estimate revenue at risk: burn rate * price * hours at risk
      // For simplicity, assume $50 average price
      const hoursAtRisk = Math.max(0, 48 - item.coverageHours);
      const unitsAtRisk = item.burnRate * hoursAtRisk;
      estimatedRevenueAtRisk += unitsAtRisk * 50; // $50 avg price
    }

    if (estimatedRevenueAtRisk > 0) {
      console.log('💰 ESTIMATED REVENUE AT RISK:');
      console.log(`   Next 48h: $${Math.round(estimatedRevenueAtRisk).toLocaleString()}`);
      console.log(`   ✅ Expected: $50K-$150K`);
      console.log();
    }

    // Check alerts
    const totalAlerts = await prisma.alertLog.count();
    const criticalAlerts = await prisma.alertLog.count({
      where: { severity: 'critical' },
    });

    console.log('🔔 ALERT STATUS:');
    console.log(`   Total alerts: ${totalAlerts}`);
    console.log(`   Critical alerts: ${criticalAlerts}`);
    console.log();

    // Validation summary
    console.log('✅ SESSION 2 VALIDATION SUMMARY:');
    const validations = [
      { name: 'Order data populated', pass: totalOrders > 10000 },
      { name: 'BFCM day orders present', pass: oct24Orders > 200 },
      { name: 'DEFCON critical state', pass: metrics?.defconLevel && metrics.defconLevel <= 2 },
      { name: 'Critical SKUs identified', pass: criticalInventory >= 3 },
      { name: 'Inventory tracking active', pass: totalInventorySnapshots > 0 },
      { name: 'System metrics calculated', pass: metrics !== null },
    ];

    validations.forEach(v => {
      console.log(`   ${v.pass ? '✅' : '❌'} ${v.name}`);
    });

    const allPassed = validations.every(v => v.pass);
    console.log();
    if (allPassed) {
      console.log('🎉 Session 2 validation PASSED - Ready for Session 3!');
      console.log();
      console.log('📋 SESSION 3 WILL TEST:');
      console.log('   1. Prediction Engine (4hr/24hr/72hr forecasts)');
      console.log('   2. Stockout countdown timers');
      console.log('   3. Alert rule evaluation');
      console.log('   4. Multi-channel notifications');
      console.log('   5. Alert dashboard functionality');
    } else {
      console.log('⚠️  Session 2 validation FAILED - Complete Session 2 first');
    }

    await prisma.$disconnect();
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkSession2State();
