/**
 * Test that alerts route can load without errors
 */

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function testAlertsRoute() {
  console.log('🧪 Testing Alerts Route Dependencies\n');

  try {
    const shop = 'control-tower-2.myshopify.com';

    // Test 1: Check AlertRule model
    console.log('✅ Test 1: Checking AlertRule model...');
    const ruleCount = await db.alertRule.count({ where: { shop } });
    console.log(`   Found ${ruleCount} alert rules for ${shop}`);

    // Test 2: Check AlertHistory model
    console.log('\n✅ Test 2: Checking AlertHistory model...');
    const historyCount = await db.alertHistory.count({ where: { shop } });
    console.log(`   Found ${historyCount} alert history entries`);

    // Test 3: Check NotificationPreference model
    console.log('\n✅ Test 3: Checking NotificationPreference model...');
    const prefs = await db.notificationPreference.findFirst({ where: { shop } });
    console.log(`   Preferences: ${prefs ? 'Found' : 'Not found (will be created)'}`);

    // Test 4: Simulate loader queries
    console.log('\n✅ Test 4: Simulating alerts route loader...');
    const [activeAlerts, alertHistory, allRules] = await Promise.all([
      db.alertHistory.findMany({
        where: { shop, acknowledged: false, resolvedAt: null },
        take: 50,
      }),
      db.alertHistory.findMany({
        where: { shop },
        orderBy: { triggeredAt: 'desc' },
        take: 50,
      }),
      db.alertRule.findMany({ where: { shop } }),
    ]);

    console.log(`   Active alerts: ${activeAlerts.length}`);
    console.log(`   Alert history: ${alertHistory.length}`);
    console.log(`   Alert rules: ${allRules.length}`);

    console.log('\n✅ All tests passed! Alerts route should load without errors.');

    await db.$disconnect();
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testAlertsRoute();
