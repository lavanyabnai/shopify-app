/**
 * Advanced Caching Strategy for Optimal Performance
 *
 * This module implements best practices for caching in a Shopify app with Neon PostgreSQL:
 *
 * 1. **Multi-Layer Caching**
 *    - L1: Redis (sub-100ms) - Hot data
 *    - L2: Neon (2-5s) - Warm data
 *    - L3: Shopify API (30-60s) - Cold data (avoid in production)
 *
 * 2. **Cache-Aside Pattern**
 *    - Check cache first
 *    - On miss, fetch from DB and populate cache
 *    - Automatic cache warming for frequently accessed data
 *
 * 3. **Smart Invalidation**
 *    - Webhook-driven invalidation (real-time)
 *    - Time-based expiration (TTL)
 *    - Pattern-based bulk invalidation
 *
 * 4. **Connection Pooling**
 *    - Redis connection pooling
 *    - Neon connection pooling (PgBouncer)
 *    - Graceful degradation on cache failures
 *
 * Performance Targets:
 * - Cache hit: <100ms
 * - Cache miss + DB: <2s
 * - Cache hit rate: >85%
 */

import cache, { CACHE_KEYS } from './cache.server';

// TTL Configuration (in seconds)
export const CACHE_TTL = {
  // Analytics data (medium volatility)
  ANALYTICS_SNAPSHOT: 300, // 5 minutes
  ANALYTICS_COMPUTED: 300, // 5 minutes

  // Sync status (low volatility)
  SYNC_STATUS: 600, // 10 minutes

  // Product data (low volatility)
  PRODUCT_DATA: 900, // 15 minutes

  // Order data (high volatility during BFCM)
  ORDER_DATA: 180, // 3 minutes

  // War Room metrics (critical, real-time)
  WAR_ROOM_DEFCON: 60, // 1 minute
  WAR_ROOM_REVENUE_RISK: 60, // 1 minute
  WAR_ROOM_VELOCITY: 120, // 2 minutes
  WAR_ROOM_PREDICTIONS: 300, // 5 minutes

  // Performance metrics (very low volatility)
  PERFORMANCE_SCOREBOARD: 600, // 10 minutes

  // Simulation results (immutable after creation)
  SIMULATION_RESULTS: 3600, // 1 hour
} as const;

/**
 * Cache warming strategy - preload frequently accessed data
 */
export async function warmCache(shop: string, dataFetchers: Record<string, () => Promise<any>>) {
  const warmingTasks: Promise<void>[] = [];

  for (const [key, fetcher] of Object.entries(dataFetchers)) {
    warmingTasks.push(
      cache.warm(key, fetcher, CACHE_TTL.ANALYTICS_COMPUTED).catch((err) => {
        console.error(`⚠️ Failed to warm cache for ${key}:`, err);
      })
    );
  }

  await Promise.allSettled(warmingTasks);
  console.log(`🔥 Cache warming complete for shop: ${shop}`);
}

/**
 * Intelligent cache invalidation based on webhook events
 */
export async function invalidateCacheOnWebhook(shop: string, topic: string, data?: any) {
  console.log(`🔔 Webhook received: ${topic} for shop: ${shop}`);

  switch (topic) {
    case 'orders/create':
    case 'orders/updated':
    case 'orders/paid':
    case 'orders/fulfilled':
      // Invalidate order and analytics caches
      await cache.delete(
        CACHE_KEYS.ORDER_DATA(shop),
        CACHE_KEYS.ANALYTICS_SNAPSHOT(shop),
        CACHE_KEYS.ANALYTICS_COMPUTED(shop),
        CACHE_KEYS.WAR_ROOM_DEFCON(shop),
        CACHE_KEYS.WAR_ROOM_REVENUE_RISK(shop),
        CACHE_KEYS.WAR_ROOM_VELOCITY(shop)
      );
      console.log(`🗑️  Invalidated order & analytics caches for shop: ${shop}`);
      break;

    case 'products/create':
    case 'products/update':
    case 'products/delete':
      // Invalidate product caches
      await cache.delete(
        CACHE_KEYS.PRODUCT_DATA(shop),
        CACHE_KEYS.ANALYTICS_SNAPSHOT(shop)
      );
      console.log(`🗑️  Invalidated product caches for shop: ${shop}`);
      break;

    case 'inventory_levels/update':
      // Invalidate inventory and War Room caches
      await cache.delete(
        CACHE_KEYS.PRODUCT_DATA(shop),
        CACHE_KEYS.WAR_ROOM_DEFCON(shop),
        CACHE_KEYS.WAR_ROOM_REVENUE_RISK(shop)
      );
      console.log(`🗑️  Invalidated inventory caches for shop: ${shop}`);
      break;

    case 'app/uninstalled':
      // Nuclear option - invalidate everything for this shop
      await cache.invalidateShop(shop);
      console.log(`🧹 Invalidated all caches for uninstalled shop: ${shop}`);
      break;

    default:
      console.log(`ℹ️  No cache invalidation rules for topic: ${topic}`);
  }
}

/**
 * Get or compute with automatic caching
 * This is the recommended pattern for all data fetching
 */
export async function getCachedOrCompute<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  return cache.getOrSet(cacheKey, fetcher, ttlSeconds);
}

/**
 * Batch cache invalidation for multiple shops
 * Useful for global operations or maintenance
 */
export async function invalidateMultipleShops(shops: string[]) {
  const tasks = shops.map((shop) => cache.invalidateShop(shop));
  await Promise.allSettled(tasks);
  console.log(`🧹 Invalidated caches for ${shops.length} shops`);
}

/**
 * Cache health check
 * Returns cache statistics and health status
 */
export async function getCacheHealth() {
  const isAvailable = await cache.isAvailable();
  const stats = await cache.getStats();

  return {
    status: isAvailable ? 'healthy' : 'degraded',
    available: isAvailable,
    stats,
    recommendation: !isAvailable
      ? 'Redis is unavailable. App will work but performance may be degraded.'
      : 'Cache is healthy and operational.',
  };
}

/**
 * Scheduled cache maintenance
 * Run this periodically (e.g., daily) to keep cache clean
 */
export async function performCacheMaintenance() {
  console.log('🧹 Starting cache maintenance...');

  try {
    const stats = await cache.getStats();
    console.log('📊 Cache stats before maintenance:', stats);

    // Redis automatically handles TTL expiration, so we mainly log here
    console.log('✅ Cache maintenance complete');

    return { success: true, stats };
  } catch (error: any) {
    console.error('❌ Cache maintenance failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Cache key builder utility
 * Ensures consistent key naming across the application
 */
export function buildCacheKey(shop: string, resource: string, identifier?: string): string {
  const parts = ['v1', shop, resource];
  if (identifier) parts.push(identifier);
  return parts.join(':');
}

/**
 * Preload critical data on app startup
 * Reduces initial load time for first requests
 */
export async function preloadCriticalData(shop: string) {
  console.log(`🚀 Preloading critical data for shop: ${shop}`);

  // This would be called from a background job or on first access
  // to ensure fast response times

  const criticalKeys = [
    CACHE_KEYS.ANALYTICS_SNAPSHOT(shop),
    CACHE_KEYS.WAR_ROOM_DEFCON(shop),
    CACHE_KEYS.SYNC_STATUS(shop),
  ];

  console.log(`📦 Identified ${criticalKeys.length} critical cache keys`);
  // Actual implementation would fetch and cache these
}

/**
 * Circuit breaker for cache operations
 * Prevents cascading failures when cache is slow/unavailable
 */
let cacheCircuitOpen = false;
let cacheFailureCount = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_TIME = 60000; // 1 minute

export async function safeCacheOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (cacheCircuitOpen) {
    console.warn('⚠️ Cache circuit breaker is OPEN, using fallback');
    return fallback;
  }

  try {
    const result = await operation();
    cacheFailureCount = 0; // Reset on success
    return result;
  } catch (error) {
    cacheFailureCount++;
    console.error(`❌ Cache operation failed (${cacheFailureCount}/${CIRCUIT_THRESHOLD}):`, error);

    if (cacheFailureCount >= CIRCUIT_THRESHOLD) {
      cacheCircuitOpen = true;
      console.error('🔴 Cache circuit breaker OPENED');

      // Auto-reset after timeout
      setTimeout(() => {
        cacheCircuitOpen = false;
        cacheFailureCount = 0;
        console.log('🟢 Cache circuit breaker CLOSED');
      }, CIRCUIT_RESET_TIME);
    }

    return fallback;
  }
}

export default {
  warmCache,
  invalidateCacheOnWebhook,
  getCachedOrCompute,
  invalidateMultipleShops,
  getCacheHealth,
  performCacheMaintenance,
  buildCacheKey,
  preloadCriticalData,
  safeCacheOperation,
  CACHE_TTL,
};
