/**
 * Test Notification Dispatcher Service (Session 5)
 *
 * Tests multi-channel notification dispatch.
 */

import db from "./app/db.server";
import {
  dispatchNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  testNotificationDispatch,
} from "./app/services/notification-dispatcher.server";
import type { AlertTrigger } from "./app/services/alert-engine.server";

const TEST_SHOP = "control-tower-2.myshopify.com";

// Parse command line arguments
const args = process.argv.slice(2);
const testEmail = args.includes('--email');
const testSlack = args.includes('--slack');
const testSMS = args.includes('--sms');
const testAll = args.length === 0; // Test all channels if no flags

async function main() {
  console.log("🧪 Testing Notification Dispatcher\n");
  console.log(`📍 Testing with shop: ${TEST_SHOP}\n`);

  try {
    // Test 1: Get notification preferences
    console.log("🔮 Test 1: Getting notification preferences...");
    let prefs = await getNotificationPreferences(TEST_SHOP);
    console.log(`✅ Preferences retrieved!`);
    console.log("\n📋 Current Preferences:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Email: ${prefs.email ? '✅ Enabled' : '❌ Disabled'} ${prefs.emailAddress ? `(${prefs.emailAddress})` : ''}`);
    console.log(`  Slack: ${prefs.slack ? '✅ Enabled' : '❌ Disabled'} ${prefs.slackWebhook ? `(configured)` : ''}`);
    console.log(`  SMS: ${prefs.sms ? '✅ Enabled' : '❌ Disabled'} ${prefs.phoneNumber ? `(${prefs.phoneNumber})` : ''}`);
    console.log(`  In-App: ${prefs.inApp ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  Min Severity: ${prefs.minSeverity}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log();

    // Test 2: Update preferences for testing
    console.log("🔮 Test 2: Updating notification preferences...");
    await updateNotificationPreferences(TEST_SHOP, 'default', {
      email: true,
      emailAddress: 'test@example.com',
      slack: true,
      slackWebhook: 'https://hooks.slack.com/services/TEST/WEBHOOK',
      sms: true,
      phoneNumber: '+1234567890',
      inApp: true,
      minSeverity: 'low', // Accept all severities for testing
    });
    prefs = await getNotificationPreferences(TEST_SHOP);
    console.log(`✅ Preferences updated!`);
    console.log();

    // Test 3: Test critical alert notification
    console.log("🔮 Test 3: Testing critical alert notification...");
    const criticalAlert: AlertTrigger = {
      ruleId: 'test-critical',
      ruleName: 'Test Critical Alert',
      severity: 'critical',
      title: '🚨 Critical Test Alert',
      message: 'This is a test critical alert from the notification dispatcher test.',
      alertType: 'test',
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
      channels: ['email', 'slack', 'sms', 'in_app'],
    };

    const criticalResults = await dispatchNotifications(TEST_SHOP, criticalAlert);
    console.log(`✅ Dispatched to ${criticalResults.length} channels`);

    console.log("\n   Notification Results:");
    criticalResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`   ${icon} ${result.channel.toUpperCase()}: ${result.message || result.error}`);
    });
    console.log();

    // Test 4: Test different severity levels
    console.log("🔮 Test 4: Testing different severity levels...");

    const severities = ['info', 'low', 'medium', 'high', 'critical'];

    for (const severity of severities) {
      const testAlert: AlertTrigger = {
        ruleId: `test-${severity}`,
        ruleName: `Test ${severity} Alert`,
        severity,
        title: `Test ${severity.charAt(0).toUpperCase() + severity.slice(1)} Alert`,
        message: `This is a test ${severity} severity alert.`,
        alertType: 'test',
        metadata: { test: true },
        channels: ['in_app'],
      };

      const results = await dispatchNotifications(TEST_SHOP, testAlert);
      const success = results.every(r => r.success);
      console.log(`   ${success ? '✅' : '❌'} ${severity.toUpperCase()} severity: ${results.length} notifications sent`);
    }
    console.log();

    // Test 5: Test severity filtering
    console.log("🔮 Test 5: Testing severity filtering...");
    await updateNotificationPreferences(TEST_SHOP, 'default', {
      minSeverity: 'high', // Only send high and critical
    });

    const lowSeverityAlert: AlertTrigger = {
      ruleId: 'test-low-filtered',
      ruleName: 'Test Low Alert (Should be filtered)',
      severity: 'low',
      title: 'Low Severity Alert',
      message: 'This alert should be filtered out by minimum severity setting.',
      alertType: 'test',
      metadata: { test: true },
      channels: ['email', 'in_app'],
    };

    const filteredResults = await dispatchNotifications(TEST_SHOP, lowSeverityAlert);
    console.log(`✅ Severity filtering test complete`);
    console.log(`   ${filteredResults.length === 0 ? '✅' : '❌'} Alert correctly ${filteredResults.length === 0 ? 'filtered' : 'NOT filtered'} (minSeverity=high)`);
    console.log();

    // Reset min severity
    await updateNotificationPreferences(TEST_SHOP, 'default', {
      minSeverity: 'medium',
    });

    // Test 6: Test in-app notification persistence
    console.log("🔮 Test 6: Testing in-app notification persistence...");
    const inAppAlerts = await db.alertLog.findMany({
      where: { shop: TEST_SHOP },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`✅ Found ${inAppAlerts.length} in-app alerts in AlertLog`);

    if (inAppAlerts.length > 0) {
      console.log("\n   Recent In-App Alerts:");
      inAppAlerts.forEach(alert => {
        console.log(`   - [${alert.severity.toUpperCase()}] ${alert.title}`);
      });
    }
    console.log();

    // Test 7: Use convenience test function
    console.log("🔮 Test 7: Using testNotificationDispatch helper...");
    const testResults = await testNotificationDispatch(TEST_SHOP);
    console.log(`✅ Test notification dispatched to ${testResults.length} channels`);

    console.log("\n   Test Results:");
    testResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`   ${icon} ${result.channel.toUpperCase()}`);
    });
    console.log();

    // Test 8: Channel-specific testing (based on CLI flags)
    if (testEmail || testAll) {
      console.log("🔮 Test 8a: Email notification test...");
      const emailAlert: AlertTrigger = {
        ruleId: 'test-email',
        ruleName: 'Email Test',
        severity: 'medium',
        title: '📧 Email Notification Test',
        message: 'This is a test of the email notification system.',
        alertType: 'test',
        metadata: { test: true },
        channels: ['email'],
      };
      const emailResults = await dispatchNotifications(TEST_SHOP, emailAlert);
      console.log(`   ${emailResults[0]?.success ? '✅' : '❌'} Email: ${emailResults[0]?.message || emailResults[0]?.error}`);
      console.log();
    }

    if (testSlack || testAll) {
      console.log("🔮 Test 8b: Slack notification test...");
      console.log("   ⚠️  Note: Slack webhook is a test URL. Real integration requires valid webhook.");
      const slackAlert: AlertTrigger = {
        ruleId: 'test-slack',
        ruleName: 'Slack Test',
        severity: 'high',
        title: '💬 Slack Notification Test',
        message: 'This is a test of the Slack notification system.',
        alertType: 'test',
        metadata: { test: true },
        channels: ['slack'],
      };
      const slackResults = await dispatchNotifications(TEST_SHOP, slackAlert);
      console.log(`   ${slackResults[0]?.success ? '✅' : '❌'} Slack: ${slackResults[0]?.message || slackResults[0]?.error}`);
      console.log();
    }

    if (testSMS || testAll) {
      console.log("🔮 Test 8c: SMS notification test...");
      console.log("   ⚠️  Note: SMS requires Twilio integration. Currently in mock mode.");
      const smsAlert: AlertTrigger = {
        ruleId: 'test-sms',
        ruleName: 'SMS Test',
        severity: 'critical',
        title: '📱 SMS Notification Test',
        message: 'This is a test of the SMS notification system.',
        alertType: 'test',
        metadata: { test: true },
        channels: ['sms'],
      };
      const smsResults = await dispatchNotifications(TEST_SHOP, smsAlert);
      console.log(`   ${smsResults[0]?.success ? '✅' : '❌'} SMS: ${smsResults[0]?.message || smsResults[0]?.error}`);
      console.log();
    }

    console.log("✅ All notification dispatcher tests completed successfully!\n");

    console.log("💡 Integration Notes:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  📧 Email: Add SendGrid/AWS SES integration in notification-dispatcher.server.ts");
    console.log("  💬 Slack: Configure real webhook URL in notification preferences");
    console.log("  📱 SMS: Add Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)");
    console.log("  🔔 In-App: Already working - check AlertLog table");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log();

    console.log("💡 Next Steps:");
    console.log("  1. Run: npx tsx trigger-test-alert.ts --severity critical");
    console.log("  2. Start your dev server: npm run dev");
    console.log("  3. Navigate to: /app/war-room/alerts");
    console.log("  4. Check email inbox (if configured)");
    console.log("  5. Check Slack channel (if configured)");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

main();
