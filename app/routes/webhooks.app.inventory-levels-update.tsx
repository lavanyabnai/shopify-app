import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { inventoryMonitor } from "../utils/inventory-monitor";
import { getPubSubManager } from "../services/pubsub-manager.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  
  console.log(`Received ${topic} webhook for ${shop}`);
  
  try {
    // Extract inventory data from the webhook payload
    const inventoryItem = payload.inventory_item;
    const location = payload.location;
    const available = payload.available;
    const previousAvailable = payload.previous_available || 0;
    
    if (!inventoryItem || !location || available === undefined) {
      console.error("Missing required inventory data in webhook payload");
      return new Response("Missing required data", { status: 400 });
    }
    
    // Get SKU from inventory item
    const sku = inventoryItem.sku || inventoryItem.id;
    const locationId = location.id;
    const warehouseCode = location.name || `WH-${locationId}`;
    
    console.log(`Processing inventory update: SKU=${sku}, Location=${locationId}, Available=${available}, Previous=${previousAvailable}`);
    
    // Check inventory level and generate alerts
    const alert = await inventoryMonitor.checkInventoryLevel(
      sku,
      locationId,
      warehouseCode,
      available,
      previousAvailable
    );
    
    // Publish alert if threshold breached
    if (alert) {
      await inventoryMonitor.publishAlert(alert);
      console.log(`Alert published for SKU ${sku}: ${alert.alert_type} - ${alert.severity}`);
    }
    
    // Publish webhook event and inventory update to pub/sub system
    const pubSubManager = getPubSubManager();
    await pubSubManager.publishWebhookEvent(shop, topic, payload);
    await pubSubManager.publishInventoryUpdate(sku, locationId, available);
    
    // Store inventory update in database (optional)
    // You can add database storage here if needed
    
    return json({ 
      success: true, 
      message: "Inventory update processed",
      alert_generated: alert !== null,
      sku: sku,
      location: locationId,
      quantity: available
    });
    
  } catch (error) {
    console.error("Error processing inventory webhook:", error);
    return json(
      { 
        success: false, 
        error: "Failed to process inventory update",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
};
