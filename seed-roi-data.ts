/**
 * Seed ROI Data
 *
 * Populates the database with sample executed actions and recommendations
 * to test the ROI dashboard functionality.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seedROIData() {
  const shop = "quickstart-12345678.myshopify.com"; // Default shop from Shopify CLI

  console.log("🌱 Seeding ROI data...");

  try {
    // Create some recommended actions first
    const recommendations = await Promise.all([
      // Transfer action - prevents stockout
      db.recommendedAction.create({
        data: {
          shop,
          type: "transfer",
          priority: 9,
          estimatedROI: 15000,
          confidence: 85,
          status: "completed",
          parameters: JSON.stringify({
            fromLocation: "Warehouse A",
            toLocation: "Store 1",
            sku: "HOT-ITEM-001",
            quantity: 50,
          }),
          reason: "High velocity item approaching stockout at Store 1. Transfer available inventory from Warehouse A.",
          urgency: "critical",
          sourceMetrics: JSON.stringify({
            currentStock: 12,
            burnRate: 8.5,
            coverageHours: 1.4,
          }),
        },
      }),

      // Reorder action - prevents stockout
      db.recommendedAction.create({
        data: {
          shop,
          type: "reorder",
          priority: 8,
          estimatedROI: 25000,
          confidence: 90,
          status: "completed",
          parameters: JSON.stringify({
            sku: "BEST-SELLER-002",
            quantity: 100,
            supplier: "Supplier XYZ",
            expedited: true,
          }),
          reason: "Best seller approaching stockout. Expedited reorder recommended.",
          urgency: "high",
          sourceMetrics: JSON.stringify({
            currentStock: 24,
            burnRate: 6.2,
            coverageHours: 3.9,
          }),
        },
      }),

      // Price adjustment - captures competitor overflow
      db.recommendedAction.create({
        data: {
          shop,
          type: "price_adjustment",
          priority: 7,
          estimatedROI: 8500,
          confidence: 75,
          status: "completed",
          parameters: JSON.stringify({
            sku: "TRENDING-003",
            currentPrice: 49.99,
            newPrice: 59.99,
            reason: "Competitor stockout detected. Increase price to capture premium demand.",
          }),
          reason: "Competitor out of stock. Opportunity to capture overflow demand with premium pricing.",
          urgency: "medium",
          sourceMetrics: JSON.stringify({
            competitorStock: 0,
            demandIncrease: 45,
          }),
        },
      }),

      // Traffic throttle - protects margin
      db.recommendedAction.create({
        data: {
          shop,
          type: "traffic_throttle",
          priority: 6,
          estimatedROI: 5000,
          confidence: 80,
          status: "completed",
          parameters: JSON.stringify({
            sku: "LIMITED-004",
            throttlePercentage: 30,
            reason: "Prevent overselling of limited inventory.",
          }),
          reason: "Limited inventory available. Throttle traffic to avoid overselling and expedited shipping costs.",
          urgency: "medium",
          sourceMetrics: JSON.stringify({
            currentStock: 35,
            demandRate: 12,
          }),
        },
      }),

      // Another transfer - recent
      db.recommendedAction.create({
        data: {
          shop,
          type: "transfer",
          priority: 8,
          estimatedROI: 12000,
          confidence: 88,
          status: "completed",
          parameters: JSON.stringify({
            fromLocation: "Store 2",
            toLocation: "Store 3",
            sku: "POPULAR-005",
            quantity: 30,
          }),
          reason: "Store 3 experiencing velocity spike. Transfer excess inventory from Store 2.",
          urgency: "high",
          sourceMetrics: JSON.stringify({
            currentStock: 8,
            burnRate: 4.2,
            coverageHours: 1.9,
          }),
        },
      }),
    ]);

    console.log(`✅ Created ${recommendations.length} recommendations`);

    // Create executed actions for each recommendation
    const now = new Date();
    const executedActions = await Promise.all([
      // Transfer action executed 2 hours ago
      db.executedAction.create({
        data: {
          shop,
          recommendationId: recommendations[0].id,
          executedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          executedBy: "merchant@example.com",
          result: "success",
          resultMessage: "Transfer completed successfully. Stock arrived just in time.",
          estimatedRevenue: 15000,
          actualRevenue: 16200, // Slightly better than estimated
          cost: 200, // Transfer cost
          netROI: 16000,
          metadata: JSON.stringify({
            stockoutsPrevented: 1,
            revenueSaved: 16200,
            customersSatisfied: 48,
          }),
        },
      }),

      // Reorder action executed 6 hours ago
      db.executedAction.create({
        data: {
          shop,
          recommendationId: recommendations[1].id,
          executedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          executedBy: "merchant@example.com",
          result: "success",
          resultMessage: "Expedited reorder arrived in 48 hours. Prevented weekend stockout.",
          estimatedRevenue: 25000,
          actualRevenue: 27500, // Better than expected
          cost: 2500, // Expedited shipping + product cost
          netROI: 25000,
          metadata: JSON.stringify({
            stockoutsPrevented: 1,
            revenueSaved: 27500,
            expeditedShippingAvoided: 5000,
          }),
        },
      }),

      // Price adjustment executed 12 hours ago
      db.executedAction.create({
        data: {
          shop,
          recommendationId: recommendations[2].id,
          executedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          executedBy: "merchant@example.com",
          result: "success",
          resultMessage: "Price increase captured competitor overflow demand.",
          estimatedRevenue: 8500,
          actualRevenue: 9200,
          cost: 0, // No cost for price change
          netROI: 9200,
          metadata: JSON.stringify({
            competitorOverflowCaptured: 9200,
            unitsSold: 154,
            avgMarginIncrease: 10,
          }),
        },
      }),

      // Traffic throttle executed 18 hours ago
      db.executedAction.create({
        data: {
          shop,
          recommendationId: recommendations[3].id,
          executedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
          executedBy: "merchant@example.com",
          result: "success",
          resultMessage: "Traffic throttling prevented overselling. Saved on expedited shipping costs.",
          estimatedRevenue: 5000,
          actualRevenue: 5800,
          cost: 0, // No direct cost
          netROI: 5800,
          metadata: JSON.stringify({
            oversellingPrevented: 15,
            expeditedShippingAvoided: 3000,
            marginProtected: 2800,
          }),
        },
      }),

      // Recent transfer executed 30 minutes ago
      db.executedAction.create({
        data: {
          shop,
          recommendationId: recommendations[4].id,
          executedAt: new Date(now.getTime() - 30 * 60 * 1000),
          executedBy: "merchant@example.com",
          result: "success",
          resultMessage: "Transfer in progress. Early indicators show positive impact.",
          estimatedRevenue: 12000,
          actualRevenue: 11500, // Slightly under estimated
          cost: 150,
          netROI: 11350,
          metadata: JSON.stringify({
            stockoutsPrevented: 1,
            revenueSaved: 11500,
          }),
        },
      }),
    ]);

    console.log(`✅ Created ${executedActions.length} executed actions`);

    // Calculate totals
    const totalRevenue = executedActions.reduce((sum, a) => sum + (a.actualRevenue || 0), 0);
    const totalCost = executedActions.reduce((sum, a) => sum + (a.cost || 0), 0);
    const totalNetROI = executedActions.reduce((sum, a) => sum + (a.netROI || 0), 0);

    console.log("\n📊 ROI Summary:");
    console.log(`   Total Revenue: $${totalRevenue.toLocaleString()}`);
    console.log(`   Total Cost: $${totalCost.toLocaleString()}`);
    console.log(`   Net ROI: $${totalNetROI.toLocaleString()}`);
    console.log(`   Actions Executed: ${executedActions.length}`);
    console.log(`   Average ROI per Action: $${(totalNetROI / executedActions.length).toLocaleString()}`);

    console.log("\n✅ ROI data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding ROI data:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

seedROIData();
