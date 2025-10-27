/**
 * Pub/Sub Setup Verification
 * 
 * This script checks if the pub/sub system is properly configured
 * and ready to receive webhook events.
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function checkSetup() {
  console.log('🔍 Checking Pub/Sub Setup...\n');
  
  try {
    // Test Redis connection
    console.log('1️⃣ Testing Redis connection...');
    const redis = new Redis(REDIS_URL);
    await redis.ping();
    console.log('   ✅ Redis connection successful');
    
    // Check channel info
    console.log('\n2️⃣ Checking channel information...');
    const channels = ['shop-webhooks', 'control-tower', 'inventory_alerts', 'inventory_updates'];
    
    for (const channel of channels) {
      try {
        const result = await redis.pubsub('NUMSUB', channel);
        const subscribers = result[1] || 0;
        console.log(`   📺 ${channel}: ${subscribers} subscribers`);
      } catch (error) {
        console.log(`   ❌ ${channel}: Error checking subscribers`);
      }
    }
    
    // Test publishing a message
    console.log('\n3️⃣ Testing message publishing...');
    const testMessage = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Setup verification test'
    };
    
    const result = await redis.publish('shop-webhooks', JSON.stringify(testMessage));
    console.log(`   📤 Test message published (${result} subscribers received)`);
    
    // Test the pub/sub URL pattern
    console.log('\n4️⃣ Pub/Sub URL Pattern:');
    console.log('   🔗 redis-pubsub://shop-webhooks:control-tower');
    console.log('   📋 This pattern represents:');
    console.log('      - shop-webhooks: Shopify webhook events');
    console.log('      - control-tower: Internal app communication');
    
    console.log('\n✅ Pub/Sub system is ready!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: node test-pubsub-monitor.js (in another terminal)');
    console.log('   2. Trigger webhooks: shopify webhook trigger --topic orders/create');
    console.log('   3. Watch for messages in the monitor');
    console.log('   4. Visit /pubsub-dashboard for web interface');
    
    await redis.quit();
    
  } catch (error) {
    console.error('❌ Setup check failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure Redis is running: redis-cli ping');
    console.log('   2. Check REDIS_URL environment variable');
    console.log('   3. Install Redis: sudo apt-get install redis-server');
    process.exit(1);
  }
}

checkSetup().catch(console.error);
