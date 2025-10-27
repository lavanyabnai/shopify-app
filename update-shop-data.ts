/**
 * Update Shop Data
 *
 * Updates all ROI data to use the correct shop from sessions
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function updateShopData() {
  try {
    // Get the actual shop from sessions
    const session = await db.session.findFirst({
      select: { shop: true },
    });

    if (!session) {
      console.log("⚠️  No sessions found. Cannot update shop data.");
      return;
    }

    const correctShop = session.shop;
    console.log(`📝 Updating all data to use shop: ${correctShop}`);

    // Update recommendations
    const recommendations = await db.recommendedAction.updateMany({
      where: { shop: { not: correctShop } },
      data: { shop: correctShop },
    });

    console.log(`✅ Updated ${recommendations.count} recommendations`);

    // Update executed actions
    const actions = await db.executedAction.updateMany({
      where: { shop: { not: correctShop } },
      data: { shop: correctShop },
    });

    console.log(`✅ Updated ${actions.count} executed actions`);

    // Verify
    const count = await db.executedAction.count({
      where: { shop: correctShop },
    });

    console.log(`\n✅ Shop now has ${count} executed actions`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

updateShopData();
