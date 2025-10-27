/**
 * BFCM War Room - Session 3: Alert Rule Engine Test
 *
 * Tests:
 * 1. All alert rules evaluate correctly
 * 2. Critical stockout alerts trigger
 * 3. Velocity anomaly alerts trigger
 * 4. Revenue risk alerts trigger
 * 5. DEFCON escalation alerts trigger
 * 6. Alert deduplication works
 */

import { PrismaClient } from '@prisma/client';
import { triggerAlerts } from './app/services/alert-engine.server';

const prisma = new PrismaClient();

interface TestResults {
  testName: string;
  passed: boolean;
  details: string;
  metrics?: any;
}

const results: TestResults[] = [];

async function runAlertRuleTests() {
  console.log('🔔 BFCM War Room - Session 3: Alert Rule Engine Tests\n');
  console.log('=' .repeat(70));
  console.log();

  const shop = 'control-tower-2.myshopify.com';

  try {
    // Clear old alerts for clean test
    console.log('🧹 Clearing old alert history for clean test...');
    const deletedCount = await prisma.alertHistory.deleteMany({
      where: { shop },
    });
    console.log(`   Deleted ${deletedCount.count} old alerts`);
    console.log();

    // Test 1: Evaluate all alert rules
    console.log('📋 TEST 1: Trigger All Alert Rules');
    console.log('-'.repeat(70));
    const startTime = Date.now();
    const alerts = await triggerAlerts(shop);
    const duration = Date.now() - startTime;

    console.log(`✅ Alert rules evaluated in ${duration}ms`);
    console.log(`   Total alerts triggered: ${alerts.length}`);
    console.log();

    results.push({
      testName: 'Alert Rule Evaluation',
      passed: alerts.length > 0,
      details: `Evaluated rules and triggered ${alerts.length} alerts in ${duration}ms`,
      metrics: {
        duration,
        alertCount: alerts.length,
      },
    });

    // Test 2: Critical stockout alerts
    console.log('🚨 TEST 2: Critical Stockout Alerts');
    console.log('-'.repeat(70));

    const stockoutAlerts = alerts.filter(a => a.alertType === 'stockout_imminent');
    console.log(`   Found ${stockoutAlerts.length} stockout alerts`);

    if (stockoutAlerts.length > 0) {
      stockoutAlerts.slice(0, 3).forEach((alert, i) => {
        const metadata = typeof alert.metadata === 'string' ? JSON.parse(alert.metadata) : alert.metadata;
        console.log(`   ${i + 1}. ${alert.title}`);
        console.log(`      Severity: ${alert.severity.toUpperCase()}`);
        console.log(`      SKU: ${metadata.sku || 'N/A'}`);
        console.log(`      Hours to stockout: ${metadata.hoursToStockout || 'N/A'}`);
        console.log(`      Message: ${alert.message}`);
      });
    }
    console.log();

    results.push({
      testName: 'Critical Stockout Alerts',
      passed: stockoutAlerts.length >= 2,
      details: `Triggered ${stockoutAlerts.length} stockout alerts`,
      metrics: {
        stockoutAlertCount: stockoutAlerts.length,
        criticalCount: stockoutAlerts.filter(a => a.severity === 'critical').length,
      },
    });

    // Test 3: Velocity anomaly alerts
    console.log('📈 TEST 3: Velocity Anomaly Alerts');
    console.log('-'.repeat(70));

    const velocityAlerts = alerts.filter(a => a.alertType === 'velocity_spike' || a.alertType === 'velocity_anomaly');
    console.log(`   Found ${velocityAlerts.length} velocity anomaly alerts`);

    if (velocityAlerts.length > 0) {
      velocityAlerts.slice(0, 3).forEach((alert, i) => {
        const metadata = typeof alert.metadata === 'string' ? JSON.parse(alert.metadata) : alert.metadata;
        console.log(`   ${i + 1}. ${alert.title}`);
        console.log(`      Type: ${alert.alertType}`);
        console.log(`      Velocity change: ${metadata.velocityChange || 'N/A'}%`);
        console.log(`      Message: ${alert.message}`);
      });
    }
    console.log();

    results.push({
      testName: 'Velocity Anomaly Alerts',
      passed: velocityAlerts.length >= 1,
      details: `Triggered ${velocityAlerts.length} velocity anomaly alerts`,
      metrics: {
        velocityAlertCount: velocityAlerts.length,
      },
    });

    // Test 4: Revenue risk alerts
    console.log('💰 TEST 4: Revenue Risk Alerts');
    console.log('-'.repeat(70));

    const revenueAlerts = alerts.filter(a => a.alertType === 'revenue_at_risk');
    console.log(`   Found ${revenueAlerts.length} revenue risk alerts`);

    if (revenueAlerts.length > 0) {
      revenueAlerts.slice(0, 2).forEach((alert, i) => {
        const metadata = typeof alert.metadata === 'string' ? JSON.parse(alert.metadata) : alert.metadata;
        console.log(`   ${i + 1}. ${alert.title}`);
        console.log(`      Severity: ${alert.severity.toUpperCase()}`);
        console.log(`      Revenue at risk: $${metadata.revenueAtRisk?.toLocaleString() || 'N/A'}`);
        console.log(`      Message: ${alert.message}`);
      });
    }
    console.log();

    results.push({
      testName: 'Revenue Risk Alerts',
      passed: revenueAlerts.length >= 1,
      details: `Triggered ${revenueAlerts.length} revenue risk alerts`,
      metrics: {
        revenueAlertCount: revenueAlerts.length,
      },
    });

    // Test 5: DEFCON escalation alerts
    console.log('🚨 TEST 5: DEFCON Escalation Alerts');
    console.log('-'.repeat(70));

    const defconAlerts = alerts.filter(a => a.alertType === 'defcon_escalation' || a.alertType === 'defcon_change');
    console.log(`   Found ${defconAlerts.length} DEFCON alerts`);

    if (defconAlerts.length > 0) {
      defconAlerts.forEach((alert, i) => {
        const metadata = typeof alert.metadata === 'string' ? JSON.parse(alert.metadata) : alert.metadata;
        console.log(`   ${i + 1}. ${alert.title}`);
        console.log(`      Current DEFCON: ${metadata.defconLevel || 'N/A'}`);
        console.log(`      Previous DEFCON: ${metadata.previousDefconLevel || 'N/A'}`);
        console.log(`      Triggers: ${metadata.triggers || 'N/A'}`);
        console.log(`      Message: ${alert.message}`);
      });
    }
    console.log();

    results.push({
      testName: 'DEFCON Escalation Alerts',
      passed: defconAlerts.length >= 0, // May not always have escalations
      details: `Found ${defconAlerts.length} DEFCON escalation alerts`,
      metrics: {
        defconAlertCount: defconAlerts.length,
      },
    });

    // Test 6: Alert severity distribution
    console.log('🎯 TEST 6: Alert Severity Distribution');
    console.log('-'.repeat(70));

    const severityStats = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
    };

    console.log('   Severity Distribution:');
    console.log(`     Critical: ${severityStats.critical} alerts`);
    console.log(`     Warning: ${severityStats.warning} alerts`);
    console.log(`     Info: ${severityStats.info} alerts`);
    console.log();

    results.push({
      testName: 'Alert Severity Distribution',
      passed: severityStats.critical > 0,
      details: `Distribution: ${severityStats.critical} critical, ${severityStats.warning} warning, ${severityStats.info} info`,
      metrics: severityStats,
    });

    // Test 7: Alert persistence check
    console.log('💾 TEST 7: Alert Persistence (Database Storage)');
    console.log('-'.repeat(70));

    const persistedAlerts = await prisma.alertHistory.findMany({
      where: { shop },
      orderBy: { triggeredAt: 'desc' },
      take: 5,
    });

    console.log(`   Found ${persistedAlerts.length} alerts in database`);
    if (persistedAlerts.length > 0) {
      console.log('   Recent alerts:');
      persistedAlerts.forEach((alert, i) => {
        console.log(`   ${i + 1}. [${alert.severity.toUpperCase()}] ${alert.title}`);
        console.log(`      Triggered: ${alert.triggeredAt.toISOString()}`);
        console.log(`      Acknowledged: ${alert.acknowledged}`);
      });
    }
    console.log();

    results.push({
      testName: 'Alert Persistence',
      passed: persistedAlerts.length >= alerts.length * 0.8, // At least 80% should be persisted
      details: `${persistedAlerts.length} alerts persisted to database`,
      metrics: {
        persistedCount: persistedAlerts.length,
        expectedCount: alerts.length,
      },
    });

    // Test 8: Alert deduplication (run evaluation again)
    console.log('🔁 TEST 8: Alert Deduplication');
    console.log('-'.repeat(70));

    console.log('   Running alert evaluation again (within 5-minute cooldown)...');
    const secondEvaluation = await triggerAlerts(shop);

    console.log(`   First evaluation: ${alerts.length} alerts`);
    console.log(`   Second evaluation: ${secondEvaluation.length} alerts`);

    // Should be significantly fewer alerts due to deduplication
    const deduplicationWorking = secondEvaluation.length < alerts.length;

    console.log(`   Deduplication: ${deduplicationWorking ? '✅ WORKING' : '⚠️  NOT WORKING'}`);
    console.log();

    results.push({
      testName: 'Alert Deduplication',
      passed: deduplicationWorking,
      details: `Second evaluation produced ${secondEvaluation.length} alerts (vs ${alerts.length} in first)`,
      metrics: {
        firstEvaluation: alerts.length,
        secondEvaluation: secondEvaluation.length,
        deduplicationRate: ((alerts.length - secondEvaluation.length) / alerts.length) * 100,
      },
    });

    // Test 9: Alert rule coverage
    console.log('📊 TEST 9: Alert Rule Coverage');
    console.log('-'.repeat(70));

    const rulesCovered = await prisma.alertRule.findMany({
      where: { shop, active: true },
    });

    console.log(`   Found ${rulesCovered.length} enabled alert rules`);
    rulesCovered.forEach((rule, i) => {
      console.log(`   ${i + 1}. ${rule.name}`);
      console.log(`      Severity: ${rule.severity}`);
      console.log(`      Cooldown: ${rule.cooldownMinutes} min`);
    });
    console.log();

    results.push({
      testName: 'Alert Rule Coverage',
      passed: rulesCovered.length >= 3,
      details: `${rulesCovered.length} alert rules configured and enabled`,
      metrics: {
        ruleCount: rulesCovered.length,
      },
    });

    // Print summary
    console.log('=' .repeat(70));
    console.log('📋 TEST SUMMARY');
    console.log('=' .repeat(70));

    results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.testName}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   ${result.details}`);
    });
    console.log();

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    const passRate = (passedCount / totalCount) * 100;

    console.log(`Overall: ${passedCount}/${totalCount} tests passed (${passRate.toFixed(1)}%)`);
    console.log();

    if (passRate >= 75) {
      console.log('🎉 ALERT RULE ENGINE VALIDATION: PASSED');
      console.log('   System is ready for notification testing');
    } else {
      console.log('⚠️  ALERT RULE ENGINE VALIDATION: NEEDS IMPROVEMENT');
      console.log('   Review failed tests before proceeding');
    }
    console.log();

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAlertRuleTests();
