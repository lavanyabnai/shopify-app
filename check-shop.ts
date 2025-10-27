/**
 * Check Shop from Sessions
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function checkShop() {
  try {
    const sessions = await db.session.findMany({
      select: {
        shop: true,
      },
      take: 1,
    });

    if (sessions.length > 0) {
      console.log(`✅ Found shop: ${sessions[0].shop}`);
    } else {
      console.log("⚠️  No sessions found. Using default shop.");
    }

    const executedActions = await db.executedAction.findMany({
      select: {
        shop: true,
      },
      distinct: ['shop'],
    });

    console.log(`\nShops with executed actions: ${executedActions.map(a => a.shop).join(", ") || "none"}`);

    const count = await db.executedAction.count();
    console.log(`Total executed actions: ${count}`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await db.$disconnect();
  }
}

checkShop();
