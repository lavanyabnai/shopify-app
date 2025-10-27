/**
 * Verify War Room Baseline Metrics
 *
 * Tests all War Room services with baseline data and generates a report
 *
 * Usage: npx tsx verify-war-room-baseline.ts
 */

import db from "./app/db.server";
import { calculateDEFCON, getLatestDEFCON } from "./app/services/defcon-calculator.server";
import { calculateRevenueRisk, getTopAtRiskProducts } from "./app/services/revenue-risk.server";
import { detectVelocityAnomalies } from "./app/services/velocity-detector.server";
import { generatePredictions } from "./app/services/prediction-engine.server";
import { evaluateAlertRules, createDefaultAlertRules } from "./app/services/alert-engine.server";
import { generateRecommendations } from "./app/services/recommendation-engine.server";
import cache from "./app/services/cache.server";

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message: string;
  details?: any;
}

async function runTest(
  name: string,
  testFn: () => Promise<any>
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const result = await testFn();
    const duration = Date.now() - startTime;

    return {
      name,
      status: 'pass',
      duration,
      message: `Completed in ${duration}ms`,
      details: result,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    return {
      name,
      status: 'fail',
      duration,
      message: error.message || 'Unknown error',
    };
  }
}

async function testDEFCONCalculation(shop: string): Promise<any> {
  console.log('   Testing DEFCON calculation...');

  const defcon = await calculateDEFCON(shop);

  // Verify structure
  if (!defcon.level || defcon.level < 1 || defcon.level > 5) {
    throw new Error(`Invalid DEFCON level: ${defcon.level}`);
  }

  // Baseline should be DEFCON 4-5 (normal)
  if (defcon.level <= 3) {
    console.log(`   ⚠️  Warning: DEFCON ${defcon.level} - Expected 4-5 for baseline`);
  }

  return {
    level: defcon.level,
    label: defcon.label,
    riskScore: defcon.riskScore,
    coverageHours: defcon.inventoryCoverageHours,
    criticalSKUs: defcon.criticalSKUs,
    warningSKUs: defcon.warningSKUs,
    healthySKUs: defcon.healthySKUs,
  };
}

async function testRevenueRisk(shop: string): Promise<any> {
  console.log('   Testing revenue risk calculation...');

  const risks = await calculateRevenueRisk(shop);

  // Verify we get 3 time windows
  if (risks.length !== 3) {
    throw new Error(`Expected 3 risk windows, got ${risks.length}`);
  }

  return {
    '24h': {
      revenue: risks[0].totalRevenue,
      expectedLoss: risks[0].expectedLoss,
      affectedSKUs: risks[0].affectedSKUs,
    },
    '48h': {
      revenue: risks[1].totalRevenue,
      expectedLoss: risks[1].expectedLoss,
      affectedSKUs: risks[1].affectedSKUs,
    },
    '72h': {
      revenue: risks[2].totalRevenue,
      expectedLoss: risks[2].expectedLoss,
      affectedSKUs: risks[2].affectedSKUs,
    },
  };
}

async function testVelocityDetection(shop: string): Promise<any> {
  console.log('   Testing velocity anomaly detection...');

  const anomalies = await detectVelocityAnomalies(shop);

  return {
    totalAnomalies: anomalies.totalAnomalies,
    viral: anomalies.viralProducts,
    accelerating: anomalies.acceleratingProducts,
    deadStock: anomalies.deadStockProducts,
    categorySurges: anomalies.categorySurges,
  };
}

async function testPredictions(shop: string): Promise<any> {
  console.log('   Testing prediction engine...');

  const predictions = await generatePredictions(shop);

  if (predictions.totalSKUs === 0) {
    throw new Error('No predictions generated');
  }

  return {
    totalSKUs: predictions.totalSKUs,
    criticalSKUs: predictions.criticalSKUs,
    highRiskSKUs: predictions.highRiskSKUs,
    categories: predictions.categoryForecasts.length,
  };
}

async function testAlertRules(shop: string): Promise<any> {
  console.log('   Testing alert engine...');

  // Create default rules if they don't exist
  await createDefaultAlertRules(shop);

  // Evaluate rules
  const triggers = await evaluateAlertRules(shop);

  const rules = await db.alertRule.count({ where: { shop, active: true } });

  return {
    activeRules: rules,
    triggeredAlerts: triggers.length,
    triggers: triggers.map(t => ({ type: t.alertType, severity: t.severity })),
  };
}

async function testRecommendations(shop: string): Promise<any> {
  console.log('   Testing recommendation engine...');

  const recommendations = await generateRecommendations(shop);

  return {
    total: recommendations.length,
    byType: {
      transfer: recommendations.filter(r => r.type === 'transfer').length,
      reorder: recommendations.filter(r => r.type === 'reorder').length,
      priceAdjustment: recommendations.filter(r => r.type === 'price_adjustment').length,
      trafficThrottle: recommendations.filter(r => r.type === 'traffic_throttle').length,
    },
    critical: recommendations.filter(r => r.urgency === 'critical').length,
    high: recommendations.filter(r => r.urgency === 'high').length,
  };
}

async function testCachePerformance(shop: string): Promise<any> {
  console.log('   Testing cache performance...');

  const key = `test:baseline:${Date.now()}`;
  const testData = { shop, timestamp: Date.now(), test: true };

  // Test set
  const setStart = Date.now();
  await cache.set(key, testData, 60);
  const setDuration = Date.now() - setStart;

  // Test get
  const getStart = Date.now();
  const retrieved = await cache.get(key);
  const getDuration = Date.now() - getStart;

  // Test delete (skip if method doesn't exist - cache will auto-expire)
  let delDuration = 0;
  try {
    const delStart = Date.now();
    if (typeof cache.delete === 'function') {
      await cache.delete(key);
    } else if (typeof (cache as any).del === 'function') {
      await (cache as any).del(key);
    }
    delDuration = Date.now() - delStart;
  } catch (e) {
    // Cache delete not critical - key will expire naturally
    delDuration = 0;
  }

  if (!retrieved || retrieved.shop !== shop) {
    throw new Error('Cache get/set failed');
  }

  return {
    setDuration,
    getDuration,
    delDuration,
    working: true,
  };
}

async function testDatabasePerformance(shop: string): Promise<any> {
  console.log('   Testing database performance...');

  // Test order query
  const orderStart = Date.now();
  const orders = await db.order.count({
    where: {
      shop,
      processedAt: {
        gte: new Date('2025-10-01'),
      },
    },
  });
  const orderDuration = Date.now() - orderStart;

  // Test product query
  const productStart = Date.now();
  const products = await db.product.findMany({
    where: { shop, status: 'active' },
    take: 10,
  });
  const productDuration = Date.now() - productStart;

  // Test inventory snapshot query
  const snapshotStart = Date.now();
  const snapshots = await db.inventorySnapshot.findMany({
    where: { shop },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const snapshotDuration = Date.now() - snapshotStart;

  return {
    orderQuery: orderDuration,
    productQuery: productDuration,
    snapshotQuery: snapshotDuration,
    totalOrders: orders,
    totalProducts: products.length,
    totalSnapshots: snapshots.length,
  };
}

async function generateReport(shop: string, results: TestResult[]) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 WAR ROOM BASELINE VERIFICATION REPORT');
  console.log('='.repeat(70));
  console.log(`Shop: ${shop}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('='.repeat(70) + '\n');

  // Test results
  console.log('🧪 TEST RESULTS');
  console.log('─'.repeat(70));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warned = results.filter(r => r.status === 'warn').length;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    const duration = `${result.duration}ms`.padStart(8);
    console.log(`${icon} ${result.name.padEnd(35)} ${duration} | ${result.message}`);

    if (result.details) {
      const details = JSON.stringify(result.details, null, 2)
        .split('\n')
        .map(line => '      ' + line)
        .join('\n');
      console.log(details);
    }
  });

  console.log('─'.repeat(70));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Warnings: ${warned}`);

  // Performance summary
  console.log('\n⚡ PERFORMANCE SUMMARY');
  console.log('─'.repeat(70));

  const defconTest = results.find(r => r.name === 'DEFCON Calculation');
  const revenueTest = results.find(r => r.name === 'Revenue Risk');
  const velocityTest = results.find(r => r.name === 'Velocity Detection');
  const predictionTest = results.find(r => r.name === 'Predictions');
  const cacheTest = results.find(r => r.name === 'Cache Performance');
  const dbTest = results.find(r => r.name === 'Database Performance');

  if (defconTest) {
    const target = 50; // 50ms target
    const status = defconTest.duration < target ? '✅' : '⚠️';
    console.log(`${status} DEFCON Calculation: ${defconTest.duration}ms (target: <${target}ms)`);
  }

  if (revenueTest) {
    const target = 200; // 200ms target
    const status = revenueTest.duration < target ? '✅' : '⚠️';
    console.log(`${status} Revenue Risk: ${revenueTest.duration}ms (target: <${target}ms)`);
  }

  if (velocityTest) {
    const target = 200; // 200ms target
    const status = velocityTest.duration < target ? '✅' : '⚠️';
    console.log(`${status} Velocity Detection: ${velocityTest.duration}ms (target: <${target}ms)`);
  }

  if (predictionTest) {
    const target = 500; // 500ms target
    const status = predictionTest.duration < target ? '✅' : '⚠️';
    console.log(`${status} Predictions: ${predictionTest.duration}ms (target: <${target}ms)`);
  }

  if (cacheTest && cacheTest.details) {
    console.log(`\nCache Operations:`);
    console.log(`   Set: ${cacheTest.details.setDuration}ms`);
    console.log(`   Get: ${cacheTest.details.getDuration}ms`);
    console.log(`   Del: ${cacheTest.details.delDuration}ms`);
  }

  if (dbTest && dbTest.details) {
    console.log(`\nDatabase Queries:`);
    console.log(`   Order query: ${dbTest.details.orderQuery}ms`);
    console.log(`   Product query: ${dbTest.details.productQuery}ms`);
    console.log(`   Snapshot query: ${dbTest.details.snapshotQuery}ms`);
  }

  // Data summary
  console.log('\n📊 DATA SUMMARY');
  console.log('─'.repeat(70));

  const defconDetails = defconTest?.details;
  if (defconDetails) {
    console.log(`DEFCON Status:`);
    console.log(`   Level: DEFCON ${defconDetails.level} (${defconDetails.label})`);
    console.log(`   Risk Score: ${defconDetails.riskScore}/100`);
    console.log(`   Coverage: ${defconDetails.coverageHours?.toFixed(1)}h`);
    console.log(`   Critical SKUs: ${defconDetails.criticalSKUs}`);
    console.log(`   Warning SKUs: ${defconDetails.warningSKUs}`);
    console.log(`   Healthy SKUs: ${defconDetails.healthySKUs}`);
  }

  const revenueDetails = revenueTest?.details;
  if (revenueDetails) {
    console.log(`\nRevenue at Risk:`);
    console.log(`   24h: $${revenueDetails['24h']?.expectedLoss?.toFixed(2)} (${revenueDetails['24h']?.affectedSKUs} SKUs)`);
    console.log(`   48h: $${revenueDetails['48h']?.expectedLoss?.toFixed(2)} (${revenueDetails['48h']?.affectedSKUs} SKUs)`);
    console.log(`   72h: $${revenueDetails['72h']?.expectedLoss?.toFixed(2)} (${revenueDetails['72h']?.affectedSKUs} SKUs)`);
  }

  const velocityDetails = velocityTest?.details;
  if (velocityDetails) {
    console.log(`\nVelocity Anomalies:`);
    console.log(`   Total: ${velocityDetails.totalAnomalies}`);
    console.log(`   Viral: ${velocityDetails.viral}`);
    console.log(`   Accelerating: ${velocityDetails.accelerating}`);
    console.log(`   Dead Stock: ${velocityDetails.deadStock}`);
    console.log(`   Category Surges: ${velocityDetails.categorySurges}`);
  }

  // Overall status
  console.log('\n' + '='.repeat(70));
  if (failed === 0) {
    console.log('✅ BASELINE VERIFICATION: PASSED');
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Review baseline DEFCON level (should be 4-5)');
    console.log('   2. Check War Room dashboard: /app/war-room');
    console.log('   3. Ready for Session 2: BFCM Day simulation');
  } else {
    console.log('❌ BASELINE VERIFICATION: FAILED');
    console.log('\n⚠️  Fix the issues above before proceeding to Session 2');
  }
  console.log('='.repeat(70) + '\n');
}

async function main() {
  console.log('\n🚀 WAR ROOM BASELINE VERIFICATION\n');

  const session = await db.session.findFirst();

  if (!session) {
    console.error('❌ No session found. Please authenticate with Shopify first.');
    process.exit(1);
  }

  const shop = session.shop;
  console.log(`Testing shop: ${shop}\n`);

  const results: TestResult[] = [];

  // Run all tests
  console.log('🧪 Running tests...\n');

  results.push(await runTest('DEFCON Calculation', () => testDEFCONCalculation(shop)));
  results.push(await runTest('Revenue Risk', () => testRevenueRisk(shop)));
  results.push(await runTest('Velocity Detection', () => testVelocityDetection(shop)));
  results.push(await runTest('Predictions', () => testPredictions(shop)));
  results.push(await runTest('Alert Rules', () => testAlertRules(shop)));
  results.push(await runTest('Recommendations', () => testRecommendations(shop)));
  results.push(await runTest('Cache Performance', () => testCachePerformance(shop)));
  results.push(await runTest('Database Performance', () => testDatabasePerformance(shop)));

  // Generate report
  await generateReport(shop, results);

  await db.$disconnect();

  // Exit with error code if any tests failed
  const failed = results.filter(r => r.status === 'fail').length;
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
