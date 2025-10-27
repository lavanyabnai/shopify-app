/**
 * Redis Cache Service
 *
 * Provides a caching layer for analytics data to improve dashboard performance.
 * Target: <500ms load time on cache hit (vs <2s from database)
 *
 * Features:
 * - Connection pooling
 * - Graceful fallback if Redis unavailable
 * - Key versioning for cache invalidation
 * - TTL-based expiration
 * - Cache warming strategies
 */

import { createClient, type RedisClientType } from 'redis';

// Cache key version - increment to invalidate all caches
const CACHE_VERSION = 'v1';

// Default TTL: 5 minutes (300 seconds)
const DEFAULT_TTL = 300;

// Cache key prefixes
export const CACHE_KEYS = {
  ANALYTICS_SNAPSHOT: (shop: string) => `${CACHE_VERSION}:analytics:snapshot:${shop}`,
  ANALYTICS_COMPUTED: (shop: string) => `${CACHE_VERSION}:analytics:computed:${shop}`,
  SYNC_STATUS: (shop: string) => `${CACHE_VERSION}:sync:status:${shop}`,
  PRODUCT_DATA: (shop: string) => `${CACHE_VERSION}:products:${shop}`,
  ORDER_DATA: (shop: string) => `${CACHE_VERSION}:orders:${shop}`,
  WAR_ROOM_DEFCON: (shop: string) => `${CACHE_VERSION}:war-room:defcon:${shop}`,
  WAR_ROOM_REVENUE_RISK: (shop: string) => `${CACHE_VERSION}:war-room:revenue-risk:${shop}`,
  WAR_ROOM_VELOCITY: (shop: string) => `${CACHE_VERSION}:war-room:velocity:${shop}`,
  WAR_ROOM_PREDICTIONS: (shop: string, horizon: string) => `${CACHE_VERSION}:war-room:predictions:${horizon}:${shop}`,
};

/**
 * Redis client singleton
 */
class CacheService {
  private client: RedisClientType | null = null;
  private isConnecting = false;
  private isConnected = false;
  private connectionError: Error | null = null;

  /**
   * Get or create Redis client
   */
  private async getClient(): Promise<RedisClientType | null> {
    // Return existing connection
    if (this.isConnected && this.client) {
      return this.client;
    }

    // Avoid multiple connection attempts
    if (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.isConnected ? this.client : null;
    }

    try {
      this.isConnecting = true;

      // Get Redis URL from environment (optional)
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      console.log('🔌 Connecting to Redis...', redisUrl.replace(/:[^:]*@/, ':***@'));

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000, // 5 second timeout
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.warn('⚠️ Redis reconnection failed after 3 attempts');
              return new Error('Redis reconnection limit reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Handle errors
      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
        this.connectionError = err;
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
        this.connectionError = null;
      });

      this.client.on('disconnect', () => {
        console.log('🔌 Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();

      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.connectionError = error as Error;
      this.isConnected = false;
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Get value from cache
   * Returns null if not found or on error
   */
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      const client = await this.getClient();
      if (!client) {
        console.log('⚠️ Redis unavailable, cache miss:', key);
        return null;
      }

      const value = await client.get(key);

      if (value === null) {
        console.log(`📭 Cache miss: ${key} (${Date.now() - startTime}ms)`);
        return null;
      }

      const parsed = JSON.parse(value);
      console.log(`📬 Cache hit: ${key} (${Date.now() - startTime}ms)`);
      return parsed as T;
    } catch (error) {
      console.error(`❌ Cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = DEFAULT_TTL): Promise<boolean> {
    const startTime = Date.now();

    try {
      const client = await this.getClient();
      if (!client) {
        console.log('⚠️ Redis unavailable, skipping cache set:', key);
        return false;
      }

      const serialized = JSON.stringify(value);
      await client.setEx(key, ttlSeconds, serialized);

      console.log(`💾 Cache set: ${key} (TTL: ${ttlSeconds}s, ${Date.now() - startTime}ms)`);
      return true;
    } catch (error) {
      console.error(`❌ Cache set error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete one or more keys from cache
   */
  async delete(...keys: string[]): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) {
        console.log('⚠️ Redis unavailable, skipping cache delete:', keys);
        return false;
      }

      const result = await client.del(keys);
      console.log(`🗑️ Cache delete: ${keys.join(', ')} (${result} keys deleted)`);
      return true;
    } catch (error) {
      console.error(`❌ Cache delete error for ${keys.join(', ')}:`, error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   * Useful for invalidating all caches for a shop
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const client = await this.getClient();
      if (!client) {
        console.log('⚠️ Redis unavailable, skipping pattern delete:', pattern);
        return 0;
      }

      // Scan for keys matching pattern
      const keys: string[] = [];
      for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        keys.push(key);
      }

      if (keys.length === 0) {
        console.log(`🔍 No keys found matching pattern: ${pattern}`);
        return 0;
      }

      const result = await client.del(keys);
      console.log(`🗑️ Pattern delete: ${pattern} (${result} keys deleted)`);
      return result;
    } catch (error) {
      console.error(`❌ Cache pattern delete error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate all caches for a shop
   */
  async invalidateShop(shop: string): Promise<void> {
    console.log(`🧹 Invalidating all caches for shop: ${shop}`);
    await this.deletePattern(`${CACHE_VERSION}:*:${shop}`);
  }

  /**
   * Check if Redis is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;

      await client.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const client = await this.getClient();
      if (!client) {
        return {
          connected: false,
          error: this.connectionError?.message || 'Not connected',
        };
      }

      const info = await client.info('stats');
      const lines = info.split('\r\n');
      const stats: Record<string, string> = {};

      lines.forEach((line) => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });

      return {
        connected: true,
        keyspaceHits: stats.keyspace_hits,
        keyspaceMisses: stats.keyspace_misses,
        hitRate: stats.keyspace_hits && stats.keyspace_misses
          ? (parseInt(stats.keyspace_hits) / (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses)) * 100).toFixed(2) + '%'
          : 'N/A',
      };
    } catch (error) {
      return {
        connected: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Warm cache with data
   * Useful for preloading frequently accessed data
   */
  async warm(key: string, fetcher: () => Promise<any>, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
    try {
      console.log(`🔥 Warming cache: ${key}`);
      const data = await fetcher();
      await this.set(key, data, ttlSeconds);
    } catch (error) {
      console.error(`❌ Cache warming error for ${key}:`, error);
    }
  }

  /**
   * Get or set pattern - fetch from cache, or compute and cache if missing
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = DEFAULT_TTL
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    console.log(`🔄 Cache miss, fetching data: ${key}`);
    const data = await fetcher();

    // Store in cache (fire and forget)
    this.set(key, data, ttlSeconds).catch((err) => {
      console.error(`⚠️ Failed to cache data for ${key}:`, err);
    });

    return data;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('👋 Redis connection closed');
    }
  }
}

// Singleton instance
const cache = new CacheService();

export default cache;

/**
 * Utility function for cache key generation
 */
export function getCacheKey(prefix: string, ...parts: string[]): string {
  return `${CACHE_VERSION}:${prefix}:${parts.join(':')}`;
}
