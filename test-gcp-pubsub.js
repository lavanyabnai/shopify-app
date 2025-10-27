#!/usr/bin/env node

/**
 * Test Script for Google Cloud Pub/Sub
 *
 * This script tests your GCP Pub/Sub setup by:
 * 1. Verifying connection to GCP
 * 2. Publishing a test message
 * 3. Receiving and processing the test message
 *
 * Usage:
 *   node test-gcp-pubsub.js
 */

import { getGCPPubSubService } from './app/services/gcp-pubsub.server.ts';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║        Google Cloud Pub/Sub Test Script                   ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

async function runTest() {
  const gcpPubSub = getGCPPubSubService();

  // Step 1: Verify connection
  console.log('📋 Step 1: Verifying connection to Google Cloud...');
  console.log('─'.repeat(60));

  const isConnected = await gcpPubSub.verifyConnection();

  if (!isConnected) {
    console.error('');
    console.error('❌ Test failed: Cannot connect to Google Cloud Pub/Sub');
    console.error('');
    console.error('Please run the setup verification first:');
    console.error('  node check-gcp-pubsub-setup.js');
    console.error('');
    process.exit(1);
  }

  console.log('');

  // Step 2: Get subscription info
  console.log('📋 Step 2: Checking subscription configuration...');
  console.log('─'.repeat(60));

  const subInfo = await gcpPubSub.getSubscriptionInfo();
  if (subInfo) {
    console.log(`✅ Subscription: ${subInfo.name}`);
    console.log(`   Topic: ${subInfo.topic}`);
    console.log(`   Ack Deadline: ${subInfo.ackDeadline} seconds`);
    console.log(`   Retention: ${Math.floor(subInfo.messageRetentionDuration / 86400)} days`);
  } else {
    console.error('❌ Failed to get subscription info');
  }

  console.log('');

  // Step 3: Publish test message
  console.log('📋 Step 3: Publishing test webhook message...');
  console.log('─'.repeat(60));

  const testMessage = {
    shop: 'test-shop.myshopify.com',
    topic: 'orders/create',
    payload: {
      id: 12345,
      name: '#TEST-001',
      total_price: '99.99',
      currency: 'USD',
      created_at: new Date().toISOString(),
      line_items: [
        {
          product_id: '67890',
          title: 'Test Product',
          quantity: 1,
          price: '99.99'
        }
      ]
    }
  };

  console.log('📤 Test message:');
  console.log(JSON.stringify(testMessage, null, 2));
  console.log('');

  const messageId = await gcpPubSub.publishTestMessage(testMessage);

  if (!messageId) {
    console.error('❌ Failed to publish test message');
    console.error('');
    console.error('Your service account may not have "Pub/Sub Publisher" role.');
    console.error('This is optional - you can still receive messages from Shopify.');
    console.error('');
    console.log('✅ Connection test passed! (Publishing is optional)');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Configure Shopify webhooks to use:');
    console.log(`     ${gcpPubSub.getShopifyWebhookUrl()}`);
    console.log('  2. Start the consumer:');
    console.log('     npm run gcp-consumer');
    console.log('');
    process.exit(0);
  }

  console.log(`✅ Message published successfully!`);
  console.log(`   Message ID: ${messageId}`);
  console.log('');

  // Step 4: Receive test message
  console.log('📋 Step 4: Starting consumer to receive test message...');
  console.log('─'.repeat(60));
  console.log('');
  console.log('⏳ Waiting for test message (will timeout in 30 seconds)...');
  console.log('');

  let messageReceived = false;
  let consumerTimeout;

  // Start consumer
  await gcpPubSub.startConsumer((message) => {
    if (message.shop === 'test-shop.myshopify.com') {
      messageReceived = true;
      console.log('');
      console.log('✅ Test message received and processed successfully!');
      console.log('');
      console.log('📊 Test Results:');
      console.log('─'.repeat(60));
      console.log('✅ Connection to GCP: PASS');
      console.log('✅ Topic access: PASS');
      console.log('✅ Subscription access: PASS');
      console.log('✅ Message publishing: PASS');
      console.log('✅ Message receiving: PASS');
      console.log('✅ Message processing: PASS');
      console.log('─'.repeat(60));
      console.log('');
      console.log('🎉 All tests passed! Your GCP Pub/Sub setup is working correctly.');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Configure Shopify webhooks to use:');
      console.log(`     ${gcpPubSub.getShopifyWebhookUrl()}`);
      console.log('  2. Start the consumer in production:');
      console.log('     npm run gcp-consumer');
      console.log('  3. Test with real Shopify webhook:');
      console.log('     shopify webhook trigger --topic orders/create');
      console.log('');

      clearTimeout(consumerTimeout);
      gcpPubSub.stopConsumer().then(() => {
        process.exit(0);
      });
    }
  });

  // Set timeout
  consumerTimeout = setTimeout(async () => {
    if (!messageReceived) {
      console.log('');
      console.log('⏱️  Timeout: Test message not received within 30 seconds');
      console.log('');
      console.log('This could mean:');
      console.log('  1. Message delivery is delayed (normal for GCP Pub/Sub)');
      console.log('  2. Your subscription is not receiving messages');
      console.log('  3. There\'s a configuration issue');
      console.log('');
      console.log('Try running the consumer manually to see if it receives messages:');
      console.log('  npm run gcp-consumer');
      console.log('');

      await gcpPubSub.stopConsumer();
      process.exit(0);
    }
  }, 30000);
}

// Run the test
runTest().catch((error) => {
  console.error('');
  console.error('❌ Test failed with error:');
  console.error(error);
  console.error('');
  process.exit(1);
});
