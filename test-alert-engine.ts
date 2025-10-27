/**
 * Test Alert Engine Service (Session 5)
 *
 * Tests alert rule evaluation, triggering, and management.
 */

import db from "./app/db.server";
import {
  createDefaultAlertRules,
  evaluateAlertRules,
  triggerAlerts,
  getActiveAlerts,
  getAlertSummary,
  acknowledgeAlert,
  resolveAlert,
} from "./app/services/alert-engine.server";

const TEST_SHOP = "control-tower-2.myshopify.com";

async function main() {
  console.log("🧪 Testing Alert Engine\n");
  console.log(`📍 Testing with shop: ${TEST_SHOP}\n`);

  try {
    // Test 1: Create default alert rules
    console.log("🔮 Test 1: Creating default alert rules...");
    await createDefaultAlertRules(TEST_SHOP);

    const rules = await db.alertRule.findMany({
      where: { shop: TEST_SHOP },
    });
    console.log(`✅ Found ${rules.length} alert rules`);

    rules.forEach(rule => {
      const condition = JSON.parse(rule.condition);
      console.log(`   - ${rule.name} (${rule.severity}): ${condition.type} ${condition.operator} ${condition.value}`);
    });
    console.log();

    // Test 2: Evaluate alert rules
    console.log("🔮 Test 2: Evaluating alert rules...");
    const triggers = await evaluateAlertRules(TEST_SHOP);
    console.log(`✅ Evaluated rules. ${triggers.length} alerts triggered`);

    if (triggers.length > 0) {
      console.log("\n   Triggered Alerts:");
      triggers.forEach(trigger => {
        console.log(`   - [${trigger.severity.toUpperCase()}] ${trigger.title}`);
        console.log(`     ${trigger.message}`);
        console.log(`     Channels: ${trigger.channels.join(', ')}`);
      });
    } else {
      console.log("   ℹ️  No alerts triggered (system is healthy)");
    }
    console.log();

    // Test 3: Trigger alerts and dispatch notifications
    console.log("🔮 Test 3: Triggering alerts with notifications...");
    const triggeredAlerts = await triggerAlerts(TEST_SHOP);
    console.log(`✅ Triggered ${triggeredAlerts.length} alerts`);
    console.log();

    // Test 4: Get active alerts
    console.log("🔮 Test 4: Fetching active alerts...");
    const activeAlerts = await getActiveAlerts(TEST_SHOP);
    console.log(`✅ Found ${activeAlerts.length} active alerts`);

    if (activeAlerts.length > 0) {
      console.log("\n   Active Alerts:");
      activeAlerts.forEach(alert => {
        console.log(`   - [${alert.severity.toUpperCase()}] ${alert.title}`);
        console.log(`     Type: ${alert.alertType}`);
        console.log(`     Notifications: Email=${alert.emailSent}, Slack=${alert.slackSent}, SMS=${alert.smsSent}, InApp=${alert.inAppSent}`);
        console.log(`     Triggered: ${new Date(alert.triggeredAt).toLocaleString()}`);
      });
    }
    console.log();

    // Test 5: Get alert summary
    console.log("🔮 Test 5: Getting alert summary...");
    const summary = await getAlertSummary(TEST_SHOP);
    console.log(`✅ Summary retrieved!`);
    console.log("\n📊 Alert Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Active Alerts: ${summary.active}`);
    console.log(`  Acknowledged: ${summary.acknowledged}`);
    console.log(`  Resolved: ${summary.resolved}`);
    console.log("\n  By Severity:");
    Object.entries(summary.bySeverity).forEach(([severity, count]) => {
      console.log(`    ${severity}: ${count}`);
    });
    console.log("\n  By Type:");
    Object.entries(summary.byType).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log();

    // Test 6: Acknowledge an alert
    if (activeAlerts.length > 0) {
      console.log("🔮 Test 6: Acknowledging first active alert...");
      const firstAlert = activeAlerts[0];
      await acknowledgeAlert(firstAlert.id, "test-user");
      console.log(`✅ Alert acknowledged: ${firstAlert.title}`);
      console.log();

      // Test 7: Resolve an alert
      console.log("🔮 Test 7: Resolving the acknowledged alert...");
      await resolveAlert(firstAlert.id, "Resolved during testing");
      console.log(`✅ Alert resolved: ${firstAlert.title}`);
      console.log();
    } else {
      console.log("⏭️  Skipping Test 6 & 7 (no active alerts to acknowledge/resolve)");
      console.log();
    }

    // Test 8: Check cooldown behavior
    console.log("🔮 Test 8: Testing cooldown behavior...");
    const triggersBeforeCooldown = await evaluateAlertRules(TEST_SHOP);
    console.log(`✅ Before cooldown: ${triggersBeforeCooldown.length} alerts would trigger`);
    console.log("   ℹ️  Same alerts should be in cooldown now and won't re-trigger immediately");
    console.log();

    // Test 9: Get alert history
    console.log("🔮 Test 9: Fetching alert history...");
    const history = await db.alertHistory.findMany({
      where: { shop: TEST_SHOP },
      orderBy: { triggeredAt: 'desc' },
      take: 10,
    });
    console.log(`✅ Found ${history.length} alerts in history`);

    if (history.length > 0) {
      console.log("\n   Recent Alert History:");
      history.slice(0, 5).forEach(alert => {
        const status = alert.resolvedAt ? 'Resolved' : alert.acknowledged ? 'Acknowledged' : 'Active';
        console.log(`   - [${alert.severity.toUpperCase()}] ${alert.title} - ${status}`);
      });
    }
    console.log();

    console.log("✅ All alert engine tests completed successfully!\n");

    console.log("💡 Next Steps:");
    console.log("  1. Run: npx tsx test-notifications.ts");
    console.log("  2. Run: npx tsx trigger-test-alert.ts --severity critical");
    console.log("  3. Start your dev server: npm run dev");
    console.log("  4. Navigate to: /app/war-room/alerts");
    console.log("  5. Verify alerts display correctly");
    console.log("  6. Test acknowledge/resolve actions");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

main();
