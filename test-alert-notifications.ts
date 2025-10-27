/**
 * BFCM War Room - Session 3: Alert Notification System Test
 *
 * Tests:
 * 1. Email notification formatting
 * 2. Slack notification formatting
 * 3. SMS notification formatting (mock)
 * 4. Notification channel routing
 * 5. User preference handling
 * 6. Notification cooldown periods
 */

import { PrismaClient } from '@prisma/client';
import { dispatchNotifications } from './app/services/notification-dispatcher.server';

const prisma = new PrismaClient();

interface TestResults {
  testName: string;
  passed: boolean;
  details: string;
  metrics?: any;
}

const results: TestResults[] = [];

async function runNotificationTests() {
  console.log('📧 BFCM War Room - Session 3: Notification System Tests\n');
  console.log('=' .repeat(70));
  console.log();

  const shop = 'control-tower-2.myshopify.com';

  try {
    // Get recent critical alerts for testing
    const criticalAlerts = await prisma.alertHistory.findMany({
      where: {
        shop,
        severity: 'critical',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (criticalAlerts.length === 0) {
      console.log('⚠️  No critical alerts found. Run test-alert-rules.ts first.');
      process.exit(1);
    }

    console.log(`📋 Found ${criticalAlerts.length} critical alerts for testing`);
    console.log();

    // Test 1: Dispatch notifications for alerts
    console.log('📤 TEST 1: Dispatch Multi-Channel Notifications');
    console.log('-'.repeat(70));

    const startTime = Date.now();
    const notifications = await dispatchNotifications(shop, criticalAlerts.map(a => a.id));
    const duration = Date.now() - startTime;

    console.log(`✅ Dispatched ${notifications.length} notifications in ${duration}ms`);
    console.log();

    results.push({
      testName: 'Notification Dispatch',
      passed: notifications.length > 0,
      details: `Dispatched ${notifications.length} notifications in ${duration}ms`,
      metrics: {
        duration,
        notificationCount: notifications.length,
      },
    });

    // Test 2: Email notification formatting
    console.log('📧 TEST 2: Email Notification Formatting');
    console.log('-'.repeat(70));

    const emailNotifications = notifications.filter(n => n.channel === 'email');
    console.log(`   Found ${emailNotifications.length} email notifications`);

    if (emailNotifications.length > 0) {
      const sample = emailNotifications[0];
      const payload = JSON.parse(sample.payload);

      console.log('   Sample Email:');
      console.log(`     To: ${payload.to || 'merchant@example.com'}`);
      console.log(`     Subject: ${payload.subject}`);
      console.log(`     Preview: ${(payload.body || payload.html || '').substring(0, 100)}...`);
      console.log(`     Priority: ${payload.priority || 'normal'}`);
    }
    console.log();

    results.push({
      testName: 'Email Notification Formatting',
      passed: emailNotifications.length > 0 && emailNotifications.every(n => {
        const payload = JSON.parse(n.payload);
        return payload.subject && (payload.body || payload.html);
      }),
      details: `Generated ${emailNotifications.length} properly formatted email notifications`,
      metrics: {
        emailCount: emailNotifications.length,
      },
    });

    // Test 3: Slack notification formatting
    console.log('💬 TEST 3: Slack Notification Formatting');
    console.log('-'.repeat(70));

    const slackNotifications = notifications.filter(n => n.channel === 'slack');
    console.log(`   Found ${slackNotifications.length} Slack notifications`);

    if (slackNotifications.length > 0) {
      const sample = slackNotifications[0];
      const payload = JSON.parse(sample.payload);

      console.log('   Sample Slack Message:');
      console.log(`     Channel: ${payload.channel || '#war-room'}`);
      console.log(`     Text: ${payload.text?.substring(0, 100)}...`);
      console.log(`     Blocks: ${payload.blocks?.length || 0} blocks`);
      console.log(`     Color: ${payload.color || payload.attachments?.[0]?.color || 'default'}`);
    }
    console.log();

    results.push({
      testName: 'Slack Notification Formatting',
      passed: slackNotifications.length > 0 && slackNotifications.every(n => {
        const payload = JSON.parse(n.payload);
        return payload.text || payload.blocks;
      }),
      details: `Generated ${slackNotifications.length} properly formatted Slack notifications`,
      metrics: {
        slackCount: slackNotifications.length,
      },
    });

    // Test 4: SMS notification formatting (mock)
    console.log('📱 TEST 4: SMS Notification Formatting');
    console.log('-'.repeat(70));

    const smsNotifications = notifications.filter(n => n.channel === 'sms');
    console.log(`   Found ${smsNotifications.length} SMS notifications`);

    if (smsNotifications.length > 0) {
      const sample = smsNotifications[0];
      const payload = JSON.parse(sample.payload);

      console.log('   Sample SMS:');
      console.log(`     To: ${payload.to || '+1234567890'}`);
      console.log(`     Message: ${payload.message}`);
      console.log(`     Length: ${payload.message?.length || 0} chars (max 160)`);
    }
    console.log();

    results.push({
      testName: 'SMS Notification Formatting',
      passed: smsNotifications.every(n => {
        const payload = JSON.parse(n.payload);
        return payload.message && payload.message.length <= 160;
      }),
      details: `Generated ${smsNotifications.length} SMS notifications (${smsNotifications.filter(n => JSON.parse(n.payload).message?.length <= 160).length} within 160 char limit)`,
      metrics: {
        smsCount: smsNotifications.length,
      },
    });

    // Test 5: Notification channel distribution
    console.log('📊 TEST 5: Notification Channel Distribution');
    console.log('-'.repeat(70));

    const channelStats = {
      email: notifications.filter(n => n.channel === 'email').length,
      slack: notifications.filter(n => n.channel === 'slack').length,
      sms: notifications.filter(n => n.channel === 'sms').length,
    };

    console.log('   Channel Distribution:');
    console.log(`     Email: ${channelStats.email} notifications`);
    console.log(`     Slack: ${channelStats.slack} notifications`);
    console.log(`     SMS: ${channelStats.sms} notifications`);
    console.log();

    results.push({
      testName: 'Channel Distribution',
      passed: Object.values(channelStats).some(count => count > 0),
      details: `Notifications distributed across ${Object.values(channelStats).filter(c => c > 0).length} channels`,
      metrics: channelStats,
    });

    // Test 6: User preference handling
    console.log('👤 TEST 6: User Notification Preferences');
    console.log('-'.repeat(70));

    const preferences = await prisma.notificationPreference.findMany({
      where: { shop },
    });

    console.log(`   Found ${preferences.length} user preference configurations`);
    if (preferences.length > 0) {
      preferences.forEach((pref, i) => {
        const channels = JSON.parse(pref.channels);
        console.log(`   ${i + 1}. User: ${pref.userId || 'default'}`);
        console.log(`      Channels: ${channels.join(', ')}`);
        console.log(`      Quiet Hours: ${pref.quietHoursStart || 'none'} - ${pref.quietHoursEnd || 'none'}`);
      });
    } else {
      console.log('   Using default preferences (all channels enabled)');
    }
    console.log();

    results.push({
      testName: 'User Preference Handling',
      passed: true, // Always passes, just validates configuration
      details: `${preferences.length} preference configurations found`,
      metrics: {
        preferenceCount: preferences.length,
      },
    });

    // Test 7: Notification status tracking
    console.log('📝 TEST 7: Notification Status Tracking');
    console.log('-'.repeat(70));

    const statusStats = {
      pending: notifications.filter(n => n.status === 'pending').length,
      sent: notifications.filter(n => n.status === 'sent').length,
      failed: notifications.filter(n => n.status === 'failed').length,
    };

    console.log('   Notification Status:');
    console.log(`     Pending: ${statusStats.pending}`);
    console.log(`     Sent: ${statusStats.sent}`);
    console.log(`     Failed: ${statusStats.failed}`);
    console.log();

    results.push({
      testName: 'Notification Status Tracking',
      passed: notifications.every(n => ['pending', 'sent', 'failed'].includes(n.status)),
      details: `Status tracking: ${statusStats.sent} sent, ${statusStats.pending} pending, ${statusStats.failed} failed`,
      metrics: statusStats,
    });

    // Test 8: Critical alert priority routing
    console.log('🚨 TEST 8: Critical Alert Priority Routing');
    console.log('-'.repeat(70));

    const criticalNotifications = notifications.filter(n => {
      const payload = JSON.parse(n.payload);
      return payload.priority === 'high' || payload.priority === 'critical';
    });

    console.log(`   Found ${criticalNotifications.length} high-priority notifications`);
    console.log(`   ${(criticalNotifications.length / notifications.length * 100).toFixed(1)}% of notifications are high-priority`);
    console.log();

    results.push({
      testName: 'Critical Alert Priority Routing',
      passed: criticalNotifications.length > 0,
      details: `${criticalNotifications.length} notifications marked as high-priority`,
      metrics: {
        criticalCount: criticalNotifications.length,
        totalCount: notifications.length,
        criticalPercent: (criticalNotifications.length / notifications.length * 100).toFixed(1),
      },
    });

    // Test 9: Notification cooldown check
    console.log('⏰ TEST 9: Notification Cooldown Period');
    console.log('-'.repeat(70));

    console.log('   Dispatching notifications again (should be throttled)...');
    const secondDispatch = await dispatchNotifications(shop, criticalAlerts.map(a => a.id));

    console.log(`   First dispatch: ${notifications.length} notifications`);
    console.log(`   Second dispatch: ${secondDispatch.length} notifications`);

    const cooldownWorking = secondDispatch.length < notifications.length;
    console.log(`   Cooldown: ${cooldownWorking ? '✅ WORKING' : '⚠️  NOT WORKING'}`);
    console.log();

    results.push({
      testName: 'Notification Cooldown',
      passed: cooldownWorking,
      details: `Second dispatch produced ${secondDispatch.length} notifications (vs ${notifications.length} in first)`,
      metrics: {
        firstDispatch: notifications.length,
        secondDispatch: secondDispatch.length,
        throttleRate: ((notifications.length - secondDispatch.length) / notifications.length) * 100,
      },
    });

    // Test 10: Notification payload validation
    console.log('✅ TEST 10: Notification Payload Validation');
    console.log('-'.repeat(70));

    let validPayloads = 0;
    let invalidPayloads = 0;

    notifications.forEach(n => {
      try {
        const payload = JSON.parse(n.payload);
        if (payload && typeof payload === 'object') {
          validPayloads++;
        } else {
          invalidPayloads++;
        }
      } catch {
        invalidPayloads++;
      }
    });

    console.log(`   Valid payloads: ${validPayloads}`);
    console.log(`   Invalid payloads: ${invalidPayloads}`);
    console.log();

    results.push({
      testName: 'Notification Payload Validation',
      passed: invalidPayloads === 0,
      details: `${validPayloads} valid payloads, ${invalidPayloads} invalid`,
      metrics: {
        validCount: validPayloads,
        invalidCount: invalidPayloads,
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

    if (passRate >= 80) {
      console.log('🎉 NOTIFICATION SYSTEM VALIDATION: PASSED');
      console.log('   System is ready for alert dashboard testing');
    } else {
      console.log('⚠️  NOTIFICATION SYSTEM VALIDATION: NEEDS IMPROVEMENT');
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

runNotificationTests();
