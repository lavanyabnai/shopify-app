/**
 * Google Cloud Pub/Sub Service
 *
 * Consumes webhook events from Shopify via Google Cloud Pub/Sub.
 * This is different from the internal Redis Pub/Sub system.
 *
 * Flow:
 * 1. Shopify sends webhook to GCP Pub/Sub topic
 * 2. This service pulls messages from GCP subscription
 * 3. Messages are processed and saved to database
 * 4. (Optional) Events are published to internal Redis Pub/Sub
 */

import type { Message } from '@google-cloud/pubsub';
import { PubSub } from '@google-cloud/pubsub';
import db from '../db.server';
import { generateDailyAnalytics } from './analytics-aggregator.server';
import cache, { CACHE_KEYS } from './cache.server';
import { getPubSubManager } from './pubsub-manager.server';

export interface GCPPubSubConfig {
  projectId: string;
  topicId: string;
  subscriptionId: string;
  credentials?: any;
}

export interface ShopifyWebhookMessage {
  shop: string;
  topic: string;
  payload: any;
  webhookId?: string;
  apiVersion?: string;
}

export class GCPPubSubService {
  private pubsub: PubSub;
  private config: GCPPubSubConfig;
  private isRunning: boolean = false;

  constructor(config?: Partial<GCPPubSubConfig>) {
    // Load configuration from environment variables
    this.config = {
      projectId: config?.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || '',
      topicId: config?.topicId || process.env.GOOGLE_CLOUD_TOPIC_ID || 'shopify-webhooks',
      subscriptionId: config?.subscriptionId || process.env.GOOGLE_CLOUD_SUBSCRIPTION_ID || 'shopify-webhooks-sub',
      credentials: config?.credentials
    };

    // Initialize Pub/Sub client
    const clientConfig: any = {
      projectId: this.config.projectId
    };

    // Use credentials from environment variable if available
    if (process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
      try {
        clientConfig.credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON);
        console.log('🔐 Using GCP credentials from environment variable');
      } catch (error) {
        console.error('❌ Failed to parse GOOGLE_CLOUD_CREDENTIALS_JSON:', error);
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('🔐 Using GCP credentials from file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
      // Credentials will be loaded automatically from file
    } else if (this.config.credentials) {
      clientConfig.credentials = this.config.credentials;
      console.log('🔐 Using GCP credentials from config');
    } else {
      console.warn('⚠️ No GCP credentials configured. Will use Application Default Credentials.');
    }

    this.pubsub = new PubSub(clientConfig);
  }

  /**
   * Get the Pub/Sub URL pattern for Shopify webhook configuration
   * Format: pubsub://{PROJECT_ID}:{TOPIC_ID}
   */
  getShopifyWebhookUrl(): string {
    return `pubsub://${this.config.projectId}:${this.config.topicId}`;
  }

  /**
   * Verify connection to GCP Pub/Sub
   */
  async verifyConnection(): Promise<boolean> {
    try {
      console.log('🔍 Verifying GCP Pub/Sub connection...');

      // Check if project exists
      const [topics] = await this.pubsub.getTopics();
      console.log(`✅ Connected to GCP project: ${this.config.projectId}`);
      console.log(`📋 Found ${topics.length} topics`);

      // Check if our topic exists
      const topic = this.pubsub.topic(this.config.topicId);
      const [topicExists] = await topic.exists();

      if (!topicExists) {
        console.error(`❌ Topic "${this.config.topicId}" does not exist`);
        return false;
      }

      console.log(`✅ Topic "${this.config.topicId}" exists`);

      // Check if subscription exists
      const subscription = this.pubsub.subscription(this.config.subscriptionId);
      const [subExists] = await subscription.exists();

      if (!subExists) {
        console.error(`❌ Subscription "${this.config.subscriptionId}" does not exist`);
        return false;
      }

      console.log(`✅ Subscription "${this.config.subscriptionId}" exists`);
      return true;

    } catch (error: any) {
      console.error('❌ Failed to verify GCP Pub/Sub connection:', error.message);
      return false;
    }
  }

  /**
   * Publish a test message to the topic (for testing only)
   */
  async publishTestMessage(message: any): Promise<string | null> {
    try {
      const topic = this.pubsub.topic(this.config.topicId);
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const messageId = await topic.publishMessage({ data: messageBuffer });

      console.log(`📤 Published test message: ${messageId}`);
      return messageId;
    } catch (error: any) {
      console.error('❌ Failed to publish test message:', error.message);
      return null;
    }
  }

  /**
   * Start listening for webhook messages
   * This should run as a background process
   */
  async startConsumer(callback?: (message: ShopifyWebhookMessage) => void): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Consumer is already running');
      return;
    }

    console.log('🚀 Starting GCP Pub/Sub consumer...');
    console.log(`📥 Listening to subscription: ${this.config.subscriptionId}`);

    const subscription = this.pubsub.subscription(this.config.subscriptionId);

    // Configure subscription options
    subscription.setOptions({
      flowControl: {
        maxMessages: 10, // Process up to 10 messages concurrently
        allowExcessMessages: false
      },
      ackDeadline: 60 // 60 seconds to process and acknowledge
    });

    this.isRunning = true;

    // Message handler
    const messageHandler = async (message: Message) => {
      const startTime = Date.now();
      console.log(`📥 Received message ${message.id} (publish time: ${message.publishTime})`);

      try {
        // Parse message data
        const data = message.data.toString();
        let webhookData: any;

        try {
          webhookData = JSON.parse(data);
        } catch (parseError) {
          console.error('❌ Failed to parse message data:', parseError);
          message.ack(); // Acknowledge to prevent redelivery
          return;
        }

        // Extract webhook information
        const webhookMessage: ShopifyWebhookMessage = {
          shop: webhookData.shop || message.attributes?.['X-Shopify-Shop-Domain'] || 'unknown',
          topic: webhookData.topic || message.attributes?.['X-Shopify-Topic'] || 'unknown',
          payload: webhookData.payload || webhookData,
          webhookId: message.attributes?.['X-Shopify-Webhook-Id'],
          apiVersion: message.attributes?.['X-Shopify-API-Version']
        };

        console.log(`📦 Processing webhook: ${webhookMessage.topic} for shop: ${webhookMessage.shop}`);

        // Process the webhook
        await this.processWebhook(webhookMessage);

        // Execute callback if provided
        if (callback) {
          await callback(webhookMessage);
        }

        // Acknowledge the message
        message.ack();

        const duration = Date.now() - startTime;
        console.log(`✅ Successfully processed message ${message.id} in ${duration}ms`);

      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`❌ Error processing message ${message.id} after ${duration}ms:`, error.message);

        // Nack the message to allow redelivery
        // Pub/Sub will retry with exponential backoff
        message.nack();
      }
    };

    // Error handler
    const errorHandler = (error: Error) => {
      console.error('❌ Subscription error:', error);
    };

    // Attach handlers
    subscription.on('message', messageHandler);
    subscription.on('error', errorHandler);

    console.log('✅ GCP Pub/Sub consumer started successfully');
    console.log('👂 Waiting for webhook messages...');
  }

  /**
   * Stop the consumer
   */
  async stopConsumer(): Promise<void> {
    if (!this.isRunning) {
      console.warn('⚠️ Consumer is not running');
      return;
    }

    console.log('🛑 Stopping GCP Pub/Sub consumer...');

    const subscription = this.pubsub.subscription(this.config.subscriptionId);
    subscription.removeAllListeners();

    this.isRunning = false;
    console.log('✅ Consumer stopped');
  }

  /**
   * Process a webhook message
   */
  private async processWebhook(webhookMessage: ShopifyWebhookMessage): Promise<void> {
    const { shop, topic, payload } = webhookMessage;

    // Route to appropriate handler based on topic
    if (topic.startsWith('orders/')) {
      await this.processOrderWebhook(shop, topic, payload);
    } else if (topic.startsWith('products/')) {
      await this.processProductWebhook(shop, topic, payload);
    } else if (topic.startsWith('inventory_levels/')) {
      await this.processInventoryWebhook(shop, topic, payload);
    } else {
      console.log(`⚠️ No handler for topic: ${topic}`);
    }

    // Publish to internal Redis Pub/Sub for real-time updates
    try {
      const redisPubSub = getPubSubManager();
      await redisPubSub.publishWebhookEvent(shop, topic, payload);
    } catch (error: any) {
      console.error('⚠️ Failed to publish to Redis Pub/Sub:', error.message);
      // Don't throw - GCP webhook should succeed even if Redis fails
    }
  }

  /**
   * Process order webhook
   */
  private async processOrderWebhook(shop: string, topic: string, order: any): Promise<void> {
    console.log(`💰 Processing order webhook: ${order.name || order.id}`);

    // Map Shopify order to database schema
    const orderData = {
      id: order.admin_graphql_api_id || `gid://shopify/Order/${order.id}`,
      shopifyOrderId: order.id.toString(),
      name: order.name,
      shop,
      email: null, // Protected field
      totalPrice: parseFloat(order.total_price || "0"),
      currency: order.currency || "USD",
      financialStatus: order.financial_status?.toUpperCase(),
      fulfillmentStatus: order.fulfillment_status?.toUpperCase(),
      processedAt: order.processed_at ? new Date(order.processed_at) : null,
      createdAt: new Date(order.created_at),
      customerId: order.customer?.id?.toString(),
      customerEmail: null, // Protected field
      shippingCity: order.shipping_address?.city,
      shippingProvince: order.shipping_address?.province,
      shippingCountry: order.shipping_address?.country,
    };

    // Map line items
    const lineItems = (order.line_items || []).map((item: any) => ({
      productId: item.product_id?.toString() || "unknown",
      productTitle: item.title || "Unknown Product",
      variantId: item.variant_id?.toString() || "unknown",
      variantTitle: item.variant_title,
      quantity: item.quantity || 0,
      price: parseFloat(item.price || "0"),
    }));

    // Save to database
    await db.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: orderData.id },
        create: {
          ...orderData,
          lineItems: { create: lineItems },
        },
        update: {
          ...orderData,
          lineItems: {
            deleteMany: {},
            create: lineItems,
          },
        },
      });

      // Update sync status
      await tx.syncStatus.upsert({
        where: { shop },
        create: {
          shop,
          lastOrderSync: new Date(),
          totalOrders: 1,
        },
        update: {
          lastOrderSync: new Date(),
          totalOrders: { increment: topic === "orders/create" ? 1 : 0 },
        },
      });
    });

    console.log(`💾 Saved order ${order.name} (${lineItems.length} items)`);

    // Invalidate analytics cache
    try {
      await cache.delete(CACHE_KEYS.ANALYTICS_SNAPSHOT(shop));
      console.log(`🧹 Invalidated analytics cache`);
    } catch (error: any) {
      console.error(`⚠️ Failed to invalidate cache:`, error.message);
    }
  }

  /**
   * Process product webhook
   */
  private async processProductWebhook(shop: string, topic: string, product: any): Promise<void> {
    console.log(`📦 Processing product webhook: ${product.title || product.id}`);

    const productData = {
      id: product.admin_graphql_api_id || `gid://shopify/Product/${product.id}`,
      shopifyProductId: product.id.toString(),
      title: product.title,
      shop,
      vendor: product.vendor,
      productType: product.product_type,
      status: product.status?.toUpperCase(),
      totalInventory: product.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at),
    };

    await db.$transaction(async (tx) => {
      await tx.product.upsert({
        where: { id: productData.id },
        create: productData,
        update: productData,
      });

      await tx.syncStatus.upsert({
        where: { shop },
        create: {
          shop,
          lastProductSync: new Date(),
          totalProducts: 1,
        },
        update: {
          lastProductSync: new Date(),
          totalProducts: { increment: topic === "products/create" ? 1 : 0 },
        },
      });
    });

    console.log(`💾 Saved product ${product.title}`);

    // Invalidate cache
    try {
      await cache.delete(CACHE_KEYS.ANALYTICS_SNAPSHOT(shop));
    } catch (error: any) {
      console.error(`⚠️ Failed to invalidate cache:`, error.message);
    }
  }

  /**
   * Process inventory level webhook
   */
  private async processInventoryWebhook(shop: string, topic: string, inventory: any): Promise<void> {
    console.log(`📊 Processing inventory webhook for item: ${inventory.inventory_item_id}`);

    // Publish inventory update to Redis Pub/Sub
    try {
      const redisPubSub = getPubSubManager();
      await redisPubSub.publishInventoryUpdate(
        inventory.inventory_item_id?.toString() || 'unknown',
        inventory.location_id?.toString() || 'unknown',
        inventory.available || 0
      );
    } catch (error: any) {
      console.error('⚠️ Failed to publish inventory update:', error.message);
    }
  }

  /**
   * Get subscription information
   */
  async getSubscriptionInfo(): Promise<{
    name: string;
    topic: string;
    ackDeadline: number;
    messageRetentionDuration: number;
  } | null> {
    try {
      const subscription = this.pubsub.subscription(this.config.subscriptionId);
      const [metadata] = await subscription.getMetadata();

      return {
        name: metadata.name || this.config.subscriptionId,
        topic: metadata.topic || this.config.topicId,
        ackDeadline: metadata.ackDeadlineSeconds || 60,
        messageRetentionDuration: parseInt(metadata.messageRetentionDuration?.seconds || '604800')
      };
    } catch (error: any) {
      console.error('❌ Failed to get subscription info:', error.message);
      return null;
    }
  }
}

// Singleton instance
let gcpPubSubService: GCPPubSubService | null = null;

export function getGCPPubSubService(): GCPPubSubService {
  if (!gcpPubSubService) {
    gcpPubSubService = new GCPPubSubService();
  }
  return gcpPubSubService;
}

export default GCPPubSubService;
