/**
 * API endpoint for Google Cloud Pub/Sub status and operations
 *
 * GET /api/gcp-pubsub - Get status and configuration
 * POST /api/gcp-pubsub - Test connection or publish test message
 */

import { json } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { getGCPPubSubService } from "../services/gcp-pubsub.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const gcpPubSub = getGCPPubSubService();

    // Get configuration
    const webhookUrl = gcpPubSub.getShopifyWebhookUrl();

    // Verify connection
    const isConnected = await gcpPubSub.verifyConnection();

    // Get subscription info
    const subscriptionInfo = await gcpPubSub.getSubscriptionInfo();

    return json({
      success: true,
      connected: isConnected,
      webhookUrl,
      configuration: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        topicId: process.env.GOOGLE_CLOUD_TOPIC_ID,
        subscriptionId: process.env.GOOGLE_CLOUD_SUBSCRIPTION_ID,
        hasCredentials: !!(
          process.env.GOOGLE_APPLICATION_CREDENTIALS ||
          process.env.GOOGLE_CLOUD_CREDENTIALS_JSON
        )
      },
      subscription: subscriptionInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error getting GCP Pub/Sub status:", error);
    return json({
      success: false,
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.json();
  const { action } = body;

  try {
    const gcpPubSub = getGCPPubSubService();

    switch (action) {
      case "verify":
        // Verify connection
        const isConnected = await gcpPubSub.verifyConnection();
        return json({
          success: true,
          connected: isConnected,
          message: isConnected
            ? "Successfully connected to GCP Pub/Sub"
            : "Failed to connect to GCP Pub/Sub"
        });

      case "test_message":
        // Publish a test message
        const testMessage = {
          test: true,
          timestamp: new Date().toISOString(),
          message: "Test message from Control Tower"
        };

        const messageId = await gcpPubSub.publishTestMessage(testMessage);

        if (messageId) {
          return json({
            success: true,
            messageId,
            message: "Test message published successfully"
          });
        } else {
          return json({
            success: false,
            message: "Failed to publish test message"
          }, { status: 500 });
        }

      default:
        return json({
          success: false,
          message: "Unknown action"
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in GCP Pub/Sub action:", error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};
