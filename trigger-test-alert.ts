/**
 * Trigger Test Alert (Session 5)
 *
 * Manually trigger a test alert for development/testing.
 *
 * Usage:
 *   npx tsx trigger-test-alert.ts
 *   npx tsx trigger-test-alert.ts --severity critical
 *   npx tsx trigger-test-alert.ts --severity high --type stockout
 */

import { triggerManualAlert } from "./app/services/alert-engine.server";

const TEST_SHOP = "control-tower-2.myshopify.com";

// Parse command line arguments
const args = process.argv.slice(2);
const severityIndex = args.indexOf('--severity');
const typeIndex = args.indexOf('--type');

const severity = severityIndex !== -1 ? args[severityIndex + 1] : 'medium';
const alertType = typeIndex !== -1 ? args[typeIndex + 1] : 'test';

// Alert templates
const templates: Record<string, any> = {
  critical: {
    title: '🚨 CRITICAL: Immediate Action Required',
    message: 'Multiple products are approaching stockout within the next 4 hours. Review War Room dashboard immediately and execute recommended actions.',
  },
  high: {
    title: '⚠️ HIGH PRIORITY: Inventory Alert',
    message: 'Significant inventory risk detected. Several high-value products may stock out within 24 hours.',
  },
  medium: {
    title: '⚡ MEDIUM: Velocity Anomaly Detected',
    message: 'Unusual sales velocity detected on multiple products. Monitor closely for potential stockouts.',
  },
  low: {
    title: 'ℹ️ LOW: Inventory Notice',
    message: 'Minor inventory concern detected. No immediate action required, but review recommended.',
  },
  info: {
    title: '💡 INFO: System Update',
    message: 'War Room metrics have been updated. New recommendations are available.',
  },
};

// Alert type-specific messages
const typeMessages: Record<string, any> = {
  stockout: {
    title: '⏰ Stockout Countdown Alert',
    message: '3 products have critical stockout countdowns (<4 hours). Immediate restocking required.',
  },
  defcon: {
    title: '🚨 DEFCON Level Change',
    message: 'System has escalated to DEFCON 2. Risk score is elevated. Review all critical SKUs.',
  },
  velocity: {
    title: '📈 Velocity Spike Detected',
    message: '2 products showing viral behavior (300%+ velocity increase). Inventory may be insufficient.',
  },
  revenue_risk: {
    title: '💰 High Revenue Risk',
    message: 'Estimated $50,000+ in revenue at risk due to potential stockouts in next 48 hours.',
  },
};

async function main() {
  console.log("🔔 Triggering Test Alert\n");
  console.log(`📍 Shop: ${TEST_SHOP}`);
  console.log(`📊 Severity: ${severity.toUpperCase()}`);
  console.log(`🏷️  Type: ${alertType}\n`);

  try {
    // Get message template
    const template = typeMessages[alertType] || templates[severity] || templates.medium;

    // Add channels based on severity
    let channels: string[] = ['in_app'];

    if (severity === 'critical') {
      channels = ['email', 'slack', 'sms', 'in_app'];
    } else if (severity === 'high') {
      channels = ['email', 'slack', 'in_app'];
    } else if (severity === 'medium') {
      channels = ['email', 'in_app'];
    }

    console.log(`📨 Dispatching to channels: ${channels.join(', ')}\n`);

    // Trigger the alert
    const trigger = await triggerManualAlert(
      TEST_SHOP,
      severity,
      alertType,
      template.title,
      template.message,
      channels,
    );

    console.log("✅ Alert triggered successfully!\n");

    console.log("📋 Alert Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Severity: ${trigger.severity.toUpperCase()}`);
    console.log(`  Type: ${trigger.alertType}`);
    console.log(`  Title: ${trigger.title}`);
    console.log(`  Message: ${trigger.message}`);
    console.log(`  Channels: ${trigger.channels.join(', ')}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log();

    console.log("💡 Next Steps:");
    console.log("  1. Start your dev server: npm run dev");
    console.log("  2. Navigate to: /app/war-room/alerts");
    console.log("  3. You should see the alert in the Active Alerts section");
    console.log("  4. Try acknowledging or resolving the alert");
    console.log("  5. Check your email/Slack if configured");
    console.log();

    console.log("💡 Try different alert types:");
    console.log("  npx tsx trigger-test-alert.ts --severity critical --type defcon");
    console.log("  npx tsx trigger-test-alert.ts --severity high --type stockout");
    console.log("  npx tsx trigger-test-alert.ts --severity medium --type velocity");
    console.log("  npx tsx trigger-test-alert.ts --severity low --type revenue_risk");

  } catch (error) {
    console.error("❌ Failed to trigger alert:", error);
    process.exit(1);
  }
}

main();
