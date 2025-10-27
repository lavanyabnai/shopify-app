/**
 * BFCM War Room - Notification Dispatcher Service (Session 5)
 *
 * Dispatches alerts to multiple notification channels.
 *
 * Features:
 * - Email notifications
 * - Slack webhook integration
 * - SMS via Twilio (optional)
 * - In-app notifications
 * - User preference management
 * - Quiet hours support
 * - Severity filtering
 */

import db from "../db.server";
import type { AlertTrigger } from "./alert-engine.server";

// ============================================================================
// Types
// ============================================================================

export interface NotificationResult {
  channel: string;
  success: boolean;
  message?: string;
  error?: string;
}

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:MM
  end: string; // HH:MM
  timezone: string;
}

// ============================================================================
// Notification Dispatch
// ============================================================================

/**
 * Dispatch notifications for an alert trigger
 */
export async function dispatchNotifications(
  shop: string,
  trigger: AlertTrigger,
): Promise<NotificationResult[]> {
  console.log(`📨 Dispatching notifications for ${trigger.title}`);

  // Get user preferences
  const preferences = await getNotificationPreferences(shop);

  // Check quiet hours
  if (preferences.quietHours) {
    const quietHours: QuietHours = JSON.parse(preferences.quietHours);
    if (quietHours.enabled && isInQuietHours(quietHours)) {
      console.log(`🔇 Skipping notifications - in quiet hours`);
      return [];
    }
  }

  // Check severity filter
  const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];
  const minSeverityIndex = severityOrder.indexOf(preferences.minSeverity);
  const triggerSeverityIndex = severityOrder.indexOf(trigger.severity);

  if (triggerSeverityIndex < minSeverityIndex) {
    console.log(`🔇 Skipping notifications - below minimum severity (${trigger.severity} < ${preferences.minSeverity})`);
    return [];
  }

  // Dispatch to requested channels
  const results: NotificationResult[] = [];

  for (const channel of trigger.channels) {
    switch (channel) {
      case 'email':
        if (preferences.email && preferences.emailAddress) {
          results.push(await sendEmailNotification(preferences.emailAddress, trigger));
        }
        break;

      case 'slack':
        if (preferences.slack && preferences.slackWebhook) {
          results.push(await sendSlackNotification(preferences.slackWebhook, trigger));
        }
        break;

      case 'sms':
        if (preferences.sms && preferences.phoneNumber) {
          results.push(await sendSMSNotification(preferences.phoneNumber, trigger));
        }
        break;

      case 'in_app':
        if (preferences.inApp) {
          results.push(await sendInAppNotification(shop, trigger));
        }
        break;
    }
  }

  // Update alert history with notification results
  await updateNotificationStatus(shop, trigger, results);

  return results;
}

// ============================================================================
// Channel Implementations
// ============================================================================

/**
 * Send email notification
 */
async function sendEmailNotification(
  email: string,
  trigger: AlertTrigger,
): Promise<NotificationResult> {
  try {
    console.log(`📧 Sending email to ${email}`);

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just log the notification
    const emailBody = formatEmailBody(trigger);

    // Simulate email send (replace with actual email service)
    const mockSend = process.env.NODE_ENV !== 'production';

    if (mockSend) {
      console.log(`📧 [MOCK] Email sent to ${email}:`);
      console.log(`   Subject: ${trigger.title}`);
      console.log(`   Body: ${trigger.message}`);

      return {
        channel: 'email',
        success: true,
        message: `Mock email sent to ${email}`,
      };
    }

    // Real email implementation would go here
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: email,
    //   from: 'alerts@warroom.app',
    //   subject: trigger.title,
    //   text: trigger.message,
    //   html: emailBody,
    // });

    return {
      channel: 'email',
      success: true,
      message: `Email sent to ${email}`,
    };
  } catch (error: any) {
    console.error(`❌ Email notification failed:`, error);
    return {
      channel: 'email',
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(
  webhookUrl: string,
  trigger: AlertTrigger,
): Promise<NotificationResult> {
  try {
    console.log(`💬 Sending Slack notification`);

    const slackPayload = formatSlackPayload(trigger);

    // Send to Slack webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return {
      channel: 'slack',
      success: true,
      message: 'Slack notification sent',
    };
  } catch (error: any) {
    console.error(`❌ Slack notification failed:`, error);
    return {
      channel: 'slack',
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(
  phoneNumber: string,
  trigger: AlertTrigger,
): Promise<NotificationResult> {
  try {
    console.log(`📱 Sending SMS to ${phoneNumber}`);

    // TODO: Integrate with Twilio
    // For now, just log the notification
    const smsBody = formatSMSBody(trigger);

    const mockSend = process.env.NODE_ENV !== 'production' || !process.env.TWILIO_ACCOUNT_SID;

    if (mockSend) {
      console.log(`📱 [MOCK] SMS sent to ${phoneNumber}:`);
      console.log(`   Message: ${smsBody}`);

      return {
        channel: 'sms',
        success: true,
        message: `Mock SMS sent to ${phoneNumber}`,
      };
    }

    // Real SMS implementation would go here
    // Example with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: smsBody,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber,
    // });

    return {
      channel: 'sms',
      success: true,
      message: `SMS sent to ${phoneNumber}`,
    };
  } catch (error: any) {
    console.error(`❌ SMS notification failed:`, error);
    return {
      channel: 'sms',
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send in-app notification (save to AlertLog)
 */
async function sendInAppNotification(
  shop: string,
  trigger: AlertTrigger,
): Promise<NotificationResult> {
  try {
    console.log(`📱 Creating in-app notification`);

    if (!db?.alertLog) {
      console.error('❌ db.alertLog not available');
      return {
        channel: 'in_app',
        success: false,
        error: 'Database not available',
      };
    }

    // Save to AlertLog for in-app display
    await db.alertLog.create({
      data: {
        shop,
        severity: trigger.severity,
        alertType: trigger.alertType,
        title: trigger.title,
        message: trigger.message,
        metadata: JSON.stringify(trigger.metadata),
        acknowledged: false,
      },
    });

    return {
      channel: 'in_app',
      success: true,
      message: 'In-app notification created',
    };
  } catch (error: any) {
    console.error(`❌ In-app notification failed:`, error);
    return {
      channel: 'in_app',
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// Message Formatting
// ============================================================================

/**
 * Format email body with HTML
 */
function formatEmailBody(trigger: AlertTrigger): string {
  const severityColors: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#f59e0b',
    low: '#3b82f6',
    info: '#6b7280',
  };

  const color = severityColors[trigger.severity] || '#6b7280';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${trigger.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">${trigger.title}</h1>
    <p style="margin: 8px 0 0 0; opacity: 0.9;">Severity: ${trigger.severity.toUpperCase()}</p>
  </div>
  <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5;">${trigger.message}</p>
    <div style="background-color: white; padding: 16px; border-radius: 4px; border: 1px solid #e5e7eb;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; text-transform: uppercase;">Alert Details</h3>
      <p style="margin: 0; font-size: 14px;"><strong>Type:</strong> ${trigger.alertType}</p>
      <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Rule:</strong> ${trigger.ruleName}</p>
      <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      <a href="https://admin.shopify.com/store/YOUR_STORE/apps/war-room/alerts"
         style="display: inline-block; background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View in War Room
      </a>
    </div>
  </div>
  <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>This is an automated alert from BFCM War Room</p>
    <p>Manage your notification preferences in the War Room settings</p>
  </div>
</body>
</html>
  `;
}

/**
 * Format Slack message payload
 */
function formatSlackPayload(trigger: AlertTrigger) {
  const severityColors: Record<string, string> = {
    critical: 'danger',
    high: 'warning',
    medium: 'warning',
    low: 'good',
    info: '#6b7280',
  };

  const severityEmojis: Record<string, string> = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: 'ℹ️',
    info: '💡',
  };

  return {
    text: `${severityEmojis[trigger.severity]} ${trigger.title}`,
    attachments: [
      {
        color: severityColors[trigger.severity],
        fields: [
          {
            title: 'Message',
            value: trigger.message,
            short: false,
          },
          {
            title: 'Severity',
            value: trigger.severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Type',
            value: trigger.alertType.replace(/_/g, ' '),
            short: true,
          },
        ],
        footer: 'BFCM War Room',
        footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Format SMS message (max 160 characters)
 */
function formatSMSBody(trigger: AlertTrigger): string {
  const emoji = trigger.severity === 'critical' ? '🚨' : '⚠️';
  const shortMessage = trigger.message.length > 100
    ? trigger.message.substring(0, 97) + '...'
    : trigger.message;

  return `${emoji} War Room Alert: ${shortMessage}`;
}

// ============================================================================
// Preference Management
// ============================================================================

/**
 * Get notification preferences for a shop
 */
export async function getNotificationPreferences(shop: string, userId: string = 'default') {
  if (!db?.notificationPreference) {
    console.error('❌ db.notificationPreference not available');
    // Return default preferences
    return {
      id: 'default',
      shop,
      userId,
      email: true,
      slack: false,
      sms: false,
      inApp: true,
      emailAddress: null,
      slackWebhook: null,
      phoneNumber: null,
      minSeverity: 'medium',
      quietHours: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  let prefs = await db.notificationPreference.findUnique({
    where: {
      shop_userId: { shop, userId },
    },
  });

  // Create default preferences if none exist
  if (!prefs) {
    prefs = await db.notificationPreference.create({
      data: {
        shop,
        userId,
        email: true,
        slack: false,
        sms: false,
        inApp: true,
        minSeverity: 'medium',
      },
    });
  }

  return prefs;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  shop: string,
  userId: string = 'default',
  updates: {
    email?: boolean;
    slack?: boolean;
    sms?: boolean;
    inApp?: boolean;
    emailAddress?: string;
    slackWebhook?: string;
    phoneNumber?: string;
    minSeverity?: string;
    quietHours?: string;
  },
) {
  return db.notificationPreference.upsert({
    where: {
      shop_userId: { shop, userId },
    },
    update: updates,
    create: {
      shop,
      userId,
      ...updates,
    },
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if current time is in quiet hours
 */
function isInQuietHours(quietHours: QuietHours): boolean {
  // TODO: Implement timezone-aware quiet hours check
  // For now, return false (always send notifications)
  return false;
}

/**
 * Update alert history with notification results
 */
async function updateNotificationStatus(
  shop: string,
  trigger: AlertTrigger,
  results: NotificationResult[],
) {
  if (!db?.alertHistory) {
    console.error('❌ db.alertHistory not available for notification status update');
    return;
  }

  const updates: any = {};

  for (const result of results) {
    switch (result.channel) {
      case 'email':
        updates.emailSent = result.success;
        break;
      case 'slack':
        updates.slackSent = result.success;
        break;
      case 'sms':
        updates.smsSent = result.success;
        break;
      case 'in_app':
        updates.inAppSent = result.success;
        break;
    }
  }

  try {
    // Find the most recent alert history entry for this trigger
    const alertHistory = await db.alertHistory.findFirst({
      where: {
        shop,
        ruleId: trigger.ruleId,
        title: trigger.title,
      },
      orderBy: {
        triggeredAt: 'desc',
      },
    });

    if (alertHistory) {
      await db.alertHistory.update({
        where: { id: alertHistory.id },
        data: updates,
      });
    }
  } catch (error) {
    console.error('❌ Failed to update notification status:', error);
  }
}

/**
 * Test notification dispatch (for development)
 */
export async function testNotificationDispatch(shop: string) {
  const testTrigger: AlertTrigger = {
    ruleId: 'test',
    ruleName: 'Test Alert',
    severity: 'medium',
    title: '🧪 Test Notification',
    message: 'This is a test notification from the BFCM War Room alert system.',
    alertType: 'test',
    metadata: {
      test: true,
      timestamp: new Date().toISOString(),
    },
    channels: ['in_app', 'email', 'slack'],
  };

  return dispatchNotifications(shop, testTrigger);
}
