# Pub/Sub System Guide for Control Tower

## Overview

The Control Tower app implements a comprehensive pub/sub messaging system using Redis for real-time communication between webhook events, inventory monitoring, and internal app components.

## URL Pattern

The system uses the following URL pattern:
```
redis-pubsub://{shop-webhooks}:{control-tower}
```

Where:
- `shop-webhooks`: Channel for Shopify webhook events
- `control-tower`: Channel for internal app communication

## Architecture

### Channels

1. **shop-webhooks** - Shopify webhook events
   - Orders (create, update, cancel)
   - Products (create, update)
   - Inventory level updates

2. **control-tower** - Internal app communication
   - System alerts
   - Notifications
   - Analytics events

3. **inventory_alerts** - Real-time inventory alerts
   - Stockout alerts
   - Low stock warnings
   - Overstock notifications

4. **inventory_updates** - Inventory level changes
   - Quantity updates
   - Location changes
   - SKU modifications

### Components

- **PubSubManager** - Core pub/sub functionality
- **Webhook Handlers** - Integrated with pub/sub publishing
- **Inventory Monitor** - Publishes alerts and updates
- **API Endpoints** - REST API for pub/sub operations
- **Dashboard** - Real-time monitoring interface

## Implementation

### 1. PubSubManager Service

```typescript
// app/services/pubsub-manager.server.ts
import { getPubSubManager } from "../services/pubsub-manager.server";

const pubSubManager = getPubSubManager();

// Publish webhook event
await pubSubManager.publishWebhookEvent(shop, topic, payload);

// Publish control tower message
await pubSubManager.publishControlTowerMessage('alert', data);

// Publish inventory alert
await pubSubManager.publishInventoryAlert(alert);

// Publish inventory update
await pubSubManager.publishInventoryUpdate(sku, locationId, quantity);
```

### 2. Webhook Integration

All webhook handlers automatically publish events to the pub/sub system:

```typescript
// Orders webhook
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  
  await processOrderWebhook(shop, topic, payload);
  
  // Publish to pub/sub
  const pubSubManager = getPubSubManager();
  await pubSubManager.publishWebhookEvent(shop, topic, payload);
  
  return new Response("OK", { status: 200 });
};
```

### 3. Message Types

#### WebhookMessage
```typescript
interface WebhookMessage {
  shop: string;
  topic: string;
  payload: any;
  timestamp: string;
  messageId: string;
}
```

#### ControlTowerMessage
```typescript
interface ControlTowerMessage {
  type: 'alert' | 'notification' | 'system' | 'analytics';
  data: any;
  timestamp: string;
  messageId: string;
}
```

## API Endpoints

### GET /api/pubsub
Get channel information and system status.

**Response:**
```json
{
  "success": true,
  "pubSubUrl": "redis-pubsub://shop-webhooks:control-tower",
  "channels": {
    "shopWebhooks": { "subscribers": 2, "channel": "shop-webhooks" },
    "controlTower": { "subscribers": 1, "channel": "control-tower" },
    "inventoryAlerts": { "subscribers": 3, "channel": "inventory_alerts" },
    "inventoryUpdates": { "subscribers": 2, "channel": "inventory_updates" }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### POST /api/pubsub
Publish messages to channels.

**Request Body:**
```json
{
  "action": "publish_webhook",
  "message": {
    "shop": "example-shop.myshopify.com",
    "topic": "orders/create",
    "payload": { "order": {...} }
  }
}
```

**Available Actions:**
- `publish_webhook` - Publish webhook event
- `publish_control_tower` - Publish control tower message
- `publish_inventory_alert` - Publish inventory alert
- `publish_inventory_update` - Publish inventory update

## Dashboard

Access the real-time dashboard at `/pubsub-dashboard` to monitor:
- Channel status and subscriber counts
- Recent message activity
- System health metrics
- Usage examples

## Configuration

### Environment Variables

```bash
# Redis connection URL
REDIS_URL=redis://localhost:6379

# Optional: Custom channel names
SHOP_WEBHOOKS_CHANNEL=shop-webhooks
CONTROL_TOWER_CHANNEL=control-tower
INVENTORY_ALERTS_CHANNEL=inventory_alerts
INVENTORY_UPDATES_CHANNEL=inventory_updates
```

### Redis Setup

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server

# Test connection
redis-cli ping
```

## Usage Examples

### 1. Subscribe to Webhook Events

```typescript
const pubSubManager = getPubSubManager();

await pubSubManager.subscribeToWebhookEvents((message) => {
  console.log(`Received webhook: ${message.topic} from ${message.shop}`);
  // Process webhook event
});
```

### 2. Subscribe to Control Tower Messages

```typescript
await pubSubManager.subscribeToControlTowerMessages((message) => {
  console.log(`Control tower message: ${message.type}`);
  // Handle internal app communication
});
```

### 3. Subscribe to Inventory Alerts

```typescript
await pubSubManager.subscribeToInventoryAlerts((alert) => {
  console.log(`Inventory alert: ${alert.alert_type} for ${alert.sku}`);
  // Handle inventory alerts
});
```

### 4. Publish Custom Messages

```typescript
// Publish system alert
await pubSubManager.publishControlTowerMessage('alert', {
  message: 'System maintenance scheduled',
  severity: 'info',
  scheduledAt: '2024-01-15T14:00:00Z'
});

// Publish analytics event
await pubSubManager.publishControlTowerMessage('analytics', {
  event: 'dashboard_viewed',
  userId: 'user123',
  timestamp: new Date().toISOString()
});
```

## Monitoring and Debugging

### 1. Channel Information

```typescript
const channelInfo = await pubSubManager.getChannelInfo();
console.log('Channel subscribers:', channelInfo);
```

### 2. Redis CLI Commands

```bash
# Monitor all channels
redis-cli monitor

# Check specific channel subscribers
redis-cli pubsub numsub shop-webhooks control-tower

# List all channels
redis-cli pubsub channels
```

### 3. Logging

The system provides comprehensive logging:
- 📤 Message published
- 📥 Message received
- ❌ Error handling
- 🔗 Connection status

## Error Handling

The pub/sub system includes robust error handling:

1. **Connection Failures** - Automatic retry with exponential backoff
2. **Message Parsing** - Graceful handling of malformed messages
3. **Channel Errors** - Fallback to default channels
4. **Redis Unavailable** - Graceful degradation without breaking webhooks

## Performance Considerations

1. **Connection Pooling** - Reuses Redis connections
2. **Message Batching** - Groups related messages
3. **Async Processing** - Non-blocking message handling
4. **Memory Management** - Automatic cleanup of old messages

## Security

1. **Channel Isolation** - Separate channels for different data types
2. **Message Validation** - Validates message structure before processing
3. **Access Control** - API endpoints require authentication
4. **Data Sanitization** - Cleans sensitive data from messages

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server status
   - Verify REDIS_URL environment variable
   - Test connection: `redis-cli ping`

2. **No Subscribers**
   - Ensure subscribers are running
   - Check channel names match
   - Verify Redis pub/sub functionality

3. **Message Not Received**
   - Check message format
   - Verify channel subscription
   - Review error logs

### Debug Commands

```bash
# Check Redis status
redis-cli info server

# Monitor pub/sub activity
redis-cli monitor | grep pubsub

# Test message publishing
redis-cli publish shop-webhooks '{"test": "message"}'
```

## Integration with Existing Systems

The pub/sub system integrates seamlessly with:

1. **Webhook Handlers** - Automatic event publishing
2. **Inventory Monitor** - Real-time alert system
3. **Analytics Service** - Event-driven analytics
4. **Dashboard** - Real-time monitoring interface

## Future Enhancements

1. **Message Persistence** - Store messages for replay
2. **Message Filtering** - Filter messages by criteria
3. **Load Balancing** - Distribute messages across instances
4. **Message Encryption** - Encrypt sensitive messages
5. **Metrics Collection** - Detailed performance metrics

---

For more information, visit the dashboard at `/pubsub-dashboard` or check the API documentation at `/api/pubsub`.
