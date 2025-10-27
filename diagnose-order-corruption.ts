/**
 * Diagnostic Script: Find Corrupted Order Records
 *
 * Checks Order table for data corruption issues
 */

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

console.log("🔍 Diagnosing Order Table Corruption\n");

async function diagnose() {
  try {
    // Test 1: Count total orders
    console.log("Test 1: Counting orders...");
    const totalCount = await db.order.count();
    console.log(`✅ Total orders: ${totalCount}\n`);

    // Test 2: Try to fetch orders with date filter (this is where it fails)
    console.log("Test 2: Fetching recent orders (last 7 days)...");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
      const recentOrders = await db.order.findMany({
        where: {
          shop: "control-tower-2.myshopify.com",
          createdAt: { gte: sevenDaysAgo },
        },
        take: 5,
      });
      console.log(`✅ Recent orders fetched: ${recentOrders.length}\n`);
    } catch (error: any) {
      console.log(`❌ Error fetching recent orders: ${error.message}\n`);

      // Test 3: Try without date filter
      console.log("Test 3: Fetching orders without date filter...");
      try {
        const ordersNoFilter = await db.order.findMany({
          where: { shop: "control-tower-2.myshopify.com" },
          take: 5,
        });
        console.log(`✅ Orders fetched without date filter: ${ordersNoFilter.length}\n`);

        // Show sample order
        if (ordersNoFilter.length > 0) {
          const sample = ordersNoFilter[0];
          console.log("Sample order:");
          console.log(`  ID: ${sample.id}`);
          console.log(`  Name: ${sample.name}`);
          console.log(`  Created: ${sample.createdAt}`);
          console.log(`  Processed: ${sample.processedAt}\n`);
        }
      } catch (error2: any) {
        console.log(`❌ Error even without date filter: ${error2.message}\n`);
      }
    }

    // Test 4: Try with raw SQL
    console.log("Test 4: Trying raw SQL query...");
    try {
      const rawOrders: any[] = await db.$queryRaw`
        SELECT id, name, shop, createdAt, processedAt
        FROM "Order"
        WHERE shop = 'control-tower-2.myshopify.com'
        LIMIT 5
      `;
      console.log(`✅ Raw SQL fetched: ${rawOrders.length} orders\n`);

      // Check for data issues
      rawOrders.forEach((order, index) => {
        console.log(`Order ${index + 1}:`);
        console.log(`  ID: ${order.id}`);
        console.log(`  Name: ${order.name}`);
        console.log(`  createdAt type: ${typeof order.createdAt}`);
        console.log(`  createdAt value: ${order.createdAt}`);
        console.log(`  processedAt type: ${typeof order.processedAt}`);
        console.log(`  processedAt value: ${order.processedAt}\n`);
      });
    } catch (error3: any) {
      console.log(`❌ Raw SQL error: ${error3.message}\n`);
    }

    // Test 5: Check for specific shop
    console.log("Test 5: Checking 'test-shop.myshopify.com' orders...");
    const testShopCount = await db.order.count({
      where: { shop: "test-shop.myshopify.com" },
    });
    console.log(`✅ test-shop orders: ${testShopCount}\n`);

    // Test 6: Check date range orders
    console.log("Test 6: Checking Oct 24 orders (BFCM day)...");
    const oct24Start = new Date("2025-10-24T00:00:00Z");
    const oct24End = new Date("2025-10-25T00:00:00Z");

    try {
      const oct24Count = await db.order.count({
        where: {
          shop: "control-tower-2.myshopify.com",
          createdAt: {
            gte: oct24Start,
            lt: oct24End,
          },
        },
      });
      console.log(`✅ Oct 24 orders: ${oct24Count}\n`);
    } catch (error4: any) {
      console.log(`❌ Error counting Oct 24 orders: ${error4.message}\n`);
    }

  } catch (error: any) {
    console.error("❌ Fatal error:", error.message);
  } finally {
    await db.$disconnect();
  }
}

diagnose();
