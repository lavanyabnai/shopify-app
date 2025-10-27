/**
 * Pub/Sub Monitor for Testing
 * 
 * This script monitors the pub/sub channels to verify that webhook events
 * are being published correctly when you trigger webhooks.
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function startMonitoring() {
  console.log('🔍 Starting Pub/Sub Monitor...\n');
  console.log('📋 Monitoring channels:');
  console.log('   - shop-webhooks (webhook events)');
  console.log('   - control-tower (internal messages)');
  console.log('   - inventory_alerts (inventory alerts)');
  console.log('   - inventory_updates (inventory changes)\n');
  
  const redis = new Redis(REDIS_URL);
  const pubsub = redis.duplicate();
  
  // Subscribe to all channels
  await pubsub.subscribe('shop-webhooks', 'control-tower', 'inventory_alerts', 'inventory_updates');
  
  console.log('✅ Subscribed to all channels');
  console.log('⏳ Waiting for messages... (Press Ctrl+C to stop)\n');
  
  let messageCount = 0;
  
  pubsub.on('message', (channel, message) => {
    messageCount++;
    const timestamp = new Date().toISOString();
    
    console.log(`📨 [${timestamp}] Message #${messageCount} on ${channel}:`);
    console.log('─'.repeat(50));
    
    try {
      const data = JSON.parse(message);
      
      // Format the message based on channel type
      switch (channel) {
        case 'shop-webhooks':
          console.log(`   🏪 Shop: ${data.shop}`);
          console.log(`   📝 Topic: ${data.topic}`);
          console.log(`   📦 Payload: ${JSON.stringify(data.payload, null, 6)}`);
          break;
          
        case 'control-tower':
          console.log(`   🎯 Type: ${data.type}`);
          console.log(`   📊 Data: ${JSON.stringify(data.data, null, 6)}`);
          break;
          
        case 'inventory_alerts':
          console.log(`   🚨 Alert: ${data.alert_type} (${data.severity})`);
          console.log(`   📦 SKU: ${data.sku}`);
          console.log(`   📍 Location: ${data.warehouse_code}`);
          console.log(`   📊 Quantity: ${data.current_quantity}`);
          break;
          
        case 'inventory_updates':
          console.log(`   📦 SKU: ${data.sku}`);
          console.log(`   📍 Location: ${data.locationId}`);
          console.log(`   📊 Quantity: ${data.quantity}`);
          break;
          
        default:
          console.log(`   📄 Raw: ${message}`);
      }
      
    } catch (e) {
      console.log(`   📄 Raw: ${message}`);
    }
    
    console.log('─'.repeat(50));
    console.log('');
  });
  
  // Handle errors
  pubsub.on('error', (error) => {
    console.error('❌ Pub/Sub error:', error);
  });
  
  // Handle cleanup
  process.on('SIGINT', async () => {
    console.log('\n🛑 Stopping monitor...');
    await pubsub.unsubscribe();
    await pubsub.quit();
    await redis.quit();
    console.log('✅ Monitor stopped');
    process.exit(0);
  });
  
  // Keep the process alive
  setInterval(() => {
    // Just to keep the process running
  }, 1000);
}

// Start monitoring
startMonitoring().catch(console.error);
