/**
 * Pub/Sub API endpoints for Control Tower
 * 
 * Provides REST API access to pub/sub functionality:
 * - Channel information
 * - Message publishing
 * - Subscription management
 * - System status
 */

import { json } from "@remix-run/node";
import { getPubSubManager } from "../services/pubsub-manager.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

/**
 * GET /api/pubsub - Get channel information and system status
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const pubSubManager = getPubSubManager();
    const channelInfo = await pubSubManager.getChannelInfo();
    const pubSubUrl = pubSubManager.getPubSubUrl();

    return json({
      success: true,
      pubSubUrl,
      channels: channelInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting pub/sub info:", error);
    return json(
      {
        success: false,
        error: "Failed to get pub/sub information",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
};

/**
 * POST /api/pubsub - Publish messages to channels
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const body = await request.json();
    const { action: actionType, channel, message, data } = body;

    const pubSubManager = getPubSubManager();
    let result = false;

    switch (actionType) {
      case "publish_webhook":
        if (!message.shop || !message.topic || !message.payload) {
          return json(
            { success: false, error: "Missing required fields: shop, topic, payload" },
            { status: 400 }
          );
        }
        result = await pubSubManager.publishWebhookEvent(
          message.shop,
          message.topic,
          message.payload
        );
        break;

      case "publish_control_tower":
        if (!message.type || !message.data) {
          return json(
            { success: false, error: "Missing required fields: type, data" },
            { status: 400 }
          );
        }
        result = await pubSubManager.publishControlTowerMessage(
          message.type,
          message.data
        );
        break;

      case "publish_inventory_alert":
        if (!message.alert) {
          return json(
            { success: false, error: "Missing required field: alert" },
            { status: 400 }
          );
        }
        result = await pubSubManager.publishInventoryAlert(message.alert);
        break;

      case "publish_inventory_update":
        if (!message.sku || !message.locationId || message.quantity === undefined) {
          return json(
            { success: false, error: "Missing required fields: sku, locationId, quantity" },
            { status: 400 }
          );
        }
        result = await pubSubManager.publishInventoryUpdate(
          message.sku,
          message.locationId,
          message.quantity
        );
        break;

      default:
        return json(
          { success: false, error: "Invalid action type" },
          { status: 400 }
        );
    }

    return json({
      success: result,
      message: result ? "Message published successfully" : "Failed to publish message",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in pub/sub action:", error);
    return json(
      {
        success: false,
        error: "Failed to process pub/sub action",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
};
