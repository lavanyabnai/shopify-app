/**
 * BFCM War Room - Alerts Route (Session 5)
 *
 * Displays and manages War Room alerts.
 */

import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Text, Button, InlineStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import {
  getActiveAlerts,
  getAlertHistory,
  getAlertSummary,
  acknowledgeAlert,
  resolveAlert,
  triggerAlerts,
  createDefaultAlertRules,
} from "../services/alert-engine.server";
import { getNotificationPreferences } from "../services/notification-dispatcher.server";
import { AlertPanel } from "../components/AlertPanel";

// ============================================================================
// Loader
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Create default alert rules if none exist (non-blocking)
  createDefaultAlertRules(shop).catch(err => {
    console.error('Failed to create default alert rules:', err);
  });

  // Get alerts and summary
  const [activeAlerts, alertHistory, summary, preferences] = await Promise.all([
    getActiveAlerts(shop),
    getAlertHistory(shop, { limit: 50 }),
    getAlertSummary(shop),
    getNotificationPreferences(shop),
  ]);

  return json({
    shop,
    activeAlerts,
    alertHistory,
    summary,
    preferences,
  });
}

// ============================================================================
// Action
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const action = formData.get("action");
  const alertId = formData.get("alertId") as string;

  switch (action) {
    case "acknowledge":
      await acknowledgeAlert(alertId, "user");
      return json({ success: true, message: "Alert acknowledged" });

    case "resolve":
      const resolution = formData.get("resolution") as string | undefined;
      await resolveAlert(alertId, resolution);
      return json({ success: true, message: "Alert resolved" });

    case "refresh":
      // Trigger alert evaluation
      const triggers = await triggerAlerts(shop);
      return json({
        success: true,
        message: `Evaluated alerts. ${triggers.length} new alerts triggered.`,
      });

    case "testAlert":
      // Trigger a test alert
      const testTriggers = await triggerAlerts(shop);
      return json({
        success: true,
        message: `Test alert triggered. ${testTriggers.length} alerts generated.`,
      });

    default:
      return json({ success: false, message: "Unknown action" }, { status: 400 });
  }
}

// ============================================================================
// Component
// ============================================================================

export default function WarRoomAlerts() {
  const { shop, activeAlerts, alertHistory, summary, preferences } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const handleAcknowledge = (alertId: string) => {
    const formData = new FormData();
    formData.append("action", "acknowledge");
    formData.append("alertId", alertId);
    submit(formData, { method: "post" });
  };

  const handleResolve = (alertId: string) => {
    const formData = new FormData();
    formData.append("action", "resolve");
    formData.append("alertId", alertId);
    submit(formData, { method: "post" });
  };

  const handleRefresh = () => {
    const formData = new FormData();
    formData.append("action", "refresh");
    submit(formData, { method: "post" });
  };

  const handleTestAlert = () => {
    const formData = new FormData();
    formData.append("action", "testAlert");
    submit(formData, { method: "post" });
  };

  return (
    <Page
      title="Alert Center"
      subtitle="Manage War Room alerts and notifications"
      backAction={{ content: "War Room", url: "/app/war-room" }}
    >
      <Layout>
        {/* Notification Preferences Card */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Notification Preferences
              </Text>

              <InlineStack gap="400">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    <strong>Email:</strong> {preferences.email ? "✅ Enabled" : "❌ Disabled"}
                  </Text>
                  {preferences.emailAddress && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {preferences.emailAddress}
                    </Text>
                  )}
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    <strong>Slack:</strong> {preferences.slack ? "✅ Enabled" : "❌ Disabled"}
                  </Text>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    <strong>SMS:</strong> {preferences.sms ? "✅ Enabled" : "❌ Disabled"}
                  </Text>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    <strong>In-App:</strong> {preferences.inApp ? "✅ Enabled" : "❌ Disabled"}
                  </Text>
                </BlockStack>
              </InlineStack>

              <InlineStack gap="200">
                <Text as="p" variant="bodySm" tone="subdued">
                  Minimum Severity: <strong>{preferences.minSeverity}</strong>
                </Text>
              </InlineStack>

              <InlineStack gap="200">
                <Button url="/app/war-room/alerts/settings">
                  Configure Notifications
                </Button>
                <Button onClick={handleTestAlert}>
                  Test Alert
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Alert Panel */}
        <Layout.Section>
          <AlertPanel
            activeAlerts={activeAlerts}
            alertHistory={alertHistory}
            summary={summary}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            onRefresh={handleRefresh}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
