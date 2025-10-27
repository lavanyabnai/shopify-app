#!/usr/bin/env node

/**
 * Google Cloud Pub/Sub Setup Verification Script
 *
 * Checks if your GCP Pub/Sub is properly configured for Shopify webhooks.
 *
 * Usage:
 *   node check-gcp-pubsub-setup.js
 */

import { PubSub } from '@google-cloud/pubsub';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkSetup() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Google Cloud Pub/Sub Setup Verification for Shopify     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const checks = {
    envVars: false,
    credentials: false,
    connection: false,
    topic: false,
    subscription: false,
    permissions: false
  };

  // Check 1: Environment Variables
  console.log('📋 Check 1: Environment Variables');
  console.log('─'.repeat(60));

  const requiredVars = {
    GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
    GOOGLE_CLOUD_TOPIC_ID: process.env.GOOGLE_CLOUD_TOPIC_ID,
    GOOGLE_CLOUD_SUBSCRIPTION_ID: process.env.GOOGLE_CLOUD_SUBSCRIPTION_ID
  };

  let allVarsPresent = true;
  for (const [varName, varValue] of Object.entries(requiredVars)) {
    if (varValue) {
      console.log(`✅ ${varName}: ${varValue}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allVarsPresent = false;
    }
  }

  checks.envVars = allVarsPresent;
  console.log('');

  if (!allVarsPresent) {
    console.error('❌ Missing required environment variables');
    console.error('Add these to your .env file:');
    console.error('');
    console.error('GOOGLE_CLOUD_PROJECT_ID=your-project-id');
    console.error('GOOGLE_CLOUD_TOPIC_ID=shopify-webhooks');
    console.error('GOOGLE_CLOUD_SUBSCRIPTION_ID=shopify-webhooks-sub');
    console.error('');
    printSummary(checks);
    process.exit(1);
  }

  // Check 2: Credentials
  console.log('🔐 Check 2: GCP Credentials');
  console.log('─'.repeat(60));

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log(`✅ GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    checks.credentials = true;
  } else if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    console.log('✅ GOOGLE_CLOUD_CREDENTIALS_JSON: Set (JSON content)');
    checks.credentials = true;
  } else {
    console.log('⚠️  No credentials configured');
    console.log('   Will attempt to use Application Default Credentials');
    console.log('   This may work if running on GCP or gcloud is configured');
  }
  console.log('');

  // Initialize Pub/Sub client
  const clientConfig = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
  };

  if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    try {
      clientConfig.credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON);
    } catch (error) {
      console.error('❌ Failed to parse GOOGLE_CLOUD_CREDENTIALS_JSON');
      printSummary(checks);
      process.exit(1);
    }
  }

  const pubsub = new PubSub(clientConfig);

  // Check 3: Connection to GCP
  console.log('🔗 Check 3: Connection to Google Cloud');
  console.log('─'.repeat(60));

  try {
    const [topics] = await pubsub.getTopics();
    console.log(`✅ Connected to project: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
    console.log(`📋 Found ${topics.length} topic(s) in project`);
    checks.connection = true;
  } catch (error) {
    console.error('❌ Failed to connect to Google Cloud:');
    console.error(`   ${error.message}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify GOOGLE_CLOUD_PROJECT_ID is correct');
    console.error('2. Verify credentials have access to this project');
    console.error('3. Ensure Pub/Sub API is enabled');
    console.error('   https://console.cloud.google.com/apis/library/pubsub.googleapis.com');
    printSummary(checks);
    process.exit(1);
  }
  console.log('');

  // Check 4: Topic Exists
  console.log('📤 Check 4: Pub/Sub Topic');
  console.log('─'.repeat(60));

  const topicId = process.env.GOOGLE_CLOUD_TOPIC_ID;
  const topic = pubsub.topic(topicId);

  try {
    const [exists] = await topic.exists();
    if (exists) {
      console.log(`✅ Topic exists: ${topicId}`);

      // Get topic metadata
      const [metadata] = await topic.getMetadata();
      console.log(`   Full name: ${metadata.name}`);

      checks.topic = true;
    } else {
      console.error(`❌ Topic does not exist: ${topicId}`);
      console.error('');
      console.error('Create the topic:');
      console.error(`gcloud pubsub topics create ${topicId} --project=${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
      console.error('');
      console.error('Or via Cloud Console:');
      console.error('https://console.cloud.google.com/cloudpubsub/topic/list');
      printSummary(checks);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error checking topic: ${error.message}`);
    printSummary(checks);
    process.exit(1);
  }
  console.log('');

  // Check 5: Subscription Exists
  console.log('📥 Check 5: Pub/Sub Subscription');
  console.log('─'.repeat(60));

  const subscriptionId = process.env.GOOGLE_CLOUD_SUBSCRIPTION_ID;
  const subscription = pubsub.subscription(subscriptionId);

  try {
    const [exists] = await subscription.exists();
    if (exists) {
      console.log(`✅ Subscription exists: ${subscriptionId}`);

      // Get subscription metadata
      const [metadata] = await subscription.getMetadata();
      console.log(`   Topic: ${metadata.topic}`);
      console.log(`   Ack deadline: ${metadata.ackDeadlineSeconds} seconds`);
      console.log(`   Message retention: ${Math.floor(parseInt(metadata.messageRetentionDuration?.seconds || '604800') / 86400)} days`);

      checks.subscription = true;
    } else {
      console.error(`❌ Subscription does not exist: ${subscriptionId}`);
      console.error('');
      console.error('Create the subscription:');
      console.error(`gcloud pubsub subscriptions create ${subscriptionId} \\`);
      console.error(`  --topic=${topicId} \\`);
      console.error(`  --ack-deadline=60 \\`);
      console.error(`  --project=${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
      console.error('');
      console.error('Or via Cloud Console:');
      console.error('https://console.cloud.google.com/cloudpubsub/subscription/list');
      printSummary(checks);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error checking subscription: ${error.message}`);
    printSummary(checks);
    process.exit(1);
  }
  console.log('');

  // Check 6: Topic Permissions for Shopify
  console.log('🔒 Check 6: Topic Permissions');
  console.log('─'.repeat(60));

  try {
    const [policy] = await topic.iam.getPolicy();
    const bindings = policy.bindings || [];

    // Look for Shopify service account
    const shopifyServiceAccount = 'shopify-eventbridge@shopify-prs.iam.gserviceaccount.com';
    const hasShopifyPublisher = bindings.some(binding =>
      binding.role === 'roles/pubsub.publisher' &&
      binding.members?.includes(`serviceAccount:${shopifyServiceAccount}`)
    );

    if (hasShopifyPublisher) {
      console.log('✅ Shopify service account has publisher permission');
      console.log(`   Service account: ${shopifyServiceAccount}`);
      checks.permissions = true;
    } else {
      console.log('⚠️  Shopify service account NOT found in topic permissions');
      console.log('');
      console.log('Grant publisher permission to Shopify:');
      console.log('');
      console.log('gcloud pubsub topics add-iam-policy-binding ' + topicId + ' \\');
      console.log(`  --member='serviceAccount:${shopifyServiceAccount}' \\`);
      console.log(`  --role='roles/pubsub.publisher' \\`);
      console.log(`  --project=${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
      console.log('');
      console.log('Or via Cloud Console:');
      console.log('1. Go to Pub/Sub → Topics → ' + topicId);
      console.log('2. Click "Permissions"');
      console.log('3. Click "Add Principal"');
      console.log(`4. Principal: ${shopifyServiceAccount}`);
      console.log('5. Role: Pub/Sub Publisher');
      console.log('');
      console.log('⚠️  Your app can still consume messages, but Shopify cannot send webhooks yet.');
    }
  } catch (error) {
    console.log(`⚠️  Could not check permissions: ${error.message}`);
    console.log('   This may be a permissions issue with your credentials');
  }
  console.log('');

  // Final Summary
  printSummary(checks);

  // Show Shopify webhook URL
  const webhookUrl = `pubsub://${process.env.GOOGLE_CLOUD_PROJECT_ID}:${topicId}`;
  console.log('');
  console.log('🎉 Next Steps:');
  console.log('─'.repeat(60));
  console.log('');
  console.log('1. Configure Shopify webhook with this address:');
  console.log('');
  console.log(`   ${webhookUrl}`);
  console.log('');
  console.log('2. Start the consumer:');
  console.log('');
  console.log('   npm run gcp-consumer');
  console.log('');
  console.log('3. Test with a Shopify webhook:');
  console.log('');
  console.log('   shopify webhook trigger --topic orders/create');
  console.log('');
  console.log('4. Monitor in Google Cloud Console:');
  console.log('');
  console.log(`   https://console.cloud.google.com/cloudpubsub/topic/detail/${topicId}`);
  console.log('');

  if (allChecksPass(checks)) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

function printSummary(checks) {
  console.log('');
  console.log('📊 Setup Summary:');
  console.log('─'.repeat(60));
  console.log(`${checks.envVars ? '✅' : '❌'} Environment Variables`);
  console.log(`${checks.credentials ? '✅' : '⚠️ '} GCP Credentials`);
  console.log(`${checks.connection ? '✅' : '❌'} Connection to Google Cloud`);
  console.log(`${checks.topic ? '✅' : '❌'} Pub/Sub Topic`);
  console.log(`${checks.subscription ? '✅' : '❌'} Pub/Sub Subscription`);
  console.log(`${checks.permissions ? '✅' : '⚠️ '} Topic Permissions (Shopify Publisher)`);
  console.log('');

  if (allChecksPass(checks)) {
    console.log('✅ All checks passed! Your setup is ready.');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
  }
}

function allChecksPass(checks) {
  return checks.envVars &&
         checks.connection &&
         checks.topic &&
         checks.subscription;
  // Note: credentials and permissions are warnings, not failures
}

// Run the check
checkSetup().catch((error) => {
  console.error('');
  console.error('❌ Unexpected error:');
  console.error(error);
  console.error('');
  process.exit(1);
});
