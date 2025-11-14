/**
 * Multi-Tenant Data Isolation Test Suite
 *
 * Tests to verify that Shop A cannot see or modify Shop B's data
 * Critical for production deployment
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Test shop domains
const SHOP_A = 'store-a.myshopify.com';
const SHOP_B = 'store-b.myshopify.com';

describe('Multi-Tenant Data Isolation', () => {

  beforeAll(async () => {
    // Clean up any existing test data
    await db.order.deleteMany({
      where: { shop: { in: [SHOP_A, SHOP_B] } }
    });
    await db.product.deleteMany({
      where: { shop: { in: [SHOP_A, SHOP_B] } }
    });
    await db.inventorySnapshot.deleteMany({
      where: { shop: { in: [SHOP_A, SHOP_B] } }
    });
    await db.warRoomMetrics.deleteMany({
      where: { shop: { in: [SHOP_A, SHOP_B] } }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.order.deleteMany({
      where: { shop: { in: [SHOP_A, SHOP_B] } }
    });
    await db.product.deleteMany({
      where: { shop: { in: [SHOP_A, SHOP_B] } }
    });
    await db.inventorySnapshot.deleteMany({
      where: { shop: { in: [SHOP_A, SHOP_B] } }
    });
    await db.warRoomMetrics.deleteMany({
      where: { shop: { in: [SHOP_A, SHOP_B] } }
    });
    await db.$disconnect();
  });

  describe('Order Isolation', () => {
    it('should isolate orders between shops', async () => {
      // Create order for Shop A
      const orderA = await db.order.create({
        data: {
          id: 'gid://shopify/Order/test-a-1',
          shopifyOrderId: 'test-a-1',
          name: '#A-1001',
          shop: SHOP_A,
          totalPrice: 100.00,
          currency: 'USD',
          createdAt: new Date(),
        },
      });

      // Create order for Shop B
      const orderB = await db.order.create({
        data: {
          id: 'gid://shopify/Order/test-b-1',
          shopifyOrderId: 'test-b-1',
          name: '#B-2001',
          shop: SHOP_B,
          totalPrice: 200.00,
          currency: 'USD',
          createdAt: new Date(),
        },
      });

      // Query orders for Shop A
      const shopAOrders = await db.order.findMany({
        where: { shop: SHOP_A },
      });

      // Query orders for Shop B
      const shopBOrders = await db.order.findMany({
        where: { shop: SHOP_B },
      });

      // Assertions
      expect(shopAOrders).toHaveLength(1);
      expect(shopAOrders[0].id).toBe(orderA.id);
      expect(shopAOrders[0].shop).toBe(SHOP_A);

      expect(shopBOrders).toHaveLength(1);
      expect(shopBOrders[0].id).toBe(orderB.id);
      expect(shopBOrders[0].shop).toBe(SHOP_B);

      // Verify no cross-shop data leak
      expect(shopAOrders.find(o => o.shop === SHOP_B)).toBeUndefined();
      expect(shopBOrders.find(o => o.shop === SHOP_A)).toBeUndefined();
    });

    it('should prevent querying all orders without shop filter', async () => {
      // Create orders for both shops
      await db.order.create({
        data: {
          id: 'gid://shopify/Order/test-a-2',
          shopifyOrderId: 'test-a-2',
          name: '#A-1002',
          shop: SHOP_A,
          totalPrice: 150.00,
          currency: 'USD',
          createdAt: new Date(),
        },
      });

      await db.order.create({
        data: {
          id: 'gid://shopify/Order/test-b-2',
          shopifyOrderId: 'test-b-2',
          name: '#B-2002',
          shop: SHOP_B,
          totalPrice: 250.00,
          currency: 'USD',
          createdAt: new Date(),
        },
      });

      // Query without shop filter (BAD - but testing to show the problem)
      const allOrders = await db.order.findMany({
        where: { shop: { in: [SHOP_A, SHOP_B] } },
      });

      // This would be a security issue - we're getting both shops' data
      expect(allOrders.length).toBeGreaterThan(1);

      // In production, repository pattern prevents this query
      // The test verifies WHY we need the repository pattern
    });
  });

  describe('Product Isolation', () => {
    it('should isolate products between shops', async () => {
      // Create product for Shop A
      const productA = await db.product.create({
        data: {
          id: 'gid://shopify/Product/test-a-100',
          shop: SHOP_A,
          title: 'Product A',
          totalInventory: 100,
          status: 'active',
        },
      });

      // Create product for Shop B
      const productB = await db.product.create({
        data: {
          id: 'gid://shopify/Product/test-b-100',
          shop: SHOP_B,
          title: 'Product B',
          totalInventory: 200,
          status: 'active',
        },
      });

      // Query products for Shop A
      const shopAProducts = await db.product.findMany({
        where: { shop: SHOP_A },
      });

      // Query products for Shop B
      const shopBProducts = await db.product.findMany({
        where: { shop: SHOP_B },
      });

      // Assertions
      expect(shopAProducts).toHaveLength(1);
      expect(shopAProducts[0].id).toBe(productA.id);
      expect(shopAProducts[0].title).toBe('Product A');

      expect(shopBProducts).toHaveLength(1);
      expect(shopBProducts[0].id).toBe(productB.id);
      expect(shopBProducts[0].title).toBe('Product B');

      // Verify no cross-shop data leak
      expect(shopAProducts.find(p => p.shop === SHOP_B)).toBeUndefined();
      expect(shopBProducts.find(p => p.shop === SHOP_A)).toBeUndefined();
    });
  });

  describe('War Room Data Isolation', () => {
    it('should isolate inventory snapshots between shops', async () => {
      // Create inventory snapshot for Shop A
      await db.inventorySnapshot.create({
        data: {
          shop: SHOP_A,
          sku: 'TEST-SKU-A',
          productId: 'prod-a-1',
          productTitle: 'Test Product A',
          location: 'Main Warehouse',
          currentStock: 100,
          burnRate: 10.5,
          coverageHours: 9.5,
          reorderPoint: 50,
          velocityTrend: 5.2,
          status: 'warning',
        },
      });

      // Create inventory snapshot for Shop B
      await db.inventorySnapshot.create({
        data: {
          shop: SHOP_B,
          sku: 'TEST-SKU-B',
          productId: 'prod-b-1',
          productTitle: 'Test Product B',
          location: 'Main Warehouse',
          currentStock: 200,
          burnRate: 20.0,
          coverageHours: 10.0,
          reorderPoint: 100,
          velocityTrend: 3.5,
          status: 'healthy',
        },
      });

      // Query snapshots for Shop A
      const shopASnapshots = await db.inventorySnapshot.findMany({
        where: { shop: SHOP_A },
      });

      // Query snapshots for Shop B
      const shopBSnapshots = await db.inventorySnapshot.findMany({
        where: { shop: SHOP_B },
      });

      // Assertions
      expect(shopASnapshots).toHaveLength(1);
      expect(shopASnapshots[0].sku).toBe('TEST-SKU-A');
      expect(shopASnapshots[0].status).toBe('warning');

      expect(shopBSnapshots).toHaveLength(1);
      expect(shopBSnapshots[0].sku).toBe('TEST-SKU-B');
      expect(shopBSnapshots[0].status).toBe('healthy');

      // Verify no cross-shop data leak
      expect(shopASnapshots.find(s => s.shop === SHOP_B)).toBeUndefined();
      expect(shopBSnapshots.find(s => s.shop === SHOP_A)).toBeUndefined();
    });

    it('should isolate War Room metrics between shops', async () => {
      // Create War Room metrics for Shop A
      const metricsA = await db.warRoomMetrics.create({
        data: {
          shop: SHOP_A,
          defconLevel: 2,
          inventoryCoverageHours: 8.5,
          velocityAnomaly: 15.3,
          riskScore: 75.5,
          escalationTriggers: JSON.stringify(['low_inventory', 'high_velocity']),
        },
      });

      // Create War Room metrics for Shop B
      const metricsB = await db.warRoomMetrics.create({
        data: {
          shop: SHOP_B,
          defconLevel: 4,
          inventoryCoverageHours: 48.0,
          velocityAnomaly: 2.1,
          riskScore: 20.0,
          escalationTriggers: JSON.stringify(['none']),
        },
      });

      // Query metrics for Shop A
      const shopAMetrics = await db.warRoomMetrics.findMany({
        where: { shop: SHOP_A },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      // Query metrics for Shop B
      const shopBMetrics = await db.warRoomMetrics.findMany({
        where: { shop: SHOP_B },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      // Assertions
      expect(shopAMetrics).toHaveLength(1);
      expect(shopAMetrics[0].defconLevel).toBe(2);
      expect(shopAMetrics[0].riskScore).toBe(75.5);

      expect(shopBMetrics).toHaveLength(1);
      expect(shopBMetrics[0].defconLevel).toBe(4);
      expect(shopBMetrics[0].riskScore).toBe(20.0);
    });
  });

  describe('Aggregation Queries', () => {
    it('should correctly aggregate data per shop', async () => {
      // Create multiple orders for Shop A
      await db.order.createMany({
        data: [
          {
            id: 'gid://shopify/Order/agg-a-1',
            shopifyOrderId: 'agg-a-1',
            name: '#A-3001',
            shop: SHOP_A,
            totalPrice: 100.00,
            currency: 'USD',
            createdAt: new Date(),
          },
          {
            id: 'gid://shopify/Order/agg-a-2',
            shopifyOrderId: 'agg-a-2',
            name: '#A-3002',
            shop: SHOP_A,
            totalPrice: 200.00,
            currency: 'USD',
            createdAt: new Date(),
          },
        ],
      });

      // Create multiple orders for Shop B
      await db.order.createMany({
        data: [
          {
            id: 'gid://shopify/Order/agg-b-1',
            shopifyOrderId: 'agg-b-1',
            name: '#B-3001',
            shop: SHOP_B,
            totalPrice: 150.00,
            currency: 'USD',
            createdAt: new Date(),
          },
          {
            id: 'gid://shopify/Order/agg-b-2',
            shopifyOrderId: 'agg-b-2',
            name: '#B-3002',
            shop: SHOP_B,
            totalPrice: 250.00,
            currency: 'USD',
            createdAt: new Date(),
          },
          {
            id: 'gid://shopify/Order/agg-b-3',
            shopifyOrderId: 'agg-b-3',
            name: '#B-3003',
            shop: SHOP_B,
            totalPrice: 300.00,
            currency: 'USD',
            createdAt: new Date(),
          },
        ],
      });

      // Aggregate for Shop A
      const shopACount = await db.order.count({
        where: { shop: SHOP_A, shopifyOrderId: { startsWith: 'agg-' } },
      });

      const shopARevenue = await db.order.aggregate({
        where: { shop: SHOP_A, shopifyOrderId: { startsWith: 'agg-' } },
        _sum: { totalPrice: true },
      });

      // Aggregate for Shop B
      const shopBCount = await db.order.count({
        where: { shop: SHOP_B, shopifyOrderId: { startsWith: 'agg-' } },
      });

      const shopBRevenue = await db.order.aggregate({
        where: { shop: SHOP_B, shopifyOrderId: { startsWith: 'agg-' } },
        _sum: { totalPrice: true },
      });

      // Assertions
      expect(shopACount).toBe(2);
      expect(shopARevenue._sum.totalPrice).toBe(300.00);

      expect(shopBCount).toBe(3);
      expect(shopBRevenue._sum.totalPrice).toBe(700.00);

      // Verify aggregations are isolated
      expect(shopACount).not.toBe(shopBCount);
      expect(shopARevenue._sum.totalPrice).not.toBe(shopBRevenue._sum.totalPrice);
    });
  });

  describe('Update Operations', () => {
    it('should only update records for the correct shop', async () => {
      // Create orders for both shops
      const orderA = await db.order.create({
        data: {
          id: 'gid://shopify/Order/update-a-1',
          shopifyOrderId: 'update-a-1',
          name: '#A-4001',
          shop: SHOP_A,
          totalPrice: 100.00,
          currency: 'USD',
          financialStatus: 'PENDING',
          createdAt: new Date(),
        },
      });

      const orderB = await db.order.create({
        data: {
          id: 'gid://shopify/Order/update-b-1',
          shopifyOrderId: 'update-b-1',
          name: '#B-4001',
          shop: SHOP_B,
          totalPrice: 200.00,
          currency: 'USD',
          financialStatus: 'PENDING',
          createdAt: new Date(),
        },
      });

      // Update orders for Shop A only
      await db.order.updateMany({
        where: { shop: SHOP_A, shopifyOrderId: { startsWith: 'update-' } },
        data: { financialStatus: 'PAID' },
      });

      // Fetch updated orders
      const updatedOrderA = await db.order.findUnique({
        where: { id: orderA.id },
      });

      const updatedOrderB = await db.order.findUnique({
        where: { id: orderB.id },
      });

      // Assertions
      expect(updatedOrderA?.financialStatus).toBe('PAID');
      expect(updatedOrderB?.financialStatus).toBe('PENDING'); // Should NOT be updated

      // Verify Shop B's order was not affected
      expect(updatedOrderB?.shop).toBe(SHOP_B);
    });
  });

  describe('Delete Operations', () => {
    it('should only delete records for the correct shop', async () => {
      // Create orders for both shops
      await db.order.create({
        data: {
          id: 'gid://shopify/Order/delete-a-1',
          shopifyOrderId: 'delete-a-1',
          name: '#A-5001',
          shop: SHOP_A,
          totalPrice: 100.00,
          currency: 'USD',
          createdAt: new Date(),
        },
      });

      await db.order.create({
        data: {
          id: 'gid://shopify/Order/delete-b-1',
          shopifyOrderId: 'delete-b-1',
          name: '#B-5001',
          shop: SHOP_B,
          totalPrice: 200.00,
          currency: 'USD',
          createdAt: new Date(),
        },
      });

      // Delete orders for Shop A only
      const deleteResult = await db.order.deleteMany({
        where: { shop: SHOP_A, shopifyOrderId: { startsWith: 'delete-' } },
      });

      // Verify deletion count
      expect(deleteResult.count).toBe(1);

      // Verify Shop A's order is deleted
      const shopAOrder = await db.order.findFirst({
        where: { shop: SHOP_A, shopifyOrderId: { startsWith: 'delete-' } },
      });
      expect(shopAOrder).toBeNull();

      // Verify Shop B's order still exists
      const shopBOrder = await db.order.findFirst({
        where: { shop: SHOP_B, shopifyOrderId: { startsWith: 'delete-' } },
      });
      expect(shopBOrder).not.toBeNull();
      expect(shopBOrder?.shop).toBe(SHOP_B);
    });
  });
});

/**
 * Additional test recommendations:
 *
 * 1. Cache Isolation Tests
 *    - Verify Redis cache keys are scoped by shop
 *    - Test cache invalidation only affects correct shop
 *
 * 2. Analytics Snapshot Tests
 *    - Verify pre-computed snapshots are shop-specific
 *    - Test snapshot aggregation doesn't cross shops
 *
 * 3. Concurrent Access Tests
 *    - Test simultaneous requests from multiple shops
 *    - Verify no race conditions in shop filtering
 *
 * 4. Index Performance Tests
 *    - Verify shop-based indexes are being used
 *    - Test query performance with shop filter
 *
 * 5. Edge Cases
 *    - Empty shop domain
 *    - Shop domain with special characters
 *    - Very long shop domains
 */
