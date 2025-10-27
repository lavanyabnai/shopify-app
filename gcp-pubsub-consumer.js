#!/usr/bin/env node

/**
 * Google Cloud Pub/Sub Consumer
 *
 * Background process that continuously listens for Shopify webhook events
 * from Google Cloud Pub/Sub and processes them.
 *
 * Usage:
 *   node gcp-pubsub-consumer.js
 *   npm run gcp-consumer
 *
 * Environment Variables Required:
 *   - GOOGLE_CLOUD_PROJECT_ID
 *   - GOOGLE_CLOUD_TOPIC_ID
 *   - GOOGLE_CLOUD_SUBSCRIPTION_ID
 *   - GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_CREDENTIALS_JSON
 */

import { getGCPPubSubService } from './app/services/gcp-pubsub.server.ts';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Google Cloud Pub/Sub Consumer for Shopify Webhooks    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Check environment variables
  const requiredEnvVars = [
    'GOOGLE_CLOUD_PROJECT_ID',
    'GOOGLE_CLOUD_TOPIC_ID',
    'GOOGLE_CLOUD_SUBSCRIPTION_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('');
    console.error('Please set these variables in your .env file or environment.');
    console.error('See GOOGLE_PUBSUB_SETUP_GUIDE.md for details.');
    process.exit(1);
  }

  // Check credentials
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    console.warn('⚠️  WARNING: No GCP credentials configured');
    console.warn('   Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_CREDENTIALS_JSON');
    console.warn('   Will attempt to use Application Default Credentials...');
    console.warn('');
  }

  // Initialize service
  const gcpPubSub = getGCPPubSubService();

  console.log('📋 Configuration:');
  console.log(`   Project ID:      ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
  console.log(`   Topic ID:        ${process.env.GOOGLE_CLOUD_TOPIC_ID}`);
  console.log(`   Subscription ID: ${process.env.GOOGLE_CLOUD_SUBSCRIPTION_ID}`);
  console.log('');

  console.log('🔍 Verifying connection to Google Cloud Pub/Sub...');
  const isConnected = await gcpPubSub.verifyConnection();

  if (!isConnected) {
    console.error('');
    console.error('❌ Failed to connect to Google Cloud Pub/Sub');
    console.error('');
    console.error('Troubleshooting steps:');
    console.error('1. Verify your GCP project ID is correct');
    console.error('2. Verify the topic exists in your GCP project');
    console.error('3. Verify the subscription exists');
    console.error('4. Check your GCP credentials');
    console.error('5. Ensure the Pub/Sub API is enabled');
    console.error('');
    console.error('See GOOGLE_PUBSUB_SETUP_GUIDE.md for detailed setup instructions.');
    process.exit(1);
  }

  console.log('');
  console.log('✅ Successfully connected to Google Cloud Pub/Sub');
  console.log('');

  // Get subscription info
  const subInfo = await gcpPubSub.getSubscriptionInfo();
  if (subInfo) {
    console.log('📊 Subscription Information:');
    console.log(`   Name:                ${subInfo.name}`);
    console.log(`   Topic:               ${subInfo.topic}`);
    console.log(`   Ack Deadline:        ${subInfo.ackDeadline} seconds`);
    console.log(`   Retention Duration:  ${Math.floor(subInfo.messageRetentionDuration / 86400)} days`);
    console.log('');
  }

  // Display webhook URL for Shopify
  const webhookUrl = gcpPubSub.getShopifyWebhookUrl();
  console.log('🔗 Shopify Webhook Configuration:');
  console.log('');
  console.log('   When configuring webhooks in Shopify, use this address:');
  console.log('');
  console.log(`   ${webhookUrl}`);
  console.log('');
  console.log('   Example:');
  console.log('   shopify webhook trigger --topic orders/create');
  console.log('');

  // Start consumer
  console.log('🚀 Starting consumer...');
  console.log('');

  await gcpPubSub.startConsumer((message) => {
    // Optional: Additional logging or processing
    console.log(`📨 Webhook received: ${message.topic} from ${message.shop}`);
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('');
    console.log('');
    console.log('🛑 Shutdown signal received...');
    await gcpPubSub.stopConsumer();
    console.log('✅ Consumer stopped gracefully');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process alive
  console.log('💡 Consumer is running. Press Ctrl+C to stop.');
  console.log('');
  console.log('─'.repeat(60));
  console.log('');
}

// Run the consumer
main().catch((error) => {
  console.error('');
  console.error('❌ Fatal error:');
  console.error(error);
  console.error('');
  process.exit(1);
});
