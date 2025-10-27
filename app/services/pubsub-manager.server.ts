/**
 * Pub/Sub Manager for Control Tower App
 * 
 * Manages Redis pub/sub channels for webhook events and app communication.
 * Implements the pattern: redis-pubsub://{shop-webhooks}:{control-tower}
 * 
 * Channel Structure:
 * - shop-webhooks: Webhook events from Shopify stores
 * - control-tower: Internal app communication and alerts
 */

import Redis from 'ioredis';
import { json } from '@remix-run/node';

// Types for pub/sub messages
export interface WebhookMessage {
  shop: string;
  topic: string;
  payload: any;
  timestamp: string;
  messageId: string;
}

export interface ControlTowerMessage {
  type: 'alert' | 'notification' | 'system' | 'analytics';
  data: any;
  timestamp: string;
  messageId: string;
}

export interface PubSubConfig {
  redisUrl: string;
  shopWebhooksChannel: string;
  controlTowerChannel: string;
  inventoryAlertsChannel: string;
  inventoryUpdatesChannel: string;
}

export class PubSubManager {
  private redis: Redis;
  private config: PubSubConfig;
  private isConnected: boolean = false;

  constructor(config?: Partial<PubSubConfig>) {
    this.config = {
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      shopWebhooksChannel: 'shop-webhooks',
      controlTowerChannel: 'control-tower',
      inventoryAlertsChannel: 'inventory_alerts',
      inventoryUpdatesChannel: 'inventory_updates',
      ...config
    };

    this.redis = new Redis(this.config.redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.redis.on('connect', () => {
      console.log('🔗 Redis connected for pub/sub');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis pub/sub error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis pub/sub connection closed');
      this.isConnected = false;
    });
  }

  /**
   * Publish webhook event to shop-webhooks channel
   */
  async publishWebhookEvent(shop: string, topic: string, payload: any): Promise<boolean> {
    try {
      const message: WebhookMessage = {
        shop,
        topic,
        payload,
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId()
      };

      const result = await this.redis.publish(
        this.config.shopWebhooksChannel,
        JSON.stringify(message)
      );

      console.log(`📤 Published webhook event: ${topic} for ${shop} (subscribers: ${result})`);
      return result > 0;
    } catch (error) {
      console.error('❌ Error publishing webhook event:', error);
      return false;
    }
  }

  /**
   * Publish control tower message to control-tower channel
   */
  async publishControlTowerMessage(type: ControlTowerMessage['type'], data: any): Promise<boolean> {
    try {
      const message: ControlTowerMessage = {
        type,
        data,
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId()
      };

      const result = await this.redis.publish(
        this.config.controlTowerChannel,
        JSON.stringify(message)
      );

      console.log(`📤 Published control tower message: ${type} (subscribers: ${result})`);
      return result > 0;
    } catch (error) {
      console.error('❌ Error publishing control tower message:', error);
      return false;
    }
  }

  /**
   * Publish inventory alert
   */
  async publishInventoryAlert(alert: any): Promise<boolean> {
    try {
      const result = await this.redis.publish(
        this.config.inventoryAlertsChannel,
        JSON.stringify(alert)
      );

      console.log(`📤 Published inventory alert: ${alert.id} (subscribers: ${result})`);
      return result > 0;
    } catch (error) {
      console.error('❌ Error publishing inventory alert:', error);
      return false;
    }
  }

  /**
   * Publish inventory update
   */
  async publishInventoryUpdate(sku: string, locationId: string, quantity: number): Promise<boolean> {
    try {
      const update = {
        sku,
        locationId,
        quantity,
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId()
      };

      const result = await this.redis.publish(
        this.config.inventoryUpdatesChannel,
        JSON.stringify(update)
      );

      console.log(`📤 Published inventory update: ${sku} (subscribers: ${result})`);
      return result > 0;
    } catch (error) {
      console.error('❌ Error publishing inventory update:', error);
      return false;
    }
  }

  /**
   * Subscribe to webhook events
   */
  async subscribeToWebhookEvents(callback: (message: WebhookMessage) => void): Promise<void> {
    try {
      const pubsub = this.redis.duplicate();
      await pubsub.subscribe(this.config.shopWebhooksChannel);

      console.log(`📥 Subscribed to webhook events on channel: ${this.config.shopWebhooksChannel}`);

      pubsub.on('message', (channel, message) => {
        try {
          const webhookMessage: WebhookMessage = JSON.parse(message);
          callback(webhookMessage);
        } catch (error) {
          console.error('❌ Error parsing webhook message:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error subscribing to webhook events:', error);
    }
  }

  /**
   * Subscribe to control tower messages
   */
  async subscribeToControlTowerMessages(callback: (message: ControlTowerMessage) => void): Promise<void> {
    try {
      const pubsub = this.redis.duplicate();
      await pubsub.subscribe(this.config.controlTowerChannel);

      console.log(`📥 Subscribed to control tower messages on channel: ${this.config.controlTowerChannel}`);

      pubsub.on('message', (channel, message) => {
        try {
          const controlTowerMessage: ControlTowerMessage = JSON.parse(message);
          callback(controlTowerMessage);
        } catch (error) {
          console.error('❌ Error parsing control tower message:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error subscribing to control tower messages:', error);
    }
  }

  /**
   * Subscribe to inventory alerts
   */
  async subscribeToInventoryAlerts(callback: (alert: any) => void): Promise<void> {
    try {
      const pubsub = this.redis.duplicate();
      await pubsub.subscribe(this.config.inventoryAlertsChannel);

      console.log(`📥 Subscribed to inventory alerts on channel: ${this.config.inventoryAlertsChannel}`);

      pubsub.on('message', (channel, message) => {
        try {
          const alert = JSON.parse(message);
          callback(alert);
        } catch (error) {
          console.error('❌ Error parsing inventory alert:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error subscribing to inventory alerts:', error);
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(): Promise<{
    shopWebhooks: { subscribers: number; channel: string };
    controlTower: { subscribers: number; channel: string };
    inventoryAlerts: { subscribers: number; channel: string };
    inventoryUpdates: { subscribers: number; channel: string };
  }> {
    try {
      const [shopWebhooks, controlTower, inventoryAlerts, inventoryUpdates] = await Promise.all([
        this.redis.pubsub('NUMSUB', this.config.shopWebhooksChannel),
        this.redis.pubsub('NUMSUB', this.config.controlTowerChannel),
        this.redis.pubsub('NUMSUB', this.config.inventoryAlertsChannel),
        this.redis.pubsub('NUMSUB', this.config.inventoryUpdatesChannel)
      ]);

      return {
        shopWebhooks: {
          subscribers: shopWebhooks[1] || 0,
          channel: this.config.shopWebhooksChannel
        },
        controlTower: {
          subscribers: controlTower[1] || 0,
          channel: this.config.controlTowerChannel
        },
        inventoryAlerts: {
          subscribers: inventoryAlerts[1] || 0,
          channel: this.config.inventoryAlertsChannel
        },
        inventoryUpdates: {
          subscribers: inventoryUpdates[1] || 0,
          channel: this.config.inventoryUpdatesChannel
        }
      };
    } catch (error) {
      console.error('❌ Error getting channel info:', error);
      return {
        shopWebhooks: { subscribers: 0, channel: this.config.shopWebhooksChannel },
        controlTower: { subscribers: 0, channel: this.config.controlTowerChannel },
        inventoryAlerts: { subscribers: 0, channel: this.config.inventoryAlertsChannel },
        inventoryUpdates: { subscribers: 0, channel: this.config.inventoryUpdatesChannel }
      };
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get pub/sub URL pattern
   */
  getPubSubUrl(): string {
    return `redis-pubsub://${this.config.shopWebhooksChannel}:${this.config.controlTowerChannel}`;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('🔌 Pub/Sub manager closed');
    } catch (error) {
      console.error('❌ Error closing pub/sub manager:', error);
    }
  }
}

// Singleton instance
let pubSubManager: PubSubManager | null = null;

export function getPubSubManager(): PubSubManager {
  if (!pubSubManager) {
    pubSubManager = new PubSubManager();
  }
  return pubSubManager;
}

export default PubSubManager;
