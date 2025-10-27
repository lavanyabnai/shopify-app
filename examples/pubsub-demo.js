/**
 * Pub/Sub Demo Script
 * 
 * Demonstrates the pub/sub URL pattern: redis-pubsub://{shop-webhooks}:{control-tower}
 * 
 * This script shows how to:
 * 1. Parse the pub/sub URL pattern
 * 2. Connect to Redis channels
 * 3. Publish and subscribe to messages
 * 4. Monitor channel activity
 */

import Redis from 'ioredis';

// Parse the pub/sub URL pattern
function parsePubSubUrl(url) {
  const match = url.match(/^redis-pubsub:\/\/([^:]+):(.+)$/);
  if (!match) {
    throw new Error('Invalid pub/sub URL format. Expected: redis-pubsub://{shop-webhooks}:{control-tower}');
  }
  
  return {
    shopWebhooksChannel: match[1],
    controlTowerChannel: match[2],
    fullUrl: url
  };
}

// Demo configuration
const PUBSUB_URL = 'redis-pubsub://shop-webhooks:control-tower';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function runDemo() {
  console.log('🚀 Pub/Sub Demo Starting...\n');
  
  // Parse the URL pattern
  const config = parsePubSubUrl(PUBSUB_URL);
  console.log('📋 Configuration:');
  console.log(`   Pub/Sub URL: ${config.fullUrl}`);
  console.log(`   Shop Webhooks Channel: ${config.shopWebhooksChannel}`);
  console.log(`   Control Tower Channel: ${config.controlTowerChannel}\n`);
  
  // Connect to Redis
  const redis = new Redis(REDIS_URL);
  const pubsub = redis.duplicate();
  
  console.log('🔗 Connected to Redis');
  
  // Subscribe to channels
  await pubsub.subscribe(config.shopWebhooksChannel, config.controlTowerChannel);
  console.log(`📥 Subscribed to channels: ${config.shopWebhooksChannel}, ${config.controlTowerChannel}\n`);
  
  // Set up message handlers
  pubsub.on('message', (channel, message) => {
    const timestamp = new Date().toISOString();
    console.log(`📨 [${timestamp}] Received on ${channel}:`);
    try {
      const data = JSON.parse(message);
      console.log(`   ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      console.log(`   ${message}`);
    }
    console.log('');
  });
  
  // Demo 1: Publish webhook event
  console.log('📤 Demo 1: Publishing webhook event...');
  const webhookEvent = {
    shop: 'demo-shop.myshopify.com',
    topic: 'orders/create',
    payload: {
      order: {
        id: 12345,
        name: '#1001',
        total_price: '99.99',
        currency: 'USD'
      }
    },
    timestamp: new Date().toISOString(),
    messageId: `webhook-${Date.now()}`
  };
  
  await redis.publish(config.shopWebhooksChannel, JSON.stringify(webhookEvent));
  console.log('✅ Webhook event published\n');
  
  // Demo 2: Publish control tower message
  console.log('📤 Demo 2: Publishing control tower message...');
  const controlTowerMessage = {
    type: 'alert',
    data: {
      message: 'System maintenance scheduled',
      severity: 'info',
      scheduledAt: new Date(Date.now() + 3600000).toISOString()
    },
    timestamp: new Date().toISOString(),
    messageId: `control-${Date.now()}`
  };
  
  await redis.publish(config.controlTowerChannel, JSON.stringify(controlTowerMessage));
  console.log('✅ Control tower message published\n');
  
  // Demo 3: Check channel info
  console.log('📊 Demo 3: Checking channel information...');
  const [shopWebhooksSubs, controlTowerSubs] = await Promise.all([
    redis.pubsub('NUMSUB', config.shopWebhooksChannel),
    redis.pubsub('NUMSUB', config.controlTowerChannel)
  ]);
  
  console.log(`   ${config.shopWebhooksChannel}: ${shopWebhooksSubs[1]} subscribers`);
  console.log(`   ${config.controlTowerChannel}: ${controlTowerSubs[1]} subscribers\n`);
  
  // Demo 4: Simulate inventory alert
  console.log('📤 Demo 4: Simulating inventory alert...');
  const inventoryAlert = {
    id: `alert-${Date.now()}`,
    sku: 'PROD-001',
    locationId: 'LOC-001',
    warehouseCode: 'WH-MAIN',
    alertType: 'low_stock',
    severity: 'warning',
    title: 'Low Stock Alert: PROD-001',
    description: 'Product PROD-001 has 5 units remaining',
    currentQuantity: 5,
    previousQuantity: 25,
    threshold: 20,
    recommendations: [
      'Create purchase order',
      'Review demand forecast',
      'Consider expedited shipping'
    ],
    timestamp: new Date().toISOString(),
    metadata: {
      reorderPoint: 20,
      maxStock: 80,
      daysOfStock: 1.0
    }
  };
  
  // Publish to inventory alerts channel
  await redis.publish('inventory_alerts', JSON.stringify(inventoryAlert));
  console.log('✅ Inventory alert published\n');
  
  // Demo 5: Simulate inventory update
  console.log('📤 Demo 5: Simulating inventory update...');
  const inventoryUpdate = {
    sku: 'PROD-001',
    locationId: 'LOC-001',
    quantity: 5,
    timestamp: new Date().toISOString(),
    messageId: `inventory-${Date.now()}`
  };
  
  await redis.publish('inventory_updates', JSON.stringify(inventoryUpdate));
  console.log('✅ Inventory update published\n');
  
  // Wait for messages to be processed
  console.log('⏳ Waiting for messages to be processed...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Cleanup
  console.log('🧹 Cleaning up...');
  await pubsub.unsubscribe();
  await pubsub.quit();
  await redis.quit();
  
  console.log('✅ Demo completed successfully!');
  console.log('\n📚 Next steps:');
  console.log('   1. Visit /pubsub-dashboard for real-time monitoring');
  console.log('   2. Check /api/pubsub for API documentation');
  console.log('   3. Review PUBSUB_SYSTEM_GUIDE.md for detailed usage');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { parsePubSubUrl, runDemo };
